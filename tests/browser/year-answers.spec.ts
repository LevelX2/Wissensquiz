import { writeStoredState } from "./fixtures";
import { test, expect, readStoredState } from "./fixtures";
import { readFileSync } from "node:fs";
import { emptyState, type State } from "../../src/model";
import { addPackages, packages } from "../../src/packages";
import { prepareFactQuestion } from "../../src/filmFacts";
import { startRound } from "../../src/engine";
import { validateBackup } from "../../src/backupValidation";

const catalog = emptyState();
addPackages(
  catalog,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  })),
);
for (const kind of ["generated", "csv"] as const) {
  for (const rank of [0, 3, "historical"] as const) {
    test(`${kind}: ${rank} Jahresrang bleibt bei Antwort, Neuladen und Online-Fortsetzen erhalten`, async ({
      page,
      context,
      browserName,
    }) => {
      await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
      await page.setViewportSize({ width: 320, height: 740 });
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: "Losspielen" }),
      ).toBeEnabled();
      const state = structuredClone(catalog);
      const q = state.questions.find((q) =>
        kind === "generated"
          ? q.id === "FF-001-YEAR"
          : q.id === "FAN-202610-P01-S-021",
      )!;
      let first = true,
        seed = 20261003;
      const variant =
        rank === "historical"
          ? structuredClone(q)
          : prepareFactQuestion(q, undefined, () => {
              if (first) {
                first = false;
                return (rank + 0.5) / 4;
              }
              seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
              return seed / 4294967296;
            });
      const pool = state.questions;
      state.questions = [q];
      const round = startRound(
        state,
        { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
        Date.parse("2026-10-03T11:59:00+02:00"),
      );
      state.questions = pool;
      round.questions = [variant];
      round.order = [variant.answers.map((a) => a.id).reverse()];
      const correct = variant.answers.find((a) => a.id === variant.correctId)!;
      if (rank !== "historical")
        expect(
          variant.answers.filter((a) => Number(a.text) < Number(correct.text)),
        ).toHaveLength(rank);
      validateBackup(state);
      await writeStoredState(page, state);
      await page.reload();
      await page.getByRole("button", { name: "Fortsetzen" }).click();
      const buttons = page.locator(".answer:not(.answer-unknown)");
      await expect(buttons).toHaveCount(4);
      expect(
        (await buttons.locator("span:nth-child(2)").allTextContents()).sort(),
      ).toEqual(variant.answers.map((a) => a.text).sort());
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await buttons.filter({ hasText: correct.text }).click();
      await expect(page.locator(".answer.correct")).toBeVisible();
      await page.clock.fastForward(1100);
      await expect(page.locator(".feedback")).toBeVisible();
      await page.getByRole("button", { name: "Pause & Startseite" }).click();
      await page.getByRole("button", { name: "Profil", exact: true }).click();
      await page.getByRole("button", { name: "Optionen" }).click();
      await page.reload();
      await page.getByRole("button", { name: "Fortsetzen" }).click();
      await expect(page.locator(".feedback")).toBeVisible();
      const saved = validateBackup(await readStoredState(page));
      expect(saved.rounds.find((r) => r.id === round.id)!.questions[0]).toEqual(
        variant,
      );
      expect(saved.events).toHaveLength(1);
      expect(saved.events[0].correct).toBe(true);
      expect(saved.learning[q.knowledgeId].seen).toBe(1);
    });
  }
}

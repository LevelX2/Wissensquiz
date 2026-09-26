import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { emptyState } from "../../src/model";
import { importCsv } from "../../src/importer";
import { startRound } from "../../src/engine";

async function visibleAction(page: Page) {
  const button = page.locator(".feedback-actions .primary");
  await expect(button).toBeEnabled();
  await expect(button).toBeInViewport({ ratio: 1 });
  const box = (await button.boundingBox())!;
  expect(
    await button.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return el.contains(
        document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2),
      );
    }),
  ).toBe(true);
  return box;
}

for (const viewport of [
  { width: 390, height: 664 },
  { width: 320, height: 568 },
]) {
  test(`Mobile Antwortansicht ${viewport.width}: Weiter ohne Scrollen, Details und Abschluss erreichbar`, async ({
    page,
  }, info) => {
    await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const questions = importCsv(
      readFileSync("public/western-fragen.csv", "utf8"),
    ).questions;
    const qs = questions
      .filter((q) => q.difficulty === "leicht" && q.context && q.anchor)
      .sort(
        (a, b) =>
          a.question.length +
          a.explanation.length +
          a.anchor.length -
          (b.question.length + b.explanation.length + b.anchor.length),
      )
      .slice(0, 3);
    const state = emptyState(questions);
    const round = startRound(state, {
      mode: "entdecken",
      topic: "Alle Themen",
      difficulty: "leicht",
    });
    round.questions = qs;
    round.order = qs.map((q) => q.answers.map((a) => a.id));
    await page.evaluate(
      (value) =>
        new Promise<void>((resolve, reject) => {
          const req = indexedDB.open("wissensquiz");
          req.onsuccess = () => {
            const db = req.result,
              tx = db.transaction("state", "readwrite");
            tx.objectStore("state").put(value, "current");
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
        }),
      state,
    );
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      await expect(page.locator(".question-card h1")).toHaveAttribute(
        "data-question-id",
        q.id,
      );
      const selected = q.answers.find((a) =>
        i === 1 ? a.id !== q.correctId : a.id === q.correctId,
      )!;
      await page.locator(".answer").filter({ hasText: selected.text }).click();
      await expect(page.locator(".chosen-answer")).toContainText(selected.text);
      await expect(page.locator(".feedback")).toBeFocused();
      await expect(page.locator(".answer-review")).not.toHaveAttribute("open");
      await visibleAction(page);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (i === 0) {
        await page.screenshot({
          path: `test-results/antwort-${info.project.name}-${viewport.width}.png`,
        });
        expect(
          (
            await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa"])
              .analyze()
          ).violations,
        ).toEqual([]);
        await page
          .getByRole("button", { name: "War geraten", exact: true })
          .click();
        await expect(
          page.getByRole("button", { name: "Als geraten markiert" }),
        ).toBeDisabled();
        await visibleAction(page);
        await page.getByText("Alle Antworten ansehen", { exact: true }).click();
        await expect(page.locator(".answer")).toHaveCount(4);
        await expect(page.locator(".answer.correct")).toBeVisible();
        await visibleAction(page);
        await page
          .getByText("Etwas tiefer eintauchen", { exact: true })
          .click();
        await expect(page.getByText(q.context, { exact: true })).toBeVisible();
        // Even after scrolling through expanded content, the action stays available.
        await visibleAction(page);
      }
      const box = await visibleAction(page);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await expect(page.locator(".result")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Profil", exact: true }),
    ).toBeVisible();
  });
}

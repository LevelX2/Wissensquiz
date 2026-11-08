import { familiarityOf, workFamiliarityOf } from "../../src/familiarity";
import { prepareQuestionWorks } from "../../src/prepareWorkReferences";
import { writeStoredState, fixCalendarTime } from "./fixtures";
import { learningPathProgress } from "../../src/learningPath";
import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { emptyState } from "../../src/model";
import { addPackages, packages } from "../../src/packages";
import { answer, complete, guess, startRound } from "../../src/engine";

const full = emptyState();
addPackages(
  full,
  packages.map((pkg) => ({
    filename: pkg.filename,
    text: readFileSync(pkg.path, "utf8"),
  })),
);
const questions = prepareQuestionWorks(full.questions);
const goals = (difficulty: string) => [
  ...new Map(
    questions
      .filter(
        (q) =>
          q.works?.some(
            (work) => work.type === "film" && work.genres.includes("Horror"),
          ) &&
          q.difficulty === difficulty,
      )
      .map((q) => [q.knowledgeId, q]),
  ).values(),
];

for (const scenario of [
  "mittel",
  "schwer",
  "beide",
  "geraten",
  "filmgruppe",
] as const) {
  test(`Freischaltung ${scenario}: Feier nur bei neuem Erfolg, respektiert Einstellungen und bleibt einmalig`, async ({
    page,
    context,
  }, testInfo) => {
    await fixCalendarTime(page, new Date("2026-10-11T12:00:00+02:00"));
    const quiet = scenario === "beide";
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({
      reducedMotion: quiet ? "reduce" : "no-preference",
    });
    await page.addInitScript(() => {
      const counters = { tones: 0, vibrations: [] as (number | number[])[] };
      Object.assign(window, { unlockTest: counters });
      const create = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () {
        counters.tones++;
        return create.call(this);
      };
      Object.defineProperty(navigator, "vibrate", {
        configurable: true,
        value: (p: number | number[]) => {
          counters.vibrations.push(p);
          return true;
        },
      });
    });
    const stageGoals = (d: string) =>
      goals(d).filter(
        (q) =>
          scenario !== "filmgruppe" ||
          q.works?.some(
            (work) =>
              work.type === "film" &&
              work.genres.includes("Horror") &&
              workFamiliarityOf(work) === 1,
          ),
      );
    const state = emptyState(questions);
    state.settings = {
      ...state.settings,
      allDifficulties: true,
      sound: !quiet,
      haptics: !quiet,
    };
    const target = learningPathProgress(state)("Horror");
    const easyTarget =
      scenario === "filmgruppe" ? target.groups[0].target : target.easyTarget;
    state.journey = {
      version: 1,
      earned: {
        Horror: {
          difficulty: 0,
          familiarity: scenario === "filmgruppe" ? 1 : 4,
        },
      },
    };
    const historyQuestions = [
      ...stageGoals("leicht").slice(
        0,
        scenario === "schwer" ? easyTarget : easyTarget - 1,
      ),
      ...stageGoals("mittel").slice(
        0,
        scenario === "beide"
          ? target.mediumTarget
          : scenario === "schwer"
            ? target.mediumTarget - 1
            : 0,
      ),
    ];

    // Eight-question setup rounds keep the current catalog's final answer away
    // from the separate 50-round achievement and its stronger success signal.
    const historyBatchSize = 8;
    for (let i = 0; i < historyQuestions.length; i += historyBatchSize) {
      const history = startRound(
        state,
        { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
        1700000000000 + i * 100,
      );
      history.questions = historyQuestions.slice(i, i + historyBatchSize);
      history.order = history.questions.map((q) => q.answers.map((a) => a.id));
      history.familiaritySnapshot = Object.fromEntries(
        history.questions.map((q) => [q.id, familiarityOf(q)!]),
      );
      for (const q of history.questions)
        answer(
          state,
          history.id,
          q.id,
          q.correctId,
          1000,
          1700000001000 + i * 100,
        );
      complete(state, history.id, 1700000002000 + i * 100);
    }
    const current = startRound(
      state,
      { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1700000100000,
    );
    const q = stageGoals(scenario === "schwer" ? "mittel" : "leicht")[
      (scenario === "schwer" ? target.mediumTarget : easyTarget) - 1
    ];
    current.questions = [q];
    current.order = [q.answers.map((a) => a.id)];
    current.familiaritySnapshot = { [q.id]: familiarityOf(q)! };
    if (scenario === "geraten") {
      answer(state, current.id, q.id, q.correctId, 1000, 1700000101000);
      guess(state, current.events[0]);
    }
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
    await writeStoredState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    const beforeAnswer = await page.evaluate(
      () =>
        (window as unknown as { unlockTest: { tones: number } }).unlockTest
          .tones,
    );
    if (scenario !== "geraten")
      await page
        .locator(".answer")
        .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
        .click();
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    const dialog = page.getByRole("dialog");
    if (scenario === "geraten") {
      await expect(
        page.getByRole("heading", { name: "Eine Runde weiter." }),
      ).toBeVisible();
      await expect(dialog).toHaveCount(0);
      return;
    }
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-reward-kind="unlock"]')).toHaveCount(
      quiet ? 2 : 1,
    );
    await expect(dialog).toContainText("Horror");
    if (scenario === "filmgruppe")
      await expect(dialog).toContainText("Bekanntheitsgruppe 2 freigeschaltet");
    await expect(dialog.locator("#unlock-description")).toContainText(
      "Dein Rundenergebnis wartet auf Dich.",
    );
    await expect(dialog.locator(".success-rewards")).toContainText(
      scenario === "filmgruppe"
        ? "Horror · Bekannt"
        : scenario === "schwer"
          ? "Schwer"
          : "Mittel",
    );
    await expect(
      dialog.getByRole("button", { name: "Weiter zum Ergebnis" }),
    ).toBeFocused();
    await expect
      .poll(() =>
        page.evaluate(
          (initial) =>
            (window as unknown as { unlockTest: { tones: number } }).unlockTest
              .tones - initial,
          beforeAnswer,
        ),
      )
      .toBe(quiet ? 0 : 5);
    const counters = await page.evaluate(
      () =>
        (
          window as unknown as {
            unlockTest: { tones: number; vibrations: (number | number[])[] };
          }
        ).unlockTest,
    );
    expect(counters.tones - beforeAnswer).toBe(quiet ? 0 : 5); // Two answer notes plus three bronze notes; one combined success signal.
    if (quiet) {
      expect(counters.vibrations.filter((p) => p !== 0)).toEqual([]);
      await expect(dialog.locator(".firework").first()).not.toBeVisible();
    } else expect(counters.vibrations).toContainEqual([25, 50, 35]);
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    if (scenario === "mittel") {
      await expect
        .poll(() =>
          dialog.evaluate((el) => el.getAnimations({ subtree: true }).length),
        )
        .toBeGreaterThan(0);
      await expect
        .poll(() => dialog.evaluate((el) => getComputedStyle(el).opacity))
        .toBe("1");
      await expect(dialog.locator('[data-motif="unlock"]')).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("freischaltung-320.png"),
      });
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
    if (quiet) await page.keyboard.press("Escape");
    else
      await dialog.getByRole("button", { name: "Weiter zum Ergebnis" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Eine Runde weiter." }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Sammlung", exact: true }).click();
    await expect(page.locator(".history article").first()).toBeVisible();
    await expect(page.locator(".history button")).toHaveCount(0);
    await expect(dialog).toHaveCount(0);
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { unlockTest: { tones: number } }).unlockTest
            .tones,
      ),
    ).toBe(counters.tones + (quiet ? 0 : 2)); // Two neutral navigation clicks, no replay of the fanfare.
    await page.reload();
    await expect(dialog).toHaveCount(0);
  });
}

import { writeStoredState } from "./fixtures";
import { modePreparation, openRoundSetup, test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
import { emptyState, type Mode, type Question } from "../../src/model";
import { answer, complete, guess, startRound } from "../../src/engine";

for (const mode of ["entdecken", "ueben"] as Mode[]) {
  test(`${mode}: Fragenstatistik zählt Antworten und Varianten, bleibt nach Neuladen korrekt`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    const questions = importCsv(
      readFileSync("public/fragen.csv", "utf8"),
    ).questions;
    const variant = questions.find((q) => q.metadata.variant_of)!;
    const q = questions.find((q) => q.id === variant.metadata.variant_of)!;
    const state = emptyState(questions);
    delete state.settings.questionHistory; // Old saves use the new default too.
    let now = Date.parse("2026-09-25T12:00:00+02:00");
    const roundFor = (question: Question, mode: Mode) => {
      const r = startRound(
        state,
        { mode, topic: "Alle Themen", difficulty: "Alle Stufen" },
        now,
      );
      r.questions = [question];
      r.order = [question.answers.map((a) => a.id)];
      return r;
    };
    for (const [question, kind] of [
      [q, "correct"],
      [q, "wrong"],
      [q, "guessed"],
      [q, "timeout"],
      [variant, "correct"],
    ] as const) {
      const r = roundFor(question, "rekord");
      answer(
        state,
        r.id,
        question.id,
        kind === "timeout"
          ? null
          : kind === "wrong"
            ? question.answers.find((a) => a.id !== question.correctId)!.id
            : question.correctId,
        kind === "timeout" ? 30000 : 1000,
        now + 31000,
      );
      if (kind === "guessed") guess(state, r.events[0]);
      complete(state, r.id, now + 32000);
      now += 60000;
    }
    roundFor(q, mode);
    await writeStoredState(page, state);
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    const stats = page.locator(".question-history");
    await expect(stats).toHaveCount(0);
    const changeDisplay = async (value: string) => {
      await page.getByRole("button", { name: "Pause & Startseite" }).click();
      await page.getByRole("button", { name: "Profil", exact: true }).click();
      await page.getByRole("button", { name: "Optionen" }).click();
      const selection = page.getByLabel("Fragenstatistik im Lernmodus");
      await selection.selectOption(value);
      await expect(selection).toBeEnabled();
      await page.reload();
      await page.getByRole("button", { name: "Profil", exact: true }).click();
      await page.getByRole("button", { name: "Optionen" }).click();
      await expect(selection).toHaveValue(value);
      await page.getByRole("button", { name: "Spielen", exact: true }).click();
      await page.getByRole("button", { name: "Fortsetzen" }).click();
    };
    await changeDisplay("always");
    await expect(stats.locator("summary")).toContainText(
      "Diese Frage: 3× beantwortet",
    );
    await expect(stats.locator("summary")).toContainText(
      "2 richtig · 1 falsch",
    );
    await stats.locator("summary").click();
    await expect(stats).toContainText("Ohne Antwort (Zeit abgelaufen): 1");
    await expect(stats.locator(".goal-history")).toContainText(
      "4× beantwortet · 3 richtig · 1 falsch · 1 ohne Antwort",
    );
    await expect(stats.locator(".goal-history")).toContainText(
      "Als geraten markierte richtige Antworten: 1",
    );
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
        .violations,
    ).toEqual([]);
    await stats.locator("summary").click();
    await page.screenshot({
      path: `test-results/fragenstatistik-${mode}-320.png`,
    });
    const wrong = q.answers.find((a) => a.id !== q.correctId)!;
    await changeDisplay("after");
    await expect(stats).toHaveCount(0);
    await page.locator(".answer").filter({ hasText: wrong.text }).click();
    await expect(stats.locator("summary")).toContainText("4× beantwortet");
    await expect(stats.locator("summary")).toContainText(
      "2 richtig · 2 falsch",
    );
    await page.reload();
    await page.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(stats.locator("summary")).toContainText("4× beantwortet");
    await expect(
      page.getByRole("button", { name: "Runde abschließen" }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await changeDisplay("hidden");
    await expect(stats).toHaveCount(0);
    await changeDisplay("always");
    await expect(stats.locator("summary")).toContainText("4× beantwortet");
    await page.getByRole("button", { name: "Runde abschließen" }).click();
    await page.getByRole("button", { name: "Spielen", exact: true }).click();
    await openRoundSetup(page);
    await page.getByRole("button", { name: "Auf Zeit", exact: true }).click();
    await openRoundSetup(page);
    await modePreparation(page, /^10 Fragen 30 Sekunden/).click();
    await page.getByRole("button", { name: "Losspielen" }).click();
    await expect(stats).toHaveCount(0);
  });
}

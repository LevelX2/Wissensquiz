import { writeStoredState } from "./fixtures";

import { test, expect, readStoredState, type Page } from "./fixtures";
import { startRound } from "../../src/engine";
import type { Question } from "../../src/model";

// Server questions add presentation snapshots and generate year distractors.
// Compare catalog content and the correct answer independently of those fields.
const catalogSnapshot = (questions: Question[]) =>
  questions.map(({ answers, presentation: _presentation, ...question }) => ({
    ...question,
    correctAnswer: answers.find((a) => a.id === question.correctId)!.text,
  }));

async function prepareQuestion(page: Page, id: string) {
  const state = await readStoredState(page);
  const catalog = state.questions;
  state.questions = [catalog.find((q) => q.id === id)!];
  startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    Date.parse("2026-10-08T12:00:00+02:00"),
  );
  state.questions = catalog;
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
}

test("unterscheidet den frühen Erststart von einem späteren Länderstart und zeigt Jahresdaten erst nach der Antwort", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-08T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await prepareQuestion(page, "G100-20261008-ABENTEUER-019-Y");
  await expect(page.locator(".question-card h1")).not.toContainText("1986");
  await expect(page.locator(".film-data")).toHaveCount(0);
  await page.getByRole("button", { name: "Keine Ahnung", exact: true }).click();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("1986");
  await expect(page.locator(".film-data")).toContainText("1987");
});

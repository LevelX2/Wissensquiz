import {
  test,
  expect,
  accountBackend,
  writeStoredState,
  type Page,
} from "./fixtures";
import { emptyState } from "../../src/model";
import { startRound } from "../../src/engine";

async function prepare(page: Page, questionId: string) {
  await page.clock.install({ time: new Date("2026-10-10T12:00:00Z") });
  await page.route("**/film-posters.json", (route) =>
    route.fulfill({ json: {} }),
  );
  const pool = accountBackend(page).release.questions;
  const q = pool.find((entry) => entry.id === questionId)!;
  expect(q).toBeDefined();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const state = emptyState([q]);
  state.settings.sound = false;
  state.settings.solutionDisplay = "question";
  state.settings.answerRevealMs = 500;
  startRound(state, {
    mode: "ueben",
    topic: q.topic,
    difficulty: "Alle Stufen",
  });
  state.questions = pool;
  await writeStoredState(page, state);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  return q;
}

test("Tron: leerer Zusatz zum Motorradhelm entfällt direkt, nach Neuladen und im Rückblick", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const q = await prepare(page, "SF-202609-P02-S-064");
  await page
    .locator(".answer")
    .filter({ hasText: "Sein Motorradhelm" })
    .click();
  await expect(page.locator(".explanation")).toBeVisible();
  await expect(page.locator(".specific-feedback")).toHaveCount(0);
  await expect(page.locator(".explanation > p")).toHaveText([q.explanation]);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await expect(page.locator(".specific-feedback")).toHaveCount(0);
  await page.getByRole("button", { name: "Runde abschließen" }).click();
  await page.locator(".review > details > summary").click();
  await expect(page.locator(".explanation")).toBeVisible();
  await expect(page.locator(".specific-feedback")).toHaveCount(0);
});

test("konkrete Einordnung einer verwechselten Figur bleibt erhalten", async ({
  page,
}) => {
  const q = await prepare(page, "MAR-S-025");
  const answer = q.answers.find((entry) => entry.text === "O'Hara")!;
  await page.locator(".answer").filter({ hasText: answer.text }).click();
  await expect(page.locator(".specific-feedback")).toHaveText(answer.feedback);
  await page.getByRole("button", { name: "Runde abschließen" }).click();
  await page.locator(".review > details > summary").click();
  await expect(page.locator(".specific-feedback")).toHaveText(answer.feedback);
});

import { test, expect, accountBackend, writeStoredState } from "./fixtures";
import { emptyState } from "../../src/model";
import { answer, complete, startRound } from "../../src/engine";
import { validateBackup } from "../../src/backupValidation";
import AxeBuilder from "@axe-core/playwright";

const now = new Date("2026-10-10T12:00:00Z");
test("Neu steht vor der Antwort neben dem Genre und bleibt bei der ersten Lösung stabil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.clock.install({ time: now });
  await page.route("**/film-posters.json", (route) =>
    route.fulfill({ status: 404 }),
  );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const pool = accountBackend(page).release.questions;
  const q = pool.find(
    (q) =>
      q.metadata.film_title_original === "Dune" &&
      q.metadata.film_year === "2021",
  )!;
  const state = emptyState([q]);
  state.settings.sound = false;
  state.settings.questionHistory = "hidden";
  state.settings.answerRevealMs = 500;
  startRound(
    state,
    { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
    now.getTime(),
  );
  state.questions = pool;
  await writeStoredState(page, validateBackup(state));
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  const badge = page.locator(".question-hints .question-status");
  await expect(badge).toHaveText("Neu");
  await expect(page.locator(".question-genre")).toBeVisible();
  await expect(page.locator(".question-history")).toHaveCount(0);
  await expect(page.locator(".feedback")).toHaveCount(0);
  expect(
    (
      await new AxeBuilder({ page })
        .include(".question-heading")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".question-heading")
    .screenshot({ path: "test-results/frage-neu-320.png" });
  await page
    .locator(".answer")
    .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
    .click();
  await expect(page.locator(".feedback-outcome")).toContainText("Richtig");
  await expect(badge).toHaveText("Neu");
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(badge).toHaveText("Neu");
});

test("Wiederholungszahl zählt frühere Versuche; eigener Schalter bleibt nach Neuladen gespeichert", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.clock.install({ time: now });
  await page.route("**/film-posters.json", (route) =>
    route.fulfill({ status: 404 }),
  );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const pool = accountBackend(page).release.questions;
  const q = pool.find(
    (q) =>
      q.metadata.film_title_original === "Dune" &&
      q.metadata.film_year === "2021",
  )!;
  const state = emptyState([q]);
  state.settings.sound = false;
  state.settings.questionHistory = "hidden";
  state.settings.answerRevealMs = 500;
  for (const [i, choice] of [
    q.answers.find((a) => a.id !== q.correctId)!.id,
    null,
  ].entries()) {
    const at = now.getTime() - 86400000 + i * 60000;
    const r = startRound(
      state,
      { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
      at,
    );
    answer(state, r.id, q.id, choice, 1000, at + 1000);
    complete(state, r.id, at + 2000);
  }
  startRound(
    state,
    { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
    now.getTime(),
  );
  state.questions = pool;
  await writeStoredState(page, validateBackup(state));
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  const badge = page.locator(".question-status");
  await expect(badge).toHaveText("Wiederholung · 2×");
  await expect(page.locator(".question-history")).toHaveCount(0);
  const options = async () => {
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Optionen" }).click();
  };
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await options();
  const toggle = page.getByRole("checkbox", {
    name: "Neu / Wiederholung anzeigen",
  });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(toggle).toBeEnabled();
  await page.reload();
  await options();
  await expect(toggle).not.toBeChecked();
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(badge).toHaveCount(0);
  await expect(page.locator(".question-genre")).toBeVisible();
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await options();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(toggle).toBeEnabled();
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(badge).toHaveText("Wiederholung · 2×");
  await page
    .locator(".question-heading")
    .screenshot({ path: "test-results/frage-wiederholung-320.png" });
  await page
    .locator(".answer")
    .filter({ hasText: q.answers.find((a) => a.id === q.correctId)!.text })
    .click();
  await expect(page.locator(".feedback-outcome")).toContainText("Richtig");
  await expect(badge).toHaveText("Wiederholung · 2×");
});

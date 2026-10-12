import { openRoundSetup, test, expect, readStoredState } from "./fixtures";
import { familiarityOf } from "../../src/familiarity";

test("Musik startet mit Film-Ikonen; Filmdaten alter und neuer Filme bleiben nach Neuladen erhalten", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-09-27T12:00:00+02:00") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await page
    .getByRole("button", { name: "Alle Genres abwählen", exact: true })
    .click();
  await openRoundSetup(page);
  await page
    .getByRole("group", { name: "Filmgenres", exact: true })
    .getByLabel("Musik", { exact: true })
    .check();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-genre")).toHaveAccessibleName("Musik");
  await expect(page.locator(".question-difficulty")).toHaveText(
    "Schwierigkeit: Leicht",
  );
  await expect(page.locator(".film-data")).toHaveCount(0);
  const saved = await readStoredState(page);
  expect(
    saved.questions.filter((q: any) => q.metadata.subdomain === "Musik"),
  ).toHaveLength(853);
  expect(saved.imports).toHaveLength(0);
  const round = saved.rounds.at(-1)!,
    q = round.questions[0];
  expect(round.questions.map(familiarityOf)).toEqual(
    Array(round.questions.length).fill(1),
  );
  const correct = q.answers.find((a: any) => a.id === q.correctId)!.text;
  await page.locator(".answer").filter({ hasText: correct }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText("1 · Film-Ikonen");
  await expect(page.locator(".film-data")).toContainText("Regie");
  await expect(page.locator(".film-data")).toContainText(
    q.metadata.film_title_original,
  );
  await page.screenshot({ path: "test-results/musik-filmdaten-390.png" });
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data > summary").click();
  await expect(page.locator(".film-data")).toContainText(
    q.metadata.film_title_original,
  );
});

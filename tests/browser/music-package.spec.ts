import { test, expect } from "@playwright/test";

test("Musik startet mit neuen Film-Ikonen; Filmdaten und Paket bleiben offline erhalten", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-09-27T12:00:00+02:00") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page
    .getByRole("button", { name: "Alle Genres abwählen", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Filmgenres", exact: true })
    .getByLabel("Musik", { exact: true })
    .check();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-genre")).toHaveText("Musik");
  await expect(page.locator(".question-difficulty")).toHaveText(
    "Schwierigkeit: Leicht",
  );
  await expect(page.locator(".film-data")).toHaveCount(0);
  const saved = await page.evaluate(
    () =>
      new Promise<any>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const r = db.transaction("state").objectStore("state").get("current");
          r.onsuccess = () => {
            db.close();
            resolve(r.result);
          };
        };
      }),
  );
  expect(
    saved.questions.filter((q: any) => q.metadata.subdomain === "Musik"),
  ).toHaveLength(238);
  expect(
    saved.imports.find(
      (r: any) => r.filename === "Musik_Ergaenzung_180_Fragen.csv",
    ).accepted,
  ).toBe(180);
  const round = saved.rounds.at(-1),
    q = round.questions[0];
  expect(Object.values(round.familiaritySnapshot)).toEqual(
    Array(round.questions.length).fill(1),
  );
  expect(q.id.startsWith("MUS-")).toBe(true);
  const correct = q.answers.find((a: any) => a.id === q.correctId).text;
  await page.locator(".answer").filter({ hasText: correct }).click();
  await page.locator(".film-data summary").click();
  await expect(page.locator(".film-data")).toContainText("1 · Film-Ikonen");
  await expect(page.locator(".film-data")).toContainText("Regie");
  await expect(page.locator(".film-data")).toContainText(
    q.metadata.film_title_original,
  );
  await page.screenshot({ path: "test-results/musik-filmdaten-390.png" });
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".explanation")).toBeVisible();
  await page.locator(".film-data summary").click();
  await expect(page.locator(".film-data")).toContainText(
    q.metadata.film_title_original,
  );
});

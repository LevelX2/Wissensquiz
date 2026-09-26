import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("kompakter Spieleinstieg, automatische Stufen und Classics bleiben kombinierbar", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  const start = page.getByRole("button", { name: "Losspielen" });
  await expect(start).toBeEnabled();
  await expect(page.locator(".mode-artwork")).toHaveCount(3);
  for (const img of await page.locator(".mode-artwork").all())
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  await expect(page.locator(".cinema-home")).toHaveCSS(
    "background-image",
    /cinema\/lobby\.png/,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "test-results/kinostart-desktop.png" });
  await page.setViewportSize({ width: 320, height: 740 });
  const startBox = (await start.boundingBox())!;
  expect(startBox.y + startBox.height).toBeLessThan(600);
  await expect(page.locator(".hero")).toHaveCount(0);
  await expect(
    page.getByLabel("Alle Schwierigkeitsstufen freigeben"),
  ).not.toBeVisible();
  await expect(
    page.getByRole("group", { name: "Schwierigkeitsstufen", exact: true }),
  ).toHaveCount(0);
  const widths = await page
    .locator(".genre-options .filter-choice")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
  await page.screenshot({ path: "test-results/spieleinstieg-320.png" });
  await page.getByText("Deine Stufenfortschritte", { exact: true }).click();
  await expect(page.locator(".path-progress .genre-thumbnail")).toHaveCount(12);
  await expect(page.locator(".path-progress .genre-icon")).toHaveCount(0);
  await page.getByText("Schwierigkeit selbst wählen", { exact: true }).click();
  await page.getByLabel("Alle Schwierigkeitsstufen freigeben").click();
  await expect(
    page.getByLabel("Alle Schwierigkeitsstufen freigeben"),
  ).toBeChecked();
  const levels = page.getByRole("group", {
    name: "Schwierigkeitsstufen",
    exact: true,
  });
  await levels.getByLabel("Leicht", { exact: true }).uncheck();
  await levels.getByLabel("Mittel", { exact: true }).uncheck();
  await expect(page.locator("#round-summary")).toContainText(
    "Freie Auswahl: Schwer",
  );
  await page.getByLabel("Alle Schwierigkeitsstufen freigeben").click();
  await expect(
    page.getByLabel("Alle Schwierigkeitsstufen freigeben"),
  ).not.toBeChecked();
  await expect(start).toBeEnabled();
  await expect(levels).toHaveCount(0);
  await expect(page.locator("#round-summary")).toContainText("Lernpfad");
  await page
    .getByRole("button", { name: "Alle Genres abwählen", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Filmgenres", exact: true })
    .getByLabel("Western", { exact: true })
    .check();
  await page.getByLabel("Nur Classics", { exact: true }).check();
  await expect(page.locator("#round-summary")).toContainText("Western");
  await expect(page.locator("#round-summary")).toContainText("Classics");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await start.click();
  await expect(page.locator(".question-difficulty")).toHaveText(
    "Schwierigkeit: Leicht",
  );
  const stored = await page.evaluate(
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
  expect(stored.rounds.at(-1).topic).toBe("Classics");
  expect(
    stored.rounds
      .at(-1)
      .questions.every(
        (q: any) =>
          q.tags.includes("Classics") && q.metadata.subdomain === "Western",
      ),
  ).toBe(true);
  expect(stored.questions).toHaveLength(1980);
  expect(new Set(stored.questions.map((q: any) => q.id)).size).toBe(1980);
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  for (const img of await page.locator(".mode-artwork").all())
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  expect(
    await page.evaluate(async () => {
      const image = new Image();
      image.src = "/cinema/lobby.png";
      await image.decode();
      return image.naturalWidth;
    }),
  ).toBeGreaterThan(0);
  await expect(page.getByLabel("Nur Classics", { exact: true })).toBeVisible();
  await page.getByLabel("Nur Classics", { exact: true }).check();
  await page.getByText("Deine Stufenfortschritte", { exact: true }).click();
  const images = page.locator(".path-progress .genre-thumbnail");
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await page
    .locator(".learning-path")
    .screenshot({ path: "test-results/stufenfortschritte-320.png" });
});

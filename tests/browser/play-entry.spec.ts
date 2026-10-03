import { readSavedState } from "./saved-state";
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
  await expect(page.locator(".mode-artwork")).toHaveCount(4);
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
  const guide = page.locator(".round-guide");
  const more = guide.locator("summary");
  await expect(guide).toContainText("bevorzugt neue Fragen");
  await expect(guide.locator(".round-guide-details")).not.toBeVisible();
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(
    guide.getByText("Deine Auswahl:", { exact: true }),
  ).toBeVisible();
  await expect(guide).toContainText(
    "Als geraten markierte Treffer zählen dafür nicht",
  );
  await expect(guide).toContainText("höchstens eine dieser Fragen");
  await page.screenshot({ path: "test-results/rundenhinweis-320.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Enter");
  await expect(guide.locator(".round-guide-details")).not.toBeVisible();
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
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await expect(guide).toContainText("zufällige Fragen ohne Zeitdruck");
  await more.click();
  await expect(
    guide.getByText("Zufällige Fragen:", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Rekordrunde 30 Sekunden/ }).click();
  await expect(guide.locator(".round-guide-details")).not.toBeVisible();
  await expect(guide).toContainText("Pro Frage hast Du 30 Sekunden");
  await more.click();
  await expect(
    guide.getByText("Die Uhr läuft beim Tabwechsel weiter.", { exact: true }),
  ).toBeVisible();
  await expect(guide).toContainText("Neuladen beendet die Rekordrunde");
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await expect(guide.locator(".round-guide-details")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const levels = page.getByRole("group", {
    name: "Schwierigkeitsstufen",
    exact: true,
  });
  await levels.getByLabel("Leicht", { exact: true }).uncheck();
  await levels.getByLabel("Mittel", { exact: true }).uncheck();
  await levels.getByLabel("Experte", { exact: true }).uncheck();
  await expect(page.locator("#round-summary")).toContainText(
    "Freie Auswahl: Schwer",
  );
  await page.getByRole("button", { name: /Filmreise Filmwelten/ }).click();
  await expect(
    page.getByRole("button", { name: /Filmreise Filmwelten/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(start).toBeEnabled();
  await expect(levels).toHaveCount(0);
  await expect(page.locator("#round-summary")).toContainText("Filmreise");
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
  const stored = await readSavedState(page);
  expect(stored.rounds.at(-1)!.topic).toBe("Classics");
  expect(
    stored.rounds
      .at(-1)!
      .questions.every(
        (q: any) =>
          q.tags.includes("Classics") && q.metadata.subdomain === "Western",
      ),
  ).toBe(true);
  expect(stored.questions).toHaveLength(4877);
  expect(new Set(stored.questions.map((q: any) => q.id)).size).toBe(4877);
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

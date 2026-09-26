import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Highscores haben einen eigenen Platz; Optionen und verständliche Hilfe sind im Profil erreichbar", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await expect(
    page.getByLabel("Alle Schwierigkeitsstufen freigeben"),
  ).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Optionen" })).toHaveCount(0);
  await expect(page.getByRole("navigation").getByRole("button")).toHaveCount(5);
  await page.getByLabel("Alle Schwierigkeitsstufen freigeben").click();
  await expect(
    page.getByLabel("Alle Schwierigkeitsstufen freigeben"),
  ).toBeChecked();
  await page.reload();
  await expect(
    page.getByLabel("Alle Schwierigkeitsstufen freigeben"),
  ).toBeChecked();
  const levels = page.getByRole("group", {
    name: "Schwierigkeitsstufen",
    exact: true,
  });
  await levels.getByLabel("Leicht", { exact: true }).uncheck();
  await levels.getByLabel("Mittel", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-difficulty")).toHaveText(
    "Schwierigkeit: Schwer",
  );
  await expect(page.getByRole("button", { name: "Optionen" })).toHaveCount(0);
  await expect(page.getByRole("navigation")).not.toBeVisible();
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Highscores", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/highscores-navigation-320.png" });
  await page
    .getByRole("button", { name: "Spielerleistungen", exact: true })
    .click();
  await expect(page.getByText(/Melde Dich/)).toBeVisible();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(page.getByLabel("Soundeffekte", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Die App-Dateien sind im Offline-Cache bestätigt.", {
      exact: false,
    }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Zurück zum Profil" }).click();
  await page
    .locator("main")
    .getByRole("button", { name: "So funktioniert’s" })
    .click();
  await expect(
    page.getByRole("heading", { name: "So funktioniert’s" }),
  ).toBeVisible();
  await expect(page.getByText(/nach elf Tagen/)).toBeVisible();
  await page
    .getByText("Wie schalte ich Mittel und Schwer frei?", { exact: true })
    .click();
  await expect(page.getByText(/Entfernst Du das Häkchen/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: "test-results/hilfe-navigation-320.png" });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page
    .locator("main")
    .getByRole("button", { name: "So funktioniert’s" })
    .click();
  await expect(page.getByText(/nach elf Tagen/)).toBeVisible();
});

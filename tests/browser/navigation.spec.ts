import { modePreparation, openRoundSetup, test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test("Highscores haben einen eigenen Platz; Optionen und verständliche Hilfe sind im Profil erreichbar", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-02T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await expect(modePreparation(page, /Filmreise Filmwelten/)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Optionen" })).toHaveCount(0);
  await expect(page.getByRole("navigation").getByRole("button")).toHaveCount(5);
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Lernen", exact: true }).click();
  await openRoundSetup(page);
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await openRoundSetup(page);
  await expect(
    modePreparation(page, /Freies Spiel Alle Stufen/),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Alle Genres auswählen" }),
  ).toBeEnabled();
  await page.reload();
  await openRoundSetup(page);
  await expect(
    modePreparation(page, /Freies Spiel Alle Stufen/),
  ).toHaveAttribute("aria-pressed", "true");
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
  await page.getByRole("button", { name: "Duelle", exact: true }).click();
  await expect(page.getByText(/Melde Dich/)).toBeVisible();
  await page.getByRole("button", { name: "Im Profil anmelden" }).click();
  await expect(
    page.getByRole("heading", { name: "Anmelden", exact: true }),
  ).toBeVisible();
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
    .getByText("Wie öffne ich neue Schwierigkeiten und Filmgruppen?", {
      exact: true,
    })
    .click();
  await expect(
    page.getByText(
      /Die Schwierigkeit und die Filmgruppen entwickeln sich getrennt/,
    ),
  ).toBeVisible();
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

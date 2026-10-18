import {
  modePreparation,
  openRoundSetup,
  test,
  expect,
  fixCalendarTime,
} from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test("Ungültige Themenantwort zeigt einen Fehler und kann ohne Appabsturz erneut geladen werden", async ({
  page,
}) => {
  await fixCalendarTime(page, new Date("2026-10-18T10:00:00Z"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  let invalid = true;
  await page.route("**/rpc/quiz_game_view", async (route) => {
    if (
      invalid &&
      JSON.parse(route.request().postDataJSON().request_text).action === "areas"
    ) {
      await route.fulfill({
        json: [{ topic: "Test", learning: { percent: "unbekannt" } }],
      });
    } else await route.fallback();
  });
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Serverübersicht");
  await expect(page.locator(".topic-card")).toHaveCount(0);
  invalid = false;
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(page.locator(".topic-card")).toHaveCount(16);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("Highscores haben einen eigenen Platz; Optionen und verständliche Hilfe sind im Profil erreichbar", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-02T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await expect(modePreparation(page, /Filmreise Neues lernen/)).toHaveAttribute(
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
  await expect(
    page.getByText("Noch keine abgeschlossenen Duelle in dieser Auswahl."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(page.getByLabel("Soundeffekte", { exact: true })).toBeVisible();
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
    .getByText("Welcher Spielmodus passt zu mir?", { exact: true })
    .click();
  await expect(
    page.getByText(/Lernrunden umfassen von Anfang an bis zu zehn Fragen/),
  ).toBeVisible();
  await expect(page.getByText(/zunächst bis zu fünf/)).toHaveCount(0);
  await page
    .getByText("Wie öffne ich neue Schwierigkeiten und Bekanntheitsgruppen?", {
      exact: true,
    })
    .click();
  await expect(
    page.getByText(
      /Die Schwierigkeit und die Bekanntheitsgruppen entwickeln sich getrennt/,
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
  await page.reload();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page
    .locator("main")
    .getByRole("button", { name: "So funktioniert’s" })
    .click();
  await expect(page.getByText(/nach elf Tagen/)).toBeVisible();
});

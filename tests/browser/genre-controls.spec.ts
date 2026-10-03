import { openRoundSetup, test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test("Genres gesammelt abwählen und Filmkarten mit Genreillustrationen anzeigen", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  const genres = page.getByRole("group", { name: "Filmgenres", exact: true });
  await expect(genres.locator(".genre-thumbnail")).toHaveCount(12);
  await genres
    .getByRole("button", { name: "Alle Genres abwählen", exact: true })
    .click();
  await expect(genres.locator("input:checked")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeDisabled();
  await genres.getByLabel("Horror", { exact: true }).check();
  await expect(genres.locator("input:checked")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  for (const img of await genres.locator(".genre-thumbnail").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await genres.screenshot({ path: "test-results/genre-auswahl-320.png" });
  await genres
    .getByRole("button", { name: "Alle Genres auswählen", exact: true })
    .click();
  await expect(genres.locator("input:checked")).toHaveCount(12);
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  // Locate a Horror card through its genre label; film labels differ between packages.
  const horror = page
    .locator(".topic-card")
    .filter({ has: page.getByRole("img", { name: "Horror", exact: true }) })
    .first();
  await horror.scrollIntoViewIfNeeded();
  await expect(horror.locator(".genre-illustration")).toHaveAttribute(
    "src",
    "/genres/horror.png",
  );
  await expect
    .poll(() =>
      horror
        .locator("img")
        .evaluate((el) => (el as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await horror.screenshot({ path: "test-results/sammlung-genre-320.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});

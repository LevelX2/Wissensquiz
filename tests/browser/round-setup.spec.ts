import { test, expect } from "@playwright/test";

test("Rundenauswahl bleibt vor dem Spielen gespeichert, auch leere Auswahl und manuelle Stufen", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-27T12:00:00+02:00") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await expect(page.getByLabel("Thema wählen")).toHaveCount(0);
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await page.getByRole("button", { name: "Alle Genres abwählen" }).click();
  const genres = page.getByRole("group", { name: "Filmgenres", exact: true });
  await genres.getByLabel("Horror", { exact: true }).check();
  await page.getByLabel("Nur Classics", { exact: true }).check();
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await expect(
    page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const levels = page.getByRole("group", {
    name: "Schwierigkeitsstufen",
    exact: true,
  });
  await levels.getByLabel("Leicht", { exact: true }).uncheck();
  await levels.getByLabel("Mittel", { exact: true }).uncheck();
  const fame = page.getByRole("group", {
    name: "Bekanntheit der Filme",
    exact: true,
  });
  await fame.getByLabel("2 · Bekannte Filme", { exact: true }).uncheck();
  await fame.getByLabel("4 · Entdeckungen", { exact: true }).uncheck();
  await expect(
    page.getByRole("button", { name: "Alle Genres auswählen" }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(genres.locator("input:checked")).toHaveCount(1);
  await expect(genres.getByLabel("Horror", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Nur Classics", { exact: true })).toBeChecked();
  await expect(levels.getByLabel("Schwer", { exact: true })).toBeChecked();
  await expect(levels.locator("input:checked")).toHaveCount(1);
  await expect(fame.locator("input:checked")).toHaveCount(2);
  await page.getByRole("button", { name: /Filmreise Filmwelten/ }).click();
  await expect(
    page.getByRole("button", { name: /Filmreise Filmwelten/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Alle Genres auswählen" }),
  ).toBeEnabled();
  await page.reload();
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await expect(
    page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(levels.locator("input:checked")).toHaveCount(1);
  await expect(fame.locator("input:checked")).toHaveCount(2);
  await levels.getByLabel("Schwer", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Alle Genres abwählen" }).click();
  await expect(
    page.getByRole("button", { name: "Alle Genres auswählen" }),
  ).toBeEnabled();
  await page.reload();
  await expect(genres.locator("input:checked")).toHaveCount(0);
  await expect(levels.locator("input:checked")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeDisabled();
  await page.getByRole("button", { name: "Alle Genres auswählen" }).click();
  await page.getByRole("button", { name: "Alle Stufen auswählen" }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Favorit|Thema spielen/ }),
  ).toHaveCount(0);
});

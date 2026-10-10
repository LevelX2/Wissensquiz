import { test, expect, readStoredState } from "./fixtures";
import { catalogCounts } from "../catalog-counts";
test("Online-Katalog und bestätigte Antworten bleiben nach Neuladen erhalten; kein Spielstand im Browser", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  const saved = await readStoredState(page);
  expect(saved.questions).toHaveLength(catalogCounts.questions);
  expect(saved.events).toHaveLength(1);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await expect(page.locator(".feedback")).toBeVisible();
  expect(await readStoredState(page)).toEqual(saved);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});

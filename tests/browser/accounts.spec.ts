import { test, expect, accountBackend, fixCalendarTime } from "./fixtures";
test.use({ autoLogin: false });
test.beforeEach(async ({ page }) => {
  await fixCalendarTime(page, new Date("2026-10-10T10:00:00Z"));
});
test("der Einstieg bietet eine Proberunde; Kontospiele bleiben ausschließlich online", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Eine Runde ausprobieren" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Anmelden", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Losspielen" })).toHaveCount(0);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  expect(accountBackend(page).api.calls).toHaveLength(0);
  await page.getByLabel("E-Mail-Adresse").fill("quiz@example.test");
  await page
    .getByLabel("Passwort", { exact: true })
    .fill("synthetisches-passwort");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await expect(
    page.getByText("Vorhandenen Gastspielstand übernehmen", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/Rückfallkopien/)).toHaveCount(0);
  await page.getByText("Konto & Speicherung", { exact: true }).click();
  await page.getByRole("button", { name: "Abmelden", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Eine Runde ausprobieren" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Losspielen" })).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Eine Runde ausprobieren" }),
  ).toBeVisible();
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
});
test("nicht bestätigte Anmeldung gibt kein Spiel frei", async ({ page }) => {
  await page.route("**/auth/v1/user", async (route) => {
    // A synthetic, unconfirmed user; never request a real account.
    await route.fulfill({
      json: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "quiz@example.test",
        aud: "authenticated",
        role: "authenticated",
        email_confirmed_at: null,
        app_metadata: {},
        user_metadata: {},
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await page.getByLabel("E-Mail-Adresse").fill("quiz@example.test");
  await page
    .getByLabel("Passwort", { exact: true })
    .fill("synthetisches-passwort");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(
    page.getByText(/bestätige.*E-Mail|E-Mail.*bestätig/i).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Losspielen" })).toHaveCount(0);
  expect(accountBackend(page).api.calls).toHaveLength(0);
});
test("Kontodienstfehler bietet erneutes Laden der Anmeldung", async ({
  page,
}) => {
  let failed = true;
  await page.route("**/account-config.json", (r) =>
    failed ? r.abort("failed") : r.fallback(),
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Kontodienst erneut laden" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Losspielen" })).toHaveCount(0);
  failed = false;
  await page.getByRole("button", { name: "Kontodienst erneut laden" }).click();
  await expect(
    page.getByRole("heading", { name: "Anmelden", exact: true }),
  ).toBeVisible();
});

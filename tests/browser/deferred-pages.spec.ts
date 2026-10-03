import { test, expect, openRoundSetup, readStoredState } from "./fixtures";

test("alle Nebenansichten öffnen nach Offlinevorbereitung auch ohne vorherigen Besuch", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration?.active || !navigator.serviceWorker.controller)
          return false;
        const cache = await caches.open(
          (await caches.keys()).find((k) => k.startsWith("film-"))!,
        );
        return (await cache.keys()).some((r) => /Help-.*\.js$/.test(r.url));
      }),
    )
    .toBe(true);
  const before = await readStoredState(page);
  await context.setOffline(true);
  for (const name of ["Themen", "Sammlung", "Highscores", "Profil"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".main-content")).not.toContainText(
      "Diese Ansicht konnte nicht geladen werden.",
    );
    if (name === "Themen")
      await expect(page.locator(".topic-card")).toHaveCount(16);
    if (name === "Sammlung")
      await expect(
        page.getByRole("heading", { name: "Deine Sammlung." }),
      ).toBeVisible();
    if (name === "Highscores")
      await expect(
        page.getByRole("heading", { name: "Highscores", exact: true }),
      ).toBeVisible();
  }
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(page.getByLabel("Soundeffekte", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page
    .locator(".profile-tools")
    .getByRole("button", { name: "So funktioniert’s" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".main-content")).not.toContainText(
    "Diese Ansicht konnte nicht geladen werden.",
  );
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Duell", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Duell/, level: 1 }),
  ).toBeVisible();
  expect(await readStoredState(page)).toEqual(before);
});

test("fehlgeschlagene Nebenansicht zeigt eine Wiederherstellung und lässt Navigation zu", async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const { isolateAccountService, testBaseUrl } = await import("./fixtures");
  await isolateAccountService(context);
  await context.route(/\/assets\/Help-[^/]+\.js$/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(testBaseUrl);
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const before = await readStoredState(page);
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page
    .locator(".profile-tools")
    .getByRole("button", { name: "So funktioniert’s" })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Diese Ansicht konnte nicht geladen werden.",
  );
  await expect(
    page.getByRole("button", { name: "App neu laden" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect(await readStoredState(page)).toEqual(before);
  await context.unroute(/\/assets\/Help-[^/]+\.js$/);
  await page
    .locator("footer")
    .getByRole("button", { name: "So funktioniert’s" })
    .click();
  await page.getByRole("button", { name: "App neu laden" }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page
    .locator("footer")
    .getByRole("button", { name: "So funktioniert’s" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "App neu laden" })).toHaveCount(
    0,
  );
  expect(await readStoredState(page)).toEqual(before);
  await context.close();
});

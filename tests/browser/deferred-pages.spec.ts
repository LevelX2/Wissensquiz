import { test, expect, openRoundSetup, readStoredState } from "./fixtures";

test("fehlgeschlagener Spielimport wird von der äußeren Fehlergrenze aufgefangen", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-18T10:00:00Z") });
  let blocked = true;
  await page.route(/\/assets\/AccountGame-[^/]+\.js$/, async (route) => {
    if (blocked) await route.abort();
    else await route.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Das Quiz konnte nicht angezeigt werden.",
  );
  blocked = false;
  await page.getByRole("button", { name: "App neu laden" }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect((await readStoredState(page)).events).toEqual([]);
});

test("äußere Fehlergrenze schützt den Apprahmen und lädt bestätigten Stand erneut", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-18T10:00:00Z") });
  await page.addInitScript(() => {
    if (sessionStorage.getItem("review-render-failure")) return;
    sessionStorage.setItem("review-render-failure", "tested");
    Number.prototype.toLocaleString = function () {
      throw new Error("Synthetic render failure in the career header");
    };
  });
  await page.goto("/");
  const recovery = page.getByRole("alert");
  await expect(recovery).toContainText(
    "Das Quiz konnte nicht angezeigt werden.",
  );
  await expect(recovery).toContainText(
    "Bereits online bestätigter Fortschritt",
  );
  await expect(recovery).not.toContainText("lokal gespeichert");
  await page.getByRole("button", { name: "App neu laden" }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect((await readStoredState(page)).events).toEqual([]);
});

test("alle Nebenansichten öffnen ohne vorherigen Besuch", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const before = await readStoredState(page);
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
  await page.getByRole("button", { name: /^Duell Drei Runden/ }).click();
  await page.getByRole("button", { name: "Duell wählen" }).click();
  await expect(
    page.getByRole("heading", { name: /Duell/, level: 1 }),
  ).toBeVisible();
  expect(await readStoredState(page)).toEqual({
    ...before,
    settings: { ...before.settings, playGroup: "duel" },
  });
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

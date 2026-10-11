import {
  test,
  expect,
  accountBackend,
  fixCalendarTime,
  openRoundSetup,
} from "./fixtures";
test("zeigt aktuelle 50-Prozent-Schwellen ohne Clientkatalog", async ({
  page,
}) => {
  await fixCalendarTime(page, new Date("2026-10-11T12:00:00+02:00"));
  await page.goto("/");
  await openRoundSetup(page);
  await page.getByText("Deine Stufenfortschritte", { exact: true }).click();
  await expect(
    page.getByRole("progressbar", {
      name: "Abenteuer: Fortschritt zu Mittel",
      exact: true,
    }),
  ).toHaveAttribute("max", "102");
  await expect(
    page.getByRole("progressbar", {
      name: "Abenteuer: Fortschritt zu Schwer",
      exact: true,
    }),
  ).toHaveAttribute("max", "194");
  expect(
    (
      await accountBackend(page).admin(() =>
        accountBackend(page).db.query<{ n: number }>(
          "select count(*)::int n from quiz_game_internal.catalog_meta",
        ),
      )
    ).rows[0].n,
  ).toBeGreaterThan(12000);
});

test("lädt keinen Katalog, setzt eine Serverrunde fort und speichert zehn Antworten", async ({
  page,
}) => {
  await fixCalendarTime(page, new Date("2026-10-11T12:00:00+02:00"));
  const catalogs: string[] = [];
  page.on("request", (r) => {
    if (/\.csv(?:\?|$)|quiz_sync_catalog|\/catalogs\//.test(r.url()))
      catalogs.push(r.url());
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(
    page.getByRole("button", { name: "Keine Ahnung", exact: true }),
  ).toBeEnabled();
  const backend = accountBackend(page);
  const count = await backend.admin(() =>
    backend.db.query<{ n: number }>(
      "select count(*)::integer n from quiz_game_internal.questions",
    ),
  );
  expect(count.rows[0].n).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  for (let i = 0; i < 10; i++) {
    await page
      .getByRole("button", { name: "Keine Ahnung", exact: true })
      .click();
    const next = page.getByRole("button", {
      name: i === 9 ? /Runde abschließen/ : /Nächste Frage/,
    });
    await expect(next).toBeEnabled();
    await next.click();
  }
  await expect(page.locator(".result")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const totals = await backend.admin(() =>
    backend.db.query<{ n: number }>(
      "select count(*)::integer n from public.quiz_sync_entries e join public.quiz_account_heads h on h.owner_id=e.owner_id and h.generation=e.generation where kind='event' and not deleted",
    ),
  );
  expect(totals.rows[0].n).toBe(10);
  expect(catalogs).toEqual([]);
  await page.getByRole("button", { name: "Themen", exact: true }).click();
  await expect(page.locator(".topic-card").first()).toBeVisible();
  await page.getByRole("button", { name: "Sammlung", exact: true }).click();
  await expect(page.locator(".topic-card").first()).toBeVisible();
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await expect(
    page.getByRole("button", { name: /Alles als JSON sichern/ }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Sicherung auswählen")).toHaveCount(0);
  await page.getByLabel("Zum Bestätigen LÖSCHEN eingeben").fill("LÖSCHEN");
  await page
    .getByRole("button", { name: "Fortschritt jetzt endgültig zurücksetzen" })
    .click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const resetCount = await backend.admin(() =>
    backend.db.query<{ n: number }>(
      "select count(*)::integer n from public.quiz_sync_entries e join public.quiz_account_heads h on h.owner_id=e.owner_id and h.generation=e.generation where kind='event' and not deleted",
    ),
  );
  expect(resetCount.rows[0].n).toBe(0);
  expect(catalogs).toEqual([]);
  expect(
    await page.evaluate(() => ({
      indexedDB: typeof indexedDB,
      local: localStorage.getItem("wissensquiz-state"),
    })),
  ).toMatchObject({ local: null });
});

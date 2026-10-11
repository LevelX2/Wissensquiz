import { readFile } from "node:fs/promises";
import { test, expect, accountBackend, fixCalendarTime } from "./fixtures";
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
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Alles als JSON sichern ↓" }).click();
  const save = await downloaded;
  const path = (await save.path())!;
  const backup = JSON.parse(await readFile(path, "utf8"));
  expect(backup.format).toBe("wissensquiz-server-save-v1");
  expect(backup.state.questions).toEqual([]);
  expect(backup.state.events).toHaveLength(10);
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
  await page.getByRole("button", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Optionen" }).click();
  await page.getByLabel("Sicherung auswählen").setInputFiles(path);
  await page
    .getByRole("button", { name: "Online-Spielstand durch Sicherung ersetzen" })
    .click();
  await expect(
    page.getByText("Sicherung vollständig wiederhergestellt.", { exact: true }),
  ).toBeVisible();
  const restoredCount = await backend.admin(() =>
    backend.db.query<{ n: number }>(
      "select count(*)::integer n from public.quiz_sync_entries e join public.quiz_account_heads h on h.owner_id=e.owner_id and h.generation=e.generation where kind='event' and not deleted",
    ),
  );
  expect(restoredCount.rows[0].n).toBe(10);
  expect(catalogs).toEqual([]);
  expect(
    await page.evaluate(() => ({
      indexedDB: typeof indexedDB,
      local: localStorage.getItem("wissensquiz-state"),
    })),
  ).toMatchObject({ local: null });
});

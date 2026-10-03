import {
  modePreparation,
  test,
  expect,
  openRoundSetup,
  readStoredState,
  type Page,
} from "./fixtures";
import { readFileSync } from "node:fs";
import { syncFixture } from "../helpers/sync-fixture";
import {
  verifyRelease,
  stableStringify,
  SYNC_FORMAT,
} from "../../src/syncCodec";
import { accountStorageKey } from "../../src/accounts";

test.use({ serviceWorkers: "block" });
const owner = "11111111-1111-4111-8111-111111111111",
  url = "https://quiz-test.supabase.co",
  key = accountStorageKey(url, owner);
const user = {
  id: owner,
  aud: "authenticated",
  role: "authenticated",
  email: "entry@example.test",
  email_confirmed_at: "2026-09-26T10:00:00Z",
  created_at: "2026-09-26T10:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { display_name: "Eintragstest" },
};
const session = {
  access_token: [
    { alg: "HS256", typ: "JWT" },
    { sub: owner, exp: 2000000000, role: "authenticated" },
    "test",
  ]
    .map((v) =>
      Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString(
        "base64url",
      ),
    )
    .join("."),
  refresh_token: "synthetic-refresh",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 2000000000,
  user,
};
async function service() {
  const fixture = await syncFixture(),
    { api } = await fixture.client(owner),
    release = await verifyRelease(
      JSON.parse(readFileSync("tmp-sync/catalog/release.json", "utf8")),
    );
  await fixture.seed(release);
  async function setup(page: Page) {
    await page.route("**/account-config.json", (route) =>
      route.fulfill({
        json: {
          enabled: true,
          supabaseUrl: url,
          publishableKey: "sb_publishable_test",
        },
      }),
    );
    await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
    await page.addInitScript(
      (value) =>
        localStorage.setItem(
          "wissensquiz-auth:quiz-test.supabase.co",
          JSON.stringify(value),
        ),
      session,
    );
    await page.route(`${url}/**`, async (route) => {
      const path = new URL(route.request().url()).pathname,
        body = route.request().postDataJSON() ?? {};
      if (path.endsWith("/user")) return route.fulfill({ json: user });
      if (path.endsWith("/token")) return route.fulfill({ json: session });
      if (path.endsWith("/quiz_saves"))
        return route.fulfill({
          json: (
            await fixture.db.query(
              "select state,revision,updated_at from public.quiz_saves where owner_id=$1",
              [owner],
            )
          ).rows,
        });
      const name = path.split("/").at(-1)!;
      if (!name.startsWith("quiz_sync_")) return route.fulfill({ json: [] });
      try {
        return route.fulfill({ json: await api.call(name, body) });
      } catch (error) {
        if ((error as Error).message.includes("Bestätigung verloren"))
          return route.abort("failed");
        return route.fulfill({
          status: 409,
          json: {
            code: "P0001",
            message:
              (error as Error).constructor.name === "CloudConflict"
                ? "revision_conflict"
                : (error as Error).message,
          },
        });
      }
    });
    await page.goto("/");
    await expect(page.locator(".sync-symbol.saved").first()).toBeVisible();
  }
  return { ...fixture, api, setup };
}
async function start(page: Page) {
  await openRoundSetup(page);
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".answers button").first()).toBeEnabled();
  await expect(page.locator(".sync-symbol.saved").first()).toBeVisible();
}
async function queued(page: Page) {
  return page.evaluate(
    (key) =>
      new Promise<any[]>((resolve, reject) => {
        const request = indexedDB.open("wissensquiz");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("syncOutbox"),
            data = tx
              .objectStore("syncOutbox")
              .getAll(IDBKeyRange.bound([key], [key, []]));
          tx.oncomplete = () => {
            db.close();
            resolve(data.result);
          };
        };
      }),
    key,
  );
}
test("Eintragskonto wiederholt verlorene Bestätigungen nach Neuladen, exportiert vollständig und lädt unveränderte Revisionen ohne Einträge", async ({
  page,
}) => {
  const backend = await service();
  try {
    await backend.setup(page);
    await start(page);
    backend.api.lost("quiz_sync_apply");
    await page.locator(".answers button").first().click();
    await expect(page.locator(".sync-symbol.offline").first()).toBeVisible();
    const queue = await queued(page);
    expect(queue).toHaveLength(1);
    expect(Buffer.byteLength(queue[0].packet)).toBeLessThan(12000);
    const attempted = queue[0].packet;
    await page.reload();
    await expect(page.locator(".sync-symbol.saved").first()).toBeVisible();
    expect(await queued(page)).toHaveLength(0);
    const state = await readStoredState(page, key);
    expect(state.questions).toHaveLength(6277);
    expect(state.events).toHaveLength(1);
    expect(
      backend.api.calls.filter(
        (call) =>
          call.name === "quiz_sync_apply" &&
          call.args.packet_text === attempted,
      ),
    ).toHaveLength(2);
    backend.api.calls.length = 0;
    await page.reload();
    await expect(page.locator(".sync-symbol.saved").first()).toBeVisible();
    expect(
      backend.api.calls.filter((call) =>
        ["quiz_sync_page", "quiz_sync_catalog", "quiz_sync_objects"].includes(
          call.name,
        ),
      ),
    ).toHaveLength(0);
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: /Optionen/ }).click();
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", {
        name: /JSON.*sichern|Spielstand.*sichern|Sicherung.*herunterladen/,
      })
      .click();
    const file = await (await downloaded).path();
    const exported = JSON.parse(readFileSync(file!, "utf8"));
    expect(exported.events).toHaveLength(1);
    expect(exported.questions).toHaveLength(6277);
    expect(exported).not.toHaveProperty("storageFormat");
  } finally {
    await backend.db.close();
  }
});
test("Eintragskonto schützt lokale Offlineabsichten vor fremden Änderungen und bewahrt beim ausdrücklichen Gerätewechsel eine Rückfallkopie", async ({
  page,
  browser,
}) => {
  const backend = await service(),
    context = await browser.newContext({ serviceWorkers: "block" });
  try {
    await backend.setup(page);
    await start(page);
    const second = await context.newPage();
    await backend.setup(second);
    await second.getByRole("button", { name: /Fortsetzen/ }).click();
    await page.locator(".answers button").first().click();
    await expect
      .poll(async () =>
        Number(
          (
            await backend.db.query<{ count: number }>(
              "select count(*)::int as count from public.quiz_sync_entries where owner_id=$1 and kind='event' and not deleted",
              [owner],
            )
          ).rows[0].count,
        ),
      )
      .toBe(1);
    await expect.poll(async () => (await queued(page)).length).toBe(0);
    await expect(page.locator(".sync-symbol.saved").first()).toBeVisible();
    await expect(second.locator(".answers button").last()).toBeEnabled();
    await second.locator(".answers button").last().click();
    await expect(
      second.getByRole("heading", { name: "Auf zwei Geräten gespielt" }),
    ).toBeVisible();
    expect(await queued(second)).toHaveLength(1);
    await second
      .getByRole("button", { name: "Mit dem Online-Stand weiterspielen" })
      .click();
    await expect(second.locator(".sync-symbol.saved").first()).toBeVisible();
    expect(await readStoredState(second, key)).toEqual(
      await readStoredState(page, key),
    );
    expect(await queued(second)).toHaveLength(0);
    const recoveries = await second.evaluate(
      (key) =>
        new Promise<number>((resolve) => {
          const request = indexedDB.open("wissensquiz");
          request.onsuccess = () => {
            const db = request.result,
              tx = db.transaction("state"),
              keys = tx.objectStore("state").getAllKeys();
            tx.oncomplete = () => {
              db.close();
              resolve(
                keys.result.filter((k) =>
                  String(k).startsWith(`recovery:${key}:`),
                ).length,
              );
            };
          };
        }),
      key,
    );
    expect(recoveries).toBe(1);
  } finally {
    await context.close();
    await backend.db.close();
  }
});

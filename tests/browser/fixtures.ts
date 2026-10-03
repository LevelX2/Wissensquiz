import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { catalogKey, decodeLocalState } from "../../src/localCatalog";
import type { State } from "../../src/model";
import {
  verifyRelease,
  reconstructState,
  type SyncRow,
  type SyncObject,
  type CatalogRelease,
} from "../../src/syncCodec";
export { expect, chromium, type Page } from "@playwright/test";
export const testBaseUrl = `http://localhost:${process.env.WISSENSQUIZ_BROWSER_PORT ?? 4173}`;

// Illustrated variants select the mode; only Losspielen starts a game.
export function modePreparation(page: Page, name: string | RegExp) {
  return page
    .getByRole("button", { name, includeHidden: true })
    .and(page.locator(".mode-card"));
}

// Performance cases need native timers and rendering frames. Playwright's
// setFixedTime also installs its timer/RAF scheduler, adding measurement jitter.
// Keep only the calendar date fixed, including after navigation and reload.
export async function fixCalendarTime(page: Page, time: Date) {
  await page.addInitScript((fixedTime) => {
    const NativeDate = Date;
    window.Date = new Proxy(NativeDate, {
      apply() {
        return new NativeDate(fixedTime).toString();
      },
      construct(target, args, newTarget) {
        return Reflect.construct(
          target,
          args.length ? args : [fixedTime],
          newTarget,
        );
      },
      get(target, key, receiver) {
        return key === "now"
          ? () => fixedTime
          : Reflect.get(target, key, receiver);
      },
    });
  }, time.getTime());
}

// Existing filter/game checks open the preparation panels through their UI.
// Compact-home checks deliberately leave the default collapsed state intact.
export async function openRoundSetup(page: Page) {
  await base.expect(page.locator(".loading")).toHaveCount(0);
  await base.expect(page.locator(".round-setup")).toBeVisible();
  // A selection saves asynchronously and closes its panel after the write.
  // Wait for that write before opening the preparation again.
  await base.expect(page.locator(".mode-group").first()).toBeEnabled();
  for (const summary of await page
    .locator(".round-setup .setup-section > summary")
    .all()) {
    if (
      !(await summary.evaluate(
        (node) => (node.parentElement as HTMLDetailsElement).open,
      ))
    )
      await summary.click();
  }
}

// Inspect the logical state, independently of its IndexedDB storage layout.
export async function readStoredState(
  page: Page,
  key = "current",
): Promise<State> {
  const entries = await page.evaluate(
    (key) =>
      new Promise<
        | { rows: SyncRow[]; objects: SyncObject[]; releases: CatalogRelease[] }
        | undefined
      >((resolve, reject) => {
        const request = indexedDB.open("wissensquiz");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("entryHeads")) {
            db.close();
            resolve(undefined);
            return;
          }
          const tx = db.transaction([
              "entryHeads",
              "entryRows",
              "entryObjects",
              "syncReleases",
            ]),
            head = tx.objectStore("entryHeads").get(key),
            range = IDBKeyRange.bound([key], [key, []]);
          const rows = tx.objectStore("entryRows").getAll(range),
            objects = tx.objectStore("entryObjects").getAll(range),
            releases = tx.objectStore("syncReleases").getAll();
          tx.oncomplete = () => {
            db.close();
            resolve(
              head.result
                ? {
                    rows: rows.result,
                    objects: objects.result,
                    releases: releases.result,
                  }
                : undefined,
            );
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
    key,
  );
  if (entries)
    return reconstructState(
      {
        rows: new Map(
          entries.rows.map((row) => [`${row.kind}:${row.id}`, row]),
        ),
        objects: new Map(
          entries.objects.map((object) => [object.hash, object]),
        ),
      },
      await Promise.all(entries.releases.map(verifyRelease)),
    );
  const stored = await page.evaluate(
    ({ key, catalogKey }) =>
      new Promise<{ state: any; catalog: unknown }>((resolve, reject) => {
        const request = indexedDB.open("wissensquiz");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("state");
          const store = tx.objectStore("state");
          const state = store.get(key);
          const catalog = store.get(catalogKey);
          tx.oncomplete = () => {
            db.close();
            resolve({ state: state.result, catalog: catalog.result });
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
    { key, catalogKey: catalogKey(key) },
  );
  const state = decodeLocalState(stored.state, stored.catalog, key);
  if (!state) throw new Error("Testspielstand fehlt.");
  return state;
}

// Guest games now send aggregate activity. Every test context uses a synthetic
// service so test rounds never reach the production activity or account data.
export async function isolateAccountService(context: BrowserContext) {
  await context.route("**/account-config.json", (route) =>
    route.fulfill({
      json: {
        enabled: true,
        supabaseUrl: "https://quiz-test.supabase.co",
        publishableKey: "sb_publishable_test",
      },
    }),
  );
  await context.route("https://quiz-test.supabase.co/**", (route) =>
    route.fulfill({
      status: 404,
      json: { code: "PGRST202", message: "Mock endpoint not configured" },
    }),
  );
}
export const test = base.extend({
  context: async ({ context }, use) => {
    await isolateAccountService(context);
    await use(context);
  },
});

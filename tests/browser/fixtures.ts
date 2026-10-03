import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { catalogKey, decodeLocalState } from "../../src/localCatalog";
import type { State } from "../../src/model";
export { expect, chromium, type Page } from "@playwright/test";
export const testBaseUrl = `http://localhost:${process.env.WISSENSQUIZ_BROWSER_PORT ?? 4173}`;

// Inspect the logical state, independently of its IndexedDB storage layout.
export async function readStoredState(
  page: Page,
  key = "current",
): Promise<State> {
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

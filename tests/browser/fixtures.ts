import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { State } from "../../src/model";
import { verifyRelease, type PreparedRelease } from "../../src/syncCodec";
import { OnlineGameStore } from "../../src/onlineGameStore";
import { syncFixture } from "../helpers/sync-fixture";
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
  await base
    .expect(page.locator(".round-setup"))
    .toHaveAttribute("aria-busy", "false");
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

// Every browser gets a synthetic authenticated server with the real SQL protocol.
// Browser tests never access production accounts or device game databases.
export const testOwner = "11111111-1111-4111-8111-111111111111";
export const testServiceUrl = "https://quiz-test.supabase.co";
const user = {
  id: testOwner,
  aud: "authenticated",
  role: "authenticated",
  email: "quiz@example.test",
  email_confirmed_at: "2026-09-26T10:00:00Z",
  created_at: "2026-09-26T10:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { display_name: "Quiztest" },
};
const session = {
  access_token: [
    { alg: "HS256", typ: "JWT" },
    { sub: testOwner, exp: 2000000000, role: "authenticated" },
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
let preparedRelease: Promise<PreparedRelease> | undefined;
export async function createAccountBackend() {
  const fixture = await syncFixture(),
    { api } = await fixture.client(testOwner);
  const release = await (preparedRelease ??= verifyRelease(
    JSON.parse(readFileSync("tmp-sync/catalog/release.json", "utf8")),
  ));
  await fixture.seed(release);
  return { ...fixture, api, release, close: () => fixture.db.close() };
}
export type AccountBackend = Awaited<ReturnType<typeof createAccountBackend>>;
const backends = new WeakMap<BrowserContext, AccountBackend>();
export function accountBackend(page: Page) {
  const backend = backends.get(page.context());
  if (!backend) throw new Error("Isolierter Testserver fehlt");
  return backend;
}
export async function isolateAccountService(
  context: BrowserContext,
  options: { autoLogin?: boolean; backend?: AccountBackend } = {},
) {
  const backend = options.backend ?? (await createAccountBackend());
  backends.set(context, backend);
  await context.route("**/account-config.json", (route) =>
    route.fulfill({
      json: {
        enabled: true,
        supabaseUrl: testServiceUrl,
        publishableKey: "sb_publishable_test",
      },
    }),
  );
  await context.route(`${testServiceUrl}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname,
      body = route.request().postDataJSON() ?? {};
    if (path.endsWith("/user")) return route.fulfill({ json: user });
    if (path.endsWith("/token")) return route.fulfill({ json: session });
    if (path.endsWith("/logout")) return route.fulfill({ json: {} });
    if (path.endsWith("/quiz_saves")) return route.fulfill({ json: [] });
    const name = path.split("/").at(-1)!;
    if (!name.startsWith("quiz_sync_")) return route.fulfill({ json: [] });
    try {
      return route.fulfill({ json: await backend.api.call(name, body) });
    } catch (error) {
      if (/Bestätigung verloren|Offlinephase/.test((error as Error).message))
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
  if (options.autoLogin !== false)
    await context.addInitScript((value) => {
      if (!sessionStorage.getItem("test-auth-initialized")) {
        localStorage.setItem(
          "wissensquiz-auth:quiz-test.supabase.co",
          JSON.stringify(value),
        );
        sessionStorage.setItem("test-auth-initialized", "yes");
      }
    }, session);
  return backend;
}
export async function readStoredState(
  page: Page,
  _key?: string,
): Promise<State> {
  const { api, release } = accountBackend(page);
  const store = new OnlineGameStore(
    api,
    testOwner,
    async () => release,
    async () => null,
  );
  await store.open();
  const state = store.read();
  store.stop();
  return state;
}
export async function writeStoredState(page: Page, state: State) {
  const { api, release } = accountBackend(page);
  const store = new OnlineGameStore(
    api,
    testOwner,
    async () => release,
    async () => null,
  );
  await store.open();
  await store.update((s) => Object.assign(s, state), { replace: true });
  store.stop();
}
export const test = base.extend<{ autoLogin: boolean }>({
  autoLogin: [true, { option: true }],
  context: async ({ context, autoLogin }, use) => {
    const backend = await isolateAccountService(context, { autoLogin });
    try {
      await use(context);
    } finally {
      await backend.close();
    }
  },
});

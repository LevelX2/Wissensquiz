import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
// Auth HTTP responses must remain interceptable after reload; offline behavior
// is covered separately against the real service worker.
test.use({ serviceWorkers: "block" });
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222";
const user = (id = alice) => ({
  id,
  aud: "authenticated",
  role: "authenticated",
  email: id === alice ? "alice@example.test" : "bob@example.test",
  email_confirmed_at: "2026-09-26T10:00:00Z",
  created_at: "2026-09-26T10:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { display_name: id === alice ? "Alice" : "Bob" },
});
const session = (id = alice) => ({
  access_token: [
    { alg: "HS256", typ: "JWT" },
    { sub: id, exp: 2000000000, role: "authenticated" },
    "test",
  ]
    .map((v) =>
      Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString(
        "base64url",
      ),
    )
    .join("."),
  refresh_token: "mock-refresh",
  token_type: "bearer",
  expires_in: 3600,
  user: user(id),
});
type Server = Map<
  string,
  { state: unknown; revision: number; updated_at: string }
>;
async function mockAccounts(page: Page, server: Server = new Map()) {
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  let current = alice;
  await page.route("**/account-config.json", (r) =>
    r.fulfill({
      json: {
        enabled: true,
        supabaseUrl: "https://quiz-test.supabase.co",
        publishableKey: "sb_publishable_test",
      },
    }),
  );
  await page.route("https://quiz-test.supabase.co/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.postDataJSON() ?? {};
    requests.push({ path, body });
    if (path.endsWith("/token")) {
      current = body.email === "bob@example.test" ? bob : alice;
      return route.fulfill({ json: session(current) });
    }
    if (path.endsWith("/signup"))
      return route.fulfill({ json: { ...user(), email_confirmed_at: null } });
    if (path.endsWith("/verify")) return route.fulfill({ json: session() });
    if (path.endsWith("/user")) return route.fulfill({ json: user(current) });
    if (
      path.endsWith("/logout") ||
      path.endsWith("/recover") ||
      path.endsWith("/resend")
    )
      return route.fulfill({ json: {} });
    if (path.endsWith("/quiz_saves"))
      return route.fulfill({
        json: server.has(current) ? [server.get(current)] : [],
      });
    if (path.endsWith("/quiz_save_state")) {
      if (
        body.expected_owner !== current ||
        body.expected_revision !== (server.get(current)?.revision ?? 0)
      )
        return route.fulfill({
          status: 409,
          json: { message: "revision_conflict" },
        });
      const revision = (server.get(current)?.revision ?? 0) + 1;
      server.set(current, {
        state: body.payload,
        revision,
        updated_at: new Date().toISOString(),
      });
      return route.fulfill({ json: revision });
    }
    return route.fulfill({
      status: 400,
      json: { message: "Unexpected mocked endpoint" },
    });
  });
  return requests;
}
async function account(page: Page) {
  await page.getByRole("button", { name: "Konto", exact: true }).click();
}
async function login(page: Page, email = "alice@example.test") {
  await account(page);
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page
    .getByLabel("Passwort", { exact: true })
    .fill("nur-ein-test-passwort");
  await page
    .getByRole("button", { name: "Passwort anzeigen", exact: true })
    .click();
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveValue(
    "nur-ein-test-passwort",
  );
  await page
    .getByRole("button", { name: "Passwort verbergen", exact: true })
    .click();
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
}
test("Bestätigungsansicht erklärt die Aktivierung und verbraucht den Link erst nach ausdrücklichem Klick", async ({
  page,
}) => {
  const requests = await mockAccounts(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/#auth?type=signup&token_hash=" + "a".repeat(64));
  await expect(
    page.getByRole("heading", { name: "Dein Quiz-Konto aktivieren" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ohne Bestätigung zum Quiz" }),
  ).toBeVisible();
  expect(requests.some((r) => r.path.endsWith("/verify"))).toBe(false);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/konto-bestaetigung-320.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "E-Mail bestätigen und Konto aktivieren" })
    .click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await expect
    .poll(() => requests.some((r) => r.path.endsWith("/quiz_save_state")))
    .toBe(true);
});

test("Kontofortschritt wird auf einem zweiten Gerät automatisch geladen und nach Netzfehler nachgespeichert", async ({
  page,
  browser,
}) => {
  const server: Server = new Map();
  await mockAccounts(page, server);
  await page.goto("/");
  await login(page);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await page.route("**/rest/v1/rpc/quiz_save_state", (r) => r.abort());
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(page.locator(".sync-status")).toContainText(
    "Noch nicht online gespeichert",
  );
  await page.unroute("**/rest/v1/rpc/quiz_save_state");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.locator(".sync-status")).toHaveText(
    "Spielstand online gespeichert",
  );
  const otherContext = await browser.newContext({
    serviceWorkers: "block",
    baseURL: "http://localhost:4173",
  });
  try {
    const other = await otherContext.newPage();
    await mockAccounts(other, server);
    await other.goto("/");
    await account(other);
    await other.getByLabel("E-Mail-Adresse").fill("alice@example.test");
    await other
      .getByLabel("Passwort", { exact: true })
      .fill("nur-ein-test-passwort");
    await other.getByRole("button", { name: "Anmelden", exact: true }).click();
    await expect(
      other.getByRole("button", { name: "Fortsetzen" }),
    ).toBeVisible();
    await other.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(other.locator(".feedback")).toBeVisible();
    await other
      .locator(".feedback")
      .getByRole("button", { name: /Weiter|Nächste/ })
      .click();
    await other.locator(".answer").first().click();
    await expect(other.locator(".sync-status")).toHaveText(
      "Spielstand online gespeichert",
    );
    await page
      .locator(".feedback")
      .getByRole("button", { name: /Weiter|Nächste/ })
      .click();
    await page.locator(".answer").first().click();
    await expect(
      page.getByRole("heading", { name: "Auf zwei Geräten gespielt" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Mit dem Online-Stand weiterspielen" })
      .click();
    await expect(
      page.getByRole("button", { name: "Fortsetzen" }),
    ).toBeVisible();
  } finally {
    await otherContext.close();
  }
});
test("Unkonfigurierte Konten bieten keine unechte Registrierung und erhalten den Gastmodus", async ({
  page,
}) => {
  await page.route("**/account-config.json", (route) =>
    route.fulfill({
      json: { enabled: false, supabaseUrl: "", publishableKey: "" },
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await account(page);
  await expect(
    page.getByText("Die eigene Anmeldung wird vorbereitet.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveCount(0);
});
test("Registrierung, erneute Bestätigung und Reset-Anforderung verwenden den Kontodienst ohne Passwortspeicherung", async ({
  page,
}) => {
  const requests = await mockAccounts(page);
  await page.goto("/");
  await account(page);
  await page
    .getByRole("button", { name: "Konto erstellen", exact: true })
    .click();
  await page.getByLabel("Spielername").fill("Filmfan");
  await page.getByLabel("E-Mail-Adresse").fill("test@example.test");
  await page
    .getByLabel("Passwort", { exact: true })
    .fill("nur-ein-test-passwort");
  await page
    .getByRole("button", { name: "Passwort anzeigen", exact: true })
    .click();
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  expect(requests.some((r) => r.path.endsWith("/signup"))).toBe(false);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel("Passwort", { exact: true })
    .evaluate((input) => input.scrollIntoView({ block: "center" }));
  await page.screenshot({
    path: "test-results/passwort-auge-320.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Registrieren", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Bestätigungsmail" }),
  ).toBeVisible();
  expect(requests.find((r) => r.path.endsWith("/signup"))?.body.data).toEqual({
    display_name: "Filmfan",
  });
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Passwort", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page
    .getByRole("button", { name: "E-Mail noch nicht bestätigt?" })
    .click();
  await page.getByRole("button", { name: "Bestätigung anfordern" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Bestätigung aussteht" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Passwort vergessen?" }).click();
  await page.getByRole("button", { name: "Reset-Link anfordern" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Falls ein Konto" }),
  ).toBeVisible();
  expect(requests.some((r) => r.path.endsWith("/recover"))).toBe(true);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "nur-ein-test-passwort",
  );
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});
test("E-Mail-Link wird erst nach Klick verbraucht, Recovery setzt Passwort und meldet ab", async ({
  page,
}) => {
  const requests = await mockAccounts(page);
  await page.goto("/#auth?type=recovery&token_hash=" + "a".repeat(64));
  await expect(
    page.getByRole("button", { name: "Weiter zum neuen Passwort" }),
  ).toBeEnabled();
  expect(page.url()).not.toContain("token_hash");
  expect(requests.some((r) => r.path.endsWith("/verify"))).toBe(false);
  await page.getByRole("button", { name: "Weiter zum neuen Passwort" }).click();
  await expect(
    page.getByRole("heading", { name: "Neues Passwort setzen" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Neues Passwort setzen" }),
  ).toBeVisible();
  await page
    .getByLabel("Neues Passwort", { exact: true })
    .fill("neues-test-passwort");
  await page
    .getByLabel("Passwort wiederholen", { exact: true })
    .fill("neues-test-passwort");
  await page
    .getByRole("button", { name: "Neues Passwort anzeigen", exact: true })
    .click();
  await expect(
    page.getByLabel("Neues Passwort", { exact: true }),
  ).toHaveAttribute("type", "text");
  await expect(
    page.getByLabel("Passwort wiederholen", { exact: true }),
  ).toHaveAttribute("type", "password");
  await page
    .getByRole("button", { name: "Passwort wiederholen anzeigen", exact: true })
    .click();
  await expect(
    page.getByLabel("Passwort wiederholen", { exact: true }),
  ).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Passwort speichern" }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect(
    requests.some(
      (r) =>
        r.path.endsWith("/user") && r.body.password === "neues-test-passwort",
    ),
  ).toBe(true);
  expect(requests.some((r) => r.path.endsWith("/logout"))).toBe(true);
  await account(page);
  await expect(
    page.getByRole("heading", { name: "Anmelden", exact: true }),
  ).toBeVisible();
});
test("Zwei Konten und Gast bleiben getrennt; Kontofortschritt wird automatisch gesichert", async ({
  page,
}) => {
  const requests = await mockAccounts(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Losspielen" }).click();
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await page.getByRole("button", { name: "Pause & Startseite" }).click();
  await login(page);
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toHaveCount(0);
  await account(page);
  await expect(
    page.getByText("Angemeldet als", { exact: false }),
  ).toContainText("Alice");
  await expect
    .poll(() => requests.some((r) => r.path.endsWith("/quiz_save_state")))
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Online sichern", exact: true }),
  ).toHaveCount(0);
  await page
    .getByText("Vorhandenen Gastspielstand übernehmen", { exact: true })
    .click();
  await page
    .getByLabel(
      "Meinen lokalen Kontospielstand durch den Gastspielstand ersetzen",
    )
    .check();
  await page.getByRole("button", { name: "Gastspielstand kopieren" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Gastspielstand kopiert" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abmelden", exact: true }).click();
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toBeVisible();
  await login(page, "bob@example.test");
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toHaveCount(0);
  await account(page);
  await expect(
    page.getByText("Angemeldet als", { exact: false }),
  ).toContainText("Bob");
  await page.getByRole("button", { name: "Abmelden", exact: true }).click();
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toBeVisible();
});

test("Falsches Passwort und abgelaufener Reset-Link zeigen Fehler ohne Kontozugriff", async ({
  page,
}) => {
  await mockAccounts(page);
  await page.route("https://quiz-test.supabase.co/auth/v1/token*", (r) =>
    r.fulfill({
      status: 400,
      headers: {
        "x-supabase-api-version": "2024-01-01",
        "access-control-expose-headers": "X-Supabase-Api-Version",
      },
      json: { code: "invalid_credentials", msg: "Invalid login credentials" },
    }),
  );
  await page.goto("/");
  await account(page);
  await page.getByLabel("E-Mail-Adresse").fill("alice@example.test");
  await page
    .getByLabel("Passwort", { exact: true })
    .fill("falsches-test-passwort");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "E-Mail oder Passwort stimmt nicht." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Online sichern", exact: true }),
  ).toHaveCount(0);
  await page.route("https://quiz-test.supabase.co/auth/v1/verify", (r) =>
    r.fulfill({
      status: 403,
      headers: {
        "x-supabase-api-version": "2024-01-01",
        "access-control-expose-headers": "X-Supabase-Api-Version",
      },
      json: { code: "otp_expired", msg: "Token expired" },
    }),
  );
  await page.goto("/#auth?type=recovery&token_hash=" + "b".repeat(64));
  await page.reload();
  await page.getByRole("button", { name: "Weiter zum neuen Passwort" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "abgelaufen" }),
  ).toBeVisible();
  await expect(page.getByLabel("Neues Passwort", { exact: true })).toHaveCount(
    0,
  );
});

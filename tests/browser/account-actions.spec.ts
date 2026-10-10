import {
  modePreparation,
  openRoundSetup,
  test,
  expect,
  testBaseUrl,
  readStoredState,
  type Page,
} from "./fixtures";

import { accountStorageKey } from "../../src/accounts";

import AxeBuilder from "@axe-core/playwright";

import { readFileSync } from "node:fs";

import { importCsv } from "../../src/importer";

import { emptyState } from "../../src/model";

import { startRound, answer, complete } from "../../src/engine";

async function comparePlayers(page: Page) {
  await page.getByRole("button", { name: "Karriere", exact: true }).click();
  const filtered = page.getByRole("button", {
    name: "Spielervergleich mit Filtern",
    exact: true,
  });
  if (await filtered.isVisible()) await filtered.click();
}

async function compareRecords(page: Page) {
  await page.getByRole("button", { name: "Rekordspiele", exact: true }).click();
  await page
    .getByRole("button", { name: "Gemeinsame Rangliste", exact: true })
    .click();
}

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

const guestDays = () =>
  Array.from({ length: 7 }, (_, i) => ({
    activity_day: new Date(Date.UTC(2026, 9, 3 - i)).toISOString().slice(0, 10),
    started: i === 0 ? 8 : 0,
    completed: i === 0 ? 5 : 0,
    answered: i === 0 ? 50 : 0,
    correct: i === 0 ? 40 : 0,
    collection_started_at: "2026-10-01T10:00:00+00:00",
  }));

test("GitHub-Meldung im Profil zeigt Typen, öffentliche Zustimmung und bestätigten Issue-Link ohne Spielstandänderung", async ({
  page,
}, testInfo) => {
  await mockAccounts(page);
  await page.clock.install({ time: new Date("2026-10-04T12:00:00+02:00") });
  const reports: Record<string, unknown>[] = [];
  await page.route(
    "https://quiz-test.supabase.co/functions/v1/quiz-report",
    async (route) => {
      reports.push(route.request().postDataJSON());
      expect(route.request().headers().authorization).toMatch(/^Bearer /);
      await route.fulfill({
        json: {
          number: 42,
          url: "https://github.com/LevelX2/Wissensquiz/issues/42",
        },
      });
    },
  );
  await page.goto("/");
  await login(page);
  await account(page);
  const before = await readStoredState(
    page,
    accountStorageKey("https://quiz-test.supabase.co", alice),
  );
  await page
    .getByText("Problem oder Verbesserung melden", { exact: true })
    .click();
  await expect(page.getByLabel("Meldungstyp").locator("option")).toHaveText([
    "Technischer Fehler",
    "Inhalt falsch",
    "Textverbesserung",
    "Sonstiges",
  ]);
  await page.getByLabel("Meldungstyp").selectOption("wording");
  await page
    .getByLabel("Kurztitel")
    .fill("Text auf dem Handy verständlicher machen");
  await page
    .getByLabel("Was ist Dir aufgefallen?")
    .fill("Die Anleitung zur Auswahl könnte verständlicher sein.");
  await expect(
    page.getByRole("button", { name: "Meldung senden", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Meine Meldung darf öffentlich auf GitHub erscheinen.")
    .check();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("issue-report-form.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Meldung senden", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "GitHub-Issue #42", exact: true }),
  ).toHaveAttribute("href", "https://github.com/LevelX2/Wissensquiz/issues/42");
  expect(reports).toHaveLength(1);
  expect(Object.keys(reports[0]).sort()).toEqual([
    "appVersion",
    "comment",
    "id",
    "title",
    "type",
  ]);
  expect(reports[0].type).toBe("wording");
  expect(
    await readStoredState(
      page,
      accountStorageKey("https://quiz-test.supabase.co", alice),
    ),
  ).toEqual(before);
});

test("GitHub-Fragenmeldung behält Kontext und Meldungs-ID nach unklarem Versand und Neuladen", async ({
  page,
}) => {
  await mockAccounts(page);
  await page.clock.install({ time: new Date("2026-10-04T12:00:00+02:00") });
  const reports: Record<string, unknown>[] = [];
  await page.route(
    "https://quiz-test.supabase.co/functions/v1/quiz-report",
    async (route) => {
      reports.push(route.request().postDataJSON());
      await route.fulfill(
        reports.length === 1
          ? { status: 409, json: { code: "report_uncertain" } }
          : {
              json: {
                number: 43,
                url: "https://github.com/LevelX2/Wissensquiz/issues/43",
              },
            },
      );
    },
  );
  await page.goto("/");
  await login(page);
  await page.getByRole("button", { name: "Losspielen" }).click();
  const questionId = await page
    .locator(".question-card h1")
    .getAttribute("data-question-id");
  await page.getByRole("button", { name: "Frage melden" }).click();
  await page.getByLabel("Meldungstyp").selectOption("content");
  await page
    .getByLabel("Was ist Dir aufgefallen?")
    .fill("Die Erklärung zur Frage sollte redaktionell geprüft werden.");
  await page
    .getByLabel("Meine Meldung darf öffentlich auf GitHub erscheinen.")
    .check();
  await page
    .getByRole("button", { name: "Meldung senden", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "GitHub hat den Versand noch nicht bestätigt",
  );
  await expect(page.getByRole("link", { name: /GitHub-Issue/ })).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  await page.getByRole("button", { name: "Frage melden" }).click();
  await expect(page.getByLabel("Was ist Dir aufgefallen?")).toHaveValue(
    "Die Erklärung zur Frage sollte redaktionell geprüft werden.",
  );
  await expect(page.getByLabel("Kurztitel")).toBeDisabled();
  await page
    .getByRole("button", { name: "Versand erneut prüfen", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "GitHub-Issue #43", exact: true }),
  ).toBeVisible();
  expect(reports).toHaveLength(2);
  expect(reports[1]).toEqual(reports[0]);
  expect(reports[0].question).toMatchObject({ id: questionId });
  expect(
    (
      await readStoredState(
        page,
        accountStorageKey("https://quiz-test.supabase.co", alice),
      )
    ).reports,
  ).toEqual([]);
  await page.getByRole("button", { name: "Frage melden" }).click();
  await page.getByRole("button", { name: "Frage melden" }).click();
  await expect(
    page.getByRole("link", { name: "GitHub-Issue #43", exact: true }),
  ).toBeVisible();
  expect(reports).toHaveLength(2);
});

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
    if (path.includes("/quiz_sync_")) return route.fallback();
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
    if (path.endsWith("/quiz_sharing")) return route.fulfill({ json: null });
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
  if (await page.getByRole("button", { name: "Profil", exact: true }).count())
    await page.getByRole("button", { name: "Profil", exact: true }).click();
}

async function login(
  page: Page,
  email = "alice@example.test",
  allowActive = false,
) {
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
  if (allowActive)
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeVisible();
  else
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
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
    page.getByRole("button", { name: "Zur Anmeldung" }),
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
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
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
  await expect(
    page.getByRole("heading", { name: "Anmelden", exact: true }),
  ).toBeVisible();
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

for (const failure of [
  {
    code: "57014",
    status: 500,
    text: "Das Laden der Spielerrangliste dauert zu lange. Bitte versuche es erneut.",
  },
  {
    code: "PGRST301",
    status: 401,
    text: "Deine Anmeldung konnte nicht bestätigt werden. Bitte melde Dich im Profil erneut an.",
  },
  {
    code: "XX000",
    status: 500,
    text: "Der Kontodienst konnte die Spielerwerte nicht bereitstellen. Bitte versuche es erneut.",
  },
]) {
  test(`Spielervergleich erklärt ${failure.code} und lädt nach erneutem Versuch das eigene Ergebnis`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-02T10:00:00+02:00") });
    await mockAccounts(page);
    let failed = true;
    await page.route("**/rest/v1/rpc/quiz_players", (route) =>
      route.fulfill(
        failed
          ? {
              status: failure.status,
              json: {
                code: failure.code,
                message: "Private interne Fehlerdetails",
              },
            }
          : {
              json: [
                {
                  player_name: "Alice",
                  completed: 1,
                  answered: 5,
                  correct: 3,
                  accuracy: 60,
                  place: 1,
                  is_mine: true,
                  experience: 0,
                },
              ],
            },
      ),
    );
    await page.goto("/");
    await login(page);
    await page.getByRole("button", { name: "Highscores", exact: true }).click();
    await comparePlayers(page);
    await expect(
      page.getByRole("status").filter({ hasText: failure.text }),
    ).toBeVisible();
    await expect(page.getByText("Private interne Fehlerdetails")).toHaveCount(
      0,
    );
    failed = false;
    await page
      .getByRole("button", { name: "Erneut versuchen", exact: true })
      .click();
    await expect(page.getByText("Platz 1 · Alice (Du)")).toBeVisible();
    await expect(
      page.getByText(/1 Runden · 3 von 5 Antworten richtig · 60 %/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Spielerrangliste aktualisieren",
        exact: true,
      }),
    ).toBeVisible();
  });
}

test.use({ autoLogin: false, serviceWorkers: "block" });

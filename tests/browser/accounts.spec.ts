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
// Auth HTTP responses must remain interceptable after reload; offline behavior
// is covered separately against the real service worker.
test.use({ serviceWorkers: "block" });

test("ein fehlgeschlagener Kontodienst lässt sich erneut laden und erhält den Gaststand", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
  await mockAccounts(page, new Map());
  let failing = true;
  await page.route("**/account-config.json", (route) =>
    failing ? route.abort() : route.fallback(),
  );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  const before = await readStoredState(page);
  await account(page);
  await expect(
    page.getByText("Der Kontodienst konnte gerade nicht geladen werden.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Bestätigungs- und Reset-Mails sind noch nicht eingerichtet.",
      { exact: false },
    ),
  ).toHaveCount(0);
  failing = false;
  await page.getByRole("button", { name: "Kontodienst erneut laden" }).click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await account(page);
  await expect(page.getByLabel("E-Mail-Adresse")).toBeVisible();
  expect(await readStoredState(page)).toEqual(before);
});

test("Profil zeigt die Onlinebestätigung und exportiert den erhaltenen Kontostand nach Gastübernahme", async ({
  page,
}) => {
  await mockAccounts(page, new Map());
  await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
  await page.goto("/");
  await login(page);
  await openRoundSetup(page);
  await modePreparation(page, /Freies Spiel Alle Stufen/).click();
  await account(page);
  await page.getByText("Konto & Speicherung", { exact: true }).click();
  await expect(page.locator(".profile-sync-status")).toHaveText(
    "Spielstand online gespeichert",
  );
  await expect(page.locator(".online-confirmation")).toContainText(
    "Zuletzt online bestätigt:",
  );
  const old = await readStoredState(
    page,
    accountStorageKey("https://quiz-test.supabase.co", alice),
  );
  await page
    .getByText("Vorhandenen Gastspielstand übernehmen", { exact: true })
    .click();
  await page
    .getByLabel(
      "Meinen lokalen Kontospielstand durch den Gastspielstand ersetzen",
    )
    .check();
  await page
    .getByRole("button", { name: "Gastspielstand kopieren", exact: true })
    .click();
  await expect(
    page.getByText("Gastspielstand kopiert.", { exact: false }),
  ).toBeVisible();
  await page.getByText("Lokale Rückfallkopien", { exact: true }).click();
  await page
    .getByRole("button", { name: "Kopien anzeigen / aktualisieren" })
    .click();
  const before = await readStoredState(
    page,
    accountStorageKey("https://quiz-test.supabase.co", alice),
  );
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Rückfallkopie 1 als JSON exportieren" })
    .click();
  const file = await (await downloaded).path();
  const exported = JSON.parse(readFileSync(file!, "utf8"));
  expect(exported.settings.roundSetup.mode).toBe("ueben");
  expect(exported).toEqual(old);
  expect(
    await readStoredState(
      page,
      accountStorageKey("https://quiz-test.supabase.co", alice),
    ),
  ).toEqual(before);
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
});

test("ein hängender Kontospielstand endet mit erneutem Versuch statt dauerhafter Ladeansicht", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
  await mockAccounts(page);
  let hang = true;
  let requested = false;
  await page.route("**/rest/v1/quiz_saves*", (route) => {
    requested = true;
    if (!hang) return route.fulfill({ json: [] });
  });
  await page.goto("/");
  await account(page);
  await page.getByLabel("E-Mail-Adresse").fill("alice@example.test");
  await page
    .getByLabel("Passwort", { exact: true })
    .fill("nur-ein-test-passwort");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect.poll(() => requested).toBe(true);
  await page.clock.runFor(10_001);
  await expect(
    page.getByText(/Dein Online-Spielstand konnte nicht geladen werden/),
  ).toBeVisible();
  hang = false;
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
});

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
test("die öffentliche Bestenliste zeigt Gästen Level und Spielbilanz, Gasttage und verständliche Quoten ohne Anmeldung", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
  const requests = await mockAccounts(page);
  await page.addInitScript(
    (value) =>
      localStorage.setItem(
        "wissensquiz-auth:quiz-test.supabase.co",
        JSON.stringify(value),
      ),
    { ...session(), expires_at: 2000000000 },
  );
  await page.route("**/auth/v1/user", (r) =>
    r.fulfill({
      status: 401,
      json: { code: "bad_jwt", message: "invalid token" },
    }),
  );
  await page.route("**/rest/v1/rpc/quiz_guest_activity", (r) =>
    r.fulfill({ json: guestDays() }),
  );
  let fail = false;
  const queries: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/rpc/quiz_public_players", (r) => {
    expect(r.request().headers().authorization).not.toBe(
      `Bearer ${session().access_token}`,
    );
    const query = r.request().postDataJSON();
    queries.push(query);
    return fail
      ? r.fulfill({ status: 500, json: { code: "XX000" } })
      : r.fulfill({
          json:
            query.sort_by === "accuracy"
              ? []
              : [
                  {
                    player_name: "Bob",
                    completed: 12,
                    answered: 100,
                    correct: 85,
                    accuracy: 85,
                    place: 1,
                    is_mine: false,
                    experience: 2950,
                  },
                  {
                    player_name: "Neuer Spieler",
                    completed: 0,
                    answered: 0,
                    correct: 0,
                    accuracy: null,
                    place: 2,
                    is_mine: false,
                    experience: 0,
                  },
                ],
        });
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await page.getByRole("button", { name: "Karriere", exact: true }).click();
  await expect(
    page.getByRole("list", { name: "Spielerrangliste" }),
  ).toContainText("Level 10 · Cineast");
  await expect(
    page.getByRole("list", { name: "Spielerrangliste" }),
  ).toContainText(
    "12 abgeschlossene Spiele · 85 von 100 Antworten richtig · 85 % Trefferquote",
  );
  await expect(
    page.getByRole("list", { name: "Spielerrangliste" }),
  ).toContainText("Neuer Spieler");
  expect(queries[0]).toEqual({ sort_by: "experience", page_offset: 0 });
  await expect(page.getByLabel("Spielerwertung Genre")).toHaveCount(0);
  await expect(page.locator(".guest-activity .profile-stats dd")).toHaveText([
    "8",
    "5",
    "50",
  ]);
  await page.getByText("Aktivität pro Tag", { exact: true }).click();
  await expect(
    page
      .getByRole("list", { name: "Tägliche Gastaktivität" })
      .getByRole("listitem"),
  ).toHaveCount(7);
  await expect(
    page.getByText("Noch nicht erfasst", { exact: true }),
  ).toHaveCount(4);
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
    path: "test-results/oeffentliche-bestenliste-320.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Trefferquote", exact: true }).click();
  await expect(
    page.getByText(/mindestens 50 beantwortete Fragen in dieser Auswahl/),
  ).toBeVisible();
  fail = true;
  await page.getByRole("button", { name: "Runden", exact: true }).click();
  await expect(
    page.getByText(/Kontodienst konnte die Spielerwerte nicht bereitstellen/),
  ).toBeVisible();
  fail = false;
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Spielerrangliste" }),
  ).toBeVisible();
  expect(
    requests.some(
      (r) =>
        r.path.endsWith("quiz_save_state") || r.path.endsWith("quiz_players"),
    ),
  ).toBe(false);
});

test("öffentliche Spielerlisten wechseln begrenzte Seiten und markieren nach Anmeldung das eigene Konto", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-03T12:00:00+02:00") });
  await mockAccounts(page);
  await page.route("**/rest/v1/rpc/quiz_guest_activity", (r) =>
    r.fulfill({ json: guestDays() }),
  );
  const queries: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/rpc/quiz_public_players", (r) => {
    const body = r.request().postDataJSON();
    queries.push(body);
    return r.fulfill({
      json: Array.from({ length: body.page_offset === 0 ? 50 : 1 }, (_, i) => ({
        player_name:
          i === 0 && body.page_offset === 0
            ? "Alice"
            : `Spieler ${body.page_offset + i + 1}`,
        completed: 0,
        answered: 0,
        correct: 0,
        accuracy: null,
        place: 1,
        is_mine: i === 0 && body.page_offset === 0,
        experience: 0,
      })),
    });
  });
  await page.goto("/");
  await login(page);
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await page.getByRole("button", { name: "Karriere", exact: true }).click();
  await expect(page.locator(".leaderboard-list > .is-mine")).toContainText(
    "Alice (Du)",
  );
  await expect(page.locator(".leaderboard-list > li")).toHaveCount(50);
  await page.getByRole("button", { name: "Weitere Spieler" }).click();
  await expect(page.locator(".leaderboard-list > li")).toHaveCount(1);
  expect(queries.at(-1)).toEqual({ sort_by: "experience", page_offset: 50 });
  await page.getByRole("button", { name: "Vorherige Spieler" }).click();
  await expect(page.locator(".leaderboard-list > li")).toHaveCount(50);
});

test("Gastspielmeldungen überstehen einen Fehler und Neuladen, zählen keine Importe und keine Kontospiele", async ({
  page,
}) => {
  const time = new Date("2026-10-03T12:00:00+02:00");
  await page.clock.install({ time });
  await mockAccounts(page);
  const events: Record<string, unknown>[] = [];
  let failed = false;
  await page.route("**/rest/v1/rpc/quiz_report_guest_activity", (r) => {
    events.push(r.request().postDataJSON());
    if (!failed) {
      failed = true;
      return r.fulfill({ status: 500, json: { code: "XX000" } });
    }
    return r.fulfill({ json: null });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect(events).toHaveLength(0);
  const state = emptyState(
    [
      ...new Map(
        importCsv(readFileSync("public/fragen.csv", "utf8")).questions.map(
          (q) => [q.knowledgeId, q],
        ),
      ).values(),
    ].slice(0, 3),
  );
  state.settings.roundSetup = {
    mode: "ueben",
    genres: null,
    categories: [],
    difficulties: ["leicht", "mittel", "schwer", "experte"],
  };
  await page.evaluate(async (state) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("wissensquiz");
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("state", "readwrite");
        tx.objectStore("state").put(state, "current");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, state);
  await page.reload();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect.poll(() => events.length).toBe(1);
  const privateRoundId = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const req = indexedDB.open("wissensquiz");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const read = db
            .transaction("state")
            .objectStore("state")
            .get("current");
          read.onsuccess = () => {
            db.close();
            resolve(
              read.result.rounds.find(
                (r: { status: string }) => r.status === "active",
              ).id,
            );
          };
          read.onerror = () => reject(read.error);
        };
      }),
  );
  expect(events[0].event_id).not.toBe(privateRoundId);
  await page.reload();
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toBeEnabled();
  await expect.poll(() => events.length).toBe(2);
  expect(events[0]).toEqual(events[1]);
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  for (let i = 0; i < 5; i++) {
    await page
      .getByRole("button", { name: "Keine Ahnung", exact: true })
      .click();
    await expect(page.locator(".solution-reveal")).toBeVisible();
    await page.clock.runFor(1200);
    await expect
      .poll(async () => {
        await page.clock.runFor(100);
        return page.locator(".solution-reveal").count();
      })
      .toBe(0);
    await page
      .getByRole("button", {
        name: i === 4 ? "Runde abschließen" : "Nächste Frage",
      })
      .click();
  }
  await expect.poll(() => events.length).toBe(3);
  expect(events[2]).toMatchObject({
    event_id: events[0].event_id,
    event_kind: "completed",
    answers: 5,
    hits: 0,
  });
  expect(Object.keys(events[2]).sort()).toEqual(
    ["event_id", "event_kind", "happened_at", "answers", "hits"].sort(),
  );
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  expect(events).toHaveLength(3);
  await login(page);
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(page.locator(".question-card")).toBeVisible();
  expect(events).toHaveLength(3);
});
test("eine alte Kontokarriere wird nach dem Anmelden automatisch einmal gesichert und beim Neuladen erhalten", async ({
  page,
}) => {
  const time = new Date("2026-10-02T12:00:00+02:00");
  await page.clock.install({ time });
  const state = emptyState(
    importCsv(readFileSync("public/horror-fragen.csv", "utf8")).questions.slice(
      0,
      1,
    ),
  );
  for (let i = 0; i < 19; i++) {
    const at = time.getTime() - 60000 + i * 100;
    const r = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      at,
    );
    const q = r.questions[0];
    answer(
      state,
      r.id,
      q.id,
      q.answers.find((a) => a.id !== q.correctId)!.id,
      1000,
      at + 1,
    );
    complete(state, r.id, at + 2);
  }
  delete state.career;
  state.experience = 190;
  const server: Server = new Map([
    [alice, { state, revision: 7, updated_at: time.toISOString() }],
  ]);
  const requests = await mockAccounts(page, server);
  await page.goto("/");
  await login(page);
  await expect.poll(() => server.get(alice)?.revision).toBe(8);
  const saved = requests.find((request) =>
    request.path.endsWith("quiz_save_state"),
  )?.body.payload;
  expect(saved).toMatchObject({
    career: { version: 1, legacyBonus: 234 },
    experience: 235,
    storageFormat: "quiz-cloud-compact-v2",
  });
  await expect(page.getByRole("main")).toContainText("Level 2 · Kinogänger");
  await page.reload();
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await account(page);
  await expect(page.getByRole("main")).toContainText("235 XP insgesamt");
  await expect(page.locator(".profile-sync-status")).toHaveText(
    "Spielstand online gespeichert",
  );
  expect(server.get(alice)?.revision).toBe(8);
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
    if (path.endsWith("/quiz_sync_metadata"))
      return route.fulfill({
        status: 404,
        json: {
          code: "PGRST202",
          message: "Legacy fixture has no entry protocol",
        },
      });
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

test("Profil zeigt Statistik; Highscores sind direkt erreichbar und Konten nehmen automatisch teil", async ({
  page,
}) => {
  const state = emptyState(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions,
  );
  const round = startRound(
    state,
    { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1700000000000,
  );
  for (const q of round.questions)
    answer(state, round.id, q.id, q.correctId, 1000, 1700000001000);
  complete(state, round.id, 1700000010000);
  startRound(
    state,
    { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1700000020000,
  );
  const server: Server = new Map([
    [alice, { state, revision: 1, updated_at: new Date().toISOString() }],
  ]);
  await mockAccounts(page, server);
  let participating = true;
  const changes: boolean[] = [];
  const category = {
    category: "scifi-5",
    genres: ["Science-Fiction"],
    difficulties: [`historisch:${round.difficulty}`],
    topic: "Alle Themen",
    question_count: 5,
    rule_version: round.ruleVersion,
  };
  await page.route("**/rest/v1/quiz_sharing*", (r) =>
    r.fulfill({ json: { enabled: participating } }),
  );
  await page.route("**/rest/v1/rpc/quiz_set_sharing", (r) => {
    const body = r.request().postDataJSON();
    expect(body.expected_owner).toBe(alice);
    participating = body.participate;
    changes.push(participating);
    return r.fulfill({ json: participating });
  });
  await page.route("**/rest/v1/rpc/quiz_record_categories", (r) =>
    r.fulfill({
      json: [
        { ...category, category: "horror-5", genres: ["Horror"] },
        { ...category, category: "scifi-other-rule", rule_version: "other" },
        category,
      ],
    }),
  );
  const playerQueries: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/rpc/quiz_players", (r) => {
    playerQueries.push(r.request().postDataJSON());
    return r.fulfill({
      json: [
        {
          player_name: "Bob",
          completed: 12,
          answered: 100,
          correct: 85,
          accuracy: 85,
          place: 1,
          is_mine: false,
          experience: 2950,
        },
      ],
    });
  });
  await page.route("**/rest/v1/rpc/quiz_record_runs", (r) =>
    r.fulfill({
      json: [
        {
          player_name: "Bob",
          points: 750,
          correct: 5,
          answers: 5,
          elapsed_ms: 25000,
          finished_at: 1700000010000,
          place: 1,
          is_mine: false,
          experience: 2950,
        },
        ...(participating
          ? [
              {
                player_name: "Alice",
                points: 700,
                correct: 5,
                answers: 5,
                elapsed_ms: 50000,
                finished_at: 1700000010000,
                place: 2,
                is_mine: true,
                experience: 0,
              },
            ]
          : []),
      ],
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await login(page, "alice@example.test", true);
  await expect(page.locator(".topbar")).toHaveCount(0);
  await expect(page.locator(".sync-status")).toHaveCount(0);
  await account(page);
  await expect(page.locator(".profile-sync-status")).toHaveText(
    "Spielstand online gespeichert",
  );
  for (const [label, value] of [
    ["Runden gespielt", "2"],
    ["Runden abgeschlossen", "1"],
    ["Fragen beantwortet", "5"],
    ["Trefferquote", "100 %"],
    ["Rekordrunden abgeschlossen", "1"],
  ]) {
    await expect(
      page
        .locator(".profile-stats > div")
        .filter({ has: page.getByText(label, { exact: true }) })
        .locator("dd"),
    ).toHaveText(value);
  }
  await expect(
    page.getByRole("button", { name: "Abmelden", exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByLabel("Meine Ergebnisse und Spielerstatistik teilen"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Spielervergleich", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Meine Läufe", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(playerQueries).toEqual([]);
  await comparePlayers(page);
  await expect
    .poll(() => playerQueries.at(-1))
    .toMatchObject({ sort_by: "experience" });
  await compareRecords(page);
  await page
    .getByLabel("Gemeinsame Vergleichskategorie", { exact: true })
    .selectOption(category.category);
  await expect(page.getByText("Platz 1 · Bob", { exact: true })).toBeVisible();
  await expect(
    page.locator(".leaderboard-list .career-badge").first(),
  ).toContainText("Level 10 · Cineast");
  await expect(
    page.getByText("Platz 2 · Alice · Du", { exact: true }),
  ).toBeVisible();
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
    path: "test-results/rekordvergleich-320.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Meine Läufe", exact: true }).click();
  await expect(page.locator(".leaderboard-entry strong")).toHaveText(
    "Platz 1 · 790 Punkte",
  );
  expect(changes).toEqual([]);
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
  await page.screenshot({ path: "test-results/highscores-320.png" });
  await comparePlayers(page);
  await comparePlayers(page);
  await expect(
    page.getByText(
      "12 Runden · 85 von 100 Antworten richtig · 85 % Trefferquote",
    ),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/spielervergleich-320.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Trefferquote", exact: true }).click();
  await page.getByText("Vergleich eingrenzen", { exact: true }).click();
  await page
    .getByLabel("Spielerwertung Genre", { exact: true })
    .selectOption("Horror");
  await page
    .getByLabel("Spielerwertung Schwierigkeit", { exact: true })
    .selectOption("mittel");
  await expect
    .poll(() => playerQueries.at(-1))
    .toMatchObject({
      sort_by: "accuracy",
      selected_genre: "Horror",
      selected_difficulty: "mittel",
      page_offset: 0,
    });
  await page.getByRole("button", { name: "Level & XP", exact: true }).click();
  await expect
    .poll(() => playerQueries.at(-1))
    .toMatchObject({
      sort_by: "experience",
      selected_genre: "",
      selected_difficulty: "",
      page_offset: 0,
    });
  await expect(
    page.getByRole("list", { name: "Spielerrangliste" }),
  ).toContainText("Level 10 · Cineast");
  await expect(
    page.getByRole("list", { name: "Spielerrangliste" }),
  ).toContainText("2.950 XP insgesamt");
  await expect(
    page.getByLabel("Spielerwertung Genre", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/filmkarriere-highscores-320.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Trefferquote", exact: true }).click();
  await page
    .getByText("Vergleich eingrenzen (Filter aktiv)", { exact: true })
    .click();
  await expect(
    page.getByLabel("Spielerwertung Genre", { exact: true }),
  ).toHaveValue("Horror");
  await expect(
    page.getByLabel("Spielerwertung Schwierigkeit", { exact: true }),
  ).toHaveValue("mittel");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await compareRecords(page);
  await page.route("**/rest/v1/rpc/quiz_record_runs", (r) =>
    r.fulfill({ status: 503, json: { message: "offline" } }),
  );
  await page.getByRole("button", { name: "Rangliste erneut laden" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Ergebnisse konnten nicht" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Meine Läufe", exact: true }).click();
  await expect(page.locator(".leaderboard-entry strong")).toHaveText(
    "Platz 1 · 790 Punkte",
  );
});
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
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await login(page);
  await openRoundSetup(page);
  await page.getByRole("button", { name: "Alle Genres abwählen" }).click();
  await openRoundSetup(page);
  await page
    .getByRole("group", { name: "Filmgenres", exact: true })
    .getByLabel("Horror", { exact: true })
    .check();
  await page.getByLabel("Nur Classics", { exact: true }).check();
  await page.getByRole("button", { name: "Losspielen" }).click();
  await expect(
    page.locator(".sync-indicator .sync-symbol.saved"),
  ).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/rest/v1/rpc/quiz_save_state", async (r) => {
    await gate;
    await r.abort();
  });
  await page.locator(".answer").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(
    page.locator(".sync-indicator .sync-symbol.saving"),
  ).toBeVisible();
  const geometry = () =>
    page.evaluate(() => ({
      cardTop: document.querySelector(".question-card")!.getBoundingClientRect()
        .top,
      indicator: document
        .querySelector(".sync-toggle")!
        .getBoundingClientRect()
        .toJSON(),
      scrollY,
    }));
  const before = await geometry();
  release();
  await expect(
    page.locator(".sync-indicator .sync-symbol.offline"),
  ).toBeVisible();
  expect(await geometry()).toEqual(before);
  await expect(page.locator(".sync-status")).toHaveCount(0);
  // A genuine connection event must not add a second shifting header either.
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    window.dispatchEvent(new Event("offline"));
  });
  await expect(page.locator(".topbar")).toHaveCount(0);
  expect(await geometry()).toEqual(before);
  await page.getByRole("button", { name: /^Online-Speicherung:/ }).click();
  await expect(page.locator(".sync-popover")).toContainText(
    "Noch nicht online gespeichert",
  );
  expect(await geometry()).toEqual(before);
  await page.screenshot({ path: "test-results/sync-status-320.png" });
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await page.unroute("**/rest/v1/rpc/quiz_save_state");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    window.dispatchEvent(new Event("online"));
  });
  await expect(
    page.locator(".sync-indicator .sync-symbol.saved"),
  ).toBeVisible();
  expect(await geometry()).toEqual(before);
  await page.setViewportSize({ width: 1280, height: 800 });
  await account(page);
  await expect(page.locator(".profile-sync-status")).toHaveText(
    "Spielstand online gespeichert",
  );
  await page.getByRole("button", { name: "Spielen", exact: true }).click();
  await page.getByRole("button", { name: "Fortsetzen" }).click();
  const otherContext = await browser.newContext({
    serviceWorkers: "block",
    baseURL: testBaseUrl,
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
    await openRoundSetup(other);
    await expect(
      other
        .getByRole("group", { name: "Filmgenres", exact: true })
        .locator("input:checked"),
    ).toHaveCount(1);
    await expect(
      other
        .getByRole("group", { name: "Filmgenres", exact: true })
        .getByLabel("Horror", { exact: true }),
    ).toBeChecked();
    await expect(
      other.getByLabel("Nur Classics", { exact: true }),
    ).toBeChecked();
    await other.getByRole("button", { name: "Fortsetzen" }).click();
    await expect(other.locator(".feedback")).toBeVisible();
    await other
      .locator(".feedback-actions")
      .getByRole("button", { name: /Weiter|Nächste/ })
      .click();
    await other.locator(".answer").first().click();
    await account(other);
    await expect(other.locator(".profile-sync-status")).toHaveText(
      "Spielstand online gespeichert",
    );
    await page
      .locator(".feedback-actions")
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
  await page.clock.install({ time: new Date("2026-10-04T12:00:00+02:00") });
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
  await page.getByText("Konto & Speicherung", { exact: true }).click();
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
  await page.getByText("Konto & Speicherung", { exact: true }).click();
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

test("Ranglisten beenden hängende Anfragen und lassen sich erneut laden", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-26T12:00:00+02:00") });
  await mockAccounts(page);
  let hangCategories = true,
    hangEntries = true,
    hangPlayers = true;
  const category = {
    category: "scifi-5",
    genres: ["Science-Fiction"],
    difficulties: ["leicht"],
    topic: "Alle Themen",
    question_count: 5,
    rule_version: "1",
  };
  await page.route("**/rest/v1/rpc/quiz_record_categories", (r) => {
    if (!hangCategories) return r.fulfill({ json: [category] });
  });
  await page.route("**/rest/v1/rpc/quiz_record_runs", (r) => {
    if (!hangEntries) return r.fulfill({ json: [] });
  });
  await page.route("**/rest/v1/rpc/quiz_players", (r) => {
    if (!hangPlayers) return r.fulfill({ json: [] });
  });
  await page.goto("/");
  await login(page);
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await comparePlayers(page);
  await compareRecords(page);
  await expect(page.getByText("Rekordläufe werden geladen …")).toBeVisible();
  await page.clock.runFor(10001);
  await expect(
    page.getByText(/Die Ergebnisse konnten nicht geladen werden/),
  ).toBeVisible();
  hangCategories = false;
  await page.getByRole("button", { name: "Rangliste erneut laden" }).click();
  await expect(page.getByLabel("Gemeinsame Vergleichskategorie")).toBeVisible();
  await page.clock.runFor(10001);
  await expect(
    page.getByText(/Die Ergebnisse konnten nicht geladen werden/),
  ).toBeVisible();
  hangEntries = false;
  await page.getByRole("button", { name: "Rangliste erneut laden" }).click();
  await expect(
    page.getByText("Noch keine abgeschlossenen Läufe in dieser Auswahl."),
  ).toBeVisible();
  await comparePlayers(page);
  await expect(page.getByText("Spielerwerte werden geladen …")).toBeVisible();
  await page.clock.runFor(10001);
  await expect(
    page.getByText(
      "Das Laden der Spielerrangliste dauert zu lange. Bitte versuche es erneut.",
    ),
  ).toBeVisible();
  hangPlayers = false;
  await page
    .getByRole("button", { name: "Erneut versuchen", exact: true })
    .click();
  await expect(
    page.getByText(
      "Es wurden keine Spieler gefunden. Bitte aktualisiere die Rangliste.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /teilen/ })).toHaveCount(0);
});

test("das eigene Konto ist allein und ohne Runden sichtbar; Quote und Filter erklären fehlende Ergebnisse", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-02T10:00:00+02:00") });
  await mockAccounts(page);
  await page.route("**/rest/v1/rpc/quiz_players", (route) => {
    const query = route.request().postDataJSON();
    return route.fulfill({
      json:
        query.sort_by === "accuracy" || query.selected_genre
          ? []
          : [
              {
                player_name: "Alice",
                completed: 0,
                answered: 0,
                correct: 0,
                accuracy: null,
                place: 1,
                is_mine: true,
                experience: 0,
              },
            ],
    });
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await login(page);
  await page.getByRole("button", { name: "Highscores", exact: true }).click();
  await comparePlayers(page);
  await expect(page.getByText("Platz 1 · Alice (Du)")).toBeVisible();
  await expect(
    page.getByText("Du bist bisher der einzige Spieler in dieser Auswahl."),
  ).toBeVisible();
  await expect(page.getByText(/Dein Konto ist schon dabei/)).toBeVisible();
  await expect(
    page.getByText(/0 Runden · 0 von 0 Antworten richtig/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Trefferquote", exact: true }).click();
  await expect(
    page.getByText(/Für die Trefferquote braucht es mindestens 50/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Richtige Antworten", exact: true })
    .click();
  await expect(page.getByText("Platz 1 · Alice (Du)")).toBeVisible();
  await page.getByText("Vergleich eingrenzen", { exact: true }).click();
  await page.getByLabel("Spielerwertung Genre").selectOption("Science-Fiction");
  await expect(
    page.getByText(/Noch keine abgeschlossenen Runden für diese Auswahl/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Filter zurücksetzen", exact: true })
    .click();
  await expect(page.getByText("Platz 1 · Alice (Du)")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: "test-results/player-ranking-own-mobile.png",
    fullPage: true,
  });
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

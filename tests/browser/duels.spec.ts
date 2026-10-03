import { openRoundSetup, test, expect, type Page } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
test.use({ serviceWorkers: "block" });
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222";
const qs = importCsv(readFileSync("public/fragen.csv", "utf8")).questions;
const user = (id: string) => ({
  id,
  aud: "authenticated",
  role: "authenticated",
  email: `${id === alice ? "alice" : "bob"}@example.test`,
  email_confirmed_at: "2026-09-26T10:00:00Z",
  created_at: "2026-09-26T10:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { display_name: id === alice ? "Alice" : "Bob" },
});
const session = (id: string) => ({
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
  refresh_token: "test-refresh",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 2000000000,
  user: user(id),
});
async function server() {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;insert into auth.users values('${alice}',now(),false,'{"display_name":"Alice"}'),('${bob}',now(),false,'{"display_name":"Bob"}');`,
  );
  await db.exec(
    readFileSync("supabase/migrations/202609260001_quiz_accounts.sql", "utf8"),
  );
  await db.exec(
    readFileSync("supabase/migrations/202610020005_async_duels.sql", "utf8"),
  );
  for (const q of qs)
    await db.query(
      "insert into quiz_duel_catalog(id,knowledge_id,difficulty,genre,familiarity,question) values($1,$2,$3,'Science-Fiction',2,$4)",
      [q.id, q.knowledgeId, q.difficulty, q],
    );
  const saves = new Map<string, unknown>();
  let tail = Promise.resolve();
  async function setup(page: Page, id: string) {
    await page.clock.install({ time: new Date("2026-10-02T12:00:00Z") });
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
      const path = new URL(route.request().url()).pathname,
        body = route.request().postDataJSON() ?? {};
      if (path.endsWith("/token")) return route.fulfill({ json: session(id) });
      if (path.endsWith("/user")) return route.fulfill({ json: user(id) });
      if (path.endsWith("/quiz_saves"))
        return route.fulfill({ json: saves.has(id) ? [saves.get(id)] : [] });
      if (path.endsWith("/quiz_save_state")) {
        const revision = Number(body.expected_revision) + 1;
        saves.set(id, {
          state: body.payload,
          revision,
          updated_at: new Date().toISOString(),
        });
        return route.fulfill({ json: revision });
      }
      const name = path.split("/").at(-1)!;
      if (!name.startsWith("quiz_duel_")) return route.fulfill({ json: [] });
      const execute = tail.then(async () => {
        await db.exec(
          `set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`,
        );
        try {
          const entries = Object.entries(body);
          const params = entries
            .map(([key], i) => `${key}=>$${i + 1}`)
            .join(",");
          return (
            await db.query<{ value: unknown }>(
              `select public.${name}(${params}) as value`,
              entries.map(([, value]) => value),
            )
          ).rows[0].value;
        } finally {
          await db.exec("reset role");
        }
      });
      tail = execute.then(
        () => undefined,
        () => undefined,
      );
      try {
        return await route.fulfill({ json: await execute });
      } catch (e) {
        return await route.fulfill({
          status: 400,
          json: {
            code: "P0001",
            message: String(e instanceof Error ? e.message : e),
          },
        });
      }
    });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Losspielen" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Profil", exact: true }).click();
    await page.getByLabel("E-Mail-Adresse").fill(user(id).email);
    await page
      .getByLabel("Passwort", { exact: true })
      .fill("nur-ein-test-passwort");
    await page.getByRole("button", { name: "Anmelden", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Spielen", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Spielen", exact: true }).click();
    await expect(
      page.getByRole("button", { name: /Duell · Gegen andere spielen/ }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: /Duell · Gegen andere spielen/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Deine Duelle" }),
    ).toBeVisible();
  }
  return { db, setup };
}
async function play(
  page: Page,
  count = 10,
  collected = false,
  guessLast = false,
) {
  for (let i = 0; i < count; i++) {
    const heading = page.locator("h1[data-question-id]");
    await expect(heading).toBeVisible();
    const id = await heading.getAttribute("data-question-id");
    const question = qs.find((q) => q.id === id)!;
    await expect(
      page.getByRole("button", {
        name: question.answers.find((a) => a.id === question.correctId)!.text,
        exact: false,
      }),
    ).toBeEnabled();
    await page
      .getByRole("button", {
        name: question.answers.find((a) => a.id === question.correctId)!.text,
        exact: false,
      })
      .click();
    if (collected) {
      await expect(
        page.getByText(
          "Antwort gespeichert. Die Lösungen siehst Du nach der Runde.",
        ),
      ).toBeVisible();
      await expect(page.getByText("Genau richtig.")).toHaveCount(0);
    } else
      await expect(
        page.getByRole("heading", { name: "Genau richtig." }),
      ).toBeVisible();
    if (guessLast && i === count - 1) {
      await page
        .getByRole("button", { name: "War geraten", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "✓ Als geraten markiert",
          exact: true,
        }),
      ).toBeDisabled();
    }
    await page
      .getByRole("button", { name: /Nächste Frage|Runde abschließen/ })
      .click();
  }
}
test("zwei getrennte Konten spielen die vier Blöcke, sehen offene Duelle und erhalten ein Unentschieden", async ({
  browser,
}, testInfo) => {
  // Two accounts complete 60 answers, including the feedback and save steps.
  test.setTimeout(180000);
  const service = await server();
  const ac = await browser.newContext({ serviceWorkers: "block" }),
    bc = await browser.newContext({ serviceWorkers: "block" });
  const a = await ac.newPage(),
    b = await bc.newPage();
  try {
    await service.setup(a, alice);
    await a.getByRole("button", { name: "Zufälligen Gegner finden" }).click();
    await play(a, 10, false, true);
    await a
      .getByRole("button", { name: "Zur Duellübersicht", exact: false })
      .click();
    await expect(a.getByText("1 von 5 Spielplätzen belegt")).toBeVisible();
    await service.setup(b, bob);
    await b.getByRole("button", { name: "Zufälligen Gegner finden" }).click();
    await play(b);
    await b
      .getByRole("button", { name: "Runde 2 vorlegen", exact: false })
      .click();
    await play(b);
    await a.getByRole("button", { name: "Aktualisieren", exact: true }).click();
    await a
      .getByRole("button", { name: "Weiterspielen", exact: false })
      .click();
    await play(a);
    await a
      .getByRole("button", { name: "Runde 3 vorlegen", exact: false })
      .click();
    await play(a);
    await b
      .getByRole("button", { name: "Zur Duellübersicht", exact: false })
      .click();
    await b.getByRole("button", { name: "Aktualisieren", exact: true }).click();
    await b
      .getByRole("button", { name: "Weiterspielen", exact: false })
      .click();
    await play(b);
    await b
      .getByRole("button", { name: "Zur Duellübersicht", exact: false })
      .click();
    await expect(b.getByText("0 von 5 Spielplätzen belegt")).toBeVisible();
    await b.getByText("Abgeschlossene Duelle (1)").click();
    await expect(b.getByText("Unentschieden.")).toBeVisible();
    await expect(b.getByText("30 : 30", { exact: true })).toBeVisible();
    expect((await new AxeBuilder({ page: b }).analyze()).violations).toEqual(
      [],
    );
    await b.setViewportSize({ width: 320, height: 740 });
    expect(
      await b.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await b.screenshot({
      path: testInfo.outputPath("duel-overview-mobile.png"),
      fullPage: true,
    });
  } finally {
    await ac.close();
    await bc.close();
    await service.db.close();
  }
});
test("gesammelte Sololösungen bleiben neutral, lassen Pausen zu und erscheinen im eigenen Rückblick", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-10-02T12:00:00Z") });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Losspielen" })).toBeEnabled();
  await openRoundSetup(page);
  await page.getByRole("button", { name: /Freies Spiel Alle Stufen/ }).click();
  await openRoundSetup(page);
  await page
    .getByRole("radio", { name: "Nach der Runde", exact: true })
    .check();
  await page.getByRole("button", { name: "Losspielen" }).click();
  for (let i = 0; i < 5; i++) {
    await expect(
      page.getByRole("button", { name: "Keine Ahnung", exact: false }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Keine Ahnung", exact: false })
      .click();
    await expect(
      page.getByText(
        "Antwort gespeichert. Die Lösungen siehst Du nach der Runde.",
      ),
    ).toBeVisible();
    await expect(page.locator(".explanation")).toHaveCount(0);
    await expect(
      page.locator(".progress-step.correct,.progress-step.wrong"),
    ).toHaveCount(0);
    if (i === 0) {
      await page.screenshot({
        path: testInfo.outputPath("collected-answer.png"),
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Pause & Startseite", exact: false })
        .click();
      await page.reload();
      await page
        .getByRole("button", { name: "Fortsetzen", exact: false })
        .click();
      await expect(
        page.getByText(
          "Antwort gespeichert. Die Lösungen siehst Du nach der Runde.",
        ),
      ).toBeVisible();
    }
    await page
      .getByRole("button", {
        name: i === 4 ? "Runde abschließen" : "Nächste Frage",
        exact: false,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Dein Rundenrückblick" }),
  ).toBeVisible();
  await page.locator(".review details summary").first().click();
  await expect(page.locator(".review .explanation").first()).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("gesammelte Duelllösungen, Einladungslink und Wiederaufnahme erhalten den Servertimer", async ({
  browser,
}, testInfo) => {
  test.setTimeout(90000);
  const service = await server();
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 320, height: 740 },
  });
  const page = await context.newPage();
  try {
    await service.setup(page, alice);
    await openRoundSetup(page);
    await page
      .getByRole("radio", { name: "Nach der Runde", exact: true })
      .check();
    await page
      .getByRole("button", { name: "Per Link einladen", exact: true })
      .click();
    await play(page, 1, true);
    await expect(page.locator(".answer").first()).toBeEnabled();
    await page
      .getByRole("button", { name: "Pause & Duellübersicht", exact: false })
      .click();
    const duel = (
      await service.db.query<{ id: string }>(
        "select id from quiz_duels where creator=$1 and status='preparing'",
        [alice],
      )
    ).rows[0].id;
    await service.db.query(
      "update quiz_duel_answers set started_at=clock_timestamp()-interval '31 seconds' where duel_id=$1 and question_no=1",
      [duel],
    );
    await page.reload();
    await expect(
      page.getByRole("button", { name: /Duell · Gegen andere spielen/ }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: /Duell · Gegen andere spielen/ })
      .click();
    await page
      .getByRole("button", { name: "Weiterspielen", exact: false })
      .click();
    await expect(
      page.getByText(
        "Antwort gespeichert. Die Lösungen siehst Du nach der Runde.",
      ),
    ).toBeVisible();
    await expect(
      page.locator(".progress-step.correct,.progress-step.wrong"),
    ).toHaveCount(0);
    await expect(page.locator(".explanation")).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("collected-duel-mobile.png"),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Nächste Frage", exact: false })
      .click();
    await play(page, 8, true);
    await expect(page.locator(".result-score")).toContainText("9");
    await page
      .getByRole("button", { name: "Zur Duellübersicht", exact: false })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Einladungslink kopieren",
        exact: true,
      }),
    ).toBeVisible();
    const row = (
      await service.db.query<{ token: string }>(
        "select token from quiz_duels where id=$1",
        [duel],
      )
    ).rows[0];
    const second = await browser.newContext({ serviceWorkers: "block" });
    const other = await second.newPage();
    try {
      await service.setup(other, bob);
      await other.goto(`/#duel=${row.token}`);
      await other
        .getByRole("button", { name: "Einladung annehmen", exact: true })
        .click();
      await expect(other.getByRole("timer")).toBeVisible();
      expect(
        (
          await service.db.query<{ opponent: string }>(
            "select opponent from quiz_duels where id=$1",
            [duel],
          )
        ).rows[0].opponent,
      ).toBe(bob);
    } finally {
      await second.close();
    }
  } finally {
    await context.close();
    await service.db.close();
  }
});

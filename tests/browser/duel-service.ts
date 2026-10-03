import { expect, openRoundSetup, fixCalendarTime, type Page } from "./fixtures";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { importCsv } from "../../src/importer";
export const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222";
export const qs = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions;
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
export async function server() {
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
  async function setup(page: Page, id: string, realTimers = false) {
    if (realTimers)
      await fixCalendarTime(page, new Date("2026-10-03T12:00:00Z"));
    else await page.clock.install({ time: new Date("2026-10-02T12:00:00Z") });
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
      // This fixture intentionally models the older duel/backup backend.
      if (path.endsWith("/quiz_sync_metadata"))
        return route.fulfill({
          status: 404,
          json: {
            code: "PGRST202",
            message: "quiz_sync_metadata is absent in the legacy test service",
          },
        });
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
    await openRoundSetup(page);
    await expect(
      page.getByRole("button", { name: "Duell", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Duell", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Deine Duelle" }),
    ).toBeVisible();
  }
  return { db, setup };
}

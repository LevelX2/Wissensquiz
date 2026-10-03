import { beforeAll, afterAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { addPackages, packages } from "../src/packages";
import { emptyState, type Question } from "../src/model";
import { questionSnapshotMatches } from "../src/filmFacts";

const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222";
const state = emptyState();
addPackages(
  state,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  })),
);
const years = state.questions.filter(
  (q) =>
    q.metadata.fact_kind === "year" ||
    q.answers.every((a) => /^(18|19|20)\d{2}$/.test(a.text)),
);
let oldPack: unknown;
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 insert into auth.users values('${alice}',now(),false,'{"display_name":"Alice"}'),('${bob}',now(),false,'{"display_name":"Bob"}');`);
  await db.exec(
    readFileSync("supabase/migrations/202609260001_quiz_accounts.sql", "utf8"),
  );
  await db.exec(
    readFileSync("supabase/migrations/202610020005_async_duels.sql", "utf8"),
  );
  await db.query(
    `insert into public.quiz_duel_catalog(id,knowledge_id,difficulty,genre,familiarity,question)
 select q->>'id',q->>'knowledgeId',q->>'difficulty','Testgenre',2,q from jsonb_array_elements($1) q`,
    [years],
  );
  await db.exec(`select set_config('request.jwt.claim.sub','${bob}',false);`);
  await db.query("select public.quiz_duel_create('question',true,$1)", [
    "33333333-3333-4333-8333-333333333333",
  ]);
  oldPack = (
    await db.query<{ questions: unknown }>(
      "select questions from public.quiz_duels where creator=$1",
      [bob],
    )
  ).rows[0].questions;
  await db.exec(
    readFileSync(
      "supabase/migrations/20261003204000_balanced_year_answers.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261003205300_year_answer_ids.sql",
      "utf8",
    ),
  );
}, 30000);
afterAll(() => db.close());

it("erzeugt serverseitig für alle Jahresfragen gültige, clientlesbare Snapshots mit unveränderter Lösung", async () => {
  const result = await db.query<{ variants: Question[] }>(
    "select jsonb_agg(public.quiz_year_question(q)) as variants from jsonb_array_elements($1) q",
    [years],
  );
  expect(result.rows[0].variants).toHaveLength(550);
  for (const [i, q] of result.rows[0].variants.entries()) {
    expect(questionSnapshotMatches(years[i], q)).toBe(true);
    if (!q.metadata.fact_kind)
      expect(q.answers.map((a) => a.id).sort()).toEqual(
        years[i].answers.map((a) => a.id).sort(),
      );
    expect(q.answers.find((a) => a.id === q.correctId)).toEqual(
      years[i].answers.find((a) => a.id === years[i].correctId),
    );
  }
  const other = state.questions.find(
    (q) => q.metadata.fact_kind === "director",
  )!;
  expect(
    (
      await db.query<{ q: Question }>(
        "select public.quiz_year_question($1) as q",
        [other],
      )
    ).rows[0].q,
  ).toEqual(other);
});

it("verteilt auch im Servergenerator früheste und späteste Lösungen ungefähr gleich häufig wie mittlere", async () => {
  for (const q of [
    years[0],
    years.find((q) => q.metadata.fact_kind === "year")!,
  ]) {
    const rows = (
      await db.query<{ rank: number; count: number }>(
        `with drawn as materialized (
 select public.quiz_year_question($1) q from generate_series(1,10000)), ranked as (
 select (select count(*)::integer from jsonb_array_elements(q->'answers') a where (a->>'text')::integer<
 (select (c->>'text')::integer from jsonb_array_elements(q->'answers') c where c->>'id'=q->>'correctId')) as rank from drawn)
 select rank,count(*)::integer as count from ranked group by rank order by rank`,
        [q],
      )
    ).rows;
    expect(rows.map((r) => r.rank)).toEqual([0, 1, 2, 3]);
    for (const row of rows) {
      expect(row.count).toBeGreaterThan(2300);
      expect(row.count).toBeLessThan(2700);
    }
  }
}, 15000);

it("erhält bestehende Duellsnapshots und erzeugt neue gemeinsame, idempotente Antwortsätze", async () => {
  expect(
    (
      await db.query<{ questions: unknown }>(
        "select questions from public.quiz_duels where creator=$1",
        [bob],
      )
    ).rows[0].questions,
  ).toEqual(oldPack);
  await db.exec(
    `set role authenticated;select set_config('request.jwt.claim.sub','${alice}',false);`,
  );
  const request = "44444444-4444-4444-8444-444444444444";
  await db.query("select public.quiz_duel_create('question',true,$1)", [
    request,
  ]);
  await db.exec("reset role");
  const pack = (
    await db.query<{ questions: { question: Question; order: string[] }[] }>(
      "select questions from public.quiz_duels where creator=$1",
      [alice],
    )
  ).rows[0].questions;
  expect(pack).toHaveLength(30);
  for (const item of pack) {
    const original = years.find((q) => q.id === item.question.id)!;
    expect(questionSnapshotMatches(original, item.question)).toBe(true);
    expect([...item.order].sort()).toEqual(
      item.question.answers.map((a) => a.id).sort(),
    );
  }
  await db.exec(
    `set role authenticated;select set_config('request.jwt.claim.sub','${alice}',false);`,
  );
  await db.query("select public.quiz_duel_create('question',true,$1)", [
    request,
  ]);
  await db.exec("reset role");
  expect(
    (
      await db.query<{ questions: unknown }>(
        "select questions from public.quiz_duels where creator=$1",
        [alice],
      )
    ).rows[0].questions,
  ).toEqual(pack);
});

it("hält den Helfer und private Duelltabellen für Clientrollen gesperrt", async () => {
  const rows = (
    await db.query<{
      role: string;
      helper: boolean;
      table_read: boolean;
    }>(`select r as role,
 has_function_privilege(r,'public.quiz_year_question(jsonb)','EXECUTE') as helper,
 has_table_privilege(r,'public.quiz_duels','SELECT') as table_read from unnest(array['anon','authenticated']) r`)
  ).rows;
  expect(rows).toEqual([
    { role: "anon", helper: false, table_read: false },
    { role: "authenticated", helper: false, table_read: false },
  ]);
});

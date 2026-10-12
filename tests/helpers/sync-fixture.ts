import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { CloudConflict } from "../../src/accounts";
import {
  CursorExpired,
  DownloadChanged,
  type SyncRemote,
} from "../../src/entryRemote";
import type { TestContent } from "./test-content";
import familiarity from "../../src/filmFamiliarity.json" with { type: "json" };
import { preparePresentation } from "../../src/questionPresentation";

export async function syncFixture(stopBefore?: string) {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    // Provider-only scheduler/HTTP extensions are tested in service-check.test.ts.
    .filter((f) => !f.endsWith("_daily_service_check.sql"))
    .sort()
    .filter((file) => !stopBefore || file < stopBefore))
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  // Test-only clock in the isolated DB. Production has no client clock input.
  if (!stopBefore) {
    await db.exec(`create function quiz_ranked_internal.test_clock() returns timestamptz language sql volatile as $$
      select coalesce(to_timestamp(nullif(current_setting('quiz.test_now',true),'')::double precision/1000),clock_timestamp())$$;
      do $patch$declare f record;begin
        for f in select p.oid::regprocedure as name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('quiz_ranked_internal','quiz_game_internal') and p.proname<>'test_clock'
        loop execute replace(pg_get_functiondef(f.name),'clock_timestamp()','quiz_ranked_internal.test_clock()');end loop;
      end$patch$;
      alter table quiz_ranked_internal.runs alter column created_at set default quiz_ranked_internal.test_clock();
      alter table quiz_ranked_internal.runs alter column touched_at set default quiz_ranked_internal.test_clock();
      alter table quiz_game_internal.runs alter column started_at set default quiz_ranked_internal.test_clock();
      alter table quiz_game_internal.questions alter column issued_at set default quiz_ranked_internal.test_clock();
      revoke all on function quiz_ranked_internal.test_clock() from public,anon,authenticated;`);
  }
  const argumentsByName: Record<string, string[]> = {};
  argumentsByName.quiz_save_state = [
    "payload",
    "expected_revision",
    "expected_owner",
  ];
  argumentsByName.quiz_own_record_categories = ["selected_mode"];
  argumentsByName.quiz_ranked_call = ["request_text"];
  argumentsByName.quiz_game_call = ["request_text"];
  argumentsByName.quiz_game_view = ["request_text"];
  argumentsByName.quiz_game_activate = [
    "expected_owner",
    "target_generation",
    "timezone",
  ];
  argumentsByName.quiz_game_apply = ["packet_text", "timezone"];
  argumentsByName.quiz_trial_options = [];
  argumentsByName.quiz_trial_questions = ["genre"];
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    for (const match of readFileSync(
      `supabase/migrations/${file}`,
      "utf8",
    ).matchAll(
      /create(?: or replace)? function public\.(quiz_(?:sync|duel|own_record)_\w+)\(([^)]*)\)/gi,
    ))
      argumentsByName[match[1]] = match[2]
        .split(",")
        .filter(Boolean)
        .map((arg) => arg.trim().split(/\s+/)[0]);
  }
  let writer: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>) => {
    const task = writer.catch(() => {}).then(fn);
    writer = task;
    return task;
  };
  async function seedRanked(release: TestContent) {
    await db.query(
      `insert into quiz_ranked_internal.catalog(release_hash,id,knowledge_id,difficulty,genre,source,question)
      select $1,q->>'id',q->>'knowledgeId',q->>'difficulty',coalesce(nullif(q->'metadata'->>'subdomain',''),q->>'domain'),
        case when coalesce(q->'metadata'->>'person_id','')<>'' then 'actors' when q->'tags' ? 'Preisträger' then 'awards' else 'film' end,q
      from jsonb_array_elements($2::jsonb) q on conflict do nothing`,
      [release.hash, JSON.stringify(release.questions)],
    );
    await db.query(
      "insert into quiz_ranked_internal.config(id,release_hash) values(true,$1) on conflict(id) do update set release_hash=excluded.release_hash",
      [release.hash],
    );
    if (!stopBefore) {
      await db.query(
        "update quiz_ranked_internal.config set question_count=$1 where id",
        [release.questions.length],
      );
      await db.query(
        `insert into quiz_game_internal.familiarity select value->>'film',(value->>'level')::integer from jsonb_array_elements($1::jsonb) on conflict(film) do update set level=excluded.level`,
        [JSON.stringify(familiarity.films)],
      );
      await db.exec("select quiz_game_internal.refresh_content()");
      await db.query(
        `insert into quiz_game_internal.presentations select value->>'id',value->>'version',value->>'question',value->>'context',value->'presentation' from jsonb_array_elements($1::jsonb) on conflict(id) do update set version=excluded.version,question=excluded.question,context=excluded.context,value=excluded.value`,
        [
          JSON.stringify(
            release.questions.map((q) => ({
              ...q,
              presentation: preparePresentation(q),
            })),
          ),
        ],
      );
    }
  }
  async function client(owner = crypto.randomUUID()) {
    await db.query(
      'insert into auth.users values($1,now(),false,\'{"display_name":"Synthetischer Spieler"}\') on conflict do nothing',
      [owner],
    );
    const calls: { name: string; args: Record<string, unknown> }[] = [];
    let failAfter = "",
      failBefore = "",
      hook:
        | ((name: string, args: Record<string, unknown>) => Promise<void>)
        | undefined;
    let testTime: number | undefined;
    const api: SyncRemote & {
      calls: typeof calls;
      lost(name: string): void;
      unavailable(name: string): void;
      hook(fn: typeof hook): void;
      clockAt(time: number | undefined): void;
    } = {
      calls,
      lost(name) {
        failAfter = name;
      },
      unavailable(name) {
        failBefore = name;
      },
      hook(fn) {
        hook = fn;
      },
      clockAt(time) {
        testTime = time;
      },
      stop() {},
      async call<T>(name: string, args: Record<string, unknown>) {
        calls.push({ name, args: structuredClone(args) });
        if (failBefore === name) {
          failBefore = "";
          throw new Error("Synthetische Offlinephase");
        }
        if (hook) await hook(name, args);
        const result = await serial(async () => {
          await db.exec("set role authenticated");
          await db.query(
            "select set_config('request.jwt.claim.sub',$1,false)",
            [owner],
          );
          await db.query("select set_config('quiz.test_now',$1,false)", [
            testTime === undefined ? "" : String(testTime),
          ]);
          try {
            const keys = argumentsByName[name];
            if (!keys) throw new Error(`Unbekannte Test-RPC ${name}`);
            const values = keys.map((key) => args[key]),
              params = keys.map((_, i) => `$${i + 1}`).join(",");
            return (
              await db.query<{ result: T }>(
                name === "quiz_own_record_categories"
                  ? `select coalesce(jsonb_agg(t),'[]') as result from public.${name}(${params}) t`
                  : `select public.${name}(${params}) as result`,
                values,
              )
            ).rows[0].result;
          } catch (error) {
            const message = (error as Error).message;
            if (/revision_conflict|generation_mismatch/.test(message))
              throw new CloudConflict();
            if (message.includes("download_changed"))
              throw new DownloadChanged();
            if (message.includes("cursor_expired")) throw new CursorExpired();
            if (process.env.SYNC_TEST_DEBUG)
              process.stderr.write(message + "\n");
            throw error;
          } finally {
            await db.exec("reset role");
          }
        });
        if (failAfter === name) {
          failAfter = "";
          throw new Error("Server hat gespeichert, Bestätigung verloren");
        }
        return result;
      },
    };
    return { owner, api };
  }
  const admin = <T>(fn: () => Promise<T>) =>
    serial(async () => {
      await db.exec("reset role");
      return fn();
    });
  return { db, seedRanked, client, admin };
}

import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
beforeAll(async () => {
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  for (const file of [
    "202609260001_quiz_accounts.sql",
    "202609260002_shared_records.sql",
    "202609260003_player_rankings.sql",
    "202609260004_automatic_rankings.sql",
    "202610020004_film_career.sql",
    "202610030001_public_leaderboard_guest_activity.sql",
  ])
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
}, 30000);
afterAll(() => db.close());
async function as(role: "anon" | "authenticated", fn: () => Promise<void>) {
  await db.exec(`set role ${role}`);
  try {
    await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function denied(query: () => Promise<unknown>, pattern: RegExp) {
  await db.exec("savepoint rejected_call");
  try {
    await expect(query()).rejects.toThrow(pattern);
  } finally {
    await db.exec("rollback to rejected_call; release rejected_call");
  }
}
const report = (
  kind = "started",
  answers = 0,
  hits = 0,
  at = "now()",
  id = "11111111-1111-4111-8111-111111111111",
) =>
  db.query(`select quiz_report_guest_activity($1,$2,${at},$3,$4)`, [
    id,
    kind,
    answers,
    hits,
  ]);

it("zählt idempotente Gaststarts und Abschlüsse an deutschen Kalendertagen und gibt nur sieben Tagessummen frei", async () => {
  await db.exec("begin");
  try {
    await db.exec(
      "update quiz_guest_activity_config set collection_started_at=now()-interval '10 days'",
    );
    await as("anon", async () => {
      await report();
      await report();
      await report("completed", 5, 3);
      await report("completed", 10, 8); // Existing receipt is immutable.
      await report(
        "started",
        0,
        0,
        "((now() at time zone 'Europe/Berlin')::date::timestamp at time zone 'Europe/Berlin')-interval '1 second'",
        "22222222-2222-4222-8222-222222222222",
      );
      const rows = (
        await db.query<Record<string, unknown>>(
          "select * from quiz_guest_activity()",
        )
      ).rows;
      expect(rows).toHaveLength(7);
      expect(rows[0]).toMatchObject({
        started: 1,
        completed: 1,
        answered: 5,
        correct: 3,
      });
      expect(rows[1]).toMatchObject({ started: 1, completed: 0, answered: 0 });
      expect(Object.keys(rows[0])).toEqual([
        "activity_day",
        "started",
        "completed",
        "answered",
        "correct",
        "collection_started_at",
      ]);
      await denied(
        () => db.query("select * from quiz_guest_activity_events"),
        /permission denied/,
      );
      await denied(
        () => db.query("select * from quiz_guest_activity_config"),
        /permission denied/,
      );
      await denied(
        () =>
          db.query(
            "insert into quiz_guest_activity_events values(gen_random_uuid(),'started',now(),0,0)",
          ),
        /permission denied/,
      );
    });
    await as("authenticated", async () => {
      expect(
        (await db.query("select * from quiz_guest_activity()")).rows,
      ).toHaveLength(7);
      await denied(() => report(), /permission denied/);
    });
    await db.query(
      "select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false)",
    );
    await as("anon", async () => {
      await denied(() => report(), /guest_only/);
    });
    await db.query("select set_config('request.jwt.claim.sub','',false)");
  } finally {
    await db.exec("rollback");
  }
});

it("weist ungültige Meldungen ab, zählt keine Historie vor Erfassungsbeginn und bereinigt abgelaufene Belege", async () => {
  await db.exec("begin");
  try {
    await as("anon", async () => {
      for (const args of [
        ["other", 0, 0, "now()"],
        ["started", 1, 0, "now()"],
        ["completed", 5, 6, "now()"],
        ["completed", 101, 0, "now()"],
        ["started", 0, 0, "now()-interval '8 days'"],
        ["started", 0, 0, "now()+interval '6 minutes'"],
      ] as const)
        await denied(
          () => report(args[0], args[1], args[2], args[3]),
          /invalid_activity/,
        );
      await report("started", 0, 0, "now()-interval '1 day'");
      expect(
        (
          await db.query(
            "select sum(started)::bigint as starts from quiz_guest_activity()",
          )
        ).rows[0],
      ).toEqual({ starts: 0 });
    });
    await db.exec(
      "insert into quiz_guest_activity_events values(gen_random_uuid(),'started',now()-interval '9 days',0,0)",
    );
    await as("anon", async () => {
      await report();
    });
    expect(
      (
        await db.query(
          "select count(*) as count from quiz_guest_activity_events",
        )
      ).rows[0],
    ).toEqual({ count: 1 });
  } finally {
    await db.exec("rollback");
  }
});

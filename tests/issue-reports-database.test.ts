import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const hash = "a".repeat(64);
const uuid = (n: number) =>
  `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values('${owner}'),('${other}');`);
  await db.exec(
    readFileSync(
      "supabase/migrations/20261004161423_quiz_issue_reporting.sql",
      "utf8",
    ),
  );
}, 30000);
afterAll(() => db.close());
async function as(role: string, callback: () => Promise<void>) {
  await db.exec(`set role ${role}`);
  try {
    await callback();
  } finally {
    await db.exec("reset role");
  }
}
const begin = async (n: number, player = owner, digest = hash) =>
  (
    await db.query<{ value: { action: string; number?: number } }>(
      "select public.quiz_issue_begin($1,$2,$3) as value",
      [player, uuid(n), digest],
    )
  ).rows[0].value;
const finish = (
  n: number,
  state: string,
  number: number | null = null,
  url: string | null = null,
  player = owner,
) =>
  db.query("select public.quiz_issue_finish($1,$2,$3,$4,$5)", [
    player,
    uuid(n),
    state,
    number,
    url,
  ]);
const age = (n: number) =>
  db.query(
    "update quiz_reporting.submissions set created_at = now() - interval '2 minutes', updated_at = now() - interval '2 minutes' where id=$1",
    [uuid(n)],
  );
it("sperrt Tabellen und beide RPCs für öffentliche und angemeldete Browser; erlaubt nur die Serverrolle", async () => {
  for (const role of ["anon", "authenticated"])
    await as(role, async () => {
      await expect(begin(1)).rejects.toThrow(/permission denied/);
      await expect(finish(1, "failed")).rejects.toThrow(/permission denied/);
      await expect(
        db.query("select * from quiz_reporting.submissions"),
      ).rejects.toThrow(/permission denied/);
    });
  expect(
    (
      await db.query<{ relrowsecurity: boolean }>(
        "select relrowsecurity from pg_class where oid='quiz_reporting.submissions'::regclass",
      )
    ).rows[0].relrowsecurity,
  ).toBe(true);
  await as("service_role", async () => {
    expect((await begin(1)).action).toBe("send");
  });
});
it("reserviert eine Meldung genau einmal und weist geänderten Inhalt oder fremde Eigentümer zurück", async () => {
  await as("service_role", async () => {
    expect((await begin(1)).action).toBe("pending");
    await expect(begin(1, owner, "b".repeat(64))).rejects.toThrow(
      "report_changed",
    );
    await expect(begin(1, other)).rejects.toThrow("report_changed");
    await finish(
      1,
      "sent",
      42,
      "https://github.com/LevelX2/Wissensquiz/issues/42",
    );
    expect(await begin(1)).toMatchObject({ action: "sent", number: 42 });
    await finish(1, "failed");
    expect((await begin(1)).action).toBe("sent");
  });
});
it("erlaubt nach endgültigem Fehler denselben Versand; ungeklärte oder verwaiste Versuche nur als Abgleich", async () => {
  await age(1);
  await as("service_role", async () => {
    await begin(2);
    await finish(2, "failed");
  });
  await age(2);
  await as("service_role", async () => {
    expect((await begin(2)).action).toBe("send");
    await finish(2, "uncertain");
  });
  await age(2);
  await as("service_role", async () => {
    expect((await begin(2)).action).toBe("reconcile");
  });
  await age(2);
  await as("service_role", async () => {
    await begin(3);
  });
  await age(3);
  await as("service_role", async () => {
    expect((await begin(3)).action).toBe("reconcile");
  });
});
it("begrenzt Meldungen auf eine pro Minute und fünf in 24 Stunden, unabhängig von anderen Konten", async () => {
  await as("service_role", async () => {
    await expect(begin(4)).rejects.toThrow("rate_limited");
  });
  await age(3);
  await as("service_role", async () => {
    expect((await begin(4)).action).toBe("send");
  });
  await age(4);
  await as("service_role", async () => {
    expect((await begin(5)).action).toBe("send");
  });
  await age(5);
  await as("service_role", async () => {
    await expect(begin(6)).rejects.toThrow("rate_limited");
    expect((await begin(6, other)).action).toBe("send");
  });
});
it("akzeptiert nur bestätigte Issue-Adressen des festgelegten Repositorys und löscht beim Kontolöschen private Belege", async () => {
  await as("service_role", async () => {
    await expect(
      finish(6, "sent", 42, "https://evil.example", other),
    ).rejects.toThrow(/check constraint/);
  });
  await db.query("delete from auth.users where id=$1", [other]);
  expect(
    (
      await db.query(
        "select * from quiz_reporting.submissions where owner_id=$1",
        [other],
      )
    ).rows,
  ).toEqual([]);
});

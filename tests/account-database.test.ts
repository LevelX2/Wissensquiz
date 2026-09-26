import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  unverified = "33333333-3333-4333-8333-333333333333";
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    insert into auth.users values('${alice}',now(),false),('${bob}',now(),false),('${unverified}',null,false);`);
  await db.exec(
    readFileSync("supabase/migrations/202609260001_quiz_accounts.sql", "utf8"),
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
async function as(id: string, fn: () => Promise<void>, role = "authenticated") {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [id]);
  try {
    await fn();
  } finally {
    await db.exec("reset role");
  }
}
const save = (revision: number, value = "alice", owner = alice) =>
  db.query<{ quiz_save_state: number }>(
    "select public.quiz_save_state($1::jsonb,$2::bigint,$3::uuid)",
    [JSON.stringify({ schemaVersion: 1, value }), revision, owner],
  );
it("erzwingt bestätigte Identität, private Zeilen und unveränderliche Eigentümerschaft serverseitig", async () => {
  await as(
    "",
    async () => {
      await expect(save(0)).rejects.toThrow(/permission denied/);
      await expect(db.query("select * from public.quiz_saves")).rejects.toThrow(
        /permission denied/,
      );
    },
    "anon",
  );
  await as(unverified, async () => {
    await expect(save(0)).rejects.toThrow(/verified_account_required/);
    expect((await db.query("select * from public.quiz_saves")).rows).toEqual(
      [],
    );
  });
  await as(alice, async () => {
    expect((await save(0)).rows[0].quiz_save_state).toBe(1);
    expect(
      (await db.query("select owner_id from public.quiz_saves")).rows,
    ).toEqual([{ owner_id: alice }]);
    await expect(
      db.query(`update public.quiz_saves set owner_id='${bob}'`),
    ).rejects.toThrow(/permission denied/);
    await expect(db.query(`delete from public.quiz_saves`)).rejects.toThrow(
      /permission denied/,
    );
  });
  await as(bob, async () => {
    expect((await db.query("select * from public.quiz_saves")).rows).toEqual(
      [],
    );
    await expect(save(0, "alice", alice)).rejects.toThrow(/account_changed/);
    await save(0, "bob", bob);
  });
  await as(alice, async () => {
    expect(
      (
        await db.query<{ state: { value: string } }>(
          "select state from public.quiz_saves",
        )
      ).rows[0].state.value,
    ).toBe("alice");
  });
});
it("weist veraltete Revisionen zurück und behält beide privaten Spielstände", async () => {
  await as(alice, async () => {
    await expect(save(0, "stale")).rejects.toThrow(/revision_conflict/);
    expect((await save(1, "new")).rows[0].quiz_save_state).toBe(2);
    await expect(
      db.query("select public.quiz_save_state(null,2,$1::uuid)", [alice]),
    ).rejects.toThrow(/invalid_state/);
    await expect(
      db.query("select public.quiz_save_state('{}',2,$1::uuid)", [alice]),
    ).rejects.toThrow(/invalid_state/);
  });
  await as(bob, async () => {
    expect(
      (
        await db.query<{ state: { value: string } }>(
          "select state from public.quiz_saves",
        )
      ).rows[0].state.value,
    ).toBe("bob");
  });
});
it("sperrt einen ehemals bestätigten Benutzer auch mit bestehender Sitzung nach Entzug der Bestätigung", async () => {
  await db.query("update auth.users set email_confirmed_at=null where id=$1", [
    alice,
  ]);
  await as(alice, async () => {
    expect((await db.query("select * from public.quiz_saves")).rows).toEqual(
      [],
    );
    await expect(save(2)).rejects.toThrow(/verified_account_required/);
  });
});

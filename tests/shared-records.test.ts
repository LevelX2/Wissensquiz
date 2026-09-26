import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222";
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    insert into auth.users values('${alice}',now(),false,'{"display_name":"Alice"}'),('${bob}',now(),false,'{"display_name":"Bob"}');`);
  for (const file of [
    "202609260001_quiz_accounts.sql",
    "202609260002_shared_records.sql",
    "202609260003_player_rankings.sql",
  ])
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
}, 30000);
afterAll(() => db.close());
async function as(id: string, fn: () => Promise<void>, role = "authenticated") {
  await db.exec(`set role ${role}`);
  await db.query<Record<string, unknown>>(
    "select set_config('request.jwt.claim.sub',$1,false)",
    [id],
  );
  try {
    await fn();
  } finally {
    await db.exec("reset role");
  }
}
const payload = (count = 1) => ({
  schemaVersion: 1,
  rounds: Array.from({ length: count }, (_, i) => ({
    id: `r${i}`,
    mode: "rekord",
    status: "completed",
    topic: "Alle Themen",
    ruleVersion: "1",
    filters: { genres: ["Horror"], difficulties: ["leicht"] },
    finishedAt: 1700000000000 + i,
    questions: [
      {
        id: "q",
        correctId: "a",
        difficulty: "leicht",
        domain: "Film",
        metadata: { subdomain: "Horror" },
      },
    ],
  })),
  events: Array.from({ length: count }, (_, i) => ({
    roundId: `r${i}`,
    questionId: "q",
    answerId: "a",
    elapsedMs: 5000,
    knowledgePoints: 999999,
    timeBonus: 999999,
  })),
});
const save = (id: string, revision: number, value = payload()) =>
  db.query<Record<string, unknown>>("select quiz_save_state($1,$2,$3)", [
    value,
    revision,
    id,
  ]);
const sharing = (enabled: boolean, id = alice) =>
  db.query<Record<string, unknown>>("select quiz_set_sharing($1,$2)", [
    enabled,
    id,
  ]);
let category: string;
it("veröffentlicht erst nach Auswahl und gibt nur Ergebnisse ohne private Identität frei", async () => {
  await as(alice, async () => {
    await save(alice, 0);
    expect(
      (
        await db.query<Record<string, unknown>>(
          "select * from quiz_score_categories()",
        )
      ).rows,
    ).toEqual([]);
    await sharing(true);
    const categories = await db.query<{ category: string }>(
      "select * from quiz_score_categories()",
    );
    category = categories.rows[0].category;
    const scores = await db.query<Record<string, unknown>>(
      "select * from quiz_rankings($1,0)",
      [category],
    );
    expect(scores.rows).toEqual([
      {
        player_name: "Alice",
        points: 150,
        correct: 1,
        elapsed_ms: 5000,
        finished_at: 1700000000000,
        place: 1,
        is_mine: true,
      },
    ]);
    await expect(
      db.query<Record<string, unknown>>("select * from quiz_shared_scores"),
    ).rejects.toThrow(/permission denied/);
    await expect(sharing(true, bob)).rejects.toThrow(/account_changed/);
  });
  await as(bob, async () => {
    expect(
      (await db.query<Record<string, unknown>>("select * from quiz_sharing"))
        .rows,
    ).toEqual([]);
    expect(
      (await db.query<Record<string, unknown>>("select * from quiz_saves"))
        .rows,
    ).toEqual([]);
    const rows = (
      await db.query<Record<string, unknown>>(
        "select * from quiz_rankings($1,0)",
        [category],
      )
    ).rows;
    expect(rows[0]).toMatchObject({ player_name: "Alice", is_mine: false });
    expect(Object.keys(rows[0])).not.toContain("owner_id");
  });
});
it("aktualisiert beim Speichern automatisch, behandelt Gleichstände und paginiert ohne Rangverlust", async () => {
  await as(alice, async () => {
    await save(alice, 1, payload(52));
  });
  await as(bob, async () => {
    await save(bob, 0);
    await sharing(true, bob);
    const first = await db.query<Record<string, unknown>>(
      "select * from quiz_rankings($1,0)",
      [category],
    );
    const second = await db.query<Record<string, unknown>>(
      "select * from quiz_rankings($1,50)",
      [category],
    );
    expect(first.rows).toHaveLength(50);
    expect(second.rows).toHaveLength(3);
    expect([...first.rows, ...second.rows].every((r) => r.place === 1)).toBe(
      true,
    );
  });
});
it("vergleicht Spieler pro Genre und Stufe, begrenzt Trefferquoten auf mindestens 50 Antworten und schützt Identitäten", async () => {
  await as(alice, async () => {
    const ranked = await db.query<Record<string, unknown>>(
      "select * from quiz_players('rounds','Horror','leicht',0)",
    );
    expect(ranked.rows).toHaveLength(2);
    expect(ranked.rows[0]).toMatchObject({
      player_name: "Alice",
      completed: 52,
      answered: 52,
      correct: 52,
      is_mine: true,
      place: 1,
    });
    expect(Number(ranked.rows[0].accuracy)).toBe(100);
    expect(Object.keys(ranked.rows[0])).not.toContain("owner_id");
    expect(
      (await db.query("select * from quiz_players('accuracy','','',0)")).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from quiz_players('correct','Action','',0)"))
        .rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          "select * from quiz_players('correct','Horror','schwer',0)",
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      db.query("select * from quiz_players('unknown','','',0)"),
    ).rejects.toThrow("invalid_sort");
  });
});
it("zieht geteilte Ergebnisse zurück, ohne Spielstände oder fremde Einträge zu löschen", async () => {
  await as(alice, async () => {
    await sharing(false);
    expect((await db.query("select * from quiz_players() ")).rows).toHaveLength(
      1,
    );
    const rows = (
      await db.query<Record<string, unknown>>(
        "select * from quiz_rankings($1,0)",
        [category],
      )
    ).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].player_name).toBe("Bob");
    expect(
      (await db.query<Record<string, unknown>>("select state from quiz_saves"))
        .rows,
    ).toHaveLength(1);
    await save(alice, 2);
    expect(
      (
        await db.query<Record<string, unknown>>(
          "select * from quiz_rankings($1,0)",
          [category],
        )
      ).rows,
    ).toHaveLength(1);
  });
  await as(
    "",
    async () => {
      await expect(
        db.query<Record<string, unknown>>("select * from quiz_rankings($1,0)", [
          category,
        ]),
      ).rejects.toThrow(/permission denied/);
      await expect(sharing(true)).rejects.toThrow(/permission denied/);
      await expect(db.query("select * from quiz_players()")).rejects.toThrow(
        /permission denied/,
      );
    },
    "anon",
  );
  await db.query<Record<string, unknown>>(
    "update auth.users set email_confirmed_at=null where id=$1",
    [bob],
  );
  await as(alice, async () => {
    expect((await db.query("select * from quiz_players()")).rows).toHaveLength(
      0,
    );
    expect(
      (
        await db.query<Record<string, unknown>>(
          "select * from quiz_score_categories()",
        )
      ).rows,
    ).toEqual([]);
  });
});

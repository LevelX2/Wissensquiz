import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { encodeCloudState } from "../src/cloudCodec";
import { emptyState } from "../src/model";
import { importCsv } from "../src/importer";
import { startRound, answer, complete } from "../src/engine";
import { careerProgress } from "../src/career";
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
  await as(alice, async () => {
    await save(alice, 0);
    await sharing(false);
  });
  await db.exec(
    readFileSync(
      "supabase/migrations/202609260004_automatic_rankings.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/202610020001_error_training_rankings.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/202610020002_dont_know_rankings.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/202610020003_fast_player_rankings.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync("supabase/migrations/202610020004_film_career.sql", "utf8"),
  );
}, 30000);
afterAll(() => db.close());
it("zeigt globale Karriere-XP in beiden Ranglisten, erhält Gleichstände und ignoriert Genre-/Stufenfilter bei XP", async () => {
  await db.exec("begin");
  try {
    const questions = importCsv(
      readFileSync(
        "KI-Wissen-Wissensquiz/01 Rohquellen/Horror_Quiz_180_Fragen.csv",
        "utf8",
      ),
    ).questions.slice(0, 1);
    const state = emptyState(questions);
    const r = startRound(
      state,
      { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1700000000000,
    );
    answer(
      state,
      r.id,
      r.questions[0].id,
      r.questions[0].correctId,
      1000,
      1700000000001,
    );
    complete(state, r.id, 1700000000002);
    await db.query("update public.quiz_saves set state=$1 where owner_id=$2", [
      await encodeCloudState(state),
      alice,
    ]);
    await db.query(
      "insert into public.quiz_saves(owner_id,state,revision) values($1,$2,1) on conflict(owner_id) do update set state=excluded.state",
      [bob, state],
    );
    await as(alice, async () => {
      const rows = (
        await db.query<Record<string, unknown>>(
          "select * from quiz_players('experience','Action','schwer',0)",
        )
      ).rows;
      expect(rows).toHaveLength(2);
      expect(
        rows.every(
          (row) => row.experience === state.experience && row.place === 1,
        ),
      ).toBe(true);
      const category = (
        await db.query<{ category: string }>(
          "select * from quiz_score_categories()",
        )
      ).rows[0].category;
      const records = (
        await db.query<Record<string, unknown>>(
          "select * from quiz_rankings($1,0)",
          [category],
        )
      ).rows;
      expect(records).toHaveLength(2);
      expect(
        records.every(
          (row) => row.experience === state.experience && row.points === 158,
        ),
      ).toBe(true);
      const filtered = (
        await db.query<Record<string, unknown>>(
          "select * from quiz_players('correct','Horror','leicht',0)",
        )
      ).rows;
      expect(filtered.every((row) => row.experience === state.experience)).toBe(
        true,
      );
      expect(Object.keys(rows[0])).not.toContain("state");
      expect(Object.keys(rows[0])).not.toContain("owner_id");
    });
  } finally {
    await db.exec("rollback");
  }
});
it("erhält Level und Teilfortschritt alter Konten ohne Aktualisierung des privaten Spielstands", async () => {
  await db.exec("begin");
  try {
    const state = { ...payload(25), experience: 999999999 };
    await db.query("update public.quiz_saves set state=$1 where owner_id=$2", [
      state,
      alice,
    ]);
    await as(alice, async () => {
      const row = (
        await db.query<Record<string, unknown>>(
          "select * from quiz_players('experience','','',0)",
        )
      ).rows.find((row) => row.is_mine)!;
      expect(row.experience).toBe(350);
      expect(careerProgress(Number(row.experience))).toMatchObject({
        level: 3,
        current: 100,
        needed: 200,
      });
      expect(
        (
          await db.query<{ state: unknown }>(
            "select state from public.quiz_saves",
          )
        ).rows[0].state,
      ).toEqual(state);
    });
    const access = (
      await db.query<{ anon: boolean; direct: boolean }>(
        "select has_function_privilege('anon','public.quiz_players(text,text,text,integer)','execute') as anon, has_function_privilege('authenticated','public.quiz_career_experience(jsonb)','execute') as direct",
      )
    ).rows[0];
    expect(access).toEqual({ anon: false, direct: false });
  } finally {
    await db.exec("rollback");
  }
});
it("zeigt das einzige bestätigte Konto auch ohne Spielstand als eigenen Eintrag", async () => {
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  await db.exec("begin");
  try {
    await db.exec("delete from auth.users");
    await db.query("insert into auth.users values($1,now(),false,$2)", [
      id,
      { display_name: "Allein" },
    ]);
    await as(id, async () => {
      for (const sort of ["correct", "rounds"]) {
        expect(
          (await db.query("select * from quiz_players($1,'','',0)", [sort]))
            .rows,
        ).toEqual([
          {
            player_name: "Allein",
            completed: 0,
            answered: 0,
            correct: 0,
            accuracy: null,
            place: 1,
            is_mine: true,
            experience: 0,
          },
        ]);
      }
      expect(
        (await db.query("select * from quiz_players('accuracy','','',0)")).rows,
      ).toEqual([]);
    });
  } finally {
    await db.exec("rollback");
  }
});
it("wertet große Antwortgeschichten mit mehrfachen Ereignissen und fremden Runden unverändert aus", async () => {
  const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await db.exec("begin");
  try {
    await db.query("insert into auth.users values($1,now(),false,$2)", [
      id,
      { display_name: "Historie" },
    ]);
    const data = payload(600);
    // A catalog is deliberately irrelevant to ranking projection.
    Object.assign(data, {
      questions: { encoding: "gzip-base64", data: "x".repeat(1024 * 1024) },
    });
    data.events.push(
      { ...data.events[0], answerId: "b" },
      { ...data.events[0], roundId: "unrelated" },
    );
    data.rounds[599].status = "aborted";
    data.events[1].answerId = "b";
    // Insert synthetic snapshots directly to isolate the player-ranking query.
    await db.query(
      "insert into quiz_saves(owner_id,state,revision) values($1,$2,1)",
      [id, data],
    );
    await as(id, async () => {
      for (const sort of ["rounds", "correct", "accuracy"]) {
        const mine = (
          await db.query<Record<string, unknown>>(
            "select * from quiz_players($1,'Horror','leicht',0)",
            [sort],
          )
        ).rows.find((row) => row.is_mine);
        expect(mine).toMatchObject({
          completed: 599,
          answered: 599,
          correct: 598,
        });
        expect(Number(mine?.accuracy)).toBe(99.8);
      }
      expect(
        (await db.query("select * from quiz_players('correct','Action','',0)"))
          .rows,
      ).toEqual([]);
    });
  } finally {
    await db.exec("rollback");
  }
});
it("zählt Keine Ahnung in allen Modi als falsche Antwort für die Quote, ohne Zeitabläufe oder Abbrüche mitzuzählen", async () => {
  const id = "99999999-9999-4999-8999-999999999999";
  await db.exec("begin");
  try {
    await db.query("insert into auth.users values($1,now(),false,$2)", [
      id,
      { display_name: "Keine Ahnung" },
    ]);
    const data = payload(52);
    data.rounds.forEach((round, i) => {
      round.mode = ["entdecken", "ueben", "rekord", "fehler"][i % 4];
    });
    data.rounds[51].status = "aborted";
    for (const event of data.events.slice(0, 4)) {
      (event as { answerId: string | null }).answerId = null;
      Object.assign(event, { dontKnow: true });
    }
    (data.events[4] as { answerId: string | null }).answerId = null;
    await as(id, async () => {
      await save(id, 0, data);
      const mine = (
        await db.query<Record<string, unknown>>(
          "select * from quiz_players('accuracy','Horror','leicht',0)",
        )
      ).rows.find((row) => row.is_mine);
      expect(mine).toMatchObject({
        completed: 51,
        answered: 50,
        correct: 46,
        accuracy: "92.0",
      });
      expect(
        (
          await db.query(
            "select * from quiz_players('accuracy','Horror','schwer',0)",
          )
        ).rows,
      ).toHaveLength(0);
    });
  } finally {
    await db.exec("rollback");
  }
});
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
it("nimmt vorhandene Konten automatisch auf und gibt nur Ergebnisse ohne private Identität frei", async () => {
  await as(alice, async () => {
    await expect(sharing(false)).rejects.toThrow(/permission denied/);
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
        experience: 10,
      },
    ]);
    await expect(
      db.query<Record<string, unknown>>("select * from quiz_shared_scores"),
    ).rejects.toThrow(/permission denied/);
    await expect(sharing(true, bob)).rejects.toThrow(/permission denied/);
  });
  await as(bob, async () => {
    await expect(db.query("select * from quiz_sharing")).rejects.toThrow(
      /permission denied/,
    );
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
it("verhindert Abwahl und Fremdzugriff, erhält private Stände und schließt unbestätigte Konten aus", async () => {
  await as(alice, async () => {
    await expect(sharing(false)).rejects.toThrow(/permission denied/);
    expect((await db.query("select * from quiz_players()")).rows).toHaveLength(
      2,
    );
    expect((await db.query("select * from quiz_saves")).rows).toHaveLength(1);
    await save(alice, 2);
    expect(
      (await db.query("select * from quiz_rankings($1,0)", [category])).rows,
    ).toHaveLength(2);
  });
  await as(
    "",
    async () => {
      for (const query of [
        "select * from quiz_players()",
        "select * from quiz_score_categories()",
        "select * from quiz_shared_scores",
        "select quiz_project_scores('" + alice + "')",
      ])
        await expect(db.query(query)).rejects.toThrow(/permission denied/);
    },
    "anon",
  );
  await db.query("update auth.users set email_confirmed_at=null where id=$1", [
    bob,
  ]);
  await as(alice, async () => {
    expect((await db.query("select * from quiz_players()")).rows).toHaveLength(
      1,
    );
    expect(
      (await db.query("select * from quiz_rankings($1,0)", [category])).rows,
    ).toHaveLength(1);
    await expect(
      db.query("select quiz_project_scores($1)", [alice]),
    ).rejects.toThrow(/permission denied/);
  });
  await as(bob, async () => {
    await expect(db.query("select * from quiz_players()")).rejects.toThrow(
      /authentication_required/,
    );
  });
});
it("zeigt bestätigte Spieler auch ohne Runde und übernimmt Namensänderungen ohne Änderung der Spielstände", async () => {
  const newcomer = "33333333-3333-4333-8333-333333333333";
  await db.query("insert into auth.users values($1,now(),false,$2)", [
    newcomer,
    { display_name: "Neu" },
  ]);
  await db.query("update auth.users set raw_user_meta_data=$1 where id=$2", [
    { display_name: "Neuer Name" },
    alice,
  ]);
  await as(alice, async () => {
    const players = (await db.query("select * from quiz_players()")).rows;
    expect(players).toHaveLength(2);
    expect(players[1]).toMatchObject({
      player_name: "Neu",
      completed: 0,
      answered: 0,
      correct: 0,
      accuracy: null,
    });
    expect(
      (await db.query("select * from quiz_rankings($1,0)", [category])).rows[0],
    ).toMatchObject({ player_name: "Neuer Name" });
    expect(
      (await db.query("select * from quiz_players('rounds','Horror','',0)"))
        .rows,
    ).toHaveLength(1);
  });
});

it("kompakte Online-Sicherung liefert unveränderte Highscores und Spielerstatistik ohne SQL-Migration", async () => {
  const id = "66666666-6666-4666-8666-666666666666";
  const state = emptyState(
    importCsv(readFileSync("public/horror-fragen.csv", "utf8")).questions,
  );
  const r = startRound(
    state,
    {
      mode: "rekord",
      topic: "Alle Themen",
      difficulty: "leicht",
      filters: { genres: ["Horror"], difficulties: ["leicht"] },
    },
    1700000000000,
  );
  for (const q of r.questions)
    answer(state, r.id, q.id, q.correctId, 5000, 1700000005000);
  complete(state, r.id, 1700000030000);
  await db.exec("begin");
  try {
    await db.query("insert into auth.users values($1,now(),false,$2)", [
      id,
      { display_name: "Compact" },
    ]);
    await as(id, async () => {
      await db.query("select quiz_save_state($1,0,$2)", [state, id]);
      const categories = (
        await db.query<{ category: string }>(
          "select * from quiz_score_categories()",
        )
      ).rows;
      const scores = await Promise.all(
        categories.map((c) =>
          db.query("select * from quiz_rankings($1,0)", [c.category]),
        ),
      );
      const players = (
        await db.query(
          "select * from quiz_players('rounds','Horror','leicht',0)",
        )
      ).rows;
      await db.query("select quiz_save_state($1,1,$2)", [
        await encodeCloudState(state),
        id,
      ]);
      for (let i = 0; i < categories.length; i++)
        expect(
          (
            await db.query("select * from quiz_rankings($1,0)", [
              categories[i].category,
            ])
          ).rows,
        ).toEqual(scores[i].rows);
      expect(
        (
          await db.query(
            "select * from quiz_players('rounds','Horror','leicht',0)",
          )
        ).rows,
      ).toEqual(players);
    });
  } finally {
    await db.exec("rollback");
  }
});
it("zählt Fehlerrunden in Spielerleistungen einschließlich Quoten, aber nur Rekordrunden in Highscores", async () => {
  const id = "88888888-8888-4888-8888-888888888888";
  await db.exec("begin");
  try {
    await db.query("insert into auth.users values($1,now(),false,$2)", [
      id,
      { display_name: "Fehlertraining" },
    ]);
    const data = payload(52);
    data.rounds.forEach((r, i) => {
      r.mode = ["entdecken", "ueben", "rekord"][i] ?? "fehler";
    });
    data.rounds[51].status = "aborted";
    data.events[4].answerId = "b";
    (data.events[5] as { answerId: string | null }).answerId = null;
    await as(id, async () => {
      await save(id, 0, data);
      for (const sort of ["rounds", "correct", "accuracy"]) {
        const rows = (
          await db.query<Record<string, unknown>>(
            "select * from quiz_players($1,'Horror','leicht',0)",
            [sort],
          )
        ).rows;
        const mine = rows.find((row) => row.is_mine);
        expect(mine).toMatchObject({
          completed: 51,
          answered: 50,
          correct: 49,
        });
        expect(Number(mine?.accuracy)).toBe(98);
      }
      expect(
        (await db.query("select * from quiz_players('rounds','Action','',0)"))
          .rows,
      ).toEqual([]);
      const category = (
        await db.query<{ category: string }>(
          "select * from quiz_score_categories()",
        )
      ).rows[0].category;
      const records = (
        await db.query<{ is_mine: boolean }>(
          "select * from quiz_rankings($1,0)",
          [category],
        )
      ).rows;
      expect(records.filter((r) => r.is_mine)).toHaveLength(1);
    });
  } finally {
    await db.exec("rollback");
  }
});

it("speichert getrennte Bekanntheitskategorien mit neuer Auswahlkennung ohne Änderung der SQL-Verträge", async () => {
  const id = "77777777-7777-4777-8777-777777777777";
  await db.exec("begin");
  try {
    await db.query("insert into auth.users values($1,now(),false,$2)", [
      id,
      { display_name: "Journey" },
    ]);
    const data = payload(3);
    data.rounds[1].ruleVersion = "2.B1.M01:1";
    data.rounds[2].ruleVersion = "2.B2.M02:1";
    await as(id, async () => {
      await db.query("select quiz_save_state($1,0,$2)", [data, id]);
      const rows = (
        await db.query<{ category: string; rule_version: string }>(
          "select * from quiz_score_categories()",
        )
      ).rows;
      for (const version of ["2.B1.M01:1", "2.B2.M02:1"]) {
        const row = rows.find((r) => r.rule_version === version)!;
        expect(row).toBeDefined();
        const scores = (
          await db.query<{ points: number; player_name: string }>(
            "select * from quiz_rankings($1,0)",
            [row.category],
          )
        ).rows;
        expect(scores).toHaveLength(1);
        expect(scores[0]).toMatchObject({
          points: 150,
          player_name: "Journey",
        });
      }
    });
  } finally {
    await db.exec("rollback");
  }
});

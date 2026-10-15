import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { emptyState, type Question } from "../src/model";
import { importCsv } from "../src/importer";
import { answer, complete, startRound } from "../src/engine";
import { archiveClosedRounds } from "../src/roundArchive";
import {
  localLearningAchievements,
  learningAchievementTracks,
  reachedLearningAchievements,
} from "../src/learningAchievements";
import { syncFixture } from "./helpers/sync-fixture";
import { OnlineGameStore } from "../src/onlineGameStore";
import { prepareTestContent } from "./helpers/test-content";

it("zählt Filme getrennt von Fakten, Varianten, Personen und geratenen Antworten", () => {
  const q = importCsv(readFileSync("public/fragen.csv", "utf8")).questions[0];
  const qs: Question[] = [
    {
      ...q,
      id: "a",
      knowledgeId: "a",
      topic: "Film A",
      difficulty: "leicht" as const,
      metadata: { subdomain: "Drama" },
    },
    {
      ...q,
      id: "b",
      knowledgeId: "b",
      topic: "Film A",
      difficulty: "leicht" as const,
      metadata: { subdomain: "Drama" },
    },
    {
      ...q,
      id: "variant",
      knowledgeId: "a",
      topic: "Film A",
      difficulty: "leicht" as const,
      metadata: { subdomain: "Drama" },
    },
    {
      ...q,
      id: "hard",
      knowledgeId: "hard",
      topic: "Film A",
      difficulty: "schwer" as const,
      metadata: { subdomain: "Drama" },
    },
    {
      ...q,
      id: "actor",
      knowledgeId: "actor",
      topic: "Person A",
      difficulty: "leicht" as const,
      metadata: { person_id: "person" },
    },
  ];
  const state = emptyState(qs);
  const now = new Date("2026-10-12T12:00:00+02:00").getTime();
  const play = (questions: typeof qs, guessed = false, finish = true) => {
    const round = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now,
    );
    round.questions = structuredClone(questions);
    round.order = questions.map((q) => q.answers.map((a) => a.id));
    round.familiaritySnapshot = undefined;
    for (const q of questions) {
      answer(state, round.id, q.id, q.correctId, 100, now + 100);
      if (guessed) state.events.at(-1)!.guessed = true;
    }
    if (finish) complete(state, round.id, now + 200);
    return round;
  };
  const first = play([qs[0], qs[4]]);
  expect(first.status).toBe("completed");
  expect(state.events).toHaveLength(2);
  play([qs[2]]);
  expect(localLearningAchievements(state).counts).toMatchObject({
    films: 0,
    actors: 1,
    secureFacts: 2,
    "films:Drama": 0,
  });
  play([qs[1]], true);
  expect(localLearningAchievements(state).counts.films).toBe(0);
  const active = play([qs[1]], false, false);
  expect(localLearningAchievements(state).counts.films).toBe(0);
  complete(state, active.id, now + 200);
  const progress = localLearningAchievements(state);
  expect(progress.counts).toMatchObject({
    films: 1,
    actors: 1,
    secureFacts: 3,
    "films:Drama": 1,
    genreBreadth: 1,
  });
  expect(progress.available).toMatchObject({
    films: 1,
    actors: 1,
    secureFacts: 4,
    "films:Drama": 1,
  });
  archiveClosedRounds(state);
  expect(localLearningAchievements(state)).toEqual(progress);
});

it("initialisiert aktuelle Spielstände ohne Quellenänderung und trennt einen Neustart vom bisherigen Erfolgsstand", async () => {
  const migration = "20261012201611_learning_achievements.sql";
  const fixture = await syncFixture(migration);
  try {
    await fixture.seedRanked(
      await prepareTestContent(
        importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(
          0,
          32,
        ),
      ),
    );
    await fixture.db.exec(
      "update quiz_ranked_internal.config set question_count=32; select quiz_game_internal.refresh_content()",
    );
    const { api, owner } = await fixture.client();
    const store = new OnlineGameStore(api, owner);
    await store.open();
    const {
      rows: [head],
    } = await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    );
    await fixture.db.query(
      `insert into quiz_game_internal.secure_goals select distinct $1::uuid,$2::uuid,knowledge_id,case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end,difficulty from quiz_game_internal.catalog_meta`,
      [owner, head.generation],
    );
    await fixture.db.query(
      "update public.quiz_sync_entries set value='500' where owner_id=$1 and generation=$2 and kind='field' and id='experience'",
      [owner, head.generation],
    );
    const source = async () => ({
      entries: (
        await fixture.db.query(
          "select * from public.quiz_sync_entries order by owner_id,generation,kind,id",
        )
      ).rows,
      heads: (
        await fixture.db.query(
          "select * from public.quiz_account_heads order by owner_id",
        )
      ).rows,
    });
    const before = await source();
    await fixture.db.exec(
      readFileSync(`supabase/migrations/${migration}`, "utf8"),
    );
    expect(await source()).toEqual(before);
    const progress = await api.call<any>("quiz_game_view", {
      request_text: '{"action":"learning-achievements"}',
    });
    expect(progress.counts.experience).toBe(500);
    expect(progress.counts.secureFacts).toBe(progress.available.secureFacts);
    expect(
      (
        await fixture.db.query(
          "select * from quiz_game_internal.round_learning_achievements",
        )
      ).rows,
    ).toEqual([]);
    // The explicit reset path creates another generation; the former maxima
    // neither leak into it nor need a historical-data adapter.
    await store.refresh();
    await store.update((state) => Object.assign(state, emptyState()), {
      replace: true,
    });
    const reset = await api.call<any>("quiz_game_view", {
      request_text: '{"action":"learning-achievements"}',
    });
    expect(reset.counts.experience).toBe(0);
    expect(reset.counts.secureFacts).toBe(0);
  } finally {
    await fixture.db.close();
  }
});

it("feiert übersprungene Schwellen und erweitert die acht Entdecker-Ziele sowie EXP", () => {
  const reward = {
    before: {
      films: 9,
      "films:Drama": 24,
      experience: 90,
      discoveredFacts: 49,
    },
    after: {
      counts: {
        films: 26,
        "films:Drama": 26,
        experience: 510,
        discoveredFacts: 110,
      },
      available: {
        films: 80,
        "films:Drama": 30,
        experience: 10000,
        discoveredFacts: 10000,
      },
    },
  };
  expect(reachedLearningAchievements(reward).map((a) => a.id)).toEqual(
    expect.arrayContaining([
      "films:10",
      "films:25",
      "films:Drama:25",
      "experience:100",
      "experience:500",
      "discoveredFacts:50",
      "discoveredFacts:100",
    ]),
  );
  expect(
    reachedLearningAchievements({ ...reward, before: reward.after.counts }),
  ).toEqual([]);
  const discovery = learningAchievementTracks(reward.after).find(
    (t) => t.id === "discoveredFacts",
  )!;
  expect(discovery.milestones).toEqual([
    50, 100, 250, 500, 1000, 2500, 5000, 10000, 12500, 15000, 20000, 25000,
  ]);
  expect(
    learningAchievementTracks({
      counts: { "films:Drama": 25 },
      available: {},
    }).some((track) => track.id === "films:Drama"),
  ).toBe(true);
  expect(
    reachedLearningAchievements({
      before: { discoveredFacts: 9999 },
      after: {
        counts: { discoveredFacts: 10000 },
        available: { discoveredFacts: 10000 },
      },
    })[0].tier.id,
  ).toBe("ruby");
});

it("leitet private Film- und Genreerfolge aus sicheren Zielen ab, erhält erreichte Stände und liefert unveränderliche Rundenschnappschüsse", async () => {
  const fixture = await syncFixture();
  try {
    await fixture.seedRanked(
      await prepareTestContent(
        importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(
          0,
          32,
        ),
      ),
    );
    const { api, owner } = await fixture.client();
    // A head is enough for views; this test intentionally controls metadata and
    // the already covered secure-goal projection, never a real account.
    const {
      rows: [head],
    } = await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    );
    let generation = head?.generation;
    if (!generation) {
      await new OnlineGameStore(api, owner).open();
      generation = (
        await fixture.db.query<{ generation: string }>(
          "select generation from public.quiz_account_heads where owner_id=$1",
          [owner],
        )
      ).rows[0].generation;
    }
    await fixture.db.exec(`delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta(id,knowledge_id,topic,genre,source,difficulty,familiarity,tags)
      select 'q'||i,'g'||i,'Film '||i,'Drama','film','leicht',1,'[]' from generate_series(1,26) i;
      insert into quiz_game_internal.catalog_meta values('variant','g1','Film 1','Drama','film','leicht',1,'[]'),('second','g1b','Film 1','Drama','film','leicht',1,'[]'),('hard','hard','Film 2','Drama','film','schwer',1,'[]'),('actor','person','Person','Schauspieler','actors','leicht',1,'[]');
      select quiz_game_internal.refresh_groups();`);
    const safe = (goals: string[]) =>
      fixture.db.query(
        `insert into quiz_game_internal.secure_goals select $1,$2,g,'Drama','leicht' from unnest($3::text[]) g on conflict do nothing`,
        [owner, generation, goals],
      );
    const view = () =>
      api.call<any>("quiz_game_view", {
        request_text: '{"action":"learning-achievements"}',
      });
    await safe(Array.from({ length: 10 }, (_, i) => `g${i + 1}`));
    const snapshot = async (id: string, revision: number) => {
      await fixture.db.query(
        `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision) values($1,$2,'round',$3,$4::integer,jsonb_build_object('status','completed','questions','[]'::jsonb),$4::bigint)`,
        [owner, generation, id, revision],
      );
      await fixture.db.query(
        "select quiz_game_internal.refresh_learning_achievements($1,$2,$3)",
        [owner, generation, revision],
      );
    };
    await snapshot("baseline", 1);
    const current = await view();
    expect(current).toMatchObject({
      counts: { films: 9, "films:Drama": 9, secureFacts: 10, actors: 0 },
      available: { films: 26, "films:Drama": 26, secureFacts: 29, actors: 1 },
    });
    await safe(["g1b", "g11"]);
    // Normal writes queue these goals through the canonical goal projector.
    // This test directly seeds evidence, so queue exactly those synthetic changes.
    await fixture.db.query(
      "insert into quiz_game_internal.achievement_dirty_goals select $1,$2,g from unnest(array['g1b','g11']) g",
      [owner, generation],
    );
    await snapshot("crossed", 2);
    const reward = await api.call<any>("quiz_game_view", {
      request_text: '{"action":"round-experience","scope":"crossed"}',
    });
    expect(reward.learningAchievements).toMatchObject({
      before: { films: 9 },
      after: { counts: { films: 11, "films:Drama": 11 } },
    });
    expect(
      reachedLearningAchievements(reward.learningAchievements).filter((a) =>
        a.id.startsWith("films"),
      ),
    ).toHaveLength(2);
    await fixture.db.query(
      "select quiz_game_internal.refresh_learning_achievements($1,$2,2)",
      [owner, generation],
    );
    expect(
      await api.call("quiz_game_view", {
        request_text: '{"action":"round-experience","scope":"crossed"}',
      }),
    ).toEqual(reward);
    await fixture.db.query(
      "delete from quiz_game_internal.secure_goals where owner_id=$1 and generation=$2 and goal='g11'",
      [owner, generation],
    );
    await fixture.db.query(
      "insert into quiz_game_internal.achievement_dirty_goals values($1,$2,'g11')",
      [owner, generation],
    );
    await snapshot("later", 3);
    expect((await view()).counts.films).toBe(11);
    const stranger = await fixture.client();
    await new OnlineGameStore(stranger.api, stranger.owner).open();
    expect(
      (
        await stranger.api.call<any>("quiz_game_view", {
          request_text: '{"action":"learning-achievements"}',
        })
      ).counts.films,
    ).toBe(0);
    expect(
      await stranger.api.call("quiz_game_view", {
        request_text: '{"action":"round-experience","scope":"crossed"}',
      }),
    ).toBeNull();
    await fixture.db.exec("set role authenticated");
    await expect(
      fixture.db.query(
        "select * from quiz_game_internal.learning_achievements",
      ),
    ).rejects.toThrow(/permission denied/);
  } finally {
    await fixture.db.close();
  }
});

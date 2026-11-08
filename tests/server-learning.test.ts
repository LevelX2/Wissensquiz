import { currentCsv } from "./helpers/current-content";
import { beforeAll, afterAll, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import { OnlineGameStore } from "../src/onlineGameStore";
import { LearningSession } from "../src/learningRuns";
import { startRound, answer, complete } from "../src/engine";
import { learn } from "../src/learning";
import { emptyState } from "../src/model";
import { mergeTrial } from "../src/trial";
let fixture: Awaited<ReturnType<typeof syncFixture>>;
beforeAll(async () => {
  fixture = await syncFixture();
  const release = await prepareTestContent(
    importCsv(currentCsv({ genre: "Science-Fiction" })).questions,
  );
  await fixture.seedRanked(release);
}, 30000);
afterAll(() => fixture?.db.close());

it("zählt und wiederholt fällige Ziele aller gewählten Bereiche einschließlich Rundenergebnis", async () => {
  const { api, owner } = await fixture.client();
  await new OnlineGameStore(api, owner).open();
  const stamp = new Date("2026-10-11T12:00:00+02:00").getTime();
  api.clockAt(stamp);
  const target = (
    await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    )
  ).rows[0].generation;
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta values
      ('film','film-goal','Test','Abenteuer','film','leicht',1,'[]'),
      ('actor','actor-goal','Test','Schauspieler','actors','experte',1,'[]'),
      ('award','award-goal','Test','Preisträger','awards','schwer',1,'[]'),
      ('later','later-goal','Test','Schauspieler','actors','leicht',1,'[]'),
      ('new','new-goal','Test','Preisträger','awards','leicht',1,'[]');
      select quiz_game_internal.test_materialize_works();select quiz_game_internal.refresh_groups(); delete from quiz_game_internal.journey_cache;`);
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'learning',goal,i,jsonb_build_object('stage',1,'due',$3::bigint+case when i=4 then 60000 else -10000+i end,'seen',1),0
      from (values ('film-goal',1),('actor-goal',2),('award-goal',3),('later-goal',4)) v(goal,i)`,
      [owner, target, stamp],
    );
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'event','event'||i,i,jsonb_build_object('roundId','source','knowledgeId',goal,'correct',false,'at',$3::bigint-100000),0
      from (values ('film-goal',1),('actor-goal',2),('award-goal',3),('later-goal',4)) v(goal,i)`,
      [owner, target, stamp],
    );
    const setup = {
      mode: "fehler",
      topic: "Alle Themen",
      filters: {
        genres: null,
        sources: ["film", "actors", "awards"],
        difficulties: ["leicht", "mittel", "schwer", "experte"],
        familiarities: [1, 2, 3, 4],
      },
    };
    const selection = await api.call<any>("quiz_game_view", {
      request_text: JSON.stringify({
        ...setup,
        action: "selection",
        timezone: "Europe/Berlin",
      }),
    });
    expect(selection).toMatchObject({
      selectionSize: 3,
      repetitions: { due: 3, later: 1, nextAt: stamp + 60000 },
    });
    const queue = async (selectedSetup = setup) =>
      (
        await fixture.db.query<{ ids: string[] }>(
          "select quiz_game_internal.select_queue($1,$2,$3,'Europe/Berlin') ids",
          [owner, target, JSON.stringify(selectedSetup)],
        )
      ).rows[0].ids;
    expect(await queue()).toEqual(["film", "actor", "award"]);
    expect(
      await queue({
        ...setup,
        filters: {
          ...setup.filters,
          genres: null,
          sources: ["actors", "awards"],
        },
      }),
    ).toEqual(["actor", "award"]);
    expect(
      await api.call<any>("quiz_game_view", {
        request_text: JSON.stringify({
          action: "round-repetitions",
          scope: "source",
          timezone: "Europe/Berlin",
        }),
      }),
    ).toMatchObject({ due: 3, nextAt: stamp + 60000 });
    expect(
      await queue({ ...setup, sourceRoundId: "other" } as typeof setup),
    ).toBeNull();
  } finally {
    await fixture.db.exec("rollback");
  }
});

it("stellt kürzlich richtige nicht fällige Serverziele 24 Stunden zurück, mit Auffüllung und Fälligkeitsausnahme", async () => {
  const { api, owner } = await fixture.client();
  await new OnlineGameStore(api, owner).open();
  const stamp = new Date("2026-10-11T12:00:00+02:00").getTime();
  api.clockAt(stamp);
  // Direct SQL calls also need the controlled clock; clockAt applies on API calls.
  await fixture.db.query("select set_config('quiz.test_now',$1,false)", [
    String(stamp),
  ]);
  const target = (
    await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    )
  ).rows[0].generation;
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta select 'q'||i,'goal'||i,'Test','Abenteuer','film','leicht',1,'[]' from generate_series(0,19) i;
      insert into quiz_game_internal.catalog_meta values ('variant','goal0','Test','Abenteuer','film','leicht',1,'[]');
      select quiz_game_internal.test_materialize_works();select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'learning','goal'||i,i,jsonb_build_object('stage',2,'due',$3::bigint+259200000,'lastSeenAt',$3::bigint-1000,'lastSecure',$3::bigint-172800000,'seen',3),0 from generate_series(0,19) i`,
      [owner, target, stamp],
    );
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'event','event'||i,i,jsonb_build_object('roundId','old-round','knowledgeId','goal'||i,'correct',true,'guessed',i=4,'at',$3::bigint-3600000),0 from generate_series(0,9) i`,
      [owner, target, stamp],
    );
    const setup = {
      mode: "ueben",
      topic: "Alle Themen",
      filters: {
        genres: ["Abenteuer"],
        sources: ["film"],
        difficulties: ["leicht"],
        familiarities: [1, 2, 3, 4],
      },
    };
    const queue = async (mode = "ueben") =>
      (
        await fixture.db.query<{ ids: string[] }>(
          "select quiz_game_internal.select_queue($1,$2,$3,'Europe/Berlin') ids",
          [owner, target, JSON.stringify({ ...setup, mode })],
        )
      ).rows[0].ids;
    for (const mode of ["ueben", "entdecken"]) {
      for (let i = 0; i < 4; i++)
        expect((await queue(mode)).sort()).toEqual(
          Array.from({ length: 10 }, (_, i) => `q${i + 10}`).sort(),
        );
    }
    // Eleven goals: the one alternative must survive while protected goals fill the rest.
    await fixture.db.exec(
      "delete from quiz_game_internal.catalog_meta where id in (select 'q'||i from generate_series(11,19) i)",
    );
    for (const mode of ["ueben", "entdecken"]) {
      const ids = await queue(mode);
      expect(ids).toHaveLength(10);
      expect(ids).toContain("q10");
      expect(
        ids.filter((id) => id === "q0" || id === "variant").length,
      ).toBeLessThanOrEqual(1);
    }
    // Exactly 24 hours old is eligible; recent correct but already due is eligible too.
    await fixture.db.query(
      "update public.quiz_sync_entries set value=jsonb_set(value,'{at}',to_jsonb($3::bigint-86400000)) where owner_id=$1 and generation=$2 and kind='event' and id='event1'",
      [owner, target, stamp],
    );
    await fixture.db.query(
      "update public.quiz_sync_entries set value=jsonb_set(value,'{due}',to_jsonb($3::bigint)) where owner_id=$1 and generation=$2 and kind='learning' and id='goal2'",
      [owner, target, stamp],
    );
    for (const mode of ["ueben", "entdecken"]) {
      const ids = await queue(mode);
      expect(ids).toEqual(expect.arrayContaining(["q1", "q2", "q10"]));
    }
    // The timed lookup is covered by the account/time index, without a history replay.
    expect(
      (
        await fixture.db.query<{ indexdef: string }>(
          "select indexdef from pg_indexes where indexname='quiz_sync_recent_correct'",
        )
      ).rows[0].indexdef,
    ).toContain("owner_id, generation");
  } finally {
    await fixture.db.exec("rollback");
  }
});
it("berechnet 50-%-Grenzen aufgerundet aus aktuellen Zielen und ignoriert alte Freigaben", async () => {
  const { api, owner } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const target = (
    await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    )
  ).rows[0].generation;
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta
      select d||i,d||i,'Test','Abenteuer','film',d,1,'[]' from (values ('leicht',5),('mittel',3),('schwer',3)) v(d,n) cross join lateral generate_series(1,n) i;
      select quiz_game_internal.test_materialize_works();select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    await fixture.db.query(
      `update public.quiz_sync_entries set value='{"version":1,"earned":{"Abenteuer":{"difficulty":2,"familiarity":1}}}' where owner_id=$1 and kind='field' and id='journey'`,
      [owner],
    );
    const progress = async () =>
      (
        await fixture.db.query<{ p: any }>(
          "select quiz_game_internal.journey($1,$2)->'Abenteuer' p",
          [owner, target],
        )
      ).rows[0].p;
    expect(await progress()).toMatchObject({
      easyTarget: 3,
      mediumTarget: 2,
      mediumUnlocked: false,
      hardUnlocked: false,
    });
    const secure = async (difficulty: string, n: number) =>
      fixture.db.query(
        `insert into quiz_game_internal.secure_goals select $1,$2,$3||i,'Abenteuer',$3 from generate_series(1,$4::int) i on conflict do nothing`,
        [owner, target, difficulty, n],
      );
    await secure("mittel", 2);
    await secure("leicht", 2);
    expect(await progress()).toMatchObject({
      easy: 2,
      medium: 2,
      mediumUnlocked: false,
      hardUnlocked: false,
    });
    await secure("leicht", 3);
    expect(await progress()).toMatchObject({
      easy: 3,
      mediumUnlocked: true,
      hardUnlocked: true,
    });
    await secure("leicht", 5); // Extra evidence for removed content never counts.
    await fixture.db.exec(
      "delete from quiz_game_internal.catalog_meta where id in ('leicht4','leicht5');select quiz_game_internal.test_materialize_works();select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;",
    );
    expect(await progress()).toMatchObject({ easy: 3, easyTarget: 2 });
  } finally {
    await fixture.db.exec("rollback");
  }
});

it("mischt neue Serverfragen gleichwahrscheinlich nach Stufe und erhält vier fällige Plätze", async () => {
  const { api, owner } = await fixture.client();
  await new OnlineGameStore(api, owner).open();
  const target = (
    await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    )
  ).rows[0].generation;
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta
      select d||i,d||i,'Test','Abenteuer','film',d,1,'[]' from (values ('leicht',100),('mittel',20),('schwer',10)) v(d,n) cross join lateral generate_series(1,n) i;
      insert into quiz_game_internal.catalog_meta select 'variant'||i,'leicht1','Test','Abenteuer','film','leicht',1,'[]' from generate_series(1,20) i;
      insert into quiz_game_internal.catalog_meta values('cross-medium','leicht1','Test','Abenteuer','film','mittel',1,'[]'),('cross-hard','leicht1','Test','Abenteuer','film','schwer',1,'[]');
      select quiz_game_internal.test_materialize_works();select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    await fixture.db.query(
      `insert into quiz_game_internal.secure_goals select $1,$2,d||i,'Abenteuer',d from (values ('leicht',50),('mittel',11)) v(d,n) cross join lateral generate_series(1,n) i`,
      [owner, target],
    );
    const setup = {
      mode: "entdecken",
      topic: "Alle Themen",
      filters: {
        sources: ["film"],
        genres: ["Abenteuer"],
        difficulties: ["leicht", "mittel", "schwer"],
        familiarities: [1, 2, 3, 4],
      },
    };
    const queue = async () =>
      (
        await fixture.db.query<{ ids: string[] }>(
          "select quiz_game_internal.select_queue($1,$2,$3,'Europe/Berlin') ids",
          [owner, target, JSON.stringify(setup)],
        )
      ).rows[0].ids;
    const counts = { leicht: 0, mittel: 0, schwer: 0 };
    for (let i = 0; i < 60; i++) {
      const ids = await queue();
      expect(ids).toHaveLength(10);
      const rows = (
        await fixture.db.query<{
          knowledge_id: string;
          difficulty: keyof typeof counts;
        }>(
          "select knowledge_id,difficulty from quiz_game_internal.catalog_meta where id=any($1::text[])",
          [ids],
        )
      ).rows;
      expect(new Set(rows.map((q) => q.knowledge_id)).size).toBe(10);
      for (const q of rows) counts[q.difficulty]++;
    }
    for (const count of Object.values(counts)) {
      expect(count).toBeGreaterThan(120);
      expect(count).toBeLessThan(270);
    }
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'learning','leicht'||i,i,'{"stage":0,"due":0,"seen":1,"lastSecure":0}',0 from generate_series(1,4) i`,
      [owner, target],
    );
    const ids = await queue();
    expect(
      ids.filter(
        (id) =>
          /^leicht[1-4]$/.test(id) ||
          id.startsWith("variant") ||
          id.startsWith("cross-"),
      ),
    ).toHaveLength(4);
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'learning','schwer'||i,4+i,'{"stage":0,"due":9999999999999,"seen":1,"lastSecure":0}',0 from generate_series(1,10) i`,
      [owner, target],
    );
    expect((await queue()).some((id) => id.startsWith("schwer"))).toBe(false);
  } finally {
    await fixture.db.exec("rollback");
  }
});

it("begrenzt öffentliche Proberunden auf zehn verschiedene Ziele", async () => {
  const { api } = await fixture.client();
  const qs = await api.call<any[]>("quiz_trial_questions", { genre: null });
  expect(qs).toHaveLength(10);
  expect(new Set(qs.map((q) => q.knowledgeId)).size).toBe(10);
});
it("liefert kleine Metadaten und paginierte Themen ohne Fragen", async () => {
  const { api } = await fixture.client();
  const view = (body: object) =>
    api.call<any>("quiz_game_view", { request_text: JSON.stringify(body) });
  const info = await view({ action: "info" });
  expect(info.questions).toBeGreaterThan(10);
  expect(JSON.stringify(info)).not.toContain("correctId");
  const page = await view({ action: "topics" });
  expect(page.items.length).toBeLessThanOrEqual(40);
  expect(JSON.stringify(page)).not.toContain("correctId");
  const selection = await view({
    action: "selection",
    mode: "ueben",
    topic: "Alle Themen",
    filters: {
      genres: info.genres,
      sources: ["film"],
      difficulties: ["leicht", "mittel", "schwer"],
      familiarities: [1, 2, 3, 4],
    },
  });
  expect(selection.selectionSize).toBe(10);
});
it("spielt, bestätigt, setzt fort und öffnet ohne einen Katalogabruf", async () => {
  const { api, owner } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  expect(store.read().questions).toEqual([]);
  await store.update((s) => {
    s.settings.sound = false;
  });
  expect(store.read().settings.sound).toBe(false);
  const session = new LearningSession(api);
  const setup = {
    mode: "ueben" as const,
    topic: "Alle Themen",
    filters: {
      genres: store.info!.genres,
      sources: ["film" as const],
      difficulties: ["leicht" as const, "mittel" as const, "schwer" as const],
      familiarities: [1, 2, 3, 4] as (1 | 2 | 3 | 4)[],
    },
    solutionDisplay: "question" as const,
  };
  api.lost("quiz_game_call");
  await expect(session.start(setup)).rejects.toThrow("Bestätigung verloren");
  await session.retry();
  expect(JSON.stringify(session.current)).not.toContain("correctId");
  const id = session.run!.id;
  for (let i = 0; i < 10; i++) {
    const q = (
      await fixture.db.query<{ question: any }>(
        `select question from quiz_game_internal.questions where run_id=$1 and index=$2`,
        [id, i],
      )
    ).rows[0].question;
    if (i === 0) {
      api.lost("quiz_game_call");
      await expect(session.answer(q.correctId, false)).rejects.toThrow(
        "Bestätigung verloren",
      );
      await session.retry();
    } else await session.answer(q.correctId, false);
    if (i < 9) await session.next();
  }
  const resumed = new LearningSession(api);
  await resumed.resume(id);
  expect(resumed.items).toHaveLength(10);
  api.lost("quiz_game_call");
  await expect(resumed.finish()).rejects.toThrow("Bestätigung verloren");
  await resumed.retry();
  await store.refresh();
  expect(store.read().events).toHaveLength(10);
  expect(store.read().experience).toBeGreaterThan(0);
  const reward = await api.call<any>("quiz_game_view", {
    request_text: JSON.stringify({
      action: "round-experience",
      scope: "learn-" + id,
    }),
  });
  expect(reward.before).toBe(0);
  expect(reward.after).toBe(store.read().experience);
  expect(reward.learning).toHaveLength(10);
  expect(reward.learningAchievements).toMatchObject({
    before: {},
    after: { counts: { secureFacts: 10, experience: reward.after } },
  });
  const firstEvent = store.read().events[0];
  expect(
    await api.call("quiz_game_view", {
      request_text: JSON.stringify({
        action: "question-history",
        scope: firstEvent.questionId,
        topic: firstEvent.knowledgeId,
      }),
    }),
  ).toMatchObject({
    question: {
      seen: 1,
      answered: 1,
      correct: 1,
      wrong: 0,
      unanswered: 0,
      guessedCorrect: 0,
    },
    goal: { seen: 1 },
  });
  expect(
    reward.learning.every((x: any) => x.current.stage === 1 && x.firstSolved),
  ).toBe(true);
  expect(
    await api.call("quiz_game_view", {
      request_text: JSON.stringify({ action: "profile-stats" }),
    }),
  ).toEqual({
    played: 1,
    completed: 1,
    answered: 10,
    correct: 10,
    encountered: 10,
    recordRounds: 0,
    perfectTens: 1,
    zeroTens: 0,
    accuracy: 100,
  });
  expect(
    Object.values(reward.xp).reduce((n: number, xp) => n + Number(xp), 0),
  ).toBe(reward.after);
  const stranger = await fixture.client();
  expect(
    await stranger.api.call("quiz_game_view", {
      request_text: JSON.stringify({
        action: "round-experience",
        scope: "learn-" + id,
      }),
    }),
  ).toBeNull();
  expect(store.read().questions).toEqual([]);
  for (const e of store.read().events)
    expect(store.read().learning[e.knowledgeId]).toEqual(learn(undefined, e));
  const reopened = new OnlineGameStore(api, owner);
  await reopened.open();
  expect(reopened.read().rounds[0].archive?.questions).toHaveLength(10);
  expect(api.calls.some((c) => c.name === "quiz_sync_catalog")).toBe(false);
});

async function playerRun() {
  const { api, owner } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const session = new LearningSession(api);
  await session.start({
    mode: "ueben",
    topic: "Alle Themen",
    filters: {
      genres: store.info!.genres,
      sources: ["film"],
      difficulties: ["leicht", "mittel", "schwer"],
      familiarities: [1, 2, 3, 4],
    },
    solutionDisplay: "question",
  });
  return { api, owner, store, session };
}
it("verhindert fremde Zugriffe, parallele Starts und doppelte Antworten", async () => {
  const { api, owner, session } = await playerRun(),
    other = await fixture.client();
  const call = (body: object) =>
    api.call<any>("quiz_game_call", {
      request_text: JSON.stringify({ ...body, requestId: crypto.randomUUID() }),
    });
  await expect(
    other.api.call("quiz_game_call", {
      request_text: JSON.stringify({
        action: "resume",
        runId: session.run!.id,
      }),
    }),
  ).rejects.toThrow();
  await expect(
    new LearningSession(api).start({
      mode: "ueben",
      topic: "Alle Themen",
      filters: {
        genres: [],
        sources: ["film"],
        difficulties: ["leicht"],
        familiarities: [1, 2, 3, 4],
      },
      solutionDisplay: "question",
    }),
  ).rejects.toThrow("game_active");
  const current = structuredClone(session.current!);
  await expect(
    call({
      action: "answer",
      runId: session.run!.id,
      index: 0,
      nonce: crypto.randomUUID(),
      answerId: null,
      dontKnow: true,
    }),
  ).rejects.toThrow("game_question_changed");
  await session.answer({ dontKnow: true }, false);
  await expect(
    call({
      action: "answer",
      runId: session.run!.id,
      index: current.index,
      nonce: current.nonce,
      answerId: null,
      dontKnow: true,
    }),
  ).rejects.toThrow();
  const answers = await fixture.admin(() =>
    fixture.db.query<{ n: number }>(
      "select count(*)::integer n from quiz_game_internal.questions q join quiz_game_internal.runs r on r.id=q.run_id where r.owner_id=$1 and q.event is not null",
      [owner],
    ),
  );
  expect(answers.rows[0].n).toBe(1);
  await session.abort();
});
it("bewahrt Belege unverändert und projiziert später geraten markierte Antworten", async () => {
  const { api, session, store } = await playerRun();
  const q = (
    await fixture.admin(() =>
      fixture.db.query<{ question: any }>(
        "select question from quiz_game_internal.questions where run_id=$1",
        [session.run!.id],
      ),
    )
  ).rows[0].question;
  await session.answer(q.correctId, false);
  const packet = api.calls.at(-1)!.args;
  await session.guess();
  const replay = await api.call<any>("quiz_game_call", packet);
  expect(replay.item.event.guessed).toBe(false);
  await expect(
    api.call("quiz_game_call", {
      request_text: String(packet.request_text).replace(
        '"guessed":false',
        '"guessed":true',
      ),
    }),
  ).rejects.toThrow("game_receipt_mismatch");
  await session.abort();
  await store.refresh();
  expect(store.read().events[0].guessed).toBe(true);
  expect(store.read().learning[q.knowledgeId].stage).toBe(0);
});
it("kann eine laufende Runde durch einen leeren Entwicklungsstand ersetzen", async () => {
  const { store, session, api } = await playerRun();
  const { emptyState } = await import("../src/model");
  await store.update(
    (s) => {
      for (const key of Object.keys(s)) delete (s as any)[key];
      Object.assign(s, emptyState());
    },
    { replace: true },
  );
  expect(store.read().events).toEqual([]);
  expect(
    await api.call("quiz_game_view", {
      request_text: JSON.stringify({ action: "profile-stats" }),
    }),
  ).toMatchObject({ played: 0, completed: 0, answered: 0, encountered: 0 });
  const status = await api.call<any>("quiz_game_call", {
    request_text: JSON.stringify({ action: "status" }),
  });
  expect(status.active).toBeNull();
  const next = new LearningSession(api);
  await next.start({
    mode: "ueben",
    topic: "Alle Themen",
    filters: {
      genres: store.info!.genres,
      sources: ["film"],
      difficulties: ["leicht"],
      familiarities: [1, 2, 3, 4],
    },
    solutionDisplay: "question",
  });
  expect(next.run!.id).not.toBe(session.run!.id);
  await next.abort();
});
it("verwendet lokale Kalendertage auch beim Wechsel der Sommerzeit", async () => {
  const first = Date.parse("2026-10-24T23:30:00+02:00"),
    next = Date.parse("2026-10-25T00:00:00+02:00");
  const result = await fixture.admin(() =>
    fixture.db.query<{ day_key: string; next: number }>(
      "select quiz_game_internal.day_key($1,'Europe/Berlin') as day_key,quiz_game_internal.next_at($2::jsonb,$1,'Europe/Berlin')::double precision next",
      [
        first,
        JSON.stringify({ lastAdvancedDay: "2026-10-24", due: first - 1 }),
      ],
    ),
  );
  expect(result.rows[0]).toEqual({ day_key: "2026-10-24", next });
});
it("hält anonyme Nutzer von Kontodaten und privaten Tabellen fern", async () => {
  await fixture.admin(async () => {
    await fixture.db.exec("set role anon");
    try {
      await expect(
        fixture.db.query(
          'select public.quiz_game_call(\'{"action":"status"}\')',
        ),
      ).rejects.toThrow("permission denied");
      await expect(
        fixture.db.query("select * from quiz_game_internal.questions"),
      ).rejects.toThrow("permission denied");
      const result = await fixture.db.query<{ qs: any[] }>(
        "select public.quiz_trial_questions(null) qs",
      );
      expect(result.rows[0].qs).toHaveLength(10);
    } finally {
      await fixture.db.exec("reset role");
    }
  });
});

it("bewahrt begrenzten Lernstand vor einer Runde und zählt fällige Rundenziele serverseitig", async () => {
  const { api, store, session, owner } = await playerRun();
  const q = (
    await fixture.admin(() =>
      fixture.db.query<{ question: any }>(
        "select question from quiz_game_internal.questions where run_id=$1",
        [session.run!.id],
      ),
    )
  ).rows[0].question;
  await session.answer(q.correctId, false);
  await session.abort();
  await store.refresh();
  const previousRound = session.round().id;
  api.clockAt(Date.now() + 2 * 86400000);
  const view = () =>
    api.call<any>("quiz_game_view", {
      request_text: JSON.stringify({
        action: "round-repetitions",
        scope: previousRound,
        timezone: "Europe/Berlin",
      }),
    });
  expect((await view()).due).toBe(1);
  const next = new LearningSession(api);
  await next.start({
    mode: "fehler",
    topic: "Alle Themen",
    sourceRoundId: previousRound,
    filters: {
      genres: store.info!.genres,
      sources: ["film"],
      difficulties: ["leicht", "mittel", "schwer"],
      familiarities: [1, 2, 3, 4],
    },
    solutionDisplay: "question",
  });
  expect(next.run!.size).toBe(1);
  await next.answer({ dontKnow: true }, false);
  expect(next.round().before[q.knowledgeId].stage).toBe(1);
  const resumed = new LearningSession(api);
  await resumed.resume(next.run!.id);
  expect(resumed.round().before).toEqual(next.round().before);
  await resumed.finish();
  const reopened = new OnlineGameStore(api, owner);
  await reopened.open();
  expect(reopened.read().rounds.at(-1)!.before).toEqual({});
  expect((await view()).due).toBe(0);
});

it("bindet den gewählten Themenfilter statt des gleichnamigen Katalogfelds", async () => {
  const topic = (
    await fixture.admin(() =>
      fixture.db.query<{ topic: string }>(
        "select topic from quiz_game_internal.catalog_meta order by id limit 1",
      ),
    )
  ).rows[0].topic;
  const result = await fixture.admin(() =>
    fixture.db.query<{ n: number; invalid: number }>(
      `select count(*)::integer n,count(*) filter(where topic<>$1)::integer invalid from quiz_game_internal.pool(null,null,'ueben',null,$1,'{}')`,
      [topic],
    ),
  );
  const expected = await fixture.admin(() =>
    fixture.db.query<{ n: number }>(
      "select count(*)::integer n from quiz_game_internal.catalog_meta where topic=$1",
      [topic],
    ),
  );
  expect(result.rows[0].n).toBeGreaterThan(0);
  expect(result.rows[0].n).toBe(expected.rows[0].n);
  expect(result.rows[0].invalid).toBe(0);
});

it("öffnet eine wachsende Historie begrenzt, exportiert vollständig und erhält unberührte Rundenbeiträge", async () => {
  const { api, owner, store, session } = await playerRun();
  for (let i = 0; i < 10; i++) {
    await session.answer({ dontKnow: true }, false);
    if (i < 9) await session.next();
  }
  await session.finish();
  const generation = (
    await api.call<any>("quiz_sync_metadata", { expected_owner: owner })
  ).generation;
  await fixture.db.query(
    `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,deleted,changed_revision)
 select e.owner_id,e.generation,e.kind,case when e.kind='round' then e.id||'-copy-'||i else replace(e.id,e.round_id,e.round_id||'-copy-'||i) end,e.position+i*10,
 case when e.kind='round' then e.value||jsonb_build_object('id',e.id||'-copy-'||i,'events',(select jsonb_agg(replace(v,e.id,e.id||'-copy-'||i)) from jsonb_array_elements_text(e.value->'events') v))
 else e.value||jsonb_build_object('id',replace(e.id,e.round_id,e.round_id||'-copy-'||i),'roundId',e.round_id||'-copy-'||i) end,false,e.changed_revision
 from public.quiz_sync_entries e cross join generate_series(1,30) i where e.owner_id=$1 and e.generation=$2 and e.kind in ('round','event') and not e.deleted`,
    [owner, generation],
  );
  await fixture.db.query("select quiz_sync_internal.project($1,$2,null,true)", [
    owner,
    generation,
  ]);
  const before = (
    await fixture.db.query(
      "select * from public.quiz_player_totals where owner_id=$1 order by genre,difficulty",
      [owner],
    )
  ).rows;
  api.calls.length = 0;
  const traffic: { name: string; bytes: number }[] = [];
  const measured = {
    ...api,
    call: async <T>(name: string, args: Record<string, unknown>) => {
      const result = await api.call<T>(name, args);
      traffic.push({
        name,
        bytes: new TextEncoder().encode(JSON.stringify(result)).length,
      });
      return result;
    },
  };
  const opened = new OnlineGameStore(measured, owner);
  await opened.open();
  expect(opened.read().rounds).toHaveLength(1);
  expect(opened.read().events).toHaveLength(10);
  expect(api.calls.filter((c) => c.name === "quiz_sync_page")).toHaveLength(0);
  expect(
    api.calls.filter((c) => c.name === "quiz_sync_scope_page"),
  ).toHaveLength(1);
  await opened.update((s) => {
    s.settings.sound = false;
  });
  expect(
    (
      await fixture.db.query(
        "select * from public.quiz_player_totals where owner_id=$1 order by genre,difficulty",
        [owner],
      )
    ).rows,
  ).toEqual(before);
  const bootBytes = traffic.reduce((n, r) => n + r.bytes, 0);
  traffic.length = 0;
  const exported = await opened.exportState();
  const exportBytes = traffic.reduce((n, r) => n + r.bytes, 0);
  expect(exportBytes).toBeGreaterThan(bootBytes * 10);
  console.info(JSON.stringify({ historyRounds: 31, bootBytes, exportBytes }));
  expect(exported.rounds).toHaveLength(31);
  expect(exported.events).toHaveLength(310);
  expect(opened.read().rounds).toHaveLength(1);
  // A delete audit proves closing the next round does not clear old contributions.
  await fixture.db.exec(
    `create temporary table deleted_contributions(round_id text);create function public.test_contribution_deleted() returns trigger language plpgsql as $$begin insert into pg_temp.deleted_contributions values(old.round_id);return old;end$$;create trigger test_contribution_deleted after delete on public.quiz_round_contributions for each row execute function public.test_contribution_deleted();`,
  );
  try {
    const next = new LearningSession(api);
    await next.start({
      mode: "ueben",
      topic: "Alle Themen",
      filters: {
        genres: store.info!.genres,
        sources: ["film"],
        difficulties: ["leicht", "mittel", "schwer"],
        familiarities: [1, 2, 3, 4],
      },
      solutionDisplay: "question",
    });
    for (let i = 0; i < 10; i++) {
      await next.answer({ dontKnow: true }, false);
      if (i < 9) await next.next();
    }
    await next.finish();
    expect(
      (await fixture.db.query("select * from deleted_contributions")).rows,
    ).toEqual([]);
    expect((await opened.exportState()).rounds).toHaveLength(32);
  } finally {
    await fixture.db.exec(
      "drop trigger test_contribution_deleted on public.quiz_round_contributions;drop function public.test_contribution_deleted();drop table deleted_contributions;",
    );
  }
}, 30000);

it("ersetzt den aktuellen Bestand ohne alte Gesamtkataloge und behält nur laufende Rundenschnappschüsse", async () => {
  const { api, store, session } = await playerRun();
  const issued = structuredClone(session.current);
  const old = store.info!.hash;
  let next = "b".repeat(64);
  await fixture.db.query(
    `insert into quiz_game_internal.content_staging(hash,id,content) select $1,c.id,jsonb_build_object('q',jsonb_set(c.question,'{question}',to_jsonb((c.question->>'question')||' Aktuell.')),'presentation',jsonb_set(p.value,'{questionText}',to_jsonb((p.value->>'questionText')||' Aktuell.')))::text from quiz_ranked_internal.catalog c join quiz_game_internal.presentations p on p.id=c.id where c.release_hash=$2`,
    [next, old],
  );
  const proof = (
    await fixture.db.query<{ proof: string }>(
      `select encode(sha256(convert_to(string_agg(encode(sha256(convert_to(content,'UTF8')),'hex'),'' order by id collate "C"),'UTF8')),'hex') proof from quiz_game_internal.content_staging where hash=$1`,
      [next],
    )
  ).rows[0].proof;
  await fixture.db.query(
    "update quiz_game_internal.content_staging set hash=$1 where hash=$2",
    [proof, next],
  );
  next = proof;
  const n = (
    await fixture.db.query<{ n: number }>(
      "select count(*)::integer n from quiz_game_internal.content_staging where hash=$1",
      [next],
    )
  ).rows[0].n;
  const staged = (
    await fixture.db.query<{ id: string; content: string }>(
      "select id,content from quiz_game_internal.content_staging where hash=$1 limit 1",
      [next],
    )
  ).rows[0];
  await fixture.db.query(
    "update quiz_game_internal.content_staging set content=content||' ' where hash=$1 and id=$2",
    [next, staged.id],
  );
  await expect(
    fixture.db.query("select quiz_game_internal.activate_content($1,$2,$3)", [
      next,
      n,
      [],
    ]),
  ).rejects.toThrow("game_content_proof_mismatch");
  await fixture.db.query(
    "update quiz_game_internal.content_staging set content=$3 where hash=$1 and id=$2",
    [next, staged.id, staged.content],
  );
  await expect(
    fixture.db.query("select quiz_game_internal.activate_content($1,$2,$3)", [
      next,
      n + 1,
      [],
    ]),
  ).rejects.toThrow("game_content_incomplete");
  expect(
    (
      await fixture.db.query(
        "select distinct release_hash from quiz_ranked_internal.catalog",
      )
    ).rows,
  ).toEqual([{ release_hash: old }]);
  await fixture.db.query(
    `select quiz_game_internal.activate_content($1,$2,(select jsonb_agg(jsonb_build_object('film',film,'level',level)) from quiz_game_internal.familiarity))`,
    [next, n],
  );
  expect(
    (
      await fixture.db.query(
        "select distinct release_hash from quiz_ranked_internal.catalog",
      )
    ).rows,
  ).toEqual([{ release_hash: next }]);
  expect(
    (
      await fixture.db.query(
        "select to_regclass('public.quiz_catalog_releases') as name",
      )
    ).rows,
  ).toEqual([{ name: null }]);
  const resumed = new LearningSession(api);
  await resumed.resume(session.run!.id);
  expect(resumed.current).toEqual(issued);
  for (let i = 0; i < 10; i++) {
    await resumed.answer({ dontKnow: true }, false);
    if (i < 9) await resumed.next();
  }
  await resumed.finish();
  expect(
    (
      await fixture.db.query<any>(
        "select question_queue from quiz_game_internal.runs where id=$1",
        [session.run!.id],
      )
    ).rows[0].question_queue,
  ).toEqual([]);
  const fresh = await playerRun();
  expect(fresh.session.current!.question.question).toContain("Aktuell.");
}, 30000);

it("projiziert sichere Ziele aus kompakten Duell-/Importfragen einschließlich Preis- und Personenbereich", async () => {
  const { api, owner } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const samples = [
    ["film", "Science-Fiction"],
    ["actors", "Schauspieler"],
    ["awards", "Preisträger"],
  ] as const;
  for (const [source, area] of samples) {
    const q = importCsv(
      currentCsv({
        source,
        genre: source === "film" ? "Science-Fiction" : undefined,
        limit: 1,
      }),
    ).questions[0];
    await store.update((s) => {
      s.questions = [q];
      const round = startRound(s, {
        mode: "ueben",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        filters: {
          genres: null,
          sources: ["film", "actors", "awards"],
          difficulties: [q.difficulty],
          familiarities: [1, 2, 3, 4],
        },
      });
      expect(round.questions).toHaveLength(1);
      answer(s, round.id, q.id, q.correctId, 100);
      complete(s, round.id);
    });
    const rows = await fixture.admin(() =>
      fixture.db.query<{ goal: string; area: string }>(
        "select goal,area from quiz_game_internal.secure_goals where owner_id=$1 and goal=$2",
        [owner, q.knowledgeId],
      ),
    );
    expect(
      rows.rows,
      JSON.stringify({ source, rows: rows.rows }),
    ).toContainEqual({ goal: q.knowledgeId, area });
  }
  store.stop();
});

it("liest Personen-IDs aus dem aktuellen Metadatenformat und hält den internen Decoder privat", async () => {
  const packed = {
    id: "q",
    knowledgeId: "k",
    language: "de",
    domain: "Film",
    difficulty: "leicht",
    question: "Frage",
    explanation: "Grund",
    context: "Kontext",
    answers: [
      { text: "A", feedback: "" },
      { text: "B", feedback: "" },
      { text: "C", feedback: "" },
      { text: "D", feedback: "" },
    ],
  };
  for (const [metadata, expected] of [
    [{}, null],
    [{ person_id: "" }, ""],
    [{ person_id: 16 }, ""],
    [{ person_id: "ACTOR-001" }, "ACTOR-001"],
    [{ person_id: 0 }, "q"],
  ] as const) {
    const result = await fixture.db.query<{ value: string | null }>(
      "select quiz_game_internal.packed_question_person_id($1::jsonb) value",
      [JSON.stringify({ ...packed, metadata })],
    );
    expect(result.rows[0].value).toBe(expected);
  }
  const rights = await fixture.db.query<{ allowed: boolean }>(
    "select has_function_privilege('anon','quiz_game_internal.packed_question_person_id(jsonb)','execute') or has_function_privilege('authenticated','quiz_game_internal.packed_question_person_id(jsonb)','execute') allowed",
  );
  expect(rights.rows[0].allowed).toBe(false);
});

it("übernimmt eine aktuelle Proberunde nach gezieltem Nachladen genau einmal", async () => {
  const { api, owner } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const questions = await api.call<any[]>("quiz_trial_questions", {
    genre: null,
  });
  const state = emptyState(questions);
  const at = Date.parse("2026-10-11T12:00:00Z");
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    at,
  );
  for (const [i, q] of round.questions.entries())
    answer(state, round.id, q.id, q.correctId, 100, at + i);
  complete(state, round.id, at + 100);
  const trial = { state, expiresAt: at + 86400000 };
  api.lost("quiz_game_apply");
  await expect(store.update((s) => mergeTrial(s, trial))).rejects.toThrow(
    /Bestätigung verloren/,
  );
  await store.retry();
  await store.update((s) => mergeTrial(s, trial));
  const saved = await store.exportState();
  expect(saved.rounds).toHaveLength(1);
  expect(saved.events).toEqual(state.events);
  expect(saved.experience).toBe(state.experience);
  expect(
    api.calls.some(
      (c) =>
        c.name === "quiz_sync_scope_page" &&
        String(c.args.scope_text).includes("details"),
    ),
  ).toBe(true);
  expect(api.calls.some((c) => c.name === "quiz_sync_catalog")).toBe(false);
  store.stop();
});

it("weist alte Schreibpakete für serverseitige Spielstände vollständig ab", async () => {
  const { api, owner } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const before = store.read();
  const metadata = await api.call<any>("quiz_sync_metadata", {
    expected_owner: owner,
  });
  for (const row of [
    { kind: "field", id: "catalog", position: 0, value: { parts: [] } },
    {
      kind: "field",
      id: "settings",
      position: 0,
      value: { ...before.settings, sound: false },
    },
  ]) {
    await expect(
      api.call("quiz_sync_apply", {
        packet_text: JSON.stringify({
          format: "quiz-entry-sync-v1",
          protocol: 1,
          id: crypto.randomUUID(),
          owner,
          generation: metadata.generation,
          expectedRevision: metadata.revision,
          changes: [{ op: "put", row }],
          objects: [],
        }),
      }),
    ).rejects.toThrow(/does not exist/);
  }
  expect(
    await api.call("quiz_sync_metadata", { expected_owner: owner }),
  ).toEqual(metadata);
  const reopened = new OnlineGameStore(api, owner);
  await reopened.open();
  expect(reopened.read()).toEqual(before);
  await reopened.update((s) => {
    s.settings.sound = false;
  });
  expect(reopened.read().settings.sound).toBe(false);
  expect(api.calls.some((c) => c.name === "quiz_sync_catalog")).toBe(false);
});
it("verbietet den Wechsel eines Server-Spielstands zu einer Katalog-Generation", async () => {
  const { api, owner } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const metadata = await api.call<any>("quiz_sync_metadata", {
    expected_owner: owner,
  });
  const target = crypto.randomUUID();
  await api.call("quiz_sync_begin", {
    expected_owner: owner,
    target_generation: target,
    parent_generation: metadata.generation,
    expected_revision: metadata.revision,
  });
  await api.call("quiz_sync_stage", {
    expected_owner: owner,
    target_generation: target,
    changes: (
      await fixture.admin(() =>
        fixture.db.query<any>(
          "select kind,id,position,value from public.quiz_sync_entries where owner_id=$1 and generation=$2 and not deleted",
          [owner, metadata.generation],
        ),
      )
    ).rows.map((row) => ({
      op: "put",
      row:
        row.id === "catalog" && row.kind === "field"
          ? { ...row, value: { parts: [] } }
          : row,
    })),
  });
  const count = await fixture.admin(() =>
    fixture.db.query<any>(
      "select count(*)::integer n from public.quiz_sync_entries where owner_id=$1 and generation=$2",
      [owner, target],
    ),
  );
  await expect(
    api.call("quiz_sync_seal", {
      expected_owner: owner,
      target_generation: target,
      row_count: count.rows[0].n,
      object_count: 0,
    }),
  ).rejects.toThrow("invalid_game_format");
  expect(
    await api.call("quiz_sync_metadata", { expected_owner: owner }),
  ).toEqual(metadata);
  await store.update(
    (s) => {
      s.settings.sound = false;
    },
    { replace: true },
  );
  const reopened = new OnlineGameStore(api, owner);
  await reopened.open();
  expect(reopened.read().settings.sound).toBe(false);
});

it("berechnet Filmgruppen aus aktuellen leichten Zielen ohne feste Anker oder gespeicherte Kurzrechte", async () => {
  const { api, owner } = await fixture.client();
  await new OnlineGameStore(api, owner).open();
  const target = (
    await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    )
  ).rows[0].generation;
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`delete from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.catalog_meta select 'g'||lev||'-'||d||i,'g'||lev||'-'||d||i,'Test','Abenteuer','film',d,lev,'[]' from (values(1,'leicht',5),(1,'mittel',5),(3,'leicht',3)) v(lev,d,n) cross join lateral generate_series(1,n) i;
 insert into quiz_game_internal.catalog_meta values('variant','g1-leicht1','Test','Abenteuer','film','leicht',1,'[]');
 select quiz_game_internal.test_materialize_works();select quiz_game_internal.refresh_groups();`);
    await fixture.db.query(
      `update public.quiz_sync_entries set value='{"version":1,"earned":{"Abenteuer":{"difficulty":0,"familiarity":4}}}' where owner_id=$1 and kind='field' and id='journey'`,
      [owner],
    );
    const progress = async () =>
      (
        await fixture.db.query<{ p: any }>(
          "select quiz_game_internal.journey($1,$2)->'Abenteuer' p",
          [owner, target],
        )
      ).rows[0].p;
    const secure = async (d: string, n: number, lev = 1) =>
      fixture.db.query(
        `insert into quiz_game_internal.secure_goals select $1,$2,'g'||$5::int||'-'||$3||i,'Abenteuer',$3 from generate_series(1,$4::int) i on conflict do nothing`,
        [owner, target, d, n, lev],
      );
    expect(await progress()).toMatchObject({
      familiarity: 1,
      groups: [
        { total: 5, target: 3, answered: 0 },
        { level: 3, unlocked: false },
      ],
    });
    await secure("mittel", 5);
    await secure("leicht", 2);
    await secure("leicht", 2);
    await secure("leicht", 2, 3);
    expect(await progress()).toMatchObject({
      familiarity: 1,
      groups: [{ answered: 2 }, { answered: 2, unlocked: false }],
    });
    await secure("leicht", 3);
    expect(await progress()).toMatchObject({
      familiarity: 3,
      groups: [{ answered: 3 }, { unlocked: true }],
    });
    await fixture.db.exec(
      `insert into quiz_game_internal.catalog_meta select 'new'||i,'new'||i,'Test','Abenteuer','film','leicht',1,'[]' from generate_series(1,2) i;select quiz_game_internal.test_materialize_works();select quiz_game_internal.refresh_groups();`,
    );
    expect(await progress()).toMatchObject({
      familiarity: 1,
      groups: [{ total: 7, target: 4, answered: 3 }, { unlocked: false }],
    });
    await fixture.db.exec(
      "delete from quiz_game_internal.catalog_meta where knowledge_id='g1-leicht1';select quiz_game_internal.test_materialize_works();select quiz_game_internal.refresh_groups();",
    );
    expect(await progress()).toMatchObject({
      familiarity: 1,
      groups: [{ total: 6, target: 3, answered: 2 }, { unlocked: false }],
    });
    expect(
      (
        await fixture.db.query<{ obsolete: string | null }>(
          "select to_regclass('quiz_game_internal.curriculum') as obsolete",
        )
      ).rows[0].obsolete,
    ).toBeNull();
  } finally {
    await fixture.db.exec("rollback");
  }
});

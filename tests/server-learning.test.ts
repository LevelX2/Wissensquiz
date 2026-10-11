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
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions,
  );
  await fixture.seedRanked(release);
}, 30000);
afterAll(() => fixture?.db.close());
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
    fixture.db.query(
      "select quiz_game_internal.activate_content($1,$2,$3,$4)",
      [next, n, {}, []],
    ),
  ).rejects.toThrow("game_content_proof_mismatch");
  await fixture.db.query(
    "update quiz_game_internal.content_staging set content=$3 where hash=$1 and id=$2",
    [next, staged.id, staged.content],
  );
  await expect(
    fixture.db.query(
      "select quiz_game_internal.activate_content($1,$2,$3,$4)",
      [next, n + 1, {}, []],
    ),
  ).rejects.toThrow("game_content_incomplete");
  expect(
    (
      await fixture.db.query(
        "select distinct release_hash from quiz_ranked_internal.catalog",
      )
    ).rows,
  ).toEqual([{ release_hash: old }]);
  await fixture.db.query(
    `select quiz_game_internal.activate_content($1,$2,(select jsonb_object_agg(area,plan) from quiz_game_internal.curriculum),(select jsonb_agg(jsonb_build_object('film',film,'level',level)) from quiz_game_internal.familiarity))`,
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
    ["public/fragen.csv", "Science-Fiction"],
    ["public/schauspieler-fragen.csv", "Schauspieler"],
    ["public/preistraeger-fragen.csv", "Preisträger"],
  ] as const;
  for (const [file, area] of samples) {
    const q = importCsv(readFileSync(file, "utf8")).questions[0];
    await store.update((s) => {
      s.questions = [q];
      const round = startRound(s, {
        mode: "ueben",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        filters: {
          genres: [q.metadata.subdomain ?? q.domain],
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
    expect(rows.rows).toContainEqual({ goal: q.knowledgeId, area });
  }
  store.stop();
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

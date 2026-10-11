import { beforeAll, afterAll, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareRelease } from "../src/syncCodec";
import { importCsv } from "../src/importer";
import { OnlineGameStore } from "../src/onlineGameStore";
import { LearningSession } from "../src/learningRuns";
import { learn } from "../src/learning";
let fixture: Awaited<ReturnType<typeof syncFixture>>;
beforeAll(async () => {
  fixture = await syncFixture();
  const release = await prepareRelease(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions,
  );
  await fixture.seed(release);
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
  const store = new OnlineGameStore(api, owner, undefined, undefined);
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
  expect(store.read().questions).toEqual([]);
  for (const e of store.read().events)
    expect(store.read().learning[e.knowledgeId]).toEqual(learn(undefined, e));
  const reopened = new OnlineGameStore(api, owner, undefined, undefined);
  await reopened.open();
  expect(reopened.read().rounds[0].archive?.questions).toHaveLength(10);
  expect(api.calls.some((c) => c.name === "quiz_sync_catalog")).toBe(false);
});

async function playerRun() {
  const { api, owner } = await fixture.client();
  const store = new OnlineGameStore(api, owner, undefined, undefined);
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
  const reopened = new OnlineGameStore(api, owner, undefined, undefined);
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

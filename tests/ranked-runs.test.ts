import { afterAll, beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { importCsv } from "../src/importer";
import { prepareRelease, type PreparedRelease } from "../src/syncCodec";
import {
  RankedSession,
  rankedHistory,
  importRankedHistory,
  rankedFacts,
} from "../src/rankedRuns";
import { roundFact } from "../src/roundArchive";
import { OnlineGameStore } from "../src/onlineGameStore";
import { emptyState } from "../src/model";
import { validateBackup } from "../src/backupValidation";
import { startRound, answer, complete } from "../src/engine";

let fixture: Awaited<ReturnType<typeof syncFixture>>, release: PreparedRelease;
beforeAll(async () => {
  fixture = await syncFixture();
  // Real official question content, enough distinct targets in every level.
  release = await prepareRelease(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions,
  );
  await fixture.seed(release);
  await fixture.seedRanked(release);
}, 30000);
afterAll(() => fixture?.db.close());
it("wiederholt verlorene Start-, Frage- und Antwortbelege ohne Zeitneustart oder doppelte Wertung", async () => {
  const { api } = await fixture.client();
  api.clockAt(1800000000000);
  const session = new RankedSession(api, release.hash);
  api.lost("quiz_ranked_call");
  await expect(
    session.start({
      mode: "rekord",
      preset: "standard",
      solutionDisplay: "question",
    }),
  ).rejects.toThrow("Bestätigung verloren");
  const startText = api.calls.at(-1)!.args.request_text;
  api.clockAt(1800000005000);
  await session.retry();
  expect(api.calls.at(-1)!.args.request_text).toBe(startText);
  expect(session.elapsed()).toBeGreaterThanOrEqual(5000);
  const deadline = session.current!.deadline;
  const q = release.questions.find(
    (q) => q.id === session.current!.question.id,
  )!;
  api.lost("quiz_ranked_call");
  await expect(session.answer(q.correctId)).rejects.toThrow(
    "Bestätigung verloren",
  );
  const answerText = api.calls.at(-1)!.args.request_text;
  api.clockAt(1800000010000);
  await session.retry();
  expect(api.calls.at(-1)!.args.request_text).toBe(answerText);
  expect(session.items).toHaveLength(1);
  expect(session.items[0].event.elapsedMs).toBe(5000);
  expect(session.current!.deadline).toBe(deadline);
  api.lost("quiz_ranked_call");
  await expect(session.next()).rejects.toThrow("Bestätigung verloren");
  const nextText = api.calls.at(-1)!.args.request_text;
  api.clockAt(1800000015000);
  await session.retry();
  expect(api.calls.at(-1)!.args.request_text).toBe(nextText);
  expect(session.current!.index).toBe(1);
  expect(session.elapsed()).toBeGreaterThanOrEqual(5000);
});
it("erhält den festen Zehnermix und rekonstruiert bestätigte Ergebnisse nach einem Verbindungsabbruch", async () => {
  const { api, owner } = await fixture.client();
  const base = Date.now();
  api.clockAt(base);
  const store = new OnlineGameStore(
    api,
    owner,
    async () => release,
    async () => null,
  );
  await store.open();
  const session = new RankedSession(api, release.hash);
  await session.start({
    mode: "rekord",
    preset: "standard",
    solutionDisplay: "round",
  });
  const levels: string[] = [];
  for (let i = 0; i < 10; i++) {
    levels.push(session.current!.question.difficulty);
    api.clockAt(base + i * 2000 + 1000);
    const q = release.questions.find(
      (q) => q.id === session.current!.question.id,
    )!;
    await session.answer(q.correctId, i === 0);
    if (i < 9) await session.next();
  }
  expect(levels.filter((x) => x === "leicht")).toHaveLength(3);
  expect(levels.filter((x) => x === "mittel")).toHaveLength(4);
  expect(levels.filter((x) => x === "schwer")).toHaveLength(3);
  expect(session.run!.status).toBe("completed");
  const category = (
    await fixture.db.query<{ category: string }>(
      "select category from quiz_ranked_internal.scores where owner_id=$1",
      [owner],
    )
  ).rows[0].category;
  expect(
    (
      await fixture.db.query(
        "select * from public.quiz_record_runs($1,'all',0)",
        [category],
      )
    ).rows,
  ).toHaveLength(1);
  const history = await rankedHistory(api, session.run!.id);
  const facts = await rankedFacts(api, session.run!.id);
  expect(facts.items).toEqual(
    history.items.map((i) => ({ fact: roundFact(i.question), event: i.event })),
  );
  expect(JSON.stringify(facts)).not.toContain('"explanation"');
  expect(Buffer.byteLength(JSON.stringify(facts))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(history)),
  );
  const imported = emptyState(release.questions);
  importRankedHistory(imported, history);
  expect(validateBackup(imported).rounds[0].archive!.questions).toHaveLength(
    10,
  );
  const reopened = new OnlineGameStore(
    api,
    owner,
    async () => release,
    async () => null,
  );
  await reopened.open();
  expect(reopened.read().rounds[0].status).toBe("completed");
  expect(reopened.read().events).toHaveLength(10);
  expect(reopened.read().events[0].guessed).toBe(true);
  await reopened.recoverRanked();
  expect(reopened.read().events).toHaveLength(10);
});
it("lässt normale Speicherpakete, Generationstausch und alte Speicher-RPCs keine gewerteten Ergebnisse einschleusen", async () => {
  const { api, owner } = await fixture.client();
  const fake = emptyState(release.questions);
  const r = startRound(fake, {
    mode: "rekord",
    recordPreset: "standard",
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
  });
  for (let i = 0; i < 10; i++)
    answer(
      fake,
      r.id,
      r.questions[i].id,
      r.questions[i].correctId,
      0,
      Date.now(),
      i,
    );
  complete(fake, r.id);
  await api.call("quiz_save_state", {
    payload: fake,
    expected_revision: 0,
    expected_owner: owner,
  });
  const store = new OnlineGameStore(
    api,
    owner,
    async () => release,
    async () => ({ state: fake, revision: 1 }),
  );
  await store.open();
  await store.update((s) => {
    s.rounds[0].finishedAt = Date.now();
  });
  await store.update((s) => Object.assign(s, structuredClone(fake)), {
    replace: true,
  });
  for (const sql of [
    "select * from public.quiz_record_categories('rekord')",
    "select * from public.quiz_score_categories()",
  ]) {
    const rows = (await fixture.db.query(sql)).rows;
    expect(
      rows.every(
        (row: any) => !String(row.rule_version).startsWith("solo-v1."),
      ),
    ).toBe(true);
  }
  expect(
    (
      await fixture.db.query(
        "select * from quiz_ranked_internal.runs where owner_id=$1",
        [owner],
      )
    ).rows,
  ).toHaveLength(0);
});
it("trennt Konten auch bei bekannten Lauf-IDs und schützt interne Funktionen sowie den öffentlichen Aufruf vor Gästen", async () => {
  const { view } = await start();
  const outsider = await fixture.client();
  for (const action of ["abort", "history", "question", "answer"]) {
    await expect(
      request(outsider.api, {
        action,
        runId: view.run.id,
        requestId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        index: 0,
        nonce: view.current.nonce,
      }),
    ).rejects.toThrow("ranked_unavailable");
  }
  await fixture.db.exec("set role anon");
  try {
    await expect(
      fixture.db.query("select public.quiz_ranked_call('{}')"),
    ).rejects.toThrow(/permission denied/);
  } finally {
    await fixture.db.exec("reset role");
  }
  await fixture.db.exec("set role authenticated");
  try {
    await expect(
      fixture.db.query("select quiz_ranked_internal.call('{}')"),
    ).rejects.toThrow(/permission denied/);
  } finally {
    await fixture.db.exec("reset role");
  }
});
it("begrenzt neue Rundenstarts und erhält die Serverzeit während beliebig langer Erklärungen", async () => {
  const { api } = await fixture.client();
  api.clockAt(1800000000000);
  for (let i = 0; i < 10; i++) {
    const s = new RankedSession(api, release.hash);
    await s.start({
      mode: "zeitkonto",
      preset: "standard",
      solutionDisplay: "question",
    });
    await s.abort();
  }
  await expect(
    request(api, {
      action: "start",
      requestId: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      mode: "zeitkonto",
      preset: "standard",
      releaseHash: release.hash,
      solutionDisplay: "question",
    }),
  ).rejects.toThrow("ranked_rate_limit");
  api.clockAt(1800000061000);
  const s = new RankedSession(api, release.hash);
  await s.start({
    mode: "zeitkonto",
    preset: "standard",
    solutionDisplay: "question",
  });
  api.clockAt(1800000064000);
  await s.answer(
    release.questions.find((q) => q.id === s.current!.question.id)!.correctId,
  );
  const bank = s.run!.bankMs;
  api.clockAt(1800000124000);
  await s.next();
  expect(s.run!.bankMs).toBe(bank);
  expect(s.elapsed()).toBeLessThan(100);
});
const request = (
  api: Awaited<ReturnType<typeof fixture.client>>["api"],
  value: object,
) => api.call<any>("quiz_ranked_call", { request_text: JSON.stringify(value) });
async function start(mode = "fehlerfrei") {
  const { api, owner } = await fixture.client(),
    sessionId = crypto.randomUUID();
  const body = {
    action: "start",
    requestId: crypto.randomUUID(),
    sessionId,
    releaseHash: release.hash,
    mode,
    preset: "standard",
    solutionDisplay: "question",
  };
  return { api, owner, sessionId, body, view: await request(api, body) };
}
it("gibt nur die aktuelle Frage aus, bindet einen Lauf an eine Sitzung und schützt private Tabellen", async () => {
  const { api, owner, body, view } = await start();
  expect(view.current.index).toBe(0);
  expect(view.current.question).not.toHaveProperty("correctId");
  expect(view.current.question).not.toHaveProperty("explanation");
  expect(JSON.stringify(view)).not.toContain('"queue"');
  expect(
    view.current.question.answers.every((a: any) => !("feedback" in a)),
  ).toBe(true);
  expect((await request(api, body)).current).toEqual(view.current);
  const other = await fixture.client(owner);
  expect(await request(other.api, { action: "status" })).toEqual({
    activeId: view.run.id,
  });
  await expect(
    request(other.api, { ...body, requestId: crypto.randomUUID() }),
  ).rejects.toThrow("ranked_active");
  await expect(
    request(other.api, {
      action: "question",
      requestId: crypto.randomUUID(),
      runId: view.run.id,
      index: 0,
      sessionId: crypto.randomUUID(),
    }),
  ).rejects.toThrow("ranked_other_device");
  await fixture.db.exec("set role authenticated");
  try {
    await expect(
      fixture.db.query("select * from quiz_ranked_internal.runs"),
    ).rejects.toThrow(/permission denied/);
  } finally {
    await fixture.db.exec("reset role");
  }
});
it("bestimmt Antwortzeit und Punkte selbst, beantwortet genau einmal und verrät die nächste Frage erst beim Wechsel", async () => {
  const { api, sessionId, view } = await start();
  const common = {
    runId: view.run.id,
    sessionId,
    index: 0,
    nonce: view.current.nonce,
  };
  await expect(
    request(api, {
      ...common,
      action: "answer",
      requestId: crypto.randomUUID(),
      answerId: "bad",
    }),
  ).rejects.toThrow("invalid_ranked_answer");
  await expect(
    request(api, {
      ...common,
      action: "answer",
      requestId: crypto.randomUUID(),
      answerId: "a",
      elapsedMs: 0,
    }),
  ).rejects.toThrow("invalid_ranked_request");
  const correct = release.questions.find(
    (q) => q.id === view.current.question.id,
  )!.correctId;
  const body = {
    ...common,
    action: "answer",
    requestId: crypto.randomUUID(),
    answerId: correct,
  };
  const saved = await request(api, body);
  expect(saved.item.event.correct).toBe(true);
  expect(saved.item.event.elapsedMs).toBeGreaterThanOrEqual(0);
  expect(saved.run.answered).toBe(1);
  expect(saved).not.toHaveProperty("current");
  expect((await request(api, body)).item).toEqual(saved.item);
  await expect(
    request(api, { ...body, requestId: crypto.randomUUID() }),
  ).rejects.toThrow("ranked_wrong_question");
  await expect(request(api, { ...body, answerId: "other" })).rejects.toThrow(
    "ranked_request_reused",
  );
  await expect(
    request(api, {
      action: "question",
      requestId: crypto.randomUUID(),
      runId: view.run.id,
      sessionId,
      index: 2,
    }),
  ).rejects.toThrow("ranked_wrong_question");
  const next = await request(api, {
    action: "question",
    requestId: crypto.randomUUID(),
    runId: view.run.id,
    sessionId,
    index: 1,
  });
  expect(next.current.index).toBe(1);
  expect(next.current.nonce).not.toBe(view.current.nonce);
});
it("verhindert aktive Verlaufsabfragen und wertet zwei konkurrierende Antworten nur einmal", async () => {
  const { api, view, sessionId } = await start();
  await expect(rankedHistory(api, view.run.id)).rejects.toThrow(
    "ranked_unavailable",
  );
  await expect(rankedFacts(api, view.run.id)).rejects.toThrow(
    "ranked_unavailable",
  );
  const body = {
    action: "answer",
    runId: view.run.id,
    sessionId,
    index: 0,
    nonce: view.current.nonce,
    answerId: release.questions.find((q) => q.id === view.current.question.id)!
      .correctId,
  };
  const replies = await Promise.allSettled([
    request(api, { ...body, requestId: crypto.randomUUID() }),
    request(api, { ...body, requestId: crypto.randomUUID() }),
  ]);
  expect(replies.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(replies.filter((r) => r.status === "rejected")).toHaveLength(1);
  expect(
    (
      await fixture.db.query(
        "select answered from quiz_ranked_internal.runs where id=$1",
        [view.run.id],
      )
    ).rows[0],
  ).toEqual({ answered: 1 });
  const receipt = (
    await fixture.db.query<{ response: object }>(
      "select response from quiz_ranked_internal.receipts where owner_id=(select owner_id from quiz_ranked_internal.runs where id=$1) and response ? 'item'",
      [view.run.id],
    )
  ).rows[0].response;
  expect(receipt).not.toHaveProperty("item.question");
});
it("lässt neue Läufe nur mit dem vom Betreiber aktivierten Katalog starten und bindet laufende Runden an ihren Bestand", async () => {
  const { api, view, sessionId } = await start();
  const nextRelease = await prepareRelease(
    release.questions.map((q) => ({ ...q, question: q.question + " " })),
  );
  await fixture.seed(nextRelease);
  await fixture.seedRanked(nextRelease);
  try {
    const fresh = await fixture.client();
    await expect(
      request(fresh.api, {
        action: "start",
        requestId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        releaseHash: release.hash,
        mode: "rekord",
        preset: "standard",
        solutionDisplay: "question",
      }),
    ).rejects.toThrow("ranked_catalog_missing");
    const current = await request(api, {
      action: "question",
      requestId: crypto.randomUUID(),
      runId: view.run.id,
      sessionId,
      index: 0,
    });
    expect(current.current).toEqual(view.current);
  } finally {
    await fixture.db.query(
      "update quiz_ranked_internal.config set release_hash=$1",
      [release.hash],
    );
  }
});
it("schreibt die private Endlosliste erst beim neuen Zyklus und archiviert einen bewussten Abbruch ohne vorab geladene Folgefrage", async () => {
  const goals = new Set<string>();
  const chosen = ["leicht", "mittel", "schwer"].flatMap((level) =>
    release.questions
      .filter((q) => {
        if (q.difficulty !== level || goals.has(q.knowledgeId)) return false;
        goals.add(q.knowledgeId);
        return true;
      })
      .slice(0, level === "mittel" ? 4 : 3),
  );
  const small = await prepareRelease(chosen);
  await fixture.seed(small);
  await fixture.seedRanked(small);
  try {
    const { api } = await fixture.client();
    api.clockAt(1800000000000);
    const session = new RankedSession(api, small.hash);
    await session.start({
      mode: "fehlerfrei",
      preset: "standard",
      solutionDisplay: "question",
    });
    const first = (
      await fixture.db.query<{
        queue: string[];
        queue_position: number;
        cycle: number;
      }>(
        "select queue,queue_position,cycle from quiz_ranked_internal.runs where id=$1",
        [session.run!.id],
      )
    ).rows[0];
    const seen: string[] = [];
    for (let i = 0; i < 12; i++) {
      const current = session.current!.question;
      seen.push(current.knowledgeId);
      api.clockAt(1800000000000 + (i + 1) * 1000);
      await session.answer(
        small.questions.find((q) => q.id === current.id)!.correctId,
      );
      if (i < 11) await session.next();
      if (i === 0) {
        const second = (
          await fixture.db.query(
            "select queue,queue_position,cycle from quiz_ranked_internal.runs where id=$1",
            [session.run!.id],
          )
        ).rows[0];
        expect(second).toEqual({ ...first, queue_position: 2 });
      }
    }
    expect(new Set(seen.slice(0, 10)).size).toBe(10);
    expect(seen[10]).not.toBe(seen[9]);
    expect(
      (
        await fixture.db.query(
          "select cycle,queue_position from quiz_ranked_internal.runs where id=$1",
          [session.run!.id],
        )
      ).rows[0],
    ).toEqual({ cycle: 2, queue_position: 2 });
    await session.abort();
    const state = emptyState(release.questions);
    importRankedHistory(state, { run: session.run!, items: session.items });
    expect(validateBackup(state).rounds[0].archive!.questions).toHaveLength(12);
    expect(state.rounds[0].status).toBe("aborted");
  } finally {
    await fixture.db.query(
      "update quiz_ranked_internal.config set release_hash=$1",
      [release.hash],
    );
  }
});
it("wertet verspätete Antworten als Zeitablauf und lässt eine andere Sitzung nur ausdrücklich abbrechen", async () => {
  const { api, owner, sessionId, view } = await start();
  await fixture.db.query(
    "update quiz_ranked_internal.questions set issued_at=clock_timestamp()-interval '31 seconds',deadline=clock_timestamp()-interval '1 second' where run_id=$1",
    [view.run.id],
  );
  const saved = await request(api, {
    action: "answer",
    requestId: crypto.randomUUID(),
    runId: view.run.id,
    sessionId,
    index: 0,
    nonce: view.current.nonce,
    answerId: release.questions.find((q) => q.id === view.current.question.id)!
      .correctId,
  });
  expect(saved.item.event.correct).toBe(false);
  expect(saved.item.event.answerId).toBe(null);
  expect(saved.run.status).toBe("completed");
  expect(saved.run.points).toBe(0);
  const other = await fixture.client(owner);
  const run2 = await request(other.api, {
    action: "start",
    requestId: crypto.randomUUID(),
    sessionId,
    releaseHash: release.hash,
    mode: "zeitkonto",
    preset: "standard",
    solutionDisplay: "question",
  });
  await request(api, {
    action: "abort",
    runId: run2.run.id,
    requestId: crypto.randomUUID(),
  });
  await expect(
    request(other.api, {
      action: "question",
      runId: run2.run.id,
      sessionId,
      index: 0,
      requestId: crypto.randomUUID(),
    }),
  ).rejects.toThrow("ranked_unavailable");
});

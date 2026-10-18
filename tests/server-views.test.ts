import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import { OnlineGameStore } from "../src/onlineGameStore";
import { LearningSession } from "../src/learningRuns";
import { readView } from "../src/serverViews";
import { parseServerView, type ViewAction } from "../src/serverViewSchemas";
import type { SyncRemote } from "../src/entryRemote";

let fixture: Awaited<ReturnType<typeof syncFixture>>;
beforeAll(async () => {
  fixture = await syncFixture();
  const release = await prepareTestContent(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions,
  );
  await fixture.seedRanked(release);
}, 30000);
afterAll(() => fixture?.db.close());

it("validiert alle aktuellen SQL-Übersichten und vollständige Rundenbelohnungen", async () => {
  const { api, owner } = await fixture.client();
  api.clockAt(Date.parse("2026-10-18T10:00:00Z"));
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const session = new LearningSession(api);
  await session.start({
    mode: "ueben",
    solutionDisplay: "question",
    topic: "Alle Themen",
    filters: {
      genres: ["Science-Fiction"],
      sources: ["film"],
      difficulties: ["leicht", "mittel", "schwer"],
      familiarities: [1, 2, 3, 4],
    },
  });
  for (let i = 0; i < session.run!.size; i++) {
    await session.answer({ dontKnow: true }, false);
    if (i + 1 < session.run!.size) await session.next();
  }
  await session.finish();
  const round = session.round();
  for (const action of [
    "info",
    "selection",
    "summary",
    "topics",
    "areas",
    "question-history",
    "profile-progress",
    "round-experience",
    "round-repetitions",
  ] as ViewAction[]) {
    const request = {
      action,
      mode: "ueben",
      scope: action === "question-history" ? round.questions[0].id : round.id,
      topic:
        action === "question-history"
          ? round.questions[0].knowledgeId
          : "Alle Themen",
    };
    const value = await readView(
      api,
      action,
      JSON.stringify(request),
      store.revision,
    );
    expect(value, action).not.toBeNull();
  }
  store.stop();
});

it.each([
  ["summary", { unseen: 0 }],
  [
    "topics",
    {
      items: [{ topic: "Test", genres: [], goals: 1, learning: null }],
      nextCursor: null,
    },
  ],
  [
    "selection",
    { poolSize: -1, selectionSize: "10", repetitions: {}, journey: {} },
  ],
  ["areas", {}],
  ["question-history", { question: { seen: "eins" }, goal: null }],
  [
    "profile-progress",
    { statistics: {}, achievements: { counts: {}, available: {} } },
  ],
  ["round-experience", { xp: { correct: "viel" } }],
  ["round-repetitions", { due: 0, nextAt: "morgen" }],
] as const)(
  "weist unvollständige/falsche %s-Antworten kontrolliert zurück",
  (action, value) => {
    expect(() => parseServerView(action, value)).toThrow("Serverübersicht");
  },
);

it("verwirft einen ungültigen Cacheeintrag und führt den nächsten Abruf erneut aus", async () => {
  const call = vi
    .fn()
    .mockResolvedValueOnce({ items: null })
    .mockResolvedValue({ items: [], nextCursor: null });
  const api: SyncRemote = { call: call as SyncRemote["call"], stop() {} };
  const key = '{"action":"topics"}';
  await expect(readView(api, "topics", key, 1)).rejects.toThrow(
    "Serverübersicht",
  );
  expect(await readView(api, "topics", key, 1)).toEqual({
    items: [],
    nextCursor: null,
  });
  await readView(api, "topics", key, 1);
  expect(call).toHaveBeenCalledTimes(2);
});

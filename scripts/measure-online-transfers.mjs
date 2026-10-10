import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

// Isolated, in-memory SQL only. Never reads authentication or production data.
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
let fixture;
try {
  const { syncFixture } = await server.ssrLoadModule(
    "/tests/helpers/sync-fixture.ts",
  );
  const { OnlineGameStore } = await server.ssrLoadModule(
    "/src/onlineGameStore.ts",
  );
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { prepareRelease } = await server.ssrLoadModule("/src/syncCodec.ts");
  const { uploadObject } = await server.ssrLoadModule("/src/entryRemote.ts");
  const { startRound, answer, rebuild } =
    await server.ssrLoadModule("/src/engine.ts");
  const { archiveClosedRounds } = await server.ssrLoadModule(
    "/src/roundArchive.ts",
  );
  const catalog = emptyState();
  addPackages(
    catalog,
    await Promise.all(
      packages.map(async (pkg) => ({
        filename: pkg.filename,
        text: await readFile(`public${pkg.path}`, "utf8"),
      })),
    ),
  );
  const release = await prepareRelease(catalog.questions);
  fixture = await syncFixture();
  await fixture.seed(release);
  const now = Date.UTC(2026, 9, 10, 10);
  const questions = [
    ...new Map(
      catalog.questions
        .filter((q) => !q.id.startsWith("FACT-"))
        .map((q) => [q.knowledgeId, q]),
    ).values(),
  ].slice(0, 10);
  function history(count) {
    const state = structuredClone(catalog);
    for (let i = 0; i < count; i++) {
      const round = {
        id: `synthetic-${i}`,
        mode: "ueben",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        ruleVersion: "1",
        questions,
        order: questions.map((q) => q.answers.map((a) => a.id)),
        events: [],
        before: {},
        startedAt: now - (count - i) * 60000,
        finishedAt: now - (count - i) * 60000 + 20000,
        status: "completed",
      };
      questions.forEach((q, index) => {
        const event = {
          id: `${round.id}:${q.knowledgeId}`,
          roundId: round.id,
          questionId: q.id,
          knowledgeId: q.knowledgeId,
          version: q.version,
          answerId: q.correctId,
          correct: true,
          guessed: false,
          elapsedMs: 1000,
          at: round.startedAt + index * 1000,
          knowledgePoints: 0,
          timeBonus: 0,
        };
        state.events.push(event);
        round.events.push(event.id);
      });
      state.rounds.push(round);
    }
    rebuild(state);
    archiveClosedRounds(state);
    return state;
  }
  const bytes = (value) => Buffer.byteLength(JSON.stringify(value));
  const results = [];
  for (const count of [0, 100, 500]) {
    for (const mode of ["ueben", "rekord", "fehlerfrei", "zeitkonto"]) {
      let seed = 123456;
      const random = Math.random;
      Math.random = () =>
        (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32;
      const { api, owner } = await fixture.client();
      const metrics = [];
      const remote = {
        stop() {},
        async call(name, args, timeout) {
          const result = await api.call(name, args, timeout);
          metrics.push({
            name,
            args,
            requestBytes: bytes(args),
            responseBytes: bytes(result),
          });
          return result;
        },
      };
      const store = new OnlineGameStore(
        remote,
        owner,
        async () => release,
        async () => ({ state: history(count), revision: 0 }),
      );
      try {
        await store.open();
        for (const action of [
          "unchanged",
          "setting",
          "round-start",
          "answer",
        ]) {
          metrics.length = 0;
          const started = performance.now();
          await store.update(
            (state) => {
              if (action === "setting")
                state.settings.sound = !state.settings.sound;
              if (action === "round-start")
                startRound(
                  state,
                  {
                    mode,
                    topic: "Alle Themen",
                    difficulty: "Alle Stufen",
                    ...(mode === "rekord" ? { recordPreset: "standard" } : {}),
                  },
                  now,
                );
              if (action === "answer") {
                const round = state.rounds.at(-1),
                  q = round.questions[0];
                answer(state, round.id, q.id, q.correctId, 1000, now + 1000);
              }
            },
            { reuseCatalog: true, progressOnly: action !== "round-start" },
          );
          const elapsedMs = performance.now() - started;
          // Reproduce the former separate-object transport from the SAME packet.
          const former = [];
          for (const request of metrics) {
            if (request.name !== "quiz_sync_apply") {
              former.push(request);
              continue;
            }
            const packet = JSON.parse(request.args.packet_text);
            for (const object of packet.objects)
              await uploadObject(
                {
                  stop() {},
                  async call(name, args) {
                    former.push({ name, requestBytes: bytes(args) });
                  },
                },
                owner,
                packet.generation,
                object,
              );
            packet.objects = [];
            // Stable JSON field ordering does not change UTF-8 size.
            former.push({
              name: request.name,
              requestBytes: bytes({ packet_text: JSON.stringify(packet) }),
            });
          }
          const round = store.read().rounds.at(-1);
          results.push({
            historyRounds: count,
            mode,
            action,
            requests: metrics.length,
            requestBytes: metrics.reduce((s, m) => s + m.requestBytes, 0),
            responseBytes: metrics.reduce((s, m) => s + m.responseBytes, 0),
            formerRequests: former.length,
            formerRequestBytes: former.reduce((s, m) => s + m.requestBytes, 0),
            localSqlElapsedMs: Math.round(elapsedMs),
            ...(action === "answer" && round?.run
              ? {
                  runPoolBytes: bytes(round.run.pool),
                  runQueueBytes: bytes(round.run.queue),
                }
              : {}),
          });
          assert.equal(
            metrics.filter((m) => m.name === "quiz_sync_apply").length,
            action === "unchanged" ? 0 : 1,
          );
        }
        const reopened = new OnlineGameStore(
          remote,
          owner,
          async () => release,
          async () => null,
        );
        await reopened.open();
        assert.deepEqual(reopened.read(), store.read());
        reopened.stop();
      } finally {
        Math.random = random;
        store.stop();
      }
    }
  }
  const report = {
    date: "2026-10-10",
    catalogQuestions: catalog.questions.length,
    environment:
      "PGlite, echtes SQL-Protokoll, synthetische Konten, kontrollierte Zeit und Zufallsauswahl",
    limits:
      "UTF-8-JSON-Körper ohne HTTP/Auth/TLS/Kompression. Zeiten sind lokale SQL- und Clientzeiten, keine Mobilnetz-Latenzen. Vergleich des früheren Einzeluploads aus denselben Paketen rekonstruiert; keine erneute Produktionsmessung.",
    results,
  };
  await writeFile(
    "docs/Online-Datenuebertragung-Messung-2026-10-10.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await fixture?.db.close();
  await server.close();
}

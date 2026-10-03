import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { strict as assert } from "node:assert";

// Analysis only: public packages and synthetic games. No account API or browser data.
const server = await createServer({ server: { middlewareMode: true } });
const originalRandom = Math.random;
let seed = 20261003;
Math.random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const bytes = (value) => Buffer.byteLength(JSON.stringify(value), "utf8");
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const options = {
  mode: "rekord",
  topic: "Alle Themen",
  difficulty: "Alle Stufen",
};
const baseTime = Date.parse("2026-01-01T12:00:00Z");

try {
  const { packages, addPackages } = await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { startRound, answer, complete, guess } =
    await server.ssrLoadModule("/src/engine.ts");
  const { encodeCloudState, decodeCloudState } =
    await server.ssrLoadModule("/src/cloudCodec.ts");
  const { encodeQuestionCatalog, decodeQuestionCatalog } =
    await server.ssrLoadModule("/src/catalogCodec.ts");
  const { validateBackup } = await server.ssrLoadModule("/src/storage.ts");
  const state = emptyState();
  addPackages(
    state,
    await Promise.all(
      packages.map(async (pkg) => ({
        filename: pkg.filename,
        text: await readFile(`public${pkg.path}`, "utf8"),
      })),
    ),
  );
  state.imports.forEach((item) => (item.at = baseTime));
  const samples = [];
  const checkpoints = new Set([0, 10, 100, 300]);

  function delta(before, after, kind) {
    const changed = (left, right) => JSON.stringify(left) !== JSON.stringify(right);
    const maps = (left, right) => ({
      upsert: Object.fromEntries(
        Object.entries(right).filter(([key, value]) => changed(left[key], value)),
      ),
      remove: Object.keys(left).filter((key) => !(key in right)),
    });
    const entities = (left, right) => {
      const byId = new Map(left.map((item) => [item.id, item]));
      return {
        upsert: right.filter((item) => changed(byId.get(item.id), item)),
        remove: left.filter((item) => !right.some((other) => other.id === item.id))
          .map((item) => item.id),
      };
    };
    // A proposed entity delta, not a production protocol. Retains all changed fields.
    const result = {
      format: "proposal-entity-delta-v1",
      batchId: "00000000-0000-4000-8000-000000000001",
      expectedRevision: 123,
      kind,
      catalogHash: hash(before.questions),
      events: entities(before.events, after.events),
      rounds: entities(before.rounds, after.rounds),
      learning: maps(before.learning, after.learning),
      fields: Object.fromEntries(
        Object.keys(after)
          .filter((key) => !["questions", "events", "rounds", "learning"].includes(key))
          .filter((key) => changed(before[key], after[key]))
          .map((key) => [key, after[key]]),
      ),
    };
    assert.equal(JSON.stringify(before.questions), JSON.stringify(after.questions));
    const reconstructed = structuredClone(before);
    Object.assign(reconstructed, result.fields);
    for (const key of ["events", "rounds"]) {
      const changes = result[key];
      const byId = new Map(changes.upsert.map((item) => [item.id, item]));
      reconstructed[key] = reconstructed[key]
        .filter((item) => !changes.remove.includes(item.id))
        .map((item) => byId.get(item.id) ?? item);
      const ids = new Set(reconstructed[key].map((item) => item.id));
      reconstructed[key].push(...changes.upsert.filter((item) => !ids.has(item.id)));
    }
    for (const key of result.learning.remove) delete reconstructed.learning[key];
    Object.assign(reconstructed.learning, result.learning.upsert);
    assert.deepEqual(reconstructed, after);
    return result;
  }

  async function inspect(roundCount) {
    const checked = validateBackup(state);
    const cloud = await encodeCloudState(checked);
    assert.deepEqual(await decodeCloudState(cloud), checked);
    const { questions, storageFormat: _, ...progress } = cloud;
    const packedCatalog = encodeQuestionCatalog(checked.questions);
    assert.equal(JSON.stringify(decodeQuestionCatalog(packedCatalog)), JSON.stringify(checked.questions));
    const progressWithReference = {
      storageFormat: "proposal-catalog-reference-v1",
      catalogHash: hash(checked.questions),
      ...progress,
    };
    const catalogCompactBase64 = gzipSync(packedCatalog).toString("base64");
    const split = {};
    for (const [key, value] of Object.entries(progress)) split[key] = bytes(value);
    const deltas = [];
    const changedSettings = structuredClone(cloud);
    changedSettings.settings.sound = !changedSettings.settings.sound;
    deltas.push({ action: "setting", bytes: bytes(delta(cloud, changedSettings, "setting")) });
    const active = structuredClone(checked);
    const round = startRound(active, options, baseTime + (roundCount + 1) * 86400000);
    round.id = `synthetic-active-${String(roundCount).padStart(4, "0")}`;
    const beforeAnswer = await encodeCloudState(validateBackup(active));
    const question = round.questions[0];
    answer(active, round.id, question.id, question.correctId, 5000, round.startedAt + 5000);
    const afterAnswer = await encodeCloudState(validateBackup(active));
    deltas.push({ action: "answer", bytes: bytes(delta(beforeAnswer, afterAnswer, "answer")) });
    guess(active, active.events.at(-1).id);
    const afterGuess = await encodeCloudState(validateBackup(active));
    deltas.push({ action: "guess-correction", bytes: bytes(delta(afterAnswer, afterGuess, "guess-correction")) });
    samples.push({
      completedRounds: roundCount,
      events: checked.events.length,
      fullCloudBytes: bytes(cloud),
      catalogBase64Bytes: questions.data.length,
      compactCatalogBase64Bytes: catalogCompactBase64.length,
      progressWithReferenceBytes: bytes(progressWithReference),
      progressFieldsBytes: split,
      deltas,
    });
  }

  for (let n = 0; n <= 300; n++) {
    if (checkpoints.has(n)) await inspect(n);
    if (n === 300) break;
    const now = baseTime + n * 86400000;
    const round = startRound(state, options, now);
    round.id = `synthetic-round-${String(n).padStart(4, "0")}`;
    for (let i = 0; i < round.questions.length; i++) {
      const q = round.questions[i];
      const choice = i % 4 === 0 ? q.answers.find((a) => a.id !== q.correctId).id : q.correctId;
      answer(state, round.id, q.id, choice, 5000, now + (i + 1) * 6000);
      if (i % 7 === 1) guess(state, state.events.at(-1).id);
    }
    complete(state, round.id, now + 120000);
  }
  const report = {
    format: "storage-sync-analysis-v1",
    date: "2026-10-03",
    scope: "Public catalog and synthetic games only; JSON payload measurements, not PostgreSQL disk or a server load test.",
    questions: state.questions.length,
    assumptions: "Deterministic random selection; fixed synthetic times; five questions in first round, ten subsequently; controlled mistakes and guess corrections.",
    proposedDeltaLimitations: "Entity replacement delta, including the entire affected compact round. No SQL endpoint, persistent outbox, idempotency receipt, read cursor, authentication, or wire protocol has been implemented. Catalog imports and full restores need separate protocols.",
    checks: { cloudRoundtrip: true, catalogRoundtrip: true, exactDeltaReconstruction: true, backupValidation: true },
    samples,
  };
  await writeFile("docs/Speicher-und-Sync-Analyse.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ questions: report.questions, checks: report.checks, samples: samples.map(({ progressFieldsBytes: _, ...sample }) => sample) }, null, 2));
} finally {
  Math.random = originalRandom;
  await server.close();
}

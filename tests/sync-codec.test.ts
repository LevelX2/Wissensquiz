import { beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { addPackages, packages } from "../src/packages";
import { emptyState, type State } from "../src/model";
import { answer, complete, guess, startRound } from "../src/engine";
import { prepareFactQuestion } from "../src/filmFacts";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
import { validateBackup } from "../src/backupValidation";
import {
  prepareRelease,
  verifyRelease,
  compileState,
  reconstructState,
  difference,
  applyDifference,
  verifyObject,
  rowKey,
  type PreparedRelease,
} from "../src/syncCodec";

let base: State, release: PreparedRelease;
const now = 1700000000000;
beforeAll(async () => {
  base = emptyState();
  addPackages(
    base,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  release = await prepareRelease(base.questions);
}, 30000);
it("bildet den vollständigen App-Katalog einschließlich generierter Fragen und Kategorien unveränderlich ab", async () => {
  expect(release.questions).toHaveLength(10877);
  expect((await verifyRelease(release)).questions).toEqual(base.questions);
  const doc = await compileState(validateBackup(base), [release]);
  expect(doc.rows.get(rowKey("field", "catalog"))!.value).toEqual({
    parts: [{ release: release.hash, start: 0, count: 10877 }],
  });
  expect(doc.objects.size).toBe(0);
  expect(reconstructState(doc, [release])).toEqual(validateBackup(base));
}, 30000);
it("erhält private Abweichungen, ausgelassene Teile, Reihenfolge und historische Jahresantworten ohne ID-Überschreibung", async () => {
  const state = structuredClone(base);
  const year = state.questions.find((q) => q.metadata.fact_kind === "year")!;
  const r = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  const variant = prepareFactQuestion(year, year, () => 0.2);
  r.questions = [variant];
  r.order = [variant.answers.map((a) => a.id)];
  state.questions[0].metadata.private_column = "privater Import";
  state.questions.splice(1, 3);
  state.bundledQuestionIds = state.bundledQuestionIds?.filter((id) =>
    state.questions.some((q) => q.id === id),
  );
  state.questions.push({
    ...structuredClone(state.questions[0]),
    id: "PRIVATE-1",
    knowledgeId: "PRIVATE-1",
  });
  const checked = validateBackup(state),
    doc = await compileState(checked, [release]);
  expect(reconstructState(doc, [release])).toEqual(checked);
  expect(
    reconstructState(doc, [release]).rounds[0].questions[0].answers,
  ).toEqual(variant.answers);
  for (const object of doc.objects.values()) await verifyObject(object);
  expect(release.questions[0].metadata.private_column).toBeUndefined();
});
it("erzeugt für Laufzeitsnapshots nach Geräteabruf keine künstlichen Änderungen durch JSON-Feldreihenfolge", async () => {
  const state = structuredClone(base);
  const year = state.questions.find((q) => q.metadata.fact_kind === "year")!;
  const variant = prepareFactQuestion(year, year, () => 0.2);
  const r = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  r.questions = [
    Object.fromEntries(Object.entries(variant).reverse()) as typeof variant,
  ];
  r.order = [variant.answers.map((a) => a.id)];
  // Internal App mutations need not pass through backup validation first.
  const checked = validateBackup(state);
  const document = await compileState(checked, [release]);
  const rebuilt = reconstructState(document, [release]);
  const next = await compileState(rebuilt, [release], document, false);
  expect(difference(document, next)).toEqual({ changes: [], objects: [] });
  expect(rebuilt.rounds[0].questions[0].answers).toEqual(variant.answers);
});
it("überträgt Antworten und Rate-Korrekturen gezielt, unabhängig von großem before und unveränderten Katalogdaten", async () => {
  const state = structuredClone(base);
  const r = startRound(
    state,
    { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  r.before = Object.fromEntries(
    state.questions.slice(0, 1000).map((q) => [
      q.knowledgeId,
      {
        knowledgeId: q.knowledgeId,
        stage: 0,
        status: "entdeckt",
        due: now,
        lastSecure: null,
        lastSeenAt: null,
        lastAdvancedDay: null,
        secureDays: [],
        seen: 0,
      },
    ]),
  );
  const first = await compileState(validateBackup(state), [release]);
  answer(
    state,
    r.id,
    r.questions[0].id,
    r.questions[0].correctId,
    1000,
    now + 1000,
  );
  const checked = validateBackup(state);
  const second = await compileState(checked, [release], first, true),
    delta = difference(first, second);
  expect(delta.objects).toHaveLength(0);
  expect(Buffer.byteLength(JSON.stringify(delta))).toBeLessThan(12000);
  expect(reconstructState(applyDifference(first, delta), [release])).toEqual(
    checked,
  );
  guess(state, state.events.at(-1)!.id);
  const third = await compileState(
    validateBackup(state),
    [release],
    second,
    true,
  );
  expect(
    difference(second, third).changes.filter(
      (c) => c.op === "put" && c.row.kind === "event",
    ),
  ).toHaveLength(1);
  expect(reconstructState(third, [release]).rounds[0].before).toEqual(r.before);
});
it("liest Voll-, v1- und v2-Sicherungen, Nullantworten, Abschlüsse und entfernte Einträge vollständig", async () => {
  const state = structuredClone(base);
  const r = startRound(
    state,
    { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  r.questions.forEach((q, i) =>
    answer(
      state,
      r.id,
      q.id,
      i === 0 ? null : q.correctId,
      i === 0 ? 30000 : 1000,
      now + (i + 1) * 30000,
    ),
  );
  complete(state, r.id, now + 180000);
  const checked = validateBackup(state),
    packed = await encodeCloudState(checked);
  for (const value of [
    checked,
    packed,
    { ...packed, storageFormat: "quiz-cloud-compact-v1" },
  ]) {
    const read = validateBackup(await decodeCloudState(value));
    expect(
      reconstructState(await compileState(read, [release]), [release]),
    ).toEqual(checked);
  }
  const prior = await compileState(checked, [release]);
  const reset = validateBackup(base),
    next = await compileState(reset, [release], prior);
  expect(
    reconstructState(applyDifference(prior, difference(prior, next)), [
      release,
    ]),
  ).toEqual(reset);
}, 30000);
it("verweigert beschädigte Inhalte, fehlende historische Releases und falsche Ergebnisfelder", async () => {
  const state = structuredClone(base);
  startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  const doc = await compileState(validateBackup(state), [release]);
  expect(() => reconstructState(doc)).toThrow("Katalogausschnitt");
  const object = [...doc.objects.values()][0];
  await expect(
    verifyObject({ ...object, text: object.text + " " }),
  ).rejects.toThrow("Inhaltsnachweis");
  const row = doc.rows.get(rowKey("round", state.rounds[0].id))!;
  (row.value as { questions: { correctId: string }[] }).questions[0].correctId =
    "falsch";
  expect(() => reconstructState(doc, [release])).toThrow("Ergebnisfelder");
});

it("erhält eigenständige Expertenrechte der produktiven Fragenbereiche im Eintrags- und v2-Rücklauf", async () => {
  const state = validateBackup({
    ...structuredClone(base),
    journey: {
      version: 1,
      independentAreas: true,
      earned: {
        Schauspieler: { difficulty: 3, familiarity: 0 },
        Preisträger: { difficulty: 3, familiarity: 0 },
      },
    },
  });
  const document = await compileState(state, [release]);
  const rebuilt = reconstructState(document, [release]);
  expect(rebuilt).toEqual(state);
  expect(
    difference(
      document,
      await compileState(rebuilt, [release], document, false),
    ),
  ).toEqual({ changes: [], objects: [] });
  expect(await decodeCloudState(await encodeCloudState(rebuilt))).toEqual(
    state,
  );
});

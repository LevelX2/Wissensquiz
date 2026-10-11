import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import { startRound, answer, guess } from "../src/engine";
import {
  compileState,
  reconstructState,
  difference,
  applyDifference,
  verifyObject,
  rowKey,
} from "../src/syncCodec";
const questions = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions.slice(0, 12);
const now = 1700000000000;
function running() {
  const state = emptyState(structuredClone(questions));
  startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  return state;
}
function expected(state: ReturnType<typeof emptyState>) {
  const next = structuredClone(state);
  delete next.bundledQuestionIds;
  next.questions = [
    ...new Map(
      next.rounds.flatMap((r) => r.questions).map((q) => [q.id, q]),
    ).values(),
  ];
  return next;
}
it("speichert aus dem Fragenbestand nur den Servermarker und keine Vollkatalogobjekte", async () => {
  const state = emptyState(questions);
  state.bundledQuestionIds = questions.map((q) => q.id);
  const doc = await compileState(structuredClone(state));
  expect(doc.rows.get("field:catalog")?.value).toEqual({
    source: "server",
    parts: [],
  });
  expect(doc.rows.has("field:bundledQuestionIds")).toBe(false);
  expect(doc.objects.size).toBe(0);
  expect(reconstructState(doc)).toEqual(expected(state));
});
it("erhält individuelle Rundensnapshots und Antwortreihenfolgen ohne Katalogarchiv", async () => {
  const state = running();
  state.rounds[0].questions[0].metadata.private_column =
    "individueller Snapshot";
  const doc = await compileState(structuredClone(state));
  expect(reconstructState(doc)).toEqual(expected(state));
  for (const object of doc.objects.values()) await verifyObject(object);
  expect(
    [...doc.objects.values()]
      .filter((o) => o.encoding === "questions-field-refs-v1")
      .every((o) => JSON.parse(o.text).length === 1),
  ).toBe(true);
});
it("erzeugt beim erneuten Kompilieren keine künstlichen Änderungen durch Feldreihenfolge", async () => {
  const state = running();
  state.rounds[0].questions = state.rounds[0].questions.map(
    (q) => Object.fromEntries(Object.entries(q).reverse()) as typeof q,
  );
  const first = await compileState(structuredClone(state));
  const rebuilt = reconstructState(first);
  const second = await compileState(rebuilt, first);
  expect(difference(first, second)).toEqual({ changes: [], objects: [] });
});
it("überträgt Antwort und Rate-Korrektur gezielt und verwendet unveränderte Snapshots erneut", async () => {
  const state = running(),
    round = state.rounds[0],
    q = round.questions[0];
  const first = await compileState(structuredClone(state));
  answer(state, round.id, q.id, q.correctId, 1000, now + 1000);
  const second = await compileState(structuredClone(state), first, true),
    delta = difference(first, second);
  expect(delta.objects).toHaveLength(0);
  expect(Buffer.byteLength(JSON.stringify(delta))).toBeLessThan(12000);
  expect(reconstructState(applyDifference(first, delta))).toEqual(
    expected(state),
  );
  guess(state, state.events[0].id);
  const third = await compileState(structuredClone(state), second, true);
  expect(
    difference(second, third).changes.filter(
      (c) => c.op === "put" && c.row.kind === "event",
    ),
  ).toHaveLength(1);
});
it("weist beschädigte Nachweise, fehlende Snapshots und manipulierte Ergebnisfelder ab", async () => {
  const state = running(),
    doc = await compileState(structuredClone(state)),
    object = [...doc.objects.values()][0];
  await expect(
    verifyObject({ ...object, text: object.text + " " }),
  ).rejects.toThrow("Inhaltsnachweis");
  const missing = { rows: doc.rows, objects: new Map(doc.objects) };
  missing.objects.clear();
  expect(() => reconstructState(missing)).toThrow("Inhalt fehlt");
  const row = doc.rows.get(rowKey("round", state.rounds[0].id))!;
  (row.value as { questions: { correctId: string }[] }).questions[0].correctId =
    "falsch";
  expect(() => reconstructState(doc)).toThrow("Ergebnisfelder");
});
it("akzeptiert weder Vollkatalogmarker noch Releaseverweise", async () => {
  const state = running(),
    doc = await compileState(structuredClone(state));
  doc.rows.get("field:catalog")!.value = { parts: [] };
  expect(() => reconstructState(doc)).toThrow("Speicherformat");
  doc.rows.get("field:catalog")!.value = { source: "server", parts: [] };
  (doc.rows.get("round:" + state.rounds[0].id)!.value as any).questions[0].ref =
    { release: "0".repeat(64), index: 0 };
  expect(() => reconstructState(doc)).toThrow("Fragenverweis");
});

import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { emptyState, type State } from "../src/model";
import { importCsv } from "../src/importer";
import { answer, complete, selectQuestions, startRound } from "../src/engine";
import { discoveryContext } from "../src/discovery";
import { genreOf } from "../src/filters";
import { familiarityOf } from "../src/familiarity";

const questions = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions;
const goals = [...new Map(questions.map((q) => [q.knowledgeId, q])).values()];
const options = {
  mode: "entdecken" as const,
  topic: "Alle Themen",
  difficulty: "Alle Stufen",
  size: 10,
  now: 100_000,
};
function play(state: State, qs = goals.slice(0, 1), at = 1000) {
  const r = startRound(state, { ...options, difficulty: "leicht" }, at);
  r.questions = qs;
  r.order = qs.map((q) => q.answers.map((a) => a.id));
  for (const q of qs) answer(state, r.id, q.id, q.correctId, 100, at + 100);
  complete(state, r.id, at + 200);
  return r;
}

it("Filmreise reserviert die halbe Runde für fällige Wiederholungen, auch bei vielen neuen Zielen", () => {
  const s = emptyState(questions);
  play(s, goals.slice(0, 30));
  for (const p of Object.values(s.learning)) p.due = 0;
  const before = structuredClone(s);
  for (const random of [() => 0, () => 0.5, () => 0.999]) {
    const selected = selectQuestions(
      questions,
      s.learning,
      { ...options, now: 2 * 86_400_000, ...discoveryContext(s) },
      random,
    );
    expect(selected).toHaveLength(10);
    expect(selected.filter((q) => !s.learning[q.knowledgeId])).toHaveLength(5);
    expect(selected.filter((q) => s.learning[q.knowledgeId])).toHaveLength(5);
    expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(10);
  }
  expect(s).toEqual(before);
});

it("drei direkt aufeinanderfolgende Sci-Fi-Runden wiederholen bei genügend neuen Zielen nichts", () => {
  const s = emptyState(questions);
  const used = new Set<string>();
  for (let i = 0; i < 3; i++) {
    const r = startRound(
      s,
      { ...options, difficulty: "leicht" },
      1000 + i * 1000,
    );
    for (const q of r.questions) {
      expect(used.has(q.knowledgeId)).toBe(false);
      used.add(q.knowledgeId);
      answer(s, r.id, q.id, q.correctId, 100, 1100 + i * 1000);
    }
    complete(s, r.id, 1200 + i * 1000);
  }
  expect(used.size).toBe(25);
});

it("stellt die letzten drei Runden zurück und verwendet sie nur bei kleinem Restbestand", () => {
  const s = emptyState(questions);
  const pool = goals.slice(0, 15);
  play(s, pool.slice(0, 12), 1000);
  for (let i = 12; i < 15; i++) play(s, [pool[i]], i * 1000);
  const context = discoveryContext(s);
  expect(context.recentKnowledgeIds).toEqual(
    new Set(pool.slice(12).map((q) => q.knowledgeId)),
  );
  const selected = selectQuestions(pool, s.learning, {
    ...options,
    ...context,
  });
  expect(selected).toHaveLength(10);
  expect(
    selected.every((q) => !context.recentKnowledgeIds.has(q.knowledgeId)),
  ).toBe(true);
  const small = selectQuestions(pool.slice(10), s.learning, {
    ...options,
    ...context,
  });
  expect(small).toHaveLength(5);
  expect(new Set(small.map((q) => q.knowledgeId)).size).toBe(5);
});

it("führt in freigeschaltetes Mittel ein, erhält Filter und beendet den Vorrang nach fünf gesehenen Zielen", () => {
  const s = emptyState(questions);
  play(s, goals.filter((q) => q.difficulty === "leicht").slice(0, 22));
  const context = discoveryContext(s);
  const picked = selectQuestions(
    questions,
    s.learning,
    { ...options, ...context },
    () => 0.5,
  );
  expect(
    picked.filter((q) => q.difficulty === "mittel").length,
  ).toBeGreaterThanOrEqual(5);
  expect(picked.every((q) => !s.learning[q.knowledgeId])).toBe(true);
  const mixed = startRound(s, options, options.now);
  expect(
    mixed.questions.filter((q) => q.difficulty === "mittel").length,
  ).toBeGreaterThanOrEqual(5);
  expect(mixed.questions.some((q) => q.difficulty === "schwer")).toBe(false);
  mixed.status = "aborted";
  const easy = startRound(s, { ...options, difficulty: "leicht" }, options.now);
  expect(easy.questions.every((q) => q.difficulty === "leicht")).toBe(true);
  easy.status = "aborted";
  play(s, goals.filter((q) => q.difficulty === "mittel").slice(0, 5), 3000);
  expect(
    [...discoveryContext(s).introductoryQuestionIds].some(
      (id) => questions.find((q) => q.id === id)?.difficulty === "mittel",
    ),
  ).toBe(false);
  const filtered = selectQuestions(questions, s.learning, {
    ...options,
    ...context,
    filters: { genres: [genreOf(questions[0])], difficulties: ["leicht"] },
  });
  expect(filtered.every((q) => q.difficulty === "leicht")).toBe(true);
});

it("führt Schwer nur bei echter Freischaltung ein und behält historische Runden unverändert", () => {
  const s = emptyState(questions);
  s.settings.allDifficulties = true;
  expect(discoveryContext(s).introductoryQuestionIds.size).toBe(0);
  play(s, goals.filter((q) => q.difficulty === "leicht").slice(0, 22), 1000);
  play(s, goals.filter((q) => q.difficulty === "mittel").slice(0, 22), 2000);
  s.settings.allDifficulties = false;
  const oldRounds = structuredClone(s.rounds);
  const oldEvents = structuredClone(s.events);
  const r = startRound(s, options, 3000);
  expect(
    r.questions.filter((q) => q.difficulty === "schwer").length,
  ).toBeGreaterThanOrEqual(5);
  expect(s.rounds.slice(0, -1)).toEqual(oldRounds);
  expect(s.events).toEqual(oldEvents);
});

it("füllt die Filmreise mit fälligen Zielen, wenn keine neuen verfügbar sind", () => {
  const s = emptyState(questions);
  play(s, goals.slice(0, 22));
  for (const p of Object.values(s.learning)) p.due = 0;
  const selected = selectQuestions(goals.slice(0, 22), s.learning, {
    ...options,
    now: 2 * 86_400_000,
    ...discoveryContext(s),
  });
  expect(selected).toHaveLength(10);
  const practice = selectQuestions(goals.slice(0, 40), s.learning, {
    ...options,
    mode: "ueben",
    ...discoveryContext(s),
  });
  expect(practice).toHaveLength(10);
  const record = selectQuestions(goals.slice(0, 22), s.learning, {
    ...options,
    mode: "rekord",
    ...discoveryContext(s),
  });
  expect(record).toHaveLength(10);
});

it("wählt ausschließlich fällige Ziele, priorisiert alte Termine und verwendet dieselbe Tagesgrenze wie die Anzeige", () => {
  const s = emptyState(questions);
  play(s, goals.slice(0, 12));
  const at = 2 * 86_400_000;
  goals.slice(0, 12).forEach((q, i) => {
    s.learning[q.knowledgeId].due = i * 1000;
  });
  const selected = selectQuestions(questions, s.learning, {
    ...options,
    now: at,
    learningSelection: "due",
  });
  expect(selected).toHaveLength(10);
  expect(new Set(selected.map((q) => q.knowledgeId))).toEqual(
    new Set(goals.slice(0, 10).map((q) => q.knowledgeId)),
  );
  expect(
    selectQuestions(questions, s.learning, {
      ...options,
      learningSelection: "due",
    }),
  ).toEqual([]); // Same learning day, despite manually overdue due values.
  expect(
    selectQuestions(goals.slice(10), s.learning, {
      ...options,
      now: at,
      learningSelection: "due",
    }),
  ).toHaveLength(2);
  expect(
    selectQuestions(goals.slice(12), s.learning, {
      ...options,
      now: at,
      learningSelection: "due",
    }),
  ).toEqual([]);
});

it("reine Wiederholungen steigen trotz verfügbarer neuer Fragen bei sicherer Antwort auf Stufe 2", () => {
  const s = emptyState(questions);
  const first = play(
    s,
    goals
      .filter((q) => q.difficulty === "leicht" && familiarityOf(q) === 1)
      .slice(0, 3),
  );
  const at = 2 * 86_400_000;
  const round = startRound(
    s,
    { ...options, difficulty: "leicht", learningSelection: "due" },
    at,
  );
  expect(new Set(round.questions.map((q) => q.knowledgeId))).toEqual(
    new Set(first.questions.map((q) => q.knowledgeId)),
  );
  for (const q of round.questions) {
    answer(s, round.id, q.id, q.correctId, 100, at + 100);
    expect(s.learning[q.knowledgeId].stage).toBe(2);
    expect(s.learning[q.knowledgeId].due).toBe(at + 100 + 3 * 86_400_000);
  }
});

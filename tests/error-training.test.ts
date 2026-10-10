import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  answer,
  complete,
  DAY,
  guess,
  selectQuestions,
  startRound,
} from "../src/engine";
import { repetitionContext, openMistakes } from "../src/errorTraining";
import { roundSummary } from "../src/roundSummary";
import { importCsv } from "../src/importer";
import {
  emptyState,
  type AnswerEvent,
  type Question,
  type State,
} from "../src/model";
import { validateBackup } from "../src/storage";
import { decodeCloudState, encodeCloudState } from "../src/cloudCodec";

const catalog = importCsv(readFileSync("public/fragen.csv", "utf8")).questions;
const qs = [...new Map(catalog.map((q) => [q.knowledgeId, q])).values()].slice(
  0,
  6,
);
const now = new Date(2026, 9, 2, 12).getTime();
function played(
  state: State,
  questions: Question[],
  outcomes: ("correct" | "wrong" | "guessed" | "timeout")[],
  at = now,
) {
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    at,
  );
  round.questions = structuredClone(questions);
  round.order = questions.map((q) => q.answers.map((a) => a.id));
  round.familiaritySnapshot = undefined;
  questions.forEach((q, i) => {
    const outcome = outcomes[i];
    answer(
      state,
      round.id,
      q.id,
      outcome === "timeout"
        ? null
        : outcome === "wrong"
          ? q.answers.find((a) => a.id !== q.correctId)!.id
          : q.correctId,
      1000,
      at + i,
    );
    if (outcome === "guessed") guess(state, `${round.id}:${q.knowledgeId}`);
  });
  complete(state, round.id, at + questions.length);
  return round;
}
const options = {
  mode: "fehler" as const,
  topic: "Alle Themen",
  difficulty: "Alle Stufen",
  size: 10,
  now,
};

describe("Wiederholen", () => {
  it("nimmt echte Fehler und Zeitabläufe auf, erhält sie bei geratenen Treffern und löst sie nur sicher", () => {
    const state = emptyState(qs);
    played(state, qs.slice(0, 3), ["wrong", "timeout", "guessed"]);
    played(state, qs.slice(0, 2), ["guessed", "correct"], now + 10);
    const mistakes = openMistakes([...state.events].reverse());
    expect([...mistakes.keys()]).toEqual([qs[0].knowledgeId]);
    expect(mistakes.get(qs[0].knowledgeId)?.failures).toBe(1);
    played(state, [qs[0]], ["correct"], now + 20);
    expect(openMistakes(state.events).size).toBe(0);
    played(state, [qs[0]], ["wrong"], now + 30);
    expect(openMistakes(state.events).get(qs[0].knowledgeId)?.failures).toBe(1);
  });

  it("wählt fällige Filmziele unabhängig von richtig, falsch oder geraten, älteste Termine zuerst", () => {
    const variant = { ...qs[0], id: "variant" };
    const actor = {
      ...qs[3],
      id: "actor",
      knowledgeId: "actor-goal",
      metadata: { ...qs[3].metadata, person_id: "actor" },
    };
    const state = emptyState([...qs, variant, actor]);
    played(
      state,
      [qs[0], qs[1], qs[2], actor],
      ["correct", "wrong", "guessed", "correct"],
      now - 2 * DAY,
    );
    const selected = selectQuestions(
      state.questions,
      state.learning,
      options,
      () => 0.5,
    );
    expect(selected.map((q) => q.knowledgeId)).toEqual([
      qs[1].knowledgeId,
      qs[2].knowledgeId,
      qs[0].knowledgeId,
    ]);
    expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(3);
    expect(
      selectQuestions(state.questions, state.learning, { ...options, size: 1 }),
    ).toHaveLength(1);
  });

  it("hält die Auswahl ein und ergänzt weder neue noch zu frühe Ziele", () => {
    const state = emptyState(qs);
    played(state, qs.slice(0, 2), ["wrong", "correct"]);
    expect(selectQuestions(qs, state.learning, options)).toEqual([]);
    expect(
      selectQuestions(qs, state.learning, { ...options, now: now + 600_000 }),
    ).toHaveLength(1);
    expect(
      selectQuestions(qs, state.learning, { ...options, now: now + 2 * DAY }),
    ).toHaveLength(2);
    expect(
      selectQuestions(qs, state.learning, {
        ...options,
        now: now + 2 * DAY,
        filters: { genres: ["Horror"], difficulties: ["leicht"] },
      }),
    ).toEqual([]);
    expect(
      selectQuestions(qs, state.learning, {
        ...options,
        now: now + 2 * DAY,
        topic: "Nicht vorhandenes Filmthema",
      }),
    ).toEqual([]);
  });

  it("beachtet die Tagesgrenze nach einem Fehler und speichert den gemeinsamen Lernstand", async () => {
    const state = emptyState(qs);
    played(state, [qs[0]], ["correct"]);
    played(state, [qs[0]], ["wrong"], now + 10);
    expect(() => startRound(state, options, now + 700_000)).toThrow(
      /keine Fragen/,
    );
    const retry = startRound(state, options, now + DAY);
    answer(
      state,
      retry.id,
      retry.questions[0].id,
      retry.questions[0].correctId,
      1000,
      now + DAY + 1,
    );
    expect(state.learning[qs[0].knowledgeId].stage).toBe(1);
    complete(state, retry.id, now + DAY + 2);
    state.settings.roundSetup = {
      mode: "fehler",
      genres: null,
      categories: [],
      difficulties: ["leicht"],
      familiarities: [1, 2, 3, 4],
    };
    const restored = validateBackup(JSON.parse(JSON.stringify(state)));
    const cloud = validateBackup(
      await decodeCloudState(await encodeCloudState(state)),
    );
    expect(restored.rounds.at(-1)?.mode).toBe("fehler");
    expect(cloud.events).toEqual(state.events);
    expect(cloud.learning).toEqual(state.learning);
    expect(state.records).toEqual({});
  });

  it("begrenzt Wiederholungen einer Runde auf deren beantwortete Ziele, auch richtige", () => {
    const state = emptyState(qs);
    const source = played(
      state,
      qs.slice(0, 2),
      ["wrong", "correct"],
      now - 2 * DAY,
    );
    played(state, [qs[2]], ["wrong"], now - DAY);
    expect(repetitionContext(state, source.id).knowledgeIds).toEqual(
      new Set(qs.slice(0, 2).map((q) => q.knowledgeId)),
    );
    const retry = startRound(
      state,
      { ...options, sourceRoundId: source.id },
      now,
    );
    expect(new Set(retry.questions.map((q) => q.knowledgeId))).toEqual(
      new Set(qs.slice(0, 2).map((q) => q.knowledgeId)),
    );
    expect(() => repetitionContext(state, retry.id)).toThrow(
      /abgeschlossene Runde/,
    );
    answer(
      state,
      retry.id,
      retry.questions[0].id,
      { dontKnow: true },
      1000,
      now + 1,
    );
    retry.status = "aborted";
    expect(
      selectQuestions(qs, state.learning, {
        ...options,
        now: now + 600_001,
      }).some((q) => q.knowledgeId === retry.questions[0].knowledgeId),
    ).toBe(true);
  });

  it("erzeugt ohne fällige Ziele keine Runde und erhält den Stand", () => {
    const state = emptyState(qs);
    played(state, [qs[0]], ["guessed"]);
    const before = structuredClone(state);
    expect(() => startRound(state, options, now + 10)).toThrow(/keine Fragen/);
    expect(state).toEqual(before);
  });
});

describe("Rundenauswertung", () => {
  it("zählt die Zwischenaufstiege 1 auf 2 und 2 auf 3 trotz unverändertem Status", () => {
    const state = emptyState(qs);
    const first = played(state, [qs[0]], ["correct"]);
    const second = played(state, [qs[0]], ["correct"], now + DAY);
    const third = played(state, [qs[0]], ["correct"], now + 4 * DAY);
    expect(roundSummary(state, first)).toMatchObject({
      firstSolved: 1,
      advanced: 1,
    });
    expect(roundSummary(state, second)).toMatchObject({
      firstSolved: 0,
      advanced: 1,
      improved: 0,
      secured: 0,
    });
    expect(roundSummary(state, third)).toMatchObject({
      firstSolved: 0,
      advanced: 1,
      improved: 0,
      secured: 0,
    });
    const early = played(state, [qs[0]], ["correct"], now + 10 * DAY);
    expect(roundSummary(state, early)).toMatchObject({
      advanced: 0,
      firstSolved: 0,
    });
    const last = played(state, [qs[0]], ["correct"], now + 11 * DAY);
    expect(roundSummary(state, last)).toMatchObject({
      advanced: 1,
      secured: 1,
    });
  });
  it("trennt Treffer, geratene Antworten, Fehler und Zeitabläufe und bleibt bei späteren Runden historisch stabil", () => {
    const state = emptyState(qs);
    played(state, [qs[0]], ["wrong"]);
    const round = played(
      state,
      qs.slice(0, 5),
      ["correct", "guessed", "correct", "wrong", "timeout"],
      now + 10,
    );
    const summary = roundSummary(state, round);
    expect(summary).toMatchObject({
      correct: 3,
      accuracy: 60,
      wrong: 1,
      timedOut: 1,
      guessed: 1,
      recovered: 1,
      newGoals: 4,
      bestStreak: 1,
      improved: 2,
      secured: 0,
      advanced: 2,
      firstSolved: 2,
    });
    expect(summary.genres.get("Science-Fiction")).toEqual({
      correct: 3,
      total: 5,
    });
    played(state, qs.slice(0, 5), Array(5).fill("correct"), now + 20);
    expect(roundSummary(state, round)).toEqual(summary);
  });

  it("zeigt null Prozent ohne Treffer und zählt nur sichere Serien", () => {
    const state = emptyState(qs);
    const wrong = played(state, qs.slice(0, 3), ["wrong", "wrong", "timeout"]);
    expect(roundSummary(state, wrong)).toMatchObject({
      accuracy: 0,
      bestStreak: 0,
    });
    const right = played(
      state,
      qs.slice(0, 3),
      ["correct", "correct", "correct"],
      now + 10,
    );
    expect(roundSummary(state, right)).toMatchObject({
      accuracy: 100,
      bestStreak: 3,
      recovered: 3,
    });
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  answer,
  complete,
  guess,
  selectQuestions,
  startRound,
} from "../src/engine";
import { errorTrainingContext, openMistakes } from "../src/errorTraining";
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

describe("Fehlertraining", () => {
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

  it("priorisiert wiederholte offene Fehler vor jüngeren Einzelproblemen und nimmt die konkrete Fehlervariante", () => {
    const original = catalog.find((q) =>
      catalog.some((v) => v.id !== q.id && v.knowledgeId === q.knowledgeId),
    )!;
    const variant = catalog.find(
      (q) => q.id !== original.id && q.knowledgeId === original.knowledgeId,
    )!;
    const others = qs
      .filter((q) => q.knowledgeId !== original.knowledgeId)
      .slice(0, 2);
    const state = emptyState([original, variant, ...others]);
    played(state, [variant], ["wrong"]);
    played(state, [variant, ...others], ["wrong", "wrong", "wrong"], now + 10);
    const selected = selectQuestions(
      state.questions,
      state.learning,
      { ...options, ...errorTrainingContext(state) },
      () => 0.5,
    );
    expect(selected.map((q) => q.id)).toEqual([
      variant.id,
      others[1].id,
      others[0].id,
    ]);
    expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(3);
    expect(
      selectQuestions(state.questions, state.learning, {
        ...options,
        size: 1,
        ...errorTrainingContext(state),
      }),
    ).toHaveLength(1);
  });

  it("hält Filter ein und füllt kurze Fehlerrunden nicht mit neuen oder richtigen Zielen auf", () => {
    const state = emptyState(qs);
    played(state, qs.slice(0, 2), ["wrong", "correct"]);
    const context = errorTrainingContext(state);
    expect(
      selectQuestions(qs, state.learning, { ...options, ...context }),
    ).toHaveLength(1);
    expect(
      selectQuestions(qs, state.learning, {
        ...options,
        ...context,
        filters: { genres: ["Horror"], difficulties: ["leicht"] },
      }),
    ).toEqual([]);
    expect(
      selectQuestions(qs, state.learning, {
        ...options,
        ...context,
        topic: "Nicht vorhandenes Filmthema",
      }),
    ).toEqual([]);
    const hard = { ...qs[0], difficulty: "schwer" as const };
    expect(
      selectQuestions([hard], state.learning, {
        ...options,
        ...context,
        filters: { genres: ["Science-Fiction"], difficulties: ["leicht"] },
      }),
    ).toEqual([]);
  });

  it("startet sofort ohne Fälligkeit und erhält Tagesgrenzen, XP und Sicherungskompatibilität", async () => {
    const state = emptyState(qs);
    played(state, [qs[0]], ["correct"]);
    played(state, [qs[0]], ["wrong"], now + 10);
    const learningBefore = structuredClone(state.learning);
    const retry = startRound(state, { ...options }, now + 20);
    expect(retry.questions.map((q) => q.knowledgeId)).toEqual([
      qs[0].knowledgeId,
    ]);
    expect(state.learning).toEqual(learningBefore);
    answer(
      state,
      retry.id,
      retry.questions[0].id,
      retry.questions[0].correctId,
      1000,
      now + 21,
    );
    expect(state.learning[qs[0].knowledgeId].stage).toBe(0); // already advanced today
    complete(state, retry.id, now + 22);
    complete(state, retry.id, now + 23);
    expect(state.experience).toBe(9); // 1 Antwort + 2 sicher + 2 neu + 4 erste Fehlerkorrektur
    expect(state.records).toEqual({});
    state.settings.roundSetup = {
      mode: "fehler",
      genres: null,
      categories: [],
      difficulties: ["leicht"],
      familiarities: [1, 2, 3, 4],
    };
    const restored = validateBackup(JSON.parse(JSON.stringify(state)));
    expect(restored.rounds.at(-1)?.mode).toBe("fehler");
    expect(restored.settings.roundSetup?.mode).toBe("fehler");
    const cloud = validateBackup(
      await decodeCloudState(await encodeCloudState(state)),
    );
    expect(cloud.events).toEqual(state.events);
    expect(cloud.rounds.at(-1)).toEqual(restored.rounds.at(-1));
    expect(errorTrainingContext(restored).mistakes.size).toBe(0);
  });

  it("wiederholt nur noch offene Fehler der gewählten Runde und zählt auch Antworten abgebrochener Runden", () => {
    const state = emptyState(qs);
    const source = played(state, qs.slice(0, 2), ["wrong", "timeout"]);
    played(state, [qs[2], qs[0]], ["wrong", "correct"], now + 10);
    expect([...errorTrainingContext(state, source.id).mistakes.keys()]).toEqual(
      [qs[1].knowledgeId],
    );
    const retry = startRound(
      state,
      { ...options, sourceRoundId: source.id },
      now + 20,
    );
    expect(retry.questions.map((q) => q.knowledgeId)).toEqual([
      qs[1].knowledgeId,
    ]);
    answer(
      state,
      retry.id,
      retry.questions[0].id,
      retry.questions[0].answers.find(
        (a) => a.id !== retry.questions[0].correctId,
      )!.id,
      1000,
      now + 21,
    );
    retry.status = "aborted";
    retry.finishedAt = now + 22;
    expect(
      errorTrainingContext(state).mistakes.get(qs[1].knowledgeId)?.failures,
    ).toBe(2);
    expect(() => errorTrainingContext(state, retry.id)).toThrow(
      /abgeschlossene Runde/,
    );
  });

  it("erzeugt ohne offene Fehler keine Runde und lässt den bisherigen Stand erhalten", () => {
    const state = emptyState(qs);
    played(state, [qs[0]], ["guessed"]);
    const before = structuredClone(state);
    expect(() => startRound(state, options, now + 10)).toThrow(/keine Fragen/);
    expect(state).toEqual(before);
  });
});

describe("Rundenauswertung", () => {
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

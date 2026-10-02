import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { answer, complete, guess, startRound } from "../src/engine";
import { emptyState, type Mode } from "../src/model";
import { importCsv } from "../src/importer";
import { validateBackup } from "../src/storage";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
import { openMistakes } from "../src/errorTraining";
import { roundSummary } from "../src/roundSummary";
import { questionHistory } from "../src/questionHistory";
import { profileStats } from "../src/ProfileStats";
import { answeredTopics } from "../src/collection";

const catalog = importCsv(readFileSync("public/fragen.csv", "utf8")).questions;
const qs = [...new Map(catalog.map((q) => [q.topic, q])).values()].slice(0, 4);
const now = new Date(2026, 9, 2, 12).getTime();
function fixture(mode: Mode = "ueben", size = 1) {
  const state = emptyState(catalog);
  if (mode === "fehler") {
    const old = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now - 1000,
    );
    old.questions = [qs[0]];
    old.order = [qs[0].answers.map((a) => a.id)];
    old.familiaritySnapshot = undefined;
    answer(
      state,
      old.id,
      qs[0].id,
      qs[0].answers.find((a) => a.id !== qs[0].correctId)!.id,
      100,
      now - 900,
    );
    complete(state, old.id, now - 800);
  }
  const round = startRound(
    state,
    { mode, topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  round.questions = structuredClone(qs.slice(0, size));
  round.order = round.questions.map((q) => q.answers.map((a) => a.id));
  round.familiaritySnapshot = undefined;
  return { state, round };
}

describe("Keine Ahnung", () => {
  for (const mode of ["entdecken", "ueben", "rekord", "fehler"] as const) {
    it(`wertet ${mode} ohne falsche Antwortwahl als Fehler und verhindert eine nachträgliche Wahl`, () => {
      const { state, round } = fixture(mode);
      const q = round.questions[0];
      const snapshot = structuredClone(q);
      answer(state, round.id, q.id, { dontKnow: true }, 1500, now + 1500);
      const event = state.events.at(-1)!;
      expect(event).toMatchObject({
        dontKnow: true,
        answerId: null,
        correct: false,
        guessed: false,
        knowledgePoints: 0,
        timeBonus: 0,
      });
      expect(state.learning[q.knowledgeId]).toMatchObject({
        stage: 0,
        status: "entdeckt",
        due: now + 1500 + 10 * 60_000,
      });
      expect(openMistakes(state.events).get(q.knowledgeId)?.questionId).toBe(
        q.id,
      );
      answer(state, round.id, q.id, q.correctId, 2000, now + 2000);
      guess(state, event.id);
      expect(round.events).toHaveLength(1);
      expect(event.guessed).toBe(false);
      expect(q).toEqual(snapshot);
      expect(q.answers).toHaveLength(4);
      expect(validateBackup(state).events.at(-1)).toEqual(event);
    });
  }

  it("trennt Keine Ahnung, echte Fehlantworten und Zeitabläufe in Auswertung, Profil und Sammlung", () => {
    const { state, round } = fixture("ueben", 4);
    answer(state, round.id, qs[0].id, { dontKnow: true }, 100, now + 100);
    answer(state, round.id, qs[1].id, null, 30000, now + 200);
    answer(state, round.id, qs[2].id, qs[2].correctId, 100, now + 300);
    answer(
      state,
      round.id,
      qs[3].id,
      qs[3].answers.find((a) => a.id !== qs[3].correctId)!.id,
      100,
      now + 400,
    );
    complete(state, round.id, now + 500);
    expect(roundSummary(state, round)).toMatchObject({
      correct: 1,
      wrong: 2,
      dontKnow: 1,
      timedOut: 1,
      accuracy: 25,
      bestStreak: 1,
    });
    expect(questionHistory(state.events, qs[0]).question).toMatchObject({
      answered: 1,
      wrong: 1,
      unanswered: 0,
    });
    expect(profileStats(state)).toMatchObject({
      answered: 3,
      correct: 1,
      accuracy: 33,
    });
    expect(answeredTopics(state)).toEqual(
      new Set([qs[0].topic, qs[2].topic, qs[3].topic]),
    );
  });

  it("erhält die ausdrückliche Wahl in JSON- und komprimierten Kontosicherungen und verwirft widersprüchliche Markierungen", async () => {
    const { state, round } = fixture("rekord");
    answer(state, round.id, qs[0].id, { dontKnow: true }, 1000, now + 1000);
    const expected = validateBackup(state);
    expect(validateBackup(JSON.parse(JSON.stringify(state)))).toEqual(expected);
    expect(
      validateBackup(await decodeCloudState(await encodeCloudState(state))),
    ).toEqual(expected);
    for (const answerId of [
      qs[0].correctId,
      qs[0].answers.find((a) => a.id !== qs[0].correctId)!.id,
    ]) {
      const invalid = structuredClone(state);
      invalid.events[0].answerId = answerId;
      expect(() => validateBackup(invalid)).toThrow();
    }
    const invalid = structuredClone(state);
    invalid.events[0].elapsedMs = 30000;
    expect(() => validateBackup(invalid)).toThrow(
      "Inkonsistente Antwortwertung",
    );
  });

  it("lässt in Rekordrunden den Zeitablauf Vorrang vor einer verspäteten Keine-Ahnung-Wahl haben", () => {
    const { state, round } = fixture("rekord");
    answer(state, round.id, qs[0].id, { dontKnow: true }, 30000, now + 30000);
    expect(state.events[0]).toMatchObject({
      answerId: null,
      correct: false,
      knowledgePoints: 0,
      timeBonus: 0,
    });
    expect(state.events[0].dontKnow).toBeUndefined();
    expect(roundSummary(state, round)).toMatchObject({
      wrong: 0,
      dontKnow: 0,
      timedOut: 1,
    });
    expect(validateBackup(state).events).toEqual(state.events);
  });
});

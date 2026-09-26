import { it, expect } from "vitest";
import { questionHistory } from "../src/questionHistory";
import { importCsv } from "../src/importer";
import { readFileSync } from "node:fs";
import type { AnswerEvent } from "../src/model";

const q = importCsv(readFileSync("public/fragen.csv", "utf8")).questions[0];
const event = (id: string, values: Partial<AnswerEvent> = {}): AnswerEvent => ({
  id,
  roundId: id,
  questionId: q.id,
  knowledgeId: q.knowledgeId,
  version: q.version,
  answerId: q.correctId,
  correct: true,
  guessed: false,
  at: 1000,
  elapsedMs: 1000,
  knowledgePoints: 0,
  timeBonus: 0,
  ...values,
});
it("trennt konkrete Frage und Varianten, falsche Antworten und Zeitabläufe", () => {
  const events = [
    event("correct"),
    event("guessed", { guessed: true }),
    event("wrong", { correct: false, answerId: "wrong" }),
    event("timeout", { correct: false, answerId: null }),
    event("variant", { questionId: "historical-variant" }),
    event("other", { questionId: "other-question", knowledgeId: "other-goal" }),
  ];
  const before = structuredClone(events);
  expect(questionHistory(events, q)).toEqual({
    question: {
      answered: 3,
      correct: 2,
      wrong: 1,
      unanswered: 1,
      guessedCorrect: 1,
    },
    goal: {
      answered: 4,
      correct: 3,
      wrong: 1,
      unanswered: 1,
      guessedCorrect: 1,
    },
  });
  expect(events).toEqual(before);
});
it("zeigt Nullwerte ohne gespeicherte Antwort und zählt eine Antwort nur einmal", () => {
  expect(questionHistory([], q).question).toEqual({
    answered: 0,
    correct: 0,
    wrong: 0,
    unanswered: 0,
    guessedCorrect: 0,
  });
  const events = [event("current")];
  expect(questionHistory(events, q).question.answered).toBe(1);
  expect(questionHistory(events, q).question.answered).toBe(1);
  events[0].guessed = true;
  expect(questionHistory(events, q).question).toEqual({
    answered: 1,
    correct: 1,
    wrong: 0,
    unanswered: 0,
    guessedCorrect: 1,
  });
});

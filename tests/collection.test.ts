import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { emptyState } from "../src/model";
import { importCsv } from "../src/importer";
import { answer, complete, startRound } from "../src/engine";
import { answeredTopics } from "../src/collection";

const questions = importCsv(
  readFileSync("public/horror-fragen.csv", "utf8"),
).questions;
it("zählt richtige, falsche und geratene Antworten, aber keine reinen Zeitabläufe", () => {
  const state = emptyState(questions);
  const qs = [
    ...new Map(
      questions
        .filter((q) => q.difficulty === "leicht")
        .map((q) => [q.topic, q]),
    ).values(),
  ].slice(0, 3);
  const round = startRound(state, {
    mode: "entdecken",
    topic: "Alle Themen",
    difficulty: "leicht",
  });
  round.questions = qs;
  round.order = qs.map((q) => q.answers.map((a) => a.id));
  answer(state, round.id, qs[0].id, qs[0].correctId, 1);
  answer(
    state,
    round.id,
    qs[1].id,
    qs[1].answers.find((a) => a.id !== qs[1].correctId)!.id,
    1,
  );
  answer(state, round.id, qs[2].id, null, 30000);
  state.events[0].guessed = true;
  const before = structuredClone(state);
  expect(answeredTopics(state)).toEqual(new Set([qs[0].topic, qs[1].topic]));
  expect(state).toEqual(before);
  complete(state, round.id);
  expect(answeredTopics(state)).toEqual(new Set([qs[0].topic, qs[1].topic]));
});
it("ordnet beantwortete historische Varianten über das Wissensziel zu und lässt unbegonnene Favoriten aus", () => {
  const state = emptyState(questions);
  expect(answeredTopics(state).size).toBe(0);
  const round = startRound(state, {
    mode: "entdecken",
    topic: "Alle Themen",
    difficulty: "leicht",
  });
  const q = round.questions[0];
  answer(state, round.id, q.id, q.correctId, 1);
  state.questions = [
    { ...q, id: "neue-variante" },
    ...questions.filter((other) => other.knowledgeId !== q.knowledgeId),
  ];
  state.favorites = [questions.find((other) => other.topic !== q.topic)!.topic];
  expect(answeredTopics(state)).toEqual(new Set([q.topic]));
});

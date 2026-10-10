import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { importCsv } from "../src/importer";
import { emptyState, type AnswerEvent } from "../src/model";
import { learn, DAY } from "../src/learning";
import { profileStats } from "../src/ProfileStats";

it("zählt Begegnungen einmal und verteilt gemeinsame Wissensziele vollständig über alle Lernstufen", () => {
  const catalog = importCsv(
    readFileSync("public/fragen.csv", "utf8"),
  ).questions;
  const questions = [
    ...new Map(catalog.map((q) => [q.knowledgeId, q])).values(),
  ].slice(0, 6);
  const state = emptyState([...questions, { ...questions[1], id: "variant" }]);
  const start = new Date(2026, 9, 1, 12).getTime();
  const event = (index: number, at: number, correct = true): AnswerEvent => ({
    id: `${index}:${at}`,
    roundId: "round",
    questionId: questions[index].id,
    knowledgeId: questions[index].knowledgeId,
    version: questions[index].version,
    at,
    answerId: correct ? questions[index].correctId : null,
    correct,
    guessed: false,
    elapsedMs: correct ? 1000 : 30_000,
    knowledgePoints: 0,
    timeBonus: 0,
  });
  // One unseen goal, one timeout at stage 0, then stages 1–4.
  for (let index = 1; index < 6; index++) {
    for (const days of [0, 1, 4, 11].slice(0, Math.max(1, index - 1))) {
      const e = event(index, start + days * DAY, index !== 1);
      state.events.push(e);
      state.learning[e.knowledgeId] = learn(state.learning[e.knowledgeId], e);
    }
  }
  const stats = profileStats(state);
  expect(stats.encountered).toBe(5);
  expect(stats.answered).toBe(10);
  expect(stats.totalGoals).toBe(6);
  expect(stats.learning).toMatchObject({
    unseen: 1,
    discovered: 1,
    stages: [1, 1, 1, 1],
    mastered: 1,
  });
  expect(
    stats.learning.unseen +
      stats.learning.discovered +
      stats.learning.stages.reduce((a, b) => a + b, 0),
  ).toBe(stats.totalGoals);
});

import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState, type State, type Question } from "../src/model";
import { answer, complete, startRound, guess } from "../src/engine";
import {
  learningPathProgress,
  newlyUnlocked,
  pathQuestions,
  retainJourneyUnlocks,
} from "../src/learningPath";
import { questionSourceOf, sourceLabels } from "../src/filters";
import { validateBackup } from "../src/backupValidation";
const base = emptyState();
addPackages(
  base,
  packages.map((pkg) => ({
    filename: pkg.filename,
    text: readFileSync(`public${pkg.path}`, "utf8"),
  })),
);
const unique = (qs: Question[]) => [
  ...new Map(qs.map((q) => [q.knowledgeId, q])).values(),
];
function play(
  state: State,
  questions: Question[],
  guessed = false,
  finish = true,
) {
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1000 + state.rounds.length,
  );
  round.questions = questions;
  round.order = questions.map((q) => q.answers.map((a) => a.id));
  round.familiaritySnapshot = Object.fromEntries(
    questions.map((q) => [q.id, 0]),
  );
  for (const q of questions) {
    answer(state, round.id, q.id, q.correctId, 100, 2000 + state.events.length);
    if (guessed) guess(state, round.events.at(-1)!);
  }
  if (finish) complete(state, round.id, 4000 + state.rounds.length);
  return round;
}
// Functional full-catalog replay, not a production latency benchmark.
it("führt Schauspieler und Preise separat bis Experte, zählt sichere Ziele und schützt Filmfortschritt", async () => {
  const s = structuredClone(base);
  retainJourneyUnlocks(s);
  const filmsBefore = pathQuestions(s)
    .filter((q) => questionSourceOf(q) === "film")
    .map((q) => q.id);
  for (const source of ["actors", "awards"] as const) {
    const area = sourceLabels[source];
    expect(learningPathProgress(s)(area).groups).toEqual([]);
    const qs = base.questions.filter((q) => questionSourceOf(q) === source);
    expect(
      pathQuestions(s)
        .filter((q) => questionSourceOf(q) === source)
        .every((q) => q.difficulty === "leicht"),
    ).toBe(true);
    for (const [difficulty, next] of [
      ["leicht", "mittel"],
      ["mittel", "schwer"],
      ["schwer", "experte"],
    ] as const) {
      const goals = unique(qs.filter((q) => q.difficulty === difficulty));
      const target = Math.ceil(goals.length / 2);
      for (let i = 0; i < target - 1; i += 10)
        play(s, goals.slice(i, Math.min(i + 10, target - 1)));
      expect(
        pathQuestions(s)
          .filter((q) => questionSourceOf(q) === source)
          .some((q) => q.difficulty === next),
      ).toBe(false);
      play(s, [goals[target - 1]], true);
      const unfinished = play(s, [goals[target - 1]], false, false);
      expect(
        pathQuestions(s)
          .filter((q) => questionSourceOf(q) === source)
          .some((q) => q.difficulty === next),
      ).toBe(false);
      unfinished.status = "aborted";
      unfinished.finishedAt = 3500;
      const before = learningPathProgress(s);
      const round = play(s, [goals[target - 1]]);
      expect(newlyUnlocked(before, s)).toContainEqual({
        genre: area,
        difficulty: next,
      });
      expect(round.unlocks).toContainEqual({ genre: area, difficulty: next });
      expect(
        pathQuestions(s)
          .filter((q) => questionSourceOf(q) === source)
          .some((q) => q.difficulty === next),
      ).toBe(true);
    }
    expect(s.journey?.earned[area].difficulty).toBe(3);
  }
  expect(
    pathQuestions(s)
      .filter((q) => questionSourceOf(q) === "film")
      .map((q) => q.id),
  ).toEqual(filmsBefore);
  // Use actual familiarity snapshots for export validation.
  for (const r of s.rounds) delete r.familiaritySnapshot;
  expect(validateBackup(JSON.parse(JSON.stringify(s)))).toEqual(s);
  expect(JSON.parse(JSON.stringify(s))).toEqual(s);
}, 30000);
it("Preisantworten erteilen keine Filmrechte aus alten Kurzschwellen", () => {
  const s = structuredClone(base);
  s.journey = {
    version: 1,
    earned: { Drama: { difficulty: 2, familiarity: 2 } },
  };
  retainJourneyUnlocks(s);
  expect(learningPathProgress(s)("Drama").mediumUnlocked).toBe(false);
  expect(s.journey?.earned.Drama.difficulty).toBe(0);
});

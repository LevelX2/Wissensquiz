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
import { discoveryContext } from "../src/discovery";
import { validateBackup } from "../src/storage";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
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
      play(s, goals.slice(0, 10));
      play(s, goals.slice(10, 19));
      expect(
        pathQuestions(s)
          .filter((q) => questionSourceOf(q) === source)
          .some((q) => q.difficulty === next),
      ).toBe(false);
      play(s, [goals[19]], true);
      const unfinished = play(s, [goals[19]], false, false);
      expect(
        pathQuestions(s)
          .filter((q) => questionSourceOf(q) === source)
          .some((q) => q.difficulty === next),
      ).toBe(false);
      unfinished.status = "aborted";
      unfinished.finishedAt = 3500;
      const before = learningPathProgress(s);
      const round = play(s, [goals[19]]);
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
      expect(discoveryContext(s).introductoryQuestionIds.size).toBeGreaterThan(
        0,
      );
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
  expect(await decodeCloudState(await encodeCloudState(s))).toEqual(s);
}, 15000);
it("bewahrt historisch durch Preisantworten erworbene Filmrechte einmalig", () => {
  const s = structuredClone(base);
  const awards = unique(
    s.questions.filter(
      (q) =>
        questionSourceOf(q) === "awards" &&
        q.difficulty === "leicht" &&
        q.metadata.subdomain === "Drama",
    ),
  );
  for (let i = 0; i < awards.length; i += 10) play(s, awards.slice(i, i + 10));
  // Simulate the pre-feature format and derive its legacy rights before migration.
  delete s.journey;
  const previous = learningPathProgress(s, true)("Drama");
  expect(previous.mediumUnlocked).toBe(true);
  retainJourneyUnlocks(s);
  expect((s as State).journey?.independentAreas).toBe(true);
  expect(learningPathProgress(s)("Drama").mediumUnlocked).toBe(true);
  const earned = structuredClone(s.journey);
  retainJourneyUnlocks(s);
  expect(s.journey).toEqual(earned);
});

import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { emptyState, type Difficulty, type State } from "../src/model";
import { importCsv } from "../src/importer";
import { answer, complete, guess, startRound } from "../src/engine";
import { learningPathProgress, pathQuestions } from "../src/learningPath";
import { genreOf } from "../src/filters";
import { validateBackup } from "../src/storage";
const questions = ["horror", "action"].flatMap(
  (g) => importCsv(readFileSync(`public/${g}-fragen.csv`, "utf8")).questions,
);
function play(
  state: State,
  level: Difficulty,
  count: number,
  options: { guessed?: boolean; finish?: boolean } = {},
) {
  const qs = [
    ...new Map(
      questions
        .filter((q) => genreOf(q) === "Horror" && q.difficulty === level)
        .map((q) => [q.knowledgeId, q]),
    ).values(),
  ].slice(0, count);
  for (const q of qs) {
    const r = startRound(
      state,
      { mode: "entdecken", topic: "Alle Themen", difficulty: level },
      1000,
    );
    r.questions = [q];
    r.order = [q.answers.map((a) => a.id)];
    answer(state, r.id, q.id, q.correctId, 1000, 2000);
    if (options.guessed) guess(state, state.events.at(-1)!.id);
    if (options.finish !== false) complete(state, r.id, 3000);
    else {
      r.status = "aborted";
      r.finishedAt = 3000;
    }
  }
}
it("zählt unterschiedliche historische Ziele pro Genre; Varianten, Wiederholungen, geratene und abgebrochene Runden schalten nichts zusätzlich frei", () => {
  const s = emptyState(questions);
  play(s, "leicht", 19);
  play(s, "leicht", 19);
  play(s, "leicht", 20, { guessed: true });
  play(s, "leicht", 20, { finish: false });
  expect(learningPathProgress(s)("Horror")).toMatchObject({
    easy: 19,
    mediumUnlocked: false,
  });
  s.settings.learningPath = true;
  expect(pathQuestions(s).every((q) => q.difficulty === "leicht")).toBe(true);
  s.settings.learningPath = false;
  play(s, "leicht", 20);
  expect(learningPathProgress(s)("Horror").mediumUnlocked).toBe(true);
  expect(learningPathProgress(s)("Action").mediumUnlocked).toBe(false);
  s.settings.learningPath = true;
  expect(
    pathQuestions(s).some(
      (q) => q.difficulty === "mittel" && genreOf(q) === "Horror",
    ),
  ).toBe(true);
  expect(
    pathQuestions(s).some(
      (q) => q.difficulty === "mittel" && genreOf(q) === "Action",
    ),
  ).toBe(false);
});
it("öffnet Schwer erst nach beiden Stufen und respektiert Lernpfad beim Start sowie Sicherungsimport", () => {
  const s = emptyState(questions);
  play(s, "mittel", 20);
  expect(learningPathProgress(s)("Horror").hardUnlocked).toBe(false);
  play(s, "leicht", 20);
  expect(learningPathProgress(s)("Horror").hardUnlocked).toBe(true);
  s.settings.learningPath = true;
  expect(validateBackup(s).settings.learningPath).toBe(true);
  const fresh = emptyState(questions);
  fresh.settings.learningPath = true;
  expect(() =>
    startRound(fresh, {
      mode: "rekord",
      topic: "Alle Themen",
      difficulty: "schwer",
    }),
  ).toThrow("keine Fragen");
  fresh.settings.learningPath = false;
  expect(
    startRound(fresh, {
      mode: "rekord",
      topic: "Alle Themen",
      difficulty: "schwer",
    }).questions.every((q) => q.difficulty === "schwer"),
  ).toBe(true);
});

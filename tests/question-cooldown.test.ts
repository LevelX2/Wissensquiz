import { currentCsv } from "./helpers/current-content";
import { expect, it } from "vitest";

import { importCsv } from "../src/importer";
import { emptyState, type AnswerEvent } from "../src/model";
import { DAY } from "../src/learning";
import { recentCorrectContext } from "../src/discovery";
import { selectQuestions, startRound } from "../src/engine";

const base = importCsv(currentCsv({ genre: "Science-Fiction" })).questions[0];
const now = new Date("2026-10-11T12:00:00+02:00").getTime();
function fixture() {
  const qs = Array.from({ length: 20 }, (_, i) => ({
    ...base,
    id: `q${i}`,
    knowledgeId: `goal${i}`,
    difficulty: "leicht" as const,
  }));
  qs.push({ ...qs[0], id: "variant" });
  const state = emptyState(qs);
  qs.forEach((q) => {
    state.learning[q.knowledgeId] = {
      knowledgeId: q.knowledgeId,
      stage: 2,
      status: "geübt",
      due: now + 3 * DAY,
      lastSeenAt: now - 1000,
      lastSecure: now - 2 * DAY,
      lastAdvancedDay: null,
      secureDays: [],
      seen: 3,
    };
  });
  state.events = qs.slice(0, 10).map(
    (q) =>
      ({
        id: q.id,
        roundId: "old-round",
        questionId: q.id,
        knowledgeId: q.knowledgeId,
        answerId: q.correctId,
        correct: true,
        guessed: false,
        elapsedMs: 1000,
        at: now - 3600000,
      }) as AnswerEvent,
  );
  return state;
}
for (const mode of ["ueben", "entdecken"] as const) {
  it(`${mode}: zieht Alternativen vor kürzlich richtigen, nicht fälligen Zielen einschließlich Varianten`, () => {
    const state = fixture();
    const selected = selectQuestions(
      state.questions,
      state.learning,
      {
        mode,
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        size: 10,
        now,
        ...recentCorrectContext(state, now),
        recentKnowledgeIds: new Set(
          state.questions.slice(10, 20).map((q) => q.knowledgeId),
        ),
      },
      () => 0.5,
    );
    expect(selected.map((q) => q.knowledgeId).sort()).toEqual(
      state.questions
        .slice(10, 20)
        .map((q) => q.knowledgeId)
        .sort(),
    );
  });
  it(`${mode}: füllt bei kleinem Pool auf und lässt fällige Ziele trotz richtiger Antwort zu`, () => {
    const state = fixture();
    const options = {
      mode,
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
      size: 10,
      now,
      ...recentCorrectContext(state, now),
    };
    const small = selectQuestions(
      state.questions.slice(0, 11),
      state.learning,
      options,
    );
    expect(small).toHaveLength(10);
    expect(small.some((q) => q.knowledgeId === "goal10")).toBe(true);
    state.learning.goal0.due = now;
    const due = selectQuestions(
      [state.questions[0], ...state.questions.slice(10, 19)],
      state.learning,
      options,
    );
    expect(due.map((q) => q.knowledgeId)).toContain("goal0");
  });
}
it("hält die rollende 24-Stunden-Grenze ein, zählt frühe und geratene Treffer und ignoriert Fehler und Zukunftszeiten", () => {
  const state = fixture();
  state.events[0].at = now - DAY;
  state.events[1].at = now - DAY + 1;
  state.events[2].correct = false;
  state.events[3].at = now + 1;
  state.events[4].guessed = true;
  const ids = recentCorrectContext(state, now).recentCorrectKnowledgeIds;
  expect(ids.has("goal0")).toBe(false);
  expect(ids.has("goal1")).toBe(true);
  expect(ids.has("goal2")).toBe(false);
  expect(ids.has("goal3")).toBe(false);
  expect(ids.has("goal4")).toBe(true);
  // A correct early practice answer restarts the exclusion independently of lastSecure.
  expect(ids.has("goal5")).toBe(true);
  expect(state.learning.goal5.lastSecure).toBeLessThan(now - DAY);
});
it("verwendet den Antwortverlauf auch beim tatsächlichen lokalen Rundenstart", () => {
  const state = fixture();
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  expect(
    round.questions.every((q) => Number(q.knowledgeId.slice(4)) >= 10),
  ).toBe(true);
});

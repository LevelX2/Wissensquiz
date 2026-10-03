import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState, type Mode } from "../src/model";
import {
  answer,
  complete,
  guess,
  rebuild,
  startRound,
  DAY,
} from "../src/engine";
import { importDuelView, type DuelView } from "../src/duels";

const questions = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions.slice(0, 10);
const now = new Date("2026-10-03T12:00:00+02:00").getTime();
function expectReplay(state: ReturnType<typeof emptyState>) {
  const replayed = structuredClone(state);
  rebuild(replayed);
  expect(state).toEqual(replayed);
}
it.each(["ueben", "rekord", "fehler", "entdecken"] as Mode[])(
  "erhält die vollständige Wertung im Antwortweg für %s",
  (mode) => {
    const state = emptyState(questions);
    if (mode === "fehler") {
      const seed = startRound(
        state,
        { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
        now - DAY,
      );
      for (const q of seed.questions)
        answer(state, seed.id, q.id, { dontKnow: true }, 1000, now - DAY + 1);
      complete(state, seed.id, now - DAY + 2);
    }
    for (const day of [0, 1, 4, 11]) {
      const r = startRound(
        state,
        { mode, topic: "Alle Themen", difficulty: "Alle Stufen" },
        now + day * DAY,
      );
      rebuild(state);
      const xp = state.experience;
      for (const [index, q] of r.questions.entries()) {
        answer(
          state,
          r.id,
          q.id,
          index === 1 || (mode === "fehler" && index === 0)
            ? { dontKnow: true }
            : q.correctId,
          1000,
          now + day * DAY + index,
        );
        expect(state.experience).toBe(xp);
        expectReplay(state);
        if (index === 2) {
          guess(state, r.events[index]);
          expectReplay(state);
        }
      }
      complete(state, r.id, now + day * DAY + 20000);
      expectReplay(state);
    }
  },
);
it("berechnet rückdatierte Antworten und Rate-Markierungen mit späteren abgeschlossenen Runden vollständig neu", () => {
  const state = emptyState(questions.slice(0, 1));
  const q = questions[0];
  const later = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  answer(state, later.id, q.id, q.correctId, 1000, now + 1);
  complete(state, later.id, now + 2);
  const older = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now - DAY,
  );
  answer(state, older.id, q.id, q.correctId, 1000, now - DAY + 1);
  expectReplay(state);
  guess(state, older.events[0]);
  expectReplay(state);
});
it("übernimmt bestätigte Duellantworten und Wiederholungen mit gleicher Wertung wie der vollständige Replay", () => {
  const state = emptyState(questions);
  rebuild(state);
  const view: DuelView = {
    duel: {
      id: crypto.randomUUID(),
      opponent: "Test",
      status: "preparing",
      kind: "random",
      solutionDisplay: "question",
      round: 1,
      myTurn: true,
      dueAt: now + DAY,
      createdAt: now,
      reason: null,
      result: null,
      invitation: null,
      rounds: [1, 2, 3].map((number) => ({
        number,
        answered: 0,
        mine: null,
        opponent: null,
      })),
    },
    number: 1,
    answered: 0,
    items: [],
    current: null,
    serverNow: now,
  };
  for (const [index, q] of questions.entries()) {
    view.items.push({
      question: q,
      order: q.answers.map((a) => a.id),
      event: {
        answerId: q.correctId,
        dontKnow: false,
        correct: true,
        guessed: false,
        at: now + index,
        elapsedMs: 1000,
      },
    });
    view.answered++;
    importDuelView(state, view);
    expectReplay(state);
    if (index === 0) {
      const snapshot = structuredClone(state.rounds[0].questions[0]);
      const base = state.questions.find((base) => base.id === q.id)!;
      const year = base.metadata.film_year;
      try {
        base.metadata.film_year = "1901";
        expect(state.rounds[0].questions[0]).toEqual(snapshot);
      } finally {
        base.metadata.film_year = year;
      }
    }
    const prior = structuredClone(state);
    importDuelView(state, view);
    expect(state).toEqual(prior);
  }
  view.items[0].event.guessed = true;
  importDuelView(state, view);
  expectReplay(state);
});

it("erhält XP auch bei einer Rate-Korrektur vor später eingefügten Ereignissen mit derselben Millisekunde", () => {
  const q = questions[0],
    state = emptyState([q]);
  for (const day of [0, 1, 4]) {
    const r = startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now + day * DAY,
    );
    answer(state, r.id, q.id, q.correctId, 1000, now + day * DAY + 1);
    complete(state, r.id, now + day * DAY + 2);
  }
  const at = now + 11 * DAY + 1;
  const pending = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    at,
  );
  answer(state, pending.id, q.id, q.correctId, 1000, at);
  expect(state.learning[q.knowledgeId].status).toBe("gefestigt");
  // An independently finished duel can follow an open solo round at the same timestamp.
  pending.status = "aborted";
  pending.finishedAt = at;
  const later = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    at,
  );
  answer(state, later.id, q.id, q.correctId, 1000, at);
  complete(state, later.id, at);
  pending.status = "active";
  pending.finishedAt = null;
  rebuild(state);
  const xp = state.experience;
  guess(state, pending.events[0]);
  expectReplay(state);
  expect(state.experience).toBe(xp - 8);
});

it("vergleicht Server-Fragensnapshots unabhängig von der Objektschlüsselreihenfolge und lehnt Inhaltsänderungen ab", async () => {
  const { questionSnapshotMatches } = await import("../src/filmFacts");
  const q = questions[0];
  const reordered = JSON.parse(
    JSON.stringify(q, (_key, value) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(
            Object.keys(value)
              .reverse()
              .map((key) => [key, value[key]]),
          )
        : value,
    ),
  );
  expect(questionSnapshotMatches(q, reordered)).toBe(true);
  reordered.metadata.film_year = "1901";
  expect(questionSnapshotMatches(q, reordered)).toBe(false);
  const changed = structuredClone(q);
  changed.answers[0].text += " geändert";
  expect(questionSnapshotMatches(q, changed)).toBe(false);
});

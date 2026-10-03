import { expect, it } from "vitest";
import { emptyState, questionSchema, type State } from "../src/model";
import { answer, startRound, selectQuestions } from "../src/engine";
import { bankAfterAnswer, inPeriod } from "../src/recordModes";
import { validateBackup } from "../src/storage";
import { leaderboard } from "../src/leaderboard";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";

export const runState = (): State =>
  emptyState(
    Array.from({ length: 10 }, (_, i) =>
      questionSchema.parse({
        id: `q${i}`,
        knowledgeId: `goal${i}`,
        version: "v1",
        language: "de",
        domain: "Film",
        topic: "Testfilm",
        difficulty: i < 3 ? "leicht" : i < 7 ? "mittel" : "schwer",
        question: `Frage ${i}?`,
        answers: ["a", "b", "c", "d"].map((id) => ({
          id,
          text: id,
          feedback: "",
        })),
        correctId: "a",
        explanation: "Erklärung",
        context: "",
        anchor: "",
        sources: [],
        tags: [],
        badgeTags: [],
        metadata: {},
        demo: false,
      }),
    ),
  );
const respond = (s: State, correct: boolean, spent = 3000) => {
  const r = s.rounds[0],
    q = r.questions[r.events.length];
  answer(
    s,
    r.id,
    q.id,
    correct ? "a" : "b",
    spent,
    r.startedAt + r.events.length * 4000 + spent,
  );
};

it("endet Fehlerfrei beim ersten Fehler atomar und sichert auch einen Nullpunktelauf", () => {
  const s = runState(),
    r = startRound(s, {
      mode: "fehlerfrei",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
    });
  respond(s, false);
  expect(r.status).toBe("completed");
  expect(r.run?.ended).toBe(true);
  expect(r.events).toHaveLength(1);
  answer(s, r.id, r.questions[0].id, "a", 0);
  expect(s.events).toHaveLength(1);
  expect(leaderboard(s)[0].entries[0].points).toBe(0);
  expect(validateBackup(s).rounds[0].status).toBe("completed");
});
it("verbraucht Antwortzeit, deckelt Boni und lässt Fehler überleben", () => {
  const s = runState(),
    r = startRound(s, {
      mode: "zeitkonto",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
    });
  respond(s, true);
  expect(r.run?.bankMs).toBe(120000);
  respond(s, false);
  expect(r.run?.bankMs).toBe(72000);
  respond(s, false);
  expect(r.run?.bankMs).toBe(24000);
  respond(s, true, 24000);
  expect(r.status).toBe("completed");
  expect(r.run?.bankMs).toBe(0);
  expect(s.events.at(-1)?.answerId).toBeNull();
  expect(s.events.at(-1)?.correct).toBe(false);
  expect(validateBackup(s).rounds[0].run?.bankMs).toBe(0);
});
it("ordnet Standardfragen zu und verhindert doppelte Antworten auch in einem Pool mit nur einem Ziel", () => {
  const s = runState();
  s.bundledQuestionIds = ["q0"];
  const r = startRound(s, {
    mode: "zeitkonto",
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
    recordPreset: "standard",
  });
  expect(r.run!.pool).toEqual(["q0"]);
  answer(s, r.id, "q0", "a", 1000, Date.now(), 0);
  answer(s, r.id, "q0", "a", 1000, Date.now(), 0);
  expect(r.events).toHaveLength(1);
  expect(r.questions).toHaveLength(2);
  expect(validateBackup(s).rounds[0].events).toHaveLength(1);
});
it("bezieht Experten im freien Spiel ein und deckelt Wiederholungs-XP", () => {
  const s = runState();
  for (let i = 0; i < 6; i++)
    s.questions.push({
      ...s.questions[0],
      id: "expert" + i,
      knowledgeId: "expert-goal" + i,
      difficulty: "experte",
    });
  expect(
    selectQuestions(s.questions, s.learning, {
      mode: "ueben",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
      size: 10,
      now: Date.now(),
    }).some((q) => q.difficulty === "experte"),
  ).toBe(true);
  s.questions = s.questions.slice(0, 1);
  const r = startRound(s, {
    mode: "fehlerfrei",
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
  });
  for (let i = 0; i < 10; i++)
    answer(s, r.id, r.questions[i].id, "a", 1000, 1791021600000 + i * 2000, i);
  answer(s, r.id, r.questions[10].id, "b", 1000, 1791021625000, 10);
  expect(s.experience).toBe(5);
});
it("mischt 3/4/3, zieht Varianten ohne Zusatzlose und zählt Wiederholungen nach dem Pool erneut", async () => {
  const s = runState();
  s.questions.push({ ...s.questions[0], id: "q0-variant" });
  const r = startRound(s, {
    mode: "zeitkonto",
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
    recordPreset: "standard",
  });
  for (let i = 0; i < 12; i++) respond(s, true);
  expect(new Set(r.questions.slice(0, 10).map((q) => q.knowledgeId)).size).toBe(
    10,
  );
  expect(
    r.questions.slice(0, 10).filter((q) => q.difficulty === "mittel"),
  ).toHaveLength(4);
  expect(new Set(r.events).size).toBe(12);
  expect(r.run?.cycle).toBe(2);
  expect(
    validateBackup(await decodeCloudState(await encodeCloudState(s))).rounds[0]
      .events,
  ).toHaveLength(12);
  expect(r.questions[9].knowledgeId).not.toBe(r.questions[10].knowledgeId);
});
it("weist manipulierte Zeitvorräte, Poolfolgen und vorgezogene Abschlüsse zurück", () => {
  const s = runState();
  startRound(s, {
    mode: "zeitkonto",
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
  });
  respond(s, false);
  const altered = structuredClone(s);
  altered.rounds[0].run!.bankMs++;
  expect(() => validateBackup(altered)).toThrow(/Zeitvorrat/);
  const pool = structuredClone(s);
  pool.rounds[0].run!.queue.push(pool.rounds[0].questions[0].id);
  expect(() => validateBackup(pool)).toThrow();
  const completed = structuredClone(s);
  completed.rounds[0].status = "completed";
  completed.rounds[0].finishedAt = Date.now();
  expect(() => validateBackup(completed)).toThrow();
});
it("braucht selbst ohne Antwortzeit 75 Prozent Treffer und bei drei Sekunden 80 Prozent", () => {
  expect(15 * 0.75 - 45 * 0.25).toBe(0);
  expect(15 * 0.8 - 45 * 0.2 - 3).toBeCloseTo(0);
  expect(15 * 0.625 - 45 * 0.375).toBeLessThan(0);
  expect(bankAfterAnswer(1000, true, 1000)).toBe(0);
});
it("trennt Wochen Monats und Jahresgrenzen in Berlin einschließlich Sommerzeit", () => {
  const at = (s: string) => Date.parse(s);
  const now = at("2026-10-04T12:00:00+02:00");
  expect(inPeriod(at("2026-09-28T00:00:00+02:00"), "week", now)).toBe(true);
  expect(inPeriod(at("2026-09-27T23:59:59+02:00"), "week", now)).toBe(false);
  expect(inPeriod(at("2026-09-30T22:00:00Z"), "month", now)).toBe(true);
  expect(inPeriod(at("2026-09-30T21:59:59Z"), "month", now)).toBe(false);
  expect(inPeriod(at("2025-12-31T23:00:00Z"), "year", now)).toBe(true);
  expect(
    inPeriod(
      at("2026-03-29T23:30:00+02:00"),
      "week",
      at("2026-03-30T00:01:00+02:00"),
    ),
  ).toBe(false);
});
it("führt alle Läufe desselben Spielers in derselben Endloskategorie", () => {
  const s = runState();
  for (let i = 0; i < 2; i++) {
    const r = startRound(s, {
      mode: "fehlerfrei",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
    });
    for (let n = 0; n < i; n++)
      answer(s, r.id, r.questions[r.events.length].id, "a", 3000);
    answer(s, r.id, r.questions[r.events.length].id, "b", 3000);
  }
  expect(leaderboard(s)).toHaveLength(1);
  expect(leaderboard(s)[0].entries).toHaveLength(2);
  expect(leaderboard(s)[0].entries.map((e) => e.correct)).toEqual([1, 0]);
});

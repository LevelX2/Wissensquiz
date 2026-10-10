import { describe, expect, it } from "vitest";
import {
  answer,
  complete,
  guess,
  rebuild,
  startRound,
  DAY,
} from "../src/engine";
import {
  careerProgress,
  careerSummary,
  levelThreshold,
  totalXp,
} from "../src/career";
import {
  emptyState,
  type Difficulty,
  type Question,
  type State,
} from "../src/model";
import { validateBackup } from "../src/storage";
import { decodeCloudState, encodeCloudState } from "../src/cloudCodec";

const now = new Date("2026-10-02T12:00:00+02:00").getTime();
function question(
  id: string,
  difficulty: Difficulty = "mittel",
  knowledgeId = id,
): Question {
  return {
    id,
    knowledgeId,
    version: "v1",
    language: "de",
    domain: "Film",
    topic: `Thema ${id}`,
    difficulty,
    question: `Frage ${id}?`,
    answers: ["a", "b", "c", "d"].map((id) => ({
      id,
      text: id,
      feedback: "Erklärung",
    })),
    correctId: "a",
    explanation: "Erklärung",
    context: "",
    anchor: "",
    sources: [],
    tags: [],
    badgeTags: [],
    metadata: { subdomain: "Horror" },
    demo: false,
  };
}
function play(
  state: State,
  q: Question,
  choice: "correct" | "wrong" | "guessed" | "timeout" | "dontKnow" = "correct",
  at = now,
  mode: "ueben" | "fehler" | "rekord" = "ueben",
) {
  const r = startRound(
    state,
    { mode, topic: q.topic, difficulty: q.difficulty },
    at,
  );
  expect(r.questions).toHaveLength(1);
  answer(
    state,
    r.id,
    q.id,
    choice === "timeout"
      ? null
      : choice === "dontKnow"
        ? { dontKnow: true }
        : choice === "wrong"
          ? "b"
          : "a",
    choice === "timeout" ? 30000 : 1000,
    at + 1,
  );
  if (choice === "guessed") guess(state, r.events[0]);
  complete(state, r.id, at + 2);
  return r;
}

describe("Filmkarriere", () => {
  it("hat exakte steigende Levelgrenzen und fünf Karrieretitel", () => {
    for (const level of [1, 2, 5, 10, 20, 35, 10001]) {
      const threshold = levelThreshold(level);
      expect(careerProgress(threshold)).toMatchObject({
        level,
        current: 0,
        needed: 100 + 50 * (level - 1),
      });
      expect(careerProgress(levelThreshold(level + 1) - 1)).toMatchObject({
        level,
        remaining: 1,
      });
    }
    expect(
      [0, 700, 2700, 10450, 31450].map((xp) => careerProgress(xp).title),
    ).toEqual([
      "Kinogänger",
      "Filmfan",
      "Cineast",
      "Filmchronist",
      "Filmlegende",
    ]);
  });

  it("belohnt Schwierigkeit und erstmaliges sicheres Wissen, ohne Rekordpunkte zu ändern", () => {
    for (const [difficulty, xp] of [
      ["leicht", 5],
      ["mittel", 6],
      ["schwer", 8],
    ] as const) {
      const q = question(difficulty, difficulty);
      const state = emptyState([q]);
      const round = play(state, q, "correct", now, "rekord");
      expect(state.experience).toBe(xp);
      expect(state.events[0].knowledgePoints + state.events[0].timeBonus).toBe(
        158,
      );
      expect(state.records).toEqual({});
      complete(state, round.id, now + 3);
      rebuild(state);
      expect(state.experience).toBe(xp);
    }
  });

  it("behält Antwort-XP für falsche, geratene und Keine-Ahnung-Antworten; Zeitabläufe erhalten keine", () => {
    for (const [choice, xp] of [
      ["wrong", 1],
      ["guessed", 1],
      ["dontKnow", 1],
      ["timeout", 0],
    ] as const) {
      const q = question(choice);
      const state = emptyState([q]);
      play(state, q, choice);
      expect(state.experience).toBe(xp);
    }
  });

  it("vergibt vor Abschluss oder für abgebrochene Runden keine XP", () => {
    const q = question("offen");
    const state = emptyState([q]);
    const r = startRound(
      state,
      { mode: "ueben", topic: q.topic, difficulty: q.difficulty },
      now,
    );
    answer(state, r.id, q.id, "a", 1000, now + 1);
    expect(state.experience).toBe(0);
    r.status = "aborted";
    r.finishedAt = now + 2;
    rebuild(state);
    expect(state.experience).toBe(0);
    expect(state.learning[q.knowledgeId].stage).toBe(1);
  });

  it("teilt Tagesgrenzen und einmalige Boni über Varianten und alle Modi", () => {
    const q = question("Original", "leicht"),
      variant = question("Variante", "schwer", q.knowledgeId);
    const state = emptyState([q, variant]);
    play(state, q, "dontKnow");
    const recovered = play(state, variant, "correct", now + 600_010, "fehler");
    expect(state.experience).toBe(12); // 1 Antwort, 5 sicher, 2 neu, 4 korrigiert
    expect(careerSummary(state).rounds.get(recovered.id)).toMatchObject({
      participation: 0,
      correct: 5,
      discovered: 2,
      recovered: 4,
    });
    const repeat = play(state, q, "correct", now + 600_020, "rekord");
    expect(totalXp(careerSummary(state).rounds.get(repeat.id)!)).toBe(0);
    play(state, q, "wrong", now + 600_030);
    play(state, variant, "correct", now + 600_040, "ueben");
    expect(state.experience).toBe(12);
    play(state, q, "correct", now + DAY);
    expect(state.experience).toBe(15); // Am Folgetag wieder 1 + 2, keine weiteren Boni.
  });

  it("vergibt den Festigungsbonus einmal nach den bestehenden Wiederholungsabständen", () => {
    const q = question("Langfristig", "leicht");
    const state = emptyState([q]);
    [0, 1, 4, 11].forEach((day) => play(state, q, "correct", now + day * DAY));
    expect(state.learning[q.knowledgeId].status).toBe("gefestigt");
    expect(state.experience).toBe(22); // 4*(1+2) + 2 neu + 8 gefestigt
    play(state, q, "wrong", now + 12 * DAY);
    [13, 14, 17, 24].forEach((day) =>
      play(state, q, "correct", now + day * DAY),
    );
    expect(state.experience).toBe(39); // 1 falsch + 12 weitere Treffer + 4 erste Korrektur
    expect(
      [...careerSummary(state).rounds.values()].reduce(
        (sum, xp) => sum + xp.mastered,
        0,
      ),
    ).toBe(8);
  });

  it("behält historische Runden-XP und Levelstände bei späterem Fehler und Katalogänderungen", () => {
    const q = question("Historie", "schwer");
    const state = emptyState([q]);
    const first = play(state, q);
    const before = careerSummary(state);
    q.difficulty = "leicht";
    play(state, q, "wrong", now + DAY);
    const after = careerSummary(state);
    expect(after.rounds.get(first.id)).toEqual(before.rounds.get(first.id));
    expect(after.progress.get(first.id)).toEqual(before.progress.get(first.id));
  });

  it("erhält alte Level samt Teilfortschritt genau einmal und ignoriert gefälschte alte XP", () => {
    const q = question("Alt", "leicht");
    const state = emptyState([q]);
    for (let i = 0; i < 25; i++) play(state, q, "wrong", now + i * 10);
    delete state.career;
    state.experience = 999999;
    rebuild(state);
    expect(state.experience).toBe(350); // Früher Level 3, 50% von 100 XP; neu 250 + 50% von 200.
    expect(state.career).toEqual({ version: 1, legacyBonus: 349 });
    const snapshot = structuredClone(state);
    rebuild(state);
    expect(state).toEqual(snapshot);
    play(state, q, "correct", now + DAY);
    expect(state.experience).toBe(359);
  });

  it("bewahrt Karriere, Altgutschrift und Ereignisse in JSON und kompakten Kontosicherungen", async () => {
    const q = question("Backup");
    const state = emptyState([q]);
    for (let i = 0; i < 15; i++) play(state, q, "wrong", now + i * 10);
    delete state.career;
    const migrated = validateBackup(state);
    const json = validateBackup(JSON.parse(JSON.stringify(migrated)));
    const cloud = validateBackup(
      await decodeCloudState(await encodeCloudState(migrated)),
    );
    expect(json).toEqual(migrated);
    expect(cloud).toEqual(migrated);
    expect(() =>
      validateBackup({ ...migrated, career: { version: 1, legacyBonus: -1 } }),
    ).toThrow();
    const forged = { ...migrated, experience: 9000000 };
    expect(validateBackup(forged).experience).toBe(migrated.experience);
  });
});

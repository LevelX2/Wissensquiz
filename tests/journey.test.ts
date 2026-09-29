import facts from "../src/filmFacts.json";
import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState, type Question } from "../src/model";
import {
  answer,
  complete,
  selectQuestions,
  startRound,
  recordKey,
} from "../src/engine";
import {
  learningPathProgress,
  newlyUnlocked,
  pathQuestions,
  retainJourneyUnlocks,
} from "../src/learningPath";
import { familiarityOf, selectionRule } from "../src/familiarity";
import films from "../src/filmFamiliarity.json";
import { validateBackup } from "../src/storage";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
const questions = importCsv(
  readFileSync("public/horror-fragen.csv", "utf8"),
).questions;
const unique = (qs: Question[]) => [
  ...new Map(qs.map((q) => [q.knowledgeId, q])).values(),
];
const options = {
  topic: "Alle Themen",
  difficulty: "Alle Stufen",
  size: 10,
  now: 10000,
};
function play(state: ReturnType<typeof emptyState>, qs: Question[]) {
  for (const q of qs) {
    const r = startRound(state, { ...options, mode: "ueben" }, 1000);
    r.questions = [q];
    r.order = [q.answers.map((a) => a.id)];
    r.familiaritySnapshot = { [q.id]: familiarityOf(q)! };
    answer(state, r.id, q.id, q.correctId, 100, 2000);
    complete(state, r.id, 3000);
  }
}
it("ordnet alle 425 Filme genau einmal redaktionell ein und erhält Hauptfragen und Varianten gemeinsam", () => {
  expect(films.films.map((f) => f.film).sort()).toEqual(
    facts.map((f) => f.film).sort(),
  );
  expect(films.films).toHaveLength(425);
  expect(new Set(films.films.map((f) => f.film)).size).toBe(425);
  expect(films.films.every((f) => [1, 2, 3, 4].includes(f.level))).toBe(true);
  expect(questions.every((q) => familiarityOf(q))).toBe(true);
  for (const q of questions.filter((q) => q.metadata.variant_of))
    expect(familiarityOf(q)).toBe(
      familiarityOf(questions.find((p) => p.id === q.metadata.variant_of)!),
    );
});
it("startet bei Film-Ikonen, öffnet unabhängig Filmgruppen und bewahrt verdiente Stufen bei Katalogzuwachs", async () => {
  const s = emptyState(questions);
  expect(
    pathQuestions(s).every(
      (q) => q.difficulty === "leicht" && familiarityOf(q) === 1,
    ),
  ).toBe(true);
  const p = learningPathProgress(s)("Horror");
  const gate = p.groups[0];
  const goals = unique(
    questions.filter(
      (q) => familiarityOf(q) === 1 && q.difficulty === gate.difficulty,
    ),
  );
  play(s, goals.slice(0, gate.target - 1));
  const before = learningPathProgress(s);
  play(s, goals.slice(gate.target - 1, gate.target));
  expect(newlyUnlocked(before, s)).toContainEqual({
    genre: "Horror",
    familiarity: 2,
  });
  expect(pathQuestions(s).some((q) => familiarityOf(q) === 2)).toBe(true);
  const target = learningPathProgress(s)("Horror").easyTarget;
  const old = structuredClone(s);
  s.questions.push({ ...questions[0], id: "extra", knowledgeId: "extra" });
  expect(learningPathProgress(s)("Horror").easyTarget).toBe(target);
  expect(learningPathProgress(s)("Horror").familiarity).toBeGreaterThanOrEqual(
    2,
  );
  const restored = validateBackup(
    await decodeCloudState(await encodeCloudState(old)),
  );
  expect(restored.journey).toEqual(old.journey);
});
it("Freies Spiel und Rekord ignorieren Lernhistorie und ziehen jedes Wissensziel höchstens einmal", () => {
  const s = emptyState(questions);
  play(s, unique(questions).slice(0, 25));
  for (const mode of ["ueben", "rekord"] as const) {
    const a = selectQuestions(questions, {}, { ...options, mode }, () => 0.4);
    const b = selectQuestions(
      questions,
      s.learning,
      {
        ...options,
        mode,
        recentKnowledgeIds: new Set(questions.map((q) => q.knowledgeId)),
      },
      () => 0.4,
    );
    expect(a).toEqual(b);
    expect(new Set(a.map((q) => q.knowledgeId)).size).toBe(10);
  }
  expect(pathQuestions(s, "rekord")).toHaveLength(questions.length);
});
it("trennt Bekanntheitsfilter und tatsächliche Rekordmischung, Regeln bleiben unter dem Serverlimit", () => {
  const a = startRound(emptyState(questions), {
    ...options,
    mode: "rekord",
    filters: {
      genres: ["Horror"],
      difficulties: ["leicht"],
      familiarities: [1],
    },
  });
  const b = startRound(emptyState(questions), {
    ...options,
    mode: "rekord",
    filters: {
      genres: ["Horror"],
      difficulties: ["leicht"],
      familiarities: [2],
    },
  });
  expect(a.questions.every((q) => familiarityOf(q) === 1)).toBe(true);
  expect(recordKey(a)).not.toBe(recordKey(b));
  expect(selectionRule(a.questions, [1, 2])).not.toBe(
    selectionRule(b.questions, [1, 2]),
  );
  expect(a.ruleVersion.length).toBeLessThan(100);
  expect(validateBackup(emptyState(questions)).questions).toEqual(questions);
});
it("unbekannte Imports bleiben frei spielbar, aber werden nicht still Film-Ikonen", () => {
  const q = {
    ...questions[0],
    metadata: { ...questions[0].metadata, film_title_original: "Custom" },
  };
  const s = emptyState([q]);
  expect(pathQuestions(s)).toEqual([]);
  expect(
    startRound(s, {
      ...options,
      mode: "ueben",
      filters: {
        genres: ["Horror"],
        difficulties: ["leicht"],
        familiarities: [1, 2, 3, 4],
      },
    }).questions,
  ).toHaveLength(1);
});
import { packages, addPackages } from "../src/packages";
import curriculum from "../src/journeyCurriculum.json";
import { genreOf } from "../src/filters";
it("prüft Erreichbarkeit aller festen Ziele im vollständigen Katalog und leere Einstiegsgruppen", () => {
  const s = emptyState();
  addPackages(
    s,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  const progress = learningPathProgress(s);
  expect(s.questions).toHaveLength(3717);
  expect(s.questions.every((q) => familiarityOf(q))).toBe(true);
  for (const [genre, plan] of Object.entries(curriculum.genres)) {
    const p = progress(genre);
    expect(p.first).toBe(plan.first);
    expect(p.easyTarget).toBe(plan.difficultyTargets[0]);
    expect(p.mediumTarget).toBe(plan.difficultyTargets[1]);
    for (const group of plan.groups) {
      const actual = new Set(
        s.questions
          .filter(
            (q) =>
              genreOf(q) === genre &&
              familiarityOf(q) === group.level &&
              q.difficulty === group.difficulty,
          )
          .map((q) => q.knowledgeId),
      );
      expect(group.goals.every((id) => actual.has(id))).toBe(true);
      expect(group.target).toBe(Math.ceil(group.goals.length * 0.6));
      expect(group.target).toBeGreaterThan(0);
    }
    expect(pathQuestions(s).some((q) => genreOf(q) === genre)).toBe(true);
  }
});
it("behält historische 20-Ziele-Rechte auch wenn die neue Sci-Fi-Schwelle höher ist", () => {
  const qs = importCsv(readFileSync("public/fragen.csv", "utf8")).questions;
  const s = emptyState(qs);
  const goals = unique(qs.filter((q) => q.difficulty === "leicht")).slice(
    0,
    20,
  );
  play(s, goals);
  for (const r of s.rounds) r.ruleVersion = "1";
  delete s.journey;
  expect(learningPathProgress(s)("Science-Fiction").mediumUnlocked).toBe(true);
  retainJourneyUnlocks(s);
  expect(validateBackup(s).journey?.earned["Science-Fiction"].difficulty).toBe(
    1,
  );
});
it("validiert historische Bekanntheit gegen den Rundensnapshot statt spätere redaktionelle Zuordnung", () => {
  const s = emptyState(questions);
  const r = startRound(s, {
    ...options,
    mode: "rekord",
    filters: {
      genres: ["Horror"],
      difficulties: ["leicht"],
      familiarities: [1],
    },
  });
  // Simulate an old classification: these films used to be in group 2.
  r.filters!.familiarities = [2];
  r.familiaritySnapshot = Object.fromEntries(r.questions.map((q) => [q.id, 2]));
  expect(validateBackup(s).rounds[0].filters!.familiarities).toEqual([2]);
  delete r.familiaritySnapshot[r.questions[0].id];
  expect(() => validateBackup(s)).toThrow("Rundenauswahl");
});

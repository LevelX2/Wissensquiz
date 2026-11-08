import { currentCsv } from "./helpers/current-content";
import { catalogCounts } from "./catalog-counts";
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
import { workReferencesOf } from "../src/workAttributes";
import { workFamiliarityOf } from "../src/familiarity";
import { familiarityOf, selectionRule } from "../src/familiarity";
import films from "../src/filmFamiliarity.json";
import { validateBackup } from "../src/backupValidation";
const questions = importCsv(currentCsv({ genre: "Horror" })).questions;
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
it("ordnet alle bekannten Filmfassungen genau einmal redaktionell ein und erhält Hauptfragen und Varianten gemeinsam", () => {
  expect(
    films.films
      .slice(0, 425)
      .map((f) => f.film)
      .sort(),
  ).toEqual(facts.map((f) => f.film).sort());
  expect(films.films).toHaveLength(catalogCounts.familiarityEntries);
  expect(new Set(films.films.map((f) => f.film)).size).toBe(
    catalogCounts.familiarityEntries,
  );
  expect(films.films.every((f) => [1, 2, 3, 4].includes(f.level))).toBe(true);
  expect(questions.every((q) => familiarityOf(q))).toBe(true);
  for (const q of questions.filter((q) => q.metadata.variant_of))
    expect(familiarityOf(q)).toBe(
      familiarityOf(questions.find((p) => p.id === q.metadata.variant_of)!),
    );
});
it("startet bei Film-Ikonen, öffnet Filmgruppen unabhängig und berechnet Schwellen bei Katalogzuwachs neu", async () => {
  const s = emptyState(structuredClone(questions));
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
  const old = structuredClone(s);
  s.questions.push(
    { ...goals[0], id: "extra-1", knowledgeId: "extra-1" },
    { ...goals[0], id: "extra-2", knowledgeId: "extra-2" },
  );
  expect(learningPathProgress(s)("Horror").easyTarget).toBe(
    Math.ceil(
      (unique(questions.filter((q) => q.difficulty === "leicht")).length + 2) /
        2,
    ),
  );
  expect(learningPathProgress(s)("Horror").familiarity).toBe(1);
  const restored = validateBackup(JSON.parse(JSON.stringify(old)));
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
import { genreOf } from "../src/filters";
it("prüft dynamische Halbziele aller Filmgruppen im vollständigen Bestand", () => {
  const s = emptyState();
  addPackages(
    s,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`${p.path}`, "utf8"),
    })),
  );
  const progress = learningPathProgress(s);
  expect(s.questions).toHaveLength(catalogCounts.questions);
  expect(
    s.questions
      .filter((q) => !q.metadata.person_id)
      .every((q) => familiarityOf(q)),
  ).toBe(true);
  expect(
    s.questions
      .filter((q) => q.metadata.person_id)
      .every((q) => familiarityOf(q)),
  ).toBe(true);
  for (const genre of new Set(
    s.questions
      .filter((q) => !q.tags.includes("Preisträger") && !q.metadata.person_id)
      .map(genreOf),
  )) {
    const p = progress(genre);
    const subjects = s.questions.flatMap((q) =>
      q.difficulty === "experte"
        ? []
        : workReferencesOf(q)
            .filter((w) => w.type === "film" && w.genres.includes(genre))
            .map((w) => ({ q, familiarity: workFamiliarityOf(w) })),
    );
    expect(p.first).toBe(
      Math.min(...subjects.map((item) => item.familiarity || 5)),
    );
    for (const [difficulty, target] of [
      ["leicht", p.easyTarget],
      ["mittel", p.mediumTarget],
    ] as const)
      expect(target).toBe(
        Math.ceil(
          new Set(
            subjects
              .filter((item) => item.q.difficulty === difficulty)
              .map((item) => item.q.knowledgeId),
          ).size / 2,
        ),
      );
    for (const group of p.groups) {
      const ids = new Set(
        subjects
          .filter(
            (item) =>
              item.familiarity === group.level &&
              item.q.difficulty === "leicht",
          )
          .map((item) => item.q.knowledgeId),
      );
      expect(group.total).toBe(ids.size);
      expect(group.target).toBe(Math.ceil(ids.size / 2));
    }
    expect(pathQuestions(s).some((q) => genreOf(q) === genre)).toBe(true);
  }
});
it("berechnet alte Kurzfreigaben aus aktuellen sicheren Zielen neu", () => {
  const qs = importCsv(currentCsv({ genre: "Science-Fiction" })).questions;
  const s = emptyState(qs);
  const goals = unique(qs.filter((q) => q.difficulty === "leicht")).slice(
    0,
    20,
  );
  play(s, goals);
  for (const r of s.rounds) r.ruleVersion = "1";
  delete s.journey;
  expect(learningPathProgress(s)("Science-Fiction").mediumUnlocked).toBe(false);
  retainJourneyUnlocks(s);
  expect(
    validateBackup(s).journey?.earned["Science-Fiction"]?.difficulty ?? 0,
  ).toBe(0);
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

it("öffnet Filmgruppen ab der Hälfte aller aktuellen leichten Ziele und berechnet Ergänzungen neu", () => {
  const base = questions.find(
    (q) => familiarityOf(q) === 1 && q.difficulty === "leicht",
  )!;
  const next = questions.find((q) => familiarityOf(q) === 2)!;
  const qs = Array.from({ length: 5 }, (_, i) => ({
    ...base,
    id: "group-" + i,
    knowledgeId: "goal-" + i,
  }));
  const s = emptyState([...qs, next]);
  s.journey = {
    version: 1,
    earned: { Horror: { difficulty: 0, familiarity: 4 } },
  };
  expect(learningPathProgress(s)("Horror")).toMatchObject({
    familiarity: 1,
    groups: [
      { level: 1, total: 5, target: 3, answered: 0, unlocked: true },
      { level: 2, unlocked: false },
    ],
  });
  play(s, qs.slice(0, 2));
  play(s, qs.slice(0, 2));
  expect(learningPathProgress(s)("Horror")).toMatchObject({
    familiarity: 1,
    groups: [{ answered: 2 }, { unlocked: false }],
  });
  play(s, qs.slice(2, 3));
  expect(learningPathProgress(s)("Horror").familiarity).toBe(2);
  s.questions.push(
    ...Array.from({ length: 2 }, (_, i) => ({
      ...base,
      id: "new-" + i,
      knowledgeId: "new-" + i,
    })),
  );
  expect(learningPathProgress(s)("Horror")).toMatchObject({
    familiarity: 1,
    groups: [{ total: 7, target: 4, answered: 3 }, { unlocked: false }],
  });
  s.questions = s.questions.filter((q) => q.id !== "group-0");
  expect(learningPathProgress(s)("Horror")).toMatchObject({
    familiarity: 1,
    groups: [{ total: 6, target: 3, answered: 2 }, { unlocked: false }],
  });
});

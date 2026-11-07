import { it, expect } from "vitest";
import { catalogCounts } from "./catalog-counts";
import { readFileSync } from "node:fs";

import { addPackages, packages, readQuestions } from "../src/packages";

import { emptyState } from "../src/model";
import {
  CLASSICS,
  ARTHOUSE,
  isCategory,
  isClassic,
  matchesTopic,
  categoryTopic,
} from "../src/categories";
import { answer, startRound } from "../src/engine";
import { applyCategoryTags } from "../src/categoryPreparation";
import { validateBackup } from "../src/backupValidation";
import artReferences from "../KI-Wissen-Wissensquiz/01 Rohquellen/Arthouse_Zuordnungen_Bestand.json";
import references from "../KI-Wissen-Wissensquiz/01 Rohquellen/Classics_Zuordnungen_Bestand.json";

const contents = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(`${p.path}`, "utf8"),
}));
const original = contents.flatMap((p) => readQuestions(p.text));

it("führt Classics und Arthouse als aktuelle Attribute ohne Lieferdateien oder Herkunftsprüfungen", () => {
  expect(original.filter(isClassic)).toHaveLength(
    catalogCounts.classicsQuestions,
  );
  expect(original.filter((q) => isCategory(q, ARTHOUSE))).toHaveLength(
    catalogCounts.arthouseQuestions,
  );
  const before = structuredClone(original);
  applyCategoryTags(original);
  expect(original).toEqual(before);
  const topic = categoryTopic("Alle Themen", [ARTHOUSE, CLASSICS]);
  const union = original.filter((q) => matchesTopic(q, topic));
  expect(new Set(union.map((q) => q.id)).size).toBe(union.length);
  expect(
    union.every((q) => isCategory(q, ARTHOUSE) || isCategory(q, CLASSICS)),
  ).toBe(true);
});

it("überspringt jede abweichende Referenz und erfindet keine fehlende Frage", () => {
  const ref = references.entries[0];
  const q = original.find((q) => q.id === ref.question_id)!;
  for (const field of [
    "knowledgeId",
    "variant_of",
    "film_title_original",
    "film_year",
    "subdomain",
  ]) {
    const changed = structuredClone(q);
    if (field === "knowledgeId") changed.knowledgeId = "different";
    else changed.metadata[field] = "different";
    const before = JSON.stringify(changed);
    expect(applyCategoryTags([changed], CLASSICS).mismatched).toEqual([q.id]);
    expect(JSON.stringify(changed)).toBe(before);
  }
});

it("bewahrt alte Rundensnapshots, Backup und gemeinsamen Fortschritt bei Classics-Wechsel", () => {
  const state = emptyState(structuredClone(original));
  const western = state.questions.find(
    (q) => q.id === references.entries[0].question_id,
  )!;
  const round = startRound(
    state,
    {
      mode: "ueben",
      topic: western.topic,
      difficulty: "leicht",
      filters: { genres: ["Western"], difficulties: ["leicht"] },
    },
    1000,
  );
  const before = JSON.stringify(round);
  addPackages(state, []);
  expect(JSON.stringify(round)).toBe(before);
  expect(() => validateBackup(state)).not.toThrow();
  answer(
    state,
    round.id,
    round.questions[0].id,
    round.questions[0].correctId,
    0,
    2000,
  );
  const goal = round.questions[0].knowledgeId;
  expect(
    state.questions.filter((q) => q.knowledgeId === goal).every(isClassic),
  ).toBe(true);
  expect(Object.keys(state.learning)).toEqual([goal]);
  round.status = "aborted";
  round.finishedAt = 2001;
  const classicRound = startRound(
    state,
    {
      mode: "ueben",
      topic: categoryTopic(western.topic, true),
      difficulty: "leicht",
      filters: { genres: ["Western"], difficulties: ["leicht"] },
    },
    3000,
  );
  expect(
    classicRound.questions.every((q) => matchesTopic(q, classicRound.topic)),
  ).toBe(true);
  expect(new Set(classicRound.questions.map((q) => q.knowledgeId)).size).toBe(
    classicRound.questions.length,
  );
  expect(() => validateBackup(state)).not.toThrow();
  state.questions.find((q) => q.id === round.questions[0].id)!.context +=
    " manipulated";
  expect(() => validateBackup(state)).toThrow();
});

it("führt Sci-Fi als Genre-Alias zusammen und erhält die Quellbezeichnung", () => {
  const q = original.find(
    (q) => q.metadata.film_title_original === "Metropolis",
  )!;
  expect(q.metadata.subdomain).toBe("Science-Fiction");
  expect(q.metadata.source_subdomain).toBe("Sci-Fi");
});

it("erhält Arthouse-Rundensnapshots und gemeinsame Lernidentität beim Kategorienwechsel", () => {
  const state = emptyState(structuredClone(original));
  const q = state.questions.find(
    (q) => q.id === artReferences.entries[0].question_id,
  )!;
  const r = startRound(
    state,
    { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
    1000,
  );
  answer(state, r.id, r.questions[0].id, r.questions[0].correctId, 0, 2000);
  const before = JSON.stringify({
    rounds: state.rounds,
    events: state.events,
    learning: state.learning,
  });
  addPackages(state, []);
  expect(
    JSON.stringify({
      rounds: state.rounds,
      events: state.events,
      learning: state.learning,
    }),
  ).toBe(before);
  expect(() => validateBackup(state)).not.toThrow();
  expect(
    state.questions
      .filter((q) => q.knowledgeId === r.questions[0].knowledgeId)
      .every((q) => isCategory(q, ARTHOUSE)),
  ).toBe(true);
  const rom = original.find((q) => q.metadata.source_subdomain === "RomCom")!;
  expect(rom.metadata.subdomain).toBe("Rom-Com");
  r.status = "aborted";
  r.finishedAt = 2001;
  const combined = startRound(
    state,
    {
      mode: "ueben",
      topic: categoryTopic("Alle Themen", [ARTHOUSE, CLASSICS]),
      difficulty: "Alle Stufen",
      filters: { genres: ["Drama", "Rom-Com"], difficulties: ["leicht"] },
    },
    3000,
  );
  answer(
    state,
    combined.id,
    combined.questions[0].id,
    combined.questions[0].correctId,
    0,
    4000,
  );
  expect(validateBackup(state).rounds.at(-1)?.topic).toBe(
    "Classics + Arthouse",
  );
  expect(new Set(combined.questions.map((q) => q.knowledgeId)).size).toBe(
    combined.questions.length,
  );
});

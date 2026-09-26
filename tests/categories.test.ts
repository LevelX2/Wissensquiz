import { it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { addPackages, packages } from "../src/packages";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import {
  applyCategoryTags,
  isClassic,
  matchesTopic,
  categoryTopic,
} from "../src/categories";
import { answer, startRound } from "../src/engine";
import { validateBackup } from "../src/storage";
import references from "../KI-Wissen-Wissensquiz/01 Rohquellen/Classics_Zuordnungen_Bestand.json";

const contents = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const original = contents.flatMap(
  (p) => importCsv(p.text, [], p.filename).questions,
);

it("prüft alle Classics-Zuordnungen, erhält Texte/IDs und ergänzt Tags idempotent", () => {
  const questions = structuredClone(original);
  const report = applyCategoryTags(questions);
  expect(report.applied).toHaveLength(225);
  expect(report.missing).toHaveLength(33);
  expect(report.mismatched).toEqual([]);
  const first = JSON.stringify(questions);
  expect(applyCategoryTags(questions)).toEqual(report);
  expect(JSON.stringify(questions)).toBe(first);
  for (let i = 0; i < questions.length; i++) {
    const { tags, badgeTags, ...q } = questions[i];
    const { tags: oldTags, badgeTags: oldBadges, ...old } = original[i];
    expect(q).toEqual(old);
    expect(tags).toEqual(expect.arrayContaining(oldTags));
    expect(badgeTags).toEqual(expect.arrayContaining(oldBadges));
    expect(new Set(tags).size).toBe(tags.length);
  }
  const classics = questions.filter(isClassic);
  expect(classics).toHaveLength(405);
  expect(new Set(questions.map((q) => q.id)).size).toBe(1440);
  const sourceChecks = references.source_files.map((ref) => {
    const pkg = contents.find((p) => p.filename === ref.filename);
    return {
      filename: ref.filename,
      available: !!pkg,
      matches: pkg
        ? createHash("sha256").update(pkg.text).digest("hex") === ref.sha256
        : null,
    };
  });
  expect(sourceChecks.filter((s) => s.available).every((s) => s.matches)).toBe(
    true,
  );
  writeFileSync(
    "docs/classics-zuordnungsbericht.json",
    JSON.stringify(
      {
        ...report,
        sourceChecks,
        classicQuestions: classics.length,
        classicKnowledgeGoals: new Set(classics.map((q) => q.knowledgeId)).size,
        classicFilms: new Set(
          classics.map((q) => q.metadata.film_title_original),
        ).size,
      },
      null,
      2,
    ),
  );
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
    expect(applyCategoryTags([changed]).mismatched).toEqual([q.id]);
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
      mode: "entdecken",
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
      mode: "entdecken",
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

import { it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { addPackages, packages } from "../src/packages";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import {
  CLASSICS,
  ARTHOUSE,
  isCategory,
  matchesCategories,
  applyCategoryTags,
  isClassic,
  matchesTopic,
  categoryTopic,
} from "../src/categories";
import { answer, startRound } from "../src/engine";
import { validateBackup } from "../src/storage";
import artReferences from "../KI-Wissen-Wissensquiz/01 Rohquellen/Arthouse_Zuordnungen_Bestand.json";
import references from "../KI-Wissen-Wissensquiz/01 Rohquellen/Classics_Zuordnungen_Bestand.json";

const contents = packages.slice(0, 14).map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const original = contents.flatMap(
  (p) => importCsv(p.text, [], p.filename).questions,
);

it("prüft alle Classics-Zuordnungen, erhält Texte/IDs und ergänzt Tags idempotent", () => {
  const questions = structuredClone(original);
  const report = applyCategoryTags(questions, CLASSICS);
  expect(report.applied).toHaveLength(258);
  expect(report.missing).toHaveLength(0);
  expect(report.mismatched).toEqual([]);
  const first = JSON.stringify(questions);
  expect(applyCategoryTags(questions, CLASSICS)).toEqual(report);
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
  expect(classics).toHaveLength(730);
  expect(new Set(questions.map((q) => q.id)).size).toBe(2880);
  const sourceChecks = references.source_files.map((ref) => {
    const pkg = contents.find((p) => p.filename === ref.filename);
    return {
      filename: ref.filename,
      available: !!pkg,
      matches: pkg
        ? createHash("sha256")
            .update(
              readFileSync(
                `KI-Wissen-Wissensquiz/01 Rohquellen/${ref.filename}`,
              ),
            )
            .digest("hex") === ref.sha256
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

it("prüft Arthouse-Referenzen samt Quellhashes, Überschneidung und fehlenden IDs", () => {
  const questions = structuredClone(original);
  const report = applyCategoryTags(questions, ARTHOUSE);
  expect(report.applied).toHaveLength(126);
  expect(report.missing).toEqual([]);
  expect(report.mismatched).toEqual([]);
  const first = JSON.stringify(questions);
  applyCategoryTags(questions, ARTHOUSE);
  expect(JSON.stringify(questions) === first).toBe(true);
  applyCategoryTags(questions);
  for (const ref of artReferences.source_files) {
    expect(
      createHash("sha256")
        .update(
          readFileSync(`KI-Wissen-Wissensquiz/01 Rohquellen/${ref.filename}`),
        )
        .digest("hex"),
    ).toBe(ref.sha256);
  }
  const art = questions.filter((q) => isCategory(q, ARTHOUSE));
  expect(art).toHaveLength(362);
  const overlap = questions.filter((q) =>
    ([CLASSICS, ARTHOUSE] as const).every((c) => isCategory(q, c)),
  );
  expect(overlap.length).toBeGreaterThan(0);
  const topic = categoryTopic("Alle Themen", [ARTHOUSE, CLASSICS]);
  expect(topic).toBe("Classics + Arthouse");
  const union = questions.filter((q) => matchesTopic(q, topic));
  expect(union.length).toBe(730 + 362 - overlap.length);
  expect(new Set(union.map((q) => q.id)).size).toBe(union.length);
  expect(matchesCategories(overlap[0], [ARTHOUSE, CLASSICS])).toBe(true);
  expect(
    matchesTopic(overlap[0], categoryTopic(overlap[0].topic, [ARTHOUSE])),
  ).toBe(true);
  const missing = applyCategoryTags([], ARTHOUSE);
  expect(missing.missing).toHaveLength(126);
  const ref = artReferences.entries[0];
  const changed = structuredClone(
    original.find((q) => q.id === ref.question_id)!,
  );
  changed.metadata.film_year = "9999";
  expect(applyCategoryTags([changed], ARTHOUSE).mismatched).toEqual([
    changed.id,
  ]);
  expect(changed.tags).not.toContain(ARTHOUSE);
  writeFileSync(
    "docs/arthouse-zuordnungsbericht.json",
    JSON.stringify(
      {
        ...report,
        sourceChecks: artReferences.source_files.map((r) => ({
          filename: r.filename,
          matches: true,
        })),
        arthouseQuestions: art.length,
        arthouseKnowledgeGoals: new Set(art.map((q) => q.knowledgeId)).size,
        arthouseFilms: new Set(art.map((q) => q.metadata.film_title_original))
          .size,
        overlappingClassicsQuestions: overlap.length,
        unionQuestions: union.length,
      },
      null,
      2,
    ),
  );
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

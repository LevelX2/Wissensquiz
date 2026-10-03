import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { importCsv } from "../src/importer";
import { answer, startRound } from "../src/engine";
import { ACTORS, categories, matchesCategories } from "../src/categories";
import { matchesFilters } from "../src/filters";
import { filmData } from "../src/filmFacts";
import {
  pathQuestions,
  learningPathProgress,
  newlyUnlocked,
} from "../src/learningPath";
import { validateBackup } from "../src/storage";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
import source from "../docs/Schauspieler-Fragenpaket/Schauspieler_100_Personen_800_Fragen.json";
import links from "../src/actorKnowledgeLinks.json";
import proof from "../docs/importbericht-schauspieler.json";

const contents = packages.map((pkg) => ({
  filename: pkg.filename,
  text: readFileSync(`public${pkg.path}`, "utf8"),
}));
const actorPackage = contents.find(
  (pkg) => pkg.filename === "Schauspieler_800_Fragen_App.csv",
)!;
const baseContents = contents.filter((pkg) => pkg !== actorPackage);
const base = emptyState();
addPackages(base, baseContents);
const imported = importCsv(
  actorPackage.text,
  base.questions,
  actorPackage.filename,
);
const now = Date.parse("2026-10-03T12:00:00+02:00");

it("übernimmt alle 800 individuellen Fragen unverändert mit 100 Personen und vier Stufen", () => {
  expect(imported.report).toMatchObject({
    accepted: 800,
    rejected: 0,
    duplicates: 0,
    warnings: [],
    issues: [],
  });
  expect(Buffer.from(actorPackage.text)).toEqual(
    readFileSync(
      `KI-Wissen-Wissensquiz/01 Rohquellen/${actorPackage.filename}`,
    ),
  );
  expect(createHash("sha256").update(actorPackage.text).digest("hex")).toBe(
    proof.app_csv_sha256,
  );
  const persons = new Set(imported.questions.map((q) => q.metadata.person_id));
  expect(persons.size).toBe(100);
  for (const person of persons) {
    const rows = imported.questions.filter(
      (q) => q.metadata.person_id === person,
    );
    expect(rows).toHaveLength(8);
    for (const difficulty of ["leicht", "mittel", "schwer", "experte"])
      expect(rows.filter((q) => q.difficulty === difficulty)).toHaveLength(2);
  }
  for (const original of source.questions) {
    const q = imported.questions.find((q) => q.id === original.question_id)!;
    expect(q.question).toBe(original.question);
    expect(q.context).toBe(original.additional_info);
    expect(q.sources).toEqual(original.source_urls);
    expect(q.answers.map((a) => a.text)).toEqual(
      original.answers.map((a) => a.text),
    );
    expect(q.answers.find((a) => a.id === q.correctId)!.text).toBe(
      original.answers.find((a) => a.id === original.correct_answer)!.text,
    );
    expect(q.topic).toBe(q.metadata.person_name);
    expect(q.tags).toContain(ACTORS);
    expect(filmData(q)).toBeUndefined();
    expect(q.metadata.film_title_original).toBeUndefined();
    if (!original.actor_name_before_answer)
      expect(q.question).not.toContain(q.metadata.person_name);
  }
});

it("erhält bestehende Fragen, Ereignisse und Lernstände und nutzt 50 vorhandene Wissensziele", () => {
  const state = structuredClone(base);
  const linked = base.questions.find(
    (q) => q.id === links["SCHAUSPIELER-202610-P01-001-L-1"],
  )!;
  const catalog = state.questions;
  state.questions = [linked];
  const round = startRound(
    state,
    { mode: "ueben", topic: linked.topic, difficulty: linked.difficulty },
    now,
  );
  state.questions = catalog;
  const selected = round.questions[0];
  answer(state, round.id, selected.id, selected.correctId, 1000, now + 1000);
  const before = structuredClone(state);
  addPackages(state, [actorPackage]);
  addPackages(state, [actorPackage]);
  expect(state.questions).toHaveLength(5677);
  expect(new Set(state.questions.map((q) => q.knowledgeId)).size).toBe(5147);
  expect(state.questions.slice(0, before.questions.length)).toEqual(
    before.questions,
  );
  expect({
    events: state.events,
    rounds: state.rounds,
    learning: state.learning,
  }).toEqual({
    events: before.events,
    rounds: before.rounds,
    learning: before.learning,
  });
  expect(state.journey?.earned ?? {}).toEqual(before.journey?.earned ?? {});
  expect(state.imports).toHaveLength(17);
  for (const [questionId, oldId] of Object.entries(links)) {
    const q = state.questions.find((q) => q.id === questionId)!;
    expect(q.knowledgeId).toBe(
      base.questions.find((q) => q.id === oldId)!.knowledgeId,
    );
    expect(q.metadata.variant_of).toBe(oldId);
  }
  expect(
    state.questions.find((q) => q.id === "SCHAUSPIELER-202610-P01-001-L-1")!
      .knowledgeId,
  ).toBe(selected.knowledgeId);
  expect(state.learning[selected.knowledgeId]).toEqual(
    before.learning[selected.knowledgeId],
  );
  expect(Object.keys(links)).toHaveLength(50);
});

it("spielt Personen unabhängig von Filmgruppen und erhält Filmreise sowie getrennte Kategorien", () => {
  const state = structuredClone(base);
  const beforePath = pathQuestions(state).map((q) => q.id);
  const progress = learningPathProgress(state);
  addPackages(state, [actorPackage]);
  expect(
    pathQuestions(state)
      .filter((q) => !q.metadata.person_id)
      .map((q) => q.id),
  ).toEqual(beforePath);
  expect(pathQuestions(state).filter((q) => q.metadata.person_id)).toHaveLength(
    200,
  );
  const q = imported.questions.find((q) => q.difficulty === "experte")!;
  expect(
    matchesFilters(q, {
      genres: [ACTORS],
      difficulties: ["experte"],
      familiarities: [1],
    }),
  ).toBe(true);
  expect(
    matchesFilters(q, {
      genres: ["Drama"],
      difficulties: ["experte"],
      familiarities: [1],
    }),
  ).toBe(false);
  const selected = state.questions.filter((q) =>
    matchesCategories(q, [ACTORS]),
  );
  expect(selected).toHaveLength(800);
  expect(
    state.questions.filter((q) =>
      matchesCategories(q, [ACTORS, "Preisträger"]),
    ),
  ).toHaveLength(1000);
  expect(newlyUnlocked(progress, state)).toEqual([]);
  const round = startRound(
    state,
    {
      mode: "ueben",
      topic: ACTORS,
      difficulty: "experte",
      filters: {
        genres: [ACTORS],
        difficulties: ["experte"],
        familiarities: [1],
      },
    },
    now,
  );
  expect(round.questions).toHaveLength(5);
  expect(
    round.questions.every(
      (q) => q.metadata.person_id && q.difficulty === "experte",
    ),
  ).toBe(true);
});

it("sichert Personenmetadaten, Quellen und alle vier Kategorien in JSON und privater Kontosicherung", async () => {
  const state = structuredClone(base);
  addPackages(state, [actorPackage]);
  state.settings.roundSetup = {
    mode: "ueben",
    genres: null,
    categories: [...categories],
    difficulties: ["experte"],
    familiarities: [1],
  };
  startRound(
    state,
    { mode: "ueben", topic: ACTORS, difficulty: "experte" },
    now,
  );
  expect(validateBackup(JSON.parse(JSON.stringify(state)))).toEqual(state);
  expect(await decodeCloudState(await encodeCloudState(state))).toEqual(state);
});

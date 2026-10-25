import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { importCsv } from "../src/importer";
import { addPackages, packages } from "../src/packages";
import { emptyState, type Question, type State } from "../src/model";
import { answer, complete, startRound } from "../src/engine";
import { familiarityOf, filmIdentity } from "../src/familiarity";
import { filmData } from "../src/filmFacts";
import { questionSourceOf } from "../src/filters";
import { learningPathProgress, pathQuestions } from "../src/learningPath";
import { validateBackup } from "../src/backupValidation";
import source from "../docs/Filmfragen-Ergaenzung-2026-10-06/Filmdaten.json";
import { assertEditorialSource, originalQuestionId, currentQuestionId } from "./editorialSource";
import integration from "./fixtures/appliedEditorial.json";
import ticketCorrections from "../docs/GitHub-Tickets-2026-10-25.json";

const latest = packages.find(
  (p) => p.path === "/film-ergaenzung-240-fragen.csv",
)!;
// Preserve this package's integration stage; the complete current catalog is
// checked separately by the portrait-package and catalog tests.
const contents = packages
  .slice(0, packages.findIndex(p => p.filename === "Schauspieler-Bekanntheit-2026-10-13.csv"))
  .filter(
    (p) =>
      p.filename !== "Schauspieler_Bilderkennung_200_Fragen.csv" &&
      !p.filename.endsWith("fragen_20261007.csv") &&
      !p.filename.startsWith("Genre100_") &&
      !p.filename.startsWith("Schauspieler-Bekanntheit-"),
  )
  .map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  }));
const incoming = contents.find((p) => p.filename === latest.filename)!;
const previous = contents.filter((p) => p !== incoming);
const prefix = "F240-20261006-";
const before = emptyState();
addPackages(before, previous);

function playOne(state: State, q: Question, at: number) {
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    at,
  );
  round.questions = [structuredClone(q)];
  round.order = [q.answers.map((a) => a.id)];
  round.familiaritySnapshot = { [q.id]: familiarityOf(q) ?? 0 };
  answer(state, round.id, q.id, q.correctId, 100, at + 1000);
  complete(state, round.id, at + 2000);
}

it("importiert das veröffentlichte Paket vollständig mit 20 Filmen je Genre und einem vorhandenen Regieziel", () => {
  expect(packages).toContainEqual(latest);
  assertEditorialSource(
    incoming.text,
    readFileSync(
      "docs/Filmfragen-Ergaenzung-2026-10-06/Filmfragen_240_Filme_1920_Fragen.csv",
      "utf8",
    ),
    `public${latest.path}`,
  );
  const imported = importCsv(incoming.text, before.questions, latest.filename);
  expect(imported.report).toMatchObject({
    accepted: 1920,
    rejected: 0,
    duplicates: 0,
    issues: [],
    warnings: [],
  });
  const groups = new Map<string, Question[]>();
  for (const q of imported.questions) {
    const key = filmIdentity(q);
    groups.set(key, [...(groups.get(key) ?? []), q]);
  }
  expect(groups.size).toBe(240);
  for (const qs of groups.values()) {
    expect(qs).toHaveLength(8);
    expect(
      qs.map((q) => originalQuestionId(q.id).split("-").at(-1)).sort(),
    ).toEqual(["D", "L1", "L2", "M1", "M2", "S1", "S2", "Y"]);
    for (const [code, difficulty] of [
      ["L", "leicht"],
      ["M", "mittel"],
      ["S", "schwer"],
    ]) {
      expect(
        qs.filter((q) =>
          originalQuestionId(q.id).split("-").at(-1)?.startsWith(code),
        ),
      ).toHaveLength(2);
      expect(
        qs
          .filter((q) =>
            originalQuestionId(q.id).split("-").at(-1)?.startsWith(code),
          )
          .every(
            (q) =>
              q.difficulty ===
              (integration.changes.find((c) => c.after.question_id === q.id)
                ?.after.difficulty ?? difficulty),
          ),
      ).toBe(true);
    }
  }
  for (const genre of new Set(source.films.map((f) => f.subdomain))) {
    const qs = imported.questions.filter((q) => q.metadata.subdomain === genre);
    expect(qs).toHaveLength(160);
    expect(new Set(qs.map(filmIdentity)).size).toBe(20);
  }
  const shared = imported.questions.filter((q) => q.metadata.variant_of);
  expect(shared).toHaveLength(1);
  expect(shared[0].id).toBe("F240-20261006-043-D");
  expect(shared[0].knowledgeId).toBe(
    before.questions.find((q) => q.id === shared[0].metadata.variant_of)!
      .knowledgeId,
  );
  expect(new Set(imported.questions.map((q) => q.knowledgeId)).size).toBe(1920);
  const oldGoals = new Set(before.questions.map((q) => q.knowledgeId));
  expect(
    imported.questions.filter((q) => oldGoals.has(q.knowledgeId)),
  ).toHaveLength(1);
});

it("ergänzt den echten Gesamtkatalog ohne weitere Jahres-/Regiefragen und übersteht einen Wiederholungsimport", () => {
  const state = structuredClone(before);
  const oldQuestions = structuredClone(state.questions);
  addPackages(state, [incoming]);
  const once = structuredClone(state);
  addPackages(state, contents);
  expect(state).toEqual(once);
  expect(state.questions).toHaveLength(8208);
  expect(new Set(state.questions.map((q) => q.knowledgeId)).size).toBe(7668);
  expect(
    new Set(
      state.questions
        .filter((q) => questionSourceOf(q) === "film")
        .map(filmIdentity),
    ).size,
  ).toBe(785);
  expect(state.questions.slice(0, oldQuestions.length)).toEqual(oldQuestions);
  expect(
    state.questions.filter((q) => originalQuestionId(q.id).startsWith(prefix)),
  ).toHaveLength(1920);
  expect(state.bundledQuestionIds).toHaveLength(8208);
  expect(
    state.imports.filter((r) => r.filename === latest.filename),
  ).toHaveLength(1);
  expect(validateBackup(structuredClone(state)).questions).toHaveLength(8208);
  const fresh = emptyState();
  addPackages(fresh, contents);
  expect(fresh.questions).toEqual(state.questions);
  expect(pathQuestions(fresh).some((q) => q.id.startsWith(prefix))).toBe(true);
}, 20000);

it("erhält Lerntermine und aktive Runden, berechnet Schwierigkeiten beim Ergänzen neu", async () => {
  const state = structuredClone(before);
  state.settings.sound = false;
  state.favorites = ["Alien"];
  const unique = (qs: Question[]) => [
    ...new Map(qs.map((q) => [q.knowledgeId, q])).values(),
  ];
  const progress = learningPathProgress(state)("Western");
  const goals = [
    ...unique(
      state.questions.filter(
        (q) => q.metadata.subdomain === "Western" && q.difficulty === "leicht",
      ),
    ).slice(0, progress.easyTarget),
    ...unique(
      state.questions.filter(
        (q) => q.metadata.subdomain === "Western" && q.difficulty === "mittel",
      ),
    ).slice(0, progress.mediumTarget),
    state.questions.find((q) => q.id === "SCHAUSPIELER-202610-P01-088-S-2")!,
  ];
  for (const [i, q] of goals.entries()) playOne(state, q, 10000 + i * 10000);
  expect(learningPathProgress(state)("Western").hardUnlocked).toBe(true);
  startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1000000,
  );
  const savedProgress = (s: State) => ({
    rounds: s.rounds,
    events: s.events,
    learning: s.learning,
    settings: s.settings,
    favorites: s.favorites,
    experience: s.experience,
    career: s.career,
    records: s.records,
  });
  const snapshot = structuredClone(savedProgress(state));
  const oldRights = structuredClone(state.journey?.earned);
  const saved = structuredClone(state);
  addPackages(saved, [incoming]);
  addPackages(saved, [incoming]);
  expect(savedProgress(saved)).toEqual(snapshot);
  expect(saved.journey?.earned.Western.familiarity).toEqual(
    oldRights?.Western.familiarity,
  );
  expect(learningPathProgress(saved)("Western").hardUnlocked).toBe(false);
  expect(saved.questions).toHaveLength(8208);
  expect(
    saved.imports.filter((r) => r.filename === latest.filename),
  ).toHaveLength(1);
  const variant = saved.questions.find((q) => q.id === "F240-20261006-043-D")!;
  expect(saved.learning[variant.knowledgeId]).toEqual(
    state.learning[variant.knowledgeId],
  );
  expect(saved.learning[variant.knowledgeId]).toBeDefined();
  expect(() => validateBackup(saved)).not.toThrow();
}, 20000);

it("zeigt die recherchierten Filmdaten fassungsgenau und erhält eine bestehende Bekanntheitseinordnung", () => {
  const state = structuredClone(before);
  addPackages(state, [incoming]);
  for (const film of source.films) {
    const q = state.questions.find((q) => q.id === currentQuestionId(film.reference_question_id))!;
    expect(filmData(q), film.film_title_original).toMatchObject({
      originalTitle: film.film_title_original,
      year: film.film_year,
      countries: film.production_countries,
      releaseNote: film.release_note,
      directorNote: film.director_note,
    });
    expect(filmData(q)?.directors.split(/, | und /)).toEqual(film.directors);
    const correction = ticketCorrections.metadataChanges.find(
      (entry) => entry.file === "src/film240Metadata.json" &&
        "film_title_original" in entry.after &&
        entry.after.film_title_original === film.film_title_original,
    );
    const sources = correction && "sources" in correction.after
      ? correction.after.sources
      : film.sources;
    expect(filmData(q)?.sources).toEqual([
      ...new Set(sources.map((s) => s.url.replace(/^http:/, "https:"))),
    ]);
    expect(familiarityOf(q)).toBe(
      film.film_title_original === "Up" ? 1 : film.familiarity_level,
    );
  }
  const data = (rank: number) =>
    filmData(
      state.questions.find(
        (q) => q.id === `${prefix}${String(rank).padStart(3, "0")}-L1`,
      )!,
    )!;
  expect(data(181)).toMatchObject({
    year: 2021,
    directors: "Denis Villeneuve",
  });
  expect(
    filmData(
      state.questions.find(
        (q) =>
          q.metadata.film_title_original === "Dune" &&
          q.metadata.film_year === "1984",
      )!,
    ),
  ).toMatchObject({ year: 1984, directors: "David Lynch" });
  expect(data(223).directors).toBe("Howard Hawks und Arthur Rosson");
  expect(data(230).directors).toBe("John Farrow und John Ford");
  expect(data(194).releaseNote).toContain("1963");
  expect(data(232).releaseNote).toContain("Originalfassung");
  expect(data(200)).toMatchObject({ year: 2021 });
  expect(data(200).releaseNote).toContain("2022");
  const ref = state.questions.find(
    (q) => q.id === "SCHAUSPIELER-202610-P01-088-S-2",
  )!;
  expect(filmData(ref)).toBeUndefined();
  expect(filmData(ref, "Nomadland|2020")?.originalTitle).toBe("Nomadland");
});

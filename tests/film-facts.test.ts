import { it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { addPackages, packages } from "../src/packages";
import { emptyState, questionSchema, type Question } from "../src/model";
import {
  addFilmFacts,
  prepareFactQuestion,
  questionSnapshotMatches,
  yearChoices,
  filmData,
} from "../src/filmFacts";
import facts from "../src/filmFacts.json";
import {
  applyCategoryTags,
  categories,
  isCategory,
  matchesTopic,
} from "../src/categories";
import { answer, startRound } from "../src/engine";
import { validateBackup } from "../src/storage";
import { genreOf } from "../src/filters";

const contents = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const originals = contents.flatMap(
  (p) => importCsv(p.text, [], p.filename).questions,
);
applyCategoryTags(originals);
const complete = emptyState();
addPackages(complete, contents);
const extra = complete.questions.filter((q) => q.metadata.fact_kind);

it("liefert Filmdaten auch für alte Fragen, unterscheidet Episoden und Reboots und erfindet keine fehlenden Angaben", () => {
  for (const f of facts) {
    const ref = originals.find((q) => q.id === f.referenceId)!;
    const data = filmData(ref)!;
    expect(data.year).toBe(f.year);
    expect(data.countries.length).toBeGreaterThan(0);
    expect(data.directors.length).toBeGreaterThan(0);
    if (data.series) expect(data.series.position).toBeGreaterThan(0);
  }
  const film = (title: string) =>
    filmData(originals.find((q) => q.metadata.film_title_original === title)!)!;
  expect(film("Star Wars").series).toMatchObject({
    position: 1,
    note: expect.stringContaining("Episode IV"),
  });
  expect(film("New Police Story").series).toMatchObject({
    position: 5,
    note: expect.stringContaining("Neustart"),
  });
  expect(film("Star Trek: First Contact").series?.position).toBe(8);
  expect(film("Friday the 13th Part 2").series?.position).toBe(2);
  expect(film("Pappa ante portas").directors).toBe("Loriot");
  const unknown = structuredClone(originals[0]);
  unknown.metadata.film_year = "9999";
  expect(filmData(unknown)).toBeUndefined();
});

it("ergänzt jedes der 300 Filmwerke um Jahr und fehlende Regie, ohne bestehende Ziele zu duplizieren", () => {
  expect(facts).toHaveLength(300);
  expect(extra).toHaveLength(587);
  expect(complete.questions).toHaveLength(2567);
  expect(new Set(complete.questions.map((q) => q.knowledgeId)).size).toBe(2237);
  expect(new Set(complete.questions.map((q) => q.topic)).size).toBe(258);
  expect(complete.questions.slice(0, originals.length)).toEqual(originals);
  for (const f of facts) {
    const year = extra.find((q) => q.id === `${f.id}-YEAR`)!;
    const director = complete.questions.find(
      (q) => q.id === (f.existingDirectorId || `${f.id}-DIRECTOR`),
    )!;
    expect(year).toBeDefined();
    expect(director).toBeDefined();
    expect(year.question).not.toContain(String(f.year));
    expect(
      director.metadata.film_title_original + "|" + director.metadata.film_year,
    ).toBe(f.film);
    const ref = originals.find((q) => q.id === f.referenceId)!;
    expect(genreOf(year)).toBe(genreOf(ref));
    expect(year.topic).toBe(ref.topic);
    expect(year.knowledgeId).not.toBe(director.knowledgeId);
    const siblings = originals.filter(
      (q) =>
        q.metadata.film_title_original + "|" + q.metadata.film_year === f.film,
    );
    for (const category of categories) {
      expect(isCategory(year, category)).toBe(
        siblings.some((q) => isCategory(q, category)),
      );
      if (isCategory(year, category))
        expect(matchesTopic(year, `${category}: ${ref.topic}`)).toBe(true);
    }
  }
  for (const q of extra) {
    expect(questionSchema.safeParse(q).success).toBe(true);
    expect(new Set(q.answers.map((a) => a.text)).size).toBe(4);
    expect(q.sources.length).toBeGreaterThan(0);
    expect(q.answers.filter((a) => a.id === q.correctId)).toHaveLength(1);
  }
  writeFileSync(
    "docs/film-facts-bericht.json",
    JSON.stringify(
      {
        checkedOn: "2026-09-26",
        films: facts.length,
        newYearQuestions: 300,
        newDirectorQuestions: 287,
        existingDirectorGoals: 13,
        totalQuestions: complete.questions.length,
        totalGoals: new Set(complete.questions.map((q) => q.knowledgeId)).size,
        categories: Object.fromEntries(
          categories.map((c) => [
            c,
            {
              questions: complete.questions.filter((q) => isCategory(q, c))
                .length,
              goals: new Set(
                complete.questions
                  .filter((q) => isCategory(q, c))
                  .map((q) => q.knowledgeId),
              ).size,
            },
          ]),
        ),
        difficulties: Object.fromEntries(
          ["year", "director"].map((kind) => [
            kind,
            Object.fromEntries(
              ["leicht", "mittel", "schwer"].map((d) => [
                d,
                extra.filter(
                  (q) => q.metadata.fact_kind === kind && q.difficulty === d,
                ).length,
              ]),
            ),
          ]),
        ),
        sourceNote:
          "Jahre gegen erste Veröffentlichung der verlinkten Filmseiten abgeglichen; Regiecredits mit dokumentierten Einzelfallkorrekturen. Schwierigkeit redaktionell, nicht empirisch gemessen.",
      },
      null,
      2,
    ) + "\n",
  );
});

it("ergänzt idempotent, prüft Filmreferenzen und erzeugt auch bei Teilbestand dieselben Vorlagen", () => {
  const full = structuredClone(complete.questions);
  expect(addFilmFacts(full).added).toEqual([]);
  expect(full).toEqual(complete.questions);
  const ref = structuredClone(
    originals.find((q) => q.id === facts[0].referenceId)!,
  );
  const partial = [ref];
  addFilmFacts(partial);
  expect(partial.find((q) => q.id === `${facts[0].id}-DIRECTOR`)).toEqual(
    extra.find((q) => q.id === `${facts[0].id}-DIRECTOR`),
  );
  ref.metadata.film_year = "2000";
  expect(addFilmFacts([ref]).added).toEqual([]);
});

it("variiert plausible Jahresantworten mit stabiler Identität und korrektem Feedback in allen Stufen", () => {
  for (const q of extra.filter((q) => q.metadata.fact_kind === "year")) {
    let previous: Question | undefined;
    for (let i = 0; i < 8; i++) {
      const next = prepareFactQuestion(q, previous, () => 0.25);
      expect(next.id).toBe(q.id);
      expect(next.knowledgeId).toBe(q.knowledgeId);
      expect(next.version).toBe(q.version);
      expect(new Set(next.answers.map((a) => a.text)).size).toBe(4);
      expect(next.answers.find((a) => a.id === next.correctId)?.text).toBe(
        q.metadata.film_year,
      );
      for (const a of next.answers.filter((a) => a.id !== q.correctId)) {
        expect(yearChoices(q)).toContain(Number(a.text));
        expect(a.feedback).toContain(a.text);
        expect(a.feedback).toContain(q.metadata.film_year);
      }
      if (previous)
        expect(next.answers.map((a) => a.text).sort()).not.toEqual(
          previous.answers.map((a) => a.text).sort(),
        );
      expect(questionSnapshotMatches(q, next)).toBe(true);
      previous = next;
    }
  }
});

it("speichert Jahresvarianten in Rundensnapshots, erhält sie im Backup und zählt Folgeantworten zum selben Lernziel", () => {
  const q = extra.find(
    (q) => q.metadata.fact_kind === "year" && q.difficulty === "leicht",
  )!;
  const s = emptyState([structuredClone(q)]);
  const one = startRound(
    s,
    { mode: "entdecken", topic: q.topic, difficulty: "Alle Stufen" },
    1000,
  );
  answer(s, one.id, q.id, one.questions[0].correctId, 0, 2000);
  one.status = "completed";
  one.finishedAt = 2000;
  const saved = validateBackup(JSON.parse(JSON.stringify(s)));
  expect(saved.rounds[0].questions).toEqual(one.questions);
  const two = startRound(
    saved,
    { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
    90000000,
  );
  expect(two.questions[0].answers).not.toEqual(one.questions[0].answers);
  answer(saved, two.id, q.id, two.questions[0].correctId, 0, 90001000);
  expect(saved.learning[q.knowledgeId].seen).toBe(2);
  expect(Object.keys(saved.learning)).toEqual([q.knowledgeId]);
  expect(() => validateBackup(JSON.parse(JSON.stringify(saved)))).not.toThrow();
  for (const field of ["text", "feedback", "id"] as const) {
    const bad = structuredClone(saved);
    bad.rounds[1].questions[0].answers[1][field] = "manipuliert";
    expect(() => validateBackup(bad)).toThrow();
  }
  const bad = structuredClone(saved);
  bad.rounds[1].questions[0].correctId =
    bad.rounds[1].questions[0].answers[1].id;
  expect(() => validateBackup(bad)).toThrow();
  const wrongText = structuredClone(saved);
  wrongText.rounds[1].questions[0].question = "Andere Frage";
  expect(() => validateBackup(wrongText)).toThrow();
});

it("bewahrt historische Runden und Fortschritt beim Ergänzen eines vollständigen alten Bestands", () => {
  const s = emptyState(structuredClone(originals));
  const r = startRound(
    s,
    { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1000,
  );
  answer(s, r.id, r.questions[0].id, r.questions[0].correctId, 0, 2000);
  const historical = structuredClone({
    rounds: s.rounds,
    events: s.events,
    learning: s.learning,
  });
  addFilmFacts(s.questions);
  addFilmFacts(s.questions);
  expect({ rounds: s.rounds, events: s.events, learning: s.learning }).toEqual(
    historical,
  );
  expect(() => validateBackup(JSON.parse(JSON.stringify(s)))).not.toThrow();
});

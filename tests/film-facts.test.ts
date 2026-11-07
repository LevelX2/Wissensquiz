import { it, expect } from "vitest";
import { readFileSync } from "node:fs";

import { addPackages, packages, readQuestions } from "../src/packages";
import { emptyState, type Question } from "../src/model";
import {
  prepareFactQuestion,
  questionSnapshotMatches,
  yearChoices,
  filmData,
  directorExplanation,
} from "../src/filmFacts";
import facts from "../src/filmFacts.json";
import directorContexts from "../src/directorContexts.json";
import reviewedFacts from "../src/reviewedFilmFacts.json";

import { answer, startRound } from "../src/engine";
import { validateBackup } from "../src/backupValidation";
import { applyCategoryTags } from "../src/categoryPreparation";

const contents = packages.slice(0, 14).map((p) => ({
  filename: p.filename,
  text: readFileSync(`${p.path}`, "utf8"),
}));
const originals = contents.flatMap((p) => readQuestions(p.text));
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
    if (data.series?.position != null)
      expect(data.series.position).toBeGreaterThan(0);
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

it("zeigt alle 412 Regiehintergründe ohne allgemeine Nachsätze und erhält historische Fragen sowie konkrete Credithinweise", () => {
  const older = facts.slice(0, 325).filter((f) => !f.existingDirectorId);
  expect(older).toHaveLength(312);
  expect(Object.keys(directorContexts)).toHaveLength(312);
  const texts = older.map((f) => {
    const q = extra.find((candidate) => candidate.id === `${f.id}-DIRECTOR`)!;
    const unchanged = structuredClone(q);
    const reviewed = (reviewedFacts as Record<string, Partial<Question>>)[q.id];
    if (reviewed) {
      expect(q).toMatchObject(reviewed);
      expect(directorExplanation(q)).toBeUndefined();
      return q.context;
    }
    const background = directorExplanation(q)!;
    expect(q.context).not.toContain(background.text);
    expect(background.text.length).toBeGreaterThan(60);
    expect(background.sources.length).toBeGreaterThan(0);
    expect(filmData(q)?.directorContext).toBe(background.text);
    expect(q).toEqual(unchanged);
    return background.text;
  });
  expect(new Set(texts).size).toBe(texts.length);
  const newer = facts.slice(325);
  expect(newer).toHaveLength(100);
  for (const f of newer) {
    const q = extra.find((candidate) => candidate.id === `${f.id}-DIRECTOR`)!;
    const unchanged = structuredClone(q);
    const reviewed = (reviewedFacts as Record<string, Partial<Question>>)[q.id];
    if (reviewed) {
      expect(q).toMatchObject(reviewed);
      expect(directorExplanation(q)).toBeUndefined();
      expect(q).toEqual(unchanged);
      continue;
    }
    const background = directorExplanation(q)!;
    expect(background.text).toBe(
      [f.directorContext, f.directorNote].filter(Boolean).join(" "),
    );
    expect(background.text).not.toContain("Gefragt ist die Regie dieses Films");
    expect(background.text).not.toContain("Originaltitel:");
    expect(background.text).not.toContain("Erste Veröffentlichung:");
    expect(background.sources).toContain(f.source);
    expect(filmData(q)?.directorContext).toBe(f.directorContext);
    expect(q).toEqual(unchanged);
    expect(questionSnapshotMatches(q, unchanged)).toBe(true);
  }
  const existing = originals.find((q) => q.id === facts[8].existingDirectorId)!;
  expect(directorExplanation(existing)).toBeUndefined();
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

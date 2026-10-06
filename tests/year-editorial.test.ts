import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { prepareFactQuestion } from "../src/filmFacts";
import { yearPresentation } from "../src/yearEditorial";
import editorial from "../src/yearEditorial.json";

const state = emptyState();
addPackages(
  state,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  })),
);

it("erreicht alle 545 Bestands-Jahresfragen und lässt die 240 neuen Filmfragen sowie fünf sonstigen Jahresziele unverändert", () => {
  const texts = new Set<string>();
  const numericYears = state.questions.filter((q) =>
    q.answers.every((answer) => /^\d{4}$/.test(answer.text)),
  );
  expect(numericYears).toHaveLength(790);
  expect(Object.keys(editorial)).toHaveLength(545);
  const before = JSON.stringify(state);
  const revised = state.questions.filter((q) => yearPresentation(q));
  expect(revised).toHaveLength(545);
  expect(revised.filter((q) => q.metadata.fact_kind === "year")).toHaveLength(
    425,
  );
  expect(revised.filter((q) => !q.metadata.fact_kind)).toHaveLength(120);
  for (const q of revised) {
    const entry = yearPresentation(q)!;
    expect(entry.text, q.id).toContain(q.metadata.film_year);
    expect(entry.anchor, q.id).toContain(q.metadata.film_year);
    expect(entry.text, q.id).not.toBe(q.context);
    expect(entry.sources.length, q.id).toBeGreaterThan(0);
    expect(new Set(entry.sources).size, q.id).toBe(entry.sources.length);
    expect(
      entry.sources.every((url) => new URL(url).protocol === "https:"),
      q.id,
    ).toBe(true);
    texts.add(entry.text);
  }
  expect(texts.size).toBe(545);
  expect(JSON.stringify(state)).toBe(before);
  expect(numericYears.filter((q) => !yearPresentation(q))).toHaveLength(245);
});

it("liefert konkrete historische und wissenschaftliche Anker sowie Ergänzungen für CSV-Jahresfragen", () => {
  const forrest = state.questions.find(
    (q) =>
      q.metadata.film_title_original === "Forrest Gump" &&
      q.metadata.fact_kind === "year",
  )!;
  expect(yearPresentation(forrest)?.text).toMatch(/1994.*Nixon|Nixon.*1994/);
  expect(yearPresentation(forrest)?.sources).toContain(
    "https://www.nixonlibrary.gov/president-nixon",
  );
  const jurassic = state.questions.find((q) => q.id === "FF-139-YEAR")!;
  expect(yearPresentation(jurassic)?.text).toContain("Kary Mullis");
  expect(yearPresentation(jurassic)?.text).toContain("1993");
  const her = state.questions.find((q) => q.id === "SFI-202610-P01-S-009")!;
  expect(yearPresentation(her)?.text).toContain("2013");
  expect(yearPresentation(her)?.text).not.toContain("breitere Kinostart");
});

it("bewahrt die Vertiefung bei wechselnden Jahresantworten und respektiert eigene Änderungen", () => {
  for (const id of ["FF-001-YEAR", "SFI-202610-P01-S-009"]) {
    const q = state.questions.find((q) => q.id === id)!;
    const expected = yearPresentation(q);
    for (let seed = 0; seed < 12; seed++) {
      const prepared = prepareFactQuestion(q, undefined, () => seed / 12);
      const snapshot = structuredClone(prepared);
      expect(yearPresentation(prepared)).toEqual(expected);
      expect(prepared).toEqual(snapshot);
    }
    expect(yearPresentation({ ...q, id: "eigene-frage" })).toBeUndefined();
    expect(
      yearPresentation({ ...q, question: "Eigene Frage" }),
    ).toBeUndefined();
    expect(
      yearPresentation({ ...q, context: "Eigene Vertiefung" }),
    ).toBeUndefined();
    expect(
      yearPresentation({
        ...q,
        metadata: { ...q.metadata, film_year: "2000" },
      }),
    ).toBeUndefined();
    expect(
      yearPresentation({
        ...q,
        correctId: q.answers.find((a) => a.id !== q.correctId)!.id,
      }),
    ).toBeUndefined();
  }
});

it("hält Vorher/Nachher, Quellen und zeitliche Abstände für jede Frage nachvollziehbar", () => {
  const audit: {
    questionId: string;
    year: number;
    eventYear: number;
    interval: number;
    relatedQuestionId: string | null;
    before: { text: string };
    after: { text: string; anchor: string };
    sources: string[];
  }[] = JSON.parse(
    readFileSync("docs/Jahresanker-2026-10-04/Redaktion.json", "utf8"),
  );
  expect(audit).toHaveLength(545);
  expect(new Set(audit.map((r) => r.questionId)).size).toBe(545);
  for (const row of audit) {
    const q = state.questions.find((q) => q.id === row.questionId)!;
    const entry = yearPresentation(q)!;
    expect(row.before.text, row.questionId).toBe(q.context);
    expect(row.after, row.questionId).toEqual({
      text: entry.text,
      anchor: entry.anchor,
    });
    expect(row.sources, row.questionId).toEqual(entry.sources);
    expect(row.after.text, row.questionId).toContain(String(row.eventYear));
    expect(row.interval, row.questionId).toBe(row.year - row.eventYear);
    if (row.relatedQuestionId) {
      const related = state.questions.find(
        (q) => q.id === row.relatedQuestionId,
      )!;
      expect(related, row.questionId).toBeDefined();
      expect(Number(related.metadata.film_year), row.questionId).toBe(
        row.eventYear,
      );
    }
  }
});

import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages, packageForQuestion } from "../src/packages";
import { emptyState } from "../src/model";
import { preparePresentation } from "../src/questionPresentation";
import { filmData } from "../src/filmFacts";
import { workIdentity, matchesWorkFilters } from "../src/workAttributes";
import { sourceLinkLabel } from "../src/SourceLink";
import { questionSourceOf } from "../src/filters";

const state = emptyState();
addPackages(
  state,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(p.path, "utf8"),
  })),
);
const authored = state.questions.filter((q) => q.id.startsWith("WERK-"));

it("übernimmt redigierte Werkfragen mit vollständiger Mindestabdeckung und getrennten Attributen", () => {
  expect(authored.length).toBeGreaterThan(0);
  const works = Map.groupBy(authored, (q) => workIdentity(q.works![0]));
  for (const [key, questions] of works) {
    const work = questions[0].works![0];
    const related = state.questions.filter(
      (q) =>
        questionSourceOf(q) === "film" &&
        (q.works?.some((w) => workIdentity(w) === key) ||
          (work.type === "film" &&
            q.metadata.film_title_original === work.originalTitle &&
            q.metadata.film_year === String(work.year))),
    );
    const content = related.filter(
      (q) =>
        !q.metadata.fact_kind &&
        !q.metadata.editorial_fact_kind &&
        !/^(?:Jahr|Regie|Filmjahr)$/i.test(q.metadata.question_type ?? ""),
    );
    for (const difficulty of ["leicht", "mittel", "schwer"])
      expect(
        new Set(
          content
            .filter((q) => q.difficulty === difficulty)
            .map((q) => q.knowledgeId),
        ).size,
        key + " " + difficulty,
      ).toBeGreaterThanOrEqual(2);
    if (work.type === "film") {
      const facts = related.filter(
        (q) => q.metadata.editorial_fact_kind || q.metadata.fact_kind,
      );
      // Existing CSV facts are also recognized by their actual answers.
      expect(
        related.some(
          (q) =>
            q.answers.find((a) => a.id === q.correctId)?.text ===
            String(work.year),
        ),
        key,
      ).toBe(true);
      expect(filmData(questions[0])?.directors, key).toBeTruthy();
      if (
        questions.every(
          (q) => q.metadata.editorial_fact_kind || q.id.startsWith("WERK-"),
        ) &&
        related.length === questions.length
      )
        expect(
          new Set(
            facts.map(
              (q) => q.metadata.editorial_fact_kind ?? q.metadata.fact_kind,
            ),
          ),
          key,
        ).toEqual(new Set(["year", "director"]));
    }
    expect(work.genres).not.toContain("Animation");
    expect(work.genres).not.toContain("Serien allgemein");
    for (const q of questions) {
      expect(q.difficulty).not.toBe("experte");
      expect(q.metadata.title_research).toBeTruthy();
      expect(q.metadata.familiarity_reason).toBeTruthy();
      expect(q.sources.length).toBeGreaterThan(0);
      expect(new Set(q.answers.map((a) => a.text)).size).toBe(4);
      expect(q.context).not.toBe(q.explanation);
      expect(q.question + q.context).not.toContain("\ufffd");
      const display = preparePresentation(q);
      expect(display.questionText).toBe(q.question);
      expect(display.deepContext).toBe(q.context);
      expect(display.familiarity).toBeGreaterThan(0);
      expect(packageForQuestion(q).workType).toBe(work.type);
      if (work.type === "series") expect(display.films).toEqual([]);
      if (q.metadata.editorial_fact_kind === "year")
        expect(display.questionText).not.toContain(String(work.year));
    }
  }
});

it("führt konkrete Serienquellen mit sprechendem Serienbezug und trennt Film und Serie", () => {
  const series = authored.find(
    (q) => q.works?.[0].originalTitle === "Star Trek",
  )!;
  expect(
    sourceLinkLabel(
      "https://de.wikipedia.org/wiki/Raumschiff_Enterprise",
      series,
    ),
  ).toBe("Serie: Raumschiff Enterprise");
  expect(sourceLinkLabel("https://example.com/94", series)).toBe(
    "Quelle zu Raumschiff Enterprise",
  );
  expect(
    matchesWorkFilters(series, {
      workTypes: ["series"],
      genres: ["Science-Fiction"],
    }),
  ).toBe(true);
  expect(
    matchesWorkFilters(series, {
      workTypes: ["film"],
      genres: ["Science-Fiction"],
    }),
  ).toBe(false);
});

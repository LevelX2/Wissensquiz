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

it("deckt je mindestens 50 eigenständige Werke in vier getrennt gezählten Auswahlbereichen ab", () => {
  const groups = {
    animation: new Set<string>(),
    scifi: new Set<string>(),
    fantasy: new Set<string>(),
    other: new Set<string>(),
  };
  const counted = new Set<string>();
  for (const q of authored) {
    const work = q.works![0];
    const key = workIdentity(work);
    const group =
      work.type === "film"
        ? "animation"
        : q.metadata.subdomain === "Science-Fiction"
          ? "scifi"
          : q.metadata.subdomain === "Fantasy"
            ? "fantasy"
            : "other";
    if (group === "animation") expect(work.techniques).toContain("animation");
    else if (group === "scifi")
      expect(work.genres).toContain("Science-Fiction");
    else if (group === "fantasy") expect(work.genres).toContain("Fantasy");
    else {
      expect(work.genres).not.toContain("Science-Fiction");
      expect(work.genres).not.toContain("Fantasy");
    }
    expect(counted.has(q.id)).toBe(false);
    counted.add(q.id);
    groups[group].add(key);
  }
  for (const works of Object.values(groups))
    expect(works.size).toBeGreaterThanOrEqual(50);
  expect(
    new Set(Object.values(groups).flatMap((works) => [...works])).size,
  ).toBe(Object.values(groups).reduce((sum, works) => sum + works.size, 0));
  expect(new Set(authored.map((q) => q.knowledgeId)).size).toBe(
    authored.length,
  );
});

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

import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { packages, readQuestions } from "../src/packages";
import { filmDetails } from "../src/filmDetails";
import { preparePresentation } from "../src/questionPresentation";

const questions = readQuestions(
  readFileSync(packages.find((p) => p.source === "film")!.path, "utf8"),
);
it("liefert aktuelle Darstellerergänzungen ohne Fragen oder Lernidentitäten zu verändern", () => {
  const matched = questions.filter((q) => filmDetails(q));
  expect(matched.length).toBeGreaterThan(0);
  for (const q of matched) {
    const before = structuredClone(q),
      detail = filmDetails(q)!;
    expect(detail.text.length, q.id).toBeGreaterThan(0);
    expect(detail.sources.length, q.id).toBeGreaterThan(0);
    expect(q).toEqual(before);
  }
});
it("bindet Darstellerergänzungen an Version, Inhalt und richtige Filmfassung", () => {
  const q = questions.find((q) => filmDetails(q))!;
  for (const changed of [
    { ...q, version: "andere-version" },
    { ...q, context: q.context + " geändert" },
    { ...q, metadata: { ...q.metadata, film_year: "1895" } },
  ])
    expect(filmDetails(changed)).toBeUndefined();
});
it("unterscheidet Darsteller verschiedener Harry-Potter-Filmfassungen", () => {
  const text = (film: string) =>
    questions
      .filter((q) => q.metadata.film_title_original === film)
      .map(
        (q) =>
          q.context +
          " " +
          (filmDetails(q)?.text ?? "") +
          " " +
          preparePresentation(q).deepContext,
      )
      .join(" ");
  expect(text("Harry Potter and the Philosopher's Stone")).toContain(
    "Richard Harris",
  );
  expect(text("Harry Potter and the Prisoner of Azkaban")).toContain(
    "Michael Gambon",
  );
});

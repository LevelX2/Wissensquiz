import { expect, it } from "vitest";
import { currentCsv, currentQuestions } from "./helpers/current-content";
import { importCsv } from "../src/importer";
import { genreOf, questionSourceOf } from "../src/filters";

it("stellt Testdaten aus sämtlichen aktuellen Genredateien und Fachbereichen bereit", () => {
  const questions = currentQuestions();
  expect(questions).toHaveLength(16703);
  expect(new Set(questions.map(genreOf)).size).toBe(13);
  for (const genre of ["Science-Fiction", "Horror", "Action", "Abenteuer"]) {
    const sample = importCsv(currentCsv({ genre, limit: 12 }));
    expect(sample.questions).toHaveLength(12);
    expect(sample.report.rejected).toBe(0);
    expect(sample.questions.every((q) => genreOf(q) === genre)).toBe(true);
  }
  for (const source of ["actors", "awards"] as const)
    expect(
      currentQuestions(source).every((q) => questionSourceOf(q) === source),
    ).toBe(true);
});

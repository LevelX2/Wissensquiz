import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { importCsv } from "../src/importer";
import {
  addFilmFacts,
  prepareFactQuestion,
  questionSnapshotMatches,
} from "../src/filmFacts";
import {
  decodeQuestionCatalog,
  encodeQuestionCatalog,
} from "../src/catalogCodec";

it("entfernt exakte Metadaten-Dopplungen verlustfrei und erhält Feldreihenfolge, Originalschwierigkeit und eigene Importspalten", () => {
  const questions = importCsv(
    readFileSync("public/fragen.csv", "utf8"),
  ).questions;
  questions[0].metadata.difficulty = "Easy";
  questions[0].metadata.custom = "Eigene Quelle";
  questions[0].metadata.numericText = "5";
  const before = JSON.stringify(questions);
  const compact = encodeQuestionCatalog(questions);
  const decoded = decodeQuestionCatalog(compact);
  expect(JSON.stringify(decoded)).toBe(before);
  expect(JSON.stringify(questions)).toBe(before);
  expect(compact.length).toBeLessThan(before.length * 0.7);
  expect(decoded[0].metadata.difficulty).toBe("Easy");
  expect(questionSnapshotMatches(questions[0], decoded[0])).toBe(true);
  decoded[0].answers[0].text = "Änderung";
  expect(questions[0].answers[0].text).not.toBe("Änderung");
});

it("erhält generierte Jahresfragen und dynamische Antwortsnapshots und weist ungültige Metadatenverweise zurück", () => {
  const questions = importCsv(
    readFileSync("public/fragen.csv", "utf8"),
  ).questions;
  addFilmFacts(questions);
  const year = questions.find((q) => q.metadata.fact_kind === "year")!;
  const variant = prepareFactQuestion(year, year, () => 0.2);
  expect(decodeQuestionCatalog(encodeQuestionCatalog([variant]))).toEqual([
    variant,
  ]);
  const packed = JSON.parse(encodeQuestionCatalog(questions.slice(0, 1)));
  for (const bad of [-1, 100, 1.5, null]) {
    packed[0].metadata.question = bad;
    expect(() => decodeQuestionCatalog(JSON.stringify(packed))).toThrow(
      "Metadatenverweis",
    );
  }
});

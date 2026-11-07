import { packages, readQuestions } from "../src/packages";
import { currentCsv } from "./helpers/current-content";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { importCsv } from "../src/importer";
import { questionSchema } from "../src/questionSchema";
import { preparePresentation } from "../src/questionPresentation";
import { prepareFactQuestion, questionSnapshotMatches } from "../src/filmFacts";
import {
  decodeQuestionCatalog,
  encodeQuestionCatalog,
} from "../src/catalogCodec";

it("ignoriert die entfernte Merksatzspalte vor Metadaten und Versionshash und reserviert Codec-Slot 8", () => {
  const header =
    "question_id,question,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation_short";
  const row =
    "anchor-removal,Welche Antwort?,Erste,Zweite,Dritte,Vierte,A,Die erste Antwort stimmt.";
  const q = importCsv(`${header}\n${row}`).questions[0];
  const obsolete = importCsv(`${header},memory_anchor\n${row},Alter Merksatz`)
    .questions[0];
  expect(obsolete).toEqual(q);
  expect(obsolete).not.toHaveProperty("anchor");
  expect(obsolete.metadata).not.toHaveProperty("memory_anchor");
  expect(preparePresentation(q)).not.toHaveProperty("anchor");
  expect(
    questionSchema.parse({
      ...q,
      anchor: "Nicht mehr Teil einer Frage",
      metadata: {
        ...q.metadata,
        memory_anchor: "Nicht mehr Teil der Metadaten",
      },
    }),
  ).toEqual(q);
  const packed = JSON.parse(encodeQuestionCatalog([q]));
  expect(packed[0].metadata.answer_a).toBe(9);
  expect(packed[0].metadata.answer_d).toBe(15);
  expect(decodeQuestionCatalog(JSON.stringify(packed))).toEqual([q]);
});

it("entfernt exakte Metadaten-Dopplungen verlustfrei und erhält Feldreihenfolge, Originalschwierigkeit und eigene Importspalten", () => {
  const questions = importCsv(
    currentCsv({ genre: "Science-Fiction" }),
  ).questions;
  questions[0].metadata.difficulty = "Easy";
  questions[0].metadata.custom = "Eigene Quelle";
  questions[0].metadata.numericText = "5";
  const before = JSON.stringify(questions);
  const compact = encodeQuestionCatalog(questions);
  const decoded = decodeQuestionCatalog(compact);
  expect(JSON.stringify(decoded)).toBe(before);
  expect(JSON.stringify(questions)).toBe(before);
  // Editorial text changes the share of repeated metadata in this corpus.
  // Assert actual deduplication instead of a corpus-dependent size ratio.
  const packed = JSON.parse(compact);
  expect(packed[0].metadata.question).toBe(5);
  expect(packed[0].metadata.explanation_context).toBe(7);
  expect(compact.length).toBeLessThan(before.length);
  expect(decoded[0].metadata.difficulty).toBe("Easy");
  expect(questionSnapshotMatches(questions[0], decoded[0])).toBe(true);
  decoded[0].answers[0].text = "Änderung";
  expect(questions[0].answers[0].text).not.toBe("Änderung");
});

it("erhält generierte Jahresfragen und dynamische Antwortsnapshots und weist ungültige Metadatenverweise zurück", () => {
  const questions = importCsv(
    currentCsv({ genre: "Science-Fiction" }),
  ).questions;
  questions.push(
    ...readQuestions(readFileSync(packages[0].path, "utf8"))
      .filter((q) => q.metadata.fact_kind === "year")
      .slice(0, 1),
  );
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

import { expect, it } from "vitest";
import { additionalAnswerFeedback } from "../src/answerFeedback";
import type { Question } from "../src/model";
import { importCsv } from "../src/importer";
import { readFileSync } from "node:fs";

const q = {
  explanation: "Die breiten Kriegsmaschinen erinnern an Mantarochen.",
} as Question;
it("entfernt die im Screenshot doppelt angezeigte Erklärung", () => {
  expect(
    additionalAnswerFeedback(
      q,
      `„Krabben“ trifft hier nicht zu. ${q.explanation}`,
    ),
  ).toBe("");
  expect(additionalAnswerFeedback(q, q.explanation)).toBe("");
});
it("erhält einen zusätzlichen Hinweis zur Verwechslung", () => {
  const hint = "Krabben haben seitliche Beine und einen gegliederten Panzer.";
  expect(
    additionalAnswerFeedback(
      q,
      `„Krabben“ trifft hier nicht zu. ${hint} ${q.explanation}`,
    ),
  ).toBe(hint);
  expect(additionalAnswerFeedback(q, hint)).toBe(hint);
});

it("unterdrückt beide verbreiteten Verneinungsschablonen", () => {
  for (const denial of ["trifft hier nicht zu", "ist hier nicht richtig"])
    expect(additionalAnswerFeedback(q, `„Krabben“ ${denial}.`)).toBe("");
  expect(additionalAnswerFeedback(q)).toBe("");
});

it("zeigt bei der echten Tron-Frage keinen leeren Hinweis zu Helm, Brille oder Uhr", () => {
  const questions = importCsv(
    readFileSync("public/scifi-ergaenzung-fragen.csv", "utf8"),
    [],
    "Test",
  ).questions;
  const tron = questions.find((entry) => entry.id === "SF-202609-P02-S-064")!;
  expect(tron).toBeDefined();
  for (const answer of tron.answers.filter((a) => a.id !== tron.correctId))
    expect(additionalAnswerFeedback(tron, answer.feedback), answer.text).toBe(
      "",
    );
});

it("entfernt reine Lösungswiederholungen auch bei generierten Fragen", () => {
  const year = {
    ...q,
    correctId: "a",
    answers: [
      { id: "a", text: "2010", feedback: "" },
      { id: "b", text: "1982", feedback: "" },
    ],
  } as Question;
  expect(
    additionalAnswerFeedback(
      year,
      "1982 ist hier nicht gesucht. Die erste Veröffentlichung war 2010.",
    ),
  ).toBe("");
  const director = {
    ...year,
    answers: [
      { id: "a", text: "Joseph Kosinski", feedback: "" },
      { id: "b", text: "George P. Cosmatos", feedback: "" },
    ],
  } as Question;
  expect(
    additionalAnswerFeedback(
      director,
      "Hier ist Joseph Kosinski die gesuchte Regienennung.",
    ),
  ).toBe("");
  expect(
    additionalAnswerFeedback(
      director,
      "George P. Cosmatos führte bei diesem Film nicht Regie. Er inszenierte Rambo II.",
    ),
  ).toBe("Er inszenierte Rambo II.");
});

it("erhält konkrete Einordnungen einschließlich sinnvoller Verneinungen", () => {
  for (const hint of [
    "Georgie ist ein Kind und Bills jüngerer Bruder, nicht sein Onkel.",
    "O’Hara gehört zu Der Mann mit der Todeskralle.",
    "Cukor wurde erwogen, inszenierte aber nicht den fertigen Film.",
    "1982 erschien der erste Tron; Tron: Legacy folgte 2010.",
    "„Krabben“ ist hier nicht richtig, weil ihre seitlichen Beine nicht zur gezeigten Form passen.",
  ])
    expect(additionalAnswerFeedback(q, hint)).toBe(hint);
});

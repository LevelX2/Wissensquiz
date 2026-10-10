import { expect, it } from "vitest";
import { additionalAnswerFeedback } from "../src/answerFeedback";
import type { Question } from "../src/model";

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

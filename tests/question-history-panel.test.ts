import { expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuestionHistory } from "../src/QuestionHistoryPanel";
import type { AnswerEvent, Question } from "../src/model";

const question = { id: "q", knowledgeId: "goal" } as Question;
const event = {
  id: "now",
  questionId: "q",
  knowledgeId: "goal",
  answerId: "a",
  correct: true,
} as AnswerEvent;
const render = (events: AnswerEvent[], currentEventId?: string) =>
  renderToStaticMarkup(
    createElement(QuestionHistory, { question, events, currentEventId }),
  );
it("kennzeichnet eine noch unbeantwortete Frage dezent als neu", () => {
  expect(render([])).toContain('class="question-new"');
});
it("behält Neu bei der ersten gespeicherten Antwort und zählt sie mit", () => {
  const html = render([event], "now");
  expect(html).toContain('class="question-new"');
  expect(html).toContain("Diese Frage: 1× beantwortet");
});
it("kennzeichnet bekannte Fragen auch nach falschen Antworten nicht als neu", () => {
  expect(
    render([{ ...event, id: "earlier", correct: false }, event], "now"),
  ).not.toContain('class="question-new"');
});

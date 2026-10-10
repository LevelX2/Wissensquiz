import { expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuestionHistory } from "../src/QuestionHistoryPanel";
import { QuestionStatus } from "../src/QuestionStatus";
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
    createElement(QuestionStatus, { question, events, currentEventId }),
  );
it("kennzeichnet eine noch unbeantwortete Frage dezent als neu", () => {
  expect(render([])).toContain(">Neu</span>");
});
it("behält Neu bei der ersten gespeicherten Antwort und zählt sie mit", () => {
  const html = render([event], "now");
  expect(html).toContain(">Neu</span>");
  expect(
    renderToStaticMarkup(
      createElement(QuestionHistory, { question, events: [event] }),
    ),
  ).toContain("Diese Frage: 1× beantwortet");
});
it("kennzeichnet bekannte Fragen auch nach falschen Antworten nicht als neu", () => {
  expect(
    render([{ ...event, id: "earlier", correct: false }, event], "now"),
  ).toContain("Wiederholung · 1×");
});
it("zählt Zeitablauf als frühere Begegnung und andere Fragevarianten getrennt", () => {
  expect(
    render(
      [
        { ...event, id: "timeout", answerId: null, correct: false },
        { ...event, id: "variant", questionId: "other" },
        event,
      ],
      "now",
    ),
  ).toContain("Wiederholung · 1×");
  expect(render([{ ...event, questionId: "other" }])).toContain(">Neu</span>");
});

import type { AnswerEvent, Question } from "./model";

function countAnswers(events: AnswerEvent[]) {
  const answered = events.filter((event) => event.answerId !== null);
  const correct = answered.filter((event) => event.correct).length;
  return {
    answered: answered.length,
    correct,
    wrong: answered.length - correct,
    unanswered: events.length - answered.length,
    guessedCorrect: answered.filter((event) => event.correct && event.guessed)
      .length,
  };
}

export function questionHistory(events: AnswerEvent[], question: Question) {
  return {
    question: countAnswers(
      events.filter((event) => event.questionId === question.id),
    ),
    goal: countAnswers(
      events.filter((event) => event.knowledgeId === question.knowledgeId),
    ),
  };
}

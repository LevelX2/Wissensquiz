import type { AnswerEvent, Question } from "./model";
import { questionHistory } from "./questionHistory";

export function QuestionHistory({
  events,
  question,
  currentEventId,
}: {
  events: AnswerEvent[];
  question: Question;
  currentEventId?: string;
}) {
  const stats = questionHistory(events, question);
  const isNew = !events.some(
    (event) => event.questionId === question.id && event.id !== currentEventId,
  );
  return (
    <details className="question-history">
      <summary>
        {isNew && (
          <span
            className="question-new"
            title="Noch keine frühere Antwort auf diese Frage"
          >
            Neu
          </span>
        )}
        <span>Diese Frage: {stats.question.answered}× beantwortet</span>{" "}
        <span>
          {stats.question.correct} richtig · {stats.question.wrong} falsch
        </span>
      </summary>
      <div>
        <p>
          Für diese Formulierung, über alle Spielmodi. Deine aktuelle Antwort
          zählt nach dem Speichern mit. Nur angezeigte Fragen zählen nicht.
        </p>
        <p>
          Ohne Antwort (Zeit abgelaufen): {stats.question.unanswered}. Von den
          richtigen Antworten als geraten markiert:{" "}
          {stats.question.guessedCorrect}.
        </p>
        <p className="goal-history">
          <strong>Mit Wiederholungsvarianten:</strong> {stats.goal.answered}×
          beantwortet · {stats.goal.correct} richtig · {stats.goal.wrong} falsch
          · {stats.goal.unanswered} ohne Antwort. Als geraten markierte richtige
          Antworten: {stats.goal.guessedCorrect}.
        </p>
        <p>
          Die Varianten teilen dasselbe Wissensziel und denselben
          Lernfortschritt. Geratene Treffer zählen hier als richtig, helfen aber
          nicht beim Festigen.
        </p>
      </div>
    </details>
  );
}

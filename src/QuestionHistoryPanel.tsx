import type { AnswerEvent, Question } from "./model";
import { questionHistory } from "./questionHistory";
import { DisclosureArtwork } from "./DisclosureArtwork";

export function QuestionHistory({
  events,
  question,
}: {
  events: AnswerEvent[];
  question: Question;
}) {
  const stats = questionHistory(events, question);
  return (
    <details className="question-history">
      <summary className="illustrated-summary">
        <DisclosureArtwork subject="history" />
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

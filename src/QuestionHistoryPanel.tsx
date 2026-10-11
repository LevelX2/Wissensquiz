import { useServer, useServerView } from "./serverViews";
import type { AnswerEvent, Question } from "./model";
import { questionHistory } from "./questionHistory";
import { DisclosureArtwork } from "./DisclosureArtwork";

export function QuestionHistory({
  events,
  question,
  currentEventId,
}: {
  events: AnswerEvent[];
  question: Question;
  currentEventId?: string;
}) {
  const server = useServer();
  const history = useServerView<ReturnType<typeof questionHistory>>(
    server
      ? {
          action: "question-history",
          scope: question.id,
          topic: question.knowledgeId,
          cursor: `${currentEventId ?? ""}:${events.find((e) => e.id === currentEventId)?.guessed ?? false}`,
        }
      : null,
  );
  const stats = server ? history.value : questionHistory(events, question);
  if (!stats)
    return (
      <p role={history.error ? "alert" : "status"}>
        {history.error ? (
          <>
            Deine Fragenstatistik konnte nicht geladen werden.{" "}
            <button className="text-button" onClick={history.retry}>
              Erneut versuchen
            </button>
          </>
        ) : (
          "Deine Fragenstatistik wird geladen …"
        )}
      </p>
    );
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

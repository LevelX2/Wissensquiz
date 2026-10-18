import { useServer, useServerView } from "./serverViews";
import type { AnswerEvent, Question } from "./model";
import { questionHistory } from "./questionHistory";
import { DisclosureArtwork } from "./DisclosureArtwork";

export function QuestionHistory({
  events,
  question,
  currentEventId,
  embedded = false,
}: {
  events: AnswerEvent[];
  question: Question;
  currentEventId?: string;
  embedded?: boolean;
}) {
  const server = useServer();
  const history = useServerView(
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
  const counts = (
    <>
      <span>Diese Frage: {stats.question.answered}× beantwortet</span>{" "}
      <span>
        {stats.question.correct} richtig · {stats.question.wrong} falsch
      </span>
    </>
  );
  const content = (
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
        beantwortet · {stats.goal.correct} richtig · {stats.goal.wrong} falsch ·{" "}
        {stats.goal.unanswered} ohne Antwort. Als geraten markierte richtige
        Antworten: {stats.goal.guessedCorrect}.
      </p>
      <p>
        Die Varianten teilen denselben Filmfakt und denselben Lernfortschritt.
        Geratene Treffer zählen hier als richtig, helfen aber nicht beim
        Festigen.
      </p>
    </div>
  );
  if (embedded)
    return (
      <div className="question-history embedded-history">
        <p className="history-counts">{counts}</p>
        <p className="goal-history">
          Mit Varianten: {stats.goal.answered}× beantwortet ·{" "}
          {stats.goal.correct} richtig · {stats.goal.wrong} falsch.
        </p>
        <p>
          Zeit abgelaufen: {stats.question.unanswered}× (mit Varianten:{" "}
          {stats.goal.unanswered}×). Geratene Treffer:{" "}
          {stats.question.guessedCorrect} (mit Varianten:{" "}
          {stats.goal.guessedCorrect}). Geratene Treffer zählen als richtig,
          erhöhen aber die Lernstufe nicht.
        </p>
      </div>
    );
  return (
    <details className="question-history">
      <summary className="illustrated-summary">
        <DisclosureArtwork subject="history" />
        {counts}
      </summary>
      {content}
    </details>
  );
}

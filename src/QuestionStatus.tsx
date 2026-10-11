import { useServer, useServerView } from "./serverViews";
import type { questionHistory } from "./questionHistory";
import type { AnswerEvent, Question } from "./model";

export function QuestionStatus({
  events,
  question,
  currentEventId,
}: {
  events: AnswerEvent[];
  question: Question;
  currentEventId?: string;
}) {
  const server = useServer();
  const history = useServerView<
    ReturnType<typeof questionHistory> & { question: { seen: number } }
  >(
    server
      ? {
          action: "question-history",
          scope: question.id,
          topic: question.knowledgeId,
          cursor: `${currentEventId ?? ""}:${events.find((e) => e.id === currentEventId)?.guessed ?? false}`,
        }
      : null,
  );
  const previous = server
    ? Math.max(
        0,
        (history.value?.question.seen ?? 0) - (currentEventId ? 1 : 0),
      )
    : events.filter(
        (event) =>
          event.questionId === question.id && event.id !== currentEventId,
      ).length;
  return (
    <span
      className={`pill question-status ${previous === 0 ? "is-new" : "is-repeat"}`}
      title={
        previous === 0
          ? "Noch keine frühere Antwort auf diese Frage"
          : `${previous} frühere ${previous === 1 ? "Antwort" : "Antworten"} auf diese Frage, einschließlich Zeitablauf`
      }
    >
      {server && !history.value
        ? "…"
        : previous === 0
          ? "Neu"
          : `Wiederholung · ${previous}×`}
    </span>
  );
}

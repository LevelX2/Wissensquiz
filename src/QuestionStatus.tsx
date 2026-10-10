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
  const previous = events.filter(
    (event) => event.questionId === question.id && event.id !== currentEventId,
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
      {previous === 0 ? "Neu" : `Wiederholung · ${previous}×`}
    </span>
  );
}

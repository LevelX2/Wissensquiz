import type { AnswerEvent } from "./model";
import {
  learningAnswerNote,
  learningAtAnswer,
  learningDueText,
  nextLearningAt,
} from "./learningProgress";

export function LearningProgress({
  events,
  event,
  now,
}: {
  events: AnswerEvent[];
  event: AnswerEvent;
  now: number;
}) {
  const { previous, current, resolvedMistake } = learningAtAnswer(
    events,
    event,
  );
  return (
    <div
      className="learning-progress"
      aria-label="Lernfortschritt dieses Wissensziels"
    >
      <strong>
        {current.status === "gefestigt" ? "Gefestigt · " : ""}Lernstufe{" "}
        {current.stage} von 4
      </strong>
      <div className="learning-stage-track" aria-hidden="true">
        {[1, 2, 3, 4].map((stage) => (
          <span key={stage} className={stage <= current.stage ? "earned" : ""}>
            {stage}
          </span>
        ))}
      </div>
      <p>{learningAnswerNote(previous, current, event)}</p>
      {resolvedMistake && (
        <p className="learning-error-resolved">
          Fehler korrigiert · aus dem Fehlertraining entfernt.
        </p>
      )}
      <p className="learning-next">
        {current.status === "gefestigt"
          ? "Nächste Wiederholung"
          : "Nächste Lernstufe"}
        : {learningDueText(nextLearningAt(current, now), now)}
      </p>
    </div>
  );
}

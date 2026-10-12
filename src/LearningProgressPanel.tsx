import type { AnswerEvent } from "./model";
import type { ReactNode } from "react";
import { DisclosureArtwork } from "./DisclosureArtwork";
import {
  learningAnswerNote,
  learningAtAnswer,
  learningDueText,
  nextLearningAt,
  type LearningEvidence,
} from "./learningProgress";

export function LearningProgress({
  events,
  event,
  now,
  evidence,
  history,
}: {
  events: AnswerEvent[];
  event: AnswerEvent;
  now: number;
  evidence?: LearningEvidence;
  history?: ReactNode;
}) {
  const { previous, current, resolvedMistake } =
    evidence ?? learningAtAnswer(events, event);
  return (
    <details
      key={event.id}
      className="learning-progress"
      aria-label="Lernfortschritt dieses Filmfakts"
    >
      <summary className="illustrated-summary">
        <DisclosureArtwork subject="learning" />
        Lernfortschritt · {current.status === "gefestigt" ? "Gefestigt · " : ""}
        Lernstufe {current.stage} von 4
      </summary>
      {history}
      <div className="learning-stage-track" aria-hidden="true">
        {[1, 2, 3, 4].map((stage) => (
          <span key={stage} className={stage <= current.stage ? "earned" : ""}>
            {stage}
          </span>
        ))}
      </div>
      <p>{learningAnswerNote(previous ?? undefined, current, event)}</p>
      {resolvedMistake && (
        <p className="learning-error-resolved">Fehler sicher korrigiert.</p>
      )}
      <p className="learning-next">
        {current.status === "gefestigt"
          ? "Nächste Wiederholung"
          : "Nächste Lernstufe"}
        : {learningDueText(nextLearningAt(current, now), now)}
      </p>
    </details>
  );
}

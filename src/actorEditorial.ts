import type { Question } from "./model";
import editorial from "./actorEditorial.json" with { type: "json" };
import supplements from "./actorSupplementEditorial.json" with { type: "json" };

type Entry = {
  personId: string;
  originalQuestion: string;
  originalContext: string;
  question: string;
  text: string;
  films: string[];
  sources: string[];
};
const entries: Record<string, Entry> = {
  ...editorial.questions,
  ...supplements.questions,
};
// Presentation only: imported content, question versions, scoring and historical
// snapshots remain unchanged. Custom questions with reused IDs are not rewritten.
export function actorPresentation(q: Question) {
  const entry = entries[q.id];
  if (
    !entry ||
    q.metadata.person_id !== entry.personId ||
    q.question !== entry.originalQuestion ||
    q.context !== entry.originalContext
  )
    return undefined;
  return entry;
}
export const presentedQuestion = (q: Question) =>
  actorPresentation(q)?.question ?? q.question;

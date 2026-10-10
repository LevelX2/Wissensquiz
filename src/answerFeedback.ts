import type { Question } from "./model";

export function additionalAnswerFeedback(q: Question, feedback = "") {
  const extra = feedback
    .replace(q.explanation.trim(), "")
    .replace(/^„[^“]*“ trifft hier nicht zu[.!]?\s*/u, "")
    .trim();
  return /[\p{L}\p{N}]/u.test(extra) ? extra : "";
}

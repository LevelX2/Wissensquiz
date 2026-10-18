// Operator/import preparation. The running game only needs the compact,
// identity-checked references and already assigned category tags.
import classics from "../KI-Wissen-Wissensquiz/01 Rohquellen/Classics_Zuordnungen_Bestand.json" with { type: "json" };
import arthouse from "../KI-Wissen-Wissensquiz/01 Rohquellen/Arthouse_Zuordnungen_Bestand.json" with { type: "json" };
import type { Question } from "./model";
import {
  CLASSICS,
  ARTHOUSE,
  categories,
  matchesCategoryReference,
  type Category,
} from "./categories";
const additions = {
  [CLASSICS]: classics,
  [ARTHOUSE]: arthouse,
  Preisträger: { entries: [] as typeof classics.entries },
  Schauspieler: { entries: [] as typeof classics.entries },
};
export function applyCategoryTags(questions: Question[], category?: Category) {
  const byId = new Map(questions.map((q, index) => [q.id, index]));
  const applied: string[] = [],
    missing: string[] = [],
    mismatched: string[] = [];
  for (const c of category ? [category] : categories) {
    for (const ref of additions[c].entries) {
      const index = byId.get(ref.question_id);
      if (index === undefined) {
        missing.push(ref.question_id);
        continue;
      }
      const q = questions[index];
      if (!matchesCategoryReference(q, c)) {
        mismatched.push(q.id);
        continue;
      }
      questions[index] = {
        ...q,
        tags: [...new Set([...q.tags, c])],
        badgeTags: [...new Set([...q.badgeTags, c])],
      };
      applied.push(q.id);
    }
  }
  return {
    applied: [...new Set(applied)],
    missing: [...new Set(missing)],
    mismatched: [...new Set(mismatched)],
  };
}

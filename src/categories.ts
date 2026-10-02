import classics from "../KI-Wissen-Wissensquiz/01 Rohquellen/Classics_Zuordnungen_Bestand.json" with { type: "json" };
import arthouse from "../KI-Wissen-Wissensquiz/01 Rohquellen/Arthouse_Zuordnungen_Bestand.json" with { type: "json" };
import type { Question } from "./model";
import { normalizeGenre } from "./filters";

export const CLASSICS = "Classics";
export const ARTHOUSE = "Arthouse";
export const AWARD_WINNERS = "Preisträger";
export const categories = [CLASSICS, ARTHOUSE, AWARD_WINNERS] as const;
export type Category = (typeof categories)[number];
const additions = {
  [CLASSICS]: classics,
  [ARTHOUSE]: arthouse,
  [AWARD_WINNERS]: { entries: [] as typeof classics.entries },
};
const references = new Map(
  categories.map((category) => [
    category,
    new Map(
      additions[category].entries.map((entry) => [entry.question_id, entry]),
    ),
  ]),
);
export function matchesCategoryReference(
  q: Question,
  category: Category = CLASSICS,
) {
  const ref = references.get(category)?.get(q.id);
  return (
    !!ref &&
    q.knowledgeId === ref.knowledge_id &&
    (q.metadata.variant_of || "") === ref.variant_of &&
    q.metadata.film_title_original === ref.film_title_original &&
    q.metadata.film_year === ref.film_year &&
    normalizeGenre(q.metadata.subdomain) === normalizeGenre(ref.subdomain)
  );
}
// Only identity-checked tag additions may differ from historical snapshots.
// Text, source metadata, versions and learning IDs stay intact.
export function withCategoryTags(q: Question): Question {
  const matched = categories.filter((c) => matchesCategoryReference(q, c));
  if (!matched.length) return q;
  return {
    ...q,
    tags: [...new Set([...q.tags, ...matched])],
    badgeTags: [...new Set([...q.badgeTags, ...matched])],
  };
}
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
export const isCategory = (q: Question, category: Category) =>
  withCategoryTags(q).tags.includes(category);
export const isClassic = (q: Question) => isCategory(q, CLASSICS);
export const matchesCategories = (q: Question, selected: readonly Category[]) =>
  !selected.length || selected.some((c) => isCategory(q, c));
export const categoryTopic = (
  topic: string,
  selected: readonly Category[] | boolean,
) => {
  const list =
    typeof selected === "boolean" ? (selected ? [CLASSICS] : []) : selected;
  const prefix = categories.filter((c) => list.includes(c)).join(" + ");
  return prefix
    ? topic === "Alle Themen"
      ? prefix
      : `${prefix}: ${topic}`
    : topic;
};
export function matchesTopic(q: Question, topic: string) {
  const [prefix, ...rest] = topic.split(": ");
  const selected = prefix.split(" + ");
  if (
    selected.length &&
    selected.every((c) => categories.includes(c as Category))
  )
    return (
      matchesCategories(q, selected as Category[]) &&
      (!rest.length || q.topic === rest.join(": "))
    );
  return topic === "Alle Themen" || q.topic === topic;
}

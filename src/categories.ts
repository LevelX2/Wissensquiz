import additions from "../KI-Wissen-Wissensquiz/01 Rohquellen/Classics_Zuordnungen_Bestand.json" with { type: "json" };
import type { Question } from "./model";

export const CLASSICS = "Classics";
const references = new Map(
  additions.entries.map((entry) => [entry.question_id, entry]),
);
export function matchesCategoryReference(q: Question) {
  const ref = references.get(q.id);
  return (
    !!ref &&
    q.knowledgeId === ref.knowledge_id &&
    (q.metadata.variant_of || "") === ref.variant_of &&
    q.metadata.film_title_original === ref.film_title_original &&
    q.metadata.film_year === ref.film_year &&
    q.metadata.subdomain === ref.subdomain
  );
}
// Only the curated, identity-checked tag additions are allowed to differ from
// historical snapshots. Text, source metadata, versions and learning IDs stay intact.
export function withCategoryTags(q: Question): Question {
  if (!matchesCategoryReference(q)) return q;
  return {
    ...q,
    tags: [...new Set([...q.tags, CLASSICS])],
    badgeTags: [...new Set([...q.badgeTags, CLASSICS])],
  };
}
export function applyCategoryTags(questions: Question[]) {
  const byId = new Map(questions.map((q, index) => [q.id, index]));
  const applied: string[] = [],
    missing: string[] = [],
    mismatched: string[] = [];
  for (const ref of additions.entries) {
    const index = byId.get(ref.question_id);
    if (index === undefined) {
      missing.push(ref.question_id);
      continue;
    }
    const q = questions[index];
    if (!matchesCategoryReference(q)) {
      mismatched.push(q.id);
      continue;
    }
    questions[index] = withCategoryTags(q);
    applied.push(q.id);
  }
  return { applied, missing, mismatched };
}
export const isClassic = (q: Question) =>
  withCategoryTags(q).tags.includes(CLASSICS);
export const categoryTopic = (topic: string, classics: boolean) =>
  classics
    ? topic === "Alle Themen"
      ? CLASSICS
      : `${CLASSICS}: ${topic}`
    : topic;
export function matchesTopic(q: Question, topic: string) {
  if (topic === CLASSICS) return isClassic(q);
  if (topic.startsWith(`${CLASSICS}: `))
    return isClassic(q) && q.topic === topic.slice(CLASSICS.length + 2);
  return topic === "Alle Themen" || q.topic === topic;
}

import runtime from "./runtimeMetadata.json" with { type: "json" };
import type { Question, QuestionSource } from "./model";
import { normalizeGenre, questionSourceOf, sourceLabels } from "./filters";

export const CLASSICS = "Classics";
export const ARTHOUSE = "Arthouse";
export const AWARD_WINNERS = "Preisträger";
export const ACTORS = "Schauspieler";
export const categories = [CLASSICS, ARTHOUSE, AWARD_WINNERS, ACTORS] as const;
export type Category = (typeof categories)[number];
export const filmCategories = [CLASSICS, ARTHOUSE] as const;
export function selectionTopic(
  selected: readonly Category[],
  sources: readonly QuestionSource[],
) {
  return (
    [
      ...(sources.includes("film")
        ? [
            sourceLabels.film,
            ...filmCategories.filter((c) => selected.includes(c)),
          ]
        : []),
      ...(["awards", "actors"] as const)
        .filter((s) => sources.includes(s))
        .map((s) => sourceLabels[s]),
    ].join(" + ") || "Alle Themen"
  );
}
const references = new Map(
  categories.map((category) => [
    category,
    new Map(
      (category === CLASSICS || category === ARTHOUSE
        ? runtime.categories[category]
        : []
      ).map(
        ([
          question_id,
          knowledge_id,
          variant_of,
          film_title_original,
          film_year,
          subdomain,
        ]) => [
          question_id,
          {
            knowledge_id,
            variant_of,
            film_title_original,
            film_year,
            subdomain,
          },
        ],
      ),
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
    selected[0] === sourceLabels.film &&
    selected.every(
      (c) => c === sourceLabels.film || categories.includes(c as Category),
    )
  ) {
    const source = questionSourceOf(q);
    const curated = filmCategories.filter((c) => selected.includes(c));
    return (
      (source === "film"
        ? matchesCategories(q, curated)
        : selected.includes(sourceLabels[source])) &&
      (!rest.length || q.topic === rest.join(": "))
    );
  }
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

import { categories, matchesCategories, matchesTopic } from "./categories";
import { genreOf, questionSourceOf, sourceLabels } from "./filters";
import type { Question } from "./model";

export function catalogIndex(questions: Question[]) {
  const topics = new Map<string, Question[]>();
  const genres = new Map<string, Question[]>();
  const curated = new Map<string, Question[]>(categories.map((c) => [c, []]));
  const add = (map: Map<string, Question[]>, key: string, q: Question) => {
    const group = map.get(key);
    if (group) group.push(q);
    else map.set(key, [q]);
  };
  for (const q of questions) {
    add(topics, q.topic, q);
    if (questionSourceOf(q) === "film") add(genres, genreOf(q), q);
    for (const c of categories)
      if (matchesCategories(q, [c])) curated.get(c)!.push(q);
  }
  return {
    topics: [...topics.keys()].sort(),
    genres,
    curated,
    forTopic(topic: string) {
      // Preserve composite/category selectors and imported names that collide
      // with them. Ordinary film/person names use the direct catalog index.
      const prefix = topic.split(": ")[0].split(" + ");
      return topic === "Alle Themen" ||
        prefix.every((c) =>
          categories.includes(c as (typeof categories)[number]),
        ) ||
        (prefix[0] === sourceLabels.film &&
          prefix.every(
            (c) =>
              c === sourceLabels.film ||
              categories.includes(c as (typeof categories)[number]),
          ))
        ? questions.filter((q) => matchesTopic(q, topic))
        : (topics.get(topic) ?? []);
    },
  };
}

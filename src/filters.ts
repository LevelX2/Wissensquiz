import type { Question, QuestionSource, QuizFilters, Round } from "./model";
import { familiarityOf, familiarities, workFamiliarityOf } from "./familiarity";
import {
  matchesWorkFilters,
  workReferencesOf,
  techniques,
  workTypes,
  workCollections,
} from "./workAttributes";

export const difficulties = ["leicht", "mittel", "schwer", "experte"] as const;
export const questionSources = ["film", "awards", "actors"] as const;
export const sourceLabels: Record<QuestionSource, string> = {
  film: "Filmfragen",
  awards: "Preisträger",
  actors: "Schauspieler",
};
export const questionSourceOf = (
  q: Pick<Question, "metadata" | "tags">,
): QuestionSource =>
  q.metadata.person_id
    ? "actors"
    : q.tags.includes("Preisträger")
      ? "awards"
      : "film";
export const usesFilmFilters = (q: Question, filters: QuizFilters) =>
  filters.sources ? questionSourceOf(q) === "film" : !q.metadata.person_id;
export const normalizeGenre = (genre: string) =>
  genre === "Sci-Fi"
    ? "Science-Fiction"
    : genre === "RomCom"
      ? "Rom-Com"
      : genre;
export const genreOf = (q: Pick<Question, "metadata" | "domain">) =>
  q.metadata.subdomain?.trim() || q.domain;
export const genreLabel = (genre: string): string =>
  genre.startsWith("Serien · ")
    ? "Serien · " + genreLabel(genre.slice(9))
    : genre === "Science-Fiction"
      ? "Sci-Fi"
      : genre;
export const difficultyLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
export const canonicalFilters = (filters: QuizFilters): QuizFilters => ({
  ...(filters.collections
    ? {
        collections: workCollections.filter((item) =>
          filters.collections!.includes(item),
        ),
      }
    : {}),
  genres: filters.genres === null ? null : [...new Set(filters.genres)].sort(),
  ...(filters.workTypes
    ? {
        workTypes: workTypes.filter((type) =>
          filters.workTypes!.includes(type),
        ),
      }
    : {}),
  ...(filters.techniques
    ? {
        techniques: techniques.filter((item) =>
          filters.techniques!.includes(item),
        ),
      }
    : {}),
  difficulties: [...new Set(filters.difficulties)].sort(),
  ...(filters.familiarities
    ? { familiarities: [...new Set(filters.familiarities)].sort() }
    : {}),
  ...(filters.sources
    ? { sources: questionSources.filter((s) => filters.sources!.includes(s)) }
    : {}),
});
export const matchesFilters = (q: Question, filters: QuizFilters) => {
  if (!filters.difficulties.includes(q.difficulty)) return false;
  if (filters.sources) {
    const source = questionSourceOf(q);
    if (!filters.sources.includes(source)) return false;
  }
  if (!matchesWorkFilters(q, filters)) return false;
  if (!filters.familiarities) return true;
  const accepted = (fame: ReturnType<typeof familiarityOf>) =>
    fame
      ? filters.familiarities!.includes(fame)
      : familiarities.every((f) => filters.familiarities!.includes(f));
  const works = workReferencesOf(q);
  return questionSourceOf(q) === "film" && works.length
    ? works.some(
        (work) =>
          matchesWorkFilters({ ...q, works: [work] }, filters) &&
          accepted(workFamiliarityOf(work)),
      )
    : accepted(familiarityOf(q));
};
export function familiarityForFilters(q: Question, filters?: QuizFilters) {
  const works = workReferencesOf(q);
  if (questionSourceOf(q) !== "film" || !works.length) return familiarityOf(q);
  const work = works.find((work) => {
    if (filters && !matchesWorkFilters({ ...q, works: [work] }, filters))
      return false;
    const fame = workFamiliarityOf(work);
    return (
      !filters?.familiarities ||
      (fame
        ? filters.familiarities.includes(fame)
        : familiarities.every((f) => filters.familiarities!.includes(f)))
    );
  });
  return work && workFamiliarityOf(work);
}
export const roundGenres = (r: Round) =>
  [
    r.filters?.workTypes
      ? r.filters.workTypes
          .map((type) => (type === "film" ? "Filme" : "Serien"))
          .join(" + ") || "Keine Werkart"
      : "Filme und Serien",
    r.filters
      ? (r.filters.genres?.map(genreLabel).join(" + ") ?? "Alle Genres")
      : null,
    r.filters?.techniques
      ?.map((t) => (t === "animation" ? "Animation" : "Realfilm"))
      .join(" + "),
    r.filters?.collections?.join(" + "),
    r.topic === "Alle Themen"
      ? null
      : r.topic.replace("Filmfragen", "Werkfragen"),
  ]
    .filter(Boolean)
    .join(" · ");
export const roundDifficulties = (r: Round) =>
  r.filters
    ? difficulties
        .filter((d) => r.filters!.difficulties.includes(d))
        .map(difficultyLabel)
        .join(" + ")
    : r.difficulty;

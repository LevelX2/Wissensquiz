import type { Question, QuestionSource, QuizFilters, Round } from "./model";
import { familiarityOf, familiarities } from "./familiarity";

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
export const genreLabel = (genre: string) =>
  genre === "Science-Fiction" ? "Sci-Fi" : genre;
export const difficultyLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
export const canonicalFilters = (filters: QuizFilters): QuizFilters => ({
  genres:
    filters.sources && !filters.sources.includes("film")
      ? []
      : [...new Set(filters.genres)].sort(),
  difficulties: [...new Set(filters.difficulties)].sort(),
  ...(filters.familiarities &&
  (!filters.sources || filters.sources.includes("film"))
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
    if (source !== "film") return true;
  }
  return (
    filters.genres.includes(genreOf(q)) &&
    (!usesFilmFilters(q, filters) ||
      !filters.familiarities ||
      (familiarityOf(q)
        ? filters.familiarities.includes(familiarityOf(q)!)
        : familiarities.every((f) => filters.familiarities!.includes(f))))
  );
};
export const roundGenres = (r: Round) =>
  r.filters?.sources
    ? r.filters.sources.includes("film")
      ? r.filters.genres.map(genreLabel).join(" + ") + ` · ${r.topic}`
      : r.topic
    : r.filters
      ? r.filters.genres.map(genreLabel).join(" + ") +
        (r.topic === "Alle Themen" ? "" : ` · ${r.topic}`)
      : r.topic;
export const roundDifficulties = (r: Round) =>
  r.filters
    ? difficulties
        .filter((d) => r.filters!.difficulties.includes(d))
        .map(difficultyLabel)
        .join(" + ")
    : r.difficulty;

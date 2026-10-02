import type { Question, QuizFilters, Round } from "./model";
import { familiarityOf, familiarities } from "./familiarity";

export const difficulties = ["leicht", "mittel", "schwer", "experte"] as const;
export const normalizeGenre = (genre: string) =>
  genre === "Sci-Fi"
    ? "Science-Fiction"
    : genre === "RomCom"
      ? "Rom-Com"
      : genre;
export const genreOf = (q: Question) =>
  q.metadata.subdomain?.trim() || q.domain;
export const genreLabel = (genre: string) =>
  genre === "Science-Fiction" ? "Sci-Fi" : genre;
export const difficultyLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
export const canonicalFilters = (filters: QuizFilters): QuizFilters => ({
  genres: [...new Set(filters.genres)].sort(),
  difficulties: [...new Set(filters.difficulties)].sort(),
  ...(filters.familiarities
    ? { familiarities: [...new Set(filters.familiarities)].sort() }
    : {}),
});
export const matchesFilters = (q: Question, filters: QuizFilters) =>
  filters.genres.includes(genreOf(q)) &&
  filters.difficulties.includes(q.difficulty) &&
  (!filters.familiarities ||
    (familiarityOf(q)
      ? filters.familiarities.includes(familiarityOf(q)!)
      : familiarities.every((f) => filters.familiarities!.includes(f))));
export const roundGenres = (r: Round) =>
  r.filters
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

import type { Question, QuizFilters, Round } from "./model";

export const difficulties = ["leicht", "mittel", "schwer"] as const;
export const genreOf = (q: Question) =>
  q.metadata.subdomain?.trim() || q.domain;
export const genreLabel = (genre: string) =>
  genre === "Science-Fiction" ? "Sci-Fi" : genre;
export const difficultyLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
export const canonicalFilters = (filters: QuizFilters): QuizFilters => ({
  genres: [...new Set(filters.genres)].sort(),
  difficulties: [...new Set(filters.difficulties)].sort(),
});
export const matchesFilters = (q: Question, filters: QuizFilters) =>
  filters.genres.includes(genreOf(q)) &&
  filters.difficulties.includes(q.difficulty);
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

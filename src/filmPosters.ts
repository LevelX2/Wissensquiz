import type { Question } from "./model";

export type FilmPosterData = {
  title: string;
  originalTitle: string;
  year: number;
  tmdbId: number;
  posterPath: string;
};
export type FilmPosterManifest = {
  checkedAt: string;
  expiresAt: string;
  films: Record<string, FilmPosterData>;
};
let manifest: Promise<FilmPosterManifest | null> | undefined;
export function loadFilmPosters() {
  return (manifest ??= fetch("/film-posters.json", { cache: "no-cache" })
    .then(async (response) => {
      if (!response.ok) return null;
      const value = await response.json();
      if (
        !value ||
        typeof value.films !== "object" ||
        !value.films ||
        typeof value.checkedAt !== "string" ||
        typeof value.expiresAt !== "string"
      )
        return null;
      return value as FilmPosterManifest;
    })
    .catch(() => null));
}
export function filmPoster(
  q: Question,
  data: FilmPosterManifest | null,
  now = Date.now(),
) {
  if (
    !data ||
    q.domain !== "Film" ||
    q.metadata.person_id ||
    !q.metadata.film_title_original ||
    !q.metadata.film_year
  )
    return undefined;
  const checked = Date.parse(data.checkedAt),
    expires = Date.parse(data.expiresAt);
  if (
    !Number.isFinite(checked) ||
    !Number.isFinite(expires) ||
    expires <= checked ||
    now >= expires ||
    expires - checked > 183 * 86400000
  )
    return undefined;
  const key = `${q.metadata.film_title_original}|${q.metadata.film_year}`;
  const poster = data.films[key];
  if (
    !poster ||
    poster.originalTitle !== q.metadata.film_title_original ||
    String(poster.year) !== q.metadata.film_year ||
    !Number.isSafeInteger(poster.tmdbId) ||
    poster.tmdbId <= 0 ||
    !/^\/[a-zA-Z0-9]+\.(jpg|png)$/.test(poster.posterPath)
  )
    return undefined;
  return {
    ...poster,
    src: `https://image.tmdb.org/t/p/w342${poster.posterPath}`,
    sourceUrl: `https://www.themoviedb.org/movie/${poster.tmdbId}`,
  };
}

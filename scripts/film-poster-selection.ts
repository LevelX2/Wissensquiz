import reviewed from "../src/reviewedFilmPosters.json" with { type: "json" };
import tmdbIds from "../src/filmTmdbIds.json" with { type: "json" };

export function catalogFilmTmdbId(key: string) {
  return Object.hasOwn(tmdbIds, key)
    ? (tmdbIds as Record<string, number>)[key]
    : undefined;
}

export function reviewedPosterFor(key: string) {
  return (reviewed as Record<string, { tmdbId: number; posterPath: string }>)[
    key
  ];
}

export function selectFilmPosterPath(
  key: string,
  movie: { id: number; poster_path: string },
  posters: { file_path: string }[] = [],
) {
  const selection = reviewedPosterFor(key);
  if (!selection) return movie.poster_path;
  if (
    selection.tmdbId !== movie.id ||
    !posters.some((poster) => poster.file_path === selection.posterPath)
  )
    throw new Error(`Geprüftes Filmposter für ${key} bei TMDB erneut prüfen.`);
  return selection.posterPath;
}

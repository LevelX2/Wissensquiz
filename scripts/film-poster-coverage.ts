import type { Question } from "../src/model";
import { filmPoster, type FilmPosterManifest } from "../src/filmPosters";

// Publication must not silently omit covers from newly added film questions.
export function assertFilmPosterCoverage(
  questions: Question[],
  posters: FilmPosterManifest,
  now = Date.now(),
) {
  const missing = new Set<string>();
  for (const q of questions) {
    if (
      q.domain === "Film" &&
      !q.metadata.person_id &&
      q.metadata.film_title_original &&
      q.metadata.film_year &&
      !(q.works?.length && q.works.every((work) => work.type === "series")) &&
      !filmPoster(q, posters, now)
    )
      missing.add(`${q.metadata.film_title_original}|${q.metadata.film_year}`);
  }
  if (missing.size)
    throw new Error(
      `Gültige Filmposter fehlen für ${missing.size} Filmfassungen: ${[...missing].sort().join(", ")}. npm run prepare:posters ausführen.`,
    );
}

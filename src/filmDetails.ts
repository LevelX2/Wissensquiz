import type { Question } from "./model";
import { fingerprint } from "./importer";
import editorial from "./castEditorial.json";

// Editorial text never mutates imported questions or historical round snapshots.
// ID, original version, film/year and displayed content must all match the review.
export function filmDetails(q: Question) {
  const entry = (
    editorial.questions as Record<
      string,
      {
        version: string;
        film: string;
        content: string;
        text: string;
      }
    >
  )[q.id];
  if (
    !entry?.text ||
    entry.version !== q.version ||
    entry.film !==
      `${q.metadata.film_title_original}|${q.metadata.film_year}` ||
    entry.content !==
      fingerprint(JSON.stringify([q.question, q.explanation, q.context]))
  )
    return undefined;
  const film = (
    editorial.films as Record<
      string,
      { source: string; additionalSource?: string }
    >
  )[entry.film];
  return {
    text: entry.text,
    sources: [
      film.source,
      ...(film.additionalSource ? [film.additionalSource] : []),
    ],
  };
}

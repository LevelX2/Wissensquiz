import type { Question } from "./model";
import editorial from "./yearEditorial.json" with { type: "json" };

type YearEntry = {
  film: string;
  year: number;
  question: string;
  originalContext: string;
  text: string;
  anchor: string;
  sources: string[];
};

const entries: Record<string, YearEntry> = editorial;

// Editorial enrichment belongs to the explanation shown after an answer.
export function yearPresentation(q: Question) {
  const entry = entries[q.id];
  if (
    !entry ||
    `${q.metadata.film_title_original}|${q.metadata.film_year}` !==
      entry.film ||
    q.question !== entry.question ||
    q.context !== entry.originalContext ||
    q.answers.find((answer) => answer.id === q.correctId)?.text !==
      String(entry.year)
  )
    return undefined;
  return entry;
}

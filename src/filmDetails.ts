import type { Question } from "./model";

interface FilmDetails {
  cast: { role: string; actor: string }[];
  source: string;
  checkedAt: string;
}

// Editorial additions are separate from imported questions and saved rounds.
// Original title and year distinguish adaptations and remakes.
const details = new Map<string, FilmDetails>([
  [
    "The Conjuring|2013",
    {
      cast: [
        { role: "Ed Warren", actor: "Patrick Wilson" },
        { role: "Lorraine Warren", actor: "Vera Farmiga" },
        { role: "Roger Perron", actor: "Ron Livingston" },
        { role: "Carolyn Perron", actor: "Lili Taylor" },
      ],
      source: "https://catalog.afi.com/Catalog/MovieDetails/69558",
      checkedAt: "2026-09-26",
    },
  ],
]);

export function filmDetails(q: Question): FilmDetails | undefined {
  return details.get(
    `${q.metadata.film_title_original}|${q.metadata.film_year}`,
  );
}

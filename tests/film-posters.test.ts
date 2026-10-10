import { expect, it } from "vitest";
import { filmPoster, type FilmPosterManifest } from "../src/filmPosters";
import type { Question } from "../src/model";

const q: Question = {
  id: "poster-test",
  knowledgeId: "poster-test",
  version: "test",
  language: "de",
  topic: "Test",
  difficulty: "leicht",
  question: "Testfrage?",
  correctId: "a",
  answers: ["a", "b", "c", "d"].map((id) => ({ id, text: id, feedback: "" })),
  explanation: "Erklärung",
  context: "",
  anchor: "",
  sources: [],
  tags: [],
  badgeTags: [],
  demo: false,
  domain: "Film",
  metadata: {
    subdomain: "Science-Fiction",
    film_title_original: "Dune",
    film_year: "2021",
  },
};
const data: FilmPosterManifest = {
  checkedAt: "2026-10-10",
  expiresAt: "2027-03-10",
  films: {
    "Dune|2021": {
      title: "Dune",
      originalTitle: "Dune",
      year: 2021,
      tmdbId: 123,
      posterPath: "/Example.jpg",
    },
  },
};
const now = Date.parse("2026-10-10T12:00:00Z");
it("bindet ein Poster ausschließlich an Originaltitel und Filmfassung", () => {
  expect(filmPoster(q, data, now)?.src).toBe(
    "https://image.tmdb.org/t/p/w342/Example.jpg",
  );
  expect(filmPoster(q, data, now)?.sourceUrl).toBe(
    "https://www.themoviedb.org/movie/123",
  );
  expect(
    filmPoster(
      { ...q, metadata: { ...q.metadata, film_year: "1984" } },
      data,
      now,
    ),
  ).toBeUndefined();
});
it("zeigt keine Filmcover für Personenfragen", () => {
  expect(filmPoster({ ...q, domain: "Person" }, data, now)).toBeUndefined();
  expect(
    filmPoster(
      { ...q, metadata: { ...q.metadata, person_id: "person-1" } },
      data,
      now,
    ),
  ).toBeUndefined();
});
it.each(["Science-Fiction", "Action", "Drama", "Horror", "Komödie"])(
  "zeigt das passende Filmcover auch im Genre %s",
  (subdomain) => {
    expect(
      filmPoster({ ...q, metadata: { ...q.metadata, subdomain } }, data, now)
        ?.tmdbId,
    ).toBe(123);
  },
);
it("verwendet abgelaufene oder zu lange gecachte Metadaten nicht", () => {
  expect(filmPoster(q, data, Date.parse("2027-03-10"))).toBeUndefined();
  expect(
    filmPoster(q, { ...data, expiresAt: "2028-03-10" }, now),
  ).toBeUndefined();
  expect(
    filmPoster(q, { ...data, expiresAt: "ungültig" }, now),
  ).toBeUndefined();
});
it("akzeptiert nur TMDB-Bildpfade und positive Film-IDs", () => {
  for (const posterPath of [
    "https://example.test/image.jpg",
    "/../secret.jpg",
    "/asset.svg",
  ]) {
    const invalid = structuredClone(data);
    invalid.films["Dune|2021"].posterPath = posterPath;
    expect(filmPoster(q, invalid, now)).toBeUndefined();
  }
  const invalid = structuredClone(data);
  invalid.films["Dune|2021"].tmdbId = -1;
  expect(filmPoster(q, invalid, now)).toBeUndefined();
});
it("erfindet kein Poster bei fehlenden oder widersprüchlichen Angaben", () => {
  expect(filmPoster(q, null, now)).toBeUndefined();
  const invalid = structuredClone(data);
  invalid.films["Dune|2021"].originalTitle = "Anderer Film";
  expect(filmPoster(q, invalid, now)).toBeUndefined();
});

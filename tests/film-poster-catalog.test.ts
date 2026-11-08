import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import ids from "../src/filmTmdbIds.json";
import { catalogFilmTmdbId } from "../scripts/film-poster-selection";

it("ordnet jeder Filmfassung mit eigenen Film- oder Preisfragen genau eine gültige TMDB-Identität zu", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((pkg) => ({
      filename: pkg.filename,
      text: readFileSync(pkg.path, "utf8"),
    })),
  );
  const films = new Set(
    state.questions
      .filter(
        (q) =>
          q.domain === "Film" &&
          !q.metadata.person_id &&
          q.metadata.film_title_original &&
          q.metadata.film_year,
      )
      .map((q) => `${q.metadata.film_title_original}|${q.metadata.film_year}`),
  );
  expect(Object.keys(ids).sort()).toEqual([...films].sort());
  const assigned = new Set<number>();
  for (const key of films) {
    const id = catalogFilmTmdbId(key);
    expect(Number.isSafeInteger(id), key).toBe(true);
    expect(id, key).toBeGreaterThan(0);
    expect(assigned.has(id!), `Doppelte TMDB-Fassung: ${key}`).toBe(false);
    assigned.add(id!);
  }
});

it("unterscheidet gleichnamige Fassungen und liefert keine fremden oder geerbten Einträge", () => {
  expect(catalogFilmTmdbId("The Man Who Knew Too Much|1956")).toBe(574);
  expect(catalogFilmTmdbId("The Man Who Knew Too Much|1934")).toBeUndefined();
  expect(catalogFilmTmdbId("Dune|1984")).toBe(841);
  expect(catalogFilmTmdbId("Dune|2021")).toBe(438631);
  expect(catalogFilmTmdbId("The Man Who Knew Too Much|2000")).toBeUndefined();
  expect(catalogFilmTmdbId("constructor")).toBeUndefined();
});

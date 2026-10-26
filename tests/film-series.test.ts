import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { preparePresentation } from "../src/questionPresentation";
import facts from "../src/filmFacts.json";
import actorFacts from "../src/actorSupplementFilmFacts.json";
import genreFacts from "../docs/Genres-100-2026-10-08/Filmdaten.json";
import actionFacts from "../docs/Genres-100-2026-10-08/Action/Filmdaten.json";
import allGenres from "../KI-Wissen-Wissensquiz/01 Rohquellen/Alle_Genres_120_Filme_Filmdaten.json";

const positions = new Map([
  ["Mission: Impossible|1996", 1],
  ["Mission: Impossible III|2006", 3],
  ["Mission: Impossible – Ghost Protocol|2011", 4],
  ["Mission: Impossible – Rogue Nation|2015", 5],
  ["Mission: Impossible – Fallout|2018", 6],
]);

it("führt die Mission-Impossible-Teilnummer in allen verwendeten Metadateneinträgen", () => {
  const rows = [
    ...facts.map((film) => ({ key: film.film, series: film.series })),
    ...actorFacts.map((film) => ({ key: film.film, series: film.series })),
    ...[...genreFacts.films, ...actionFacts.films, ...allGenres.films].map((film) => ({
      key: `${film.film_title_original}|${film.film_year}`,
      series: film.series,
    })),
  ].filter((film) => film.key.startsWith("Mission: Impossible"));
  expect(rows).toHaveLength(8);
  for (const { key, series } of rows) {
    expect(positions.has(key), key).toBe(true);
    expect(series, key).toMatchObject({
      name: "Mission: Impossible",
      position: positions.get(key),
    });
  }
  for (const rank of [13, 14]) {
    const authored = JSON.parse(readFileSync(
      `docs/Genres-100-2026-10-08/Action/Redaktion/${String(rank).padStart(3, "0")}.json`,
      "utf8",
    ));
    const film = actionFacts.films.find((film) => film.rank === rank)!;
    expect(authored.series).toEqual(film.series);
  }
});

it("liefert die Teilnummer für sämtliche vorbereiteten Mission-Impossible-Filmdaten einschließlich Personenfragen", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((pkg) => ({
      filename: pkg.filename,
      text: readFileSync(`public${pkg.path}`, "utf8"),
    })),
  );
  const seen = new Set<string>();
  let personReferences = 0;
  for (const question of state.questions) {
    for (const { data } of preparePresentation(question).films) {
      if (!data.originalTitle.startsWith("Mission: Impossible")) continue;
      const key = `${data.originalTitle}|${data.year}`;
      expect(positions.has(key), `${question.id}: ${key}`).toBe(true);
      expect(data.series, `${question.id}: ${key}`).toMatchObject({
        name: "Mission: Impossible",
        position: positions.get(key),
      });
      seen.add(key);
      if (question.metadata.person_id) personReferences++;
    }
  }
  expect(seen).toEqual(new Set(positions.keys()));
  expect(personReferences).toBeGreaterThan(0);
}, 30000);

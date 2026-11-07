import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { preparePresentation } from "../src/questionPresentation";
import facts from "../src/filmFacts.json";
import actorFacts from "../src/actorSupplementFilmFacts.json";
import genreFacts from "../docs/Genres-100-2026-10-08/Filmdaten.json";
import actionFacts from "../docs/Genres-100-2026-10-08/Action/Filmdaten.json";
import allGenres from "../KI-Wissen-Wissensquiz/01 Rohquellen/Alle_Genres_120_Filme_Filmdaten.json";
import seriesRegistry from "../src/filmSeries.json";
import seriesReview from "../docs/Filmreihen-2026-11-02/Pruefung.json";
import genre150 from "../docs/Genres-150-2026-11-03/Filmdaten.json";
import { FilmDataPanel } from "../src/FilmDataPanel";

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
    ...[...genreFacts.films, ...actionFacts.films, ...allGenres.films].map(
      (film) => ({
        key: `${film.film_title_original}|${film.film_year}`,
        series: film.series,
      }),
    ),
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
    const authored = JSON.parse(
      readFileSync(
        `docs/Genres-100-2026-10-08/Action/Redaktion/${String(rank).padStart(3, "0")}.json`,
        "utf8",
      ),
    );
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
      text: readFileSync(`${pkg.path}`, "utf8"),
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

it("prüft jede angezeigte Filmfassung auf redaktionelle Abdeckung, eindeutige Reihe und sichtbare Teilnummer", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((pkg) => ({
      filename: pkg.filename,
      text: readFileSync(`${pkg.path}`, "utf8"),
    })),
  );
  const registry = seriesRegistry.films as Record<
    string,
    {
      series: { name: string; position: number; note: string } | null;
      sources: string[];
    }
  >;
  const seen = new Map<string, string>();
  const reviewed = new Map<string, unknown>([
    ...seriesReview.films.map((film) => [film.film, film.after] as const),
    ...genre150.films.map(
      (film) =>
        [`${film.film_title_original}|${film.film_year}`, film.series] as const,
    ),
    ...genre150.series_updates.map((film) => [film.film, film.series] as const),
  ]);
  let numbered = 0;
  for (const question of state.questions) {
    const presentation = preparePresentation(question);
    for (const { data } of presentation.films) {
      const key = `${data.originalTitle}|${data.year}`;
      expect(
        Object.hasOwn(registry, key),
        `Filmreihenprüfung fehlt: ${key}`,
      ).toBe(true);
      if (seen.has(key)) {
        expect(JSON.stringify(data.series), `${question.id}: ${key}`).toBe(
          seen.get(key),
        );
        continue;
      }
      seen.set(key, JSON.stringify(data.series));
      expect(data.series, `Abweichung von der Reihenredaktion: ${key}`).toEqual(
        reviewed.get(key),
      );
      if (!data.series) continue;
      numbered++;
      expect(data.series.name.trim(), key).not.toBe("");
      expect(Number.isInteger(data.series.position), key).toBe(true);
      expect(data.series.position, key).toBeGreaterThan(0);
      expect(
        registry[key].sources.length,
        `Reihenquelle fehlt: ${key}`,
      ).toBeGreaterThan(0);
      const html = renderToStaticMarkup(
        createElement(FilmDataPanel, {
          q: { ...question, presentation },
        }),
      );
      expect(html, key).toContain(` · Teil ${data.series.position}`);
    }
  }
  expect(new Set(seen.keys())).toEqual(new Set(Object.keys(registry)));
  expect(new Set(seen.keys())).toEqual(new Set(reviewed.keys()));
  expect(seen.size).toBe(reviewed.size);
  expect(numbered).toBe([...reviewed.values()].filter(Boolean).length);
}, 30000);

it("ordnet gemeldete Reihen, Vorgeschichten, Neustarts und abweichende Datenbanksammlungen konkret ein", () => {
  const entries = seriesRegistry.films as Record<
    string,
    {
      series: { name: string; position: number; note: string } | null;
    }
  >;
  for (const [key, name, position] of [
    ["The Mummy|1999", "Die Mumie", 1],
    ["The Mummy Returns|2001", "Die Mumie", 2],
    ["The Mummy: Tomb of the Dragon Emperor|2008", "Die Mumie", 3],
    ["Mad Max|1979", "Mad Max", 1],
    ["Mad Max 2|1981", "Mad Max", 2],
    ["Mad Max: Fury Road|2015", "Mad Max", 4],
    ["Romancing the Stone|1984", "Auf der Jagd nach dem grünen Diamanten", 1],
    ["The Jewel of the Nile|1985", "Auf der Jagd nach dem grünen Diamanten", 2],
    ["Top Gun|1986", "Top Gun", 1],
    ["Top Gun: Maverick|2022", "Top Gun", 2],
    ["No Time to Die|2021", "James Bond (Eon)", 25],
    ["The Godfather Part II|1974", "Der Pate", 2],
    ["The Matrix Revolutions|2003", "Matrix", 3],
    ["Dune: Part Two|2024", "Dune (Denis Villeneuve)", 2],
    ["Police Story 2013|2013", "Police Story", 6],
    ["Gendai yakuza: Hitokiri yota|1972", "Gendai Yakuza", 6],
    ["Ma nuit chez Maud|1969", "Sechs moralische Erzählungen", 4],
    ["Star Wars: Episode I – The Phantom Menace|1999", "Star Wars", 4],
  ] as const)
    expect(entries[key].series, key).toMatchObject({ name, position });
  for (const key of [
    "A Star Is Born|1954",
    "Dune|1984",
    "Ichimei|2011",
    "King Kong|2005",
    "Sahara|2005",
    "The Spiderwick Chronicles|2008",
    "導火綫 (Dou fo sin)|2007",
  ])
    expect(entries[key].series, key).toBeNull();
  expect(entries["Ma nuit chez Maud|1969"].series?.note).toContain(
    "Erzählordnung",
  );
  expect(entries["Police Story 2013|2013"].series?.note).toContain("Neustart");
});

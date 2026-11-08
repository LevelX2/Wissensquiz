import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { importCsv } from "../src/importer";
import { questionSchema } from "../src/questionSchema";
import {
  decodeQuestionCatalog,
  encodeQuestionCatalog,
} from "../src/catalogCodec";
import { matchesFilters, canonicalFilters } from "../src/filters";
import { packageForQuestion, readQuestions } from "../src/packages";
import {
  genresOf,
  matchesWorkFilters,
  workIdentity,
  workReferencesOf,
  workReferenceSchema,
  resolveQuestionWorks,
  type AttributedQuestion,
} from "../src/workAttributes";

const q: AttributedQuestion = {
  domain: "Personen",
  metadata: { person_id: "actor" },
  works: [
    {
      type: "film",
      originalTitle: "Same title",
      year: 2000,
      genres: ["Science-Fiction"],
      techniques: ["animation"],
      collections: ["Classics"],
    },
    {
      type: "series",
      originalTitle: "Same title",
      year: 2000,
      genres: ["Fantasy"],
      techniques: ["live-action"],
      season: 2,
    },
  ],
};

it("verknüpft Werkart, Genre und Machart mit demselben konkreten Gegenstand", () => {
  expect(
    matchesWorkFilters(q, {
      genres: ["Science-Fiction"],
      workTypes: ["film"],
      techniques: ["animation"],
    }),
  ).toBe(true);
  expect(
    matchesWorkFilters(q, { genres: null, collections: ["Classics"] }),
  ).toBe(true);
  expect(
    matchesWorkFilters(q, { genres: ["Fantasy"], collections: ["Classics"] }),
  ).toBe(false);
  expect(
    matchesWorkFilters(q, { genres: ["Fantasy"], workTypes: ["series"] }),
  ).toBe(true);
  expect(
    matchesWorkFilters(q, {
      genres: ["Science-Fiction"],
      workTypes: ["series"],
    }),
  ).toBe(false);
  expect(
    matchesWorkFilters(q, { genres: ["Fantasy"], techniques: ["animation"] }),
  ).toBe(false);
  expect(
    matchesWorkFilters(q, { genres: ["Fantasy", "Science-Fiction"] }),
  ).toBe(true);
  expect(new Set(q.works!.map(workIdentity)).size).toBe(2);
});

it("behält allgemeine Personenfragen nur in einer unbeschränkten Werkauswahl", () => {
  const general = { ...q, works: [] };
  expect(matchesWorkFilters(general, { genres: null })).toBe(true);
  expect(
    matchesWorkFilters(general, { genres: null, workTypes: ["series"] }),
  ).toBe(false);
  expect(matchesWorkFilters(general, { genres: ["Fantasy"] })).toBe(false);
  expect(matchesWorkFilters(q, { genres: [] })).toBe(false);
  expect(matchesWorkFilters(q, { genres: null, workTypes: [] })).toBe(false);
});

it("verwendet vorhandene Filmattribute, ohne Filmreihen zu TV-Serien umzudeuten", () => {
  const film = {
    domain: "Film",
    metadata: {
      film_title_original: "Original",
      film_year: "1988",
      subdomain: "Sci-Fi",
      franchise: "Reihe",
    },
  };
  expect(genresOf(film)).toEqual(["Science-Fiction"]);
  expect(workReferencesOf(film)[0].type).toBe("film");
  expect(
    workReferencesOf({ domain: "Personen", metadata: { person_id: "actor" } }),
  ).toEqual([]);
});

it("validiert Staffel, Folge und Werktyp ohne erfundene Ersatzwerte", () => {
  const series = q.works![1];
  expect(workReferenceSchema.safeParse(series).success).toBe(true);
  for (const change of [
    { type: "franchise" },
    { type: "film" },
    { season: 0 },
    { episode: -1 },
    { year: NaN },
    { originalTitle: " " },
  ]) {
    expect(
      workReferenceSchema.safeParse({ ...series, ...change }).success,
    ).toBe(false);
  }
});

it("ordnet mehreren Filmverweisen nur am jeweiligen Werk belegte Genres zu", () => {
  const film = (title: string, genre: string): AttributedQuestion => ({
    domain: "Film",
    metadata: {
      film_title_original: title,
      film_year: "2000",
      subdomain: genre,
    },
  });
  const price = {
    ...film("A", "Fantasy"),
    metadata: {
      ...film("A", "Fantasy").metadata,
      film_refs: "A|2000;B|2000;Unknown|2000",
    },
  };
  const resolved = resolveQuestionWorks([
    film("A", "Fantasy"),
    film("B", "Science-Fiction"),
    price,
  ]);
  expect(resolved[2].works!.map((work) => work.genres)).toEqual([
    ["Fantasy"],
    ["Science-Fiction"],
    [],
  ]);
  expect(resolved[2].metadata).toEqual(price.metadata);
  expect(resolveQuestionWorks(resolved)).toEqual(resolved);
});

const base = () =>
  importCsv(readFileSync("tests/fixtures/demo-fragen.csv", "utf8"))
    .questions[0];

it("behält Werkbezüge durch echtes Fragenschema und Katalogkodierung", () => {
  const original = questionSchema.parse({ ...base(), works: q.works });
  expect(decodeQuestionCatalog(encodeQuestionCatalog([original]))).toEqual([
    original,
  ]);
});

it("begrenzt auch Schauspieler- und Preisfragen auf die konkrete Werkauswahl", () => {
  const original = { ...base(), works: q.works };
  const actor = {
    ...original,
    metadata: { ...original.metadata, person_id: "actor" },
  };
  const award = { ...original, tags: ["Preisträger"] };
  const filters = {
    genres: ["Fantasy"],
    workTypes: ["series" as const],
    difficulties: [original.difficulty],
    sources: ["actors" as const, "awards" as const],
  };
  expect(matchesFilters(actor, filters)).toBe(true);
  expect(matchesFilters(award, filters)).toBe(true);
  expect(
    matchesFilters(actor, { ...filters, genres: ["Science-Fiction"] }),
  ).toBe(false);
  expect(
    matchesFilters(
      { ...actor, works: [] },
      { ...filters, genres: null, workTypes: undefined },
    ),
  ).toBe(true);
  expect(
    canonicalFilters({
      ...filters,
      workTypes: ["series", "film", "series"],
      genres: null,
    }).workTypes,
  ).toEqual(["film", "series"]);
});

it("legt eine Serienfrage genau einmal im aktuellen Serienbestand ab", () => {
  const original = { ...base(), works: [q.works![1]] };
  const definition = packageForQuestion(original);
  expect(definition.path).toBe("content/serienfragen.jsonl");
  expect(
    readQuestions(
      JSON.stringify(original),
      definition.source,
      definition.genre,
      definition.workType,
    ),
  ).toEqual([original]);
  expect(() =>
    readQuestions(JSON.stringify(original), "film", undefined, "film"),
  ).toThrow("Werkart");
});

it("übernimmt strukturierte Werkbezüge über den echten CSV-Importer und weist ungültige zurück", () => {
  const row = { ...base().metadata, work_refs: JSON.stringify(q.works) };
  const result = importCsv(Papa.unparse([row]));
  expect(result.report.rejected).toBe(0);
  expect(result.questions[0].works).toEqual(q.works);
  for (const work_refs of [
    "{",
    JSON.stringify([{ ...q.works![0], season: 1 }]),
  ]) {
    const rejected = importCsv(Papa.unparse([{ ...row, work_refs }]));
    expect(rejected.report.rejected).toBe(1);
    expect(rejected.questions).toEqual([]);
  }
});

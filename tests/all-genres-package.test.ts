import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { importCsv } from "../src/importer";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { familiarityOf, filmIdentity } from "../src/familiarity";
import { pathQuestions } from "../src/learningPath";
import { validateBackup } from "../src/storage";
import { filmData } from "../src/filmFacts";
import filmSource from "../KI-Wissen-Wissensquiz/01 Rohquellen/Alle_Genres_120_Filme_Filmdaten.json";
import { assertEditorialSource } from "./editorialSource";

const packageIndex = packages.findIndex(
  (p) => p.filename === "Alle_Genres_120_Filme_960_Fragen.csv",
);
const latest = packages[packageIndex];
const text = readFileSync(`public${latest.path}`, "utf8");
const contents = packages.slice(0, packageIndex + 1).map((pkg) => ({
  filename: pkg.filename,
  text: readFileSync(`public${pkg.path}`, "utf8"),
}));

it("erhält die Rohquelle, prüft dokumentierte Redaktion und importiert alle 960 Fragen", () => {
  expect(latest.filename).toBe("Alle_Genres_120_Filme_960_Fragen.csv");
  const raw = readFileSync(
    `KI-Wissen-Wissensquiz/01 Rohquellen/${latest.filename}`,
  );
  expect(
    assertEditorialSource(text, raw.toString("utf8"), `public${latest.path}`)
      .changes,
  ).toEqual(["ACT-202610-P01-S-025"]);
  expect(createHash("sha256").update(raw).digest("hex")).toBe(
    "84d105796e4fc87f337eda9fd187c65673d48357458a788dbabcd3815dc7fbe1",
  );
  const old = emptyState();
  addPackages(old, contents.slice(0, -1));
  const imported = importCsv(text, old.questions, latest.filename);
  expect(imported.report).toMatchObject({
    accepted: 960,
    rejected: 0,
    duplicates: 0,
    issues: [],
    warnings: [],
  });
  expect(new Set(imported.questions.map((q) => q.id)).size).toBe(960);
  expect(new Set(imported.questions.map((q) => q.knowledgeId)).size).toBe(960);
  expect(new Set(imported.questions.map(filmIdentity)).size).toBe(120);
  expect(
    imported.questions.filter(
      (q) =>
        q.question.includes("Wer führte bei dieser Fassung Regie?") ||
        q.question.includes(
          "Welche beiden Regisseure werden für diese Fassung genannt?",
        ),
    ),
  ).toHaveLength(120);
  expect(
    imported.questions.filter((q) =>
      q.question.includes(
        "In welchem Jahr wurde diese Fassung erstmals öffentlich gezeigt oder veröffentlicht?",
      ),
    ),
  ).toHaveLength(120);
  expect(
    new Set(imported.questions.map((q) => q.metadata.subdomain)).size,
  ).toBe(12);
  expect(
    imported.questions.filter((q) => q.tags.includes("Classics")),
  ).toHaveLength(280);
  expect(
    imported.questions.filter((q) => q.tags.includes("Arthouse")),
  ).toHaveLength(104);
  expect(
    imported.questions.every(
      (q) => familiarityOf(q) && q.context && q.sources.length,
    ),
  ).toBe(true);
}, 10000);

it("ergänzt alte Spielstände idempotent und macht neue Film-Ikonen in der Filmreise verfügbar", () => {
  const state = emptyState();
  addPackages(state, contents.slice(0, -1));
  const before = structuredClone(state.questions);
  addPackages(state, contents);
  addPackages(state, contents);
  expect(state.questions).toHaveLength(4677);
  expect(new Set(state.questions.map((q) => q.knowledgeId)).size).toBe(4197);
  expect(state.questions.slice(0, before.length)).toEqual(before);
  expect(
    state.imports.filter((r) => r.filename === latest.filename),
  ).toHaveLength(1);
  expect(state.journey?.earned.Thriller?.familiarity).toBe(2);
  expect(
    pathQuestions(state).some(
      (q) => q.id.startsWith("ADV-202610-") && familiarityOf(q) === 1,
    ),
  ).toBe(true);
  expect(() => validateBackup(structuredClone(state))).not.toThrow();
  const fresh = emptyState();
  addPackages(fresh, contents);
  expect(
    pathQuestions(fresh).some((q) => q.id === "THR-202610-P01-L-003"),
  ).toBe(true);
});

it("verbindet alle 120 gelieferten Filmdaten mit den bestehenden CSV-Fragen, ohne weitere Fragen anzulegen", () => {
  const raw = readFileSync(
    "KI-Wissen-Wissensquiz/01 Rohquellen/Alle_Genres_120_Filme_Filmdaten.json",
  );
  expect(createHash("sha256").update(raw).digest("hex")).toBe(
    "7ede93c5f4f8e435eab7c114ccd3843175a3c37010d37da552d641e1244ceb7a",
  );
  expect(filmSource.schema_version).toBe("wissensquiz-redaktion-film-v1");
  expect(filmSource.films).toHaveLength(120);
  const imported = importCsv(text).questions;
  expect(
    new Set(
      filmSource.films.map((f) => `${f.film_title_original}|${f.film_year}`),
    ).size,
  ).toBe(120);
  for (const f of filmSource.films) {
    const q = imported.find(
      (candidate) => candidate.id === f.reference_question_id,
    )!;
    expect(q).toBeDefined();
    expect(filmIdentity(q)).toBe(`${f.film_title_original}|${f.film_year}`);
    expect(q.metadata.film_title_de).toBe(f.film_title_de);
    expect(q.metadata.subdomain).toBe(f.subdomain);
    expect(familiarityOf(q)).toBe(f.familiarity_level);
    const data = filmData(q)!;
    expect(data).toMatchObject({
      originalTitle: f.film_title_original,
      year: f.film_year,
      countries: f.production_countries,
      series: f.series,
      releaseNote: f.release_note,
      directorNote: f.director_note,
    });
    expect(data.directors).toBe(f.directors.join(" und "));
    expect(data.sources).toEqual([
      ...new Set(f.sources.map((source) => source.url)),
    ]);
    const director = imported.find(
      (candidate) =>
        filmIdentity(candidate) === filmIdentity(q) &&
        (candidate.question.includes("Wer führte bei dieser Fassung Regie?") ||
          candidate.question.includes(
            "Welche beiden Regisseure werden für diese Fassung genannt?",
          )),
    )!;
    expect(data.directorContext).toBe(director.context);
  }
  expect(
    filmSource.films.filter(
      (f) =>
        filmData(imported.find((q) => q.id === f.reference_question_id)!)
          ?.countryNote,
    ),
  ).toHaveLength(23);
});

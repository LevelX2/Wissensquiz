// Real CSV parser and complete catalog, isolated in memory; no player data.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { addPackages, packages } from "../src/packages";
import { emptyState, type Question } from "../src/model";
import { importCsv } from "../src/importer";
import { filmData, addFilmFacts } from "../src/filmFacts";
import { familiarityOf, filmIdentity } from "../src/familiarity";
import { genreOf, questionSourceOf } from "../src/filters";

Date.now = () => Date.UTC(2026, 10, 3, 12, 0, 0);
const root = "docs/Genres-150-2026-11-03";
const read = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const manifest = read(`${root}/Pakete.json`) as {
  packages: { wave: string; filename: string; path: string; films: string[] }[];
};
const metadata = read(`${root}/Filmdaten.json`) as {
  films: {
    id: string; film_title_original: string; film_year: number;
    subdomain: string; familiarity_level: number;
    series: { name: string; position: number; note: string } | null;
  }[];
};
const newNames = new Set(manifest.packages.map((pkg) => pkg.filename));
const state = emptyState();
addPackages(state, packages.filter((pkg) => !newNames.has(pkg.filename)).map((pkg) => ({filename: pkg.filename, text: readFileSync(`public${pkg.path}`, "utf8")})));
const baseline = JSON.stringify(state.questions);
const before = state.questions.length;
const existingFilms = new Set(state.questions.filter((q) => questionSourceOf(q) === "film").map(filmIdentity));
const added: Question[] = [];
for (const pkg of manifest.packages) {
  const text = readFileSync(`public${pkg.path}`, "utf8");
  assert.equal(text, readFileSync(`KI-Wissen-Wissensquiz/01 Rohquellen/${pkg.filename}`, "utf8"));
  const result = importCsv(text, [...state.questions, ...added], pkg.filename);
  assert.equal(result.report.accepted, pkg.films.length * 8, pkg.wave);
  assert.equal(result.report.rejected, 0, pkg.wave);
  assert.equal(result.report.duplicates, 0, pkg.wave);
  assert.deepEqual(result.report.issues, [], pkg.wave);
  assert.deepEqual(result.report.warnings, [], pkg.wave);
  const csv = Papa.parse<Record<string, string>>(text, {header: true, skipEmptyLines: "greedy"});
  assert.deepEqual(csv.errors, []);
  const rows = new Map(csv.data.map((row) => [row.question_id, row]));
  for (const q of result.questions) {
    const row = rows.get(q.id)!;
    assert.equal(questionSourceOf(q), "film", q.id);
    assert.equal(q.question, row.question, q.id);
    assert.equal(q.context, row.explanation_context, q.id);
    assert.equal(q.explanation, row.explanation_short, q.id);
    for (const [key, value] of Object.entries(row)) assert.equal(q.metadata[key], value, `${q.id}: ${key}`);
    for (const letter of ["a", "b", "c", "d"]) {
      const answer = q.answers.find((entry) => entry.id === `${q.id}:${letter}`)!;
      assert.equal(answer.text, row[`answer_${letter}`], q.id);
      assert.equal(answer.feedback, row[`feedback_${letter}`], q.id);
    }
    assert.equal(q.correctId, `${q.id}:${row.correct_answer.toLowerCase()}`, q.id);
  }
  added.push(...result.questions);
}
assert.equal(JSON.stringify(state.questions), baseline, "Existing question data changed");
for (const film of metadata.films) {
  const key = `${film.film_title_original}|${film.film_year}`;
  assert(!existingFilms.has(key), `${key}: already in film catalog`);
  const qs = added.filter((q) => filmIdentity(q) === key);
  assert.equal(qs.length, 8, key);
  assert.equal(new Set(qs.map((q) => q.knowledgeId)).size, 8, key);
  for (const [prefix, stage] of [["L", "leicht"], ["M", "mittel"], ["S", "schwer"]])
    assert.equal(qs.filter((q) => q.id.startsWith(`G150-20261103-${film.id}-${prefix}`) && q.difficulty === stage).length, 2, key);
  for (const q of qs) {
    assert.equal(genreOf(q), film.subdomain, q.id);
    assert.equal(familiarityOf(q), film.familiarity_level, q.id);
    const data = filmData(q);
    assert(data && data.directors && data.countries.length && data.sources.length, `${q.id}: film data missing`);
    assert.deepEqual(data.series, film.series, q.id);
  }
}
const simulated = [...state.questions, ...added];
addFilmFacts(simulated);
assert.equal(simulated.length, before + added.length, "Duplicate generated year/director question");
for (const pkg of manifest.packages) {
  const result = importCsv(readFileSync(`public${pkg.path}`, "utf8"), simulated, pkg.filename);
  assert.equal(result.report.accepted, 0);
  assert.equal(result.report.duplicates, pkg.films.length * 8);
  assert.equal(result.report.rejected, 0);
}
console.log(JSON.stringify({films: metadata.films.length, addedQuestions: added.length, variants: added.filter((q) => q.metadata.variant_of).length, baselineQuestions: before, totalQuestions: simulated.length, totalGoals: new Set(simulated.map((q) => q.knowledgeId)).size, genres: Object.fromEntries([...new Set(added.map(genreOf))].map((genre) => [genre, new Set(added.filter((q) => genreOf(q) === genre).map(filmIdentity)).size])), exactCsvAndParserPreservation: true, existingCatalogUnchanged: true, repeatedImportSkipsAll: true, generatedFactsUnchanged: true}, null, 2));

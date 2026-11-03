// Current app catalog for editorial deduplication; no user or collection data.
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { genreOf, questionSourceOf } from "../src/filters";
import { filmIdentity } from "../src/familiarity";
import { isCategory } from "../src/categories";

Date.now = () => Date.UTC(2026, 10, 3, 12);
const state = emptyState();
addPackages(state, packages.map((p) => ({filename: p.filename, text: readFileSync(`public${p.path}`, "utf8")})));
const filmQuestions = state.questions.filter((q) => questionSourceOf(q) === "film");
const counts = (qs: typeof state.questions) => ({
  films: new Set(qs.map(filmIdentity)).size,
  questions: qs.length,
  goals: new Set(qs.map((q) => q.knowledgeId)).size,
});
const genres = Object.fromEntries([...new Set(filmQuestions.map(genreOf))].sort().map((genre) => [genre, counts(filmQuestions.filter((q) => genreOf(q) === genre))]));
const categories = Object.fromEntries((["Arthouse", "Classics"] as const).map((category) => [category, counts(filmQuestions.filter((q) => isCategory(q, category)))]));
const result = {as_of: "2026-11-03", packages: packages.length, questions: state.questions.length, goals: new Set(state.questions.map((q) => q.knowledgeId)).size, film: counts(filmQuestions), genres, categories};
if (process.argv.includes("--write-snapshot")) {
  const path = "data/genres-150-2026-11-03/bestand.json";
  const questions = state.questions.map((q) => ({
    id: q.id, knowledgeId: q.knowledgeId, source: questionSourceOf(q), genre: genreOf(q),
    difficulty: q.difficulty, question: q.question, explanation: q.explanation, context: q.context,
    answers: q.answers, correctId: q.correctId, tags: q.tags,
    metadata: q.metadata,
  }));
  writeFileSync(path, JSON.stringify({...result, questions}, null, 2) + "\n");
  assert.equal(JSON.parse(readFileSync(path, "utf8")).questions.length, questions.length);
}
if (process.argv.includes("--require-target")) {
  for (const [genre, value] of Object.entries(genres)) assert(value.films >= 150, `${genre}: ${value.films}/150`);
  for (const [category, value] of Object.entries(categories)) assert(value.films >= 150, `${category}: ${value.films}/150`);
}
console.log(JSON.stringify(result, null, 2));

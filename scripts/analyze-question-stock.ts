// Run from the project root; bundle with esbuild (platform=node, format=esm).
// Uses the same catalog assembly as the app; never reads player data.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { addPackages, packages } from "../src/packages";
import { emptyState, type Question } from "../src/model";
import { familiarityOf, filmIdentity } from "../src/familiarity";
import { genreOf, difficulties } from "../src/filters";
import { isCategory } from "../src/categories";

const state = emptyState();
addPackages(
  state,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  })),
);
const questions = state.questions;
function stats(qs: Question[]) {
  return {
    questions: qs.length,
    knowledgeGoals: new Set(qs.map((q) => q.knowledgeId)).size,
    films: new Set(qs.map(filmIdentity)).size,
    goalsByDifficulty: Object.fromEntries(
      difficulties.map((d) => [
        d,
        new Set(qs.filter((q) => q.difficulty === d).map((q) => q.knowledgeId))
          .size,
      ]),
    ),
    filmsByFamiliarity: [1, 2, 3, 4].map(
      (level) =>
        new Set(qs.filter((q) => familiarityOf(q) === level).map(filmIdentity))
          .size,
    ),
    goalsByFamiliarity: [1, 2, 3, 4].map(
      (level) =>
        new Set(
          qs
            .filter((q) => familiarityOf(q) === level)
            .map((q) => q.knowledgeId),
        ).size,
    ),
    cells: [1, 2, 3, 4].map((level) =>
      difficulties.map(
        (d) =>
          new Set(
            qs
              .filter((q) => familiarityOf(q) === level && q.difficulty === d)
              .map((q) => q.knowledgeId),
          ).size,
      ),
    ),
  };
}
const report = {
  asOf: "2026-09-27",
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  scope:
    "Bundled catalog only; 11 CSV packages, category overlays and film facts. No player data. Films keyed by original title and year; goals by knowledge_id.",
  checks: {
    duplicateQuestionIds:
      questions.length - new Set(questions.map((q) => q.id)).size,
    unclassifiedQuestions: questions.filter((q) => !familiarityOf(q)).length,
    rejectedImports: state.imports.reduce((n, r) => n + r.rejected, 0),
    duplicateImports: state.imports.reduce((n, r) => n + r.duplicates, 0),
  },
  total: stats(questions),
  genres: [...new Set(questions.map(genreOf))]
    .map((genre) => ({
      genre,
      ...stats(questions.filter((q) => genreOf(q) === genre)),
    }))
    .sort((a, b) => a.knowledgeGoals - b.knowledgeGoals),
  categories: ["Classics", "Arthouse"].map((category) => ({
    category,
    ...stats(
      questions.filter((q) =>
        isCategory(q, category as "Classics" | "Arthouse"),
      ),
    ),
  })),
  films: [...new Set(questions.map(filmIdentity))].sort().map((film) => {
    const qs = questions.filter((q) => filmIdentity(q) === film);
    return {
      film,
      title: qs[0].metadata.film_title_de,
      genres: [...new Set(qs.map(genreOf))],
      familiarity: familiarityOf(qs[0]),
      knowledgeGoals: new Set(qs.map((q) => q.knowledgeId)).size,
    };
  }),
};
if (Object.values(report.checks).some((n) => n !== 0))
  throw new Error("Catalog integrity check failed");
if (
  report.total.questions !== 2567 ||
  report.total.knowledgeGoals !== 2237 ||
  report.total.films !== 300
)
  throw new Error(
    "Unexpected catalog baseline; review before updating this analysis",
  );
writeFileSync(
  "docs/Fragenbestand-2026-09-27.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify({ ...report, films: undefined }, null, 2));

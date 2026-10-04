// Bundle with esbuild (platform=node, format=esm) and run from the repo root.
// Reads the official catalog only; never reads or changes player data.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { addPackages, packages } from "../src/packages";
import { emptyState, type Question } from "../src/model";
import { familiarityOf, filmIdentity } from "../src/familiarity";
import { genreOf, questionSourceOf } from "../src/filters";
import { filmData } from "../src/filmFacts";
import { isCategory } from "../src/categories";
import { learningPathProgress } from "../src/learningPath";
import curriculum from "../src/journeyCurriculum.json";

const inputs = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const state = emptyState();
addPackages(state, inputs);
const all = state.questions;
const film = all.filter((q) => questionSourceOf(q) === "film");
const stages = ["leicht", "mittel", "schwer"] as const;
const levels = [1, 2, 3, 4] as const;
const count = (qs: Question[]) => new Set(qs.map((q) => q.knowledgeId)).size;
const uniqueFilms = (qs: Question[]) => new Set(qs.map(filmIdentity)).size;
const generated = (q: Question) => !!q.metadata.fact_kind;
const content = (qs: Question[]) => qs.filter((q) => !generated(q));
const byFilm = new Map<string, Question[]>();
for (const q of film) {
  const key = filmIdentity(q);
  if (!byFilm.has(key)) byFilm.set(key, []);
  byFilm.get(key)!.push(q);
}
function stats(qs: Question[]) {
  return {
    questions: qs.length,
    goals: count(qs),
    variantsBeyondGoals: qs.length - count(qs),
    films: uniqueFilms(qs),
    contentGoals: count(content(qs)),
    generatedGoals: count(qs.filter(generated)),
    goalsByDifficulty: stages.map((d) =>
      count(qs.filter((q) => q.difficulty === d)),
    ),
    contentGoalsByDifficulty: stages.map((d) =>
      count(content(qs).filter((q) => q.difficulty === d)),
    ),
    filmsByFamiliarity: levels.map((l) =>
      uniqueFilms(qs.filter((q) => familiarityOf(q) === l)),
    ),
    cells: levels.map((level) => ({
      level,
      films: uniqueFilms(qs.filter((q) => familiarityOf(q) === level)),
      goals: stages.map((d) =>
        count(
          qs.filter((q) => familiarityOf(q) === level && q.difficulty === d),
        ),
      ),
      contentGoals: stages.map((d) =>
        count(
          content(qs).filter(
            (q) => familiarityOf(q) === level && q.difficulty === d,
          ),
        ),
      ),
      filmsWithContentByDifficulty: stages.map((d) =>
        uniqueFilms(
          content(qs).filter(
            (q) => familiarityOf(q) === level && q.difficulty === d,
          ),
        ),
      ),
    })),
  };
}
const progress = learningPathProgress(state);
const filmRows = [...byFilm]
  .map(([key, qs]) => ({
    film: key,
    title: qs[0].metadata.film_title_de,
    year: Number(qs[0].metadata.film_year),
    genres: [...new Set(qs.map(genreOf))],
    familiarity: familiarityOf(qs[0]),
    goals: count(qs),
    contentGoals: count(content(qs)),
    contentGoalsByDifficulty: stages.map((d) =>
      count(content(qs).filter((q) => q.difficulty === d)),
    ),
    countries: filmData(qs[0])?.countries ?? [],
    directors: filmData(qs[0])?.directors ?? "",
    series: filmData(qs[0])?.series ?? null,
  }))
  .sort((a, b) => a.film.localeCompare(b.film));
const genres = [...new Set(film.map(genreOf))]
  .map((genre) => {
    const qs = film.filter((q) => genreOf(q) === genre);
    const p = progress(genre);
    const plan = curriculum.genres[genre as keyof typeof curriculum.genres];
    return {
      genre,
      ...stats(qs),
      fullyCoveredFilms: filmRows.filter(
        (f) =>
          f.genres.includes(genre) &&
          f.contentGoalsByDifficulty.every((n) => n > 0),
      ).length,
      journey: {
        first: p.first,
        toMedium: p.easyTarget,
        toHard: p.mediumTarget,
        groups: p.groups.map((g) => {
          const selected = qs.filter(
            (q) =>
              familiarityOf(q) === g.level && q.difficulty === g.difficulty,
          );
          const anchors =
            plan?.groups.find((x) => x.level === g.level)?.goals ?? [];
          const anchorQs = selected.filter((q) =>
            anchors.includes(q.knowledgeId),
          );
          return {
            level: g.level,
            difficulty: g.difficulty,
            target: g.target,
            anchorGoals: g.total,
            anchorFilms: uniqueFilms(anchorQs),
            anchorGeneratedGoals: count(anchorQs.filter(generated)),
            currentEligibleGoals: count(selected),
            currentGoalsOutsideAnchors: count(selected) - g.total,
            missingAnchors: anchors.filter(
              (id) => !selected.some((q) => q.knowledgeId === id),
            ),
          };
        }),
      },
    };
  })
  .sort((a, b) => a.goals - b.goals);
const uniqueGoals = new Map(all.map((q) => [q.knowledgeId, q]));
const sourceGroups = ["film", "awards", "actors"].map((source) => {
  const qs = all.filter((q) => questionSourceOf(q) === source);
  return { source, questions: qs.length, goals: count(qs) };
});
const sharedGoals = [...uniqueGoals.keys()].filter(
  (id) =>
    new Set(all.filter((q) => q.knowledgeId === id).map(questionSourceOf))
      .size > 1,
);
const countries = [...new Set(filmRows.flatMap((f) => f.countries))]
  .map((country) => ({
    country,
    films: filmRows.filter((f) => f.countries.includes(country)).length,
  }))
  .sort((a, b) => b.films - a.films);
const decades = [...new Set(filmRows.map((f) => Math.floor(f.year / 10) * 10))]
  .sort()
  .map((decade) => ({
    decade,
    films: filmRows.filter((f) => Math.floor(f.year / 10) * 10 === decade)
      .length,
  }));
const checks = {
  duplicateQuestionIds: all.length - new Set(all.map((q) => q.id)).size,
  rejectedImports: state.imports.reduce((n, r) => n + r.rejected, 0),
  duplicateImports: state.imports.reduce((n, r) => n + r.duplicates, 0),
  unclassifiedFilmQuestions: film.filter((q) => !familiarityOf(q)).length,
  missingFilmFacts: filmRows
    .filter((f) => !f.countries.length || !f.directors)
    .map((f) => f.film),
  missingJourneyAnchors: genres.flatMap((g) =>
    g.journey.groups.flatMap((x) => x.missingAnchors),
  ),
  conflictingFilmFamiliarity: [...byFilm]
    .filter(([, qs]) => new Set(qs.map(familiarityOf)).size !== 1)
    .map(([k]) => k),
  goalsAcrossGenres: [...new Set(film.map((q) => q.knowledgeId))].filter(
    (id) =>
      new Set(film.filter((q) => q.knowledgeId === id).map(genreOf)).size > 1,
  ),
};
if (
  Object.values(checks).some((v) => (Array.isArray(v) ? v.length > 0 : v !== 0))
)
  throw new Error(JSON.stringify(checks));
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const report = {
  asOf: "2026-10-04",
  generatedAt: new Date().toISOString(),
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  sourceBranch: execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
  }).trim(),
  scope:
    "Current local official catalog assembled with addPackages, category overlays and addFilmFacts. Only questionSourceOf=film enters genre/familiarity coverage. No player data or live production read.",
  definitions: {
    film: "Original title plus release year; remake/sequel identities stay separate.",
    goal: "Distinct knowledge_id; question variants give no extra coverage.",
    contentGoal:
      "Goal whose question has no metadata.fact_kind (excludes generated year/director questions; manually authored CSV year/director questions remain content).",
    familiarity:
      "Editorial estimate for broad German-speaking cinema audience, not measured public awareness.",
    countries:
      "Production countries as currently stored; co-productions count in every listed country, so country totals are not additive.",
    fullyCoveredFilm:
      "At least one non-generated goal at each of leicht/mittel/schwer within the film question area; quantity check, not a pedagogical/factual audit.",
  },
  inputHashes: [
    ...packages.map((p, i) => ({
      path: `public${p.path}`,
      sha256: hash(inputs[i].text),
    })),
    ...[
      ...readdirSync("src")
        .filter((name) => /\.(ts|json)$/.test(name))
        .sort()
        .map((name) => `src/${name}`),
      "KI-Wissen-Wissensquiz/01 Rohquellen/Alle_Genres_120_Filme_Filmdaten.json",
      "KI-Wissen-Wissensquiz/01 Rohquellen/Classics_Zuordnungen_Bestand.json",
      "KI-Wissen-Wissensquiz/01 Rohquellen/Arthouse_Zuordnungen_Bestand.json",
    ].map((path) => ({ path, sha256: hash(readFileSync(path, "utf8")) })),
  ],
  checks,
  totalCatalog: {
    questions: all.length,
    goals: uniqueGoals.size,
    variantsBeyondGoals: all.length - uniqueGoals.size,
    sourceGroups,
    goalsSharedAcrossSources: sharedGoals,
  },
  filmArea: stats(film),
  genres,
  categories: ["Classics", "Arthouse"].map((category) => ({
    category,
    ...stats(
      film.filter((q) => isCategory(q, category as "Classics" | "Arthouse")),
    ),
  })),
  regions: {
    countries,
    decades,
    filmsWithUSA: filmRows.filter((f) => f.countries.includes("USA")).length,
    filmsWithoutUSA: filmRows.filter((f) => !f.countries.includes("USA"))
      .length,
  },
  films: filmRows,
};
writeFileSync(
  "docs/Filmabdeckung-2026-10-04.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { ...report, inputHashes: undefined, films: undefined },
    null,
    2,
  ),
);

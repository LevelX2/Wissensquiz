import { existsSync, readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { filmData, addFilmFacts } from "../src/filmFacts";
import { filmIdentity, familiarityOf } from "../src/familiarity";
import { genreOf, questionSourceOf } from "../src/filters";
import films from "../docs/Genres-100-2026-10-08/Filmdaten.json";
import { catalogCounts } from "./catalog-counts";

const contents = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const before = emptyState();
addPackages(
  before,
  contents.filter((p) => !p.filename.startsWith("Genre100_")),
);
const state = structuredClone(before);
addPackages(state, contents);
const newQuestions = state.questions.filter((q) => q.id.startsWith("G100-"));

it("ergänzt die abgenommenen Genres konfliktfrei und erhält den gesamten vorherigen Fragenbestand", () => {
  expect(before.questions).toHaveLength(10877);
  expect(state.questions).toHaveLength(catalogCounts.questions);
  expect(state.imports).toHaveLength(catalogCounts.packages);
  expect(new Set(state.questions.map((q) => q.knowledgeId)).size).toBe(
    catalogCounts.goals,
  );
  expect(state.questions.slice(0, before.questions.length)).toEqual(
    before.questions,
  );
  expect(new Set(state.questions.map((q) => q.id)).size).toBe(
    state.questions.length,
  );
  for (const report of state.imports.slice(before.imports.length)) {
    expect(report.rejected).toBe(0);
    expect(report.duplicates).toBe(0);
    expect(report.issues).toEqual([]);
    expect(report.warnings).toEqual([]);
  }
  const snapshot = structuredClone(state);
  addPackages(state, contents);
  addFilmFacts(state.questions);
  expect(state).toEqual(snapshot);
});

it("liefert je neuer Filmfassung sechs Inhaltsziele und explizites Jahres- und Regiewissen ohne zusätzliche Generatorfragen", () => {
  expect(newQuestions).toHaveLength(films.films.length * 8);
  const oldFilms = new Set(
    before.questions
      .filter((q) => questionSourceOf(q) === "film")
      .map(filmIdentity),
  );
  for (const film of films.films) {
    const key = `${film.film_title_original}|${film.film_year}`;
    expect(oldFilms.has(key), key).toBe(false);
    const group = newQuestions.filter((q) => filmIdentity(q) === key);
    expect(group, key).toHaveLength(8);
    expect(new Set(group.map((q) => q.knowledgeId)).size, key).toBe(8);
    for (const difficulty of ["leicht", "mittel", "schwer"]) {
      expect(
        group.filter(
          (q) =>
            q.difficulty === difficulty &&
            !["Filmjahr", "Regie"].includes(q.metadata.question_type),
        ),
        key,
      ).toHaveLength(2);
    }
    const year = group.find((q) => q.id === film.year_question_id)!;
    const director = group.find((q) => q.id === film.director_question_id)!;
    expect(year.answers.find((a) => a.id === year.correctId)?.text).toBe(
      String(film.film_year),
    );
    expect(year.question).not.toContain(String(film.film_year));
    const team =
      film.directors.length === 1
        ? film.directors[0]
        : `${film.directors.slice(0, -1).join(", ")} und ${film.directors.at(-1)}`;
    expect(
      director.answers.find((a) => a.id === director.correctId)?.text,
    ).toBe(team);
    for (const name of film.directors)
      expect(director.question).not.toContain(name);
    for (const q of group) {
      expect(questionSourceOf(q)).toBe("film");
      expect(genreOf(q)).toBe(film.subdomain);
      expect(familiarityOf(q)).toBe(film.familiarity_level);
      expect(filmData(q)).toMatchObject({
        originalTitle: film.film_title_original,
        year: film.film_year,
        directors: team,
        countries: film.production_countries,
      });
      expect(q.answers.every((a) => a.feedback.trim())).toBe(true);
      expect(q.sources.length).toBeGreaterThan(0);
    }
  }
});

it("verknüpft notwendige Bestandsvarianten mit dem vorhandenen Wissensziel", () => {
  for (const q of newQuestions.filter((q) => q.metadata.variant_of)) {
    const target = state.questions.find(
      (old) => old.id === q.metadata.variant_of,
    );
    expect(target, q.id).toBeDefined();
    expect(q.knowledgeId, q.id).toBe(target!.knowledgeId);
  }
});

const root = "docs/Genres-100-2026-10-08";
for (const directory of readdirSync(root, { withFileTypes: true }).filter(
  (entry) =>
    entry.isDirectory() && existsSync(`${root}/${entry.name}/Filmdaten.json`),
)) {
  const folder = `${root}/${directory.name}`;
  const selection = JSON.parse(readFileSync(`${folder}/Auswahl.json`, "utf8"));
  const core = JSON.parse(
    readFileSync(`${folder}/Klassikerkern.json`, "utf8"),
  ) as {
    films: { film: string; title: string; question_ids: string[] }[];
  };
  it(`erreicht 100 Filme und den Klassikerkern für ${selection.genre}; öffentliche und erhaltene Rohquelle sind identisch`, () => {
    const questions = state.questions.filter(
      (q) => questionSourceOf(q) === "film" && genreOf(q) === selection.genre,
    );
    const keys = new Set(questions.map(filmIdentity));
    expect(keys.size).toBe(100);
    const previous = before.questions.filter(
      (q) => questionSourceOf(q) === "film" && genreOf(q) === selection.genre,
    );
    expect(questions).toHaveLength(
      previous.length + selection.films.length * 8,
    );
    expect(core.films).toHaveLength(20);
    for (const film of core.films) {
      const filmQuestions = state.questions.filter(
        (q) => questionSourceOf(q) === "film" && filmIdentity(q) === film.film,
      );
      expect(filmQuestions.length, film.title).toBeGreaterThan(0);
      expect(film.question_ids.length, film.title).toBeGreaterThan(0);
      for (const id of film.question_ids)
        expect(
          filmQuestions.some((q) => q.id === id),
          id,
        ).toBe(true);
    }
    const filename = `Genre100_${directory.name}_20261008.csv`;
    const pkg = packages.find((p) => p.filename === filename)!;
    expect(pkg, filename).toBeDefined();
    const publicFile = readFileSync(`public${pkg.path}`);
    expect(publicFile.equals(readFileSync(`${folder}/${filename}`))).toBe(true);
    expect(
      publicFile.equals(
        readFileSync(`KI-Wissen-Wissensquiz/01 Rohquellen/${filename}`),
      ),
    ).toBe(true);
  });
}

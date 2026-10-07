import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { addPackages, packages } from "../src/packages";
import {
  emptyState,
  type QuizFilters,
  type QuestionSource,
} from "../src/model";
import {
  difficulties,
  matchesFilters,
  questionSourceOf,
  genreOf,
  canonicalFilters,
} from "../src/filters";
import { selectionTopic, matchesTopic, isClassic } from "../src/categories";
import { selectQuestions, startRound, recordKey } from "../src/engine";
import { validateBackup } from "../src/storage";
import { readRoundSetup } from "../src/roundSetup";
import { decodeCloudState, encodeCloudState } from "../src/cloudCodec";
import { genreSelection } from "../src/leaderboard";
const catalog = emptyState();
addPackages(
  catalog,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  })),
);
const all: QuizFilters = {
  sources: ["film", "awards", "actors"],
  genres: [...new Set(catalog.questions.map(genreOf))],
  difficulties: [...difficulties],
  familiarities: [1, 2, 3, 4],
};
const now = Date.parse("2026-10-03T12:00:00+02:00");
it("vereint alle Film-, Preis- und Personenfragen ohne Kategorien als Einschränkung", () => {
  const topic = selectionTopic([], all.sources!);
  const pool = catalog.questions.filter(
    (q) => matchesTopic(q, topic) && matchesFilters(q, all),
  );
  expect(pool).toHaveLength(8397);
  expect(pool.filter((q) => questionSourceOf(q) === "film")).toHaveLength(6597);
  expect(pool.filter((q) => questionSourceOf(q) === "awards")).toHaveLength(
    200,
  );
  expect(pool.filter((q) => questionSourceOf(q) === "actors")).toHaveLength(
    1600,
  );
  const drawn = selectQuestions(
    pool,
    {},
    {
      mode: "ueben",
      topic,
      difficulty: "Alle Stufen",
      filters: all,
      size: 8000,
      now,
    },
    () => 0.5,
  );
  expect(drawn).toHaveLength(7853);
  expect(new Set(drawn.map((q) => q.knowledgeId)).size).toBe(drawn.length);
});
it("wendet Genre, Classics und Filmgruppen nur auf Filmfragen und die Schwierigkeit auf alle Bereiche an", () => {
  const filters: QuizFilters = {
    ...all,
    genres: ["Science-Fiction"],
    familiarities: [],
    difficulties: ["leicht"],
  };
  const topic = selectionTopic(["Classics"], filters.sources!);
  const pool = catalog.questions.filter(
    (q) => matchesTopic(q, topic) && matchesFilters(q, filters),
  );
  expect(pool.filter((q) => questionSourceOf(q) === "film")).toHaveLength(0);
  expect(pool.filter((q) => questionSourceOf(q) === "awards")).toHaveLength(50);
  expect(pool.filter((q) => questionSourceOf(q) === "actors")).toHaveLength(
    454,
  );
  filters.familiarities = [1, 2, 3, 4];
  const withFilms = catalog.questions.filter(
    (q) => matchesTopic(q, topic) && matchesFilters(q, filters),
  );
  expect(
    withFilms
      .filter((q) => questionSourceOf(q) === "film")
      .every((q) => isClassic(q) && genreOf(q) === "Science-Fiction"),
  ).toBe(true);
  expect(withFilms.length).toBeGreaterThan(pool.length);
});
it("nimmt zusätzliches Wissen wirklich in die zufällige Runde auf und zieht jedes Ziel einmal", () => {
  const subset = (["film", "awards", "actors"] as const).flatMap((source) =>
    catalog.questions
      .filter((q) => questionSourceOf(q) === source && !q.metadata.variant_of)
      .slice(0, 2),
  );
  const selected = selectQuestions(
    subset,
    {},
    {
      mode: "rekord",
      topic: selectionTopic([], all.sources!),
      difficulty: "Alle Stufen",
      filters: all,
      size: 5,
      now,
    },
    () => 0.31,
  );
  expect(selected).toHaveLength(5);
  expect(new Set(selected.map(questionSourceOf))).toEqual(
    new Set(["film", "awards", "actors"]),
  );
  expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(5);
});
it("sichert reine Zusatzbereiche ohne Filmgenres und ignoriert deren Filmgruppen in JSON und Kontokompaktsicherung", async () => {
  for (const sources of [
    ["actors"],
    ["awards"],
    ["awards", "actors"],
  ] as QuestionSource[][]) {
    const state = emptyState(
      sources.flatMap((source) =>
        catalog.questions
          .filter(
            (q) => questionSourceOf(q) === source && q.difficulty === "experte",
          )
          .slice(0, 3),
      ),
    );
    state.settings.roundSetup = {
      mode: "ueben",
      genres: [],
      categories: [],
      difficulties: ["experte"],
      familiarities: [],
      sources,
    };
    const round = startRound(
      state,
      {
        mode: "ueben",
        topic: selectionTopic([], sources),
        difficulty: "Alle Stufen",
        filters: {
          genres: [],
          sources,
          difficulties: ["experte"],
          familiarities: [],
        },
      },
      now,
    );
    expect(round.questions).toHaveLength(Math.min(5, sources.length * 3));
    expect(
      round.questions.every(
        (q) =>
          sources.includes(questionSourceOf(q)) && q.difficulty === "experte",
      ),
    ).toBe(true);
    expect(round.filters?.genres).toEqual([]);
    expect(round.filters?.familiarities).toBeUndefined();
    for (const restored of [
      validateBackup(JSON.parse(JSON.stringify(state))),
      validateBackup(await decodeCloudState(await encodeCloudState(state))),
    ]) {
      expect(restored.settings).toEqual(state.settings);
      expect(restored.rounds).toEqual(state.rounds);
      expect(restored.questions).toEqual(state.questions);
      expect(restored.learning).toEqual(state.learning);
    }
    const corrupted = structuredClone(state);
    corrupted.rounds[0].filters!.sources = ["film"];
    expect(() => validateBackup(corrupted)).toThrow();
  }
});
it("erhält alte Nur-Auswahlen beim Lesen und speichert neue additive Einstellungen eindeutig", () => {
  const state = emptyState();
  state.settings.roundSetup = {
    mode: "ueben",
    genres: null,
    categories: ["Schauspieler", "Preisträger"],
    difficulties: ["leicht"],
  };
  const unchanged = structuredClone(state);
  expect(readRoundSetup(state)).toMatchObject({
    sources: ["awards", "actors"],
    categories: [],
  });
  expect(state).toEqual(unchanged);
  state.settings.roundSetup.categories.push("Classics");
  expect(readRoundSetup(state)).toMatchObject({
    sources: ["film", "awards", "actors"],
    categories: ["Classics"],
  });
  state.settings.roundSetup.sources = ["actors", "film", "actors"];
  expect(readRoundSetup(state).sources).toEqual(["film", "actors"]);
});
it("trennt gemischte Rekorde und lässt in reinen Personenrunden irrelevante Filmfilter weg", () => {
  const state = emptyState(catalog.questions);
  const options = {
    mode: "rekord" as const,
    topic: "Schauspieler",
    difficulty: "Alle Stufen",
    filters: { ...all, sources: ["actors"] as QuestionSource[] },
  };
  const round = startRound(state, options, now);
  const equivalent = {
    ...round,
    filters: canonicalFilters({
      ...options.filters,
      genres: [],
      familiarities: [],
    }),
  };
  expect(recordKey(equivalent)).toBe(recordKey(round));
  expect(genreSelection(round)).toEqual(["Schauspieler"]);
  const mixed = {
    ...round,
    topic: selectionTopic([], all.sources!),
    filters: canonicalFilters(all),
  };
  expect(recordKey(mixed)).not.toBe(recordKey(round));
  expect(genreSelection(mixed)).toContain("Preisträger");
  expect(genreSelection(mixed)).toContain("Schauspieler");
});

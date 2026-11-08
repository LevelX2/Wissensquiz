import { afterAll, beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import { matchesFilters } from "../src/filters";
import type { Question, QuizFilters } from "../src/model";

let fixture: Awaited<ReturnType<typeof syncFixture>>;
let questions: Question[];
beforeAll(async () => {
  fixture = await syncFixture();
  const base = importCsv(readFileSync("tests/fixtures/demo-fragen.csv", "utf8"))
    .questions[0];
  const film = {
    type: "film" as const,
    originalTitle: "Testfilm",
    year: 2000,
    genres: ["Science-Fiction"],
    techniques: ["animation" as const],
    collections: ["Classics" as const],
  };
  const series = {
    type: "series" as const,
    originalTitle: "Testserie",
    year: 2000,
    genres: ["Fantasy"],
    techniques: ["live-action" as const],
  };
  const make = (
    id: string,
    works: NonNullable<Question["works"]>,
    source: "film" | "actors" | "awards",
  ): Question => ({
    ...base,
    id,
    knowledgeId: `K-${id}`,
    works,
    metadata: {
      ...base.metadata,
      person_id: source === "actors" ? "test-person" : "",
    },
    tags: source === "awards" ? ["Preisträger"] : [],
  });
  const release = await prepareTestContent([
    make("F", [film], "film"),
    make("S", [series], "film"),
    make("A", [film, series], "actors"),
    make("G", [], "actors"),
    make("P", [film, series], "awards"),
  ]);
  questions = release.questions;
  await fixture.seedRanked(release);
}, 30000);
afterAll(() => fixture?.db.close());

it("liefert dieselbe Werk-/Genre-/Machartauswahl lokal und im tatsächlichen SQL-Pfad", async () => {
  const broad: QuizFilters = {
    genres: null,
    sources: ["film", "actors", "awards"],
    difficulties: ["leicht", "mittel", "schwer", "experte"],
  };
  const cases: QuizFilters[] = [
    broad,
    { ...broad, genres: ["Fantasy"], workTypes: ["series"] },
    { ...broad, genres: ["Science-Fiction"], workTypes: ["series"] },
    {
      ...broad,
      genres: ["Fantasy", "Science-Fiction"],
      workTypes: ["series"],
      techniques: ["animation"],
    },
    { ...broad, workTypes: [] },
    { ...broad, genres: [] },
    { ...broad, sources: ["actors"] },
    { ...broad, collections: ["Classics"] },
    { ...broad, genres: ["Fantasy"], collections: ["Classics"] },
  ];
  for (const filters of cases) {
    const result = await fixture.db.query<{ id: string }>(
      "select m.id from quiz_game_internal.catalog_meta m where quiz_game_internal.matches(m,$1::jsonb,'Alle Themen') order by m.id",
      [JSON.stringify(filters)],
    );
    expect(
      result.rows.map((row) => row.id),
      JSON.stringify(filters),
    ).toEqual(
      questions
        .filter((q) => matchesFilters(q, filters))
        .map((q) => q.id)
        .sort(),
    );
  }
});

it("gibt Werkarten und Macharten als aktuelle Inhaltsattribute aus", async () => {
  const result = await fixture.db.query<{
    value: { workTypes: string[]; techniques: string[] };
  }>("select value from quiz_game_internal.content_info");
  expect(result.rows[0].value.workTypes).toEqual(["film", "series"]);
  expect(result.rows[0].value.techniques).toEqual(["animation", "live-action"]);
});

it("belässt neue Werkfunktionen privat mit Aufruferrechten und leerem Suchpfad", async () => {
  const result = await fixture.db.query<{
    proname: string;
    elevated: boolean;
    anon_execute: boolean;
    authenticated_execute: boolean;
    proconfig: string[];
  }>(
    `select p.proname,p.prosecdef elevated,p.proconfig,
      has_function_privilege('anon',p.oid,'EXECUTE') anon_execute,
      has_function_privilege('authenticated',p.oid,'EXECUTE') authenticated_execute
     from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='quiz_game_internal' and p.proname in ('work_references','matches_work')`,
  );
  expect(result.rows).toHaveLength(2);
  for (const row of result.rows) {
    expect(row.elevated).toBe(false);
    expect(row.anon_execute).toBe(false);
    expect(row.authenticated_execute).toBe(false);
    expect(row.proconfig).toContain('search_path=""');
  }
});

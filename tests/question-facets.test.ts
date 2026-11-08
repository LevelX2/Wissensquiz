import { afterAll, beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { importCsv } from "../src/importer";
import { questionFacets, questionFacetLabels } from "../src/questionFacets";
import { QuestionFacets } from "../src/QuestionAssignments";
import { prepareTestContent } from "./helpers/test-content";
import { syncFixture } from "./helpers/sync-fixture";
import { preparePresentation } from "../src/questionPresentation";
import type { Question } from "../src/model";

const base = importCsv(readFileSync("tests/fixtures/demo-fragen.csv", "utf8"))
  .questions[0];
const question: Question = {
  ...base,
  id: "SERIES-FACETS",
  knowledgeId: "SERIES-GOAL",
  metadata: { person_id: "person", subdomain: "Science-Fiction" },
  answers: base.answers.map((answer, i) => ({ ...answer, text: `Name ${i}` })),
  works: [
    {
      type: "series",
      originalTitle: "Geheimer Werktitel",
      year: 1997,
      season: 2,
      episode: 3,
      genres: ["Fantasy", "Science-Fiction"],
      techniques: ["animation"],
      collections: ["Classics"],
      familiarity: 1,
    },
  ],
};
it("zeigt mehrere Zuordnungen stabil, beschriftet und ohne doppelte Symbole", () => {
  expect(questionFacetLabels(question)).toEqual([
    "Serie",
    "Fantasy",
    "Science-Fiction",
    "Schauspieler",
    "Animation",
    "Classics",
  ]);
  const html = renderToStaticMarkup(
    createElement(QuestionFacets, { question }),
  );
  expect(html).toContain('aria-label="Zuordnungen"');
  for (const label of [
    "Serie",
    "Fantasy",
    "Sci-Fi",
    "Schauspieler",
    "Animation",
    "Classics",
  ])
    expect(html).toContain(label);
  expect(html).not.toContain("Geheimer Werktitel");
  expect(html).not.toContain("1997");
  expect((html.match(/<img /g) ?? []).length).toBe(6);
  expect(html).toContain("genre-series-");
  expect(html).toContain("genre-animation-");
  expect(html).not.toContain("<svg");
});
it("blendet die jeweilige Merkmalsfamilie aus, wenn Antwortoptionen danach fragen", () => {
  const q = {
    ...question,
    answers: question.answers.map((a, i) => ({
      ...a,
      text: ["Fantasy", "Animationsfilm", "Classics", "Serie"][i],
    })),
  };
  expect(questionFacets(q)).toEqual({
    workTypes: [],
    genres: [],
    techniques: [],
    collections: [],
  });
});

let fixture: Awaited<ReturnType<typeof syncFixture>>;
beforeAll(async () => {
  fixture = await syncFixture();
  await fixture.seedRanked(await prepareTestContent([question]));
}, 30000);
afterAll(() => fixture?.db.close());
it("liefert dieselbe sichere Taxonomie im echten unbeantworteten Serverobjekt ohne Werklösung", async () => {
  const visible = (
    await fixture.db.query<{ q: Record<string, unknown> }>(
      "select quiz_ranked_internal.visible(public.quiz_year_question(question)) q from quiz_ranked_internal.catalog where id=$1",
      [question.id],
    )
  ).rows[0].q;
  expect(visible.facets).toEqual(questionFacets(question));
  expect(visible).not.toHaveProperty("works");
  expect(visible).not.toHaveProperty("correctId");
  expect(visible).not.toHaveProperty("presentation");
  expect(JSON.stringify(visible)).not.toContain("Geheimer Werktitel");
  expect(preparePresentation(question).facets).toEqual(visible.facets);
});

import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { actorTmdbUrl } from "../src/actorTmdb";
import links from "../src/actorTmdbLinks.json";
import { Explanation } from "../src/Explanation";
import { ActorPortrait } from "../src/ActorPortrait";
import { importCsv } from "../src/importer";
import type { AnswerEvent } from "../src/model";
import { packages } from "../src/packages";

const questions = packages.flatMap(
  (pkg) =>
    importCsv(readFileSync(`public${pkg.path}`, "utf8"), [], pkg.filename)
      .questions,
);
const actors = questions.filter((q) => q.metadata.person_id);
const hanks = actors.find((q) => q.metadata.person_name === "Tom Hanks")!;

it("verlinkt alle 220 Personen in sämtlichen offiziellen Schauspielerfragen einschließlich Bilderkennung", () => {
  expect(new Set(actors.map((q) => q.metadata.person_id)).size).toBe(220);
  expect(Object.keys(links)).toHaveLength(220);
  expect(actors.some((q) => q.metadata.question_image_id)).toBe(true);
  for (const q of actors) {
    expect(actorTmdbUrl(q), q.id).toMatch(
      /^https:\/\/www\.themoviedb\.org\/person\/[1-9][0-9]*$/,
    );
  }
  expect(actorTmdbUrl(hanks)).toBe("https://www.themoviedb.org/person/31");
  expect(new Set(Object.values(links).map((p) => p.tmdbId)).size).toBe(220);
});

it("vermeidet falsche Links bei unbekannten Personen oder abweichendem Namen und bei Film-/Preisfragen", () => {
  for (const q of questions.filter((q) => !q.metadata.person_id))
    expect(actorTmdbUrl(q), q.id).toBeUndefined();
  const metadataCases: Record<string, string>[] = [
    { person_id: "unknown", person_name: "Tom Hanks" },
    { person_id: hanks.metadata.person_id, person_name: "Eigene Person" },
    { person_name: "Tom Hanks" },
    { person_id: "constructor", person_name: "constructor" },
  ];
  for (const metadata of metadataCases)
    expect(actorTmdbUrl({ ...hanks, metadata })).toBeUndefined();
});

it("zeigt den direkten Personenlink mit neuem Tab in der gemeinsamen Auflösung", () => {
  const event = {
    id: "tmdb-test",
    answerId: hanks.correctId,
    correct: true,
  } as AnswerEvent;
  const html = renderToStaticMarkup(
    createElement(Explanation, { q: hanks, event }),
  );
  expect(html).toContain(
    '<a href="https://www.themoviedb.org/person/31" target="_blank" rel="noreferrer">Tom Hanks auf TMDB ↗</a>',
  );
  const recognition = actors.find((q) => q.metadata.question_image_id)!;
  const recognitionHtml = renderToStaticMarkup(
    createElement(Explanation, { q: recognition, event }),
  );
  expect(recognitionHtml).toContain(`href="${actorTmdbUrl(recognition)}"`);
  expect(
    renderToStaticMarkup(
      createElement(ActorPortrait, { q: recognition, beforeAnswer: true }),
    ),
  ).not.toContain("themoviedb.org/person/");
  const film = questions.find((q) => !q.metadata.person_id)!;
  expect(
    renderToStaticMarkup(createElement(Explanation, { q: film, event })),
  ).not.toContain("auf TMDB");
});

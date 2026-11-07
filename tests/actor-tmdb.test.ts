import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { actorTmdbUrl } from "../src/actorTmdb";
import links from "../src/actorTmdbLinks.json";
import { Explanation } from "../src/Explanation";
import { ActorPortrait } from "../src/ActorPortrait";
import { emptyState } from "../src/model";
import type { AnswerEvent } from "../src/model";
import { addPackages, packages } from "../src/packages";
import { preparePresentation } from "../src/questionPresentation";

const state = emptyState();
addPackages(
  state,
  packages.map((pkg) => ({
    filename: pkg.filename,
    text: readFileSync(`${pkg.path}`, "utf8"),
  })),
);
const questions = state.questions;
const actors = questions.filter((q) => q.metadata.person_id);
const hanks = actors.find((q) => q.metadata.person_name === "Tom Hanks")!;

it("verlinkt alle 428 Personen in sämtlichen offiziellen Schauspielerfragen einschließlich Bilderkennung", () => {
  expect(new Set(actors.map((q) => q.metadata.person_id)).size).toBe(428);
  expect(Object.keys(links)).toHaveLength(428);
  expect(actors.some((q) => q.metadata.question_image_id)).toBe(true);
  for (const q of actors) {
    expect(actorTmdbUrl(q), q.id).toMatch(
      /^https:\/\/www\.themoviedb\.org\/person\/[1-9][0-9]*$/,
    );
  }
  expect(actorTmdbUrl(hanks)).toBe("https://www.themoviedb.org/person/31");
  expect(new Set(Object.values(links).map((p) => p.tmdbId)).size).toBe(428);
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

it("verlinkt das Porträt zur Person ohne einen doppelten Link am Namen", () => {
  const event = {
    id: "tmdb-test",
    answerId: hanks.correctId,
    correct: true,
  } as AnswerEvent;
  const html = renderToStaticMarkup(
    createElement(Explanation, { q: hanks, event }),
  );
  expect(html).toContain("<strong>Tom Hanks</strong>");
  expect(html).not.toContain("Tom Hanks auf TMDB");
  const original = actors.find((q) => q.metadata.question_image_id)!;
  const presentation = preparePresentation(original);
  const recognition = {
    ...original,
    presentation,
    image: presentation.portraits[0],
  };
  const recognitionHtml = renderToStaticMarkup(
    createElement(Explanation, { q: recognition, event }),
  );
  expect(recognitionHtml).toContain(`href="${actorTmdbUrl(recognition)}"`);
  expect(recognitionHtml).toContain('target="_blank" rel="noreferrer"');
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

it("zeigt hinterlegte historische Porträts statt eines allgemeinen TMDB-Porträts erst mit der Lösung", () => {
  const original = actors.find(
    (q) => q.metadata.person_id === "ACTOR-BG-20261013-001",
  )!;
  const q = { ...original, presentation: preparePresentation(original) };
  const portrait = q.presentation.portraits[0];
  expect(portrait.name).toBe("Peter Lorre");
  const event = {
    id: "historic",
    answerId: q.correctId,
    correct: true,
  } as AnswerEvent;
  const html = renderToStaticMarkup(createElement(Explanation, { q, event }));
  expect(html).toContain(portrait.src);
  expect(html).toContain(`href="${actorTmdbUrl(q)}"`);
  expect(html).toContain("Bildnachweis");
  expect(html).not.toContain("tmdb-portrait");
});

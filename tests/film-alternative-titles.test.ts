import { currentCsv } from "./helpers/current-content";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { importCsv } from "../src/importer";
import { emptyState, type Question } from "../src/model";
import { answer, startRound } from "../src/engine";
import { filmData } from "../src/filmFacts";
import { preparePresentation } from "../src/questionPresentation";
import { FilmAlternativeTitles } from "../src/FilmAlternativeTitles";
import { FilmDataPanel } from "../src/FilmDataPanel";
import { QuestionScreen } from "../src/QuestionScreen";
import { Explanation } from "../src/Explanation";
import registry from "../src/filmAlternativeTitles.json";

const questions = importCsv(
  currentCsv({ film: "Xiao quan guai zhao|1979", limit: 0 }),
).questions.filter(
  (q) => q.metadata.film_title_original === "Xiao quan guai zhao",
);
const prepared = (q: Question): Question => ({
  ...q,
  presentation: preparePresentation(q),
});
const question = prepared(questions[0]);
const renderHint = (q: Question) =>
  renderToStaticMarkup(createElement(FilmAlternativeTitles, { q }));

it("ordnet die geprüften Titel allen acht Fragen derselben Filmfassung mit Quellen zu", () => {
  expect(questions).toHaveLength(8);
  for (const q of questions) {
    const original = structuredClone(q);
    const data = preparePresentation(q).films[0].data;
    expect(data.alternativeTitles).toEqual(
      registry["Xiao quan guai zhao|1979"].titles,
    );
    expect(data.sources).toEqual(
      expect.arrayContaining(registry["Xiao quan guai zhao|1979"].sources),
    );
    expect(data.series?.position).toBe(1);
    expect(q).toEqual(original);
  }
});

it("ergänzt nur die belegte Fassung und liefert Titel auch für Filmverweise", () => {
  expect(
    filmData({
      ...question,
      metadata: { ...question.metadata, film_year: "1983" },
    }),
  ).toBeUndefined();
  const person = { ...question, metadata: { person_id: "actor" } };
  expect(filmData(person)).toBeUndefined();
  expect(
    filmData(person, "Xiao quan guai zhao|1979")?.alternativeTitles,
  ).toEqual(question.presentation!.films[0].data.alternativeTitles);
  expect(renderHint(person)).toBe("");
  expect(renderHint({ ...question, presentation: undefined })).toBe("");
});

it("zeigt vor der Antwort genau den ausgewählten Zweittitel unter der Frage", () => {
  const state = emptyState([question]);
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1700000000000,
  );
  const html = renderToStaticMarkup(
    createElement(QuestionScreen, {
      round,
      index: 0,
      state,
      mutate: async () => null,
      busy: false,
      onExit: () => {},
      onNext: () => {},
    }),
  );
  expect(html).toContain('class="film-alternative-titles"');
  expect(html).toContain("Auch bekannt als „Superfighter 3“");
  expect(html).not.toContain("The Fearless Hyena");
  expect(html).not.toContain("Der Superfighter III");
  expect(html.indexOf('class="film-alternative-titles"')).toBeGreaterThan(
    html.indexOf("</h1>"),
  );
  expect(html.indexOf('class="film-alternative-titles"')).toBeLessThan(
    html.indexOf('class="answers"'),
  );
});

it("zeigt ohne redaktionell ausgewählten Titel keinen Hinweis", () => {
  const q = structuredClone(question);
  for (const title of q.presentation!.films[0].data.alternativeTitles!) {
    delete title.showInQuestion;
  }
  expect(renderHint(q)).toBe("");
});

it("verrät bei Titel-, Preis- oder Bilderfragen ohne genannten Filmtitel keine Zuordnung", () => {
  for (const text of [
    "Wie heißt dieser Film?",
    "Welcher Film gewann den Preis?",
    "Aus welchem Film stammt das Bild?",
  ]) {
    const q = { ...question, question: text };
    expect(renderHint(q)).toBe("");
  }
});

it("unterdrückt den Hinweis auch bei einer Titelantwort und lösungsverratenden Namen oder Zahlen", () => {
  for (const text of [
    "Superfighter 3",
    "The Fearless Hyena",
    "Zwei Schlitzohren in der Knochenmühle",
    "3",
  ]) {
    const q = {
      ...question,
      answers: question.answers.map((a, i) => (i === 0 ? { ...a, text } : a)),
    };
    expect(renderHint(q), text).toBe("");
  }
  const q = structuredClone(question);
  q.presentation!.films[0].data.alternativeTitles!.push({
    title: "Jackie Chan – Superfighter 3",
    kind: "de",
  });
  q.answers[0].text = "Jackie Chan";
  expect(renderHint(q)).toBe("");
});

it("führt die belegten Titel nach der Antwort in den aufklappbaren Filmdaten", () => {
  const state = emptyState([question]);
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1700000000000,
  );
  answer(
    state,
    round.id,
    question.id,
    question.correctId,
    1000,
    1700000001000,
    0,
  );
  const html = renderToStaticMarkup(
    createElement(Explanation, { q: question, event: state.events[0] }),
  );
  expect(html).not.toContain("Auch bekannt als");
  expect(html).toContain('<details class="film-data">');
  const data = renderToStaticMarkup(
    createElement(FilmDataPanel, { q: question }),
  );
  expect(data).toContain("Weitere Titel");
  expect(data).toContain("Deutscher Alternativtitel");
  expect(data).toContain("Internationaler Titel");
  expect(data).toContain("Superfighter 3");
  expect(data).toContain("Der Superfighter III");
  expect(data).toContain("The Fearless Hyena");
  expect(
    html.slice(html.indexOf('<details class="answer-sources">')),
  ).toContain(
    registry["Xiao quan guai zhao|1979"].sources[0].replaceAll("&", "&amp;"),
  );
});

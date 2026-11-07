import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { questionSourceOf } from "../src/filters";
import { familiarityOf } from "../src/familiarity";
import { filmData } from "../src/filmFacts";
import { startRound, answer, complete } from "../src/engine";
import { validateBackup } from "../src/backupValidation";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { preparePresentation } from "../src/questionPresentation";
import { QuestionScreen } from "../src/QuestionScreen";
import { FilmDataPanel } from "../src/FilmDataPanel";

const inputs = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(p.path, "utf8"),
}));
const state = emptyState();
addPackages(state, inputs);
const questions = state.questions.filter(
  (q) => questionSourceOf(q) === "awards",
);

it("führt sämtliche Preisfragen mit vier eindeutigen Antworten, Quellen und allen vier Schwierigkeiten", () => {
  expect(questions.length).toBeGreaterThanOrEqual(380);
  expect(new Set(questions.map((q) => q.difficulty))).toEqual(
    new Set(["leicht", "mittel", "schwer", "experte"]),
  );
  for (const q of questions) {
    expect(q.metadata.person_id ?? "").toBe("");
    expect(q.tags).toContain("Preisträger");
    expect(q.badgeTags).toContain("Preisträger");
    expect(new Set(q.answers.map((a) => a.text)).size, q.id).toBe(4);
    expect(
      q.answers.filter((a) => a.id === q.correctId),
      q.id,
    ).toHaveLength(1);
    expect(q.context.length, q.id).toBeGreaterThan(50);
    expect(
      q.sources.some((url) =>
        /oscars\.org|festival-cannes\.com|labiennale\.org/.test(url),
      ),
      q.id,
    ).toBe(true);
    expect(familiarityOf(q), q.id).toBeTruthy();
  }
});

const performanceQuestions = questions.filter((q) =>
  q.tags.includes("Darstellung"),
);

it("führt vielfältige Oscar-Darstellungsfragen ausschließlich bei Preisträger und teilt wiederverwendete Wissensziele", () => {
  expect(performanceQuestions.length).toBeGreaterThanOrEqual(100);
  expect(
    new Set(performanceQuestions.map((q) => q.metadata.question_type)).size,
  ).toBeGreaterThanOrEqual(15);
  for (const q of performanceQuestions) {
    expect(questionSourceOf(q), q.id).toBe("awards");
    expect(q.metadata.person_id ?? "", q.id).toBe("");
    expect(
      q.sources.some((url) =>
        /^https:\/\/www\.oscars\.org\/oscars\/ceremonies\/\d{4}$/.test(url),
      ),
      q.id,
    ).toBe(true);
    if (q.metadata.variant_of) {
      const target = state.questions.find(
        (other) => other.id === q.metadata.variant_of,
      )!;
      expect(target, q.id).toBeDefined();
      expect(q.knowledgeId, q.id).toBe(target.knowledgeId);
    }
  }
  expect(
    performanceQuestions.filter((q) => q.metadata.variant_of).length,
  ).toBeGreaterThanOrEqual(38);
});

it("hält bei allen Darstellungsfragen Filmdaten, Quellen und Lösungshinweise bis zur Antwort verborgen", () => {
  for (const raw of performanceQuestions) {
    const q = { ...raw, presentation: preparePresentation(raw) };
    const own = emptyState([q]);
    const round = startRound(
      own,
      { mode: "ueben", topic: "Preisträger", difficulty: "Alle Stufen" },
      1700000000000,
    );
    const html = renderToStaticMarkup(
      createElement(QuestionScreen, {
        round,
        index: 0,
        state: own,
        mutate: async () => null,
        busy: false,
        onExit: () => {},
        onNext: () => {},
      }),
    );
    expect(html, q.id).not.toContain('class="film-data"');
    expect(html, q.id).not.toContain('class="film-alternative-titles"');
    expect(html, q.id).not.toContain("oscars.org");
    const correct = q.answers.find((a) => a.id === q.correctId)!.text;
    const escaped = renderToStaticMarkup(
      createElement("span", null, correct),
    ).slice(6, -7);
    const answerStart = html.indexOf('class="answers"');
    expect(answerStart, q.id).toBeGreaterThan(0);
    expect(html.slice(0, answerStart), q.id).not.toContain(escaped);
  }
});

it("zeigt bei Preisverbindungen alle beteiligten Filmfassungen mit getrennten Jahren erst in den Filmdaten", () => {
  const connections = performanceQuestions.filter((q) => q.metadata.film_refs);
  expect(connections.length).toBeGreaterThanOrEqual(6);
  for (const q of connections) {
    const presentation = preparePresentation(q);
    const expected = q.metadata.film_refs.split(";");
    expect(
      presentation.films.map(
        ({ data }) => `${data.originalTitle}|${data.year}`,
      ),
      q.id,
    ).toEqual(expected);
    const html = renderToStaticMarkup(
      createElement(FilmDataPanel, { q: { ...q, presentation } }),
    );
    for (const { data } of presentation.films) {
      expect(data.directors, q.id).toBeTruthy();
      expect(data.countries.length, q.id).toBeGreaterThan(0);
      expect(html, q.id).toContain(String(data.year));
    }
  }
  const remakes = connections.find(
    (q) => q.metadata.film_refs === "West Side Story|1961;West Side Story|2021",
  )!;
  expect(
    preparePresentation(remakes).films.map(({ data }) => data.year),
  ).toEqual([1961, 2021]);
});

it("löst gemeinsam verwendete Filmdaten auch für Preisfragen nach ihrer Filmidentität auf", () => {
  for (const key of ["The Holdovers|2023", "Adaptation.|2002"]) {
    const q = performanceQuestions.find(
      (q) =>
        `${q.metadata.film_title_original}|${q.metadata.film_year}` === key,
    )!;
    const presentation = preparePresentation(q);
    expect(presentation.films, key).toHaveLength(1);
    expect(
      `${presentation.films[0].data.originalTitle}|${presentation.films[0].data.year}`,
    ).toBe(key);
  }
});

it("ordnet jeder Preisfrage die richtige Filmfassung mit vollständigen Eckdaten zu", () => {
  for (const q of questions) {
    const data = filmData(q)!;
    expect(data, q.id).toBeDefined();
    expect(data.originalTitle, q.id).toBe(q.metadata.film_title_original);
    expect(data.year, q.id).toBe(Number(q.metadata.film_year));
    expect(data.directors, q.id).toBeTruthy();
    expect(data.countries.length, q.id).toBeGreaterThan(0);
  }
});

it("spielt reine Preis-Expertenrunden ohne Filmgenre und erhält sie im Spielstand", () => {
  const own = structuredClone(state),
    now = Date.parse("2026-11-07T12:00:00+01:00");
  const round = startRound(
    own,
    {
      mode: "ueben",
      topic: "Preisträger",
      difficulty: "experte",
      filters: {
        sources: ["awards"],
        genres: [],
        difficulties: ["experte"],
        familiarities: [1, 2, 3, 4],
      },
    },
    now,
  );
  expect(round.questions).toHaveLength(10);
  expect(
    round.questions.every(
      (q) => questionSourceOf(q) === "awards" && q.difficulty === "experte",
    ),
  ).toBe(true);
  for (const q of round.questions)
    answer(own, round.id, q.id, q.correctId, 1000, now + 1000);
  complete(own, round.id, now + 2000);
  expect(() => validateBackup(JSON.parse(JSON.stringify(own)))).not.toThrow();
});

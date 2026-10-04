import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { importCsv } from "../src/importer";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { answer, complete, startRound } from "../src/engine";
import { filmData } from "../src/filmFacts";
import { filmIdentity, familiarityOf } from "../src/familiarity";
import {
  categories,
  categoryTopic,
  matchesCategories,
} from "../src/categories";
import { pathQuestions, learningPathProgress } from "../src/learningPath";
import { careerSummary } from "../src/career";
import { validateBackup } from "../src/storage";
import { decodeCloudState, encodeCloudState } from "../src/cloudCodec";
import sources from "../KI-Wissen-Wissensquiz/01 Rohquellen/Preistraeger_Quellennachweis.json";
import films from "../KI-Wissen-Wissensquiz/01 Rohquellen/Preistraeger_Filmdaten.json";
import {
  assertEditorialSource,
  editorialCsvIds,
  latestCsvRevision,
} from "./editorialSource";

// Keep this regression at the award package's original catalog stage.
const contents = packages
  .filter((p) => !p.filename.startsWith("Schauspieler_"))
  .map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  }));
const latest = contents.at(-1)!;
const imported = importCsv(latest.text, [], latest.filename);
const questions = imported.questions;
const now = Date.parse("2026-10-02T12:00:00+02:00");

it("importiert 200 belegte Preisfragen mit vier gleich großen Stufen und vollständiger Vertiefung", () => {
  expect(imported.report).toMatchObject({
    accepted: 200,
    rejected: 0,
    duplicates: 0,
    warnings: [],
    issues: [],
  });
  const raw = readFileSync(
    `KI-Wissen-Wissensquiz/01 Rohquellen/${latest.filename}`,
  );
  expect(
    assertEditorialSource(
      latest.text,
      raw.toString("utf8"),
      "public/preistraeger-fragen.csv",
    ).changes.sort(),
  ).toEqual(editorialCsvIds("public/preistraeger-fragen.csv").sort());
  expect(new Set(questions.map((q) => q.knowledgeId)).size).toBe(200);
  expect(new Set(questions.map(filmIdentity)).size).toBe(135);
  for (const difficulty of ["leicht", "mittel", "schwer", "experte"])
    expect(questions.filter((q) => q.difficulty === difficulty)).toHaveLength(
      50,
    );
  for (const letter of ["A", "B", "C", "D"])
    expect(
      questions.filter((q) => q.metadata.correct_answer === letter),
    ).toHaveLength(50);
  expect(new Set(questions.map((q) => q.metadata.question_type)).size).toBe(5);
  expect(sources.questions.map((q) => q.question_id).sort()).toEqual(
    questions.map((q) => q.id).sort(),
  );
  for (const q of questions) {
    const proof = sources.questions.find((p) => p.question_id === q.id)!;
    expect(q.answers.find((a) => a.id === q.correctId)!.text).toBe(
      proof.correct_answer,
    );
    const edited = latestCsvRevision("public/preistraeger-fragen.csv", q.id);
    expect(q.sources).toEqual(
      edited ? edited.after.source_urls.split("|") : proof.sources,
    );
    expect(
      q.sources.some((url) =>
        /oscars\.org|festival-cannes\.com|labiennale\.org/.test(url),
      ),
    ).toBe(true);
    expect(q.context.split(/\s+/).length).toBeGreaterThanOrEqual(35);
    expect(
      q.anchor && q.answers.every((a) => a.feedback.includes(a.text)),
    ).toBeTruthy();
    expect(q.tags).toContain("Preisträger");
    expect(familiarityOf(q)).toBeTruthy();
  }
  const oldReport = JSON.parse(
    readFileSync("docs/importbericht-preistraeger.json", "utf8"),
  );
  writeFileSync(
    "docs/importbericht-preistraeger.json",
    JSON.stringify(
      {
        ...oldReport,
        parser: {
          accepted: imported.report.accepted,
          rejected: imported.report.rejected,
          duplicates: imported.report.duplicates,
          warnings: imported.report.warnings,
          issues: imported.report.issues,
        },
        sha256: createHash("sha256").update(raw).digest("hex"),
      },
      null,
      2,
    ) + "\n",
  );
});

it("liefert für jeden Preisfilm Eckdaten, ohne zusätzliche Fragen oder fremde Filmdaten zu erzeugen", () => {
  expect(films.films).toHaveLength(135);
  const state = emptyState();
  addPackages(state, contents);
  expect(state.questions).toHaveLength(4877);
  expect(new Set(state.questions.map((q) => q.knowledgeId)).size).toBe(4397);
  expect(new Set(state.questions.map((q) => q.topic)).size).toBe(604);
  expect(
    state.questions.filter((q) => q.tags.includes("Preisträger")),
  ).toHaveLength(200);
  for (const q of questions) {
    const data = filmData(q)!;
    expect(data).toBeDefined();
    expect(data.originalTitle).toBe(q.metadata.film_title_original);
    expect(data.year).toBe(Number(q.metadata.film_year));
    expect(
      data.directors && data.countries.length && data.sources.length,
    ).toBeTruthy();
  }
  const before = emptyState();
  addPackages(before, contents.slice(0, -1));
  for (const q of before.questions)
    expect(filmData(state.questions.find((p) => p.id === q.id)!)).toEqual(
      filmData(q),
    );
});

it("ergänzt Bestandsstände idempotent und erhält Ereignisse, Rundensnapshots und Freischaltungen", () => {
  const state = emptyState();
  addPackages(state, contents.slice(0, -1));
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  answer(
    state,
    round.id,
    round.questions[0].id,
    round.questions[0].correctId,
    1000,
    now + 1000,
  );
  const before = structuredClone({
    questions: state.questions,
    rounds: state.rounds,
    events: state.events,
    learning: state.learning,
    journey: state.journey,
  });
  addPackages(state, contents);
  addPackages(state, contents);
  expect(state.questions.slice(0, before.questions.length)).toEqual(
    before.questions,
  );
  expect({
    rounds: state.rounds,
    events: state.events,
    learning: state.learning,
  }).toEqual({
    rounds: before.rounds,
    events: before.events,
    learning: before.learning,
  });
  expect(state.journey?.earned ?? {}).toEqual(before.journey?.earned ?? {});
  expect(state.journey?.independentAreas).toBe(true);
  expect(state.imports).toHaveLength(16);
  expect(() => validateBackup(state)).not.toThrow();
});

it("erhält Expertenrunden und alle drei Kategorien in JSON und privater Kontosicherung", async () => {
  const q = questions.find((q) => q.difficulty === "experte")!;
  const state = emptyState([q]);
  state.settings.roundSetup = {
    mode: "ueben",
    genres: null,
    categories: [...categories],
    difficulties: ["leicht", "mittel", "schwer", "experte"],
  };
  const round = startRound(
    state,
    {
      mode: "ueben",
      topic: categoryTopic("Alle Themen", categories),
      difficulty: "Alle Stufen",
      filters: {
        genres: [q.metadata.subdomain],
        difficulties: ["leicht", "mittel", "schwer", "experte"],
      },
    },
    now,
  );
  answer(state, round.id, q.id, q.correctId, 1000, now + 1000);
  complete(state, round.id, now + 2000);
  expect(careerSummary(state).rounds.get(round.id)?.correct).toBe(5);
  expect(state.experience).toBe(8);
  expect(pathQuestions(state)).toEqual([]);
  expect(pathQuestions(state, "ueben")).toEqual([q]);
  expect(learningPathProgress(state)(q.metadata.subdomain).easy).toBe(0);
  const json = validateBackup(JSON.parse(JSON.stringify(state)));
  const cloud = validateBackup(
    await decodeCloudState(await encodeCloudState(state)),
  );
  expect(json).toEqual(state);
  expect(cloud).toEqual(state);
});

it("vereinigt Kategorien eindeutig und erlaubt Preisträger-Expertentraining im freien Spiel", () => {
  const state = emptyState();
  addPackages(state, contents);
  const union = state.questions.filter((q) => matchesCategories(q, categories));
  expect(new Set(union.map((q) => q.id)).size).toBe(union.length);
  expect(union.filter((q) => q.tags.includes("Preisträger"))).toHaveLength(200);
  const round = startRound(
    state,
    { mode: "ueben", topic: "Preisträger", difficulty: "experte" },
    now,
  );
  expect(round.questions).toHaveLength(5);
  expect(
    round.questions.every(
      (q) => q.difficulty === "experte" && q.tags.includes("Preisträger"),
    ),
  ).toBe(true);
  expect(round.ruleVersion.length).toBeLessThan(100);
  expect(() => validateBackup(state)).not.toThrow();
});

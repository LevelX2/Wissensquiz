import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState, type Question, type State } from "../src/model";
import { answer, complete, startRound } from "../src/engine";
import { learningPathProgress, pathQuestions } from "../src/learningPath";
import { areaMembershipsOf } from "../src/learningAreas";
import { learningOverview } from "../src/learningProgress";
import { localLearningAchievements } from "../src/learningAchievements";
import runtime from "../src/runtimeMetadata.json";
import { preparePresentation } from "../src/questionPresentation";
import { prepareQuestionWorks } from "../src/prepareWorkReferences";

const film = {
  type: "film" as const,
  originalTitle: "Testfilm",
  year: 2000,
  genres: ["Fantasy", "Science-Fiction"],
  techniques: [],
  familiarity: 1 as const,
};
const series = { ...film, type: "series" as const, originalTitle: "Testserie" };
const base = importCsv(readFileSync("tests/fixtures/demo-fragen.csv", "utf8"))
  .questions[0];
function make(
  id: string,
  works: NonNullable<Question["works"]>,
  source: "film" | "awards" | "actors" = "film",
  difficulty: Question["difficulty"] = "leicht",
): Question {
  return {
    ...base,
    id,
    knowledgeId: `K-${id}`,
    works,
    difficulty,
    metadata: {
      ...base.metadata,
      person_id:
        source === "actors"
          ? (runtime.persons.find(([, level]) => level === 1)![0] as string)
          : "",
    },
    tags: source === "awards" ? ["Preisträger"] : [],
  };
}
function play(state: State, q: Question, guessed = false, finish = true) {
  const now = 100000 + state.rounds.length * 10000;
  const round = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  round.questions = [structuredClone(q)];
  round.order = [q.answers.map((a) => a.id)];
  answer(state, round.id, q.id, q.correctId, 1000, now + 1000);
  if (guessed) state.events.at(-1)!.guessed = true;
  if (finish) complete(state, round.id, now + 2000);
  else {
    round.status = "aborted";
    round.finishedAt = now + 2000;
  }
}

it("rechnet eine Preisfrage in beiden Filmgenres und im Preisbereich an, im Serienbereich getrennt", () => {
  const price = make("P", [film], "awards");
  const state = emptyState([
    make("F", [film]),
    make("FM", [film], "film", "mittel"),
    price,
    make("S", [series]),
    make("SM", [series], "film", "mittel"),
  ]);
  play(state, price);
  const progress = learningPathProgress(state);
  for (const area of ["Fantasy", "Science-Fiction", "Preisträger"]) {
    expect(progress(area)).toMatchObject({ easy: 1, mediumUnlocked: true });
  }
  for (const area of ["Serien · Fantasy", "Serien · Science-Fiction"]) {
    expect(progress(area)).toMatchObject({ easy: 0, mediumUnlocked: false });
  }
  expect(state.events).toHaveLength(1);
  expect(Object.keys(state.learning)).toEqual([price.knowledgeId]);
  const overview = learningOverview(
    state.questions.map((q) => q.knowledgeId),
    state.learning,
  );
  expect(overview.stages[0]).toBe(1);
  expect(overview.steps).toBe(1);
});

it("zählt Varianten und wiederholte sichere Antworten je Ziel und Freischaltpfad einmal", () => {
  const price = make("P", [film], "awards");
  const variant = {
    ...make("V", [film], "actors"),
    knowledgeId: price.knowledgeId,
  };
  const state = emptyState([price, variant]);
  play(state, price);
  play(state, variant);
  play(state, price);
  const progress = learningPathProgress(state);
  for (const area of [
    "Fantasy",
    "Science-Fiction",
    "Schauspieler",
    "Preisträger",
  ]) {
    expect(progress(area)).toMatchObject({ easy: 1, easyTarget: 1 });
  }
  expect(Object.keys(state.learning)).toHaveLength(1);
});

it("rechnet historisch sicher beantwortete Ziele nach aktueller Zuordnung an", () => {
  const q = make("F", [{ ...film, genres: ["Science-Fiction"] }]);
  const state = emptyState([q]);
  play(state, q);
  expect(learningPathProgress(state)("Fantasy").easy).toBe(0);
  state.questions[0].works![0].genres.push("Fantasy");
  expect(learningPathProgress(state)("Fantasy").easy).toBe(1);
  expect(state.rounds[0].questions[0].works![0].genres).toEqual([
    "Science-Fiction",
  ]);
});

it("öffnet keine höhere Schwierigkeit durch leichte oder Expertentreffer", () => {
  const easy = make("E", [film], "awards");
  const expert = make("X", [film], "awards", "experte");
  const state = emptyState([
    easy,
    expert,
    make("M", [film], "film", "mittel"),
    make("H", [film], "film", "schwer"),
  ]);
  play(state, expert);
  expect(learningPathProgress(state)("Fantasy")).toMatchObject({
    easy: 0,
    medium: 0,
    mediumUnlocked: false,
  });
  play(state, easy);
  expect(learningPathProgress(state)("Fantasy")).toMatchObject({
    easy: 1,
    medium: 0,
    mediumUnlocked: true,
    hardUnlocked: false,
    expertUnlocked: false,
  });
});

it("verhindert eine Freischaltung über ein anderes, nicht gewähltes Werk derselben Frage", () => {
  const price = make("P", [film], "awards");
  const dual = make("D", [film, series], "film", "mittel");
  const state = emptyState([price, make("S", [series]), dual]);
  play(state, price);
  const filters = {
    genres: ["Fantasy"],
    workTypes: ["series" as const],
    difficulties: ["mittel" as const],
    sources: ["film" as const],
  };
  expect(
    pathQuestions(state, "entdecken", filters).some((q) => q.id === dual.id),
  ).toBe(false);
  expect(
    pathQuestions(state, "entdecken", { ...filters, workTypes: ["film"] }).some(
      (q) => q.id === dual.id,
    ),
  ).toBe(true);
});

it("trennt Bekanntheit der Person und des zugehörigen Werks", () => {
  const q = make("A", [{ ...film, familiarity: 4 }], "actors");
  const memberships = areaMembershipsOf(q);
  expect(
    memberships.find((item) => item.area === "Schauspieler")?.familiarity,
  ).toBe(1);
  expect(memberships.find((item) => item.area === "Fantasy")?.familiarity).toBe(
    4,
  );
});

it("zählt geratene und abgebrochene Antworten nicht als sichere Treffer", () => {
  const price = make("P", [film], "awards");
  const state = emptyState([price]);
  play(state, price, true);
  play(state, price, false, false);
  expect(learningPathProgress(state)("Fantasy").easy).toBe(0);
});

it("hält globale Erfolge eindeutig und zählt eine reine Serie nicht als gelernten Film", () => {
  const actor = make("A", [film], "actors");
  const movie = { ...make("F", [film]), knowledgeId: actor.knowledgeId };
  const state = emptyState([actor, movie]);
  play(state, actor);
  const progress = localLearningAchievements(state);
  expect(progress.counts.secureFacts).toBe(1);
  expect(progress.counts.films).toBe(1);
  expect(progress.counts["films:Fantasy"]).toBe(1);
  expect(progress.counts["films:Science-Fiction"]).toBe(1);
  const onlySeries = make("S", [series]);
  const seriesState = emptyState([onlySeries]);
  play(seriesState, onlySeries);
  expect(localLearningAchievements(seriesState).counts.secureFacts).toBe(1);
  expect(localLearningAchievements(seriesState).counts.films ?? 0).toBe(0);
});

it("verwechselt eine Serie nicht mit einem gleichnamigen Film desselben Jahres", () => {
  const q = make("SERIES", [
    { ...series, originalTitle: "Die Hard", year: 1988, familiarity: 4 },
  ]);
  q.metadata = {
    ...q.metadata,
    film_title_original: "Die Hard",
    film_year: "1988",
    fact_kind: "year",
  };
  const presentation = preparePresentation(q);
  expect(presentation.familiarity).toBe(4);
  expect(presentation.films).toEqual([]);
  expect(presentation.poster).toBeNull();
  expect(presentation.director).toBeUndefined();
  expect(presentation.film).toBeUndefined();
  expect(presentation.questionText).toBe(q.question);
  expect(presentation.deepContext).toBe(q.context);
});

it("hält die Bekanntheit je Werk zentral konsistent", () => {
  const a = make("A", [film]);
  const b = make("B", [{ ...film, familiarity: 4 }]);
  expect(() => prepareQuestionWorks([a, b])).toThrow("Bekanntheit");
  const registered = runtime.films.find(([, level]) => level === 1)!;
  const key = registered[0] as string;
  const separator = key.lastIndexOf("|");
  const wrong = make("C", [
    {
      ...film,
      originalTitle: key.slice(0, separator),
      year: Number(key.slice(separator + 1)),
      familiarity: 4,
    },
  ]);
  expect(() => prepareQuestionWorks([wrong])).toThrow("Werkregister");
});

it("verwendet Filmografie-Verweise einer Porträtfrage nicht als fachliche Werkzuordnung", () => {
  const portrait = readFileSync("content/schauspielerfragen.jsonl", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Question)
    .find(
      (q) =>
        q.metadata.question_type === "Bilderkennung" &&
        q.metadata.film_refs?.startsWith("Forrest Gump|1994"),
    )!;
  expect(portrait).toBeDefined();
  expect(prepareQuestionWorks([portrait])[0].works).toEqual([]);
  const role = {
    ...portrait,
    id: "role-test",
    question: "Welche Rolle spielt der Schauspieler in „Forrest Gump“?",
    metadata: { ...portrait.metadata, question_type: "Rollenwissen" },
  };
  const works = prepareQuestionWorks([role])[0].works!;
  expect(works.map((work) => work.originalTitle)).toEqual(["Forrest Gump"]);
  const career = {
    ...role,
    id: "career-test",
    question: "Welche Auszeichnung erhielt die Person für ihr Lebenswerk?",
  };
  expect(prepareQuestionWorks([career])[0].works).toEqual([]);
});

import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import people from "../src/personFamiliarity.json";
import films from "../src/filmFamiliarity.json";
import {
  familiarityOf,
  familiarityNames,
  roundFamiliarities,
} from "../src/familiarity";
import { matchesFilters, canonicalFilters, sourceLabels } from "../src/filters";
import {
  emptyState,
  type Question,
  type QuestionSource,
  type State,
} from "../src/model";
import { answer, complete, startRound, guess } from "../src/engine";
import {
  learningPathProgress,
  pathQuestions,
  newlyUnlocked,
  serverUnlocks,
} from "../src/learningPath";
import { validateBackup } from "../src/backupValidation";

const base = importCsv(readFileSync("public/horror-fragen.csv", "utf8"))
  .questions[0];
function question(
  source: "actors" | "awards",
  level: number,
  difficulty: Question["difficulty"],
  id: string,
): Question {
  const film = films.films.find((f) => f.level === level)!.film.split("|");
  return {
    ...structuredClone(base),
    id,
    knowledgeId: id,
    difficulty,
    tags: source === "awards" ? ["Preisträger"] : [],
    metadata: {
      film_title_original: film[0],
      film_year: film[1],
      subdomain: sourceLabels[source],
      ...(source === "actors"
        ? {
            person_id: people.persons.find((p) => p.level === level)!.person_id,
          }
        : {}),
    },
  };
}
function play(state: State, qs: Question[], guessed = false) {
  for (const q of qs) {
    const r = startRound(
      state,
      {
        mode: "ueben",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
      },
      1000,
    );
    r.questions = [q];
    r.order = [q.answers.map((a) => a.id)];
    r.familiaritySnapshot = { [q.id]: familiarityOf(q)! };
    answer(state, r.id, q.id, q.correctId, 100, 2000);
    if (guessed) guess(state, state.events.at(-1)!.id);
    complete(state, r.id, 3000);
  }
}
it("ordnet Personen nach person_id und Preise nach ihrer Filmfassung ein", () => {
  expect(familiarityNames).toEqual({
    1: "Sehr bekannt",
    2: "Bekannt",
    3: "Für Filmkenner",
    4: "Entdeckungen",
  });
  for (const level of [1, 2, 3, 4]) {
    const actor = question("actors", level, "leicht", "a" + level);
    const otherFilm = films.films
      .find((f) => f.level !== level)!
      .film.split("|");
    actor.metadata.film_title_original = otherFilm[0];
    actor.metadata.film_year = otherFilm[1];
    expect(familiarityOf(actor)).toBe(level);
    expect(
      familiarityOf(question("awards", level, "experte", "p" + level)),
    ).toBe(level);
  }
});
it("filtert reine Personen- und Preisrunden einschließlich Experte nach Bekanntheit, ohne Filmgenres", () => {
  for (const source of ["actors", "awards"] as const) {
    const qs = [1, 2, 3, 4].map((level) =>
      question(source, level, "experte", source + level),
    );
    const filters = {
      sources: [source] as QuestionSource[],
      genres: [],
      difficulties: ["experte"] as const,
      familiarities: [4] as const,
    };
    const options = {
      ...filters,
      difficulties: [...filters.difficulties],
      familiarities: [...filters.familiarities],
    };
    expect(qs.filter((q) => matchesFilters(q, options))).toEqual([qs[3]]);
    expect(canonicalFilters({ ...options, genres: ["Horror"] })).toEqual(
      options,
    );
    const s = emptyState(qs);
    const r = startRound(s, {
      mode: "ueben",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
      filters: options,
    });
    expect(r.questions).toEqual([qs[3]]);
    expect(roundFamiliarities(r)).toBe("4 · Entdeckungen");
    expect(validateBackup(s).rounds[0].filters?.familiarities).toEqual([4]);
    r.familiaritySnapshot![qs[3].id] = 1;
    expect(() => validateBackup(s)).toThrow("Rundenauswahl");
    expect(
      qs.filter((q) => matchesFilters(q, { ...options, familiarities: [] })),
    ).toEqual([]);
  }
});
for (const source of ["actors", "awards"] as const)
  it(
    source +
      ": öffnet Gruppen und Schwierigkeiten unabhängig anhand aktueller sicherer Ziele",
    () => {
      const easy = Array.from({ length: 5 }, (_, i) =>
        question(source, 1, "leicht", source + "-easy-" + i),
      );
      const next = question(source, 2, "leicht", source + "-next");
      const middle = question(source, 1, "mittel", source + "-middle");
      const hard = question(source, 1, "schwer", source + "-hard");
      const expert = question(source, 2, "experte", source + "-expert");
      const duplicate = { ...easy[0], id: easy[0].id + "-variant" };
      const s = emptyState([...easy, next, middle, hard, expert, duplicate]);
      s.journey = {
        version: 1,
        earned: { [sourceLabels[source]]: { familiarity: 4, difficulty: 3 } },
      };
      const area = sourceLabels[source];
      expect(learningPathProgress(s)(area)).toMatchObject({
        familiarity: 1,
        independent: true,
        mediumUnlocked: false,
        expertUnlocked: false,
        groups: [
          { level: 1, total: 5, target: 3 },
          { level: 2, unlocked: false },
        ],
      });
      expect(pathQuestions(s)).toEqual([...easy, duplicate]);
      play(s, easy.slice(0, 2));
      play(s, [duplicate]);
      play(s, [easy[2]], true);
      expect(learningPathProgress(s)(area).groups[0].answered).toBe(2);
      expect(learningPathProgress(s)(area).familiarity).toBe(1);
      const before = learningPathProgress(s);
      play(s, [easy[2]]);
      expect(newlyUnlocked(before, s)).toContainEqual({
        genre: area,
        familiarity: 2,
      });
      expect(learningPathProgress(s)(area)).toMatchObject({
        familiarity: 2,
        mediumUnlocked: true,
        hardUnlocked: false,
      });
      expect(pathQuestions(s)).toContain(next);
      expect(pathQuestions(s)).toContain(middle);
      expect(pathQuestions(s)).not.toContain(expert);
      play(s, [middle, hard]);
      expect(pathQuestions(s)).toContain(expert);
      expect(learningPathProgress(s)("Horror").easy).toBe(0);
      s.questions.push(
        ...Array.from({ length: 2 }, (_, i) =>
          question(source, 1, "leicht", source + "-added-" + i),
        ),
      );
      expect(learningPathProgress(s)(area)).toMatchObject({
        familiarity: 1,
        groups: [{ total: 7, target: 4, answered: 3 }, { unlocked: false }],
      });
      expect(pathQuestions(s)).not.toContain(expert);
      expect(pathQuestions(s, "ueben")).toContain(expert);
    },
  );

it("feiert serverseitig nur erspielte Gruppen und weiterhin alle neuen Schwierigkeitsstufen", () => {
  for (const genre of ["Horror", "Schauspieler", "Preisträger"]) {
    const before = emptyState();
    const after = emptyState();
    before.journey = {
      version: 1,
      earned: { [genre]: { familiarity: 0, difficulty: 0 } },
    };
    after.journey = {
      version: 1,
      earned: { [genre]: { familiarity: 1, difficulty: 0 } },
    };
    expect(serverUnlocks(before, after)).toEqual([]);

    before.journey.earned[genre].familiarity = 1;
    after.journey.earned[genre].familiarity = 2;
    expect(serverUnlocks(before, after)).toEqual([{ genre, familiarity: 2 }]);

    before.journey.earned[genre].familiarity = 0;
    after.journey.earned[genre] = { familiarity: 1, difficulty: 3 };
    expect(serverUnlocks(before, after)).toEqual([
      { genre, difficulty: "mittel" },
      { genre, difficulty: "schwer" },
      { genre, difficulty: "experte" },
    ]);
  }
});

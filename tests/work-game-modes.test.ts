import { afterAll, beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { startRound } from "../src/engine";
import { validateBackup } from "../src/backupValidation";
import { emptyState } from "../src/model";
import { readRoundSetup } from "../src/roundSetup";
import { databaseLinksFor } from "../src/sourceLinks";
import { matchesFilters } from "../src/filters";
import { RankedSession, rankedRound } from "../src/rankedRuns";
import { recordSelectionLabel } from "../src/recordModes";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent, type TestContent } from "./helpers/test-content";
import type { Question } from "../src/model";

let fixture: Awaited<ReturnType<typeof syncFixture>>, release: TestContent;
const base = importCsv(readFileSync("tests/fixtures/demo-fragen.csv", "utf8"))
  .questions[0];
const make = (type: "film" | "series", i: number): Question => ({
  ...base,
  id: `${type}-${i}`,
  knowledgeId: `${type}-K${i}`,
  difficulty: i % 10 < 3 ? "leicht" : i % 10 < 7 ? "mittel" : "schwer",
  tags: [],
  metadata: { subdomain: "Fantasy" },
  works: [
    {
      type,
      originalTitle: `Werk ${i}`,
      year: 2000,
      genres: ["Fantasy", "Science-Fiction"],
      techniques: ["animation"],
      familiarity: type === "film" ? 1 : 2,
    },
  ],
});
beforeAll(async () => {
  fixture = await syncFixture();
  release = await prepareTestContent(
    ["film", "series"].flatMap((type) =>
      Array.from({ length: 40 }, (_, i) => make(type as "film" | "series", i)),
    ),
  );
  await fixture.seedRanked(release);
  for (const q of release.questions)
    await fixture.db.query(
      "insert into public.quiz_duel_catalog(id,knowledge_id,difficulty,genre,familiarity,question) values($1,$2,$3,'Fantasy',1,$4)",
      [q.id, q.knowledgeId, q.difficulty, q],
    );
}, 30000);
afterAll(() => fixture?.db.close());

it("verbindet die Bekanntheitsgruppe mit demselben gefilterten Werk lokal und im SQL", async () => {
  const q = {
    ...make("film", 0),
    id: "MIX",
    knowledgeId: "MIX",
    works: [make("film", 0).works![0], make("series", 0).works![0]],
  };
  await fixture.seedRanked(await prepareTestContent([...release.questions, q]));
  for (const fame of [1, 2] as const) {
    const filters = {
      genres: ["Science-Fiction"],
      workTypes: ["series" as const],
      familiarities: [fame],
      difficulties: ["leicht" as const],
    };
    const local = matchesFilters(q, filters);
    const server = (
      await fixture.db.query<{ yes: boolean }>(
        "select quiz_game_internal.matches(m,$1,'Alle Themen') yes from quiz_game_internal.catalog_meta m where id='MIX'",
        [filters],
      )
    ).rows[0].yes;
    expect(local).toBe(fame === 2);
    expect(server).toBe(local);
  }
});

it("trennt Film- und Seriengenre in tatsächlichen Rekordrunden und ihren Kategorien", async () => {
  await fixture.seedRanked(release);
  const categories: string[] = [];
  for (const genre of ["Science-Fiction", "Serien · Science-Fiction"]) {
    const { api } = await fixture.client();
    const session = new RankedSession(
      api,
      (
        await fixture.db.query<{ release_hash: string }>(
          "select release_hash from quiz_ranked_internal.config",
        )
      ).rows[0].release_hash,
    );
    await session.start({
      mode: "rekord",
      preset: "genre",
      genre,
      solutionDisplay: "question",
    });
    const isSeries = genre.startsWith("Serien");
    expect(session.run!.filters.workTypes).toEqual([
      isSeries ? "series" : "film",
    ]);
    expect(
      session.current!.question.id.startsWith(isSeries ? "series-" : "film-"),
    ).toBe(true);
    expect(
      recordSelectionLabel(rankedRound({ run: session.run!, items: [] })),
    ).toContain(isSeries ? "Seriengenre" : "Filmgenre");
    categories.push(
      (
        await fixture.db.query<{ category: string }>(
          "select category from quiz_ranked_internal.runs where id=$1",
          [session.run!.id],
        )
      ).rows[0].category,
    );
    await session.abort();
  }
  expect(categories[0]).not.toBe(categories[1]);
});

it("erstellt getrennte Serien- und Animationsduelle mit 30 eindeutigen Zielen und festem 3/4/3-Mix", async () => {
  for (const topic of ["Serien · Science-Fiction", "series", "animation"]) {
    const { owner } = await fixture.client();
    await fixture.db.exec("set role authenticated");
    await fixture.db.query(
      "select set_config('request.jwt.claim.sub',$1,false)",
      [owner],
    );
    let id: string;
    try {
      id = (
        await fixture.db.query<{ value: { id: string } }>(
          "select public.quiz_duel_create('question',true,$1,$2) value",
          [crypto.randomUUID(), topic],
        )
      ).rows[0].value.id;
    } finally {
      await fixture.db.exec("reset role");
    }
    const pack = (
      await fixture.db.query<{ questions: { question: Question }[] }>(
        "select questions from public.quiz_duels where id=$1",
        [id!],
      )
    ).rows[0].questions;
    expect(pack).toHaveLength(30);
    expect(new Set(pack.map((item) => item.question.knowledgeId)).size).toBe(
      30,
    );
    if (topic !== "animation")
      expect(
        pack.every((item) => item.question.works?.[0].type === "series"),
      ).toBe(true);
    for (let i = 0; i < 3; i++) {
      const block = pack.slice(i * 10, (i + 1) * 10);
      expect(
        ["leicht", "mittel", "schwer"].map(
          (d) => block.filter((item) => item.question.difficulty === d).length,
        ),
      ).toEqual([3, 4, 3]);
    }
  }
});

it("verwechselt einen typisierten Serienbezug bei Quellenlinks nicht mit dem gleichnamigen Film", () => {
  const q = make("series", 0);
  q.works = [{ ...q.works![0], originalTitle: "Alien", year: 1979 }];
  q.metadata = { film_title_original: "Alien", film_year: "1979" };
  expect(
    databaseLinksFor(q).filter(
      (link) => link.kind === "Film" || link.kind === "Regie",
    ),
  ).toEqual([]);
});

it("erhält ein Serienrekordgenre beim Lesen der Auswahl getrennt von den allgemeinen Genrecheckboxen", () => {
  const state = emptyState();
  state.settings.roundSetup = {
    mode: "rekord",
    recordPreset: "genre",
    recordGenre: "Serien · Science-Fiction",
    genres: null,
    categories: [],
    difficulties: ["leicht"],
  };
  expect(
    readRoundSetup(state, ["Science-Fiction", "Serien · Science-Fiction"])
      .recordGenre,
  ).toBe("Serien · Science-Fiction");
});

it("sichert beim gefilterten Serienbezug dessen Bekanntheitsgruppe im lokalen Rundennachweis", () => {
  const q = {
    ...make("film", 0),
    works: [make("film", 0).works![0], make("series", 0).works![0]],
  };
  const state = emptyState([q]);
  const round = startRound(state, {
    mode: "ueben",
    topic: "Alle Themen",
    difficulty: "Alle Stufen",
    filters: {
      genres: ["Science-Fiction"],
      workTypes: ["series"],
      familiarities: [2],
      difficulties: ["leicht"],
    },
  });
  expect(round.familiaritySnapshot![q.id]).toBe(2);
  expect(validateBackup(JSON.parse(JSON.stringify(state))).rounds).toEqual(
    state.rounds,
  );
});

it("startet Universal auch mit allgemeinen Personenfragen ohne Werk- oder Genrebezug", async () => {
  const general = Array.from({ length: 10 }, (_, index) => ({
    ...make("film", index),
    id: `general-person-${index}`,
    knowledgeId: `general-person-goal-${index}`,
    works: [],
    metadata: { person_id: "TESTPERSON", subdomain: "Schauspieler" },
  }));
  const content = await prepareTestContent([
    ...general,
    { ...make("film", 99), difficulty: "experte" },
  ]);
  await fixture.seedRanked(content);
  const { api } = await fixture.client();
  const session = new RankedSession(api, content.hash);
  await session.start({
    mode: "rekord",
    preset: "standard",
    solutionDisplay: "question",
  });
  expect(session.run!.filters.genres).toBeNull();
  expect(session.current!.question.id).toMatch(/^general-person-/);
  expect(session.run!.filters.sources).toEqual(["film", "awards", "actors"]);
  await session.abort();
});

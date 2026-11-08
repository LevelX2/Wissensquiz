import { afterAll, beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import { emptyState, type Question, type QuizFilters } from "../src/model";
import { OnlineGameStore } from "../src/onlineGameStore";
import { LearningSession } from "../src/learningRuns";
import { learningPathProgress, pathQuestions } from "../src/learningPath";
import { matchesFilters } from "../src/filters";
import runtime from "../src/runtimeMetadata.json";

let fixture: Awaited<ReturnType<typeof syncFixture>>;
let questions: Question[];
let price: Question;
const film = {
  type: "film" as const,
  originalTitle: "Testfilm",
  year: 2000,
  genres: ["Fantasy", "Science-Fiction"],
  techniques: [],
  familiarity: 1 as const,
};
const series = { ...film, type: "series" as const, originalTitle: "Testserie" };
beforeAll(async () => {
  fixture = await syncFixture();
  const base = importCsv(readFileSync("tests/fixtures/demo-fragen.csv", "utf8"))
    .questions[0];
  const make = (
    id: string,
    works: NonNullable<Question["works"]>,
    source: "film" | "actors" | "awards",
    difficulty: Question["difficulty"] = "leicht",
  ): Question => ({
    ...base,
    id,
    knowledgeId: id === "F" || id === "A" ? "K-P" : `K-${id}`,
    works,
    difficulty,
    topic:
      source === "film"
        ? works[0].originalTitle
        : source === "awards"
          ? "Preisthema"
          : "Testperson",
    metadata: {
      ...base.metadata,
      film_title_original: works[0].originalTitle,
      film_year: "2000",
      subdomain: "Science-Fiction",
      person_id:
        source === "actors"
          ? (runtime.persons.find(([, level]) => level === 1)![0] as string)
          : "",
    },
    tags: source === "awards" ? ["Preisträger"] : [],
  });
  const release = await prepareTestContent([
    make("P", [film], "awards"),
    make("F", [film], "film"),
    make("A", [film], "actors"),
    make("S", [series], "film"),
    make("SM", [series], "film", "mittel"),
    make("D", [film, series], "film", "mittel"),
  ]);
  questions = release.questions;
  price = questions.find((q) => q.id === "P")!;
  await fixture.seedRanked(release);
}, 30000);
afterAll(() => fixture?.db.close());

async function answeredPrice() {
  const { api, owner } = await fixture.client();
  api.clockAt(Date.parse("2026-11-08T10:00:00Z"));
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const generation = (
    await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    )
  ).rows[0].generation;
  const session = new LearningSession(api);
  await session.start({
    mode: "ueben",
    topic: "Preisthema",
    filters: { genres: null, sources: ["awards"], difficulties: ["leicht"] },
    solutionDisplay: "question",
  });
  expect(session.current!.question.id).toBe(price.id);
  await session.answer(price.correctId, false);
  await session.finish();
  const local = emptyState(questions);
  local.rounds = [session.round()!];
  local.events = session.items.map((item) => item.event);
  return { owner, generation, store, local };
}

it("berechnet dieselben Freischaltungen aus einer echten Onlineantwort wie die lokale Referenz", async () => {
  const { owner, generation, store, local } = await answeredPrice();
  try {
    const result = await fixture.db.query<{ value: Record<string, unknown> }>(
      "select quiz_game_internal.journey($1::uuid,$2::uuid) value",
      [owner, generation],
    );
    const progress = learningPathProgress(local);
    for (const area of [
      "Fantasy",
      "Science-Fiction",
      "Schauspieler",
      "Preisträger",
      "Serien · Fantasy",
      "Serien · Science-Fiction",
    ]) {
      expect(result.rows[0].value[area], area).toEqual(progress(area));
    }
    const counts = await fixture.db.query<{ counts: Record<string, number> }>(
      "select counts from quiz_game_internal.achievement_current where owner_id=$1 and generation=$2",
      [owner, generation],
    );
    expect(counts.rows[0].counts.secureFacts).toBe(1);
    expect(counts.rows[0].counts.films).toBe(1);
    const rewards = await fixture.db.query<{ n: number }>(
      "select count(*)::integer n from quiz_game_internal.goal_rewards where owner_id=$1 and generation=$2",
      [owner, generation],
    );
    expect(rewards.rows[0].n).toBe(1);
  } finally {
    store.stop();
  }
});

it("öffnet bei enger Serienauswahl keinen Filmweg desselben Wissensziels", async () => {
  const { owner, generation, store, local } = await answeredPrice();
  try {
    const journey = (
      await fixture.db.query<{ value: unknown }>(
        "select quiz_game_internal.journey($1::uuid,$2::uuid) value",
        [owner, generation],
      )
    ).rows[0].value;
    for (const workType of ["film", "series"] as const) {
      const filters: QuizFilters = {
        genres: ["Fantasy"],
        workTypes: [workType],
        sources: ["film"],
        difficulties: ["mittel"],
      };
      const selected = await fixture.db.query<{ id: string }>(
        "select id from quiz_game_internal.pool($1::uuid,$2::uuid,'entdecken',$3::jsonb,'Alle Themen',$4::jsonb) order by id",
        [owner, generation, JSON.stringify(filters), JSON.stringify(journey)],
      );
      expect(selected.rows.map((row) => row.id)).toEqual(
        pathQuestions(local, "entdecken", filters)
          .filter((q) => matchesFilters(q, filters))
          .map((q) => q.id)
          .sort(),
      );
      expect(selected.rows.some((row) => row.id === "D")).toBe(
        workType === "film",
      );
    }
  } finally {
    store.stop();
  }
});

it("nutzt vorhandene sichere Belege bei neuer Zuordnung ohne private Zeilen umzuschreiben", async () => {
  const { owner, generation, store } = await answeredPrice();
  try {
    const before = await fixture.db.query(
      "select * from quiz_game_internal.secure_goals where owner_id=$1 and generation=$2 order by goal,area,difficulty",
      [owner, generation],
    );
    await fixture.db.exec(
      "update quiz_game_internal.catalog_meta set works=jsonb_set(works,'{0,genres}',works->0->'genres'||'[\"Komödie\"]'::jsonb) where id in ('P','F','A'); select quiz_game_internal.refresh_groups();",
    );
    const result = await fixture.db.query<{ easy: number }>(
      "select (quiz_game_internal.journey($1::uuid,$2::uuid)->'Komödie'->>'easy')::integer easy",
      [owner, generation],
    );
    expect(result.rows[0].easy).toBe(1);
    const after = await fixture.db.query(
      "select * from quiz_game_internal.secure_goals where owner_id=$1 and generation=$2 order by goal,area,difficulty",
      [owner, generation],
    );
    expect(after.rows).toEqual(before.rows);
  } finally {
    await fixture.db.exec("select quiz_game_internal.refresh_content()");
    store.stop();
  }
});

it("hält die gemeinsamen Bereichsprojektionen privat und unter RLS", async () => {
  const result = await fixture.db.query<{
    relname: string;
    relrowsecurity: boolean;
    anon_select: boolean;
    authenticated_select: boolean;
  }>(
    `select c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT') anon_select,
      has_table_privilege('authenticated',c.oid,'SELECT') authenticated_select
     from pg_class c join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='quiz_game_internal' and c.relname in ('catalog_paths','catalog_credits')`,
  );
  expect(result.rows).toHaveLength(2);
  for (const row of result.rows) {
    expect(row.relrowsecurity).toBe(true);
    expect(row.anon_select).toBe(false);
    expect(row.authenticated_select).toBe(false);
  }
});

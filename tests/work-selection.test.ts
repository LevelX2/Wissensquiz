import { afterAll, beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { selectQuestions } from "../src/engine";
import { selectionSlots } from "../src/selectionSlots";
import { type Question } from "../src/model";
import { OnlineGameStore } from "../src/onlineGameStore";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";

const base = importCsv(readFileSync("tests/fixtures/demo-fragen.csv", "utf8"))
  .questions[0];
const roots: Question[] = Array.from({ length: 40 }, (_, i) => ({
  ...base,
  id: `R${String(i).padStart(2, "0")}`,
  knowledgeId: `K${i}`,
  difficulty: "leicht",
  tags: [],
  metadata: {
    ...base.metadata,
    person_id: "",
    variant_of: "",
    subdomain: i < 20 ? "Fantasy" : "Drama",
  },
  works: [
    {
      type: "film",
      originalTitle: `Werk ${i}`,
      year: 2000,
      genres: i < 20 ? ["Fantasy", "Science-Fiction"] : ["Drama"],
      techniques: [],
      familiarity: 1,
    },
  ],
}));
const extra = roots.flatMap((q) =>
  ["leicht", "mittel", "schwer"].map((difficulty, i) => ({
    ...q,
    id: `V${i}-${q.id}`,
    difficulty: difficulty as Question["difficulty"],
    metadata: { ...q.metadata, variant_of: q.id, subdomain: "Horror" },
    works: [{ ...q.works![0], originalTitle: `Zusatz ${q.id}`, genres: ["Horror"] }],
  })),
);
const input = [...roots, ...extra];
const filters = {
  genres: null,
  difficulties: ["leicht", "mittel", "schwer"],
} as const;
const options = {
  mode: "entdecken" as const,
  topic: "Alle Themen",
  difficulty: "Alle Stufen",
  size: 10,
  now: 2e12,
};
function rng(seed: number) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

it("gibt zusätzlichen Genres und bereichs-/stufenübergreifenden Varianten keine weiteren Lose", () => {
  const slots = selectionSlots(input);
  expect(slots).toHaveLength(40);
  expect(new Set(slots.map((slot) => slot.area))).toEqual(
    new Set(["Fantasy", "Drama"]),
  );
  expect(new Set(slots.map((slot) => slot.difficulty))).toEqual(
    new Set(["leicht"]),
  );
  for (let seed = 1; seed <= 100; seed++) {
    const draw = (pool: Question[]) =>
      selectQuestions(pool, {}, options, rng(seed)).map((q) => q.knowledgeId);
    expect(draw(input)).toEqual(draw(roots));
  }
  expect(
    selectionSlots(input, {
      ...filters,
      difficulties: [...filters.difficulties],
      genres: ["Horror"],
    }).every((slot) => slot.area === "Horror"),
  ).toBe(true);
});

it("nutzt alternative Serienzugänge und liefert kleine Restmengen vollständig ohne doppelte Ziele", () => {
  const q = {
    ...roots[0],
    works: [
      ...roots[0].works!,
      { ...roots[0].works![0], type: "series" as const },
    ],
  };
  const slots = selectionSlots([q], {
    genres: ["Fantasy"],
    workTypes: ["series"],
    difficulties: ["leicht"],
  });
  expect(slots[0].area).toBe("Serien · Fantasy");
  expect(selectQuestions(input.slice(0, 3), {}, options, rng(4))).toHaveLength(
    3,
  );
});

let fixture: Awaited<ReturnType<typeof syncFixture>>;
beforeAll(async () => {
  fixture = await syncFixture();
  await fixture.seedRanked(await prepareTestContent(input));
}, 30000);
afterAll(() => fixture?.db.close());

it("balanciert dieselben eindeutigen Auswahlplätze im echten SQL für neue, fällige und bekannte Ziele", async () => {
  const { owner, api } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  store.stop();
  const generation = (
    await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    )
  ).rows[0].generation;
  for (const phase of ["fresh", "due", "known"]) {
    await fixture.db.query(
      "delete from public.quiz_sync_entries where owner_id=$1 and kind='learning'",
      [owner],
    );
    if (phase !== "fresh")
      await fixture.db.query(
        `
      insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'learning',knowledge_id,0,jsonb_build_object('stage',1,'seen',1,'due',case when $3='due' then 1 else 9999999999999 end,'lastSeenAt',1,'lastSecure',1),0
      from quiz_game_internal.catalog_meta group by knowledge_id`,
        [owner, generation, phase],
      );
    let fantasy = 0;
    for (let i = 0; i < 80; i++) {
      const ids = (
        await fixture.db.query<{ ids: string[] }>(
          "select quiz_game_internal.select_queue($1,$2,$3,'Europe/Berlin') ids",
          [owner, generation, { ...options, filters }],
        )
      ).rows[0].ids;
      expect(ids).toHaveLength(10);
      expect(ids.every((id) => id.startsWith("R"))).toBe(true);
      expect(new Set(ids).size).toBe(10);
      fantasy += ids.filter((id) => Number(id.slice(1)) < 20).length;
    }
    expect(fantasy).toBeGreaterThan(300);
    expect(fantasy).toBeLessThan(500);
  }
  const narrow = (
    await fixture.db.query<{ ids: string[] }>(
      "select quiz_game_internal.select_queue($1,$2,$3,'Europe/Berlin') ids",
      [
        owner,
        generation,
        { ...options, filters: { ...filters, genres: ["Horror"] } },
      ],
    )
  ).rows[0].ids;
  expect(narrow).toHaveLength(10);
  expect(narrow.every((id) => id.startsWith("V0-"))).toBe(true);
}, 30000);

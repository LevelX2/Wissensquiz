import { afterAll, beforeAll, expect, it } from "vitest";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareRelease, type PreparedRelease } from "../src/syncCodec";
import { RankedSession } from "../src/rankedRuns";
import { duelSchema, duelViewSchema, duelStartSchema } from "../src/duels";
import { OnlineGameStore } from "../src/onlineGameStore";
import { questionSchema } from "../src/model";
import { startRound, answer, complete } from "../src/engine";

let fixture: Awaited<ReturnType<typeof syncFixture>>, release: PreparedRelease;
beforeAll(async () => {
  fixture = await syncFixture();
  release = await prepareRelease(
    Array.from({ length: 10 }, (_, i) =>
      questionSchema.parse({
        id: `q${i}`,
        knowledgeId: `goal${i}`,
        version: "v1",
        language: "de",
        domain: "Film",
        topic: "Testfilm",
        difficulty: i < 3 ? "leicht" : i < 7 ? "mittel" : "schwer",
        question: `Prüffrage ${i}?`,
        answers: ["a", "b", "c", "d"].map((id) => ({
          id,
          text: id,
          feedback: "",
        })),
        correctId: "a",
        explanation: "Prüferklärung",
        context: "",
        anchor: "",
        sources: [],
        tags: [],
        badgeTags: [],
        metadata: { subdomain: "Prüfgenre" },
        demo: false,
      }),
    ),
  );
  await fixture.seed(release);
  await fixture.seedRanked(release);
  for (let cycle = 0; cycle < 3; cycle++)
    for (const q of release.questions) {
      const item = {
        ...q,
        id: `duel-${cycle}-${q.id}`,
        knowledgeId: `duel-${cycle}-${q.knowledgeId}`,
      };
      await fixture.db.query(
        "insert into public.quiz_duel_catalog values($1,$2,$3,'Prüfgenre',2,$4)",
        [item.id, item.knowledgeId, item.difficulty, item],
      );
    }
}, 30000);
afterAll(() => fixture?.db.close());
async function as<T>(
  owner: string,
  work: () => Promise<T>,
  role = "authenticated",
) {
  await fixture.db.exec(`set role ${role}`);
  await fixture.db.query(
    "select set_config('request.jwt.claim.sub',$1,false)",
    [owner],
  );
  try {
    return await work();
  } finally {
    await fixture.db.exec("reset role");
  }
}
async function rpc(name: string, args: unknown[] = []) {
  return (
    await fixture.db.query<{ value: unknown }>(
      `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) as value`,
      args,
    )
  ).rows[0].value;
}
async function players(
  owner: string,
  sort = "experience",
  genre = "",
  difficulty = "",
) {
  return as(
    owner,
    async () =>
      (
        await fixture.db.query<{
          completed: number;
          answered: number;
          correct: number;
          experience: number;
          is_mine: boolean;
        }>("select * from public.quiz_players($1,$2,$3,0)", [
          sort,
          genre,
          difficulty,
        ])
      ).rows,
  );
}
async function solo(
  api: Awaited<ReturnType<typeof fixture.client>>["api"],
  time = Date.now(),
) {
  api.clockAt(time);
  const session = new RankedSession(api, release.hash);
  await session.start({
    mode: "rekord",
    preset: "standard",
    solutionDisplay: "question",
  });
  for (let i = 0; i < 10; i++) {
    api.clockAt(time + i * 2000 + 1000);
    await session.answer("a");
    if (i < 9) await session.next();
  }
  return session;
}
it("ignoriert erfundene Speicherwerte, zählt Serverläufe einmal und erhält private Karriere-XP", async () => {
  const { owner, api } = await fixture.client();
  const store = new OnlineGameStore(
    api,
    owner,
    async () => release,
    async () => null,
  );
  await store.open();
  await store.update((s) => {
    s.questions = structuredClone(release.questions);
    const r = startRound(s, {
      mode: "rekord",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
    });
    r.questions.forEach((q, i) =>
      answer(s, r.id, q.id, q.correctId, 1000, Date.now() + i * 1000, i),
    );
    complete(s, r.id);
    s.experience = 999999999;
    s.career = { version: 1, legacyBonus: 999999999 };
  });
  expect(await players(owner)).toEqual([]);
  const first = await solo(api);
  expect(await players(owner)).toMatchObject([
    { completed: 1, answered: 10, correct: 10, experience: 43, is_mine: true },
  ]);
  expect(await players(owner, "correct", "Prüfgenre", "mittel")).toMatchObject([
    { completed: 1, answered: 4, correct: 4 },
  ]);
  expect(await players(owner, "correct", "Privat", "mittel")).toEqual([]);
  await api.call("quiz_ranked_call", {
    request_text: api.calls.filter((c) => c.name === "quiz_ranked_call").at(-1)!
      .args.request_text,
  });
  expect((await players(owner))[0].completed).toBe(1);
  await solo(api);
  expect(await players(owner)).toMatchObject([
    { completed: 2, answered: 20, correct: 20, experience: 43 },
  ]);
  const tomorrow = Date.now() + 86400000;
  await solo(api, tomorrow);
  expect(await players(owner)).toMatchObject([
    { completed: 3, answered: 30, correct: 30, experience: 86 },
  ]);
  await store.update((s) => {
    s.experience = 123456789;
    s.career!.legacyBonus = 123456789;
  });
  expect((await players(owner))[0].experience).toBe(86);
  expect(store.read().experience).toBe(123456789);
  const category = first.run!.id;
  const score = (
    await fixture.db.query<{ category: string }>(
      "select category from quiz_ranked_internal.runs where id=$1",
      [category],
    )
  ).rows[0].category;
  const entries = await as(
    owner,
    async () =>
      (
        await fixture.db.query<{ experience: number }>(
          "select * from public.quiz_record_runs($1,'all',0)",
          [score],
        )
      ).rows,
  );
  expect(entries.every((e) => e.experience === 86)).toBe(true);
  expect(await players(owner, "accuracy")).toEqual([]);
  expect(
    await as(
      "",
      async () =>
        (
          await fixture.db.query(
            "select * from public.quiz_public_players('experience',0)",
          )
        ).rows,
      "anon",
    ),
  ).toMatchObject([{ experience: 86 }]);
});
async function block(owner: string, id: string, round: number) {
  for (let index = 0; index < 10; index++)
    await as(owner, async () => {
      const v = duelStartSchema.parse(
        await rpc("quiz_duel_start", [id, round, index]),
      );
      expect(v.current?.startedAt).not.toBeNull();
      await rpc("quiz_duel_answer", [id, round, index, "a", false, false]);
    });
}
async function match(a: string, b: string) {
  const d = duelSchema.parse(
    await as(a, () =>
      rpc("quiz_duel_create", ["round", true, crypto.randomUUID()]),
    ),
  );
  await block(a, d.id, 1);
  const token = (
    await fixture.db.query<{ token: string }>(
      "select token from quiz_duels where id=$1",
      [d.id],
    )
  ).rows[0].token;
  await as(b, () => rpc("quiz_duel_join", [token]));
  await block(b, d.id, 1);
  await block(b, d.id, 2);
  await block(a, d.id, 2);
  await block(a, d.id, 3);
  await block(b, d.id, 3);
  return duelViewSchema.parse(
    await as(a, () => rpc("quiz_duel_view", [d.id, 3])),
  );
}
it("gibt keine ungestartete Duellfrage preis und erhält die erste Frist bei Wiederholung", async () => {
  const a = await fixture.client(),
    stranger = await fixture.client();
  const d = duelSchema.parse(
    await as(a.owner, () =>
      rpc("quiz_duel_create", ["round", true, crypto.randomUUID()]),
    ),
  );
  expect(
    duelViewSchema.parse(
      await as(a.owner, () => rpc("quiz_duel_view", [d.id, 1])),
    ).current,
  ).toBeNull();
  await expect(
    as(stranger.owner, () => rpc("quiz_duel_start", [d.id, 1, 0])),
  ).rejects.toThrow();
  const first = duelStartSchema.parse(
    await as(a.owner, () => rpc("quiz_duel_start", [d.id, 1, 0])),
  );
  expect(first).not.toHaveProperty("items");
  expect(first.current?.question.correctId).toBeUndefined();
  expect(first.current?.question.tags).toEqual([]);
  const repeated = duelStartSchema.parse(
    await as(a.owner, () => rpc("quiz_duel_start", [d.id, 1, 0])),
  );
  expect(repeated.current).toEqual(first.current);
  await expect(
    as(a.owner, () => rpc("quiz_duel_start", [d.id, 1, 1])),
  ).rejects.toThrow();
  await fixture.db.query(
    "update quiz_duel_answers set started_at=clock_timestamp()-interval '31 seconds' where duel_id=$1",
    [d.id],
  );
  const expired = duelViewSchema.parse(
    await as(a.owner, () =>
      rpc("quiz_duel_answer", [d.id, 1, 0, "a", false, false]),
    ),
  );
  expect(expired.items[0].event.correct).toBeNull(); // still hidden until the block ends
  expect(expired.current).toBeNull();
  expect(
    duelViewSchema.parse(
      await as(a.owner, () => rpc("quiz_duel_view", [d.id, 1])),
    ).current,
  ).toBeNull();
  expect(await players(a.owner)).not.toContainEqual(
    expect.objectContaining({ is_mine: true }),
  );
});
it("wertet je Paar und UTC-Tag nur die erste vollständige Begegnung, auch mit vertauschten Rollen", async () => {
  const a = await fixture.client(),
    b = await fixture.client(),
    c = await fixture.client();
  const first = await match(a.owner, b.owner);
  expect(first.duel.ranked).toBe(true);
  const second = await match(b.owner, a.owner);
  expect(second.duel.status).toBe("completed");
  expect(second.duel.ranked).toBe(false);
  const ranks = await as(
    a.owner,
    async () =>
      (
        await fixture.db.query<{ completed: number; points: number }>(
          "select * from public.quiz_duel_rankings('all',0)",
        )
      ).rows,
  );
  expect(ranks).toHaveLength(2);
  expect(ranks.every((r) => r.completed === 1 && r.points === 1)).toBe(true);
  expect((await players(a.owner)).find((r) => r.is_mine)).toMatchObject({
    completed: 6,
    answered: 60,
    correct: 60,
    experience: 129,
  });
  const awardsBefore = (
    await fixture.db.query(
      "select * from quiz_competition_internal.duel_awards",
    )
  ).rows;
  await as(a.owner, () =>
    rpc("quiz_duel_answer", [first.duel.id, 3, 9, "b", false, false]),
  );
  expect(
    (
      await fixture.db.query(
        "select * from quiz_competition_internal.duel_awards",
      )
    ).rows,
  ).toEqual(awardsBefore);
  // Move the isolated fixture's first award to yesterday to exercise a new UTC day.
  await fixture.db.query(
    "update quiz_competition_internal.duel_awards set day=day-1 where duel_id=$1",
    [first.duel.id],
  );
  expect((await match(a.owner, b.owner)).duel.ranked).toBe(true);
  expect((await match(a.owner, c.owner)).duel.ranked).toBe(true);
}, 30000);
it("sperrt Wettbewerbsspeicher und interne Funktionen für Konten und Gäste", async () => {
  const { owner } = await fixture.client();
  for (const role of ["anon", "authenticated"])
    for (const table of ["totals", "days", "batches", "duel_awards"])
      await expect(
        as(
          owner,
          () =>
            fixture.db.query(
              `select * from quiz_competition_internal.${table}`,
            ),
          role,
        ),
      ).rejects.toThrow();
  await expect(
    as(owner, () =>
      fixture.db.query(
        "select quiz_competition_internal.credit($1,'fake','fake','[]')",
        [owner],
      ),
    ),
  ).rejects.toThrow();
  const insecure = (
    await fixture.db.query(
      "select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='quiz_competition_internal' and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute'))",
    )
  ).rows;
  expect(insecure).toEqual([]);
});

it("zählt Keine Ahnung als Antwort, reine Zeitabläufe und abgebrochene Läufe aber nicht als Antwort-XP", async () => {
  const { owner, api } = await fixture.client();
  const session = new RankedSession(api, release.hash),
    base = Date.now();
  api.clockAt(base);
  await session.start({
    mode: "fehlerfrei",
    preset: "standard",
    solutionDisplay: "question",
  });
  await session.answer({ dontKnow: true });
  expect((await players(owner)).find((r) => r.is_mine)).toMatchObject({
    completed: 1,
    answered: 1,
    correct: 0,
    experience: 1,
  });
  api.clockAt(base + 60000);
  await session.start({
    mode: "fehlerfrei",
    preset: "standard",
    solutionDisplay: "question",
  });
  api.clockAt(base + 91000);
  await session.answer(null);
  expect((await players(owner)).find((r) => r.is_mine)).toMatchObject({
    completed: 2,
    answered: 1,
    correct: 0,
    experience: 1,
  });
  await session.start({
    mode: "fehlerfrei",
    preset: "standard",
    solutionDisplay: "question",
  });
  await session.answer("a");
  await session.abort();
  expect((await players(owner)).find((r) => r.is_mine)).toMatchObject({
    completed: 2,
    answered: 1,
    experience: 1,
  });
});

import { afterAll, beforeAll, expect, it } from "vitest";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent, type TestContent } from "./helpers/test-content";
import { RankedSession } from "../src/rankedRuns";
import { duelSchema, duelViewSchema, duelStartSchema } from "../src/duels";
import { OnlineGameStore } from "../src/onlineGameStore";
import { questionSchema } from "../src/model";
import { startRound, answer, complete } from "../src/engine";
import { LearningSession } from "../src/learningRuns";
import { careerProgress, levelThreshold } from "../src/career";

let fixture: Awaited<ReturnType<typeof syncFixture>>, release: TestContent;
beforeAll(async () => {
  fixture = await syncFixture();
  release = await prepareTestContent(
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
        sources: [],
        tags: [],
        badgeTags: [],
        metadata: { subdomain: "Prüfgenre" },
        works: [{ type: "film", originalTitle: "Testfilm", year: 2000, genres: ["Prüfgenre"], techniques: [], familiarity: 1 }],
        demo: false,
      }),
    ),
  );
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
  const store = new OnlineGameStore(api, owner);
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
  expect(store.read().experience).toBe(63);
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
  expect(entries.every((e) => e.experience === store.read().experience)).toBe(
    true,
  );
  const ownEntries = await api.call<{ experience: number }[]>(
    "quiz_own_record_runs",
    { selected_category: score, selected_period: "all", page_offset: 0 },
  );
  expect(ownEntries.map((e) => e.experience)).toEqual(
    entries.map((e) => e.experience),
  );
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
it("zeigt aktuellen Lernfortschritt getrennt vom Wettbewerb und übernimmt nur berechnete Karriere-XP", async () => {
  const { owner, api } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const ownCareer = async () =>
    (await players(owner, "career_experience")).find((r) => r.is_mine)!;
  expect(await ownCareer()).toMatchObject({ completed: 0, experience: 0 });
  expect((await players(owner)).find((r) => r.is_mine)).toBeUndefined();
  const session = new LearningSession(api);
  await session.start({
    mode: "ueben",
    topic: "Alle Themen",
    solutionDisplay: "question",
    filters: {
      genres: ["Prüfgenre"],
      sources: ["film"],
      difficulties: ["leicht", "mittel", "schwer"],
      familiarities: [1, 2, 3, 4],
    },
  });
  for (let i = 0; i < 10; i++) {
    await session.answer("a", false);
    if (i < 9) await session.next();
  }
  await session.finish();
  await store.refresh();
  expect(store.read().experience).toBe(63);
  expect(await ownCareer()).toMatchObject({
    completed: 1,
    answered: 10,
    correct: 10,
    experience: 63,
  });
  expect((await players(owner)).find((r) => r.is_mine)).toBeUndefined();
  await solo(api);
  const competition = (await players(owner)).find((r) => r.is_mine)!;
  expect(competition).toMatchObject({ completed: 1, experience: 43 });
  await store.refresh();
  expect((await ownCareer()).experience).toBe(store.read().experience);
  await store.update((s) => {
    s.experience = 999999999;
  });
  expect((await ownCareer()).experience).toBe(store.read().experience);
  expect((await ownCareer()).experience).toBeLessThan(999999999);
  expect((await players(owner)).find((r) => r.is_mine)).toEqual(competition);
  const anonymous = await as(
    "",
    async () =>
      (
        await fixture.db.query<Record<string, unknown>>(
          "select * from public.quiz_public_players('career_experience',0)",
        )
      ).rows,
    "anon",
  );
  expect(anonymous.some((r) => r.experience === store.read().experience)).toBe(
    true,
  );
  expect(
    anonymous.every(
      (r) =>
        !r.is_mine &&
        Object.keys(r).sort().join(",") ===
          "accuracy,answered,completed,correct,experience,is_mine,place,player_name",
    ),
  ).toBe(true);
  expect(
    (await players(owner, "career_experience", "unbekannt", "experte")).find(
      (r) => r.is_mine,
    ),
  ).toEqual(await ownCareer());
});

it("zeigt bei allen Rekordläufen das aktuelle Karrierelevel auch nach einem späteren Aufstieg", async () => {
  const { owner, api } = await fixture.client();
  const other = await fixture.client();
  const session = await solo(api);
  const otherSession = await solo(other.api);
  const runId = session.run!.id;
  const category = "career-level-" + runId;
  type Entry = { experience: number; is_mine: boolean };
  const own = () =>
    api.call<Entry[]>("quiz_own_record_runs", {
      selected_category: category,
      selected_period: "all",
      page_offset: 0,
    });
  const shared = (player: string = owner, role = "authenticated") =>
    as(
      player,
      async () =>
        (
          await fixture.db.query<Entry>(
            "select * from public.quiz_record_runs($1,'all',0)",
            [category],
          )
        ).rows,
      role,
    );
  await fixture.db.exec("begin");
  try {
    await fixture.db.query(
      "update quiz_ranked_internal.runs set category=$2,points=1246,finished_at=now()-interval '2 days' where id=$1",
      [runId, category],
    );
    await fixture.db.query(
      `insert into quiz_ranked_internal.runs
      select (jsonb_populate_record(null::quiz_ranked_internal.runs,to_jsonb(r)||
        jsonb_build_object('id',gen_random_uuid(),'start_request_id',gen_random_uuid(),
          'points',712,'finished_at',now()-interval '1 day'))).*
      from quiz_ranked_internal.runs r where r.id=$1`,
      [runId],
    );
    await fixture.db.query(
      "update quiz_ranked_internal.runs set category=$2,points=900 where id=$1",
      [otherSession.run!.id, category],
    );
    for (const [player, xp] of [
      [owner, levelThreshold(12)],
      [other.owner, levelThreshold(5)],
    ] as const)
      await fixture.db.query(
        `insert into public.quiz_player_totals(owner_id,genre,difficulty,experience)
        values($1,'','',$2) on conflict(owner_id,genre,difficulty)
        do update set experience=excluded.experience`,
        [player, xp],
      );
    const before = await own();
    expect(before).toHaveLength(2);
    expect(before.every((e) => e.experience === levelThreshold(12))).toBe(true);
    for (const entry of before)
      expect(careerProgress(entry.experience)).toMatchObject({
        level: 12,
        title: "Cineast",
      });
    const sharedBefore = await shared();
    expect(
      sharedBefore.filter((e) => e.is_mine).map((e) => e.experience),
    ).toEqual(before.map((e) => e.experience));
    expect(sharedBefore.find((e) => !e.is_mine)?.experience).toBe(
      levelThreshold(5),
    );
    await fixture.db.query(
      "update public.quiz_player_totals set experience=$2 where owner_id=$1 and genre='' and difficulty=''",
      [owner, levelThreshold(13)],
    );
    const after = await own();
    expect(after).toEqual(
      before.map((e) => ({ ...e, experience: levelThreshold(13) })),
    );
    expect(await shared()).toEqual(
      sharedBefore.map((e) => ({
        ...e,
        experience: e.is_mine ? levelThreshold(13) : e.experience,
      })),
    );
    const anonymous = await shared("", "anon");
    expect(anonymous.every((e) => !e.is_mine)).toBe(true);
    expect(anonymous.map((e) => e.experience)).toEqual([
      levelThreshold(13),
      levelThreshold(5),
      levelThreshold(13),
    ]);
    expect(
      anonymous.every(
        (e) =>
          Object.keys(e).sort().join(",") ===
          "answers,correct,elapsed_ms,experience,finished_at,is_mine,place,player_name,points",
      ),
    ).toBe(true);
  } finally {
    await fixture.db.exec("rollback");
  }
  await expect(
    as(
      "",
      () =>
        fixture.db.query("select public.quiz_own_record_runs($1,'all',0)", [
          category,
        ]),
      "anon",
    ),
  ).rejects.toThrow(/permission denied/);
});

it("begrenzt Karriere-Seiten, teilt Gleichstände und schützt Kontozugriff und interne Summen", async () => {
  await fixture.db.exec("begin");
  try {
    await fixture.db
      .exec(`insert into auth.users(id,email_confirmed_at,is_anonymous,raw_user_meta_data)
      select ('12345678-1234-4123-8123-'||lpad(i::text,12,'0'))::uuid,
        case when i=53 then null else now() end,i=54,jsonb_build_object('display_name','Karrieretest '||lpad(i::text,2,'0'))
      from generate_series(1,54) i;
      insert into public.quiz_player_totals(owner_id,genre,difficulty,experience)
      select id,'','',10000 from auth.users where id::text like '12345678-1234-4123-8123-%';`);
    const page = async (offset: number) =>
      as(
        "",
        async () =>
          (
            await fixture.db.query<{ player_name: string; place: number }>(
              "select * from public.quiz_public_players('career_experience',$1)",
              [offset],
            )
          ).rows,
        "anon",
      );
    const first = await page(0),
      next = await page(50);
    expect(first).toHaveLength(50);
    expect(first.every((r) => r.place === 1)).toBe(true);
    expect(
      next.filter((r) => r.player_name.startsWith("Karrieretest")),
    ).toHaveLength(2);
    expect(
      next
        .filter((r) => r.player_name.startsWith("Karrieretest"))
        .every((r) => r.place === 1),
    ).toBe(true);
    expect(await page(-1)).toEqual(first);
    expect(
      first.some((r) => next.some((n) => n.player_name === r.player_name)),
    ).toBe(false);
  } finally {
    await fixture.db.exec("rollback");
  }
  await expect(
    as(
      "",
      () =>
        fixture.db.query(
          "select * from public.quiz_players('career_experience')",
        ),
      "anon",
    ),
  ).rejects.toThrow();
  for (const role of ["anon", "authenticated"]) {
    await expect(
      as(
        "",
        () =>
          fixture.db.query(
            "select * from quiz_sync_internal.career_players(0)",
          ),
        role,
      ),
    ).rejects.toThrow();
    await expect(
      as(
        "",
        () => fixture.db.query("select * from public.quiz_player_totals"),
        role,
      ),
    ).rejects.toThrow();
  }
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

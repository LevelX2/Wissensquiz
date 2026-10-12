import { afterAll, beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import { OnlineGameStore } from "../src/onlineGameStore";
import { emptyState } from "../src/model";

let fixture: Awaited<ReturnType<typeof syncFixture>>;
beforeAll(async () => {
  fixture = await syncFixture();
  await fixture.seedRanked(
    await prepareTestContent(
      importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(
        0,
        32,
      ),
    ),
  );
  // Independent previous implementation is the full-catalogue oracle, used
  // only in this isolated database for equivalence and before/after timing.
  const sql = readFileSync(
    "supabase/migrations/20261012201611_learning_achievements.sql",
    "utf8",
  );
  const oracle = sql.match(
    /create function quiz_game_internal\.learning_achievement_progress[\s\S]*?\$\$;/,
  )![0];
  await fixture.db.exec(
    oracle.replace(
      ".learning_achievement_progress(",
      ".reference_achievement_progress(",
    ),
  );
}, 30000);
afterAll(() => fixture?.db.close());

async function player() {
  const { api, owner } = await fixture.client();
  await new OnlineGameStore(api, owner).open();
  const {
    rows: [head],
  } = await fixture.db.query<{ generation: string }>(
    "select generation from public.quiz_account_heads where owner_id=$1",
    [owner],
  );
  const generation = head.generation;
  const view = (action = "learning-achievements") =>
    api.call<any>("quiz_game_view", {
      request_text: JSON.stringify({ action }),
    });
  const queue = (goals: string[]) =>
    fixture.db.query(
      "insert into quiz_game_internal.achievement_dirty_goals select $1,$2,g from unnest($3::text[]) g on conflict do nothing",
      [owner, generation, goals],
    );
  const safe = async (goal: string, area = "Drama", difficulty = "leicht") => {
    await fixture.db.query(
      "insert into quiz_game_internal.secure_goals values($1,$2,$3,$4,$5) on conflict do nothing",
      [owner, generation, goal, area, difficulty],
    );
    await queue([goal]);
  };
  const close = async (revision: number) => {
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      values($1,$2,'round','projection-'||$3::text,$3::integer,'{"status":"completed","questions":[]}', $3::bigint)`,
      [owner, generation, revision],
    );
    await fixture.db.query(
      "select quiz_game_internal.refresh_learning_achievements($1,$2,$3)",
      [owner, generation, revision],
    );
  };
  const reference = async () =>
    (
      await fixture.db.query<{ value: any }>(
        "select quiz_game_internal.reference_achievement_progress($1,$2) value",
        [owner, generation],
      )
    ).rows[0].value;
  return { api, owner, generation, safe, queue, close, view, reference };
}

async function prepareMixedCatalogue() {
  await fixture.db.exec(`delete from quiz_game_internal.catalog_meta;
    insert into quiz_game_internal.catalog_meta values
    ('a','a','Gemeinsamer Titel','Drama','film','leicht',1,'[]'),
    ('variant','a','Gemeinsamer Titel','Drama','film','leicht',1,'[]'),
    ('other-genre','a','Gemeinsamer Titel','Action','film','leicht',1,'[]'),
    ('b','b','Gemeinsamer Titel','Drama','film','leicht',1,'[]'),
    ('hard','hard','Gemeinsamer Titel','Western','film','schwer',1,'[]'),
    ('person','person','Gemeinsamer Titel','Schauspieler','actors','leicht',1,'[]'),
    ('award','award','Preis','Preisträger','awards','leicht',1,'[]');
    select quiz_game_internal.refresh_groups();`);
}

it("berechnet Varianten, mehrere Genres, Personen, Preise und sinkende Beiträge wie die vollständige Referenz", async () => {
  await prepareMixedCatalogue();
  const p = await player();
  await p.safe("a");
  await p.safe("a", "Action");
  await p.safe("b");
  await p.safe("person", "Schauspieler");
  await p.safe("award", "Preisträger");
  await fixture.db.query(
    `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
    select $1,$2,'learning',g,i,jsonb_build_object('stage',4,'status','gefestigt'),0 from unnest(array['a','b']) with ordinality t(g,i)`,
    [p.owner, p.generation],
  );
  await p.close(1);
  expect(await p.view()).toEqual(await p.reference());
  expect((await p.view()).counts).toMatchObject({
    films: 1,
    actors: 1,
    awards: 1,
    secureFacts: 4,
    masteredFacts: 2,
    genreBreadth: 3,
    "films:Western": 1,
  });
  const immutable = await p.api.call("quiz_game_view", {
    request_text: '{"action":"round-experience","scope":"projection-1"}',
  });
  // A correction lowers current contributions while earned maxima survive.
  await fixture.db.query(
    "delete from quiz_game_internal.secure_goals where owner_id=$1 and generation=$2 and goal='b'",
    [p.owner, p.generation],
  );
  await fixture.db.query(
    `update public.quiz_sync_entries set value='{"stage":0,"status":"entdeckt"}' where owner_id=$1 and generation=$2 and kind='learning' and id='b'`,
    [p.owner, p.generation],
  );
  await p.queue(["b"]);
  await p.close(2);
  expect((await p.view()).counts.films).toBe(1);
  expect((await p.reference()).counts.films).toBe(0);
  expect((await p.view("profile-progress")).statistics.mastered).toBe(1);
  await p.safe("b");
  await p.close(3);
  expect((await p.view()).counts.films).toBe(1);
  expect(
    await p.api.call("quiz_game_view", {
      request_text: '{"action":"round-experience","scope":"projection-1"}',
    }),
  ).toEqual(immutable);
  const summary = await p.view("summary");
  expect(summary).toMatchObject({
    unseen: 3,
    discovered: 1,
    stages: [0, 0, 0, 1],
    mastered: 1,
    steps: 4,
    maximum: 20,
    percent: 20,
  });
});

it("bereitet Inhaltsänderungen einmal vor und baut nur bei geänderter Definition den Kontobeitrag neu auf", async () => {
  await prepareMixedCatalogue();
  const p = await player();
  await p.safe("a");
  await p.safe("a", "Action");
  await p.safe("b");
  await p.close(1);
  const before = (
    await fixture.db.query(
      "select signature from quiz_game_internal.achievement_catalog",
    )
  ).rows;
  await fixture.db.exec("select quiz_game_internal.refresh_groups()");
  expect(
    (
      await fixture.db.query(
        "select signature from quiz_game_internal.achievement_catalog",
      )
    ).rows,
  ).toEqual(before);
  await fixture.db.exec(
    `insert into quiz_game_internal.catalog_meta values('new-requirement','new','Gemeinsamer Titel','Drama','film','leicht',1,'[]');select quiz_game_internal.refresh_groups()`,
  );
  // Reading the profile never rebuilds private contributions.
  expect((await p.view()).counts.films).toBe(1);
  await p.close(2);
  expect(
    (
      await fixture.db.query<{ counts: any }>(
        "select counts from quiz_game_internal.achievement_current where owner_id=$1 and generation=$2",
        [p.owner, p.generation],
      )
    ).rows[0].counts.films ?? 0,
  ).toBe(0);
  expect((await p.view()).counts.films).toBe(1);
  await p.safe("new");
  await p.close(3);
  expect(
    (
      await fixture.db.query<{ counts: any }>(
        "select counts from quiz_game_internal.achievement_current where owner_id=$1 and generation=$2",
        [p.owner, p.generation],
      )
    ).rows[0].counts.films,
  ).toBe(1);
});

it("führt EXP exakt per Differenz einschließlich Wiederholung, Korrektur und Löschung fort und isoliert Konten", async () => {
  const p = await player(),
    stranger = await player();
  const total = async () =>
    (
      await fixture.db.query<{ xp: number }>(
        "select coalesce((select xp from quiz_game_internal.goal_reward_totals where owner_id=$1 and generation=$2),0) xp",
        [p.owner, p.generation],
      )
    ).rows[0].xp;
  const reward = (goal: string, xp: number) =>
    fixture.db.query(
      "insert into quiz_game_internal.goal_rewards values($1,$2,$3,$4) on conflict(owner_id,generation,goal) do update set xp=excluded.xp",
      [p.owner, p.generation, goal, xp],
    );
  await reward("a", 10);
  await reward("b", 15);
  await reward("a", 10);
  expect(await total()).toBe(25);
  await reward("a", 3);
  expect(await total()).toBe(18);
  await fixture.db.query(
    "delete from quiz_game_internal.goal_rewards where owner_id=$1 and generation=$2 and goal='b'",
    [p.owner, p.generation],
  );
  expect(await total()).toBe(3);
  await fixture.db.query(
    "select quiz_game_internal.finish_projection($1,$2,1)",
    [p.owner, p.generation],
  );
  expect(
    (
      await fixture.db.query<{ value: number }>(
        "select value from public.quiz_sync_entries where owner_id=$1 and generation=$2 and kind='field' and id='experience'",
        [p.owner, p.generation],
      )
    ).rows[0].value,
  ).toBe(3);
  expect((await stranger.view()).counts.experience).toBe(0);
  const helpers = (
    await fixture.db.query<{
      prosecdef: boolean;
      authenticated: boolean;
      anon: boolean;
    }>(
      `select prosecdef,has_function_privilege('authenticated',p.oid,'execute') authenticated,has_function_privilege('anon',p.oid,'execute') anon
     from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='quiz_game_internal'
     and p.proname=any(array['prepare_achievement_catalog','achievement_goal_values','rebuild_achievement_current','goal_reward_delta','learning_summary'])`,
    )
  ).rows;
  expect(helpers).toHaveLength(5);
  expect(
    helpers.every((h) => !h.prosecdef && !h.authenticated && !h.anon),
  ).toBe(true);
  await fixture.db.exec("set role authenticated");
  try {
    for (const table of [
      "achievement_current",
      "achievement_goal_progress",
      "achievement_dirty_goals",
      "goal_reward_totals",
      "achievement_catalog",
    ])
      await expect(
        fixture.db.query(`select * from quiz_game_internal.${table}`),
      ).rejects.toThrow(/permission denied/);
    await expect(
      fixture.db.query(
        "select quiz_game_internal.rebuild_achievement_current($1,$2)",
        [p.owner, p.generation],
      ),
    ).rejects.toThrow(/permission denied/);
  } finally {
    await fixture.db.exec("reset role");
  }
});

it("begrenzt normale Abschlüsse auf geänderte Ziele und liest Erfolgsprofile unabhängig von der Kataloggröße", async () => {
  await fixture.db.exec(`delete from quiz_game_internal.catalog_meta;
    insert into quiz_game_internal.catalog_meta select 'q'||i,'g'||i,'Film '||(i/8),'Drama','film','leicht',1,'[]' from generate_series(1,12000) i;
    select quiz_game_internal.refresh_groups();analyze quiz_game_internal.catalog_meta;`);
  const p = await player();
  await p.safe("g1");
  await p.close(1);
  // Freeze the unrelated contribution. Repeated projection must not rewrite it.
  const row = async () =>
    (
      await fixture.db.query(
        "select xmin::text,secure,seen,mastered from quiz_game_internal.achievement_goal_progress where owner_id=$1 and generation=$2 and goal='g1'",
        [p.owner, p.generation],
      )
    ).rows;
  const unrelated = await row();
  const oldRebuild = (
    await fixture.db.query<{ def: string }>(
      "select pg_get_functiondef('quiz_game_internal.rebuild_achievement_current(uuid,uuid)'::regprocedure) def",
    )
  ).rows[0].def;
  const oldValues = (
    await fixture.db.query<{ def: string }>(
      "select pg_get_functiondef('quiz_game_internal.achievement_goal_values(uuid,uuid,text[])'::regprocedure) def",
    )
  ).rows[0].def;
  const valuesSql = oldValues
    .match(/AS \$function\$([\s\S]*?)\$function\$/)![1]
    .replace(/\bplayer\b/g, "$1")
    .replace(/\btarget\b/g, "$2")
    .replace(/\bgoals\b/g, "$3::text[]");
  const plan = (
    await fixture.db.query<any>(
      `explain(analyze,buffers,format json) ${valuesSql}`,
      [p.owner, p.generation, ["g1"]],
    )
  ).rows[0]["QUERY PLAN"][0].Plan;
  const nodes = (p: any): any[] => [p, ...(p.Plans ?? []).flatMap(nodes)];
  const catalogueNodes = nodes(plan).filter(
    (n) => n["Relation Name"] === "catalog_meta",
  );
  expect(catalogueNodes.length).toBeGreaterThan(0);
  expect(catalogueNodes.every((n) => n["Node Type"] !== "Seq Scan")).toBe(true);
  expect(
    catalogueNodes.reduce(
      (n, p) => n + p["Actual Rows"] * p["Actual Loops"],
      0,
    ),
  ).toBeLessThanOrEqual(2);
  await fixture.db.exec(`create table goal_evaluation_audit(n integer);
    ${oldValues.replace(".achievement_goal_values(", ".audited_goal_values(")};
    create or replace function quiz_game_internal.achievement_goal_values(player uuid,target uuid,goals text[])
    returns table(goal text,secure boolean,seen boolean,mastered boolean,sci_fi boolean) language plpgsql set search_path='' as $$begin
     insert into public.goal_evaluation_audit values(cardinality(goals));
     return query select * from quiz_game_internal.audited_goal_values(player,target,goals);
    end$$;
    create or replace function quiz_game_internal.rebuild_achievement_current(player uuid,target uuid) returns void language plpgsql as $$begin raise exception 'unexpected_full_rebuild';end$$;`);
  try {
    await p.safe("g2");
    await p.close(2);
    expect(
      (await fixture.db.query("select n from goal_evaluation_audit")).rows,
    ).toEqual([{ n: 1 }]);
    expect(await row()).toEqual(unrelated);
    const current = await p.view();
    expect(current.counts.secureFacts).toBe(2);
    const timed = async (fn: () => Promise<unknown>, n = 8) => {
      await fn();
      const start = performance.now();
      for (let i = 0; i < n; i++) await fn();
      return Number(((performance.now() - start) / n).toFixed(3));
    };
    const referenceMs = await timed(p.reference);
    const storedMs = await timed(() =>
      fixture.db.query(
        "select quiz_game_internal.learning_achievement_progress($1,$2)",
        [p.owner, p.generation],
      ),
    );
    const bytes = Buffer.byteLength(JSON.stringify(current));
    // Removing the catalogue name proves the profile read path has no catalogue
    // dependency; not a timing assertion subject to CI scheduling noise.
    await fixture.db.exec(
      "alter table quiz_game_internal.catalog_meta rename to hidden_catalog_meta",
    );
    try {
      expect(await p.view()).toEqual(current);
      expect((await p.view("profile-progress")).achievements).toEqual(current);
      expect((await p.view("summary")).maximum).toBe(48000);
    } finally {
      await fixture.db.exec(
        "alter table quiz_game_internal.hidden_catalog_meta rename to catalog_meta",
      );
    }
    expect(bytes).toBeLessThan(1500);
    process.stdout.write(
      JSON.stringify({
        case: "achievements-12000-metadata",
        referenceMs,
        storedMs,
        bytes,
        changedGoals: 1,
      }) + "\n",
    );
    await fixture.db
      .exec(`insert into quiz_game_internal.catalog_meta select 'q'||i,'g'||i,'Film '||(i/8),'Drama','film','leicht',1,'[]' from generate_series(12001,48000) i;
      select quiz_game_internal.refresh_groups();analyze quiz_game_internal.catalog_meta;`);
    const larger = await p.view();
    expect(larger.counts).toEqual(current.counts);
    expect(
      Math.abs(Buffer.byteLength(JSON.stringify(larger)) - bytes),
    ).toBeLessThan(50);
    process.stdout.write(
      JSON.stringify({
        case: "achievements-48000-metadata",
        referenceMs: await timed(p.reference),
        storedMs: await timed(() =>
          fixture.db.query(
            "select quiz_game_internal.learning_achievement_progress($1,$2)",
            [p.owner, p.generation],
          ),
        ),
        bytes: Buffer.byteLength(JSON.stringify(larger)),
      }) + "\n",
    );
  } finally {
    await fixture.db.exec(
      `${oldRebuild};${oldValues};drop function quiz_game_internal.audited_goal_values(uuid,uuid,text[]);drop table goal_evaluation_audit;`,
    );
  }
}, 30000);

it("erhält Sci-Fi-Meisterschaft bei sinkenden aktuellen Ständen und trennt einen Kontoneustart", async () => {
  await fixture.db.exec(`delete from quiz_game_internal.catalog_meta;
    insert into quiz_game_internal.catalog_meta select 'q'||i,'g'||i,'Film '||i,'Science-Fiction','film','leicht',1,'[]' from generate_series(1,12) i;
    select quiz_game_internal.refresh_groups();`);
  const p = await player();
  for (let i = 1; i <= 10; i++) await p.safe("g" + i, "Science-Fiction");
  await fixture.db.query(
    `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
    select $1,$2,'learning','g'||i,i,'{"stage":4,"status":"gefestigt"}',0 from generate_series(1,10) i`,
    [p.owner, p.generation],
  );
  await p.close(1);
  expect((await p.view()).counts.sciFiMastery).toBe(10);
  expect((await p.view("summary")).badge).toEqual({
    available: 12,
    mastered: 10,
  });
  await fixture.db.query(
    `update public.quiz_sync_entries set value='{"stage":0,"status":"entdeckt"}' where owner_id=$1 and generation=$2 and kind='learning' and id='g1'`,
    [p.owner, p.generation],
  );
  await p.queue(["g1"]);
  await p.close(2);
  expect((await p.view()).counts).toMatchObject({
    sciFiMastery: 10,
    masteredFacts: 10,
  });
  expect((await p.view("summary")).badge.mastered).toBe(9);
  // These isolated projection fixtures deliberately omit full round objects;
  // remove them before exercising the real account reset protocol.
  await fixture.db.query(
    "delete from public.quiz_sync_entries where owner_id=$1 and generation=$2 and kind='round'",
    [p.owner, p.generation],
  );
  const store = new OnlineGameStore(p.api, p.owner);
  await store.open();
  await store.update((state) => Object.assign(state, emptyState()), {
    replace: true,
  });
  expect((await p.view()).counts).toMatchObject({
    films: 0,
    secureFacts: 0,
    masteredFacts: 0,
    experience: 0,
    sciFiMastery: 0,
  });
  expect((await p.view("summary")).badge.mastered).toBe(0);
});

it("initialisiert die neue Projektion ohne Quellen-, Revisions- oder EXP-Änderung", async () => {
  const migration = "20261012204500_incremental_learning_achievements.sql";
  const old = await syncFixture(migration);
  try {
    await old.seedRanked(
      await prepareTestContent(
        importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(
          0,
          32,
        ),
      ),
    );
    await old.db.exec(
      "update quiz_ranked_internal.config set question_count=32;select quiz_game_internal.refresh_content()",
    );
    const { api, owner } = await old.client();
    await new OnlineGameStore(api, owner).open();
    await old.db.query(
      "insert into quiz_game_internal.goal_rewards select owner_id,generation,'one-goal',17 from public.quiz_account_heads where owner_id=$1",
      [owner],
    );
    const source = async () => ({
      entries: (
        await old.db.query(
          "select * from public.quiz_sync_entries order by owner_id,generation,kind,id",
        )
      ).rows,
      heads: (
        await old.db.query(
          "select * from public.quiz_account_heads order by owner_id",
        )
      ).rows,
    });
    const before = await source();
    await old.db.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));
    expect(await source()).toEqual(before);
    expect(
      (
        await old.db.query(
          "select xp from quiz_game_internal.goal_reward_totals",
        )
      ).rows,
    ).toEqual([{ xp: 17 }]);
    await expect(
      api.call("quiz_game_view", {
        request_text: '{"action":"profile-progress"}',
      }),
    ).resolves.toMatchObject({
      statistics: { completed: 0 },
      achievements: { counts: { films: 0 } },
    });
  } finally {
    await old.db.close();
  }
});

import { beforeAll, afterAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import { OnlineGameStore } from "../src/onlineGameStore";
import { LearningSession } from "../src/learningRuns";
import type { QuizFilters } from "../src/model";

let fixture: Awaited<ReturnType<typeof syncFixture>>;
beforeAll(async () => {
  fixture = await syncFixture();
  await fixture.seedRanked(
    await prepareTestContent(
      importCsv(readFileSync("public/fragen.csv", "utf8")).questions,
    ),
  );
}, 30000);
afterAll(() => fixture?.db.close());

async function player() {
  const { api, owner } = await fixture.client();
  const store = new OnlineGameStore(api, owner);
  await store.open();
  const generation = (
    await fixture.db.query<{ generation: string }>(
      "select generation from public.quiz_account_heads where owner_id=$1",
      [owner],
    )
  ).rows[0].generation;
  return { api, owner, generation, store };
}

const filters: QuizFilters = {
  sources: ["film", "actors", "awards"],
  genres: ["Abenteuer"],
  difficulties: ["leicht", "mittel", "schwer", "experte"],
  familiarities: [1, 2, 3, 4],
};

it("projiziert Bekanntheit für alle Quellen aus der vorbereiteten Präsentation", async () => {
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`
      create temporary table chosen as select id,row_number() over(order by id) n
        from quiz_ranked_internal.catalog order by id limit 3;
      update quiz_ranked_internal.catalog c set source=case n when 1 then 'actors' when 2 then 'awards' else 'film' end
        from chosen x where x.id=c.id;
      update quiz_game_internal.presentations p set value=jsonb_set(value,'{familiarity}',to_jsonb(x.n::integer+1))
        from chosen x where x.id=p.id;
      select quiz_game_internal.refresh_content();`);
    expect(
      (
        await fixture.db.query(
          "select m.source,m.familiarity from quiz_game_internal.catalog_meta m join chosen x on x.id=m.id order by x.n",
        )
      ).rows,
    ).toEqual([
      { source: "actors", familiarity: 2 },
      { source: "awards", familiarity: 3 },
      { source: "film", familiarity: 4 },
    ]);
    expect(
      (
        await fixture.db.query(
          "select count(*)::integer n from quiz_game_internal.film_group_goals where area in ('Schauspieler','Preisträger')",
        )
      ).rows[0],
    ).toEqual({ n: 2 });
  } finally {
    await fixture.db.exec("rollback");
  }
});

it("filtert Gruppen bei Film, Schauspielern und Preisen; Genres begrenzen allein Filme", async () => {
  const { owner, generation, api } = await player();
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`
      delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta
      select source||level||difficulty,source||level||difficulty,'Test',
        case source when 'film' then 'Abenteuer' when 'actors' then 'Schauspieler' else 'Preisträger' end,
        source,difficulty,level,
        case source when 'actors' then '["Schauspieler"]'::jsonb when 'awards' then '["Preisträger"]'::jsonb else '[]'::jsonb end
      from unnest(array['film','actors','awards']) source
      cross join generate_series(1,4) level
      cross join unnest(array['leicht','mittel','schwer','experte']) difficulty
      where source<>'film' or difficulty<>'experte';
      select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    const pool = async (selected: object, topic = "Alle Themen") =>
      (
        await fixture.db.query<{ source: string; familiarity: number }>(
          "select source,familiarity from quiz_game_internal.pool($1,$2,'ueben',$3,$4,'{}') order by source,id",
          [owner, generation, JSON.stringify(selected), topic],
        )
      ).rows;
    const group2 = { ...filters, familiarities: [2] };
    const rows = await pool(group2);
    expect(rows).toHaveLength(11);
    expect(new Set(rows.map((r) => r.familiarity))).toEqual(new Set([2]));
    expect(new Set(rows.map((r) => r.source))).toEqual(
      new Set(["film", "actors", "awards"]),
    );
    expect(await pool({ ...group2, genres: [] })).toHaveLength(8);
    expect(
      await pool({ ...group2, sources: ["actors"], genres: [] }),
    ).toHaveLength(4);
    expect(await pool(group2, "Schauspieler")).toHaveLength(4);
    expect(await pool({ ...group2, familiarities: [] })).toEqual([]);
    const selection = await api.call<any>("quiz_game_view", {
      request_text: JSON.stringify({
        action: "selection",
        mode: "ueben",
        topic: "Alle Themen",
        filters: group2,
      }),
    });
    expect(selection).toMatchObject({ poolSize: 11, selectionSize: 10 });
  } finally {
    await fixture.db.exec("rollback");
  }
});

it("öffnet Personen- und Preisgruppen anhand aufgerundeter Hälften aktueller leichter Ziele", async () => {
  const { owner, generation } = await player();
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`
      delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta
      select area||level||'leicht'||i,area||level||'leicht'||i,'Test',area,source,'leicht',level,'[]'
      from (values ('Schauspieler','actors'),('Preisträger','awards')) a(area,source)
      cross join generate_series(1,4) level
      cross join lateral generate_series(1,case when level=1 then 3 else 2 end) i;
      insert into quiz_game_internal.catalog_meta
      select area||difficulty||i,area||difficulty||i,'Test',area,source,difficulty,1,'[]'
      from (values ('Schauspieler','actors'),('Preisträger','awards')) a(area,source)
      cross join unnest(array['mittel','schwer','experte']) difficulty cross join generate_series(1,3) i;
      insert into quiz_game_internal.catalog_meta
      select id||'-variant',knowledge_id,topic,genre,source,difficulty,familiarity,tags
      from quiz_game_internal.catalog_meta where id='Schauspieler1leicht1';
      select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    const progress = async () =>
      (
        await fixture.db.query<{ value: any }>(
          "select quiz_game_internal.journey($1,$2) value",
          [owner, generation],
        )
      ).rows[0].value;
    const secure = async (area: string, difficulty: string, goals: string[]) =>
      fixture.db.query(
        `
        insert into quiz_game_internal.secure_goals(owner_id,generation,goal,area,difficulty)
        select $1,$2,goal,$3,$4 from unnest($5::text[]) goal on conflict do nothing`,
        [owner, generation, area, difficulty, goals],
      );
    let p = await progress();
    for (const area of ["Schauspieler", "Preisträger"]) {
      expect(p[area]).toMatchObject({
        first: 1,
        familiarity: 1,
        easyTarget: 5,
        mediumTarget: 2,
        hardTarget: 2,
        expertUnlocked: false,
      });
      expect(p[area].groups[0]).toMatchObject({
        total: 3,
        target: 2,
        answered: 0,
        unlocked: true,
      });
      await secure(area, "leicht", [area + "1leicht1"]);
    }
    p = await progress();
    expect(p.Schauspieler.familiarity).toBe(1);
    expect(p.Preisträger.familiarity).toBe(1);
    for (const area of ["Schauspieler", "Preisträger"])
      await secure(area, "leicht", [area + "1leicht2"]);
    p = await progress();
    for (const area of ["Schauspieler", "Preisträger"]) {
      expect(p[area].familiarity).toBe(2);
      expect(p[area].groups[1].unlocked).toBe(true);
      expect(p[area].mediumUnlocked).toBe(false);
      await secure(area, "leicht", [
        area + "2leicht1",
        area + "3leicht1",
        area + "4leicht1",
        "removed-goal",
      ]);
      await secure(area, "mittel", [area + "mittel1", area + "mittel2"]);
      await secure(area, "schwer", [area + "schwer1", area + "schwer2"]);
    }
    p = await progress();
    for (const area of ["Schauspieler", "Preisträger"]) {
      expect(p[area]).toMatchObject({
        familiarity: 4,
        easy: 5,
        mediumUnlocked: true,
        hardUnlocked: true,
        expertUnlocked: true,
      });
      expect(p[area].groups.map((g: any) => g.unlocked)).toEqual([
        true,
        true,
        true,
        true,
      ]);
    }
    await fixture.db.exec("delete from quiz_game_internal.journey_cache");
    const locked = await fixture.db.query<{ id: string }>(
      "select id from quiz_game_internal.pool($1,$2,'entdecken',$3,'Alle Themen',$4) where familiarity>1 or difficulty<>'leicht'",
      [
        owner,
        generation,
        JSON.stringify(filters),
        JSON.stringify({
          Schauspieler: { familiarity: 1 },
          Preisträger: { familiarity: 1 },
        }),
      ],
    );
    expect(locked.rows).toEqual([]);
    const all = await fixture.db.query<{ id: string }>(
      "select id from quiz_game_internal.pool($1,$2,'entdecken',$3,'Alle Themen',$4) where difficulty='experte'",
      [owner, generation, JSON.stringify(filters), JSON.stringify(p)],
    );
    expect(all.rows).toHaveLength(6);
  } finally {
    await fixture.db.exec("rollback");
  }
});

it("wiederholt fällige Personen- und Preisziele auch oberhalb noch geschlossener Reisegruppen", async () => {
  const { owner, generation, api } = await player();
  const stamp = Date.parse("2026-10-13T12:00:00Z");
  api.clockAt(stamp);
  await fixture.db.exec("begin");
  try {
    await fixture.db.query("select set_config('quiz.test_now',$1,false)", [
      String(stamp),
    ]);
    await fixture.db.exec(`
      delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta values
      ('actor','actor-goal','Test','Schauspieler','actors','experte',4,'["Schauspieler"]'),
      ('award','award-goal','Test','Preisträger','awards','schwer',4,'["Preisträger"]'),
      ('new','new-goal','Test','Schauspieler','actors','leicht',4,'["Schauspieler"]'),
      ('later','later-goal','Test','Preisträger','awards','leicht',4,'["Preisträger"]');
      select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    await fixture.db.query(
      `
      insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'learning',goal,i,jsonb_build_object('stage',1,'seen',1,'due',$3::bigint+case when i=3 then 60000 else -1000 end),0
      from (values ('actor-goal',1),('award-goal',2),('later-goal',3)) v(goal,i)`,
      [owner, generation, stamp],
    );
    const setup = {
      mode: "fehler",
      topic: "Alle Themen",
      filters: { ...filters, genres: [], familiarities: [4] },
    };
    expect(
      (
        await fixture.db.query<{ ids: string[] }>(
          "select quiz_game_internal.select_queue($1,$2,$3,'UTC') ids",
          [owner, generation, JSON.stringify(setup)],
        )
      ).rows[0].ids.sort(),
    ).toEqual(["actor", "award"]);
    expect(
      await api.call<any>("quiz_game_view", {
        request_text: JSON.stringify({
          action: "selection",
          ...setup,
          timezone: "UTC",
        }),
      }),
    ).toMatchObject({
      selectionSize: 2,
      repetitions: { due: 2, later: 1, nextAt: stamp + 60000 },
    });
  } finally {
    await fixture.db.exec("rollback");
    api.clockAt(undefined);
    await fixture.db.query("select set_config('quiz.test_now','',false)");
  }
});

it("aktiviert neue Gruppen ohne Kontorevisionen, Lernbelege oder laufende Fragen zu ändern", async () => {
  const { api, owner, generation, store } = await player();
  const session = new LearningSession(api);
  await session.start({
    mode: "ueben",
    topic: "Alle Themen",
    filters: { ...filters, genres: store.info!.genres, sources: ["film"] },
    solutionDisplay: "question",
  });
  await session.answer({ dontKnow: true }, false);
  await session.next();
  const issued = structuredClone(session.current);
  await fixture.db.exec("begin");
  try {
    const snapshot = async () =>
      (
        await fixture.db.query<{ value: any }>(`
      select jsonb_build_object(
        'heads',(select coalesce(jsonb_agg(to_jsonb(h) order by owner_id),'[]') from public.quiz_account_heads h),
        'entries',(select coalesce(jsonb_agg(to_jsonb(e) order by owner_id,generation,kind,id),'[]') from public.quiz_sync_entries e),
        'runs',(select coalesce(jsonb_agg(to_jsonb(r) order by id),'[]') from quiz_game_internal.runs r),
        'questions',(select coalesce(jsonb_agg(to_jsonb(q) order by run_id,index),'[]') from quiz_game_internal.questions q)
      ) value`)
      ).rows[0].value;
    const before = await snapshot();
    await fixture.db.exec(`
      insert into quiz_game_internal.content_staging(hash,id,content)
      select repeat('a',64),c.id,jsonb_build_object('q',c.question,'presentation',
        jsonb_set(p.value,'{familiarity}',to_jsonb(4)))::text
      from quiz_ranked_internal.catalog c join quiz_game_internal.presentations p on p.id=c.id;
      insert into quiz_game_internal.content_staging(hash,id,content)
      select repeat('a',64),'new-actor',jsonb_build_object('q',
        jsonb_set(jsonb_set(jsonb_set(jsonb_set(c.question,'{id}','"new-actor"'),
        '{knowledgeId}','"synthetic-actor-goal"'),'{metadata,person_id}','"ACTOR-001"'),
        '{topic}','"Neue Schauspielperson"'),
        'presentation',jsonb_set(p.value,'{familiarity}',to_jsonb(4)))::text
      from quiz_ranked_internal.catalog c join quiz_game_internal.presentations p on p.id=c.id
      where c.difficulty='leicht' order by c.id limit 1;
      update quiz_game_internal.content_staging set hash=(
        select encode(sha256(convert_to(string_agg(encode(sha256(convert_to(content,'UTF8')),'hex'),'' order by id collate "C"),'UTF8')),'hex')
        from quiz_game_internal.content_staging);
      select quiz_game_internal.activate_content(
        (select hash from quiz_game_internal.content_staging limit 1),
        (select count(*)::integer from quiz_game_internal.content_staging),
        (select jsonb_agg(jsonb_build_object('film',film,'level',level)) from quiz_game_internal.familiarity));`);
    expect(await snapshot()).toEqual(before);
    expect(
      (
        await fixture.db.query(
          "select goal from quiz_game_internal.achievement_goals where goal='synthetic-actor-goal'",
        )
      ).rows,
    ).toEqual([{ goal: "synthetic-actor-goal" }]);
    expect(
      (
        await fixture.db.query<{ available: any }>(
          "select available from quiz_game_internal.achievement_catalog where id",
        )
      ).rows[0].available.actors,
    ).toBe(1);

    expect(
      (
        await fixture.db.query<{ levels: number[] }>(
          "select array_agg(distinct familiarity) levels from quiz_game_internal.catalog_meta",
        )
      ).rows[0].levels,
    ).toEqual([4]);
    await session.resume(session.run!.id);
    expect(session.current).toEqual(issued);
    expect(
      (
        await fixture.db.query<{ revision: number }>(
          "select revision from public.quiz_account_heads where owner_id=$1",
          [owner],
        )
      ).rows[0].revision,
    ).toEqual(before.heads.find((h: any) => h.owner_id === owner).revision);
    expect(generation).toBeTruthy();
  } finally {
    await fixture.db.exec("rollback");
    await session.abort();
  }
}, 30000);

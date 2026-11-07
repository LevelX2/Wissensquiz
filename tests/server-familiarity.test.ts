import { currentCsv } from "./helpers/current-content";
import { beforeAll, afterAll, expect, it } from "vitest";

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
      importCsv(currentCsv({ genre: "Science-Fiction" })).questions,
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

it("zieht neue Serverziele nach Bereich und dessen freigespielter Bekanntheit, unabhängig von Bestandsgröße und Stufenanzahl", async () => {
  const { owner, generation } = await player();
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`
      delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta
      select level||'-'||i,level||'-'||i,'Test',
        case source when 'film' then 'Abenteuer' when 'actors' then 'Schauspieler' else 'Preisträger' end,
        source,difficulty,level,'[]'
      from (values (1,120),(2,35),(3,20),(4,12)) sizes(level,n)
      cross join lateral generate_series(0,n-1) i
      cross join lateral (select case when level=1 then
        case when i<90 then 'leicht' when i<100 then 'mittel' when i<110 then 'schwer' else 'experte' end
        when level=3 and i>=3 then 'mittel' else 'leicht' end difficulty) d
      cross join lateral (select case when i%3=0 or difficulty='experte' then 'actors' when i%3=1 then 'awards' else 'film' end source) s;
      insert into quiz_game_internal.catalog_meta
      select 'variant'||i,knowledge_id,topic,genre,source,difficulty,familiarity,tags
      from quiz_game_internal.catalog_meta cross join generate_series(1,20) i where id='1-0';
      select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    await fixture.db.query(
      `
      insert into quiz_game_internal.secure_goals
      select distinct $1::uuid,$2::uuid,knowledge_id,
        case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end,difficulty
      from quiz_game_internal.catalog_meta`,
      [owner, generation],
    );
    const queue = async (selected = filters) =>
      (
        await fixture.db.query<{ ids: string[] }>(
          "select quiz_game_internal.select_queue($1,$2,$3,'Europe/Berlin') ids",
          [
            owner,
            generation,
            JSON.stringify({
              mode: "entdecken",
              topic: "Alle Themen",
              filters: selected,
            }),
          ],
        )
      ).rows[0].ids;
    const catalog = new Map(
      (
        await fixture.db.query<{
          id: string;
          knowledge_id: string;
          familiarity: number;
          difficulty: string;
          source: string;
        }>(
          "select id,knowledge_id,familiarity,difficulty,source from quiz_game_internal.catalog_meta",
        )
      ).rows.map((q) => [q.id, q]),
    );
    const counts = [0, 0, 0, 0];
    const stages: Record<string, number> = {
      leicht: 0,
      mittel: 0,
      schwer: 0,
      experte: 0,
    };
    const mixes = new Set<number>();
    for (let i = 0; i < 120; i++) {
      const rows = (await queue()).map((id) => catalog.get(id)!);
      expect(rows).toHaveLength(10);
      expect(new Set(rows.map((q) => q.knowledge_id)).size).toBe(10);
      for (const q of rows) {
        counts[q.familiarity - 1]++;
        if (q.familiarity === 1 && q.source === "actors")
          stages[q.difficulty]++;
      }
      mixes.add(rows.filter((q) => q.familiarity === 1).length);
    }
    for (const count of counts) {
      expect(count).toBeGreaterThan(210);
      expect(count).toBeLessThan(390);
    }
    for (const count of Object.values(stages)) {
      expect(count).toBeGreaterThan(8);
      expect(count).toBeLessThan(50);
    }
    expect(mixes.size).toBeGreaterThan(3);
    expect(
      (await queue({ ...filters, familiarities: [2] })).every(
        (id) => catalog.get(id)!.familiarity === 2,
      ),
    ).toBe(true);
    expect(
      (await queue({ ...filters, genres: [], sources: ["actors"] })).every(
        (id) => catalog.get(id)!.source === "actors",
      ),
    ).toBe(true);

    // Different areas may have different unlock levels; an open film group
    // must never make a locked actor question eligible.
    await fixture.db.query(
      "delete from quiz_game_internal.secure_goals where owner_id=$1 and generation=$2 and area='Schauspieler'",
      [owner, generation],
    );
    await fixture.db.exec("delete from quiz_game_internal.journey_cache");
    const available = (
      await fixture.db.query<{
        source: string;
        familiarity: number;
        difficulty: string;
      }>(
        "select source,familiarity,difficulty from quiz_game_internal.pool($1,$2,'entdecken',$3,'Alle Themen',quiz_game_internal.cached_journey($1,$2))",
        [owner, generation, JSON.stringify(filters)],
      )
    ).rows;
    expect(
      available.some((q) => q.source === "film" && q.familiarity === 4),
    ).toBe(true);
    expect(
      available
        .filter((q) => q.source === "actors")
        .every((q) => q.familiarity === 1 && q.difficulty === "leicht"),
    ).toBe(true);
    for (let i = 0; i < 10; i++) {
      for (const id of await queue()) {
        const q = catalog.get(id)!;
        if (q.source === "actors")
          expect(q).toMatchObject({ familiarity: 1, difficulty: "leicht" });
      }
    }
    expect(
      (
        await fixture.db.query<{ allowed: boolean }>(
          "select has_function_privilege('authenticated','quiz_game_internal.select_queue(uuid,uuid,jsonb,text)','execute') allowed",
        )
      ).rows[0].allowed,
    ).toBe(false);
  } finally {
    await fixture.db.exec("rollback");
  }
});

it("entfernt Serverziele aus allen Gruppen und füllt nach Ausschöpfung mit bekannten Zielen auf", async () => {
  const { owner, generation } = await player();
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`
      delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta values
      ('film','shared','Test','Abenteuer','film','leicht',1,'[]'),
      ('actor','shared','Test','Schauspieler','actors','leicht',2,'[]'),
      ('award','shared','Test','Preisträger','awards','leicht',3,'[]'),
      ('unique','unique','Test','Abenteuer','film','leicht',4,'[]');
      insert into quiz_game_internal.catalog_meta
      select 'known'||i,'known'||i,'Test','Abenteuer','film','leicht',1,'[]' from generate_series(1,10) i;
      select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    await fixture.db.query(
      `
      insert into quiz_game_internal.secure_goals
      select $1,$2,knowledge_id,case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end,difficulty
      from quiz_game_internal.catalog_meta`,
      [owner, generation],
    );
    await fixture.db.query(
      `
      insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'learning','known'||i,i,'{"stage":1,"due":9999999999999,"seen":1,"lastSeenAt":1,"lastSecure":1}',0 from generate_series(1,10) i`,
      [owner, generation],
    );
    for (let i = 0; i < 8; i++) {
      const ids = (
        await fixture.db.query<{ ids: string[] }>(
          "select quiz_game_internal.select_queue($1,$2,$3,'Europe/Berlin') ids",
          [
            owner,
            generation,
            JSON.stringify({
              mode: "entdecken",
              topic: "Alle Themen",
              filters,
            }),
          ],
        )
      ).rows[0].ids;
      expect(ids).toHaveLength(10);
      expect(ids).toContain("unique");
      expect(
        ids.filter((id) => ["film", "actor", "award"].includes(id)),
      ).toHaveLength(1);
      expect(ids.filter((id) => id.startsWith("known"))).toHaveLength(8);
    }
  } finally {
    await fixture.db.exec("rollback");
  }
});

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

it("verteilt Serverbereiche für neue und wiederholte Ziele und behält die ältesten Ziele je Bereich", async () => {
  const { owner, generation } = await player();
  await fixture.db.exec("begin");
  try {
    await fixture.db.exec(`
      delete from quiz_game_internal.catalog_meta;
      insert into quiz_game_internal.catalog_meta
      select area||'-'||i,area||'-'||i,'Test',area,source,'leicht',1,'[]'
      from (values ('Schauspieler','actors',200),('Abenteuer','film',30),('Drama','film',30),('Preisträger','awards',30)) sizes(area,source,n)
      cross join lateral generate_series(0,n-1) i;
      select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    const selectedFilters = { ...filters, genres: ["Abenteuer", "Drama"] };
    const catalog = new Map(
      (
        await fixture.db.query<{ id: string; genre: string }>(
          "select id,genre from quiz_game_internal.catalog_meta",
        )
      ).rows.map((q) => [q.id, q]),
    );
    const setup = JSON.stringify({
      mode: "entdecken",
      topic: "Alle Themen",
      filters: selectedFilters,
    });
    // Seed goal/variant draws only; area draws use gen_random_uuid().
    await fixture.db.exec("select setseed(0.391)");
    for (const phase of ["fresh", "due", "known"]) {
      if (phase !== "fresh")
        await fixture.db.query(
          `
        insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
        select $1,$2,'learning',id,0,jsonb_build_object('stage',1,'seen',1,
          'due',case when $3='due' then age else 9999999999999 end,
          'lastSeenAt',age,'lastSecure',age),0
        from (select id,(case when source='actors' then 1 else 1000 end)+split_part(id,'-',2)::integer age
          from quiz_game_internal.catalog_meta) q
        on conflict(owner_id,generation,kind,id) do update set value=excluded.value`,
          [owner, generation, phase],
        );
      const counts: Record<string, number> = {
        Schauspieler: 0,
        Abenteuer: 0,
        Drama: 0,
        Preisträger: 0,
      };
      const mixes = new Set<number>();
      for (let round = 0; round < 100; round++) {
        const ids = (
          await fixture.db.query<{ ids: string[] }>(
            "select quiz_game_internal.select_queue($1,$2,$3,'Europe/Berlin') ids",
            [owner, generation, setup],
          )
        ).rows[0].ids;
        expect(ids).toHaveLength(10);
        expect(new Set(ids).size).toBe(10);
        for (const id of ids) counts[catalog.get(id)!.genre]++;
        mixes.add(
          ids.filter((id) => catalog.get(id)!.genre === "Schauspieler").length,
        );
        if (phase !== "fresh")
          for (const area of Object.keys(counts)) {
            const positions = ids
              .filter((id) => catalog.get(id)!.genre === area)
              .map((id) => Number(id.split("-")[1]))
              .sort((a, b) => a - b);
            expect(positions).toEqual(
              Array.from({ length: positions.length }, (_, i) => i),
            );
          }
      }
      for (const count of Object.values(counts)) {
        expect(count).toBeGreaterThan(180);
        expect(count).toBeLessThan(320);
      }
      expect(mixes.size).toBeGreaterThan(3);
    }
    // Group 1 has four areas, group 2 only actors: actors must keep one quarter.
    await fixture.db.exec(`
      insert into quiz_game_internal.catalog_meta
      select 'second-'||i,'second-'||i,'Test','Schauspieler','actors','leicht',2,'[]' from generate_series(0,49) i;
      select quiz_game_internal.refresh_groups();delete from quiz_game_internal.journey_cache;`);
    await fixture.db.query(
      `
      insert into quiz_game_internal.secure_goals
      select $1,$2,knowledge_id,genre,difficulty from quiz_game_internal.catalog_meta where source='actors';
      `,
      [owner, generation],
    );
    await fixture.db.query(
      `
      insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'learning',id,0,'{"stage":1,"due":1,"seen":1,"lastSeenAt":1,"lastSecure":1}',0
      from quiz_game_internal.catalog_meta where familiarity=2;
      `,
      [owner, generation],
    );
    await fixture.db.query(
      "update public.quiz_sync_entries set value=value||'{\"due\":1}' where owner_id=$1 and generation=$2 and kind='learning'",
      [owner, generation],
    );
    for (const phase of ["fresh", "due", "known"]) {
      await fixture.db.query(
        "delete from public.quiz_sync_entries where owner_id=$1 and generation=$2 and kind='learning'",
        [owner, generation],
      );
      if (phase !== "fresh")
        await fixture.db.query(
          `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
           select $1,$2,'learning',knowledge_id,0,jsonb_build_object('stage',1,'seen',1,
             'due',case when $3='due' then 1 else 9999999999999 end,'lastSeenAt',1,'lastSecure',1),0
           from quiz_game_internal.catalog_meta`,
          [owner, generation, phase],
        );
      let second = 0;
      let actors = 0;
      for (let round = 0; round < 100; round++) {
        const ids = (
          await fixture.db.query<{ ids: string[] }>(
            "select quiz_game_internal.select_queue($1,$2,$3,'Europe/Berlin') ids",
            [owner, generation, setup],
          )
        ).rows[0].ids;
        expect(ids).toHaveLength(10);
        expect(new Set(ids).size).toBe(10);
        second += ids.filter((id) => id.startsWith("second-")).length;
        actors += ids.filter(
          (id) => id.startsWith("second-") || id.startsWith("Schauspieler-"),
        ).length;
      }
      expect(actors).toBeGreaterThan(180);
      expect(actors).toBeLessThan(320);
      // Equal groups within actors: roughly one eighth overall, not one half.
      expect(second).toBeGreaterThan(70);
      expect(second).toBeLessThan(180);
    }
  } finally {
    await fixture.db.exec("rollback");
  }
}, 30000);

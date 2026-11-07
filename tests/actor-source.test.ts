import { currentCsv } from "./helpers/current-content";
import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { importCsv } from "../src/importer";
import { OnlineGameStore } from "../src/onlineGameStore";

it("ordnet leere Personen-IDs bei Reparatur und neuer Aktivierung korrekt zu und erhält Lernbelege", async () => {
  const name = "20261012142833_nonempty_actor_source.sql";
  const fixture = await syncFixture(name);
  try {
    const original = importCsv(currentCsv({ genre: "Science-Fiction" }))
      .questions[0];
    const questions = Array.from({ length: 32 }, (_, i) => ({
      ...original,
      id: `source-${i}`,
      knowledgeId: `fact-${i}`,
      difficulty: "leicht",
      demo: false,
      tags: i % 4 === 0 ? ["Preisträger"] : [],
      metadata: {
        ...original.metadata,
        person_id: i % 4 === 2 ? "actor-1" : "",
        subdomain: "Abenteuer",
      },
    }));
    delete (questions[3].metadata as Record<string, unknown>).person_id;
    await fixture.db.query(
      `insert into quiz_ranked_internal.catalog
      select 'test',q->>'id',q->>'knowledgeId',q->>'difficulty','Abenteuer',
      case when q->'metadata' ? 'person_id' then 'actors' else 'film' end,q
      from jsonb_array_elements($1::jsonb) q`,
      [JSON.stringify(questions)],
    );
    await fixture.db.exec(
      "insert into quiz_ranked_internal.config values(true,'test',32);select quiz_game_internal.refresh_content()",
    );
    const { api, owner } = await fixture.client();
    await new OnlineGameStore(api, owner).open();
    const generation = (
      await fixture.db.query<{ generation: string }>(
        "select generation from public.quiz_account_heads where owner_id=$1",
        [owner],
      )
    ).rows[0].generation;
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      values ($1,$2,'round','round-source',0,$3,0),($1,$2,'event','event-source',0,$4,0),($1,$2,'learning','fact-0',0,'{"stage":1,"due":123,"seen":1}',0)`,
      [
        owner,
        generation,
        JSON.stringify({
          id: "round-source",
          status: "completed",
          questions: [questions[0]],
        }),
        JSON.stringify({
          roundId: "round-source",
          questionId: "source-0",
          knowledgeId: "fact-0",
          correct: true,
          guessed: false,
          answerId: original.correctId,
        }),
      ],
    );
    const entries = () =>
      fixture.db.query(
        "select * from public.quiz_sync_entries where not(kind='field' and id='journey') order by kind,id",
      );
    const before = (await entries()).rows;
    await fixture.db.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));
    expect((await entries()).rows).toEqual(before);
    const sources = async () =>
      (
        await fixture.db.query(
          "select source,count(*)::integer n from quiz_ranked_internal.catalog group by source order by source",
        )
      ).rows;
    expect(await sources()).toEqual([
      { source: "actors", n: 8 },
      { source: "awards", n: 8 },
      { source: "film", n: 16 },
    ]);
    expect(
      (
        await fixture.db.query(
          "select area from quiz_game_internal.secure_goals where owner_id=$1",
          [owner],
        )
      ).rows,
    ).toEqual([{ area: "Preisträger" }]);
    expect(
      (
        await fixture.db.query(
          "select quiz_ranked_internal.visible(question)->'metadata'->>'person_id' actor,quiz_ranked_internal.fact(question)->'metadata'->>'person_id' fact from quiz_ranked_internal.catalog where id='source-0'",
        )
      ).rows,
    ).toEqual([{ actor: null, fact: null }]);
    expect(
      (
        await fixture.db.query(
          "select count(*)::integer n from public.quiz_duel_catalog",
        )
      ).rows,
    ).toEqual([{ n: 23 }]);
    await fixture.db
      .exec(`insert into quiz_game_internal.content_staging(hash,id,content)
      select 'next',id,jsonb_build_object('q',question,'presentation','{}'::jsonb)::text from quiz_ranked_internal.catalog`);
    const hash = (
      await fixture.db.query<{ hash: string }>(
        `select encode(sha256(convert_to(string_agg(encode(sha256(convert_to(content,'UTF8')),'hex'),'' order by id collate "C"),'UTF8')),'hex') hash from quiz_game_internal.content_staging`,
      )
    ).rows[0].hash;
    await fixture.db.query(
      "update quiz_game_internal.content_staging set hash=$1",
      [hash],
    );
    await fixture.db.query(
      "select quiz_game_internal.activate_content($1,32,'[]')",
      [hash],
    );
    expect(await sources()).toEqual([
      { source: "actors", n: 8 },
      { source: "awards", n: 8 },
      { source: "film", n: 16 },
    ]);
    expect((await entries()).rows).toEqual(before);
  } finally {
    await fixture.db.close();
  }
}, 30000);

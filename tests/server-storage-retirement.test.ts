import { readFileSync } from "node:fs";
import { it, expect } from "vitest";
import { syncFixture } from "./helpers/sync-fixture";
it("entfernt die alten Tabellen und RPCs vollständig", async () => {
  const fixture = await syncFixture();
  try {
    const result = await fixture.db.query<{ name: string; present: boolean }>(
      `select name,to_regclass(name) is not null present from unnest(array['public.quiz_saves','public.quiz_catalog_releases','public.quiz_generation_catalog_refs','public.quiz_sync_legacy_archives']) name`,
    );
    expect(result.rows.every((row) => !row.present)).toBe(true);
    const funcs = await fixture.db.query<{ name: string; present: boolean }>(
      `select name,to_regprocedure(name) is not null present from unnest(array['public.quiz_sync_apply(text)','public.quiz_sync_activate(uuid,uuid)','public.quiz_sync_catalog(text)','public.quiz_save_state(jsonb,bigint,uuid)']) name`,
    );
    expect(funcs.rows.every((row) => !row.present)).toBe(true);
    const remaining = await fixture.db.query<{ name: string }>(
      `select n.nspname||'.'||p.proname name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','quiz_sync_internal','quiz_game_internal','quiz_ranked_internal') and p.prosrc ~ 'quiz_saves|quiz_catalog_releases|quiz_generation_catalog_refs|quiz_sync_legacy_archives|sync_paused|legacy_apply'`,
    );
    expect(remaining.rows).toEqual([]);
    const grants = await fixture.db.query<{ allowed: boolean }>(
      `select has_function_privilege('authenticated','quiz_sync_internal.apply(text)','execute') or has_function_privilege('authenticated','quiz_sync_internal.activate(uuid,uuid)','execute') as allowed`,
    );
    expect(grants.rows[0].allowed).toBe(false);
  } finally {
    await fixture.db.close();
  }
}, 30000);
it("erhält einen aktiven Server-Spielstand beim Entfernen aller Altarchive unverändert", async () => {
  const migration = "20261011135001_remove_legacy_catalog_storage.sql",
    fixture = await syncFixture(migration);
  try {
    const { owner } = await fixture.client(),
      generation = crypto.randomUUID();
    await fixture.db.query(
      `insert into public.quiz_sync_generations(owner_id,id,base_revision,status) values($1,$2,0,'active')`,
      [owner, generation],
    );
    await fixture.db.query(
      `insert into public.quiz_account_heads(owner_id,generation,revision,cursor_floor) values($1,$2,7,1)`,
      [owner, generation],
    );
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision) values($1,$2,'field','catalog',0,'{"source":"server","parts":[]}',7),($1,$2,'field','settings',0,'{"sound":false}',7)`,
      [owner, generation],
    );
    await fixture.db.exec(
      `insert into public.quiz_catalog_releases(hash,protocol,payload,digests,score_fields,question_count) values(repeat('0',64),1,''::bytea,'[]','[]',0)`,
    );
    const before = (
      await fixture.db.query(
        "select * from public.quiz_sync_entries order by kind,id",
      )
    ).rows;
    await fixture.db.exec(
      readFileSync("supabase/migrations/" + migration, "utf8"),
    );
    expect(
      (
        await fixture.db.query(
          "select * from public.quiz_sync_entries order by kind,id",
        )
      ).rows,
    ).toEqual(before);
    expect(
      (
        await fixture.db.query(
          "select generation,revision,cursor_floor from public.quiz_account_heads",
        )
      ).rows,
    ).toEqual([{ generation, revision: 7, cursor_floor: 1 }]);
    expect(
      (
        await fixture.db.query(
          `select to_regclass('public.quiz_catalog_releases') as archived`,
        )
      ).rows,
    ).toEqual([{ archived: null }]);
  } finally {
    await fixture.db.close();
  }
}, 30000);

import { beforeAll, afterAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import { validateBackup } from "../src/backupValidation";
import { startRound } from "../src/engine";
import {
  compileState,
  difference,
  prepareRelease,
  stableStringify,
  SYNC_FORMAT,
  type SyncDocument,
  type SyncPacket,
} from "../src/syncCodec";

const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  unverified = "33333333-3333-4333-8333-333333333333";
let generation = crypto.randomUUID(),
  revision = 0,
  document: SyncDocument;
const now = 1700000000000;
const base = emptyState(
  importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(0, 12),
);
async function rpc<T = unknown>(name: string, args: unknown[] = []) {
  const params = args.map((_, i) => `$${i + 1}`).join(",");
  const result = await db.query<{ result: T }>(
    `select public.${name}(${params}) as result`,
    args,
  );
  return result.rows[0].result;
}
async function as<T>(
  owner: string,
  action: () => Promise<T>,
  role = "authenticated",
) {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    owner,
  ]);
  try {
    return await action();
  } finally {
    await db.exec("reset role");
  }
}
async function stage(
  doc: SyncDocument,
  target: string,
  parent: string | null,
  rev: number,
) {
  await rpc("quiz_sync_begin", [alice, target, parent, rev]);
  for (const object of doc.objects.values())
    await rpc("quiz_sync_object_piece", [
      alice,
      target,
      object.hash,
      object.encoding,
      0,
      1,
      object.text,
    ]);
  await rpc("quiz_sync_stage", [
    alice,
    target,
    [...doc.rows.values()].map((row) => ({ op: "put", row })),
  ]);
  await rpc("quiz_sync_seal", [alice, target, doc.rows.size, doc.objects.size]);
  return rpc<{ revision: number }>("quiz_sync_activate", [alice, target]);
}
const packet = (
  delta: ReturnType<typeof difference>,
  rev = revision,
  gen = generation,
): SyncPacket => ({
  format: SYNC_FORMAT,
  protocol: 1,
  id: crypto.randomUUID(),
  generation: gen,
  expectedRevision: rev,
  owner: alice,
  ...delta,
});
beforeAll(async () => {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
    insert into auth.users values('${alice}',now(),false,'{"display_name":"Alice"}'),('${bob}',now(),false,'{"display_name":"Bob"}'),('${unverified}',null,false,'{}');`);
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    // Cloud scheduling is independent of the local application database fixture.
    .filter((f) => !f.endsWith("_daily_service_check.sql"))
    .sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  const release = await prepareRelease(base.questions);
  await db.query(
    "insert into public.quiz_catalog_releases(hash,protocol,payload,digests,score_fields,question_count) values($1,1,decode($2,'base64'),$3::jsonb,$4::jsonb,$5)",
    [
      release.hash,
      release.data,
      JSON.stringify(release.digests),
      JSON.stringify(
        release.questions.map((q) => ({
          id: q.id,
          version: q.version,
          correctId: q.correctId,
          domain: q.domain,
          difficulty: q.difficulty,
          metadata:
            q.metadata.subdomain === undefined
              ? {}
              : { subdomain: q.metadata.subdomain },
        })),
      ),
      release.questions.length,
    ],
  );
  const state = structuredClone(base);
  startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  document = await compileState(validateBackup(state), [release]);
  const activated = await as(alice, () => stage(document, generation, null, 0));
  revision = activated.revision;
}, 30000);
afterAll(() => db.close());
it("verlangt bestätigte Identität und sperrt anonyme/fremde Tabellen- und Objektzugriffe", async () => {
  await as(
    "",
    async () => {
      await expect(rpc("quiz_sync_metadata", [alice])).rejects.toThrow(
        /permission denied/,
      );
      await expect(
        db.query("select * from public.quiz_sync_entries"),
      ).rejects.toThrow(/permission denied/);
    },
    "anon",
  );
  await as(unverified, () =>
    expect(rpc("quiz_sync_metadata", [unverified])).rejects.toThrow(
      /verified_account_required/,
    ),
  );
  await as(bob, async () => {
    await expect(rpc("quiz_sync_metadata", [alice])).rejects.toThrow(
      /account_changed/,
    );
    const object = [...document.objects.keys()][0];
    await expect(
      rpc("quiz_sync_objects", [bob, generation, [object]]),
    ).rejects.toThrow(/missing_private_object/);
    await expect(
      db.query("select * from public.quiz_account_heads"),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.query("select quiz_sync_internal.project($1,$2,null,true)", [
        alice,
        generation,
      ]),
    ).rejects.toThrow(/permission denied/);
  });
});
it("bestätigt verlorene Antworten identisch, zählt Pakete nur einmal und lehnt veränderte Paket-IDs ab", async () => {
  const changed = {
    rows: new Map(document.rows),
    objects: new Map(document.objects),
  };
  const key = "field:settings",
    row = changed.rows.get(key)!;
  changed.rows.set(key, {
    ...row,
    value: {
      ...(row.value as object),
      sound: !(row.value as { sound?: boolean }).sound,
    },
  });
  const request = packet(difference(document, changed)),
    wire = stableStringify(request);
  await as(alice, async () => {
    const saved = await rpc<{ revision: number; id: string }>(
      "quiz_sync_apply",
      [wire],
    );
    expect(saved.id).toBe(request.id);
    expect(saved.revision).toBe(revision + 1);
    expect(await rpc("quiz_sync_apply", [wire])).toEqual(saved);
    await expect(rpc("quiz_sync_apply", [wire + " "])).rejects.toThrow(
      /packet_content_mismatch/,
    );
    await expect(
      rpc("quiz_sync_apply", [
        stableStringify({ ...request, id: crypto.randomUUID() }),
      ]),
    ).rejects.toThrow(/revision_conflict/);
    revision = saved.revision;
    document = changed;
  });
});
it("rollt alle Änderungen, neue Objekte, Beleg und Revision bei einem ungültigen Paket zurück", async () => {
  const wire = packet({
    objects: [],
    changes: [
      {
        op: "put",
        row: {
          kind: "field",
          id: "settings",
          position: 0,
          value: { spoilers: true },
        },
      },
      {
        op: "put",
        row: {
          kind: "field",
          id: "arbitrary_json_path",
          position: 0,
          value: { leak: true },
        },
      },
    ],
  });
  await as(alice, async () => {
    await expect(
      rpc("quiz_sync_apply", [stableStringify(wire)]),
    ).rejects.toThrow(/invalid_field/);
    const meta = await rpc<{ revision: number }>("quiz_sync_metadata", [alice]);
    expect(meta.revision).toBe(revision);
    const page = await rpc<{ rows: { id: string; value: unknown }[] }>(
      "quiz_sync_page",
      [alice, generation, revision, -1, "", 200],
    );
    expect(page.rows.find((r) => r.id === "settings")!.value).toEqual(
      document.rows.get("field:settings")!.value,
    );
  });
});
it("verhindert gemischte mehrseitige Downloads und verlangt bei abgelaufenem Cursor einen Erstabruf", async () => {
  await as(alice, async () => {
    const page = await rpc<{ nextCursor: string; done: boolean }>(
      "quiz_sync_page",
      [alice, generation, revision, -1, "", 2],
    );
    expect(page.done).toBe(false);
    const request = packet({
      objects: [],
      changes: [
        {
          op: "put",
          row: {
            kind: "field",
            id: "settings",
            position: 0,
            value: { spoilers: false, sound: false },
          },
        },
      ],
    });
    const result = await rpc<{ revision: number }>("quiz_sync_apply", [
      stableStringify(request),
    ]);
    await expect(
      rpc("quiz_sync_page", [
        alice,
        generation,
        revision,
        -1,
        page.nextCursor,
        2,
      ]),
    ).rejects.toThrow(/download_changed/);
    revision = result.revision;
  });
  await db.query(
    "update public.quiz_account_heads set cursor_floor=revision where owner_id=$1",
    [alice],
  );
  await as(alice, () =>
    expect(
      rpc("quiz_sync_page", [alice, generation, revision, 0, "", 200]),
    ).rejects.toThrow(/cursor_expired/),
  );
});
it("ersetzt vollständige Generationen einschließlich entfernter Einträge und sperrt Altclients und alte Pakete", async () => {
  const old = generation,
    newGeneration = crypto.randomUUID();
  const release = await prepareRelease(base.questions),
    clean = await compileState(validateBackup(base), [release]);
  await as(alice, async () => {
    const result = await stage(clean, newGeneration, old, revision);
    generation = newGeneration;
    revision = result.revision;
    const page = await rpc<{ rows: { kind: string }[] }>("quiz_sync_page", [
      alice,
      generation,
      revision,
      -1,
      "",
      200,
    ]);
    expect(
      page.rows.some((r) => r.kind === "round" || r.kind === "event"),
    ).toBe(false);
    await expect(
      rpc("quiz_save_state", [base, revision, alice]),
    ).rejects.toThrow(/sync_upgrade_required/);
    await expect(
      rpc("quiz_sync_apply", [
        stableStringify(
          packet(
            {
              objects: [],
              changes: [
                {
                  op: "put",
                  row: {
                    kind: "field",
                    id: "settings",
                    position: 0,
                    value: { spoilers: true },
                  },
                },
              ],
            },
            revision,
            old,
          ),
        ),
      ]),
    ).rejects.toThrow(/generation_mismatch/);
  });
});

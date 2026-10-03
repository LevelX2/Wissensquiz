import { createServer } from "vite";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { strict as assert } from "node:assert";
const runId = process.argv[2];
if (!/^\d{8,14}$/.test(runId ?? ""))
  throw new Error("Gib die isolierte Benchmark-Laufkennung an.");
const tools = resolve(
    process.env.QUIZ_SYNC_PG_TOOLS ?? "tmp-sync/postgres-17.11/pgsql/bin",
  ),
  port = Number(process.env.QUIZ_SYNC_PG_PORT ?? 55439),
  before = `quiz_sync_before_${runId}`,
  after = `quiz_sync_after_${runId}`;
const conn = ["-h", "127.0.0.1", "-p", String(port), "-U", "quiz_test"],
  env = { ...process.env, PGCLIENTENCODING: "UTF8" },
  literal = (v) => "'" + v.replaceAll("'", "''") + "'";
function sql(database, input) {
  const result = spawnSync(
    join(tools, "psql.exe"),
    [...conn, "-d", database, "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1"],
    {
      input,
      encoding: "utf8",
      env,
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (result.status !== 0) throw new Error(result.stderr.slice(-1000));
  return result.stdout.trim();
}
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const codec = await server.ssrLoadModule("/src/syncCodec.ts"),
    { decodeCloudState } = await server.ssrLoadModule("/src/cloudCodec.ts"),
    { validateBackup } = await server.ssrLoadModule("/src/backupValidation.ts");
  const expected = validateBackup(
    await decodeCloudState(
      JSON.parse(
        sql(
          before,
          "select payload from bench.templates order by step desc limit 1;",
        ),
      ),
    ),
  );
  const catalogData = JSON.parse(
      sql(
        after,
        "select jsonb_agg(jsonb_build_object('hash',hash,'encoding','gzip-field-refs-v1','data',replace(encode(payload,'base64'),chr(10),''),'digests',digests)) from public.quiz_catalog_releases;",
      ),
    ),
    catalogs = await Promise.all(catalogData.map(codec.verifyRelease)),
    proofs = new Map();
  for (let i = 1; i <= 100; i++) {
    const owner = `a0000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      head = JSON.parse(
        sql(
          after,
          `select jsonb_build_object('generation',generation,'revision',revision) from public.quiz_account_heads where owner_id=${literal(owner)};`,
        ),
      );
    const rows = JSON.parse(
        sql(
          after,
          `select jsonb_agg(jsonb_build_object('kind',kind,'id',id,'position',position,'value',value)) from public.quiz_sync_entries where owner_id=${literal(owner)} and generation=${literal(head.generation)} and not deleted;`,
        ),
      ),
      objects = JSON.parse(
        sql(
          after,
          `select jsonb_agg(jsonb_build_object('hash',hash,'encoding',encoding,'text',content)) from public.quiz_private_catalog_objects where owner_id=${literal(owner)} and generation=${literal(head.generation)};`,
        ),
      );
    for (const object of objects) {
      if (proofs.has(object.hash))
        assert(codec.jsonEqual(proofs.get(object.hash), object));
      else {
        await codec.verifyObject(object);
        proofs.set(object.hash, object);
      }
    }
    const state = codec.reconstructState(
      {
        rows: new Map(rows.map((r) => [`${r.kind}:${r.id}`, r])),
        objects: new Map(objects.map((o) => [o.hash, o])),
      },
      catalogs,
    );
    assert(codec.jsonEqual(state, expected));
    assert.equal(head.revision, 13);
    if (i % 20 === 0)
      console.log(
        JSON.stringify({ phase: "final-workload-reconstruction", players: i }),
      );
  }
  const report = JSON.parse(
    await readFile("docs/Speicher-und-Sync-Messung.json", "utf8"),
  );
  assert.equal(report.runId, runId);
  report.workload.finalReconstructionChecks = 100;
  report.workload.finalRevisions = 13;
  report.workload.privateObjectProofs = proofs.size;
  report.workload.catalogProofs = catalogs.map((c) => c.hash);
  await writeFile(
    "docs/Speicher-und-Sync-Messung.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  const query = spawnSync(
    process.execPath,
    [
      "scripts/prepare-sync-maintenance.mjs",
      "--export-query",
      "a0000000-0000-4000-8000-000000000001",
    ],
    { encoding: "utf8", env, windowsHide: true },
  );
  assert.equal(query.status, 0);
  const snapshot = join(
    `tmp-sync/benchmark-${runId}`,
    "operator-snapshot.json",
  );
  await writeFile(snapshot, sql(after, query.stdout));
  const prep = spawnSync(
    process.execPath,
    [
      "scripts/prepare-sync-maintenance.mjs",
      snapshot,
      `tmp-sync/benchmark-${runId}/maintenance`,
    ],
    { encoding: "utf8", env, windowsHide: true, maxBuffer: 4096 },
  );
  assert.equal(prep.status, 0, prep.stderr);
  console.log(prep.stdout.trim());
} finally {
  await server.close();
}

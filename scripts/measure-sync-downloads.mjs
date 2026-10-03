import "fake-indexeddb/auto";
import { createServer } from "vite";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { strict as assert } from "node:assert";
const runId = process.argv[2];
if (!/^\d{8,14}$/.test(runId ?? ""))
  throw new Error("Nur eine isolierte Benchmark-Laufkennung ist erlaubt.");
const tools = resolve(
    process.env.QUIZ_SYNC_PG_TOOLS ?? "tmp-sync/postgres-17.11/pgsql/bin",
  ),
  port = Number(process.env.QUIZ_SYNC_PG_PORT ?? 55439);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Ungültiger lokaler Prüfport.");
const before = `quiz_sync_before_${runId}`,
  after = `quiz_sync_after_${runId}`,
  owner = "a0000000-0000-4000-8000-000000000001",
  literal = (v) => "'" + String(v).replaceAll("'", "''") + "'",
  bytes = (v) => Buffer.byteLength(JSON.stringify(v));
function sql(database, input) {
  const result = spawnSync(
    join(tools, "psql.exe"),
    [
      "-h",
      "127.0.0.1",
      "-p",
      String(port),
      "-U",
      "quiz_test",
      "-d",
      database,
      "-X",
      "-q",
      "-A",
      "-t",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      input,
      encoding: "utf8",
      env: { ...process.env, PGCLIENTENCODING: "UTF8" },
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (result.status !== 0)
    throw new Error(
      (result.stderr ?? "Lokale Prüfung fehlgeschlagen").slice(-2000),
    );
  return result.stdout.trim();
}
const args = {
  quiz_sync_metadata: ["expected_owner"],
  quiz_sync_page: [
    "expected_owner",
    "target_generation",
    "expected_revision",
    "after_revision",
    "page_cursor",
    "page_size",
  ],
  quiz_sync_catalog: ["catalog_hash"],
  quiz_sync_objects: ["expected_owner", "target_generation", "object_hashes"],
  quiz_sync_object_read: [
    "expected_owner",
    "target_generation",
    "object_hash",
    "part_offset",
  ],
};
const metrics = [];
const api = {
  stop() {},
  async call(name, values) {
    if (!args[name]) throw new Error("Nur ausdrücklich erlaubte Lese-RPCs.");
    const data = JSON.parse(
      sql(
        after,
        `begin;set local role authenticated;select set_config('request.jwt.claim.sub',${literal(owner)},true);select public.${name}(${args[name].map((k) => (Array.isArray(values[k]) ? "array[" + values[k].map(literal).join(",") + "]::text[]" : literal(values[k]))).join(",")});rollback;`,
      )
        .split(/\r?\n/)
        .at(-1),
    );
    metrics.push({
      name,
      requestBytes: bytes(values),
      responseBytes: bytes(data),
    });
    return data;
  },
};
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const remote = await server.ssrLoadModule("/src/entryRemote.ts"),
    codec = await server.ssrLoadModule("/src/syncCodec.ts"),
    { decodeCloudState } = await server.ssrLoadModule("/src/cloudCodec.ts"),
    { validateBackup } = await server.ssrLoadModule("/src/backupValidation.ts");
  const metadata = await remote.getMetadata(api, owner);
  assert.equal(metadata.revision, 13);
  const first = await remote.downloadDocument(
    api,
    owner,
    metadata.generation,
    metadata.revision,
  );
  const ending = await remote.getMetadata(api, owner);
  assert.deepEqual(metadata, ending);
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
  assert(
    codec.jsonEqual(
      codec.reconstructState(first.document, first.catalogs),
      expected,
    ),
  );
  const summarize = () => ({
    requests: metrics.length,
    requestBytes: metrics.reduce((a, v) => a + v.requestBytes, 0),
    responseBytes: metrics.reduce((a, v) => a + v.responseBytes, 0),
    byRpc: structuredClone(metrics),
  });
  const firstRead = summarize();
  metrics.length = 0;
  const unchangedMetadata = await remote.getMetadata(api, owner);
  assert.deepEqual(metadata, unchangedMetadata);
  const unchangedRead = summarize();
  metrics.length = 0;
  const previous = validateBackup(
    await decodeCloudState(
      JSON.parse(
        sql(
          before,
          "select payload from bench.templates order by step desc offset 1 limit 1;",
        ),
      ),
    ),
  );
  const priorDocument = await codec.compileState(previous, first.catalogs);
  const changeMetadata = await remote.getMetadata(api, owner);
  const changed = await remote.downloadDocument(
    api,
    owner,
    metadata.generation,
    metadata.revision,
    metadata.revision - 1,
    priorDocument,
  );
  assert.deepEqual(changeMetadata, await remote.getMetadata(api, owner));
  assert(
    codec.jsonEqual(
      codec.reconstructState(changed.document, changed.catalogs),
      expected,
    ),
  );
  const changedRead = summarize();
  const oldPayload = JSON.parse(
    sql(
      before,
      "select payload from bench.templates order by step desc limit 1;",
    ),
  );
  const reportPath = "docs/Speicher-und-Sync-Messung.json",
    report = JSON.parse(await readFile(reportPath, "utf8"));
  assert.equal(report.runId, runId);
  report.downloads = {
    controlledAccountHistoryRounds: 30,
    finalRevision: 13,
    method:
      "Actual read-only RPC results from the isolated native PostgreSQL schema through the real downloadDocument client; UTF-8 JSON request/response bodies, including PostgreSQL base64 line breaks, page envelopes and private-object text escaping. Excludes HTTP headers, auth and transport compression. First read uses a fresh synthetic IndexedDB; subsequent reads reuse the verified catalog.",
    oldFullResponseBytes: bytes([
      {
        state: oldPayload,
        revision: 13,
        updated_at: "2026-10-03T12:00:00+00:00",
      },
    ]),
    firstRead,
    unchangedRead,
    changedRead,
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify({
      verified: true,
      firstReadBytes: firstRead.responseBytes,
      unchangedReadBytes: unchangedRead.responseBytes,
      changedReadBytes: changedRead.responseBytes,
    }),
  );
} finally {
  await server.close();
}

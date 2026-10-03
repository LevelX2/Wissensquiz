import { createServer } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { strict as assert } from "node:assert";

// No database connection. Accept an operator-exported, single-snapshot envelope.
// Private artifacts are always written below the ignored tmp-sync directory.
const id =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
if (process.argv[2] === "--export-query") {
  const owner = process.argv[3];
  if (!id.test(owner ?? ""))
    throw new Error("Eine gültige Konto-ID ist erforderlich.");
  console.log(`-- One MVCC statement, operator read only. Save output privately, never in Git.
select jsonb_build_object('owner',h.owner_id,'generation',h.generation,'revision',h.revision,
 'rows',(select coalesce(jsonb_agg(jsonb_build_object('kind',e.kind,'id',e.id,'position',e.position,'value',e.value)),'[]') from public.quiz_sync_entries e where e.owner_id=h.owner_id and e.generation=h.generation and not e.deleted),
 'objects',(select coalesce(jsonb_agg(jsonb_build_object('hash',o.hash,'encoding',o.encoding,'text',o.content)),'[]') from public.quiz_private_catalog_objects o where o.owner_id=h.owner_id and o.generation=h.generation),
 'catalogs',(select coalesce(jsonb_agg(jsonb_build_object('hash',c.hash,'encoding','gzip-field-refs-v1','data',replace(encode(c.payload,'base64'),chr(10),''),'digests',c.digests)),'[]') from public.quiz_generation_catalog_refs r join public.quiz_catalog_releases c on c.hash=r.release where r.owner_id=h.owner_id and r.generation=h.generation))
from public.quiz_account_heads h where h.owner_id=${literal(owner)} and h.generation is not null;`);
  process.exit(0);
}
const input = process.argv[2];
if (!input)
  throw new Error(
    "Gib die private Snapshot-Datei an, oder --export-query mit Konto-ID.",
  );
const output = resolve(process.argv[3] ?? "tmp-sync/maintenance"),
  privateRoot = resolve("tmp-sync"),
  within = relative(privateRoot, output);
if (within.startsWith("..") || /^[A-Za-z]:/.test(within))
  throw new Error("Private Ausgaben müssen unter tmp-sync bleiben.");
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const envelope = JSON.parse(await readFile(input, "utf8"));
  if (
    !id.test(envelope.owner ?? "") ||
    !id.test(envelope.generation ?? "") ||
    !Number.isSafeInteger(envelope.revision) ||
    envelope.revision < 1
  )
    throw new Error(
      "Der aktuelle Konto-/Generations-/Revisionsnachweis fehlt.",
    );
  const { verifyObject, verifyRelease, reconstructState, jsonEqual, sha256 } =
      await server.ssrLoadModule("/src/syncCodec.ts"),
    { encodeCloudState, decodeCloudState } =
      await server.ssrLoadModule("/src/cloudCodec.ts"),
    { validateBackup } = await server.ssrLoadModule("/src/backupValidation.ts");
  assert(
    Array.isArray(envelope.rows) &&
      Array.isArray(envelope.objects) &&
      Array.isArray(envelope.catalogs),
  );
  for (const object of envelope.objects) await verifyObject(object);
  const catalogs = await Promise.all(envelope.catalogs.map(verifyRelease)),
    document = {
      rows: new Map(envelope.rows.map((row) => [`${row.kind}:${row.id}`, row])),
      objects: new Map(envelope.objects.map((object) => [object.hash, object])),
    };
  assert.equal(document.rows.size, envelope.rows.length);
  assert.equal(document.objects.size, envelope.objects.length);
  const state = reconstructState(document, catalogs),
    full = JSON.stringify(state),
    backupHash = await sha256(full),
    legacy = await encodeCloudState(state),
    legacyText = JSON.stringify(legacy),
    legacyHash = await sha256(legacyText);
  assert(jsonEqual(validateBackup(await decodeCloudState(legacy)), state));
  await mkdir(output, { recursive: true });
  await writeFile(join(output, "latest-full-state.json"), full);
  const args = `${literal(envelope.owner)}::uuid,${literal(envelope.generation)}::uuid,${envelope.revision}`;
  await writeFile(
    join(output, "release-fallback.sql"),
    `-- Apply only after separately retaining the verified latest-full-state.json.\n-- Exact current generation/revision is checked under the per-account lock.\nselect quiz_sync_internal.release_fallback(${args},${literal(backupHash)});\n`,
  );
  await writeFile(
    join(output, "rollback.sql"),
    `-- Operator-approved emergency fallback, never an old archive flip.\n-- Restores the verified latest snapshot with a NEW revision and pauses entry rollout.\nselect quiz_sync_internal.rollback(${args},${literal(legacyText)},${literal(legacyHash)});\n`,
  );
  await writeFile(
    join(output, "verification.json"),
    JSON.stringify(
      {
        owner: envelope.owner,
        generation: envelope.generation,
        revision: envelope.revision,
        fullStateSha256: backupHash,
        legacyPayloadSha256: legacyHash,
        fullStateBytes: Buffer.byteLength(full),
        legacyBytes: Buffer.byteLength(legacyText),
        catalogProofs: catalogs.map((c) => c.hash),
        logicalRoundtrip: true,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      verified: true,
      revision: envelope.revision,
      questions: state.questions.length,
      rounds: state.rounds.length,
      artifacts: [
        "latest-full-state.json",
        "release-fallback.sql",
        "rollback.sql",
        "verification.json",
      ],
    }),
  );
} finally {
  await server.close();
}

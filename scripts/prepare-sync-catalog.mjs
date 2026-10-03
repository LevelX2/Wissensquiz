import { createServer } from "vite";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";

// Operator preparation only. Never connects to a database or reads user data.
const output = resolve(process.argv[2] ?? "tmp-sync/catalog");
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { validateBackup } = await server.ssrLoadModule(
    "/src/backupValidation.ts",
  );
  const { prepareRelease, verifyRelease } =
    await server.ssrLoadModule("/src/syncCodec.ts");
  const state = emptyState();
  addPackages(
    state,
    await Promise.all(
      packages.map(async (pkg) => ({
        filename: pkg.filename,
        text: await readFile(`public${pkg.path}`, "utf8"),
      })),
    ),
  );
  const questions = validateBackup(state).questions;
  const {
    byContent: _,
    questions: __,
    ...release
  } = await prepareRelease(questions);
  assert.deepEqual((await verifyRelease(release)).questions, questions);
  const scores = questions.map((q) => ({
    id: q.id,
    version: q.version,
    correctId: q.correctId,
    domain: q.domain,
    difficulty: q.difficulty,
    metadata:
      q.metadata.subdomain === undefined
        ? {}
        : { subdomain: q.metadata.subdomain },
  }));
  const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
  const columns = `${literal(release.hash)},1,decode(${literal(release.data)},'base64'),${literal(JSON.stringify(release.digests))}::jsonb,${literal(JSON.stringify(scores))}::jsonb,${questions.length}`;
  const sql = `-- Public operator catalog; generated from all actual App packages.\nbegin;\ninsert into public.quiz_catalog_releases(hash,protocol,payload,digests,score_fields,question_count) values(${columns}) on conflict(hash) do nothing;\ndo $$begin if not exists(select 1 from public.quiz_catalog_releases where hash=${literal(release.hash)} and payload=decode(${literal(release.data)},'base64') and digests=${literal(JSON.stringify(release.digests))}::jsonb and score_fields=${literal(JSON.stringify(scores))}::jsonb) then raise exception 'immutable_catalog_mismatch'; end if; end$$;\ncommit;\n`;
  await mkdir(output, { recursive: true });
  await writeFile(join(output, "release.json"), JSON.stringify(release));
  await writeFile(join(output, "operator-seed.sql"), sql);
  // Management APIs may cap request bodies; stage only operator-approved data.
  const manifest = JSON.stringify({
    ...release,
    protocol: 1,
    scoreFields: scores,
    questionCount: questions.length,
  });
  const manifestHash = createHash("sha256").update(manifest).digest("hex");
  const parts = [];
  for (let at = 0; at < manifest.length;) {
    let end = Math.min(at + 16000, manifest.length);
    if (end < manifest.length && /[\uD800-\uDBFF]/.test(manifest[end - 1]))
      end--;
    parts.push(manifest.slice(at, end));
    at = end;
  }
  await mkdir(join(output, "publication-parts"), { recursive: true });
  for (let part = 0; part < parts.length; part++)
    await writeFile(
      join(output, "publication-parts", `${String(part).padStart(4, "0")}.sql`),
      `insert into quiz_sync_internal.catalog_publication_parts(manifest_sha256,part,total,content) values(${literal(manifestHash)},${part},${parts.length},${literal(parts[part])}) on conflict do nothing;\n`,
    );
  await writeFile(
    join(output, "operator-publish.sql"),
    `select quiz_sync_internal.publish_catalog(${literal(manifestHash)});\n`,
  );
  await writeFile(
    join(output, "publication.json"),
    JSON.stringify({
      manifestHash,
      parts: parts.length,
      bytes: Buffer.byteLength(manifest),
      releaseHash: release.hash,
    }),
  );
  console.log(
    JSON.stringify({
      hash: release.hash,
      questions: questions.length,
      encodedBytes: Buffer.byteLength(JSON.stringify(release)),
      outputFiles: ["release.json", "operator-seed.sql"],
    }),
  );
} finally {
  await server.close();
}

import { createServer } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// Operator-only, public sources only. Does not connect to Supabase or inspect
// account data. Run after prepare:sync-catalog, then publish these SQL parts.
const output = resolve(process.argv[2] ?? "tmp-sync/ranked-catalog");
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const { verifyRelease } = await server.ssrLoadModule("/src/syncCodec.ts");
  const { genreOf, questionSourceOf } =
    await server.ssrLoadModule("/src/filters.ts");
  const release = await verifyRelease(
    JSON.parse(await readFile("tmp-sync/catalog/release.json", "utf8")),
  );
  const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
  await mkdir(output, { recursive: true });
  let part = 0,
    batch = [],
    bytes = 0;
  const flush = async () => {
    if (!batch.length) return;
    const sql = `-- Operator publication of immutable official questions.\nbegin;\ninsert into quiz_ranked_internal.catalog(release_hash,id,knowledge_id,difficulty,genre,source,question) values\n${batch.join(",\n")}\non conflict(release_hash,id) do nothing;\ncommit;\n`;
    await writeFile(
      join(output, `${String(part++).padStart(4, "0")}.sql`),
      sql,
    );
    batch = [];
    bytes = 0;
  };
  for (const q of release.questions) {
    const row = `(${literal(release.hash)},${literal(q.id)},${literal(q.knowledgeId)},${literal(q.difficulty)},${literal(genreOf(q))},${literal(questionSourceOf(q))},${literal(JSON.stringify(q))}::jsonb)`;
    const size = Buffer.byteLength(row);
    if (bytes + size > 48000) await flush();
    batch.push(row);
    bytes += size;
  }
  await flush();
  await writeFile(
    join(output, "verify.sql"),
    `select c.hash,c.question_count,count(q.id) as ranked_questions,c.question_count=count(q.id) as complete from public.quiz_catalog_releases c left join quiz_ranked_internal.catalog q on q.release_hash=c.hash where c.hash=${literal(release.hash)} group by c.hash,c.question_count;\n`,
  );
  await writeFile(
    join(output, "publication.json"),
    JSON.stringify({
      releaseHash: release.hash,
      questions: release.questions.length,
      parts: part,
    }),
  );
  await writeFile(
    join(output, "activate.sql"),
    `begin;\ndo $$begin if not exists(select 1 from public.quiz_catalog_releases c where c.hash=${literal(release.hash)} and c.question_count=(select count(*) from quiz_ranked_internal.catalog q where q.release_hash=c.hash)) then raise exception 'ranked_catalog_incomplete';end if;end$$;\ninsert into quiz_ranked_internal.config(id,release_hash) values(true,${literal(release.hash)}) on conflict(id) do update set release_hash=excluded.release_hash;\ncommit;\n`,
  );
  console.log(
    JSON.stringify({
      releaseHash: release.hash,
      questions: release.questions.length,
      parts: part,
    }),
  );
} finally {
  await server.close();
}

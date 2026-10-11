import { createServer } from "vite";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
try {
  const { verifyRelease } = await server.ssrLoadModule("/src/syncCodec.ts");
  const { preparePresentation } = await server.ssrLoadModule(
    "/src/questionPresentation.ts",
  );
  const release = await verifyRelease(
    JSON.parse(await readFile("tmp-sync/catalog/release.json", "utf8")),
  );
  const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
  await mkdir("tmp-sync/presentations", { recursive: true });
  let batch = [],
    bytes = 0,
    part = 0,
    total = 0;
  async function flush() {
    if (!batch.length) return;
    await writeFile(
      `tmp-sync/presentations/${String(part++).padStart(4, "0")}.sql`,
      `begin;\ninsert into quiz_game_internal.presentations(id,version,question,context,value) values\n${batch.join(",\n")}\non conflict(id) do update set version=excluded.version,question=excluded.question,context=excluded.context,value=excluded.value;\ncommit;\n`,
    );
    batch = [];
    bytes = 0;
  }
  for (const q of release.questions) {
    const value = preparePresentation(q);
    const row = `(${literal(q.id)},${literal(q.version)},${literal(q.question)},${literal(q.context)},${literal(JSON.stringify(value))}::jsonb)`;
    const length = Buffer.byteLength(row);
    if (bytes + length > 480000) await flush();
    batch.push(row);
    bytes += length;
    total += length;
  }
  await flush();
  console.log(
    JSON.stringify({
      questions: release.questions.length,
      parts: part,
      bytes: total,
    }),
  );
} finally {
  await server.close();
}

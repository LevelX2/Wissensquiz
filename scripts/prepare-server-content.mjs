// Operator-only preparation from public sources. No connection or account data.
import { createServer } from "vite";
import { readFile, mkdir, writeFile, readdir, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL("./prepare-runtime-metadata.mjs", import.meta.url)),
    "--check",
  ],
  {
    stdio: ["ignore", "ignore", "inherit"],
    windowsHide: true,
  },
);
const output = resolve(process.argv[2] ?? "tmp-sync/server-content");
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { validateBackup } = await server.ssrLoadModule(
    "/src/backupValidation.ts",
  );
  const { preparePresentation } = await server.ssrLoadModule(
    "/src/questionPresentation.ts",
  );
  const state = emptyState();
  addPackages(
    state,
    await Promise.all(
      packages.map(async (pkg) => ({
        filename: pkg.filename,
        text: await readFile("public" + pkg.path, "utf8"),
      })),
    ),
  );
  const questions = validateBackup(state).questions;
  const posters = JSON.parse(
    await readFile("public/film-posters.json", "utf8"),
  );
  const levels = JSON.parse(
    await readFile("src/filmFamiliarity.json", "utf8"),
  ).films;
  const content = questions.map((q) => ({
    q,
    presentation: preparePresentation(q, posters),
  }));
  const rows = content
    .map((value) => ({ id: value.q.id, text: JSON.stringify(value) }))
    .sort((a, b) => Buffer.compare(Buffer.from(a.id), Buffer.from(b.id)));
  const hash = createHash("sha256")
    .update(
      rows
        .map((row) => createHash("sha256").update(row.text).digest("hex"))
        .join(""),
    )
    .digest("hex");
  const literal = (v) => "'" + String(v).replaceAll("'", "''") + "'";
  await mkdir(output, { recursive: true });
  // Only this script's numbered output parts are replaced on another preparation.
  for (const file of await readdir(output))
    if (/^\d{4}\.sql$/.test(file)) await unlink(join(output, file));
  let batch = [],
    bytes = 0,
    part = 0;
  async function flush() {
    if (!batch.length) return;
    await writeFile(
      join(output, String(part++).padStart(4, "0") + ".sql"),
      "begin;\ninsert into quiz_game_internal.content_staging(hash,id,content) values\n" +
        batch.join(",\n") +
        "\non conflict(hash,id) do update set content=excluded.content;\ncommit;\n",
    );
    batch = [];
    bytes = 0;
  }
  for (const rowContent of rows) {
    const row =
      "(" +
      literal(hash) +
      "," +
      literal(rowContent.id) +
      "," +
      literal(rowContent.text) +
      ")";
    const size = Buffer.byteLength(row);
    if (bytes + size > 480000) await flush();
    batch.push(row);
    bytes += size;
  }
  await flush();
  await writeFile(
    join(output, "activate.sql"),
    "select quiz_game_internal.activate_content(" +
      literal(hash) +
      "," +
      questions.length +
      "," +
      literal(JSON.stringify(levels)) +
      "::jsonb);\n",
  );
  const publication = { hash, questions: questions.length, parts: part };
  await writeFile(
    join(output, "publication.json"),
    JSON.stringify(publication, null, 2) + "\n",
  );
  console.log(JSON.stringify(publication));
} finally {
  await server.close();
}

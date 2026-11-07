// Operator import into current content; no delivery archive or publication.
import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const input = process.argv[2];
const source = process.argv
  .find((arg) => arg.startsWith("--source="))
  ?.slice(9);
assert(
  input && ["film", "actors", "awards"].includes(source),
  "Aufruf: node scripts/import-current-questions.mjs <CSV-Datei> --source=film|actors|awards [--write]",
);
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, entries: [] },
});
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { importCsv } = await server.ssrLoadModule("/src/importer.ts");
  const { questionSourceOf } = await server.ssrLoadModule("/src/filters.ts");
  const { preparePresentation } = await server.ssrLoadModule(
    "/src/questionPresentation.ts",
  );
  const { familiarityOf } = await server.ssrLoadModule("/src/familiarity.ts");
  const state = emptyState();
  addPackages(
    state,
    await Promise.all(
      packages.map(async (p) => ({
        filename: p.filename,
        text: await readFile(p.path, "utf8"),
      })),
    ),
  );
  const imported = importCsv(
    await readFile(input, "utf8"),
    state.questions,
    "Aktuelle Redaktion",
  );
  assert(
    !imported.report.rejected &&
      !imported.report.duplicates &&
      !imported.report.warnings.length &&
      !imported.report.issues.length,
    JSON.stringify(imported.report),
  );
  assert(imported.questions.length, "Keine neuen Fragen.");
  for (const q of imported.questions) {
    assert.equal(
      questionSourceOf(q),
      source,
      `${q.id}: falscher Fragenbereich`,
    );
    assert(familiarityOf(q), `${q.id}: Bekanntheit fehlt`);
    const display = preparePresentation(q);
    if (source !== "actors") {
      const references =
        source === "awards"
          ? (q.metadata.film_refs?.split(";").filter(Boolean) ?? [])
          : [];
      assert.equal(
        display.films.length,
        references.length || 1,
        `${q.id}: Filmdaten fehlen`,
      );
      for (const reference of references) {
        assert(
          display.films.some(
            ({ data }) => `${data.originalTitle}|${data.year}` === reference,
          ),
          `${q.id}: Filmdaten für ${reference} fehlen`,
        );
      }
      assert.equal(
        display.films[0].data.originalTitle,
        q.metadata.film_title_original,
      );
      assert.equal(display.films[0].data.year, Number(q.metadata.film_year));
    }
  }
  const definition = packages.find((p) => p.source === source);
  const next = [
    ...state.questions.filter((q) => questionSourceOf(q) === source),
    ...imported.questions,
  ].sort((a, b) => a.id.localeCompare(b.id, "en"));
  if (process.argv.includes("--write"))
    await writeFile(
      definition.path,
      next.map((q) => JSON.stringify(q)).join("\n") + "\n",
    );
  console.log(
    JSON.stringify(
      {
        source,
        accepted: imported.questions.length,
        currentAreaQuestions: next.length,
        written: process.argv.includes("--write"),
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}

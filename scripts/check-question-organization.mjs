// Validate the current public editorial content. No previous deliveries,
// account state, production access or chronological import stages are needed.
// Validate the current public editorial content. No previous deliveries,
// account state, production access or chronological import stages are needed.
import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, entries: [] },
});
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { questionSourceOf, genreOf } =
    await server.ssrLoadModule("/src/filters.ts");
  const { familiarityOf } = await server.ssrLoadModule("/src/familiarity.ts");
  const { encodeQuestionCatalog, decodeQuestionCatalog } =
    await server.ssrLoadModule("/src/catalogCodec.ts");
  const { validateBackup } = await server.ssrLoadModule(
    "/src/backupValidation.ts",
  );
  const inputs = await Promise.all(
    packages.map(async (p) => ({
      filename: p.filename,
      text: await readFile(p.path, "utf8"),
    })),
  );
  const state = emptyState();
  addPackages(state, inputs);
  validateBackup(state);
  const full = JSON.stringify(state.questions);
  assert.equal(
    JSON.stringify(
      decodeQuestionCatalog(encodeQuestionCatalog(state.questions)),
    ),
    full,
  );
  const reversed = emptyState();
  addPackages(reversed, [...inputs].reverse());
  const ordered = (qs) =>
    qs
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id, "en"))
      .map((q) => JSON.stringify(q))
      .join("\n");
  assert.equal(ordered(state.questions), ordered(reversed.questions));
  addPackages(state, inputs);
  assert.equal(JSON.stringify(state.questions), full);
  const groups = new Map();
  for (const q of state.questions) {
    const source = questionSourceOf(q);
    const key = [
      source,
      source === "film" ? genreOf(q) : "",
      q.difficulty,
      familiarityOf(q) ?? 0,
    ].join("|");
    const ids = groups.get(key) ?? [];
    ids.push(q.id);
    groups.set(key, ids);
  }
  const report = {
    format: "current-question-catalog-v1",
    scope:
      "Aktuelle fachliche Bestände; keine Lieferarchive, Altstände oder Nutzerdaten.",
    catalogSha256: createHash("sha256")
      .update(ordered(state.questions))
      .digest("hex"),
    counts: {
      sources: packages.length,
      questions: state.questions.length,
      knowledgeGoals: new Set(state.questions.map((q) => q.knowledgeId)).size,
      duplicateQuestionIds: 0,
      questionsWithVariantReference: state.questions.filter(
        (q) => q.metadata.variant_of,
      ).length,
    },
    areas: Object.fromEntries(
      packages.map((p) => [
        p.source,
        state.questions.filter((q) => questionSourceOf(q) === p.source).length,
      ]),
    ),
    checks: {
      completeSchemaValidation: true,
      validKnowledgeReferences: true,
      orderIndependent: true,
      idempotent: true,
      fullBackupValidated: true,
      exactJsonRoundtrip: true,
    },
    attributeGroups: [...groups]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([attributes, ids]) => ({ attributes, count: ids.length })),
  };
  await writeFile(
    "docs/Fragedaten-Pruefung.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        counts: report.counts,
        areas: report.areas,
        checks: report.checks,
        sha256: report.catalogSha256,
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}

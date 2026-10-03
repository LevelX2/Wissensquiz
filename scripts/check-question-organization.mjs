import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { strict as assert } from "node:assert";

// Reproducible inspection of public sources only; no personal browser data.
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { encodeQuestionCatalog, decodeQuestionCatalog } =
    await server.ssrLoadModule("/src/catalogCodec.ts");
  const { validateBackup } = await server.ssrLoadModule("/src/storage.ts");
  const state = emptyState();
  const sources = await Promise.all(
    packages.map(async (pkg) => {
      const [app, original] = await Promise.all([
        readFile(join("public", pkg.path.slice(1))),
        readFile(join("KI-Wissen-Wissensquiz/01 Rohquellen", pkg.filename)),
      ]);
      assert(app.equals(original), `Quellabweichung: ${pkg.filename}`);
      return { filename: pkg.filename, text: app.toString("utf8") };
    }),
  );
  addPackages(state, sources);
  assert(
    state.imports.every((r) => r.rejected === 0 && r.duplicates === 0),
    "Importkonflikt",
  );
  const validated = validateBackup(state);
  const full = JSON.stringify(validated.questions);
  const packed = encodeQuestionCatalog(validated.questions);
  assert.equal(
    JSON.stringify(decodeQuestionCatalog(packed)),
    full,
    "Katalog nicht verlustfrei",
  );
  const packedQuestions = JSON.parse(packed);
  const bytes = (value) => Buffer.byteLength(value, "utf8");
  const report = {
    format: "question-organization-audit-v1",
    scope:
      "Öffentliche App-Pakete, Kategoriezuordnungen und generierte Filmfragen; keine Spielerdaten. Größen sind UTF-8-JSON-Nutzdaten, keine Messung der Browser-Speicherquote.",
    catalogSha256: createHash("sha256").update(full).digest("hex"),
    counts: {
      packages: packages.length,
      questions: validated.questions.length,
      knowledgeGoals: new Set(validated.questions.map((q) => q.knowledgeId))
        .size,
      duplicateQuestionIds:
        validated.questions.length -
        new Set(validated.questions.map((q) => q.id)).size,
      questionsWithVariantReference: validated.questions.filter(
        (q) => q.metadata.variant_of,
      ).length,
      generatedFilmQuestions: validated.questions.filter(
        (q) => q.metadata.fact_catalog_id,
      ).length,
    },
    checks: {
      publicSourcesByteIdentical: true,
      rejectedImports: 0,
      duplicateImports: 0,
      fullBackupValidated: true,
      exactJsonRoundtrip: true,
    },
    localCatalog: {
      encoding: "json-field-refs-v1",
      fullJsonBytes: bytes(full),
      compactJsonBytes: bytes(packed),
      savedBytes: bytes(full) - bytes(packed),
      savedPercent: Number(
        (100 * (1 - bytes(packed) / bytes(full))).toFixed(2),
      ),
      referencedMetadataValues: packedQuestions.reduce(
        (n, q) =>
          n +
          Object.values(q.metadata).filter((value) => typeof value === "number")
            .length,
        0,
      ),
    },
    roundBefore: {
      previousBehavior:
        "Jede neue Solorunde kopierte alle vorhandenen Lernstände.",
      currentBehavior:
        "Nur bereits vorhandene Lernstände der höchstens zehn ausgewählten Wissensziele werden kopiert; historische Runden bleiben unverändert.",
    },
  };
  await writeFile(
    "docs/Fragedaten-Pruefung.json",
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await server.close();
}

// Real importer and metadata checks using public sources and a synthetic state.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { strict as assert } from "node:assert";
import { createServer } from "vite";
import Papa from "papaparse";
const root = "docs/Erweiterung-2026-10-07";
const read = (p) =>
  JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
const hash = (b) => createHash("sha256").update(b).digest("hex");
const baseline = read(root + "/Bestandsquellen.json");
for (const p of baseline.inputs)
  assert.equal(
    hash(fs.readFileSync(p.path)),
    p.sha256,
    "Existing source changed " + p.path,
  );
Date.now = () => Date.UTC(2026, 9, 7, 10);
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, entries: [] },
});
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { importCsv } = await server.ssrLoadModule("/src/importer.ts");
  const { filmData, addFilmFacts } =
    await server.ssrLoadModule("/src/filmFacts.ts");
  const { actorPresentation } = await server.ssrLoadModule(
    "/src/actorEditorial.ts",
  );
  const { questionSourceOf, normalizeGenre } =
    await server.ssrLoadModule("/src/filters.ts");
  const { familiarityOf, filmIdentity } = await server.ssrLoadModule(
    "/src/familiarity.ts",
  );
  const { validateBackup } = await server.ssrLoadModule(
    "/src/backupValidation.ts",
  );
  const contents = packages.map((p) => ({
    filename: p.filename,
    text: fs.readFileSync("public" + p.path, "utf8"),
  }));
  const incoming = contents.filter((p) =>
    p.filename.endsWith("fragen_20261007.csv"),
  );
  assert.equal(incoming.length, 3);
  assert.equal(packages.length, 24);
  const state = emptyState();
  addPackages(
    state,
    contents.filter((p) => !incoming.includes(p)),
  );
  assert.equal(state.questions.length, 8397);
  const oldQuestions = structuredClone(state.questions),
    oldGoals = new Set(state.questions.map((q) => q.knowledgeId));
  const parsed = [];
  for (const [i, p] of incoming.entries()) {
    assert.equal(p.text, fs.readFileSync(root + "/" + p.filename, "utf8"));
    assert.equal(
      p.text,
      fs.readFileSync(
        "KI-Wissen-Wissensquiz/01 Rohquellen/" + p.filename,
        "utf8",
      ),
    );
    const result = importCsv(
      p.text,
      [...oldQuestions, ...parsed.flatMap((r) => r.questions)],
      p.filename,
    );
    assert.deepEqual(
      [
        result.report.accepted,
        result.report.rejected,
        result.report.duplicates,
        result.report.issues.length,
        result.report.warnings.length,
      ],
      [[2240, 160, 80][i], 0, 0, 0, 0],
    );
    const rows = Papa.parse(p.text, {
      header: true,
      skipEmptyLines: "greedy",
    }).data;
    for (const [j, q] of result.questions.entries()) {
      const row = rows[j];
      for (const [field, value] of Object.entries(row))
        assert.equal(
          q.metadata[field],
          field === "subdomain" ? normalizeGenre(value) : value,
          q.id + " " + field,
        );
      assert.equal(q.knowledgeId, row.knowledge_id);
      assert.equal(q.context, row.explanation_context);
      assert.equal(q.explanation, row.explanation_short);
      assert.equal(q.anchor, row.memory_anchor);
      for (const l of "abcd") {
        const answer = q.answers.find((a) => a.id === q.id + ":" + l);
        assert.equal(answer.text, row["answer_" + l]);
        assert.equal(answer.feedback, row["feedback_" + l]);
      }
    }
    parsed.push(result);
  }
  addPackages(state, incoming);
  assert.equal(state.questions.length, 10877);
  assert.equal(state.bundledQuestionIds.length, 10877);
  assert.equal(state.imports.length, 24);
  assert.deepEqual(state.questions.slice(0, oldQuestions.length), oldQuestions);
  const added = state.questions.slice(oldQuestions.length),
    byId = new Map(state.questions.map((q) => [q.id, q]));
  for (const q of added) {
    if (q.metadata.variant_of)
      assert.equal(
        q.knowledgeId,
        byId.get(q.metadata.variant_of)?.knowledgeId,
        "Variant " + q.id,
      );
    if (questionSourceOf(q) === "actors") {
      assert.equal(filmData(q), undefined);
      const display = actorPresentation(q);
      assert(display);
      for (const ref of display.films) {
        const data = filmData(q, ref);
        assert(
          data?.directors && data.countries.length && data.sources.length,
          q.id + " " + ref,
        );
      }
    } else assert(filmData(q)?.directors && familiarityOf(q), q.id);
  }
  const facts = addFilmFacts(state.questions);
  assert.deepEqual(facts.added, []);
  const once = JSON.stringify(state);
  addPackages(state, contents);
  assert.equal(JSON.stringify(state), once);
  assert.equal(validateBackup(structuredClone(state)).questions.length, 10877);
  const variants = added.filter((q) => q.metadata.variant_of);
  const counts = {
    packages: 24,
    questions: 10877,
    knowledgeGoals: new Set(state.questions.map((q) => q.knowledgeId)).size,
    variantReferences: state.questions.filter((q) => q.metadata.variant_of)
      .length,
    filmQuestions: state.questions.filter((q) => questionSourceOf(q) === "film")
      .length,
    actorQuestions: state.questions.filter(
      (q) => questionSourceOf(q) === "actors",
    ).length,
    awardQuestions: state.questions.filter(
      (q) => questionSourceOf(q) === "awards",
    ).length,
    filmWorks: new Set(
      state.questions
        .filter((q) => questionSourceOf(q) === "film")
        .map(filmIdentity),
    ).size,
    persons: new Set(
      state.questions
        .filter((q) => questionSourceOf(q) === "actors")
        .map((q) => q.metadata.person_id),
    ).size,
  };
  const report = {
    as_of: "2026-10-07",
    status: "mit_app_parser_geprueft_und_lokal_integriert",
    scope:
      "Öffentliche Paketquellen und isolierter In-Memory-Spielstand; keine echten Spielerdaten und keine Veröffentlichung.",
    baseline: { questions: 8397, knowledgeGoals: oldGoals.size, packages: 21 },
    added: {
      entries: 320,
      films: 280,
      persons: 20,
      awardEntries: 20,
      questions: 2480,
      filmQuestions: 2240,
      personQuestions: 160,
      awardQuestions: 80,
      newGoals: new Set(
        added
          .filter((q) => !oldGoals.has(q.knowledgeId))
          .map((q) => q.knowledgeId),
      ).size,
      reusedGoals: new Set(
        added
          .filter((q) => oldGoals.has(q.knowledgeId))
          .map((q) => q.knowledgeId),
      ).size,
      variants: variants.length,
    },
    counts,
    parser: parsed.map((r) => r.report),
    links: variants.map((q) => ({
      question_id: q.id,
      knowledge_id: q.knowledgeId,
      variant_of: q.metadata.variant_of,
    })),
    checks: {
      all2480AcceptedWithoutWarnings: true,
      existing8397QuestionObjectsAndVersionsUnchanged: true,
      existing21PackageBytesUnchanged: true,
      allMetadataAnswersFeedbackAndDepthPreserved: true,
      filmReferencesResolved: true,
      familiarityResolved: true,
      noAdditionalFactQuestions: true,
      repeatImportUnchanged: true,
      fullBackupValid: true,
      uniqueIds: new Set(state.questions.map((q) => q.id)).size === 10877,
    },
    hashes: incoming.map((p) => ({
      filename: p.filename,
      sha256: hash(p.text),
    })),
  };
  fs.writeFileSync(
    root + "/Integration-Pruefung.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({ added: report.added, counts, checks: report.checks }),
  );
} finally {
  await server.close();
}

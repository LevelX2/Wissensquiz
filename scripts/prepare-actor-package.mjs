import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Derive app content exclusively from the public editorial package. Never read
// browser or account data. Preserve the original JSON and its proposed IDs.
const inputPath =
  "docs/Schauspieler-Fragenpaket/Schauspieler_100_Personen_800_Fragen.json";
const filename = "Schauspieler_800_Fragen_App.csv";
const sourceText = await readFile(inputPath, "utf8");
const source = JSON.parse(sourceText);
const links = JSON.parse(
  await readFile("src/actorKnowledgeLinks.json", "utf8"),
);
const actors = new Map(source.actors.map((actor) => [actor.actor_id, actor]));
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { importCsv } = await server.ssrLoadModule("/src/importer.ts");
  const state = emptyState();
  addPackages(
    state,
    await Promise.all(
      packages
        .filter((pkg) => pkg.filename !== filename)
        .map(async (pkg) => ({
          filename: pkg.filename,
          text: await readFile(`public${pkg.path}`, "utf8"),
        })),
    ),
  );
  const oldById = new Map(state.questions.map((q) => [q.id, q]));
  const originalQuestions = structuredClone(state.questions);
  const rows = source.questions.map((q) => {
    const actor = actors.get(q.actor_id);
    if (!actor) throw new Error(`Person fehlt: ${q.actor_id}`);
    const target = links[q.question_id]
      ? oldById.get(links[q.question_id])
      : null;
    if (links[q.question_id] && !target)
      throw new Error(`Bestandsreferenz fehlt: ${links[q.question_id]}`);
    const correct = q.answers.find(
      (answer) => answer.id === q.correct_answer,
    ).text;
    return {
      question_id: q.question_id,
      knowledge_id: target?.knowledgeId ?? q.knowledge_id,
      variant_of: target?.id ?? "",
      language: "de",
      domain: "Personen",
      subdomain: "Schauspieler",
      person_id: actor.actor_id,
      person_name: actor.name,
      person_name_before_answer: String(q.actor_name_before_answer),
      difficulty: q.difficulty === "außergewöhnlich" ? "experte" : q.difficulty,
      source_difficulty: q.difficulty,
      question_type: q.question_type,
      question: q.question,
      ...Object.fromEntries(
        q.answers.map((answer) => [
          `answer_${answer.id.toLowerCase()}`,
          answer.text,
        ]),
      ),
      correct_answer: q.correct_answer,
      explanation_short: `Gesucht ist: ${correct}${/[.!?]$/.test(correct) ? "" : "."}`,
      explanation_context: q.additional_info,
      memory_anchor: "",
      topic_tags: `Schauspieler;${q.question_type}`,
      badge_tags: "Schauspieler",
      source_urls: q.source_urls.join("|"),
      verification_status: q.verification_status,
    };
  });
  if (rows.length !== 800 || actors.size !== 100)
    throw new Error("Unvollständiger Redaktionsstand.");
  const columns = Object.keys(rows[0]);
  const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csv =
    [
      columns.join(","),
      ...rows.map((row) => columns.map((key) => cell(row[key])).join(",")),
    ].join("\n") + "\n";
  const imported = importCsv(csv, state.questions, filename);
  if (
    imported.report.accepted !== 800 ||
    imported.report.rejected ||
    imported.report.duplicates ||
    imported.report.warnings.length
  )
    throw new Error(JSON.stringify(imported.report));
  await writeFile(
    `KI-Wissen-Wissensquiz/01 Rohquellen/${filename}`,
    csv,
    "utf8",
  );
  await writeFile("public/schauspieler-fragen.csv", csv, "utf8");
  addPackages(state, [{ filename, text: csv }]);
  if (
    JSON.stringify(state.questions.slice(0, originalQuestions.length)) !==
    JSON.stringify(originalQuestions)
  )
    throw new Error("Bestehende Fragen wurden verändert.");
  const hash = (text) => createHash("sha256").update(text).digest("hex");
  const counts = {};
  for (const q of imported.questions)
    counts[q.difficulty] = (counts[q.difficulty] ?? 0) + 1;
  const report = {
    created_on: "2026-10-03",
    source: inputPath,
    source_sha256: hash(sourceText),
    app_csv_sha256: hash(csv),
    people: actors.size,
    questions: imported.questions.length,
    questions_by_difficulty: counts,
    reused_knowledge_ids: Object.keys(links).length,
    new_knowledge_ids: imported.questions.filter((q) => !links[q.id]).length,
    knowledge_links: rows
      .filter((row) => row.variant_of)
      .map((row) => ({
        question_id: row.question_id,
        knowledge_id: row.knowledge_id,
        variant_of: row.variant_of,
      })),
    parser: {
      accepted: imported.report.accepted,
      rejected: imported.report.rejected,
      duplicates: imported.report.duplicates,
      warnings: imported.report.warnings,
      issues: imported.report.issues,
    },
    total_questions: state.questions.length,
    total_knowledge_ids: new Set(state.questions.map((q) => q.knowledgeId))
      .size,
    old_questions_unchanged: true,
    note: "Eigenständige Personenkategorie. Keine verpflichtenden Filmdaten, keine Einordnung in die Filmreise. Quellen und redaktionelle Schwierigkeiten aus dem Originalpaket erhalten.",
  };
  await writeFile(
    "docs/importbericht-schauspieler.json",
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );
  console.log(
    JSON.stringify({
      questions: report.questions,
      new_goals: report.new_knowledge_ids,
      reused_goals: report.reused_knowledge_ids,
      total_questions: report.total_questions,
      total_goals: report.total_knowledge_ids,
    }),
  );
} finally {
  await server.close();
}

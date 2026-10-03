import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { strict as assert } from "node:assert";

const inputs = [
  { code: "P02", file: "Schauspieler_25_Personen_200_Fragen.json", count: 200 },
  { code: "P03", file: "Schauspieler_50_Personen_400_Fragen.json", count: 400 },
];
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
});
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
        .filter((p) => !p.filename.includes("Ergaenzung_P0"))
        .map(async (p) => ({
          filename: p.filename,
          text: await readFile(`public${p.path}`, "utf8"),
        })),
    ),
  );
  const original = structuredClone(state.questions);
  const editorial = {},
    films = new Map(),
    reports = [];
  for (const input of inputs) {
    const root = `docs/Schauspieler-Ergaenzung-${input.code}`;
    const text = await readFile(`${root}/${input.file}`, "utf8");
    const source = JSON.parse(text);
    const links = JSON.parse(
      await readFile(`${root}/Bestandsziel-Zuordnungen.json`, "utf8"),
    );
    const actors = new Map(source.actors.map((a) => [a.actor_id, a]));
    const byId = new Map(state.questions.map((q) => [q.id, q]));
    const rows = source.questions.map((q) => {
      const actor = actors.get(q.actor_id);
      assert(actor, q.actor_id);
      assert(!byId.has(q.question_id), q.question_id);
      const target = links[q.question_id]
        ? byId.get(links[q.question_id].question_id)
        : null;
      if (links[q.question_id]) {
        assert(target, q.question_id);
        assert.equal(target.knowledgeId, links[q.question_id].knowledge_id);
        assert.equal(q.knowledge_id, target.knowledgeId);
      }
      for (const film of source.films) {
        if (!films.has(film.film_id))
          films.set(film.film_id, {
            id: `ACTOR-SUPPLEMENT-${createHash("sha256").update(film.film_id).digest("hex").slice(0, 12)}`,
            film: film.film_id,
            title: film.title,
            originalTitle: film.original_title,
            year: film.first_release_year,
            directors: film.directors,
            productionCountries: film.production_countries,
            series: null,
            releaseNote: film.release_note ?? "",
            directorNote: "",
            directorContext: "",
            source: film.source_urls[0],
            additionalSources: film.source_urls.slice(1),
            checkedOn: film.checked_on,
            verificationStatus: film.verification_status,
          });
      }
      editorial[q.question_id] = {
        personId: actor.actor_id,
        originalQuestion: q.question,
        originalContext: q.additional_info,
        question: q.question,
        text: q.additional_info,
        films: q.film_refs,
        sources: q.source_urls,
      };
      for (const ref of q.film_refs) assert(films.has(ref), ref);
      const correct = q.answers.find((a) => a.id === q.correct_answer).text;
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
        difficulty:
          q.difficulty === "außergewöhnlich" ? "experte" : q.difficulty,
        source_difficulty: q.difficulty,
        question_type: q.question_type,
        question: q.question,
        ...Object.fromEntries(
          q.answers.map((a) => [`answer_${a.id.toLowerCase()}`, a.text]),
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
    assert.equal(rows.length, input.count);
    const columns = Object.keys(rows[0]);
    const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const csv =
      [
        columns.join(","),
        ...rows.map((row) => columns.map((key) => cell(row[key])).join(",")),
      ].join("\n") + "\n";
    const filename = `Schauspieler_Ergaenzung_${input.code}_${input.count}_Fragen_App.csv`;
    const imported = importCsv(csv, state.questions, filename);
    assert.equal(imported.report.accepted, input.count);
    assert.equal(imported.report.rejected, 0);
    assert.deepEqual(imported.report.warnings, []);
    for (const q of source.questions) {
      const app = imported.questions.find((a) => a.id === q.question_id);
      assert.equal(app.question, q.question);
      assert.equal(app.context, q.additional_info);
      assert.deepEqual(
        app.answers.map((a) => a.text),
        q.answers.map((a) => a.text),
      );
      assert.equal(
        app.answers.find((a) => a.id === app.correctId).text,
        q.answers.find((a) => a.id === q.correct_answer).text,
      );
    }
    await writeFile(
      `public/schauspieler-${input.code.toLowerCase()}-fragen.csv`,
      csv,
    );
    addPackages(state, [{ filename, text: csv }]);
    reports.push({
      package: input.code,
      source_sha256: createHash("sha256").update(text).digest("hex"),
      csv_sha256: createHash("sha256").update(csv).digest("hex"),
      people: actors.size,
      accepted: imported.report.accepted,
      linked_goals: Object.keys(links).length,
      new_goals: input.count - Object.keys(links).length,
    });
  }
  assert.deepEqual(state.questions.slice(0, original.length), original);
  await writeFile(
    "src/actorSupplementEditorial.json",
    JSON.stringify(
      { reviewedOn: "2026-10-03", questions: editorial },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    "src/actorSupplementFilmFacts.json",
    JSON.stringify([...films.values()], null, 2) + "\n",
  );
  const proof = {
    packages: reports,
    total_questions: state.questions.length,
    total_knowledge_ids: new Set(state.questions.map((q) => q.knowledgeId))
      .size,
    total_people: new Set(
      state.questions
        .filter((q) => q.metadata.person_id)
        .map((q) => q.metadata.person_id),
    ).size,
    original_questions_unchanged: true,
  };
  await writeFile(
    "docs/Schauspieler-Ergaenzungen-Integration.json",
    JSON.stringify(proof, null, 2) + "\n",
  );
  console.log(JSON.stringify(proof));
} finally {
  await server.close();
}

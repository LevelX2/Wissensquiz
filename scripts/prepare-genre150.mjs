// Build a named editorial wave from individually authored, reviewed film files.
// Re-running a wave verifies its original CSV rather than rewriting that source.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import Papa from "papaparse";

const root = "docs/Genres-150-2026-11-03";
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const wave = process.argv[2];
const write = process.argv.includes("--write");
assert(/^W\d{2}$/.test(wave ?? ""), "Specify an editorial wave, e.g. W01");
const manifest = read(`${root}/Pakete.json`);
assert(Array.isArray(manifest.series_updates), "Explicit related film-series decisions required");
const selected = manifest.packages.find((entry) => entry.wave === wave);
assert(selected, `Unknown wave ${wave}`);
const films = selected.films.map((id) => read(`${root}/Redaktion/${id}.json`));
const fields = "question_id,knowledge_id,variant_of,language,domain,subdomain,film_title_de,film_title_original,film_year,franchise,difficulty,question_type,topic_tags,badge_tags,learning_objective,question,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation_short,explanation_context,feedback_a,feedback_b,feedback_c,feedback_d,spoiler_level,source_urls,verification_status".split(",");
const codes = ["L1", "L2", "M1", "M2", "S1", "S2", "Y", "D"];
const normalized = (s) => s.normalize("NFKC").toLocaleLowerCase("de").replace(/\s+/g, " ").trim();
const team = (people) => people.length < 2 ? people[0] : `${people.slice(0, -1).join(", ")} und ${people.at(-1)}`;
const rows = [];
for (const [index, film] of films.entries()) {
  assert.equal(film.status, "quellengeprueft", `${film.id}: incomplete editorial review`);
  for (const field of ["id", "film_title_de", "film_title_original", "genre", "familiarity_reason", "selection_reason", "release_note", "series_note"])
    assert(typeof film[field] === "string" && film[field].trim(), `${film.id}: ${field}`);
  assert(Number.isInteger(film.film_year) && film.film_year > 1880);
  assert([1, 2, 3, 4].includes(film.familiarity_level));
  assert(film.directors.length && film.production_countries.length);
  assert(film.categories.every((name) => ["Classics", "Arthouse"].includes(name)));
  assert(film.series_sources.length && film.series_sources.every((url) => /^https?:\/\//.test(url)));
  if (film.series) {
    assert(film.series.name && Number.isInteger(film.series.position) && film.series.position > 0);
    assert(film.series.note?.trim());
  }
  assert.deepEqual(film.questions.map((q) => q.code).sort(), [...codes].sort(), film.id);
  const goals = new Set();
  for (const [qi, question] of film.questions.entries()) {
    const id = `G150-20261103-${film.id}-${question.code}`;
    assert.equal(question.answers.length, 4, id);
    assert.equal(question.feedback.length, 4, id);
    assert.equal(new Set(question.answers.map(normalized)).size, 4, id);
    for (const value of [question.objective, question.question, question.short, question.context, ...question.answers])
      assert(typeof value === "string" && value.trim(), `${id}: missing text`);
    assert(question.sources.length, `${id}: sources missing`);
    const sources = question.sources.map((key) => {
      const source = film.sources[key];
      assert(source && /^https?:\/\//.test(source.url) && source.accessed_on && source.supports, `${id}: ${key}`);
      return source.url;
    });
    assert(!/\b(?:Antwort|Option)\s+[ABCD]\b/i.test(question.feedback.join(" ")), id);
    const kind = question.code === "Y" ? "Filmjahr" : question.code === "D" ? "Regie" : "Filmwissen";
    if (question.code === "Y") {
      assert.equal(question.answers[0], String(film.film_year), id);
      assert(!question.question.includes(String(film.film_year)), `${id}: answer year in question`);
    }
    if (question.code === "D") {
      assert.equal(question.answers[0], team(film.directors), `${id}: incomplete director team`);
      for (const name of film.directors) {
        assert(!normalized(question.question).includes(normalized(name)), `${id}: director in question`);
        assert(question.answers.slice(1).every((a) => !normalized(a).includes(normalized(name))), `${id}: director in distractor`);
      }
    }
    const knowledgeId = question.knowledge_id ?? `K-${id}`;
    assert(!goals.has(knowledgeId), `${id}: repeated objective`);
    goals.add(knowledgeId);
    const target = (index + qi) % 4;
    const answers = question.answers.map((text, i) => ({text, feedback: question.feedback[i]}));
    answers.splice(target, 0, answers.shift());
    const tags = [film.genre, ...film.categories].join("|");
    const row = {
      question_id: id, knowledge_id: knowledgeId, variant_of: question.variant_of ?? "",
      language: "de", domain: "Film", subdomain: film.genre,
      film_title_de: film.film_title_de, film_title_original: film.film_title_original,
      film_year: String(film.film_year), franchise: film.series?.name ?? "",
      difficulty: question.difficulty ?? ({L: "leicht", M: "mittel", S: "schwer", Y: "mittel", D: "mittel"}[question.code[0]]),
      question_type: kind, topic_tags: tags, badge_tags: tags,
      learning_objective: question.objective, question: question.question,
      correct_answer: "ABCD"[target], explanation_short: question.short,
      explanation_context: question.context, spoiler_level: question.spoiler ?? "mittel",
      source_urls: [...new Set(sources)].join("|"), verification_status: "redaktionell_quellengeprueft",
    };
    for (const [i, letter] of ["a", "b", "c", "d"].entries()) {
      row[`answer_${letter}`] = answers[i].text;
      row[`feedback_${letter}`] = answers[i].feedback;
    }
    assert(["leicht", "mittel", "schwer"].includes(row.difficulty));
    assert(fields.every((field) => typeof row[field] === "string"), id);
    rows.push(row);
  }
}
assert.equal(new Set(rows.map((row) => row.question_id)).size, rows.length);
const csv = Papa.unparse({fields, data: rows}, {quotes: true, newline: "\r\n"}) + "\r\n";
const parsed = Papa.parse(csv, {header: true, skipEmptyLines: "greedy"});
assert.deepEqual(parsed.errors, []);
assert.deepEqual(parsed.data, rows);
const sourcePath = `KI-Wissen-Wissensquiz/01 Rohquellen/${selected.filename}`;
if (fs.existsSync(sourcePath)) assert.equal(fs.readFileSync(sourcePath, "utf8"), csv, "Original CSV differs; use a new wave for further content");
if (write) {
  if (!fs.existsSync(sourcePath)) fs.writeFileSync(sourcePath, csv);
  fs.writeFileSync(`public${selected.path}`, csv);
}
const allFilms = manifest.packages.flatMap((pkg) => pkg.films.map((id) => read(`${root}/Redaktion/${id}.json`)));
assert.equal(new Set(allFilms.map((f) => `${f.film_title_original}|${f.film_year}`)).size, allFilms.length);
const metadata = allFilms.map((film) => ({
  id: film.id, film_title_de: film.film_title_de, film_title_original: film.film_title_original,
  film_year: film.film_year, subdomain: film.genre, categories: film.categories,
  familiarity_level: film.familiarity_level, familiarity_reason: film.familiarity_reason,
  directors: film.directors, production_countries: film.production_countries,
  release_note: film.release_note, director_note: film.director_note ?? "", country_note: film.country_note ?? "",
  series: film.series, series_note: film.series_note, series_sources: film.series_sources,
  sources: Object.entries(film.sources).map(([key, source]) => ({key, ...source})),
  reference_question_id: `G150-20261103-${film.id}-L1`,
  year_question_id: `G150-20261103-${film.id}-Y`, director_question_id: `G150-20261103-${film.id}-D`,
}));
if (write) fs.writeFileSync(`${root}/Filmdaten.json`, JSON.stringify({schema_version: "wissensquiz-redaktion-film-v1", as_of: "2026-11-03", integration_route: "explicit_csv_year_and_director", films: metadata, series_updates: manifest.series_updates}, null, 2) + "\n");
console.log(JSON.stringify({wave, written: write, films: films.length, questions: rows.length, contentGoals: films.length * 6, yearGoals: films.length, directorGoals: films.length, variants: rows.filter((r) => r.variant_of).length}));

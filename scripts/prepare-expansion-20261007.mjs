// Assemble authored entries; validate with the real importer separately.
// Protected collection evidence stays in ignored data, outside public artifacts.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import Papa from "papaparse";
const root = "docs/Erweiterung-2026-10-07";
const local = "data/erweiterung-2026-10-07";
const read = (p) =>
  JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
const hash = (x) => createHash("sha256").update(x).digest("hex");
const norm = (x) =>
  String(x)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const identity = (f) =>
  norm(f.originalTitle ?? f.film_title_original) +
  "|" +
  (f.year ?? f.film_year);
const assert = (ok, m) => {
  if (!ok) throw Error(m);
};
const write = (name, obj) =>
  fs.writeFileSync(
    path.join(root, name),
    typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) + "\n",
  );
const fields =
  "question_id,knowledge_id,variant_of,language,domain,subdomain,film_title_de,film_title_original,film_year,franchise,difficulty,question_type,topic_tags,badge_tags,learning_objective,question,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation_short,explanation_context,feedback_a,feedback_b,feedback_c,feedback_d,memory_anchor,spoiler_level,source_urls,verification_status".split(
    ",",
  );
const baseline = read(local + "/baseline.json");
for (const input of baseline.inputs)
  assert(
    hash(fs.readFileSync(input.path, "utf8")) === input.sha256,
    "Baseline changed: " + input.path,
  );
const reserved = new Set(
  [...baseline.filmIdentities, ...baseline.reservedFilms].map(identity),
);
const old = new Map(baseline.questions.map((q) => [q.id, q]));
const files = fs
  .readdirSync(root + "/Redaktion")
  .filter((x) => /^\d{3}\.json$/.test(x))
  .sort();
const films = files.map((file) => read(root + "/Redaktion/" + file));
const complete = films.length === 280;
assert(
  complete || process.argv.includes("--partial"),
  "Missing films: " + films.length + "/280",
);
assert(
  new Set(films.map(identity)).size === films.length,
  "Film identity collision",
);
const rows = [],
  goals = [],
  warnings = [],
  metadata = [],
  sources = [];
for (const f of films) {
  assert(!reserved.has(identity(f)), "Existing/reserved film: " + f.titleDe);
  assert(
    f.directors?.length &&
      f.production_countries?.length &&
      f.release_note &&
      f.familiarity_reason,
    "Metadata missing: " + f.rank,
  );
  assert([1, 2, 3, 4].includes(f.familiarity), "Familiarity: " + f.rank);
  assert(
    f.questions.length === 8 &&
      new Set(f.questions.map((q) => q.code)).size === 8,
    "Eight goals: " + f.rank,
  );
  assert(
    ["L1", "L2", "M1", "M2", "S1", "S2", "Y", "D"].every((c) =>
      f.questions.some((q) => q.code === c),
    ),
    "Coverage: " + f.rank,
  );
  const entries = Object.entries(f.sources).map(([key, val]) => ({
    key,
    url: typeof val === "string" ? val : val.url,
    checked_on: "2026-10-07",
  }));
  assert(
    entries.every((s) => /^https?:\/\//.test(s.url)),
    "Source URL: " + f.rank,
  );
  metadata.push({
    rank: f.rank,
    film_title_de: f.titleDe,
    film_title_original: f.originalTitle,
    film_year: Number(f.year),
    subdomain: f.genre,
    category: f.category ?? "",
    familiarity_level: f.familiarity,
    familiarity_reason: f.familiarity_reason,
    directors: f.directors,
    production_countries: f.production_countries,
    country_note: f.country_note ?? f.production_note ?? "",
    release_note: f.release_note,
    director_note: f.director_note ?? "",
    series: f.series
      ? {
          name: typeof f.series === "string" ? f.series : f.series.name,
          position:
            typeof f.series === "string" ? null : (f.series.position ?? null),
          note: typeof f.series === "string" ? "" : (f.series.note ?? ""),
        }
      : null,
    sources: entries,
  });
  for (let i = 0; i < f.questions.length; i++) {
    const q = f.questions[i];
    const id = "E20261007-F-" + String(f.rank).padStart(3, "0") + "-" + q.code;
    assert(!old.has(id), "ID collision: " + id);
    assert(
      q.answers.length === 4 && new Set(q.answers.map(norm)).size === 4,
      "Four options: " + id,
    );
    assert(
      q.feedback.length === 4 && q.feedback.every((x) => x?.trim()),
      "Feedback: " + id,
    );
    assert(
      q.short && q.context && q.anchor && q.interest,
      "Editorial text: " + id,
    );
    assert(
      q.sources?.length &&
        q.sources.every((k) => entries.some((s) => s.key === k)),
      "Source alias: " + id,
    );
    const kind =
      q.code === "Y" ? "year" : q.code === "D" ? "director" : "content";
    const difficulty =
      q.difficulty ??
      { L: "leicht", M: "mittel", S: "schwer", Y: "mittel", D: "mittel" }[
        q.code[0]
      ];
    assert(
      ["leicht", "mittel", "schwer"].includes(difficulty),
      "Difficulty: " + id,
    );
    if (kind === "content")
      assert(
        difficulty === { L: "leicht", M: "mittel", S: "schwer" }[q.code[0]],
        "Content coverage: " + id,
      );
    let question = q.question.replaceAll("@", `„${f.titleDe}“`);
    if (
      q.title_in_question !== false &&
      !norm(question).includes(norm(f.titleDe))
    )
      question = `„${f.titleDe}“: ${question}`;
    if (kind === "year") {
      assert(String(q.answers[0]) === String(f.year), "Year answer: " + id);
      assert(!question.includes(String(f.year)), "Year leak: " + id);
    }
    if (kind === "director") {
      assert(
        norm(q.answers[0]) === norm(f.directors.join(" und ")),
        "Complete director credit: " + id,
      );
      assert(
        f.directors.every((n) => !norm(question).includes(norm(n))),
        "Director leak: " + id,
      );
    }
    const target = (f.rank + i) % 4;
    const pairs = q.answers.map((answer, i) => ({
      answer: String(answer),
      feedback: q.feedback[i],
    }));
    pairs.splice(target, 0, pairs.shift());
    const knowledge = q.knowledge_id ?? "K-" + id;
    if (q.variant_of)
      assert(
        old.get(q.variant_of)?.knowledgeId === knowledge,
        "Variant target: " + id,
      );
    const tags = [
      f.genre,
      ...(["Classics", "Arthouse"].includes(f.category) ? [f.category] : []),
    ].join(";");
    const row = {
      question_id: id,
      knowledge_id: knowledge,
      variant_of: q.variant_of ?? "",
      language: "de",
      domain: "Film",
      subdomain: f.genre,
      film_title_de: f.titleDe,
      film_title_original: f.originalTitle,
      film_year: String(f.year),
      franchise:
        typeof f.series === "string" ? f.series : (f.series?.name ?? ""),
      difficulty,
      question_type:
        kind === "year"
          ? "Filmjahr"
          : kind === "director"
            ? "Regie"
            : (q.type ?? "Filmwissen"),
      topic_tags: tags,
      badge_tags: tags,
      learning_objective: q.objective ?? q.anchor,
      question,
      correct_answer: "ABCD"[target],
      explanation_short: q.short,
      explanation_context: q.context,
      memory_anchor: q.anchor,
      spoiler_level: q.spoiler ?? "mittel",
      source_urls: q.sources
        .map((key) => entries.find((s) => s.key === key).url)
        .join("|"),
      verification_status: "redaktionell_quellengeprueft",
    };
    ["a", "b", "c", "d"].forEach((l, i) => {
      row["answer_" + l] = pairs[i].answer;
      row["feedback_" + l] = pairs[i].feedback;
    });
    for (const k of fields) assert(typeof row[k] === "string", id + " " + k);
    if (
      norm(q.answers[0]).length > 3 &&
      norm(question + " " + f.titleDe + " " + f.originalTitle).includes(
        norm(q.answers[0]),
      )
    )
      warnings.push({ id, kind: "possible_answer_leak", answer: q.answers[0] });
    if (q.context.trim().split(/\s+/).length < 35)
      warnings.push({ id, kind: "short_depth" });
    rows.push(row);
    goals.push({
      id,
      knowledge_id: knowledge,
      kind,
      interest: q.interest,
      anchor: q.anchor,
      sources: row.source_urls.split("|"),
    });
  }
  sources.push({
    rank: f.rank,
    title: f.titleDe,
    sources: entries,
    goals: goals.slice(-8),
  });
  assert(
    new Set(goals.slice(-8).map((g) => g.knowledge_id)).size === 8,
    "Independent goals: " + f.rank,
  );
}
assert(
  new Set(rows.map((q) => q.question_id)).size === rows.length,
  "Duplicate IDs",
);
const csv =
  Papa.unparse({ fields, data: rows }, { quotes: true, newline: "\r\n" }) +
  "\r\n";
assert(
  JSON.stringify(
    Papa.parse(csv, { header: true, skipEmptyLines: "greedy" }).data,
  ) ===
    JSON.stringify(
      rows.map((r) => Object.fromEntries(fields.map((k) => [k, r[k]]))),
    ),
  "CSV reread",
);
write("Filmfragen_20261007.csv", csv);
write("Filmdaten.json", {
  as_of: "2026-10-07",
  complete,
  integration_route: "explicit_csv_year_and_director",
  films: metadata,
});
write("Quellennachweis-Filme.json", {
  as_of: "2026-10-07",
  complete,
  scope:
    "Redaktionell gelesene Belege; keine unabhängige zweite Vollrecherche.",
  films: sources,
});
write("Formale-Pruefung-Filme.json", {
  as_of: "2026-10-07",
  complete,
  films: films.length,
  questions: rows.length,
  contentGoals: films.length * 6,
  yearGoals: films.length,
  directorGoals: films.length,
  categories: Object.fromEntries(
    [...new Set(films.map((f) => f.category ?? f.genre))].map((g) => [
      g,
      films.filter((f) => (f.category ?? f.genre) === g).length,
    ]),
  ),
  variants: rows.filter((q) => q.variant_of).length,
  correctAnswers: Object.fromEntries(
    "ABCD"
      .split("")
      .map((l) => [l, rows.filter((r) => r.correct_answer === l).length]),
  ),
  warnings,
  csvSha256: hash(csv),
  checks: {
    csvRereadExact: true,
    uniqueIds: true,
    minimumCoverage: true,
    sourceAliasesComplete: true,
    existingInputBytesUnchanged: true,
  },
});
console.log(
  JSON.stringify({
    complete,
    films: films.length,
    questions: rows.length,
    warnings,
  }),
);

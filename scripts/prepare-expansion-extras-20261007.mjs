// Assemble the reviewed person and award entries without changing older CSVs.
import fs from "node:fs";
import { createHash } from "node:crypto";
import Papa from "papaparse";
const root = "docs/Erweiterung-2026-10-07",
  local = "data/erweiterung-2026-10-07";
const read = (p) =>
  JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
const write = (p, o) =>
  fs.writeFileSync(
    root + "/" + p,
    typeof o === "string" ? o : JSON.stringify(o, null, 2) + "\n",
  );
const hash = (x) => createHash("sha256").update(x).digest("hex");
const assert = (v, m) => {
  if (!v) throw Error(m);
};
const norm = (x) =>
  String(x)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const baseline = read(local + "/baseline.json");
for (const p of baseline.inputs)
  assert(
    hash(fs.readFileSync(p.path, "utf8")) === p.sha256,
    "Changed baseline " + p.path,
  );
const old = new Map(baseline.questions.map((q) => [q.id, q.knowledgeId]));
const filmDocs = fs
  .readdirSync(root + "/Redaktion")
  .filter((f) => /^\d{3}\.json$/.test(f))
  .sort()
  .map((f) => read(root + "/Redaktion/" + f));
for (const f of filmDocs)
  for (const q of f.questions)
    old.set(
      `E20261007-F-${String(f.rank).padStart(3, "0")}-${q.code}`,
      q.knowledge_id ??
        `K-E20261007-F-${String(f.rank).padStart(3, "0")}-${q.code}`,
    );
const people = fs
  .readdirSync(root + "/Personen")
  .filter((f) => /^\d{2}\.json$/.test(f))
  .sort()
  .map((f) => read(root + "/Personen/" + f));
const awards = fs
  .readdirSync(root + "/Preise")
  .filter((f) => /^\d{2}\.json$/.test(f))
  .sort()
  .map((f) => read(root + "/Preise/" + f));
assert(people.length === 20 && awards.length === 20, "Entry coverage");
const inventory = read(local + "/person-ref-inventory.json").refs;
const reviewed = read(root + "/Filmdaten-Personen.json").films;
const filmKey = (f) => `${f.original_title}|${f.first_release_year}`;
const leading = new Map(
  filmDocs.map((f) => [
    norm(f.originalTitle) + "|" + f.year,
    {
      film_id: f.originalTitle + "|" + f.year,
      title: f.titleDe,
      original_title: f.originalTitle,
      first_release_year: Number(f.year),
      directors: f.directors,
      production_countries: f.production_countries,
      release_note: f.release_note,
      director_note: f.director_note ?? "",
      country_note: f.country_note ?? f.production_note ?? "",
      series:
        typeof f.series === "string"
          ? { name: f.series, position: null, note: "" }
          : (f.series ?? null),
      source_urls: Object.values(f.sources).map((s) =>
        typeof s === "string" ? s : s.url,
      ),
      verification_status: "redaktionell_quellengeprueft",
    },
  ]),
);
const refs = new Map(
  reviewed.map((f) => [norm(f.original_title) + "|" + f.first_release_year, f]),
);
const filmFor = (reference) => {
  const cut = reference.lastIndexOf("|"),
    title = reference.slice(0, cut),
    year = Number(reference.slice(cut + 1)),
    key = norm(title) + "|" + year;
  let data = leading.get(key) ?? refs.get(key);
  if (!data) {
    const existing = inventory.find(
      (f) => norm(f.reference) === norm(reference),
    )?.data;
    if (existing)
      data = {
        film_id: reference,
        title:
          inventory.find((f) => norm(f.reference) === norm(reference))?.title ??
          title,
        original_title: existing.originalTitle,
        first_release_year: existing.year,
        directors: existing.directors.split(/, | und /),
        production_countries: existing.countries,
        release_note: existing.releaseNote ?? "",
        director_note: existing.directorNote ?? "",
        country_note: existing.countryNote ?? "",
        series: existing.series ?? null,
        source_urls: existing.sources,
        verification_status: "bereits_redaktionell_gepruefter_bestand",
      };
  }
  assert(
    data?.directors.length &&
      data?.production_countries.length &&
      data?.source_urls.length,
    "Unresolved reference " + reference,
  );
  assert(
    data.first_release_year === year,
    "Reference year mismatch " + reference,
  );
  return {
    ...data,
    film_id: reference,
    director_note: data.director_note ?? "",
    country_note: data.country_note ?? "",
    series: data.series ?? null,
    release_note: data.release_note ?? "",
  };
};
const fields =
  "question_id,knowledge_id,variant_of,language,domain,subdomain,film_title_de,film_title_original,film_year,franchise,difficulty,question_type,topic_tags,badge_tags,learning_objective,question,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation_short,explanation_context,feedback_a,feedback_b,feedback_c,feedback_d,memory_anchor,spoiler_level,source_urls,verification_status,person_id,person_name,person_name_before_answer,film_refs".split(
    ",",
  );
const editorial = { reviewedOn: "2026-10-07", questions: {} },
  publicRefs = new Map(),
  proofs = [];
function assemble(entries, kind) {
  const rows = [],
    native = [],
    actors = [],
    films = [],
    warnings = [],
    links = [];
  for (const e of entries) {
    const person = kind === "P";
    const codes = person
      ? ["L1", "L2", "M1", "M2", "S1", "S2", "E1", "E2"]
      : ["L", "M", "S", "E"];
    assert(
      e.questions.length === codes.length &&
        codes.every((c) => e.questions.some((q) => q.code === c)),
      "Coverage " + kind + e.entry,
    );
    const ids = [];
    if (!person) {
      const data = {
        film_id: e.originalTitle + "|" + e.year,
        title: e.titleDe,
        original_title: e.originalTitle,
        first_release_year: e.year,
        directors: e.directors,
        production_countries: e.production_countries,
        release_note: e.release_note,
        director_note: e.director_note ?? "",
        country_note: e.country_note ?? "",
        source_urls: [e.articleUrl, e.ceremonyUrl],
        verification_status: "redaktionell_quellengeprueft",
      };
      films.push(data);
      if (!publicRefs.has(data.film_id)) publicRefs.set(data.film_id, data);
    }
    for (let i = 0; i < e.questions.length; i++) {
      const q = e.questions[i],
        id = `E20261007-${kind}-${String(e.entry).padStart(3, "0")}-${q.code}`,
        knowledge = q.knowledge_id ?? "K-" + id;
      assert(!old.has(id), "Existing ID " + id);
      ids.push(id);
      old.set(id, knowledge);
      assert(
        q.answers.length === 4 &&
          new Set(q.answers.map(norm)).size === 4 &&
          q.feedback.length === 4 &&
          q.feedback.every(Boolean),
        "Options " + id,
      );
      assert(
        q.short &&
          q.anchor &&
          q.interest &&
          q.context.split(/\s+/).length >= 35,
        "Editorial depth " + id,
      );
      if (q.variant_of) {
        assert(old.get(q.variant_of) === knowledge, "Variant " + id);
        links.push({
          question_id: id,
          variant_of: q.variant_of,
          knowledge_id: knowledge,
          decision: q.knowledge_note ?? "Redaktionell gleiches Wissensziel.",
        });
      }
      const references = person ? (q.films ?? []) : [];
      const referenced = references.map(filmFor);
      for (const f of referenced) publicRefs.set(f.film_id, f);
      const sources = [
        ...new Set([
          e.articleUrl,
          ...(person ? [] : [e.ceremonyUrl]),
          ...(q.extraSources ?? []),
          ...referenced.flatMap((f) => f.source_urls),
        ]),
      ];
      assert(
        sources.length && sources.every((s) => /^https?:\/\//.test(s)),
        "Sources " + id,
      );
      const offset = (e.entry + i) % 4,
        pairs = q.answers.map((text, i) => ({ text, feedback: q.feedback[i] }));
      pairs.splice(offset, 0, pairs.shift());
      const difficulty = {
        L: "leicht",
        M: "mittel",
        S: "schwer",
        E: "experte",
      }[q.code[0]];
      const row = Object.fromEntries(fields.map((f) => [f, ""]));
      Object.assign(row, {
        question_id: id,
        knowledge_id: knowledge,
        variant_of: q.variant_of ?? "",
        language: "de",
        domain: person ? "Personen" : "Film",
        subdomain: person ? "Schauspieler" : (e.genre ?? "Drama"),
        film_title_de: person ? "" : e.titleDe,
        film_title_original: person ? "" : e.originalTitle,
        film_year: person ? "" : String(e.year),
        difficulty,
        question_type:
          q.type ?? (person ? "Personenwissen" : "Preisgeschichte"),
        topic_tags: person ? "Schauspieler" : "Preisträger",
        badge_tags: person ? "Schauspieler" : "Preisträger",
        learning_objective: q.objective ?? q.anchor,
        question: q.question,
        correct_answer: "ABCD"[offset],
        explanation_short: q.short,
        explanation_context: q.context,
        memory_anchor: q.anchor,
        spoiler_level: q.spoiler ?? "mittel",
        source_urls: sources.join("|"),
        verification_status: "redaktionell_quellengeprueft",
        person_id: person ? e.personId : "",
        person_name: person ? e.name : "",
        person_name_before_answer: person ? "true" : "",
        film_refs: references.join(";"),
      });
      for (const [j, l] of ["a", "b", "c", "d"].entries()) {
        row["answer_" + l] = pairs[j].text;
        row["feedback_" + l] = pairs[j].feedback;
      }
      rows.push(row);
      native.push({
        question_id: id,
        knowledge_id: knowledge,
        variant_of: q.variant_of ?? null,
        ...(person
          ? { actor_id: e.personId, actor_name_before_answer: true }
          : {}),
        difficulty,
        question_type: row.question_type,
        question: q.question,
        answers: pairs.map((p, j) => ({ id: "ABCD"[j], text: p.text })),
        correct_answer: row.correct_answer,
        additional_info: q.context,
        film_refs: person ? references : [e.originalTitle + "|" + e.year],
        source_urls: sources,
        verification_status: "redaktionell_quellengeprueft",
        knowledge_link_status: "semantisch_abgeglichen",
      });
      if (person) {
        assert(
          norm(q.question).includes(norm(e.name)),
          "Visible full person " + id,
        );
        editorial.questions[id] = {
          personId: e.personId,
          originalQuestion: q.question,
          originalContext: q.context,
          question: q.question,
          text: q.context,
          films: references,
          sources,
        };
      }
      proofs.push({
        question_id: id,
        learning_objective: row.learning_objective,
        correct_answer: q.answers[0],
        source_urls: sources,
      });
    }
    assert(
      new Set(rows.slice(-codes.length).map((q) => q.knowledge_id)).size ===
        codes.length,
      "Independent goals " + kind + e.entry,
    );
    if (person)
      actors.push({
        actor_id: e.personId,
        name: e.name,
        selection_group: "Schauspieler",
        question_ids: ids,
      });
  }
  const csv =
    Papa.unparse({ fields, data: rows }, { quotes: true, newline: "\r\n" }) +
    "\r\n";
  assert(
    JSON.stringify(
      Papa.parse(csv, { header: true, skipEmptyLines: "greedy" }).data,
    ) === JSON.stringify(rows),
    "CSV reread " + kind,
  );
  const name = kind === "P" ? "Personen" : "Preise";
  write(name + "fragen_20261007.csv", csv);
  write(name + "fragen_20261007.json", {
    schema_version:
      kind === "P"
        ? "wissensquiz-redaktion-personen-v2"
        : "wissensquiz-redaktion-preise-v1",
    package_id: "E20261007-" + kind,
    title: name + " – Erweiterung 07.10.2026",
    language: "de",
    created_on: "2026-10-07",
    status: "redaktionell_geprueft",
    difficulty_levels: ["leicht", "mittel", "schwer", "experte"],
    ...(kind === "P"
      ? { actors, films: [...publicRefs.values()] }
      : {
          entries: entries.map((e) => ({
            entry: e.entry,
            title: e.titleDe,
            ceremony_year: e.ceremonyYear,
            question_ids: native
              .filter((q) =>
                q.question_id.startsWith(
                  `E20261007-A-${String(e.entry).padStart(3, "0")}-`,
                ),
              )
              .map((q) => q.question_id),
          })),
          films,
        }),
    questions: native,
  });
  write("Formale-Pruefung-" + name + ".json", {
    as_of: "2026-10-07",
    entries: entries.length,
    questions: rows.length,
    variants: links.length,
    links,
    warnings,
    correctAnswers: Object.fromEntries(
      "ABCD"
        .split("")
        .map((l) => [l, rows.filter((q) => q.correct_answer === l).length]),
    ),
    csvSha256: hash(csv),
    checks: {
      csvRereadExact: true,
      uniqueIds: true,
      independentGoals: true,
      fourDifficultyLevels: true,
      completeFeedback: true,
      minimumDepth35Words: true,
      filmReferencesResolved: true,
      existingInputBytesUnchanged: true,
    },
  });
  return rows;
}
const personRows = assemble(people, "P"),
  awardRows = assemble(awards, "A");
write("Personen-Anzeige.json", editorial);
write("Filmdaten-Referenzen.json", {
  as_of: "2026-10-07",
  films: [...publicRefs.values()],
});
write("Quellennachweis-Personen-Preise.json", {
  as_of: "2026-10-07",
  scope:
    "Redaktionell gelesene Biografien, Filmreferenzen und Academy-Ergebnislisten; keine empirische Schwierigkeitskalibrierung.",
  questions: proofs,
});
console.log(
  JSON.stringify({
    persons: people.length,
    personQuestions: personRows.length,
    awards: awards.length,
    awardQuestions: awardRows.length,
    filmReferences: publicRefs.size,
  }),
);

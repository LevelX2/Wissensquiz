import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import Papa from "papaparse";

// Only public editorial material. No browser state, accounts or publication.
const folder = "docs/Schauspieler-Ergaenzung-P02";
const rawPath =
  "KI-Wissen-Wissensquiz/01 Rohquellen/Schauspieler_25_Personen_200_Fragen_Redaktion.txt";
const source = await readFile(rawPath, "utf8");
const extra = JSON.parse(
  await readFile(`${folder}/Redaktionelle-Zusatzquellen.json`, "utf8"),
);
const overrides = JSON.parse(
  await readFile(`${folder}/Filmdaten-Ergaenzungen.json`, "utf8"),
);
const links = JSON.parse(
  await readFile(`${folder}/Bestandsziel-Zuordnungen.json`, "utf8"),
);
// The committed source snapshot suffices to regenerate the package offline.
const snapshot = await readFile(`${folder}/Quellenstand.json`, "utf8")
  .then(JSON.parse)
  .catch(() => null);
const bio = await readFile(
  ".sites-runtime/actor-supplement-research/manifest.json",
  "utf8",
)
  .then(JSON.parse)
  .catch(() => snapshot?.biographies);
const research = await readFile(
  ".sites-runtime/actor-supplement-films/manifest.json",
  "utf8",
)
  .then(JSON.parse)
  .catch(() => snapshot?.films);
assert(
  bio && research,
  "Öffentliche Quellensnapshots fehlen; zuerst die Recherche-Skripte ausführen.",
);
assert.equal(research.filter((x) => x.failed).length, 0, "Unaufgelöste Filme");
assert.equal(
  research.filter((x) => !x.release_year_match).length,
  0,
  "Veröffentlichungsjahre",
);
const byFilm = new Map(research.map((x) => [x.film, x]));
const levels = ["leicht", "mittel", "schwer", "außergewöhnlich"];
const letters = ["L", "M", "S", "A"];
const packageId = "SCHAUSPIELER-202610-P02";
const counts = {};
const actors = [];
const questions = [];
let actor;
for (const line of source.split(/\r?\n/)) {
  if (!line.trim() || line.startsWith("#")) continue;
  if (line.startsWith("@")) {
    const [number, name, selection_group] = line.slice(1).split("§");
    actor = {
      actor_id: `ACTOR-${number}`,
      name,
      selection_group,
      question_ids: [],
    };
    actors.push(actor);
    counts[actor.actor_id] = 0;
    continue;
  }
  assert(actor, "Personenüberschrift fehlt");
  const fields = line.split("§");
  assert.equal(fields.length, 8, line.slice(0, 100));
  const [type, question, correct, ...rest] = fields;
  const [wrong1, wrong2, wrong3, info, refs] = rest;
  const j = counts[actor.actor_id]++;
  const level = Math.floor(j / 2),
    number = (j % 2) + 1;
  const suffix = `${actor.actor_id.slice(6)}-${letters[level]}-${number}`;
  const id = `${packageId}-${suffix}`;
  const filmRefs =
    refs === "-"
      ? []
      : refs.split(" || ").map((value) => {
          const [title, year] = value.split("~");
          const key = `${title}|${year}`;
          assert(byFilm.has(key), key);
          return key;
        });
  const before = question.includes(actor.name);
  if (!before)
    assert.equal(correct, actor.name, `Fehlender vollständiger Name: ${id}`);
  const bioSources = bio
    .filter((x) => x.name === actor.name)
    .map((x) => x.url.replace(/\?.*$/, ""));
  assert.equal(bioSources.length, 2);
  questions.push({
    question_id: id,
    knowledge_id: `K-${id}`,
    variant_of: null,
    actor_id: actor.actor_id,
    difficulty: levels[level],
    question_type: type,
    question,
    answers: [correct, wrong1, wrong2, wrong3].map((text, i) => ({
      id: "ABCD"[i],
      text,
    })),
    correct_answer: "A",
    additional_info: info,
    source_urls: [
      ...new Set([
        ...bioSources,
        ...filmRefs.map((key) => byFilm.get(key).source_url),
        ...(extra[suffix] ?? []),
      ]),
    ],
    actor_name_before_answer: before,
    film_refs: filmRefs,
    verification_status: "redaktionell_recherchiert",
    knowledge_link_status: "vor_integration_semantisch_abzugleichen",
  });
  actor.question_ids.push(id);
}
actors.sort((a, b) => a.actor_id.localeCompare(b.actor_id));
questions.sort(
  (a, b) =>
    a.actor_id.localeCompare(b.actor_id) ||
    levels.indexOf(a.difficulty) - levels.indexOf(b.difficulty) ||
    a.question_id.localeCompare(b.question_id),
);
assert.equal(actors.length, 25);
assert.equal(questions.length, 200);
for (const a of actors) assert.equal(a.question_ids.length, 8, a.name);
let seed = 20261003;
const rng = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const shuffle = (list) => {
  for (let i = list.length - 1; i > 0; i--) {
    let j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};
for (let l = 0; l < 4; l++) {
  const counts = Array(4).fill(12);
  counts[l % 4]++;
  counts[(l + 1) % 4]++;
  const positions = shuffle(counts.flatMap((n, i) => Array(n).fill(i)));
  let index = 0;
  for (const q of questions.filter((q) => q.difficulty === levels[l])) {
    const correct = q.answers[0].text;
    const wrong = shuffle(q.answers.slice(1).map((x) => x.text));
    const p = positions[index++];
    wrong.splice(p, 0, correct);
    q.answers = wrong.map((text, i) => ({ id: "ABCD"[i], text }));
    q.correct_answer = "ABCD"[p];
  }
}
const translations = {
  "United States": "USA",
  "United Kingdom": "Vereinigtes Königreich",
  Ireland: "Irland",
  France: "Frankreich",
  Germany: "Deutschland",
  "West Germany": "Bundesrepublik Deutschland",
  Italy: "Italien",
  Spain: "Spanien",
  Canada: "Kanada",
  Australia: "Australien",
  "New Zealand": "Neuseeland",
  Austria: "Österreich",
  Japan: "Japan",
  "South Korea": "Südkorea",
  "Hong Kong": "Hongkong",
  China: "China",
  Belgium: "Belgien",
  Denmark: "Dänemark",
  Sweden: "Schweden",
  Czechoslovakia: "Tschechoslowakei",
  Switzerland: "Schweiz",
  Luxembourg: "Luxemburg",
  "South Africa": "Südafrika",
  Netherlands: "Niederlande",
  "Czech Republic": "Tschechien",
  Russia: "Russland",
  Greece: "Griechenland",
};
const films = [...byFilm.values()]
  .sort((a, b) => a.film.localeCompare(b.film))
  .map((r) => {
    const o = overrides[r.film] ?? {};
    return {
      film_id: r.film,
      title: r.title,
      original_title: o.original_title ?? r.title,
      first_release_year: r.year,
      directors: r.directors,
      production_countries:
        o.production_countries ?? r.countries.map((c) => translations[c] ?? c),
      format: o.format ?? "Kinofilm",
      release_note: o.release_note ?? "",
      source_urls: [r.source_url, ...(o.source_urls ?? [])],
      checked_on: r.checked_on,
      verification_status: "redaktionell_geprueft",
    };
  });
const data = {
  schema_version: "wissensquiz-redaktion-personen-v2",
  package_id: packageId,
  title: "Schauspieler – Ergänzung 2",
  language: "de",
  created_on: "2026-10-03",
  status: "vorbereitet_nicht_in_app_integriert",
  difficulty_levels: levels,
  integration_note:
    "Redaktionspaket; kein direkter CSV- oder Spielstandimport. Außergewöhnlich entspricht Experte. Alle Fragen ergänzen den vorhandenen Personenbereich additiv auch in der Filmreise. Vor Integration semantisch gleiche Wissensziele verknüpfen; Namen bei Erkennungsfragen erst nach der Antwort und Filmdaten ausschließlich nach der Antwort anzeigen.",
  actors,
  questions,
  films,
};
const normalize = (x) =>
  x
    .normalize("NFKC")
    .toLocaleLowerCase("de")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const words = (x) => x.trim().split(/\s+/u).length;
const ids = new Set(),
  texts = new Set();
for (const q of questions) {
  assert(!ids.has(q.question_id));
  ids.add(q.question_id);
  assert(!texts.has(normalize(q.question)), q.question);
  texts.add(normalize(q.question));
  assert.equal(
    new Set(q.answers.map((x) => normalize(x.text))).size,
    4,
    q.question_id,
  );
  assert(q.answers.some((x) => x.id === q.correct_answer));
  assert(words(q.additional_info) >= 35, q.question_id);
  assert(
    words(q.question + " " + q.answers.map((x) => x.text).join(" ")) <= 60,
    q.question_id,
  );
  assert(q.source_urls.length >= 2);
  q.source_urls.forEach((u) => assert(u.startsWith("https://")));
  q.film_refs.forEach((ref) => assert(films.some((f) => f.film_id === ref)));
}
const original = await readFile(
  "docs/Schauspieler-Fragenpaket/Schauspieler_100_Personen_800_Fragen.json",
  "utf8",
);
const old = JSON.parse(original);
assert.equal(
  createHash("sha256").update(original).digest("hex"),
  "8588de53610bf411d1588fd06aa00c47d6862cb43c3be9889e67970ac7850df8",
);
for (const a of actors)
  assert(
    !old.actors.some((x) => normalize(x.name) === normalize(a.name)),
    "Person bereits vorhanden",
  );
for (const q of old.questions)
  assert(!texts.has(normalize(q.question)), "Doppelte Bestandsfrage");
const csvFiles = (await readdir("public")).filter((x) => x.endsWith(".csv"));
const oldCsv = [];
const oldHashes = {};
for (const name of csvFiles) {
  const bytes = await readFile(`public/${name}`);
  oldHashes[name] = createHash("sha256").update(bytes).digest("hex");
  const parsed = Papa.parse(bytes.toString("utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  assert.equal(parsed.errors.length, 0, name);
  oldCsv.push(...parsed.data);
}
const collisions = oldCsv.filter((row) =>
  texts.has(normalize(row.question ?? "")),
);
assert.equal(collisions.length, 0, "Exakt gleiche Fragen im CSV-Bestand");
for (const q of questions)
  assert(!oldCsv.some((x) => x.question_id === q.question_id), "ID-Kollision");
for (const [id, link] of Object.entries(links)) {
  const q = questions.find((q) => q.question_id === id);
  assert(q, id);
  const prior = oldCsv.find((q) => q.question_id === link.question_id);
  assert(prior, link.question_id);
  assert.equal(prior.knowledge_id, link.knowledge_id);
  q.knowledge_id = link.knowledge_id;
  q.variant_of = link.question_id;
  q.knowledge_link_status = "bestandsziel_redaktionell_zugeordnet";
}
const candidates = [];
for (const q of questions) {
  const correct = normalize(
    q.answers.find((a) => a.id === q.correct_answer).text,
  );
  const matches = oldCsv.filter((row) => {
    const answer = normalize(
      row[`answer_${(row.correct_answer ?? "").toLowerCase()}`] ?? "",
    );
    const film = films.filter((f) => q.film_refs.includes(f.film_id));
    return (
      answer === correct &&
      (film.some(
        (f) =>
          normalize(f.original_title) ===
          normalize(row.film_title_original ?? ""),
      ) ||
        (!q.actor_name_before_answer &&
          normalize(row.question ?? "").includes(correct)))
    );
  });
  if (matches.length)
    candidates.push({
      question_id: q.question_id,
      correct_answer: q.answers.find((a) => a.id === q.correct_answer).text,
      existing_candidates: matches.map((row) => ({
        question_id: row.question_id,
        knowledge_id: row.knowledge_id,
        question: row.question,
      })),
      status: links[q.question_id]
        ? "bestandsziel_redaktionell_zugeordnet"
        : "anderes_wissensziel",
      reason:
        links[q.question_id]?.reason ??
        (q.actor_id === "ACTOR-102"
          ? "Besetzung als Maximus und Gewinn eines Schauspiel-Oscars sind verschiedene Aussagen."
          : "Besetzung als Bellatrix und Tötung von Sirius sind verschiedene Aussagen."),
    });
}
const distribution = {};
for (const l of levels) {
  const qs = questions.filter((x) => x.difficulty === l);
  assert.equal(qs.length, 50);
  distribution[l] = Object.fromEntries(
    "ABCD"
      .split("")
      .map((a) => [a, qs.filter((q) => q.correct_answer === a).length]),
  );
  for (const a of actors)
    assert.equal(qs.filter((q) => q.actor_id === a.actor_id).length, 2);
}
const keyCounts = Object.fromEntries(
  "ABCD"
    .split("")
    .map((a) => [a, questions.filter((q) => q.correct_answer === a).length]),
);
for (const n of Object.values(keyCounts)) assert.equal(n, 50);
const typeCounts = {};
questions.forEach(
  (q) => (typeCounts[q.question_type] = (typeCounts[q.question_type] ?? 0) + 1),
);
const lengths = questions
  .map((q) => words(q.additional_info))
  .sort((a, b) => a - b);
await mkdir(folder, { recursive: true });
const json = JSON.stringify(data, null, 2) + "\n";
assert.deepEqual(JSON.parse(json), data);
await writeFile(
  `${folder}/Schauspieler_25_Personen_200_Fragen.json`,
  json,
  "utf8",
);
await writeFile(
  `${folder}/Filmdaten.json`,
  JSON.stringify(films, null, 2) + "\n",
  "utf8",
);
const lines = [
  "# 200 weitere Schauspielerfragen",
  "",
  "Stand: 03.10.2026. 25 neue Personen, je zwei Fragen in Leicht, Mittel, Schwer und Außergewöhnlich. Außergewöhnlich entspricht der App-Stufe Experte. **Vorbereitet; noch nicht in die App eingebaut.**",
  "",
  "Diese Lesefassung zeigt Lösungen. Personenüberschriften verraten bei Erkennungsfragen die gesuchte Person und sind für die Redaktion gedacht. Im Spiel gilt `actor_name_before_answer`. Filmverweise gelten nur für den Bereich nach der Antwort. Vier bekannte Bestandsziele sind als Varianten verknüpft; 196 weitere Ziele sind vorgeschlagen und vor Integration semantisch abzugleichen.",
  "",
  "## Personen",
  "",
  "| Nr. | Person | Fragen |",
  "| --- | --- | ---: |",
  ...actors.map((a, i) => `| ${i + 1} | ${a.name} | 8 |`),
  "",
];
for (const a of actors) {
  lines.push(`## ${a.name}`, "");
  for (const l of levels) {
    lines.push(`### ${l[0].toUpperCase() + l.slice(1)}`, "");
    for (const q of questions.filter(
      (q) => q.actor_id === a.actor_id && q.difficulty === l,
    )) {
      lines.push(
        `**${q.question_id}** · ${q.question_type}`,
        "",
        q.question,
        "",
        ...q.answers.map((a) => `- **${a.id}:** ${a.text}`),
        "",
        `**Lösung: ${q.correct_answer} – ${q.answers.find((a) => a.id === q.correct_answer).text}**`,
        "",
        `**Etwas tiefer eintauchen:** ${q.additional_info}`,
        "",
        `**Namensanzeige:** ${q.actor_name_before_answer ? "Vollständiger Name steht bereits in der Frage." : "Gesuchte Person erst nach der Antwort zeigen."}`,
        "",
      );
      for (const ref of q.film_refs) {
        const f = films.find((f) => f.film_id === ref);
        lines.push(
          `**Filmdaten:** ${f.title}; Originaltitel: ${f.original_title}; erste Veröffentlichung: ${f.first_release_year}; Regie: ${f.directors.join(", ")}; Produktionsländer: ${f.production_countries.join(", ")}; Format: ${f.format}. ${f.release_note}`.trim(),
          "",
        );
      }
      lines.push(
        "**Quellen:** " +
          q.source_urls.map((u, i) => `[${i + 1}](${u})`).join(" · "),
        "",
      );
    }
  }
}
const markdown = lines.join("\n").trimEnd() + "\n";
await writeFile(
  `${folder}/Schauspieler_200_Fragen_Lesefassung.md`,
  markdown,
  "utf8",
);
await writeFile(
  `${folder}/Bestandsabgleich.json`,
  JSON.stringify(
    {
      created_on: "2026-10-03",
      old_actor_people: 100,
      new_actor_people: 25,
      exact_duplicate_questions: 0,
      question_id_collisions: 0,
      public_csv_rows: oldCsv.length,
      semantic_link_candidates: candidates,
      limitation:
        "Gleiche Lösung und Film sind Kandidaten, kein Beweis eines gleichen Wissensziels. Vor App-Einbindung jeden Kandidaten und weitere sinngleiche Ziele redaktionell abgleichen.",
    },
    null,
    2,
  ) + "\n",
  "utf8",
);
const hash = (t) => createHash("sha256").update(t).digest("hex");
const report = {
  created_on: "2026-10-03",
  package_id: packageId,
  status: data.status,
  actors: actors.length,
  questions: questions.length,
  questions_by_difficulty: Object.fromEntries(levels.map((l) => [l, 50])),
  correct_answers: keyCounts,
  answer_distribution_each_difficulty: distribution,
  question_types: typeCounts,
  recognition_questions: questions.filter((q) => !q.actor_name_before_answer)
    .length,
  questions_with_film_refs: questions.filter((q) => q.film_refs.length).length,
  questions_without_film_refs: questions.filter((q) => !q.film_refs.length)
    .length,
  questions_with_multiple_films: questions.filter((q) => q.film_refs.length > 1)
    .length,
  films: films.length,
  additional_info_words: {
    min: lengths[0],
    median: (lengths[99] + lengths[100]) / 2,
    max: lengths.at(-1),
  },
  unique_source_urls: new Set(questions.flatMap((q) => q.source_urls)).size,
  semantic_link_candidates: candidates.length,
  reused_knowledge_ids: Object.keys(links).length,
  proposed_additional_knowledge_ids: questions.filter((q) => !q.variant_of)
    .length,
  checks: {
    eight_questions_each_actor: true,
    two_each_difficulty_per_actor: true,
    four_distinct_answers: true,
    all_given_names_complete: true,
    recognition_name_hidden: true,
    all_film_refs_resolved: true,
    all_film_years_match_source: true,
    all_questions_have_sources: true,
    question_and_options_at_most_60_words: true,
    known_knowledge_links_valid: true,
    json_roundtrip: true,
    exact_duplicate_questions: 0,
    existing_question_id_collisions: 0,
    original_800_package_unchanged: true,
  },
  hashes: {
    raw_sha256: hash(source),
    package_sha256: hash(json),
    reading_version_sha256: hash(markdown),
    original_800_package_sha256: hash(original),
  },
  unchanged_public_csv_sha256: oldHashes,
  limits: [
    "Redaktionell recherchiert und durchgesehen; keine zweite unabhängige Vollabnahme aller 200 Aussagen.",
    "Schwierigkeitsstufen sind redaktionell eingeschätzt, nicht mit Spielenden kalibriert.",
    "Vier Ziele sind zugeordnet; 196 Wissensziel-IDs bleiben vorgeschlagen. Weitere sinngleiche Bestandsziele vor Integration abgleichen.",
    "Keine Änderung an App-Katalog, Fortschritt, Duellkatalog oder veröffentlichter Site.",
  ],
};
await writeFile(
  `${folder}/Pruefbericht.json`,
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);
await writeFile(
  `${folder}/Quellenstand.json`,
  JSON.stringify(
    {
      checked_on: "2026-10-03",
      biographies: bio,
      films: research,
      additional_question_sources: extra,
      note: "Biografie- und Filmseiten direkt abgerufen; Hashes bezeichnen die gelesene HTML-Fassung. Webseitenvolltexte bleiben im ignorierten Recherchecache. Zusätzliche Fachquellen sind frageweise verlinkt; ihr Direktruf wird getrennt in Zusatzquellen-Abrufe.json dokumentiert. Angaben zu Erstveröffentlichung unterscheiden Premieren von späteren Kinostarts.",
    },
    null,
    2,
  ) + "\n",
  "utf8",
);
console.log(
  JSON.stringify({
    actors: report.actors,
    questions: report.questions,
    levels: report.questions_by_difficulty,
    recognition: report.recognition_questions,
    film_questions: report.questions_with_film_refs,
    films: report.films,
    context_words: report.additional_info_words,
    link_candidates: candidates.length,
  }),
);

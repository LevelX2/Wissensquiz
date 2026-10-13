// Editorial handoff only. Does not install content or touch the application.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { strict as assert } from "node:assert";
import { createServer } from "vite";
import Papa from "papaparse";

const root = "docs/Schauspieler-Bekanntheit-2026-10-13";
const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const norm = (value) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const progress = read(`${root}/Fortschritt.json`);
const throughFlag = process.argv.indexOf("--through-entry");
const through =
  throughFlag < 0
    ? progress.validatedThroughEntry
    : Number(process.argv[throughFlag + 1]);
assert(Number.isInteger(through) && through > 0, "Geprüften Umfang angeben");
const people = fs
  .readdirSync(`${root}/Personen`)
  .filter((f) => /^\d{3}\.json$/.test(f) && Number(f.slice(0, 3)) <= through)
  .sort()
  .map((f) => read(`${root}/Personen/${f}`));
const expected = progress.blocks
  .flatMap((block) => block.persons)
  .filter((p) => p.entry <= through);
const expectedIds = new Set(expected.map((p) => p.personId));
const portraits = read(`${root}/Portraets.json`).filter((p) =>
  expectedIds.has(p.personId),
);
const identities = read(`${root}/TMDB-Personen.json`).persons.filter((p) =>
  expectedIds.has(p.personId),
);
assert.equal(
  expected.length,
  through,
  "Alle Einträge bis zum Prüfende geplant",
);
assert.equal(people.length, expected.length, "Geplante Personen vollständig");
assert.equal(
  portraits.length,
  people.length,
  "Ein geprüftes Porträt je Person",
);
assert.equal(identities.length, people.length, "Eine TMDB-Identität je Person");
const supplements = new Map();
for (const file of fs
  .readdirSync(root)
  .filter(
    (f) =>
      /^Filmdaten-\d{3}-\d{3}\.json$/.test(f) &&
      Number(f.slice(10, 13)) <= through,
  )) {
  for (const film of read(`${root}/${file}`).films) {
    assert(
      !supplements.has(film.film_id),
      `Doppelte neue Filmfassung ${film.film_id}`,
    );
    assert.equal(
      film.film_id,
      `${film.original_title}|${film.first_release_year}`,
    );
    assert(
      film.title &&
        film.directors.length &&
        film.production_countries.length &&
        film.source_urls.length,
    );
    supplements.set(film.film_id, film);
  }
}
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, entries: [] },
});
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { importCsv } = await server.ssrLoadModule("/src/importer.ts");
  const { filmData } = await server.ssrLoadModule("/src/filmFacts.ts");
  const state = emptyState();
  addPackages(
    state,
    packages
      .filter(
        (pkg) => pkg.filename !== "Schauspieler-Bekanntheit-2026-10-13.csv",
      )
      .map((pkg) => ({
        filename: pkg.filename,
        text: fs.readFileSync(`public${pkg.path}`, "utf8"),
      })),
  );
  assert(
    state.imports.every(
      (report) => report.rejected === 0 && report.duplicates === 0,
    ),
    "Vorhandener Katalog fehlerfrei geladen",
  );
  const existingById = new Map(state.questions.map((q) => [q.id, q]));
  const existingGoals = new Set(state.questions.map((q) => q.knowledgeId));
  const newById = new Map(
    people.flatMap((p) =>
      p.questions.map((q) => {
        const id = `SCHAUSPIELER-BG-20261013-${String(p.entry).padStart(3, "0")}-${q.code}`;
        return [id, { knowledgeId: q.knowledge_id ?? `K-${id}` }];
      }),
    ),
  );
  const existingNames = new Set(
    state.questions
      .map((q) => q.metadata.person_name)
      .filter(Boolean)
      .map(norm),
  );
  const byPerson = new Set();
  const rows = [],
    allFilms = new Map(),
    texts = new Set();
  const levels = { L: "leicht", M: "mittel", S: "schwer", E: "experte" };
  const codes = ["L1", "L2", "M1", "M2", "S1", "S2", "E1", "E2"];
  const wordCount = (text) => text.trim().split(/\s+/).length;
  const letters = ["A", "B", "C", "D"];
  for (const person of people) {
    const plan = expected.find((p) => p.personId === person.personId);
    assert(
      plan && plan.name === person.name && plan.level === person.level,
      `Plan ${person.name}`,
    );
    assert(
      !existingNames.has(norm(person.name)),
      `Bereits vorhandene Person ${person.name}`,
    );
    assert(!byPerson.has(person.personId), "Personen-ID doppelt");
    byPerson.add(person.personId);
    assert.deepEqual(
      person.questions.map((q) => q.code).sort(),
      [...codes].sort(),
    );
    const portrait = portraits.find((p) => p.personId === person.personId);
    assert(portrait && portrait.name === person.name && portrait.visualChecked);
    const original = read(`${root}/${portrait.rawMetadata}`);
    if (portrait.provider === "Wikimedia Commons") {
      assert.equal(
        hash(fs.readFileSync(`${root}/${portrait.asset}`)),
        portrait.sha256,
        `Bild unverändert ${person.name}`,
      );
      const info =
        original.query.pages[String(portrait.rawPageId)].imageinfo[0];
      assert.equal(
        info.extmetadata.LicenseShortName.value,
        portrait.licenseName,
      );
      assert(
        /^(Public domain|CC0|CC BY(?:-SA)? (?:[234]\.0|2\.5)(?: de| nl| br)?)$/.test(
          portrait.licenseName,
        ),
      );
      assert(portrait.width > 0 && portrait.height > 0);
      assert(
        Math.abs(portrait.height * info.width - portrait.width * info.height) <=
          Math.max(info.width, info.height),
        `Seitenverhältnis ${person.name}`,
      );
    } else if (portrait.provider === "TMDB") {
      assert.equal(original.id, portrait.tmdbId);
      assert.equal(
        portrait.remoteSrc,
        `https://image.tmdb.org/t/p/w185${original.profile_path}`,
      );
      assert.equal(
        portrait.asset,
        undefined,
        "TMDB-Bilder nur online referenziert",
      );
    } else throw Error(`Bildanbieter ${person.name}`);
    const identity = identities.find((p) => p.personId === person.personId);
    assert.equal(identity.tmdbId, portrait.tmdbId);
    assert.equal(identity.identityEvidence.id, portrait.tmdbId);
    const goals = new Set();
    for (const q of person.questions) {
      const id = `SCHAUSPIELER-BG-20261013-${String(person.entry).padStart(3, "0")}-${q.code}`;
      const goal = q.knowledge_id ?? `K-${id}`;
      assert(
        !existingById.has(id) && !goals.has(goal),
        `Neue Frage / unabhängiges Ziel ${id}`,
      );
      goals.add(goal);
      assert(
        q.question && q.short && q.context && q.anchor && q.interest,
        `Texte ${id}`,
      );
      assert(
        q.question.includes(person.name),
        `Vorgegebener Personenname ${id}`,
      );
      assert.equal(q.answers.length, 4);
      assert.equal(new Set(q.answers.map(norm)).size, 4);
      assert.equal(q.feedback.length, 4);
      assert(q.feedback.every((f) => typeof f === "string"));
      assert(Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 3);
      assert(
        wordCount([q.question, ...q.answers].join(" ")) <= 60,
        `30-Sekunden-Lesbarkeit ${id}`,
      );
      const normalizedText = norm(q.question);
      assert(!texts.has(normalizedText), `Doppelter Fragetext ${id}`);
      texts.add(normalizedText);
      assert(
        q.extraSources.length &&
          q.extraSources.every((url) => /^https:\/\//.test(url)),
        `Frageweise Quellen ${id}`,
      );
      if (q.variant_of)
        assert.equal(
          (existingById.get(q.variant_of) ?? newById.get(q.variant_of))
            ?.knowledgeId,
          goal,
          `Bestandsziel ${id}`,
        );
      const refs = [...new Set(q.films)];
      for (const ref of refs) {
        if (allFilms.has(ref)) continue;
        const existing = filmData(
          { id: "editorial-reference", metadata: {} },
          ref,
        );
        const added = supplements.get(ref);
        assert(existing || added, `Film-Eckdaten fehlen: ${ref}`);
        allFilms.set(ref, {
          filmId: ref,
          origin: existing ? "Bestand" : "Ergänzung",
          // Explicitly researched metadata takes precedence in this handoff.
          ...(added ?? existing),
        });
      }
      rows.push({
        question_id: id,
        knowledge_id: goal,
        variant_of: q.variant_of ?? "",
        language: "de",
        domain: "Personen",
        subdomain: "Schauspieler",
        difficulty: levels[q.code[0]],
        question_type: "Personenwissen",
        topic_tags: "Schauspieler",
        badge_tags: "Schauspieler",
        learning_objective: q.short,
        question: q.question,
        ...Object.fromEntries(
          q.answers.map((answer, i) => [
            `answer_${letters[i].toLowerCase()}`,
            answer,
          ]),
        ),
        correct_answer: letters[q.correct],
        explanation_short: q.short,
        explanation_context: q.context,
        ...Object.fromEntries(
          q.feedback.map((feedback, i) => [
            `feedback_${letters[i].toLowerCase()}`,
            feedback,
          ]),
        ),
        memory_anchor: q.anchor,
        source_urls: [...new Set([...q.extraSources, person.articleUrl])].join(
          "|",
        ),
        verification_status: "redaktionell_quellengeprueft",
        person_id: person.personId,
        person_name: person.name,
        person_name_before_answer: "true",
        film_refs: refs.join(";"),
      });
    }
    assert.equal(goals.size, 8);
  }
  const fields =
    "question_id,knowledge_id,variant_of,language,domain,subdomain,film_title_de,film_title_original,film_year,franchise,difficulty,question_type,topic_tags,badge_tags,learning_objective,question,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation_short,explanation_context,feedback_a,feedback_b,feedback_c,feedback_d,memory_anchor,spoiler_level,source_urls,verification_status,person_id,person_name,person_name_before_answer,film_refs".split(
      ",",
    );
  const csv =
    Papa.unparse(
      {
        fields,
        data: rows.map((row) => fields.map((field) => row[field] ?? "")),
      },
      { quotes: true, newline: "\n" },
    ) + "\n";
  const roundTrip = Papa.parse(csv, { header: true, skipEmptyLines: true });
  assert.equal(roundTrip.errors.length, 0);
  assert.equal(roundTrip.data.length, rows.length);
  const imported = importCsv(
    csv,
    state.questions,
    "Schauspieler-Bekanntheit-2026-10-13.csv",
  );
  assert.equal(imported.report.accepted, rows.length);
  assert.equal(imported.report.rejected, 0);
  assert.equal(imported.report.duplicates, 0);
  assert.equal(imported.report.warnings.length, 0);
  for (const [i, q] of imported.questions.entries()) {
    assert.equal(q.question, rows[i].question);
    assert.equal(q.context, rows[i].explanation_context);
    assert.equal(q.anchor, rows[i].memory_anchor);
    assert.equal(q.metadata.film_refs, rows[i].film_refs);
    assert.equal(q.metadata.person_id, rows[i].person_id);
    assert.equal(
      q.answers.find((a) => a.id === q.correctId).text,
      people[Math.floor(i / 8)].questions[i % 8].answers[
        people[Math.floor(i / 8)].questions[i % 8].correct
      ],
    );
    for (const [j, answer] of q.answers.entries())
      assert.equal(
        answer.feedback,
        rows[i][`feedback_${letters[j].toLowerCase()}`],
      );
  }
  const reading = [
    "# Schauspielergruppen: Ausbau\n",
    "Redaktionell geprüft, mit dem App-Parser geprüft; noch nicht in der App installiert. Richtige Lösungen sind hier sichtbar.\n",
  ];
  for (const person of people) {
    const portrait = portraits.find((p) => p.personId === person.personId);
    reading.push(
      `## ${person.name} · Bekanntheitsgruppe ${person.level}\n`,
      `![${portrait.alt}](${portrait.provider === "TMDB" ? portrait.remoteSrc : portrait.asset})\n`,
      `Bild: ${portrait.imageDate}; ${portrait.creator}. ${portrait.license}. [Bildquelle](${portrait.sourceUrl}), [TMDB](${portrait.tmdbUrl}).\n`,
    );
    for (const q of person.questions) {
      reading.push(
        `### ${q.code} · ${levels[q.code[0]]}\n`,
        q.question + "\n",
        ...q.answers.map(
          (answer, i) =>
            `- ${i === q.correct ? "**Richtig: " + answer + "**" : answer}\n`,
        ),
        q.short + "\n",
        q.context + "\n",
        `Merksatz: ${q.anchor}\n`,
      );
      const feedback = q.feedback
        .map((value, i) => value && `- ${q.answers[i]}: ${value}\n`)
        .filter(Boolean);
      if (feedback.length) reading.push("Antwortzusätze:\n", ...feedback);
      if (q.variant_of)
        reading.push(
          `Gemeinsames Wissensziel: ${q.knowledge_id} (${q.variant_of}).\n`,
        );
      reading.push(
        `Quellen: ${[...new Set(q.extraSources)].map((url, i) => `[${i + 1}](${url})`).join(", ")}.\n`,
      );
    }
  }
  const outputs = {
    "Fragen.csv": csv,
    "Filmdaten.json":
      JSON.stringify(
        {
          asOf: "2026-10-13",
          note: "Geprüfte Referenzen ausschließlich für Personenfragen; keine zusätzlichen Filmfragen.",
          films: [...allFilms.values()],
        },
        null,
        2,
      ) + "\n",
    "Lesefassung.md": reading.join("\n"),
  };
  for (const [name, value] of Object.entries(outputs)) {
    if (process.argv.includes("--check"))
      assert.equal(
        fs.readFileSync(`${root}/${name}`, "utf8").replace(/\r\n/g, "\n"),
        value,
        `Redaktionelle Ableitung ${name}`,
      );
    else fs.writeFileSync(`${root}/${name}`, value);
  }
  const counts = Object.fromEntries(
    letters.map((letter) => [
      letter,
      rows.filter((q) => q.correct_answer === letter).length,
    ]),
  );
  assert(
    Object.values(counts).every((count) => count === rows.length / 4),
    "Ausgeglichene Antwortpositionen",
  );
  console.log(
    JSON.stringify(
      {
        status: "Mit App-Parser geprüft; nicht installiert",
        persons: people.length,
        questions: rows.length,
        independentGoals: new Set(rows.map((q) => q.knowledge_id)).size,
        existingVariants: rows.filter((q) => existingGoals.has(q.knowledge_id))
          .length,
        withinPackageVariants: rows.filter(
          (q) => q.variant_of && newById.has(q.variant_of),
        ).length,
        newGoals: new Set(
          rows
            .filter((q) => !existingGoals.has(q.knowledge_id))
            .map((q) => q.knowledge_id),
        ).size,
        currentCatalog: state.questions.length,
        filmReferences: allFilms.size,
        reusedFilmReferences: [...allFilms.values()].filter(
          (f) => f.origin === "Bestand",
        ).length,
        newFilmReferences: [...allFilms.values()].filter(
          (f) => f.origin === "Ergänzung",
        ).length,
        portraits: portraits.length,
        answers: counts,
        difficulties: Object.fromEntries(
          Object.values(levels).map((level) => [
            level,
            rows.filter((q) => q.difficulty === level).length,
          ]),
        ),
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}

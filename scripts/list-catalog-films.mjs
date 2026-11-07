// Read-only inventory of the current official catalog, including film
// references shown in actor/award questions. No account or production access.
import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { strict as assert } from "node:assert";

const output = process.argv[2];
const asOf = process.argv[3];
assert.ok(
  output && asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf),
  "Aufruf: node scripts/list-catalog-films.mjs <Ausgabedatei> <JJJJ-MM-TT>",
);
const read = async (path) => JSON.parse(await readFile(path, "utf8"));
const server = await createServer({
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});
try {
  const { packages, addPackages } =
    await server.ssrLoadModule("/src/packages.ts");
  const { emptyState } = await server.ssrLoadModule("/src/model.ts");
  const { preparePresentation } = await server.ssrLoadModule(
    "/src/questionPresentation.ts",
  );
  const { questionSourceOf } = await server.ssrLoadModule("/src/filters.ts");
  const state = emptyState();
  addPackages(
    state,
    await Promise.all(
      packages.map(async (pkg) => ({
        filename: pkg.filename,
        text: await readFile(`${pkg.path}`, "utf8"),
      })),
    ),
  );
  assert.equal(
    new Set(state.questions.map((q) => q.id)).size,
    state.questions.length,
  );

  const labels = new Map();
  const remember = (key, title) => {
    if (title && !labels.has(key)) labels.set(key, title);
  };
  for (const q of state.questions) {
    if (questionSourceOf(q) !== "actors") {
      remember(
        `${q.metadata.film_title_original}|${q.metadata.film_year}`,
        q.metadata.film_title_de,
      );
    }
  }
  for (const film of (await read("src/filmFamiliarity.json")).films)
    remember(film.film, film.title);
  for (const path of [
    "src/actorFamiliarityFilmFacts.json",
    "docs/Erweiterung-2026-10-07/Filmdaten-Referenzen.json",
  ]) {
    for (const film of (await read(path)).films)
      remember(film.film_id, film.title);
  }
  for (const path of [
    "src/actorFilmFacts.json",
    "src/actorSupplementFilmFacts.json",
  ]) {
    for (const film of await read(path)) remember(film.film, film.title);
  }

  const films = new Map();
  const add = (key, originalTitle, year, q, source) => {
    assert.ok(
      originalTitle && Number.isInteger(year),
      `${q.id}: unvollständige Filmidentität`,
    );
    const film = films.get(key) ?? {
      key,
      title: labels.get(key) ?? originalTitle,
      originalTitle,
      year,
      film: new Set(),
      awards: new Set(),
      references: new Set(),
    };
    film[source].add(q.id);
    films.set(key, film);
  };
  for (const q of state.questions) {
    const source = questionSourceOf(q);
    if (source !== "actors") {
      const originalTitle = q.metadata.film_title_original;
      const year = Number(q.metadata.film_year);
      add(`${originalTitle}|${year}`, originalTitle, year, q, source);
    }
    for (const { reference, data } of preparePresentation(q).films) {
      if (reference)
        add(
          `${data.originalTitle}|${data.year}`,
          data.originalTitle,
          data.year,
          q,
          "references",
        );
    }
  }
  // Independent coverage check against the complete maintained film registry.
  const series = (await read("src/filmSeries.json")).films;
  assert.deepEqual([...films.keys()].sort(), Object.keys(series).sort());
  const collator = new Intl.Collator("de", {
    numeric: true,
    sensitivity: "base",
  });
  const sorted = [...films.values()].sort(
    (a, b) =>
      collator.compare(a.title, b.title) ||
      a.year - b.year ||
      collator.compare(a.originalTitle, b.originalTitle),
  );
  const direct = sorted.filter((f) => f.film.size || f.awards.size);
  const filmQuestions = sorted.filter((f) => f.film.size);
  const awardQuestions = sorted.filter((f) => f.awards.size);
  const referenceOnly = sorted.filter((f) => !f.film.size && !f.awards.size);
  for (const source of ["film", "awards"]) {
    assert.equal(
      sorted.reduce((count, film) => count + film[source].size, 0),
      state.questions.filter((q) => questionSourceOf(q) === source).length,
      `Nicht alle Fragen aus ${source} sind genau einer Filmidentität zugeordnet`,
    );
  }
  const lines = [
    `Alle enthaltenen Filme – Stand ${asOf}`,
    "",
    `Quelle: ${packages.length} aktive Pakete aus src/packages.ts; ${state.questions.length} Fragen, einschließlich generierter Jahres-/Regiefragen und tatsächlich angezeigter Filmverweise.`,
    `Insgesamt ${films.size} unterschiedliche Filmidentitäten (Originaltitel + Jahr).`,
    `Davon ${direct.length} mit eigenen Film- oder Preisfragen; ${referenceOnly.length} ausschließlich als Filmverweis in Personen-/Preisfragen.`,
    `${filmQuestions.length} mit Filmfragen, ${awardQuestions.length} mit Preisfragen; diese beiden Gruppen können sich überschneiden.`,
    "",
    "Alphabetisch nach vorhandenem Katalog-/Metadatentitel, einschließlich führender Artikel; ohne deutschen Titel wird der Originaltitel verwendet. Remakes und andere Filmjahre bleiben getrennt. Je Film genau eine Zeile; bekannte Titelvarianten sind keine zusätzlichen Filme.",
    "Die Liste gibt den lokalen aktuellen Katalog wieder. Sie enthält weder private Filmsammlungsdaten noch Nutzerdaten. Keine neue Prüfung sämtlicher Alternativtitel; keine zusätzliche Erfassung bloßer Filmerwähnungen ohne Filmverweis in Freitexten.",
    "",
    ...sorted.map((film, index) => {
      const kinds = [
        ...(film.film.size ? [`Filmfragen: ${film.film.size}`] : []),
        ...(film.awards.size ? [`Preisfragen: ${film.awards.size}`] : []),
        ...(film.references.size
          ? [`Fragen mit Filmverweis: ${film.references.size}`]
          : []),
      ];
      const original =
        film.title === film.originalTitle
          ? ""
          : ` | Originaltitel: ${film.originalTitle}`;
      return `${String(index + 1).padStart(4, "0")}. ${film.title} (${film.year})${original} | ${kinds.join("; ")}`;
    }),
    "",
  ];
  await writeFile(output, lines.join("\n"), "utf8");
  // Re-read the delivered list and check every numbered identity, not a sample.
  const actual = (await readFile(output, "utf8"))
    .split("\n")
    .filter((line) => /^\d+\. /.test(line));
  assert.equal(actual.length, films.size);
  assert.deepEqual(
    actual,
    lines.filter((line) => /^\d+\. /.test(line)),
  );
  console.log(
    JSON.stringify({
      output,
      packages: packages.length,
      questions: state.questions.length,
      films: films.size,
      direct: direct.length,
      filmQuestions: filmQuestions.length,
      awardQuestions: awardQuestions.length,
      referenceOnly: referenceOnly.length,
    }),
  );
} finally {
  await server.close();
}

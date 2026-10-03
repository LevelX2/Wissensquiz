import fs from "node:fs/promises";
import { createHash } from "node:crypto";
const root = "docs/Schauspieler-Fragenpaket";
const source = JSON.parse(
  await fs.readFile(
    `${root}/Schauspieler_100_Personen_800_Fragen.json`,
    "utf8",
  ),
);
const actors = new Map(source.actors.map((a) => [a.actor_id, a.name]));
const rows = (await fs.readFile(`${root}/Vertiefungen-2026-10-03.tsv`, "utf8"))
  .trim()
  .split(/\r?\n/);
const films = [
  ...JSON.parse(await fs.readFile("src/filmFacts.json", "utf8")),
  ...JSON.parse(await fs.readFile("src/awardFilmFacts.json", "utf8")),
  ...JSON.parse(await fs.readFile("src/actorFilmFacts.json", "utf8")),
  ...JSON.parse(
    await fs.readFile(
      "KI-Wissen-Wissensquiz/01 Rohquellen/Alle_Genres_120_Filme_Filmdaten.json",
      "utf8",
    ),
  ).films.map((f) => ({
    film: `${f.film_title_original}|${f.film_year}`,
    title: f.film_title_de,
    source: f.sources[0].url,
  })),
];
const normalize = (s) =>
  s.normalize("NFKC").replace(/[–—−]/g, "-").replace(/’/g, "'").toLowerCase();
const filmMap = new Map(films.map((f) => [normalize(f.film), f]));
const aliases = new Map(
  films
    .filter((f) => f.title)
    .map((f) => [normalize(`${f.title}|${f.film.split("|").at(-1)}`), f]),
);
const questions = {},
  missing = new Set();
for (const row of rows) {
  const [suffix, supplement, references = ""] = row.split("\t");
  const id = `SCHAUSPIELER-202610-P01-${suffix}`;
  const q = source.questions.find((q) => q.question_id === id);
  if (!q || !supplement || questions[id])
    throw Error(`Ungültige Redaktion: ${suffix}`);
  const name = actors.get(q.actor_id);
  let question = q.question;
  if (q.actor_name_before_answer) {
    const surname =
      name === "Robert De Niro"
        ? "De Niro"
        : name === "Shah Rukh Khan"
          ? "(?:Shah Rukh|Khan)"
          : name === "Chow Yun-fat"
            ? "(?:Chow|Yun-fat)"
            : name
                .split(" ")
                .at(-1)
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expression = new RegExp(
      `(?<![\\p{L}])${surname}(?=s?[^\\p{L}]|s?$)`,
      "gu",
    );
    question = question
      .replaceAll(name, "\uE000")
      .replace(expression, name)
      .replaceAll("\uE000", name);
    if (
      question.startsWith(`${name}: `) &&
      question.slice(name.length + 2).includes(name)
    )
      question = question.slice(name.length + 2);
    if (!question.includes(name)) question = `${name}: ${question}`;
  }
  const referencesResolved = references
    .split(";")
    .filter(Boolean)
    .map((key) => {
      const f = filmMap.get(normalize(key)) ?? aliases.get(normalize(key));
      if (!f) {
        missing.add(key);
        return key;
      }
      return f.film;
    });
  const sources = [
    ...new Set([
      ...q.source_urls,
      ...referencesResolved
        .map((key) => filmMap.get(normalize(key))?.source)
        .filter(Boolean),
    ]),
  ];
  const corrections = {
    "021-A-2":
      "In der englischen Synchronfassung von „Das wandelnde Schloss“ spricht Christian Bale den Zauberer Howl. Die japanische Originalstimme stammt von Takuya Kimura.",
    "052-S-2":
      "Der Firmenname verweist auf den rückwärts gelesenen Nachnamen von Julia Roberts' Ehemann Daniel Moder.",
  };
  const baseText = corrections[suffix] ?? q.additional_info;
  questions[id] = {
    personId: q.actor_id,
    originalQuestion: q.question,
    originalContext: q.additional_info,
    question,
    text: `${baseText} ${supplement}`,
    films: referencesResolved,
    sources,
  };
}
await fs.writeFile(
  "src/actorEditorial.json",
  JSON.stringify({ reviewedOn: "2026-10-03", questions }, null, 2) + "\n",
);
await fs.mkdir(".sites-runtime", { recursive: true });
await fs.writeFile(
  ".sites-runtime/actor-missing-films.json",
  JSON.stringify([...missing], null, 2),
);
console.log(
  JSON.stringify({
    questions: Object.keys(questions).length,
    linkedQuestions: Object.values(questions).filter((q) => q.films.length)
      .length,
    missingFilms: [...missing],
  }),
);

if (rows.length === 800 && !missing.size) {
  const reading = [
    "# Schauspieler – überarbeitete Lesefassung",
    "",
    "Redaktionsstand 03.10.2026. 100 Personen, acht Fragen je Person. Diese Lesefassung zeigt Lösungen unmittelbar; im Spiel bleiben Erkennungsfragen bis zur Antwort ohne vorgegebenen Personennamen.",
    "",
  ];
  for (const actor of source.actors) {
    reading.push(`## ${actor.name}`, "");
    for (const q of source.questions.filter(
      (q) => q.actor_id === actor.actor_id,
    )) {
      const e = questions[q.question_id];
      reading.push(
        `### ${q.difficulty} · ${q.question_id}`,
        "",
        e.question,
        "",
        ...q.answers.map((a) => `- ${a.id}: ${a.text}`),
        "",
        `**Lösung: ${q.correct_answer}.** ${q.answers.find((a) => a.id === q.correct_answer).text}`,
        "",
        `**Vertiefung:** ${e.text}`,
        "",
      );
      if (e.films.length)
        reading.push(`**Filmdaten-Verknüpfungen:** ${e.films.join("; ")}`, "");
      reading.push(
        `**Quellen:** ${e.sources.map((url, i) => `[${i + 1}](${url})`).join(", ")}`,
        "",
      );
    }
  }
  await fs.writeFile(
    `${root}/Schauspieler_800_Fragen_Lesefassung_2026-10-03.md`,
    reading.join("\n"),
  );
  const sizes = Object.values(questions)
    .map((e) => e.text.split(/\s+/).length)
    .sort((a, b) => a - b);
  const research = await fs
    .readdir(".sites-runtime/film-research")
    .catch(() => []);
  const evidence = await Promise.all(
    research.map(async (file) => {
      const e = JSON.parse(
        await fs.readFile(`.sites-runtime/film-research/${file}`, "utf8"),
      );
      return {
        film: e.film,
        url: e.url,
        checkedOn: e.checkedOn,
        sha256_html: e.sha256_html,
        fields: e.infobox,
      };
    }),
  );
  if (evidence.length)
    await fs.writeFile(
      `${root}/Filmquellenpruefung-2026-10-03.json`,
      JSON.stringify(
        evidence.sort((a, b) => a.film.localeCompare(b.film)),
        null,
        2,
      ) + "\n",
    );
  await fs.writeFile(
    `${root}/Redaktionsbericht-2026-10-03.json`,
    JSON.stringify(
      {
        reviewedOn: "2026-10-03",
        questions: rows.length,
        people: source.actors.length,
        nameGivenBeforeAnswer: source.questions.filter(
          (q) => q.actor_name_before_answer,
        ).length,
        recognitionQuestions: source.questions.filter(
          (q) => !q.actor_name_before_answer,
        ).length,
        linkedQuestions: Object.values(questions).filter((e) => e.films.length)
          .length,
        linkedFilms: new Set(Object.values(questions).flatMap((e) => e.films))
          .size,
        addedFilmRecords: JSON.parse(
          await fs.readFile("src/actorFilmFacts.json", "utf8"),
        ).length,
        contextWords: { min: sizes[0], median: sizes[400], max: sizes.at(-1) },
        sourceSha256: createHash("sha256")
          .update(
            await fs.readFile(
              `${root}/Schauspieler_100_Personen_800_Fragen.json`,
            ),
          )
          .digest("hex"),
        editorialSha256: createHash("sha256")
          .update(await fs.readFile("src/actorEditorial.json"))
          .digest("hex"),
        missingFilmReferences: [],
        reviewLimit:
          "Redaktioneller Quellenabgleich und Struktur-/Anzeigetests; keine zweite unabhängige Vollabnahme aller Aussagen.",
      },
      null,
      2,
    ) + "\n",
  );
}

// Install the reviewed actor expansion reproducibly; never generates film questions.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { strict as assert } from "node:assert";
import Papa from "papaparse";

const source = "docs/Schauspieler-Bekanntheit-2026-10-13";
const check = process.argv.includes("--check");
const read = (file) =>
  JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const write = (file, bytes) => {
  if (check) assert.deepEqual(fs.readFileSync(file), Buffer.from(bytes), file);
  else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes);
  }
};
const normalized = (value) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const people = fs
  .readdirSync(source + "/Personen")
  .filter((file) => /^\d{3}\.json$/.test(file))
  .sort()
  .map((file) => read(source + "/Personen/" + file));
assert.equal(people.length, 208);
const plan = read(source + "/Fortschritt.json");
assert.equal(plan.validatedThroughEntry, 208);
const expected = new Map(
  plan.blocks
    .flatMap((block) => block.persons)
    .map((person) => [person.personId, person]),
);
const selection = new Map(
  Object.entries(read(source + "/Ausbauauswahl.json").groups).flatMap(
    ([level, names]) => names.map((name) => [normalized(name), Number(level)]),
  ),
);
for (const person of people) {
  assert.deepEqual(
    {
      entry: person.entry,
      personId: person.personId,
      name: person.name,
      level: person.level,
    },
    expected.get(person.personId),
  );
  if (person.entry > 8)
    assert.equal(person.level, selection.get(normalized(person.name)));
}
const familiarity = {
  persons: [
    ...read("docs/Bekanntheitsgruppen/Personen.json").persons.map((person) => ({
      person_id: person.personId,
      level: person.level,
    })),
    ...people.map((person) => ({
      person_id: person.personId,
      level: person.level,
    })),
  ],
};
assert.equal(
  new Set(familiarity.persons.map((person) => person.person_id)).size,
  428,
);
for (const level of [1, 2, 3, 4])
  assert.equal(
    familiarity.persons.filter((person) => person.level === level).length,
    107,
  );
write("src/personFamiliarity.json", json(familiarity));

const csv = fs.readFileSync(source + "/Fragen.csv");
const parsed = Papa.parse(csv.toString("utf8"), {
  header: true,
  skipEmptyLines: "greedy",
});
assert.equal(parsed.errors.length, 0);
const rows = parsed.data;
assert.equal(rows.length, 1664);
assert.equal(rows.filter((row) => row.variant_of).length, 105);
assert.equal(new Set(rows.map((row) => row.question_id)).size, rows.length);
write("public/schauspieler-bekanntheit-20261013-fragen.csv", csv);
const authored = new Map(
  people.flatMap((person) =>
    person.questions.map((question) => [
      "SCHAUSPIELER-BG-20261013-" +
        String(person.entry).padStart(3, "0") +
        "-" +
        question.code,
      { person, question },
    ]),
  ),
);
const editorial = { questions: {} };
for (const row of rows) {
  const { person, question } = authored.get(row.question_id);
  assert.equal(row.question, question.question);
  assert.equal(row.explanation_context, question.context);
  assert.equal(
    row.knowledge_id,
    question.knowledge_id ?? "K-" + row.question_id,
  );
  assert.equal(row.variant_of, question.variant_of ?? "");
  assert.equal(row.person_id, person.personId);
  assert.equal(row.correct_answer, ["A", "B", "C", "D"][question.correct]);
  editorial.questions[row.question_id] = {
    personId: person.personId,
    originalQuestion: row.question,
    originalContext: row.explanation_context,
    question: row.question,
    text: row.explanation_context,
    films: row.film_refs ? row.film_refs.split(";") : [],
    sources: row.source_urls.split("|"),
  };
}
write("src/actorFamiliarityEditorial.json", json(editorial));
// Include explicit researched overrides, but leave the film-question generator untouched.
const films = read(source + "/Filmdaten.json")
  .films.filter((film) => film.film_id)
  .map(({ filmId, origin, ...film }) => ({
    ...film,
    series:
      typeof film.series === "string"
        ? { name: film.series, position: null }
        : film.series,
  }));
assert.equal(films.length, 883);
assert.equal(new Set(films.map((film) => film.film_id)).size, films.length);
write("src/actorFamiliarityFilmFacts.json", json({ films }));

const portraits = read(source + "/Portraets.json");
const identities = read(source + "/TMDB-Personen.json").persons;
assert.equal(portraits.length, 208);
assert.equal(identities.length, 208);
const tmdbLinks = read("src/actorTmdbLinks.json");
for (const personId of Object.keys(tmdbLinks))
  if (personId.startsWith("ACTOR-BG-20261013-")) delete tmdbLinks[personId];
const localPortraits = read("src/actorPortraits.json");
for (const personId of Object.keys(localPortraits))
  if (personId.startsWith("ACTOR-BG-20261013-"))
    delete localPortraits[personId];
const onlinePortraits = {};
for (const person of people) {
  const identity = identities.find(
    (entry) => entry.personId === person.personId,
  );
  const portrait = portraits.find(
    (entry) => entry.personId === person.personId,
  );
  assert.equal(identity.name, person.name);
  assert.equal(portrait.name, person.name);
  assert.equal(portrait.tmdbId, identity.tmdbId);
  assert(portrait.visualChecked);
  tmdbLinks[person.personId] = { name: person.name, tmdbId: identity.tmdbId };
  const raw = read(path.resolve(source, portrait.rawMetadata));
  if (portrait.provider === "TMDB") {
    assert.equal(raw.id, identity.tmdbId);
    assert.equal(
      portrait.remoteSrc,
      "https://image.tmdb.org/t/p/w185" + raw.profile_path,
    );
    onlinePortraits[person.personId] = {
      name: person.name,
      tmdbId: identity.tmdbId,
      profilePath: raw.profile_path,
      src: portrait.remoteSrc,
      sourceUrl: portrait.sourceUrl,
      imageDate: portrait.imageDate,
      periodReason: portrait.periodReason,
    };
    continue;
  }
  assert.equal(portrait.provider, "Wikimedia Commons");
  const bytes = fs.readFileSync(path.resolve(source, portrait.asset));
  assert.equal(sha(bytes), portrait.sha256);
  const info = raw.query.pages[String(portrait.rawPageId)].imageinfo[0];
  assert.equal(info.extmetadata.LicenseShortName.value, portrait.licenseName);
  const src =
    "/portraits/actor-bg-20261013-" +
    String(person.entry).padStart(3, "0") +
    path.extname(portrait.asset);
  write("public" + src, bytes);
  localPortraits[person.personId] = {
    personId: person.personId,
    name: person.name,
    src,
    width: portrait.width,
    height: portrait.height,
    title:
      raw.query.pages[String(portrait.rawPageId)].title.replace(/^File:/, "") +
      " · " +
      portrait.imageDate,
    photographer: portrait.creator,
    photographerUrl: portrait.sourceUrl,
    sourceUrl: portrait.sourceUrl,
    license: portrait.licenseName,
    licenseUrl: portrait.licenseUrl,
    changes: [portrait.changes, portrait.periodReason]
      .filter(Boolean)
      .join(" "),
  };
}
assert.equal(Object.keys(tmdbLinks).length, 428);
assert.equal(Object.keys(localPortraits).length, 220);
assert.equal(Object.keys(onlinePortraits).length, 13);
write("src/actorTmdbLinks.json", json(tmdbLinks));
write("src/actorPortraits.json", json(localPortraits));
write("src/actorFamiliarityTmdbPortraits.json", json(onlinePortraits));
console.log(
  JSON.stringify(
    {
      mode: check ? "checked" : "integrated",
      persons: 428,
      newQuestions: rows.length,
      sharedGoals: 105,
      referenceMetadata: films.length,
      localPortraits: 195,
      onlinePortraits: 13,
    },
    null,
    2,
  ),
);

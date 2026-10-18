// Compact, maintained runtime projections; the editorial sources stay intact.
import { readFile, writeFile } from "node:fs/promises";
const read = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const films = await read("../src/filmFamiliarity.json");
const persons = await read("../src/personFamiliarity.json");
const fields = [
  "question_id",
  "knowledge_id",
  "variant_of",
  "film_title_original",
  "film_year",
  "subdomain",
];
const categoryRows = {};
for (const name of ["Classics", "Arthouse"]) {
  const source = await read(
    `../KI-Wissen-Wissensquiz/01 Rohquellen/${name}_Zuordnungen_Bestand.json`,
  );
  categoryRows[name] = source.entries.map((entry) =>
    fields.map((field) => {
      if (typeof entry[field] !== "string")
        throw new Error(`Invalid ${name} reference: ${field}`);
      return entry[field];
    }),
  );
  if (
    new Set(categoryRows[name].map((row) => row[0])).size !==
    categoryRows[name].length
  )
    throw new Error(`Duplicate ${name} reference`);
}
const levels = (items, key) => {
  if (new Set(items.map((item) => item[key])).size !== items.length)
    throw new Error("Duplicate familiarity identity");
  return items.map((item) => {
    if (typeof item[key] !== "string" || ![1, 2, 3, 4].includes(item.level))
      throw new Error("Invalid familiarity entry");
    return [item[key], item.level];
  });
};
const result =
  JSON.stringify({
    films: levels(films.films, "film"),
    persons: levels(persons.persons, "person_id"),
    categories: categoryRows,
  }) + "\n";
const path = new URL("../src/runtimeMetadata.json", import.meta.url);
if (process.argv.includes("--check")) {
  if ((await readFile(path, "utf8")).replaceAll("\r\n", "\n") !== result)
    throw new Error(
      "Laufzeitmetadaten veraltet. npm run prepare:runtime-metadata ausführen.",
    );
  console.log(
    "Laufzeitmetadaten stimmen mit den vollständigen Redaktionsquellen überein.",
  );
} else {
  await writeFile(path, result);
  console.log(`Laufzeitmetadaten: ${Buffer.byteLength(result)} Bytes`);
}

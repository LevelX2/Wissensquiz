// Project already reviewed, packaged film metadata into the existing registries.
import fs from "node:fs";
import assert from "node:assert/strict";
const root = "docs/Genres-150-2026-11-03";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + "\n");
const metadata = read(`${root}/Filmdaten.json`);
const familiarity = read("src/filmFamiliarity.json");
const registry = read("src/filmSeries.json");
const selection = read(`${root}/Auswahl.json`);
const byFilm = new Map(familiarity.films.map((f) => [f.film, f]));
let added = 0;
for (const film of metadata.films) {
  const key = `${film.film_title_original}|${film.film_year}`;
  const existing = byFilm.get(key);
  if (existing) assert.equal(existing.level, film.familiarity_level, `Review familiarity disagreement: ${key}`);
  else {
    const entry = {film: key, title: film.film_title_de, level: film.familiarity_level};
    familiarity.films.push(entry);
    byFilm.set(key, entry);
    added++;
  }
  registry.films[key] = {series: film.series, sources: film.series_sources};
  const candidates = selection.films.filter((f) => f.editorial_id === film.id || (f.film_title_original === film.film_title_original && f.film_year === film.film_year));
  assert.equal(candidates.length, 1, `Select exact candidate: ${key}`);
  Object.assign(candidates[0], {
    film_title_de: film.film_title_de, film_title_original: film.film_title_original,
    film_year: film.film_year, familiarity_level: film.familiarity_level,
    categories: film.categories, status: "lokal_integriert", editorial_id: film.id,
    identity_note: "Filmfassung und Erstveröffentlichung in der abgeschlossenen Einzelredaktion quellengeprüft; lokale App-Parser-Abnahme erfolgreich.",
  });
}
for (const film of metadata.series_updates) registry.films[film.film] = {series: film.series, sources: film.sources};
familiarity.asOf = "2026-11-03";
registry.checkedOn = "2026-11-03";
const integrated = selection.films.filter((f) => f.status === "lokal_integriert").length;
selection.status = `${selection.films.length} Genreplätze vorausgewählt; ${integrated} Filmfassungen mit ${integrated * 8} Fragen lokal integriert. ${selection.films.length - integrated} Kandidaten verbleiben als Auswahlentwurf.`;
if (process.argv.includes("--write")) {
  write("src/filmFamiliarity.json", familiarity);
  write("src/filmSeries.json", registry);
  write(`${root}/Auswahl.json`, selection);
}
console.log(JSON.stringify({written: process.argv.includes("--write"), packagedFilms: metadata.films.length, addedFamiliarityEntries: added, integratedCandidates: integrated}));

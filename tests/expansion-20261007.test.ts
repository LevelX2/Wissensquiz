import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { answer, complete, startRound } from "../src/engine";
import { filmData, addFilmFacts } from "../src/filmFacts";
import { actorPresentation } from "../src/actorEditorial";
import { familiarityOf, filmIdentity } from "../src/familiarity";
import { questionSourceOf } from "../src/filters";
import { isCategory } from "../src/categories";
import { read, update, validateBackup } from "../src/storage";
import films from "../docs/Erweiterung-2026-10-07/Filmdaten.json";
import persons from "../docs/Erweiterung-2026-10-07/Personenfragen_20261007.json";
import awards from "../docs/Erweiterung-2026-10-07/Preisefragen_20261007.json";

const contents = packages
  .filter((p) => !p.filename.startsWith("Genre100_"))
  .map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  }));
const incoming = contents.filter((p) =>
  p.filename.endsWith("fragen_20261007.csv"),
);
const before = emptyState();
addPackages(
  before,
  contents.filter((p) => !incoming.includes(p)),
);
const full = structuredClone(before);
addPackages(full, incoming);
const added = full.questions.filter((q) => q.id.startsWith("E20261007-"));
const get = (id: string) => full.questions.find((q) => q.id === id)!;

it("ergänzt genau 320 Einträge und 2.480 Fragen in allen 16 Kategorien ohne Importkonflikte", () => {
  expect(before.questions).toHaveLength(8397);
  expect(incoming).toHaveLength(3);
  expect(full.questions).toHaveLength(10877);
  expect(full.imports).toHaveLength(24);
  expect(full.imports.slice(-3).map((r) => r.accepted)).toEqual([
    2240, 160, 80,
  ]);
  expect(
    full.imports
      .slice(-3)
      .every(
        (r) =>
          !r.rejected &&
          !r.duplicates &&
          !r.issues.length &&
          !r.warnings.length,
      ),
  ).toBe(true);
  expect(full.questions.slice(0, before.questions.length)).toEqual(
    before.questions,
  );
  expect(new Set(full.questions.map((q) => q.id)).size).toBe(10877);
  expect(added.filter((q) => questionSourceOf(q) === "film")).toHaveLength(
    2240,
  );
  expect(added.filter((q) => questionSourceOf(q) === "actors")).toHaveLength(
    160,
  );
  expect(added.filter((q) => questionSourceOf(q) === "awards")).toHaveLength(
    80,
  );
  for (const category of new Set(
    films.films.map((f) => f.category || f.subdomain),
  ))
    expect(
      films.films.filter((f) => (f.category || f.subdomain) === category),
      category,
    ).toHaveLength(20);
  const previousFilmKeys = new Set(
    before.questions
      .filter((q) => questionSourceOf(q) === "film")
      .map(filmIdentity),
  );
  for (const f of films.films) {
    expect(
      previousFilmKeys.has(`${f.film_title_original}|${f.film_year}`),
    ).toBe(false);
    const group = added.filter((q) =>
      q.id.startsWith(`E20261007-F-${String(f.rank).padStart(3, "0")}-`),
    );
    expect(group).toHaveLength(8);
    expect(new Set(group.map((q) => q.knowledgeId)).size).toBe(8);
    for (const [prefix, difficulty] of [
      ["L", "leicht"],
      ["M", "mittel"],
      ["S", "schwer"],
    ])
      expect(
        group.filter(
          (q) =>
            q.id.split("-").at(-1)?.startsWith(prefix) &&
            q.difficulty === difficulty,
        ),
      ).toHaveLength(2);
    expect(
      group.filter((q) => q.metadata.question_type === "Filmjahr"),
    ).toHaveLength(1);
    expect(
      group.filter((q) => q.metadata.question_type === "Regie"),
    ).toHaveLength(1);
    if (f.category)
      expect(
        group.every((q) =>
          isCategory(q, f.category as "Classics" | "Arthouse"),
        ),
      ).toBe(true);
    expect(filmData(group[0])?.directors.split(/, | und /)).toEqual(
      f.directors,
    );
    expect(filmData(group[0])?.countries).toEqual(f.production_countries);
    expect(familiarityOf(group[0])).toBe(f.familiarity_level);
  }
  for (const row of [...persons.questions, ...awards.questions]) {
    const q = get(row.question_id);
    expect(q.context).toBe(row.additional_info);
    expect(q.sources).toEqual(row.source_urls);
    expect(q.answers.find((a) => a.id === q.correctId)?.text).toBe(
      row.answers.find((a) => a.id === row.correct_answer)?.text,
    );
    if (row.variant_of)
      expect(q.knowledgeId).toBe(get(row.variant_of).knowledgeId);
  }
  for (const person of persons.actors) {
    const group = person.question_ids.map(get);
    expect(group).toHaveLength(8);
    for (const level of ["leicht", "mittel", "schwer", "experte"])
      expect(group.filter((q) => q.difficulty === level)).toHaveLength(2);
    expect(
      before.questions.some((q) => q.metadata.person_name === person.name),
    ).toBe(false);
    for (const q of group) {
      expect(q.question).toContain(person.name);
      expect(filmData(q)).toBeUndefined();
      for (const ref of actorPresentation(q)!.films) {
        const data = filmData(q, ref)!;
        expect(data, ref).toBeDefined();
        expect(
          data.directors && data.countries.length && data.sources.length,
          ref,
        ).toBeTruthy();
      }
    }
  }
  for (const entry of awards.entries) {
    const group = entry.question_ids.map(get);
    expect(group.map((q) => q.difficulty).sort()).toEqual([
      "experte",
      "leicht",
      "mittel",
      "schwer",
    ]);
    expect(group.every((q) => isCategory(q, "Preisträger"))).toBe(true);
    expect(filmData(group[0])?.directors).toBeTruthy();
    expect(familiarityOf(group[0])).toBeTruthy();
  }
}, 30000);

it("teilt gleiche Wissensziele über Paketgrenzen und erzeugt beim Nachladen keine weiteren Filmfakten", () => {
  for (const q of added.filter((q) => q.metadata.variant_of))
    expect(q.knowledgeId, q.id).toBe(get(q.metadata.variant_of).knowledgeId);
  const once = structuredClone(full);
  addPackages(full, contents);
  expect(full).toEqual(once);
  expect(addFilmFacts(full.questions).added).toEqual([]);
  expect(validateBackup(structuredClone(full)).questions).toHaveLength(10877);
}, 30000);

it("erhält beantwortete und aktive Runden, Lerntermine, Rekorde und erworbene Rechte bei zwei gleichzeitigen Nachladevorgängen", async () => {
  const state = structuredClone(before),
    at = Date.parse("2026-10-07T12:00:00+02:00");
  const played = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    at,
  );
  for (const q of played.questions)
    answer(state, played.id, q.id, q.correctId, 300, at + 1000);
  complete(state, played.id, at + 2000);
  startRound(
    state,
    { mode: "ueben", topic: "Schauspieler", difficulty: "leicht" },
    at + 3000,
  );
  const snapshot = (s: typeof state) => ({
    rounds: s.rounds,
    events: s.events,
    learning: s.learning,
    records: s.records,
    career: s.career,
    experience: s.experience,
    settings: s.settings,
    favorites: s.favorites,
    rights: s.journey?.earned,
  });
  const saved = structuredClone(snapshot(state));
  const key = `expansion-20261007-${crypto.randomUUID()}`;
  await update((s) => Object.assign(s, state), undefined, key);
  await Promise.all([
    update((s) => addPackages(s, incoming), undefined, key),
    update((s) => addPackages(s, incoming), undefined, key),
  ]);
  const result = (await read(key))!;
  expect(snapshot(result)).toEqual(saved);
  expect(result.questions.slice(0, before.questions.length)).toEqual(
    before.questions,
  );
  expect(result.questions).toHaveLength(10877);
  expect(result.imports.slice(-3).map((r) => r.filename)).toEqual(
    incoming.map((p) => p.filename),
  );
  expect(() => validateBackup(result)).not.toThrow();
}, 30000);

it("vermeidet Titel- und Regiehinweise und trennt Fassungen und Premierentermine", () => {
  const waters = get("E20261007-F-180-D");
  expect(waters.question).not.toContain("Roger Waters");
  expect(filmData(waters)?.year).toBe(2014);
  expect(filmData(waters)?.directors).toContain("Roger Waters");
  expect(get("E20261007-F-126-L1").question).not.toContain("Smoking");
  expect(
    get("E20261007-F-195-Y").answers.find(
      (a) => a.id === get("E20261007-F-195-Y").correctId,
    )?.text,
  ).toBe("1964");
  expect(filmData(get("E20261007-F-195-Y"))?.releaseNote).toContain("1963");
  expect(filmData(get("E20261007-F-215-L1"))?.year).toBe(2019);
  expect(filmData(get("E20261007-F-243-L1"))?.releaseNote).toContain("1945");
});

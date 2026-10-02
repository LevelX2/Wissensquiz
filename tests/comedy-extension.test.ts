import { expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { packages, addPackages } from "../src/packages";
import { emptyState } from "../src/model";
import { filmData } from "../src/filmFacts";
import { familiarityOf, filmIdentity } from "../src/familiarity";
import { learningPathProgress, pathQuestions } from "../src/learningPath";
import { answer, complete, startRound } from "../src/engine";
import { validateBackup } from "../src/storage";
import source from "../KI-Wissen-Wissensquiz/01 Rohquellen/Komoedie_Ergaenzung_Filmdaten.json";

const contents = packages.slice(0, 14).map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

it("erhält die Komödie-Rohquellen und verbindet 50 Filme mit Bekanntheit, Filmdaten und Kategorien", () => {
  expect(hash(readFileSync("public/komoedie-ergaenzung-fragen.csv"))).toBe(
    "3e267acea78956d1179207a644a31be5d6151cb230dc1272206177b5cf12a96d",
  );
  expect(
    hash(
      readFileSync(
        "KI-Wissen-Wissensquiz/01 Rohquellen/Komoedie_Ergaenzung_Filmdaten.json",
      ),
    ),
  ).toBe("37a63023fa4dca4e81134f3ec3631332a4ad7d94ba526f484e045348c3f7c9d9");
  const s = emptyState();
  addPackages(s, contents);
  const qs = s.questions.filter((q) => q.metadata.subdomain === "Komödie");
  expect(qs).toHaveLength(725);
  expect(new Set(qs.map((q) => q.knowledgeId)).size).toBe(632);
  expect(new Set(qs.map(filmIdentity)).size).toBe(79);
  for (const f of source.films) {
    const q = qs.find((q) => q.id === f.reference_question_id)!;
    expect(filmIdentity(q)).toBe(`${f.film_title_original}|${f.film_year}`);
    expect(familiarityOf(q)).toBe(f.familiarity_level);
    expect(filmData(q)).toMatchObject({
      year: f.film_year,
      countries: f.production_countries,
      directorContext: f.director_context,
    });
    if (f.series) expect(filmData(q)?.series).toEqual(f.series);
    expect(
      q.tags.filter((t) => ["Classics", "Arthouse"].includes(t)).sort(),
    ).toEqual(Object.keys(f.category_reasons).sort());
    const director = qs.find(
      (n) =>
        filmIdentity(n) === filmIdentity(q) &&
        n.metadata.fact_kind === "director",
    )!;
    expect(director.context).toContain(f.director_context);
    expect(director.metadata.verification_status).toBe(
      "Redaktionelle Quelle 2026-09-29",
    );
  }
  const clerks = qs.find(
    (q) => q.metadata.film_title_original === "Clerks" && !q.metadata.fact_kind,
  )!;
  expect(filmData(clerks)?.series).toMatchObject({
    name: "View Askewniverse",
    position: null,
  });
  const dumb = qs.find(
    (q) =>
      q.metadata.film_title_original === "Dumb and Dumber" &&
      q.metadata.fact_kind === "director",
  )!;
  expect(dumb.answers.some((a) => a.text === "Bobby Farrelly")).toBe(false);
});

it("bewahrt alle 3.257 bisherigen Fragen und ergänzt neue Einträge nur einmal", () => {
  const old = emptyState();
  addPackages(old, contents.slice(0, 13));
  expect(hash(JSON.stringify(old.questions))).toBe(
    "51acda154453813d5d5ba2ff5cb5b505ce927081ace7262e2d91ab6a4a1f848a",
  );
  const before = structuredClone(old.questions);
  addPackages(old, contents);
  addPackages(old, contents);
  expect(old.questions).toHaveLength(3717);
  expect(old.questions.slice(0, before.length)).toEqual(before);
  expect(() => validateBackup(structuredClone(old))).not.toThrow();
});

it("behält einen begonnenen Komödie-Spielstand und macht die neuen Film-Ikonen spielbar", () => {
  const old = emptyState();
  addPackages(old, contents.slice(0, 13));
  const q = old.questions.find(
    (q) =>
      q.metadata.subdomain === "Komödie" &&
      !q.metadata.variant_of &&
      q.difficulty === "leicht",
  )!;
  const r = startRound(
    old,
    { mode: "ueben", topic: q.topic, difficulty: q.difficulty },
    1000,
  );
  r.questions = [q];
  r.order = [q.answers.map((a) => a.id)];
  r.familiaritySnapshot = { [q.id]: familiarityOf(q)! };
  answer(old, r.id, q.id, q.correctId, 100, 2000);
  complete(old, r.id, 3000);
  startRound(
    old,
    { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
    4000,
  );
  const before = structuredClone({
    rounds: old.rounds,
    events: old.events,
    learning: old.learning,
    settings: old.settings,
  });
  const progress = learningPathProgress(old)("Komödie");
  addPackages(old, contents);
  expect({
    rounds: old.rounds,
    events: old.events,
    learning: old.learning,
    settings: old.settings,
  }).toEqual(before);
  expect(
    learningPathProgress(old)("Komödie").familiarity,
  ).toBeGreaterThanOrEqual(progress.familiarity);
  expect(() => validateBackup(structuredClone(old))).not.toThrow();
  const fresh = emptyState();
  addPackages(fresh, contents);
  expect(
    pathQuestions(fresh).some(
      (q) => q.id.startsWith("KOM-202609-P02-") && familiarityOf(q) === 1,
    ),
  ).toBe(true);
});

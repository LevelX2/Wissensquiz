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
import source from "../KI-Wissen-Wissensquiz/01 Rohquellen/Musik_Ergaenzung_Filmdaten.json";

const contents = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const music = (q: { metadata: Record<string, string> }) =>
  q.metadata.subdomain === "Musik";
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

it("erhält die Musik-Rohquellen und verbindet alle Filmreferenzen mit Bekanntheit und Filmdaten", () => {
  expect(hash(readFileSync("public/musik-fragen.csv"))).toBe(
    "d8c47f7931d31ba0bf1108bf1b860e001170a44c7fa21449f514d03e1baab132",
  );
  expect(readFileSync("public/musik-fragen.csv")).toEqual(
    readFileSync(
      "KI-Wissen-Wissensquiz/01 Rohquellen/Musik_Ergaenzung_180_Fragen.csv",
    ),
  );
  expect(
    hash(
      readFileSync(
        "KI-Wissen-Wissensquiz/01 Rohquellen/Musik_Ergaenzung_Filmdaten.json",
      ),
    ),
  ).toBe("6b5ab699adeb3e5bc90ddab1237409b106a6fbe536b25a6e936b055dbd9b5026");
  const s = emptyState();
  addPackages(s, contents);
  const qs = s.questions.filter(music);
  expect(qs).toHaveLength(238);
  expect(new Set(qs.map((q) => q.knowledgeId)).size).toBe(208);
  expect(new Set(qs.map(filmIdentity)).size).toBe(26);
  for (const f of source.films) {
    const ref = qs.find((q) => q.id === f.reference_question_id)!;
    expect(filmIdentity(ref)).toBe(`${f.film_title_original}|${f.film_year}`);
    expect(familiarityOf(ref)).toBe(f.familiarity_level);
    expect(filmData(ref)).toMatchObject({
      year: f.film_year,
      countries: f.production_countries,
    });
    expect(
      ref.tags.filter((t) => ["Classics", "Arthouse"].includes(t)).sort(),
    ).toEqual(Object.keys(f.category_reasons).sort());
  }
  const bohemian = qs.find(
    (q) =>
      q.metadata.fact_kind === "director" &&
      q.metadata.film_title_original === "Bohemian Rhapsody",
  )!;
  expect(bohemian.answers.some((a) => a.text.includes("Dexter Fletcher"))).toBe(
    false,
  );
  expect(bohemian.metadata.verification_status).toBe(
    "Redaktionelle Quelle 2026-09-27",
  );
});

it("ändert keine der 2.567 bestehenden Fragen oder Antwortvorlagen durch die Erweiterung des Regiepools", () => {
  const old = emptyState();
  addPackages(old, contents.slice(0, 11));
  expect(hash(JSON.stringify(old.questions))).toBe(
    "8c464c37df4670df982019e8a608b2f4fe3d0367efeb1f1692525b713bf2ed9a",
  );
  const oldQuestions = structuredClone(old.questions);
  addPackages(old, contents);
  addPackages(old, contents);
  expect(old.questions).toHaveLength(3717);
  expect(old.questions.slice(0, oldQuestions.length)).toEqual(oldQuestions);
  expect(() => validateBackup(structuredClone(old))).not.toThrow();
});

it("beginnt Musik für neue Spieler bei Gruppe 1 und bewahrt den bisherigen Gruppe-2-Zugang ohne Lernereignisse", () => {
  const old = emptyState();
  addPackages(old, contents.slice(0, 11));
  expect(learningPathProgress(old)("Musik").first).toBe(2);
  addPackages(old, contents);
  expect(learningPathProgress(old)("Musik").familiarity).toBeGreaterThanOrEqual(
    2,
  );
  const fresh = emptyState();
  addPackages(fresh, contents);
  expect(learningPathProgress(fresh)("Musik").familiarity).toBe(1);
  expect(
    pathQuestions(fresh)
      .filter(music)
      .every((q) => familiarityOf(q) === 1 && q.difficulty === "leicht"),
  ).toBe(true);
  expect(
    new Set(pathQuestions(fresh).filter(music).map(filmIdentity)).size,
  ).toBe(5);
});

it("bewahrt Musik-Freischaltungen, Lernereignisse, aktive Runde und Wiederholungsplanung beim Nachladen", () => {
  const old = emptyState();
  addPackages(old, contents.slice(0, 11));
  const goals = old.questions.filter(
    (q) => music(q) && !q.metadata.variant_of && q.difficulty !== "schwer",
  );
  for (const q of goals) {
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
  }
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
  const progress = learningPathProgress(old)("Musik");
  expect(progress.hardUnlocked).toBe(true);
  addPackages(old, contents);
  expect({
    rounds: old.rounds,
    events: old.events,
    learning: old.learning,
    settings: old.settings,
  }).toEqual(before);
  expect(learningPathProgress(old)("Musik")).toMatchObject({
    hardUnlocked: true,
    easyTarget: progress.easyTarget,
    mediumTarget: progress.mediumTarget,
  });
  expect(() => validateBackup(structuredClone(old))).not.toThrow();
});

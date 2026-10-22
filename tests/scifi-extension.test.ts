import { expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { packages, addPackages } from "../src/packages";
import { emptyState } from "../src/model";
import { filmData } from "../src/filmFacts";
import { familiarityOf, filmIdentity } from "../src/familiarity";
import { learningPathProgress, pathQuestions } from "../src/learningPath";
import { answer, complete, startRound } from "../src/engine";
import { validateBackup } from "../src/backupValidation";
import source from "../KI-Wissen-Wissensquiz/01 Rohquellen/SciFi_Ergaenzung_Filmdaten.json";
import { assertEditorialSource, currentQuestionId } from "./editorialSource";
import reviewedFacts from "../src/reviewedFilmFacts.json";

const editorial = JSON.parse(
  readFileSync("docs/Bestandsredaktion-2026-10-04/Block-04.json", "utf8"),
) as {
  generatedChanges: {
    before: { film: string; directorContext: string };
    after: { directorContext: string };
  }[];
};

const contents = packages.slice(0, 14).map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

it("erhält Sci-Fi-Rohquellen und bindet alle 50 Filme samt Zusatztexten, Bekanntheit und Kategorien ein", () => {
  assertEditorialSource(
    readFileSync("public/scifi-ergaenzung-fragen.csv", "utf8"),
    readFileSync(
      "KI-Wissen-Wissensquiz/01 Rohquellen/SciFi_Ergaenzung_360_Fragen.csv",
      "utf8",
    ),
    "public/scifi-ergaenzung-fragen.csv",
  );
  expect(
    hash(
      readFileSync(
        "KI-Wissen-Wissensquiz/01 Rohquellen/SciFi_Ergaenzung_360_Fragen.csv",
      ),
    ),
  ).toBe("c5af33b206ed17443fc1283e7dbf5e028f3514ddd4d95db056de0799c6726af8");
  expect(
    hash(
      readFileSync(
        "KI-Wissen-Wissensquiz/01 Rohquellen/SciFi_Ergaenzung_Filmdaten.json",
      ),
    ),
  ).toBe("d033f824c77f44eed72485c38bd30b0c8908a19a629f65c7b2a12bc380f032af");
  const s = emptyState();
  addPackages(s, contents);
  const qs = s.questions.filter(
    (q) => q.metadata.subdomain === "Science-Fiction",
  );
  expect(qs).toHaveLength(772);
  expect(new Set(qs.map((q) => q.knowledgeId)).size).toBe(677);
  expect(new Set(qs.map(filmIdentity)).size).toBe(103);
  for (const f of source.films) {
    const q = qs.find((q) => q.id === currentQuestionId(f.reference_question_id))!;
    const revision = editorial.generatedChanges.find(
      (entry) =>
        entry.before.film === `${f.film_title_original}|${f.film_year}`,
    )!;
    expect(revision).toBeDefined();
    expect(revision.before.directorContext).toBe(f.director_context);
    expect(filmIdentity(q)).toBe(`${f.film_title_original}|${f.film_year}`);
    expect(familiarityOf(q)).toBe(f.familiarity_level);
    expect(filmData(q)).toMatchObject({
      year: f.film_year,
      countries: f.production_countries,
      directorContext: revision.after.directorContext,
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
    const current = (reviewedFacts as Record<string, { context: string; metadata: Record<string, string> }>)[
      director.id
    ];
    expect(director.context).toContain(
      current?.context ?? revision.after.directorContext,
    );
    expect(director.metadata.verification_status).toBe(
      current
        ? current.metadata.verification_status
        : "Redaktionelle Quelle 2026-09-29",
    );
  }
  const enemy = qs.find(
    (q) =>
      q.metadata.film_title_original === "Enemy Mine" &&
      q.metadata.fact_kind === "director",
  )!;
  expect(enemy.answers.some((a) => a.text === "Richard Loncraine")).toBe(false);
});

it("erhält alle 2.797 bisherigen Fragen einschließlich Regiealternativen und ergänzt idempotent", () => {
  const old = emptyState();
  addPackages(old, contents.slice(0, 12));
  expect(hash(JSON.stringify(old.questions))).toBe(
    "31004af7e734837b1bd68c1b43cfc0bcce8b9e68b2ecda7874657471b565631d",
  );
  const before = structuredClone(old.questions);
  addPackages(old, contents);
  addPackages(old, contents);
  expect(old.questions).toHaveLength(3726);
  expect(old.questions.slice(0, before.length)).toEqual(before);
  expect(() => validateBackup(structuredClone(old))).not.toThrow();
});

it("bewahrt Sci-Fi-Lernereignisse und aktive Runden, berechnet Schwellen beim Nachladen neu", () => {
  const old = emptyState();
  addPackages(old, contents.slice(0, 12));
  const goals = old.questions.filter(
    (q) =>
      q.metadata.subdomain === "Science-Fiction" &&
      !q.metadata.variant_of &&
      q.difficulty !== "schwer",
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
  const snapshot = () =>
    structuredClone({
      rounds: old.rounds,
      events: old.events,
      learning: old.learning,
      settings: old.settings,
    });
  const before = snapshot(),
    progress = learningPathProgress(old)("Science-Fiction");
  expect(progress.hardUnlocked).toBe(true);
  addPackages(old, contents);
  expect(snapshot()).toEqual(before);
  const after = learningPathProgress(old)("Science-Fiction");
  expect(after.hardUnlocked).toBe(false);
  expect(after.familiarity).toBe(2);
  expect(after.groups[1].answered).toBeLessThan(after.groups[1].target);
  expect(after.easyTarget).toBeGreaterThan(progress.easyTarget);
  expect(after.mediumTarget).toBeGreaterThan(progress.mediumTarget);
  expect(() => validateBackup(structuredClone(old))).not.toThrow();
  const fresh = emptyState();
  addPackages(fresh, contents);
  expect(
    pathQuestions(fresh).some(
      (q) => q.id.startsWith("SF-202609-P02-") && familiarityOf(q) === 1,
    ),
  ).toBe(true);
}, 20000);

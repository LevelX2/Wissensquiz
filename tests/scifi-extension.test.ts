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
import source from "../KI-Wissen-Wissensquiz/01 Rohquellen/SciFi_Ergaenzung_Filmdaten.json";

const contents = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

it("erhält Sci-Fi-Rohquellen und bindet alle 50 Filme samt Zusatztexten, Bekanntheit und Kategorien ein", () => {
  expect(hash(readFileSync("public/scifi-ergaenzung-fragen.csv"))).toBe(
    "c5af33b206ed17443fc1283e7dbf5e028f3514ddd4d95db056de0799c6726af8",
  );
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
  expect(qs).toHaveLength(768);
  expect(new Set(qs.map((q) => q.knowledgeId)).size).toBe(672);
  expect(new Set(qs.map(filmIdentity)).size).toBe(103);
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
    "825ce93bee9da74a64963b2f7fbd3dc2c5d5835fb2f91cb694b528b750185152",
  );
  const before = structuredClone(old.questions);
  addPackages(old, contents);
  addPackages(old, contents);
  expect(old.questions).toHaveLength(3257);
  expect(old.questions.slice(0, before.length)).toEqual(before);
  expect(() => validateBackup(structuredClone(old))).not.toThrow();
});

it("bewahrt Sci-Fi-Lernereignisse, aktive Runden und bereits erreichte Freischaltungen beim Nachladen", () => {
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
  expect(after.hardUnlocked).toBe(true);
  expect(after.familiarity).toBeGreaterThanOrEqual(progress.familiarity);
  expect(after.easyTarget).toBe(progress.easyTarget);
  expect(after.mediumTarget).toBe(progress.mediumTarget);
  expect(() => validateBackup(structuredClone(old))).not.toThrow();
  const fresh = emptyState();
  addPackages(fresh, contents);
  expect(
    pathQuestions(fresh).some(
      (q) => q.id.startsWith("SF-202609-P02-") && familiarityOf(q) === 1,
    ),
  ).toBe(true);
});

import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { questionSourceOf } from "../src/filters";
import { familiarityOf } from "../src/familiarity";
import { filmData } from "../src/filmFacts";
import { startRound, answer, complete } from "../src/engine";
import { validateBackup } from "../src/backupValidation";

const inputs = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(p.path, "utf8"),
}));
const state = emptyState();
addPackages(state, inputs);
const questions = state.questions.filter(
  (q) => questionSourceOf(q) === "awards",
);

it("führt sämtliche Preisfragen mit vier eindeutigen Antworten, Quellen und allen vier Schwierigkeiten", () => {
  expect(questions.length).toBeGreaterThanOrEqual(280);
  expect(new Set(questions.map((q) => q.difficulty))).toEqual(
    new Set(["leicht", "mittel", "schwer", "experte"]),
  );
  for (const q of questions) {
    expect(q.metadata.person_id ?? "").toBe("");
    expect(q.tags).toContain("Preisträger");
    expect(q.badgeTags).toContain("Preisträger");
    expect(new Set(q.answers.map((a) => a.text)).size, q.id).toBe(4);
    expect(
      q.answers.filter((a) => a.id === q.correctId),
      q.id,
    ).toHaveLength(1);
    expect(q.context.length, q.id).toBeGreaterThan(50);
    expect(
      q.sources.some((url) =>
        /oscars\.org|festival-cannes\.com|labiennale\.org/.test(url),
      ),
      q.id,
    ).toBe(true);
    expect(familiarityOf(q), q.id).toBeTruthy();
  }
});

it("ordnet jeder Preisfrage die richtige Filmfassung mit vollständigen Eckdaten zu", () => {
  for (const q of questions) {
    const data = filmData(q)!;
    expect(data, q.id).toBeDefined();
    expect(data.originalTitle, q.id).toBe(q.metadata.film_title_original);
    expect(data.year, q.id).toBe(Number(q.metadata.film_year));
    expect(data.directors, q.id).toBeTruthy();
    expect(data.countries.length, q.id).toBeGreaterThan(0);
  }
});

it("spielt reine Preis-Expertenrunden ohne Filmgenre und erhält sie im Spielstand", () => {
  const own = structuredClone(state),
    now = Date.parse("2026-11-07T12:00:00+01:00");
  const round = startRound(
    own,
    {
      mode: "ueben",
      topic: "Preisträger",
      difficulty: "experte",
      filters: {
        sources: ["awards"],
        genres: [],
        difficulties: ["experte"],
        familiarities: [1, 2, 3, 4],
      },
    },
    now,
  );
  expect(round.questions).toHaveLength(10);
  expect(
    round.questions.every(
      (q) => questionSourceOf(q) === "awards" && q.difficulty === "experte",
    ),
  ).toBe(true);
  for (const q of round.questions)
    answer(own, round.id, q.id, q.correctId, 1000, now + 1000);
  complete(own, round.id, now + 2000);
  expect(() => validateBackup(JSON.parse(JSON.stringify(own)))).not.toThrow();
});

import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { addPackages, packages } from "../src/packages";
import { emptyState, type Question } from "../src/model";
import {
  prepareFactQuestion,
  questionSnapshotMatches,
  yearChoices,
} from "../src/filmFacts";
import { answer, startRound } from "../src/engine";
import { validateBackup } from "../src/backupValidation";
import { compileState, reconstructState } from "../src/syncCodec";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";

const catalog = emptyState();
addPackages(
  catalog,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(`public${p.path}`, "utf8"),
  })),
);
const generated = catalog.questions.filter(
  (q) => q.metadata.fact_kind === "year",
);
const fixed = catalog.questions.filter(
  (q) =>
    !q.metadata.fact_kind &&
    q.answers.every((a) => /^(18|19|20)\d{2}$/.test(a.text)),
);
const correctYear = (q: Question) =>
  Number(q.answers.find((a) => a.id === q.correctId)!.text);
const rank = (q: Question) =>
  q.answers.filter((a) => Number(a.text) < correctYear(q)).length;
function random(seed = 20261003) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function atRank(q: Question, index: number, previous?: Question) {
  const rng = random();
  let first = true;
  return prepareFactQuestion(q, previous, () => {
    if (first) {
      first = false;
      return (index + 0.5) / 4;
    }
    return rng();
  });
}

it("erreicht alle vier zeitlichen Ränge bei generierten und CSV-Jahresfragen ohne die Lösung oder Frageidentität zu ändern", () => {
  expect(generated).toHaveLength(425);
  expect(fixed).toHaveLength(125);
  for (const q of [...generated, ...fixed]) {
    const before = structuredClone(q),
      year = correctYear(q),
      pool = yearChoices(q);
    const lo = pool.filter((v) => v < year).length,
      hi = pool.filter((v) => v > year).length;
    const feasible = [0, 1, 2, 3].filter((r) => lo >= r && hi >= 3 - r);
    const seen = new Set<number>();
    for (let i = 0; i < 4; i++) {
      const next = atRank(q, i);
      seen.add(rank(next));
      expect(correctYear(next)).toBe(year);
      expect({ ...next, answers: q.answers }).toEqual(q);
      expect(questionSnapshotMatches(q, next)).toBe(true);
      expect(new Set(next.answers.map((a) => a.text)).size).toBe(4);
      if (!q.metadata.fact_kind)
        expect(next.answers.map((a) => a.id).sort()).toEqual(
          q.answers.map((a) => a.id).sort(),
        );
      for (const a of next.answers.filter((a) => a.id !== q.correctId)) {
        expect(pool).toContain(Number(a.text));
        expect(a.feedback).toContain(a.text);
        expect(a.feedback).toContain(String(year));
      }
    }
    expect([...seen].sort()).toEqual(feasible);
    expect(q).toEqual(before);
  }
});

it("verteilt bei genügend früheren und späteren Kandidaten die Lösung ungefähr zu 25 Prozent auf jeden Rang", () => {
  for (const q of [generated[0], fixed.find((q) => correctYear(q) === 1939)!]) {
    const rng = random(),
      counts = [0, 0, 0, 0];
    let previous: Question | undefined;
    for (let i = 0; i < 10000; i++) {
      previous = prepareFactQuestion(q, previous, rng);
      counts[rank(previous)]++;
    }
    for (const count of counts) expect(count).toBeGreaterThan(2350);
    for (const count of counts) expect(count).toBeLessThan(2650);
  }
});

it("vermeidet wiederholte falsche Trios ohne den gezogenen Jahresrang zu verschieben", () => {
  for (const q of [generated[0], fixed.find((q) => correctYear(q) === 1939)!]) {
    for (let r = 0; r < 4; r++) {
      const one = atRank(q, r),
        two = atRank(q, r, one);
      expect(rank(one)).toBe(r);
      expect(rank(two)).toBe(r);
      expect(two.answers.map((a) => a.text).sort()).not.toEqual(
        one.answers.map((a) => a.text).sort(),
      );
    }
  }
});

it("verwendet bei CSV-Jahresfragen das Lösungsjahr statt eines anderen Filmjahrs in den Metadaten", () => {
  const q = fixed.find((q) => correctYear(q) !== Number(q.metadata.film_year))!;
  expect(q).toBeDefined();
  for (let r = 0; r < 4; r++)
    expect(correctYear(atRank(q, r))).toBe(correctYear(q));
});

it("lässt historische Antworten weiter zu und weist verfälschte neue Antwortsnapshots zurück", () => {
  for (const q of [generated[0], fixed[0]]) {
    expect(questionSnapshotMatches(q, structuredClone(q))).toBe(true);
    const variant = atRank(q, 0);
    const failures = [
      (bad: Question) => {
        bad.answers.find((a) => a.id === q.correctId)!.text = "1900";
      },
      (bad: Question) => {
        bad.answers.find((a) => a.id !== q.correctId)!.feedback =
          "freie Behauptung";
      },
      (bad: Question) => {
        bad.answers.find((a) => a.id !== q.correctId)!.text = "9999";
      },
      (bad: Question) => {
        bad.answers[1] = structuredClone(bad.answers[0]);
      },
      (bad: Question) => {
        bad.correctId = bad.answers.find((a) => a.id !== q.correctId)!.id;
      },
      (bad: Question) => {
        bad.question = "Neue Frage";
      },
      (bad: Question) => {
        bad.metadata.film_year = "1900";
      },
    ];
    for (const mutate of failures) {
      const bad = structuredClone(variant);
      mutate(bad);
      expect(questionSnapshotMatches(q, bad)).toBe(false);
    }
    const reordered = JSON.parse(
      JSON.stringify(variant, (_key, value) =>
        value && !Array.isArray(value) && typeof value === "object"
          ? Object.fromEntries(Object.entries(value).reverse())
          : value,
      ),
    );
    expect(questionSnapshotMatches(q, reordered)).toBe(true);
  }
});

it("erhält Jahresalternativen und die korrekte Lernwertung im JSON-, Cloud- und Eintragssync-Rückweg", async () => {
  for (const q of [generated[0], fixed[0]]) {
    const state = emptyState([structuredClone(q)]);
    const round = startRound(
      state,
      { mode: "ueben", topic: q.topic, difficulty: "Alle Stufen" },
      1000,
    );
    const snapshot = structuredClone(round.questions[0]);
    answer(state, round.id, q.id, q.correctId, 0, 2000);
    const saved = validateBackup(JSON.parse(JSON.stringify(state)));
    expect(saved.rounds[0].questions[0]).toEqual(snapshot);
    expect(saved.events[0].correct).toBe(true);
    expect(saved.learning[q.knowledgeId].seen).toBe(1);
    expect(await decodeCloudState(await encodeCloudState(saved))).toEqual(
      saved,
    );
    expect(reconstructState(await compileState(saved))).toEqual(saved);
  }
});

it("verändert Antworten von Nicht-Jahresfragen nicht", () => {
  const q = catalog.questions.find((q) => q.metadata.fact_kind === "director")!;
  expect(prepareFactQuestion(q)).toBe(q);
});

it("bietet größere Abstände einschließlich vier, fünf und sechs Jahren auch bei schweren und Expertenfragen", () => {
  for (const difficulty of ["schwer", "experte"] as const) {
    const q = {
      ...structuredClone(fixed.find((q) => correctYear(q) === 1939)!),
      difficulty,
    };
    const rng = random(),
      seen = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const next = prepareFactQuestion(q, undefined, rng);
      for (const a of next.answers.filter((a) => a.id !== q.correctId)) {
        const gap = Math.abs(Number(a.text) - correctYear(q));
        expect(gap).toBeGreaterThanOrEqual(3);
        expect(gap).toBeLessThanOrEqual(8);
        seen.add(gap);
      }
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7, 8]);
  }
});

it("akzeptiert alte Rundensnapshots mit Einjahresabständen weiterhin unverändert", () => {
  const q = generated.find((q) => q.difficulty === "schwer")!;
  const y = correctYear(q),
    old = structuredClone(q);
  old.answers = [y, y - 1, y + 1, y + 2].map((year) => ({
    id: `${q.id}:y${year}`,
    text: String(year),
    feedback:
      year === y
        ? `Richtig: Die erste Veröffentlichung war ${year}.`
        : `${year} ist hier nicht gesucht. Die erste Veröffentlichung war ${y}.`,
  }));
  expect(questionSnapshotMatches(q, old)).toBe(true);
});

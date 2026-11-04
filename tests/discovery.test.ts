import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { emptyState, type Question, type State } from "../src/model";
import { importCsv } from "../src/importer";
import { answer, complete, selectQuestions, startRound } from "../src/engine";
import { discoveryContext } from "../src/discovery";
import { genreOf } from "../src/filters";
import { familiarityOf } from "../src/familiarity";
import filmCatalog from "../src/filmFamiliarity.json" with { type: "json" };
import people from "../src/personFamiliarity.json" with { type: "json" };
import { addPackages, packages } from "../src/packages";
import { pathQuestions, pathAreaOf } from "../src/learningPath";

const questions = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions;
const goals = [...new Map(questions.map((q) => [q.knowledgeId, q])).values()];
const options = {
  mode: "entdecken" as const,
  topic: "Alle Themen",
  difficulty: "Alle Stufen",
  size: 10,
  now: 100_000,
};
function play(state: State, qs = goals.slice(0, 1), at = 1000) {
  const r = startRound(state, { ...options, difficulty: "leicht" }, at);
  r.questions = qs;
  r.order = qs.map((q) => q.answers.map((a) => a.id));
  for (const q of qs) answer(state, r.id, q.id, q.correctId, 100, at + 100);
  complete(state, r.id, at + 200);
  return r;
}

it("Filmreise reserviert vier von zehn Plätzen für fällige Wiederholungen, auch bei vielen neuen Zielen", () => {
  const s = emptyState(questions);
  play(s, goals.slice(0, 30));
  for (const p of Object.values(s.learning)) p.due = 0;
  const before = structuredClone(s);
  for (const random of [() => 0, () => 0.5, () => 0.999]) {
    const selected = selectQuestions(
      questions,
      s.learning,
      { ...options, now: 2 * 86_400_000, ...discoveryContext(s) },
      random,
    );
    expect(selected).toHaveLength(10);
    expect(selected.filter((q) => !s.learning[q.knowledgeId])).toHaveLength(6);
    expect(selected.filter((q) => s.learning[q.knowledgeId])).toHaveLength(4);
    expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(10);
  }
  expect(s).toEqual(before);
});

it("drei direkt aufeinanderfolgende Zehnerrunden wiederholen bei genügend neuen Zielen nichts", () => {
  const s = emptyState();
  addPackages(
    s,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  const used = new Set<string>();
  for (let i = 0; i < 3; i++) {
    expect(
      new Set(
        pathQuestions(s)
          .filter(
            (q) => q.difficulty === "leicht" && !s.learning[q.knowledgeId],
          )
          .map((q) => q.knowledgeId),
      ).size,
    ).toBeGreaterThanOrEqual(10);
    const r = startRound(
      s,
      { ...options, difficulty: "leicht" },
      1000 + i * 1000,
    );
    expect(r.questions).toHaveLength(10);
    for (const q of r.questions) {
      expect(used.has(q.knowledgeId)).toBe(false);
      used.add(q.knowledgeId);
      answer(s, r.id, q.id, q.correctId, 100, 1100 + i * 1000);
    }
    complete(s, r.id, 1200 + i * 1000);
  }
  expect(used.size).toBe(30);
});

it("stellt die letzten drei Runden zurück und verwendet sie nur bei kleinem Restbestand", () => {
  const s = emptyState(questions);
  const pool = goals.slice(0, 15);
  play(s, pool.slice(0, 12), 1000);
  for (let i = 12; i < 15; i++) play(s, [pool[i]], i * 1000);
  const context = discoveryContext(s);
  expect(context.recentKnowledgeIds).toEqual(
    new Set(pool.slice(12).map((q) => q.knowledgeId)),
  );
  const selected = selectQuestions(pool, s.learning, {
    ...options,
    ...context,
  });
  expect(selected).toHaveLength(10);
  expect(
    selected.every((q) => !context.recentKnowledgeIds.has(q.knowledgeId)),
  ).toBe(true);
  const small = selectQuestions(pool.slice(10), s.learning, {
    ...options,
    ...context,
  });
  expect(small).toHaveLength(5);
  expect(new Set(small.map((q) => q.knowledgeId)).size).toBe(5);
});

it("zieht neue Schwierigkeiten gleichwahrscheinlich trotz ungleicher Ziel- und Variantenzahlen", () => {
  const base = questions[0];
  const pool = (["leicht", "mittel", "schwer"] as const).flatMap(
    (difficulty, index) =>
      Array.from({ length: [100, 20, 10][index] }, (_, i) => ({
        ...base,
        id: difficulty + i,
        knowledgeId: difficulty + i,
        difficulty,
      })),
  );
  pool.push(
    ...Array.from({ length: 20 }, (_, i) => ({
      ...pool[0],
      id: "variant" + i,
    })),
  );
  let seed = 91;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const counts = { leicht: 0, mittel: 0, schwer: 0, experte: 0 };
  for (let i = 0; i < 300; i++) {
    const selected = selectQuestions(pool, {}, options, random);
    expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(10);
    for (const q of selected) counts[q.difficulty]++;
  }
  for (const count of [counts.leicht, counts.mittel, counts.schwer]) {
    expect(count).toBeGreaterThan(900);
    expect(count).toBeLessThan(1100);
  }
  const small = selectQuestions(
    [pool[0], ...pool.filter((q) => q.difficulty === "mittel").slice(0, 2)],
    {},
    options,
    () => 0,
  );
  expect(small).toHaveLength(3);
  const filtered = selectQuestions(
    pool,
    {},
    {
      ...options,
      filters: { genres: [genreOf(base)], difficulties: ["leicht"] },
    },
  );
  expect(filtered.every((q) => q.difficulty === "leicht")).toBe(true);
});

function groupQuestion(level: number, id: string): Question {
  const film = filmCatalog.films.find((f) => f.level === level)!;
  const [title, year] = film.film.split("|");
  return {
    ...questions[0],
    id,
    knowledgeId: id,
    difficulty: "leicht",
    tags: [],
    metadata: {
      ...questions[0].metadata,
      person_id: "",
      film_title_original: title,
      film_year: year,
    },
  };
}

it("zieht Bekanntheitsgruppen innerhalb eines Bereichs gleichwahrscheinlich trotz ungleicher Zielmengen und Schwierigkeiten", () => {
  const pool = [1, 2, 3, 4].flatMap((level, index) =>
    Array.from({ length: [120, 35, 20, 12][index] }, (_, i) => {
      const q = groupQuestion(level, level + "-" + i);
      if (level === 1)
        q.difficulty =
          i < 90
            ? "leicht"
            : i < 100
              ? "mittel"
              : i < 110
                ? "schwer"
                : "experte";
      if (level === 3) q.difficulty = "mittel";
      if (i % 3 === 0 || q.difficulty === "experte")
        q.metadata.person_id = people.persons.find(
          (p) => p.level === level,
        )!.person_id;
      else if (i % 3 === 1) q.tags = ["Preisträger"];
      return q;
    }),
  );
  // Extra variants within a group/stage must not give a goal extra tickets.
  pool.push(
    ...Array.from({ length: 20 }, (_, i) => ({
      ...pool[0],
      id: "variant" + i,
    })),
  );
  let seed = 91;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const counts = [0, 0, 0, 0];
  const stages = { leicht: 0, mittel: 0, schwer: 0, experte: 0 };
  const roundGroupCounts = new Set<number>();
  for (let i = 0; i < 400; i++) {
    const selected = selectQuestions(pool, {}, options, random);
    expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(10);
    for (const q of selected) {
      const level = familiarityOf(q)!;
      counts[level - 1]++;
      if (level === 1 && q.metadata.person_id) stages[q.difficulty]++;
    }
    roundGroupCounts.add(selected.filter((q) => familiarityOf(q) === 1).length);
  }
  for (const count of counts) {
    expect(count).toBeGreaterThan(850);
    expect(count).toBeLessThan(1150);
  }
  for (const count of Object.values(stages)) {
    expect(count).toBeGreaterThan(50);
    expect(count).toBeLessThan(120);
  }
  expect(roundGroupCounts.size).toBeGreaterThan(3); // Random mix, no fixed quarter quota.

  const onlyTwoGroups = pool.filter((q) => familiarityOf(q)! <= 2);
  const restricted = selectQuestions(onlyTwoGroups, {}, options, random);
  expect(restricted).toHaveLength(10);
  expect(restricted.every((q) => familiarityOf(q)! <= 2)).toBe(true);
});

it("entfernt gemeinsame Ziele aus allen Bekanntheitsgruppen und Stufen und schöpft kleine Pools aus", () => {
  const shared = [1, 2, 3].map((level) => ({
    ...groupQuestion(level, "variant" + level),
    knowledgeId: "shared",
    difficulty: ["leicht", "mittel", "schwer"][
      level - 1
    ] as Question["difficulty"],
  }));
  const pool = [...shared, groupQuestion(4, "unique")];
  for (const random of [() => 0, () => 0.5, () => 0.999]) {
    const selected = selectQuestions(pool, {}, options, random);
    expect(selected).toHaveLength(2);
    expect(new Set(selected.map((q) => q.knowledgeId))).toEqual(
      new Set(["shared", "unique"]),
    );
  }
});

it("nimmt ausgeschöpfte Gruppen nicht in die neue Ziehung und füllt danach mit bekannten Zielen auf", () => {
  const known = Array.from({ length: 10 }, (_, i) =>
    groupQuestion(1, "known" + i),
  );
  const fresh = Array.from({ length: 3 }, (_, i) =>
    groupQuestion(2, "new" + i),
  );
  const s = emptyState();
  for (const q of known)
    s.learning[q.knowledgeId] = {
      knowledgeId: q.knowledgeId,
      status: "entdeckt",
      stage: 1,
      due: 9999999999999,
      seen: 1,
      lastSeenAt: 1,
      lastSecure: 1,
      lastAdvancedDay: null,
      secureDays: [],
    };
  const selected = selectQuestions(
    [...known, ...fresh],
    s.learning,
    options,
    () => 0,
  );
  expect(selected).toHaveLength(10);
  expect(selected.filter((q) => familiarityOf(q) === 2)).toHaveLength(3);
  expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(10);
});

it("füllt die Filmreise mit fälligen Zielen, wenn keine neuen verfügbar sind", () => {
  const s = emptyState(questions);
  play(s, goals.slice(0, 22));
  for (const p of Object.values(s.learning)) p.due = 0;
  const selected = selectQuestions(goals.slice(0, 22), s.learning, {
    ...options,
    now: 2 * 86_400_000,
    ...discoveryContext(s),
  });
  expect(selected).toHaveLength(10);
  const practice = selectQuestions(goals.slice(0, 40), s.learning, {
    ...options,
    mode: "ueben",
    ...discoveryContext(s),
  });
  expect(practice).toHaveLength(10);
  const record = selectQuestions(goals.slice(0, 22), s.learning, {
    ...options,
    mode: "rekord",
    ...discoveryContext(s),
  });
  expect(record).toHaveLength(10);
});

it("wählt ausschließlich fällige Ziele, priorisiert alte Termine und verwendet dieselbe Tagesgrenze wie die Anzeige", () => {
  const s = emptyState(questions);
  play(s, goals.slice(0, 12));
  const at = 2 * 86_400_000;
  goals.slice(0, 12).forEach((q, i) => {
    s.learning[q.knowledgeId].due = i * 1000;
  });
  const selected = selectQuestions(questions, s.learning, {
    ...options,
    now: at,
    mode: "fehler",
  });
  expect(selected).toHaveLength(10);
  expect(new Set(selected.map((q) => q.knowledgeId))).toEqual(
    new Set(goals.slice(0, 10).map((q) => q.knowledgeId)),
  );
  expect(
    selectQuestions(questions, s.learning, {
      ...options,
      mode: "fehler",
    }),
  ).toEqual([]); // Same learning day, despite manually overdue due values.
  expect(
    selectQuestions(goals.slice(10), s.learning, {
      ...options,
      now: at,
      mode: "fehler",
    }),
  ).toHaveLength(2);
  expect(
    selectQuestions(goals.slice(12), s.learning, {
      ...options,
      now: at,
      mode: "fehler",
    }),
  ).toEqual([]);
});

it("reine Wiederholungen steigen trotz verfügbarer neuer Fragen bei sicherer Antwort auf Stufe 2", () => {
  const s = emptyState(questions);
  const first = play(
    s,
    goals
      .filter((q) => q.difficulty === "leicht" && familiarityOf(q) === 1)
      .slice(0, 3),
  );
  const at = 2 * 86_400_000;
  const round = startRound(
    s,
    { ...options, difficulty: "leicht", mode: "fehler" },
    at,
  );
  expect(new Set(round.questions.map((q) => q.knowledgeId))).toEqual(
    new Set(first.questions.map((q) => q.knowledgeId)),
  );
  for (const q of round.questions) {
    answer(s, round.id, q.id, q.correctId, 100, at + 100);
    expect(s.learning[q.knowledgeId].stage).toBe(2);
    expect(s.learning[q.knowledgeId].due).toBe(at + 100 + 3 * 86_400_000);
  }
});

it("gewichtet Bereiche trotz großem Schauspielerbestand bei neuen, fälligen und bekannten Zielen gleich", () => {
  const areas = ["Schauspieler", "Abenteuer", "Drama", "Preisträger"];
  const pool = areas.flatMap((area, a) =>
    Array.from({ length: a === 0 ? 200 : 30 }, (_, i) => {
      const q = groupQuestion(1, area + "-" + i);
      q.metadata.subdomain = area;
      if (a === 0)
        q.metadata.person_id = people.persons.find(
          (p) => p.level === 1,
        )!.person_id;
      if (a === 3) q.tags = ["Preisträger"];
      return q;
    }),
  );
  let seed = 191;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (const phase of ["fresh", "due", "mixed", "known"]) {
    const s = emptyState();
    if (phase !== "fresh")
      for (const q of pool) {
        const i = Number(q.id.split("-").at(-1));
        if (phase === "mixed" && i >= 20) continue;
        // All actors are globally older; only age within the drawn area matters.
        const age = (pathAreaOf(q) === "Schauspieler" ? 1 : 1000) + i;
        s.learning[q.knowledgeId] = {
          knowledgeId: q.knowledgeId,
          status: "entdeckt",
          stage: 1,
          due: phase === "known" ? 9999999999999 : age,
          seen: 1,
          lastSeenAt: age,
          lastSecure: age,
          lastAdvancedDay: null,
          secureDays: [],
        };
      }
    const counts = Object.fromEntries(areas.map((a) => [a, 0]));
    const mixes = new Set<number>();
    for (let round = 0; round < 300; round++) {
      const selected = selectQuestions(
        pool,
        s.learning,
        { ...options, now: 2 * 86_400_000 },
        random,
      );
      expect(selected).toHaveLength(10);
      expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(10);
      if (phase === "mixed")
        expect(selected.filter((q) => s.learning[q.knowledgeId])).toHaveLength(
          4,
        );
      for (const q of selected) counts[pathAreaOf(q)]++;
      mixes.add(
        selected.filter((q) => pathAreaOf(q) === "Schauspieler").length,
      );
      if (phase !== "fresh")
        for (const area of areas) {
          const ids = selected
            .filter((q) => pathAreaOf(q) === area && s.learning[q.knowledgeId])
            .map((q) => Number(q.id.split("-").at(-1)))
            .sort((a, b) => a - b);
          expect(ids).toEqual(Array.from({ length: ids.length }, (_, i) => i));
        }
    }
    for (const count of Object.values(counts)) {
      expect(count).toBeGreaterThan(650);
      expect(count).toBeLessThan(850);
    }
    expect(mixes.size).toBeGreaterThan(3); // No fixed actor cap or area quota.
    expect(
      selectQuestions(
        pool,
        s.learning,
        {
          ...options,
          filters: {
            sources: ["actors"],
            genres: [],
            difficulties: ["leicht"],
          },
          now: 2 * 86_400_000,
        },
        random,
      ),
    ).toHaveLength(10);
  }
});

it("bevorzugt Bereiche mit zusätzlichen Bekanntheitsgruppen weder bei neuen noch bei wiederholten Zielen", () => {
  const areas = ["Abenteuer", "Drama", "Horror", "Komödie"];
  const pool = [1, 2].flatMap((level) =>
    Array.from({ length: 100 }, (_, i) => {
      const q = groupQuestion(level, level + "-" + i);
      q.metadata.subdomain = level === 1 ? areas[i % 4] : "Abenteuer";
      return q;
    }),
  );
  let seed = 91;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (const phase of ["fresh", "due", "known"]) {
    const s = emptyState();
    if (phase !== "fresh")
      for (const q of pool)
        s.learning[q.knowledgeId] = {
          knowledgeId: q.knowledgeId,
          status: "entdeckt",
          stage: 1,
          due: phase === "due" ? 1 : 9999999999999,
          seen: 1,
          lastSeenAt: 1,
          lastSecure: 1,
          lastAdvancedDay: null,
          secureDays: [],
        };
    const counts = Object.fromEntries(areas.map((area) => [area, 0]));
    let second = 0;
    for (let i = 0; i < 200; i++) {
      const selected = selectQuestions(
        pool,
        s.learning,
        { ...options, now: 2 * 86_400_000 },
        random,
      );
      expect(selected).toHaveLength(10);
      expect(new Set(selected.map((q) => q.knowledgeId)).size).toBe(10);
      for (const q of selected) {
        counts[pathAreaOf(q)]++;
        if (familiarityOf(q) === 2) second++;
      }
    }
    for (const count of Object.values(counts)) {
      expect(count).toBeGreaterThan(400);
      expect(count).toBeLessThan(600);
    }
    // Only Abenteuer has group 2: one quarter of area draws, half of its groups.
    expect(second).toBeGreaterThan(180);
    expect(second).toBeLessThan(320);
  }
});

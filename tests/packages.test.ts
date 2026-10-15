import { catalogCounts } from "./catalog-counts";
import { expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { answer, shuffle, startRound } from "../src/engine";
import { withCategoryTags } from "../src/categories";
import { assertEditorialSource } from "./editorialSource";
import { testReportPath } from "./helpers/test-report";

const contents = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const scifi = importCsv(contents[0].text, [], contents[0].filename);
const action = importCsv(
  contents[1].text,
  scifi.questions,
  contents[1].filename,
);
const existing = [...scifi.questions, ...action.questions];
const horror = importCsv(contents[2].text, existing, contents[2].filename);
const beforeFantasy = [...existing, ...horror.questions];
const fantasy = importCsv(
  contents[3].text,
  beforeFantasy,
  contents[3].filename,
);

const beforeComedy = [...beforeFantasy, ...fantasy.questions];
const comedy = importCsv(contents[4].text, beforeComedy, contents[4].filename);
const beforeWestern = [...beforeComedy, ...comedy.questions];
const western = importCsv(
  contents[5].text,
  beforeWestern,
  contents[5].filename,
);
const beforeDrama = [...beforeWestern, ...western.questions];
const drama = importCsv(contents[6].text, beforeDrama, contents[6].filename);
const beforeClassics = [...beforeDrama, ...drama.questions];
const classics = importCsv(
  contents[7].text,
  beforeClassics,
  contents[7].filename,
);

const allImported = contents.map((pkg, i) =>
  importCsv(
    pkg.text,
    contents.slice(0, i).flatMap((p) => importCsv(p.text).questions),
    pkg.filename,
  ),
);

it.each([
  ...["MartialArts", "RomCom", "Arthouse", "Musik"].map((name, i) => ({
    name,
    imported: allImported[i + 8],
    previous: allImported.slice(0, i + 8).flatMap((p) => p.questions),
    path: name.toLowerCase(),
  })),
  {
    name: "Komödie-Ergänzung",
    imported: allImported[13],
    previous: allImported.slice(0, 13).flatMap((p) => p.questions),
    path: "komoedie-ergaenzung",
    size: 360,
  },
  {
    name: "SciFi-Ergänzung",
    imported: allImported[12],
    previous: allImported.slice(0, 12).flatMap((p) => p.questions),
    path: "scifi-ergaenzung",
    size: 360,
  },
  {
    name: "Classics",
    imported: classics,
    previous: beforeClassics,
    path: "classics",
  },
  { name: "Drama", imported: drama, previous: beforeDrama, path: "drama" },
  {
    name: "Komoedie",
    imported: comedy,
    previous: beforeComedy,
    path: "komoedie",
  },
  {
    name: "Western",
    imported: western,
    previous: beforeWestern,
    path: "western",
  },
  { name: "Horror", imported: horror, previous: existing, path: "horror" },
  {
    name: "Fantasy",
    imported: fantasy,
    previous: beforeFantasy,
    path: "fantasy",
  },
])(
  "importiert $name vollständig ohne Konflikte und erhält Lösungen, Feedback und Varianten",
  ({ imported, previous, path, ...options }) => {
    const baseSize = "size" in options ? options.size : 180;
    const removedVariants = path === "classics" ? 1 : 0;
    const additions: Record<string, number> = {
      arthouse: 3,
      drama: 1,
      western: 1,
      "scifi-ergaenzung": 1,
    };
    const added = additions[path] ?? 0;
    const size = baseSize + added - removedVariants;
    expect(imported.report.accepted).toBe(size);
    expect(imported.report.rejected).toBe(0);
    expect(imported.report.duplicates).toBe(0);
    expect(imported.report.warnings).toEqual([]);
    expect(new Set(imported.questions.map((q) => q.knowledgeId)).size).toBe(
      (baseSize * 5) / 6 + added + (path === "komoedie" ? 1 : 0),
    );
    expect(
      imported.questions.filter((q) => q.metadata.variant_of),
    ).toHaveLength(baseSize / 6 - (path === "komoedie" ? 1 : 0) - removedVariants);
    const raw = readFileSync(
      `KI-Wissen-Wissensquiz/01 Rohquellen/${imported.report.filename}`,
    );
    assertEditorialSource(
      readFileSync(`public/${path}-fragen.csv`, "utf8"),
      raw.toString("utf8"),
      `public/${path}-fragen.csv`,
    );
    for (const q of imported.questions) {
      const mixed = shuffle(q.answers, () => 0.4);
      expect(mixed.find((a) => a.id === q.correctId)?.text).toBe(
        q.metadata[`answer_${q.metadata.correct_answer.toLowerCase()}`],
      );
      expect(q.context && q.sources.length).toBeTruthy();
      for (const a of mixed)
        expect(a.feedback).toBe(q.metadata[`feedback_${a.id.slice(-1)}`]);
      if (q.metadata.variant_of)
        expect(q.knowledgeId).toBe(
          imported.questions.find((a) => a.id === q.metadata.variant_of)
            ?.knowledgeId,
        );
    }
    const combined = [...previous, ...imported.questions];
    writeFileSync(
      testReportPath(`importbericht-${path}.json`),
      JSON.stringify(
        {
          ...imported.report,
          knowledgeGoals: new Set(imported.questions.map((q) => q.knowledgeId))
            .size,
          variants: imported.questions.filter((q) => q.metadata.variant_of)
            .length,
          topics: new Set(imported.questions.map((q) => q.topic)).size,
          combinedQuestions: combined.length,
          combinedKnowledgeGoals: new Set(combined.map((q) => q.knowledgeId))
            .size,
          combinedTopics: new Set(combined.map((q) => q.topic)).size,
          contentNote:
            "Unveränderte Nutzerdatei. Strukturell geprüft; keine unabhängige Faktenprüfung.",
        },
        null,
        2,
      ),
    );
  },
);

it("importiert Action vollständig ohne Konflikte und erhält Lösungen, Feedback und Varianten", () => {
  assertEditorialSource(
    contents[1].text,
    readFileSync(
      `KI-Wissen-Wissensquiz/01 Rohquellen/${contents[1].filename}`,
      "utf8",
    ),
    "public/action-fragen.csv",
  );
  expect(action.report.accepted).toBe(181);
  expect(action.report.rejected).toBe(0);
  expect(action.report.duplicates).toBe(0);
  expect(action.report.warnings).toEqual([]);
  expect(new Set(action.questions.map((q) => q.knowledgeId)).size).toBe(151);
  for (const q of action.questions) {
    const mixed = shuffle(q.answers, () => 0.4);
    expect(mixed.find((a) => a.id === q.correctId)?.text).toBe(
      q.metadata[`answer_${q.metadata.correct_answer.toLowerCase()}`],
    );
    for (const a of mixed)
      expect(a.feedback).toBe(q.metadata[`feedback_${a.id.slice(-1)}`]);
    if (q.metadata.variant_of)
      expect(q.knowledgeId).toBe(
        action.questions.find((a) => a.id === q.metadata.variant_of)
          ?.knowledgeId,
      );
  }
  writeFileSync(
    testReportPath("importbericht-action.json"),
    JSON.stringify(
      {
        ...action.report,
        knowledgeGoals: 150,
        variants: action.questions.filter((q) => q.metadata.variant_of).length,
        topics: new Set(action.questions.map((q) => q.topic)).size,
        combinedQuestions: 360,
        combinedKnowledgeGoals: 300,
        combinedTopics: new Set(
          [...scifi.questions, ...action.questions].map((q) => q.topic),
        ).size,
        contentNote:
          "Unveränderte Nutzerdatei. Strukturell geprüft; keine unabhängige Faktenprüfung.",
      },
      null,
      2,
    ),
  );
});

it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])(
  "ergänzt neue Pakete bei %i vorhandenen Paketen wiederholt ohne Fortschrittsverlust",
  async (packageCount) => {
    const previousPackages = allImported.slice(0, packageCount);
    const state = emptyState(previousPackages.flatMap((p) => p.questions));
    state.imports.push(...previousPackages.map((p) => p.report));
    state.settings.sound = false;
    state.settings.haptics = true;
    state.favorites = ["Alien"];
    const previousQuestions = structuredClone(state.questions);
    const r = startRound(
      state,
      {
        mode: "entdecken",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        ...(packageCount === 3
          ? {
              filters: {
                genres: ["Science-Fiction", "Horror"],
                difficulties: ["leicht" as const, "mittel" as const],
              },
            }
          : {}),
      },
      1000,
    );
    answer(state, r.id, r.questions[0].id, r.questions[0].correctId, 0, 2000);
    const before = JSON.stringify({
      rounds: state.rounds,
      events: state.events,
      learning: state.learning,
      settings: state.settings,
      favorites: state.favorites,
    });
    const saved = structuredClone(state);
    addPackages(saved, contents);
    addPackages(saved, contents);
    expect(saved.questions).toHaveLength(catalogCounts.questions);
    expect(saved.imports).toHaveLength(catalogCounts.packages);
    expect(new Set(saved.questions.map((q) => q.knowledgeId)).size).toBe(
      catalogCounts.goals,
    );
    expect(saved.questions.slice(0, previousQuestions.length)).toEqual(
      previousQuestions.map(withCategoryTags),
    );
    expect(
      JSON.stringify({
        rounds: saved.rounds,
        events: saved.events,
        learning: saved.learning,
        settings: saved.settings,
        favorites: saved.favorites,
      }),
    ).toBe(before);
  },
);

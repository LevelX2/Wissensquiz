import { expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import "fake-indexeddb/auto";
import { importCsv } from "../src/importer";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { answer, shuffle, startRound } from "../src/engine";
import { read, update } from "../src/storage";

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

it("importiert Horror vollständig ohne Konflikte und erhält Lösungen, Feedback und Varianten", () => {
  expect(horror.report.accepted).toBe(180);
  expect(horror.report.rejected).toBe(0);
  expect(horror.report.duplicates).toBe(0);
  expect(horror.report.warnings).toEqual([]);
  expect(new Set(horror.questions.map((q) => q.knowledgeId)).size).toBe(150);
  expect(horror.questions.filter((q) => q.metadata.variant_of)).toHaveLength(
    30,
  );
  expect(readFileSync("public/horror-fragen.csv")).toEqual(
    readFileSync(
      "KI-Wissen-Wissensquiz/01 Rohquellen/Horror_Quiz_180_Fragen.csv",
    ),
  );
  for (const q of horror.questions) {
    const mixed = shuffle(q.answers, () => 0.4);
    expect(mixed.find((a) => a.id === q.correctId)?.text).toBe(
      q.metadata[`answer_${q.metadata.correct_answer.toLowerCase()}`],
    );
    expect(q.context && q.anchor && q.sources.length).toBeTruthy();
    for (const a of mixed)
      expect(a.feedback).toBe(q.metadata[`feedback_${a.id.slice(-1)}`]);
    if (q.metadata.variant_of)
      expect(q.knowledgeId).toBe(
        horror.questions.find((a) => a.id === q.metadata.variant_of)
          ?.knowledgeId,
      );
  }
  const combined = [...existing, ...horror.questions];
  writeFileSync(
    "docs/importbericht-horror.json",
    JSON.stringify(
      {
        ...horror.report,
        knowledgeGoals: new Set(horror.questions.map((q) => q.knowledgeId))
          .size,
        variants: horror.questions.filter((q) => q.metadata.variant_of).length,
        topics: new Set(horror.questions.map((q) => q.topic)).size,
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
});

it("importiert Action vollständig ohne Konflikte und erhält Lösungen, Feedback und Varianten", () => {
  expect(action.report.accepted).toBe(180);
  expect(action.report.rejected).toBe(0);
  expect(action.report.duplicates).toBe(0);
  expect(action.report.warnings).toEqual([]);
  expect(new Set(action.questions.map((q) => q.knowledgeId)).size).toBe(150);
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
    "docs/importbericht-action.json",
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

it.each([1, 2])(
  "ergänzt neue Pakete bei %i vorhandenen Paketen transaktional ohne Fortschrittsverlust",
  async (packageCount) => {
    const state = emptyState(packageCount === 1 ? scifi.questions : existing);
    state.imports.push(scifi.report);
    if (packageCount === 2) state.imports.push(action.report);
    const previousQuestions = structuredClone(state.questions);
    const r = startRound(
      state,
      { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1000,
    );
    answer(state, r.id, r.questions[0].id, r.questions[0].correctId, 0, 2000);
    const before = JSON.stringify({
      rounds: state.rounds,
      events: state.events,
      learning: state.learning,
    });
    await update((s) => Object.assign(s, state));
    await Promise.all([
      update((s) => addPackages(s, contents)),
      update((s) => addPackages(s, contents)),
    ]);
    const saved = (await read())!;
    expect(saved.questions).toHaveLength(540);
    expect(saved.imports).toHaveLength(3);
    expect(new Set(saved.questions.map((q) => q.knowledgeId)).size).toBe(450);
    expect(saved.questions.slice(0, previousQuestions.length)).toEqual(
      previousQuestions,
    );
    expect(
      JSON.stringify({
        rounds: saved.rounds,
        events: saved.events,
        learning: saved.learning,
      }),
    ).toBe(before);
  },
);

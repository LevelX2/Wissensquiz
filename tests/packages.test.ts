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

it("ergänzt neue Pakete transaktional, ohne laufende Runden oder Lernfortschritt zu verändern", async () => {
  const state = emptyState(scifi.questions);
  state.imports.push(scifi.report);
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
  expect(saved.questions).toHaveLength(360);
  expect(saved.imports).toHaveLength(2);
  expect(new Set(saved.questions.map((q) => q.knowledgeId)).size).toBe(300);
  expect(
    JSON.stringify({
      rounds: saved.rounds,
      events: saved.events,
      learning: saved.learning,
    }),
  ).toBe(before);
});

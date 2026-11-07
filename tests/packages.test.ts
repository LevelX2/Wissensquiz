import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { packages, addPackages, readQuestions } from "../src/packages";
import { emptyState } from "../src/model";
import { questionSourceOf } from "../src/filters";
import { validateBackup } from "../src/backupValidation";
import { catalogCounts } from "./catalog-counts";

const inputs = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(p.path, "utf8"),
}));
const ordered = (state: ReturnType<typeof emptyState>) =>
  state.questions.slice().sort((a, b) => a.id.localeCompare(b.id, "en"));

it("liest den gesamten aktuellen Katalog aus fachlichen Beständen mit eindeutigen IDs", () => {
  const state = emptyState();
  addPackages(state, inputs);
  expect(state.questions).toHaveLength(catalogCounts.questions);
  expect(new Set(state.questions.map((q) => q.id)).size).toBe(
    catalogCounts.questions,
  );
  expect(new Set(state.questions.map((q) => q.knowledgeId)).size).toBe(
    catalogCounts.goals,
  );
  expect(
    state.imports.every(
      (r) => !r.rejected && !r.duplicates && !r.issues.length,
    ),
  ).toBe(true);
  expect(state.bundledQuestionIds).toHaveLength(catalogCounts.questions);
  for (const p of packages)
    expect(
      readQuestions(readFileSync(p.path, "utf8")).every(
        (q) => questionSourceOf(q) === p.source,
      ),
    ).toBe(true);
  expect(() => validateBackup(state)).not.toThrow();
});

it("liefert unabhängig von der Einlesereihenfolge exakt dieselben Fragen und Wissensziele", () => {
  const forward = emptyState(),
    backward = emptyState();
  addPackages(forward, inputs);
  addPackages(backward, [...inputs].reverse());
  expect(ordered(backward)).toEqual(ordered(forward));
});

it("liest aktuelle Quellen erneut ohne Duplikate und verändert keine Ereignisse oder Rundensnapshots", () => {
  const state = emptyState();
  addPackages(state, inputs);
  const before = structuredClone(state);
  addPackages(state, inputs);
  expect(state).toEqual(before);
});

it("verwirft falsche Bereichszuordnungen, doppelte IDs und defekte Varianten atomar", () => {
  const q = readQuestions(inputs[0].text)[0];
  for (const text of [
    JSON.stringify({
      ...q,
      metadata: { ...q.metadata, person_id: "falscher-bereich" },
    }),
    [q, q].map((q) => JSON.stringify(q)).join("\n"),
    JSON.stringify({ ...q, metadata: { ...q.metadata, variant_of: "fehlt" } }),
    JSON.stringify({ ...q, metadata: { ...q.metadata, variant_of: q.id } }),
  ]) {
    const state = emptyState(),
      before = structuredClone(state);
    expect(() =>
      addPackages(state, [{ filename: inputs[0].filename, text }]),
    ).toThrow();
    expect(state).toEqual(before);
  }
});

it("hält vorhandene Fragen mit gleicher ID unverändert", () => {
  const q = readQuestions(inputs[0].text)[0];
  const own = {
    ...q,
    question: "Bereits vorhandene Fassung",
    version: "eigene-version",
  };
  const state = emptyState([own]);
  addPackages(state, inputs);
  expect(state.questions.find((x) => x.id === q.id)).toEqual(own);
  expect(state.questions.filter((x) => x.id === q.id)).toHaveLength(1);
});

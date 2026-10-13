import { catalogCounts } from "./catalog-counts";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import Papa from "papaparse";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { importCsv } from "../src/importer";
import { withCategoryTags } from "../src/categories";
import {
  directorExplanation,
  prepareFactQuestion,
  questionSnapshotMatches,
} from "../src/filmFacts";
import { yearPresentation } from "../src/yearEditorial";
import manifest from "./fixtures/appliedEditorial.json";
import generated from "../src/reviewedFilmFacts.json";

it("integriert die geprüften Texte vollständig, ohne unbemerkt Fragen oder Varianten zu verlieren", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  expect(
    state.imports.every((r) => r.rejected === 0 && r.duplicates === 0),
  ).toBe(true);
  const byId = new Map(state.questions.map((q) => [q.id, q]));
  expect(byId.size).toBe(catalogCounts.questions);
  for (const entry of [
    ...manifest.changes.map((c) => ({ row: c.after, file: c.file })),
    ...manifest.additions,
  ]) {
    const q = byId.get(entry.row.question_id)!;
    expect(q, entry.row.question_id).toBeDefined();
    const target = byId.get(entry.row.variant_of);
    const parsed = importCsv(
      Papa.unparse([entry.row]),
      target ? [target] : [],
      entry.file,
    );
    expect(parsed.report.rejected, q.id).toBe(0);
    expect(q, q.id).toEqual(withCategoryTags(parsed.questions[0]));
  }
  for (const entry of manifest.replacements) {
    expect(byId.has(entry.id), entry.id).toBe(false);
    expect(byId.get(entry.replacementId)?.knowledgeId).toBe(
      entry.replacementKnowledgeId,
    );
    expect(entry.replacementKnowledgeId).not.toBe(entry.knowledgeId);
  }
  for (const [id, revision] of Object.entries(generated)) {
    const q = byId.get(id)!;
    expect(q, id).toMatchObject(revision);
    expect(
      yearPresentation(q)?.text ?? directorExplanation(q)?.text ?? q.context,
      id,
    ).toBe(revision.context);
    const frozen = structuredClone(q);
    const prepared = prepareFactQuestion(q, undefined, () => 0.3);
    expect(questionSnapshotMatches(q, prepared), id).toBe(true);
    expect(q, id).toEqual(frozen);
    expect(
      prepared.answers.find((a) => a.id === prepared.correctId)?.text,
    ).toBe(q.answers.find((a) => a.id === q.correctId)?.text);
  }
  // The deferred Airplane variant keeps its previous learning goal and text.
  const deferred = byId.get("KOM-M-010-V1")!;
  expect(deferred.knowledgeId).toBe("K-KOM-05-04");
  expect(deferred.metadata.variant_of).toBe("");
  expect(deferred.question).toContain("beruflichen Funktion");
});

it("prüft den erwarteten Redaktionsumfang und lässt die offene Stativszene aus", () => {
  expect(manifest.appliedOriginalIds).toBe(999);
  expect(manifest.generated).toHaveLength(78);
  expect(manifest.additions).toHaveLength(14);
  expect(manifest.changes.some((c) => c.id === manifest.excluded[0].id)).toBe(
    false,
  );
});

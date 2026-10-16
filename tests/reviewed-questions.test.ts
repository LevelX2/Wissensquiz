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
  expect(manifest.appliedOriginalIds).toBe(3600);
  expect(manifest.generated).toHaveLength(265);
  expect(manifest.additions).toHaveLength(14);
  expect(manifest.changes.some((c) => c.id === manifest.excluded[0].id)).toBe(
    false,
  );
});

it("verknüpft die neue Rabal-Frage bereichsübergreifend und entfernt die überholte Brückenvariante", () => {
  const state = emptyState();
  addPackages(state, packages.map(p => ({filename:p.filename,text:readFileSync(`public${p.path}`,"utf8")})));
  const byId = new Map(state.questions.map(q => [q.id,q]));
  const variant = state.questions.find(q => q.metadata.variant_of === "SCHAUSPIELER-BG-20261013-123-E1")!;
  expect(variant).toBeDefined();
  expect(variant.knowledgeId).toBe(byId.get("SCHAUSPIELER-BG-20261013-123-E1")?.knowledgeId);
  for (const removed of manifest.removals) {
    expect(byId.has(removed.id)).toBe(false);
    expect(byId.has(removed.replacementId)).toBe(true);
  }
  expect(state.questions.filter(q => q.id.startsWith("Q-20261015-"))).toHaveLength(109);
});

it("verknüpft Chaplins 1942-Fassung und erhält beide verwendeten Wolfsblut-Kompositionen", () => {
  const state = emptyState();
  addPackages(state, packages.map(p => ({filename:p.filename,text:readFileSync(`public${p.path}`,"utf8")})));
  const chaplin = state.questions.find(q => q.metadata.variant_of === "SCHAUSPIELER-BG-20261013-009-E1")!;
  const actor = state.questions.find(q => q.id === "SCHAUSPIELER-BG-20261013-009-E1")!;
  expect(chaplin).toBeDefined();
  expect(chaplin.knowledgeId).toBe(actor.knowledgeId);
  expect(chaplin.question).toContain("1942");
  const whiteFang = state.questions.find(q => q.id.startsWith("Q-20261016-ABENTEUER-") && q.question.includes("Filmmusik von „Wolfsblut“"))!;
  expect(whiteFang).toBeDefined();
  expect(whiteFang.answers.find(a => a.id === whiteFang.correctId)?.text).toBe("Basil Poledouris und Hans Zimmer");
  expect(whiteFang.context).toContain("viel von beiden");
  expect(state.questions.filter(q => ["FANTASY", "HORROR", "KOMOEDIE", "ABENTEUER"].some(genre => q.id.startsWith(`Q-20261016-${genre}-`)))).toHaveLength(292);
});

it("trennt Stanwycks Figurentyp vom Trennungsgrund und übernimmt die Rom-Com-Regie ohne falsche Darstellerzusätze", () => {
  const state = emptyState();
  addPackages(state, packages.map(p => ({filename:p.filename,text:readFileSync(`public${p.path}`,"utf8")})));
  const get = (id: string) => state.questions.find(q => q.id === id)!;
  const actor = get("E20261007-P-018-M2");
  const breakup = get("F240-20261006-169-M1");
  expect(actor.knowledgeId).toBe("K-E20261007-P-018-M2");
  expect(actor.knowledgeId).not.toBe(breakup.knowledgeId);
  expect(actor.metadata.variant_of).toBe("");
  expect(actor.question).toContain("Figurentyp");
  expect(breakup.question).toContain("Charles");
  for (const [title, director] of [["The Philadelphia Story", "George Cukor"], ["What's Up, Doc?", "Howard Hawks"]]) {
    const questions = state.questions.filter(q => q.metadata.film_title_original === title);
    expect(questions.length).toBeGreaterThan(0);
    const contexts = questions.map(q => q.context).join(" ");
    expect(contexts).toContain(director);
    expect(contexts).not.toMatch(/George \(John Howard\) Cukor|Howard \(Ryan O’Neal\) Hawks/);
  }
  const original = manifest.replacements.find(q => q.id === "ROM-L-044")!;
  const variant = manifest.replacements.find(q => q.id === "ROM-L-044-V1")!;
  expect(get(original.replacementId).knowledgeId).not.toBe(get(variant.replacementId).knowledgeId);
  expect(get(original.replacementId).tags).toContain("Classics");
  expect(get(variant.replacementId).tags).toContain("Classics");
});

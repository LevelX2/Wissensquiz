import { catalogCounts } from "./catalog-counts";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";

import {
  directorExplanation,
  prepareFactQuestion,
  questionSnapshotMatches,
} from "../src/filmFacts";
import { yearPresentation } from "../src/yearEditorial";
const currentState = emptyState();
addPackages(
  currentState,
  packages.map((p) => ({
    filename: p.filename,
    text: readFileSync(p.path, "utf8"),
  })),
);
const byCurrentId = (id: string) =>
  currentState.questions.find((q) => q.id === id)!;
import generated from "../src/reviewedFilmFacts.json";

it("integriert die geprüften Texte vollständig, ohne unbemerkt Fragen oder Varianten zu verlieren", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`${p.path}`, "utf8"),
    })),
  );
  expect(
    state.imports.every((r) => r.rejected === 0 && r.duplicates === 0),
  ).toBe(true);
  const byId = new Map(state.questions.map((q) => [q.id, q]));
  expect(byId.size).toBe(catalogCounts.questions);
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

it("erklärt Jansen konkret ohne unbelegte Stativbehauptung", () => {
  const jansen = {
    after: byCurrentId("G100-20261008-THRILLER-025-M1").metadata,
  };
  expect(jansen.after.explanation_context).not.toContain("Stativ");
  expect(jansen.after.explanation_context).toContain("Selbstachtung");
  expect(jansen.after.source_urls).toContain("criterion.com/current/posts/303");
});

it("verknüpft die neue Rabal-Frage bereichsübergreifend und entfernt die überholte Brückenvariante", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`${p.path}`, "utf8"),
    })),
  );
  const byId = new Map(state.questions.map((q) => [q.id, q]));
  const variant = state.questions.find(
    (q) => q.metadata.variant_of === "SCHAUSPIELER-BG-20261013-123-E1",
  )!;
  expect(variant).toBeDefined();
  expect(variant.knowledgeId).toBe(
    byId.get("SCHAUSPIELER-BG-20261013-123-E1")?.knowledgeId,
  );
});

it("trennt Persephones Hilfe und Trinitys Rückkehr in Reloaded als unterschiedliche Lernziele", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`${p.path}`, "utf8"),
    })),
  );
  const questions = ["Q-20261016-SCIFI-087", "Q-20261016-SCIFI-088"].map((id) =>
    state.questions.find((q) => q.id === id)!,
  );
  expect(questions[0].question).not.toContain("Persephone");
  expect(
    questions[0].answers.find((a) => a.id === questions[0].correctId)?.text,
  ).toContain("Persephone");
  expect(questions[1].question).toContain("Trinity");
  expect(questions[0].knowledgeId).not.toBe(questions[1].knowledgeId);
  for (const q of questions) expect(q.metadata.variant_of).toBe("");
});

it("verknüpft Chaplins 1942-Fassung und erhält beide verwendeten Wolfsblut-Kompositionen", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`${p.path}`, "utf8"),
    })),
  );
  const chaplin = state.questions.find(
    (q) => q.metadata.variant_of === "SCHAUSPIELER-BG-20261013-009-E1",
  )!;
  const actor = state.questions.find(
    (q) => q.id === "SCHAUSPIELER-BG-20261013-009-E1",
  )!;
  expect(chaplin).toBeDefined();
  expect(chaplin.knowledgeId).toBe(actor.knowledgeId);
  expect(chaplin.question).toContain("1942");
  const whiteFang = state.questions.find(
    (q) =>
      q.id.startsWith("Q-20261016-ABENTEUER-") &&
      q.question.includes("Filmmusik von „Wolfsblut“"),
  )!;
  expect(whiteFang).toBeDefined();
  expect(
    whiteFang.answers.find((a) => a.id === whiteFang.correctId)?.text,
  ).toBe("Basil Poledouris und Hans Zimmer");
  expect(whiteFang.context).toContain("viel von beiden");
  expect(
    state.questions.filter((q) =>
      ["FANTASY", "HORROR", "KOMOEDIE", "ABENTEUER"].some((genre) =>
        q.id.startsWith(`Q-20261016-${genre}-`),
      ),
    ),
  ).toHaveLength(292);
});

it("trennt Stanwycks Figurentyp vom Trennungsgrund und übernimmt die Rom-Com-Regie ohne falsche Darstellerzusätze", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`${p.path}`, "utf8"),
    })),
  );
  const get = (id: string) => state.questions.find((q) => q.id === id)!;
  const actor = get("E20261007-P-018-M2");
  const breakup = get("F240-20261006-169-M1");
  expect(actor.knowledgeId).toBe("K-E20261007-P-018-M2");
  expect(actor.knowledgeId).not.toBe(breakup.knowledgeId);
  expect(actor.metadata.variant_of).toBe("");
  expect(actor.question).toContain("Figurentyp");
  expect(breakup.question).toContain("Charles");
  for (const [title, director] of [
    ["The Philadelphia Story", "George Cukor"],
    ["What's Up, Doc?", "Howard Hawks"],
  ]) {
    const questions = state.questions.filter(
      (q) => q.metadata.film_title_original === title,
    );
    expect(questions.length).toBeGreaterThan(0);
    const contexts = questions.map((q) => q.context).join(" ");
    expect(contexts).toContain(director);
    expect(contexts).not.toMatch(
      /George \(John Howard\) Cukor|Howard \(Ryan O’Neal\) Hawks/,
    );
  }
  const original = { replacementId: "Q-20261016-ROMCOM-017" };
  const variant = { replacementId: "Q-20261016-ROMCOM-018" };
  expect(get(original.replacementId).knowledgeId).not.toBe(
    get(variant.replacementId).knowledgeId,
  );
  expect(get(original.replacementId).tags).toContain("Classics");
  expect(get(variant.replacementId).tags).toContain("Classics");
});

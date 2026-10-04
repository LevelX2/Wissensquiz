import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { actorPresentation, presentedQuestion } from "../src/actorEditorial";
import { questionTitleParts } from "../src/questionTitle";
import revision from "../docs/Bestandsredaktion-2026-10-04/Block-01.json";
import { assertEditorialSource } from "./editorialSource";

it("zeigt alle 21 redigierten Fragen mit erhaltenen Wissenszielen und wirksamen Darstellertexten", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  expect(state.questions).toHaveLength(6277);
  expect(new Set(state.questions.map((q) => q.knowledgeId)).size).toBe(5734);
  for (const entry of revision.changes) {
    const q = state.questions.find((q) => q.id === entry.id)!;
    expect(q.knowledgeId, q.id).toBe(entry.knowledgeId);
    if (entry.kind === "actor_presentation") {
      expect(questionTitleParts(q), q.id).toBeNull();
      expect(actorPresentation(q), q.id).toEqual(entry.after);
      expect(presentedQuestion(q), q.id).toBe(entry.after.question);
    } else {
      expect(q.question, q.id).toBe(entry.after.question);
      expect(q.context, q.id).toBe(entry.after.explanation_context);
      expect(q.metadata.variant_of, q.id).toBe(entry.before.variant_of);
    }
  }
});

it("erlaubt in den öffentlichen CSVs genau die dokumentierten Zeilenänderungen", () => {
  let changed = 0;
  for (const pkg of packages.filter(
    (p) => !/Ergaenzung_P0[23]_/.test(p.filename),
  )) {
    changed += assertEditorialSource(
      readFileSync(`public${pkg.path}`, "utf8"),
      readFileSync(
        `KI-Wissen-Wissensquiz/01 Rohquellen/${pkg.filename}`,
        "utf8",
      ),
      `public${pkg.path}`,
    ).changes.length;
  }
  expect(changed).toBe(20); // 17 in this block and three previously published corrections.
});

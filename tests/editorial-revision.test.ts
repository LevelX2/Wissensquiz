import { catalogCounts } from "./catalog-counts";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { addPackages, packages } from "../src/packages";
import { emptyState } from "../src/model";
import { actorPresentation, presentedQuestion } from "../src/actorEditorial";
import { questionTitleParts } from "../src/questionTitle";
import revision from "../docs/Bestandsredaktion-2026-10-04/Block-01.json";
import {
  assertEditorialSource,
  editorialCsvIds,
  editorialRevisions,
  latestCsvRevision,
  currentQuestionId,
  latestActorRevision,
} from "./editorialSource";

it("zeigt alle 21 redigierten Fragen mit erhaltenen Wissenszielen und wirksamen Darstellertexten", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  expect(state.questions).toHaveLength(catalogCounts.questions);
  expect(new Set(state.questions.map((q) => q.knowledgeId)).size).toBe(
    catalogCounts.goals,
  );
  for (const entry of revision.changes) {
    const q = state.questions.find(
      (q) => q.id === currentQuestionId(entry.id),
    )!;
    expect(q, entry.id).toBeDefined();
    if (entry.kind === "actor_presentation") {
      expect(q.knowledgeId, q.id).toBe(entry.knowledgeId);
      expect(questionTitleParts(q), q.id).toBeNull();
      const current = latestActorRevision(q.id);
      expect(actorPresentation(q)?.text, q.id).toBe(
        current?.context ?? entry.after.text,
      );
      expect(presentedQuestion(q), q.id).toBe(
        current?.question ?? entry.after.question,
      );
    } else {
      const latest = latestCsvRevision(entry.file, entry.id)!;
      expect(q.knowledgeId, q.id).toBe(latest.after.knowledge_id);
      expect(q.question, q.id).toBe(latest.after.question);
      expect(q.context, q.id).toBe(latest.after.explanation_context);
      expect(q.metadata.variant_of, q.id).toBe(latest.after.variant_of);
    }
  }
});

it("erlaubt in den öffentlichen CSVs genau die dokumentierten Zeilenänderungen", () => {
  let changed = 0;
  // P02/P03 have immutable native JSON, verified in actor-supplements.test.ts.
  const csvSources = packages.filter(
    (p) => !/Ergaenzung_P0[23]_/.test(p.filename),
  );
  for (const pkg of csvSources) {
    changed += assertEditorialSource(
      readFileSync(`public${pkg.path}`, "utf8"),
      readFileSync(
        pkg.filename.startsWith("Schauspieler-Bekanntheit-")
          ? "docs/Schauspieler-Bekanntheit-2026-10-13/Fragen.csv"
          : pkg.filename === "Filmfragen_240_Filme_1920_Fragen.csv"
            ? `docs/Filmfragen-Ergaenzung-2026-10-06/${pkg.filename}`
            : `KI-Wissen-Wissensquiz/01 Rohquellen/${pkg.filename}`,
        "utf8",
      ),
      `public${pkg.path}`,
    ).changes.length;
  }
  expect(changed).toBe(
    csvSources.reduce(
      (n, p) => n + editorialCsvIds(`public${p.path}`).length,
      0,
    ),
  );
});

it("zeigt alle registrierten Personenredaktionen und erhält ihre ursprünglichen Schutzschlüssel", () => {
  const state = emptyState();
  addPackages(
    state,
    packages.map((p) => ({
      filename: p.filename,
      text: readFileSync(`public${p.path}`, "utf8"),
    })),
  );
  const changes = editorialRevisions
    .flatMap((block) => block.changes)
    .filter((c) => c.kind === "actor_presentation");
  for (const c of changes) {
    const q = state.questions.find((q) => q.id === c.id)!;
    expect(q.knowledgeId, c.id).toBe(c.knowledgeId);
    const current = latestActorRevision(q.id);
    expect(actorPresentation(q)?.text, c.id).toBe(
      current?.context ?? c.after.text,
    );
    expect(actorPresentation(q)?.originalQuestion, c.id).toBe(q.question);
    expect(actorPresentation(q)?.originalContext, c.id).toBe(q.context);
    expect(q.question, c.id).toBe(c.before.originalQuestion);
    expect(q.context, c.id).toBe(c.before.originalContext);
    expect(c.after.originalQuestion, c.id).toBe(c.before.originalQuestion);
    expect(c.after.originalContext, c.id).toBe(c.before.originalContext);
  }
});

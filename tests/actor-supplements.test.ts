import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { packages, addPackages } from "../src/packages";
import { emptyState } from "../src/model";
import { actorPresentation } from "../src/actorEditorial";
import { filmData } from "../src/filmFacts";
import { validateBackup } from "../src/backupValidation";
import { startRound, answer } from "../src/engine";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
import revision from "../docs/Bestandsredaktion-2026-10-04/Block-01.json";

const contents = packages.map((p) => ({
  filename: p.filename,
  text: readFileSync(`public${p.path}`, "utf8"),
}));
const base = emptyState();
addPackages(
  base,
  contents.filter((p) => !p.filename.includes("Ergaenzung_P0")),
);
for (const [code, file, count] of [
  ["P02", "Schauspieler_25_Personen_200_Fragen.json", 200],
  ["P03", "Schauspieler_50_Personen_400_Fragen.json", 400],
] as const) {
  it(`übernimmt ${code} vollständig, verknüpft vorhandene Ziele und zeigt Filmbezüge erst zur Lösung`, () => {
    const source = JSON.parse(
      readFileSync(`docs/Schauspieler-Ergaenzung-${code}/${file}`, "utf8"),
    );
    const state = structuredClone(base);
    const original = structuredClone(state.questions);
    const content = contents.find((p) =>
      p.filename.includes(`Ergaenzung_${code}`),
    )!;
    addPackages(state, [content]);
    addPackages(state, [content]);
    expect(state.questions.slice(0, original.length)).toEqual(original);
    const added = state.questions.slice(original.length);
    expect(added).toHaveLength(count);
    expect(new Set(added.map((q) => q.metadata.person_id)).size).toBe(
      count / 8,
    );
    for (const row of source.questions) {
      const q = added.find((q) => q.id === row.question_id)!;
      expect(q.question).toBe(row.question);
      expect(q.context).toBe(row.additional_info);
      expect(q.sources).toEqual(row.source_urls);
      expect(q.answers.find((a) => a.id === q.correctId)?.text).toBe(
        row.answers.find((a: { id: string }) => a.id === row.correct_answer)
          .text,
      );
      expect(q.knowledgeId).toBe(row.knowledge_id);
      if (row.variant_of)
        expect(q.knowledgeId).toBe(
          original.find((q) => q.id === row.variant_of)!.knowledgeId,
        );
      const display = actorPresentation(q)!;
      expect(display.films).toEqual(row.film_refs);
      const edited = revision.changes.find((entry) => entry.id === q.id);
      if (edited) expect(display).toEqual(edited.after);
      else expect(display.text).toBe(row.additional_info);
      if (row.actor_name_before_answer)
        expect(display.question).toContain(q.metadata.person_name);
      else expect(display.question).not.toContain(q.metadata.person_name);
      expect(filmData(q)).toBeUndefined();
      for (const ref of display.films) expect(filmData(q, ref)).toBeDefined();
    }
  });
}
it("bewahrt alte Ereignisse und Lernstände bei beiden Ergänzungen und sichert den vollständigen Personenbestand", async () => {
  const s = structuredClone(base),
    at = Date.parse("2026-10-03T10:00:00Z");
  const round = startRound(
    s,
    { mode: "ueben", topic: "Schauspieler", difficulty: "leicht" },
    at,
  );
  answer(
    s,
    round.id,
    round.questions[0].id,
    round.questions[0].correctId,
    1000,
    at + 1000,
  );
  const before = structuredClone({
    rounds: s.rounds,
    events: s.events,
    learning: s.learning,
  });
  addPackages(s, contents);
  expect({ rounds: s.rounds, events: s.events, learning: s.learning }).toEqual(
    before,
  );
  expect(s.questions).toHaveLength(6277);
  expect(new Set(s.questions.map((q) => q.knowledgeId)).size).toBe(5734);
  expect(s.questions.filter((q) => q.metadata.person_id)).toHaveLength(1400);
  expect(s.bundledQuestionIds).toHaveLength(6277);
  expect(validateBackup(s).questions).toHaveLength(6277);
  expect(await decodeCloudState(await encodeCloudState(s))).toEqual(
    validateBackup(s),
  );
});

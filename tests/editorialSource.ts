import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import index from "../docs/Bestandsredaktion-2026-10-04/Index.json";
import published from "../docs/Bestandsredaktion-2026-10-04/Veroeffentlichte-Korrekturen.json";
import integrated from "../docs/Redaktionslauf-2026-10-10/Integration.json";

type Row = Record<string, string>;
export type EditorialChange = {
  kind: string;
  file: string;
  id: string;
  knowledgeId: string;
  before: Row;
  after: Row;
  checkedSources?: { url: string; supports: string }[];
};
export const editorialRevisions = index.blocks.map(
  (file) =>
    JSON.parse(
      readFileSync(`docs/Bestandsredaktion-2026-10-04/${file}`, "utf8"),
    ) as { changes: EditorialChange[] },
);
const csvChanges = [
  ...published.changes.map((entry) => ({ ...entry, kind: "csv" })),
  ...editorialRevisions.flatMap((block) => block.changes),
].filter((entry) => entry.kind === "csv");
const allCsvChanges = [...csvChanges, ...integrated.changes];
export const currentQuestionId = (id: string) => integrated.replacements.find(r=>r.id===id)?.replacementId ?? id;
export const originalQuestionId = (id: string) => integrated.replacements.find(r=>r.replacementId===id)?.id ?? id;
export function catalogBeforeReview(file: string, text: string) {
  const parsed = Papa.parse<Row>(text,{header:true,skipEmptyLines:"greedy"});
  const added=new Set(integrated.additions.filter(a=>a.file===file).map(a=>a.row.question_id));
  const changes=new Map(integrated.changes.filter(c=>c.file===file).map(c=>[c.after.question_id,c.before]));
  return Papa.unparse({fields:parsed.meta.fields!,data:parsed.data.filter(r=>!added.has(r.question_id)).map(r=>changes.get(r.question_id)??r)});
}
export const editorialCsvIds = (file?: string) => [
  ...new Set(
    allCsvChanges
      .filter((entry) => !file || entry.file === file)
      .map((entry) => entry.id),
  ),
];
export const latestCsvRevision = (
  file: string,
  id: string,
): EditorialChange | undefined =>
  allCsvChanges.filter((entry) => entry.file === file && entry.id === id).at(-1);

// Verify editorial exceptions against their complete documented rows. All other
// rows, their order and the CSV header must still match the preserved source.
export function assertEditorialSource(
  app: string,
  raw: string,
  publicPath: string,
) {
  const parse = (text: string) => {
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    assert.deepEqual(result.errors, [], publicPath);
    return result;
  };
  const original = parse(raw);
  const edited = parse(app);
  assert.deepEqual(edited.meta.fields, original.meta.fields, publicPath);
  const additions = integrated.additions.filter((entry) => entry.file === publicPath);
  assert.equal(edited.data.length, original.data.length + additions.length, publicPath);
  const changes: string[] = [];
  for (const [index, row] of edited.data.slice(0, original.data.length).entries()) {
    const before = original.data[index];
    const id = row.question_id;
    let expected = before;
    const proofs = csvChanges.filter(
      (entry) => entry.file === publicPath && entry.id === before.question_id,
    );
    for (const proof of proofs) {
      assert.deepEqual(
        expected,
        proof.before,
        `${id}: lückenlose Redaktionskette`,
      );
      expected = proof.after;
    }
    const current = integrated.changes.find(
      (entry) => entry.file === publicPath && entry.id === before.question_id,
    );
    if (current) {
      assert.deepEqual(expected, current.before, `${id}: geprüfter Integrationsausgang`);
      expected = current.after;
      if (id !== before.question_id) {
        assert(integrated.replacements.some((r) => r.id === before.question_id && r.replacementId === id && r.replacementKnowledgeId === row.knowledge_id), `${id}: ausdrücklicher Zielwechsel`);
      } else {
        assert.equal(row.knowledge_id, before.knowledge_id, `${id}: stabiles Lernziel`);
      }
    }
    assert.deepEqual(row, expected, `${id}: dokumentierter Endstand`);
    if (proofs.length || current) changes.push(before.question_id);
  }
  assert.deepEqual(edited.data.slice(original.data.length), additions.map((entry) => entry.row), `${publicPath}: geprüfte Ergänzungen`);
  return { questions: edited.data.length, changes };
}

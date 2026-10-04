import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import index from "../docs/Bestandsredaktion-2026-10-04/Index.json";
import published from "../docs/Bestandsredaktion-2026-10-04/Veroeffentlichte-Korrekturen.json";

type Row = Record<string, string>;
export type EditorialChange = {
  kind: string;
  file: string;
  id: string;
  knowledgeId: string;
  before: Row;
  after: Row;
  checkedSources: { url: string; supports: string }[];
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
export const editorialCsvIds = (file?: string) => [
  ...new Set(
    csvChanges
      .filter((entry) => !file || entry.file === file)
      .map((entry) => entry.id),
  ),
];
export const latestCsvRevision = (file: string, id: string) =>
  csvChanges.filter((entry) => entry.file === file && entry.id === id).at(-1);

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
  assert.equal(edited.data.length, original.data.length, publicPath);
  const changes: string[] = [];
  for (const [index, row] of edited.data.entries()) {
    const before = original.data[index];
    const id = row.question_id;
    assert.equal(id, before.question_id, publicPath);
    assert.equal(row.knowledge_id, before.knowledge_id, id);
    assert.equal(row.variant_of, before.variant_of, id);
    let expected = before;
    const proofs = csvChanges.filter(
      (entry) => entry.file === publicPath && entry.id === id,
    );
    for (const proof of proofs) {
      assert.deepEqual(
        expected,
        proof.before,
        `${id}: lückenlose Redaktionskette`,
      );
      expected = proof.after;
    }
    assert.deepEqual(row, expected, `${id}: dokumentierter Endstand`);
    if (proofs.length) changes.push(id);
  }
  return { questions: edited.data.length, changes };
}

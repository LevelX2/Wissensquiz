import { strict as assert } from "node:assert";
import Papa from "papaparse";
import revision from "../docs/Bestandsredaktion-2026-10-04/Block-01.json";
import published from "../docs/Bestandsredaktion-2026-10-04/Veroeffentlichte-Korrekturen.json";

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
    const proof = revision.changes.find(
      (entry) =>
        entry.kind === "csv" && entry.file === publicPath && entry.id === id,
    );
    if (proof) {
      assert.deepEqual(before, proof.before, `${id}: Rohquelle`);
      assert.deepEqual(row, proof.after, `${id}: freigegebene Redaktion`);
      changes.push(id);
    } else if (
      published.changes.some(
        (entry) => entry.file === publicPath && entry.id === id,
      )
    ) {
      const previous = published.changes.find(
        (entry) => entry.file === publicPath && entry.id === id,
      )!;
      assert.deepEqual(before, previous.before, `${id}: frühere Rohquelle`);
      assert.deepEqual(row, previous.after, `${id}: veröffentlichte Korrektur`);
      changes.push(id);
    } else {
      assert.deepEqual(row, before, `${id}: nicht beauftragte Abweichung`);
    }
  }
  return { questions: edited.data.length, changes };
}

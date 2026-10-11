import type { Question, State } from "./model";
import { validateBackup } from "./backupValidation";
import { encodeQuestionCatalog, decodeQuestionCatalog } from "./catalogCodec";
import { questionSchema } from "./questionSchema";

export const SYNC_PROTOCOL = 1;
export const SYNC_FORMAT = "quiz-entry-sync-v1";
export type ObjectEncoding = "questions-field-refs-v1" | "json-v1";
export type SyncObject = {
  hash: string;
  encoding: ObjectEncoding;
  text: string;
};
export type QuestionRef = { object: string };
export type RowKind = "field" | "round" | "event" | "learning" | "record";
export type SyncRow = {
  kind: RowKind;
  id: string;
  position: number;
  value: unknown;
};
export type RowChange =
  { op: "put"; row: SyncRow } | { op: "delete"; kind: RowKind; id: string };
export type SyncDocument = {
  rows: Map<string, SyncRow>;
  objects: Map<string, SyncObject>;
};
export type SyncDelta = { objects: SyncObject[]; changes: RowChange[] };
export type SyncPacket = SyncDelta & {
  format: typeof SYNC_FORMAT;
  protocol: 1;
  id: string;
  generation: string;
  expectedRevision: number;
  owner: string;
};
const MAX_OBJECT_BYTES = 64 * 1024 * 1024;
export const rowKey = (kind: RowKind, id: string) => `${kind}:${id}`;
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
// Compare JSON values without sorting keys and allocating serialized copies of
// every historical entry on each answer. Optional undefined object fields are
// omitted, just as in the canonical packet representation.
export function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (a[i] !== b[i] && !jsonEqual(a[i], b[i])) return false;
    return true;
  }
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>;
  const keys = Object.keys(left),
    otherKeys = Object.keys(right);
  let count = keys.length,
    otherCount = otherKeys.length;
  for (const key of keys) {
    if (left[key] === undefined) {
      count--;
      continue;
    }
    if (
      !Object.hasOwn(right, key) ||
      (left[key] !== right[key] && !jsonEqual(left[key], right[key]))
    )
      return false;
  }
  for (const key of otherKeys) if (right[key] === undefined) otherCount--;
  return count === otherCount;
}
const objectIndices = new WeakMap<
  Map<string, SyncObject>,
  Map<string, string>
>();
export async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength > MAX_OBJECT_BYTES)
    throw new Error("Das Sicherungsobjekt ist zu groß.");
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export const objectProof = (encoding: ObjectEncoding, text: string) =>
  JSON.stringify(["quiz-object-v1", encoding, text]);
export async function verifyObject(object: SyncObject) {
  if (
    !["questions-field-refs-v1", "json-v1"].includes(object.encoding) ||
    (await sha256(objectProof(object.encoding, object.text))) !== object.hash
  )
    throw new Error("Ein privater Inhaltsnachweis ist ungültig.");
}
const scoreFields = (q: Question) => ({
  id: q.id,
  version: q.version,
  correctId: q.correctId,
  domain: q.domain,
  difficulty: q.difficulty,
  metadata:
    q.metadata.subdomain === undefined
      ? {}
      : { subdomain: q.metadata.subdomain },
});

// Persist current settings and private round snapshots; never a full catalog.
export async function compileState(
  state: State,
  previous?: SyncDocument,
  roundSnapshotsUnchanged = false,
): Promise<SyncDocument> {
  const rows = new Map<string, SyncRow>(),
    objects = new Map(previous?.objects);
  const cachedIndex = previous && objectIndices.get(previous.objects);
  const byText = new Map(
    cachedIndex ??
      [...objects.values()].map((o) => [
        objectProof(o.encoding, o.text),
        o.hash,
      ]),
  );
  const row = (kind: RowKind, id: string, position: number, value: unknown) =>
    rows.set(rowKey(kind, id), { kind, id, position, value });
  async function object(encoding: ObjectEncoding, text: string) {
    const proof = objectProof(encoding, text);
    const hash = byText.get(proof) ?? (await sha256(proof));
    objects.set(hash, { hash, encoding, text });
    byText.set(proof, hash);
    return hash;
  }
  async function ref(q: Question): Promise<QuestionRef> {
    // Runtime snapshots can append generated fields in another property order.
    // Use the same schema normalization as release preparation/reconstruction
    // before hashing, while preserving all original metadata and answer order.
    q = questionSchema.parse(q);
    return {
      object: await object(
        "questions-field-refs-v1",
        encodeQuestionCatalog([q]),
      ),
    };
  }
  row("field", "catalog", 0, { source: "server", parts: [] });
  for (const [id, value] of Object.entries(state))
    if (
      ![
        "questions",
        "rounds",
        "events",
        "learning",
        "records",
        "bundledQuestionIds",
      ].includes(id)
    )
      row("field", id, 0, value);
  for (let position = 0; position < state.rounds.length; position++) {
    const { questions, before, archive, ...header } = state.rounds[position];
    if (archive) {
      row("round", header.id, position, {
        ...header,
        archive: { version: 1 },
        questions: archive.questions,
        beforeObject: await object("json-v1", "{}"),
      });
      continue;
    }
    const old = previous?.rows.get(rowKey("round", header.id))?.value as
      { questions: unknown[]; beforeObject: string } | undefined;
    if (
      old &&
      roundSnapshotsUnchanged &&
      old.questions.length === questions.length
    ) {
      row("round", header.id, position, {
        ...header,
        questions: old.questions,
        beforeObject: old.beforeObject,
      });
      continue;
    }
    const refs = [];
    for (const q of questions)
      refs.push({ ...scoreFields(q), ref: await ref(q) });
    row("round", header.id, position, {
      ...header,
      questions: refs,
      beforeObject: await object("json-v1", JSON.stringify(before)),
    });
  }
  state.events.forEach((event, position) =>
    row("event", event.id, position, event),
  );
  for (const kind of ["learning", "records"] as const)
    Object.entries(state[kind]).forEach(([id, value], position) =>
      row(kind === "records" ? "record" : kind, id, position, value),
    );
  objectIndices.set(objects, byText);
  return { rows, objects };
}
export function difference(
  before: SyncDocument | undefined,
  after: SyncDocument,
): SyncDelta {
  const changes: RowChange[] = [];
  for (const [key, row] of after.rows)
    if (!jsonEqual(before?.rows.get(key), row))
      changes.push({ op: "put", row });
  for (const [key, row] of before?.rows ?? [])
    if (!after.rows.has(key))
      changes.push({ op: "delete", kind: row.kind, id: row.id });
  return {
    objects: [...after.objects.values()].filter(
      (o) => !before?.objects.has(o.hash),
    ),
    changes,
  };
}
export function applyDifference(
  document: SyncDocument,
  delta: SyncDelta,
): SyncDocument {
  const result = {
    rows: new Map(document.rows),
    objects: new Map(document.objects),
  };
  for (const object of delta.objects) {
    if (
      result.objects.has(object.hash) &&
      !jsonEqual(result.objects.get(object.hash), object)
    )
      throw new Error("Ein unveränderliches Objekt wurde ersetzt.");
    result.objects.set(object.hash, object);
  }
  for (const change of delta.changes)
    if (change.op === "put")
      result.rows.set(rowKey(change.row.kind, change.row.id), change.row);
    else result.rows.delete(rowKey(change.kind, change.id));
  return result;
}
export function reconstructState(document: SyncDocument): State {
  function object(hash: string, encoding: ObjectEncoding) {
    const value = document.objects.get(hash);
    if (!value || value.encoding !== encoding)
      throw new Error("Ein referenzierter privater Inhalt fehlt.");
    return value.text;
  }
  function question(ref: QuestionRef) {
    if (!ref || Object.keys(ref).length !== 1 || typeof ref.object !== "string")
      throw new Error("Ungültiger Fragenverweis.");
    const questions = decodeQuestionCatalog(
      object(ref.object, "questions-field-refs-v1"),
    );
    if (questions.length !== 1) throw new Error("Ungültiger Fragenverweis.");
    return questions[0];
  }
  const ordered = (kind: RowKind) =>
    [...document.rows.values()]
      .filter((r) => r.kind === kind)
      .sort((a, b) => a.position - b.position);
  const fields = Object.fromEntries(
    ordered("field").map((r) => [r.id, r.value]),
  );
  if (!jsonEqual(fields.catalog, { source: "server", parts: [] }))
    throw new Error("Ungültiges Online-Speicherformat.");
  const rounds = ordered("round").map((row) => {
    const value = row.value as Record<string, unknown> & {
      questions: (ReturnType<typeof scoreFields> & { ref: QuestionRef })[];
      beforeObject: string;
    };
    const { beforeObject, questions: refs, ...header } = value;
    if (row.id !== header.id) throw new Error("Rundenidentität passt nicht.");
    if (header.archive)
      return {
        ...header,
        archive: { version: 1, questions: refs },
        questions: [],
        before: JSON.parse(object(beforeObject, "json-v1")),
      };
    return {
      ...header,
      before: JSON.parse(object(beforeObject, "json-v1")),
      questions: refs.map((item) => {
        const q = question(item.ref);
        const { ref: _, ...score } = item;
        if (!jsonEqual(scoreFields(q), score))
          throw new Error("Ergebnisfelder passen nicht zum Snapshot.");
        return q;
      }),
    };
  });
  delete fields.catalog;
  return validateBackup(
    {
      ...fields,
      questions: [
        ...new Map(
          rounds.flatMap((r) => r.questions).map((q) => [q.id, q]),
        ).values(),
      ],
      rounds,
      events: ordered("event").map((r) => r.value),
      learning: Object.fromEntries(
        ordered("learning").map((r) => [r.id, r.value]),
      ),
      records: Object.fromEntries(
        ordered("record").map((r) => [r.id, r.value]),
      ),
    },
    false,
  );
}

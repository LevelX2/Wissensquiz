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
export type QuestionRef =
  { release: string; index: number } | { object: string };
export type CatalogPart =
  { release: string; start: number; count: number } | { objects: string[] };
export type CatalogRef = { parts: CatalogPart[] } | { object: string };
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
export type CatalogRelease = {
  hash: string;
  encoding: "gzip-field-refs-v1";
  data: string;
  digests: string[];
};
export type PreparedRelease = CatalogRelease & {
  questions: Question[];
  byContent: Map<string, number>;
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
export const jsonEqual = (a: unknown, b: unknown) =>
  a === undefined || b === undefined
    ? a === b
    : stableStringify(a) === stableStringify(b);
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
export const catalogProof = (text: string) =>
  JSON.stringify(["quiz-catalog-v1", "json-field-refs-v1", text]);
async function compress(text: string) {
  const bytes = new Uint8Array(
    await new Response(
      new Blob([text]).stream().pipeThrough(new CompressionStream("gzip")),
    ).arrayBuffer(),
  );
  let binary = "";
  for (let at = 0; at < bytes.length; at += 8192)
    binary += String.fromCharCode(...bytes.subarray(at, at + 8192));
  return btoa(binary);
}
async function decompress(data: string) {
  const reader = new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.length;
      if (length > MAX_OBJECT_BYTES)
        throw new Error("Der Katalog ist zu groß.");
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.length;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
export async function prepareRelease(
  questions: Question[],
): Promise<PreparedRelease> {
  questions = questions.map((q) => questionSchema.parse(q));
  const text = encodeQuestionCatalog(questions);
  const contents = questions.map((q) => encodeQuestionCatalog([q]));
  const digests = await Promise.all(
    contents.map((text) =>
      sha256(objectProof("questions-field-refs-v1", text)),
    ),
  );
  return {
    hash: await sha256(catalogProof(text)),
    encoding: "gzip-field-refs-v1",
    data: await compress(text),
    digests,
    questions: structuredClone(questions),
    byContent: new Map(questions.map((q, i) => [JSON.stringify(q), i])),
  };
}
export async function verifyRelease(
  release: CatalogRelease,
): Promise<PreparedRelease> {
  if (release.encoding !== "gzip-field-refs-v1")
    throw new Error("Unbekannte Katalogkodierung.");
  const text = await decompress(release.data);
  if ((await sha256(catalogProof(text))) !== release.hash)
    throw new Error("Der Katalognachweis ist ungültig.");
  const questions = decodeQuestionCatalog(text);
  if (questions.length > 20000 || questions.length !== release.digests.length)
    throw new Error("Ungültiger Katalogumfang.");
  const digests = await Promise.all(
    questions.map((q) =>
      sha256(
        objectProof("questions-field-refs-v1", encodeQuestionCatalog([q])),
      ),
    ),
  );
  if (!jsonEqual(digests, release.digests))
    throw new Error("Die Fragennachweise passen nicht zum Katalog.");
  return {
    ...release,
    questions,
    byContent: new Map(questions.map((q, i) => [JSON.stringify(q), i])),
  };
}
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

// This compiler runs at migration/import and for changed entries. Catalog proofs
// are reused on known progress-only writes; no full-state fingerprint is needed.
export async function compileState(
  state: State,
  releases: PreparedRelease[] = [],
  previous?: SyncDocument,
  catalogUnchanged = false,
  roundSnapshotsUnchanged = catalogUnchanged,
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
    const content = JSON.stringify(q);
    for (const release of releases) {
      const index = release.byContent.get(content);
      if (index !== undefined) return { release: release.hash, index };
    }
    return {
      object: await object(
        "questions-field-refs-v1",
        encodeQuestionCatalog([q]),
      ),
    };
  }
  const oldCatalog = previous?.rows.get(rowKey("field", "catalog"));
  if (catalogUnchanged && oldCatalog)
    rows.set(rowKey("field", "catalog"), oldCatalog);
  else if (!releases.length)
    row("field", "catalog", 0, {
      object: await object(
        "questions-field-refs-v1",
        encodeQuestionCatalog(state.questions),
      ),
    });
  else {
    const parts: CatalogPart[] = [];
    for (const q of state.questions) {
      const reference = await ref(q),
        last = parts.at(-1);
      if ("release" in reference) {
        if (
          last &&
          "release" in last &&
          last.release === reference.release &&
          last.start + last.count === reference.index
        )
          last.count++;
        else
          parts.push({
            release: reference.release,
            start: reference.index,
            count: 1,
          });
      } else if (last && "objects" in last) last.objects.push(reference.object);
      else parts.push({ objects: [reference.object] });
    }
    row("field", "catalog", 0, { parts });
  }
  for (const [id, value] of Object.entries(state))
    if (!["questions", "rounds", "events", "learning", "records"].includes(id))
      row("field", id, 0, value);
  for (let position = 0; position < state.rounds.length; position++) {
    const { questions, before, ...header } = state.rounds[position];
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
export function reconstructState(
  document: SyncDocument,
  releases: PreparedRelease[] = [],
): State {
  const known = new Map(releases.map((r) => [r.hash, r]));
  function object(hash: string, encoding: ObjectEncoding) {
    const value = document.objects.get(hash);
    if (!value || value.encoding !== encoding)
      throw new Error("Ein referenzierter privater Inhalt fehlt.");
    return value.text;
  }
  function question(ref: QuestionRef) {
    if ("object" in ref) {
      const questions = decodeQuestionCatalog(
        object(ref.object, "questions-field-refs-v1"),
      );
      if (questions.length !== 1) throw new Error("Ungültiger Fragenverweis.");
      return questions[0];
    }
    const q = known.get(ref.release)?.questions[ref.index];
    if (!q || !Number.isInteger(ref.index))
      throw new Error("Ein historischer Kataloginhalt fehlt.");
    return structuredClone(q);
  }
  const ordered = (kind: RowKind) =>
    [...document.rows.values()]
      .filter((r) => r.kind === kind)
      .sort((a, b) => a.position - b.position);
  const fields = Object.fromEntries(
    ordered("field").map((r) => [r.id, r.value]),
  );
  const catalog = fields.catalog as CatalogRef;
  if (!catalog) throw new Error("Der Katalogverweis fehlt.");
  const questions =
    "object" in catalog
      ? decodeQuestionCatalog(object(catalog.object, "questions-field-refs-v1"))
      : catalog.parts.flatMap((part) => {
          if ("objects" in part)
            return part.objects.map((hash) => question({ object: hash }));
          const release = known.get(part.release);
          if (
            !release ||
            !Number.isInteger(part.start) ||
            !Number.isInteger(part.count) ||
            part.start < 0 ||
            part.count < 1 ||
            part.start + part.count > release.questions.length
          )
            throw new Error("Ein Katalogausschnitt ist ungültig.");
          return structuredClone(
            release.questions.slice(part.start, part.start + part.count),
          );
        });
  const rounds = ordered("round").map((row) => {
    const value = row.value as Record<string, unknown> & {
      questions: (ReturnType<typeof scoreFields> & { ref: QuestionRef })[];
      beforeObject: string;
    };
    const { beforeObject, questions: refs, ...header } = value;
    if (row.id !== header.id) throw new Error("Rundenidentität passt nicht.");
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
  return validateBackup({
    ...fields,
    questions,
    rounds,
    events: ordered("event").map((r) => r.value),
    learning: Object.fromEntries(
      ordered("learning").map((r) => [r.id, r.value]),
    ),
    records: Object.fromEntries(ordered("record").map((r) => [r.id, r.value])),
  });
}

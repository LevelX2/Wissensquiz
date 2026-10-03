import { isRecordMode } from "./recordModes";
import { validateBackup } from "./backupValidation";
export { validateBackup } from "./backupValidation";
import { emptyState, type State, type Question } from "./model";
import { catalogKey, decodeLocalState, encodeLocalState } from "./localCatalog";
import { encodeQuestionCatalog } from "./catalogCodec";
import { openDatabase } from "./database";
import { freezeCatalog } from "./immutableCatalog";
export { isImmutableCatalog } from "./immutableCatalog";
export { openDatabase } from "./database";
import {
  readEntryHead,
  readEntryState,
  updateEntries,
  type WriteOptions,
} from "./entryStorage";
export type UpdateOptions = WriteOptions;
const catalogs = new Map<
  string,
  { serialized: string; questions: Question[]; revision?: string }
>();
// Historical snapshots stay complete. Intern equal snapshots so IndexedDB's
// structured clone stores shared objects once, even after hundreds of rounds.
function compactRounds(state: State) {
  const seen = new WeakMap<Question, Question>();
  const content = new Map<string, Question>();
  return state.rounds.map((round) => ({
    ...round,
    questions: round.questions.map((question) => {
      const known = seen.get(question);
      if (known) return known;
      const signature = JSON.stringify(question);
      const canonical = content.get(signature) ?? question;
      content.set(signature, canonical);
      seen.set(question, canonical);
      return canonical;
    }),
  }));
}

function logicalState(
  value: unknown,
  serialized: unknown,
  key: string,
): State | undefined {
  if (!value) return undefined;
  const stored = value as State;
  if (Array.isArray(stored.questions)) return stored;
  const cached = catalogs.get(key);
  // Full reads compare the exact persisted JSON string, including old clients.
  // Keep version 38's compact layout and metadata references unchanged.
  if (cached && cached.serialized === serialized) {
    // Validate the actual catalog reference without parsing its large string again.
    const raw = value as {
      storageFormat: string;
      questions: { key: string; encoding: string; revision?: string };
    };
    if (
      raw.storageFormat !== "quiz-local-catalog-v1" ||
      raw.questions.key !== catalogKey(key) ||
      raw.questions.encoding !== "json-field-refs-v1"
    )
      throw new Error("Der lokale Fragenkatalog fehlt oder ist ungültig.");
    cached.revision = raw.questions.revision;
    const { storageFormat: _, ...fields } = value as State & {
      storageFormat: string;
    };
    return { ...fields, questions: cached.questions };
  }
  const decoded = decodeLocalState(value as State, serialized, key);
  if (decoded)
    catalogs.set(key, {
      serialized: serialized as string,
      questions: freezeCatalog(decoded.questions),
      revision: (value as { questions: { revision?: string } }).questions
        .revision,
    });
  return decoded;
}

export async function update(
  mutator: (state: State) => void,
  initial?: State,
  key = "current",
  options: WriteOptions = {},
): Promise<State> {
  if (key.startsWith("account:") && (await readEntryHead(key)))
    return updateEntries(mutator, key, options);
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    const store = tx.objectStore("state");
    const req = store.get(key);
    let result: State, failure: unknown;
    let nextCatalog:
      | { serialized: string; questions: Question[]; revision?: string }
      | undefined;
    const apply = (loaded: State, currentSerialized: unknown) => {
      try {
        const prior = catalogs.get(key);
        const questions = loaded.questions;
        result = {
          ...loaded,
          questions: options.reuseCatalog
            ? freezeCatalog(questions)
            : structuredClone(questions),
        };
        mutator(result);
        const reuse =
          options.reuseCatalog && prior && result.questions === prior.questions;
        const serialized = reuse
          ? prior.serialized
          : encodeQuestionCatalog(result.questions);
        if (serialized !== currentSerialized)
          store.put(serialized, catalogKey(key));
        if (prior?.serialized === serialized)
          result.questions = prior.questions;
        const revision =
          prior?.serialized === serialized
            ? (prior.revision ?? crypto.randomUUID())
            : crypto.randomUUID();
        nextCatalog = { serialized, questions: result.questions, revision };
        store.put(
          encodeLocalState(
            { ...result, rounds: compactRounds(result) },
            key,
            revision,
          ),
          key,
        );
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    req.onsuccess = () => {
      const cached = catalogs.get(key);
      const raw = req.result as
        | {
            storageFormat?: string;
            questions?: { key?: string; encoding?: string; revision?: string };
          }
        | undefined;
      if (
        options.reuseCatalog &&
        cached?.revision &&
        raw?.storageFormat === "quiz-local-catalog-v1" &&
        raw.questions?.key === catalogKey(key) &&
        raw.questions.encoding === "json-field-refs-v1" &&
        raw.questions.revision === cached.revision
      ) {
        // Verify presence without cloning the multi-megabyte JSON string. An old
        // client removes the optional revision and therefore takes the full read.
        const present = store.getKey(catalogKey(key));
        present.onsuccess = () => {
          if (!present.result) {
            failure = new Error(
              "Der lokale Fragenkatalog fehlt oder ist ungültig.",
            );
            tx.abort();
            return;
          }
          const { storageFormat: _, ...fields } = req.result;
          apply({ ...fields, questions: cached.questions }, cached.serialized);
        };
      } else {
        const catalog = store.get(catalogKey(key));
        catalog.onsuccess = () => {
          try {
            apply(
              logicalState(req.result, catalog.result, key) ??
                initial ??
                emptyState(),
              catalog.result,
            );
          } catch (error) {
            failure = error;
            tx.abort();
          }
        };
      }
    };
    tx.oncomplete = () => {
      if (nextCatalog) {
        freezeCatalog(nextCatalog.questions);
        catalogs.set(key, nextCatalog);
      }
      resolve(result);
    };
    tx.onerror = () => reject(failure ?? tx.error);
    tx.onabort = () =>
      reject(failure ?? tx.error ?? new Error("Speichern abgebrochen."));
  });
}

export async function read(key = "current"): Promise<State | undefined> {
  if (key.startsWith("account:") && (await readEntryHead(key)))
    return readEntryState(key);
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state"),
      store = tx.objectStore("state");
    const req = store.get(key),
      catalog = store.get(catalogKey(key));
    tx.oncomplete = () => {
      try {
        const result = logicalState(req.result, catalog.result, key);
        resolve(
          result
            ? { ...result, questions: structuredClone(result.questions) }
            : undefined,
        );
      } catch (error) {
        reject(error);
      }
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Lesen abgebrochen."));
  });
}
export async function restore(value: unknown, key = "current") {
  const checked = validateBackup(value);
  for (const r of checked.rounds)
    if (r.status === "active" && isRecordMode(r.mode)) {
      r.status = "aborted";
      r.finishedAt = Date.now();
    }
  return update(
    (s) => {
      for (const name of Object.keys(s))
        delete (s as unknown as Record<string, unknown>)[name];
      Object.assign(s, checked);
    },
    undefined,
    key,
    { replace: true },
  );
}
export function download(filename: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

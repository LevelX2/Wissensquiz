import { validateBackup } from "./backupValidation";
export { validateBackup } from "./backupValidation";
import { emptyState, type State } from "./model";
import { catalogKey, decodeLocalState, encodeLocalState } from "./localCatalog";
import { encodeQuestionCatalog } from "./catalogCodec";
import { openDatabase } from "./database";
export { openDatabase } from "./database";
import {
  readEntryHead,
  readEntryState,
  updateEntries,
  type WriteOptions,
} from "./entryStorage";
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
    const catalog = store.get(catalogKey(key));
    let result: State;
    let failure: unknown;
    catalog.onsuccess = () => {
      try {
        result =
          decodeLocalState(req.result, catalog.result, key) ??
          initial ??
          emptyState();
        mutator(result);
        // Compare exact content, not a hash: in-place edits and imports must be
        // detected too. JSON avoids IndexedDB cloning thousands of nested objects.
        const serialized = encodeQuestionCatalog(result.questions);
        if (serialized !== catalog.result)
          store.put(serialized, catalogKey(key));
        store.put(encodeLocalState(result, key), key);
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(result);
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
    const tx = db.transaction("state");
    const store = tx.objectStore("state");
    const req = store.get(key);
    const catalog = store.get(catalogKey(key));
    tx.oncomplete = () => {
      try {
        resolve(decodeLocalState(req.result, catalog.result, key));
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
    if (r.status === "active" && r.mode === "rekord") {
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

import { validateBackup } from "./backupValidation";
export { validateBackup } from "./backupValidation";
import { z } from "zod";
import { emptyState, type State } from "./model";
import { rebuild } from "./engine";
import { matchesFilters, usesFilmFilters } from "./filters";
import { matchesTopic } from "./categories";
import { questionSnapshotMatches } from "./filmFacts";
import { catalogKey, decodeLocalState, encodeLocalState } from "./localCatalog";
import { encodeQuestionCatalog } from "./catalogCodec";
let database: Promise<IDBDatabase> | undefined;
export function openDatabase() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    // Old builds open version 1 and cannot write the separated catalog layout.
    const req = indexedDB.open("wissensquiz", 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("state"))
        req.result.createObjectStore("state");
    };
    req.onsuccess = () => {
      req.result.onversionchange = () => {
        req.result.close();
        database = undefined;
      };
      resolve(req.result);
    };
    req.onerror = () => {
      database = undefined;
      reject(req.error);
    };
    req.onblocked = () =>
      reject(new Error("Bitte andere Wissensquiz-Fenster schließen."));
  }));
}
export async function update(
  mutator: (state: State) => void,
  initial?: State,
  key = "current",
): Promise<State> {
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
  return update((s) => Object.assign(s, checked), undefined, key);
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

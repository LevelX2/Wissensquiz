let database: Promise<IDBDatabase> | undefined;
export const ENTRY_STORES = [
  "entryHeads",
  "entryRows",
  "entryObjects",
  "syncOutbox",
  "syncReleases",
  "entryMigrations",
] as const;
export function openDatabase() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("wissensquiz", 3);
    request.onupgradeneeded = () => {
      for (const name of ["state", ...ENTRY_STORES])
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name);
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        database = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
    request.onblocked = () =>
      reject(new Error("Bitte andere Wissensquiz-Fenster schließen."));
  }));
}

import type { Page } from "@playwright/test";
import type { State } from "../../src/model";

// Inspect the durable state, including its separately stored catalog. Fixtures
// can still write a complete legacy State to exercise automatic migration.
export async function readSavedState(
  page: Page,
  key = "current",
): Promise<State> {
  return page.evaluate(
    (key) =>
      new Promise<State>((resolve, reject) => {
        const request = indexedDB.open("wissensquiz");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("state");
          const store = tx.objectStore("state");
          const query = store.get(key);
          let state: State;
          query.onsuccess = () => {
            state = query.result;
            if (!Array.isArray(state.questions)) {
              const catalog = store.get(
                (state.questions as unknown as { key: string }).key,
              );
              catalog.onsuccess = () => {
                state.questions = catalog.result;
              };
            }
          };
          tx.oncomplete = () => {
            db.close();
            resolve(state);
          };
          tx.onerror = tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
    key,
  );
}

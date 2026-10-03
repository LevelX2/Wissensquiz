import { validateBackup } from "./backupValidation";
import { openDatabase } from "./storage";
import type { State } from "./model";

const format = "quiz-recovery-v1";
function prefix(key: string) {
  if (!key.startsWith("account:"))
    throw new Error("Kein Kontospielstand ausgewählt.");
  return `recovery:${key}:`;
}
export function recoveryCopy(state: State) {
  return { format, createdAt: Date.now(), state };
}
export type RecoveryCopyInfo = {
  key: string;
  createdAt: number | null;
  bytes: number;
};
export async function listRecoveryCopies(
  accountKey: string,
): Promise<RecoveryCopyInfo[]> {
  const start = prefix(accountKey),
    db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state"),
      copies: RecoveryCopyInfo[] = [];
    const request = tx
      .objectStore("state")
      .openCursor(IDBKeyRange.bound(start, `${start}\uffff`));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const value = cursor.value;
      copies.push({
        key: String(cursor.key),
        bytes: new TextEncoder().encode(
          JSON.stringify(value?.format === format ? value.state : value),
        ).byteLength,
        createdAt:
          value?.format === format &&
          Number.isFinite(value.createdAt) &&
          value.createdAt >= 0
            ? value.createdAt
            : null,
      });
      cursor.continue();
    };
    tx.oncomplete = () =>
      resolve(copies.sort((a, b) => (b.createdAt ?? -1) - (a.createdAt ?? -1)));
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(
        tx.error ?? new Error("Rückfallkopien konnten nicht gelesen werden."),
      );
  });
}
export async function readRecoveryCopy(accountKey: string, copyKey: string) {
  if (!copyKey.startsWith(prefix(accountKey)))
    throw new Error("Diese Kopie gehört nicht zum ausgewählten Konto.");
  const db = await openDatabase();
  const value: unknown = await new Promise((resolve, reject) => {
    const request = db.transaction("state").objectStore("state").get(copyKey);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (!value) throw new Error("Rückfallkopie nicht gefunden.");
  return validateBackup(
    typeof value === "object" &&
      value !== null &&
      "format" in value &&
      value.format === format &&
      "state" in value
      ? value.state
      : value,
  );
}

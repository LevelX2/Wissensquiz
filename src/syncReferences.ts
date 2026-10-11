import type { SyncDocument } from "./syncCodec";

export function objectHashes(document: SyncDocument): Set<string> {
  const result = new Set<string>();
  for (const row of document.rows.values()) {
    const value = row.value as Record<string, unknown>;
    if (row.kind === "round") {
      result.add(value.beforeObject as string);
      (value.questions as { ref: { object?: string } }[]).forEach((q) => {
        if (q.ref?.object) result.add(q.ref.object);
      });
    }
  }
  return result;
}

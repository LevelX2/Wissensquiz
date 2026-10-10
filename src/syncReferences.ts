import type { SyncDocument } from "./syncCodec";

export function releaseHashes(document: SyncDocument): Set<string> {
  const result = new Set<string>();
  for (const row of document.rows.values()) {
    const value = row.value as Record<string, unknown>;
    if (row.kind === "field" && row.id === "catalog") {
      const parts = value.parts as { release?: string }[] | undefined;
      parts?.forEach((part) => {
        if (part.release) result.add(part.release);
      });
    } else if (row.kind === "round") {
      (value.questions as { ref: { release?: string } }[]).forEach((q) => {
        if (q.ref?.release) result.add(q.ref.release);
      });
    }
  }
  return result;
}
export function objectHashes(document: SyncDocument): Set<string> {
  const result = new Set<string>();
  for (const row of document.rows.values()) {
    const value = row.value as Record<string, unknown>;
    if (row.kind === "field" && row.id === "catalog") {
      if (typeof value.object === "string") result.add(value.object);
      (value.parts as { objects?: string[] }[] | undefined)?.forEach((part) =>
        part.objects?.forEach((hash) => result.add(hash)),
      );
    } else if (row.kind === "round") {
      result.add(value.beforeObject as string);
      (value.questions as { ref: { object?: string } }[]).forEach((q) => {
        if (q.ref?.object) result.add(q.ref.object);
      });
    }
  }
  return result;
}

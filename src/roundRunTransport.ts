import {
  jsonEqual,
  rowKey,
  type RowChange,
  type SyncDocument,
  type SyncPacket,
  type SyncRow,
} from "./syncCodec";

export type RoundRunChange = {
  op: "round-run";
  row: SyncRow;
  queue: { drop: number } | { replace: string[] };
};
export type OnlineSyncPacket = Omit<SyncPacket, "changes"> & {
  changes: (RowChange | RoundRunChange)[];
};

type RunValue = Record<string, unknown> & {
  mode: string;
  run?: Record<string, unknown> & { pool: string[]; queue: string[] };
};

// This is only a wire representation. Both confirmed documents and database
// rows retain the complete round, including its exact shuffled queue.
export function compactRoundRuns(
  before: SyncDocument,
  changes: RowChange[],
): OnlineSyncPacket["changes"] {
  return changes.map((change) => {
    if (change.op !== "put" || change.row.kind !== "round") return change;
    const prior = before.rows.get(rowKey("round", change.row.id))?.value as
      RunValue | undefined;
    const next = change.row.value as RunValue;
    if (
      !prior?.run ||
      !next.run ||
      prior.archive ||
      next.archive ||
      !["fehlerfrei", "zeitkonto"].includes(next.mode) ||
      prior.mode !== next.mode ||
      !jsonEqual(prior.run.pool, next.run.pool)
    )
      return change;

    const { pool: _pool, queue, ...run } = next.run;
    const drop = prior.run.queue.length - queue.length;
    const isTail =
      drop >= 0 &&
      queue.every((id, index) => id === prior.run!.queue[index + drop]);
    return {
      op: "round-run",
      row: { ...change.row, value: { ...next, run } },
      queue: isTail ? { drop } : { replace: queue },
    };
  });
}

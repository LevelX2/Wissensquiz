import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { hasAnswer, type State } from "./model";
import { rankingRequest } from "./rankingRequest";

const week = 7 * 24 * 60 * 60 * 1000;
const eventSchema = z.object({
  event_id: z.uuid(),
  kind: z.enum(["started", "completed"]),
  happened_at: z.iso.datetime(),
  answered: z.number().int().min(0).max(100),
  correct: z.number().int().min(0).max(100),
});
const receiptSchema = z.object({
  localKey: z.string(),
  event: eventSchema,
  sent: z.boolean(),
});
type Receipt = z.infer<typeof receiptSchema>;
export type GuestEvent = z.infer<typeof eventSchema>;

export function guestRoundEvent(
  state: State,
  roundId: string,
  kind: GuestEvent["kind"],
): GuestEvent | null {
  const round = state.rounds.find((r) => r.id === roundId);
  if (
    !round ||
    round.duel ||
    (kind === "completed" && round.status !== "completed")
  )
    return null;
  const at = kind === "started" ? round.startedAt : round.finishedAt;
  if (at === null) return null;
  const answers =
    kind === "started"
      ? []
      : state.events.filter((e) => e.roundId === roundId && hasAnswer(e));
  return {
    event_id: crypto.randomUUID(),
    kind,
    happened_at: new Date(at).toISOString(),
    answered: answers.length,
    correct: answers.filter((e) => e.correct).length,
  };
}

// Separate, bounded delivery receipts. No catalogue, answer IDs or saves leave
// the browser. Retrying the same round event cannot increment the server twice.
export class GuestActivityReporter {
  private memory: Receipt[] = [];
  private busy = false;
  private stopped = false;
  private storageUnavailable = false;
  private controller: AbortController | null = null;
  private key: string;
  constructor(
    private client: SupabaseClient | null,
    private storage: Pick<Storage, "getItem" | "setItem">,
    private now = Date.now,
  ) {
    this.key = "wissensquiz-guest-activity:v1";
  }
  private read() {
    try {
      if (this.storageUnavailable) throw new Error();
      const parsed = z
        .array(receiptSchema)
        .safeParse(JSON.parse(this.storage.getItem(this.key) ?? "[]"));
      if (parsed.success) this.memory = parsed.data;
    } catch {
      this.storageUnavailable = true;
    }
    this.memory = this.memory
      .filter((r) => Date.parse(r.event.happened_at) >= this.now() - week)
      .slice(-100);
    return this.memory;
  }
  private write(rows: Receipt[]) {
    this.memory = rows.slice(-100);
    try {
      this.storage.setItem(this.key, JSON.stringify(this.memory));
    } catch {
      this.storageUnavailable = true;
    }
  }
  record(state: State, roundId: string, kind: GuestEvent["kind"]) {
    if (this.stopped) return;
    const event = guestRoundEvent(state, roundId, kind);
    if (!event || Date.parse(event.happened_at) < this.now() - week) return;
    const rows = this.read();
    const localKey = `${kind}:${roundId}`;
    const previous = rows.find(
      (r) =>
        r.localKey === `started:${roundId}` ||
        r.localKey === `completed:${roundId}`,
    );
    if (previous) event.event_id = previous.event.event_id;
    if (!rows.some((r) => r.localKey === localKey))
      this.write([...rows, { localKey, event, sent: false }]);
    void this.flush();
  }
  async flush() {
    const client = this.client;
    if (!client || this.busy || this.stopped) return;
    this.busy = true;
    try {
      while (!this.stopped) {
        const next = this.read().find((r) => !r.sent);
        if (!next) break;
        this.controller = new AbortController();
        const { error } = await rankingRequest(
          (signal) =>
            client
              .rpc("quiz_report_guest_activity", {
                event_id: next.event.event_id,
                event_kind: next.event.kind,
                happened_at: next.event.happened_at,
                answers: next.event.answered,
                hits: next.event.correct,
              })
              .abortSignal(signal),
          this.controller,
        );
        if (error || this.stopped) break;
        this.write(
          this.read().map((r) =>
            r.localKey === next.localKey ? { ...r, sent: true } : r,
          ),
        );
      }
    } catch {
      /* Aggregate delivery never interrupts a guest game. */
    } finally {
      this.busy = false;
    }
  }
  stop() {
    this.stopped = true;
    this.controller?.abort();
  }
}

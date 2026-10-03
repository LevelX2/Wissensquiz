import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  GuestActivityReporter,
  guestRoundEvent,
} from "../src/guestActivityDelivery";
import { emptyState } from "../src/model";
import { importCsv } from "../src/importer";
import { readFileSync } from "node:fs";
import { startRound, answer, complete } from "../src/engine";
const at = Date.parse("2026-10-03T12:00:00+02:00");
function round() {
  const state = emptyState(
    [
      ...new Map(
        importCsv(readFileSync("public/fragen.csv", "utf8")).questions.map(
          (q) => [q.knowledgeId, q],
        ),
      ).values(),
    ].slice(0, 3),
  );
  const r = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    at,
  );
  answer(
    state,
    r.id,
    r.questions[0].id,
    r.questions[0].correctId,
    1000,
    at + 1000,
  );
  answer(state, r.id, r.questions[1].id, { dontKnow: true }, 1000, at + 2000);
  answer(state, r.id, r.questions[2].id, null, 30000, at + 30000);
  complete(state, r.id, at + 31000);
  return { state, r };
}
function mock() {
  const send = vi.fn().mockResolvedValue({ error: null });
  const client = {
    rpc: (_: string, payload: unknown) => ({
      abortSignal: () => send(payload),
    }),
  } as unknown as SupabaseClient;
  const storage = new Map<string, string>();
  return {
    send,
    client,
    storage: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storage.set(k, v);
      },
    },
  };
}
it("meldet nur Rundenzähler, zählt Keine Ahnung und keine Zeitabläufe als Antwort", () => {
  const { state, r } = round();
  expect(guestRoundEvent(state, r.id, "completed")).toEqual({
    event_id: expect.any(String),
    kind: "completed",
    happened_at: new Date(at + 31000).toISOString(),
    answered: 2,
    correct: 1,
  });
  expect(guestRoundEvent(state, r.id, "completed")?.event_id).not.toBe(r.id);
  expect(guestRoundEvent(state, r.id, "started")).toMatchObject({
    answered: 0,
    correct: 0,
  });
  r.duel = { id: "x", number: 1 };
  expect(guestRoundEvent(state, r.id, "completed")).toBeNull();
});
it("hält fehlgeschlagene Meldungen getrennt vom Spielstand, liefert sie nach und verhindert Wiederzählung nach Neuladen", async () => {
  const { state, r } = round();
  const before = JSON.stringify(state);
  const { client, send, storage } = mock();
  send.mockResolvedValueOnce({ error: { code: "offline" } });
  const reporter = new GuestActivityReporter(client, storage, () => at + 60000);
  reporter.record(state, r.id, "completed");
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  await reporter.flush();
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[0][0]).toEqual(send.mock.calls[1][0]);
  reporter.stop();
  const reloaded = new GuestActivityReporter(client, storage, () => at + 60000);
  reloaded.record(state, r.id, "completed");
  await reloaded.flush();
  expect(send).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(state)).toBe(before);
});
it("verwendet bei gesperrtem Browserspeicher den Speicherfallback und verwirft zu alte Meldungen", async () => {
  const { state, r } = round();
  const { client, send } = mock();
  const reporter = new GuestActivityReporter(
    client,
    {
      getItem: () => null,
      setItem: () => {
        throw new Error();
      },
    },
    () => at + 60000,
  );
  reporter.record(state, r.id, "started");
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  reporter.record(state, r.id, "started");
  await reporter.flush();
  expect(send).toHaveBeenCalledTimes(1);
  const expired = new GuestActivityReporter(
    client,
    { getItem: () => null, setItem: () => {} },
    () => at + 8 * 86400000,
  );
  expired.record(state, r.id, "completed");
  await expired.flush();
  expect(send).toHaveBeenCalledTimes(1);
});
it("merkt Gastspiele auch ohne erreichbare Konfiguration vor und liefert sie beim nächsten Online-Start", async () => {
  const { state, r } = round();
  const { client, send, storage } = mock();
  const offline = new GuestActivityReporter(null, storage, () => at + 60000);
  offline.record(state, r.id, "started");
  await offline.flush();
  expect(send).not.toHaveBeenCalled();
  offline.stop();
  const online = new GuestActivityReporter(client, storage, () => at + 60000);
  await online.flush();
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toMatchObject({
    event_kind: "started",
    answers: 0,
  });
  online.record(state, r.id, "completed");
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  expect(send.mock.calls[1][0].event_id).toBe(send.mock.calls[0][0].event_id);
  expect(send.mock.calls[1][0].event_id).not.toBe(r.id);
  expect(send.mock.calls[1][0]).toMatchObject({
    event_kind: "completed",
    answers: 2,
    hits: 1,
  });
});

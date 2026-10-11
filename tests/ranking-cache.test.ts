import { it, expect, vi, afterEach } from "vitest";
import { rankingRequest, invalidateRankingCache } from "../src/rankingRequest";
afterEach(() => vi.useRealTimers());
it("fasst gleiche Abrufe zusammen, trennt Konten und entkoppelt den Abbruch eines Abonnenten", async () => {
  const client = {};
  let complete!: (x: number) => void;
  const rpc = vi.fn(
    () =>
      new Promise<number>((r) => {
        complete = r;
      }),
  );
  const a = new AbortController(),
    b = new AbortController();
  const first = rankingRequest(rpc, a, {
    client,
    owner: "alice",
    key: "players",
  });
  const firstRejected = expect(first).rejects.toThrow();
  const second = rankingRequest(rpc, b, {
    client,
    owner: "alice",
    key: "players",
  });
  await Promise.resolve();
  await Promise.resolve();
  expect(rpc).toHaveBeenCalledTimes(1);
  a.abort();
  complete(7);
  await firstRejected;
  expect(await second).toBe(7);
  expect(
    await rankingRequest(rpc, new AbortController(), {
      client,
      owner: "alice",
      key: "players",
    }),
  ).toBe(7);
  expect(rpc).toHaveBeenCalledTimes(1);
  const other = vi.fn(async () => 8);
  expect(
    await rankingRequest(other, new AbortController(), {
      client,
      owner: "bob",
      key: "players",
    }),
  ).toBe(8);
  invalidateRankingCache(client, "alice");
  expect(
    await rankingRequest(other, new AbortController(), {
      client,
      owner: "alice",
      key: "players",
    }),
  ).toBe(8);
  expect(other).toHaveBeenCalledTimes(2);
});
it("erneuert abgelaufene Werte und speichert keine Fehlantworten", async () => {
  vi.useFakeTimers();
  const client = {};
  const rpc = vi.fn(async () => ({ error: null, data: 1 }));
  const read = (fresh = false) =>
    rankingRequest(rpc, new AbortController(), {
      client,
      owner: "a",
      key: "r",
      fresh,
    });
  await read();
  await read();
  expect(rpc).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(30001);
  await read();
  expect(rpc).toHaveBeenCalledTimes(2);
  await read(true);
  expect(rpc).toHaveBeenCalledTimes(3);
  const bad = vi.fn(async () => ({ error: "offline" }));
  await rankingRequest(bad, new AbortController(), { client, key: "bad" });
  await rankingRequest(bad, new AbortController(), { client, key: "bad" });
  expect(bad).toHaveBeenCalledTimes(2);
});

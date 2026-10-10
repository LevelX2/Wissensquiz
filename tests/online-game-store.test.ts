import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { OnlineGameStore } from "../src/onlineGameStore";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import { startRound, answer, complete } from "../src/engine";
import { prepareRelease, type PreparedRelease } from "../src/syncCodec";
import type {
  OnlineSyncPacket,
  RoundRunChange,
} from "../src/roundRunTransport";
import { CloudConflict } from "../src/accounts";
import { archiveClosedRounds } from "../src/roundArchive";
let fixture: Awaited<ReturnType<typeof syncFixture>>, release: PreparedRelease;
const localOpen = vi.fn(() => {
  throw new Error("Keine lokale Spielstandablage erlaubt");
});
beforeAll(async () => {
  vi.stubGlobal("indexedDB", { open: localOpen });
  fixture = await syncFixture();
  release = await prepareRelease(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(0, 12),
  );
  await fixture.seed(release);
}, 60000);
afterAll(async () => {
  await fixture?.db.close();
  vi.unstubAllGlobals();
});
async function setup() {
  const { owner, api } = await fixture.client();
  const make = (remote = api) =>
    new OnlineGameStore(
      remote,
      owner,
      async () => release,
      async () => null,
    );
  const store = make();
  await store.open();
  await store.update((s) => {
    Object.assign(s, emptyState(release.questions));
  });
  return { owner, api, store, make };
}
it("beginnt den Metadatenabruf während der Katalog noch lädt", async () => {
  const { owner, api } = await fixture.client();
  let releaseCatalog!: (value: PreparedRelease) => void;
  const catalog = new Promise<PreparedRelease>((resolve) => {
    releaseCatalog = resolve;
  });
  api.hook(async (name) => {
    if (name === "quiz_sync_metadata") releaseCatalog(release);
  });
  const store = new OnlineGameStore(
    api,
    owner,
    () => catalog,
    async () => null,
  );
  try {
    await store.open();
    expect(store.read().events).toHaveLength(0);
  } finally {
    releaseCatalog(release);
    store.stop();
  }
});
it("speichert Runde und Antwort online, lädt sie neu und verwendet niemals IndexedDB", async () => {
  const { store, make } = await setup();
  let state = await store.update((s) => {
    startRound(
      s,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1700000000000,
    );
  });
  const round = state.rounds.at(-1)!,
    q = round.questions[0];
  state = await store.update(
    (s) => {
      answer(s, round.id, q.id, q.correctId, 100, 1700000000100);
    },
    { reuseCatalog: true, progressOnly: true },
  );
  expect(state.events).toHaveLength(1);
  const reopened = make();
  await reopened.open();
  expect(reopened.read()).toEqual(state);
  const confirmedSound = state.settings.sound;
  state.settings.sound = !confirmedSound;
  expect(store.read().settings.sound).toBe(confirmedSound);
  const changed = await store.update((s) => {
    s.settings.sound = !confirmedSound;
  });
  expect(changed.settings.sound).toBe(!confirmedSound);
  const fresh = make();
  await fresh.open();
  expect(fresh.read().settings.sound).toBe(!confirmedSound);
  fresh.stop();
  expect(localOpen).not.toHaveBeenCalled();
  store.stop();
  reopened.stop();
});
it("übernimmt eine nicht bestätigte Änderung erst nach ausdrücklichem Wiederholen", async () => {
  const { store, api } = await setup();
  const before = store.read(),
    listener = vi.fn();
  store.subscribe(listener);
  api.unavailable("quiz_sync_apply");
  await expect(
    store.update((s) => {
      s.settings.sound = false;
    }),
  ).rejects.toThrow();
  expect(store.read()).toEqual(before);
  expect(listener).not.toHaveBeenCalled();
  await expect(
    store.update((s) => {
      s.settings.sound = true;
    }),
  ).rejects.toThrow("ausstehende Online-Speicherung");
  const after = await store.retry();
  expect(after.settings.sound).toBe(false);
  expect(listener).toHaveBeenCalledTimes(1);
  store.stop();
});
it("wiederholt nach verlorener Serverbestätigung exakt dieselbe Paket-ID und zählt nur einmal", async () => {
  const { store, api, make } = await setup();
  api.calls.length = 0;
  api.lost("quiz_sync_apply");
  await expect(
    store.update((s) => {
      s.settings.sound = false;
    }),
  ).rejects.toThrow("Bestätigung verloren");
  expect(store.read().settings.sound).toBe(true);
  await store.retry();
  const texts = api.calls
    .filter((c) => c.name === "quiz_sync_apply")
    .map((c) => c.args.packet_text);
  expect(texts).toHaveLength(2);
  expect(texts[1]).toBe(texts[0]);
  const reopened = make();
  await reopened.open();
  expect(reopened.read().settings.sound).toBe(false);
  store.stop();
  reopened.stop();
});
it("speichert neue Rundeninhalte in einer Anfrage und wiederholt das Paket unverändert", async () => {
  const { store, api, make } = await setup();
  api.calls.length = 0;
  api.lost("quiz_sync_apply");
  await expect(
    store.update(
      (s) => {
        startRound(
          s,
          { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
          1700000000000,
        );
      },
      { reuseCatalog: true },
    ),
  ).rejects.toThrow("Bestätigung verloren");
  expect(store.read().rounds).toHaveLength(0);
  expect(api.calls.map((c) => c.name)).toEqual(["quiz_sync_apply"]);
  const packet = api.calls[0].args.packet_text as string;
  expect(JSON.parse(packet).objects.length).toBeGreaterThan(0);
  await store.retry();
  expect(api.calls.map((c) => c.name)).toEqual([
    "quiz_sync_apply",
    "quiz_sync_apply",
  ]);
  expect(api.calls[1].args.packet_text).toBe(packet);
  expect(store.read().rounds).toHaveLength(1);
  const reopened = make();
  await reopened.open();
  expect(reopened.read()).toEqual(store.read());
  store.stop();
  reopened.stop();
});
it("überträgt große Unicode-Inhalte weiterhin stückweise und erhält sie nach erneutem Laden", async () => {
  const { store, api, make } = await setup();
  api.calls.length = 0;
  const text = "Grüße 🎬 ".repeat(12000);
  await store.update((s) => {
    s.questions[0].metadata.synthetic_large_content = text;
  });
  const pieces = api.calls.filter((c) => c.name === "quiz_sync_object_piece");
  expect(pieces.length).toBeGreaterThan(1);
  expect(
    pieces.every(
      (c) => Buffer.byteLength(c.args.part_content as string) <= 131072,
    ),
  ).toBe(true);
  const reopened = make();
  await reopened.open();
  expect(reopened.read().questions[0].metadata.synthetic_large_content).toBe(
    text,
  );
  store.stop();
  reopened.stop();
});
it("weist eine veraltete Änderung eines zweiten Geräts ab und erhält den aktuellen Serverstand", async () => {
  const { store, owner } = await setup();
  const { api } = await fixture.client(owner);
  const second = new OnlineGameStore(
    api,
    owner,
    async () => release,
    async () => null,
  );
  await second.open();
  await store.update((s) => {
    s.settings.sound = false;
  });
  await expect(
    second.update((s) => {
      s.settings.haptics = true;
    }),
  ).rejects.toBeInstanceOf(CloudConflict);
  expect(second.read().settings.haptics).toBe(false);
  const { api: fresh } = await fixture.client(owner);
  const third = new OnlineGameStore(
    fresh,
    owner,
    async () => release,
    async () => null,
  );
  await third.open();
  expect(third.read().settings.sound).toBe(false);
  expect(third.read().settings.haptics).toBe(false);
  store.stop();
  second.stop();
  third.stop();
});
it("nimmt bei gleichzeitig gesendeten Geräteantworten genau eine an und erhält sie auch nach dem Konflikt", async () => {
  const { store, owner } = await setup();
  const started = await store.update(
    (s) => {
      startRound(
        s,
        { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
        1700000000000,
      );
    },
    { reuseCatalog: true },
  );
  const { api } = await fixture.client(owner);
  const second = new OnlineGameStore(
    api,
    owner,
    async () => release,
    async () => null,
  );
  await second.open();
  const before = await api.call<{ revision: number }>("quiz_sync_metadata", {
    expected_owner: owner,
  });
  const round = started.rounds.at(-1)!,
    q = round.questions[0];
  const options = { reuseCatalog: true, progressOnly: true };
  const outcomes = await Promise.allSettled([
    store.update((s) => {
      answer(s, round.id, q.id, q.correctId, 1000, 1700000001000);
    }, options),
    second.update((s) => {
      answer(s, round.id, q.id, null, 1000, 1700000001000);
    }, options),
  ]);
  const accepted = outcomes.filter((o) => o.status === "fulfilled");
  const rejected = outcomes.filter((o) => o.status === "rejected");
  expect(accepted).toHaveLength(1);
  expect(rejected).toHaveLength(1);
  expect(rejected[0].reason).toBeInstanceOf(CloudConflict);
  const loser = outcomes[0].status === "rejected" ? store : second;
  expect(loser.read().events).toHaveLength(0);
  await expect(loser.retry()).rejects.toBeInstanceOf(CloudConflict);
  expect(
    await api.call("quiz_sync_metadata", { expected_owner: owner }),
  ).toMatchObject({ revision: before.revision + 1 });
  const { api: freshApi } = await fixture.client(owner);
  const fresh = new OnlineGameStore(
    freshApi,
    owner,
    async () => release,
    async () => null,
  );
  await fresh.open();
  expect(fresh.read()).toEqual(accepted[0].value);
  expect(fresh.read().events).toHaveLength(1);
  store.stop();
  second.stop();
  fresh.stop();
});
it("liest einen vorhandenen Online-Stand bei der bestehenden Serveraktivierung ohne Gerätekopie", async () => {
  const { owner, api } = await fixture.client();
  const existing = emptyState(release.questions);
  existing.settings.sound = false;
  const store = new OnlineGameStore(
    api,
    owner,
    async () => release,
    async () => ({ state: existing, revision: 0 }),
  );
  await store.open();
  expect(store.read()).toEqual(existing);
  expect(localOpen).not.toHaveBeenCalled();
  store.stop();
});
it("ersetzt einen Online-Stand atomar und erkennt eine verlorene Aktivierungsbestätigung beim Wiederholen", async () => {
  const { store, api, make } = await setup();
  api.lost("quiz_sync_activate");
  await expect(
    store.update(
      (s) => {
        s.settings.sound = false;
      },
      { replace: true },
    ),
  ).rejects.toThrow("Bestätigung verloren");
  expect(store.read().settings.sound).toBe(true);
  await store.retry();
  expect(store.read().settings.sound).toBe(false);
  const reopened = make();
  await reopened.open();
  expect(reopened.read()).toEqual(store.read());
  store.stop();
  reopened.stop();
});
it("wiederholt einen unterbrochenen Austausch ohne die Serverrevision zweimal zu erhöhen", async () => {
  const { store, api } = await setup();
  api.lost("quiz_sync_seal");
  await expect(
    store.update(
      (s) => {
        s.settings.sound = false;
      },
      { replace: true },
    ),
  ).rejects.toThrow();
  await store.retry();
  expect(store.read().settings.sound).toBe(false);
  store.stop();
});
it("lädt benötigte private Objekte nach einem vollständigen Austausch erneut hoch", async () => {
  const { store, make } = await setup();
  const first = await store.update((s) => {
    startRound(
      s,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1700000000000,
    );
  });
  await store.update((s) => Object.assign(s, emptyState(release.questions)), {
    replace: true,
  });
  await store.update((s) => {
    s.rounds = first.rounds;
  });
  const fresh = make();
  await fresh.open();
  expect(fresh.read().rounds).toEqual(first.rounds);
  store.stop();
  fresh.stop();
});
it("öffnet einen vorhandenen Online-Kontostand mit seiner tatsächlichen Serverrevision", async () => {
  const { owner, api } = await fixture.client();
  const existing = emptyState(release.questions);
  existing.settings.sound = false;
  await fixture.db.query(
    "insert into public.quiz_saves(owner_id,state,revision) values($1,$2,7)",
    [owner, existing],
  );
  const store = new OnlineGameStore(
    api,
    owner,
    async () => release,
    async () => ({ state: existing, revision: 7 }),
  );
  await store.open();
  expect(store.read()).toEqual(existing);
  expect(
    await api.call("quiz_sync_metadata", { expected_owner: owner }),
  ).toMatchObject({ revision: 8 });
  store.stop();
  expect(localOpen).not.toHaveBeenCalled();
});

it.each(["fehlerfrei", "zeitkonto"] as const)(
  "%s erweitert nach bestätigter Antwort die Runde mit unveränderlichen Frageinhalten",
  async (mode) => {
    const { store, make, api } = await setup();
    const started = await store.update((s) => {
      startRound(
        s,
        {
          mode,
          topic: "Alle Themen",
          difficulty: "Alle Stufen",
        },
        1700000000000,
      );
    });
    const round = started.rounds.at(-1)!,
      q = round.questions[0];
    const next = await store.update(
      (s) => {
        answer(s, round.id, q.id, q.correctId, 1000, 1700000001000);
      },
      { reuseCatalog: true, progressOnly: true },
    );
    expect(next.rounds.at(-1)!.questions).toHaveLength(2);
    expect(next.rounds.at(-1)!.events).toHaveLength(1);
    const packet = JSON.parse(
      api.calls.at(-1)!.args.packet_text as string,
    ) as OnlineSyncPacket;
    const change = packet.changes.find(
      (c) => c.op === "round-run",
    ) as RoundRunChange;
    expect(change.queue).toEqual({ drop: 1 });
    expect(change.row.value).toMatchObject({ run: { version: 1 } });
    expect((change.row.value as { run: unknown }).run).not.toHaveProperty(
      "pool",
    );
    expect((change.row.value as { run: unknown }).run).not.toHaveProperty(
      "queue",
    );
    const reopened = make();
    await reopened.open();
    expect(reopened.read()).toEqual(next);
    store.stop();
    reopened.stop();
  },
);

it("wiederholt verlorene Listenbestätigung exakt, blockiert das zweite Gerät und mischt den nächsten Zyklus korrekt", async () => {
  const { store, api, make } = await setup();
  const started = await store.update((s) => {
    startRound(
      s,
      { mode: "zeitkonto", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1700000000000,
    );
  });
  const round = started.rounds.at(-1)!;
  const stale = make();
  await stale.open();
  const respond = (s: ReturnType<typeof emptyState>) => {
    const q = s.rounds.at(-1)!.questions.at(-1)!;
    answer(
      s,
      round.id,
      q.id,
      q.correctId,
      100,
      1700000001000 + s.events.length * 100,
    );
  };
  api.lost("quiz_sync_apply");
  await expect(
    store.update(respond, { reuseCatalog: true, progressOnly: true }),
  ).rejects.toThrow(/Bestätigung verloren/);
  expect(store.read().events).toHaveLength(0);
  const lostText = api.calls.at(-1)!.args.packet_text;
  let state = await store.retry();
  expect(api.calls.at(-1)!.args.packet_text).toBe(lostText);
  expect(state.rounds.at(-1)!.run!.queue).toEqual(round.run!.queue.slice(1));
  await expect(
    stale.update(respond, { reuseCatalog: true, progressOnly: true }),
  ).rejects.toBeInstanceOf(CloudConflict);
  await expect(stale.retry()).rejects.toBeInstanceOf(CloudConflict);
  while (state.rounds.at(-1)!.run!.cycle === 1) {
    state = await store.update(respond, {
      reuseCatalog: true,
      progressOnly: true,
    });
  }
  const rollover = JSON.parse(
    api.calls.at(-1)!.args.packet_text as string,
  ) as OnlineSyncPacket;
  const change = rollover.changes.find(
    (c) => c.op === "round-run",
  ) as RoundRunChange;
  expect(change.queue).toEqual({ replace: state.rounds.at(-1)!.run!.queue });
  expect(state.rounds.at(-1)!.run!.pool).toEqual(round.run!.pool);
  const fresh = make();
  await fresh.open();
  expect(fresh.read()).toEqual(state);
  store.stop();
  stale.stop();
  fresh.stop();
});

it("verwirft fehlerhafte Listendeltas atomar und gewährt keinen direkten Zugriff auf die Schreibroutine", async () => {
  const { store, api, owner } = await setup();
  const state = await store.update((s) => {
    startRound(
      s,
      { mode: "fehlerfrei", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1700000000000,
    );
  });
  const base = JSON.parse(
    api.calls.at(-1)!.args.packet_text as string,
  ) as OnlineSyncPacket;
  const put = base.changes.find(
    (c) => c.op === "put" && c.row.kind === "round",
  )!;
  if (put.op !== "put") throw new Error("Runde fehlt");
  const row = structuredClone(put.row);
  const value = row.value as { run: { pool?: string[]; queue?: string[] } };
  delete value.run.pool;
  delete value.run.queue;
  const change: RoundRunChange = { op: "round-run", row, queue: { drop: 1 } };
  const sound = state.settings.sound;
  const malformed = [
    { ...change, queue: { drop: -1 } },
    { ...change, queue: { drop: 100000 } },
    { ...change, queue: { drop: null } },
    { ...change, queue: { drop: 0, replace: [] } },
    { ...change, queue: { replace: [null] } },
    { ...change, row: { ...row, id: "missing" } },
    { ...change, row: { ...row, kind: "field" } },
    {
      ...change,
      row: { ...row, value: { ...(row.value as object), id: "wrong" } },
    },
    {
      ...change,
      row: {
        ...row,
        value: { ...(row.value as object), run: { version: 1, pool: [] } },
      },
    },
    {
      ...change,
      row: { ...row, value: { ...(row.value as object), questions: [] } },
    },
  ];
  for (const bad of malformed) {
    await expect(
      api.call("quiz_sync_apply", {
        packet_text: JSON.stringify({
          ...base,
          id: crypto.randomUUID(),
          expectedRevision: base.expectedRevision + 1,
          objects: [],
          changes: [
            {
              op: "put",
              row: {
                kind: "field",
                id: "settings",
                position: 0,
                value: { ...state.settings, sound: !sound },
              },
            },
            bad,
          ],
        }),
      }),
    ).rejects.toThrow();
    expect(
      await api.call("quiz_sync_metadata", { expected_owner: owner }),
    ).toMatchObject({ revision: base.expectedRevision + 1 });
  }
  const foreign = await fixture.client();
  await expect(
    foreign.api.call("quiz_sync_apply", {
      packet_text: JSON.stringify({
        ...base,
        id: crypto.randomUUID(),
        expectedRevision: base.expectedRevision + 1,
        changes: [change],
      }),
    }),
  ).rejects.toThrow(/account_changed/);
  const rights = await fixture.db.query<{ allowed: boolean }>(
    "select has_function_privilege('authenticated','quiz_sync_internal.write_entries(uuid,uuid,jsonb,bigint)','execute') as allowed",
  );
  expect(rights.rows[0].allowed).toBe(false);
  const fresh = new OnlineGameStore(
    api,
    owner,
    async () => release,
    async () => null,
  );
  await fresh.open();
  expect(fresh.read()).toEqual(state);
  store.stop();
  fresh.stop();
});

it("überträgt mehrere Antworten als Listenverbrauch und archiviert den beendeten Lauf ohne Listen", async () => {
  const { store, api, make } = await setup();
  await store.update((s) => {
    startRound(
      s,
      { mode: "fehlerfrei", topic: "Alle Themen", difficulty: "Alle Stufen" },
      1700000000000,
    );
  });
  const initial = store.read().rounds.at(-1)!;
  await store.update(
    (s) => {
      for (let i = 0; i < 3; i++) {
        const r = s.rounds.at(-1)!,
          q = r.questions.at(-1)!;
        answer(s, r.id, q.id, q.correctId, 1000, 1700000001000 + i * 1000);
      }
    },
    { reuseCatalog: true, progressOnly: true },
  );
  let packet = JSON.parse(
    api.calls.at(-1)!.args.packet_text as string,
  ) as OnlineSyncPacket;
  expect(
    (packet.changes.find((c) => c.op === "round-run") as RoundRunChange).queue,
  ).toEqual({ drop: 3 });
  expect(store.read().rounds.at(-1)!.run!.queue).toEqual(
    initial.run!.queue.slice(3),
  );
  await store.update(
    (s) => {
      const r = s.rounds.at(-1)!,
        q = r.questions.at(-1)!;
      answer(
        s,
        r.id,
        q.id,
        q.answers.find((a) => a.id !== q.correctId)!.id,
        1000,
        1700000005000,
      );
    },
    { reuseCatalog: true, progressOnly: true },
  );
  packet = JSON.parse(
    api.calls.at(-1)!.args.packet_text as string,
  ) as OnlineSyncPacket;
  expect(
    (packet.changes.find((c) => c.op === "round-run") as RoundRunChange).queue,
  ).toEqual({ drop: 0 });
  const archived = await store.update((s) => archiveClosedRounds(s), {
    reuseCatalog: true,
    progressOnly: true,
  });
  packet = JSON.parse(
    api.calls.at(-1)!.args.packet_text as string,
  ) as OnlineSyncPacket;
  expect(packet.changes.some((c) => c.op === "round-run")).toBe(false);
  expect(archived.rounds.at(-1)!).toMatchObject({
    status: "completed",
    archive: { version: 1 },
    run: { pool: [], queue: [] },
  });
  const fresh = make();
  await fresh.open();
  expect(fresh.read()).toEqual(archived);
  store.stop();
  fresh.stop();
});

it("teilt unveränderliche Archivfakten, isoliert aber Ereignisse, Runden und Archivlisten", async () => {
  const { store, make } = await setup();
  await store.update(
    (s) => {
      const round = startRound(
        s,
        { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
        1700000000000,
      );
      for (const [i, q] of round.questions.entries())
        answer(s, round.id, q.id, q.correctId, 100, 1700000000100 + i);
      complete(s, round.id, 1700000001000);
      archiveClosedRounds(s);
    },
    { reuseCatalog: true },
  );
  const first = store.read(),
    second = store.read();
  const fact = first.rounds[0].archive!.questions[0];
  expect(second.rounds[0].archive!.questions[0]).toBe(fact);
  expect(Object.isFrozen(fact)).toBe(true);
  expect(Object.isFrozen(fact.answerIds)).toBe(true);
  expect(() => {
    fact.metadata.subdomain = "Manipuliert";
  }).toThrow(TypeError);
  expect(first.rounds[0].archive).not.toBe(second.rounds[0].archive);
  expect(first.rounds[0].archive!.questions).not.toBe(
    second.rounds[0].archive!.questions,
  );
  first.rounds[0].archive!.questions.splice(0, 1);
  first.rounds[0].topic = "Andere Runde";
  first.events[0].correct = false;
  expect(store.read()).toEqual(second);
  const saved = await store.update(
    (s) => {
      s.settings.haptics = true;
      // The list remains mutable; swapping equal facts must not touch old readers.
      s.rounds[0].archive!.questions[0] = {
        ...s.rounds[0].archive!.questions[0],
      };
    },
    { reuseCatalog: true, progressOnly: true },
  );
  expect(second.settings.haptics).not.toBe(true);
  const reopened = make();
  await reopened.open();
  expect(reopened.read()).toEqual(saved);
  reopened.stop();
  store.stop();
});

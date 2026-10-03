import { expect, it, vi } from "vitest";
import { AccountSync, fingerprint, type SyncStore } from "../src/accountSync";
import { CloudConflict, type SyncReceipt } from "../src/accounts";
import { emptyState, type State } from "../src/model";
import { RequestTimeout } from "../src/request";

const changed = (sound: boolean) => ({
  ...emptyState(),
  settings: { spoilers: true, sound },
});

it("datiert nur bestätigte Stände und erhält die Bestätigung bei lokalem Fehler und Neuladen", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-03T10:00:00Z"));
  const f = fixture(),
    sync = new AccountSync(f.store, () => {});
  try {
    f.local = emptyState();
    await sync.prepare();
    expect(sync.confirmedAt).toBeUndefined();
    sync.offer(f.local);
    await sync.flush();
    const first = sync.confirmedAt;
    expect(first).toBe(Date.now());
    vi.setSystemTime(Date.now() + 60_000);
    const save = f.store.save;
    f.store.save = async () => {
      throw new Error("offline");
    };
    f.local = changed(false);
    sync.offer(f.local);
    await sync.flush();
    expect(sync.status).toBe("offline");
    expect(sync.confirmedAt).toBe(first);
    f.store.save = save;
    await sync.flush();
    expect(sync.confirmedAt).toBe(Date.now());
    expect(f.receipt!.confirmedAt).toBe(Date.now());
    const second = sync.confirmedAt;
    sync.stop();
    vi.setSystemTime(Date.now() + 3_600_000);
    const reloaded = new AccountSync(f.store, () => {});
    await reloaded.prepare();
    expect(reloaded.confirmedAt).toBe(second);
    reloaded.stop();
  } finally {
    sync.stop();
    vi.useRealTimers();
  }
});

it("begrenzt einen hängenden Erstabruf und erhält den lokalen Stand", async () => {
  vi.useFakeTimers();
  const f = fixture();
  f.local = changed(false);
  f.store.remote = () => new Promise(() => {});
  const sync = new AccountSync(f.store, () => {});
  try {
    const result = sync.prepare().catch((error) => error);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await result).toBeInstanceOf(RequestTimeout);
    expect(f.local.settings.sound).toBe(false);
    expect(f.receipt).toBeUndefined();
  } finally {
    sync.stop();
    vi.useRealTimers();
  }
});

it.each([false, true])(
  "holt nach hängendem Upload neue lokale Änderungen nach, Servercommit=%s",
  async (committed) => {
    vi.useFakeTimers();
    const f = fixture();
    const save = f.store.save;
    let started!: () => void;
    const gate = new Promise<void>((resolve) => {
      started = resolve;
    });
    let signal: AbortSignal | undefined;
    f.store.save = async (state, revision, incomingSignal) => {
      signal = incomingSignal;
      if (committed) await save(state, revision);
      started();
      return new Promise(() => {});
    };
    const sync = new AccountSync(f.store, () => {});
    try {
      await sync.prepare();
      sync.offer(changed(false));
      const pending = sync.flush();
      await gate;
      f.local = changed(true);
      sync.offer(f.local);
      await vi.advanceTimersByTimeAsync(30_000);
      await pending;
      expect(sync.status).toBe("offline");
      expect(signal?.aborted).toBe(true);
      f.store.save = save;
      await sync.flush();
      expect(sync.status).toBe("saved");
      expect(f.remote?.state.settings.sound).toBe(true);
      expect(f.remote?.revision).toBe(committed ? 2 : 1);
      expect(f.receipt?.revision).toBe(f.remote?.revision);
    } finally {
      sync.stop();
      vi.useRealTimers();
    }
  },
);

it("überschreibt nach unbestätigtem Upload keine zusätzlich geänderte Serverrevision", async () => {
  const f = fixture();
  const save = f.store.save;
  const sync = new AccountSync(f.store, () => {});
  await sync.prepare();
  f.store.save = async (state, revision) => {
    await save(state, revision);
    throw new Error("Antwort verloren");
  };
  sync.offer(changed(false));
  await sync.flush();
  f.remote = { state: changed(true), revision: 2 };
  f.store.save = save;
  await sync.flush();
  expect(sync.status).toBe("conflict");
  expect(f.remote.revision).toBe(2);
  sync.stop();
});
function fixture() {
  let local: State | undefined;
  let receipt: SyncReceipt | undefined;
  let remote: {
    state: State;
    revision: number;
    needsCareerSave?: boolean;
  } | null = null;
  const backups: State[] = [];
  const store: SyncStore = {
    local: async () => local,
    receipt: async () => receipt,
    legacyRevision: async () => 0,
    remote: async () => remote,
    replace: async (state) => {
      if (local) backups.push(local);
      local = structuredClone(state);
      return local;
    },
    acknowledge: async (value) => {
      receipt = value;
    },
    save: async (state, revision) => {
      if (revision !== (remote?.revision ?? 0)) throw new CloudConflict();
      remote = { state: structuredClone(state), revision: revision + 1 };
      return remote.revision;
    },
  };
  return {
    store,
    backups,
    get local() {
      return local;
    },
    set local(value) {
      local = value;
    },
    get receipt() {
      return receipt;
    },
    set receipt(value) {
      receipt = value;
    },
    get remote() {
      return remote;
    },
    set remote(value) {
      remote = value;
    },
  };
}
it("lädt den Online-Stand auf einem neuen Gerät vor dem Spielen", async () => {
  const f = fixture();
  f.remote = { state: changed(true), revision: 4 };
  const sync = new AccountSync(f.store, () => {});
  await sync.prepare();
  expect(f.local).toEqual(f.remote.state);
  expect(f.receipt?.revision).toBe(4);
  sync.offer(f.local!);
  await sync.flush();
  expect(f.remote.revision).toBe(4);
});
it("sichert eine beim Lesen umgestellte Filmkarriere einmal trotz identischer normalisierter Fingerabdrücke", async () => {
  const f = fixture();
  f.remote = { state: changed(true), revision: 4, needsCareerSave: true };
  const sync = new AccountSync(f.store, () => {});
  await sync.prepare();
  sync.offer(f.local!);
  await sync.flush();
  expect(f.remote.revision).toBe(5);
  expect(f.remote.needsCareerSave).toBeUndefined();
  const restarted = new AccountSync(f.store, () => {});
  await restarted.prepare();
  restarted.offer(f.local!);
  await restarted.flush();
  expect(f.remote.revision).toBe(5);
  sync.stop();
  restarted.stop();
});
it("holt lokal gespeicherte Offline-Antworten auch nach Neuladen nach", async () => {
  const f = fixture();
  f.local = changed(false);
  const sync = new AccountSync(f.store, () => {});
  await sync.prepare();
  const save = f.store.save;
  f.store.save = async () => {
    throw new Error("offline");
  };
  sync.offer(f.local);
  await sync.flush();
  expect(sync.status).toBe("offline");
  expect(f.remote).toBeNull();
  sync.stop();
  f.store.save = save;
  const restarted = new AccountSync(f.store, () => {});
  await restarted.prepare();
  restarted.offer(f.local);
  await restarted.flush();
  expect(f.remote?.state).toEqual(f.local);
  expect(restarted.status).toBe("saved");
});
it("sendet Änderungen während eines laufenden Uploads danach in Reihenfolge", async () => {
  const f = fixture();
  const sync = new AccountSync(f.store, () => {});
  await sync.prepare();
  const save = f.store.save;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const start = new Promise<void>((resolve) => {
    started = resolve;
  });
  const revisions: number[] = [];
  f.store.save = async (state, revision) => {
    revisions.push(revision);
    started();
    await gate;
    return save(state, revision);
  };
  sync.offer(changed(false));
  await start;
  sync.offer(changed(true));
  release();
  await sync.flush();
  expect(revisions).toEqual([0, 1]);
  expect(f.remote?.state.settings.sound).toBe(true);
});
it("überschreibt bei konkurrierenden Geräten weder lokale noch Online-Daten", async () => {
  const f = fixture();
  f.local = changed(false);
  f.receipt = { revision: 1, fingerprint: await fingerprint(emptyState()) };
  f.remote = { state: changed(true), revision: 2 };
  const sync = new AccountSync(f.store, () => {});
  await sync.prepare();
  expect(sync.status).toBe("conflict");
  sync.offer(f.local);
  await sync.flush();
  expect(f.remote.revision).toBe(2);
  expect(f.local.settings.sound).toBe(false);
});
it("erkennt einen verlorenen Empfangsnachweis ohne doppelt zu überschreiben", async () => {
  const f = fixture();
  const sync = new AccountSync(f.store, () => {});
  await sync.prepare();
  const save = f.store.save;
  let lost = true;
  f.store.save = async (state, revision) => {
    const next = await save(state, revision);
    if (lost) {
      lost = false;
      throw new Error("Antwort verloren");
    }
    return next;
  };
  sync.offer(changed(true));
  await sync.flush();
  expect(sync.status).toBe("offline");
  await sync.flush();
  expect(sync.status).toBe("saved");
  expect(f.remote?.revision).toBe(1);
  expect(f.receipt?.revision).toBe(1);
});
it("erkennt einen Konflikt beim Upload und hält die Warteschlange an", async () => {
  const f = fixture();
  const sync = new AccountSync(f.store, () => {});
  await sync.prepare();
  f.remote = { state: changed(true), revision: 1 };
  sync.offer(changed(false));
  await sync.flush();
  expect(sync.status).toBe("conflict");
  expect(f.remote.state.settings.sound).toBe(true);
});

it("bündelt schnelle Änderungen, zeigt wartende Sicherung und lässt explizites Flush sofort zu", async () => {
  vi.useFakeTimers();
  try {
    const f = fixture();
    const save = vi.fn(f.store.save);
    f.store.save = save;
    const sync = new AccountSync(f.store, () => {});
    await sync.prepare();
    sync.offer(changed(false));
    expect(sync.status).toBe("saving");
    await vi.advanceTimersByTimeAsync(400);
    sync.offer(changed(true));
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(400);
    await sync.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(f.remote?.state.settings.sound).toBe(true);
    expect(sync.status).toBe("saved");
    sync.offer(changed(false));
    await sync.flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(f.remote?.state.settings.sound).toBe(false);
    sync.offer(changed(true));
    sync.stop();
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});

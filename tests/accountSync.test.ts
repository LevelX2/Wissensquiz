import { expect, it, vi } from "vitest";
import { AccountSync, fingerprint, type SyncStore } from "../src/accountSync";
import { CloudConflict, type SyncReceipt } from "../src/accounts";
import { emptyState, type State } from "../src/model";

const changed = (sound: boolean) => ({
  ...emptyState(),
  settings: { spoilers: true, sound },
});
function fixture() {
  let local: State | undefined;
  let receipt: SyncReceipt | undefined;
  let remote: { state: State; revision: number } | null = null;
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

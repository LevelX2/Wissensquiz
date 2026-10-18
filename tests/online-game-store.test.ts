import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import { OnlineGameStore } from "../src/onlineGameStore";
import { CloudConflict } from "../src/accounts";
let fixture: Awaited<ReturnType<typeof syncFixture>>;
const localOpen = vi.fn(() => {
  throw new Error("Keine lokale Spielstandablage erlaubt");
});
beforeAll(async () => {
  vi.stubGlobal("indexedDB", { open: localOpen });
  fixture = await syncFixture();
  await fixture.seedRanked(
    await prepareTestContent(
      importCsv(readFileSync("public/fragen.csv", "utf8")).questions,
    ),
  );
}, 30000);
afterAll(async () => {
  await fixture?.db.close();
  vi.unstubAllGlobals();
});
async function setup() {
  const { api, owner } = await fixture.client();
  const make = () => new OnlineGameStore(api, owner);
  const store = make();
  await store.open();
  return { api, owner, store, make };
}
it("öffnet einen neuen Spielstand ausschließlich über aktuelle Serverendpunkte ohne IndexedDB", async () => {
  const { api, store, make } = await setup();
  expect(store.read().questions).toEqual([]);
  expect(
    api.calls.some((c) =>
      [
        "quiz_sync_apply",
        "quiz_sync_activate",
        "quiz_sync_catalog",
        "quiz_save_state",
      ].includes(c.name),
    ),
  ).toBe(false);
  await store.update((s) => {
    s.settings.sound = false;
  });
  const fresh = make();
  await fresh.open();
  expect(fresh.read().settings.sound).toBe(false);
  expect(localOpen).not.toHaveBeenCalled();
  store.stop();
  fresh.stop();
});
it("übernimmt eine nicht bestätigte Änderung erst nach ausdrücklicher Wiederholung", async () => {
  const { api, store } = await setup(),
    before = store.read(),
    listener = vi.fn();
  store.subscribe(listener);
  api.unavailable("quiz_game_apply");
  await expect(
    store.update((s) => {
      s.settings.sound = false;
    }),
  ).rejects.toThrow();
  expect(store.read()).toEqual(before);
  expect(listener).not.toHaveBeenCalled();
  await expect(
    store.update((s) => {
      s.settings.sound = false;
    }),
  ).rejects.toThrow("ausstehende Online-Speicherung");
  await store.retry();
  expect(store.read().settings.sound).toBe(false);
  expect(listener).toHaveBeenCalledTimes(1);
  store.stop();
});
it("wiederholt verlorene Serverbestätigungen mit exakt derselben Paket-ID ohne doppelte Revision", async () => {
  const { api, store, make } = await setup(),
    revision = store.revision;
  api.lost("quiz_game_apply");
  await expect(
    store.update((s) => {
      s.settings.sound = false;
    }),
  ).rejects.toThrow("Bestätigung verloren");
  expect(store.read().settings.sound).toBe(true);
  await store.retry();
  const texts = api.calls
    .filter((c) => c.name === "quiz_game_apply")
    .map((c) => c.args.packet_text);
  expect(texts).toHaveLength(2);
  expect(texts[1]).toBe(texts[0]);
  expect(store.revision).toBe(revision + 1);
  const fresh = make();
  await fresh.open();
  expect(fresh.read().settings.sound).toBe(false);
  store.stop();
  fresh.stop();
});
it("erhält den bestätigten Stand bei Mutatorfehlern und parallelen Änderungen", async () => {
  const { store, make } = await setup(),
    before = store.read();
  await expect(
    store.update((s) => {
      s.settings.sound = false;
      throw new Error("Testabbruch");
    }),
  ).rejects.toThrow("Testabbruch");
  expect(store.read()).toEqual(before);
  const second = make();
  await second.open();
  await store.update((s) => {
    s.settings.sound = false;
  });
  await expect(
    second.update((s) => {
      s.settings.sound = false;
    }),
  ).rejects.toBeInstanceOf(CloudConflict);
  expect(second.read()).toEqual(before);
  store.stop();
  second.stop();
});
it("bestätigt Spielstandersatz und wiederholt verlorene Aktivierungsbelege ohne zweite Generation", async () => {
  const { api, store, make } = await setup();
  api.lost("quiz_game_activate");
  await expect(
    store.update(
      (s) => {
        s.settings.sound = false;
      },
      { replace: true },
    ),
  ).rejects.toThrow("Bestätigung verloren");
  await store.retry();
  const fresh = make();
  await fresh.open();
  expect(fresh.read().settings.sound).toBe(false);
  expect(api.calls.filter((c) => c.name === "quiz_game_activate")).toHaveLength(
    2,
  );
  store.stop();
  fresh.stop();
});
it("sendet bei unverändertem Spielstand kein Schreibpaket und beendet geschlossene Konten", async () => {
  const { api, store } = await setup();
  api.calls.length = 0;
  await store.update(() => {});
  expect(api.calls).toEqual([]);
  store.stop();
  expect(() => store.read()).toThrow("nicht geöffnet");
});

it("verhindert das Überschreiben einer Speicherung durch einen verzögerten Aktualisierungsabruf", async () => {
  const { api, owner } = await fixture.client();
  let hold = false,
    release!: () => void,
    received!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const responseReady = new Promise<void>((resolve) => {
    received = resolve;
  });
  const store = new OnlineGameStore(
    {
      stop: () => api.stop(),
      async call<T>(
        name: string,
        args: Record<string, unknown>,
        timeout?: number,
      ): Promise<T> {
        const value = await api.call<T>(name, args, timeout);
        if (
          hold &&
          name === "quiz_sync_scope_page" &&
          args.scope_text === '{"kind":"boot"}'
        ) {
          received();
          await gate;
        }
        return value;
      },
    },
    owner,
  );
  await store.open();
  hold = true;
  const refresh = store.refresh();
  await responseReady;
  expect(store.refresh()).toBe(refresh);
  try {
    await expect(
      store.update((s) => {
        s.settings.sound = false;
      }),
    ).rejects.toThrow("aktualisiert");
  } finally {
    release();
  }
  await refresh;
  await store.update((s) => {
    s.settings.sound = false;
  });
  expect(store.read().settings.sound).toBe(false);
  store.stop();
});

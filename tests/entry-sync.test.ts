import "fake-indexeddb/auto";
import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { importCsv } from "../src/importer";
import { emptyState, type State } from "../src/model";
import { startRound, answer } from "../src/engine";
import { validateBackup } from "../src/backupValidation";
import { EntrySync, createAccountSync } from "../src/entrySync";
import {
  prepareRelease,
  stableStringify,
  jsonEqual,
  SYNC_FORMAT,
  type PreparedRelease,
} from "../src/syncCodec";
import { read, update, restore } from "../src/storage";
import {
  readOutbox,
  readEntryHead,
  readEntryDocument,
} from "../src/entryStorage";
import { getMetadata, MissingSyncProtocol } from "../src/entryRemote";
import type { SyncStore } from "../src/accountSync";

let fixture: Awaited<ReturnType<typeof syncFixture>>, release: PreparedRelease;
const now = 1700000000000;
beforeAll(async () => {
  fixture = await syncFixture();
  release = await prepareRelease(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(0, 12),
  );
  await fixture.seed(release);
}, 30000);
afterAll(() => fixture.db.close());
async function setup(active = false) {
  const { owner, api } = await fixture.client(),
    key = `account:test:${owner}`,
    state = emptyState(structuredClone(release.questions));
  if (active)
    startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now,
    );
  await update(() => {}, validateBackup(state), key);
  const legacy: SyncStore = {
    local: () => read(key),
    receipt: async () => undefined,
    legacyRevision: async () => 0,
    remote: async () => null,
    replace: async (s) => restore(s, key),
    acknowledge: async () => {},
    save: async () => {
      throw new Error("Alter Writer darf nicht verwendet werden");
    },
  };
  const engine = () =>
    new EntrySync(
      api,
      owner,
      key,
      legacy,
      () => {},
      async () => release,
    );
  return { owner, api, key, engine, legacy };
}
it("übernimmt den lokalen Stand nach geprüftem Rücklesen und öffnet unveränderte Konten nur über Metadaten", async () => {
  const { api, key, engine } = await setup(true),
    sync = engine();
  await sync.prepare();
  expect(sync.status).toBe("saved");
  expect(await readOutbox(key)).toHaveLength(0);
  expect((await read(key))!.rounds).toHaveLength(1);
  sync.stop();
  api.calls.length = 0;
  const reopened = engine();
  await reopened.prepare();
  expect(api.calls.map((c) => c.name)).toEqual(["quiz_sync_metadata"]);
  expect(reopened.status).toBe("saved");
  reopened.stop();
});
it("nimmt ein verlorenes bestätigtes Paket nach Neustart wieder auf und schützt danach hinzugekommene Änderungen", async () => {
  const { api, key, engine } = await setup(true),
    sync = engine();
  await sync.prepare();
  const initial = (await read(key))!,
    r = initial.rounds[0],
    q = r.questions[0];
  await update(
    (s) => answer(s, r.id, q.id, q.correctId, 1000, now + 1000),
    undefined,
    key,
    { progressOnly: true },
  );
  api.lost("quiz_sync_apply");
  await sync.flush();
  expect(sync.status).toBe("offline");
  const frozen = (await readOutbox(key))[0].packet!;
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  sync.stop();
  const reopened = engine();
  await reopened.prepare();
  expect(reopened.status).toBe("saved");
  expect(await readOutbox(key)).toHaveLength(0);
  const sent = api.calls
    .filter((c) => c.name === "quiz_sync_apply")
    .map((c) => c.args.packet_text);
  expect(sent[0]).toBe(frozen);
  expect(sent[1]).toBe(frozen);
  const result = (await read(key))!;
  expect(result.events).toHaveLength(1);
  expect(result.settings.sound).toBe(false);
  expect(Buffer.byteLength(frozen)).toBeLessThan(12000);
  reopened.stop();
});
it("erkennt die eigene Aktivierung trotz verlorener Bestätigung und sendet spätere lokale Absichten anschließend", async () => {
  const { api, key, engine } = await setup();
  api.lost("quiz_sync_activate");
  const sync = engine();
  await sync.prepare();
  expect(sync.status).toBe("offline");
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  sync.stop();
  const reopened = engine();
  await reopened.prepare();
  expect(reopened.status).toBe("saved");
  expect(await readOutbox(key)).toHaveLength(0);
  expect((await read(key))!.settings.sound).toBe(false);
  reopened.stop();
});
it("erhält Offlineänderungen und macht konkurrierende Spielabsichten sichtbar; ausdrückliche Übernahme erhält eine Rückfallkopie", async () => {
  const { owner, api, key, engine } = await setup(),
    sync = engine();
  await sync.prepare();
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  api.unavailable("quiz_sync_apply");
  await sync.flush();
  expect(sync.status).toBe("offline");
  const head = (await readEntryHead(key))!;
  await api.call("quiz_sync_apply", {
    packet_text: stableStringify({
      format: SYNC_FORMAT,
      protocol: 1,
      id: crypto.randomUUID(),
      owner,
      generation: head.generation,
      expectedRevision: head.revision,
      objects: [],
      changes: [
        {
          op: "put",
          row: {
            kind: "field",
            id: "settings",
            position: 0,
            value: {
              ...(await read(key))!.settings,
              haptics: true,
              sound: true,
            },
          },
        },
      ],
    }),
  });
  sync.stop();
  const reopened = engine();
  await reopened.prepare();
  expect(reopened.status).toBe("conflict");
  expect((await read(key))!.settings.sound).toBe(false);
  await reopened.acceptRemote();
  await reopened.prepare();
  expect(reopened.status).toBe("saved");
  expect((await read(key))!.settings.haptics).toBe(true);
  expect((await read(key))!.settings.sound).toBe(true);
  reopened.stop();
});
it("lädt saubere Fremdänderungen gezielt nach, nutzt bei abgelaufenem Cursor einen vollständigen Abruf und ersetzt entfernte Runden", async () => {
  const { owner, api, key, engine } = await setup(true),
    sync = engine();
  await sync.prepare();
  sync.stop();
  const head = (await readEntryHead(key))!;
  const send = async () =>
    api.call("quiz_sync_apply", {
      packet_text: stableStringify({
        format: SYNC_FORMAT,
        protocol: 1,
        id: crypto.randomUUID(),
        owner,
        generation: head.generation,
        expectedRevision: head.revision,
        objects: [],
        changes: [
          {
            op: "put",
            row: {
              kind: "field",
              id: "settings",
              position: 0,
              value: { ...(await read(key))!.settings, sound: false },
            },
          },
        ],
      }),
    });
  await send();
  api.calls.length = 0;
  const second = engine();
  await second.prepare();
  expect(second.status).toBe("saved");
  expect(
    api.calls.find((c) => c.name === "quiz_sync_page")!.args.after_revision,
  ).toBe(head.revision);
  expect((await read(key))!.settings.sound).toBe(false);
  second.stop();
  // A replacement uses a new generation; no upsert can leave removed history.
  await restore(emptyState(release.questions), key);
  const third = engine();
  await third.prepare();
  expect(third.status).toBe("saved");
  expect((await read(key))!.rounds).toHaveLength(0);
  expect((await getMetadata(api, owner)).generation).not.toBe(head.generation);
  third.stop();
  const remote = (await readEntryHead(key))!;
  await fixture.db.query(
    "update public.quiz_account_heads set revision=revision+1,cursor_floor=revision+1 where owner_id=$1",
    [owner],
  );
  const fourth = engine();
  api.calls.length = 0;
  await fourth.prepare();
  expect(fourth.status).toBe("saved");
  expect(
    api.calls.find((c) => c.name === "quiz_sync_page")!.args.after_revision,
  ).toBe(-1);
  expect((await readEntryHead(key))!.revision).toBe(remote.revision + 1);
  fourth.stop();
});
it("prüft große ursprüngliche before-Maps samt Unicode und privaten Kataloginhalten ohne Kürzung", async () => {
  const { key, engine } = await setup(true);
  await update(
    (s) => {
      const r = s.rounds[0];
      for (let i = 0; i < 5000; i++)
        r.before[`historisch-${i}-🎬`] = {
          knowledgeId: `historisch-${i}-🎬`,
          stage: 0,
          status: "entdeckt",
          due: 0,
          lastSecure: 0,
          lastSeenAt: null,
          lastAdvancedDay: "",
          secureDays: [],
          seen: 0,
        };
      const q = s.questions.find((q) => q.id === r.questions[0].id)!;
      q.question += " – persönliche Ergänzung 🎬";
      r.questions[0] = structuredClone(q);
    },
    undefined,
    key,
  );
  const before = validateBackup((await read(key))!),
    sync = engine();
  await sync.prepare();
  expect(sync.status).toBe("saved");
  expect(jsonEqual(await read(key), before)).toBe(true);
  expect(Object.keys((await read(key))!.rounds[0].before)).toHaveLength(
    Object.keys(before.rounds[0].before).length,
  );
  sync.stop();
});
it("verwendet bei Netzwerkfehlern keinen alten Writer und begrenzt hängende Paketaufrufe", async () => {
  const { key, legacy, api, engine } = await setup();
  await expect(
    createAccountSync(
      {
        ...api,
        call: async () => {
          throw new Error("Offline");
        },
      },
      "x",
      key,
      legacy,
      () => {},
    ),
  ).rejects.toThrow("Offline");
  const fallback = await createAccountSync(
    {
      ...api,
      call: async () => {
        throw new MissingSyncProtocol();
      },
    },
    "x",
    key,
    legacy,
    () => {},
  );
  fallback.stop();
  const sync = engine();
  await sync.prepare();
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  const original = api.call;
  api.call = async (name, args, timeout) =>
    name === "quiz_sync_apply"
      ? new Promise(() => {})
      : original(name, args, timeout);
  let entered = false;
  api.call = async (name, args, timeout) => {
    if (name === "quiz_sync_apply") {
      entered = true;
      return new Promise(() => {});
    }
    return original(name, args, timeout);
  };
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const pending = sync.flush();
  await vi.waitFor(() => expect(entered).toBe(true));
  await vi.advanceTimersByTimeAsync(30001);
  await pending;
  expect(sync.status).toBe("offline");
  expect(await readOutbox(key)).toHaveLength(1);
  vi.useRealTimers();
  api.call = original;
  await sync.flush();
  expect(sync.status).toBe("saved");
  sync.stop();
});

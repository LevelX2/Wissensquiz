import "fake-indexeddb/auto";
import { expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { emptyState } from "../src/model";
import { importCsv } from "../src/importer";
import { answer, complete, startRound } from "../src/engine";
import { archiveClosedRounds } from "../src/roundArchive";
import { validateBackup } from "../src/backupValidation";
import { read, update, restore, openDatabase } from "../src/storage";
import { prepareRelease, compileState } from "../src/syncCodec";
import {
  initializeEntries,
  configureEntryCatalogs,
  rememberRelease,
  readOutbox,
  readEntryHead,
  migrationPlan,
  finishMigration,
  freezeOutbox,
  acknowledgeOutbox,
  acceptRemoteDocument,
} from "../src/entryStorage";

const questions = importCsv(
    readFileSync("public/fragen.csv", "utf8"),
  ).questions.slice(0, 12),
  now = 1700000000000;
async function initialized(name: string, active = false) {
  const key = `account:isolated:${name}`,
    state = emptyState(structuredClone(questions));
  if (active)
    startRound(
      state,
      { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now,
    );
  const checked = validateBackup(state),
    release = await prepareRelease(checked.questions);
  await update(() => {}, checked, key); // Previous version-2 layout remains a fallback.
  await rememberRelease(release);
  configureEntryCatalogs(key, [release]);
  await initializeEntries(key, checked, null, 0);
  const plan = await migrationPlan(key);
  await finishMigration(key, plan, 1, now);
  return { key, state: checked, release, generation: plan.target };
}
it("migriert Konten verlustfrei, erhält das alte Layout als Rückfall und schreibt normale Antworten samt Outbox atomar", async () => {
  const { key, state } = await initialized("answer", true),
    r = state.rounds[0],
    q = r.questions[0];
  await update(
    (s) => answer(s, r.id, q.id, q.correctId, 1000, now + 1000),
    undefined,
    key,
    { progressOnly: true },
  );
  const result = (await read(key))!,
    queue = await readOutbox(key);
  expect(result.events).toHaveLength(1);
  expect(queue).toHaveLength(1);
  expect(queue[0].delta.objects).toHaveLength(0);
  expect(Buffer.byteLength(JSON.stringify(queue[0]))).toBeLessThan(12000);
  expect(JSON.stringify(queue[0])).not.toContain(q.question);
  const db = await openDatabase(),
    tx = db.transaction("state"),
    old = tx.objectStore("state").get(key);
  await new Promise((resolve) => (tx.oncomplete = resolve));
  expect(old.result.storageFormat).toBe("quiz-local-catalog-v1");
});
it("rollt Einträge und Metadaten zurück, wenn die Warteschlange nicht dauerhaft geschrieben werden kann", async () => {
  const { key } = await initialized("atomic"),
    before = await read(key),
    head = await readEntryHead(key);
  const put = IDBObjectStore.prototype.put,
    spy = vi.spyOn(IDBObjectStore.prototype, "put");
  spy.mockImplementation(function (
    this: IDBObjectStore,
    value: unknown,
    key?: IDBValidKey,
  ) {
    if (this.name === "syncOutbox") throw new Error("Outbox nicht schreibbar");
    return put.call(this, value, key);
  });
  try {
    await expect(
      update(
        (s) => {
          s.settings.sound = !s.settings.sound;
        },
        undefined,
        key,
        { progressOnly: true },
      ),
    ).rejects.toThrow("Outbox nicht schreibbar");
  } finally {
    spy.mockRestore();
  }
  expect(await read(key)).toEqual(before);
  expect(await readEntryHead(key)).toEqual(head);
  expect(await readOutbox(key)).toHaveLength(0);
});
it("erhält feste Paket-IDs und Inhalte nach Modulneuladen und entfernt nur den bestätigten Eintrag", async () => {
  const { key, generation } = await initialized("reload");
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  const item = (await readOutbox(key))[0];
  await freezeOutbox(key, item, "unveränderlicher Paketinhalt");
  await expect(freezeOutbox(key, item, "anderer Inhalt")).rejects.toThrow(
    "unveränderlich",
  );
  await update(
    (s) => {
      s.settings.haptics = true;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  vi.resetModules();
  const fresh = await import("../src/entryStorage");
  expect((await fresh.readOutbox(key))[0]).toMatchObject({
    id: item.id,
    packet: "unveränderlicher Paketinhalt",
  });
  expect((await fresh.readEntryState(key))!.settings.haptics).toBe(true);
  await fresh.acknowledgeOutbox(key, item, generation, 2, now + 1000);
  expect(await fresh.readOutbox(key)).toHaveLength(1);
});
it("serialisiert parallele lokale Änderungen und bewahrt Änderungen während eines vollständigen Abrufs", async () => {
  const { key, release, generation } = await initialized("parallel"),
    head = (await readEntryHead(key))!;
  const incoming = await compileState((await read(key))!, [release]);
  await Promise.all([
    update(
      (s) => {
        s.settings.sound = false;
      },
      undefined,
      key,
      { progressOnly: true },
    ),
    update(
      (s) => {
        s.settings.haptics = true;
      },
      undefined,
      key,
      { progressOnly: true },
    ),
  ]);
  expect((await read(key))!.settings).toMatchObject({
    sound: false,
    haptics: true,
  });
  await expect(
    acceptRemoteDocument(key, incoming, generation, 2, head.localVersion),
  ).rejects.toThrow("Lokale Änderungen");
  expect(await readOutbox(key)).toHaveLength(2);
});
it("behandelt vollständige Wiederherstellungen als neue Generation und entfernt ausgelassene Felder und Historie", async () => {
  const { key } = await initialized("restore", true);
  await update(
    (s) => {
      s.journey = {
        version: 1,
        earned: { Horror: { difficulty: 2, familiarity: 4 } },
      };
    },
    undefined,
    key,
  );
  await restore(validateBackup(emptyState(questions)), key);
  expect((await read(key))!.rounds).toHaveLength(0);
  expect((await read(key))!.journey).toBeUndefined();
  const queue = await readOutbox(key);
  expect(queue).toHaveLength(1);
  expect(queue[0].reset).toBe(true);
  expect(queue[0].delta).toEqual({ changes: [], objects: [] });
});

it("behält alte Inhaltsobjekte für ausstehende Offlinepakete und entfernt sie erst nach vollständiger Bestätigung", async () => {
  const { key, generation } = await initialized("archive-gc", true);
  const finish = (s: ReturnType<typeof emptyState>, at: number) => {
    const r = s.rounds.at(-1)!;
    for (const q of r.questions)
      answer(
        s,
        r.id,
        q.id,
        q.correctId,
        1000,
        at + 1000 * (r.events.length + 1),
      );
    complete(s, r.id, at + 20000);
  };
  await update(
    (s) => {
      finish(s, now);
      startRound(
        s,
        { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
        now + 100000,
      );
    },
    undefined,
    key,
  );
  const first = (await readOutbox(key))[0];
  const roundRow = first.delta.changes.find(
    (c) =>
      c.op === "put" &&
      c.row.kind === "round" &&
      (c.row.value as Record<string, unknown>).status === "active",
  );
  if (!roundRow || roundRow.op !== "put")
    throw new Error("Aktive Runde fehlt.");
  const priorHash = (roundRow.row.value as Record<string, unknown>)
    .beforeObject as string;
  expect(first.delta.objects.some((o) => o.hash === priorHash)).toBe(true);
  await update(
    (s) => {
      finish(s, now + 100000);
      archiveClosedRounds(s);
    },
    undefined,
    key,
  );
  const saved = (await read(key))!,
    queue = await readOutbox(key);
  expect(queue).toHaveLength(2);
  const objectPresent = async () => {
    const db = await openDatabase(),
      tx = db.transaction("entryObjects"),
      request = tx.objectStore("entryObjects").get([key, priorHash]);
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
    return !!request.result;
  };
  await acknowledgeOutbox(key, first, generation, 2, now + 200000);
  expect(await objectPresent()).toBe(true);
  await acknowledgeOutbox(key, queue[1], generation, 3, now + 200001);
  expect(await objectPresent()).toBe(false);
  expect(await readOutbox(key)).toHaveLength(0);
  expect(validateBackup(await read(key))).toEqual(saved);
});

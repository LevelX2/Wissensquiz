import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { emptyState, type State } from "../src/model";
import { importCsv } from "../src/importer";
import { catalogKey } from "../src/localCatalog";
import {
  encodeQuestionCatalog,
  decodeQuestionCatalog,
} from "../src/catalogCodec";
import { openDatabase, read, restore, update } from "../src/storage";
import { answer, complete, startRound } from "../src/engine";
import { roundSummary } from "../src/roundSummary";

const questions = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions;
const now = 1700000000000;
async function raw(key: string) {
  const db = await openDatabase();
  return new Promise<any>((resolve, reject) => {
    const request = db.transaction("state").objectStore("state").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function writeLegacy(key: string, value: State) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

it("hebt die Datenbankversion mit erhaltenen Altständen an und sperrt schreibende Altclients", async () => {
  const legacy = emptyState(questions.slice(0, 2));
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("wissensquiz", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => {
      const db = request.result,
        tx = db.transaction("state", "readwrite");
      tx.objectStore("state").put(legacy, "database-v1");
      tx.objectStore("state").put(
        { revision: 7, fingerprint: "receipt" },
        "sync:database-v1",
      );
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
  expect((await openDatabase()).version).toBe(2);
  expect(await read("database-v1")).toEqual(legacy);
  expect(await raw("sync:database-v1")).toEqual({
    revision: 7,
    fingerprint: "receipt",
  });
  await expect(
    new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("wissensquiz", 1);
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    }),
  ).rejects.toMatchObject({ name: "VersionError" });
});

it("überführt Vollstände beim Schreiben atomar und erhält historische Snapshots, aktive Runden und Sicherungen", async () => {
  const key = "migration";
  const legacy = emptyState(questions.slice(0, 5));
  const r = startRound(
    legacy,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  answer(
    legacy,
    r.id,
    r.questions[0].id,
    r.questions[0].correctId,
    1000,
    now + 1000,
  );
  await writeLegacy(key, legacy);
  expect(await read(key)).toEqual(legacy);
  const migrated = await update(() => {}, undefined, key);
  expect(migrated).toEqual(legacy);
  expect(await read(key)).toEqual(legacy);
  expect(await raw(key)).toHaveProperty(
    "storageFormat",
    "quiz-local-catalog-v1",
  );
  expect(decodeQuestionCatalog(await raw(catalogKey(key)))).toEqual(
    legacy.questions,
  );
  await restore(JSON.parse(JSON.stringify(migrated)), "export-copy");
  expect(await read("export-copy")).toEqual(legacy);
});

it("schreibt den Katalog bei Antworten und Einstellungen nicht erneut, erkennt aber auch Änderungen innerhalb einer Frage", async () => {
  const key = "catalog-writes";
  const state = await update(() => {}, emptyState(questions), key);
  const put = vi.spyOn(IDBObjectStore.prototype, "put");
  try {
    const started = await update(
      (s) => {
        startRound(
          s,
          { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
          now,
        );
      },
      undefined,
      key,
    );
    const r = started.rounds[0],
      q = r.questions[0];
    await update(
      (s) => answer(s, r.id, q.id, q.correctId, 0, now),
      undefined,
      key,
    );
    await update(
      (s) => {
        s.settings.sound = false;
      },
      undefined,
      key,
    );
    expect(put.mock.calls.map((call) => call[1])).toEqual([key, key, key]);
    expect(await raw(catalogKey(key))).toBe(
      encodeQuestionCatalog(state.questions),
    );
    await update(
      (s) => {
        s.questions[0].context += " Ergänzung";
      },
      undefined,
      key,
    );
    expect(put.mock.calls.slice(-2).map((call) => call[1])).toEqual([
      catalogKey(key),
      key,
    ]);
    expect((await read(key))!.questions[0].context).toBe(
      state.questions[0].context + " Ergänzung",
    );
  } finally {
    put.mockRestore();
  }
});

it("rollt auch einen Fehler nach dem Katalogschreiben zurück und hält getrennte Konten und Gaststände unabhängig", async () => {
  const guest = "isolated-guest",
    account = "account:test:owner";
  const original = await update(
    () => {},
    emptyState(questions.slice(0, 2)),
    guest,
  );
  await update(() => {}, emptyState(questions.slice(2, 3)), account);
  const originalPut = IDBObjectStore.prototype.put;
  const put = vi.spyOn(IDBObjectStore.prototype, "put");
  put.mockImplementation(function (
    this: IDBObjectStore,
    value: unknown,
    key?: IDBValidKey,
  ) {
    if (key === guest) throw new Error("Schreibfehler nach Katalog");
    return originalPut.call(this, value, key);
  });
  try {
    await expect(
      update(
        (s) => {
          s.questions.push(questions[3]);
          s.settings.sound = false;
        },
        undefined,
        guest,
      ),
    ).rejects.toThrow("Schreibfehler nach Katalog");
  } finally {
    put.mockRestore();
  }
  expect(await read(guest)).toEqual(original);
  expect(decodeQuestionCatalog(await raw(catalogKey(guest)))).toEqual(
    original.questions,
  );
  await restore(emptyState(questions.slice(3, 5)), account);
  expect((await read(account))!.questions).toEqual(questions.slice(3, 5));
  expect(await read(guest)).toEqual(original);
});

it("serialisiert gleichzeitige Katalogänderungen und erkennt fehlende Kataloge statt einen leeren Stand zu speichern", async () => {
  const key = "concurrent-catalog";
  await update(() => {}, emptyState(questions.slice(0, 1)), key);
  await Promise.all(
    [1, 2].map((i) =>
      update(
        (s) => {
          s.questions.push(questions[i]);
        },
        undefined,
        key,
      ),
    ),
  );
  expect((await read(key))!.questions.map((q) => q.id)).toEqual(
    questions.slice(0, 3).map((q) => q.id),
  );
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").delete(catalogKey(key));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await expect(read(key)).rejects.toThrow("Fragenkatalog");
  await expect(update(() => {}, emptyState(), key)).rejects.toThrow(
    "Fragenkatalog",
  );
});

it("begrenzt neue Ausgangssnapshots auf Rundenziele bei gleicher historischer Auswertung", () => {
  const state = emptyState(questions.slice(0, 10));
  const earlier = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now,
  );
  for (const q of earlier.questions)
    answer(state, earlier.id, q.id, q.correctId, 0, now);
  complete(state, earlier.id, now + 1);
  const learning = structuredClone(state.learning);
  for (let i = 0; i < 1000; i++)
    state.learning[`unrelated-${i}`] = {
      ...Object.values(learning)[0],
      knowledgeId: `unrelated-${i}`,
    };
  const fullBefore = structuredClone(state.learning);
  const r = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now + 1000,
  );
  expect(Object.keys(r.before)).toEqual(
    r.questions
      .filter((q) => fullBefore[q.knowledgeId])
      .map((q) => q.knowledgeId),
  );
  expect(Object.keys(r.before).length).toBeLessThanOrEqual(10);
  const q = r.questions[0];
  if (r.before[q.knowledgeId])
    expect(r.before[q.knowledgeId]).not.toBe(state.learning[q.knowledgeId]);
  for (const q of r.questions)
    answer(state, r.id, q.id, q.correctId, 0, now + 1000);
  complete(state, r.id, now + 2000);
  expect(roundSummary(state, r)).toEqual(
    roundSummary(state, { ...r, before: fullBefore }),
  );
});

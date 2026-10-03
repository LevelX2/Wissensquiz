import "fake-indexeddb/auto";
import { expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import {
  openDatabase,
  read,
  update,
  restore,
  validateBackup,
} from "../src/storage";
import { answer, startRound } from "../src/engine";
import { catalogKey, encodeLocalState } from "../src/localCatalog";
import {
  encodeQuestionCatalog,
  decodeQuestionCatalog,
} from "../src/catalogCodec";
const questions = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions.slice(0, 5);
async function stored(key: string) {
  const db = await openDatabase();
  return new Promise<any>((resolve, reject) => {
    const req = db.transaction("state").objectStore("state").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
it("liest den veröffentlichten kompakten Stand ohne Cache und schreibt bei einer Antwort ausschließlich Fortschritt", async () => {
  const key = crypto.randomUUID(),
    legacy = emptyState(questions);
  const r = startRound(
    legacy,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    1000,
  );
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite"),
      store = tx.objectStore("state");
    store.put(encodeQuestionCatalog(legacy.questions), catalogKey(key));
    store.put(encodeLocalState(legacy, key), key);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
  const put = vi.spyOn(IDBObjectStore.prototype, "put");
  try {
    const q = r.questions[0];
    const next = await update(
      (s) => answer(s, r.id, q.id, q.correctId, 1000, 2000),
      undefined,
      key,
      { reuseCatalog: true },
    );
    expect(put.mock.calls.map((call) => call[1])).toEqual([key]);
    expect(next).not.toHaveProperty("storageFormat");
    expect(next.questions).toEqual(legacy.questions);
    expect(await read(key)).toEqual(next);
    expect(validateBackup(next)).toEqual(next);
  } finally {
    put.mockRestore();
  }
});
it("übernimmt Altstände atomar und schreibt bei Antworten nur den Spielstand", async () => {
  const key = crypto.randomUUID(),
    legacy = emptyState(questions);
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(legacy, key);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
  expect(await read(key)).toEqual(legacy);
  const initial = await update(
    (s) => {
      startRound(
        s,
        { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
        1000,
      );
    },
    undefined,
    key,
  );
  const catalogKey = (await stored(key)).questions.key;
  const r = initial.rounds[0],
    q = r.questions[0];
  const mutate = () =>
    update(
      (s) => answer(s, r.id, q.id, q.correctId, 1000, 2000),
      undefined,
      key,
      { reuseCatalog: true },
    );
  await Promise.all([mutate(), mutate()]);
  expect((await stored(key)).questions.key).toBe(catalogKey);
  const saved = (await read(key))!;
  expect(saved.events).toHaveLength(1);
  expect(saved.questions).toEqual(questions);
  expect(validateBackup(saved)).toEqual(saved);
  expect(await restore(JSON.parse(JSON.stringify(saved)), key)).toEqual(saved);
});
it("rollt Antworten und neue Kataloge bei Abbruch vollständig zurück, auch im Cache", async () => {
  const key = crypto.randomUUID();
  await update((s) => Object.assign(s, emptyState(questions)), undefined, key);
  const before = (await read(key))!,
    ref = (await stored(key)).questions.key;
  await expect(
    update(
      (s) => {
        s.questions[0].question = "Geändert";
        s.experience = 999;
        throw new Error("Abbruch");
      },
      undefined,
      key,
    ),
  ).rejects.toThrow("Abbruch");
  expect(await read(key)).toEqual(before);
  await expect(
    update(
      (s) => {
        s.questions.push(questions[0]);
      },
      undefined,
      key,
      { reuseCatalog: true },
    ),
  ).rejects.toThrow();
  expect(await read(key)).toEqual(before);
  expect((await stored(key)).questions.key).toBe(ref);
  await update(
    (s) => {
      s.questions = [...s.questions, { ...questions[0], id: "new" }];
    },
    undefined,
    key,
    { reuseCatalog: true },
  );
  const after = (await read(key))!;
  expect(after.questions).toHaveLength(6);
  expect(decodeQuestionCatalog(await stored(ref))).toEqual(after.questions);
  after.questions[0].question = "Außerhalb verändert";
  expect((await read(key))!.questions[0].question).toBe(
    before.questions[0].question,
  );
});
it("trennt Kontokataloge und erkennt externe Transaktionen über den gespeicherten Verweis", async () => {
  const a = crypto.randomUUID(),
    b = crypto.randomUUID();
  await update((s) => Object.assign(s, emptyState(questions)), undefined, a);
  await update((s) => Object.assign(s, emptyState([])), undefined, b);
  const db = await openDatabase(),
    key = catalogKey(a);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite"),
      store = tx.objectStore("state"),
      request = store.get(a);
    request.onsuccess = () => {
      const raw = request.result;
      raw.questions = { encoding: "json-field-refs-v1", key };
      store.put(encodeQuestionCatalog([questions[0]]), key);
      store.put(raw, a);
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
  expect(
    (await update(() => {}, undefined, a, { reuseCatalog: true })).questions,
  ).toHaveLength(1);
  expect((await read(b))!.questions).toHaveLength(0);
  await new Promise<void>((resolve) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").delete(key);
    tx.oncomplete = () => resolve();
  });
  // A fresh, unknown pointer cannot use a stale in-memory catalog.
  await new Promise<void>((resolve) => {
    const tx = db.transaction("state", "readwrite"),
      store = tx.objectStore("state"),
      r = store.get(a);
    r.onsuccess = () => {
      r.result.questions.key += "-missing";
      store.put(r.result, a);
    };
    tx.oncomplete = () => resolve();
  });
  await expect(read(a)).rejects.toThrow();
  await expect(
    update(() => {}, undefined, a, { reuseCatalog: true }),
  ).rejects.toThrow();
});

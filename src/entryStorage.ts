import { openDatabase, ENTRY_STORES } from "./database";
import type { State } from "./model";
import { freezeCatalog, isImmutableCatalog } from "./immutableCatalog";
import {
  compileState,
  reconstructState,
  difference,
  rowKey,
  verifyRelease,
  type CatalogRelease,
  type PreparedRelease,
  type SyncDocument,
  type SyncDelta,
  type SyncObject,
  type SyncRow,
} from "./syncCodec";

export type WriteOptions = {
  progressOnly?: boolean;
  replace?: boolean;
  reuseCatalog?: boolean;
};
export type EntryHead = {
  format: "quiz-local-entries-v1";
  localVersion: number;
  generation: string | null;
  revision: number;
  confirmedAt?: number;
  resetPending?: boolean;
};
export type OutboxItem = {
  id: string;
  sequence: number;
  generation: string | null;
  delta: SyncDelta;
  reset?: boolean;
  packet?: string;
};
export type MigrationPlan = {
  target: string;
  parent: string | null;
  revision: number;
  localVersion: number;
  rows: SyncRow[];
  objects: string[];
};
const releases = new Map<string, PreparedRelease>();
const contexts = new Map<string, PreparedRelease[]>();
const cache = new Map<
  string,
  { version: number; document: SyncDocument; state: State }
>();
const writers = new Map<string, Promise<unknown>>();
function copyForCache(state: State): State {
  const { questions, ...game } = state;
  return {
    ...structuredClone(game),
    questions: isImmutableCatalog(questions)
      ? questions
      : freezeCatalog(structuredClone(questions)),
  };
}
const range = (key: string) => IDBKeyRange.bound([key], [key, []]);
const validKey = (key: string) => {
  if (!key.startsWith("account:"))
    throw new Error("Kein Kontospielstand ausgewählt.");
};
function done(tx: IDBTransaction, failure?: () => unknown) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(failure?.() ?? tx.error);
    tx.onabort = () =>
      reject(
        failure?.() ?? tx.error ?? new Error("Kontospeicherung abgebrochen."),
      );
  });
}
export async function readEntryHead(
  key: string,
): Promise<EntryHead | undefined> {
  const db = await openDatabase(),
    tx = db.transaction("entryHeads"),
    request = tx.objectStore("entryHeads").get(key);
  await done(tx);
  return request.result;
}
export async function rememberRelease(release: PreparedRelease) {
  if (!releases.has(release.hash)) {
    const db = await openDatabase(),
      tx = db.transaction("syncReleases", "readwrite");
    const { questions: _, byContent: __, ...value } = release;
    tx.objectStore("syncReleases").put(value, release.hash);
    await done(tx);
    releases.set(release.hash, release);
  }
}
export async function cachedRelease(hash: string) {
  if (releases.has(hash)) return releases.get(hash)!;
  const db = await openDatabase(),
    tx = db.transaction("syncReleases"),
    request = tx.objectStore("syncReleases").get(hash);
  await done(tx);
  if (!request.result) return undefined;
  const prepared = await verifyRelease(request.result as CatalogRelease);
  releases.set(hash, prepared);
  return prepared;
}
export function configureEntryCatalogs(
  key: string,
  catalogs: PreparedRelease[],
) {
  validKey(key);
  contexts.set(key, catalogs);
}
export function releaseHashes(document: SyncDocument): Set<string> {
  const result = new Set<string>();
  for (const row of document.rows.values()) {
    const value = row.value as Record<string, unknown>;
    if (row.kind === "field" && row.id === "catalog") {
      const parts = value.parts as { release?: string }[] | undefined;
      parts?.forEach((part) => {
        if (part.release) result.add(part.release);
      });
    } else if (row.kind === "round") {
      (value.questions as { ref: { release?: string } }[]).forEach((q) => {
        if (q.ref?.release) result.add(q.ref.release);
      });
    }
  }
  return result;
}
export function objectHashes(document: SyncDocument): Set<string> {
  const result = new Set<string>();
  for (const row of document.rows.values()) {
    const value = row.value as Record<string, unknown>;
    if (row.kind === "field" && row.id === "catalog") {
      if (typeof value.object === "string") result.add(value.object);
      (value.parts as { objects?: string[] }[] | undefined)?.forEach((part) =>
        part.objects?.forEach((hash) => result.add(hash)),
      );
    } else if (row.kind === "round") {
      result.add(value.beforeObject as string);
      (value.questions as { ref: { object?: string } }[]).forEach((q) => {
        if (q.ref?.object) result.add(q.ref.object);
      });
    }
  }
  return result;
}
export async function readEntryDocument(
  key: string,
): Promise<{ head: EntryHead; document: SyncDocument } | undefined> {
  const first = await readEntryHead(key);
  if (!first) return undefined;
  const existing = cache.get(key);
  if (existing?.version === first.localVersion)
    return { head: first, document: existing.document };
  const db = await openDatabase(),
    tx = db.transaction(["entryHeads", "entryRows", "entryObjects"]);
  const head = tx.objectStore("entryHeads").get(key),
    rows = tx.objectStore("entryRows").getAll(range(key)),
    objects = tx.objectStore("entryObjects").getAll(range(key));
  await done(tx);
  const document: SyncDocument = {
    rows: new Map(
      (rows.result as SyncRow[]).map((row) => [rowKey(row.kind, row.id), row]),
    ),
    objects: new Map(
      (objects.result as SyncObject[]).map((object) => [object.hash, object]),
    ),
  };
  const prepared = await Promise.all(
    [...releaseHashes(document)].map(async (hash) => {
      const release = await cachedRelease(hash);
      if (!release) throw new Error("Ein lokaler historischer Katalog fehlt.");
      return release;
    }),
  );
  const state = reconstructState(document, prepared);
  cache.set(key, {
    version: head.result.localVersion,
    document,
    state: copyForCache(state),
  });
  return { head: head.result, document };
}
export async function readEntryState(key: string) {
  const value = await readEntryDocument(key);
  if (!value) return undefined;
  return structuredClone(cache.get(key)!.state);
}
export async function readOutbox(key: string): Promise<OutboxItem[]> {
  const db = await openDatabase(),
    tx = db.transaction("syncOutbox"),
    request = tx.objectStore("syncOutbox").getAll(range(key));
  await done(tx);
  return request.result;
}
export async function initializeEntries(
  key: string,
  state: State,
  generation: string | null,
  revision: number,
) {
  validKey(key);
  const document = await compileState(state, contexts.get(key));
  const head: EntryHead = {
    format: "quiz-local-entries-v1",
    localVersion: 0,
    generation,
    revision,
    resetPending: true,
  };
  const db = await openDatabase(),
    tx = db.transaction([...ENTRY_STORES], "readwrite");
  let failure: unknown;
  const request = tx.objectStore("entryHeads").get(key);
  request.onsuccess = () => {
    if (request.result) {
      failure = new Error("Der Kontostand wurde inzwischen überführt.");
      tx.abort();
      return;
    }
    for (const row of document.rows.values())
      tx.objectStore("entryRows").put(row, [key, row.kind, row.id]);
    for (const object of document.objects.values())
      tx.objectStore("entryObjects").put(object, [key, object.hash]);
    tx.objectStore("entryHeads").put(head, key);
    const item: OutboxItem = {
      id: crypto.randomUUID(),
      sequence: 0,
      generation,
      reset: true,
      delta: { objects: [], changes: [] },
    };
    tx.objectStore("syncOutbox").put(item, [key, item.sequence, item.id]);
  };
  await done(tx, () => failure);
  cache.set(key, { version: 0, document, state: copyForCache(state) });
  return state;
}
async function writeEntryMutation(
  mutator: (state: State) => void,
  key: string,
  options: WriteOptions,
): Promise<State> {
  for (let retry = 0; retry < 5; retry++) {
    const current = await readEntryDocument(key);
    if (!current) throw new Error("Kontospeicher fehlt.");
    const prior = cache.get(key)!.state;
    const { questions, ...game } = prior;
    const result = options.reuseCatalog
      ? { ...structuredClone(game), questions }
      : structuredClone(prior);
    mutator(result);
    const document = await compileState(
      result,
      contexts.get(key),
      current.document,
      !options.replace &&
        (options.progressOnly ||
          (options.reuseCatalog && result.questions === questions)),
      options.progressOnly === true && !options.replace,
    );
    const delta = difference(current.document, document);
    if (!delta.changes.length && !options.replace) return result;
    let next: EntryHead = {
      ...current.head,
      localVersion: current.head.localVersion + 1,
    };
    const db = await openDatabase(),
      tx = db.transaction(
        [
          "entryHeads",
          "entryRows",
          "entryObjects",
          "syncOutbox",
          "entryMigrations",
        ],
        "readwrite",
      );
    let conflict = false,
      failure: unknown;
    const meta = tx.objectStore("entryHeads").get(key),
      queue = tx.objectStore("syncOutbox").getAll(range(key));
    queue.onsuccess = () => {
      try {
        if (meta.result?.localVersion !== current.head.localVersion) {
          conflict = true;
          tx.abort();
          return;
        }
        // A network acknowledgement can advance the revision while this draft
        // is compiled. Preserve the live head from this write transaction.
        next = {
          ...meta.result,
          localVersion: current.head.localVersion + 1,
          resetPending: meta.result.resetPending || options.replace,
        };
        for (const change of delta.changes)
          if (change.op === "put")
            tx.objectStore("entryRows").put(change.row, [
              key,
              change.row.kind,
              change.row.id,
            ]);
          else
            tx.objectStore("entryRows").delete([key, change.kind, change.id]);
        for (const object of delta.objects)
          tx.objectStore("entryObjects").put(object, [key, object.hash]);
        if (options.replace) {
          // A previously sent packet must still be reconciled. Unsent intents
          // are explicitly superseded by this requested full replacement.
          for (const item of queue.result as OutboxItem[])
            if (!item.packet)
              tx.objectStore("syncOutbox").delete([
                key,
                item.sequence,
                item.id,
              ]);
          tx.objectStore("entryMigrations").delete(key);
        }
        const item: OutboxItem = {
          id: crypto.randomUUID(),
          sequence: next.localVersion,
          generation: next.generation,
          delta: options.replace ? { objects: [], changes: [] } : delta,
          reset: options.replace || undefined,
        };
        tx.objectStore("syncOutbox").put(item, [key, item.sequence, item.id]);
        tx.objectStore("entryHeads").put(next, key);
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    try {
      await done(tx, () => failure);
    } catch (error) {
      if (conflict) {
        cache.delete(key);
        continue;
      }
      throw error;
    }
    cache.set(key, {
      version: next.localVersion,
      document,
      state: copyForCache(result),
    });
    return result;
  }
  throw new Error(
    "Der lokale Stand hat sich während des Speicherns mehrfach geändert. Bitte erneut versuchen.",
  );
}
export async function updateEntries(
  mutator: (state: State) => void,
  key: string,
  options: WriteOptions = {},
) {
  const prior = writers.get(key) ?? Promise.resolve();
  const task = prior
    .catch(() => {})
    .then(() => writeEntryMutation(mutator, key, options));
  writers.set(key, task);
  try {
    return await task;
  } finally {
    if (writers.get(key) === task) writers.delete(key);
  }
}
export async function freezeOutbox(
  key: string,
  item: OutboxItem,
  packet: string,
) {
  const db = await openDatabase(),
    tx = db.transaction("syncOutbox", "readwrite"),
    store = tx.objectStore("syncOutbox");
  const request = store.get([key, item.sequence, item.id]);
  let failure: unknown;
  request.onsuccess = () => {
    const value = request.result as OutboxItem | undefined;
    if (!value || (value.packet && value.packet !== packet)) {
      failure = new Error("Das versandte Änderungspaket ist unveränderlich.");
      tx.abort();
      return;
    }
    store.put({ ...value, packet }, [key, item.sequence, item.id]);
  };
  await done(tx, () => failure);
}
// Only after all outgoing packets are acknowledged and no migration is staged.
// An offline packet can still need a now-unreferenced historical object.
async function pruneAcknowledgedObjects(key: string) {
  const db = await openDatabase();
  const tx = db.transaction(
    ["entryRows", "entryObjects", "syncOutbox", "entryMigrations"],
    "readwrite",
  );
  const rows = tx.objectStore("entryRows").getAll(range(key));
  const objects = tx.objectStore("entryObjects").getAllKeys(range(key));
  const migration = tx.objectStore("entryMigrations").get(key);
  const queue = tx.objectStore("syncOutbox").getAll(range(key));
  let removed = false;
  queue.onsuccess = () => {
    if (queue.result.length || migration.result) return;
    const live = objectHashes({
      rows: new Map(
        (rows.result as SyncRow[]).map((r) => [rowKey(r.kind, r.id), r]),
      ),
      objects: new Map(),
    });
    for (const id of objects.result) {
      const hash = (id as string[])[1];
      if (!live.has(hash)) {
        tx.objectStore("entryObjects").delete(id);
        removed = true;
      }
    }
  };
  await done(tx);
  if (removed) cache.delete(key);
}
export async function acknowledgeOutbox(
  key: string,
  item: OutboxItem,
  generation: string,
  revision: number,
  confirmedAt: number,
) {
  const db = await openDatabase(),
    tx = db.transaction(["syncOutbox", "entryHeads"], "readwrite");
  const request = tx.objectStore("entryHeads").get(key);
  let failure: unknown;
  request.onsuccess = () => {
    const head = request.result as EntryHead;
    if (head.generation !== generation) {
      failure = new Error("Die Kontogeneration hat sich geändert.");
      tx.abort();
      return;
    }
    tx.objectStore("syncOutbox").delete([key, item.sequence, item.id]);
    tx.objectStore("entryHeads").put({ ...head, revision, confirmedAt }, key);
  };
  await done(tx, () => failure);
  await pruneAcknowledgedObjects(key);
}
export async function migrationPlan(key: string): Promise<MigrationPlan> {
  const db = await openDatabase(),
    readTx = db.transaction("entryMigrations"),
    request = readTx.objectStore("entryMigrations").get(key);
  await done(readTx);
  if (request.result) return request.result;
  const current = await readEntryDocument(key);
  if (!current) throw new Error("Kontospeicher fehlt.");
  const plan: MigrationPlan = {
    target: crypto.randomUUID(),
    parent: current.head.generation,
    revision: current.head.revision,
    localVersion: current.head.localVersion,
    rows: [...current.document.rows.values()],
    objects: [...objectHashes(current.document)],
  };
  const tx = db.transaction(["entryMigrations", "entryHeads"], "readwrite"),
    guard = tx.objectStore("entryHeads").get(key);
  let failure: unknown;
  guard.onsuccess = () => {
    if (guard.result.localVersion !== plan.localVersion) {
      failure = new Error(
        "Während der Übernahme wurde lokal weitergespielt. Bitte erneut versuchen.",
      );
      tx.abort();
      return;
    }
    tx.objectStore("entryMigrations").put(plan, key);
  };
  await done(tx, () => failure);
  return plan;
}
export async function existingMigrationPlan(
  key: string,
): Promise<MigrationPlan | undefined> {
  const db = await openDatabase(),
    tx = db.transaction("entryMigrations"),
    request = tx.objectStore("entryMigrations").get(key);
  await done(tx);
  return request.result;
}
// Only after full equality with the operator-restored legacy snapshot, or an
// explicit conflict choice. Stale generation packets can never be rebound.
export async function rebaseLegacyGeneration(
  key: string,
  revision: number,
  expectedVersion: number,
) {
  const db = await openDatabase(),
    tx = db.transaction(
      ["entryHeads", "syncOutbox", "entryMigrations"],
      "readwrite",
    );
  const meta = tx.objectStore("entryHeads").get(key),
    queue = tx.objectStore("syncOutbox").getAll(range(key));
  let failure: unknown;
  queue.onsuccess = () => {
    const head = meta.result as EntryHead;
    if (head.localVersion !== expectedVersion) {
      failure = new Error(
        "Lokale Änderungen dürfen bei der Wiederaufnahme nicht verschwinden.",
      );
      tx.abort();
      return;
    }
    for (const item of queue.result as OutboxItem[])
      tx.objectStore("syncOutbox").delete([key, item.sequence, item.id]);
    const sequence = head.localVersion + 1,
      item: OutboxItem = {
        id: crypto.randomUUID(),
        sequence,
        generation: null,
        reset: true,
        delta: { objects: [], changes: [] },
      };
    tx.objectStore("syncOutbox").put(item, [key, sequence, item.id]);
    tx.objectStore("entryHeads").put(
      {
        ...head,
        localVersion: sequence,
        generation: null,
        revision,
        resetPending: true,
      },
      key,
    );
    tx.objectStore("entryMigrations").delete(key);
  };
  await done(tx, () => failure);
  cache.delete(key);
}
export async function finishMigration(
  key: string,
  plan: MigrationPlan,
  revision: number,
  confirmedAt: number,
) {
  const db = await openDatabase(),
    tx = db.transaction(
      ["entryMigrations", "entryHeads", "syncOutbox"],
      "readwrite",
    );
  const head = tx.objectStore("entryHeads").get(key),
    queue = tx.objectStore("syncOutbox").getAll(range(key));
  let failure: unknown;
  queue.onsuccess = () => {
    const current = head.result as EntryHead;
    if (current.generation !== plan.parent) {
      failure = new Error("Die Kontogeneration hat sich geändert.");
      tx.abort();
      return;
    }
    for (const item of queue.result as OutboxItem[]) {
      if (item.sequence <= plan.localVersion)
        tx.objectStore("syncOutbox").delete([key, item.sequence, item.id]);
      else
        tx.objectStore("syncOutbox").put({ ...item, generation: plan.target }, [
          key,
          item.sequence,
          item.id,
        ]);
    }
    tx.objectStore("entryHeads").put(
      {
        ...current,
        generation: plan.target,
        revision,
        confirmedAt,
        resetPending: (queue.result as OutboxItem[]).some(
          (item) => item.reset && item.sequence > plan.localVersion,
        ),
      },
      key,
    );
    tx.objectStore("entryMigrations").delete(key);
  };
  await done(tx, () => failure);
}
export async function acceptRemoteDocument(
  key: string,
  document: SyncDocument,
  generation: string,
  revision: number,
  expectedVersion?: number,
  allowPending = false,
) {
  validKey(key);
  const catalogs = await Promise.all(
    [...releaseHashes(document)].map(async (hash) => {
      const release = await cachedRelease(hash);
      if (!release) throw new Error("Ein historischer Katalog fehlt.");
      return release;
    }),
  );
  const state = reconstructState(document, catalogs);
  const prior = await readEntryDocument(key);
  const delta =
    prior?.head.generation === generation
      ? difference(prior.document, document)
      : undefined;
  const db = await openDatabase(),
    tx = db.transaction(
      [
        "entryHeads",
        "entryRows",
        "entryObjects",
        "syncOutbox",
        "entryMigrations",
      ],
      "readwrite",
    );
  const meta = tx.objectStore("entryHeads").get(key),
    rows = tx.objectStore("entryRows").getAllKeys(range(key)),
    queue = tx.objectStore("syncOutbox").getAll(range(key));
  let failure: unknown,
    version = 0;
  queue.onsuccess = () => {
    try {
      const head = meta.result as EntryHead | undefined;
      if (
        head?.localVersion !== expectedVersion ||
        (!allowPending && queue.result.length)
      )
        throw new Error(
          "Lokale Änderungen dürfen beim Abruf nicht verschwinden.",
        );
      version = (head?.localVersion ?? -1) + 1;
      if (delta) {
        for (const change of delta.changes)
          if (change.op === "put")
            tx.objectStore("entryRows").put(change.row, [
              key,
              change.row.kind,
              change.row.id,
            ]);
          else
            tx.objectStore("entryRows").delete([key, change.kind, change.id]);
      } else {
        for (const row of rows.result) tx.objectStore("entryRows").delete(row);
        for (const row of document.rows.values())
          tx.objectStore("entryRows").put(row, [key, row.kind, row.id]);
      }
      for (const object of delta?.objects ?? document.objects.values())
        tx.objectStore("entryObjects").put(object, [key, object.hash]);
      if (allowPending)
        for (const item of queue.result as OutboxItem[])
          tx.objectStore("syncOutbox").delete([key, item.sequence, item.id]);
      tx.objectStore("entryMigrations").delete(key);
      tx.objectStore("entryHeads").put(
        {
          format: "quiz-local-entries-v1",
          localVersion: version,
          generation,
          revision,
          confirmedAt: Date.now(),
        } satisfies EntryHead,
        key,
      );
    } catch (error) {
      failure = error;
      tx.abort();
    }
  };
  await done(tx, () => failure);
  cache.set(key, { version, document, state: copyForCache(state) });
  return state;
}

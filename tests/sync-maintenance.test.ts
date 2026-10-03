import "fake-indexeddb/auto";
import { beforeAll, afterAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import {
  prepareRelease,
  reconstructState,
  jsonEqual,
  sha256,
  stableStringify,
  SYNC_FORMAT,
  type PreparedRelease,
} from "../src/syncCodec";
import { read, update, restore } from "../src/storage";
import { validateBackup } from "../src/backupValidation";
import { EntrySync, createAccountSync } from "../src/entrySync";
import { readEntryHead, readOutbox } from "../src/entryStorage";
import { downloadDocument, getMetadata } from "../src/entryRemote";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
import { fingerprint, type SyncStore } from "../src/accountSync";
import type { SyncReceipt } from "../src/accounts";

let fixture: Awaited<ReturnType<typeof syncFixture>>,
  release: PreparedRelease,
  owner: string,
  key: string,
  api: Awaited<
    ReturnType<Awaited<ReturnType<typeof syncFixture>>["client"]>
  >["api"],
  legacy: SyncStore;
let receipt: SyncReceipt | undefined;
beforeAll(async () => {
  fixture = await syncFixture();
  release = await prepareRelease(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(0, 12),
  );
  await fixture.seed(release);
  ({ owner, api } = await fixture.client());
  key = `account:maintenance:${owner}`;
  const state = emptyState(release.questions);
  await update(() => {}, state, key);
  await fixture.db.query(
    "insert into public.quiz_saves(owner_id,state,revision) values($1,$2,1)",
    [owner, state],
  );
  legacy = {
    local: () => read(key),
    receipt: async () => receipt,
    legacyRevision: async () => 1,
    remote: async () => {
      const row = (
        await fixture.db.query<{ state: unknown; revision: number }>(
          "select state,revision from public.quiz_saves where owner_id=$1",
          [owner],
        )
      ).rows[0];
      return row
        ? {
            state: validateBackup(await decodeCloudState(row.state)),
            revision: row.revision,
          }
        : null;
    },
    replace: (state) => restore(state, key),
    acknowledge: async (value) => {
      receipt = value;
    },
    save: async (state, revision) =>
      api.call<number>("quiz_save_state", {
        payload: await encodeCloudState(state),
        expected_revision: revision,
        expected_owner: owner,
      }),
  };
}, 30000);
afterAll(() => fixture?.db.close());
it("erhält die alte Quelle ohne doppelte Payloadkopie und verifiziert den aktuellen Export vor Bereinigung", async () => {
  const sync = new EntrySync(
    api,
    owner,
    key,
    legacy,
    () => {},
    async () => release,
  );
  await sync.prepare();
  expect(sync.status).toBe("saved");
  const old = (
    await fixture.db.query<{ revision: number; state: unknown }>(
      "select revision,state from public.quiz_saves where owner_id=$1",
      [owner],
    )
  ).rows[0];
  expect(old.revision).toBe(1);
  expect(
    (
      await fixture.db.query<{ state: unknown }>(
        "select state from public.quiz_sync_legacy_archives where owner_id=$1",
        [owner],
      )
    ).rows[0].state,
  ).toBeNull();
  await update(
    (s) => {
      s.settings.sound = false;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  await sync.flush();
  const meta = await getMetadata(api, owner),
    download = await downloadDocument(
      api,
      owner,
      meta.generation!,
      meta.revision,
    ),
    snapshot = reconstructState(download.document, download.catalogs);
  expect(jsonEqual(snapshot, await read(key))).toBe(true);
  const hash = await sha256(JSON.stringify(snapshot));
  await expect(
    fixture.db.query(
      "select quiz_sync_internal.release_fallback($1,$2,$3,$4)",
      [owner, meta.generation, meta.revision - 1, hash],
    ),
  ).rejects.toThrow("revision_conflict");
  expect(
    (
      await fixture.db.query(
        "select * from public.quiz_saves where owner_id=$1",
        [owner],
      )
    ).rows,
  ).toHaveLength(1);
  await fixture.db.query(
    "select quiz_sync_internal.release_fallback($1,$2,$3,$4)",
    [owner, meta.generation, meta.revision, hash],
  );
  expect(
    (
      await fixture.db.query(
        "select * from public.quiz_saves where owner_id=$1",
        [owner],
      )
    ).rows,
  ).toHaveLength(0);
  expect(
    (
      await fixture.db.query<{ result: boolean }>(
        "select quiz_sync_internal.compact_empty_legacy() as result",
      )
    ).rows[0].result,
  ).toBe(true);
  sync.stop();
});
it("stellt beim kontrollierten Rückfall den neuesten Stand mit neuer Revision her und sperrt alte Generationspakete", async () => {
  const head = (await readEntryHead(key))!,
    state = (await read(key))!,
    payload = await encodeCloudState(state),
    text = JSON.stringify(payload),
    hash = await sha256(text);
  await expect(
    fixture.db.query("select quiz_sync_internal.rollback($1,$2,$3,$4,$5)", [
      owner,
      head.generation,
      head.revision,
      text,
      "0".repeat(64),
    ]),
  ).rejects.toThrow("verified_backup_required");
  const restored = (
    await fixture.db.query<{ revision: number }>(
      "select quiz_sync_internal.rollback($1,$2,$3,$4,$5) as revision",
      [owner, head.generation, head.revision, text, hash],
    )
  ).rows[0].revision;
  expect(restored).toBe(head.revision + 1);
  const meta = await getMetadata(api, owner);
  expect(meta).toMatchObject({
    generation: null,
    revision: restored,
    paused: true,
  });
  expect(jsonEqual((await legacy.remote())!.state, state)).toBe(true);
  await expect(
    api.call("quiz_sync_apply", {
      packet_text: stableStringify({
        format: SYNC_FORMAT,
        protocol: 1,
        id: crypto.randomUUID(),
        owner,
        generation: head.generation,
        expectedRevision: head.revision,
        objects: [],
        changes: [],
      }),
    }),
  ).rejects.toThrow();
  await expect(
    api.call("quiz_sync_begin", {
      expected_owner: owner,
      target_generation: crypto.randomUUID(),
      parent_generation: null,
      expected_revision: restored,
    }),
  ).rejects.toThrow("sync_protocol_paused");
  const fallback = await createAccountSync(api, owner, key, legacy, () => {});
  await fallback.prepare();
  const changed = await update(
    (s) => {
      s.settings.haptics = true;
    },
    undefined,
    key,
    { progressOnly: true },
  );
  fallback.offer(changed);
  await fallback.flush();
  expect(fallback.status).toBe("saved");
  expect((await legacy.remote())!.state.settings.haptics).toBe(true);
  fallback.stop();
  const revision = (await getMetadata(api, owner)).revision;
  await fixture.db.query("select quiz_sync_internal.resume_protocol($1,$2)", [
    owner,
    revision,
  ]);
  const resumed = new EntrySync(
    api,
    owner,
    key,
    legacy,
    () => {},
    async () => release,
  );
  await resumed.prepare();
  expect(resumed.status).toBe("saved");
  expect(await readOutbox(key)).toHaveLength(0);
  expect((await readEntryHead(key))!.generation).not.toBe(head.generation);
  resumed.stop();
});
it("gibt Bereinigung, Rückfall und Wiederfreigabe ausschließlich dem Betreiber", async () => {
  for (const role of ["anon", "authenticated"]) {
    await fixture.db.exec(`set role ${role}`);
    try {
      await expect(
        fixture.db.query("select quiz_sync_internal.compact_empty_legacy()"),
      ).rejects.toThrow("permission denied");
      await expect(
        fixture.db.query(
          "select quiz_sync_internal.release_fallback($1,$2,0,$3)",
          [owner, crypto.randomUUID(), "0".repeat(64)],
        ),
      ).rejects.toThrow("permission denied");
      await expect(
        fixture.db.query("select quiz_sync_internal.resume_protocol($1,0)", [
          owner,
        ]),
      ).rejects.toThrow("permission denied");
      await expect(
        fixture.db.query("select * from public.quiz_sync_maintenance_receipts"),
      ).rejects.toThrow("permission denied");
    } finally {
      await fixture.db.exec("reset role");
    }
  }
});

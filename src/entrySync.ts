import {
  AccountSync,
  fingerprint,
  type SyncStatus,
  type SyncStore,
} from "./accountSync";
import { CloudConflict, CloudSaveError, keepAccountRecovery } from "./accounts";
import { emptyState, type State } from "./model";
import { validateBackup } from "./backupValidation";
import { loadOfficialCatalog } from "./officialCatalog";
import { requestWithin } from "./request";
import {
  SYNC_FORMAT,
  SYNC_PROTOCOL,
  stableStringify,
  jsonEqual,
  reconstructState,
  type PreparedRelease,
  type SyncDocument,
  type SyncPacket,
} from "./syncCodec";
import {
  acceptRemoteDocument,
  acknowledgeOutbox,
  configureEntryCatalogs,
  existingMigrationPlan,
  finishMigration,
  freezeOutbox,
  initializeEntries,
  migrationPlan,
  readEntryDocument,
  readEntryHead,
  readOutbox,
  rememberRelease,
  releaseHashes,
  type OutboxItem,
} from "./entryStorage";
import {
  CursorExpired,
  DownloadChanged,
  MissingSyncProtocol,
  downloadDocument,
  getMetadata,
  getRelease,
  uploadObject,
  type SyncConfirmation,
  type SyncMetadata,
  type SyncRemote,
} from "./entryRemote";

type Notify = (
  status: SyncStatus,
  detail?: string,
  confirmedAt?: number,
) => void;
export type SyncController = Pick<
  AccountSync,
  "status" | "confirmedAt" | "prepare" | "offer" | "flush" | "stop"
> & { acceptRemote?: () => Promise<void> };
export async function createAccountSync(
  api: SyncRemote,
  owner: string,
  key: string,
  legacy: SyncStore,
  notify: Notify,
): Promise<SyncController> {
  try {
    const metadata = await getMetadata(api, owner);
    return new EntrySync(api, owner, key, legacy, notify, undefined, metadata);
  } catch (error) {
    // Only an explicitly absent protocol permits the controlled legacy rollout.
    // Network errors and a rejected identity must never choose an older writer.
    if (!(error instanceof MissingSyncProtocol) || (await readEntryHead(key)))
      throw error;
    api.stop();
    return new AccountSync(legacy, notify);
  }
}

export class EntrySync implements SyncController {
  status: SyncStatus = "loading";
  confirmedAt: number | undefined;
  private stopped = false;
  private running?: Promise<void>;
  private timer?: ReturnType<typeof setTimeout>;
  private offered = 0;
  private catalogs: PreparedRelease[] = [];
  constructor(
    private api: SyncRemote,
    private owner: string,
    private key: string,
    private legacy: SyncStore,
    private notify: Notify,
    private official: () => Promise<PreparedRelease> = () =>
      loadOfficialCatalog((hash) => getRelease(api, hash)),
    private metadata?: SyncMetadata,
  ) {}
  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
    this.api.stop();
  }
  private report(status: SyncStatus, detail = "") {
    this.status = status;
    if (!this.stopped) this.notify(status, detail, this.confirmedAt);
  }
  private async call<T>(
    name: string,
    args: Record<string, unknown>,
  ): Promise<T> {
    if (this.stopped) throw new Error("Kontosynchronisierung beendet.");
    return requestWithin(() => this.api.call<T>(name, args, 30_000), 30_000);
  }
  private async useCatalogs(catalogs: PreparedRelease[]) {
    this.catalogs = [
      ...new Map(
        [...this.catalogs, ...catalogs].map((release) => [
          release.hash,
          release,
        ]),
      ).values(),
    ];
    await Promise.all(catalogs.map(rememberRelease));
    configureEntryCatalogs(this.key, this.catalogs);
  }
  async prepare() {
    await this.useCatalogs([await this.official()]);
    let metadata = this.metadata ?? (await getMetadata(this.api, this.owner));
    this.metadata = undefined;
    let head = await readEntryHead(this.key);
    if (!head) {
      const [local, receipt] = await Promise.all([
        this.legacy.local(),
        this.legacy.receipt(),
      ]);
      const localHash = local ? await fingerprint(local) : "";
      const dirty = !!local && (!receipt || localHash !== receipt.fingerprint);
      if (metadata.generation) {
        const loaded = await this.consistentDownload(metadata);
        if (
          dirty &&
          !jsonEqual(
            validateBackup(local),
            reconstructState(loaded.document, loaded.catalogs),
          )
        ) {
          this.report("conflict");
          return;
        }
        await acceptRemoteDocument(
          this.key,
          loaded.document,
          loaded.metadata.generation!,
          loaded.metadata.revision,
        );
        metadata = loaded.metadata;
      } else {
        const remote = await requestWithin((signal) =>
          this.legacy.remote(signal),
        );
        // The legacy read carries its own revision; recheck it before beginning
        // a generation so a concurrent legacy writer remains a visible conflict.
        const revision =
          receipt?.revision ?? (await this.legacy.legacyRevision());
        const equal =
          local &&
          remote &&
          jsonEqual(validateBackup(local), validateBackup(remote.state));
        if (dirty && remote && !equal && remote.revision !== revision) {
          this.report("conflict");
          return;
        }
        const selected =
          equal || !dirty ? (remote?.state ?? local ?? emptyState()) : local!;
        await initializeEntries(
          this.key,
          validateBackup(selected),
          null,
          remote?.revision ?? 0,
        );
      }
      head = await readEntryHead(this.key);
    }
    if (this.stopped) return;
    const stored = await readEntryDocument(this.key);
    if (stored)
      await this.useCatalogs(
        await Promise.all(
          [...releaseHashes(stored.document)].map((hash) =>
            getRelease(this.api, hash),
          ),
        ),
      );
    const plan = await existingMigrationPlan(this.key);
    if (plan && metadata.generation === plan.target) {
      await finishMigration(this.key, plan, plan.revision + 1, Date.now());
      head = await readEntryHead(this.key);
    }
    this.confirmedAt = head?.confirmedAt;
    const queue = await readOutbox(this.key);
    // Reconcile the exact durable packet first. A later foreign revision is
    // still handled as a conflict before any further local intent is sent.
    if (queue[0]?.packet) {
      try {
        await this.send(queue[0]);
      } catch (error) {
        this.failure(error);
        return;
      }
      head = await readEntryHead(this.key);
      metadata = await getMetadata(this.api, this.owner);
    }
    const pending = await readOutbox(this.key);
    if (
      head!.generation !== metadata.generation ||
      head!.revision !== metadata.revision
    ) {
      if (pending.length) {
        this.report("conflict");
        return;
      }
      const current = await readEntryDocument(this.key);
      const loaded = await this.consistentDownload(
        metadata,
        current?.document,
        head!.generation,
        head!.revision,
      );
      await this.useCatalogs(loaded.catalogs);
      await acceptRemoteDocument(
        this.key,
        loaded.document,
        loaded.metadata.generation!,
        loaded.metadata.revision,
        head!.localVersion,
      );
    }
    if (pending.length) {
      this.report("saving");
      await this.flush();
    } else this.report("saved");
  }
  private async consistentDownload(
    metadata: SyncMetadata,
    previous?: SyncDocument,
    generation?: string | null,
    revision?: number,
  ) {
    let full =
      !previous ||
      generation !== metadata.generation ||
      (revision ?? -1) < metadata.cursorFloor;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (!metadata.generation)
        throw new Error("Online-Spielstand nicht gefunden.");
      try {
        const loaded = await downloadDocument(
          this.api,
          this.owner,
          metadata.generation,
          metadata.revision,
          full ? -1 : revision!,
          full ? undefined : previous,
        );
        const final = await getMetadata(this.api, this.owner);
        if (
          final.generation !== metadata.generation ||
          final.revision !== metadata.revision
        )
          throw new DownloadChanged();
        return { ...loaded, metadata: final };
      } catch (error) {
        if (!(
          error instanceof DownloadChanged || error instanceof CursorExpired
        ))
          throw error;
        if (error instanceof CursorExpired) full = true;
        metadata = await getMetadata(this.api, this.owner);
        if (generation !== metadata.generation) full = true;
      }
    }
    throw new Error(
      "Während des Abrufs wurde mehrfach auf einem anderen Gerät gespielt. Bitte erneut versuchen.",
    );
  }
  offer(_state: State) {
    if (this.stopped || this.status === "conflict") return;
    this.offered++;
    if (this.status === "saved") this.report("saving");
    if (!this.running && !this.timer)
      this.timer = setTimeout(() => {
        void this.flush();
      }, 800);
  }
  flush(): Promise<void> {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (this.running) return this.running;
    const offered = this.offered;
    this.running = this.drain().finally(() => {
      this.running = undefined;
      if (
        !this.stopped &&
        this.offered !== offered &&
        ["saved", "saving"].includes(this.status)
      )
        void this.flush();
    });
    return this.running;
  }
  private failure(error: unknown) {
    if (error instanceof CloudConflict) this.report("conflict");
    else
      this.report(
        "offline",
        error instanceof CloudSaveError ? error.message : "",
      );
  }
  private async drain() {
    if (this.stopped || this.status === "conflict") return;
    try {
      while (!this.stopped) {
        const queue = await readOutbox(this.key);
        if (!queue.length) {
          this.report("saved");
          return;
        }
        this.report("saving");
        if (queue[0].reset && !queue[0].packet) await this.migrate();
        else await this.send(queue[0]);
      }
    } catch (error) {
      if (!this.stopped) this.failure(error);
    }
  }
  private async send(item: OutboxItem) {
    const head = (await readEntryHead(this.key))!;
    if (!head.generation) throw new Error("Die Kontogeneration fehlt.");
    let text = item.packet;
    if (!text) {
      for (const object of item.delta.objects)
        await uploadObject(this.api, this.owner, head.generation, object);
      const packet: SyncPacket = {
        format: SYNC_FORMAT,
        protocol: SYNC_PROTOCOL,
        id: item.id,
        generation: head.generation,
        owner: this.owner,
        expectedRevision: head.revision,
        changes: item.delta.changes,
        objects: [],
      };
      text = stableStringify(packet);
      await freezeOutbox(this.key, item, text);
    }
    const packet = JSON.parse(text) as SyncPacket;
    const confirmation = await this.call<SyncConfirmation>("quiz_sync_apply", {
      packet_text: text,
    });
    if (
      confirmation.id !== packet.id ||
      confirmation.generation !== packet.generation ||
      confirmation.revision !== packet.expectedRevision + 1 ||
      !Number.isFinite(confirmation.confirmedAt)
    )
      throw new Error("Der Speicherbeleg passt nicht zum Änderungspaket.");
    if (this.stopped) return;
    await acknowledgeOutbox(
      this.key,
      item,
      packet.generation,
      confirmation.revision,
      confirmation.confirmedAt,
    );
    this.confirmedAt = confirmation.confirmedAt;
  }
  private async migrate() {
    const plan = await migrationPlan(this.key),
      current = (await readEntryDocument(this.key))!;
    const expected: SyncDocument = {
      rows: new Map(plan.rows.map((row) => [`${row.kind}:${row.id}`, row])),
      objects: current.document.objects,
    };
    const expectedState = reconstructState(expected, this.catalogs);
    await this.call("quiz_sync_begin", {
      expected_owner: this.owner,
      target_generation: plan.target,
      parent_generation: plan.parent,
      expected_revision: plan.revision,
    });
    for (const hash of plan.objects) {
      const object = current.document.objects.get(hash);
      if (!object) throw new Error("Ein privater Inhalt der Übernahme fehlt.");
      await uploadObject(this.api, this.owner, plan.target, object);
    }
    // Bound each staging transaction independently, including unusually large
    // legacy reports. All staged rows are frozen before reconstruction is read.
    let batch: typeof plan.rows = [],
      size = 0;
    const stage = async () => {
      if (batch.length)
        await this.call("quiz_sync_stage", {
          expected_owner: this.owner,
          target_generation: plan.target,
          changes: batch.map((row) => ({ op: "put", row })),
        });
      batch = [];
      size = 0;
    };
    for (const row of plan.rows) {
      const bytes = new TextEncoder().encode(JSON.stringify(row)).byteLength;
      if (batch.length && (batch.length >= 200 || size + bytes > 1024 * 1024))
        await stage();
      batch.push(row);
      size += bytes;
    }
    await stage();
    await this.call("quiz_sync_seal", {
      expected_owner: this.owner,
      target_generation: plan.target,
      row_count: plan.rows.length,
      object_count: plan.objects.length,
    });
    const loaded = await downloadDocument(this.api, this.owner, plan.target, 0);
    if (
      !jsonEqual(
        expectedState,
        reconstructState(loaded.document, loaded.catalogs),
      )
    )
      throw new Error(
        "Der vorbereitete Online-Stand ist nicht vollständig fachlich gleich.",
      );
    await this.useCatalogs(loaded.catalogs);
    const confirmed = await this.call<SyncMetadata>("quiz_sync_activate", {
      expected_owner: this.owner,
      target_generation: plan.target,
    });
    if (
      confirmed.generation !== plan.target ||
      confirmed.revision !== plan.revision + 1
    )
      throw new Error("Die Übernahme wurde nicht bestätigt.");
    if (this.stopped) return;
    await finishMigration(this.key, plan, confirmed.revision, Date.now());
    this.confirmedAt = Date.now();
  }
  async acceptRemote() {
    const head = await readEntryHead(this.key),
      metadata = await getMetadata(this.api, this.owner);
    if (!metadata.generation) {
      const remote = await requestWithin((signal) =>
        this.legacy.remote(signal),
      );
      if (!remote) throw new Error("Online-Spielstand nicht gefunden.");
      await this.legacy.replace(remote.state);
      await this.legacy.acknowledge({
        revision: remote.revision,
        fingerprint: await fingerprint(remote.state),
        confirmedAt: Date.now(),
      });
    } else {
      const loaded = await this.consistentDownload(metadata);
      await keepAccountRecovery(this.key);
      await this.useCatalogs(loaded.catalogs);
      await acceptRemoteDocument(
        this.key,
        loaded.document,
        loaded.metadata.generation!,
        loaded.metadata.revision,
        head?.localVersion,
        true,
      );
    }
    this.report("loading");
  }
}

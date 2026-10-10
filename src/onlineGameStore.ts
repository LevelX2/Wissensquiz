import { emptyState, type State } from "./model";
import { validateBackup } from "./backupValidation";
import { freezeCatalog } from "./immutableCatalog";
import { CloudConflict } from "./accounts";
import type { SyncStatus } from "./syncTypes";
import type { WriteOptions } from "./syncTypes";
import {
  compileState,
  difference,
  reconstructState,
  stableStringify,
  SYNC_FORMAT,
  SYNC_PROTOCOL,
  type PreparedRelease,
  type SyncDocument,
  type SyncPacket,
} from "./syncCodec";
import {
  getMetadata,
  downloadDocument,
  uploadObject,
  type SyncRemote,
  type SyncConfirmation,
  type SyncMetadata,
} from "./entryRemote";

// Only the server persists progress. These objects live in this open tab's RAM.
export class OnlineGameStore {
  private state?: State;
  private document?: SyncDocument;
  private metadata?: SyncMetadata;
  private catalogs: PreparedRelease[] = [];
  private writing = false;
  private stopped = false;
  private pending?: {
    state: State;
    document: SyncDocument;
    packet?: SyncPacket;
    text?: string;
    replacement?: { generation: string; parent: string; revision: number };
  };
  private listeners = new Set<(state: State) => void>();
  constructor(
    private api: SyncRemote,
    private owner: string,
    private official: () => Promise<PreparedRelease>,
    private legacyRemote: () => Promise<{
      state: State;
      revision: number;
    } | null>,
    private notify: (
      status: SyncStatus,
      confirmedAt?: number,
    ) => void = () => {},
  ) {}
  subscribe(listener: (state: State) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  stop() {
    this.stopped = true;
    this.api.stop();
    this.listeners.clear();
    this.state = undefined;
    this.document = undefined;
    this.pending = undefined;
    this.catalogs = [];
  }
  read(): State {
    if (this.stopped || !this.state)
      throw new Error("Der Online-Spielstand ist nicht geöffnet.");
    return this.copy(this.state);
  }
  private copy(state: State) {
    const { questions, rounds, ...progress } = state;
    const copied = structuredClone({
      ...progress,
      rounds: rounds.map(({ questions: _, ...round }) => round),
    });
    return {
      ...copied,
      questions: freezeCatalog(questions),
      // Historical question contents are immutable. Copy each round's mutable
      // header and question list, without copying all explanation texts again.
      rounds: copied.rounds.map((round, index) => ({
        ...round,
        questions: [...freezeCatalog(rounds[index].questions)],
      })),
    };
  }
  async open() {
    const official = await this.official();
    if (this.stopped) return;
    this.catalogs = [official];
    let metadata = await getMetadata(this.api, this.owner);
    if (this.stopped) return;
    if (metadata.paused)
      throw new Error("Der Online-Speicherdienst ist zurzeit nicht verfügbar.");
    if (!metadata.generation) {
      // Reuse the existing server activation flow, without any device copies.
      const previous = await this.legacyRemote();
      const state = validateBackup(previous?.state ?? emptyState());
      metadata = await this.activate(
        state,
        null,
        previous?.revision ?? metadata.revision,
        crypto.randomUUID(),
      );
    }
    const loaded = await downloadDocument(
      this.api,
      this.owner,
      metadata.generation!,
      metadata.revision,
    );
    if (this.stopped) return;
    this.catalogs = [
      ...new Map(
        [...this.catalogs, ...loaded.catalogs].map((r) => [r.hash, r]),
      ).values(),
    ];
    this.metadata = metadata;
    this.document = loaded.document;
    this.state = this.copy(reconstructState(loaded.document, this.catalogs));
    this.notify("saved", Date.now());
  }
  private async activate(
    state: State,
    parent: string | null,
    revision: number,
    generation: string,
  ): Promise<SyncMetadata> {
    const document = await compileState(state, this.catalogs);
    await this.api.call("quiz_sync_begin", {
      expected_owner: this.owner,
      target_generation: generation,
      parent_generation: parent,
      expected_revision: revision,
    });
    for (const object of document.objects.values())
      await uploadObject(this.api, this.owner, generation, object);
    const rows = [...document.rows.values()];
    let batch: typeof rows = [],
      bytes = 0;
    const stage = async () => {
      if (batch.length)
        await this.api.call("quiz_sync_stage", {
          expected_owner: this.owner,
          target_generation: generation,
          changes: batch.map((row) => ({ op: "put", row })),
        });
      batch = [];
      bytes = 0;
    };
    for (const row of rows) {
      const size = new TextEncoder().encode(JSON.stringify(row)).byteLength;
      if (batch.length && (batch.length >= 200 || bytes + size > 1024 * 1024))
        await stage();
      batch.push(row);
      bytes += size;
    }
    await stage();
    await this.api.call("quiz_sync_seal", {
      expected_owner: this.owner,
      target_generation: generation,
      row_count: rows.length,
      object_count: document.objects.size,
    });
    const staged = await downloadDocument(this.api, this.owner, generation, 0);
    if (
      stableStringify(reconstructState(staged.document, staged.catalogs)) !==
      stableStringify(state)
    )
      throw new Error("Der vorbereitete Online-Spielstand ist unvollständig.");
    const metadata = await this.api.call<SyncMetadata>("quiz_sync_activate", {
      expected_owner: this.owner,
      target_generation: generation,
    });
    if (
      metadata.generation !== generation ||
      metadata.revision !== revision + 1
    )
      throw new Error("Die Online-Speicherung wurde nicht bestätigt.");
    return metadata;
  }
  async update(
    mutator: (state: State) => void,
    options: WriteOptions = {},
  ): Promise<State> {
    if (this.writing)
      throw new Error("Dein Spielstand wird gerade online gespeichert.");
    if (this.pending)
      throw new Error(
        "Bitte bestätige zuerst die ausstehende Online-Speicherung mit „Erneut versuchen“.",
      );
    if (!this.document || !this.metadata?.generation)
      throw new Error("Der Online-Spielstand fehlt.");
    this.writing = true;
    try {
      const next = this.read();
      if (!options.reuseCatalog)
        next.questions = structuredClone(next.questions);
      mutator(next);
      const document = await compileState(
        next,
        this.catalogs,
        this.document,
        next.questions === this.state!.questions,
        options.progressOnly === true,
      );
      const delta = difference(this.document, document);
      if (!delta.changes.length && !delta.objects.length) return this.read();
      if (options.replace || delta.changes.length > 2000) {
        this.pending = {
          state: next,
          document: await compileState(next, this.catalogs),
          replacement: {
            generation: crypto.randomUUID(),
            parent: this.metadata.generation,
            revision: this.metadata.revision,
          },
        };
        return await this.sendPending();
      }
      const packet: SyncPacket = {
        format: SYNC_FORMAT,
        protocol: SYNC_PROTOCOL,
        id: crypto.randomUUID(),
        generation: this.metadata.generation,
        expectedRevision: this.metadata.revision,
        owner: this.owner,
        changes: delta.changes,
        objects: [],
      };
      this.pending = {
        state: next,
        document,
        packet,
        text: stableStringify(packet),
      };
      return await this.sendPending(delta.objects);
    } finally {
      this.writing = false;
    }
  }
  private async sendPending(
    objects = this.pending
      ? difference(this.document!, this.pending.document).objects
      : [],
  ) {
    if (!this.pending) return this.read();
    const pending = this.pending;
    this.notify("saving");
    try {
      let revision: number, confirmedAt: number;
      if (pending.replacement) {
        const replacement = pending.replacement;
        let metadata = await getMetadata(this.api, this.owner);
        if (metadata.generation === replacement.generation) {
          if (metadata.revision !== replacement.revision + 1)
            throw new CloudConflict();
        } else {
          metadata = await this.activate(
            pending.state,
            replacement.parent,
            replacement.revision,
            replacement.generation,
          );
        }
        this.metadata = metadata;
        revision = metadata.revision;
        confirmedAt = Date.now();
      } else {
        for (const object of objects)
          await uploadObject(
            this.api,
            this.owner,
            pending.packet!.generation,
            object,
          );
        const receipt = await this.api.call<SyncConfirmation>(
          "quiz_sync_apply",
          {
            packet_text: pending.text,
          },
        );
        if (
          receipt.id !== pending.packet!.id ||
          receipt.generation !== pending.packet!.generation ||
          receipt.revision !== pending.packet!.expectedRevision + 1 ||
          !Number.isFinite(receipt.confirmedAt)
        )
          throw new Error("Der Online-Speicherbeleg ist ungültig.");

        revision = receipt.revision;
        confirmedAt = receipt.confirmedAt;
      }
      if (this.stopped) throw new Error("Das Konto wurde geschlossen.");
      this.document = pending.document;
      this.metadata = { ...this.metadata!, revision };
      this.state = this.copy(pending.state);
      this.pending = undefined;
      this.notify("saved", confirmedAt);
      const state = this.read();
      this.listeners.forEach((listener) => listener(state));
      return state;
    } catch (error) {
      if (!this.stopped)
        this.notify(error instanceof CloudConflict ? "conflict" : "offline");
      throw error;
    }
  }
  async retry() {
    if (this.writing) return this.read();
    this.writing = true;
    try {
      return await this.sendPending();
    } finally {
      this.writing = false;
    }
  }
}

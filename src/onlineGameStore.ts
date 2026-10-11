import { emptyState, type State } from "./model";
import { validateBackup } from "./backupValidation";
import { freezeCatalog, freezeRoundFacts } from "./immutableCatalog";
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
  type SyncDocument,
} from "./syncCodec";
import { compactRoundRuns, type OnlineSyncPacket } from "./roundRunTransport";
import {
  getMetadata,
  downloadDocument,
  uploadObject,
  type SyncRemote,
  type SyncConfirmation,
  type SyncMetadata,
} from "./entryRemote";
import {
  importRankedFacts,
  rankedFacts,
  rankedRead,
  type RankedFacts,
} from "./rankedRuns";
import { z } from "zod";
import { contentInfoSchema, type ContentInfo } from "./serverViews";
import { objectHashes } from "./syncReferences";

// Only the server persists progress. These objects live in this open tab's RAM.
export class OnlineGameStore {
  private state?: State;
  private document?: SyncDocument;
  private metadata?: SyncMetadata;
  private positionHeads: Record<string, number | null> = {};
  private writing = false;
  private stopped = false;
  private pending?: {
    state: State;
    document: SyncDocument;
    packet?: OnlineSyncPacket;
    text?: string;
    replacement?: { generation: string; parent: string; revision: number };
  };
  private listeners = new Set<(state: State) => void>();
  info?: ContentInfo;
  get revision() {
    return this.metadata?.revision ?? 0;
  }
  constructor(
    private api: SyncRemote,
    private owner: string,
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
  }
  read(): State {
    if (this.stopped || !this.state)
      throw new Error("Der Online-Spielstand ist nicht geöffnet.");
    return this.copy(this.state);
  }
  rankedRemote() {
    if (this.stopped) throw new Error("Das Konto wurde geschlossen.");
    return this.api;
  }
  rankedCatalogHash() {
    if (!this.info) throw new Error("Der offizielle Fragenbestand fehlt.");
    return this.info.hash;
  }
  async recoverRanked() {
    for (;;) {
      const ids = await rankedRead(
        this.api,
        { action: "pending" },
        z.array(z.string().uuid()).max(20),
      );
      if (!ids.length) return this.read();
      const histories: RankedFacts[] = [];
      for (const id of ids) histories.push(await rankedFacts(this.api, id));
      await this.update(
        (s) => {
          for (const history of histories) importRankedFacts(s, history);
        },
        { progressOnly: false, reuseCatalog: true },
      );
    }
  }
  private copy(state: State) {
    const { questions, rounds, ...progress } = state;
    const copied = structuredClone({
      ...progress,
      rounds: rounds.map(({ questions: _, archive: __, ...round }) => round),
    });
    return {
      ...copied,
      questions: freezeCatalog(questions),
      // Historical question contents are immutable. Copy each round's mutable
      // header and question list, without copying all explanation texts again.
      rounds: copied.rounds.map((round, index) => {
        const archive = rounds[index].archive;
        return {
          ...round,
          questions: [...freezeCatalog(rounds[index].questions)],
          // Closed-round facts are immutable content too. Keep the collection
          // separate, without cloning every nested fact on each answer.
          ...(archive
            ? {
                archive: {
                  ...archive,
                  questions: [...freezeRoundFacts(archive.questions)],
                },
              }
            : {}),
        };
      }),
    };
  }
  async open() {
    const [initialMetadata, contentInfo] = await Promise.all([
      getMetadata(this.api, this.owner),
      this.api.call("quiz_game_view", { request_text: '{"action":"info"}' }),
    ]);
    if (this.stopped) return;
    this.info = contentInfoSchema.parse(contentInfo);
    let metadata = initialMetadata;
    if (!metadata.generation)
      metadata = await this.activate(
        validateBackup(emptyState()),
        null,
        metadata.revision,
        crypto.randomUUID(),
      );
    const loaded = await downloadDocument(
      this.api,
      this.owner,
      metadata.generation!,
      metadata.revision,
      -1,
      undefined,
      { kind: "boot" },
    );
    this.positionHeads = loaded.positions ?? {};
    if (this.stopped) return;
    this.metadata = metadata;
    this.document = loaded.document;
    this.state = this.copy(reconstructState(loaded.document));
    await this.recoverRanked();
    this.notify("saved", Date.now());
  }
  private async compile(
    state: State,
    previous?: SyncDocument,
    snapshotsUnchanged = false,
  ) {
    const doc = await compileState(state, previous, snapshotsUnchanged);
    if (previous) {
      // Partial UI history must never overwrite full server projections.
      const derived = (row: { kind: string; id: string }) =>
        row.kind === "learning" ||
        row.kind === "record" ||
        (row.kind === "field" &&
          ["experience", "career", "journey", "badges"].includes(row.id));
      for (const [key, row] of doc.rows) if (derived(row)) doc.rows.delete(key);
      for (const [key, row] of previous.rows)
        if (derived(row)) doc.rows.set(key, row);
      const positions = { ...this.positionHeads };
      for (const [key, row] of doc.rows) {
        const old = previous.rows.get(key);
        if (old) row.position = old.position;
        else if (row.kind !== "field")
          row.position = positions[row.kind] = (positions[row.kind] ?? -1) + 1;
      }
    }
    const used = objectHashes(doc);
    for (const hash of doc.objects.keys())
      if (!used.has(hash)) doc.objects.delete(hash);
    return doc;
  }
  async refresh() {
    if (this.writing || this.pending)
      throw new Error("Bestätige zuerst die ausstehende Speicherung.");
    const metadata = await getMetadata(this.api, this.owner);
    if (!metadata.generation) throw new Error("Der Online-Spielstand fehlt.");
    const loaded = await downloadDocument(
      this.api,
      this.owner,
      metadata.generation,
      metadata.revision,
      -1,
      undefined,
      { kind: "boot" },
    );
    this.positionHeads = loaded.positions ?? this.positionHeads;
    this.document = loaded.document;
    this.metadata = metadata;
    this.state = this.copy(reconstructState(loaded.document));
    const state = this.read();
    this.listeners.forEach((fn) => fn(state));
    this.notify("saved", Date.now());
    return state;
  }
  private async activate(
    state: State,
    parent: string | null,
    revision: number,
    generation: string,
  ): Promise<SyncMetadata> {
    const document = await this.compile(state);
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
    const staged = await downloadDocument(
      this.api,
      this.owner,
      generation,
      0,
      -1,
      undefined,
    );
    if (
      stableStringify(reconstructState(staged.document)) !==
      stableStringify(state)
    )
      throw new Error("Der vorbereitete Online-Spielstand ist unvollständig.");
    const metadata = await this.api.call<SyncMetadata>("quiz_game_activate", {
      expected_owner: this.owner,
      target_generation: generation,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      let next = this.read();
      if (!options.reuseCatalog)
        next.questions = structuredClone(next.questions);
      mutator(next);
      if (!options.replace) {
        const missingRounds = next.rounds
          .filter((r) => !this.document!.rows.has("round:" + r.id))
          .map((r) => r.id);
        const missingGoals = [
          ...new Set(
            next.rounds.flatMap((r) => r.questions.map((q) => q.knowledgeId)),
          ),
        ].filter((id) => !this.document!.rows.has("learning:" + id));
        if (missingRounds.length || missingGoals.length) {
          let doc = this.document!;
          for (
            let at = 0;
            at < Math.max(missingRounds.length / 20, missingGoals.length / 100);
            at++
          ) {
            const loaded = await downloadDocument(
              this.api,
              this.owner,
              this.metadata.generation,
              this.metadata.revision,
              -1,
              doc,
              {
                kind: "details",
                rounds: missingRounds.slice(at * 20, at * 20 + 20),
                goals: missingGoals.slice(at * 100, at * 100 + 100),
              },
            );
            doc = loaded.document;
            this.positionHeads = loaded.positions ?? this.positionHeads;
          }
          this.document = doc;
          this.state = this.copy(reconstructState(doc));
          next = this.read();
          if (!options.reuseCatalog)
            next.questions = structuredClone(next.questions);
          mutator(next);
        }
      }
      delete next.bundledQuestionIds;
      next.questions = [
        ...new Map(
          next.rounds.flatMap((r) => r.questions).map((q) => [q.id, q]),
        ).values(),
      ];
      const document = await this.compile(
        next,
        this.document,
        options.progressOnly === true,
      );
      const delta = difference(this.document, document);
      if (!options.replace && !delta.changes.length && !delta.objects.length)
        return this.read();
      if (options.replace || delta.changes.length > 2000) {
        this.pending = {
          state: next,
          document: await this.compile(next),
          replacement: {
            generation: crypto.randomUUID(),
            parent: this.metadata.generation,
            revision: this.metadata.revision,
          },
        };
        return await this.sendPending();
      }
      const packet: OnlineSyncPacket = {
        format: SYNC_FORMAT,
        protocol: SYNC_PROTOCOL,
        id: crypto.randomUUID(),
        generation: this.metadata.generation,
        expectedRevision: this.metadata.revision,
        owner: this.owner,
        changes: compactRoundRuns(this.document, delta.changes),
        objects: [],
      };
      // The existing apply RPC stores small objects in the same transaction.
      // Keep large contents on the bounded piece upload path, and freeze this
      // selection with the packet so a lost receipt can be replayed verbatim.
      let objectBytes = 0;
      for (const object of delta.objects) {
        const size = new TextEncoder().encode(
          JSON.stringify(object),
        ).byteLength;
        if (packet.objects.length < 100 && objectBytes + size <= 64 * 1024) {
          packet.objects.push(object);
          objectBytes += size;
        }
      }
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
        const inline = new Set(pending.packet!.objects.map((o) => o.hash));
        for (const object of objects.filter((o) => !inline.has(o.hash)))
          await uploadObject(
            this.api,
            this.owner,
            pending.packet!.generation,
            object,
          );
        const receipt = await this.api.call<SyncConfirmation>(
          "quiz_game_apply",
          {
            packet_text: pending.text,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      if (
        pending.replacement ||
        pending.packet!.changes.some(
          (c) => c.op === "put" && c.row.kind !== "field",
        )
      ) {
        const loaded = await downloadDocument(
          this.api,
          this.owner,
          this.metadata!.generation!,
          revision,
          -1,
          undefined,
          { kind: "boot" },
        );
        this.positionHeads = loaded.positions ?? this.positionHeads;
        this.document = loaded.document;
        this.state = this.copy(reconstructState(loaded.document));
      }
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
  async exportState() {
    if (this.writing || this.pending)
      throw new Error("Bestätige zuerst die ausstehende Speicherung.");
    const metadata = await getMetadata(this.api, this.owner);
    if (!metadata.generation) throw new Error("Der Online-Spielstand fehlt.");
    const loaded = await downloadDocument(
      this.api,
      this.owner,
      metadata.generation,
      metadata.revision,
      -1,
      undefined,
    );
    return reconstructState(loaded.document);
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

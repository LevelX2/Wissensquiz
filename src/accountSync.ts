import type { State } from "./model";
import { backgroundFingerprint } from "./stateProcessing";
import { CloudConflict, CloudSaveError, type SyncReceipt } from "./accounts";

type Remote = {
  state: State;
  revision: number;
  needsCareerSave?: boolean;
} | null;
export type SyncStatus =
  "loading" | "saved" | "saving" | "offline" | "conflict";
export type SyncStore = {
  local: () => Promise<State | undefined>;
  receipt: () => Promise<SyncReceipt | undefined>;
  legacyRevision: () => Promise<number>;
  remote: () => Promise<Remote>;
  replace: (state: State) => Promise<State>;
  acknowledge: (receipt: SyncReceipt) => Promise<void>;
  save: (state: State, revision: number) => Promise<number>;
};
export async function fingerprint(state: State) {
  return backgroundFingerprint(state);
}

// Local changes are durable before they reach this queue. A receipt records only
// the acknowledged snapshot, so reloads and lost responses never hide dirty data.
export class AccountSync {
  status: SyncStatus = "loading";
  private revision = 0;
  private saved = "";
  private latest: State | null = null;
  private running: Promise<void> | null = null;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(
    private store: SyncStore,
    private notify: (status: SyncStatus, detail?: string) => void,
  ) {}
  private report(status: SyncStatus, detail = "") {
    this.status = status;
    if (!this.stopped) this.notify(status, detail);
  }
  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
  }
  async prepare() {
    const [local, receipt, remote] = await Promise.all([
      this.store.local(),
      this.store.receipt(),
      this.store.remote(),
    ]);
    if (this.stopped) return;
    this.revision = receipt?.revision ?? (await this.store.legacyRevision());
    const localHash = local ? await fingerprint(local) : "";
    const remoteHash = remote ? await fingerprint(remote.state) : "";
    if (remote && localHash === remoteHash) {
      await this.acknowledge(remote.revision, remoteHash);
    } else if (local && (!receipt || localHash !== receipt.fingerprint)) {
      if (remote && remote.revision !== this.revision) {
        this.report("conflict");
        return;
      }
      this.saved = receipt?.fingerprint ?? "";
      this.revision = remote?.revision ?? 0;
    } else if (remote) {
      await this.store.replace(remote.state);
      await this.acknowledge(remote.revision, remoteHash);
    } else {
      this.revision = 0;
      this.saved = "";
    }
    // Validation upgrades legacy saves in memory. Persist that upgrade even
    // when its canonical fingerprint matches the loaded local snapshot.
    if (remote?.needsCareerSave) this.saved = "";
    this.report("saved");
  }
  private async acknowledge(revision: number, hash: string) {
    if (this.stopped) return;
    await this.store.acknowledge({ revision, fingerprint: hash });
    this.revision = revision;
    this.saved = hash;
  }
  offer(state: State) {
    if (this.stopped || this.status === "conflict") return;
    this.latest = state;
    // Local writes are already durable. Batch quick consecutive actions without
    // postponing uploads indefinitely when the player keeps interacting.
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
    this.running = this.drain().finally(() => {
      this.running = null;
      if (
        this.latest &&
        !this.stopped &&
        ["saved", "saving"].includes(this.status)
      )
        void this.flush();
    });
    return this.running;
  }
  private async drain() {
    while (this.latest && !this.stopped && this.status !== "conflict") {
      const snapshot = this.latest;
      try {
        const hash = await fingerprint(snapshot);
        if (this.stopped) return;
        if (hash !== this.saved) {
          this.report("saving");
          try {
            const revision = await this.store.save(snapshot, this.revision);
            await this.acknowledge(revision, hash);
          } catch (error) {
            if (!(error instanceof CloudConflict)) throw error;
            const remote = await this.store.remote();
            if (remote && (await fingerprint(remote.state)) === hash) {
              await this.acknowledge(remote.revision, hash);
            } else {
              this.report("conflict");
              return;
            }
          }
        }
        if (this.latest === snapshot) {
          this.latest = null;
          this.report("saved");
        }
      } catch (error) {
        this.report(
          "offline",
          error instanceof CloudSaveError
            ? error.message
            : "Die Sicherung konnte nicht bestätigt werden. Bei wiederholten Fehlern melde das bitte.",
        );
        return;
      }
    }
  }
}

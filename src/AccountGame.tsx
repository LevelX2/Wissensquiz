import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { App } from "./App";
import { AccountSync, fingerprint, type SyncStatus } from "./accountSync";
import {
  cloudRead,
  cloudRevision,
  cloudSave,
  readSyncReceipt,
  replaceAccountState,
  writeSyncReceipt,
} from "./accounts";
import { download, read } from "./storage";
import type { State } from "./model";

export const syncText: Record<SyncStatus, string> = {
  loading: "Dein Spielstand wird geladen …",
  saved: "Spielstand online gespeichert",
  saving: "Spielstand wird online gespeichert …",
  offline:
    "Noch nicht online gespeichert. Dein Fortschritt bleibt auf diesem Gerät erhalten. Wir versuchen es automatisch erneut.",
  conflict:
    "Auf einem anderen Gerät wurde ebenfalls gespielt. Beide Stände bleiben erhalten; sie werden nicht automatisch überschrieben.",
};

export function AccountGame({
  client,
  owner,
  storageKey,
  name,
  panel,
}: {
  client: SupabaseClient;
  owner: string;
  storageKey: string;
  name: string;
  panel: (
    state: State,
    onState: (state: State) => void,
    status: SyncStatus,
  ) => ReactNode;
}) {
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  const engine = useRef<AccountSync | null>(null);
  const lockTask = useRef<Promise<void>>(Promise.resolve());
  const statusRef = useRef(status);
  statusRef.current = status;
  const acceptRemote = useRef(false);
  const offer = useCallback((state: State) => engine.current?.offer(state), []);
  useEffect(() => {
    let alive = true;
    let release: (() => void) | undefined;
    let sync: AccountSync | undefined;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    setReady(false);
    setError("");
    setStatus("loading");
    const run = async () => {
      if (!alive) return;
      sync = new AccountSync(
        {
          local: () => read(storageKey),
          receipt: () => readSyncReceipt(storageKey),
          legacyRevision: () => cloudRevision(storageKey),
          remote: () => cloudRead(client, owner),
          replace: (state) => replaceAccountState(storageKey, state),
          acknowledge: (receipt) => writeSyncReceipt(storageKey, receipt),
          save: (state, revision) => cloudSave(client, state, revision, owner),
        },
        (value) => {
          if (alive) setStatus(value);
        },
      );
      engine.current = sync;
      try {
        if (acceptRemote.current) {
          const remote = await cloudRead(client, owner);
          if (!remote) throw new Error("Online-Spielstand nicht gefunden.");
          if (!alive) return;
          await replaceAccountState(storageKey, remote.state);
          await writeSyncReceipt(storageKey, {
            revision: remote.revision,
            fingerprint: await fingerprint(remote.state),
          });
          acceptRemote.current = false;
        }
        await sync.prepare();
        if (alive && sync.status !== "conflict") setReady(true);
      } catch {
        if (alive)
          setError(
            "Dein Online-Spielstand konnte nicht geladen werden. Bitte prüfe Deine Internetverbindung und versuche es erneut. Deine vorhandenen Spielstände bleiben erhalten.",
          );
      }
      await hold;
    };
    // Keep one writer per account/browser. Other devices are protected by the
    // server revision check; an old tab must never overwrite a new snapshot.
    const previous = lockTask.current;
    const task = (async () => {
      await previous;
      if (!alive) return;
      if (navigator.locks) {
        await navigator.locks.request(
          `wissensquiz:${storageKey}`,
          { ifAvailable: true },
          async (lock) => {
            if (!lock) {
              if (alive)
                setError(
                  "Dieses Quiz-Konto ist bereits in einem anderen Tab geöffnet. Schließe den anderen Quiz-Tab und versuche es erneut.",
                );
              return;
            }
            await run();
          },
        );
      } else await run();
    })().catch(() => {
      if (alive)
        setError(
          "Der Kontospielstand konnte nicht geöffnet werden. Bitte lade die Seite erneut.",
        );
    });
    lockTask.current = task;
    const retry = () => {
      if (sync?.status === "offline") void sync.flush();
    };
    const interval = window.setInterval(retry, 10000);
    window.addEventListener("online", retry);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (["saving", "offline", "conflict"].includes(statusRef.current)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      alive = false;
      sync?.stop();
      engine.current = null;
      release?.();
      window.clearInterval(interval);
      window.removeEventListener("online", retry);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [client, owner, storageKey, generation]);
  if (!ready || error || status === "conflict")
    return (
      <main className="account-page">
        <h1>
          {status === "conflict"
            ? "Auf zwei Geräten gespielt"
            : "Dein Quiz-Spielstand"}
        </h1>
        <p role="status">{error || syncText[status]}</p>
        {status === "conflict" ? (
          <>
            <p>
              Du kannst mit dem Online-Stand weiterspielen. Dein bisheriger
              Stand wird vorher auf diesem Gerät als Rückfallkopie erhalten.
              Sichere ihn bei Bedarf zusätzlich als Datei.
            </p>
            <div className="account-actions">
              <button
                className="primary"
                onClick={() => {
                  acceptRemote.current = true;
                  setGeneration((n) => n + 1);
                }}
              >
                Mit dem Online-Stand weiterspielen
              </button>
              <button
                className="secondary"
                onClick={() =>
                  void read(storageKey).then((state) => {
                    if (state)
                      download("wissensquiz-rueckfallkopie.json", state);
                  })
                }
              >
                Meinen Stand als Datei sichern
              </button>
            </div>
          </>
        ) : (
          error && (
            <button
              className="primary"
              onClick={() => setGeneration((n) => n + 1)}
            >
              Erneut versuchen
            </button>
          )
        )}
        {(error || status === "conflict") && (
          <button
            className="text-button"
            onClick={() => void client.auth.signOut({ scope: "local" })}
          >
            Abmelden und als Gast spielen
          </button>
        )}
      </main>
    );
  return (
    <>
      <p className="sync-status" role="status">
        {syncText[status]}
      </p>
      <App
        key={`${storageKey}:${generation}`}
        storageKey={storageKey}
        accountName={name}
        onPersistedState={offer}
        accountPanel={(state, onState) => panel(state, onState, status)}
      />
    </>
  );
}

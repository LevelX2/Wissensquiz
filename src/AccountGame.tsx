import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { App } from "./App";
import { RankingContext } from "./SharedLeaderboard";
import type { SyncStatus } from "./syncTypes";
import { OnlineGameStore } from "./onlineGameStore";
import { SupabaseEntryRemote, getRelease } from "./entryRemote";
import { loadOfficialCatalog } from "./officialCatalog";
import { cloudRead } from "./accounts";
import type { State } from "./model";
import { ActivityContext } from "./GuestActivity";
import { requestWithin } from "./request";
import { ReportContext } from "./issueReports";

export const syncText: Record<SyncStatus, string> = {
  loading: "Dein Online-Spielstand wird geladen …",
  saved: "Spielstand online gespeichert",
  saving: "Spielstand wird online gespeichert …",
  offline:
    "Die Online-Speicherung ist noch nicht bestätigt. Versuche es erneut. Die Änderung wird erst nach der Serverbestätigung übernommen.",
  conflict:
    "Dein Online-Spielstand wurde in einem anderen Fenster oder auf einem anderen Gerät geändert. Lade den aktuellen Online-Stand erneut.",
};

export function AccountGame({
  client,
  publicClient,
  owner,
  storageKey,
  panel,
}: {
  client: SupabaseClient;
  publicClient: SupabaseClient | null;
  owner: string;
  storageKey: string;
  panel: (
    state: State,
    status: SyncStatus,
    message: string,
    confirmedAt?: number,
  ) => ReactNode;
}) {
  const ranking = useMemo(() => ({ client, owner }), [client, owner]);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [confirmedAt, setConfirmedAt] = useState<number>();
  const [store, setStore] = useState<OnlineGameStore | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    const lifecycle = new AbortController();
    const api = new SupabaseEntryRemote(client, lifecycle.signal);
    const current = new OnlineGameStore(
      api,
      owner,
      () => loadOfficialCatalog((hash) => getRelease(api, hash)),
      () => requestWithin((signal) => cloudRead(client, owner, signal)),
      (next, at) => {
        if (alive) {
          setStatus(next);
          if (at !== undefined) setConfirmedAt(at);
        }
      },
    );
    setStore(null);
    setError("");
    setStatus("loading");
    current
      .open()
      .then(() => {
        if (alive) setStore(current);
      })
      .catch(() => {
        if (alive)
          setError(
            "Dein Online-Spielstand konnte nicht geöffnet werden. Prüfe Deine Internetverbindung und versuche es erneut.",
          );
      });
    return () => {
      alive = false;
      lifecycle.abort();
      current.stop();
    };
  }, [client, owner, attempt]);
  if (!store || error || status === "conflict")
    return (
      <main className="account-page">
        <h1>Dein Online-Spielstand</h1>
        <p role="status">{error || syncText[status]}</p>
        {(error || status === "conflict") && (
          <button className="primary" onClick={() => setAttempt((n) => n + 1)}>
            Online-Spielstand erneut laden
          </button>
        )}
        <button
          className="text-button"
          onClick={() => void client.auth.signOut({ scope: "local" })}
        >
          Abmelden
        </button>
      </main>
    );
  return (
    <ReportContext.Provider value={{ client, storageKey }}>
      <RankingContext.Provider value={ranking}>
        <ActivityContext.Provider value={publicClient}>
          <App
            key={attempt}
            store={store}
            sync={{
              status,
              confirmedAt,
              text: syncText[status],
              retry: () => {
                void store.retry().catch(() => {});
              },
            }}
            accountPanel={(state) =>
              panel(state, status, syncText[status], confirmedAt)
            }
          />
        </ActivityContext.Provider>
      </RankingContext.Provider>
    </ReportContext.Provider>
  );
}

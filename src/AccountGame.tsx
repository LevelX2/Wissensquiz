import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { App } from "./App";
import { RankingContext } from "./SharedLeaderboard";
import type { SyncStatus } from "./syncTypes";
import { invalidateRankingCache } from "./rankingRequest";
import { OnlineGameStore } from "./onlineGameStore";
import { SupabaseEntryRemote } from "./entryRemote";
import type { State } from "./model";
import { ActivityContext } from "./GuestActivity";
import { ReportContext } from "./issueReports";
import { transferTrial } from "./trial";
import { ServerContext } from "./serverViews";
import { syncText } from "./syncText";

export function AccountGame({
  client,
  publicClient,
  owner,
  email,
  storageKey,
  panel,
}: {
  client: SupabaseClient;
  publicClient: SupabaseClient | null;
  owner: string;
  email: string;
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
  const [serverRevision, setServerRevision] = useState(0);
  const [store, setStore] = useState<OnlineGameStore | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [trialImported, setTrialImported] = useState(false);
  const [onInitialized, setOnInitialized] = useState<() => void>(
    () => () => {},
  );
  useEffect(() => {
    let alive = true;
    const lifecycle = new AbortController();
    const api = new SupabaseEntryRemote(client, lifecycle.signal);
    const current = new OnlineGameStore(api, owner, (next, at) => {
      if (alive) {
        setStatus(next);
        if (next === "saved") {
          setServerRevision(current.revision);
          invalidateRankingCache(client, owner);
        }
        if (at !== undefined) setConfirmedAt(at);
      }
    });
    setStore(null);
    setError("");
    setStatus("loading");
    let finishInitialization = () => {};
    const initialized = new Promise<void>((resolve) => {
      finishInitialization = resolve;
    });
    setOnInitialized(() => finishInitialization);
    // Confirmation in another tab also signs in the original tab. Serialize
    // activation, trial takeover and initial metadata before its first read.
    navigator.locks
      .request("wissensquiz-account-open:" + storageKey, async () => {
        if (!alive) return;
        await current.open();
        if (!alive) return;
        try {
          const imported = await transferTrial(email, (mutate) =>
            current.update(mutate),
          );
          if (alive && imported) setTrialImported(true);
        } catch {
          if (alive)
            setError(
              "Deine Proberunde konnte noch nicht online übernommen werden. Versuche es erneut. Dein vorhandener Online-Spielstand bleibt erhalten.",
            );
          return;
        }
        if (alive) {
          setStore(current);
          await initialized;
        }
      })
      .catch((cause) => {
        if (alive)
          setError(
            `Dein Online-Spielstand konnte nicht geöffnet werden. ${cause instanceof Error ? cause.message : "Versuche es erneut."}`,
          );
      });
    return () => {
      alive = false;
      finishInitialization();
      lifecycle.abort();
      current.stop();
    };
  }, [client, owner, email, storageKey, attempt]);
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
          <ServerContext.Provider
            value={{
              api: store.rankedRemote(),
              info: store.info!,
              revision: serverRevision,
              exportState: () => store.exportState(),
            }}
          >
            <App
              key={attempt}
              store={store}
              initialNotice={
                trialImported
                  ? "Deine erste Runde wurde übernommen. Dein Ergebnis und Dein Lernfortschritt sind jetzt online gespeichert."
                  : ""
              }
              onInitialized={onInitialized}
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
          </ServerContext.Provider>
        </ActivityContext.Provider>
      </RankingContext.Provider>
    </ReportContext.Provider>
  );
}

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import type { State } from "./model";
import type { OnlineGameStore } from "./onlineGameStore";
import type { Mutate } from "./uiTypes";
import { QuestionScreen } from "./QuestionScreen";
import { rankedRead, RankedSession, type RankedSetup } from "./rankedRuns";
import { RankedRunError } from "./rankedErrors";

export function RankedGame({
  session,
  setup,
  store,
  state,
  mutate,
  onExit,
  onFinish,
  onBusy,
}: {
  session: RankedSession;
  setup: RankedSetup;
  store: OnlineGameStore;
  state: State;
  mutate: Mutate;
  onExit: () => void;
  onFinish: () => Promise<void>;
  onBusy: (busy: boolean) => void;
}) {
  const [, render] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [blocked, setBlocked] = useState<string | null>(null),
    [guessed, setGuessed] = useState(false);
  const started = useRef(false);
  const blockedAbort = useRef<string | undefined>(undefined);
  const failedWork = useRef<(() => Promise<unknown>) | undefined>(undefined);
  const work = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    onBusy(true);
    setError("");
    failedWork.current = undefined;
    try {
      const result = await fn();
      render((n) => n + 1);
      return result;
    } catch (e) {
      failedWork.current = fn;
      setError(e instanceof Error ? e.message : String(e));
      if (e instanceof RankedRunError && e.code === "ranked_active") {
        try {
          const status = await rankedRead(
            store.rankedRemote(),
            { action: "status" },
            z.object({ activeId: z.string().uuid().nullable() }),
          );
          setBlocked(status.activeId);
        } catch {
          setError(
            "Die laufende Zeitrunde konnte nicht geprüft werden. Versuche es erneut.",
          );
        }
      }
      return null;
    } finally {
      setBusy(false);
      onBusy(false);
    }
  };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void work(() => session.start(setup));
  }, []);
  const screen = session.run && session.current ? session.screen(state) : null;
  return (
    <>
      <p className="quiet-note">
        Servergeprüfte Zeitrunde · Übertragungszeit zählt zur Antwortzeit.
        Zwischen den Fragen läuft keine Fragezeit.
      </p>
      {error && (
        <div role="alert" className="notice error">
          {error}
          {session.hasPending && (
            <button
              disabled={busy}
              onClick={() => void work(() => session.retry())}
            >
              Erneut versuchen
            </button>
          )}
          {!session.hasPending && failedWork.current && screen && (
            <button
              disabled={busy}
              onClick={() => void work(failedWork.current!)}
            >
              Erneut versuchen
            </button>
          )}
        </div>
      )}
      {blocked && (
        <div className="notice">
          <p>
            Auf einem anderen Gerät oder in einem anderen Fenster läuft noch
            eine Zeitrunde. Sie wurde durch das Öffnen dieser Ansicht nicht
            verändert.
          </p>
          <button
            disabled={busy}
            onClick={() =>
              void work(async () => {
                await store.rankedRemote().call("quiz_ranked_call", {
                  request_text: (blockedAbort.current ??= JSON.stringify({
                    action: "abort",
                    runId: blocked,
                    requestId: crypto.randomUUID(),
                  })),
                });
                await store.recoverRanked();
                setBlocked(null);
                blockedAbort.current = undefined;
                return session.start(setup);
              })
            }
          >
            Bestehende Zeitrunde beenden und neu starten
          </button>
        </div>
      )}
      {!screen && (
        <>
          <p role="status">
            {busy
              ? "Zeitrunde wird vorbereitet …"
              : "Die Zeitrunde ist noch nicht gestartet."}
          </p>
          <button disabled={busy} onClick={onExit}>
            Zurück zum Spielen
          </button>
          {!blocked && !session.hasPending && !busy && (
            <button onClick={() => void work(() => session.start(setup))}>
              Zeitrunde erneut prüfen
            </button>
          )}
        </>
      )}
      {screen && (
        <QuestionScreen
          key={`${screen.round.id}:${screen.index}`}
          round={screen.round}
          presentationQuestion={state.questions.find(
            (q) => q.id === screen.round.questions[screen.index].id,
          )}
          index={screen.index}
          state={screen.state}
          busy={busy || session.hasPending}
          mutate={mutate}
          onExit={onExit}
          hasNext={session.run!.status === "active"}
          onReady={async () => session.elapsed()}
          onGuessed={guessed}
          onGuess={() => {
            if (session.items.length > screen.index)
              void work(() => session.markGuessed());
            else setGuessed((v) => !v);
          }}
          onAnswer={async (choice) => {
            const result = await work(() => session.answer(choice, guessed));
            return result ? session.screen(state).state : null;
          }}
          onNext={() =>
            void work(async () => {
              if (session.run!.status !== "active") await onFinish();
              else {
                await session.next();
                setGuessed(false);
              }
            })
          }
        />
      )}
    </>
  );
}

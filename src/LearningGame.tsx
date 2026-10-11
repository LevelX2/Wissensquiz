import { useEffect, useRef, useState } from "react";
import type { State } from "./model";
import type { Mutate } from "./uiTypes";
import { LearningSession, type LearningSetup } from "./learningRuns";
import { QuestionScreen } from "./QuestionScreen";
export function LearningGame({
  session,
  setup,
  resumeId,
  state,
  mutate,
  onExit,
  onFinish,
  onBusy,
}: {
  session: LearningSession;
  setup?: LearningSetup;
  resumeId?: string;
  state: State;
  mutate: Mutate;
  onExit: () => void;
  onFinish: () => Promise<void>;
  onBusy: (busy: boolean) => void;
}) {
  const started = useRef(false),
    [, render] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [guessed, setGuessed] = useState(false);
  const failedWork = useRef<(() => Promise<unknown>) | undefined>(undefined);
  const work = async <T,>(fn: () => Promise<T>) => {
    setBusy(true);
    onBusy(true);
    setError("");
    failedWork.current = undefined;
    try {
      const r = await fn();
      render((n) => n + 1);
      return r;
    } catch (e) {
      failedWork.current = fn;
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
      onBusy(false);
    }
  };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void work(async () => {
      const result = await (resumeId
        ? session.resume(resumeId)
        : session.start(setup!));
      if (session.run!.status !== "active") await onFinish();
      return result;
    });
  }, []);
  const screen = session.run && session.current ? session.screen(state) : null;
  return (
    <>
      {error && (
        <div role="alert" className="notice error">
          {error}
          <button
            disabled={busy}
            onClick={() =>
              void work(
                session.hasPending
                  ? async () => {
                      await session.retry();
                      if (session.run?.status !== "active") await onFinish();
                    }
                  : failedWork.current!,
              )
            }
          >
            Erneut versuchen
          </button>
        </div>
      )}
      {!screen ? (
        <>
          <p role="status">Deine Runde wird vorbereitet …</p>
          <button disabled={busy || session.hasPending} onClick={onExit}>
            Zurück zum Spielen
          </button>
        </>
      ) : (
        <QuestionScreen
          key={`${screen.round.id}:${screen.index}`}
          round={screen.round}
          learningEvidence={session.items[screen.index]?.progress}
          index={screen.index}
          state={screen.state}
          mutate={mutate}
          busy={busy || session.hasPending}
          onExit={onExit}
          hasNext={session.run!.answered < session.run!.size}
          onGuessed={guessed}
          onGuess={() => {
            if (session.items.length > screen.index)
              void work(() => session.guess());
            else setGuessed((v) => !v);
          }}
          onAnswer={async (choice) => {
            const result = await work(() => session.answer(choice, guessed));
            return result ? session.screen(state).state : null;
          }}
          onNext={() =>
            void work(async () => {
              if (session.run!.answered === session.run!.size) {
                if (session.run!.status === "active") await session.finish();
                await onFinish();
              } else {
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

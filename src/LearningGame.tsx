import { useEffect, useRef } from "react";
import type { State } from "./model";
import type { Mutate } from "./uiTypes";
import { LearningSession, type LearningSetup } from "./learningRuns";
import { QuestionScreen } from "./QuestionScreen";
import { useQuestionInteraction } from "./useQuestionInteraction";
import { useAsyncAction } from "./useAsyncAction";
export function LearningGame({
  session,
  setup,
  resumeId,
  state,
  disabled,
  mutate,
  onExit,
  onFinish,
  onBusy,
}: {
  session: LearningSession;
  setup?: LearningSetup;
  resumeId?: string;
  state: State;
  disabled: boolean;
  mutate: Mutate;
  onExit: () => void;
  onFinish: () => Promise<void>;
  onBusy: (busy: boolean) => void;
}) {
  const started = useRef(false);
  const { guessed, toggleGuess } = useQuestionInteraction(
    session.run?.id,
    session.current?.index,
    state.settings,
  );
  const { work, busy, error, failedWork } = useAsyncAction(onBusy);
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
            disabled={busy || disabled}
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
          <button
            disabled={busy || disabled || session.hasPending}
            onClick={onExit}
          >
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
          busy={busy || disabled || session.hasPending}
          onExit={onExit}
          hasNext={session.run!.answered < session.run!.size}
          onGuessed={guessed}
          onGuess={() => {
            if (session.items.length > screen.index)
              void work(() => session.guess());
            else toggleGuess();
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
              }
            })
          }
        />
      )}
    </>
  );
}

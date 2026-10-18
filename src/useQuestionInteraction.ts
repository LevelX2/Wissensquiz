import { useEffect, useRef, useState } from "react";
import type { State } from "./model";
import { playFeedback } from "./feedback";

// Follow the confirmed server question, including confirmation retries. Local
// input belongs to one question; it must never leak into the following answer.
export function useQuestionInteraction(
  runId: string | undefined,
  index: number | undefined,
  settings: State["settings"],
) {
  const [markedQuestion, setMarkedQuestion] = useState<string>();
  const previous = useRef<{ runId: string; index: number } | undefined>(
    undefined,
  );
  const key =
    runId !== undefined && index !== undefined
      ? `${runId}:${index}`
      : undefined;
  useEffect(() => {
    const before = previous.current;
    previous.current =
      runId !== undefined && index !== undefined ? { runId, index } : undefined;
    if (
      before &&
      before.runId === runId &&
      index !== undefined &&
      index > before.index
    )
      playFeedback("next", settings);
  }, [runId, index, settings]);
  return {
    guessed: key !== undefined && markedQuestion === key,
    toggleGuess: () =>
      setMarkedQuestion((marked) => (marked === key ? undefined : key)),
  };
}

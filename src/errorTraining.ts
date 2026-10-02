import type { AnswerEvent, State } from "./model";

export interface OpenMistake {
  questionId: string;
  failures: number;
  lastWrongAt: number;
}

// A guessed hit does not resolve an actual mistake, but never creates one.
export function openMistakes(events: AnswerEvent[]): Map<string, OpenMistake> {
  const mistakes = new Map<string, OpenMistake>();
  for (const event of [...events].sort((a, b) => a.at - b.at)) {
    if (event.correct && !event.guessed) mistakes.delete(event.knowledgeId);
    else if (!event.correct)
      mistakes.set(event.knowledgeId, {
        questionId: event.questionId,
        failures: (mistakes.get(event.knowledgeId)?.failures ?? 0) + 1,
        lastWrongAt: event.at,
      });
  }
  return mistakes;
}

export function errorTrainingContext(state: State, sourceRoundId?: string) {
  const mistakes = openMistakes(state.events);
  if (sourceRoundId) {
    const source = state.rounds.find((r) => r.id === sourceRoundId);
    if (source?.status !== "completed")
      throw new Error(
        "Für das Fehlertraining fehlt eine abgeschlossene Runde.",
      );
    const goals = new Set(
      state.events
        .filter((e) => e.roundId === sourceRoundId && !e.correct)
        .map((e) => e.knowledgeId),
    );
    for (const id of mistakes.keys()) if (!goals.has(id)) mistakes.delete(id);
  }
  return { mistakes };
}

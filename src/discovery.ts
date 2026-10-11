import type { State } from "./model";
import { DAY } from "./learning";

export function recentCorrectContext(state: State, now: number) {
  return {
    recentCorrectKnowledgeIds: new Set(
      state.events
        .filter(
          (event) => event.correct && event.at > now - DAY && event.at <= now,
        )
        .map((event) => event.knowledgeId),
    ),
  };
}

/** Derived from existing history; no migration or extra progress fields. */
export function discoveryContext(state: State) {
  const recentRounds = new Set(
    [...state.rounds]
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 3)
      .map((round) => round.id),
  );
  const recentKnowledgeIds = new Set(
    state.events
      .filter((event) => recentRounds.has(event.roundId))
      .map((event) => event.knowledgeId),
  );
  return { recentKnowledgeIds };
}

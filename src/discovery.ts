import type { State } from "./model";

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

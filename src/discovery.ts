import type { State } from "./model";
import { genreOf } from "./filters";
import { learningPathProgress } from "./learningPath";

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
  const progress = learningPathProgress(state);
  const introductoryQuestionIds = new Set<string>();
  for (const genre of new Set(state.questions.map(genreOf))) {
    const p = progress(genre);
    const difficulty = p.hardUnlocked
      ? "schwer"
      : p.mediumUnlocked
        ? "mittel"
        : null;
    if (!difficulty) continue;
    const stage = state.questions.filter(
      (q) => genreOf(q) === genre && q.difficulty === difficulty,
    );
    const seen = new Set(
      stage
        .filter((q) => state.learning[q.knowledgeId])
        .map((q) => q.knowledgeId),
    );
    if (seen.size < 5)
      for (const q of stage)
        if (!state.learning[q.knowledgeId]) introductoryQuestionIds.add(q.id);
  }
  return { recentKnowledgeIds, introductoryQuestionIds };
}

import type { State } from "./model";
import { learningPathProgress, pathAreaOf } from "./learningPath";
import { familiarityOf } from "./familiarity";

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
  for (const genre of new Set(state.questions.map(pathAreaOf))) {
    const p = progress(genre);
    const difficulty = p.expertUnlocked
      ? "experte"
      : p.hardUnlocked
        ? "schwer"
        : p.mediumUnlocked
          ? "mittel"
          : null;
    const stage = state.questions.filter(
      (q) => pathAreaOf(q) === genre && q.difficulty === difficulty,
    );
    const newFilms = state.questions.filter(
      (q) => pathAreaOf(q) === genre && familiarityOf(q) === p.familiarity,
    );
    const seen = new Set(
      stage
        .filter((q) => state.learning[q.knowledgeId])
        .map((q) => q.knowledgeId),
    );
    if (seen.size < 5)
      for (const q of stage)
        if (!state.learning[q.knowledgeId]) introductoryQuestionIds.add(q.id);
    if (
      p.familiarity > p.first &&
      !(difficulty && seen.size < 5) &&
      new Set(
        newFilms
          .filter((q) => state.learning[q.knowledgeId])
          .map((q) => q.knowledgeId),
      ).size < 5
    )
      for (const q of newFilms)
        if (!state.learning[q.knowledgeId]) introductoryQuestionIds.add(q.id);
  }
  return { recentKnowledgeIds, introductoryQuestionIds };
}

import type { Difficulty, Question, State } from "./model";
import { genreOf } from "./filters";

export const PATH_TARGET = 20;
export function learningPathProgress(state: State) {
  const snapshots = new Map<string, Question>();
  for (const round of state.rounds) {
    if (round.status !== "completed") continue;
    for (const q of round.questions) snapshots.set(`${round.id}:${q.id}`, q);
  }
  const goals = new Map<string, Record<Difficulty, Set<string>>>();
  for (const event of state.events) {
    if (!event.correct || event.guessed || event.answerId === null) continue;
    const q = snapshots.get(`${event.roundId}:${event.questionId}`);
    if (!q) continue;
    const genre = genreOf(q);
    if (!goals.has(genre))
      goals.set(genre, {
        leicht: new Set(),
        mittel: new Set(),
        schwer: new Set(),
      });
    goals.get(genre)![q.difficulty].add(q.knowledgeId);
  }
  return (genre: string) => {
    const easy = goals.get(genre)?.leicht.size ?? 0;
    const medium = goals.get(genre)?.mittel.size ?? 0;
    return {
      easy,
      medium,
      mediumUnlocked: easy >= PATH_TARGET,
      hardUnlocked: easy >= PATH_TARGET && medium >= PATH_TARGET,
    };
  };
}

export function pathQuestions(state: State): Question[] {
  if (!state.settings.learningPath) return state.questions;
  const progress = learningPathProgress(state);
  return state.questions.filter((q) => {
    const p = progress(genreOf(q));
    return (
      q.difficulty === "leicht" ||
      (q.difficulty === "mittel" ? p.mediumUnlocked : p.hardUnlocked)
    );
  });
}

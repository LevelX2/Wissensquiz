import { hasAnswer, type Round, type State } from "./model";
import { learn } from "./engine";
import { genreOf } from "./filters";
import { openMistakes } from "./errorTraining";

export function roundSummary(state: State, round: Round) {
  const byId = new Map(state.events.map((e) => [e.id, e]));
  const events = round.events.flatMap((id) => {
    const event = byId.get(id);
    return event ? [event] : [];
  });
  const after = structuredClone(round.before);
  for (const e of events) after[e.knowledgeId] = learn(after[e.knowledgeId], e);
  // Round order distinguishes immediate repeats started at the same test time.
  const earlierRounds = new Set(
    state.rounds
      .slice(
        0,
        state.rounds.findIndex((r) => r.id === round.id),
      )
      .map((r) => r.id),
  );
  const mistakesBefore = openMistakes(
    state.events.filter((e) => earlierRounds.has(e.roundId)),
  );
  let streak = 0,
    bestStreak = 0;
  for (const e of events) {
    streak = e.correct && !e.guessed ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }
  const genres = new Map<string, { total: number; correct: number }>();
  for (const [i, q] of round.questions.entries()) {
    const genre = genreOf(q);
    const tally = genres.get(genre) ?? { total: 0, correct: 0 };
    tally.total++;
    if (byId.get(round.events[i])?.correct) tally.correct++;
    genres.set(genre, tally);
  }
  const correct = events.filter((e) => e.correct).length;
  const goals = [
    ...new Map(round.questions.map((q) => [q.knowledgeId, q])).values(),
  ];
  const improved = goals.filter(
    (q) =>
      after[q.knowledgeId]?.status === "geübt" &&
      (!round.before[q.knowledgeId] ||
        round.before[q.knowledgeId].status === "entdeckt"),
  ).length;
  const secured = goals.filter(
    (q) =>
      after[q.knowledgeId]?.status === "gefestigt" &&
      round.before[q.knowledgeId]?.status !== "gefestigt",
  ).length;
  return {
    events,
    correct,
    improved,
    secured,
    genres,
    bestStreak,
    accuracy: Math.round((100 * correct) / round.questions.length),
    wrong: events.filter((e) => !e.correct && hasAnswer(e)).length,
    dontKnow: events.filter((e) => e.dontKnow).length,
    timedOut: events.filter((e) => !e.correct && !hasAnswer(e)).length,
    guessed: events.filter((e) => e.guessed).length,
    recovered: new Set(
      events
        .filter(
          (e) => e.correct && !e.guessed && mistakesBefore.has(e.knowledgeId),
        )
        .map((e) => e.knowledgeId),
    ).size,
    newGoals: goals.filter((q) => !round.before[q.knowledgeId]).length,
  };
}

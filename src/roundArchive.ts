import type { Question, Round, State } from "./model";

export const roundFact = (
  q: Question,
): NonNullable<Round["archive"]>["questions"][number] => ({
  id: q.id,
  knowledgeId: q.knowledgeId,
  version: q.version,
  domain: q.domain,
  difficulty: q.difficulty,
  correctId: q.correctId,
  answerIds: q.answers.map((a) => a.id),
  metadata: {
    ...(q.metadata.subdomain ? { subdomain: q.metadata.subdomain } : {}),
    ...(q.metadata.person_id ? { person_id: "actor" } : {}),
  },
  tags: q.tags.includes("Preisträger") ? ["Preisträger"] : [],
});

export const roundFacts = (round: Round) =>
  round.archive?.questions ?? round.questions;
export const roundQuestionCount = (round: Round) => roundFacts(round).length;

// Called after leaving the immediate result, and once when opening a saved game.
// Events retain the minimal ledger needed to rebuild XP, learning and scores.
export function archiveClosedRounds(state: State) {
  for (const round of state.rounds) {
    if (round.status === "active" || round.archive || !round.questions.length)
      continue;
    round.archive = {
      version: 1,
      questions: round.questions.map(roundFact),
    };
    round.questions = [];
    round.order = [];
    round.before = {};
    delete round.familiaritySnapshot;
    if (round.run) {
      round.run.pool = [];
      round.run.queue = [];
    }
  }
  const expired = new Set(
    state.rounds
      .filter((r) => r.archive && r.duel)
      .flatMap((r) => roundFacts(r).map((q) => q.id)),
  );
  const retained = new Set(
    state.rounds
      .filter((r) => !r.archive)
      .flatMap((r) => r.questions.map((q) => q.id)),
  );
  const removable = state.questions.filter(
    (q) =>
      q.id.startsWith("DUEL-") &&
      q.metadata.duel_question_id &&
      expired.has(q.id) &&
      !retained.has(q.id),
  );
  if (removable.length) {
    const ids = new Set(removable.map((q) => q.id));
    state.questions = state.questions.filter((q) => !ids.has(q.id));
    if (state.bundledQuestionIds)
      state.bundledQuestionIds = state.bundledQuestionIds.filter(
        (id) => !ids.has(id),
      );
  }
}

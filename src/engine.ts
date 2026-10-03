import type {
  AnswerEvent,
  AnswerChoice,
  Mode,
  Question,
  Round,
  State,
  QuizFilters,
} from "./model";
import { uid } from "./model";
import { canonicalFilters, matchesFilters } from "./filters";
import {
  pathQuestions,
  retainJourneyUnlocks,
  learningPathProgress,
  newlyUnlocked,
} from "./learningPath";
import { familiarityOf, familiarities, selectionRule } from "./familiarity";
import { discoveryContext } from "./discovery";
import { matchesTopic } from "./categories";
import { prepareFactQuestion } from "./filmFacts";
import { errorTrainingContext, type OpenMistake } from "./errorTraining";
import { RULES, learn } from "./learning";
import { careerSummary, migrateCareer } from "./career";
export { DAY, RULES, dayKey, learn } from "./learning";
export function score(correct: boolean, elapsedMs: number) {
  const valid = correct && elapsedMs >= 0 && elapsedMs < 30_000;
  return {
    knowledgePoints: valid ? 100 : 0,
    timeBonus: valid ? 2 * Math.floor((30_000 - elapsedMs) / 1000) : 0,
  };
}
export function elapsed(
  start: { wall: number; mono: number },
  wall = Date.now(),
  mono = performance.now(),
) {
  return Math.max(0, wall - start.wall, mono - start.mono);
}
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function selectQuestions(
  questions: Question[],
  learning: State["learning"],
  options: {
    topic: string;
    difficulty: string;
    filters?: QuizFilters;
    mode: Mode;
    size: number;
    now: number;
    recentKnowledgeIds?: Set<string>;
    introductoryQuestionIds?: Set<string>;
    mistakes?: Map<string, OpenMistake>;
  },
  random = Math.random,
): Question[] {
  const pool = questions.filter(
    (q) =>
      matchesTopic(q, options.topic) &&
      (options.filters
        ? matchesFilters(q, options.filters)
        : options.difficulty === "Alle Stufen" ||
          q.difficulty === options.difficulty),
  );
  const byGoal = new Map<string, Question[]>();
  for (const q of pool) {
    if (!byGoal.has(q.knowledgeId)) byGoal.set(q.knowledgeId, []);
    byGoal.get(q.knowledgeId)!.push(q);
  }
  // Draw goals first: a goal with extra variants has no extra tickets.
  const unique = shuffle([...byGoal.values()], random).map(
    (qs) => qs[Math.min(qs.length - 1, Math.floor(random() * qs.length))],
  );
  if (options.mode === "fehler") {
    return unique
      .filter((q) => options.mistakes?.has(q.knowledgeId))
      .map((q) => {
        const last = options.mistakes!.get(q.knowledgeId)!;
        return (
          byGoal.get(q.knowledgeId)!.find((v) => v.id === last.questionId) ?? q
        );
      })
      .sort((a, b) => {
        const ma = options.mistakes!.get(a.knowledgeId)!;
        const mb = options.mistakes!.get(b.knowledgeId)!;
        return mb.failures - ma.failures || mb.lastWrongAt - ma.lastWrongAt;
      })
      .slice(0, options.size);
  }
  if (options.mode === "ueben") return unique.slice(0, options.size);
  if (options.mode === "rekord") {
    const cells = new Map<string, Question[]>();
    for (const q of unique) {
      const key = `${q.difficulty}:${familiarityOf(q) ?? 0}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key)!.push(q);
    }
    const buckets = shuffle([...cells.values()], random);
    const result: Question[] = [];
    while (result.length < options.size && buckets.some((b) => b.length))
      for (const bucket of buckets)
        if (bucket.length && result.length < options.size)
          result.push(bucket.pop()!);
    return shuffle(result, random);
  }
  const due = unique.filter(
    (q) =>
      learning[q.knowledgeId] && learning[q.knowledgeId].due <= options.now,
  );
  const result: Question[] = [];
  const take = (list: Question[], n: number) => {
    for (const q of list) {
      if (n <= 0 || result.length >= options.size) break;
      if (!result.includes(q)) {
        result.push(q);
        n--;
      }
    }
  };
  const dueCap = Math.min(5, options.size); // bounded return after a long pause
  if (options.mode === "entdecken") {
    const unseen = unique.filter((q) => !learning[q.knowledgeId]);
    // Introduce a newly unlocked stage without overriding the user's filters.
    take(
      unseen.filter((q) => options.introductoryQuestionIds?.has(q.id)),
      Math.ceil(options.size / 2),
    );
    take(unseen, options.size);
    const repeats = unique
      .filter((q) => learning[q.knowledgeId])
      .sort((a, b) => {
        const pa = learning[a.knowledgeId],
          pb = learning[b.knowledgeId];
        return (
          (pa.lastSeenAt ?? pa.lastSecure ?? 0) -
            (pb.lastSeenAt ?? pb.lastSecure ?? 0) || pa.seen - pb.seen
        );
      });
    let dueTaken = 0;
    // Recent answers are a fallback, even when already due again after a mistake.
    for (const recent of [false, true]) {
      const candidates = repeats.filter(
        (q) => !!options.recentKnowledgeIds?.has(q.knowledgeId) === recent,
      );
      const overdue = candidates.filter((q) => due.includes(q));
      const countBefore = result.length;
      take(overdue, dueCap - dueTaken);
      dueTaken += result.length - countBefore;
      take(
        candidates.filter((q) => !due.includes(q)),
        options.size,
      );
    }
    return shuffle(result, random);
  }
  return shuffle(result, random);
}
export const recordKey = (r: Round) =>
  r.filters
    ? JSON.stringify([
        "genres-v1",
        canonicalFilters(r.filters),
        r.topic,
        r.questions.length,
        r.ruleVersion,
      ])
    : JSON.stringify([
        r.topic,
        r.difficulty,
        r.questions.length,
        r.ruleVersion,
      ]);
export const points = (events: AnswerEvent[]) =>
  events.reduce((sum, e) => sum + e.knowledgePoints + e.timeBonus, 0);
export const badgeEligible = (q: Question) =>
  q.difficulty === "leicht" &&
  ((q.domain === "Film" && q.metadata.subdomain === "Science-Fiction") ||
    (q.domain === "Film / Science-Fiction" &&
      q.badgeTags.includes("grundlagen")));
export function rebuild(state: State, awardBadges = false) {
  const career = careerSummary(state);
  state.learning = career.learning;
  const done = state.rounds.filter((r) => r.status === "completed");
  migrateCareer(state, career.earned);
  state.experience = career.earned + state.career!.legacyBonus;
  state.records = {};
  const roundPoints = new Map<string, number>();
  for (const event of state.events)
    roundPoints.set(
      event.roundId,
      (roundPoints.get(event.roundId) ?? 0) +
        event.knowledgePoints +
        event.timeBonus,
    );
  for (const r of done.filter((r) => r.mode === "rekord")) {
    const value = roundPoints.get(r.id) ?? 0;
    const key = recordKey(r);
    if (!state.records[key] || value > state.records[key].points)
      state.records[key] = { points: value, roundId: r.id };
  }
  const eligible = new Set(
    state.questions.filter(badgeEligible).map((q) => q.knowledgeId),
  );
  if (
    awardBadges &&
    [...eligible].filter((id) => state.learning[id]?.status === "gefestigt")
      .length >= RULES.badgeMinimum &&
    !state.badges.includes("sci-fi-10-v1")
  )
    state.badges.push("sci-fi-10-v1");
  retainJourneyUnlocks(state);
}
// Pending rounds cannot change earned XP, records or journey unlocks. Update
// only their learning; old/backdated imports still use the complete replay.
export function learnPending(state: State, events: AnswerEvent[]) {
  if (!events.length) return;
  const first = events.reduce((at, event) => Math.min(at, event.at), Infinity);
  const pending = new Set(events.map((e) => e.id));
  if (
    !state.career ||
    state.events.some((e) => !pending.has(e.id) && e.at > first)
  ) {
    rebuild(state);
    return;
  }
  for (const event of [...events].sort((a, b) => a.at - b.at))
    state.learning[event.knowledgeId] = learn(
      state.learning[event.knowledgeId],
      event,
    );
}
export function startRound(
  state: State,
  options: {
    mode: Mode;
    topic: string;
    difficulty: string;
    filters?: QuizFilters;
    sourceRoundId?: string;
  },
  now = Date.now(),
): Round {
  if (state.rounds.some((r) => r.status === "active"))
    throw new Error(
      "Es läuft bereits eine Runde. Setze sie fort oder beende sie.",
    );
  const selected = selectQuestions(
    pathQuestions(state, options.mode),
    state.learning,
    {
      ...options,
      ...(options.mode === "entdecken" ? discoveryContext(state) : {}),
      ...(options.mode === "fehler"
        ? errorTrainingContext(state, options.sourceRoundId)
        : {}),
      size: state.rounds.some((r) => r.status === "completed") ? 10 : 5,
      now,
    },
  );
  const questions = selected.map((q) =>
    structuredClone(
      prepareFactQuestion(
        q,
        [...state.rounds]
          .reverse()
          .flatMap((r) => r.questions)
          .find((previous) => previous.id === q.id),
      ),
    ),
  );
  if (!questions.length)
    throw new Error("Für diese Auswahl sind keine Fragen verfügbar.");
  const { sourceRoundId: _sourceRoundId, ...roundOptions } = options;
  const round: Round = {
    ...roundOptions,
    ...(options.filters ? { filters: canonicalFilters(options.filters) } : {}),
    id: uid(),
    familiaritySnapshot: Object.fromEntries(
      questions.map((q) => [q.id, familiarityOf(q) ?? 0]),
    ),
    questions,
    order: questions.map((q) => shuffle(q.answers.map((a) => a.id))),
    events: [],
    startedAt: now,
    finishedAt: null,
    status: "active",
    ruleVersion:
      selectionRule(
        questions,
        options.filters?.familiarities ?? familiarities,
      ) + (state.settings.solutionDisplay === "round" ? ".L" : ""),
    before: structuredClone(state.learning),
    ...(state.settings.solutionDisplay === "round"
      ? { solutionDisplay: "round" as const }
      : {}),
  };
  state.rounds.push(round);
  return round;
}
export function answer(
  state: State,
  roundId: string,
  questionId: string,
  choice: AnswerChoice,
  elapsedMs: number,
  at = Date.now(),
) {
  const round = state.rounds.find((r) => r.id === roundId);
  if (!round || round.status !== "active") return;
  const q = round.questions[round.events.length];
  if (!q || q.id !== questionId) return; // transactional double-submit guard
  const answerId = typeof choice === "string" ? choice : null;
  const dontKnow = choice !== null && typeof choice === "object";
  if (answerId !== null && !q.answers.some((a) => a.id === answerId))
    throw new Error("Unbekannte Antwort.");
  const correct =
    answerId === q.correctId && (round.mode !== "rekord" || elapsedMs < 30_000);
  const event: AnswerEvent = {
    id: `${round.id}:${q.knowledgeId}`,
    roundId,
    questionId: q.id,
    knowledgeId: q.knowledgeId,
    version: q.version,
    answerId: round.mode === "rekord" && elapsedMs >= 30_000 ? null : answerId,
    ...(dontKnow && (round.mode !== "rekord" || elapsedMs < 30_000)
      ? { dontKnow: true as const }
      : {}),
    correct,
    guessed: false,
    at,
    elapsedMs,
    ...(round.mode === "rekord"
      ? score(correct, elapsedMs)
      : { knowledgePoints: 0, timeBonus: 0 }),
  };
  if (state.events.some((e) => e.id === event.id)) return;
  state.events.push(event);
  round.events.push(event.id);
  learnPending(state, [event]);
}
export function guess(state: State, eventId: string) {
  const e = state.events.find((e) => e.id === eventId);
  const r = state.rounds.find((r) => r.id === e?.roundId);
  if (e?.correct && !e.guessed && r?.status === "active") {
    e.guessed = true;
    const position = state.events.indexOf(e);
    if (
      !state.career ||
      state.events.some(
        (event, index) =>
          event.at > e.at || (index > position && event.at === e.at),
      )
    ) {
      rebuild(state);
      return;
    }
    // Only this goal changed; XP for the active round are still unearned.
    let learned;
    for (const event of state.events
      .filter((event) => event.knowledgeId === e.knowledgeId)
      .sort((a, b) => a.at - b.at))
      learned = learn(learned, event);
    state.learning[e.knowledgeId] = learned!;
  }
}
export function complete(state: State, roundId: string, now = Date.now()) {
  const r = state.rounds.find((r) => r.id === roundId);
  if (r?.status === "active" && r.events.length === r.questions.length) {
    const before = learningPathProgress(state);
    r.status = "completed";
    r.finishedAt = now;
    rebuild(state, true);
    r.unlocks = newlyUnlocked(before, state);
  }
}

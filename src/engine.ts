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
import {
  canonicalFilters,
  matchesFilters,
  genreOf,
  questionSources,
} from "./filters";
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
import { roundQuestionCount } from "./roundArchive";
import {
  isRecordMode,
  isRankedRecord,
  isEndlessMode,
  BANK_START,
  bankAfterAnswer,
  questionLimit,
  eventIdFor,
  runRule,
} from "./recordModes";
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
    recordPreset?: "standard" | "genre";
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
  if (isRecordMode(options.mode)) {
    if (
      options.recordPreset === "standard" ||
      options.recordPreset === "genre"
    ) {
      const result: Question[] = [];
      for (const [level, count] of [
        ["leicht", 3],
        ["mittel", 4],
        ["schwer", 3],
      ] as const)
        result.push(
          ...unique
            .filter((q) => q.difficulty === level)
            .slice(0, Math.min(count, options.size - result.length)),
        );
      result.push(
        ...unique
          .filter((q) => !result.includes(q))
          .slice(0, options.size - result.length),
      );
      return shuffle(result, random);
    }
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
  JSON.stringify([
    "records-v3",
    r.mode,
    r.filters ? canonicalFilters(r.filters) : null,
    r.topic,
    r.run ? "endless" : roundQuestionCount(r),
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
  const pointsByRound = new Map<string, number>();
  for (const e of state.events)
    pointsByRound.set(
      e.roundId,
      (pointsByRound.get(e.roundId) ?? 0) + e.knowledgePoints + e.timeBonus,
    );
  for (const r of done.filter(isRankedRecord)) {
    const value = pointsByRound.get(r.id) ?? 0;
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
    recordPreset?: "standard" | "genre";
  },
  now = Date.now(),
): Round {
  if (state.rounds.some((r) => r.status === "active"))
    throw new Error(
      "Es läuft bereits eine Runde. Setze sie fort oder beende sie.",
    );
  if (
    isEndlessMode(options.mode) ||
    (isRecordMode(options.mode) && options.recordPreset)
  ) {
    options = {
      ...options,
      recordPreset: options.recordPreset ?? "standard",
      filters: options.filters ?? {
        genres: [
          ...new Set(
            state.questions
              .filter(
                (q) =>
                  !state.bundledQuestionIds ||
                  state.bundledQuestionIds.includes(q.id),
              )
              .map(genreOf),
          ),
        ].sort(),
        sources: [...questionSources],
        difficulties: ["leicht", "mittel", "schwer"],
        familiarities: [...familiarities],
      },
    };
  }
  const selected = selectQuestions(
    pathQuestions(state, options.mode).filter(
      (q) =>
        (options.recordPreset !== "standard" &&
          options.recordPreset !== "genre") ||
        !state.bundledQuestionIds ||
        state.bundledQuestionIds.includes(q.id),
    ),
    state.learning,
    {
      ...options,
      ...(options.mode === "entdecken" ? discoveryContext(state) : {}),
      ...(options.mode === "fehler"
        ? errorTrainingContext(state, options.sourceRoundId)
        : {}),
      size: isEndlessMode(options.mode)
        ? 1
        : options.recordPreset
          ? 10
          : state.rounds.some((r) => r.status === "completed")
            ? 10
            : 5,
      now,
    },
  );
  const previousById = new Map<string, Question>();
  for (const r of state.rounds)
    for (const q of r.questions) previousById.set(q.id, q);
  const questions = selected.map((q) =>
    structuredClone(prepareFactQuestion(q, previousById.get(q.id))),
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
        options.filters?.sources && !options.filters.sources.includes("film")
          ? []
          : (options.filters?.familiarities ?? familiarities),
      ) + (state.settings.solutionDisplay === "round" ? ".L" : ""),
    before: structuredClone(
      Object.fromEntries(
        questions.flatMap((q) =>
          state.learning[q.knowledgeId]
            ? [[q.knowledgeId, state.learning[q.knowledgeId]]]
            : [],
        ),
      ),
    ),
    ...(state.settings.solutionDisplay === "round"
      ? { solutionDisplay: "round" as const }
      : {}),
  };
  state.rounds.push(round);
  if (
    isRecordMode(options.mode) &&
    (options.recordPreset || isEndlessMode(options.mode))
  ) {
    round.recordPreset = options.recordPreset ?? "standard";
    round.ruleVersion = runRule(options.mode, round.recordPreset);
    if (isEndlessMode(options.mode)) {
      delete round.solutionDisplay;
      const official =
        state.bundledQuestionIds && new Set(state.bundledQuestionIds);
      const pool = state.questions.filter(
        (q) =>
          ((options.recordPreset !== "standard" &&
            options.recordPreset !== "genre") ||
            !official ||
            official.has(q.id)) &&
          matchesTopic(q, options.topic) &&
          (!options.filters || matchesFilters(q, options.filters)),
      );
      round.run = {
        version: 1,
        pool: pool.map((q) => q.id),
        queue: [],
        cycle: 0,
        bankMs: BANK_START,
        ended: false,
      };
      round.questions = [];
      round.order = [];
      round.before = {};
      appendRunQuestion(state, round);
    }
  }
  return round;
}
function appendRunQuestion(state: State, round: Round) {
  const run = round.run!;
  const byId = new Map(state.questions.map((q) => [q.id, q]));
  if (!run.queue.length) {
    const pool = run.pool
      .map((id) => byId.get(id))
      .filter((q): q is Question => !!q);
    const goals = new Map<string, Question[]>();
    for (const q of pool) {
      const variants = goals.get(q.knowledgeId) ?? [];
      variants.push(q);
      goals.set(q.knowledgeId, variants);
    }
    const buckets = new Map<string, Question[]>();
    for (const variants of shuffle([...goals.values()])) {
      const q = shuffle(variants)[0];
      const bucket = buckets.get(q.difficulty) ?? [];
      bucket.push(q);
      buckets.set(q.difficulty, bucket);
    }
    const queue: Question[] = [];
    while ([...buckets.values()].some((b) => b.length)) {
      const block: Question[] = [];
      if (round.recordPreset === "standard" || round.recordPreset === "genre") {
        for (const [level, count] of [
          ["leicht", 3],
          ["mittel", 4],
          ["schwer", 3],
        ] as const)
          for (let i = 0; i < count && block.length < 10; i++) {
            const q = buckets.get(level)?.pop();
            if (q) block.push(q);
          }
      } else {
        const active = shuffle([...buckets.values()]);
        while (block.length < 10 && active.some((b) => b.length))
          for (const bucket of active) {
            if (block.length === 10) break;
            const q = bucket.pop();
            if (q) block.push(q);
          }
      }
      for (const bucket of buckets.values())
        while (bucket.length && block.length < 10) block.push(bucket.pop()!);
      queue.push(...shuffle(block));
    }
    const previous = round.questions.at(-1)?.knowledgeId;
    if (queue.length > 1 && queue[0].knowledgeId === previous) {
      const next = queue.findIndex((q) => q.knowledgeId !== previous);
      if (next > 0) [queue[0], queue[next]] = [queue[next], queue[0]];
    }
    run.queue = queue.map((q) => q.id);
    run.cycle++;
  }
  const source = byId.get(run.queue.shift()!);
  if (!source)
    throw new Error("Der Fragenpool dieses Laufs ist nicht mehr verfügbar.");
  if (
    !round.questions.some((q) => q.knowledgeId === source.knowledgeId) &&
    state.learning[source.knowledgeId]
  )
    round.before[source.knowledgeId] = structuredClone(
      state.learning[source.knowledgeId],
    );
  const previous = [...round.questions]
    .reverse()
    .find((q) => q.id === source.id);
  const q = structuredClone(prepareFactQuestion(source, previous));
  round.questions.push(q);
  round.order.push(shuffle(q.answers.map((a) => a.id)));
  round.familiaritySnapshot![q.id] = familiarityOf(q) ?? 0;
}
export function answer(
  state: State,
  roundId: string,
  questionId: string,
  choice: AnswerChoice,
  elapsedMs: number,
  at = Date.now(),
  expectedIndex?: number,
) {
  const round = state.rounds.find((r) => r.id === roundId);
  if (!round || round.status !== "active") return;
  if (expectedIndex !== undefined && round.events.length !== expectedIndex)
    return;
  const q = round.questions[round.events.length];
  if (!q || q.id !== questionId) return; // transactional double-submit guard
  const answerId = typeof choice === "string" ? choice : null;
  const dontKnow = choice !== null && typeof choice === "object";
  if (answerId !== null && !q.answers.some((a) => a.id === answerId))
    throw new Error("Unbekannte Antwort.");
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0)
    throw new Error("Ungültige Antwortzeit.");
  const timed = isRecordMode(round.mode);
  const limit = questionLimit(round);
  const spent = timed ? Math.min(elapsedMs, limit) : elapsedMs;
  const correct = answerId === q.correctId && (!timed || elapsedMs < limit);
  const event: AnswerEvent = {
    id: eventIdFor(round, round.events.length),
    roundId,
    questionId: q.id,
    knowledgeId: q.knowledgeId,
    version: q.version,
    answerId: timed && elapsedMs >= limit ? null : answerId,
    ...(dontKnow && (!timed || elapsedMs < limit)
      ? { dontKnow: true as const }
      : {}),
    correct,
    guessed: false,
    at,
    elapsedMs: spent,
    ...(timed ? score(correct, spent) : { knowledgePoints: 0, timeBonus: 0 }),
  };
  if (state.events.some((e) => e.id === event.id)) return;
  state.events.push(event);
  round.events.push(event.id);
  learnPending(state, [event]);
  if (round.run) {
    if (round.mode === "zeitkonto")
      round.run.bankMs = bankAfterAnswer(round.run.bankMs, correct, spent);
    round.run.ended =
      round.mode === "fehlerfrei" ? !correct : round.run.bankMs === 0;
    if (!round.run.ended) appendRunQuestion(state, round);
    else complete(state, round.id, at);
  }
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

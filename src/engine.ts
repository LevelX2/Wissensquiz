import type {
  AnswerEvent,
  Learning,
  Mode,
  Question,
  Round,
  State,
  QuizFilters,
} from "./model";
import { uid } from "./model";
import { canonicalFilters, matchesFilters } from "./filters";
import { pathQuestions } from "./learningPath";
import { discoveryContext } from "./discovery";
import { matchesTopic } from "./categories";
export const DAY = 86_400_000;
export const RULES = {
  version: "1",
  intervals: [1, 3, 7, 21],
  wrongMs: 10 * 60_000,
  guessedMs: 6 * 60 * 60_000,
  masteryDays: 4,
  masteryGap: 7 * DAY,
  badgeMinimum: 10,
};
// Learning days use the device's local calendar, independently of the round timer.
export const dayKey = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
export function learn(
  previous: Learning | undefined,
  event: AnswerEvent,
): Learning {
  const p: Learning = previous
    ? structuredClone(previous)
    : {
        knowledgeId: event.knowledgeId,
        stage: 0,
        status: "entdeckt",
        due: 0,
        lastSecure: null,
        lastSeenAt: null,
        lastAdvancedDay: null,
        secureDays: [],
        seen: 0,
      };
  const previousSeenAt = p.lastSeenAt ?? p.lastSecure;
  p.lastSeenAt = event.at;
  p.seen++;
  if (!event.correct || event.guessed) {
    p.stage = 0;
    p.status = "entdeckt";
    p.due = event.at + (event.guessed ? RULES.guessedMs : RULES.wrongMs);
    return p;
  }
  const day = dayKey(event.at);
  if (p.lastAdvancedDay === day || (p.stage > 0 && event.at < p.due)) return p;
  const gap = previousSeenAt === null ? 0 : event.at - previousSeenAt;
  p.secureDays = [...new Set([...p.secureDays, day])];
  p.stage = Math.min(4, p.stage + 1);
  p.status =
    p.status === "gefestigt" ||
    (p.stage === 4 &&
      p.secureDays.length >= RULES.masteryDays &&
      gap >= RULES.masteryGap)
      ? "gefestigt"
      : "geübt";
  p.lastAdvancedDay = day;
  p.lastSecure = event.at;
  p.due = event.at + RULES.intervals[p.stage - 1] * DAY;
  return p;
}
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
  },
  random = Math.random,
): Question[] {
  const pool = shuffle(
    questions.filter(
      (q) =>
        matchesTopic(q, options.topic) &&
        (options.filters
          ? matchesFilters(q, options.filters)
          : options.difficulty === "Alle Stufen" ||
            q.difficulty === options.difficulty),
    ),
    random,
  );
  const unique = [...new Map(pool.map((q) => [q.knowledgeId, q])).values()];
  if (options.mode === "rekord") return unique.slice(0, options.size);
  const due = unique.filter(
    (q) =>
      learning[q.knowledgeId] && learning[q.knowledgeId].due <= options.now,
  );
  const safe = unique.filter(
    (q) => learning[q.knowledgeId]?.status === "gefestigt" && !due.includes(q),
  );
  const fresh = unique.filter((q) => !due.includes(q) && !safe.includes(q));
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
  take(
    fresh,
    options.mode === "ueben"
      ? Math.ceil(options.size * 0.3)
      : Math.ceil(options.size * 0.5),
  );
  take(due, options.mode === "ueben" ? dueCap : Math.ceil(options.size * 0.3));
  take(safe, Math.floor(options.size * 0.2));
  take(fresh, options.size);
  take(safe, options.size);
  take(due, dueCap - result.filter((q) => due.includes(q)).length);
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
  state.learning = {};
  for (const event of [...state.events].sort((a, b) => a.at - b.at))
    state.learning[event.knowledgeId] = learn(
      state.learning[event.knowledgeId],
      event,
    );
  const done = state.rounds.filter((r) => r.status === "completed");
  state.experience = done.length * 10;
  state.records = {};
  for (const r of done.filter((r) => r.mode === "rekord")) {
    const value = points(state.events.filter((e) => e.roundId === r.id));
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
}
export function startRound(
  state: State,
  options: {
    mode: Mode;
    topic: string;
    difficulty: string;
    filters?: QuizFilters;
  },
  now = Date.now(),
): Round {
  if (state.rounds.some((r) => r.status === "active"))
    throw new Error(
      "Es läuft bereits eine Runde. Setze sie fort oder beende sie.",
    );
  const questions = selectQuestions(pathQuestions(state), state.learning, {
    ...options,
    ...(options.mode === "entdecken" ? discoveryContext(state) : {}),
    size: state.rounds.some((r) => r.status === "completed") ? 10 : 5,
    now,
  });
  if (!questions.length)
    throw new Error("Für diese Auswahl sind keine Fragen verfügbar.");
  const round: Round = {
    ...options,
    ...(options.filters ? { filters: canonicalFilters(options.filters) } : {}),
    id: uid(),
    questions,
    order: questions.map((q) => shuffle(q.answers.map((a) => a.id))),
    events: [],
    startedAt: now,
    finishedAt: null,
    status: "active",
    ruleVersion: RULES.version,
    before: structuredClone(state.learning),
  };
  state.rounds.push(round);
  return round;
}
export function answer(
  state: State,
  roundId: string,
  questionId: string,
  answerId: string | null,
  elapsedMs: number,
  at = Date.now(),
) {
  const round = state.rounds.find((r) => r.id === roundId);
  if (!round || round.status !== "active") return;
  const q = round.questions[round.events.length];
  if (!q || q.id !== questionId) return; // transactional double-submit guard
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
  rebuild(state);
}
export function guess(state: State, eventId: string) {
  const e = state.events.find((e) => e.id === eventId);
  const r = state.rounds.find((r) => r.id === e?.roundId);
  if (e?.correct && !e.guessed && r?.status === "active") {
    e.guessed = true;
    rebuild(state);
  }
}
export function complete(state: State, roundId: string, now = Date.now()) {
  const r = state.rounds.find((r) => r.id === roundId);
  if (r?.status === "active" && r.events.length === r.questions.length) {
    r.status = "completed";
    r.finishedAt = now;
    rebuild(state, true);
  }
}

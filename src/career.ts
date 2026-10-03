import { hasAnswer, type Learning, type State } from "./model";
import { dayKey, learn } from "./learning";
import { roundFacts } from "./roundArchive";

export const careerTitles = [
  { level: 1, title: "Kinogänger" },
  { level: 5, title: "Filmfan" },
  { level: 10, title: "Cineast" },
  { level: 20, title: "Filmchronist" },
  { level: 35, title: "Filmlegende" },
] as const;
export const levelThreshold = (level: number) => 25 * (level - 1) * (level + 2);
export function careerProgress(experience: number) {
  const xp = Math.max(0, Math.floor(experience));
  let level = Math.floor((Math.sqrt(9 + (4 * xp) / 25) - 1) / 2);
  level = Math.max(1, level);
  // Keep boundary behavior exact even at large floating-point values.
  while (levelThreshold(level + 1) <= xp) level++;
  while (levelThreshold(level) > xp) level--;
  const needed = 100 + 50 * (level - 1);
  const current = xp - levelThreshold(level);
  const title = [...careerTitles].reverse().find((t) => level >= t.level)!;
  return {
    level,
    title: title.title,
    tier: title.level,
    current,
    needed,
    remaining: needed - current,
    experience: xp,
  };
}

export const xpLabels = {
  participation: "Fragen beantwortet",
  correct: "Sichere richtige Antworten",
  discovered: "Erstmals sicher gelöst",
  recovered: "Fehler erstmals korrigiert",
  mastered: "Erstmals gefestigt",
} as const;
export type XpBreakdown = Record<keyof typeof xpLabels, number>;
export const totalXp = (value: XpBreakdown) =>
  Object.values(value).reduce((sum, xp) => sum + xp, 0);
const emptyXp = (): XpBreakdown => ({
  participation: 0,
  correct: 0,
  discovered: 0,
  recovered: 0,
  mastered: 0,
});

// Replay original events and snapshots, rather than current questions or learning
// totals. Later answers cannot change an earlier round's reward.
export function careerSummary(state: State) {
  const completed = state.rounds
    .filter((r) => r.status === "completed")
    .sort((a, b) => a.finishedAt! - b.finishedAt!);
  const rounds = new Map(completed.map((r) => [r.id, emptyXp()]));
  const questions = new Map(
    completed.flatMap((r) =>
      roundFacts(r).map((q) => [`${r.id}:${q.id}`, q] as const),
    ),
  );
  const learning: Record<string, Learning> = {};
  const answeredDays = new Set<string>();
  const secureDays = new Set<string>();
  const discovered = new Set<string>();
  const recovered = new Set<string>();
  const mastered = new Set<string>();
  const mistakes = new Set<string>();
  for (const event of [...state.events].sort((a, b) => a.at - b.at)) {
    const id = event.knowledgeId;
    const next = learn(learning[id], event);
    learning[id] = next;
    const wasMistake = mistakes.has(id);
    const safe = event.correct && !event.guessed;
    if (!event.correct) mistakes.add(id);
    else if (safe) mistakes.delete(id);
    const xp = rounds.get(event.roundId);
    const q = questions.get(`${event.roundId}:${event.questionId}`);
    if (!xp || !q) continue;
    const key = JSON.stringify([id, dayKey(event.at)]);
    if (hasAnswer(event) && !answeredDays.has(key)) {
      xp.participation++;
      answeredDays.add(key);
    }
    if (!safe) continue;
    if (!secureDays.has(key)) {
      xp.correct += { leicht: 2, mittel: 3, schwer: 5, experte: 5 }[
        q.difficulty
      ];
      secureDays.add(key);
    }
    if (!discovered.has(id)) {
      xp.discovered += 2;
      discovered.add(id);
    }
    if (wasMistake && !recovered.has(id)) {
      xp.recovered += 4;
      recovered.add(id);
    }
    if (next.status === "gefestigt" && !mastered.has(id)) {
      xp.mastered += 8;
      mastered.add(id);
    }
  }
  let earned = 0;
  const progress = new Map<string, { before: number; after: number }>();
  for (const r of completed) {
    const before = earned + (state.career?.legacyBonus ?? 0);
    earned += totalXp(rounds.get(r.id)!);
    progress.set(r.id, {
      before,
      after: earned + (state.career?.legacyBonus ?? 0),
    });
  }
  return { earned, rounds, progress, learning };
}

// Legacy activity XP are derived from completed rounds, never from a supplied
// experience counter. Preserve both the level and its fractional progress once.
export function migrateCareer(state: State, earned: number) {
  if (state.career) return;
  const oldXp =
    state.rounds.filter((r) => r.status === "completed").length * 10;
  const level = 1 + Math.floor(oldXp / 100);
  const preserved =
    levelThreshold(level) +
    Math.floor(((oldXp % 100) / 100) * (100 + 50 * (level - 1)));
  state.career = { version: 1, legacyBonus: Math.max(0, preserved - earned) };
}

import { hasAnswer, type State } from "./model";
import { roundFacts } from "./roundArchive";
import { perfectRoundLabel, perfectRoundMilestones } from "./perfectRounds";
import { successTiers, type SuccessTier } from "./successTiers";

export type AchievementCounts = {
  completed: number;
  perfectTens: number;
  zeroTens: number;
};
export const achievementTracks = [
  {
    id: "completed",
    icon: "clapper",
    title: "Immer eine Runde weiter",
    description:
      "Abgeschlossene Runden in allen Spielarten. Auch kurze Runden zählen; abgebrochene nicht.",
    message: "Du bleibst dran. Eine Runde weiter!",
    milestones: [1, 10, 25, 50, 100],
    label: (n: number) =>
      n === 1 ? "Erste Runde abgeschlossen" : `${n} Runden abgeschlossen`,
  },
  {
    id: "perfectTens",
    icon: "star",
    title: "Perfekte Zehnerrunden",
    description:
      "Zehn verschiedene Filmfakten in einer abgeschlossenen Runde sicher richtig. Geratene Treffer zählen nicht.",
    message: "Zehn von zehn sicher richtig – stark gemacht!",
    milestones: perfectRoundMilestones,
    label: perfectRoundLabel,
  },
  {
    id: "zeroTens",
    icon: "cloud",
    title: "Heute war nicht mein Tag",
    description:
      "Eine Zehnerrunde bis zum Ende gespielt, ohne eine richtige Antwort. Auch „Keine Ahnung“ zählt als Antwort; Zeitablauf nicht.",
    message:
      "Kein Treffer, trotzdem bis zum Ende gespielt. Auch das gehört dazu.",
    milestones: [1],
    label: () => "Heute war nicht mein Tag",
  },
] as const;

export type AchievementIconKind =
  | (typeof achievementTracks)[number]["icon"]
  | "film"
  | "book"
  | "compass"
  | "person"
  | "trophy";
export type Achievement = {
  id: string;
  label: string;
  description: string;
  icon: AchievementIconKind;
  tier: SuccessTier;
};
export function reachedAchievements(counts: AchievementCounts): Achievement[] {
  return achievementTracks.flatMap((track) =>
    track.milestones.flatMap((n, index) =>
      counts[track.id] === n
        ? [
            {
              id: `${track.id}:${n}`,
              label: track.label(n),
              description: track.message,
              icon: track.icon,
              tier: successTiers[index],
            },
          ]
        : [],
    ),
  );
}

// Only used for the isolated trial/local test state. Account totals come from
// the private server projection, without downloading the player's history.
export function localAchievements(state: State, roundId?: string) {
  const counts: AchievementCounts = {
    completed: 0,
    perfectTens: 0,
    zeroTens: 0,
  };
  let snapshot: AchievementCounts = { ...counts };
  const byRound = new Map<string, State["events"]>();
  for (const event of state.events) {
    const events = byRound.get(event.roundId) ?? [];
    events.push(event);
    byRound.set(event.roundId, events);
  }
  const rounds = [...state.rounds].sort(
    (a, b) =>
      (a.finishedAt ?? 0) - (b.finishedAt ?? 0) || a.id.localeCompare(b.id),
  );
  for (const round of rounds) {
    if (round.status !== "completed") continue;
    const facts = roundFacts(round);
    const events = byRound.get(round.id) ?? [];
    const ten =
      facts.length === 10 &&
      events.length === 10 &&
      new Set(events.map((e) => e.questionId)).size === 10 &&
      new Set(events.map((e) => e.knowledgeId)).size === 10 &&
      events.every((e) => facts.some((q) => q.id === e.questionId));
    const perfect =
      ten &&
      events.every((e) => e.correct && !e.guessed && e.answerId !== null);
    const zero = ten && events.every((e) => !e.correct && hasAnswer(e));
    counts.completed++;
    if (perfect) counts.perfectTens++;
    if (zero) counts.zeroTens++;
    if (round.id === roundId)
      snapshot = {
        completed: counts.completed,
        perfectTens: perfect ? counts.perfectTens : 0,
        zeroTens: zero ? counts.zeroTens : 0,
      };
  }
  return { counts, snapshot };
}

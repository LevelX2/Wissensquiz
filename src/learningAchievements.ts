import { genreOf, questionSourceOf, genreLabel } from "./filters";
import { learn } from "./learning";
import type { State } from "./model";
import { roundFacts } from "./roundArchive";
import { discoveryMedalTargets } from "./discoveryMilestones";
import { successTiers } from "./successTiers";
import { careerSummary } from "./career";
import type { Achievement, AchievementIconKind } from "./achievements";

export type LearningAchievements = {
  counts: Record<string, number>;
  available: Record<string, number>;
};
export type LearningAchievementReward = {
  before: Record<string, number>;
  after: LearningAchievements;
};
export type LearningAchievementTrack = {
  id: string;
  title: string;
  description: string;
  icon: AchievementIconKind;
  milestones: readonly number[];
  label: (n: number) => string;
};
const filmMilestones = [1, 10, 25, 50, 100];
const learnedDescription =
  "Alle leichten Wissensziele einmal sicher richtig, in abgeschlossenen Runden. Varianten und Wiederholungen zählen nicht zusätzlich.";

export function learningAchievementTracks(
  progress: LearningAchievements,
): LearningAchievementTrack[] {
  const tracks: LearningAchievementTrack[] = [
    {
      id: "experience",
      title: "Erfahrung gesammelt",
      description:
        "Deine insgesamt verdienten Erfahrungspunkte (EXP/XP). Level und Karrieretitel werden zusätzlich in der Filmkarriere angezeigt.",
      icon: "trophy",
      milestones: [100, 500, 1000, 5000, 10000],
      label: (n) => `${n.toLocaleString("de-DE")} EXP gesammelt`,
    },
    {
      id: "films",
      title: "Filmkenner",
      description: learnedDescription,
      icon: "film",
      milestones: filmMilestones,
      label: (n) => `${n} ${n === 1 ? "Film gelernt" : "Filme gelernt"}`,
    },
    {
      id: "secureFacts",
      title: "Sicher gewusst",
      description:
        "Unterschiedliche Wissensziele in abgeschlossenen Runden sicher richtig beantwortet. Geratene Treffer zählen nicht; dieselbe Tatsache zählt einmal.",
      icon: "star",
      milestones: filmMilestones,
      label: (n) =>
        `${n} ${n === 1 ? "Fakt sicher gewusst" : "Fakten sicher gewusst"}`,
    },
    {
      id: "masteredFacts",
      title: "Wissen, das bleibt",
      description:
        "Unterschiedliche Wissensziele durch Wiederholung bis zur Lernstufe 4 gefestigt.",
      icon: "book",
      milestones: [10, 25, 50, 100, 250],
      label: (n) => `${n} Filmfakten gefestigt`,
    },
    {
      id: "discoveredFacts",
      title: "Entdecker-Medaillen",
      description:
        "Unterschiedliche Filmfakten kennengelernt – auch eine falsche Antwort zählt als Begegnung. Varianten zählen einmal.",
      icon: "compass",
      milestones: discoveryMedalTargets,
      label: (n) => `${n.toLocaleString("de-DE")} Filmfakten entdeckt`,
    },
    {
      id: "actors",
      title: "Gesichter des Kinos",
      description: learnedDescription,
      icon: "person",
      milestones: filmMilestones,
      label: (n) => `${n} ${n === 1 ? "Person gelernt" : "Personen gelernt"}`,
    },
    {
      id: "awards",
      title: "Preiswissen",
      description:
        "Alle leichten Wissensziele eines Preisthemas sicher richtig beantwortet. Ein Thema zählt einmal, unabhängig von seinen Fragevarianten.",
      icon: "trophy",
      milestones: filmMilestones,
      label: (n) =>
        `${n} ${n === 1 ? "Preisthema gelernt" : "Preisthemen gelernt"}`,
    },
    {
      id: "genreBreadth",
      title: "Über den Tellerrand",
      description: "In jedem gezählten Genre mindestens einen Film gelernt.",
      icon: "compass",
      milestones: [1, 3, 5, 10, 15],
      label: (n) => `${n} ${n === 1 ? "Genre erkundet" : "Genres erkundet"}`,
    },
    {
      id: "sciFiMastery",
      title: "Science-Fiction-Meisterschaft",
      description:
        "Zehn leichte Science-Fiction-Wissensziele bis zur Lernstufe 4 gefestigt.",
      icon: "star",
      milestones: [10],
      label: () => "Science-Fiction-Meisterschaft",
    },
  ];
  for (const id of [
    ...new Set([
      ...Object.keys(progress.available),
      ...Object.keys(progress.counts),
    ]),
  ]
    .filter((id) => id.startsWith("films:"))
    .sort((a, b) => a.localeCompare(b, "de"))) {
    const genre = genreLabel(id.slice(6));
    tracks.push({
      id,
      title: `${genre}-Filmkenner`,
      description: learnedDescription,
      icon: "film",
      milestones: filmMilestones,
      label: (n) =>
        `${n} ${genre}-${n === 1 ? "Film gelernt" : "Filme gelernt"}`,
    });
  }
  return tracks.filter(
    (track) =>
      (progress.available[track.id] ?? 0) > 0 ||
      (progress.counts[track.id] ?? 0) > 0,
  );
}

// Extra discovery milestones retain their targets; Diamant continues beyond
// 1,000 facts. Medal target and visual rank are both shown, without losing 5k/10k.
export const learningAchievementTier = (index: number) =>
  successTiers[Math.min(index, successTiers.length - 1)];
function achievementMessage(id: string) {
  switch (id) {
    case "experience":
      return "Deine Erfahrung wächst.";
    case "secureFacts":
      return "Verschiedene Fakten sicher gewusst.";
    case "masteredFacts":
      return "Dein Wissen nach Abstand bestätigt.";
    case "discoveredFacts":
      return "Du entdeckst neues Filmwissen.";
    case "genreBreadth":
      return "Für jedes Genre einen Film gelernt.";
    case "sciFiMastery":
      return "Zehn leichte Sci-Fi-Fakten gefestigt.";
    default:
      return "Alle leichten Fakten sicher gewusst.";
  }
}
export function reachedLearningAchievements(
  reward: LearningAchievementReward,
): Achievement[] {
  return learningAchievementTracks(reward.after).flatMap((track) =>
    track.milestones.flatMap((target, index) =>
      (reward.before[track.id] ?? 0) < target &&
      (reward.after.counts[track.id] ?? 0) >= target
        ? [
            {
              id: `${track.id}:${target}`,
              label: track.label(target),
              description: achievementMessage(track.id),
              icon: track.icon,
              tier: learningAchievementTier(index),
            },
          ]
        : [],
    ),
  );
}

// Trial and isolated tests only. Online accounts use the compact SQL projection.
export function localLearningAchievements(state: State): LearningAchievements {
  const completed = new Map(
    state.rounds
      .filter((r) => r.status === "completed")
      .map((r) => [r.id, new Map(roundFacts(r).map((q) => [q.id, q]))]),
  );
  const learning: State["learning"] = {};
  const secure = new Set<string>();
  const seen = new Set<string>();
  for (const e of [...state.events].sort((a, b) => a.at - b.at)) {
    const q = completed.get(e.roundId)?.get(e.questionId);
    if (!q) continue;
    learning[e.knowledgeId] = learn(learning[e.knowledgeId], e);
    seen.add(e.knowledgeId);
    if (e.correct && !e.guessed && e.answerId !== null)
      secure.add(
        JSON.stringify([
          e.knowledgeId,
          q.difficulty,
          q.metadata.person_id
            ? "Schauspieler"
            : q.tags.includes("Preisträger")
              ? "Preisträger"
              : genreOf(q),
        ]),
      );
  }
  const counts: Record<string, number> = {};
  const available: Record<string, number> = {};
  counts.experience = state.experience;
  available.experience = 10000;
  const topics = new Map<
    string,
    {
      source: string;
      goals: Set<string>;
      easy: Set<string>;
      safe: Set<string>;
      genres: Set<string>;
    }
  >();
  const goals = new Set<string>();
  const safeGoals = new Set<string>();
  const sciFi = new Set<string>();
  for (const q of state.questions) {
    const source = questionSourceOf(q),
      genre = genreOf(q);
    goals.add(q.knowledgeId);
    const safe = secure.has(
      JSON.stringify([
        q.knowledgeId,
        q.difficulty,
        source === "film"
          ? genre
          : source === "actors"
            ? "Schauspieler"
            : "Preisträger",
      ]),
    );
    if (safe) safeGoals.add(q.knowledgeId);
    if (
      source === "film" &&
      genre === "Science-Fiction" &&
      q.difficulty === "leicht"
    )
      sciFi.add(q.knowledgeId);
    const key = JSON.stringify([source, q.topic]);
    const topic = topics.get(key) ?? {
      source,
      goals: new Set(),
      easy: new Set(),
      safe: new Set(),
      genres: new Set(),
    };
    topic.goals.add(q.knowledgeId);
    topic.genres.add(genre);
    if (q.difficulty === "leicht") {
      topic.easy.add(q.knowledgeId);
      if (safe) topic.safe.add(q.knowledgeId);
    }
    topics.set(key, topic);
  }
  const add = (id: string, learned: boolean) => {
    available[id] = (available[id] ?? 0) + 1;
    counts[id] = (counts[id] ?? 0) + (learned ? 1 : 0);
  };
  for (const topic of topics.values()) {
    if (!topic.easy.size) continue;
    const learned = topic.safe.size === topic.easy.size;
    add(topic.source === "film" ? "films" : topic.source, learned);
    if (topic.source === "film")
      for (const genre of topic.genres) add(`films:${genre}`, learned);
  }
  const filmGenres = Object.keys(available).filter((id) =>
    id.startsWith("films:"),
  );
  available.genreBreadth = filmGenres.length;
  counts.genreBreadth = filmGenres.filter((id) => counts[id] > 0).length;
  for (const id of ["secureFacts", "discoveredFacts", "masteredFacts"])
    available[id] = goals.size;
  counts.secureFacts = safeGoals.size;
  counts.discoveredFacts = [...goals].filter((goal) => seen.has(goal)).length;
  counts.masteredFacts = [...goals].filter(
    (goal) => learning[goal]?.status === "gefestigt",
  ).length;
  available.sciFiMastery = sciFi.size >= 10 ? 10 : 0;
  counts.sciFiMastery =
    [...sciFi].filter((goal) => learning[goal]?.status === "gefestigt")
      .length >= 10 || state.badges.includes("sci-fi-10-v1")
      ? 10
      : 0;
  return { counts, available };
}

export function localLearningAchievementReward(
  state: State,
  roundId: string,
): LearningAchievementReward {
  const round = state.rounds.find((r) => r.id === roundId);
  const previous: State = {
    ...state,
    experience: 0,
    badges: [],
    rounds: state.rounds.filter(
      (r) =>
        r.id !== roundId &&
        (r.finishedAt ?? Infinity) <= (round?.finishedAt ?? 0),
    ),
    events: state.events.filter((e) => e.roundId !== roundId),
  };
  previous.experience =
    careerSummary(previous).earned + (state.career?.legacyBonus ?? 0);
  return {
    before: localLearningAchievements(previous).counts,
    after: localLearningAchievements(state),
  };
}

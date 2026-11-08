import type { Difficulty, Mode, Question, State, QuizFilters } from "./model";
import { genreOf, questionSourceOf, sourceLabels } from "./filters";
import type { Familiarity } from "./familiarity";
import { roundFacts } from "./roundArchive";
import {
  areaMembershipsOf,
  isIndependentArea,
  selectionAreasOf,
} from "./learningAreas";

export const pathAreaOf = (
  q: Pick<Question, "metadata" | "tags" | "domain">,
) => {
  const source = questionSourceOf(q);
  return source === "film" ? genreOf(q) : sourceLabels[source];
};
export type PathUnlock =
  | { genre: string; difficulty: "mittel" | "schwer" | "experte" }
  | { genre: string; familiarity: Familiarity };
export function learningPathProgress(state: State) {
  const snapshots = new Map<string, ReturnType<typeof roundFacts>[number]>();
  for (const round of state.rounds) {
    if (round.status !== "completed") continue;
    for (const q of roundFacts(round)) snapshots.set(`${round.id}:${q.id}`, q);
  }
  const currentGoals = new Map<string, Set<string>>();
  const available = new Map<
    string,
    { question: Question; familiarity: Familiarity | undefined }[]
  >();
  for (const q of state.questions) {
    const key = JSON.stringify([q.difficulty, q.knowledgeId]);
    const areas = currentGoals.get(key) ?? new Set<string>();
    for (const membership of areaMembershipsOf(q)) {
      areas.add(membership.area);
      const list = available.get(membership.area) ?? [];
      list.push({ question: q, familiarity: membership.familiarity });
      available.set(membership.area, list);
    }
    currentGoals.set(key, areas);
  }
  const goals = new Map<string, Record<Difficulty, Set<string>>>();
  for (const e of state.events) {
    if (!e.correct || e.guessed || e.answerId === null) continue;
    const q = snapshots.get(`${e.roundId}:${e.questionId}`);
    if (!q) continue;
    for (const genre of currentGoals.get(
      JSON.stringify([q.difficulty, e.knowledgeId]),
    ) ?? []) {
      if (!goals.has(genre))
        goals.set(genre, {
          leicht: new Set(),
          mittel: new Set(),
          schwer: new Set(),
          experte: new Set(),
        });
      goals.get(genre)![q.difficulty].add(e.knowledgeId);
    }
  }
  const result = new Map<string, ReturnType<typeof calculate>>();
  function calculate(genre: string) {
    const members = available.get(genre) ?? [];
    const qs = members.map((member) => member.question);
    const independent = isIndependentArea(genre);
    const levels = [
      ...new Set(
        members
          .map((member) => member.familiarity)
          .filter((x): x is Familiarity => !!x),
      ),
    ].sort();
    const first = levels[0] ?? 0;
    const easy = goals.get(genre)?.leicht.size ?? 0;
    const medium = goals.get(genre)?.mittel.size ?? 0;
    const hard = goals.get(genre)?.schwer.size ?? 0;
    const target = (d: Difficulty) => {
      const present = new Set(
        qs.filter((q) => q.difficulty === d).map((q) => q.knowledgeId),
      ).size;
      return Math.ceil(present / 2);
    };
    const easyTarget = target("leicht"),
      mediumTarget = target("mittel"),
      hardTarget = independent ? target("schwer") : 0;
    const mediumUnlocked = easyTarget > 0 && easy >= easyTarget;
    const hardUnlocked =
      mediumUnlocked && mediumTarget > 0 && medium >= mediumTarget;
    const expertUnlocked =
      independent && hardUnlocked && hardTarget > 0 && hard >= hardTarget;
    let max: number = first;
    const groups = levels.map((level, index) => {
      const difficulty = "leicht" as const;
      const ids = [
        ...new Set(
          members
            .filter(
              (member) =>
                member.familiarity === level &&
                member.question.difficulty === difficulty,
            )
            .map((member) => member.question.knowledgeId),
        ),
      ];
      const target = Math.ceil(ids.length / 2);
      const answered = ids.filter((id) =>
        goals.get(genre)?.[difficulty].has(id),
      ).length;
      const unlocked = level <= max;
      if (unlocked && target > 0 && answered >= target && levels[index + 1])
        max = Math.max(max, levels[index + 1]);
      return {
        level,
        difficulty,
        target,
        answered,
        total: ids.length,
        unlocked,
      };
    });
    return {
      easy,
      medium,
      hard,
      easyTarget,
      mediumTarget,
      hardTarget,
      mediumUnlocked,
      hardUnlocked,
      expertUnlocked,
      independent,
      first,
      familiarity: max,
      groups,
    };
  }
  return (genre: string) => {
    if (!result.has(genre)) result.set(genre, calculate(genre));
    return result.get(genre)!;
  };
}

export function retainJourneyUnlocks(state: State) {
  const earned = { ...state.journey?.earned };
  const hasAreas = state.questions.some((q) => questionSourceOf(q) !== "film");
  const progress = learningPathProgress(state);
  for (const genre of new Set(
    state.questions.flatMap((q) =>
      areaMembershipsOf(q).map((item) => item.area),
    ),
  )) {
    const p = progress(genre);
    if (
      p.first > 1 ||
      p.mediumUnlocked ||
      p.familiarity > p.first ||
      earned[genre]
    )
      earned[genre] = {
        difficulty: p.expertUnlocked
          ? 3
          : p.hardUnlocked
            ? 2
            : p.mediumUnlocked
              ? 1
              : 0,
        familiarity: p.familiarity,
      };
  }
  if (Object.keys(earned).length || hasAreas)
    state.journey = {
      version: 1,
      earned,
      ...(hasAreas || state.journey?.independentAreas
        ? { independentAreas: true as const }
        : {}),
    };
}
export function newlyUnlocked(
  before: ReturnType<typeof learningPathProgress>,
  state: State,
): PathUnlock[] {
  const after = learningPathProgress(state);
  return [
    ...new Set(
      state.questions.flatMap((q) =>
        areaMembershipsOf(q).map((item) => item.area),
      ),
    ),
  ].flatMap((genre) => {
    const old = before(genre),
      current = after(genre);
    const unlocked: PathUnlock[] = [];
    if (!old.mediumUnlocked && current.mediumUnlocked)
      unlocked.push({ genre, difficulty: "mittel" });
    if (!old.hardUnlocked && current.hardUnlocked)
      unlocked.push({ genre, difficulty: "schwer" });
    if (!old.expertUnlocked && current.expertUnlocked)
      unlocked.push({ genre, difficulty: "experte" });
    for (const group of current.groups)
      if (
        old.first > 0 &&
        group.level > old.familiarity &&
        group.level <= current.familiarity
      )
        unlocked.push({ genre, familiarity: group.level });
    return unlocked;
  });
}
export function pathQuestions(
  state: State,
  mode: Mode = "entdecken",
  filters?: QuizFilters,
): Question[] {
  if (mode !== "entdecken") return state.questions;
  const progress = learningPathProgress(state);
  return state.questions.filter((q) => {
    return selectionAreasOf(q, filters).some((membership) => {
      const p = progress(membership.area);
      const fame = membership.familiarity;
      return (
        !!fame &&
        fame <= p.familiarity &&
        (q.difficulty === "leicht" ||
          (q.difficulty === "mittel"
            ? p.mediumUnlocked
            : q.difficulty === "schwer"
              ? p.hardUnlocked
              : p.expertUnlocked))
      );
    });
  });
}

// Compare server-awarded rights; no catalog or client unlock calculation.
export function serverUnlocks(before: State, after: State): PathUnlock[] {
  return Object.entries(after.journey?.earned ?? {}).flatMap(
    ([genre, current]) => {
      const old = before.journey?.earned[genre];
      if (!old) return [];
      const result: PathUnlock[] = [];
      for (const [level, difficulty] of [
        [1, "mittel"],
        [2, "schwer"],
        [3, "experte"],
      ] as const)
        if (old.difficulty < level && current.difficulty >= level)
          result.push({ genre, difficulty });
      for (const familiarity of [1, 2, 3, 4] as const)
        if (
          old.familiarity > 0 &&
          familiarity > old.familiarity &&
          familiarity <= current.familiarity
        )
          result.push({ genre, familiarity });
      return result;
    },
  );
}

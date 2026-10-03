import type { Difficulty, Mode, Question, State } from "./model";
import { genreOf, questionSourceOf, sourceLabels } from "./filters";
import { familiarityOf, type Familiarity } from "./familiarity";
import curriculum from "./journeyCurriculum.json" with { type: "json" };
import { roundFacts } from "./roundArchive";

export const PATH_TARGET = 20; // Historical rule, retained only for earned legacy unlocks.
export const AREA_TARGET = 20;
export const pathAreaOf = (
  q: Pick<Question, "metadata" | "tags" | "domain">,
) => {
  const source = questionSourceOf(q);
  return source === "film" ? genreOf(q) : sourceLabels[source];
};
export type PathUnlock =
  | { genre: string; difficulty: "mittel" | "schwer" | "experte" }
  | { genre: string; familiarity: Familiarity };
type Plan = (typeof curriculum.genres)[keyof typeof curriculum.genres];
const plans = curriculum.genres as Record<string, Plan>;
export function learningPathProgress(state: State, legacyFilmAwards = false) {
  const retained = structuredClone(state.journey?.earned ?? {});
  const snapshots = new Map<string, ReturnType<typeof roundFacts>[number]>();
  const legacyRounds = new Set<string>();
  for (const round of state.rounds) {
    if (round.status !== "completed") continue;
    if (round.ruleVersion === "1") legacyRounds.add(round.id);
    for (const q of roundFacts(round)) snapshots.set(`${round.id}:${q.id}`, q);
  }
  const goals = new Map<string, Record<Difficulty, Set<string>>>();
  const legacy = new Map<string, Record<Difficulty, Set<string>>>();
  for (const e of state.events) {
    if (!e.correct || e.guessed || e.answerId === null) continue;
    const q = snapshots.get(`${e.roundId}:${e.questionId}`);
    if (!q || (legacyFilmAwards && q.metadata.person_id)) continue;
    const genre = legacyFilmAwards ? genreOf(q) : pathAreaOf(q);
    for (const target of legacyRounds.has(e.roundId)
      ? [goals, legacy]
      : [goals]) {
      if (!target.has(genre))
        target.set(genre, {
          leicht: new Set(),
          mittel: new Set(),
          schwer: new Set(),
          experte: new Set(),
        });
      target.get(genre)![q.difficulty].add(q.knowledgeId);
    }
  }
  const available = new Map<string, Question[]>();
  for (const q of state.questions) {
    if (legacyFilmAwards && q.metadata.person_id) continue;
    const g = legacyFilmAwards ? genreOf(q) : pathAreaOf(q);
    if (!available.has(g)) available.set(g, []);
    available.get(g)!.push(q);
  }
  const result = new Map<string, ReturnType<typeof calculate>>();
  function calculate(genre: string) {
    const qs = available.get(genre) ?? [];
    const plan = plans[genre];
    const independent =
      !legacyFilmAwards &&
      (genre === sourceLabels.actors || genre === sourceLabels.awards);
    const levels = independent
      ? []
      : [
          ...new Set(
            qs.map(familiarityOf).filter((x): x is Familiarity => !!x),
          ),
        ].sort();
    const first = levels[0] ?? 0;
    const easy = goals.get(genre)?.leicht.size ?? 0;
    const medium = goals.get(genre)?.mittel.size ?? 0;
    const hard = goals.get(genre)?.schwer.size ?? 0;
    const earned = retained[genre];
    const target = (d: Difficulty, index: number) => {
      const present = new Set(
        qs.filter((q) => q.difficulty === d).map((q) => q.knowledgeId),
      ).size;
      return Math.min(
        independent
          ? AREA_TARGET
          : (plan?.difficultyTargets[index] ??
              Math.max(1, Math.ceil(present * 0.6))),
        present,
      );
    };
    const easyTarget = target("leicht", 0),
      mediumTarget = target("mittel", 1),
      hardTarget = independent ? target("schwer", 2) : 0;
    const legacyEasy = legacy.get(genre)?.leicht.size ?? 0,
      legacyMedium = legacy.get(genre)?.mittel.size ?? 0;
    const mediumUnlocked =
      (earned?.difficulty ?? 0) >= 1 ||
      legacyEasy >= PATH_TARGET ||
      (easyTarget > 0 && easy >= easyTarget);
    const hardUnlocked =
      (earned?.difficulty ?? 0) >= 2 ||
      (legacyEasy >= PATH_TARGET && legacyMedium >= PATH_TARGET) ||
      (mediumUnlocked && mediumTarget > 0 && medium >= mediumTarget);
    const expertUnlocked =
      independent &&
      ((earned?.difficulty ?? 0) >= 3 ||
        (hardUnlocked && hardTarget > 0 && hard >= hardTarget));
    let max = Math.max(first, earned?.familiarity ?? 0);
    const groups = levels.map((level, index) => {
      const defined = plan?.groups.find((g) => g.level === level);
      const at = qs.filter((q) => familiarityOf(q) === level);
      const difficulty = (defined?.difficulty ??
        ["leicht", "mittel", "schwer"].find((d) =>
          at.some((q) => q.difficulty === d),
        ) ??
        "leicht") as Difficulty;
      const present = new Set(
        at.filter((q) => q.difficulty === difficulty).map((q) => q.knowledgeId),
      );
      const ids = defined
        ? defined.goals.filter((id) => present.has(id))
        : [...present];
      const target = Math.min(
        defined?.target ?? Math.ceil(ids.length * 0.6),
        ids.length,
      );
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
  // Older releases counted award answers towards film genres. Preserve those
  // earned rights once before separating the areas; future award answers do not.
  const hasAreas = state.questions.some((q) => questionSourceOf(q) !== "film");
  if (hasAreas && !state.journey?.independentAreas) {
    const previous = learningPathProgress(state, true);
    for (const genre of new Set(
      state.questions.filter((q) => !q.metadata.person_id).map(genreOf),
    )) {
      const p = previous(genre);
      if (p.mediumUnlocked || p.familiarity > p.first || earned[genre])
        earned[genre] = {
          difficulty: Math.max(
            earned[genre]?.difficulty ?? 0,
            p.hardUnlocked ? 2 : p.mediumUnlocked ? 1 : 0,
          ),
          familiarity: Math.max(earned[genre]?.familiarity ?? 0, p.familiarity),
        };
    }
    state.journey = { version: 1, earned, independentAreas: true };
  }
  const progress = learningPathProgress(state);
  for (const genre of new Set(state.questions.map(pathAreaOf))) {
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
  return [...new Set(state.questions.map(pathAreaOf))].flatMap((genre) => {
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
      if (group.level > old.familiarity && group.level <= current.familiarity)
        unlocked.push({ genre, familiarity: group.level });
    return unlocked;
  });
}
export function pathQuestions(
  state: State,
  mode: Mode = "entdecken",
): Question[] {
  if (mode !== "entdecken") return state.questions;
  const progress = learningPathProgress(state);
  return state.questions.filter((q) => {
    const p = progress(pathAreaOf(q));
    if (p.independent)
      return (
        q.difficulty === "leicht" ||
        (q.difficulty === "mittel"
          ? p.mediumUnlocked
          : q.difficulty === "schwer"
            ? p.hardUnlocked
            : p.expertUnlocked)
      );
    const fame = familiarityOf(q);
    return (
      !!fame &&
      q.difficulty !== "experte" &&
      fame <= p.familiarity &&
      (q.difficulty === "leicht" ||
        (q.difficulty === "mittel" ? p.mediumUnlocked : p.hardUnlocked))
    );
  });
}

import type { Question, QuizFilters } from "./model";
import { genreOf, questionSourceOf, sourceLabels } from "./filters";
import {
  selectionAreasOf,
  workArea,
  type AreaMembership,
} from "./learningAreas";
import { workReferencesOf } from "./workAttributes";

export type SelectionSlot = {
  goal: string;
  area: string;
  familiarity: number;
  difficulty: Question["difficulty"];
  variants: Question[];
};

// One route per goal BEFORE balancing. Additional variants/memberships cannot
// buy additional area, group or difficulty tickets. The editorial root and its
// primary subject lead; narrow filters can select another eligible route.
export function selectionSlots(
  questions: Question[],
  filters?: QuizFilters,
  eligible: (q: Question, area: AreaMembership) => boolean = () => true,
): SelectionSlot[] {
  const goals = new Map<string, Question[]>();
  for (const q of questions) {
    const variants = goals.get(q.knowledgeId) ?? [];
    variants.push(q);
    goals.set(q.knowledgeId, variants);
  }
  return [...goals.entries()].flatMap(([goal, variants]) => {
    const ordered = [...variants].sort(
      (a, b) =>
        Number(!!a.metadata.variant_of) - Number(!!b.metadata.variant_of) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
    for (const q of ordered) {
      const source = questionSourceOf(q);
      const primary = workArea(
        workReferencesOf(q)[0]?.type ?? "film",
        source === "film" ? genreOf(q) : sourceLabels[source],
      );
      const areas = selectionAreasOf(q, filters)
        .filter((area) => eligible(q, area))
        .sort(
          (a, b) =>
            Number(b.area === primary) - Number(a.area === primary) ||
            (a.area < b.area ? -1 : a.area > b.area ? 1 : 0) ||
            (a.familiarity ?? 0) - (b.familiarity ?? 0),
        );
      if (!areas.length) continue;
      const area = areas[0];
      return [
        {
          goal,
          area: area.area,
          familiarity: area.familiarity ?? 0,
          difficulty: q.difficulty,
          variants: ordered.filter(
            (variant) =>
              variant.difficulty === q.difficulty &&
              selectionAreasOf(variant, filters).some(
                (candidate) =>
                  candidate.area === area.area &&
                  candidate.familiarity === area.familiarity &&
                  eligible(variant, candidate),
              ),
          ),
        },
      ];
    }
    return [];
  });
}

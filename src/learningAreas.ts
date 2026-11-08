import type { Question, QuizFilters } from "./model";
import { questionSourceOf, sourceLabels } from "./filters";
import {
  familiarityOf,
  workFamiliarityOf,
  type Familiarity,
} from "./familiarity";
import {
  matchesWorkFilters,
  workReferencesOf,
  type WorkType,
} from "./workAttributes";

type Subject = Pick<
  Question,
  "metadata" | "domain" | "tags" | "works" | "difficulty"
>;
export type AreaMembership = {
  area: string;
  familiarity: Familiarity | undefined;
  own: boolean;
};
export const workArea = (type: WorkType, label: string) =>
  type === "series" ? `Serien · ${label}` : label;
export const isIndependentArea = (area: string) =>
  ["Schauspieler", "Preisträger"].some(
    (label) => area === label || area === `Serien · ${label}`,
  );

export function areaMembershipsOf(
  q: Subject,
  filters?: QuizFilters,
): AreaMembership[] {
  const source = questionSourceOf(q);
  const all = workReferencesOf(q);
  const works = filters
    ? all.filter((work) => matchesWorkFilters({ ...q, works: [work] }, filters))
    : all;
  const result: AreaMembership[] = [];
  if (source !== "film") {
    if (!all.length && (!filters || matchesWorkFilters(q, filters))) {
      result.push({
        area: sourceLabels[source],
        familiarity: familiarityOf(q),
        own: true,
      });
    }
    for (const work of works) {
      result.push({
        area: workArea(work.type, sourceLabels[source]),
        familiarity: familiarityOf(q),
        own: true,
      });
    }
  }
  if (q.difficulty !== "experte" || source === "film") {
    for (const work of works) {
      for (const genre of new Set(work.genres)) {
        result.push({
          area: workArea(work.type, genre),
          familiarity: workFamiliarityOf(work),
          own: source === "film",
        });
      }
    }
  }
  return [
    ...new Map(
      result.map((item) => [
        JSON.stringify([item.area, item.familiarity, item.own]),
        item,
      ]),
    ).values(),
  ];
}
export const selectionAreasOf = (q: Subject, filters?: QuizFilters) =>
  areaMembershipsOf(q, filters).filter((item) => item.own);

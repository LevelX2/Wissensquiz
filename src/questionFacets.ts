import { z } from "zod";
import {
  techniques,
  workTypes,
  workCollections,
  workReferencesOf,
} from "./workAttributes";
import type { Question } from "./model";
import { questionSourceOf, sourceLabels, genreLabel } from "./filters";

// Public taxonomy only: no work names, years, episode numbers or person IDs.
export const questionFacetsSchema = z.object({
  workTypes: z.array(z.enum(workTypes)).max(2),
  genres: z.array(z.string().min(1).max(200)).max(40),
  techniques: z.array(z.enum(techniques)).max(2),
  collections: z.array(z.enum(workCollections)).max(2),
});
export type QuestionFacets = z.infer<typeof questionFacetsSchema>;
export function questionFacets(
  q: Pick<
    Question,
    "metadata" | "tags" | "domain" | "works" | "answers" | "facets"
  >,
): QuestionFacets {
  if (q.facets) return q.facets;
  const works = workReferencesOf(q);
  const genres = [...new Set(works.flatMap((w) => w.genres))].sort();
  const mentions = (labels: string[]) =>
    q.answers.some((answer) =>
      labels.some((label) =>
        answer.text
          .toLocaleLowerCase("de")
          .includes(label.toLocaleLowerCase("de")),
      ),
    );
  return {
    workTypes: mentions(["Film", "Serie"])
      ? []
      : workTypes.filter((type) => works.some((w) => w.type === type)),
    genres: mentions(genres.flatMap((g) => [g, genreLabel(g)])) ? [] : genres,
    techniques: mentions(["Animation", "Realfilm", "Zeichentrick"])
      ? []
      : techniques.filter((t) => works.some((w) => w.techniques.includes(t))),
    collections: mentions([...workCollections])
      ? []
      : workCollections.filter((c) =>
          works.some((w) => w.collections?.includes(c)),
        ),
  };
}
export function questionFacetLabels(q: Parameters<typeof questionFacets>[0]) {
  const facets = questionFacets(q);
  const source = questionSourceOf(q);
  return [
    ...new Set([
      ...facets.workTypes.map((type) => (type === "film" ? "Film" : "Serie")),
      ...facets.genres,
      ...(source === "film" ? [] : [sourceLabels[source]]),
      ...facets.techniques.map((t) =>
        t === "animation" ? "Animation" : "Realfilm",
      ),
      ...facets.collections,
    ]),
  ];
}

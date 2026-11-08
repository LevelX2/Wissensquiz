// Operator-only enrichment. The browser receives one prepared presentation.
import { questionFacets } from "./questionFacets";
import type { Question } from "./model";
import { filmData, directorExplanation } from "./filmFacts";
import { filmDetails } from "./filmDetails";
import { actorPresentation, presentedQuestion } from "./actorEditorial";
import { yearPresentation } from "./yearEditorial";
import { familiarityOf } from "./familiarity";
import { questionSourceOf } from "./filters";
import { presentationSchema } from "./questionSchema";
import { recognitionVariants, personPortrait } from "./portraitCatalog";
import { filmPoster, type FilmPosterManifest } from "./filmPosters";
export function preparePresentation(
  q: Question,
  posters: FilmPosterManifest | null = null,
) {
  const seriesOnly =
    !!q.works?.length && q.works.every((work) => work.type === "series");
  const poster = seriesOnly ? null : filmPoster(q, posters);
  const actor = seriesOnly ? undefined : actorPresentation(q),
    year = seriesOnly ? undefined : yearPresentation(q),
    director = seriesOnly ? undefined : directorExplanation(q),
    film = seriesOnly ? undefined : filmDetails(q);
  const references =
    q.metadata.question_image_id || questionSourceOf(q) === "awards"
      ? q.metadata.film_refs?.split(";").filter(Boolean)
      : actor?.films;
  const films = (
    seriesOnly ? [] : references?.length ? references : [undefined]
  ).flatMap((reference) => {
    const data = filmData(q, reference);
    return data ? [{ ...(reference ? { reference } : {}), data }] : [];
  });
  return presentationSchema.parse({
    facets: questionFacets(q),
    poster:
      poster && posters
        ? { ...poster, expiresAt: new Date(posters.expiresAt).toISOString() }
        : null,
    questionText: seriesOnly ? q.question : presentedQuestion(q),
    deepContext: year?.text ?? actor?.text ?? director?.text ?? q.context,
    sources: [
      ...new Set([...(year?.sources ?? []), ...(actor?.sources ?? [])]),
    ],
    familiarity: familiarityOf(q) ?? 0,
    film,
    director,
    films,
    portraits: recognitionVariants(q).length
      ? recognitionVariants(q)
      : personPortrait(q)
        ? [personPortrait(q)]
        : [],
  });
}

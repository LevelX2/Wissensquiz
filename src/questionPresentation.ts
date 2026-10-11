// Operator-only enrichment. The browser receives one prepared presentation.
import type { Question } from "./model";
import { filmData, directorExplanation } from "./filmFacts";
import { filmDetails } from "./filmDetails";
import { actorPresentation, presentedQuestion } from "./actorEditorial";
import { yearPresentation } from "./yearEditorial";
import { familiarityOf } from "./familiarity";
import { presentationSchema } from "./questionSchema";
import { recognitionVariants, personPortrait } from "./portraitCatalog";
export function preparePresentation(q: Question) {
  const actor = actorPresentation(q),
    year = yearPresentation(q),
    director = directorExplanation(q),
    film = filmDetails(q);
  const references = q.metadata.question_image_id
    ? q.metadata.film_refs?.split(";").filter(Boolean)
    : actor?.films;
  const films = (references?.length ? references : [undefined]).flatMap(
    (reference) => {
      const data = filmData(q, reference);
      return data ? [{ ...(reference ? { reference } : {}), data }] : [];
    },
  );
  return presentationSchema.parse({
    questionText: presentedQuestion(q),
    deepContext: year?.text ?? actor?.text ?? director?.text ?? q.context,
    anchor: year?.anchor ?? q.anchor,
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

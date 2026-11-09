import type { Question } from "./model";
import { questionFacetLabels } from "./questionFacets";
import { genreLabel } from "./filters";
import { GenreArtwork } from "./Icons";

export function QuestionFacets({ question }: { question: Question }) {
  const labels = questionFacetLabels(question);
  if (!labels.length) return null;
  return (
    <span className="question-facets" role="group" aria-label="Zuordnungen">
      {labels.map((label) => (
        <span key={label} className="question-facet">
          <GenreArtwork genre={label} compact />
          <span>{genreLabel(label)}</span>
        </span>
      ))}
    </span>
  );
}

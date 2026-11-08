import type { Question } from "./model";
import { questionFacetLabels } from "./questionFacets";
import { genreLabel } from "./filters";
import { GenreArtwork } from "./Icons";

export function QuestionFacets({ question }: { question: Question }) {
  return (
    <span className="question-facets" aria-label="Zuordnungen">
      {questionFacetLabels(question).map((label) => (
        <span key={label} className="question-facet">
          <GenreArtwork genre={label} compact />
          <span>{genreLabel(label)}</span>
        </span>
      ))}
    </span>
  );
}

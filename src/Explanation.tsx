import { type AnswerEvent, type Question } from "./model";
import { filmDetails } from "./filmDetails";
import { directorExplanation } from "./filmFacts";
import { actorPresentation } from "./actorEditorial";
import { yearPresentation } from "./yearEditorial";
import { FilmDataPanel } from "./FilmDataPanel";
import { ActorPortrait, recognitionVariants } from "./ActorPortrait";
import { FilmPoster } from "./FilmPoster";

export function Explanation({ q, event }: { q: Question; event: AnswerEvent }) {
  const selected = q.answers.find((a) => a.id === event.answerId);
  const film = filmDetails(q);
  const director = directorExplanation(q);
  const actor = actorPresentation(q);
  const year = yearPresentation(q);
  const deepContext = year?.text ?? actor?.text ?? director?.text ?? q.context;
  const anchor = year?.anchor ?? q.anchor;
  const sources = [
    ...new Set([
      ...q.sources,
      ...recognitionVariants(q).map((portrait) => portrait.sourceUrl),
      ...(year?.sources ?? []),
      ...(actor?.sources ?? []),
    ]),
  ];
  return (
    <div className="explanation">
      <span className="eyebrow">DIE IDEE DAHINTER</span>
      {q.metadata.person_name && (
        <p className="actor-name">
          <strong>{q.metadata.person_name}</strong>
        </p>
      )}
      <ActorPortrait q={q} selectionKey={event.id} />
      <FilmPoster
        key={`${q.metadata.film_title_original}|${q.metadata.film_year}`}
        q={q}
      />
      <p>{q.explanation}</p>
      {!event.correct && selected?.feedback && (
        <p className="specific-feedback">
          Zu Deiner Antwort: {selected.feedback}
        </p>
      )}
      {(deepContext || film) && (
        <details>
          <summary>Etwas tiefer eintauchen</summary>
          {deepContext && <p>{deepContext}</p>}
          {director && (
            <p className="cast-sources">
              {director.sources.map((source) => (
                <a key={source} href={source} target="_blank" rel="noreferrer">
                  Regiequelle: {new URL(source).hostname} ↗
                </a>
              ))}
            </p>
          )}
          {film && (
            <div>
              <p className="cast-context">{film.text}</p>
              <p className="cast-sources">
                {film.sources.map((source) => (
                  <a
                    key={source}
                    href={source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Besetzungsquelle: {new URL(source).hostname} ↗
                  </a>
                ))}
              </p>{" "}
            </div>
          )}
        </details>
      )}
      <FilmDataPanel q={q} />
      {anchor && (
        <div className="memory-anchor">
          <span>✦</span>
          <p>
            <small>DEIN MERKSATZ</small>
            {anchor}
          </p>
        </div>
      )}
      {sources.length > 0 && (
        <details>
          <summary>Quellen ansehen</summary>
          <ul>
            {sources.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {new URL(url).hostname} ↗
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

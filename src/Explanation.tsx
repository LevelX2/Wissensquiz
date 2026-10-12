import { type AnswerEvent, type Question } from "./model";
import { FilmDataPanel } from "./FilmDataPanel";
import { ActorPortrait, recognitionVariants } from "./ActorPortrait";
import { FilmPoster } from "./FilmPoster";
import { additionalAnswerFeedback, answerExplanation } from "./answerFeedback";
import { DisclosureArtwork } from "./DisclosureArtwork";
import type { ReactNode } from "react";
import { questionSourceOf } from "./filters";

export function Explanation({
  q,
  event,
  children,
}: {
  q: Question;
  event: AnswerEvent;
  children?: ReactNode;
}) {
  const selected = q.answers.find((a) => a.id === event.answerId);
  const feedback = additionalAnswerFeedback(q, selected?.feedback);
  const film = q.presentation?.film;
  const director = q.presentation?.director;
  const deepContext = q.presentation?.deepContext ?? q.context;
  const explanation = answerExplanation(q);
  const subject =
    q.metadata.person_name ||
    q.metadata.film_title_de ||
    q.metadata.film_title_original;
  const subjectLabel = q.metadata.person_name
    ? "Schauspiel"
    : questionSourceOf(q) === "awards"
      ? "Preisfrage zum Film"
      : "Film";
  const sources = [
    ...new Set([
      ...q.sources,
      ...recognitionVariants(q).map((portrait) => portrait.sourceUrl),
      ...(q.presentation?.sources ?? []),
    ]),
  ];
  return (
    <div className="explanation">
      {subject && (
        <p
          className={`explanation-subject${q.metadata.person_name ? " actor-name" : ""}`}
        >
          <span>{subjectLabel}</span>
          <strong>{subject}</strong>
        </p>
      )}
      <ActorPortrait q={q} selectionKey={event.id} />
      {explanation && <p>{explanation}</p>}
      {!event.correct && feedback && (
        <p className="specific-feedback">{feedback}</p>
      )}
      <FilmPoster
        key={`${q.metadata.film_title_original}|${q.metadata.film_year}`}
        q={q}
      />
      {(deepContext || film) && (
        <details>
          <summary className="illustrated-summary">
            <DisclosureArtwork subject="context" />
            Etwas tiefer eintauchen
          </summary>
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
      {children}
      {sources.length > 0 && (
        <details className="answer-sources">
          <summary className="illustrated-summary">
            <DisclosureArtwork subject="sources" />
            Quellen ansehen
          </summary>
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

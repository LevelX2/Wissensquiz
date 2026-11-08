import { type AnswerEvent, type Question } from "./model";
import { FilmDataPanel } from "./FilmDataPanel";
import { ActorPortrait } from "./ActorPortrait";
import { FilmPoster } from "./FilmPoster";
import { additionalAnswerFeedback, answerExplanation } from "./answerFeedback";
import { DisclosureArtwork } from "./DisclosureArtwork";
import type { ReactNode } from "react";
import { questionSourceOf } from "./filters";
import { ActorTmdbPortrait } from "./ActorTmdbPortrait";
import { QuestionLinks } from "./QuestionLinks";

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
      {q.metadata.question_image_id || q.presentation?.portraits.length ? (
        <ActorPortrait q={q} selectionKey={event.id} />
      ) : (
        <ActorTmdbPortrait q={q} />
      )}
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
          {film && (
            <div>
              <p className="cast-context">{film.text}</p>
            </div>
          )}
        </details>
      )}
      <FilmDataPanel q={q} />
      {children}
      <QuestionLinks q={q} />
    </div>
  );
}

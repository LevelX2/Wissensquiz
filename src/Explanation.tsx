import { type AnswerEvent, type Question } from "./model";
import { filmDetails } from "./filmDetails";
import { directorExplanation } from "./filmFacts";
import { FilmDataPanel } from "./FilmDataPanel";

export function Explanation({ q, event }: { q: Question; event: AnswerEvent }) {
  const selected = q.answers.find((a) => a.id === event.answerId);
  const film = filmDetails(q);
  const director = directorExplanation(q);
  const deepContext = director?.text ?? q.context;
  return (
    <div className="explanation">
      <span className="eyebrow">DIE IDEE DAHINTER</span>
      {q.metadata.person_name && (
        <p className="actor-name">
          <strong>{q.metadata.person_name}</strong>
        </p>
      )}
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
      {q.anchor && (
        <div className="memory-anchor">
          <span>✦</span>
          <p>
            <small>DEIN MERKSATZ</small>
            {q.anchor}
          </p>
        </div>
      )}
      {q.sources.length > 0 && (
        <details>
          <summary>Quellen ansehen</summary>
          <ul>
            {q.sources.map((url) => (
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

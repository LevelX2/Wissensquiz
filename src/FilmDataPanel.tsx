import { familiarityLabel, familiarityOf } from "./familiarity";
import type { Question } from "./model";
import { filmData } from "./filmFacts";

export function FilmDataPanel({ q }: { q: Question }) {
  const data = filmData(q);
  if (!data) return null;
  return (
    <details className="film-data">
      <summary>Filmdaten</summary>
      <dl>
        <div>
          <dt>Bekanntheit</dt>
          <dd>
            {familiarityLabel(familiarityOf(q))}
            <small>Redaktionelle Einordnung</small>
          </dd>
        </div>
        <div>
          <dt>Originaltitel</dt>
          <dd>{data.originalTitle}</dd>
        </div>
        <div>
          <dt>Erscheinungsjahr</dt>
          <dd>
            {data.year} <span className="muted">(erste Veröffentlichung)</span>
          </dd>
        </div>
        <div>
          <dt>Regie</dt>
          <dd>{data.directors}</dd>
        </div>
        <div>
          <dt>Produktionsländer / -regionen</dt>
          <dd>
            {data.countries.join(" · ")}
            {data.countryNote && <small>{data.countryNote}</small>}
          </dd>
        </div>
        <div>
          <dt>Filmreihe</dt>
          <dd>
            {data.series ? (
              <>
                {data.series.name}
                {data.series.position != null &&
                  ` · Teil ${data.series.position}`}
                <small>{data.series.note}</small>
              </>
            ) : (
              "Keine Reihe hinterlegt"
            )}
          </dd>
        </div>
      </dl>
      {data.releaseNote && <p className="film-data-note">{data.releaseNote}</p>}
      {data.directorNote && (
        <p className="film-data-note">{data.directorNote}</p>
      )}
      {data.directorContext && (
        <details className="film-director-context">
          <summary>Über die Regie</summary>
          <p>{data.directorContext}</p>
          {data.directorSources.map((source) => (
            <a key={source} href={source} target="_blank" rel="noreferrer">
              Regiequelle: {new URL(source).hostname} ↗
            </a>
          ))}
        </details>
      )}
      <div className="film-data-sources">
        {data.sources.map((source) => (
          <a key={source} href={source} target="_blank" rel="noreferrer">
            Filmquelle: {new URL(source).hostname} ↗
          </a>
        ))}
      </div>
    </details>
  );
}

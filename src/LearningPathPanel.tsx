import type { State } from "./model";
import { genreLabel } from "./filters";
import { GenreIcon } from "./Icons";
import { learningPathProgress, PATH_TARGET } from "./learningPath";

export function LearningPath({
  state,
  genres,
  busy,
  onChange,
}: {
  state: State;
  genres: string[];
  busy: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const progress = learningPathProgress(state);
  return (
    <section className="learning-path" aria-label="Dein Lernpfad">
      <label className="check">
        <input
          type="checkbox"
          checked={!!state.settings.learningPath}
          disabled={busy}
          onChange={(e) => onChange(e.target.checked)}
        />
        Optionalen Lernpfad nutzen
      </label>
      <p className="tiny muted">
        {state.settings.learningPath
          ? "Du spielst nur bereits freigeschaltete Stufen je Genre. Deine Stufenauswahl gilt zusätzlich."
          : "Freies Spiel: Alle Schwierigkeitsstufen stehen Dir zur Wahl."}
      </p>
      {state.settings.learningPath && (
        <>
          <p className="tiny">
            Je 20 verschiedene sicher richtig beantwortete Wissensziele schalten
            die nächste Stufe frei. Abgeschlossene Runden zählen – auch Deine
            bisherigen und die aus dem freien Spiel. Geratene Treffer und
            Wiederholungen erhöhen den Zähler nicht.
          </p>
          <div className="path-progress">
            {genres.map((genre) => {
              const p = progress(genre);
              return (
                <div key={genre}>
                  <strong>
                    <GenreIcon genre={genre} /> {genreLabel(genre)}
                  </strong>
                  <span>Leicht freigeschaltet</span>
                  <span>
                    {p.mediumUnlocked
                      ? "✓ Mittel freigeschaltet"
                      : `Mittel gesperrt · ${Math.min(p.easy, PATH_TARGET)} / ${PATH_TARGET} leichte Ziele`}
                  </span>
                  <progress
                    aria-label={`${genreLabel(genre)}: Fortschritt zu Mittel`}
                    max={PATH_TARGET}
                    value={Math.min(p.easy, PATH_TARGET)}
                  />
                  <span>
                    {p.hardUnlocked
                      ? "✓ Schwer freigeschaltet"
                      : `Schwer gesperrt · ${Math.min(p.medium, PATH_TARGET)} / ${PATH_TARGET} mittlere Ziele${p.mediumUnlocked ? "" : " · zuerst Mittel freischalten"}`}
                  </span>
                  <progress
                    aria-label={`${genreLabel(genre)}: Fortschritt zu Schwer`}
                    max={PATH_TARGET}
                    value={Math.min(p.medium, PATH_TARGET)}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

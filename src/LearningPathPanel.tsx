import type { State } from "./model";
import { genreLabel, genreOf } from "./filters";
import { GenreArtwork } from "./Icons";
import { learningPathProgress, PATH_TARGET } from "./learningPath";

export function LearningPath({
  state,
  genres,
}: {
  state: State;
  genres: string[];
}) {
  const progress = learningPathProgress(state);
  return (
    <details className="learning-path">
      <summary>Deine Stufenfortschritte</summary>
      <p className="tiny">
        Je 20 verschiedene sicher richtig beantwortete Wissensziele schalten die
        nächste Stufe frei. Abgeschlossene Runden zählen – auch Deine bisherigen
        und die aus dem freien Spiel. Geratene Treffer und Wiederholungen
        erhöhen den Zähler nicht.
      </p>
      <div className="path-progress">
        {genres.map((genre) => {
          const p = progress(genre);
          const availableEasy = new Set(
            state.questions
              .filter((q) => genreOf(q) === genre && q.difficulty === "leicht")
              .map((q) => q.knowledgeId),
          ).size;
          const availableMedium = new Set(
            state.questions
              .filter((q) => genreOf(q) === genre && q.difficulty === "mittel")
              .map((q) => q.knowledgeId),
          ).size;
          return (
            <div key={genre}>
              <strong>
                <GenreArtwork genre={genre} compact /> {genreLabel(genre)}
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
              {(availableEasy < PATH_TARGET || availableMedium < PATH_TARGET) &&
                !p.hardUnlocked && (
                  <span className="muted">
                    Hier gibt es bisher {availableEasy} leichte und{" "}
                    {availableMedium} mittlere Ziele. Für weitere
                    Freischaltungen fehlen noch Fragen. Über „Schwierigkeit
                    selbst wählen“ kannst Du alle vorhandenen Stufen spielen.
                  </span>
                )}
            </div>
          );
        })}
      </div>
      {!genres.length && (
        <p className="tiny muted">
          Wähle ein Genre, um Deinen Stufenfortschritt zu sehen.
        </p>
      )}
    </details>
  );
}

import { familiarityLabel } from "./familiarity";
import type { State, QuestionSource } from "./model";
import { genreLabel } from "./filters";
import { GenreArtwork } from "./Icons";
import { learningPathProgress } from "./learningPath";

export function LearningPath({
  state,
  genres,
  sources = ["film"],
}: {
  state: State;
  genres: string[];
  sources?: QuestionSource[];
}) {
  const progress = learningPathProgress(state);
  return (
    <details className="learning-path">
      <summary>Deine Stufenfortschritte</summary>
      <p className="tiny">
        Sichere richtige Antworten aus abgeschlossenen Runden zählen einmal pro
        Wissensziel – in allen Modi. Geratene Treffer und Varianten erhöhen den
        Zähler nicht. Deine erreichten Stufen bleiben erhalten.
      </p>
      <div className="path-progress">
        {[
          ...genres,
          ...(sources.includes("awards") ? ["Preisträger"] : []),
          ...(sources.includes("actors") ? ["Schauspieler"] : []),
        ].map((genre) => {
          const p = progress(genre);
          const current = p.groups.find((g) => g.level === p.familiarity);
          const next = p.groups.find((g) => g.level > p.familiarity);
          return (
            <div key={genre}>
              <strong>
                <GenreArtwork genre={genre} compact /> {genreLabel(genre)}
              </strong>
              <span>Schwierigkeit · Leicht freigeschaltet</span>
              <span>
                {p.mediumUnlocked
                  ? "✓ Mittel freigeschaltet"
                  : `Mittel gesperrt · ${Math.min(p.easy, p.easyTarget)} / ${p.easyTarget} leichte Ziele`}
              </span>
              <progress
                aria-label={`${genreLabel(genre)}: Fortschritt zu Mittel`}
                max={p.easyTarget || 1}
                value={Math.min(p.easy, p.easyTarget)}
              />
              <span>
                {p.hardUnlocked
                  ? "✓ Schwer freigeschaltet"
                  : `Schwer gesperrt · ${Math.min(p.medium, p.mediumTarget)} / ${p.mediumTarget} mittlere Ziele${p.mediumUnlocked ? "" : " · zuerst Mittel freischalten"}`}
              </span>
              <progress
                aria-label={`${genreLabel(genre)}: Fortschritt zu Schwer`}
                max={p.mediumTarget || 1}
                value={Math.min(p.medium, p.mediumTarget)}
              />
              {p.independent ? (
                <>
                  <span>
                    {p.expertUnlocked
                      ? "✓ Experte freigeschaltet"
                      : `Experte gesperrt · ${Math.min(p.hard, p.hardTarget)} / ${p.hardTarget} schwere Ziele${p.hardUnlocked ? "" : " · zuerst Schwer freischalten"}`}
                  </span>
                  <progress
                    aria-label={`${genre}: Fortschritt zu Experte`}
                    max={p.hardTarget || 1}
                    value={Math.min(p.hard, p.hardTarget)}
                  />
                </>
              ) : (
                <>
                  <strong>Filmgruppen</strong>
                  {p.groups.map((g) => (
                    <span key={g.level}>
                      {g.level <= p.familiarity ? "✓" : "○"}{" "}
                      {familiarityLabel(g.level)} ·{" "}
                      {g.level <= p.familiarity ? "freigeschaltet" : "gesperrt"}
                    </span>
                  ))}
                  {next && current ? (
                    <>
                      <span>
                        Nächste Gruppe: {familiarityLabel(next.level)} ·{" "}
                        {Math.min(current.answered, current.target)} /{" "}
                        {current.target} sichere{" "}
                        {current.difficulty === "leicht"
                          ? "leichte"
                          : current.difficulty === "mittel"
                            ? "mittlere"
                            : "schwere"}{" "}
                        Ziele in Gruppe {current.level}
                      </span>
                      <progress
                        aria-label={`${genreLabel(genre)}: Fortschritt zur nächsten Filmgruppe`}
                        max={current.target || 1}
                        value={Math.min(current.answered, current.target)}
                      />
                    </>
                  ) : (
                    <span className="muted">
                      {p.groups.length
                        ? "Alle vorhandenen Filmgruppen geöffnet."
                        : "Noch nicht eingeordnete Filme kannst Du im Freien Spiel wählen."}
                    </span>
                  )}
                  {p.first > 1 && (
                    <span className="muted">
                      Einstieg bei Gruppe {p.first}: Die vorherigen Gruppen
                      enthalten hier noch keine Filme.
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      {!genres.length && !sources.some((s) => s !== "film") && (
        <p className="tiny muted">
          Wähle ein Genre, um Deinen Stufenfortschritt zu sehen.
        </p>
      )}
    </details>
  );
}

import { familiarityLabel } from "./familiarity";
import type { State, QuestionSource } from "./model";
import { genreLabel } from "./filters";
import { GenreArtwork } from "./Icons";
import { AchievementIcon } from "./AchievementIcon";
import { learningAchievementTier } from "./learningAchievements";
import { discoveryMedals } from "./discoveryMilestones";
import { DisclosureArtwork } from "./DisclosureArtwork";
import { learningPathProgress } from "./learningPath";
import { JourneyUnlockIcon } from "./JourneyUnlockIcon";
import { useServerView, type Journey } from "./serverViews";

export function JourneyOverview() {
  const { value, error, retry } = useServerView({
    action: "summary",
  });
  if (!value)
    return (
      <div className="journey-overview" role={error ? "alert" : "status"}>
        <small>
          {error
            ? "Dein Gesamtfortschritt konnte nicht geladen werden."
            : "Dein Gesamtfortschritt wird geladen …"}
        </small>
        {error && (
          <button className="text-button" onClick={retry}>
            Erneut versuchen
          </button>
        )}
      </div>
    );
  const total = value.maximum / 4;
  const encountered = total - value.unseen;
  const medals = discoveryMedals(encountered);
  const nextMedal = medals.find(
    (medal) => !medal.earned && medal.target <= total,
  );
  const percent = total ? Math.round((10000 * encountered) / total) / 100 : 0;
  const label =
    percent.toLocaleString("de-DE", { maximumFractionDigits: 2 }) + " %";
  return (
    <div
      className="journey-overview"
      aria-label="Gesamtfortschritt der Filmreise"
    >
      <div
        className="journey-percent-bar"
        role="progressbar"
        aria-label="Kennengelernte Filmfakten insgesamt"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${label} des gesamten Fragenbestands kennengelernt`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <strong>{label} des Filmwissens entdeckt</strong>
      {nextMedal ? (
        <small className="journey-discovery-goal">
          <AchievementIcon
            icon="compass"
            tier={learningAchievementTier(medals.indexOf(nextMedal))}
            earned={false}
          />
          <span>
            {nextMedal.target.toLocaleString("de-DE")}er-Medaille · noch{" "}
            {nextMedal.remaining.toLocaleString("de-DE")}{" "}
            {nextMedal.remaining === 1 ? "Filmfakt" : "Filmfakten"}
          </span>
        </small>
      ) : medals.every((medal) => medal.earned) ? (
        <small className="journey-discovery-goal">
          <AchievementIcon
            icon="compass"
            tier={learningAchievementTier(medals.length - 1)}
          />
          Alle Entdecker-Medaillen erreicht!
        </small>
      ) : null}
    </div>
  );
}

export function LearningPath({
  state,
  genres,
  sources = ["film"],
  workTypes,
  journey,
}: {
  state: State;
  genres: string[];
  workTypes?: ("film" | "series")[];
  sources?: QuestionSource[];
  journey?: Journey;
}) {
  const progress = journey
    ? (area: string) => journey[area]
    : learningPathProgress(state);
  return (
    <details className="learning-path">
      <summary className="illustrated-summary">
        <DisclosureArtwork subject="learning" />
        Deine Stufenfortschritte
      </summary>
      <p className="tiny">
        Sichere richtige Antworten aus abgeschlossenen Runden zählen einmal pro
        Filmfakt – in allen Modi. Geratene Treffer und Varianten erhöhen den
        Zähler nicht. Die Balken zeigen den Fortschritt bis zur Freischaltung.
        Für die nächste Bekanntheitsgruppe zählen aufgerundet 50 Prozent der
        aktuellen leichten Filmfakten der vorherigen Gruppe.
      </p>
      <div className="path-progress">
        {(workTypes ?? ["film", "series"])
          .flatMap((type) =>
            [
              ...genres,
              ...(sources.includes("awards") ? ["Preisträger"] : []),
              ...(sources.includes("actors") ? ["Schauspieler"] : []),
            ].map((label) => (type === "series" ? `Serien · ${label}` : label)),
          )
          .filter((g) => !journey || journey[g])
          .map((genre) => {
            const p = progress(genre);
            const current = p.groups.find((g) => g.level === p.familiarity);
            const next = p.groups.find((g) => g.level > p.familiarity);
            return (
              <div key={genre}>
                <strong>
                  <GenreArtwork genre={genre} compact /> {genreLabel(genre)}
                </strong>
                <span>Schwierigkeit · Leicht freigeschaltet</span>
                <span className="path-unlock">
                  <JourneyUnlockIcon
                    unlock={{ genre, difficulty: "mittel" }}
                    earned={p.mediumUnlocked}
                  />
                  <span>
                    {p.mediumUnlocked
                      ? "✓ Mittel freigeschaltet"
                      : `Mittel gesperrt · ${Math.min(p.easy, p.easyTarget)} / ${p.easyTarget} benötigte leichte Ziele`}
                  </span>
                </span>
                <progress
                  aria-label={`${genreLabel(genre)}: Fortschritt zu Mittel`}
                  max={p.easyTarget || 1}
                  value={Math.min(p.easy, p.easyTarget)}
                />
                <span className="path-unlock">
                  <JourneyUnlockIcon
                    unlock={{ genre, difficulty: "schwer" }}
                    earned={p.hardUnlocked}
                  />
                  <span>
                    {p.hardUnlocked
                      ? "✓ Schwer freigeschaltet"
                      : `Schwer gesperrt · ${Math.min(p.medium, p.mediumTarget)} / ${p.mediumTarget} benötigte mittlere Ziele${p.mediumUnlocked ? "" : " · zuerst Mittel freischalten"}`}
                  </span>
                </span>
                <progress
                  aria-label={`${genreLabel(genre)}: Fortschritt zu Schwer`}
                  max={p.mediumTarget || 1}
                  value={Math.min(p.medium, p.mediumTarget)}
                />
                {p.independent && (
                  <>
                    <span className="path-unlock">
                      <JourneyUnlockIcon
                        unlock={{ genre, difficulty: "experte" }}
                        earned={p.expertUnlocked}
                      />
                      <span>
                        {p.expertUnlocked
                          ? "✓ Experte freigeschaltet"
                          : `Experte gesperrt · ${Math.min(p.hard, p.hardTarget)} / ${p.hardTarget} benötigte schwere Ziele${p.hardUnlocked ? "" : " · zuerst Schwer freischalten"}`}
                      </span>
                    </span>
                    <progress
                      aria-label={`${genre}: Fortschritt zu Experte`}
                      max={p.hardTarget || 1}
                      value={Math.min(p.hard, p.hardTarget)}
                    />
                  </>
                )}
                <>
                  <strong>Bekanntheitsgruppen</strong>
                  {p.groups.map((g) => (
                    <span className="path-unlock" key={g.level}>
                      <JourneyUnlockIcon
                        unlock={{ genre, familiarity: g.level }}
                        earned={g.level <= p.familiarity}
                      />
                      <span>
                        {g.level <= p.familiarity ? "✓" : "○"}{" "}
                        {familiarityLabel(g.level)} ·{" "}
                        {g.level <= p.familiarity
                          ? "freigeschaltet"
                          : "gesperrt"}
                      </span>
                    </span>
                  ))}
                  {next && current ? (
                    <>
                      <span>
                        Bekanntheitsgruppe {current.level}: {current.answered}{" "}
                        von {current.total} leichten Filmfakten sicher
                        beantwortet
                      </span>
                      <span>
                        {familiarityLabel(next.level)} freischalten:{" "}
                        {current.target} sichere Ziele nötig (50 %)
                      </span>
                      <progress
                        aria-label={`${genreLabel(genre)}: Fortschritt zur nächsten Bekanntheitsgruppe`}
                        max={current.target || 1}
                        value={Math.min(current.answered, current.target)}
                      />
                    </>
                  ) : (
                    <span className="muted">
                      {p.groups.length
                        ? "Alle vorhandenen Bekanntheitsgruppen geöffnet."
                        : "Noch nicht eingeordnete Fragen kannst Du im Freien Spiel wählen."}
                    </span>
                  )}
                  {p.first > 1 && (
                    <span className="muted">
                      Einstieg bei Gruppe {p.first}: Die vorherigen Gruppen
                      enthalten hier noch keine Fragen.
                    </span>
                  )}
                </>
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

import { roundFamiliarities } from "./familiarity";
import { useContext, useMemo, useState } from "react";
import {
  categoryLabel,
  genreSelection,
  genreSelectionKey,
  genreSelectionLabel,
  leaderboard,
  levelSelectionKey,
} from "./leaderboard";
import { roundDifficulties } from "./filters";
import type { State } from "./model";
import { GenreArtwork } from "./Icons";
import { RankingContext, SharedLeaderboard } from "./SharedLeaderboard";
import { PlayerLeaderboard } from "./PlayerLeaderboard";
import { GuestActivity } from "./GuestActivity";

export function Leaderboard({
  state,
  onReview,
  onAccount,
  onPlay,
}: {
  state: State;
  onReview?: (roundId: string) => void;
  onAccount?: () => void;
  onPlay?: () => void;
}) {
  const connection = useContext(RankingContext);
  const [scope, setScope] = useState<"mine" | "best" | "compare">("mine");
  const [comparison, setComparison] = useState<"players" | "records">(
    "players",
  );
  const [genre, setGenre] = useState("");
  const [level, setLevel] = useState("");
  const [fame, setFame] = useState("");
  const [size, setSize] = useState("");
  const groups = useMemo(() => leaderboard(state), [state]);
  const genres = new Map(
    groups.map((g) => [
      genreSelectionKey(g.round),
      genreSelectionLabel(g.round),
    ]),
  );
  const levels = new Map(
    groups.map((g) => [levelSelectionKey(g.round), roundDifficulties(g.round)]),
  );
  const visible = groups
    .filter(
      (g) =>
        (!fame || roundFamiliarities(g.round) === fame) &&
        (!genre || genreSelectionKey(g.round) === genre) &&
        (!level || levelSelectionKey(g.round) === level) &&
        (!size || String(g.round.questions.length) === size),
    )
    .sort(
      (a, b) =>
        Math.max(
          ...b.entries.map((e) => e.round.finishedAt ?? e.round.startedAt),
        ) -
        Math.max(
          ...a.entries.map((e) => e.round.finishedAt ?? e.round.startedAt),
        ),
    );
  const extraFilters = [level, fame, size].filter(Boolean).length;
  const resetFilters = () => {
    setGenre("");
    setLevel("");
    setFame("");
    setSize("");
  };
  const roundCount = groups.reduce(
    (sum, group) => sum + group.entries.length,
    0,
  );
  return (
    <section className="leaderboard" aria-labelledby="leaderboard-title">
      <h2 id="leaderboard-title" className="ranking-heading">
        Rekorde und Spielervergleich
      </h2>
      <div
        className="ranking-tabs ranking-main-switch"
        role="group"
        aria-label="Bestenlisten-Ansicht"
      >
        <button
          className={scope === "mine" ? "primary" : "secondary"}
          aria-pressed={scope === "mine"}
          onClick={() => setScope("mine")}
        >
          Meine Rekorde
        </button>
        <button
          className={scope === "best" ? "primary" : "secondary"}
          aria-pressed={scope === "best"}
          onClick={() => setScope("best")}
        >
          Bestenliste
        </button>
        <button
          className={scope === "compare" ? "primary" : "secondary"}
          aria-pressed={scope === "compare"}
          onClick={() => setScope("compare")}
        >
          Spielervergleich
        </button>
      </div>
      {scope !== "mine" ? (
        scope === "best" ? (
          <>
            <h3>Bestenliste der Spieler</h3>
            <PlayerLeaderboard
              key="best"
              state={state}
              initialSort="experience"
              publicList
            />
          </>
        ) : !connection ? (
          <div className="ranking-empty">
            <h3>Vergleiche Dich mit anderen</h3>
            <p>
              Melde Dich mit Deinem Quiz-Konto an, um die Spielerranglisten zu
              sehen. Deine eigenen Rekorde findest Du unter „Meine Rekorde“.
            </p>
            {onAccount && (
              <button className="primary" onClick={onAccount}>
                Im Profil anmelden →
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className="ranking-tabs ranking-comparison-switch"
              role="group"
              aria-label="Art des Spielervergleichs"
            >
              <button
                className={comparison === "players" ? "primary" : "secondary"}
                aria-pressed={comparison === "players"}
                onClick={() => setComparison("players")}
              >
                Alle Spielmodi
              </button>
              <button
                className={comparison === "records" ? "primary" : "secondary"}
                aria-pressed={comparison === "records"}
                onClick={() => setComparison("records")}
              >
                Rekordrunden
              </button>
            </div>
            {comparison === "players" ? (
              <PlayerLeaderboard key="compare" state={state} />
            ) : (
              <SharedLeaderboard state={state} />
            )}
          </>
        )
      ) : (
        <>
          {groups.length === 0 ? (
            <div className="ranking-empty">
              <h3>Dein erster Rekord wartet</h3>
              <p>
                Schließe eine Rekordrunde ab. Hier siehst Du danach Deinen
                Bestwert und kannst die Antworten noch einmal ansehen.
              </p>
              {onPlay && (
                <button className="primary" onClick={onPlay}>
                  Rekordrunde vorbereiten →
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="muted">
                {roundCount} {roundCount === 1 ? "Rekordrunde" : "Rekordrunden"}{" "}
                · {groups.length}{" "}
                {groups.length === 1 ? "Bestwert" : "Bestwerte"}
              </p>
              <div className="record-filter-bar">
                <label>
                  Genre
                  <select
                    aria-label="Genre-Auswahl"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                  >
                    <option value="">Alle Genre-Kombinationen</option>
                    {[...genres].map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {(genre || extraFilters > 0) && (
                  <button className="text-button" onClick={resetFilters}>
                    Filter zurücksetzen
                  </button>
                )}
              </div>
              <details className="ranking-details ranking-filter-details">
                <summary>
                  Weitere Filter
                  {extraFilters > 0 ? ` (${extraFilters} aktiv)` : ""}
                </summary>
                <div className="leaderboard-filters">
                  <label>
                    Schwierigkeit
                    <select
                      aria-label="Stufenauswahl"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    >
                      <option value="">Alle Stufenkombinationen</option>
                      {[...levels].map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Filmbekanntheit
                    <select
                      aria-label="Bekanntheitsauswahl"
                      value={fame}
                      onChange={(e) => setFame(e.target.value)}
                    >
                      <option value="">Alle Bekanntheitskombinationen</option>
                      {[
                        ...new Set(
                          groups.map((g) => roundFamiliarities(g.round)),
                        ),
                      ].map((label) => (
                        <option key={label}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Rundengröße
                    <select
                      aria-label="Rundengröße"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      <option value="">Alle Rundengrößen</option>
                      {[...new Set(groups.map((g) => g.round.questions.length))]
                        .sort((a, b) => a - b)
                        .map((n) => (
                          <option key={n} value={n}>
                            {n} Fragen
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              </details>
              {!visible.length && (
                <div className="ranking-empty">
                  <p role="status">Keine Rekordrunden für diese Auswahl.</p>
                  <button className="secondary" onClick={resetFilters}>
                    Alle Rekorde zeigen
                  </button>
                </div>
              )}
              <div className="record-card-grid">
                {visible.map((group) => {
                  const best = group.entries[0];
                  return (
                    <section
                      className="leaderboard-category"
                      key={group.key}
                      aria-label={categoryLabel(group.round)}
                    >
                      <div className="record-card-heading">
                        <div className="record-genre-art">
                          {genreSelection(group.round)
                            .slice(0, 1)
                            .map((g) => (
                              <GenreArtwork key={g} genre={g} compact />
                            ))}
                        </div>
                        <div>
                          <h3>{genreSelectionLabel(group.round)}</h3>
                          <p className="muted">
                            {roundDifficulties(group.round)} ·{" "}
                            {group.round.questions.length} Fragen
                            {group.round.topic !== "Alle Themen"
                              ? ` · ${group.round.topic}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="record-best">
                        <span className="tiny muted">Dein Bestwert</span>
                        <strong>
                          {best.points.toLocaleString("de-DE")}{" "}
                          <span>Punkte</span>
                        </strong>
                        <span>
                          {best.correct} von {best.round.questions.length}{" "}
                          richtig
                        </span>
                        <span className="tiny muted">
                          {new Date(
                            best.round.finishedAt ?? best.round.startedAt,
                          ).toLocaleDateString("de-DE")}
                        </span>
                      </div>
                      {onReview && (
                        <button
                          className="text-button"
                          onClick={() => onReview(best.round.id)}
                        >
                          Rückblick ansehen →
                        </button>
                      )}
                      <details className="ranking-details record-history">
                        <summary>Alle Runden ({group.entries.length})</summary>
                        <ol className="leaderboard-list">
                          {group.entries.map((entry) => (
                            <li key={entry.round.id} value={entry.rank}>
                              <div className="leaderboard-entry">
                                <strong>
                                  Platz {entry.rank} · {entry.points} Punkte
                                </strong>
                                <span>
                                  {entry.correct}/{entry.round.questions.length}{" "}
                                  richtig ·{" "}
                                  {(entry.elapsedMs / 1000).toLocaleString(
                                    "de-DE",
                                    { maximumFractionDigits: 1 },
                                  )}{" "}
                                  s Antwortzeit
                                </span>
                                <span className="tiny muted">
                                  {new Date(
                                    entry.round.finishedAt ??
                                      entry.round.startedAt,
                                  ).toLocaleString("de-DE")}
                                </span>
                                {onReview && (
                                  <button
                                    className="text-button"
                                    onClick={() => onReview(entry.round.id)}
                                  >
                                    Spiel ansehen →
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </details>
                      <details className="ranking-details record-selection">
                        <summary>Auswahl & Vergleich</summary>
                        <p className="tiny muted">
                          {categoryLabel(group.round)}
                        </p>
                      </details>
                    </section>
                  );
                })}
              </div>
            </>
          )}
          <details className="ranking-details">
            <summary>Wie werden Rekorde verglichen?</summary>
            <p>
              Jede Genre-, Stufen- und Bekanntheitskombination, Kategorie,
              Mischung und Rundengröße hat einen eigenen Bestwert. Gleiche
              Punkte teilen sich einen Platz. Die Antwortzeit entscheidet nicht
              über die Platzierung.
            </p>
            <p className="tiny muted">
              Deine Ergebnisse bleiben im Spielstand erhalten. Mit einem
              Quiz-Konto werden sie automatisch gesichert.
            </p>
          </details>
        </>
      )}
      <GuestActivity />
    </section>
  );
}

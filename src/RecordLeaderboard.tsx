import { roundFamiliarities } from "./familiarity";
import { useContext, useMemo, useState } from "react";
import {
  categoryLabel,
  genreSelectionKey,
  genreSelectionLabel,
  leaderboard,
  levelSelectionKey,
} from "./leaderboard";
import { roundDifficulties } from "./filters";
import type { State } from "./model";
import { RankingContext, SharedLeaderboard } from "./SharedLeaderboard";
import { PlayerLeaderboard } from "./PlayerLeaderboard";

export function Leaderboard({
  state,
  onReview,
}: {
  state: State;
  onReview?: (roundId: string) => void;
}) {
  const connection = useContext(RankingContext);
  const [scope, setScope] = useState<"mine" | "all" | "players">(
    connection ? "all" : "mine",
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
  const visible = groups.filter(
    (g) =>
      (!fame || roundFamiliarities(g.round) === fame) &&
      (!genre || genreSelectionKey(g.round) === genre) &&
      (!level || levelSelectionKey(g.round) === level) &&
      (!size || String(g.round.questions.length) === size),
  );
  return (
    <section className="leaderboard" aria-labelledby="leaderboard-title">
      <h2 id="leaderboard-title">Rekorde & Spielerleistungen</h2>
      <div
        className="ranking-tabs"
        role="group"
        aria-label="Bestenlisten-Ansicht"
      >
        <button
          className={scope === "mine" ? "primary" : "secondary"}
          aria-pressed={scope === "mine"}
          onClick={() => setScope("mine")}
        >
          Meine Ergebnisse
        </button>
        <button
          className={scope === "all" ? "primary" : "secondary"}
          aria-pressed={scope === "all"}
          onClick={() => setScope("all")}
        >
          Alle Spieler
        </button>
        <button
          className={scope === "players" ? "primary" : "secondary"}
          aria-pressed={scope === "players"}
          onClick={() => setScope("players")}
        >
          Spielerleistungen
        </button>
      </div>
      {scope === "players" ? (
        <PlayerLeaderboard state={state} />
      ) : scope === "all" ? (
        <SharedLeaderboard />
      ) : (
        <>
          <p className="muted">
            Deine abgeschlossenen Rekordrunden im aktuellen Spielstand. Jede
            Genre-, Stufen- und Bekanntheitskombination, Kategorie, Mischung und
            Rundengröße hat eine eigene Rangliste. Gleiche Punkte teilen sich
            einen Platz.
          </p>
          {groups.length === 0 ? (
            <p>
              Noch keine Rekordrunde abgeschlossen. Nach Deinem ersten Abschluss
              erscheint hier Dein Ergebnis.
            </p>
          ) : (
            <>
              <div className="leaderboard-filters">
                <label>
                  Bekanntheitsauswahl
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
                  Genre-Auswahl
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
                <label>
                  Stufenauswahl
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
              {!visible.length && (
                <p role="status">
                  Keine abgeschlossenen Spiele für diese Filterkombination.
                </p>
              )}
              {visible.map((group) => (
                <section
                  className="leaderboard-category"
                  key={group.key}
                  aria-label={categoryLabel(group.round)}
                >
                  <h3>{categoryLabel(group.round)}</h3>
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
                            {(entry.elapsedMs / 1000).toLocaleString("de-DE", {
                              maximumFractionDigits: 1,
                            })}{" "}
                            s Antwortzeit
                          </span>
                          <span className="muted">
                            {new Date(
                              entry.round.finishedAt ?? entry.round.startedAt,
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
                </section>
              ))}
            </>
          )}
          <p className="tiny muted">
            Deine Ergebnisse bleiben im Spielstand erhalten. Mit einem
            Quiz-Konto werden sie automatisch gesichert.
          </p>
        </>
      )}
    </section>
  );
}

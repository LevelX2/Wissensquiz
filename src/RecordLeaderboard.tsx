import { useState } from "react";
import {
  categoryLabel,
  genreSelectionKey,
  genreSelectionLabel,
  leaderboard,
  levelSelectionKey,
} from "./leaderboard";
import { roundDifficulties } from "./filters";
import type { State } from "./model";

export function Leaderboard({
  state,
  onReview,
}: {
  state: State;
  onReview: (roundId: string) => void;
}) {
  const [genre, setGenre] = useState("");
  const [level, setLevel] = useState("");
  const [size, setSize] = useState("");
  const groups = leaderboard(state);
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
      (!genre || genreSelectionKey(g.round) === genre) &&
      (!level || levelSelectionKey(g.round) === level) &&
      (!size || String(g.round.questions.length) === size),
  );
  return (
    <section className="leaderboard" aria-labelledby="leaderboard-title">
      <h2 id="leaderboard-title">Bestenliste der Rekordrunden</h2>
      <p className="muted">
        Deine abgeschlossenen Spiele auf diesem Gerät. Jede Genre- und
        Stufenkombination, Film-Auswahl und Rundengröße hat eine eigene
        Rangliste. Gleiche Punkte teilen sich einen Platz.
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
                        {entry.correct}/{entry.round.questions.length} richtig ·{" "}
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
                      <button
                        className="text-button"
                        onClick={() => onReview(entry.round.id)}
                      >
                        Spiel ansehen →
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </>
      )}
      <p className="tiny muted">
        Die Liste bleibt lokal und ist in Deiner JSON-Sicherung enthalten. Eine
        gemeinsame Bestenliste mit eigenen Konten ist noch nicht eingerichtet.
      </p>
    </section>
  );
}

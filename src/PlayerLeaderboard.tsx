import { useContext, useEffect, useState } from "react";
import { z } from "zod";
import { RankingContext } from "./SharedLeaderboard";
import { difficulties, difficultyLabel, genreLabel, genreOf } from "./filters";
import type { State } from "./model";
const rowSchema = z.object({
  player_name: z.string(),
  completed: z.number(),
  answered: z.number(),
  correct: z.number(),
  accuracy: z.number().nullable(),
  place: z.number(),
  is_mine: z.boolean(),
});
export function PlayerLeaderboard({ state }: { state: State }) {
  const connection = useContext(RankingContext);
  const [sort, setSort] = useState("rounds"),
    [genre, setGenre] = useState(""),
    [difficulty, setDifficulty] = useState("");
  const [rows, setRows] = useState<z.infer<typeof rowSchema>[]>([]);
  const [offset, setOffset] = useState(0),
    [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    if (!connection) return;
    setLoading(true);
    setError(false);
    setRows([]);
    void Promise.resolve(
      connection.client.rpc("quiz_players", {
        sort_by: sort,
        selected_genre: genre,
        selected_difficulty: difficulty,
        page_offset: offset,
      }),
    )
      .then(({ data, error }) => {
        if (!active) return;
        if (error) throw error;
        setRows(z.array(rowSchema).parse(data));
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [connection, sort, genre, difficulty, offset, refresh]);
  if (!connection)
    return (
      <p>
        Melde Dich mit Deinem Quiz-Konto an, um die Spielerranglisten zu sehen.
      </p>
    );
  return (
    <div>
      <h3>Spielerranglisten</h3>
      <div className="leaderboard-filters">
        <label>
          Leistung
          <select
            aria-label="Spielerwertung"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setOffset(0);
            }}
          >
            <option value="rounds">Meiste abgeschlossene Runden</option>
            <option value="correct">Meiste richtige Antworten</option>
            <option value="accuracy">
              Beste Trefferquote (ab 50 Antworten)
            </option>
          </select>
        </label>
        <label>
          Genre
          <select
            aria-label="Spielerwertung Genre"
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">Alle Genres</option>
            {[...new Set(state.questions.map(genreOf))].sort().map((g) => (
              <option value={g} key={g}>
                {genreLabel(g)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Schwierigkeit
          <select
            aria-label="Spielerwertung Schwierigkeit"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">Alle Stufen</option>
            {difficulties.map((d) => (
              <option value={d} key={d}>
                {difficultyLabel(d)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="tiny muted">
        Alle Spielmodi, nur abgeschlossene Runden. Die Trefferquote vergleicht
        erst ab 50 gewählten Antworten in der Auswahl; reine Zeitabläufe zählen
        nicht als Antwort. Wiederholungen und geratene Treffer zählen hier mit.
        Bei gemischten Runden zählen nur passende Fragen, die Runde einmal.
      </p>
      <button className="text-button" onClick={() => setRefresh((n) => n + 1)}>
        Spielerrangliste aktualisieren
      </button>
      {loading ? (
        <p role="status">Spielerwerte werden geladen …</p>
      ) : error ? (
        <p role="status">Die Spielerrangliste ist gerade nicht erreichbar.</p>
      ) : !rows.length ? (
        <p>
          Noch keine teilnehmenden Spieler mit passenden Ergebnissen
          {sort === "accuracy" ? " und mindestens 50 Antworten" : ""}.
        </p>
      ) : (
        <ol className="leaderboard-list">
          {rows.map((r, i) => (
            <li key={i} value={r.place}>
              <div className="leaderboard-entry">
                <strong>
                  Platz {r.place} · {r.player_name}
                  {r.is_mine ? " (Du)" : ""}
                </strong>
                <span>
                  {r.completed} Runden · {r.correct} von {r.answered} Antworten
                  richtig ·{" "}
                  {r.accuracy === null
                    ? "Noch keine Trefferquote"
                    : `${r.accuracy.toLocaleString("de-DE")} % Trefferquote`}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
      {(offset > 0 || rows.length === 50) && (
        <div className="account-actions">
          <button
            disabled={loading || offset === 0}
            onClick={() => setOffset((n) => Math.max(0, n - 50))}
          >
            Vorherige Spieler
          </button>
          <button
            disabled={loading || rows.length < 50}
            onClick={() => setOffset((n) => n + 50)}
          >
            Weitere Spieler
          </button>
        </div>
      )}
      <p className="tiny muted">
        Freiwillige Trainingswerte. Die Listen zeigen Aktivität und Treffer,
        keinen unabhängig geprüften Wissensstand.
      </p>
    </div>
  );
}

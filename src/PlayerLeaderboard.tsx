import { rankingRequest, RankingTimeout } from "./rankingRequest";
import { useContext, useEffect, useState } from "react";
import { z } from "zod";
import { RankingContext } from "./SharedLeaderboard";
import { difficulties, difficultyLabel, genreLabel, genreOf } from "./filters";
import type { State } from "./model";
import { CareerBadge } from "./CareerProgress";
import { ActivityContext } from "./GuestActivity";
const rowSchema = z.object({
  player_name: z.string(),
  completed: z.number(),
  answered: z.number(),
  correct: z.number(),
  accuracy: z.number().nullable(),
  place: z.number(),
  is_mine: z.boolean(),
  experience: z.number().int().nonnegative(),
});
function errorMessage(reason: unknown) {
  const failure = reason && typeof reason === "object" ? reason : {};
  const code = "code" in failure ? failure.code : undefined;
  const status = "status" in failure ? failure.status : undefined;
  if (code === "PGRST202")
    return "Die Bestenliste ist auf dem Kontodienst noch nicht eingerichtet.";
  if (reason instanceof RankingTimeout || code === "57014")
    return "Das Laden der Spielerrangliste dauert zu lange. Bitte versuche es erneut.";
  if (
    status === 401 ||
    status === 403 ||
    code === "PGRST301" ||
    ("message" in failure && failure.message === "authentication_required")
  )
    return "Deine Anmeldung konnte nicht bestätigt werden. Bitte melde Dich im Profil erneut an.";
  if (reason instanceof z.ZodError)
    return "Die Spielerwerte konnten nicht gelesen werden. Bitte versuche es erneut.";
  if (typeof status === "number" && status >= 500)
    return "Der Kontodienst konnte die Spielerwerte nicht bereitstellen. Bitte versuche es erneut.";
  return "Die Spielerrangliste konnte nicht geladen werden. Prüfe Deine Verbindung und versuche es erneut.";
}
export function PlayerLeaderboard({
  state,
  initialSort = "correct",
  publicList = false,
}: {
  state: State;
  initialSort?: "correct" | "experience";
  publicList?: boolean;
}) {
  const connection = useContext(RankingContext);
  const activityClient = useContext(ActivityContext);
  const client = publicList
    ? (connection?.client ?? activityClient)
    : connection?.client;
  const [sort, setSort] = useState<string>(initialSort),
    [genre, setGenre] = useState(""),
    [difficulty, setDifficulty] = useState("");
  const [rows, setRows] = useState<z.infer<typeof rowSchema>[]>([]);
  const [offset, setOffset] = useState(0),
    [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (!client) return;
    setLoading(true);
    setError("");
    setRows([]);
    void rankingRequest(
      (signal) =>
        client
          .rpc(
            publicList ? "quiz_public_players" : "quiz_players",
            publicList
              ? {
                  sort_by: sort,
                  page_offset: offset,
                }
              : {
                  sort_by: sort,
                  selected_genre: sort === "experience" ? "" : genre,
                  selected_difficulty: sort === "experience" ? "" : difficulty,
                  page_offset: offset,
                },
          )
          .abortSignal(signal),
      controller,
    )
      .then(({ data, error, status }) => {
        if (!active) return;
        if (error) throw { ...error, status };
        setRows(z.array(rowSchema).parse(data));
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(errorMessage(reason));
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [client, publicList, sort, genre, difficulty, offset, refresh]);
  if (!client)
    return (
      <p>
        {publicList
          ? "Die Bestenliste ist ohne Kontodienst nicht verfügbar."
          : "Melde Dich mit Deinem Quiz-Konto an, um die Spielerranglisten zu sehen."}
      </p>
    );
  return (
    <div>
      <p className="muted">
        Hier vergleichst Du gespeicherte Ergebnisse aller bestätigten
        Quiz-Konten.
        {publicList
          ? " Die Bestenliste ist öffentlich sichtbar, auch ohne Anmeldung."
          : " Dein Konto gehört automatisch dazu, auch wenn sonst niemand spielt."}
      </p>
      <div
        className="ranking-tabs ranking-metrics"
        role="group"
        aria-label="Spielerwertung"
      >
        {(
          [
            ["correct", "Richtige Antworten"],
            ["rounds", "Runden"],
            ["accuracy", "Trefferquote"],
            ["experience", "Level & XP"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            className={sort === value ? "primary" : "secondary"}
            aria-pressed={sort === value}
            onClick={() => {
              setSort(value);
              setOffset(0);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="tiny muted">
        {sort === "experience" ? (
          "Gesamte Filmkarriere · Alle Genres · Alle Stufen"
        ) : (
          <>
            {!publicList && genre ? genreLabel(genre) : "Alle Genres"} ·{" "}
            {!publicList && difficulty
              ? difficultyLabel(difficulty as (typeof difficulties)[number])
              : "Alle Stufen"}
            {sort === "accuracy" ? " · Ab 50 beantworteten Fragen" : ""}
          </>
        )}
      </p>
      {!publicList && sort !== "experience" && (
        <details className="ranking-details ranking-filter-details">
          <summary>
            Vergleich eingrenzen{genre || difficulty ? " (Filter aktiv)" : ""}
          </summary>
          <div className="leaderboard-filters">
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
          {(genre || difficulty) && (
            <button
              className="text-button"
              onClick={() => {
                setGenre("");
                setDifficulty("");
                setOffset(0);
              }}
            >
              Filter zurücksetzen
            </button>
          )}
        </details>
      )}
      <button className="text-button" onClick={() => setRefresh((n) => n + 1)}>
        {error ? "Erneut versuchen" : "Spielerrangliste aktualisieren"}
      </button>
      {loading ? (
        <p role="status">Spielerwerte werden geladen …</p>
      ) : error ? (
        <p role="status">{error}</p>
      ) : !rows.length ? (
        <p>
          {sort === "accuracy"
            ? "Für die Trefferquote braucht es mindestens 50 beantwortete Fragen in dieser Auswahl. Unter „Richtige Antworten“ und „Runden“ siehst Du Dein Konto schon vorher."
            : genre || difficulty
              ? "Noch keine abgeschlossenen Runden für diese Auswahl. Setze die Filter zurück, um alle Spieler zu sehen."
              : "Es wurden keine Spieler gefunden. Bitte aktualisiere die Rangliste."}
        </p>
      ) : (
        <>
          {offset === 0 && rows.length === 1 && rows[0].is_mine && (
            <p role="status">
              Du bist bisher der einzige Spieler in dieser Auswahl.
            </p>
          )}
          <ol className="leaderboard-list" aria-label="Spielerrangliste">
            {rows.map((r, i) => (
              <li
                key={i}
                value={r.place}
                className={r.is_mine ? "is-mine" : undefined}
              >
                <div className="leaderboard-entry">
                  <strong>
                    Platz {r.place} · {r.player_name}
                    {r.is_mine ? " (Du)" : ""}
                  </strong>
                  <CareerBadge experience={r.experience} />
                  <span>
                    {r.experience.toLocaleString("de-DE")} XP insgesamt
                  </span>
                  <span>
                    {r.completed.toLocaleString("de-DE")}{" "}
                    {publicList ? "abgeschlossene Spiele" : "Runden"} ·{" "}
                    {r.correct.toLocaleString("de-DE")} von{" "}
                    {r.answered.toLocaleString("de-DE")} Antworten richtig ·{" "}
                    {r.accuracy === null
                      ? "Noch keine Trefferquote"
                      : `${r.accuracy.toLocaleString("de-DE")} % Trefferquote`}
                  </span>
                  {r.is_mine && r.completed === 0 && (
                    <span>
                      Dein Konto ist schon dabei. Nach Deiner ersten
                      abgeschlossenen und online gespeicherten Runde erscheinen
                      hier Deine Ergebnisse.
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
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
      <details className="ranking-details">
        <summary>Was zählt für den Vergleich?</summary>
        <p className="tiny muted">
          Level und XP zeigen immer die gesamte Filmkarriere. Die Wertung „Level
          & XP“ vergleicht alle Genres und Stufen. Gleiche XP teilen sich einen
          Platz. Alle Spielmodi, nur abgeschlossene Runden. Die Trefferquote
          vergleicht erst ab 50 beantworteten Fragen in der Auswahl; reine
          Zeitabläufe zählen nicht als Antwort. Wiederholungen und geratene
          Treffer zählen hier mit. Bei gemischten Runden zählen nur passende
          Fragen, die Runde einmal.
        </p>
        {publicList && (
          <p className="tiny muted">
            Die öffentliche Bestenliste vergleicht die gesamte Karriere und alle
            abgeschlossenen Spiele. Namen dürfen gleich sein; jeder Eintrag
            gehört zu einem eigenen bestätigten Konto. Spieler ohne
            abgeschlossene Spiele sind ebenfalls dabei.
          </p>
        )}
      </details>
      <p className="tiny muted">
        Gemeinsame Trainingswerte. Die Listen zeigen Aktivität und Treffer,
        keinen unabhängig geprüften Wissensstand.
      </p>
    </div>
  );
}

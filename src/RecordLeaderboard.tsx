import { useContext, useMemo, useState } from "react";
import { categoryLabel, leaderboard } from "./leaderboard";
import type { State } from "./model";
import { RankingContext } from "./SharedLeaderboard";
import { PlayerLeaderboard } from "./PlayerLeaderboard";
import { GuestActivity } from "./GuestActivity";
import { OnlineRecords, DuelRankings } from "./OnlineRecords";
import {
  isRecordMode,
  modeNames,
  periodNames,
  recordModes,
  type RecordMode,
  type RecordPeriod,
} from "./recordModes";

export function Leaderboard({
  state,
  onReview,
  onAccount,
  onPlay,
}: {
  state: State;
  onReview?: (id: string) => void;
  onAccount?: () => void;
  onPlay?: () => void;
}) {
  const connection = useContext(RankingContext);
  const latest = [...state.rounds]
    .reverse()
    .find((r) => isRecordMode(r.mode) && r.status === "completed");
  const [area, setArea] = useState<"records" | "duels" | "career">("records");
  const [mode, setMode] = useState<RecordMode>(
    latest && isRecordMode(latest.mode) ? latest.mode : "rekord",
  );
  const [scope, setScope] = useState<"mine" | "shared">("mine");
  const [period, setPeriod] = useState<RecordPeriod>("all");
  const [category, setCategory] = useState("");
  const [filteredCareer, setFilteredCareer] = useState(false);
  const categories = useMemo(() => leaderboard(state, mode), [state, mode]);
  const groups = useMemo(
    () => leaderboard(state, mode, period),
    [state, mode, period],
  );
  const visible = groups.filter((g) => !category || g.key === category);
  return (
    <section className="leaderboard" aria-labelledby="leaderboard-title">
      <h2 id="leaderboard-title" className="ranking-heading">
        Rekordspiele, Duelle und Karriere
      </h2>
      <div
        className="ranking-tabs ranking-main-switch"
        role="group"
        aria-label="Highscore-Bereiche"
      >
        {(
          [
            ["records", "Rekordspiele"],
            ["duels", "Duelle"],
            ["career", "Karriere"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={area === key ? "primary" : "secondary"}
            aria-pressed={area === key}
            onClick={() => setArea(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {area === "career" ? (
        <>
          <h3>Bestenliste der Spieler</h3>
          <p className="muted">
            Karriere-XP und Lernleistungen aus allen Spielmodi.
          </p>
          {connection && (
            <button
              className="text-button"
              onClick={() => setFilteredCareer((v) => !v)}
            >
              {filteredCareer
                ? "Öffentliche Karriere zeigen"
                : "Spielervergleich mit Filtern"}
            </button>
          )}
          <PlayerLeaderboard
            key={String(filteredCareer)}
            state={state}
            initialSort="experience"
            publicList={!filteredCareer}
          />
        </>
      ) : (
        <>
          {area === "records" && (
            <div className="ranking-tabs" role="group" aria-label="Rekordmodus">
              {recordModes.map((m) => (
                <button
                  key={m}
                  className={mode === m ? "primary" : "secondary"}
                  aria-pressed={mode === m}
                  onClick={() => {
                    setMode(m);
                    setCategory("");
                  }}
                >
                  {modeNames[m]}
                </button>
              ))}
            </div>
          )}
          <div
            className="ranking-tabs"
            role="group"
            aria-label="Rekord-Ansicht"
          >
            <button
              className={scope === "mine" ? "primary" : "secondary"}
              aria-pressed={scope === "mine"}
              onClick={() => setScope("mine")}
            >
              Meine Läufe
            </button>
            <button
              className={scope === "shared" ? "primary" : "secondary"}
              aria-pressed={scope === "shared"}
              onClick={() => setScope("shared")}
            >
              Gemeinsame Rangliste
            </button>
          </div>
          <div className="ranking-tabs" role="group" aria-label="Zeitraum">
            {(Object.keys(periodNames) as RecordPeriod[]).map((p) => (
              <button
                key={p}
                className={period === p ? "primary" : "secondary"}
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
              >
                {periodNames[p]}
              </button>
            ))}
          </div>
          <p className="tiny muted">
            Aktuelle Kalenderwoche ab Montag, Monat oder Jahr · Zeit in
            Deutschland.
          </p>
          {area === "duels" ? (
            <DuelRankings
              key={scope + period}
              period={period}
              mine={scope === "mine"}
              onAccount={onAccount}
            />
          ) : scope === "shared" ? (
            <OnlineRecords key={mode + period} mode={mode} period={period} />
          ) : (
            <>
              {!!categories.length && (
                <label className="record-category-filter">
                  Vergleichskategorie
                  <select
                    aria-label="Vergleichskategorie"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Alle Kategorien</option>
                    {categories.map((g) => (
                      <option key={g.key} value={g.key}>
                        {categoryLabel(g.round)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!visible.length && (
                <div className="ranking-empty">
                  <h3>Noch kein abgeschlossener Lauf</h3>
                  <p>Für diese Auswahl gibt es noch keine Ergebnisse.</p>
                  {onPlay && (
                    <button className="primary" onClick={onPlay}>
                      Rekordspiel vorbereiten →
                    </button>
                  )}
                </div>
              )}
              {visible.map((group) => (
                <section
                  className="leaderboard-category"
                  key={group.key}
                  aria-label={categoryLabel(group.round)}
                >
                  <h3>
                    {group.round.recordPreset === "standard"
                      ? "Standardmix"
                      : "Eigene Auswahl"}
                  </h3>
                  <p className="tiny muted">{categoryLabel(group.round)}</p>
                  <ol
                    className="leaderboard-list"
                    aria-label="Abgeschlossene Läufe"
                  >
                    {group.entries.map((e) => (
                      <li key={e.round.id} value={e.rank}>
                        <div className="leaderboard-entry">
                          <strong>
                            Platz {e.rank} · {e.points.toLocaleString("de-DE")}{" "}
                            Punkte
                          </strong>
                          <span>
                            {e.correct}/{e.round.questions.length} richtig ·{" "}
                            {(e.elapsedMs / 1000).toLocaleString("de-DE", {
                              maximumFractionDigits: 1,
                            })}{" "}
                            s Antwortzeit
                          </span>
                          <span className="tiny muted">
                            {new Date(e.round.finishedAt!).toLocaleString(
                              "de-DE",
                              { timeZone: "Europe/Berlin" },
                            )}
                          </span>
                          {onReview && (
                            <button
                              className="text-button"
                              onClick={() => onReview(e.round.id)}
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
          <details className="ranking-details">
            <summary>Wie werden Highscores verglichen?</summary>
            <p>
              Jeder abgeschlossene Rekordlauf zählt einzeln, auch mit null
              Punkten. Derselbe Spieler kann mehrere Plätze belegen. Gleiche
              Punkte teilen sich einen Platz; innerhalb eines Gleichstands
              erscheint der frühere Abschluss zuerst. Abgebrochene Läufe zählen
              nicht. Modus, Auswahl und Regelversion bleiben getrennt.
            </p>
            <p>
              Duellranglisten zählen vollständig beendete Begegnungen: Sieg 3,
              Unentschieden 1, Niederlage 0. Aufgabe und Fristablauf bleiben in
              Deinen Duellergebnissen sichtbar und bringen keine
              Ranglistenpunkte.
            </p>
          </details>
        </>
      )}
      <GuestActivity />
    </section>
  );
}

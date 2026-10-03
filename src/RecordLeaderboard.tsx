import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  categoryLabel,
  leaderboard,
  type LeaderboardTarget,
} from "./leaderboard";
import type { State } from "./model";
import { recordKey } from "./engine";
import { roundQuestionCount } from "./roundArchive";
import { RankingContext } from "./SharedLeaderboard";
import { PlayerLeaderboard } from "./PlayerLeaderboard";
import { GuestActivity } from "./GuestActivity";
import { OnlineRecords, DuelRankings } from "./OnlineRecords";
import {
  isRecordMode,
  isRankedRecord,
  modeNames,
  periodNames,
  recordModes,
  recordSelectionLabel,
  type RecordMode,
  type RecordPeriod,
} from "./recordModes";

export function Leaderboard({
  state,
  initialTarget,
  onAccount,
  onPlay,
}: {
  state: State;
  initialTarget?: LeaderboardTarget;
  onAccount?: () => void;
  onPlay?: () => void;
}) {
  const connection = useContext(RankingContext);
  const targetRound =
    initialTarget?.kind === "record"
      ? state.rounds.find(
          (r) =>
            r.id === initialTarget.roundId &&
            r.status === "completed" &&
            isRankedRecord(r),
        )
      : undefined;
  const latest = [...state.rounds]
    .reverse()
    .find((r) => isRankedRecord(r) && r.status === "completed");
  const [area, setArea] = useState<"records" | "duels" | "career">(
    initialTarget?.kind === "duel" ? "duels" : "records",
  );
  const [mode, setMode] = useState<RecordMode>(
    targetRound && isRecordMode(targetRound.mode)
      ? targetRound.mode
      : latest && isRecordMode(latest.mode)
        ? latest.mode
        : "rekord",
  );
  const [scope, setScope] = useState<"mine" | "shared">("mine");
  const [period, setPeriod] = useState<RecordPeriod>("all");
  const [category, setCategory] = useState(
    targetRound ? recordKey(targetRound) : "",
  );
  const targetEntry = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!targetRound) return;
    // Run after the page-level heading focus and scroll reset.
    const frame = requestAnimationFrame(() => {
      targetEntry.current?.scrollIntoView({ block: "center" });
      targetEntry.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [targetRound?.id]);
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
              initialDuelId={
                initialTarget?.kind === "duel"
                  ? initialTarget.duelId
                  : undefined
              }
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
              {category && groups.some((g) => g.key !== category) && (
                <p className="notice">
                  Weitere Läufe gehören zu anderen Vergleichskategorien.
                  <button
                    className="text-button"
                    onClick={() => setCategory("")}
                  >
                    Alle Kategorien anzeigen
                  </button>
                </p>
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
                  <h3>{recordSelectionLabel(group.round)}</h3>
                  <p className="tiny muted">{categoryLabel(group.round)}</p>
                  <ol
                    className="leaderboard-list"
                    aria-label="Abgeschlossene Läufe"
                  >
                    {group.entries.map((e) => (
                      <li
                        key={e.round.id}
                        value={e.rank}
                        className={
                          e.round.id === targetRound?.id
                            ? "is-current-run"
                            : undefined
                        }
                        ref={
                          e.round.id === targetRound?.id
                            ? targetEntry
                            : undefined
                        }
                        tabIndex={
                          e.round.id === targetRound?.id ? -1 : undefined
                        }
                      >
                        <div className="leaderboard-entry">
                          {e.round.id === targetRound?.id && (
                            <span className="current-run-label">
                              Dieser Lauf
                            </span>
                          )}
                          <strong>
                            Platz {e.rank} · {e.points.toLocaleString("de-DE")}{" "}
                            Punkte
                          </strong>
                          <span>
                            {e.correct}/{roundQuestionCount(e.round)} richtig ·{" "}
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

import { useContext, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { RankingContext } from "./SharedLeaderboard";
import { ActivityContext } from "./GuestActivity";
import { rankingRequest } from "./rankingRequest";
import { genreLabel, sourceLabels } from "./filters";
import { ruleLabel } from "./familiarity";
import { type RecordMode, type RecordPeriod } from "./recordModes";
import { duelSchema } from "./duels";
import { CareerBadge } from "./CareerProgress";

const categorySchema = z.object({
  category: z.string(),
  genres: z.array(z.string()),
  difficulties: z.array(z.string()),
  topic: z.string(),
  question_count: z.number(),
  rule_version: z.string(),
  selection: z
    .object({
      sources: z.array(z.enum(["film", "awards", "actors"])).optional(),
      familiarities: z.array(z.number()).optional(),
    })
    .nullish(),
});
const entrySchema = z.object({
  player_name: z.string(),
  points: z.number(),
  correct: z.number(),
  answers: z.number(),
  elapsed_ms: z.number(),
  finished_at: z.number(),
  place: z.number(),
  is_mine: z.boolean(),
  experience: z.number(),
});
const duelRankSchema = z.object({
  player_name: z.string(),
  points: z.number(),
  wins: z.number(),
  draws: z.number(),
  losses: z.number(),
  completed: z.number(),
  place: z.number(),
  is_mine: z.boolean(),
});
const resultSchema = duelSchema.extend({ finishedAt: z.number() });
const failure = (e: unknown) =>
  e && typeof e === "object" && "code" in e && e.code === "PGRST202"
    ? "Diese Rangliste ist auf dem Kontodienst noch nicht eingerichtet."
    : "Die Ergebnisse konnten nicht geladen werden. Prüfe Deine Verbindung und versuche es erneut.";
const dateLabel = (at: number) =>
  new Date(at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
const label = (c: z.infer<typeof categorySchema>) =>
  [
    c.rule_version.endsWith(".genre") ? "Genre-Rekord" : "Königsklasse",
    c.selection?.sources?.map((s) => sourceLabels[s]).join(" + "),
    c.genres.map(genreLabel).join(" + "),
    c.difficulties.map((d) => d[0].toUpperCase() + d.slice(1)).join(" + "),
    c.selection?.familiarities?.length
      ? "Filmgruppen " + c.selection.familiarities.join(" + ")
      : "",
    c.topic !== "Alle Themen" ? c.topic : "",
    c.question_count ? c.question_count + " Fragen" : "Endlos",
    "Regel " + ruleLabel(c.rule_version),
  ]
    .filter(Boolean)
    .join(" · ");
function Paging({
  offset,
  length,
  onChange,
}: {
  offset: number;
  length: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="ranking-tabs">
      <button
        className="secondary"
        disabled={!offset}
        onClick={() => onChange(Math.max(0, offset - 50))}
      >
        Vorherige 50
      </button>
      <span>
        {offset + (length ? 1 : 0)}–{offset + length}
      </span>
      <button
        className="secondary"
        disabled={length < 50}
        onClick={() => onChange(offset + 50)}
      >
        Nächste 50
      </button>
    </div>
  );
}
export function OnlineRecords({
  mode,
  period,
}: {
  mode: RecordMode;
  period: RecordPeriod;
}) {
  const connection = useContext(RankingContext),
    publicClient = useContext(ActivityContext);
  const client = connection?.client ?? publicClient;
  const [categories, setCategories] = useState<
    z.infer<typeof categorySchema>[]
  >([]);
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState<z.infer<typeof entrySchema>[]>([]);
  const [offset, setOffset] = useState(0),
    [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (!client) return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setRows([]);
    void rankingRequest(
      (signal) =>
        client
          .rpc("quiz_record_categories", { selected_mode: mode })
          .abortSignal(signal),
      controller,
    )
      .then(({ data, error }) => {
        if (error) throw error;
        const checked = z.array(categorySchema).parse(data);
        if (active) {
          setCategories(checked);
          setCategory((value) =>
            checked.some((c) => c.category === value)
              ? value
              : (checked[0]?.category ?? ""),
          );
          if (!checked.length) setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(failure(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [client, connection?.owner, mode, refresh]);
  useEffect(() => {
    if (!client || !category) return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setRows([]);
    void rankingRequest(
      (signal) =>
        client
          .rpc("quiz_record_runs", {
            selected_category: category,
            selected_period: period,
            page_offset: offset,
          })
          .abortSignal(signal),
      controller,
    )
      .then(({ data, error }) => {
        if (error) throw error;
        const checked = z.array(entrySchema).parse(data);
        if (active) {
          setRows(checked);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(failure(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [client, connection?.owner, category, period, offset, refresh]);
  if (!client)
    return (
      <p>Die gemeinsame Rangliste benötigt eine Verbindung zum Kontodienst.</p>
    );
  return (
    <section aria-label="Gemeinsame Rekordläufe">
      <p className="muted">
        Alle abgeschlossenen Läufe bestätigter Quiz-Konten. Deine eigenen Läufe
        findest Du unter „Meine Läufe“.
      </p>
      {!!categories.length && (
        <label>
          Vergleichskategorie
          <select
            aria-label="Gemeinsame Vergleichskategorie"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setOffset(0);
            }}
          >
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {label(c)}
              </option>
            ))}
          </select>
        </label>
      )}
      {loading ? (
        <p role="status">Rekordläufe werden geladen …</p>
      ) : error ? (
        <p role="status">{error}</p>
      ) : !rows.length ? (
        <p>Noch keine abgeschlossenen Läufe in dieser Auswahl.</p>
      ) : (
        <ol className="leaderboard-list" aria-label="Gemeinsame Läufe">
          {rows.map((r, i) => (
            <li
              key={offset + i}
              value={r.place}
              className={r.is_mine ? "mine" : ""}
            >
              <div className="leaderboard-entry">
                <strong>
                  Platz {r.place} · {r.player_name}
                  {r.is_mine ? " · Du" : ""}
                </strong>
                <span>
                  {r.points.toLocaleString("de-DE")} Punkte · {r.correct}/
                  {r.answers} richtig ·{" "}
                  {(r.elapsed_ms / 1000).toLocaleString("de-DE", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  s
                </span>
                <span className="tiny muted">{dateLabel(r.finished_at)}</span>
                <CareerBadge experience={r.experience} />
              </div>
            </li>
          ))}
        </ol>
      )}
      {!loading && !error && (rows.length > 0 || offset > 0) && (
        <Paging offset={offset} length={rows.length} onChange={setOffset} />
      )}
      <button
        className="text-button"
        disabled={loading}
        onClick={() => setRefresh((n) => n + 1)}
      >
        Rangliste erneut laden
      </button>
      <p className="tiny muted">
        Freizeitrekorde aus gesicherten Spielständen. Die Einzelantworten
        bleiben privat.
      </p>
    </section>
  );
}
export function DuelRankings({
  period,
  mine,
  onAccount,
  initialDuelId,
}: {
  period: RecordPeriod;
  mine: boolean;
  onAccount?: () => void;
  initialDuelId?: string;
}) {
  const connection = useContext(RankingContext),
    publicClient = useContext(ActivityContext);
  const client = mine
    ? connection?.client
    : (connection?.client ?? publicClient);
  const [ranks, setRanks] = useState<z.infer<typeof duelRankSchema>[]>([]);
  const [results, setResults] = useState<z.infer<typeof resultSchema>[]>([]);
  const targetEntry = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!initialDuelId || !mine) return;
    const frame = requestAnimationFrame(() => {
      targetEntry.current?.scrollIntoView({ block: "center" });
      targetEntry.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialDuelId, mine, results]);
  const [offset, setOffset] = useState(0),
    [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (!client) return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setRanks([]);
    setResults([]);
    void rankingRequest(
      (signal) =>
        client
          .rpc(mine ? "quiz_duel_results" : "quiz_duel_rankings", {
            selected_period: period,
            page_offset: offset,
          })
          .abortSignal(signal),
      controller,
    )
      .then(({ data, error }) => {
        if (error) throw error;
        const checked = mine
          ? z.array(resultSchema).parse(data)
          : z.array(duelRankSchema).parse(data);
        if (active) {
          if (mine) setResults(checked as z.infer<typeof resultSchema>[]);
          else setRanks(checked as z.infer<typeof duelRankSchema>[]);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(failure(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [client, connection?.owner, mine, period, offset, refresh]);
  if (!client)
    return (
      <div className="ranking-empty">
        <p>
          {mine
            ? "Melde Dich an, um Deine abgeschlossenen Duelle zu sehen."
            : "Die Duellrangliste benötigt eine Verbindung zum Kontodienst."}
        </p>
        {mine && onAccount && (
          <button className="primary" onClick={onAccount}>
            Im Profil anmelden →
          </button>
        )}
      </div>
    );
  const length = mine ? results.length : ranks.length;
  return (
    <section aria-label={mine ? "Meine Duellergebnisse" : "Duellrangliste"}>
      {loading ? (
        <p role="status">Duellergebnisse werden geladen …</p>
      ) : error ? (
        <p role="status">{error}</p>
      ) : !length ? (
        <p>Noch keine abgeschlossenen Duelle in dieser Auswahl.</p>
      ) : mine ? (
        <ul className="leaderboard-list">
          {results.map((d) => (
            <li
              key={d.id}
              className={d.id === initialDuelId ? "is-current-run" : undefined}
              ref={d.id === initialDuelId ? targetEntry : undefined}
              tabIndex={d.id === initialDuelId ? -1 : undefined}
            >
              <div className="leaderboard-entry">
                {d.id === initialDuelId && (
                  <span className="current-run-label">Dieses Duell</span>
                )}
                <strong>
                  {d.opponent} ·{" "}
                  {d.result === "win"
                    ? "Sieg"
                    : d.result === "loss"
                      ? "Niederlage"
                      : d.result === "draw"
                        ? "Unentschieden"
                        : "Abgebrochen"}
                </strong>
                <span>
                  {d.status === "completed"
                    ? "3 Runden · " +
                      (d.result === "win"
                        ? "3"
                        : d.result === "draw"
                          ? "1"
                          : "0") +
                      " Ranglistenpunkte"
                    : "Aufgabe oder Fristablauf · ohne Ranglistenpunkte"}
                </span>
                <span>
                  {d.rounds
                    .map((r) => `${r.mine ?? "–"}:${r.opponent ?? "–"}`)
                    .join(" · ")}
                </span>
                <span className="tiny muted">{dateLabel(d.finishedAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ol className="leaderboard-list">
          {ranks.map((r, i) => (
            <li key={offset + i} value={r.place}>
              <div className="leaderboard-entry">
                <strong>
                  Platz {r.place} · {r.player_name}
                  {r.is_mine ? " · Du" : ""} · {r.points} Punkte
                </strong>
                <span>
                  {r.completed} Duelle · {r.wins} Siege · {r.draws}{" "}
                  Unentschieden · {r.losses} Niederlagen
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
      {!loading && !error && (length > 0 || offset > 0) && (
        <Paging offset={offset} length={length} onChange={setOffset} />
      )}
      <button
        className="text-button"
        disabled={loading}
        onClick={() => setRefresh((n) => n + 1)}
      >
        Duellergebnisse erneut laden
      </button>
    </section>
  );
}

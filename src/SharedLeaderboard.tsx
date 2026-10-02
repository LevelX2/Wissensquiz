import { ruleLabel } from "./familiarity";
import { rankingRequest } from "./rankingRequest";
import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { genreLabel } from "./filters";
import { genreSelectionKey } from "./leaderboard";
import type { State } from "./model";

export const RankingContext = createContext<{
  client: SupabaseClient;
  owner: string;
} | null>(null);
const categorySchema = z.object({
  category: z.string(),
  genres: z.array(z.string()),
  difficulties: z.array(z.string()),
  topic: z.string(),
  question_count: z.number(),
  rule_version: z.string(),
});
const entrySchema = z.object({
  player_name: z.string(),
  points: z.number(),
  correct: z.number(),
  elapsed_ms: z.number(),
  finished_at: z.number(),
  place: z.number(),
  is_mine: z.boolean(),
});
type Category = z.infer<typeof categorySchema>;
type Entry = z.infer<typeof entrySchema>;
const levelLabel = (values: string[]) =>
  values
    .map((v) =>
      v.startsWith("historisch:")
        ? `Frühere Auswahl: ${v.slice(11)}`
        : v[0].toUpperCase() + v.slice(1),
    )
    .join(" + ");
const categoryLabel = (c: Category) =>
  `${c.genres.map(genreLabel).join(" + ")} · ${levelLabel(c.difficulties)} · ${c.question_count} Fragen${c.topic !== "Alle Themen" ? ` · ${c.topic}` : ""} · Regel ${ruleLabel(c.rule_version)}`;

const genreKey = (c: Category) => JSON.stringify([...c.genres].sort());
const roundLabel = (c: Category) =>
  `${levelLabel(c.difficulties)} · ${c.question_count} Fragen${c.topic !== "Alle Themen" ? ` · ${c.topic}` : ""}`;

export function SharedLeaderboard({ state }: { state: State }) {
  const connection = useContext(RankingContext);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preferredRound] = useState(() => {
    return state.rounds
      .filter((r) => r.mode === "rekord" && r.status === "completed")
      .sort(
        (a, b) => (b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt),
      )[0];
  });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (!connection) return;
    setLoading(true);
    setError("");
    setEntries([]);
    void rankingRequest(
      (signal) =>
        connection.client.rpc("quiz_score_categories").abortSignal(signal),
      controller,
    )
      .then(({ data, error }) => {
        if (!active) return;
        if (error) throw error;
        const rows = z.array(categorySchema).parse(data);
        // Server category IDs use a different format from local recordKey.
        // Match all projected comparison fields, then keep the server ID.
        const preferred =
          preferredRound &&
          rows.find(
            (row) =>
              genreKey(row) === genreSelectionKey(preferredRound) &&
              JSON.stringify([...row.difficulties].sort()) ===
                JSON.stringify(
                  preferredRound.filters
                    ? [...preferredRound.filters.difficulties].sort()
                    : [`historisch:${preferredRound.difficulty}`],
                ) &&
              row.topic === preferredRound.topic &&
              row.question_count === preferredRound.questions.length &&
              row.rule_version === preferredRound.ruleVersion,
          );
        setCategories(rows);
        setCategory((old) =>
          rows.some((row) => row.category === old)
            ? old
            : (preferred?.category ?? rows[0]?.category ?? ""),
        );
        setOffset(0);
        if (!rows.length) setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(
            "Die gemeinsame Bestenliste ist gerade nicht erreichbar. Bitte versuche es erneut.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [connection, refresh, preferredRound]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (!connection || !category) return;
    setLoading(true);
    setError("");
    setEntries([]);
    void rankingRequest(
      (signal) =>
        connection.client
          .rpc("quiz_rankings", {
            selected_category: category,
            page_offset: offset,
          })
          .abortSignal(signal),
      controller,
    )
      .then(({ data, error }) => {
        if (!active) return;
        if (error) throw error;
        setEntries(z.array(entrySchema).parse(data));
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(
            "Die Ergebnisse konnten nicht geladen werden. Bitte versuche es erneut.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [connection, category, offset, refresh]);
  if (!connection)
    return (
      <p>
        Melde Dich mit Deinem Quiz-Konto an, um die Ergebnisse aller
        registrierten Spieler zu sehen.
      </p>
    );
  const selected = categories.find((item) => item.category === category);
  const genres = new Map(
    categories.map((c) => [genreKey(c), c.genres.map(genreLabel).join(" + ")]),
  );
  const genreCategories = selected
    ? categories.filter((c) => genreKey(c) === genreKey(selected))
    : [];
  return (
    <div>
      <p className="muted">Punkte aus vergleichbaren Rekordrunden.</p>
      <button className="text-button" onClick={() => setRefresh((n) => n + 1)}>
        Bestenliste aktualisieren
      </button>
      {!!categories.length && (
        <div className="leaderboard-filters">
          <label>
            Genre
            <select
              aria-label="Gemeinsames Genre"
              value={selected ? genreKey(selected) : ""}
              onChange={(e) => {
                const first = categories.find(
                  (c) => genreKey(c) === e.target.value,
                );
                setOffset(0);
                setCategory(first?.category ?? "");
              }}
            >
              {[...genres].map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Runde
            <select
              aria-label="Gemeinsame Kategorie"
              value={category}
              onChange={(e) => {
                setOffset(0);
                setCategory(e.target.value);
              }}
            >
              {genreCategories.map((c) => (
                <option key={c.category} value={c.category}>
                  {roundLabel(c)}
                  {genreCategories.filter(
                    (other) => roundLabel(other) === roundLabel(c),
                  ).length > 1
                    ? ` · ${ruleLabel(c.rule_version)}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {loading ? (
        <p role="status">Ergebnisse werden geladen …</p>
      ) : error ? (
        <p role="status">{error}</p>
      ) : !entries.length ? (
        <p>Noch keine Rekordrunden in dieser Auswahl.</p>
      ) : (
        <ol className="leaderboard-list shared-entries">
          {entries.map((entry, index) => (
            <li
              key={`${offset}:${index}`}
              value={entry.place}
              className={entry.is_mine ? "is-mine" : undefined}
            >
              <div className="leaderboard-entry">
                <strong>
                  Platz {entry.place} · {entry.player_name}
                  {entry.is_mine ? " (Du)" : ""}
                </strong>
                <span>
                  {entry.points} Punkte · {entry.correct}/
                  {selected?.question_count} richtig ·{" "}
                  {(entry.elapsed_ms / 1000).toLocaleString("de-DE", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  s
                </span>
                <span className="tiny muted">
                  {new Date(entry.finished_at).toLocaleString("de-DE")}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
      {(offset > 0 || entries.length === 50) && (
        <div className="account-actions">
          <button
            disabled={loading || offset === 0}
            onClick={() => setOffset((n) => Math.max(0, n - 50))}
          >
            Vorherige Ergebnisse
          </button>
          <button
            disabled={loading || entries.length < 50}
            onClick={() => setOffset((n) => n + 50)}
          >
            Weitere Ergebnisse
          </button>
        </div>
      )}
      {selected && (
        <details className="ranking-details">
          <summary>Auswahl & Vergleich</summary>
          <p className="tiny muted">{categoryLabel(selected)}</p>
          <p className="tiny muted">
            Nur gleiche Bekanntheitsauswahl, Fragenmischung und Regeln werden
            zusammen gewertet. Gleiche Punkte teilen sich einen Platz.
          </p>
        </details>
      )}
      <p className="tiny muted">
        Gemeinsame Trainingsrangliste. Auch offline erspielte und importierte
        Ergebnisse können enthalten sein; die Spielabläufe sind nicht unabhängig
        geprüft.
      </p>
    </div>
  );
}

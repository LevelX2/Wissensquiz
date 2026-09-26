import { rankingRequest } from "./rankingRequest";
import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { genreLabel } from "./filters";

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
  values.map((v) => v[0].toUpperCase() + v.slice(1)).join(" + ");
const categoryLabel = (c: Category) =>
  `${c.genres.map(genreLabel).join(" + ")} · ${levelLabel(c.difficulties)} · ${c.question_count} Fragen${c.topic !== "Alle Themen" ? ` · ${c.topic}` : ""} · Regel ${c.rule_version}`;

export function SharedLeaderboard() {
  const connection = useContext(RankingContext);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        setCategories(rows);
        setCategory((old) =>
          rows.some((row) => row.category === old)
            ? old
            : (rows[0]?.category ?? ""),
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
  }, [connection, refresh]);
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
  return (
    <div>
      <p className="muted">
        Rekordrunden aller angemeldeten Spieler. Verglichen werden gleiche
        Genres, Stufen und Rundengrößen.
      </p>
      <button className="text-button" onClick={() => setRefresh((n) => n + 1)}>
        Bestenliste aktualisieren
      </button>
      {!!categories.length && (
        <label className="ranking-category">
          Kategorie
          <select
            aria-label="Gemeinsame Kategorie"
            value={category}
            onChange={(e) => {
              setOffset(0);
              setCategory(e.target.value);
            }}
          >
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </label>
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
            <li key={`${offset}:${index}`} value={entry.place}>
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
      <p className="tiny muted">
        Gemeinsame Trainingsrangliste. Auch offline erspielte und importierte
        Ergebnisse können enthalten sein; die Spielabläufe sind nicht unabhängig
        geprüft.
      </p>
    </div>
  );
}

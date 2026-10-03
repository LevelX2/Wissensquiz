import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rankingRequest } from "./rankingRequest";

export const ActivityContext = createContext<SupabaseClient | null>(null);
const rowSchema = z.object({
  activity_day: z.iso.date(),
  started: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  answered: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  collection_started_at: z.string().datetime({ offset: true }),
});
const dayLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Berlin",
  });
const berlinDay = (at: string) =>
  new Date(at).toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });

export function GuestActivity() {
  const client = useContext(ActivityContext);
  const [rows, setRows] = useState<z.infer<typeof rowSchema>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!client) return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setRows([]);
    void rankingRequest(
      (signal) => client.rpc("quiz_guest_activity").abortSignal(signal),
      controller,
    )
      .then(({ data, error }) => {
        if (error) throw error;
        const checked = z.array(rowSchema).length(7).parse(data);
        if (active) {
          setRows(checked);
          setLoading(false);
        }
      })
      .catch((reason: unknown) => {
        if (!active) return;
        const code =
          reason && typeof reason === "object" && "code" in reason
            ? reason.code
            : "";
        setError(
          code === "PGRST202"
            ? "Die gemeinsame Gaststatistik ist noch nicht eingerichtet."
            : "Die Gastaktivität konnte nicht geladen werden. Versuche es mit Internetverbindung erneut.",
        );
        setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [client, refresh]);
  const since = rows[0]?.collection_started_at;
  const measured = rows.filter(
    (r) => !since || r.activity_day >= berlinDay(since),
  );
  const totals = measured.reduce(
    (s, r) => ({
      started: s.started + r.started,
      completed: s.completed + r.completed,
      answered: s.answered + r.answered,
    }),
    { started: 0, completed: 0, answered: 0 },
  );
  return (
    <section className="guest-activity" aria-labelledby="guest-activity-title">
      <h3 id="guest-activity-title">Gastaktivität der letzten 7 Tage</h3>
      <p className="tiny muted">
        Heute und die sechs vorherigen Kalendertage · Zeit in Deutschland
      </p>
      {!client ? (
        <p>
          Die gemeinsame Gaststatistik ist ohne Kontodienst nicht verfügbar.
        </p>
      ) : loading ? (
        <p role="status">Gastaktivität wird geladen …</p>
      ) : error ? (
        <p role="status">{error}</p>
      ) : (
        <>
          <dl className="profile-stats">
            {[
              ["Spiele gestartet", totals.started],
              ["Spiele abgeschlossen", totals.completed],
              ["Fragen beantwortet", totals.answered],
            ].map(([label, count]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{count.toLocaleString("de-DE")}</dd>
              </div>
            ))}
          </dl>
          {totals.started === 0 && totals.completed === 0 && (
            <p>Noch keine Gastspiele im erfassten Zeitraum gemeldet.</p>
          )}
          <details className="ranking-details">
            <summary>Aktivität pro Tag</summary>
            <ul className="guest-days" aria-label="Tägliche Gastaktivität">
              {rows.map((r) => (
                <li key={r.activity_day}>
                  <strong>{dayLabel(r.activity_day)}</strong>
                  {since && r.activity_day < berlinDay(since) ? (
                    <span>Noch nicht erfasst</span>
                  ) : (
                    <span>
                      {r.started} gestartet · {r.completed} abgeschlossen ·{" "}
                      {r.answered} Antworten
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>
          {since && (
            <p className="tiny muted">
              Erfassung seit{" "}
              {new Date(since).toLocaleString("de-DE", {
                timeZone: "Europe/Berlin",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              Uhr. Frühere Gastspiele sind nicht enthalten.
            </p>
          )}
        </>
      )}
      {client && (
        <button
          className="text-button"
          disabled={loading}
          onClick={() => setRefresh((n) => n + 1)}
        >
          {error ? "Gastaktivität erneut laden" : "Gastaktivität aktualisieren"}
        </button>
      )}
      <p className="tiny muted">
        Gezählt werden gemeldete Spielstarts und Abschlüsse, keine einzelnen
        Personen oder bloßen Besuche. Antworten zählen aus abgeschlossenen
        Gastspielen. Offline gespielte Aktivitäten können später nachgemeldet
        werden; fehlende Meldungen sind nicht enthalten. Dein Gastspielstand
        bleibt auf diesem Gerät.
      </p>
    </section>
  );
}

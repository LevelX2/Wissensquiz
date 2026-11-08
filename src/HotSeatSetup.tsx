import { useEffect, useRef, useState } from "react";
import {
  defaultHotSeatSetup,
  hotSeatModes,
  hotSeatTheme,
  type HotSeatParticipant,
  type HotSeatSetup as Setup,
  type HotSeatTopic,
} from "./hotSeat";
import { familiarityLabel } from "./familiarity";

export function HotSeatSetup({
  initial,
  initialPlayers,
  topics,
  loading,
  busy,
  onOptions,
  onStart,
  onSave,
  onBack,
}: {
  initial?: Setup;
  initialPlayers?: HotSeatParticipant[];
  topics: HotSeatTopic[];
  loading: boolean;
  busy: boolean;
  onOptions: (setup: Setup) => void;
  onStart: (setup: Setup, players: HotSeatParticipant[]) => void;
  onSave: (name: string, setup: Setup) => void;
  onBack: () => void;
}) {
  const [setup, setSetup] = useState(initial ?? defaultHotSeatSetup);
  const [rows, setRows] = useState(
    () =>
      initialPlayers?.map((p) => ({
        name: p.name,
        members: p.members.join(", "),
      })) ?? [
        { name: "", members: "" },
        { name: "", members: "" },
      ],
  );
  const [templateName, setTemplateName] = useState("");
  const lengthChosen = useRef(!!initial);
  const patch = (values: Partial<Setup>) =>
    setSetup((s) => ({ ...s, ...values }));
  const filtersKey = JSON.stringify(setup.filters);
  useEffect(() => {
    onOptions(setup);
  }, [filtersKey]);
  useEffect(() => {
    if (!loading && topics.length)
      setSetup((s) => {
        const selected = s.topics.filter((id) =>
          topics.some((t) => t.id === id),
        );
        return {
          ...s,
          topics: selected.length
            ? selected
            : [topics.find((t) => t.id === "mix")?.id ?? topics[0].id],
        };
      });
  }, [topics, loading]);
  const players = rows.map((r) => ({
    name: r.name.trim(),
    members: setup.teams
      ? r.members
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
      : [r.name.trim()],
  }));
  const count = players.reduce((sum, p) => sum + p.members.length, 0);
  useEffect(() => {
    if (!lengthChosen.current && count >= 5) patch({ rounds: 3 });
  }, [count]);
  const validPlayers =
    count >= 2 &&
    count <= 8 &&
    players.every((p) => p.name && p.members.length > 0) &&
    new Set(players.map((p) => p.name.toLocaleLowerCase("de"))).size ===
      players.length;
  const selectionReady =
    !loading &&
    setup.topics.length > 0 &&
    setup.topics.every((id) => topics.some((t) => t.id === id));
  const tasks = setup.rounds * (setup.mode === "all" ? 1 : rows.length);
  const answerTurns =
    setup.rounds *
    (setup.mode === "all" && setup.input === "moderated" ? 1 : rows.length);
  const minutes = [
    Math.max(2, Math.ceil(answerTurns * 0.5)),
    Math.ceil(answerTurns * 0.75),
  ];
  const toggle = <T,>(values: T[], value: T) =>
    values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
  return (
    <form
      className="hot-seat-setup"
      onSubmit={(e) => {
        e.preventDefault();
        if (validPlayers && selectionReady) onStart(setup, players);
      }}
    >
      <fieldset disabled={busy}>
        <legend>Wer spielt mit?</legend>
        <label className="hot-check">
          <input
            type="checkbox"
            checked={setup.teams}
            onChange={(e) => patch({ teams: e.target.checked })}
          />
          Als Teams spielen
        </label>
        <p className="muted">
          Zwei bis acht Personen. Der Gastgeber kann mitspielen oder nur
          moderieren.
        </p>
        {rows.map((r, i) => (
          <div className="hot-player-form" key={i}>
            <span className={`hot-marker hot-color-${i}`} aria-hidden="true">
              {i + 1}
            </span>
            <label>
              {setup.teams ? "Team" : "Name"} {i + 1}
              <input
                maxLength={28}
                required
                autoComplete="off"
                value={r.name}
                placeholder={setup.teams ? `Team ${i + 1}` : `Spieler ${i + 1}`}
                onChange={(e) =>
                  setRows((rs) =>
                    rs.map((v, index) =>
                      index === i ? { ...v, name: e.target.value } : v,
                    ),
                  )
                }
              />
            </label>
            {setup.teams && (
              <label>
                Mitglieder, durch Komma getrennt
                <input
                  maxLength={300}
                  required
                  value={r.members}
                  placeholder="Anna, Ben"
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((v, index) =>
                        index === i ? { ...v, members: e.target.value } : v,
                      ),
                    )
                  }
                />
              </label>
            )}
            {rows.length > 2 && (
              <button
                type="button"
                className="text-button"
                aria-label={`Spielplatz ${i + 1} entfernen`}
                onClick={() =>
                  setRows((rs) => rs.filter((_, index) => index !== i))
                }
              >
                Entfernen
              </button>
            )}
          </div>
        ))}
        {rows.length < 8 && (
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, { name: "", members: "" }])}
          >
            {setup.teams ? "Team hinzufügen" : "Person hinzufügen"}
          </button>
        )}
        <p className="tiny">
          {count} von höchstens 8 Personen
          {count > 8 ? " · Bitte verkleinere die Teams." : ""}
        </p>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Wie wollt ihr spielen?</legend>
        <div className="hot-modes" role="group" aria-label="Hot-Seat-Spielmodi">
          {Object.entries(hotSeatModes).map(([id, m], i) => (
            <button
              type="button"
              key={id}
              aria-pressed={setup.mode === id}
              className={`hot-mode ${setup.mode === id ? "selected" : ""}`}
              onClick={() =>
                patch({
                  mode: id as Setup["mode"],
                  ...(id === "all" ? { steal: false } : {}),
                  ...(id === "hunt" &&
                  setup.topics.length === 1 &&
                  setup.topics[0] === "mix"
                    ? {
                        topics: topics
                          .filter((t) => t.id !== "mix")
                          .slice(0, 6)
                          .map((t) => t.id),
                      }
                    : {}),
                })
              }
            >
              <span aria-hidden="true">{["🎬", "🏅", "🎲", "🎟️"][i]}</span>
              <strong>{m.name}</strong>
              <small>{m.text}</small>
            </button>
          ))}
        </div>
        <p className="hot-rules">
          {setup.mode === "risk"
            ? "Leicht: +1 / 0 · Mittel: +3 / −1 · Schwer: +5 / −2. Die Schwierigkeit wählt ihr vor jeder Frage selbst."
            : setup.mode === "hunt"
              ? "Sammelt unterschiedliche Themenabzeichen. Bei gleicher Abzeichenzahl entscheiden die Punkte. Treffer: leicht 1, mittel 2, schwer 3 Punkte."
              : "Gleiche Verteilung von leicht, mittel und schwer. Treffer geben 1, 2 oder 3 Punkte; Fehler geben null."}
        </p>
        {setup.mode === "all" && (
          <label>
            Antworten erfassen
            <select
              value={setup.input}
              onChange={(e) =>
                patch({ input: e.target.value as Setup["input"] })
              }
            >
              <option value="moderated">
                Moderation mit Papier oder Antwortkärtchen
              </option>
              <option value="hidden">
                Verdeckte Antworten am herumgereichten Gerät
              </option>
            </select>
          </label>
        )}
        {setup.mode === "all" && (
          <p className="tiny">
            {setup.input === "moderated"
              ? "Alle legen sich auf A–D fest. Nach der Auflösung markiert der Bediener die richtigen Teilnehmer."
              : "Jeder gibt seine Antwort verdeckt ein. Die Lösung erscheint erst, wenn alle geantwortet haben."}
          </p>
        )}
      </fieldset>
      <details open={setup.topics.length === 0}>
        <summary>
          Partie anpassen · {setup.rounds} Durchgänge ·{" "}
          {setup.topics.map(hotSeatTheme).join(", ") || "Themen wählen"}
        </summary>
        <fieldset disabled={busy}>
          <legend>Inhalte</legend>
          <div className="hot-inline">
            {(
              [
                ["film", "Werkfragen"],
                ["actors", "Schauspieler"],
                ["awards", "Preise"],
              ] as const
            ).map(([id, label]) => (
              <label key={id} className="hot-check">
                <input
                  type="checkbox"
                  checked={setup.filters.sources.includes(id)}
                  onChange={() => {
                    const sources = toggle(setup.filters.sources, id);
                    if (sources.length)
                      patch({ filters: { ...setup.filters, sources } });
                  }}
                />
                {label}
              </label>
            ))}
          </div>
          <label>
            Werkarten
            <select
              value={setup.filters.workTypes?.[0] ?? "all"}
              onChange={(e) =>
                patch({
                  filters: {
                    ...setup.filters,
                    workTypes:
                      e.target.value === "all"
                        ? undefined
                        : [e.target.value as "film" | "series"],
                  },
                })
              }
            >
              <option value="all">Filme und Serien</option>
              <option value="film">Filme</option>
              <option value="series">Serien</option>
            </select>
          </label>
          <label>
            Machart
            <select
              value={setup.filters.techniques?.[0] ?? "all"}
              onChange={(e) =>
                patch({
                  filters: {
                    ...setup.filters,
                    techniques:
                      e.target.value === "all"
                        ? undefined
                        : [e.target.value as "animation" | "live-action"],
                  },
                })
              }
            >
              <option value="all">Alle Macharten</option>
              <option value="animation">Animation</option>
              <option value="live-action">Realfilm</option>
            </select>
          </label>
          <p className="tiny">
            Werkart und Machart begrenzen auch Schauspieler- und Preisfragen auf
            passende Werkbezüge.
          </p>
          <div className="hot-inline">
            {([1, 2, 3, 4] as const).map((f) => (
              <label key={f} className="hot-check">
                <input
                  type="checkbox"
                  checked={setup.filters.familiarities.includes(f)}
                  onChange={() => {
                    const familiarities = toggle(
                      setup.filters.familiarities,
                      f,
                    );
                    if (familiarities.length)
                      patch({ filters: { ...setup.filters, familiarities } });
                  }}
                />
                {familiarityLabel(f)}
              </label>
            ))}
          </div>
          <p className="tiny">
            Bekanntheit wählt die Werke und Personen. Die Frageschwierigkeit
            bestimmt der Spielmodus.
          </p>
          {loading ? (
            <p role="status">Verfügbare Themen werden geprüft …</p>
          ) : (
            <div
              className="hot-topics"
              role="group"
              aria-label="Gemeinsame Themen"
            >
              {topics.map((t) => (
                <label className="hot-check" key={t.id}>
                  <input
                    type="checkbox"
                    checked={setup.topics.includes(t.id)}
                    disabled={
                      !setup.topics.includes(t.id) && setup.topics.length >= 16
                    }
                    onChange={() =>
                      patch({ topics: toggle(setup.topics, t.id) })
                    }
                  />
                  {t.label}
                </label>
              ))}
            </div>
          )}
          {!loading && !selectionReady && (
            <p role="status">
              Wähle verfügbare Themen für diese Inhaltsauswahl.
            </p>
          )}
          {setup.mode === "hunt" && setup.topics.length < 3 && (
            <p className="tiny">
              Mit mindestens drei Themen wird die Abzeichenjagd
              abwechslungsreicher.
            </p>
          )}
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Länge und Extras</legend>
          <label>
            Partielänge
            <select
              value={setup.rounds}
              onChange={(e) => {
                lengthChosen.current = true;
                patch({ rounds: Number(e.target.value) as Setup["rounds"] });
              }}
            >
              <option value={3}>Kurz · 3 Durchgänge</option>
              <option value={6}>Normal · 6 Durchgänge</option>
              <option value={9}>Lang · 9 Durchgänge</option>
            </select>
          </label>
          <label>
            Antwortzeit
            <select
              value={setup.seconds}
              onChange={(e) =>
                patch({ seconds: Number(e.target.value) as Setup["seconds"] })
              }
            >
              <option value={0}>Entspannt · ohne Countdown</option>
              <option value={30}>30 Sekunden pro Antwort</option>
            </select>
          </label>
          <label className="hot-check">
            <input
              type="checkbox"
              checked={setup.double}
              onChange={(e) => patch({ double: e.target.checked })}
            />
            Doppelpunkt-Joker · einmal pro Spielplatz
          </label>
          {setup.mode !== "all" && (
            <>
              <label className="hot-check">
                <input
                  type="checkbox"
                  checked={setup.steal}
                  onChange={(e) => patch({ steal: e.target.checked })}
                />
                Stehljoker · ein zweiter Versuch pro Spielplatz
              </label>
              <p className="tiny">
                Nach einem Fehler bekommt der nächste Spielplatz mit freiem
                Joker eine Chance. Treffer: ein Bonuspunkt; kein Abzeichen.
              </p>
            </>
          )}
          <label className="hot-check">
            <input
              type="checkbox"
              checked={setup.tieBreak}
              onChange={(e) => patch({ tieBreak: e.target.checked })}
            />
            Bei Gleichstand stechen · höchstens drei Zusatzdurchgänge
          </label>
          <label className="hot-check">
            <input
              type="checkbox"
              checked={setup.sound}
              onChange={(e) => patch({ sound: e.target.checked })}
            />
            Spieltöne
          </label>
          <label className="hot-check">
            <input
              type="checkbox"
              checked={setup.explanations}
              onChange={(e) => patch({ explanations: e.target.checked })}
            />
            Erklärungen nach jeder Auflösung öffnen
          </label>
        </fieldset>
        <div className="hot-template-save">
          <label>
            Eigene Regelvorlage
            <input
              maxLength={60}
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Unser Filmabend"
            />
          </label>
          <button
            type="button"
            disabled={busy || !templateName.trim() || !selectionReady}
            onClick={() => onSave(templateName.trim(), setup)}
          >
            Vorlage speichern
          </button>
        </div>
      </details>
      <div className="hot-summary" aria-live="polite">
        <strong>
          {hotSeatModes[setup.mode].name} · {rows.length}{" "}
          {setup.teams ? "Teams" : "Spieler"}
        </strong>
        <p>
          {setup.rounds} Durchgänge · {tasks} Fragen · grob {minutes[0]}–
          {minutes[1]} Minuten zuzüglich Pausen
        </p>
        <p>{setup.topics.map(hotSeatTheme).join(" · ")}</p>
        <p className="tiny">
          Private Partiewertung. Persönlicher Lernstand und XP bleiben getrennt.
          Unterbrechen und Abbrechen sind jederzeit möglich.
        </p>
      </div>
      <div className="hot-actions">
        <button
          className="primary"
          disabled={busy || !validPlayers || !selectionReady}
          type="submit"
        >
          Partie starten →
        </button>
        <button type="button" disabled={busy} onClick={onBack}>
          Zur Übersicht
        </button>
      </div>
    </form>
  );
}

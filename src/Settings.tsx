import { useServer } from "./serverViews";
import { validateBackup } from "./backupValidation";
import { useEffect, useState } from "react";
import { SolutionChoice } from "./SolutionChoice";
import { DEFAULT_ANSWER_REVEAL_MS, emptyState, type State } from "./model";
import {
  playFeedback,
  stopFeedback,
  supportsHaptics,
  unlockSound,
  type SoundStatus,
} from "./feedback";
import type { Mutate } from "./uiTypes";

export function Settings({
  state,
  mutate,
  busy,
  onHome,
}: {
  state: State;
  mutate: Mutate;
  busy: boolean;
  onHome: () => void;
}) {
  const server = useServer();
  const [pendingSolutions, setPendingSolutions] =
    useState<State["settings"]["solutionDisplay"]>();
  const [hapticMessage, setHapticMessage] = useState("");
  const [soundMessage, setSoundMessage] = useState("");
  const [pendingRevealMs, setPendingRevealMs] = useState<number | null>(null);
  const revealMs =
    pendingRevealMs ??
    state.settings.answerRevealMs ??
    DEFAULT_ANSWER_REVEAL_MS;
  const revealSeconds = (revealMs / 1000).toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const saveRevealDuration = async (value: number) => {
    const saved = await mutate((s) => {
      s.settings.answerRevealMs = value;
    });
    if (saved)
      setPendingRevealMs((pending) => (pending === value ? null : pending));
    else setPendingRevealMs(null);
  };
  useEffect(() => {
    if (pendingRevealMs === null || busy) return;
    const timer = setTimeout(() => {
      void saveRevealDuration(pendingRevealMs);
    }, 300);
    return () => clearTimeout(timer);
  }, [pendingRevealMs, busy]);
  const reportSound = (status: SoundStatus) =>
    setSoundMessage(
      status === "ready"
        ? "Tonausgabe ist bereit. Falls Du das Probesignal nicht hörst, prüfe die Medienlautstärke und ob der Browser oder Tab stummgeschaltet ist. Auf dem iPhone muss auch der Stummmodus ausgeschaltet sein."
        : status === "unavailable"
          ? "Dieser Browser bietet keine Tonausgabe für die Soundeffekte."
          : status === "blocked"
            ? "Die Tonausgabe konnte nicht gestartet werden. Tippe erneut auf „Signal ausprobieren“ oder prüfe die Toneinstellungen des Browsers."
            : "Soundeffekte sind ausgeschaltet.",
    );
  const reportHaptics = (result: ReturnType<typeof playFeedback>) =>
    setHapticMessage(
      result === "blocked"
        ? "Der Browser konnte keine Vibration starten. Deine Auswahl bleibt gespeichert. Prüfe die Geräte- und Browsereinstellungen."
        : result === "requested"
          ? "Vibrationssignal angefordert. Falls Du nichts spürst, unterstützt Dein Gerät die Ausgabe möglicherweise nicht oder blockiert sie in den Einstellungen."
          : result === "unavailable"
            ? "Vibration ist eingeschaltet und gespeichert. Dieser Browser bietet keine Vibrationsfunktion; hier wird deshalb keine Vibration ausgegeben."
            : "",
    );
  const [reset, setReset] = useState("");
  return (
    <>
      <span className="eyebrow">DEIN KONTO. DEIN FORTSCHRITT.</span>
      <h1>
        Deine <em>Optionen.</em>
      </h1>
      <p className="lead">
        Ton, Vibration, Lösungsanzeige und Fragehinweise stellst Du hier ein.
        Dein Fortschritt wird automatisch in Deinem Konto online gespeichert.
      </p>
      <section className="settings-panel">
        <h2>Lösungen in Zeitspielen und im Freien Spiel</h2>
        <p>
          Sieh Erklärung und Zusatzinformationen nach jeder Antwort oder
          gesammelt nach Deiner Runde. Gilt für 10 Fragen, Fehlerfrei, Zeitkonto
          und das Freie Spiel. Filmreise und Wiederholen zeigen Lösungen immer
          direkt. Duelle zeigen die Lösung kurz nach jeder Antwort und
          Erklärungen nach der Zehnerrunde. Eine begonnene Runde behält ihre
          Einstellung.
        </p>
        <SolutionChoice
          value={
            pendingSolutions ?? state.settings.solutionDisplay ?? "question"
          }
          disabled={busy}
          onChange={(value) => {
            setPendingSolutions(value);
            void mutate((s) => {
              s.settings.solutionDisplay = value;
            }).finally(() => setPendingSolutions(undefined));
          }}
        />
        <label htmlFor="answer-reveal-duration">
          Anzeigezeit der Antworten
        </label>
        <div className="answer-duration">
          <input
            id="answer-reveal-duration"
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            value={revealMs / 1000}
            disabled={busy}
            aria-valuetext={`${revealSeconds} Sekunden`}
            aria-describedby="answer-duration-hint"
            onChange={(e) =>
              setPendingRevealMs(Math.round(Number(e.target.value) * 1000))
            }
            onBlur={() => {
              if (pendingRevealMs !== null && !busy)
                void saveRevealDuration(pendingRevealMs);
            }}
          />
          <output htmlFor="answer-reveal-duration">
            {revealSeconds} Sekunden
          </output>
        </div>
        <p id="answer-duration-hint" className="tiny muted">
          0,5 bis 4 Sekunden. So lange bleiben nach einer Antwort alle vier
          Möglichkeiten sichtbar: richtige Lösung grün, falsche Auswahl rot.
          Gilt auch für „Keine Ahnung“ und „Nach der Runde“. Während der Anzeige
          pausiert die Spielzeit. Danach folgt die Erklärung oder automatisch
          die nächste Frage. Im Duell dauert die Antwortanzeige immer 2,5
          Sekunden; Erklärungen erscheinen im Rundenrückblick.
        </p>
      </section>
      <section className="settings-panel">
        <h2>Hinweise an der Frage</h2>
        <p>
          Genre, Schwierigkeit und „Neu“ oder „Wiederholung“ stehen schon vor
          der Antwort an der Frage. Du kannst die Hinweise unabhängig
          ausblenden. Die Zahl bei „Wiederholung“ zählt frühere Antworten auf
          genau diese Frage, einschließlich Zeitablauf.
        </p>
        <div className="filter-options">
          {(
            [
              { key: "showGenre", label: "Zuordnungen anzeigen" },
              { key: "showDifficulty", label: "Schwierigkeit anzeigen" },
              {
                key: "showQuestionStatus",
                label: "Neu / Wiederholung anzeigen",
              },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="filter-choice">
              <input
                type="checkbox"
                checked={state.settings[key] !== false}
                disabled={busy}
                onChange={async (e) => {
                  const enabled = e.target.checked;
                  await mutate((s) => {
                    s.settings[key] = enabled;
                  });
                }}
              />
              {label}
            </label>
          ))}
        </div>
        <label>
          Fragenstatistik im Lernmodus
          <select
            value={state.settings.questionHistory ?? "after"}
            disabled={busy}
            onChange={async (e) => {
              const value = e.target.value as NonNullable<
                State["settings"]["questionHistory"]
              >;
              await mutate((s) => {
                s.settings.questionHistory = value;
              });
            }}
          >
            <option value="after">Nach der Antwort</option>
            <option value="always">Immer anzeigen</option>
            <option value="hidden">Ausblenden</option>
          </select>
        </label>
        <p className="muted tiny">
          Gilt für Filmreise und Freies Spiel. Nach der Antwort zählt Dein
          aktuelles Ergebnis bereits mit. Deine Auswahl wird im Spielstand
          online gespeichert.
        </p>
      </section>
      <section className="settings-panel" data-feedback="own">
        <h2>Ton & Vibration</h2>
        <p>
          Kurzes Klicksignal für Schaltflächen, unterschiedliche Töne für
          richtige und falsche Antworten sowie Signale für Rundenstart, nächste
          Frage, Zeitablauf und Abschluss. Alle Hinweise bleiben auch sichtbar.
        </p>
        <div className="filter-options">
          <label className="filter-choice">
            <input
              type="checkbox"
              checked={state.settings.sound !== false}
              disabled={busy}
              onChange={async (e) => {
                const enabled = e.target.checked;
                setSoundMessage("");
                const sound = enabled
                  ? unlockSound({ ...state.settings, sound: true })
                  : null;
                if (!enabled) stopFeedback();
                const saved = await mutate((s) => {
                  s.settings.sound = enabled;
                });
                if (saved && enabled) playFeedback("correct", saved.settings);
                if (saved && sound) reportSound(await sound);
              }}
            />
            Soundeffekte
          </label>
          <label className="filter-choice">
            <input
              type="checkbox"
              checked={!!state.settings.haptics}
              disabled={busy}
              aria-describedby="haptics-support"
              onChange={async (e) => {
                const enabled = e.target.checked;
                const saved = await mutate((s) => {
                  s.settings.haptics = enabled;
                });
                if (saved && enabled)
                  reportHaptics(
                    playFeedback("next", { ...saved.settings, sound: false }),
                  );
                if (saved && !enabled) {
                  stopFeedback();
                  setHapticMessage("Vibration ausgeschaltet und gespeichert.");
                }
              }}
            />
            Vibration
          </label>
        </div>
        <button
          className="secondary"
          disabled={state.settings.sound === false && !state.settings.haptics}
          onClick={async () => {
            const status = await unlockSound(state.settings);
            reportHaptics(playFeedback("correct", state.settings));
            reportSound(status);
          }}
        >
          Signal ausprobieren
        </button>
        <p id="haptics-support" className="muted tiny">
          {supportsHaptics()
            ? "Dieser Browser kann Vibrationssignale anfordern. Ob Du sie spürst, hängt vom Gerät und seinen Einstellungen ab."
            : "Dieser Browser bietet keine Vibration an. Du kannst Deine Auswahl trotzdem speichern; sie wirkt auf Geräten und in Browsern mit Vibrationsunterstützung."}{" "}
          Deine Auswahl wird in Deinem Online-Spielstand gespeichert. Keine
          Hintergrundmusik.
        </p>
        {hapticMessage && (
          <p className="tiny" role="status">
            {hapticMessage}
          </p>
        )}
        {soundMessage && (
          <p className="tiny" role="status">
            {soundMessage}
          </p>
        )}
      </section>
      <section className="settings-panel danger">
        <h2>Lernfortschritt zurücksetzen</h2>
        <p>
          Runden, Antworten, Erfahrung, Rekorde, Abzeichen, Einstellungen und
          Meldungen werden gelöscht. Der aktuelle Fragenbestand bleibt auf dem
          Server erhalten.
        </p>
        <label>
          Zum Bestätigen LÖSCHEN eingeben
          <input
            value={reset}
            onChange={(e) => setReset(e.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          className="danger-button"
          disabled={reset !== "LÖSCHEN" || busy}
          onClick={async () => {
            const saved = await mutate(
              (s) => {
                const questions = server ? [] : s.questions,
                  imports = s.imports;
                for (const key of Object.keys(s))
                  delete (s as unknown as Record<string, unknown>)[key];
                Object.assign(s, validateBackup(emptyState(questions)));
                s.imports = imports;
              },
              { replace: true },
            );
            if (saved) onHome();
          }}
        >
          Fortschritt jetzt endgültig zurücksetzen
        </button>
      </section>
    </>
  );
}

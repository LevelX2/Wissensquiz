import { validateBackup } from "./backupValidation";
import { useEffect, useState } from "react";
import { SolutionChoice } from "./SolutionChoice";
import { DEFAULT_ANSWER_REVEAL_MS, emptyState, type State } from "./model";
import { download } from "./download";
import { isRecordMode } from "./recordModes";
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
  setState,
  busy,
  onHome,
}: {
  state: State;
  mutate: Mutate;
  setState: (s: State) => void;
  busy: boolean;
  onHome: () => void;
}) {
  const [message, setMessage] = useState("");
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
  const [backup, setBackup] = useState<State | null>(null);
  const [reset, setReset] = useState("");
  const readBackup = async (file: File | undefined) => {
    setMessage("");
    if (!file) return;
    const maxMiB = 64;
    if (file.size > maxMiB * 1024 * 1024) {
      setMessage(`Datei ist zu groß. Höchstens ${maxMiB} MiB.`);
      return;
    }
    try {
      const text = await file.text();
      setBackup(validateBackup(JSON.parse(text)));
    } catch (e) {
      setMessage(
        `Datei abgelehnt: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };
  return (
    <>
      <span className="eyebrow">DEIN KONTO. DEIN FORTSCHRITT.</span>
      <h1>
        Einstellungen <em>& Daten.</em>
      </h1>
      <p className="lead">
        Ton, Vibration, Lösungsanzeige und Fragehinweise stellst Du hier ein.
        Dein Fortschritt wird in Deinem Konto online gespeichert. Eine
        JSON-Sicherung bietet Dir eine zusätzliche Kopie.
      </p>
      <div role="status">{message && <p className="notice">{message}</p>}</div>
      <section className="settings-panel">
        <h2>Lösungen in Zeitspielen und im Freien Spiel</h2>
        <p>
          Sieh Erklärung und Zusatzinformationen nach jeder Antwort oder
          gesammelt nach Deiner Runde. Gilt für 10 Fragen, Fehlerfrei, Zeitkonto
          und das Freie Spiel. Filmreise und Fehlertraining zeigen Lösungen
          immer direkt. Duelle zeigen sie immer nach der eigenen Zehnerrunde.
          Eine begonnene Runde behält ihre Einstellung.
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
          die nächste Frage. Im Duell erscheinen Lösungen erst im Rückblick.
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
              { key: "showGenre", label: "Genre anzeigen" },
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
          online gespeichert und ist in Deiner JSON-Sicherung enthalten.
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
      <section className="settings-panel">
        <h2>Dein Lernpaket</h2>
        <p>
          {state.questions.length} Fragen ·{" "}
          {new Set(state.questions.map((q) => q.knowledgeId)).size} Wissensziele
          · {state.questions.filter((q) => q.demo).length} Demo-Fragen
        </p>
        <p className="muted">
          Zum Öffnen des Quiz und Laden der Bilder brauchst Du eine
          Internetverbindung. Dein Fortschritt wird in Deinem Konto online
          gespeichert.
        </p>
      </section>
      <section className="settings-panel">
        <h2>Fortschritt sichern & wiederherstellen</h2>
        <p>
          Der Export enthält auch Fragen, Inhaltsversionen, Runden und lokale
          Meldungen. Ein Wiederimport ersetzt nach Deiner Bestätigung den
          gesamten Online-Spielstand.
        </p>
        <button
          className="primary"
          onClick={() =>
            download(
              `wissensquiz-${new Date().toISOString().slice(0, 10)}.json`,
              state,
            )
          }
        >
          Alles als JSON sichern ↓
        </button>
        <label className="file-label">
          Sicherung auswählen
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => void readBackup(e.target.files?.[0])}
          />
        </label>
        {backup && (
          <div className="notice">
            <p>
              Geprüfte Sicherung: {backup.questions.length} Fragen,{" "}
              {backup.rounds.length} Runden. Dein jetziger Stand wird ersetzt.
              Laufende Rekordrunden werden beendet.
            </p>
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                try {
                  const restored = validateBackup(backup);
                  for (const round of restored.rounds)
                    if (round.status === "active" && isRecordMode(round.mode)) {
                      round.status = "aborted";
                      round.finishedAt = Date.now();
                    }
                  const saved = await mutate(
                    (s) => {
                      for (const name of Object.keys(s))
                        delete (s as unknown as Record<string, unknown>)[name];
                      Object.assign(s, restored);
                    },
                    { replace: true },
                  );
                  if (!saved) return;
                  setState(saved);
                  setBackup(null);
                  setMessage("Sicherung vollständig wiederhergestellt.");
                } catch (e) {
                  setMessage(`Wiederherstellung fehlgeschlagen: ${String(e)}`);
                }
              }}
            >
              Online-Spielstand durch Sicherung ersetzen
            </button>
            <button className="text-button" onClick={() => setBackup(null)}>
              Abbrechen
            </button>
          </div>
        )}
      </section>
      <section className="settings-panel">
        <h2>Bisherige lokale Fragenmeldungen</h2>
        <p>
          {state.reports.length} frühere Meldungen im Spielstand gespeichert.
          Diese Meldungen wurden nicht an GitHub gesendet. Neue Meldungen
          sendest Du direkt bei der Frage oder im Profil.
        </p>
        <button
          className="secondary"
          onClick={() =>
            download("wissensquiz-fragenmeldungen.json", state.reports)
          }
        >
          Meldungen exportieren ↓
        </button>
      </section>
      <section className="settings-panel">
        <h2>So wächst Dein Wissen</h2>
        <p>
          Nach einer ersten sicheren Antwort folgt eine Wiederholung nach etwa
          einem Tag. Weitere sichere, fällige Antworten verlängern auf drei,
          sieben und 21 Tage.
        </p>
        <p>
          „Gefestigt“ braucht mindestens vier sichere Lerntage und eine
          erfolgreiche Wiederholung nach mindestens sieben Tagen Abstand. Am
          gleichen Tag steigt die Stufe höchstens einmal. Falsche Antworten
          kommen nach zehn Minuten, geratene nach sechs Stunden wieder.
        </p>
        <p className="muted">
          Das sind konfigurierbare Testregeln, keine wissenschaftliche Messung
          Deines gesamten Wissens. Eine Runde enthält jedes Wissensziel nur
          einmal.
        </p>
      </section>
      <section className="settings-panel danger">
        <h2>Lernfortschritt zurücksetzen</h2>
        <p>
          Runden, Antworten, Erfahrung, Rekorde, Abzeichen, Einstellungen und
          Meldungen werden gelöscht. Fragen und Importberichte bleiben erhalten.
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
                const questions = s.questions,
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

import { validateBackup } from "./backupValidation";
import { useState } from "react";
import { SolutionChoice } from "./SolutionChoice";
import { importCsv } from "./importer";
import { emptyState, type ImportReport, type State } from "./model";
import { download, restore as restoreStored } from "./storage";
import { useOffline } from "./offline";
import {
  playFeedback,
  stopFeedback,
  supportsHaptics,
  unlockSound,
} from "./feedback";
import type { Mutate } from "./uiTypes";
import { formatDate } from "./gameUi";

export function Settings({
  storageKey,
  state,
  mutate,
  setState,
  busy,
  offline,
  onHome,
}: {
  state: State;
  storageKey: string;
  mutate: Mutate;
  setState: (s: State) => void;
  busy: boolean;
  offline: ReturnType<typeof useOffline>;
  onHome: () => void;
}) {
  const [message, setMessage] = useState("");
  const [pendingSolutions, setPendingSolutions] =
    useState<State["settings"]["solutionDisplay"]>();
  const [hapticMessage, setHapticMessage] = useState("");
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
  const [csv, setCsv] = useState<{
    text: string;
    name: string;
    report: ImportReport;
  } | null>(null);
  const [backup, setBackup] = useState<State | null>(null);
  const [reset, setReset] = useState("");
  const readFile = async (file: File | undefined, kind: "csv" | "json") => {
    setMessage("");
    if (!file) return;
    const maxMiB = kind === "json" ? 64 : 20;
    if (file.size > maxMiB * 1024 * 1024) {
      setMessage(`Datei ist zu groß. Höchstens ${maxMiB} MiB.`);
      return;
    }
    try {
      const text = await file.text();
      if (kind === "csv") {
        const imported = importCsv(text, state.questions, file.name);
        setCsv({ text, name: file.name, report: imported.report });
      } else {
        setBackup(validateBackup(JSON.parse(text)));
      }
    } catch (e) {
      setMessage(
        `Datei abgelehnt: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };
  return (
    <>
      <span className="eyebrow">DEIN GERÄT. DEINE DATEN.</span>
      <h1>
        Einstellungen <em>& Daten.</em>
      </h1>
      <p className="lead">
        Ton, Vibration, Lösungsanzeige und Fragehinweise stellst Du hier ein.
        Angemeldet wird Dein Fortschritt automatisch online gespeichert; als
        Gast bleibt er auf diesem Gerät. Eine JSON-Sicherung bietet Dir eine
        zusätzliche Kopie.
      </p>
      <div role="status">{message && <p className="notice">{message}</p>}</div>
      <section className="settings-panel">
        <h2>Lösungen in Solospielen</h2>
        <p>
          Sieh die Lösung und Zusatzinformationen nach jeder Antwort oder
          gesammelt nach Deiner Runde. Gilt für neue Solorunden; eine begonnene
          Runde behält ihre Einstellung. Den Ablauf eines Duells wählst Du beim
          Anlegen.
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
      </section>
      <section className="settings-panel">
        <h2>Hinweise an der Frage</h2>
        <p>
          Bei gemischten Runden zeigen diese Hinweise das Genre und die
          Schwierigkeit der aktuellen Frage. Du kannst beide unabhängig
          ausblenden.
        </p>
        <div className="filter-options">
          {(
            [
              { key: "showGenre", label: "Genre anzeigen" },
              { key: "showDifficulty", label: "Schwierigkeit anzeigen" },
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
          gespeichert, bei angemeldeten Konten auch online, und ist in Deiner
          JSON-Sicherung enthalten.
        </p>
      </section>
      <section className="settings-panel">
        <h2>Ton & Vibration</h2>
        <p>
          Kurze Signale für Rundenstart, Antworten, nächste Frage, Zeitablauf
          und Abschluss. Alle Hinweise bleiben auch sichtbar.
        </p>
        <div className="filter-options">
          <label className="filter-choice">
            <input
              type="checkbox"
              checked={state.settings.sound !== false}
              disabled={busy}
              onChange={async (e) => {
                const enabled = e.target.checked;
                if (enabled) unlockSound({ ...state.settings, sound: true });
                else stopFeedback();
                const saved = await mutate((s) => {
                  s.settings.sound = enabled;
                });
                if (saved && enabled) playFeedback("correct", saved.settings);
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
            await unlockSound(state.settings);
            reportHaptics(playFeedback("correct", state.settings));
          }}
        >
          Signal ausprobieren
        </button>
        <p id="haptics-support" className="muted tiny">
          {supportsHaptics()
            ? "Dieser Browser kann Vibrationssignale anfordern. Ob Du sie spürst, hängt vom Gerät und seinen Einstellungen ab."
            : "Dieser Browser bietet keine Vibration an. Du kannst Deine Auswahl trotzdem speichern; sie wirkt auf Geräten und in Browsern mit Vibrationsunterstützung."}{" "}
          Deine Auswahl wird im Spielstand gespeichert, bei angemeldeten Konten
          auch online. Keine Hintergrundmusik.
        </p>
        {hapticMessage && (
          <p className="tiny" role="status">
            {hapticMessage}
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
        <p>
          {offline.online
            ? "Netzwerkverbindung vorhanden."
            : "Das Gerät meldet keine Netzwerkverbindung."}{" "}
          {offline.ready
            ? "Die App-Dateien sind im Offline-Cache bestätigt. Fragen und Erklärungen liegen im lokalen Speicher."
            : "Die App-Dateien sind noch nicht als offline verfügbar bestätigt."}
        </p>
        {!offline.supported && (
          <p className="notice">
            Offline-Installation benötigt HTTPS oder localhost. Über eine
            unverschlüsselte Heimnetz-Adresse kannst Du online spielen und
            speichern.
          </p>
        )}
        {offline.waiting && (
          <p className="notice">
            Ein Update ist bereit. Schließe nach Deiner Runde alle App-Fenster
            und öffne die App erneut. Dein Fortschritt bleibt erhalten.
          </p>
        )}
        <p className="muted">
          Auf unterstützten Geräten findest Du „Installieren“ oder „Zum
          Home-Bildschirm“ im Browsermenü. Der Offline-Status wird erst nach
          vollständigem Laden bestätigt.
        </p>
        <button
          className="secondary"
          onClick={async () => {
            const granted = await navigator.storage?.persist?.();
            setMessage(
              granted
                ? "Der Browser hat dauerhaften Speicher gewährt. Exporte bleiben sinnvoll."
                : "Dauerhafter Speicher wurde nicht gewährt oder wird nicht unterstützt. Bitte regelmäßig exportieren.",
            );
          }}
        >
          Dauerhaften Gerätespeicher anfragen
        </button>
      </section>
      <section className="settings-panel">
        <h2>Fragen hinzufügen</h2>
        <p>
          CSV mit UTF-8, Komma, Semikolon oder Tabulator. Vorhandene IDs werden
          übersprungen. Dein Fortschritt bleibt erhalten.
        </p>
        <label className="file-label">
          CSV auswählen
          <input
            type="file"
            accept=".csv,text/csv,text/tab-separated-values"
            onChange={(e) => void readFile(e.target.files?.[0], "csv")}
          />
        </label>
        <a className="text-button" href="/demo-fragen.csv" download>
          Demo-CSV als Formatbeispiel ↓
        </a>
        {csv && (
          <div className="import-preview">
            <h3>Importvorschau: {csv.name}</h3>
            <ImportSummary report={csv.report} />
            <button
              className="primary"
              disabled={
                busy ||
                csv.report.accepted === 0 ||
                state.rounds.some((r) => r.status === "active")
              }
              onClick={async () => {
                const saved = await mutate(
                  (s) => {
                    const incoming = importCsv(csv.text, s.questions, csv.name);
                    s.questions.push(...incoming.questions);
                    s.imports.push(incoming.report);
                  },
                  { progressOnly: false },
                );
                if (saved) {
                  setCsv(null);
                  setMessage(
                    "Fragenpaket gespeichert. Den vollständigen Bericht findest Du unten.",
                  );
                }
              }}
            >
              Gültige Fragen importieren
            </button>
            {state.rounds.some((r) => r.status === "active") && (
              <p>Beende zuerst Deine laufende Runde.</p>
            )}
          </div>
        )}
        <details>
          <summary>Bisherige Importberichte ({state.imports.length})</summary>
          {state.imports.map((r, i) => (
            <div className="import-report" key={`${r.at}:${i}`}>
              <h3>
                {r.filename} · {formatDate(r.at)}
              </h3>
              <ImportSummary report={r} />
            </div>
          ))}
        </details>
        <button
          className="text-button"
          onClick={() =>
            download("wissensquiz-importberichte.json", state.imports)
          }
        >
          Importberichte exportieren ↓
        </button>
      </section>
      <section className="settings-panel">
        <h2>Fortschritt sichern & wiederherstellen</h2>
        <p>
          Der Export enthält auch Fragen, Inhaltsversionen, Runden und lokale
          Meldungen. Ein Wiederimport ersetzt nach Deiner Bestätigung den
          gesamten lokalen Stand.
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
            onChange={(e) => void readFile(e.target.files?.[0], "json")}
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
                  const saved = await restoreStored(backup, storageKey);
                  setState(saved);
                  setBackup(null);
                  setMessage("Sicherung vollständig wiederhergestellt.");
                } catch (e) {
                  setMessage(`Wiederherstellung fehlgeschlagen: ${String(e)}`);
                }
              }}
            >
              Lokalen Stand durch Sicherung ersetzen
            </button>
            <button className="text-button" onClick={() => setBackup(null)}>
              Abbrechen
            </button>
          </div>
        )}
      </section>
      <section className="settings-panel">
        <h2>Lokale Fragenmeldungen</h2>
        <p>
          {state.reports.length} Meldungen auf diesem Gerät gespeichert. Es
          wurde nichts an eine Redaktion gesendet.
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
                Object.assign(s, emptyState(questions));
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

export function ImportSummary({ report: r }: { report: ImportReport }) {
  return (
    <>
      <p>
        <b>{r.accepted}</b> gültig · <b>{r.rejected}</b> ausgeschlossen ·{" "}
        <b>{r.duplicates}</b> vorhandene IDs übersprungen
      </p>
      <p className="tiny muted">
        Trennzeichen: {r.delimiter === "\t" ? "Tabulator" : r.delimiter} ·{" "}
        {r.columns.length} Spalten erkannt
      </p>
      {r.issues.length > 0 && (
        <details open>
          <summary>Hinweise zu ausgeschlossenen Daten</summary>
          <ul>
            {r.issues.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </details>
      )}
      {r.warnings.length > 0 && (
        <details>
          <summary>Annahmen und Einschränkungen ({r.warnings.length})</summary>
          <ul>
            {r.warnings.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </details>
      )}
      <details>
        <summary>Erkannte Spalten</summary>
        <p className="mono">{r.columns.join(", ")}</p>
      </details>
    </>
  );
}

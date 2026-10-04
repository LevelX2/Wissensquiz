# Wissensquiz · Dein Filmkosmos

Deutsches Filmquiz mit React/TypeScript, kurzen Runden und dauerhaftem Lernfortschritt. Als Gast funktioniert es ohne Konto oder verpflichtendes Backend; ein eigenes Quiz-Konto ergänzt private Online-Sicherung und Duelle.

Stand 03.10.2026: **19 Quellenpakete, 6.277 Fragen und 5.734 Wissensziele**, 656 eingeordnete Filme und 175 Personen. **Sites-Version 48 ist veröffentlicht** (03.10.2026, 19:55:10 Uhr Europe/Berlin), in `main` integriert und auf GitHub synchronisiert. Die Startseite zeigt genau eine große Kachel für den gewählten Modus. „Modus ändern“ öffnet die Auswahl; eine Wahl schließt sie wieder, erst „Losspielen“ startet. Neuladen und Rückkehr erhalten diese Darstellung. Faire Rekordkategorien, frühere Highscore-Bereinigung, Lernfortschritt und die 600 zusätzlichen Schauspielerfragen bleiben enthalten. Version und tatsächliche Veröffentlichungszeit stehen im Profil. 301 Tests und 26 gezielte Browserfälle erfolgreich. [Prüfnachweis](docs/Pruefbericht.md), [Betrieb](docs/Sites-Betrieb.md), [frühere Gesamtintegration](docs/Gesamtintegration-2026-10-03.md). Frühere Meldungen bleiben in der [README-Historie](README-Historie-2026-10-03.md) erhalten.

## Starten

[Öffentliches Quiz](https://wissensquiz-filmkosmos.levelx2.chatgpt.site) ohne vorgeschaltete ChatGPT-Anmeldung. Veröffentlichten Stand und Betriebsablauf dokumentiert [Sites-Betrieb](docs/Sites-Betrieb.md).

Lokal: Node.js 22.12+ und npm. Im Projektordner in PowerShell:

```powershell
npm ci
npm run build
npm run preview
```

Vorschau unter http://localhost:4173; Entwicklung mit `npm run dev` auf Port 5173. Die Vorschau kann im selben Netz über die aktuelle Netzwerkadresse des Rechners geöffnet werden; Rechner und Prozess müssen laufen. Offlinebetrieb benötigt Produktions-Build, HTTPS oder localhost und einen vollständig vorbereiteten Cache. Browserdaten sind an Gerät, Browser, Protokoll, Host und Port gebunden. Für einen Adresswechsel den Spielstand als JSON sichern und ausdrücklich wiederherstellen.

## Spielen und Fortschritt

- **Filmreise:** neue Ziele bevorzugen und weitere Filmgruppen/Stufen je Genre freischalten. Erworbene Freischaltungen bleiben erhalten.
- **Freies Spiel:** freie Auswahl ohne Zeitdruck und Lernstandsgewichtung.
- **Auf Zeit:** 10 Fragen mit 30 Sekunden je Frage; Fehlerfrei bis zum ersten Fehler; Zeitkonto mit 120 Sekunden, +15 je Treffer und −45 je Fehler zusätzlich zur Antwortzeit. Laufpunkte bleiben vom Lernfortschritt und den Karriere-XP getrennt.
- **Fehlertraining:** offene Fehler gezielt wiederholen; auch direkt aus dem Rundenergebnis.
- **Fragenbereiche:** Filmfragen, Preisträger und Schauspieler gemeinsam oder einzeln wählen. Genres, Filmgruppen und Classics/Arthouse begrenzen nur Filmfragen.
- **Runden:** Lernen zuerst mit fünf, danach bis zu zehn unterschiedlichen Wissenszielen; Auf Zeit mit zehn oder einer endlosen Folge. „Keine Ahnung“ ist eine ausdrückliche Fehlantwort. Filmreise und Fehlertraining zeigen Lösungen direkt; Zeitspiele und Freies Spiel wahlweise direkt oder nach der Runde. Neue Duelle zeigen Lösungen immer nach der eigenen Zehnerrunde. Bei gesammelten Lösungen folgen die Fragen automatisch aufeinander. Erklärungen, Quellen, Fragebilanz und Filmdaten stehen passend zum jeweiligen Fragenbereich bereit.
- **Sammlung und Karriere:** Antwortfortschritt, gefestigte Ziele, Rundenergebnisse, Level und XP. Highscores zeigen jeden abgeschlossenen Lauf einzeln, einschließlich Nullpunkten, für Woche/Monat/Jahr/Allzeit. Rekordspiele, Duelle und Karriere haben eigene Wertungen.
- **Duell:** bestätigte Konten spielen drei gemeinsame Runden mit offenen Spielplätzen und serverseitigen Fristen. Eigene bestätigte Antworten gehen in den eigenen Lernstand ein.

Die maßgeblichen Regeln stehen in [Lernregeln](docs/Lernregeln.md), [Fragenbereichen und Bekanntheit](docs/Spielmodi-und-Bekanntheit.md), [Filmkarriere](docs/Filmkarriere-und-XP.md) und [Filmduellen](docs/Asynchrone-Filmduelle.md). Profil → Optionen enthält Ton/Vibration, Hinweise, Lösungsausgabe, Datenexport und geprüfte Wiederherstellung. Neue Fragen werden über die eigene Paket-/Update-Logik bereitgestellt; der manuelle CSV-Import ist seit der lokalen Bereinigung vom 04.10.2026 entfernt. [Importformat](docs/Importformat.md) beschreibt IDs, Varianten und Originalspalten; Rohquellen werden unverändert erhalten.

## Speicherung und Offlinebetrieb

Der Gaststand bleibt lokal in IndexedDB. Angemeldete Konten werden nach lokaler Speicherung automatisch privat in Supabase gesichert; Revisionen verhindern stilles Überschreiben konkurrierender Stände. Konto und Gast bleiben getrennt. Vor Gerätewechsel die aktuelle Onlinebestätigung abwarten. Lokal ergänzt: dauerhafte atomare Änderungswarteschlange, bestätigte Paketwiederholung, gezielter Revisionsabruf, Wartegrenzen, exportierbare Rückfallkopien und kleine Ranglistenprojektionen; [Vertrag](docs/Konten-und-Spielstaende.md).

Die lokale Umsetzung verwendet IndexedDB-Version 3: Gaststände behalten das getrennte Kataloglayout, migrierte Konten getrennte Einträge und gemeinsame unveränderliche offizielle Kataloge. Private Importe bleiben kontogebunden; abgeschlossene Runden werden ab Version 46 auf Bewertungsfakten reduziert. Eingefrorene Ausgangskopien bleiben für den gesonderten Rückfallablauf geschützt. Vollständige JSON-Sicherungen behalten Schema 1. Die PWA hält App-Dateien, Nebenansichten und Fragenpakete offline bereit. Ein neues Update aktiviert erst nach dem Schließen alter Quiz-Fenster. Private Spielstände sind kein Teil der Veröffentlichungsdateien. [Datenorganisation](docs/Fragedaten-Organisation.md), [vorbereiteter Produktionsablauf](docs/Speicher-und-Sync-Migration.md).

## Projektaufbau

| Bereich | Zuständigkeit |
| --- | --- |
| `src/App.tsx` und Seitenkomponenten | Navigation, lokaler Zustand und sichtbare Ansichten |
| `src/QuestionScreen.tsx`, `RoundResult.tsx`, `Explanation.tsx` | Gemeinsame Solo-/Duell-Spielansichten |
| `src/engine.ts` und Fachmodule | Auswahl, Antworten, Lernen, Fehlertraining, Karriere und Freischaltungen |
| `src/questionSchema.ts`, `backupSchema.ts`, `backupValidation.ts` | Gemeinsame Typ-/Sicherungsverträge und fachliche Validierung |
| `src/storage.ts`, `database.ts`, `localCatalog.ts`, `catalogCodec.ts` | Speicherfassade, lokale Migration und verlustfreie Gastkodierung |
| `src/syncCodec.ts`, `entryStorage.ts`, `entryRemote.ts`, `entrySync.ts` | Inhaltsnachweise, atomare Outbox, Konto-Einträge und Revisionsprotokoll |
| `src/AccountApp.tsx`, `AccountPanel.tsx`, `AccountLinkPanel.tsx` | Kontosteuerung, Profil-/Anmeldeformular und Rückkehr aus Kontolinks |
| `src/accounts.ts`, `accountSync.ts` | Kontodienst, privater Fortschritt und Revisionsschutz |
| `src/style.css`, `src/styles/` | Dokumentierte CSS-Importfolge mit erhaltener Kaskade |
| `public/`, `scripts/build-sw.mjs` | Auslieferbare Fragen/Assets und vollständiges Offline-Paket |
| `docs/`, `KI-Wissen-Wissensquiz/` | Fachverträge, Quellen, Wissen und datierte Nachweise |

## Prüfen und weiterarbeiten

```powershell
npm test
npm run build
npm run test:browser
git diff --check
```

Browserprüfungen verwenden isolierte Profile, kontrollierte Zeit und abgefangene Kontodienste. Bei Abhängigkeitsänderungen zusätzlich `npm audit`. Für Quellenorganisation: `npm run check:questions`; daraus erzeugte Berichte nur bei einem tatsächlichen Datenprüfauftrag übernehmen.

Aktueller Nachweis und Grenzen: [Speicher-/Sync-Abnahme](docs/Speicher-und-Sync-Abnahme.md), [Messdaten](docs/Speicher-und-Sync-Messung.json), [Struktur-Abnahme](docs/Strukturverbesserungen-Abnahme.md), [Prüfbericht](docs/Pruefbericht.md), [Qualitätsprozess](KI-Wissen-Wissensquiz/03%20Betrieb/Qualitaetspruefung.md). Projektregeln: [AGENTS.md](AGENTS.md); Einstieg: [Projektstart](KI-Wissen-Wissensquiz/00%20Projektstart.md) und [Wissensindex](KI-Wissen-Wissensquiz/02%20Wissen/00%20Uebersichten/Index.md). Remote, Push, Integration und Veröffentlichung benötigen den jeweils ausdrücklichen Auftrag.

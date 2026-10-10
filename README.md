# Wissensquiz · Dein Filmkosmos

Deutsches Filmquiz mit React/TypeScript, kurzen Runden und dauerhaftem Lernfortschritt. Zum Spielen ist ein bestätigtes Quiz-Konto erforderlich. Der Fortschritt wird ausschließlich privat online gespeichert; ein Offline-Paket und automatische lokale Spielstände gibt es nicht.

Stand 10.10.2026, öffentlich als **Sites-Version 59**: Anmeldungspflicht, ausschließlich online gespeicherter Spielstand und Poster zu allen **154 SciFi-Filmfassungen** nach der Antwort. Antwortfarben und Anzeigedauer auch bei gesammelter Auflösung erhalten. Unverändert **33 Quellenpakete, 12.773 Fragen und 12.207 Wissensziele**. Alle zwölf Filmgenres umfassen mindestens 100 Filme; die Übersicht fälliger Wiederholungen ist ebenfalls veröffentlicht. [Bestand aller Bereiche](docs/Genres-100-2026-10-08/Bestandsuebersicht.md), [Betrieb](docs/Sites-Betrieb.md), [Prüfnachweise](docs/Pruefbericht.md).

## Starten

[Öffentliches Quiz](https://wissensquiz-filmkosmos.levelx2.chatgpt.site) ohne vorgeschaltete ChatGPT-Anmeldung. Veröffentlichten Stand und Betriebsablauf dokumentiert [Sites-Betrieb](docs/Sites-Betrieb.md).

Lokal: Node.js 22.12+ und npm. Im Projektordner in PowerShell:

```powershell
npm ci
npm run build
npm run preview
```

Vorschau unter http://localhost:4173; Entwicklung mit `npm run dev` auf Port 5173. Die Vorschau kann im selben Netz über die aktuelle Netzwerkadresse des Rechners geöffnet werden; Rechner und Prozess müssen laufen. Zum Spielen und Laden von Bildern ist Internet erforderlich. Der Fortschritt gehört zum angemeldeten Konto.

SciFi-Poster sind lokal eingebaut und erscheinen erst zur Lösung. Für eine frische Projektkopie den Posterindex mit `npm run prepare:posters` vorbereiten; Zugangsdaten bleiben ausschließlich in `.env.tmdb.local`. Den erzeugten, ignorierten Index vor einer Veröffentlichung in die geprüfte Buildkopie aufnehmen. [Betreiberablauf, Erneuerung und Bildnutzung](docs/Filmposter.md).

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

Seit Sites-Version 55: Bestätigte Quiz-Konten können aus einer Frage oder dem Profil technische Fehler, falsche Inhalte, Textverbesserungen und Sonstiges als öffentliches GitHub-Issue melden. Der Versand läuft über eine geschützte Supabase Function; private Spielstände werden nicht mitgesendet. Servererweiterung eingerichtet, Oberfläche seit Version 55 veröffentlicht; GitHub-Schlüssel noch offen. [Meldevertrag und Einrichtung](docs/GitHub-Meldungen.md).

## Anmeldung und Speicherung

Seit Version 59 verlangt das Quiz eine bestätigte Quiz-Anmeldung und speichert ausschließlich online. Antworten zählen erst nach Serverbestätigung; bei Speicherfehlern gibt es eine ausdrückliche Wiederholung. Revisionen verhindern das Überschreiben neuerer Gerätestände. Gastspiel, automatische Browser-Spielstände und Offline-Paket sind entfernt. Vorhandene Browserdaten werden nicht ungefragt gelöscht. JSON-Export und bestätigte Wiederherstellung bleiben manuelle Kontoaktionen. [Aktueller Vertrag und Veröffentlichungsgrenze](docs/Anmeldung-und-Online-Spielstand.md).

## Projektaufbau

| Bereich | Zuständigkeit |
| --- | --- |
| `src/App.tsx` und Seitenkomponenten | Navigation, Arbeitszustand im RAM und sichtbare Ansichten |
| `src/QuestionScreen.tsx`, `RoundResult.tsx`, `Explanation.tsx` | Gemeinsame Solo-/Duell-Spielansichten |
| `src/engine.ts` und Fachmodule | Auswahl, Antworten, Lernen, Fehlertraining, Karriere und Freischaltungen |
| `src/questionSchema.ts`, `backupSchema.ts`, `backupValidation.ts` | Gemeinsame Typ-/Sicherungsverträge und fachliche Validierung |
| `src/onlineGameStore.ts`, `syncCodec.ts`, `entryRemote.ts` | Arbeitsstand im RAM, Inhaltsnachweise und bestätigtes Serverprotokoll |
| Frühere lokale Speichermodule | Im aktiven Spielweg unbenutzt; vorhandene isolierte Regressionstests bleiben erhalten |
| `src/AccountApp.tsx`, `AccountPanel.tsx`, `AccountLinkPanel.tsx` | Kontosteuerung, Profil-/Anmeldeformular und Rückkehr aus Kontolinks |
| `src/accounts.ts` | Anmeldung und vorhandene Online-Kontoaktivierung |
| `src/style.css`, `src/styles/` | Dokumentierte CSS-Importfolge mit erhaltener Kaskade |
| `public/` einschließlich `sw.js` | Fragen/Assets; ausschließlich Stilllegung bisheriger Offline-Worker |
| `docs/`, `KI-Wissen-Wissensquiz/` | Fachverträge, Quellen, Wissen und datierte Nachweise |

## Prüfen und weiterarbeiten

```powershell
npm test
npm run build
npm run test:browser
git diff --check
```

Browserprüfungen verwenden isolierte Profile, kontrollierte Zeit und abgefangene Kontodienste. Bei Abhängigkeitsänderungen zusätzlich `npm audit`. Für Quellenorganisation: `npm run check:questions`; daraus erzeugte Berichte nur bei einem tatsächlichen Datenprüfauftrag übernehmen.

Aktueller Nachweis und Grenzen: [Anmeldung und Online-Spielstand](docs/Anmeldung-und-Online-Spielstand.md), [frühere Speicher-/Sync-Abnahme](docs/Speicher-und-Sync-Abnahme.md), [Messdaten](docs/Speicher-und-Sync-Messung.json), [Struktur-Abnahme](docs/Strukturverbesserungen-Abnahme.md), [Prüfbericht](docs/Pruefbericht.md), [Qualitätsprozess](KI-Wissen-Wissensquiz/03%20Betrieb/Qualitaetspruefung.md). Projektregeln: [AGENTS.md](AGENTS.md); Einstieg: [Projektstart](KI-Wissen-Wissensquiz/00%20Projektstart.md) und [Wissensindex](KI-Wissen-Wissensquiz/02%20Wissen/00%20Uebersichten/Index.md). Remote, Push, Integration und Veröffentlichung benötigen den jeweils ausdrücklichen Auftrag.

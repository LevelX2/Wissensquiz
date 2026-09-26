# Wissensquiz · Dein Filmkosmos

Spielbare deutsche React-/TypeScript-App für kurze Filmquizrunden mit dauerhaftem Lernfortschritt im Browser. Kein Konto, Backend oder KI-Dienst erforderlich.

## Starten

**Online testen:** [Wissensquiz – Dein Filmkosmos](https://wissensquiz-filmkosmos.levelx2.chatgpt.site). Private Sites-Veröffentlichung; gegebenenfalls mit demselben ChatGPT-Konto anmelden. Der lokale Rechner muss dafür nicht laufen.

Voraussetzung: Node.js 22.12+ (geprüft mit 24.19), npm. In PowerShell:

```powershell
Set-Location C:\Projekte\Wissensquiz
npm ci
npm run build
npm run preview
```

- Rechner: **http://localhost:4173**
- Smartphone im selben Heimnetz: **http://192.168.178.141:4173** (am 26.09.2026 ermittelte Rechneradresse; sie kann sich ändern).
- Rechner und Vorschauprozess müssen laufen. Die Windows-Firewall muss den Netzwerkzugriff erlauben; ihre Einstellungen wurden nicht verändert.
- Entwicklung mit Hot Reload: `npm run dev`, Port 5173. Offlinebetrieb ist für den Produktions-Build vorgesehen.
- **Immer dieselbe Adresse verwenden:** Browserdaten sind an Gerät, Browser, Protokoll, Host und Port gebunden. `localhost`, Heimnetz-IP und eine spätere HTTPS-Adresse haben getrennte Speicher. Zum Wechsel JSON exportieren und wieder importieren.

## Spielen

- **Filmgenres kombinieren:** Sci-Fi, Action, Horror und Fantasy können gemeinsam oder einzeln ausgewählt werden. Neue importierte Genres erscheinen automatisch. Einzelne Filme und Reihen sind eine optionale, aufklappbare Verfeinerung.
- **Schwierigkeitsstufen kombinieren:** zum Beispiel Leicht + Mittel. Eine leere Genre- oder Stufenauswahl startet keine Runde. Die Auswahl bleibt im Rundensnapshot, in Sicherungen und in getrennten Rekordkategorien erhalten; alte Runden bleiben lesbar.
- Jede Frage zeigt ihr Genre und ihre Schwierigkeit, auch nach der Antwort. Unter Einstellungen & Daten → Hinweise an der Frage sind beide Angaben unabhängig abschaltbar; die Auswahl bleibt gespeichert.
- **Ton & Vibration:** kurze Soundeffekte für Start, Antworten, nächste Frage, Zeitablauf und Abschluss. Ton oben jederzeit umschaltbar; optionale Vibration und ein Probesignal unter Einstellungen & Daten. Kein Ton beim bloßen Seitenladen. Einstellungen bleiben lokal erhalten, Signale funktionieren auch offline.
- Genre-Icons zeigen Rakete (Sci-Fi), Blitz (Action), Geist (Horror) und Zauberstab (Fantasy). Das vorhandene Sci-Fi-Wissensabzeichen zeigt gesperrten und erworbenen Zustand; weitere Genre-Abzeichen sind noch nicht umgesetzt.

- Erste Runde standardmäßig fünf, weitere zehn unterschiedliche Wissensziele; kleinere Bestände verkürzen die Runde transparent.
- **Entdecken:** neue/wenig bekannte Ziele, fällige Wiederholungen und sichere Inhalte.
- **Besser werden:** fällige Ziele stärker gewichtet, ohne Zeitdruck.
- **Rekordrunde:** 30 Sekunden pro Frage; 100 Punkte für richtig plus 2 je vollständig verbleibender Sekunde. 25 volle Sekunden = 150 Punkte. Lokale Rekorde getrennt nach Thema, Schwierigkeit, tatsächlicher Rundengröße und Regelversion.
- **Bestenliste:** bei Rekordrunde, im Ergebnis und in der Sammlung erreichbar. Alle abgeschlossenen Rekordspiele mit Platz, Punkten, Treffern, Antwortzeit, Datum und Rückblick. Filter für Genre-Kombination, Stufen und Rundengröße; eigene Ranglisten je vergleichbarer Kategorie. Bisher lokal, keine gemeinsame Konten-Bestenliste.
- Nach jeder Antwort Erklärung, optional Vertiefung, spezifisches Fehlerfeedback, Merksatz und Quellen. „War geraten“ verändert nur das Lernen, keine Punkte. Bewusster Wechsel zur nächsten Frage.
- Alle 720 Vertiefungen auf fehlende Darstellernamen geprüft; bei 627 Fragen passende Ergänzungen mit Besetzungsquellen. Originalstimmen, Puppenspiel und Darstellerwechsel sind berücksichtigt. Rohdaten und Spielstände bleiben erhalten; [Umfang und Erklärungstiefe](docs/Erklaerungstiefe.md).
- Sammlung mit exklusiven Statuszahlen, maximal drei Lieblingsthemen, begrenztem Fachabzeichen und Rundenrückblick. Erfahrung: 10 XP je abgeschlossener Runde, Level 1 + ganze 100 XP.
- Meldungen werden nur lokal gespeichert und können exportiert werden.

## Enthaltene Fragen

Die gelieferte **SciFi_Quiz_180_Fragen.csv** ist das Standardpaket: **180 Fragen, 150 Wissensziele, 30 Varianten, 39 Themen**. **180 akzeptiert, 0 ausgeschlossen, 0 doppelte IDs.** Alle Erklärungen und Quellenangaben stammen aus dieser CSV. Die Originaldatei liegt unverändert unter `KI-Wissen-Wissensquiz/01 Rohquellen/`; das ausgelieferte Paket unter `public/fragen.csv` ist bytegleich.

Zusätzlich enthalten: **Action_Quiz_180_Fragen.csv**, ebenfalls unverändert, mit **180 Fragen, 150 Wissenszielen, 30 Varianten und 17 Themen**. Keine Ausschlüsse oder ID-Konflikte. Zusammen **360 Fragen, 300 Wissensziele und 56 Themen**. Das Action-Paket wird bei vorhandenen Sci-Fi-Spielständen beim nächsten App-Start ergänzt; Runden und Lernstände bleiben erhalten. [Action-Importbericht](docs/importbericht-action.json).

Neu enthalten: **Horror_Quiz_180_Fragen.csv**, unverändert mit **180 Fragen, 150 Wissenszielen, 30 Varianten und 20 Themen**. Keine Ausschlüsse, Warnungen oder ID-Konflikte mit den bisherigen Paketen. Insgesamt **540 Fragen, 450 Wissensziele und 76 Themen**. Das Horror-Paket ergänzt bestehende Sci-Fi-/Action-Spielstände beim App-Start transaktional und gehört zum Offline-Paket. [Horror-Importbericht](docs/importbericht-horror.json). Seit 26.09.2026 als private Sites-Version 3 live. Für ein wartendes App-Update alle bisherigen Quiz-Fenster schließen und die Adresse neu öffnen.

Zusätzlich enthalten: **Fantasy_Quiz_180_Fragen.csv**, unverändert mit **180 Fragen, 150 Wissenszielen, 30 Varianten und 12 Themen**, darunter Der Herr der Ringe, Harry Potter und Die Chroniken von Narnia. Keine Ausschlüsse, Warnungen oder ID-Konflikte. Der aktuelle Gesamtbestand umfasst **720 Fragen, 600 Wissensziele und 88 Themen**. Fantasy ist als eigenes Genre mit anderen Genres kombinierbar und offline verfügbar. Bestehende Fragen, Runden, Lernstände und Einstellungen bleiben erhalten. [Fantasy-Importbericht](docs/importbericht-fantasy.json).

`verification_status=redaktionell_geprueft` ist eine Angabe der gelieferten Datei. Eine unabhängige Prüfung aller Filmaussagen oder verlinkten Seiten wurde nicht durchgeführt. Darstellerergänzungen werden getrennt von den Rohfragen gepflegt; Fehlererklärungen bleiben unverändert.

Die separat herunterladbare `public/demo-fragen.csv` enthält zwölf selbst verfasste und gekennzeichnete Demo-Fragen als Formatbeispiel. **Diese sind im Standardbestand nicht aktiviert.** Bei manuellem Import bleibt ihre Demo-Kennzeichnung erhalten.

Details: [Importformat und Feldzuordnung](docs/Importformat.md), [maschineller Importbericht](docs/importbericht.json).

## Weitere CSV-Dateien

Unter **Einstellungen & Daten → Fragen hinzufügen** Datei auswählen, Vorschau prüfen und gültige Fragen übernehmen. UTF-8/BOM, Komma, Semikolon, Tabulator und Pipe werden erkannt; gequotete Trennzeichen, doppelte Anführungszeichen und mehrzeilige Felder unterstützt.

Pflichtspalten: `question_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation_short`. `correct_answer` akzeptiert A–D, `answer_a`–`answer_d` oder den exakten eindeutigen Antworttext. `knowledge_id` und `variant_of` werden ausgewertet; ohne belastbare Zuordnung entstehen stabile Ziele `question:<question_id>`.

Vorhandene Fragen-IDs werden mit Bericht übersprungen, niemals automatisch überschrieben. Eine Inhaltserneuerung mit derselben ID ist in Version 1 bewusst kein Importmodus. Sicherheitskopie und gezielte Migration sind dafür erforderlich.

## Lernen, Speicherung und Offline

Sichere fällige Antworten erhöhen die Lernstufe höchstens einmal pro lokalem Kalendertag. Abstände: **1, 3, 7, 21 Tage**. „Gefestigt“ erfordert mindestens vier sichere Lerntage und eine sichere Wiederholung nach mindestens sieben Tagen seit der letzten Antwort auf dieses Wissensziel, einschließlich früher Zwischenantworten. Falsch: Wiederholung nach zehn Minuten. Geraten: sechs Stunden. Beides setzt die aktuelle Stufe auf „entdeckt“ zurück; erworbene Abzeichen bleiben erhalten. Details: [Lern- und Speichervertrag](docs/Lernregeln.md).

IndexedDB speichert Fragen, Inhaltsversionen, Rundensnapshots, eindeutige Antwort-/Lernereignisse, Fortschritt, Termine, XP, Rekorde, Abzeichen, Favoriten, Einstellungen und Meldungen atomar. Schreibfehler werden angezeigt. **Regelmäßig JSON exportieren**, besonders vor Browserbereinigung oder einem Adresswechsel. Der validierte Wiederimport ersetzt erst nach ausdrücklicher Bestätigung den Stand; Zurücksetzen erfordert `LÖSCHEN`.

Der Produktions-Build enthält Manifest, eigene Icons und Service Worker. Nach bestätigtem Paketdownload sind Oberfläche, Fragen und Erklärungen offline verfügbar. Updates warten auf das Schließen aller alten App-Fenster. Aktive Rekordrunden werden nach Neuladen/Browserneustart als abgebrochen behandelt; unbeantwortete Fragen erhalten keine neue Zeit. Entspannte Runden sind fortsetzbar.

**PWA/Offline auf Smartphones benötigt HTTPS.** Die Sites-Adresse bietet HTTPS. Die HTTP-Heimnetzvorschau unterstützt Spielen und Fortschritt, aber keine Service-Worker-Installation. Auf `localhost` ist Offlinebetrieb getestet; die Installation auf einem physischen Smartphone und unter der privaten Sites-Adresse ist noch zu prüfen. Externe Quellenlinks benötigen weiterhin Netz.

**Sites:** Die App ist über `.openai/hosting.json` mit der privaten Site „Wissensquiz – Dein Filmkosmos“ verknüpft. Die erste Veröffentlichung wurde am 26.09.2026 von Sites als erfolgreich bestätigt. Veröffentlicht wird der statische Produktions-Build aus `dist/`; keine Nutzerspielstände werden übertragen. Hosting allein ergänzt keine geräteübergreifende Synchronisierung; vorhandene lokale Spielstände werden beim Adresswechsel per JSON übertragen. [Veröffentlichungsablauf](docs/Sites-Betrieb.md).

## Projektaufbau

| Ort | Aufgabe |
| --- | --- |
| `src/model.ts` | Datenmodell und Fragenvalidierung |
| `src/importer.ts` | CSV, ID-/Variantenauflösung, Importbericht |
| `src/engine.ts` | Auswahl, Lernregeln, Punkte und idempotente Rundenaktionen |
| `src/storage.ts` | IndexedDB-Transaktionen, Sicherungsvalidierung, Export/Import |
| `src/App.tsx`, `src/style.css` | Oberfläche und responsive Gestaltung |
| `src/offline.ts`, `scripts/build-sw.mjs` | Paketstatus und sicher wartende App-Updates |
| `public/fragen.csv`, `public/action-fragen.csv`, `src/packages.ts` | Gelieferte Standardpakete und transaktionale Ergänzung |
| `public/horror-fragen.csv` | Unverändertes Horror-Paket, ebenfalls automatisch ergänzt und offline verfügbar |
| `public/fantasy-fragen.csv` | Unverändertes Fantasy-Paket, automatisch ergänzt und offline verfügbar |
| `tests/` | Logik-, Persistenz- und Browserprüfungen |

## Prüfen

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm audit
```

Tests verwenden isolierte Browserprofile und kontrollierte Testzeiten. Produktive Nutzerstände werden nicht verwendet. Tatsächliche Ergebnisse und Grenzen: [Prüfbericht](docs/Pruefbericht.md).

Git: lokal ohne Remote, Integrationsbranch `main`, Umsetzung auf `codex/spielbare-testversion`. [Projektwissen](KI-Wissen-Wissensquiz/02%20Wissen/00%20Uebersichten/Index.md).

Konten, geräteübergreifende Speicherung und gemeinsame Bestenliste sind als [Entwurf](docs/Konten-und-Spielstaende.md) dokumentiert, aber noch nicht implementiert. Bisherige Spielstände werden weiterhin ausschließlich lokal gespeichert.

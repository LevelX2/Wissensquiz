# Prüfnachweis – 26. September 2026

## Umgebung und Ergebnis

Windows, Node 24.19.0, npm 11.17.0, React 19, TypeScript 5.9, Vite 7.3.6, Vitest 4.1.11, Playwright Chromium 153. Produktions-Build erfolgreich, 31 Logik-/Persistenztests und 9 Browserprüfungen erfolgreich. `npm audit`: 0 bekannte Schwachstellen. Tests in separaten Browserprofilen; kontrollierte Testdaten wurden nicht in einen Nutzerbrowser übernommen.

## Tatsächlich ausgeführt

| Prüfung | Ergebnis |
| --- | --- |
| Vollständiger Import der gelieferten CSV | 180 akzeptiert, 0 verworfen, 0 Duplikate; 150 Ziele, 30 Varianten, 39 Themen, 50 leichte Abzeichenziele. |
| BOM/UTF-8, CRLF, Komma/Semikolon/Tabulator, Quotes und mehrzeilige Felder | Gezielte Parserprüfungen bestanden. |
| Fehlende Spalten, ungültige Lösung, kaputtes Quoting, doppelte Header und Variantenfehler | Nachvollziehbar ausgeschlossen. |
| Antwortmischung und Feedback | Für jede der 180 Fragen stabile Zuordnung geprüft. |
| Punkte und Zeit | Grenzen bei 0, 5.000, 5.001, 29.999, 30.000 und 31.000 ms sowie falsche Antworten geprüft. |
| Lernfortschritt | Kontrollierte Tage 0/1/4/11/32, frühe und gleichentägige Wiederholung, falsch und geraten geprüft. |
| Auswahl | 5/3/2-Mischung, einzigartige Wissensziele, kleine Themen, begrenzte Fälligkeiten geprüft. |
| Abzeichen | Keine Vorabvergabe vor Abschluss; geratener letzter Treffer reicht nicht, Erwerb bleibt nach Bestandserweiterung erhalten. |
| Persistenz | Parallele IDB-Transaktionen, Rollback, doppelte Antworten/Abschlüsse, JSON-Struktur, Querverweise und manipulierte Ableitungen geprüft. |
| Vollständige Browserrunde | Fünf Fragen, richtig/falsch, geraten, lokale Meldung, Ergebnis, Favorit, Sammlung und Rundenrückblick. |
| Datenverwaltung im Browser | JSON-Download und Wiederimport, beschädigte Sicherung, CSV-Duplikate und Zusatzimport, Reset nur nach Texteingabe. |
| Mobile Ansicht | 390 × 844 und 320 × 740 px, keine horizontale Scrollpflicht im geprüften Einstieg/Fragen-/Feedbackablauf; Antwortflächen mindestens 44 px hoch. |
| Rekordmodus im Browser | Zeitablauf, keine Uhr in Erklärung, verspätete Wertung verhindert, Hintergrundzeit, Doppelklick und Abbruch nach Reload. |
| Offline | Nach bestätigtem Precache Netzwerk im Browser abgeschaltet, vollständiges Neuladen und Fortsetzen/Beantworten weiterer Fragen bestanden. |
| App-Update | Neue Worker-Version wartet, während laufende Frage erhalten und beantwortbar bleibt. |
| Browserneustart | Browser vollständig geschlossen und mit demselben isolierten Profil neu gestartet; Antwort/Erklärung und Runde wiederhergestellt. |
| Tastatur | Start und Antwort mit Enter, sichtbarer Fokus, Fokuswechsel auf Erklärung geprüft. |
| Automatische Barrierearmut | axe-core WCAG 2 A/AA und 2.1 AA auf Start- und Feedbackansicht: keine gefundenen Verstöße. |
| Sichtkontrolle | Desktop-Startseite, mobile Frage und Feedback anhand tatsächlich gerenderter Screenshots angesehen. |
| Lokale Netzwerkadresse | `http://192.168.178.141:4173` antwortet vom Rechner mit HTTP 200. Kein Test von einem physischen Telefon. |

Rohquelle und ausgeliefertes Fragenpaket haben denselben SHA-256-Wert: `E928647423F3781BDBCC6E17B2AB0C35FAD38D76483E3470DDC312F7D8BDF968`.

Die anfänglich gefundenen moderaten Vitest-Entwicklungsabhängigkeitslücken wurden durch Aktualisierung auf 4.1.11 beseitigt. Der Offline-Test deckte einen tatsächlichen Fehler durch `Vary: Origin` im Vorschau-Server auf; nach gezielter Korrektur wurde der vollständige Browserlauf erneut erfolgreich ausgeführt.

## Grenzen

- Kein Test auf einem physischen Smartphone, Safari, Firefox oder installierter iOS-/Android-PWA. Chromium-Mobilgrößen sind keine vollständige Geräteprüfung.
- PWA/Offline im Heimnetz über HTTP ist browserbedingt nicht verfügbar. HTTPS-Hosting wurde nicht eingerichtet. Auf localhost wurde Offlinebetrieb tatsächlich geprüft.
- Die automatisierte Barrierearmutsprüfung ersetzt keine vollständige Prüfung mit Screenreader oder Menschen mit unterschiedlichen Bedürfnissen.
- Keine unabhängige fachliche Überprüfung sämtlicher Filmaussagen und Quellenlinks. Gelieferte Quellenkennzeichnung bleibt nachvollziehbar erhalten.
- Zeitversetztes Lernen mit kontrollierter Testzeit, nicht über elf reale Tage geprüft. Spielspaß und Motivation brauchen Nutzerfeedback.
- Keine serverseitige Synchronisierung oder manipulationssicheren Rekorde. Für Spielrunden nur ein App-Fenster verwenden; Start eines weiteren Fensters beendet einen aktiven Rekord als Reload-Schutz.
- Große Datenmengen sind nicht Last-getestet. Die einfache Zustandsablage und vollständige Neuberechnung sind auf die Testversion ausgerichtet.

## Wiederholen

`npm test`, `npm run build`, `npm run test:browser`, `npm audit`. Browserartefakte und Fehlerspuren liegen im ignorierten `test-results/`. Die lokale Vorschau verwendet Port 4173. Vor Wiederholung laufende Nutzerrunden beenden, da ein neuer Build erst nach Schließen alter App-Fenster aktiv werden soll.

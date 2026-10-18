# Umsetzung des IT Fachreviews

Auftrag vom 18.10.2026: die [16 Vorschläge](IT-Fachreview-2026-10-18.md) geordnet umsetzen und einen projektübergreifenden allgemeinen Fachreview-Skill erstellen. [Unveränderter Nutzertext und bestätigte Arbeitsumgebung](<../KI-Wissen-Wissensquiz/01 Rohquellen/2026-10-18 Nutzerauftrag Fachreview umsetzen und Skill erstellen.json>). Ein eigener Worktree mit anschließender lokaler Main-Integration ist ausdrücklich freigegeben. Veröffentlichung und produktive Datenbankaktivierung gehören nicht zu dieser Freigabe.

## Arbeitsblöcke

| Block | Reviewpunkte | Ziel und Status |
| --- | --- | --- |
| 1 Bedienung und Hinweise | 1, 4, 10, 11 | Umgesetzt; TypeScript/Build und zwölf unterschiedliche Browserfälle erfolgreich |
| 2 Bilder und Lesbarkeit | 2, 3, 12 | Pflichtbildbereitschaft, getestete Bildstörungen, kleine Bildvarianten und mobile Typografie; offen |
| 3 Robuste Abläufe | 5, 8, 9, 16 | Laufzeitverträge, gemeinsame Steuerung, gezielte Konkurrenzprüfung und statischer Check; offen |
| 4 Start und Wachstum | 6, 7, 15 | Begrenzte technische Belege, kleinere Startabhängigkeiten und aktueller synthetischer Last-/Wachstumsnachweis; offen |
| 5 Spieler und Geräte | 13, 14 | Ausführbare Spieler-/Geräteabnahme; echte Beobachtung nach Verfügbarkeit, Ergebnisse nicht simulieren; offen |

Jeder abgeschlossene Block erhält gezielte Prüfungen und einen eigenen lokalen Commit. Browser verwenden synthetische Konten und kontrollierte Zeit. Aufeinanderfolgende Prüfläufe verwenden denselben auftragsbezogenen Ausgabebereich. Bestehende erfolgreiche Nachweise werden bei unverändertem Stand wiederverwendet.

## Allgemeiner Skill

`projekt-fachreview` wurde im führenden persönlichen Skill-Bestand erstellt, mit dem Skill-Creator validiert und lokal installiert. Drei Quelldateien sind in `mein-wissen` mit `9397da1` committed; Quelle und Installation sind bytegleich. Der Skill betrachtet acht an den Projekttyp angepasste Perspektiven, trennt Befund und Hypothese, prüft Gegenbelege und liefert priorisierte Vorschläge mit Aufwand und Abnahme. Ergebnisse werden auch direkt im Chat ausgegeben. Vorhandene fremde Wissensänderungen bleiben erhalten.

## Abnahme von Block 1

Neue Fragen werden nach Freigabe an ihrer Überschrift fokussiert; die Auflösung enthält nur eine kurze separate Statusansage. Lern-, Zeit- und Probespiel verbinden erfolgreichen Weiterwechsel mit dem vorhandenen Signal. Hilfe und README sind aktuell, die äußere Fehlergrenze schützt den Apprahmen und verspricht keine lokale Kontosicherung.

Zwölf unterschiedliche Browserfälle erfolgreich: Audio/Weiter in Chromium, Firefox und mobilem WebKit, mobile Antwort-/Fokusführung bei 320/390 Pixeln in Chromium/WebKit, äußere und innere Fehlerwiederherstellung sowie Hilfe in Chromium und vollständige Proberunde in Chromium/WebKit. Beim Firefox-Audiofall waren zwei Abbrüche am bisherigen Gesamtbudget und anschließend eine unbestätigte Test-RPC sichtbar. Die feste Kalenderzeit wird nun auch im isolierten SQL-Testserver gesetzt, statt vor jeder RPC erneut über den Browser abgefragt zu werden; der umfangreiche Firefox-Ablauf besitzt ein größeres funktionales Testbudget. Die erfolgreiche Nachprüfung dauerte etwa 90 Sekunden. Diese Testumgebung liefert keinen Nachweis realer Audiolautstärke oder Produktionsgeschwindigkeit.

## Ausgangsmessung

Ein Produktionsbundle des unveränderten Anwendungsstands wurde als Vergleich für die Startoptimierung erzeugt: Haupt-JavaScript 1.091,56 kB unkomprimiert, 292,95 kB gzip laut Vite. Das ist eine Bundlegröße, keine gemessene Ladezeit oder gesamte Startübertragung. Der Vergleichsbuild wird nach Abschluss des Vergleichs entfernt.

# Umsetzung des IT Fachreviews

Auftrag vom 18.10.2026: die [16 Vorschläge](IT-Fachreview-2026-10-18.md) geordnet umsetzen und einen projektübergreifenden allgemeinen Fachreview-Skill erstellen. [Unveränderter Nutzertext und bestätigte Arbeitsumgebung](<../KI-Wissen-Wissensquiz/01 Rohquellen/2026-10-18 Nutzerauftrag Fachreview umsetzen und Skill erstellen.json>). Ein eigener Worktree mit anschließender lokaler Main-Integration ist ausdrücklich freigegeben. Veröffentlichung und produktive Datenbankaktivierung gehören nicht zu dieser Freigabe.

## Arbeitsblöcke

| Block | Reviewpunkte | Ziel und Status |
| --- | --- | --- |
| 1 Bedienung und Hinweise | 1, 4, 10, 11 | Umgesetzt; TypeScript/Build und zwölf unterschiedliche Browserfälle erfolgreich |
| 2 Bilder und Lesbarkeit | 2, 3, 12 | Umgesetzt; Build, 18 Browserfälle und visuelle Prüfung erfolgreich |
| 3 Robuste Abläufe | 5, 8, 9, 16 | Laufzeitverträge, gemeinsame Steuerung, gezielte Konkurrenzprüfung und statischer Check; offen |
| 4 Start und Wachstum | 6, 7, 15 | Begrenzte technische Belege, kleinere Startabhängigkeiten und aktueller synthetischer Last-/Wachstumsnachweis; offen |
| 5 Spieler und Geräte | 13, 14 | Ausführbare Spieler-/Geräteabnahme; echte Beobachtung nach Verfügbarkeit, Ergebnisse nicht simulieren; offen |

Jeder abgeschlossene Block erhält gezielte Prüfungen und einen eigenen lokalen Commit. Browser verwenden synthetische Konten und kontrollierte Zeit. Aufeinanderfolgende Prüfläufe verwenden denselben auftragsbezogenen Ausgabebereich. Bestehende erfolgreiche Nachweise werden bei unverändertem Stand wiederverwendet.

## Allgemeiner Skill

`projekt-fachreview` wurde im führenden persönlichen Skill-Bestand erstellt, mit dem Skill-Creator validiert und lokal installiert. Drei Quelldateien sind in `mein-wissen` mit `9397da1` committed; Quelle und Installation sind bytegleich. Der Skill betrachtet acht an den Projekttyp angepasste Perspektiven, trennt Befund und Hypothese, prüft Gegenbelege und liefert priorisierte Vorschläge mit Aufwand und Abnahme. Ergebnisse werden auch direkt im Chat ausgegeben. Vorhandene fremde Wissensänderungen bleiben erhalten.

## Abnahme von Block 1

Neue Fragen werden nach Freigabe an ihrer Überschrift fokussiert; die Auflösung enthält nur eine kurze separate Statusansage. Lern-, Zeit- und Probespiel verbinden erfolgreichen Weiterwechsel mit dem vorhandenen Signal. Hilfe und README sind aktuell, die äußere Fehlergrenze schützt den Apprahmen und verspricht keine lokale Kontosicherung.

Zwölf unterschiedliche Browserfälle erfolgreich: Audio/Weiter in Chromium, Firefox und mobilem WebKit, mobile Antwort-/Fokusführung bei 320/390 Pixeln in Chromium/WebKit, äußere und innere Fehlerwiederherstellung sowie Hilfe in Chromium und vollständige Proberunde in Chromium/WebKit. Beim Firefox-Audiofall waren zwei Abbrüche am bisherigen Gesamtbudget und anschließend eine unbestätigte Test-RPC sichtbar. Die feste Kalenderzeit wird nun auch im isolierten SQL-Testserver gesetzt, statt vor jeder RPC erneut über den Browser abgefragt zu werden; der umfangreiche Firefox-Ablauf besitzt ein größeres funktionales Testbudget. Die erfolgreiche Nachprüfung dauerte etwa 90 Sekunden. Diese Testumgebung liefert keinen Nachweis realer Audiolautstärke oder Produktionsgeschwindigkeit.

## Abnahme von Block 2

Pflichtfotos geben Antworten erst nach erfolgreichem Laden und Dekodieren frei. Fehler bieten einen erneuten Bildabruf; das vom Server ausgegebene Bild bleibt maßgeblich. Im Zeitspiel läuft die Serverzeit währenddessen weiter und wird beim erneuten Laden nicht gestartet oder verlängert. Die bestehende Beenden-Aktion bleibt erreichbar. Optionale Lösungsbilder blockieren das Spiel nicht.

59 WebP-Varianten für 16 Genres, drei Modi und die Lobby umfassen zusammen 1.310.794 Bytes; die 20 unveränderten Originale 29.321.879 Bytes. `scripts/prepare-ui-artwork.mjs` erzeugt die gepflegten Laufzeitassets mit ImageMagick. Größenwahl über `srcset`/`sizes`, keine eingebetteten Bildbytes im JavaScript. Dies ist ein Dateigrößenvergleich, kein Nachweis einer gleich großen Einsparung beim Start. Mobile bedeutungstragende Themen-/Modustexte verwenden mindestens 12 Pixel bei normaler Basisschrift, wichtige Aktionen 13 Pixel; Lernstufen umbrechen abhängig vom Platz.

18 unterschiedliche Browserfälle in Chromium/mobilem WebKit erfolgreich: je vier Pflichtbildfälle (verzögert/404, Lernen/Zeit), bestehender Foto-/Namens-/Nachweisablauf, Themen bei 320/390 Pixeln und 200 Prozent Basisschrift, Moduswahl über mehrere Breiten sowie Genre-, Preis- und Lernstufenabläufe. Normale und vergrößerte Themenansicht visuell gesichtet, kein horizontaler Überlauf. Der erste synthetische Bildkatalog enthielt keine Filmkategorie und wurde durch den vorhandenen Inhaltsvertrag korrekt abgewiesen; Testaufbau um eine außerhalb der Runde liegende Filmfrage ergänzt, vollständige Nachprüfung erfolgreich. Keine Katalog-/Lernregeländerung.

## Ausgangsmessung

Ein Produktionsbundle des unveränderten Anwendungsstands wurde als Vergleich für die Startoptimierung erzeugt: Haupt-JavaScript 1.091,56 kB unkomprimiert, 292,95 kB gzip laut Vite. Das ist eine Bundlegröße, keine gemessene Ladezeit oder gesamte Startübertragung. Der Vergleichsbuild wird nach Abschluss des Vergleichs entfernt.

# Umsetzung des IT Fachreviews

Auftrag vom 18.10.2026: die [16 Vorschläge](IT-Fachreview-2026-10-18.md) geordnet umsetzen und einen projektübergreifenden allgemeinen Fachreview-Skill erstellen. [Unveränderter Nutzertext und bestätigte Arbeitsumgebung](<../KI-Wissen-Wissensquiz/01 Rohquellen/2026-10-18 Nutzerauftrag Fachreview umsetzen und Skill erstellen.json>). Ein eigener Worktree mit anschließender lokaler Main-Integration ist ausdrücklich freigegeben. Veröffentlichung und produktive Datenbankaktivierung gehören nicht zu dieser Freigabe.

## Arbeitsblöcke

| Block | Reviewpunkte | Ziel und Status |
| --- | --- | --- |
| 1 Bedienung und Hinweise | 1, 4, 10, 11 | Umgesetzt; TypeScript/Build und zwölf unterschiedliche Browserfälle erfolgreich |
| 2 Bilder und Lesbarkeit | 2, 3, 12 | Umgesetzt; Build, 18 Browserfälle und visuelle Prüfung erfolgreich |
| 3 Robuste Abläufe | 5, 8, 9, 16 | Umgesetzt; statischer Check, 17 gezielte Logiktests und 18 Browserfälle erfolgreich |
| 4 Start und Wachstum | 6, 7, 15 | Lokal umgesetzt; 106 gezielte Logiktests, 14 Browserfälle, nativer Last-/Wachstumsnachweis und Rechteprüfung erfolgreich |
| 5 Spieler und Geräte | 13, 14 | Konkreter Abnahmebogen vorbereitet; echte Spieler- und Gerätebeobachtungen noch offen |

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

## Abnahme von Block 3

Alle neun von der Oberfläche verwendeten Übersichtsaktionen besitzen einen Zod-Laufzeitvertrag; der Antworttyp ergibt sich aus der angefragten Aktion. Ungültige Antworten werden vor dem Cachen verworfen, die Oberfläche bietet Wiederholung. Zehn neue Logikfälle prüfen echte SQL-Antworten samt vollständigem Rundenabschluss, gezielt falsche/unvollständige Antworten und Cache-Wiederholung. Der gemeinsame Aktionshook schützt Lern-/Zeitspiel vor doppelter Ausführung und erhält Fehler-/Wiederholungsabsichten; der gemeinsame Ergebnisübergang bewahrt Erfolge, Level und Freischaltungen.

Die Konkurrenzhypothese wurde konkret bestätigt: Ein verzögerter Boot-Abruf ließ vorher eine zwischenzeitliche Speicherung zu. Aktualisierungen werden nun geteilt und sperren Schreibzugriffe für ihre Dauer; Seitenwechsel besitzen eine sofort wirksame Sperre bis zu den Spielknöpfen. Sieben Speicherfälle einschließlich neuer Konkurrenzprüfung bestanden. `npm run check` prüft ungenutzte Namen im Quellcode; belegte Reste entfernt. Keine Ausweitung des Checks auf historische Testvariablen.

18 unterschiedliche Browserfälle in Chromium, Firefox und mobilem WebKit erfolgreich: ungültige Themenantwort mit Wiederholung, Profil-/Lernübersichtsfehler, verlorene Antwort-/Abbruchbestätigungen, verzögertes Pausieren, Serverrunde mit zehn Antworten/Fortsetzen/Neuladen/Reset sowie gemeinsame Feier und Profil. Zwei umfangreiche Firefox-Abläufe überschritten zunächst 60 Sekunden; bei größerem funktionalem Testbudget nachgeprüft und mit etwa 1,3 beziehungsweise 2,1 Minuten erfolgreich. Der neue Pausenfall zeigte zunächst die fehlende Weitergabe der Sperre an Spielknöpfe; korrigiert und in allen drei Browsern erfolgreich. Ein während der Vorbereitung unterbrochener Lauf verwendete noch die alte Testausnahme für Betreiber-Migrationen; seine Fehlversuche sind kein Prüfnachweis. TypeScript/Build, statischer Check und Diff-Prüfung erfolgreich.

## Abnahme von Block 4 und vorbereiteter Block 5

Spiel-/Probe-/Kontopanel und Profilcode werden bedarfsabhängig geladen. Kompakte, automatisch gegen die vollständigen Quellen geprüfte Laufzeitmetadaten; Kategorievorbereitung getrennt. Statischer JavaScript-Einstieg gzip 292.951 → 159.947 Bytes, rund 45,4 Prozent kleiner; notwendige dynamische Spielmodule zusätzlich ausgewiesen. Noch ein großes Highscore-Navigations-PNG durch die vorhandene kleine Variante ersetzt. Inhaltsvorbereitung ergibt weiterhin denselben Katalogfingerabdruck. README nennt die aktuelle Spieleroberfläche ohne veraltete Sicherungs-/Importangebote.

Zeitspielbelege erhalten eine dokumentierte Aufbewahrung, neue Startkennungen verhindern eine erneute alte Startwirkung nach der Bereinigung. Private Größenaufnahme an den vorhandenen Betriebsjob angebunden, 180 Tage Messhistorie, keine neuen öffentlichen Rechte oder Nachrichten. Drei Migrationen lokal vorbereitet; **nicht produktiv aktiviert**. [Ausführlicher Vertrag, Wiederholung und Messwerte](Fachreview-Start-und-Wachstum-2026-10-18.md).

106 gezielte Logiktests in zehn Dateien erfolgreich; 14 unterschiedliche Browserfälle in Chromium/mobilem WebKit einschließlich erfolgreicher Nachprüfung: Spielimportfehler, äußere/innere Fehlergrenze, sämtliche Nebenansichten, kleine Bilder/mobile Schrift, Profilabrufe, Probe-Einstieg ohne Spielkonto-/Profilcode und vollständige Proberunde mit einmaliger Kontoübernahme beziehungsweise E-Mail-Bestätigung in neuem Fenster. Der neue Einstiegstest erwartete zunächst einen Knopf aus dem nächsten Dialog; auf den tatsächlichen Willkommenseinstieg korrigiert, beide Nachprüfungen erfolgreich. Statischer Check mit Metadatenprüfung, aktualisierter Buildbefehl und erneute Serverinhaltsvorbereitung erfolgreich; kein geänderter Inhalt.

Native PostgreSQL-17.11-Prüfung mit 85 synthetischen Konten und aktuellem Bestand: 340 Zehnerrunden/3.400 Antworten, zusätzlich 85.000 ältere Antworten; Laststufen 10/25/50, keine fehlgeschlagenen Lasttransaktionen oder Deadlocks, keine beobachteten Sperrwartefälle in 525 Stichproben. Physisches Tabellen-/Indexwachstum und Antwortgrößen erfasst. Native Größenaufnahme, RLS und verweigerte öffentliche Funktionsrechte geprüft; abschließende Sicherheits-Advisors ohne Warnung. Kein erfolgreicher `plpgsql_check`-Lint behauptet, Erweiterung lokal nicht verfügbar. Prüfserver beendet; Port und Prozessmarke frei. Keine Produktionskapazität zugesichert.

Für Spielspaß, Fortschrittsverständnis und echte Ton-/Haptikwirkung liegt der [konkrete Abnahmebogen](Spieler-und-Geraeteabnahme-Fachreview.md) vor. Er enthält sechs geplante Spielersitzungen, Aufgaben, Beobachtungsfelder und Gerätefälle. Die Beobachtungsfelder sind ausdrücklich offen, keine erfundenen Testergebnisse. Fachliche Änderungen an Motivation oder Balance werden erst aus tatsächlichen Beobachtungen abgeleitet.

## Ausgangsmessung

Ein Produktionsbundle des unveränderten Anwendungsstands wurde als Vergleich für die Startoptimierung erzeugt: Haupt-JavaScript 1.091,56 kB unkomprimiert, 292,95 kB gzip laut Vite. Das ist eine Bundlegröße, keine gemessene Ladezeit oder gesamte Startübertragung. Der Vergleichsbuild wird nach Abschluss des Vergleichs entfernt.

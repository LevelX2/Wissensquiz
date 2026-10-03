# Strukturverbesserungen und Abnahme

Stand: 03.10.2026. Auftrag: Empfehlungen der [Strukturprüfung](Strukturpruefung-2026-10-03.md) sequenziell in einem eigenen Worktree umsetzen, Status liefern und anschließend eine Freigabe anfordern.

## Ziel und Grenzen

Die Umsetzung erhält Frage- und Wissensziel-IDs, Spielregeln, historische Snapshots, lokale Sicherungsschemata und Offlinebetrieb. Kleine Verbesserungen an Sicherung und Fehlerrückmeldung gehören zum Auftrag. Die nur für späteres Wachstum vorgeschlagenen Katalog-Schreibpfade und serverseitigen Statistikprojektionen werden ohne belegten Bedarf nicht eingeführt. Keine SQL-Migration oder Live-Datenänderung.

Worktree: `wissensquiz-strukturverbesserungen/Wissensquiz`, Branch `codex/strukturverbesserungen`. Der geprüfte Gesamtarbeitsstand liegt als separater Ausgangscommit `708bf19` vor. Bereits vorhandene Änderungen im Hauptordner bleiben erhalten. Genau ein Paket wird aktiv bearbeitet. Jeder Paketabschluss enthält passende Prüfungen, Diffprüfung und einen lokalen Commit. Integration, Veröffentlichung, Push und Worktree-Cleanup folgen erst auf einen entsprechenden Nutzerauftrag; insbesondere ersetzt dieser Prozess die abschließend gewünschte Freigabe nicht.

## Paketfolge

| Paket | Ziel | Prüfung und Abschlusskriterium | Status |
| --- | --- | --- | --- |
| P1 | Begrenzte Kontoanfragen und sichere Nachsicherung bei unklarem Ausgang | Konto-/Sync-Tests, hängende Anfrage und verlorene Antwort; bestehende Revisionen erhalten | Erledigt |
| P2 | Gemeinsame Spielansichten und große Seiten aus der App lösen | Build, kein App-/Duell-Importkreis, betroffene Spiel-/Navigationstests | Erledigt |
| P3 | Auswertungen nach sichtbarer Seite und Katalogstand berechnen | Auswahl-/Lernpfadtests, relevante Themen-/Auswahlbrowserfälle, Fälligkeit bei Rückkehr | Erledigt |
| P4 | Styles in geordnete Zuständigkeitsbereiche aufteilen | Gleichbleibende CSS-Reihenfolge, Build, mobile Ansichten und Barrierearmut | Erledigt |
| P5 | Selten benötigte Ansichten getrennt laden | Buildgrößen, Ladefehlerbehandlung, vorbereiteter Offlinezugriff auf die Ansichten | Erledigt |
| P6 | Gemeinsame Sicherungsschemas und getrennte Validierung | Typprüfung, Sicherungs-/Katalog-/Cloudtests, Altstände und SQL-Projektionen erhalten | Erledigt |
| P7 | Rückfallkopien exportieren, Kontodienst erneut laden, letzte Onlinebestätigung anzeigen | Konto-/Speichertests, isolierte Browserprüfung, keine stillen Übernahmen oder Löschungen | Erledigt |
| P8 | Kontoansichten abschließend trennen, aktuelle Statusseiten verdichten und Freigabe vorbereiten | Quellen-/Linkprüfung, betroffene Schlusschecks, saubere Paketcommits und Abnahmebericht | Erledigt |

## Prüfregeln

Pro Paket nur direkt betroffene Tests und Checks. Für Änderungen an Oberfläche, Persistenz und Offlineverhalten gelten die Browserchecks des Projekts. Ein Build ist bei betroffenen Modul- oder Ladegrenzen erforderlich. Neue Tests decken neue Fehler- und Speicherverträge ab; reine Datei-Auslagerungen verwenden vorhandene Regressionen. Testergebnisse und Grenzen werden am Paketabschluss ergänzt. Ungeklärte fachliche Änderungen blockieren das betreffende Paket und werden nicht durch einen technischen Ersatz entschieden.

## Fortschritt

Die Ausgangsbasis wurde isoliert übernommen; Abhängigkeiten aus dem vorhandenen Lockfile installiert. Der bisherige Nachweis umfasst 214 Tests, Build und 30 gezielte Browserfälle. Die neuen Paketänderungen werden jeweils gesondert geprüft.

P1: Allgemeine Anfragehilfe mit Abbruch und Wartegrenze, zehn Sekunden für Kontoabrufe und 30 Sekunden für Uploads. Unbestätigte Uploads werden vor neuen Änderungen abgeglichen. 26 direkte Konto-/Sync-/Duell-/Gastaktivitätstests, Produktions-Build und vier gezielte Kontobrowserfälle erfolgreich. Neue Fehlerfälle prüfen hängenden Erstabruf, Upload mit und ohne Servercommit, verlorene Antwort mit neueren lokalen Änderungen und zusätzliche fremde Revision. Keine Migration oder Änderung am Sicherungsschema. Der bekannte Hinweis zur großen JavaScript-Datei bleibt für P5 offen.

P2: Spiel-, Ergebnis-, Erklärungs-, Optionen-, Start-, Themen- und Sammlungsansichten liegen in eigenen Modulen. `App.tsx` sinkt von 2.806 auf 674 Zeilen; der Laufzeit-Importkreis mit der Duellansicht ist aufgelöst. Die ausgelagerten gemeinsamen Funktionskörper wurden gegen den vorherigen Commit verglichen und sind unverändert. Build und elf Browserfälle einschließlich Chromium-/WebKit-Duellen, Sammlung, Navigation und Themen erfolgreich. Eine bereits im Ausgangsstand unpassende Themen-Testannahme wurde korrigiert: Horror umfasst dort Filmfragen, nicht zusätzliche Preisträgerfragen. Keine Änderung dieser Auswahlregel.

P3: Startvorschau, Sammlungsstatistik und Themenkarten werden nur auf ihrer jeweiligen Seite ausgewertet. Seitengebundene Katalogindizes erhalten Quellen-/Kategoriegrenzen und Sonderfälle importierter Themennamen; ein neuer Katalogstand erzeugt einen neuen Index. Lernfälligkeiten bleiben zeitabhängig: die sichtbare Startseite aktualisiert bei Fokus/Rückkehr und spätestens nach einer Minute. Die eigentliche Rundenauswahl verwendet weiterhin die aktuelle Startzeit. 53 direkte Tests, Build und sechs Browserfälle erfolgreich. Eine weitere alte Testannahme erwartet nun die bereits vorher gültige kombinierte Kennung `Filmfragen + Classics`. Keine Änderung am Auswahlalgorithmus. Die Indizes werden nach einer Speicheränderung neu aufgebaut, weil der bestehende Speicherpfad einen neuen Katalog liefert; dessen weitergehende Umgestaltung bleibt zurückgestellt.

P4: 15 Stylebereiche mit dokumentierter Importreihenfolge. Die zusammengefügten Quelldateien sind bytegleich zum bisherigen Stylesheet; der Produktions-Build erzeugt denselben CSS-Hash und dieselbe Größe. Sieben Browserfälle für mobile Runden in Chromium/WebKit, Navigation, Themen und Tastatur/Barrierearmut erfolgreich. Keine gestalterische Änderung.

P5: Hilfe, Optionen, Duelle, Ranglisten, Themen und Sammlung werden getrennt geladen. Ein Ladezustand und eine Fehlergrenze mit erneutem App-Laden halten Fehler verständlich; die Navigation bleibt erreichbar. Das vorhandene Offline-Buildskript nimmt alle neuen Dateien auf. Fünf Browserfälle erfolgreich: zuvor unbesuchte Nebenansichten offline, absichtlicher Dateiladefehler mit erfolgreicher Wiederherstellung, Navigation, Update während einer Runde und Browserneustart. Zwischenstand: Start-JavaScript 1.756,23 kB / gzip 403,55 kB statt 1.820,58 / 422,65 unmittelbar vor P5; 53 Offline-Dateien statt 46. Statische Zuordnungsdaten bleiben Teil der Startdatei, weshalb der Größenhinweis weiter besteht.

P6: Gemeinsame Laufzeitschemas liefern die öffentlichen Typen; fachliche Sicherungsvalidierung und Browserpersistenz sind getrennt. Die bisherigen Validatorimporte bleiben kompatibel. Der Vergleich der Schemaausdrücke bestätigt unveränderte Grenzen und Standardwerte; der Validierungskörper ist bis auf den entfallenen unsicheren Type-Cast identisch. Typprüfung, 77 direkte Sicherungs-/Cloud-/Katalog-/Datenbanktests, Build und zwei Import-/Wiederherstellungsbrowserfälle erfolgreich. Keine Formatänderung und keine SQL-Migration.

P7: Konto-Rückfallkopien im Profil mit Datum, Nutzdatenmenge und einzelnem JSON-Export; Altstände ohne Datum bleiben lesbar. Kein automatisches Löschen oder Ersetzen durch den Export. Fehlgeschlagene Kontokonfiguration kann erneut geladen werden; eine deaktivierte Konfiguration bleibt unterscheidbar. Der lokale Sync-Beleg erhält optional den tatsächlichen Bestätigungszeitpunkt; lokale Änderungen und fehlgeschlagene Uploads verändern ihn nicht. 18 direkte Tests und sechs gezielte Kontobrowserfälle erfolgreich, einschließlich alter Kopien, Konto-Trennung, Gastübernahme mit geprüftem Export, Dienstwiederholung, hängendem Erstabruf und Zwei-Geräte-Nachsicherung. Der neue Profilfall besteht auch bei 320 Pixeln ohne Überlauf und ohne Axe-Befund. Keine SQL-Migration oder Änderung am exportierten Spielstandschema.

P8: README, Projektstart und Qualitätsseite auf aktuelle Snapshots verdichtet; die vollständigen vorherigen Inhalte bleiben in datierten Historien am jeweiligen Ort erhalten. Hilfe-Styles von der Freischaltfeier getrennt; die 16 Styledateien erhalten gemeinsam die vorherigen Regeln und den Produktions-CSS-Hash. Konto- und Linkformulare aus der Kontosteuerung ausgelagert: `AccountApp.tsx` 255 statt 667 Zeilen; Funktionskörper unverändert verglichen. Ungenutzte Importe bereinigt, zusätzliche TypeScript-Prüfung des Anwendungscodes auf ungenutzte Namen erfolgreich.

Schlussprüfung: 221 Logik-/Persistenz-/Datenbanktests in 36 Dateien und Produktions-Build erfolgreich. Der vollständige Browserlauf umfasst 125 konfigurierte Fälle: 120 bestanden, vier scheiterten zunächst an überholten Erwartungen des Ausgangsstands, ein bekannter Desktop-WebKit-Fall wurde ausgelassen. Die Erwartungen zu Freispieltext, Auswahlhinweis und vorhandenem Quellenfilter, 16 Illustrationen sowie Rekordkarten wurden angepasst; keine entsprechende Funktion geändert. Die anschließende Prüfung von neun Kontofällen und den vier betroffenen App-Fällen ergab zunächst zwölf erfolgreiche Fälle und eine weitere alte Erwartung an den gespeicherten Quellenfilter. Die abschließenden vier Fälle einschließlich dieser Korrektur und beider Offline-Nebenansichtstests bestanden. Damit sind 124 unterschiedliche Browserfälle erfolgreich abgedeckt; es wurde kein weiterer vollständiger Browserlauf nach den Erwartungskorrekturen durchgeführt.

Originalquellen, Fachregeln, auslieferbare Pakete, Abhängigkeiten und Datenbankmigrationen unverändert gegenüber `708bf19`. Der Ausgangsordner blieb unangetastet; drei währenddessen unabhängig ergänzte Wissensdateien und die neue Infrastruktur-Fachseite dort werden erhalten. Vollständige Nachweise, Größen, Grenzen und die ausstehende Übernahmefreigabe: [Struktur-Abnahme](Strukturverbesserungen-Abnahme.md). Kein Merge, Push, PR oder Deployment; der Worktree bleibt zur Prüfung bestehen.

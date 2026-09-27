# Projektstart Wissensquiz

## Aktueller Stand

- Spielbare deutsche React-/TypeScript-Testversion mit Entdecken, Besser werden und Rekordrunde umgesetzt.
- Filmgenres als Mehrfachauswahl; manuelle Schwierigkeitsstufen nur bei freier Auswahl; einzelne Filme/Reihen nur als optionale Verfeinerung. Alte Runden und Spielstände bleiben erhalten.
- Genre und Schwierigkeit jeder Frage sichtbar, unabhängig abschaltbar und gespeichert. Die bisherigen 720 Vertiefungen auf Darstellernamen geprüft; 627 Ergänzungen zu 125 Filmen, mit Quellen und versionsgenauer Zuordnung. Rohfragen und Spielstände erhalten.
- Persönliche Bestenliste aller abgeschlossenen Rekordspiele, filterbar nach Genre-Kombination, Stufen und Rundengröße; vergleichbare Kategorien getrennt, Spiele mit Rückblick. Persönliche Liste offline; automatische gemeinsame Trainingsrangliste für bestätigte Konten implementiert. Profil mit Spiel-/Antwortstatistik, Trefferquote, Level und XP.
- Kurze abschaltbare Soundeffekte, optionale Vibration, Genre-Icons und deutlicher gesperrter/erworbener Zustand des vorhandenen Sci-Fi-Abzeichens. Weitere Genre-Abzeichen noch offen.
- 1.980 gelieferte Fragen aus elf Paketen, 1.650 Wissensziele und 330 Varianten; 258 Film-/Reihenthemen und zwölf Genres. Classics: 438 Fragen, 360 Ziele, 61 Filme; Arthouse: 306 Fragen, 258 Ziele, 44 Filme. Alle 258 Classics- und 126 Arthouse-Bestandsreferenzen passend aufgelöst; keine fehlenden oder abweichenden IDs. Kategorien teilen 48 Fragen; gemeinsame Auswahl 696 eindeutige Fragen. Sämtliche Datensätze strukturell akzeptiert.
- Fortschritt, Runden, Rekorde und Inhalte in IndexedDB; CSV-Import, JSON-Sicherung, lokale Meldungen und Expertenalbum vorhanden.
- Produktions-Build mit Offline-Cache und PWA-Manifest; Offline-Neuladen auf localhost geprüft.
- Lokales Git ohne Remote; Integrationsbranch `main`.
- Aktuelle Umsetzung auf Arbeitsbranch `codex/spielbare-testversion`; `main` enthält noch den initialen Projektstand.
- Codex-Projektregistrierung noch offen; Ordner in der App hinzufügen.

## Offen

- Nutzerfeedback zu Spielspaß, Erklärungstiefe, verständlichem Fortschritt und freiwilligen Folgerunden sammeln.
- Öffentliche Sites-Adresse ohne ChatGPT-Zugangsschranke verfügbar: https://wissensquiz-filmkosmos.levelx2.chatgpt.site. PWA-Installation auf dem Smartphone noch prüfen.
- Aktuelle Veröffentlichung: Sites-Version 25, App-Commit `be0bab9`, Status `succeeded`, mit kompakterem Spieleinstieg und direktem Wechsel von Themen zu Filmblöcken. 111 Logik-/Datenbanktests, Build und alle 61 Browserfälle geprüft (60 vollständig, neuer Fall nach Testtitelkorrektur gezielt). Nachweis unter docs/Sites-Betrieb.md. Physische PWA-/Offline-/Hör-/Vibrationsprüfung weiterhin offen.
- Fachliche Einzelprüfung der gelieferten Filmaussagen bei Bedarf; „redaktionell_geprueft“ ist eine Quellenangabe.
- Eigene Konten mit Supabase Free/Frankfurt, Brevo SMTP und deutschen Mailvorlagen aktiv. Bestätigungsmail zugestellt und Kontoaktivierung verifiziert. Nach zunächst abgelehntem Smartphone-Login hat der Nutzer erfolgreichen Passwort-Reset und Anmeldung am Handy bestätigt. Reale Zwei-Konten-/Geräte-Spielstandsabnahme noch offen. Passwortfelder mit Auge zum Anzeigen/Verbergen. Automatische Kontosicherung mit Revisionsschutz umgesetzt; Gaststand bleibt auf diesem Gerät und wird nur ausdrücklich übernommen. Gemeinsame Trainingsrangliste mit automatischer Teilnahme bestätigter Konten umgesetzt; serverseitig kontrollierter Wettbewerb und echte Zwei-Spieler-Abnahme offen. Öffentlicher Site-Zugang ohne ChatGPT-Schranke eingerichtet und durch anonymen Live-Abruf nachgewiesen; Details unter docs/Sites-Betrieb.md.

## Einstieg

- [Wissensindex](02%20Wissen/00%20Uebersichten/Index.md)
- [Startanleitung und Architektur](../README.md)
- [Importvertrag](../docs/Importformat.md)
- [Lern- und Speichervertrag](../docs/Lernregeln.md)
- [Qualitätsprüfung](03%20Betrieb/Qualitaetspruefung.md)
- [Log](03%20Betrieb/Log.md)

## Daten und Sicherung

Spielstände liegen im Browser, nicht im Repository. JSON-Exporte über Einstellungen nach wichtigen Sitzungen und vor Browserbereinigung oder Adresswechsel erstellen, mindestens die letzten drei Sicherungen an einem sicheren persönlichen Ablageort erhalten. Validierter Wiederimport ersetzt nach Bestätigung den lokalen Stand. Browserneustart und Wiederherstellung wurden in getrennten Testprofilen geprüft. Angemeldete Konten sichern automatisch in Supabase; Gaststände bleiben lokal. Kontosicherung ersetzt keine unabhängige JSON-Rückfallkopie. `AGENTS.local.md` enthält nur rekonstruierbare lokale Pfadauflösung; lokale Git-Historie ersetzt kein externes Backup.

## Aktuelle Bedienung und Fortschritt

Fünf Hauptpunkte: Spielen, Themen, Sammlung, Highscores und Profil. Optionen ausschließlich im Profil; Hilfe „So funktioniert’s“ im Profil und Seitenfuß. Die Hilfe erklärt insbesondere geübt/gefestigt mit Wiederholungsbeispiel sowie Lernpfad, Punkte und Speicherregeln.

Lernpfad ist Standard. „Alle Schwierigkeitsstufen freigeben“ öffnet auf Wunsch alle Stufen; dieselben sicheren unterschiedlichen Ziele aus abgeschlossenen Runden zählen in beiden Modi. Historischer Fortschritt bleibt erhalten. Neue Einstellung `allDifficulties`, fehlend = false; alte Lernpfadpräferenz bleibt lesbar, wird nicht mehr zur Moduswahl verwendet.

Bestätigte Konten erscheinen automatisch in Highscores/Spielerleistungen; keine Abwahl. Registrierung und Profil erklären Spielername und sichtbare Leistungswerte, private Spielstände/E-Mail bleiben geschützt. SQL-Migration 004 im bestehenden Projekt erfolgreich ausgeführt und Rechte geprüft. 79 Logik-/Datenbanktests, Build und 37 unterschiedliche Browserprüfungen erfolgreich. Als Version 13 veröffentlicht, nativer Status `succeeded`. Aktueller Veröffentlichungsnachweis unter docs/Sites-Betrieb.md.

Martial Arts & Asia-Film und Rom-Com sind als neue Genres eingebunden. Die breite Asia-Bezeichnung folgt dem gelieferten Paket mit Kampfkunst, Actionkomödien und Polizeifilmen. Drei neue transparente Illustrationen für diese Genres und Arthouse sind integriert.

Neue Mittel-/Schwer-Freischaltungen erhalten eine einmalige animierte Feier mit Schloss, Feuerwerk, Fanfare und optionaler Vibration. Offlinefähig, reduzierte Bewegung berücksichtigt; alte Runden spielen die Feier nicht erneut ab. 79 Logik-/Datenbanktests, Build und 41 Browserprüfungen erfolgreich. Veröffentlichungsnachweis unter docs/Sites-Betrieb.md.

Sammlung: Filter „Alle“ / „Mit beantworteten Fragen“, inklusive falscher Antworten, mit leerem Zustand. Vibration unabhängig von Browserunterstützung schaltbar und im Spielstand gespeichert; fehlende oder abgelehnte Ausgabe verständlich erklärt. Keine Migration und keine Fortschrittsänderung.

Entdecken bevorzugt auf Nutzerwunsch tatsächlich neue Ziele; zuletzt beantwortete Ziele aus drei Runden werden möglichst zurückgestellt. Die höchste erworbene Stufe wird in den ersten fünf bearbeiteten Zielen gezielt eingeführt. Keine neuen Fortschrittsfelder; Besser werden und Rekordwertung unverändert. Mobile Antwortansicht mit aufklappbaren Antwortmöglichkeiten und fest erreichbarer Weiter-Aktion.

Aktuelle Bedienungsverbesserungen: alle Genres gesammelt abwählbar; Genre-Bilder auch in kleinen Auswahlfeldern und Filmkarten. Kontoname und ausführliche Speicherhinweise im Profil; feste farbige Statusmarkierung am Profil und in der Runde, ohne springende Meldungszeile. Schnelle Änderungen werden innerhalb von 800 ms für die Online-Sicherung gebündelt. Ranglisten laden höchstens zehn Sekunden, Fehler erlauben erneuten Versuch. Nutzer bestätigte nach Schließen alter Tabs die aktuelle Version mit eigener Highscores-Navigation; alte freiwillige Freigabe gehörte zur überholten Offline-Oberfläche.


Spieleinstieg ohne große Werbefläche, Losspielen direkt unter der Moduswahl. Gleichmäßiges Genre-Raster; freie Schwierigkeit und Stufenfortschritte separat aufklappbar, gemeinsame Genre-Bilder. Normaler Lernpfad berücksichtigt automatisch alle freigeschalteten Stufen. Classics lässt sich mit Genres und Filmverfeinerung kombinieren, ohne doppelte Fragen oder Lernstände. Arthouse ist als weitere kuratierte Zusatzkategorie einzeln und gemeinsam mit Classics wählbar (Vereinigung, keine Doppelzählung). Neue Genres Abenteuer/Musik/Thriller haben teils weniger als 20 Ziele je Stufe; die Oberfläche erklärt die derzeitige Freischaltgrenze.


Fragenstatistik in Entdecken/Besser werden: konkrete Frage-ID mit beantwortet/richtig/falsch; aufklappbar Zeitabläufe, geratene Treffer und gemeinsame Variantenbilanz nach Wissensziel-ID. Rein aus bestehenden Ereignissen aller Modi/Rundenstatus abgeleitet, keine Speicherung oder Migration zusätzlicher Zähler.

Die Fragenstatistik erscheint standardmäßig erst nach der Antwort. Unter Profil → Optionen lässt sie sich auf „Immer anzeigen“ umstellen oder ausblenden. Die Auswahl wird mit dem Spielstand gesichert; ältere Spielstände verwenden „Nach der Antwort“.

Spielmodi mit eigenen transparenten Illustrationen: Entdecken (Lupe mit Stern), Besser werden (Stufen mit Stern), Rekordrunde (Pokal mit Stoppuhr). Die Startseite erhält eine helle Kino-Kulisse; Spielansicht und Daten bleiben unverändert. Losspielen bleibt direkt unter den Moduskarten. Alle neuen Bilder sind im Offline-Paket enthalten; die Auswahl ist weiterhin per Tastatur und mit sichtbarer Markierung bedienbar.

## Jahresfragen, Regiefragen und Filmdaten

Auf Nutzerauftrag direkt in den bisherigen Genres: 300 Jahresfragen und 287 zusätzliche Regiefragen. 13 passende vorhandene Regiefragen behalten ihre IDs und Fortschritte. Zusammen mit den unveränderten 1.980 CSV-Einträgen umfasst die App 2.567 Fragen und 2.237 Wissensziele; Classics jetzt 557 Fragen/479 Ziele, Arthouse 389/341. Keine eigene Filmwissen-Kategorie. Falsche Jahresalternativen variieren zwischen Runden, bleiben innerhalb der Runde einschließlich Offline-Fortsetzen und Sicherung stabil. Vor der Antwort kein Lösungshinweis durch die Jahreszahl im Titel.

Nach Beantwortung neuer und bestehender Fragen: geschlossene Klappe „Filmdaten“ mit Originaltitel, erster Veröffentlichung, Regie, Produktionsländern/-regionen und bekannter Filmreihenposition. Quellen und Ausnahmen im [Fachvertrag](../docs/Filmwissen-und-Filmdaten.md). 300 Filmfassungen abgeglichen, 111 konkrete Reihenpositionen; keine unabhängige Vollprüfung aller Filmaussagen.

Rundenfortschritt farbig und mit Symbolen: richtig grün/✓, falsch rot/×, Zeitablauf rot/–, offen grau. Aktuelle Frage mit deutlicher Umrandung und zusätzlichem Punkt, solange unbeantwortet. Beschriftungen für Screenreader; keine Änderung von Ereignissen oder Lernständen.

Themen und Filmblöcke: Die doppelte große Genreübersicht am Ende von Spielen ist entfernt. Themenkarten öffnen über „Filme & Reihen ansehen“ eine passende Unteransicht mit Rückweg; eine Filmauswahl erhält Genre/Kategorie für die Runde. Favoriten bleiben bis zu drei angeheftete Film-/Reihenblöcke ausschließlich in der Sammlung; ihre Bedeutung wird dort erklärt. Keine Änderung an Lernregeln oder Spielständen.

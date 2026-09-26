# Projektstart Wissensquiz

## Aktueller Stand

- Spielbare deutsche React-/TypeScript-Testversion mit Entdecken, Besser werden und Rekordrunde umgesetzt.
- Filmgenres und Schwierigkeitsstufen als Mehrfachauswahl; einzelne Filme/Reihen nur als optionale Verfeinerung. Alte Runden und Spielstände bleiben erhalten.
- Genre und Schwierigkeit jeder Frage sichtbar, unabhängig abschaltbar und gespeichert. Die bisherigen 720 Vertiefungen auf Darstellernamen geprüft; 627 Ergänzungen zu 125 Filmen, mit Quellen und versionsgenauer Zuordnung. Rohfragen und Spielstände erhalten.
- Persönliche Bestenliste aller abgeschlossenen Rekordspiele, filterbar nach Genre-Kombination, Stufen und Rundengröße; vergleichbare Kategorien getrennt, Spiele mit Rückblick. Persönliche Liste offline; automatische gemeinsame Trainingsrangliste für bestätigte Konten implementiert. Profil mit Spiel-/Antwortstatistik, Trefferquote, Level und XP.
- Kurze abschaltbare Soundeffekte, optionale Vibration, Genre-Icons und deutlicher gesperrter/erworbener Zustand des vorhandenen Sci-Fi-Abzeichens. Weitere Genre-Abzeichen noch offen.
- 1.260 gelieferte Fragen aus Sci-Fi, Action, Horror, Fantasy, Komödie, Western und Drama, 1.050 Wissensziele und 210 Varianten; 163 Themen. Sämtliche Datensätze strukturell akzeptiert.
- Fortschritt, Runden, Rekorde und Inhalte in IndexedDB; CSV-Import, JSON-Sicherung, lokale Meldungen und Expertenalbum vorhanden.
- Produktions-Build mit Offline-Cache und PWA-Manifest; Offline-Neuladen auf localhost geprüft.
- Lokales Git ohne Remote; Integrationsbranch `main`.
- Aktuelle Umsetzung auf Arbeitsbranch `codex/spielbare-testversion`; `main` enthält noch den initialen Projektstand.
- Codex-Projektregistrierung noch offen; Ordner in der App hinzufügen.

## Offen

- Nutzerfeedback zu Spielspaß, Erklärungstiefe, verständlichem Fortschritt und freiwilligen Folgerunden sammeln.
- Öffentliche Sites-Adresse ohne ChatGPT-Zugangsschranke verfügbar: https://wissensquiz-filmkosmos.levelx2.chatgpt.site. PWA-Installation auf dem Smartphone noch prüfen.
- Aktuelle Veröffentlichung: Sites-Version 16, App-Commit `6e42089`, Status `succeeded`, einschließlich neuer Entdecken-Auswahl und kompakter mobiler Antwortansicht. 87 Logik-/Datenbanktests, Build und 48 Browserprüfungen (46 Chromium, zwei WebKit/iPhone-Profil) erfolgreich. Nachweis unter docs/Sites-Betrieb.md. Physische PWA-/Offline-/Hör-/Vibrationsprüfung weiterhin offen.
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

Asia-Fragen sind angekündigt, aber noch nicht geliefert. „Asia-Kino“ ist ein Vorschlag; Zuordnung und finales Icon nach Nutzerwunsch erst anhand der Fragen festlegen. Vorab gestarteter Martial-Arts-Bildentwurf wird nicht eingebunden.

Neue Mittel-/Schwer-Freischaltungen erhalten eine einmalige animierte Feier mit Schloss, Feuerwerk, Fanfare und optionaler Vibration. Offlinefähig, reduzierte Bewegung berücksichtigt; alte Runden spielen die Feier nicht erneut ab. 79 Logik-/Datenbanktests, Build und 41 Browserprüfungen erfolgreich. Veröffentlichungsnachweis unter docs/Sites-Betrieb.md.

Sammlung: Filter „Alle“ / „Mit beantworteten Fragen“, inklusive falscher Antworten, mit leerem Zustand. Vibration unabhängig von Browserunterstützung schaltbar und im Spielstand gespeichert; fehlende oder abgelehnte Ausgabe verständlich erklärt. Keine Migration und keine Fortschrittsänderung.

Entdecken bevorzugt auf Nutzerwunsch tatsächlich neue Ziele; zuletzt beantwortete Ziele aus drei Runden werden möglichst zurückgestellt. Die höchste erworbene Stufe wird in den ersten fünf bearbeiteten Zielen gezielt eingeführt. Keine neuen Fortschrittsfelder; Besser werden und Rekordwertung unverändert. Mobile Antwortansicht mit aufklappbaren Antwortmöglichkeiten und fest erreichbarer Weiter-Aktion.

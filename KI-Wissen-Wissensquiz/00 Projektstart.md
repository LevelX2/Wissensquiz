# Projektstart Wissensquiz

## Aktueller Stand

- Spielbare deutsche React-/TypeScript-Testversion mit Entdecken, Besser werden und Rekordrunde umgesetzt.
- Filmgenres und Schwierigkeitsstufen als Mehrfachauswahl; einzelne Filme/Reihen nur als optionale Verfeinerung. Alte Runden und Spielstände bleiben erhalten.
- Genre und Schwierigkeit jeder Frage sichtbar, unabhängig abschaltbar und gespeichert. Die bisherigen 720 Vertiefungen auf Darstellernamen geprüft; 627 Ergänzungen zu 125 Filmen, mit Quellen und versionsgenauer Zuordnung. Rohfragen und Spielstände erhalten.
- Persönliche Bestenliste aller abgeschlossenen Rekordspiele, filterbar nach Genre-Kombination, Stufen und Rundengröße; vergleichbare Kategorien getrennt, Spiele mit Rückblick. Persönliche Liste offline; freiwillige gemeinsame Trainingsrangliste für bestätigte Konten implementiert. Profil mit Spiel-/Antwortstatistik, Trefferquote, Level und XP.
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
- Automatische Kontosicherung, Passwortanzeige, neue Genres und klarere Bestätigungsseite veröffentlicht (App-Commit `b33ae2a`, `succeeded`): 67 Logik-/Datenbanktests, Build und 31 Browserprüfungen erfolgreich. Veröffentlichungsstand unter docs/Sites-Betrieb.md. Physische PWA-/Offline-/Hör-/Vibrationsprüfung weiterhin offen.
- Fachliche Einzelprüfung der gelieferten Filmaussagen bei Bedarf; „redaktionell_geprueft“ ist eine Quellenangabe.
- Eigene Konten mit Supabase Free/Frankfurt, Brevo SMTP und deutschen Mailvorlagen aktiv. Bestätigungsmail zugestellt und Kontoaktivierung verifiziert. Nach zunächst abgelehntem Smartphone-Login hat der Nutzer erfolgreichen Passwort-Reset und Anmeldung am Handy bestätigt. Reale Zwei-Konten-/Geräte-Spielstandsabnahme noch offen. Passwortfelder mit Auge zum Anzeigen/Verbergen. Automatische Kontosicherung mit Revisionsschutz umgesetzt; Gaststand bleibt auf diesem Gerät und wird nur ausdrücklich übernommen. Gemeinsame Trainingsrangliste mit freiwilliger Freigabe umgesetzt; serverseitig kontrollierter Wettbewerb und echte Zwei-Spieler-Abnahme offen. Öffentlicher Site-Zugang ohne ChatGPT-Schranke eingerichtet und durch anonymen Live-Abruf nachgewiesen; Details unter docs/Sites-Betrieb.md.

## Einstieg

- [Wissensindex](02%20Wissen/00%20Uebersichten/Index.md)
- [Startanleitung und Architektur](../README.md)
- [Importvertrag](../docs/Importformat.md)
- [Lern- und Speichervertrag](../docs/Lernregeln.md)
- [Qualitätsprüfung](03%20Betrieb/Qualitaetspruefung.md)
- [Log](03%20Betrieb/Log.md)

## Daten und Sicherung

Spielstände liegen im Browser, nicht im Repository. JSON-Exporte über Einstellungen nach wichtigen Sitzungen und vor Browserbereinigung oder Adresswechsel erstellen, mindestens die letzten drei Sicherungen an einem sicheren persönlichen Ablageort erhalten. Validierter Wiederimport ersetzt nach Bestätigung den lokalen Stand. Browserneustart und Wiederherstellung wurden in getrennten Testprofilen geprüft. Angemeldete Konten sichern automatisch in Supabase; Gaststände bleiben lokal. Kontosicherung ersetzt keine unabhängige JSON-Rückfallkopie. `AGENTS.local.md` enthält nur rekonstruierbare lokale Pfadauflösung; lokale Git-Historie ersetzt kein externes Backup.

## Aktuelle Erweiterung: Profil und Bestenliste

Veröffentlicht als Sites-Version 11, App-Commit `cb41de1`, Status `succeeded`; bestehende öffentliche URL unverändert. Teilnahme an gemeinsamen Listen im Konto über „Meine Ergebnisse und Spielerstatistik teilen“ einschalten.

73 Logik-/Datenbanktests, Produktions-Build und 33 Chromium-Prüfungen im Gesamtlauf erfolgreich. Mobile Navigation anschließend auf eine Zeile verkürzt und gezielt nachgeprüft. Migration für freiwillig geteilte Rekordergebnisse im bestehenden Supabase-Projekt angewandt; RLS und Ausführungsrechte im echten Dienst geprüft. Veröffentlichungsnachweis unter docs/Sites-Betrieb.md. Optionaler Lernpfad auf Nutzerentscheidung umgesetzt: 20 unterschiedliche sichere leichte Ziele öffnen Mittel je Genre; zusätzlich 20 mittlere öffnen Schwer. Historische abgeschlossene Runden zählen; freies Spiel bleibt offen. Helle, kompaktere Spielansicht mit zentralen Optionen. Zusätzliche Spielerranglisten für Rundenzahl, richtige Antworten und Trefferquote ab 50 Antworten, nach Genre und Stufe filterbar; zweite Datenbankergänzung erfolgreich eingerichtet.

Drama ergänzt: unveränderte Rohquelle, 180 Fragen vollständig angenommen, automatischer erhaltender Paketimport und Offline-Cache. 75 Logik-/Datenbanktests, Build und 35 Browserprüfungen erfolgreich. Keine unabhängige Faktenprüfung der neuen Fragen. Aktueller Veröffentlichungsnachweis unter docs/Sites-Betrieb.md.

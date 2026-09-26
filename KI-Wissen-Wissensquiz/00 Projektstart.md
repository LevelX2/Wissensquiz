# Projektstart Wissensquiz

## Aktueller Stand

- Spielbare deutsche React-/TypeScript-Testversion mit Entdecken, Besser werden und Rekordrunde umgesetzt.
- Filmgenres und Schwierigkeitsstufen als Mehrfachauswahl; einzelne Filme/Reihen nur als optionale Verfeinerung. Alte Runden und Spielstände bleiben erhalten.
- Genre und Schwierigkeit jeder Frage sichtbar, unabhängig abschaltbar und gespeichert. Alle 720 Vertiefungen auf Darstellernamen geprüft; 627 Ergänzungen zu 125 Filmen, mit Quellen und versionsgenauer Zuordnung. Rohfragen und Spielstände erhalten.
- Persönliche Bestenliste aller abgeschlossenen Rekordspiele, filterbar nach Genre-Kombination, Stufen und Rundengröße; vergleichbare Kategorien getrennt, Spiele mit Rückblick. Lokal und offline; gemeinsame Bestenliste weiterhin offen.
- Kurze abschaltbare Soundeffekte, optionale Vibration, Genre-Icons und deutlicher gesperrter/erworbener Zustand des vorhandenen Sci-Fi-Abzeichens. Weitere Genre-Abzeichen noch offen.
- 720 gelieferte Fragen aus Sci-Fi, Action, Horror und Fantasy, 600 Wissensziele und 120 Varianten; 88 Themen. Sämtliche Datensätze strukturell akzeptiert.
- Fortschritt, Runden, Rekorde und Inhalte in IndexedDB; CSV-Import, JSON-Sicherung, lokale Meldungen und Expertenalbum vorhanden.
- Produktions-Build mit Offline-Cache und PWA-Manifest; Offline-Neuladen auf localhost geprüft.
- Lokales Git ohne Remote; Integrationsbranch `main`.
- Aktuelle Umsetzung auf Arbeitsbranch `codex/spielbare-testversion`; `main` enthält noch den initialen Projektstand.
- Codex-Projektregistrierung noch offen; Ordner in der App hinzufügen.

## Offen

- Nutzerfeedback zu Spielspaß, Erklärungstiefe, verständlichem Fortschritt und freiwilligen Folgerunden sammeln.
- Private Sites-Adresse verfügbar: https://wissensquiz-filmkosmos.levelx2.chatgpt.site. PWA-Installation auf dem Smartphone noch prüfen.
- Aktuelle private Sites-Veröffentlichung mit vorbereiteter, noch deaktivierter Kontenanbindung erfolgreich (`succeeded`, App-Commit `a34a0e0`). 57 Logik-/Datenbanktests und 25 lokale Browserprüfungen erfolgreich. Physischer Smartphone-/PWA-/Hör-/Vibrationstest und echte Kontodienst-/Mailprüfung weiterhin offen.
- Fachliche Einzelprüfung der gelieferten Filmaussagen bei Bedarf; „redaktionell_geprueft“ ist eine Quellenangabe.
- Eigene Anmeldung mit Spielername, E-Mail/Passwort, Bestätigung und Reset für den privaten Eigentümertest aktiviert; Veröffentlichung vorbereitet. Supabase Free in Frankfurt samt Datenbankregeln, Brevo SMTP mit verifiziertem Absender und deutsche Mailvorlagen eingerichtet. Echte Zustellung, Bestätigungs-/Reset-Links und Zwei-Konten-Abnahme noch offen. Brevo-Tracking anonymisiert, keine vollständige Abschaltung in der Oberfläche; Weiterleitungen mitprüfen. Manuelle Online-Sicherung mit Revisionsprüfung und getrennten Gast-/Kontoständen implementiert. Einrichtung unter `docs/Konten-Einrichtung.md`; gemeinsame Bestenliste und automatische Synchronisierung offen. 57 Logik-/Datenbanktests und 25 Browserprüfungen erneut bestanden. Äußere Sites-Zugangsschranke bleibt privat.

## Einstieg

- [Wissensindex](02%20Wissen/00%20Uebersichten/Index.md)
- [Startanleitung und Architektur](../README.md)
- [Importvertrag](../docs/Importformat.md)
- [Lern- und Speichervertrag](../docs/Lernregeln.md)
- [Qualitätsprüfung](03%20Betrieb/Qualitaetspruefung.md)
- [Log](03%20Betrieb/Log.md)

## Daten und Sicherung

Spielstände liegen im Browser, nicht im Repository. JSON-Exporte über Einstellungen nach wichtigen Sitzungen und vor Browserbereinigung oder Adresswechsel erstellen, mindestens die letzten drei Sicherungen an einem sicheren persönlichen Ablageort erhalten. Validierter Wiederimport ersetzt nach Bestätigung den lokalen Stand. Browserneustart und Wiederherstellung wurden in getrennten Testprofilen geprüft. Cloud-Sicherung technisch vorbereitet, aber ohne eingerichteten Kontodienst noch inaktiv. `AGENTS.local.md` enthält nur rekonstruierbare lokale Pfadauflösung; lokale Git-Historie ersetzt kein externes Backup.

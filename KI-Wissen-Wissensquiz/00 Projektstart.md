# Projektstart Wissensquiz

## Aktueller Stand

- Spielbare deutsche React-/TypeScript-Testversion mit Entdecken, Besser werden und Rekordrunde umgesetzt.
- Filmgenres und Schwierigkeitsstufen als Mehrfachauswahl; einzelne Filme/Reihen nur als optionale Verfeinerung. Alte Runden und Spielstände bleiben erhalten.
- Schwierigkeit jeder einzelnen Frage vor und nach der Antwort sichtbar. Geprüfte Darstellerergänzung zu Conjuring in der Vertiefung; systematische Überarbeitung der übrigen Erklärungen noch offen.
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
- Sci-Fi, Action, Horror und Fantasy mit Mehrfachauswahl, Sound, Icons, sichtbarer Schwierigkeit und Conjuring-Darstellern als private Sites-Version 6 veröffentlicht. Nativer Veröffentlichungsstatus `succeeded`; 45 Logiktests und 18 lokale Browserprüfungen erfolgreich. Physischer Smartphone-/PWA-/Hör-/Vibrationstest weiterhin offen.
- Fachliche Einzelprüfung der gelieferten Filmaussagen bei Bedarf; „redaktionell_geprueft“ ist eine Quellenangabe.
- Konten, geräteübergreifende Spielstände und gemeinsame Bestenliste als Entwurf unter `docs/Konten-und-Spielstaende.md`. Eigene Anmeldung unabhängig von ChatGPT gewünscht; Anbieter, Umsetzung und Wechsel der äußeren Sites-Zugangsschranke noch offen. Keine Cloud-Speicherung eingerichtet.

## Einstieg

- [Wissensindex](02%20Wissen/00%20Uebersichten/Index.md)
- [Startanleitung und Architektur](../README.md)
- [Importvertrag](../docs/Importformat.md)
- [Lern- und Speichervertrag](../docs/Lernregeln.md)
- [Qualitätsprüfung](03%20Betrieb/Qualitaetspruefung.md)
- [Log](03%20Betrieb/Log.md)

## Daten und Sicherung

Spielstände liegen im Browser, nicht im Repository. JSON-Exporte über Einstellungen nach wichtigen Sitzungen und vor Browserbereinigung oder Adresswechsel erstellen, mindestens die letzten drei Sicherungen an einem sicheren persönlichen Ablageort erhalten. Validierter Wiederimport ersetzt nach Bestätigung den lokalen Stand. Browserneustart und Wiederherstellung wurden in getrennten Testprofilen geprüft. Keine Cloud-Sicherung. `AGENTS.local.md` enthält nur rekonstruierbare lokale Pfadauflösung; lokale Git-Historie ersetzt kein externes Backup.

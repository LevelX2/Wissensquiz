# Konten und gemeinsame Spielstände – Entwurf

## Ausgangspunkt und Nutzerwunsch

Am 26.09.2026 geräteübergreifende Spielstände, Konten und eine gemeinsame Bestenliste als gewünschte Weiterentwicklung besprochen. Aktuell speichert die App ausschließlich lokal in IndexedDB. Die native Sites-Datenbankübersicht meldet für das vorhandene Projekt keine Datenbankbindung und keine Tabellen. Die Sites-Zugriffskontrolle erlaubt Besuchern den Zutritt, synchronisiert aber keine Spielstände.

## Technisch mögliche Richtung

[Offizielle Sites-Dokumentation](https://learn.chatgpt.com/docs/sites) beschreibt D1 als relationale Datenbank für Spielstände und Scores sowie serverseitig bereitgestellte Identität bei Anmeldung mit ChatGPT. Für das bestehende Projekt wären ein Serverteil und eine D1-Bindung zusätzlich zur React-Oberfläche nötig. Die vorhandene Sites-Projekt-ID und der private Zugriff sollen erhalten bleiben.

Vorgeschlagener Aufbau, noch nicht implementiert:

- Spielerprofil mit interner ID und frei gewähltem Anzeigenamen; E-Mail-Adressen nicht in der Bestenliste anzeigen.
- Private Lernereignisse und Rundensnapshots pro Spieler, mit eindeutigen Ereignis-IDs für wiederholbare Synchronisierung ohne Doppelzählung.
- IndexedDB als Offline-Speicher. Mehrere Geräte zusammenführen, ohne einen vollständigen fremden oder neueren Stand blind zu überschreiben. Lernfortschritt aus den zusammengeführten Ereignissen ableiten.
- Bestehenden lokalen Fortschritt erst auf ausdrücklichen Wunsch einem angemeldeten Konto zuordnen; vorher JSON-Sicherung ermöglichen. Gastdaten und Daten verschiedener angemeldeter Spieler getrennt halten.
- Für die gemeinsame Bestenliste neue Online-Rekordrunden serverseitig starten, Fragen und Zeiten zuordnen und Punkte serverseitig prüfen. Heutige lokale oder offline erspielte Rekorde bleiben persönliche Trainingsrekorde.
- Bestenlisten nach Genres, Schwierigkeitskombination, Rundengröße und Regelversion trennen. Teilnahme und Anzeigename bewusst wählen lassen.
- Authentifizierung und Zugriffsprüfung auf dem Server; ein Spieler darf nur seine privaten Fortschritte lesen oder ändern. Abmelden entfernt private lokale Kontodaten aus der aktiven Ansicht. Kontodaten exportieren und löschen können.

## Noch zu entscheiden

Der Nutzer hat eine eigene Anmeldung **unabhängig von ChatGPT** gewählt. Dafür soll ein geeigneter Anmeldedienst mit serverseitig geprüften Sitzungen eingesetzt werden; Anbieter und konkreter Anmeldeweg sind noch festzulegen. Ein selbst entwickelter Passwortspeicher ist für den Entwurf nicht vorgesehen.

Die aktuelle private Sites-Freigabe erfordert zusätzlich ein freigegebenes ChatGPT-Konto. Für vollständig unabhängigen Zugang müsste die äußere Site erreichbar werden und die Anwendung private Daten durch ihre eigene Anmeldung schützen. Diese Zugriffsänderung wurde noch nicht vorgenommen; sie gehört erst zum fertig geprüften Kontoumbau. Umsetzung, Migration echter Spielstände und Aktivierung der Bestenliste sind noch nicht erfolgt.

Die jetzige Genre-/Stufenauswahl ist davon unabhängig und bleibt vollständig offline nutzbar.

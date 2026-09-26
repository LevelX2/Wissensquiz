# Projektlog

## 2026-09-26 – Projektanlage

Projekt Wissensquiz mit Projektanweisungen, lokaler Auflösung, Ausschlüssen und Wissensbasis vorbereitet. Git-Modell: lokal ohne Remote, Integrationsbranch `main`. Anforderungen und Technologie-Stack bleiben offen. Die Registrierung des vorhandenen Ordners in der Codex-App steht noch aus.

## 2026-09-26 – Spielbare Testversion und Fragenpaket

React-/TypeScript-App mit drei Spielmodi, Erklärungen, Lernheuristik pro Wissensziel, Expertenalbum, Erfahrung und lokalen Rekorden umgesetzt. IndexedDB-Transaktionen sichern Runden und eindeutige Lernereignisse; CSV-Import, validierte JSON-Sicherung und lokale Fragenmeldungen ergänzen den Testbetrieb.

Die nachgelieferte CSV unverändert als Rohquelle abgelegt und vollständig strukturell ausgewertet: 180 akzeptierte Fragen, 150 Wissensziele, 30 Varianten, keine Ausschlüsse. Vorbereitete Demo-Fragen bleiben nur separates Formatbeispiel. Keine eigenen Ergänzungen der gelieferten Filmerklärungen.

31 automatisierte Logik-/Persistenztests und 9 Browserprüfungen bestanden. Bei Offlineprüfung einen Cache-Mismatch durch `Vary: Origin` gefunden und für statische Same-Origin-Dateien behoben. Dokumentierte Verträge in `docs/`, Navigation aktualisiert. Lokale Vorschau verfügbar, HTTPS-Smartphone-Installation und unabhängige Faktenprüfung der Filmangaben noch offen. Keine Veröffentlichung und kein Remote eingerichtet.

## 2026-09-26 – Sites als Hostingoption geprüft

Auf Nutzerhinweis die vorhandenen Sites-Werkzeuge und offizielle Dokumentation geprüft. Sites unterstützt bestehende Webprojekte und statische Builds und eignet sich grundsätzlich für diese App. Die bisherige Beschränkung auf lokale Vorschau bedeutet nicht, dass kein Hostingweg verfügbar ist. README um diese Option, Zugriffsschutz sowie Grenzen bei PWA-Prüfung und gerätelokalem Fortschritt ergänzt. Noch keine Registrierung oder Veröffentlichung durchgeführt.

## 2026-09-26 – Sites-Veröffentlichung beauftragt

Nutzer beauftragt die Bereitstellung der ersten Testversion über Sites und eine Test-URL. Private Site einmalig registriert und Projekt-ID in `.openai/hosting.json` gespeichert. Vorhandene React-App bleibt erhalten; veröffentlicht wird `dist/` ohne Backend oder Übertragung lokaler Spielstände. Der erfolgreiche Live-Stand wird nach Abschluss separat dokumentiert. Keine Erweiterung des Zugriffskreises beauftragt.

## 2026-09-26 – Sites und Action-Paket

Die private Sites-Veröffentlichung der Sci-Fi-Version wurde erfolgreich bestätigt. Die nachgelieferte Action-CSV unverändert abgelegt und vollständig geprüft: 180 weitere Fragen, 150 Ziele, 30 Varianten, 17 Themen; keine Ausschlüsse oder ID-Konflikte. Zusammen 360 Fragen, 300 Ziele und 56 Themen. Transaktionale Paketergänzung erhält vorhandenen Fortschritt und laufende Runden. 33 Logiktests und zehn Browserprüfungen erfolgreich. Veröffentlichungsablauf samt Windows-Besonderheiten in docs/Sites-Betrieb.md dokumentiert. Keine unabhängige Faktenprüfung und keine Prüfung auf einem physischen Smartphone.

## 2026-09-26 – Horror-Paket integriert

Die nachgelieferte Horror-CSV unverändert als Rohquelle und öffentliches Fragenpaket übernommen. Vollständig mit dem App-Parser ausgewertet: 180 Fragen, 150 Wissensziele, 30 Varianten, 20 Themen; keine Ausschlüsse, Warnungen oder ID-Konflikte. Insgesamt 540 Fragen, 450 Ziele und 76 Themen. Bestehende Sci-Fi-/Action-Spielstände werden transaktional ergänzt, Horror-Inhalte in den Offline-Cache aufgenommen. 35 Logik-/Persistenztests, Produktions-Build und elf Browserprüfungen erfolgreich, darunter beide Altbestände und eine offline fortgesetzte Halloween-Runde. Originaldatei und beide Kopien haben denselben SHA-256-Wert. Keine unabhängige Faktenprüfung oder neue Sites-Veröffentlichung; bestehende Projekt-ID und Zugriff unverändert.

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

## 2026-09-26 – Horror-Version privat veröffentlicht

Auf Nutzerauftrag den geprüften Horror-Stand lokal als `f871f70` committet und über die vorhandene Sites-Quellverknüpfung veröffentlicht. Version 3, Deployment `appgdep_6ab7a24215f48191b7c425ba389f75d8`, Status `succeeded`; bestehende URL und privater Eigentümerzugriff erhalten. Live-Startseite, Worker und Horror-CSV per authentifiziertem HTTP-Abruf geprüft: Status 200, CSV bytegleich, Horror im Offline-Manifest enthalten. Der lokale Sites-Helfer fehlte; stattdessen die verfügbaren nativen Sites-Schnittstellen mit kurzlebiger Git-Authentifizierung im Speicher genutzt. Kein dauerhafter Remote und keine GitHub-Verknüpfung. Externe Einladungen sind für die Site verfügbar; Anleitung dokumentiert, noch keine Empfänger hinzugefügt. Smartphone/PWA unter der Live-Adresse weiterhin offen.

## 2026-09-26 – Genres und Schwierigkeitsstufen kombinieren

Nutzerfeedback umgesetzt: große Filmgenres als Hauptauswahl, Mehrfachauswahl von Genres und Stufen, Film-/Reihenauswahl optional aufklappbar. Themenübersicht und Startseitenkarten auf Genres umgestellt; Sammlung und bestehende Favoriten erhalten. Auswahl im Rundensnapshot gespeichert, kanonische Rekordkategorien und abwärtskompatible Sicherungsprüfung ergänzt. 42 Logik-/Persistenztests und zwölf Browserprüfungen erfolgreich, mobile Auswahl visuell geprüft. Konten, gemeinsame Spielstände und serverseitige Bestenliste als Entwurf dokumentiert; Nutzer wünscht eigene Anmeldung unabhängig von ChatGPT. Noch keine Datenbank, Cloud-Migration oder Zugriffsänderung.

## 2026-09-26 – Mehrfachauswahl veröffentlicht und Rückmeldungen ergänzt

Mehrfachauswahl als Sites-Version 4 aus Commit `ffdeeb6989fb5a98850e0cc0068d2b9aa8e97462` veröffentlicht, Deployment `appgdep_6ab7a53ad8a88191bb0cdb6cfc05ac20` erfolgreich. Live-JavaScript, CSS und Service Worker bytegleich mit dem Build; Zugriff privat erhalten.

Weiteres Nutzerfeedback: kurze Soundeffekte und optionale Vibration implementiert, Ton jederzeit abschaltbar und Präferenzen lokal/sicherbar. Genre-SVGs sowie Schloss-/Sternmedaille für das bisher einzige Sci-Fi-Abzeichen ergänzt; keine neuen Vergaberegeln erfunden. Bei der ergänzenden Prüfung einen Darstellungsfehler der Rekordübersicht für neue Filterkategorien gefunden und behoben; Ansicht liest nun die zugehörige Runde statt alte Schlüsselpositionen. 43 Logik-/Persistenztests und 15 Browserprüfungen erfolgreich (Soundprüfung nach Korrektur einer zu frühen Testabfrage gezielt wiederholt). Keine physische Hör-/Vibrationsprüfung oder neue Kontospeicherung.

Anschließend als private Sites-Version 5 veröffentlicht: Commit `2e99f637538370d1a5a9faa9a856a8713860ffdd`, Deployment `appgdep_6ab7a740aaf08191b7cc7c38f569006f`, Status `succeeded`. Live-Startseite referenziert den aktuellen Build; JS, CSS und Worker authentifiziert mit HTTP 200 und bytegleich geprüft. Zugriff und URL unverändert. Konten unabhängig von ChatGPT und gemeinsame Bestenliste bleiben als noch nicht implementierter Entwurf festgehalten.

## 2026-09-26 – Fantasy und weitere Hinweise beim Spielen

Fantasy-Rohquelle unverändert übernommen: 180 Fragen, 150 Ziele, 30 Varianten und zwölf Themen, keine Importkonflikte. Insgesamt 720 Fragen, 600 Ziele und 88 Themen. Vorhandene Spielstände bleiben bei Paketerweiterung erhalten; Fantasy auch offline verfügbar.

Nutzer vermisst Schauspielernamen in der Horror-Vertiefung. Konkrete Lücke in `HOR-L-045` bestätigt; Besetzung der Warrens und Perrons für Conjuring (2013) im AFI-Katalog geprüft und separat in der Erklärung ergänzt. Originaltexte und gespeicherte Rundensnapshots bleiben unverändert. Darstellernamen bei zentralen Figuren als redaktionellen Maßstab dokumentiert; systematische Überarbeitung aller Genres noch offen. Auf weiteres Feedback hin die Schwierigkeit der einzelnen Frage vor und nach der Antwort sichtbar gemacht.

45 Logik-/Persistenztests, Produktions-Build und 18 Chromium-Prüfungen erfolgreich, einschließlich drei Altbeständen, Fantasy-Offlinebetrieb, Darstellerergänzung und Schwierigkeit. Mobile Fragenansicht visuell geprüft. Der offizielle Sites-Helfer ist wieder verfügbar; Veröffentlichung über den dokumentierten gebündelten Workflow vorbereitet.

Anschließend privat als Version 6 veröffentlicht: Quellcommit `44f6a2882948e5ea56b90b1377aa75ba16564968`, Deployment `appgdep_6ab7b115975481918fe0410551c6019e`, Status `succeeded`. URL und Zugriff unverändert, keine Testpersonen hinzugefügt. Git bewahrt CSV-Zeilenenden jetzt ausdrücklich ohne automatische Konvertierung; alle neun CSV-Dateien im Commit bytegleich mit den lokalen Dateien, bestehende Rohquellen inhaltlich unverändert. Keine zusätzliche Live-PWA-/Geräteprüfung.

## 26.09.2026 – Erklärungstiefe, Fragehinweise und Rekord-Bestenliste

- Alle 720 Fragen zu 125 Filmen auf fehlende Darstellernamen geprüft: 627 passende Ergänzungen, 64 bereits zugeordnet, 29 ohne zusätzliche einzelne gespielte Figur im Mittelpunkt. Quellen und Einzelentscheidungen dokumentiert. Film/Jahr, Frageversion und Inhalt schützen die Zuordnung; Roh-CSV und Spielstände unverändert. Besetzungsprüfung ist keine vollständige Faktenprüfung der Filmaussagen.
- Genre und Schwierigkeit pro Frage standardmäßig sichtbar, unabhängig abschaltbar; alte Sicherungen kompatibel.
- Persönliche Bestenliste aus sämtlichen abgeschlossenen Rekordrunden, filterbar nach Genre-Kombination, Stufen und Rundengröße. Eigene Ränge je bestehender Kategorie, Gleichstände, Datum, Treffer, Antwortzeit und Rundenrückblick. Bereits gespielte Runden automatisch enthalten, keine neue Speicherstruktur. Gemeinsame Konten/Bestenliste weiterhin offen.
- 51 Logik-/Speicherprüfungen, Build und 20 lokale Chromium-Prüfungen erfolgreich, mobile Bestenliste visuell geprüft. Geräte-/private Live-PWA-Grenzen bestehen fort. Veröffentlichung im bestehenden privaten Sites-Projekt folgt nach finaler Quellprüfung.

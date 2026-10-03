# Qualitätsprüfung

## Prüfung Version 46, 03.10.2026

300 Tests in 51 Dateien und finaler Produktionsbuild erfolgreich; die nachfolgende Optimierung der serverseitigen Referenzbereinigung zusätzlich mit 24 betroffenen Datenbank-/Sync-/Archivtests geprüft. Der vollständige Browserlauf umfasst 174 Fälle: 171 erfolgreich, zwei veraltete Testannahmen und ein vorgesehener Skip. Nach Korrektur der Genre-Beschriftung und Abwarten des tatsächlich gespeicherten Moduswechsels bestanden alle drei gezielten Chromium-/WebKit-Fälle. Damit 173 unterschiedliche Browserfälle erfolgreich gegen denselben unveränderten Produktionsbuild. Alle 63 Dateien bytegleich; [Prüfbericht](../../docs/Pruefbericht.md). Version 46 ist am 03.10.2026 um 18:12:06 Uhr Europe/Berlin nativ `succeeded`, in `main` integriert und auf GitHub synchronisiert; der Veröffentlichungsnachweis steht in [Sites-Betrieb](../../docs/Sites-Betrieb.md).

Stand: 03.10.2026. Diese Seite beschreibt den Prüfprozess; konkrete Zahlen gehören zu datierten Nachweisen. Die vorherige Fassung ist vollständig in der [Qualitäts-Historie](Qualitaetspruefung-Historie-2026-10-03.md) erhalten.

## Aktueller Nachweis

[Große Moduskachel und gezielter Ergebniszugang](../../docs/Hilfe-und-Navigation.md): Version 45 am 03.10.2026 um 16:43:08 Uhr Europe/Berlin nativ `succeeded`, lokal in `main` und GitHub. 295 Tests, finaler Build und alle 33 gezielten Browserfälle in Chromium/WebKit erfolgreich. Große Motive und Bedienung bei 320–1440 Pixeln, genaue Kategorie/Modus und sichtbarer fokussierter Vorjahreslauf auf Platz 25, Zwei-Konten-Duellergebnis, Wiederaufnahme, Offline und Axe geprüft. Alle 63 Produktionsdateien bytegleich zum eingefrorenen Browserbuild. Erstbefunde und Grenzen im [Prüfbericht](../../docs/Pruefbericht.md), Veröffentlichung in [Sites-Betrieb](../../docs/Sites-Betrieb.md).

[Spielkacheln und Rekordauswahl](../../docs/Hilfe-und-Navigation.md#spielkacheln-und-rekordauswahl--03102026): Sites-Version 44 am 03.10.2026 um 16:11:12 Uhr Europe/Berlin nativ `succeeded`, lokal in `main` integriert. 295 Tests in 50 Dateien, Produktionsbuild und 33 unterschiedliche gezielte Browserfälle erfolgreich; ein vorgesehener WebKit-Skip. Direkter Start mit gespeicherten Filtern, aktive Runden, leere Pools, drei Zeitmodi, Darstellung 320–1440 Pixel, Axe, Offline-Fortsetzung und Wiederaufnahme geprüft. Alle 63 Produktionsdateien bytegleich zum geprüften Browserbuild. Keine Abhängigkeitsänderung oder neue Migration. Genaue Erstfehler und Grenzen im [Prüfbericht](../../docs/Pruefbericht.md), Veröffentlichung in [Sites-Betrieb](../../docs/Sites-Betrieb.md).

[Finale vom 03.10.2026](../../docs/Gesamtintegration-2026-10-03.md): Sites-Version 43 mit nativem Status `succeeded`, alle lokalen Branchstände in `main`. 6.277 Fragen/5.734 Wissensziele, 1.400 Schauspielerfragen für 175 Personen, Rekordmodi und Profil-Versionsanzeige. 295 Tests in 50 Dateien, Produktionsbuild, 161 unterschiedliche Browserfälle erfolgreich und ein vorgesehener WebKit-Skip; Quellenprüfung, Diff, Dokumentlinks und Audit geprüft. Genaue Erstfehler, gezielte Nachprüfung und Grenzen im [Prüfbericht](../../docs/Pruefbericht.md).

[Produktionsrollout vom 03.10.2026](../../docs/Speicher-und-Sync-Produktion.md): Version 42 mit nativem Status succeeded; vier Migrationen, vollständiger gemeinsamer Katalog und geprüfte private Sicherung. Zusammengeführter Stand mit 278 Tests und 143 unterschiedlichen erfolgreich abgedeckten Browserfällen; genaue Erstfehler und abschließender 18-Fälle-Nachweis im [Prüfbericht](../../docs/Pruefbericht.md).

[Speicher-/Sync-Abnahme](../../docs/Speicher-und-Sync-Abnahme.md): nachfolgende lokale Eintragsmigration, vollständige Rekonstruktion, Rechte-/Wiederholungsprüfungen, native PostgreSQL-Belegung und Last mit 100 synthetischen Konten. [Betreiberablauf](../../docs/Speicher-und-Sync-Migration.md) und [Produktionsnachweis](../../docs/Speicher-und-Sync-Produktion.md) dokumentieren den inzwischen beauftragten Rollout, Sicherung und verbleibende Betreiberentscheidungen.

[Abnahme der Strukturverbesserungen](../../docs/Strukturverbesserungen-Abnahme.md): aktueller Worktree, Paketabschlüsse und Schlussprüfungen. Die ursprüngliche [Strukturprüfung](../../docs/Strukturpruefung-2026-10-03.md) beschreibt die damaligen Befunde. Veröffentlichungsnachweise stehen in [Sites-Betrieb](../../docs/Sites-Betrieb.md), weitere datierte technische Nachweise im [Prüfbericht](../../docs/Pruefbericht.md).

## Anwendung prüfen

- `npm test`: passende Logik-, Sicherungs-, Katalog- und Datenbanktests ausführen. Bei geänderten gemeinsamen Verträgen den gesamten Testlauf verwenden.
- `npm run build`: TypeScript, Produktionsdateien und vollständiges Offline-Paket prüfen. Bei Ladegrenzen Größen und enthaltene Dateien festhalten.
- `npm run test:browser`: bei Oberfläche, Persistenz und Offlinebetrieb passende Fälle; bei übergreifenden Änderungen den vollständigen Lauf. Chromium und die konfigurierten WebKit-Fälle berücksichtigen.
- Browserprofile isolieren, Kontodienst abfangen, Zeitzone festlegen und zeitabhängige Abläufe kontrollieren. Echte Nutzerdaten und öffentliche Gaststatistiken nicht für Tests verändern.
- Mobile Breiten, Tastaturbedienung, Fokus und automatisierte WCAG-Prüfungen passend zur Änderung kontrollieren. Automatisierte Prüfungen ersetzen keine vollständige Geräte-/Bedienungsabnahme.
- `git diff --check`; bei Abhängigkeitsänderungen zusätzlich `npm audit`. Testgenerierte Berichte gegen den vorherigen Inhalt prüfen; reine Zeitstempeländerungen nicht als Datenänderung übernehmen.

## Wissen, Quellen und Freigabe

- Relevante Fachverträge und Quellen zuerst lesen; IDs, Originalspalten, historische Snapshots und Roh-CSV erhalten. Quellenorganisation bei Bedarf mit `npm run check:questions` prüfen.
- Relative Wissens-/Dokumentationslinks und lokale Ausschlüsse kontrollieren. Aktuelle Statusseiten verdichten, historische Nachweise erhalten und das Log nur chronologisch ergänzen.
- Paketcommits und sauberen Worktree prüfen; vorhandene fremde Arbeitsstände erhalten. Die Abschlussfreigabe ist kein automatischer Veröffentlichungsauftrag.
- Bekannte Grenzen sichtbar halten: reale Konten/Geräte, Mobilnetz, Hörprüfung und fachliche Aussagen sind durch isolierte technische Tests nicht vollständig abgenommen. Windows-WebKit unterstützt den dokumentierten Offline-Neuladefall nicht zuverlässig; die entsprechende Fortsetzung wird getrennt geprüft.

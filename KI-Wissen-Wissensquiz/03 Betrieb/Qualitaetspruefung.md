# Qualitätsprüfung

Stand: 03.10.2026. Diese Seite beschreibt den Prüfprozess; konkrete Zahlen gehören zu datierten Nachweisen. Die vorherige Fassung ist vollständig in der [Qualitäts-Historie](Qualitaetspruefung-Historie-2026-10-03.md) erhalten.

## Aktueller Nachweis

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

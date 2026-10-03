# Projektstart Wissensquiz

Stand: 03.10.2026. Dieser Snapshot trennt den dokumentierten veröffentlichten Stand von der lokalen Umsetzung. Historische Meldungen und frühere Zahlen sind vollständig in der [Projektstart-Historie](00%20Projektstart-Historie-2026-10-03.md) und chronologisch im [Log](03%20Betrieb/Log.md) erhalten.

## Aktueller Stand

- Öffentliche statische React-/TypeScript-PWA ohne ChatGPT-Zugangsschranke. Aktuell nativ bestätigte Veröffentlichung: **Sites-Version 42**, erfolgreich am 03.10.2026; [Betriebsnachweis](../docs/Sites-Betrieb.md).
- **17 Quellenpakete, 5.677 Fragen, 5.147 Wissensziele, 530 Varianten**, 656 eingeordnete Filme und 100 Personen. Filmfragen, Preisträger und Schauspieler sind additive Fragenbereiche; Filmfilter begrenzen nur Filmfragen.
- Filmreise, Freies Spiel, Rekordrunde und Fehlertraining; eigene Antwortwahl „Keine Ahnung“, direkte/gesammelte Lösungen, Karriere-XP, Rundenrückblicke und asynchrone Kontoduelle.
- Gaststand lokal, bestätigte Kontostände automatisch privat online gesichert. Öffentliche Bestenliste/Gastaktivität und gemeinsame Trainingswertung sind dokumentiert; private Spielstände bleiben geschützt.
- Veröffentlichter Stand mit IndexedDB-Version 3, getrennten Kontoeinträgen und dauerhafter atomarer Outbox; bestehende Konten werden beim Öffnen geprüft übernommen. JSON-Schema 1, IDs, große Ausgangslernstände und historische Snapshots bleiben erhalten. Kein verpflichtendes Backend für Gastspiel.
- **Strukturverbesserungen und Speicher-/Sync-Optimierung im eigenen Worktree `codex/speicher-sync-optimierung` umgesetzt und bis einschließlich `60ab29f` am 03.10.2026 lokal freigegeben.** Acht Strukturpakete, danach vier Speicher-/Sync-Pakete; lokale Paketcommits; anschließend ausdrücklich beauftragter Produktionsrollout mit Übernahme der zwischenzeitlichen Versionen 40/41. Datenbank und Katalog sind eingerichtet, App-Veröffentlichung als Version 42 nativ mit succeeded bestätigt. Keine Main-Integration oder GitHub-Aktion. [Produktionsnachweis](../docs/Speicher-und-Sync-Produktion.md). [Strukturprozess](../docs/Strukturverbesserungen-Prozess.md), [neue Abnahme](../docs/Speicher-und-Sync-Abnahme.md), [ursprüngliche Prüfung](../docs/Strukturpruefung-2026-10-03.md).
- Gemeinsame immutable offizielle Kataloge, private Abweichungen, gezielte Einträge/Paketbelege und kleine Ranglistenprojektionen lokal geprüft. Im zusammengeführten Produktionsstand 278 Tests in 48 Dateien, Build und 143 unterschiedliche Browserfälle erfolgreich abgedeckt; ein WebKit-Desktopfall ausgelassen. 100 synthetische Konten im nativen Lastlauf vollständig rekonstruiert, 64,1 % weniger physischer Anwendungsspeicher nach geprüfter Bereinigung. [Messdaten und Grenzen](../docs/Speicher-und-Sync-Messung.json).

## Offen

- Main-Integration und Freigabe alter Ausgangskopien benötigen weiterhin eigene ausdrückliche Aufträge; Produktionsmigration und Veröffentlichung sind inzwischen erfolgreich abgeschlossen; [konkreter Ablauf](../docs/Speicher-und-Sync-Migration.md).
- Echte Zwei-Konten-/Zwei-Geräte-Abnahme auf Mobilverbindungen, physische Geräte-/Hörprüfung und PWA-Installation auf dem Smartphone. Isolierte Browsernachweise ersetzen diese Abnahmen nicht.
- Rückmeldungen zu Spielspaß, Erklärungstiefe, verständlichem Fortschritt und redaktioneller Bekanntheitseinteilung auswerten. Gelieferte Filmaussagen bei Bedarf einzeln fachlich prüfen; Quellenkennzeichnungen sind keine neue unabhängige Faktenprüfung.
- Produktionsquote, Migrationszwischenbedarf und reale API-/Mobilverbindungen während des beauftragten Rollouts beobachten. Die lokale Messung garantiert keine Free-/Nano-Kapazität. Die Startdatei bleibt trotz getrennt geladener Ansichten groß.

## Einstieg und Verträge

- [README: Starten, Spielen, Aufbau und Checks](../README.md)
- [Wissensindex](02%20Wissen/00%20Uebersichten/Index.md)
- [Arbeitsworkflow](02%20Wissen/Prozesse/Arbeitsworkflow%20Wissenspflege%20und%20Projektanfragen.md)
- [Importformat](../docs/Importformat.md) und [Lernregeln](../docs/Lernregeln.md)
- [Fragenbereiche/Bekanntheit](../docs/Spielmodi-und-Bekanntheit.md), [Filmkarriere](../docs/Filmkarriere-und-XP.md), [Filmduelle](../docs/Asynchrone-Filmduelle.md)
- [Konten/Sicherung](../docs/Konten-und-Spielstaende.md), [Datenorganisation](../docs/Fragedaten-Organisation.md), [Qualitätsprozess](03%20Betrieb/Qualitaetspruefung.md)

Projektwissen ist im Repository; lokale Pfadauflösung ausschließlich über die ignorierte `AGENTS.local.md`. Integrationsbranch ist `main`; Arbeit auf passenden `codex/`-Branches. Öffentlichen Besucherzugriff und bestehende Sites-Projekt-ID erhalten. Reale Nutzerdaten, Secrets und Build-Artefakte nicht versionieren. Remote, Push und Veröffentlichung nur nach ausdrücklichem Auftrag.

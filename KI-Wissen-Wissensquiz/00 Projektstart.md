# Projektstart Wissensquiz

Stand: 03.10.2026. Dieser Snapshot trennt den dokumentierten veröffentlichten Stand von der lokalen Umsetzung. Historische Meldungen und frühere Zahlen sind vollständig in der [Projektstart-Historie](00%20Projektstart-Historie-2026-10-03.md) und chronologisch im [Log](03%20Betrieb/Log.md) erhalten.

## Aktueller Stand

- Öffentliche statische React-/TypeScript-PWA ohne ChatGPT-Zugangsschranke. Letzte dokumentierte Veröffentlichung: **Sites-Version 39**, erfolgreich am 03.10.2026; [Betriebsnachweis](../docs/Sites-Betrieb.md).
- **17 Quellenpakete, 5.677 Fragen, 5.147 Wissensziele, 530 Varianten**, 656 eingeordnete Filme und 100 Personen. Filmfragen, Preisträger und Schauspieler sind additive Fragenbereiche; Filmfilter begrenzen nur Filmfragen.
- Filmreise, Freies Spiel, Rekordrunde und Fehlertraining; eigene Antwortwahl „Keine Ahnung“, direkte/gesammelte Lösungen, Karriere-XP, Rundenrückblicke und asynchrone Kontoduelle.
- Gaststand lokal, bestätigte Kontostände automatisch privat online gesichert. Öffentliche Bestenliste/Gastaktivität und gemeinsame Trainingswertung sind dokumentiert; private Spielstände bleiben geschützt.
- IndexedDB-Version 2 trennt Katalog und Fortschritt; JSON-Schema 1, IDs und historische Snapshots bleiben erhalten. Kein verpflichtendes Backend für Gastspiel.
- **Strukturverbesserungen im eigenen Worktree `codex/strukturverbesserungen` umgesetzt; Freigabe ausstehend.** Acht sequenzielle Pakete, lokale Paketcommits, keine Main-Integration, Veröffentlichung oder Remote-Aktion. [Prozess](../docs/Strukturverbesserungen-Prozess.md), [Abnahme](../docs/Strukturverbesserungen-Abnahme.md), [ursprüngliche Prüfung](../docs/Strukturpruefung-2026-10-03.md).

## Offen

- Nutzerfreigabe für die weitere Übernahme der Strukturverbesserungen; ein Hostingauftrag bleibt gesondert.
- Echte Zwei-Konten-/Zwei-Geräte-Abnahme auf Mobilverbindungen, physische Geräte-/Hörprüfung und PWA-Installation auf dem Smartphone. Isolierte Browsernachweise ersetzen diese Abnahmen nicht.
- Rückmeldungen zu Spielspaß, Erklärungstiefe, verständlichem Fortschritt und redaktioneller Bekanntheitseinteilung auswerten. Gelieferte Filmaussagen bei Bedarf einzeln fachlich prüfen; Quellenkennzeichnungen sind keine neue unabhängige Faktenprüfung.
- Größere Katalog-Schreibpfade und öffentliche Statistikprojektionen erst bei belegtem Wachstumsbedarf mit eigener Messung/Vertragsprüfung optimieren. Die Startdatei bleibt trotz getrennt geladener Ansichten groß.

## Einstieg und Verträge

- [README: Starten, Spielen, Aufbau und Checks](../README.md)
- [Wissensindex](02%20Wissen/00%20Uebersichten/Index.md)
- [Arbeitsworkflow](02%20Wissen/Prozesse/Arbeitsworkflow%20Wissenspflege%20und%20Projektanfragen.md)
- [Importformat](../docs/Importformat.md) und [Lernregeln](../docs/Lernregeln.md)
- [Fragenbereiche/Bekanntheit](../docs/Spielmodi-und-Bekanntheit.md), [Filmkarriere](../docs/Filmkarriere-und-XP.md), [Filmduelle](../docs/Asynchrone-Filmduelle.md)
- [Konten/Sicherung](../docs/Konten-und-Spielstaende.md), [Datenorganisation](../docs/Fragedaten-Organisation.md), [Qualitätsprozess](03%20Betrieb/Qualitaetspruefung.md)

Projektwissen ist im Repository; lokale Pfadauflösung ausschließlich über die ignorierte `AGENTS.local.md`. Integrationsbranch ist `main`; Arbeit auf passenden `codex/`-Branches. Öffentlichen Besucherzugriff und bestehende Sites-Projekt-ID erhalten. Reale Nutzerdaten, Secrets und Build-Artefakte nicht versionieren. Remote, Push und Veröffentlichung nur nach ausdrücklichem Auftrag.

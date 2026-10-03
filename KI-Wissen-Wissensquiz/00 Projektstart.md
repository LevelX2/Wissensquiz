# Projektstart Wissensquiz

Stand: 03.10.2026. Dieser Snapshot trennt den dokumentierten veröffentlichten Stand von der lokalen Umsetzung. Historische Meldungen und frühere Zahlen sind vollständig in der [Projektstart-Historie](00%20Projektstart-Historie-2026-10-03.md) und chronologisch im [Log](03%20Betrieb/Log.md) erhalten.

## Aktueller Stand

- Öffentliche statische React-/TypeScript-PWA ohne ChatGPT-Zugangsschranke. Aktuell nativ bestätigte Veröffentlichung: **Sites-Version 46**, erfolgreich am 03.10.2026 um 18:12:06 Uhr Europe/Berlin, in `main` integriert und mit GitHub synchronisiert. Version und Datum/Zeit stehen im Profil; [Betriebsnachweis](../docs/Sites-Betrieb.md).
- **19 Quellenpakete, 6.277 Fragen, 5.734 Wissensziele, 543 Varianten**, 656 eingeordnete Filme und 175 Personen. Darunter 1.400 Schauspielerfragen einschließlich der 600 Fragen aus P02/P03. Filmfragen, Preisträger und Schauspieler sind additive Bereiche; Filmfilter begrenzen nur Filmfragen.
- Illustrierte Varianten einschließlich Duell wählen nur aus und schließen die Auswahl. Große Moduskachel mit „Modus ändern“; „Losspielen“ startet danach. Die drei Zeitmodi erlauben Königsklasse oder genau eines von zwölf Filmgenres, festen 3/4/3-Mix und alle Filmgruppen. Freie Lernfilter bleiben erhalten. Ergebniszugang öffnet die genaue Vergleichskategorie und markiert/fokussiert den Lauf; weitere Kategorien sind sichtbar erreichbar. Frühere Sonderwertungen und alle Einzelläufe bleiben erhalten. Fragenbilanz nur unmittelbar nach dem Spiel; historische Ergebnisse ohne Fragenansicht. Karriere-XP, Lernstand, aktive Runden und auch unterbrochene Duellrunden bleiben korrekt fortführbar.
- Gaststand lokal, bestätigte Kontostände automatisch privat online gesichert. Öffentliche Bestenliste/Gastaktivität und gemeinsame Trainingswertung sind dokumentiert; private Spielstände bleiben geschützt.
- Veröffentlichter Stand mit IndexedDB-Version 3, getrennten Kontoeinträgen und dauerhafter atomarer Outbox; bestehende Konten werden beim Öffnen geprüft übernommen. JSON-Schema 1, IDs und große Ausgangslernstände bleiben erhalten. Ab Version 46 enthalten abgeschlossene Runden Bewertungsfakten; eingefrorene Rückfallkopien bleiben geschützt. Kein verpflichtendes Backend für Gastspiel.
- **Finale am 03.10.2026:** alle 22 lokalen Branchstände einschließlich offener Änderungen in `main` integriert. Struktur-/Antwort-/Sync-Optimierung, Personenreisen, kompakte Auswahl, Rekordmodi und 600 zusätzliche Schauspielerfragen gemeinsam erhalten und veröffentlicht. Drei neue Migrationen und der erweiterte offizielle Katalog live eingerichtet. [Integrationsnachweis](../docs/Gesamtintegration-2026-10-03.md), [Rekordvertrag](../docs/Rekordmodi-und-Zeitranglisten.md), [früherer Produktionsrollout](../docs/Speicher-und-Sync-Produktion.md).
- **Version 46: 300 Tests in 51 Dateien, finaler Produktionsbuild und 173 unterschiedliche Browserfälle erfolgreich; ein vorgesehener WebKit-Skip.** Alle 63 Produktionsdateien bytegleich zum eingefrorenen Browserbuild. Zwei neue Servermigrationen nach vollständiger geprüfter privater Sicherung angewendet; vorhandene Einträge, Objekte und fünf Highscore-Läufe beim Anwenden unverändert. Quellen/Dokumentlinks/Diff geprüft; keine Abhängigkeitsänderung. Main-Integration, GitHub-Push und öffentliche Veröffentlichung sind abgeschlossen; bestehende Branches/Worktrees bleiben erhalten. [Prüfnachweis](../docs/Pruefbericht.md), [Produktionsnachweis](../docs/Speicher-und-Sync-Produktion.md).

## Offen

- Freigabe alter Ausgangskopien bleibt gesondert zu beauftragen. Main-Integration, Produktionsmigration und Veröffentlichung sind abgeschlossen; [Betreiberablauf](../docs/Speicher-und-Sync-Migration.md).
- Echte Zwei-Konten-/Zwei-Geräte-Abnahme auf Mobilverbindungen, physische Geräte-/Hörprüfung und PWA-Installation auf dem Smartphone. Isolierte Browsernachweise ersetzen diese Abnahmen nicht.
- Erste reale Kontoübernahme am 03.10.2026 erfolgreich aktiviert; allgemeine Speicheranzeige wirkte während der längeren Erstübertragung wie ein Hänger. Verständliche Übernahmephasen und weniger einzelne Objektanfragen als Folgeverbesserung prüfen. Reale Wiederabrufdauer auf dem betroffenen Desktop noch nicht gemessen; [Befund](../docs/Speicher-und-Sync-Produktion.md#erste-beobachtete-kontoübernahme).
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

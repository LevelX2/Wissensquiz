# Lokale Speicher- und Synchronisierungsoptimierung

Stand: 03.10.2026. Auf Nutzerauftrag tatsächliche Umsetzung, aufbauend auf den acht Strukturpaketen. Branch `codex/speicher-sync-optimierung`, Ausgangspunkt `bac3c40`. Die bisherige Freigabe wartet bis zum Abschluss dieses zusätzlichen Auftrags. Keine Main-Integration, Remote-Aktion, Produktionsmigration oder Veröffentlichung.

## Fachliche Pakete

| Paket | Vertrag und Ergebnis | Status |
| --- | --- | --- |
| S1 | Vollständiger offizieller Katalog, SHA-256-Objekte, verlustfreie Einträge und Rekonstruktion | Erledigt |
| S2 | Lokale Eintragsspeicherung und atomare, dauerhafte Änderungswarteschlange; idempotente RPC und gezielter Abruf | In Arbeit |
| S3 | Kleine Spielerstatistiken und gezielte Rekordbeiträge mit Vergleich zur bisherigen Wertung | Offen |
| S4 | Versionierte Übernahme, geschützter Rückfall, Rechteprüfung und reproduzierbarer Last-/Größennachweis | Offen |

Der vollständige State und Schema-1-JSON bleiben die eigenständig rekonstruierbaren Sicherungen. Das interne Protokoll erhält eine eigene Version, unveränderliche Paket-IDs, Generation und erwartete Revision. Geänderte Spielabsichten verschiedener Geräte bleiben ein sichtbarer Konflikt. Alte Inhalte und große Ausgangslernstände werden erhalten; Änderungen an Spiel-, Lern- und XP-Regeln gehören nicht zum Auftrag.

## Ausgangsquellen

[Speicheranalyse und Zielvertrag](Speicher-und-Sync-Optimierung.md), [synthetische Ausgangsmessung](Speicher-und-Sync-Analyse.json), [Infrastruktur und bisherige Kapazitätsgrenzen](Infrastruktur-und-Kapazitaet.md), [Strukturabnahme](Strukturverbesserungen-Abnahme.md). Die ursprünglichen Analysewerte bleiben als Ausgangspunkt erhalten. Der neue Nachweis muss Nutzdaten, physische Belegung einschließlich Indizes und Lastmessungen getrennt ausweisen.

## Bisherige Verifikation

S1 prüft den vollständigen App-Importer mit 5.677 Fragen und seinen generierten Inhalten. Exakt gleiche offizielle Kataloge benötigen einen gemeinsamen Verweis; nur Abweichungen und eigene Ergänzungen bleiben privat. Rundensnapshots einschließlich tatsächlicher Jahresalternativen sowie große `before`-Maps sind unveränderliche referenzierte Inhalte. Antworten, Rundenköpfe, Lernwerte und Rekordcaches sind getrennte Einträge. Der Operatorgenerator erstellt ausschließlich lokale Dateien aus öffentlichen Quellen und verbindet sich nicht mit einer Datenbank. Die lokal erzeugten Katalog-/SQL-Artefakte werden nicht versioniert.

Fünf neue Vertragstests und TypeScript-Prüfung erfolgreich: gemeinsame Referenz für alle 5.677 offiziellen Fragen; private Abweichungen/fehlende Katalogteile; historische Jahresalternativen; große `before`-Maps; gezielte Antworten und Rate-Korrekturen; Voll-/v1-/v2-Sicherungen und entfernte Einträge; beschädigte Nachweise und widersprüchliche Ergebnisfelder. Der Operatorgenerator prüft den vollständigen Katalogrücklauf und erzeugt `release.json` sowie `operator-seed.sql` lokal unter dem ignorierten `tmp-sync/`.

Die Gesamtchecks und der konkrete Produktionsablauf werden nach Implementierung und Prüfung ergänzt. Bis dahin ist dieses Dokument ein Arbeitsstatus, keine Abnahme oder Kapazitätszusage.

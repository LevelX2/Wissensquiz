# Lokale Speicher- und Synchronisierungsoptimierung

Stand: 03.10.2026. Auf Nutzerauftrag tatsächliche Umsetzung, aufbauend auf den acht Strukturpaketen. Branch `codex/speicher-sync-optimierung`, Ausgangspunkt `bac3c40`. Der lokale Gesamtstand bis einschließlich `60ab29f` wurde am 03.10.2026 vom Nutzer freigegeben. Keine Main-Integration, Remote-Aktion, Produktionsmigration oder Veröffentlichung.

## Fachliche Pakete

| Paket | Vertrag und Ergebnis | Status |
| --- | --- | --- |
| S1 | Vollständiger offizieller Katalog, SHA-256-Objekte, verlustfreie Einträge und Rekonstruktion | Erledigt |
| S2 | Lokale Eintragsspeicherung und atomare, dauerhafte Änderungswarteschlange; idempotente RPC und gezielter Abruf | Erledigt; Ranglistenprojektion folgt in S3 |
| S3 | Kleine Spielerstatistiken und gezielte Rekordbeiträge mit Vergleich zur bisherigen Wertung | Erledigt |
| S4 | Versionierte Übernahme, geschützter Rückfall, Rechteprüfung und reproduzierbarer Last-/Größennachweis | Erledigt |

Der vollständige State und Schema-1-JSON bleiben die eigenständig rekonstruierbaren Sicherungen. Das interne Protokoll erhält eine eigene Version, unveränderliche Paket-IDs, Generation und erwartete Revision. Geänderte Spielabsichten verschiedener Geräte bleiben ein sichtbarer Konflikt. Alte Inhalte und große Ausgangslernstände werden erhalten; Änderungen an Spiel-, Lern- und XP-Regeln gehören nicht zum Auftrag.

## Ausgangsquellen

[Speicheranalyse und Zielvertrag](Speicher-und-Sync-Optimierung.md), [synthetische Ausgangsmessung](Speicher-und-Sync-Analyse.json), [Infrastruktur und bisherige Kapazitätsgrenzen](Infrastruktur-und-Kapazitaet.md), [Strukturabnahme](Strukturverbesserungen-Abnahme.md). Die ursprünglichen Analysewerte bleiben als Ausgangspunkt erhalten. Der neue Nachweis muss Nutzdaten, physische Belegung einschließlich Indizes und Lastmessungen getrennt ausweisen.

## Bisherige Verifikation

S1 prüft den vollständigen App-Importer mit 5.677 Fragen und seinen generierten Inhalten. Exakt gleiche offizielle Kataloge benötigen einen gemeinsamen Verweis; nur Abweichungen und eigene Ergänzungen bleiben privat. Rundensnapshots einschließlich tatsächlicher Jahresalternativen sowie große `before`-Maps sind unveränderliche referenzierte Inhalte. Antworten, Rundenköpfe, Lernwerte und Rekordcaches sind getrennte Einträge. Der Operatorgenerator erstellt ausschließlich lokale Dateien aus öffentlichen Quellen und verbindet sich nicht mit einer Datenbank. Die lokal erzeugten Katalog-/SQL-Artefakte werden nicht versioniert.

Fünf neue Vertragstests und TypeScript-Prüfung erfolgreich: gemeinsame Referenz für alle 5.677 offiziellen Fragen; private Abweichungen/fehlende Katalogteile; historische Jahresalternativen; große `before`-Maps; gezielte Antworten und Rate-Korrekturen; Voll-/v1-/v2-Sicherungen und entfernte Einträge; beschädigte Nachweise und widersprüchliche Ergebnisfelder. Der Operatorgenerator prüft den vollständigen Katalogrücklauf und erzeugt `release.json` sowie `operator-seed.sql` lokal unter dem ignorierten `tmp-sync/`.

S2 verwendet IndexedDB-Version 3 mit getrennten Einträgen, privaten Inhaltsobjekten und atomarer Outbox. Das neue Konto-RPC-Protokoll erzwingt Identität, Generation, Revision und unveränderliche Paketbelege. Mehrseitige Downloads prüfen eine feste Revision einschließlich Abschlussprüfung. Konten werden erst nach versiegeltem Staging und vollständiger Rekonstruktion aktiviert. Der Legacy-Writer bleibt ausschließlich für noch nicht übernommene Konten verfügbar; bereits migrierte Konten weisen ihn serverseitig zurück. Die neue Migration enthält einen internen Statistik-Hook, der erst mit S3 vollständig implementiert wird; S2 allein ist kein veröffentlichbarer Stand.

22 fokussierte Tests in vier Dateien prüfen Codec, lokale Transaktionsabbrüche, Reload der Outbox, Rechte, identische Wiederholungen, verlorene Paket- und Aktivierungsbestätigungen, spätere lokale Änderungen, konkurrierende Geräte, gezielte Downloads, Cursorablauf, entfernte Runden und ursprüngliche große before-Maps mit Unicode. TypeScript erfolgreich. Die Datenbanktests führen die tatsächlichen Migrationen in isoliertem PGlite aus. Zusätzlich wurde für physische Messungen eine isolierte PostgreSQL-17.11-Instanz mit ausschließlich synthetischen Daten vorbereitet.

S3 ergänzt getrennte Rundenbeiträge und Summen für Gesamt-, Genre-, Schwierigkeits- und kombinierte Filter. Listenabfragen lesen diese kleinen Projektionen. Die bisherige SQL-Rekordprüfung bleibt fachlich gleich und betrachtet nur betroffene Runden. Gleiche Beiträge erzeugen keine neuen Statistikschreibvorgänge; Einstellungspakete umgehen die Projektion vollständig. Karriere- und Lernregeln bleiben im bestehenden App-Replay; die SQL-Projektion übernimmt die bestätigten Karrierewerte einschließlich des bisherigen Legacy-Vertrags. Bereits vorhandene Legacy-Konten erhalten einen einmaligen Backfill und behalten bis zur Übernahme ihren geschützten bisherigen Writer.

Fünf zusätzliche Vergleichstests prüfen denselben Datenbestand zuerst mit den alten SQL-Funktionen, dann nach Backfill und nach Eintragsmigration: öffentliche und angemeldete Listen, kombinierte Filter, Gleichstände, Mindestantwortmenge, Nullrunden, Keine Ahnung, Zeitabläufe, geratene Antworten, abgebrochene Runden, XP und Rekordpunkte. Sound-/Anzeigeänderungen lassen sogar Zeilen- und Transaktionskennungen der Statistik unverändert. Reihenfolgen werden innerhalb eines Pakets verzögert auf Eindeutigkeit geprüft, sodass gültiges Umordnen unabhängig von der Upsert-Reihenfolge möglich bleibt. Der gesamte Unit-Lauf vor diesem letzten Reihenfolgetest bestand mit 247 Tests; der fokussierte Vergleichslauf anschließend mit fünf Tests. Der aktuelle Produktionsbuild besteht, 5.677 Katalogfragen und Offline-Paket mit 53 Dateien.

S4 ergänzt Betreiberaktionen mit exakter Generation-/Revisionsprüfung: aktuelle vollständige Sicherung rekonstruieren, eingefrorene Ausgangskopien erst nach geprüfter Sicherung freigeben, ausschließlich leere Altbereiche zurückgewinnen und bei Bedarf den aktuellen Stand mit größerer Revision in den Legacy-Pfad zurückführen. Eine explizite Pause verhindert sofortige erneute Übernahme; das spätere Wiederaufnehmen prüft aktuelle Gleichheit. Die Betreiberhelfer sind für Clientrollen gesperrt.

Der native PostgreSQL-17.11-Nachweis prüft 100 synthetische Konten mit dem vollständigen App-Katalog, jeweils 30 historischen und einer aktiven Runde. Vor und nach dem Lastlauf alle 100 vollständigen Zustände rekonstruiert, sämtliche Inhaltsnachweise geprüft. 1.100 Antwort-/Abschlussänderungen je Verfahren, keine SQL-Fehler. Physische Belegung einschließlich TOAST und Indizes 357,0 → 128,1 MB; Übernahmezwischenstand 483,1 MB. Schreib-Median/P95 21.801/66.640 → 87/411 ms, Listen 336.819/336.922 → 100/114 ms. Die JSON-Anfragekörper einer Antwort bleiben bei 0 bis 300 älteren Runden bei 3,9–6,0 KB. Erstabruf ist bei langen Historien nicht pauschal kleiner. SQL-Last schließt HTTP, Authentifizierung, JSON-Anfrageparsing und Produktionsquoten aus; WAL ist ein beobachtetes Clusterintervall mit Hintergrundarbeit.

Der abschließende Unit-Lauf besteht mit **255 Tests in 42 Dateien**, `npm test -- --maxWorkers=2`. Ein vorheriger uneingeschränkter Lauf überschritt unter paralleler Messlast die bestehende Fünf-Sekunden-Grenze des großen Katalogtests. Keine Prüfungen entfernt. Der aktuelle Produktionsbuild besteht: 5.677 Fragen, Offline-Paket `film-6fb114d0172f` mit 53 Dateien. Ein echter Fehler in der JSON-Feldreihenfolge generierter Jahres-Snapshots beim Geräteabruf wurde behoben und durch einen zusätzlichen unveränderten Rekonstruktions-/Rekompilierungstest abgesichert.

Der tatsächliche native Erstabruf nach dem Lastlauf wurde zusätzlich über den realen Client-Downloader geprüft: 3.384.906 Bytes in acht Leseanfragen, unveränderter Wiederabruf 111 Bytes in einer Anfrage und gezielter Abschlussabruf 5.372 Bytes in drei Anfragen. Vollständige Rekonstruktion und Revisionsabschluss erfolgreich; HTTP/Auth und Transportkompression nicht mitgezählt.

126 Browserfälle erfolgreich abgedeckt: vollständiger Lauf mit 125 bestandenen Fällen, einem bekannten Auslassfall und einem WebKit-Testuhrfehler; nach gezielter Korrektur alle sechs betroffenen WebKit-Fälle bestanden. Kein Produktverhalten dafür geändert. Finale Diff-Prüfung und relative Wissenslinks ohne Befund. Freigabe des lokalen Gesamtstands am 03.10.2026 erteilt; Integration und Produktionsrollout benötigen eigene ausdrückliche Aufträge.

[Konkrete Abnahme und verbleibender Rollout](Speicher-und-Sync-Abnahme.md), [Betreiberablauf und Rückfall](Speicher-und-Sync-Migration.md), [Messdaten einschließlich Grenzen](Speicher-und-Sync-Messung.json). Keine Zusage der Produktionskapazität.

# Abnahme der lokalen Speicher- und Sync-Optimierung

Nachtrag 03.10.2026: Nach der lokalen Freigabe wurde der Produktionsrollout ausdrücklich beauftragt. Der [Produktionsnachweis](Speicher-und-Sync-Produktion.md) dokumentiert den aktuellen Stand; die nachfolgenden Paket- und Messnachweise bleiben historische lokale Abnahme.

Stand: 03.10.2026. Vier aufeinander aufbauende Pakete im eigenen Worktree auf `codex/speicher-sync-optimierung`, auf den zuvor umgesetzten Strukturverbesserungen. Der Nutzer hat den lokalen Gesamtstand bis einschließlich Implementierungscommit `60ab29f` am 03.10.2026 ausdrücklich mit „Lokalen Stand freigeben“ abgenommen. Die Freigabe umfasst die Strukturpakete und die vier anschließenden Speicher-/Sync-Pakete. Keine Main-Integration, kein Push, keine PR, keine Produktionsmigration oder Veröffentlichung. Hauptarbeitsordner und fremde Änderungen erhalten.

## Ergebnis

- Offizielle vollständige Katalogversionen liegen gemeinsam und unveränderlich vor; Konten referenzieren Katalogausschnitte. Individuelle Inhalte bleiben privat. IDs, ursprüngliche Inhaltsversionen und historische Rundensnapshots bleiben erhalten.
- Antworten, Runden, Lernwerte und kleine Kontofelder sind eigene Einträge. Lokale Einträge und Änderungsbeschreibungen werden in IndexedDB-Version 3 atomar gespeichert; die dauerhafte Outbox enthält keine Vollkopie pro Aktion.
- Pakete besitzen feste ID, Protokollversion, Generation und erwartete Revision. Speicherung, Statistikfolgen, Revision und Beleg sind eine Transaktion. Verlorene Bestätigungen werden über identische Wiederholung abgeglichen. Fremde Geräteabsichten bleiben ein sichtbarer Konflikt. Downloads beginnen mit Metadaten, lesen Änderungen gezielt und prüfen einen konsistenten Abschluss.
- Spielerlisten lesen kleine Statistiken, Rekorde nur betroffene Rundenbeiträge. Sound-/Anzeigeänderungen erzeugen keine Rekordprojektion. Lern-, XP-, Freischaltungs- und bisherigen Wertungsregeln bleiben erhalten.
- Drei neue SQL-Migrationen, geprüfte Übernahme, aktuelle Sicherungen, ausdrücklich pausierbarer Rückfall und kontrollierte Freigabe alter Kopien sind vorbereitet. Öffentliche Kataloge können nur Betreiber einstellen; private Tabellen und Beziehungen sind durch Eigentümer, Generation, RLS und Grants geschützt.

## Messwerte

Tatsächlich erzeugte UTF-8-JSON-Anfragekörper, ohne HTTP-/Auth-/TLS-Overhead oder angenommene Transportkompression:

| Aktion | Bisher | Neu |
| --- | ---: | ---: |
| Eine Antwort, 0 bis 300 ältere Runden | 3,06–6,05 MB | 3,9–6,0 KB |
| Soundeinstellung | 3,06–6,04 MB | 494 Bytes |
| Rundenstart, einschließlich neuer Snapshotobjekte | 3,06–6,04 MB | 3,3–10,2 KB |
| Abschluss einer vorbereiteten Runde | 3,06–6,05 MB | 3,7–6,1 KB |
| Unveränderter Wiederabruf, native 30-Runden-Prüfgeschichte | 3.359.143 Bytes Antwortkörper | 111 Bytes Revisionsmetadaten |
| Gezielter Abschlussabruf derselben Geschichte | Vollständiger Stand | 5.372 Bytes einschließlich Revisionsprüfungen |

Ein neuer Browser braucht den gemeinsamen Katalog einmal und sämtliche zugehörigen Einträge. Der native Erstabruf nach dem Lastlauf lieferte **3.384.906 Bytes** gegenüber 3.359.143 Bytes vorher, in acht Leseanfragen einschließlich konsistenter Revisionsprüfung. Hier sind tatsächliche SQL-Antwortobjekte einschließlich Seitenhüllen, Base64-Zeilenumbrüchen und JSON-Escaping privater Inhalte gezählt; HTTP/Auth und Transportkompression fehlen.

Der erste Abruf ist bei langen Historien nicht durchgehend kleiner: bei 300 Runden sind zusätzlich die kompakt serialisierten Katalog-/Eintragsobjektsummen rund 6,89 MB gegenüber bisher 6,04 MB. Diese getrennten synthetischen Summen enthalten keine Seitenhüllen. Der Gewinn liegt in gemeinsamem Speicher und folgenden Änderungen; keine behauptete konstante Erstabrufgröße.

Physischer PostgreSQL-Test mit 100 Konten, vollständigem Katalog, je 30 historischen und einer aktiven Runde: **357,0 → 128,1 MB**, rund **64,1 % weniger**, einschließlich TOAST und Indizes. Zwischenstand während der Übernahme: **483,1 MB**. 100 Konten vor und nach je zehn Antworten plus Abschluss vollständig identisch rekonstruiert; 1.100 Schreibtransaktionen pro Verfahren ohne Fehler.

| Lokale SQL-Last mit 100 gleichzeitigen Sitzungen | Vorher Median / P95 | Nachher Median / P95 |
| --- | ---: | ---: |
| Antwort-/Abschlussspeicherung | 21.801 / 66.640 ms | 87 / 411 ms |
| Öffentliche XP-Liste | 336.819 / 336.922 ms | 100 / 114 ms |

Der Schreibtest beobachtete rund 7,17 GB gegenüber 16,24 MB WAL. Zeilenänderungen: vorher 33.100 Inserts, 1.100 Updates, 33.000 Deletes; nachher 4.900 Inserts, 4.400 Updates, keine Deletes. WAL ist ein Clusterintervall einschließlich Hintergrundarbeit; Listenabfragen ändern in beiden Läufen keine Spielzeilen. Diese Werte stammen aus einer isolierten lokalen PostgreSQL-17.11-Instanz und schließen API-/HTTP-/Authentifizierungszeiten aus. Sie beweisen diesen synthetischen Lauf und keine garantierte Produktionskapazität.

## Verifikation

**255 Tests in 42 Dateien**, Produktionsbuild und `git diff --check` erfolgreich. `npm test -- --maxWorkers=2` begrenzt die Testlast; ein vorheriger uneingeschränkter Lauf hatte unter paralleler Messung einen Zeitüberschritt beim großen Katalogtest. Keine Abhängigkeitsänderungen, daher kein zusätzlicher Auditlauf erforderlich.

**126 unterschiedliche Browserfälle erfolgreich abgedeckt**, 104 Chromium und 22 WebKit; ein bekannter WebKit-Desktopfall ausgelassen. Der vollständige `npm run test:browser`-Lauf prüfte 127 konfigurierte Fälle: 125 bestanden, einer ausgelassen, ein bestehender WebKit-Fall scheiterte an zu kurzem Fortschreiten der pausierten Testuhr nach der Registrierung eines Anzeige-Timers. Der Test taktet die kontrollierte Uhr jetzt ausreichend; anschließend bestanden alle sechs betroffenen WebKit-Fälle einschließlich Offline-Fortsetzung. Die Produktfunktion wurde dafür nicht geändert. Die neue Eintragsynchronisierung mit SQL-Backend, verlorener Bestätigung, Vollsicherung und Gerätekonflikt bestand im vollständigen Lauf.

Isolierte Browserprofile, synthetische Kontodienste und kontrollierte Testzeiten. Testgenerierte reine Importbericht-Zeitstempel nach Inhaltsvergleich zurückgesetzt. Öffentliche CSVs/Rohquellen, Abhängigkeiten, Supabase-Anbindung und Sites-Projekt-ID erhalten. 235 relative Links der geänderten Wissensseiten geprüft. Native Prüfinstanz kontrolliert beendet; Rohmessungen und synthetische Sicherungen bleiben ignorierte lokale Prüfarbeitsdateien.

Verträge prüfen vollständige JSON-Rekonstruktion, private Importe, historische Fragen, tatsächliche Jahresantwortvarianten und Reihenfolgen, aktive/abgeschlossene/abgebrochene Runden, große alte before-Maps und schrittweise Duellimporte, Rate-Korrekturen, Keine Ahnung, Zeitabläufe, Karriere-XP, Legacybonus, Lernfortschritt, Freischaltungen und Rekordpunkte. Persistenz-/Protokolltests prüfen Transaktionsabbrüche, Reload und Wiederaufnahme, verlorene Bestätigungen, doppelte/geänderte Paket-IDs, konkurrierende Geräte, Kontowechsel, Restore mit entfernten Einträgen, fremde/anonyme Zugriffe, wechselnde Downloadrevisionen und abgelaufene Cursor. Die tatsächlichen SQL-Migrationen laufen sowohl in PGlite als auch in der isolierten nativen Messumgebung.

Im abschließenden Browsernachweis wurde zusätzlich der neue Eintragspfad mit tatsächlichen SQL-Funktionen geprüft. Die Prüfung fand und behob einen nicht fachlichen JSON-Feldreihenfolgeeffekt bei generierten Jahresfragen: erneuter Geräteabruf darf daraus keinen anderen Snapshotnachweis und künstlichen Konflikt erzeugen.

## Noch auszuführen

Für Produktion braucht es einen eigenen ausdrücklichen Auftrag: drei Migrationen und den aus öffentlichen Quellen erzeugten Katalogseed installieren, Rechte/Quote prüfen, aktuellen Build über das bestehende Sites-Projekt veröffentlichen, wenige Konten kontrolliert übernehmen und aktuelle Sicherungen prüfen. Erst danach Ausgangskopien ausdrücklich freigeben. Es wurde kein echter Nutzerspielstand für Tests verändert. Reale Mobilverbindungen, Geräteinstallation und Betriebsquoten bleiben nach dem Rollout zu prüfen.

[Konkreter Betreiberablauf](Speicher-und-Sync-Migration.md), [Implementierung](Speicher-und-Sync-Umsetzung.md), [Messdaten mit Umgebung und Grenzen](Speicher-und-Sync-Messung.json).

## Messung wiederholen

Voraussetzung: `npm ci` und portable PostgreSQL-17.11-Windows-Binaries in `tmp-sync/postgres-17.11/pgsql/bin`; ausschließlich eigener lokaler Testcluster mit Benutzer `quiz_test`, Loopback-Port 55439, 64 MB shared_buffers und 150 maximalen Verbindungen. Keine Produktivverbindung, Kontoschlüssel oder echten Daten verwenden. PostgreSQL-Binaries/Testcluster sind absichtlich nicht in Git.

Bei einem neuen leeren Prüfverzeichnis:

```powershell
& ./tmp-sync/postgres-17.11/pgsql/bin/initdb.exe -D ./tmp-sync/postgres-data -U quiz_test -A trust --encoding=UTF8 --locale=C
& ./tmp-sync/postgres-17.11/pgsql/bin/pg_ctl.exe -D ./tmp-sync/postgres-data -l ./tmp-sync/postgres-test.log -o "-h 127.0.0.1 -p 55439 -c shared_buffers=64MB -c max_connections=150" start
node scripts/prepare-sync-catalog.mjs
$entryRunId = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
node scripts/benchmark-storage-sync.mjs $entryRunId
node scripts/verify-sync-benchmark.mjs $entryRunId
node scripts/measure-sync-downloads.mjs $entryRunId
& ./tmp-sync/postgres-17.11/pgsql/bin/pg_ctl.exe -D ./tmp-sync/postgres-data -m fast stop
```

Das Programm erstellt neue `quiz_sync_before_<Laufkennung>`-/`quiz_sync_after_<Laufkennung>`-Datenbanken und verweigert vorhandene Namen. Es löscht keine bestehenden Datenbanken. Es verwendet den tatsächlichen App-Importer, kontrollierte synthetische Zeiten und dieselben fachlichen Aktionen vor/nach Optimierung. `pgbench` führt 100 gleichzeitige Sitzungen mit zehn Threads aus; physische Werte kommen aus `pg_total_relation_size`, Tabellen-/Indexgrößen und WAL-LSN-Differenzen. Zeitwerte/physische Seiten können je Lauf und Maschine variieren; SQL-Dekodierung und Netzwerk bleiben außerhalb des Lasttests. [pgbench-Vertrag](https://www.postgresql.org/docs/17/pgbench.html), [PostgreSQL-Größenfunktionen](https://www.postgresql.org/docs/17/functions-admin.html).

Laufkennung des gelieferten Nachweises: `202610031110`. Rohprotokolle und synthetische Sicherungen liegen ignoriert unter `tmp-sync/benchmark-<Laufkennung>/`, der zusammengefasste öffentliche Nachweis unter `docs/Speicher-und-Sync-Messung.json`. Private absolute Hostpfade werden daraus entfernt. Ein separater `QUIZ_SYNC_WIRE_ONLY=1`-Lauf ergänzt nur die aus tatsächlichen Clientargumenten berechneten UTF-8-Anfragegrößen des zugehörigen Berichts; die nativen Last-/Belegungswerte bleiben erhalten.

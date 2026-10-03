# Speicher- und Sync-Optimierung: Produktionsrollout

Stand: 03.10.2026. Nach der lokalen Freigabe bis einschließlich `60ab29f` hat der Nutzer ausdrücklich „Dann Bitte produktiv setzen“ beauftragt. Datenbankmigrationen und öffentlicher Katalog sind erfolgreich eingerichtet; die zusammengeführte App ist als **Sites-Version 42 produktiv veröffentlicht**. Bestehende Supabase- und Sites-Projekt-IDs sowie der öffentliche Besucherzugriff bleiben erhalten.

## Veröffentlichung

Am 03.10.2026 als **Sites-Version 42 produktiv veröffentlicht**, nativer Status `succeeded`, bestätigt um 12:57:24 Uhr Europe/Berlin. Öffentliche URL: https://wissensquiz-filmkosmos.levelx2.chatgpt.site. Quellcommit `06765cbbc39e15a8490249c360ec119a4d8f9916`, gespeicherte Version `appgprj_6ab78f6468648191a8895f7a1d9dbf23~appgver_21bc6f8f5c748191b83fd0ee4e9e04a3`, Deployment `appgdep_6ac0df81fce4819194701736f609063f`. Bestehende Sites-Projekt-ID, öffentlicher Besucherzugriff (`public`, Revision 2) und Supabase-Anbindung erhalten.

Regulärer gebündelter Sites-Workflow mit eigenem Quellcheckout, normalem Fast-forward-Push des geprüften Quellcommits und exakt kopiertem finalem Build. Die Build-Kopie umfasst 58 Dateien und ist dateiweise SHA-256-identisch; das Paket enthält ausschließlich die statische Ausgabe und das Hostingmanifest. Keine privaten Sicherungen, Zugangsdaten oder Prüfarbeitsdateien im Archiv.

Lokales gzip-Archiv: 31.255.460 Bytes, SHA-256 `86810cc5bfeddeb9c9f8e6294ea799566cc967313e305f7838119d48e2c0592a`. Separater nativer Archivnachweis: 39.956.480 Bytes, 59 Dateien, `sha256:13f5e4b1270931cfe66b2aa6ee264e47f999f7273908776cca723050e182a809`. Lokale Komprimat-/Tarbytes und der nativ gespeicherte Archivnachweis werden getrennt dokumentiert. Native Speicherung bestätigt den exakten Quellcommit; Deployment und anschließende Site-Metadaten bestätigen Version 42 und öffentlichen Zugriff. Native Browserübergabe angefordert; keine zusätzliche Live-Browser- oder physische Geräteprüfung.

## Quellstand und Sicherung

Die während der lokalen Paketarbeit veröffentlichten Sites-Versionen 40 und 41 wurden unmittelbar aus dem nativen Quellrepository übernommen. Ihr aktueller Quellcommit ist `73368e025a8e1ea321ecdf9da9aca99e664384a1`. Die Antwortoptimierung mit Hintergrund-Worker, fünfte Duellkachel, Solo-Lösungswahl in den Optionen, getrennte Personen-/Preis-Filmreise bis Experte und Schauspielerredaktion bleiben zusammen mit der freigegebenen Struktur-/Eintragsoptimierung erhalten. Keine Main-Integration und keine GitHub-Veröffentlichung; fremde Arbeitsstände wurden nicht verändert.

Vor den Migrationen wurde eine vollständige logische Momentaufnahme in einem MVCC-Statement erstellt: Daten aller 48 vorhandenen Basistabellen aus den sechs Anwendung-/Dienstschemas einschließlich Auth, dazu Spalten, Constraints, Indizes, RLS-Regeln, Funktionen, Trigger und Berechtigungen; Ansichten und Sequenzen ergänzend gesichert. Der private JSON-Snapshot umfasst 25.101.715 Bytes, SHA-256 `a1cd3f13c82183dbc51901780c3a3f446a5fedde5179a95536ab5bb8a20d2223`. Er liegt mit Zugriff ausschließlich für den lokalen Eigentümer und SYSTEM außerhalb von Git und Veröffentlichungsartefakten. Dies ist eine logische Sicherung mit Metadaten, kein physisches Clusterabbild oder neuer PITR-Tarif.

Der vorhandene Kontostand wurde ausschließlich lesend vollständig rekonstruiert und über v2 sowie das neue Eintragsformat geprüft. Die bereits veröffentlichte Filmreise-Normalisierung ergänzt `journey.independentAreas`; sämtliche bisherigen Felder und Spielfortschritte bleiben erhalten. Kein Testfortschritt wurde in ein echtes Konto geschrieben. Hash und Revision der vorhandenen Online-Sicherung sowie die öffentlichen Spielerwerte blieben vor und nach den Migrationen identisch.

## Angewendete Migrationen

| Lokale SQL-Datei | Tatsächlicher Produktionsverlauf |
| --- | --- |
| `20261003081845_storage_entry_sync.sql` | `20261003103258_storage_entry_sync` |
| `20261003085256_storage_stat_projections.sql` | `20261003103259_storage_stat_projections` |
| `20261003090228_storage_sync_maintenance.sql` | `20261003103301_storage_sync_maintenance` |
| `20261003103617_storage_catalog_publication.sql` | `20261003103837_storage_catalog_publication` |

Die native Managementschnittstelle vergibt eigene Zeitkennungen. Vorhandene ältere manuell eingerichtete Migrationen wurden nicht erneut ausgeführt. Supabase-Projekt: `nadhixddmpshndqpmzqi`.

SHA-256 der angewendeten SQL-Dateien in dieser Reihenfolge:

1. `c937d1e1292501e2694c7af7fc70a893b7b2333c789dc223b6041cf04e4ee6ea`
2. `86a5bae6fe3a58f3d4597381145d63a003d5e1eb3c2b573620e87bf9fa4a943b`
3. `5d749d0c48bdede91d92ebc2cb1a95030bf7c0f9facdaf4de98875d58179c066`
4. `86722932b83ffb18574b9b9616b124acec62c3676f8911dc4a72a815ba690a2e`

Die zusätzliche vierte Migration behebt die unmittelbar gemessene Größenbegrenzung der Managementschnittstelle: Das vollständige Operator-Seed-SQL von 7.657.905 Bytes wurde vor Ausführung zurückgewiesen. Der Katalog wird deshalb in begrenzten Betreiberteilen bereitgestellt und erst nach vollständiger SHA-256-Prüfung in einer Transaktion öffentlich freigegeben. Teilbereitstellung und Abschlussfunktion sind für `PUBLIC`, `anon` und `authenticated` gesperrt; die Tabelle hat RLS ohne Clientpolicy. Unvollständige oder geänderte Teile können keinen öffentlichen Release erzeugen. Bereits vorhandene Releases müssen exakt übereinstimmen. Die katalogbezogene Sperre blockiert keine Spielertransaktionen.

`scripts/prepare-sync-catalog.mjs` erstellt neben dem bisherigen Direkt-SQL reproduzierbare Teil-SQLs, Manifestnachweis und Abschluss-SQL. Sämtliche Betreiberartefakte bleiben ignoriert. Die zusätzliche Migration ist mit synthetischen SQL-Tests einschließlich Unvollständigkeit, Inhaltsänderung, Wiederholung und Rollenprüfung abgedeckt.

## Öffentlich freigegebener Katalog

- Vollständiger tatsächlicher App-Importer: **5.677 Fragen**, ebenso viele Inhaltsnachweise und Bewertungsfelder; Protokoll 1.
- Katalogkennung: `216e40469f00211de5280fd014bb64106967876a6211c92691280fd8fc43fb6a`.
- Komprimierter Nutzinhalt: 1.889.610 Bytes, SHA-256 `1b99775b8f3300d0b0bc5ecf3b67a7ef3d689b1bd2f8e8a2f9a87867320d9f49`.
- Betreiber-Manifest: 3.828.815 Bytes in 240 Teilen, SHA-256 `6d7d094ba786393229de1c4fb7bada7b8349f46bd53a45c7396c7df40623ae68`.
- Native SQL-Prüfung bestätigt genau einen Release, korrekte Fragen-/Nachweiszahlen und keine verbliebenen Bereitstellungsteile. Keine eigenen Kontoinhalte wurden veröffentlicht.

Alle 21 öffentlichen Quiztabellen haben RLS. Private Synchronisierungsfunktionen sind nur für angemeldete Konten verfügbar; öffentliche Kataloglesefunktion und bereits öffentliche Statistikfunktionen bleiben bewusst lesbar. Betreiberabschluss und Teilbereitstellung sind für Clientrollen gesperrt. Die statischen Advisor-Hinweise für RPC-interne Tabellen ohne direkte Policy entsprechen dieser Sperre; bestehende unabhängige Hinweise wurden nicht als Teil dieses Auftrags umkonfiguriert.

## Übernahme und weiterer Betrieb

### Erste beobachtete Kontoübernahme

Am 03.10.2026 meldete der Nutzer auf dem Desktop nach ausdrücklicher Auswahl des Online-Stands zunächst eine dauerhaft wirkende Anzeige „Spielstand wird online gespeichert …“, kurz darauf jedoch erfolgreichen Abschluss nach seiner Schätzung etwa einer Minute. Ausschließlich lesende Produktionsdiagnose bestätigt eine vollständig aktivierte Generation um 13:31:35 Uhr Europe/Berlin. Keine Kontodaten wurden zur Diagnose verändert.

Die Servermessung umfasst die gesamte Übernahme ab 13:28:41 Uhr und damit rund 174 Sekunden: 2.792 erfolgreiche Objektteilanfragen von 13:28:42 bis 13:31:21 Uhr, anschließend begrenztes Eintragsstaging, Versiegelung, vollständiges Prüfrücklesen und Aktivierung. Die betrachteten Sync-Endpunkte lieferten HTTP 200/204. Die Nutzerschätzung bezieht sich auf die wahrgenommene Wartephase; sie ist nicht dieselbe Messgrenze wie der komplette Serverablauf. Historische oder abweichende Inhalte verursachen bei der ersten Übernahme zusätzliche private Objektübertragung.

Eine unveränderte spätere Öffnung auf demselben Gerät verwendet den geprüften Metadatenpfad und wiederholt diese Übernahme nicht. Neue Geräte und ausdrückliche Auswahl eines abweichenden Online-Stands benötigen weiterhin einen vollständigen kontrollierten Abruf. Eine reale Wiederabrufdauer auf dem betroffenen Desktop wurde hier nicht gemessen.

Die allgemeine Speicheranzeige unterscheidet die einzelnen Übernahmephasen bisher nicht. Sinnvolle Folgeverbesserung: verständliche Phasen-/Fortschrittsanzeige für die erste Übernahme sowie begrenzte Bündelung der vielen kleinen Objektanfragen mit unverändertem Inhalts-, Eigentümer- und Generationsschutz. Keine neue App- oder Datenbankänderung innerhalb dieser Diagnose; erfolgreiche Übernahme und vorhandene Sicherungen bleiben erhalten.

Der zusammengeführte Stand besteht 278 Tests in 48 Dateien und den Produktionsbuild. 143 unterschiedliche Browserfälle sind erfolgreich abgedeckt; ein Desktopfall ist im mobilen WebKit-Projekt bewusst ausgelassen. Der breite Lauf hatte zunächst fünf Fehler; nach Anpassung zweier veralteter Testannahmen und Erhalt der Katalog-Wiederverwendung beim Duellimport bestanden alle 18 gezielten Abschlussfälle gegen den abschließenden Build. Vollständige Ergebnisse und Grenzen im [Prüfbericht](Pruefbericht.md). Keine Abhängigkeiten geändert. Offline-Paket: `film-04304f456bc1`, 56 Dateien.

Vor Veröffentlichung bestehen ein unveränderter Legacy-Kontostand und noch keine aktivierte Eintragsgeneration. Nach Aktualisierung übernimmt der neue Client beim Öffnen des Kontos automatisch und revisionsgeschützt: bereitstellen, versiegeln, vollständig zurücklesen, logische Gleichheit prüfen, erst dann aktivieren. Alte Clients und Warteschlangen können eine aktivierte Generation serverseitig nicht zurückschreiben. Vollständiges Schließen aller alten Quiz-Fenster ermöglicht Service-Worker-/IndexedDB-Aktualisierung; Browserdaten nicht löschen.

Eingefrorene Legacy-Ausgangskopien und historische Inhalte wurden nicht gelöscht. Ihre Freigabe und physische Bereinigung bleiben eine gesonderte Betreiberentscheidung nach fachlicher Abnahme und aktuellen vollständigen Exporten; siehe [Migrations- und Rückfallablauf](Speicher-und-Sync-Migration.md). Die momentane Datenbankbelegung steigt durch neuen Katalog, Migration und Rückfallkopien. Die lokale Messung von 64,1 % weniger Anwendungsspeicher beschreibt die isolierte Prüfung **nach Bereinigung**, keine bereits erzielte Produktionsreduktion oder Kapazitätsgarantie.

Produktionsdatenbank vor dem Rollout: 36.023.443 Bytes; nach Migrationen und Katalogfreigabe: 39.865.491 Bytes. Beide Werte sind lesende Momentaufnahmen einschließlich Indizes und TOAST; laufende Auth-/Hintergrundarbeit kann sie verändern. Tarif unverändert.

[Lokale Abnahme und Messwerte](Speicher-und-Sync-Abnahme.md), [Sites-Betrieb](Sites-Betrieb.md), [Prüfbericht](Pruefbericht.md).

## Ergebnisarchive und Genre-Rekorde, Version 46 – 03.10.2026

Vor den zwei Erweiterungen wurde eine vollständige private logische Sicherung von 60 Tabellen und 104 Funktionen einschließlich Schema-, RLS-, Rechte- und Triggerinformationen erstellt. Alle Teile wurden nach Entschlüsselung gegen die Inhaltsnachweise geprüft; eine gemeinsame lesende SQL-Momentaufnahme bestätigte sämtliche Tabellenstände. Zusammengeführte Sicherung: 49.927.765 Bytes, SHA-256 `e83997bf64fecffcd43ad7256ca017adf94f19799f6b68f73c60eb03cdd43e9f`, Momentaufnahme 03.10.2026 um 15:42:33 UTC. Sicherungsdateien und Schlüssel bleiben ausschließlich privat außerhalb des Repositorys und der Veröffentlichungsartefakte.

Die [Archiv-/Genre-Migration](../supabase/migrations/20261003150524_compact_round_results.sql) und [Referenzoptimierung](../supabase/migrations/20261003155030_archive_object_gc_references.sql) sind nativ erfolgreich angewendet. Beide ändern nur Funktionen. Beim Anwenden bleiben **fünf Highscore-Läufe, 1.371 private Einträge und 2.725 private Objekte** unverändert. Der erste vollständige Vergleich aller 60 Tabellen zeigte ausschließlich die erwartete neue Migrationshistorie; abschließende Zählungen nach der zweiten Migration bestätigen den unveränderten Anwendungsbestand. Interne Validator-/Bereinigungshelfer sind für Clientrollen gesperrt; zuvor bekannte Advisor-Hinweise bleiben ohne neue Befunde.

Abgeschlossene Runden werden vom neuen Client mit schlanken Bewertungsfakten übertragen; aktive Runden behalten ihre vollständigen Inhalte. Vorhandene Läufe werden beim Anwenden der SQL-Migration weder entfernt noch neu kategorisiert. Neue Genre-Rekorde werden serverseitig gegen genau ein offizielles Genre, Filmfragen, festen 3/4/3-Mix und alle Filmgruppen geprüft. Alte Sonderkategorien bleiben lesbar. Die Objektbereinigung wertet referenzierte Inhalte einmal aus und schützt aktuelle private Importe, aktive/historisch noch vollständige Runden und offizielle Katalogreferenzen. Unreferenzierte private Objekte haben serverseitig eine eintägige Schonfrist; lokal erfolgt Bereinigung erst nach bestätigter vollständiger Outbox. Eingefrorene Legacy-Rückfallkopien bleiben unverändert geschützt. Die lokale SQL-/Sync-Prüfung bestätigt auch den Erhalt eines gealterten aktuellen privaten Importobjekts neben der Entfernung eines nicht mehr referenzierten alten Lernstandsobjekts.

Die aktuelle Ergebnisansicht verwendet eine temporäre vollständige Bilanz. Bei verlassenen Ergebnissen bleiben Punkte, Laufzeit, Antworten, XP, Lernfortschritt und Einzelläufe, aber keine spätere Fragenansicht. Auch archivierte unterbrochene Duellrunden können fortgesetzt werden, ohne vollständige alte Fragen wieder dauerhaft im eigenen Katalog abzulegen. Gemeinsame serverseitige Duellfragen bleiben für laufende Begegnungen und geräteübergreifende Fortsetzung erforderlich.

Version 46 ist am 03.10.2026 um 18:12:06 Uhr Europe/Berlin nativ `succeeded` öffentlich veröffentlicht. Versionsmetadaten mit dem tatsächlichen Zeitstempel und Quellcommit dauerhaft gespeichert, in einer getrennten Abfrage bestätigt und anschließend anonym gelesen. Tatsächlichen Deployment-Nachweis führt [Sites-Betrieb](Sites-Betrieb.md). [Prüfbericht](Pruefbericht.md), [Betreiberablauf](Speicher-und-Sync-Migration.md).

## Alte Rekord-Sonderwertungen entfernen, Version 47 – 03.10.2026

Die [Migration](../supabase/migrations/20261003161636_current_record_categories_only.sql) ist auf ausdrücklichen Nutzerauftrag nativ angewendet. Ergebnisprojektion vollständig aus den unveränderten privaten Quellen neu erstellt: eine alte custom-Wertung gelöscht, vier aktuelle Standardmix-Läufe erhalten. Private Saves, Einträge, Objekte, Kontoköpfe und Lern-/Karriere-Summen sind nach Inhaltsnachweisen unverändert. Alte Projektionsfunktionen gelöscht; interne Gültigkeitsprüfung für anon/authenticated gesperrt. Erneute Projektion alter Sicherungen erzeugt ausschließlich aktuelle gültige Rekorde. Keine neuen Security-Advisor-Befunde; bestehende unabhängige Hinweise unverändert. Lokale SQL-Prüfung mit synthetischen Daten bestätigt Entfernung und Wiederholungsschutz. Eingefrorene Kontosicherungen und gemeinsame Fragekataloge waren nicht Teil dieser Rekordbereinigung.

# Speicher- und Sync-Migration: Betreiberablauf

Stand: 03.10.2026. Nach ausdrücklichem Produktionsauftrag sind die nachfolgenden Migrationen und der öffentliche Katalog erfolgreich eingerichtet. Der [Produktionsnachweis](Speicher-und-Sync-Produktion.md) dokumentiert Sicherung, tatsächlichen Verlauf und Veröffentlichung. Der Ablauf bleibt für weitere Übernahmen und kontrollierten Rückfall gültig. Die Freigabe alter Ausgangskopien ist weiterhin gesondert zu beauftragen.

## Rollout-Reihenfolge

1. Aktuellen Produktions-Migrationsverlauf und freie Clusterquote lesend prüfen. Vorhandene Projekt-ID, Kontokonfiguration und öffentlichen Sites-Zugang erhalten. Eine vollständige Datenbanksicherung außerhalb der Veröffentlichungsdateien anlegen. Die vier folgenden neuen Dateien gehören gemeinsam zum Rollout; S2 allein enthält noch keinen fertigen Statistik-Hook.
2. Versionierte Migrationen in dieser Reihenfolge anwenden:
   - `20261003081845_storage_entry_sync.sql`
   - `20261003085256_storage_stat_projections.sql`
   - `20261003090228_storage_sync_maintenance.sql`
   - `20261003103617_storage_catalog_publication.sql`
   Vorhandene ältere Migrationen nicht erneut manuell ausführen. Der Statistik-Backfill liest Legacy-Konten einmal; seine Laufzeit vorab mit einer isolierten repräsentativen Kopie prüfen.
3. `node scripts/prepare-sync-catalog.mjs` aus dem geprüften App-Quellstand ausführen. Der vollständige App-Importer erzeugt 5.677 Fragen einschließlich generierter Jahres-/Regiefragen, Kategorien und Metadaten. Aktuelle SHA-256-Katalogkennung: `216e40469f00211de5280fd014bb64106967876a6211c92691280fd8fc43fb6a`. `tmp-sync/catalog/operator-seed.sql` ausschließlich als Betreiber und ausschließlich für freigegebene öffentliche Quellen anwenden. Bei begrenzter Management-Anfragegröße stattdessen sämtliche `publication-parts/*.sql` bereitstellen und anschließend `operator-publish.sql` ausführen. Die vierte Migration prüft Vollständigkeit, Manifest-SHA und unveränderlichen Release atomar. Der Duellkatalog ersetzt diesen Katalog nicht. Historische freigegebene Releases behalten; Generationen referenzieren sie über Fremdschlüssel.
4. Rollen, Grants, RLS, öffentliche Antwortfelder und Revisionsmetadaten lesend nachprüfen. Erst danach den geprüften App-Build nach dem bestehenden [Sites-Ablauf](Sites-Betrieb.md) veröffentlichen. Alte Quiz-Fenster schließen, damit der Service Worker aktualisiert und IndexedDB-Version 3 geöffnet werden kann. Keine privaten Exporte oder `tmp-sync/`-Dateien in das Site-Artefakt aufnehmen.
5. Der veröffentlichte Client übernimmt vorhandene Konten beim Öffnen automatisch: Generation beginnen, immutable Inhalte und Einträge in begrenzten Transaktionen bereitstellen, versiegeln, vollständig zurücklesen, SHA-/Sicherungsverträge und logische Gleichheit prüfen, dann mit erwarteter Revision aktivieren. Unterbrochenes Staging wird mit derselben lokal dauerhaft gespeicherten Übernahmeplanung fortgesetzt. Neue lokale Änderungen nach diesem Snapshot bleiben in der Outbox und werden anschließend übertragen. Während des ersten Rollouts zunächst wenige Konten öffnen und ihre Übernahme beobachten.
6. Während dieser Phase bleibt der alte Online-Vollstand eingefroren erhalten. Er ist eine Ausgangskopie, kein aktueller Ersatz für späteren Fortschritt. Der alte Writer weist migrierte Konten zurück; alte Geräte und alte Pakete dürfen die aktive Generation nicht zurückschreiben. Geräte mit abweichenden lokalen Absichten erhalten weiter den sichtbaren Konflikt und eine Sicherungsmöglichkeit.
7. Nach fachlicher Abnahme aktuelle vollständige Exporte jedes übernommenen Kontos außerhalb der Datenbank aufbewahren. Erst danach und mit gesonderter Betreiberfreigabe die nachfolgende Freigabe der Ausgangskopien ausführen. Laufzeiten, Fehlerquote, belegten Platz und tatsächlichen API-Verkehr beobachten; die lokale Lastmessung garantiert keine Free-/Nano-Kapazität.

## Aktuelle Sicherung, Freigabe alter Kopien und Rückfall

`scripts/prepare-sync-maintenance.mjs` verbindet sich mit keiner Datenbank. Mit `--export-query <Konto-UUID>` erstellt es eine ausschließlich lesende SQL-Abfrage. Diese liest Kopf, aktive Einträge, private Objekte und referenzierte öffentliche Kataloge in **einem MVCC-Statement**. Ihre private JSON-Ausgabe als Snapshot speichern, ohne sie in Git oder Veröffentlichungsdateien aufzunehmen.

`node scripts/prepare-sync-maintenance.mjs <private-snapshot.json> tmp-sync/maintenance` prüft sämtliche Inhaltsnachweise, eindeutige Identitäten, vollständige Rekonstruktion und den verlustfreien Rücklauf über das bisherige v2-Format. Es erstellt:

- `latest-full-state.json`: eigenständige vollständige Schema-1-Sicherung, einschließlich historischer Fragen und alter großer before-Maps.
- `verification.json`: Generation, Revision und SHA-256-Nachweise.
- `release-fallback.sql`: gegen genau diesen aktuellen Kopf geschützte Freigabe der eingefrorenen Legacy-Ausgangskopie und pensionierter Generationen. Live referenzierte historische Inhalte bleiben erhalten. Nicht referenzierte private Objekte der aktiven Generation werden erst nach einer Tagesfrist freigegeben; ausstehende Pakete können ihre immutable Inhalte erneut bereitstellen.
- `rollback.sql`: geschützter Rückfall auf **den verifizierten aktuellen** vollständigen Stand im bisherigen Online-v2-Format. Die neue Revision ist größer als die aktive Eintragsrevision; die Eintragsübernahme wird für dieses Konto pausiert. Die Clientfabrik erkennt diese ausdrückliche Pause und verwendet den Legacy-Pfad. Ein altes Archiv einfach wieder aktiv zu schalten würde neueren Fortschritt verlieren und ist nicht vorgesehen.

Vor einer dieser Schreibaktionen die vollständige Sicherung separat aufbewahren und prüfen. Die SQL-Helfer sind für `anon`, `authenticated` und `PUBLIC` gesperrt. Sie sind Betreiberaktionen mit einer kurzen kontobezogenen Sperre und exakter Generation-/Revisionsprüfung. Hat sich das Konto inzwischen geändert, wird die Aktion abgewiesen und ein neuer Snapshot ist nötig.

Sind **sämtliche** Legacy-Saves und Ausgangskopien freigegeben, kann der Betreiber `select quiz_sync_internal.compact_empty_legacy();` aufrufen. Nur tatsächlich leere alte Tabellen werden kurz gesperrt und mit TRUNCATE einschließlich ihres TOAST-Speichers zurückgewonnen. Der Helfer verkleinert keine aktive Eintragstabelle und verlangt kein VACUUM FULL im laufenden Spielbetrieb.

Nach geklärtem Rückfall kann `quiz_sync_internal.resume_protocol(<Konto-UUID>, <aktuelle Legacy-Revision>)` die Pause ausdrücklich aufheben. Ein aktueller Client migriert erst nach Gleichheitsprüfung neu. Ein Gerät mit anderen lokalen Absichten wird nicht still überschrieben; die bisherige ausdrückliche Konfliktentscheidung bleibt erforderlich. Bereits verwendete Paket-IDs werden nicht auf eine andere Generation umgebunden.

## Platz und Prüfnachweis

Die Übernahme braucht vorübergehend Platz für alte und neue Darstellungen. Bei 100 synthetischen Konten mit je 30 abgeschlossenen Runden stieg die physische Anwendungsbelegung einschließlich TOAST und Indizes von **357.040.128 auf 483.131.392 Bytes**. Erst nach geprüfter Freigabe der Ausgangskopien und Rückgewinnung leerer Altbereiche lag sie bei **128.139.264 Bytes**. Diese konkrete Zwischenlast beträgt rund 35 % zusätzlich; andere Historien und private Importe können abweichen. Batches und gleichzeitige Übernahmen daher nach realer Quote begrenzen.

Der Backupvertrag liest weiterhin Vollstände, kompakte v1- und v2-Sicherungen. Vollständige Wiederherstellung stellt eine neue Generation bereit und ersetzt auch entfernte Einträge; ausschließliches Upsert ist kein vollständiger Restore. Veraltete Änderungscursor erhalten einen kontrollierten vollständigen Abruf. Mehrseitige Abrufe prüfen dieselbe Generation und Revision einschließlich Abschlussprüfung und bewahren inzwischen entstandene lokale Änderungen.

[Umsetzung und Tests](Speicher-und-Sync-Umsetzung.md), [Abnahme](Speicher-und-Sync-Abnahme.md), [reproduzierbare Messdaten](Speicher-und-Sync-Messung.json).

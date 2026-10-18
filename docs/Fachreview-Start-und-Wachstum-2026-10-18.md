# Fachreview: Startcode, Belege und Wachstum

Stand 18.10.2026, lokal umgesetzt und geprüft. Keine Veröffentlichung oder produktive Datenbankaktivierung. Behandelt die Reviewpunkte 6, 7 und 15; ergänzt die historischen Infrastrukturberichte.

## Startabhängigkeiten

Spielkonto, Proberundenoberfläche und Kontopanel werden nach Bedarf geladen; die Profilstatistik zusätzlich erst im Profil. Gemeinsame Speichertexte ziehen den Spielcode nicht mehr als statische Abhängigkeit ins Kontopanel. Die vollständigen Redaktionsquellen bleiben erhalten. `src/runtimeMetadata.json` enthält nur die benötigten Kennungs-/Stufenpaare sowie die unveränderten sechs Identitätsfelder der Kategoriezuordnungen; vorhandene Identitätsprüfungen bleiben bestehen. Kategorievorbereitung für Importe liegt getrennt in `src/categoryPreparation.ts`.

Nach Änderungen an Film-/Personenbekanntheit oder den Classics-/Arthouse-Rohzuordnungen `npm run prepare:runtime-metadata` ausführen. `npm run check`, Build und Serverinhaltsvorbereitung weisen eine veraltete Projektion zurück. Der Generator berücksichtigt auch Windows-Zeilenenden. Die kompakte Quelldatei umfasst 76.422 Bytes gegenüber zusammen 431.070 Bytes für die vier vollständigen Quellen im geprüften Arbeitsbereich; das sind Quellgrößen.

[Reproduzierbarer Bundlevergleich](IT-Fachreview-2026-10-18-Bundlevergleich.json), gzip je Datei:

| Umfang | Vorher | Nachher |
| --- | ---: | ---: |
| Einstieg mit statischen JavaScript-Imports | 292.951 Bytes | 159.950 Bytes |
| Einstieg plus statische Abhängigkeiten der Konto-Spielansicht | im alten Einstiegsbundle enthalten | 259.116 Bytes |
| Einstieg plus statische Abhängigkeiten der Probeoberfläche | im alten Einstiegsbundle enthalten | 241.003 Bytes |
| Sämtliche JavaScript-Dateien einschließlich Nebenansichten | 323.552 Bytes | 297.851 Bytes |

Der statische Einstieg ist damit rund 45,4 Prozent kleiner. Die bedarfsabhängigen Spielmodule kommen je Route hinzu. Dies sind Build-/Importgraphgrößen, keine gemessene Ladezeit und kein vollständiger Startdownload; CSS, Bilder, API-Verkehr und Browsercache sind gesondert. Das Highscore-Navigationssymbol verwendet ebenfalls die kleine Genrevariante statt des 1.887.626-Byte-PNGs. Originalbilder und Rohquellen bleiben erhalten.

## Aufbewahrung technischer Zeitspielbelege

Aktive Runden behalten ihre Wiederholungsbelege. Bei geschlossenen Runden werden die technischen Antworten frühestens sieben Tage nach dem serverseitigen Rundenende entfernt; erfolgreiche Antworten innerhalb der Frist behalten ihre ursprüngliche Anfrage-ID und Wirkung. Bereinigung erfolgt beim nächsten Beleg desselben Kontos und beim bestehenden täglichen Betriebsjob.

Jeder neu gestartete Zeitlauf speichert seine Start-Anfrage-ID als kleine dauerhafte Eigenschaft des Laufs. Nach Ablauf und Bereinigung wird ein alter Start mit dieser Kennung als abgelaufen zurückgewiesen und erzeugt keinen zweiten Lauf. Auch abgelaufene Änderungen geschlossener Runden werden abgewiesen. Die Oberfläche erklärt, dass der Online-Spielstand neu geladen werden soll. Spielverlauf, beantwortete Fragen, Lernbelege und gewertete Ergebnisse werden durch diese Bereinigung nicht gelöscht. Es wird kein Altformat oder zusätzlicher Rückfallpfad eingeführt.

Gezielt geprüft: Antwortwiederholung nach sechs Tagen ohne Doppelzählung, Entfernung nach acht Tagen, Erhalt eines aktiven Laufs, Ablaufhinweis für alte Start-/Antwortanfragen sowie unveränderte gewertete Ergebnisse. Der bestehende synthetische Rekordlistenaufbau erzeugt nun auch unterschiedliche Startkennungen für seine unterschiedlichen Läufe.

## Private Betriebsgrößen

`quiz_capacity_internal.samples` erfasst Datenbankgröße und je Anwendungstabelle Tabellen-/TOAST-, Index- und Gesamtgröße sowie geschätzte Zeilenzahl. Die Schätzung stammt aus PostgreSQL-Statistiken und ist kein exakter Kontozähler. Die Erfassungsdauer ist die Dauer dieser Größenabfrage, keine API-Latenz. Es werden keine Antworttexte, Kontokennungen oder Nutzungsprofile gespeichert. Messungen älter als 180 Tage werden bei der nächsten Erfassung entfernt.

Ein privater Trigger nach dem bestehenden täglichen Betriebsnachweis führt Belegbereinigung und Größenaufnahme aus. Kein neuer öffentlicher RPC, kein zusätzlicher Scheduler und kein zusätzlicher Nachrichtenversand. Schema, Tabelle, Sequenz und Funktionen bleiben für `anon`, `authenticated` und `service_role` gesperrt; RLS ist aktiv. Die Betreiberfunktion arbeitet mit explizit leerem Suchpfad. Der vorhandene tägliche Job läuft weiterhin nach seinem eigenen Betreibervertrag.

Beispiel für die geschützte Betreiber-SQL-Sitzung nach Freigabe und Aktivierung:

```sql
select checked_at, database_bytes,
       database_bytes - lag(database_bytes) over (order by checked_at, id) as growth_bytes
from quiz_capacity_internal.samples
order by checked_at desc, id desc
limit 30;
```

Ein Zuwachs ist physische Datenbankbelegung einschließlich freier Seiten und Indizes; daraus folgt kein allgemeiner Speicherpreis pro Antwort. Aktuelle Tarif-/Quotaentscheidungen benötigen die tatsächlichen Betreiberwerte. [PostgreSQL-Größenfunktionen](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADMIN-DBSIZE).

## Aktueller synthetischer Lastnachweis

[Vollständige Messdaten](IT-Fachreview-2026-10-18-Native-Messung.json). Isoliertes natives PostgreSQL 17.11 ausschließlich auf Loopback, 85 synthetische Konten, 20 logische Prozessoren und rund 32 GiB RAM. Aktueller Katalog mit 15.295 Fragen und 14.628 Zielen, identischer Inhaltsfingerabdruck `dcaac8b93da86e708fea266927eae0c1336e07a4d3b5fb00dc1d466d2abc6c19`. Kontrollierter Kalendertag, echte Serveruhr für Laufzeitmessungen.

Je Laststufe zwei Zehnerrunden pro Konto. Zuerst kurze Historien, anschließend zusätzlich 100 geschlossene Zehnerrunden/1.000 Antworten je Konto mit aktuellen unveränderlichen Fragenfakten und getrennten IDs/Zeitpunkten. Die älteren Antworten wiederholen die zehn Ziele der ersten Runde. Zusammenfassungen werden über die tatsächlichen Projektoren aufgebaut. Aufbauzeit der synthetischen Historie gehört nicht zu den nachfolgenden Antwortmessungen.

| Historie | Gleichzeitige Konten | Antwort P95 | Start P95 | Gesamter SQL-Rundenablauf P95 |
| --- | ---: | ---: | ---: | ---: |
| kurz | 10 | 13,740 ms | 114,327 ms | 395,134 ms |
| kurz | 25 | 15,762 ms | 285,988 ms | 993,825 ms |
| kurz | 50 | 24,176 ms | 712,504 ms | 1.867,033 ms |
| zusätzlich 1.000 Antworten | 10 | 8,806 ms | 117,440 ms | 443,175 ms |
| zusätzlich 1.000 Antworten | 25 | 20,065 ms | 220,846 ms | 1.060,987 ms |
| zusätzlich 1.000 Antworten | 50 | 33,878 ms | 578,306 ms | 2.199,071 ms |

**340 abgeschlossene Runden, 3.400 neue Antworten, 85.000 zusätzliche historische Antworten; keine fehlgeschlagenen Lasttransaktionen oder Deadlocks.** In insgesamt 525 Sperrstichproben keine auf Sperren wartenden Testsitzungen beobachtet; Spitzenzahl tatsächlich verbundener Testkonten jeweils 10/25/50. Stichproben schließen kurze nicht erfasste Wartephasen nicht aus. Median/P95/P99, Antwortgrößen und Stichprobenzahlen stehen in den Messdaten. Höchstens 8.733 Bytes pro vollständiger Antwortauflösung und rund 15,9 KB für den begrenzten Boot-Abruf in den beobachteten Fällen.

Physische Größe der gesamten Testdatenbank einschließlich Prüftabellen: initial 114.259.635 Bytes; nach den ersten Runden 146.724.531; nach dem Aufbau von 85.000 älteren Antworten 416.601.779; am Ende 437.081.779 Bytes. Zusätzlich sind Tabellen- und Indexgrößen je Messpunkt erhalten. Das ist ein konkreter synthetischer Wachstumsnachweis mit wiederholten Zielen, keine Hochrechnung für beliebige Konten.

Ein kompletter Rundenablauf läuft im Prüfharness in einer SQL-Transaktion ohne menschliche Pausen und ohne einzelne HTTP-Rundreisen. Die je Operation gemessene Datenbankarbeit enthält die tatsächlichen Spiel-/Auswahlfunktionen, aber weder PostgREST, TLS, Browserdarstellung noch Supabase-Netz-/Poolgrenzen. Die Prozentränge sind beschreibende Laborwerte mit kleinen Rundenstichproben. Keine zugesicherte Besucherzahl oder Produktionskapazität; keine zusätzliche Produktionsindexierung allein aus dieser Messung abgeleitet.

Die ersten Harness-Vorversuche enthielten einen unzulässigen Übersichtsparameter beziehungsweise fehlende Integer-Casts für vorbereitete pgbench-Parameter; vor der gültigen Lastreihe korrigiert, kein angenommener Erfolg aus diesen Versuchen. Sicherheits-Advisors meldeten zunächst nur ungebundene Suchpfade der synthetischen Prüffunktionen. Suchpfade festgesetzt, ein vollständiger zusätzlicher Rundenablauf zurückgerollt erfolgreich, abschließende native Advisorprüfung ohne Warnung. Größenaufnahme/RLS und verweigerte Rechte zusätzlich nativ geprüft. `plpgsql_check` ist in der verwendeten PostgreSQL-Distribution nicht verfügbar; kein erfolgreicher SQL-Lint behauptet.

## Wiederholung und spätere Aktivierung

`scripts/measure-native-capacity.mjs` akzeptiert ausschließlich einen lokalen Port und den festen Testdatenbanknamen `wissensquiz_capacity`. Vorbereitung verlangt eine leere, eigens angelegte Datenbank; eine erneute Messreihe verlangt einen frischen Prüfstand. `scripts/native-capacity.sql` enthält ausschließlich Prüfhilfen und wird niemals als Produktmigration ausgerollt.

1. Eigenen nativen PostgreSQL-Cluster ausschließlich an `127.0.0.1` starten und darin eine leere Datenbank `wissensquiz_capacity` anlegen.
2. `npm run prepare:server-content -- tmp-native-capacity/server-content` ausführen.
3. `node scripts/measure-native-capacity.mjs --phase prepare --bin <PostgreSQL-bin> --port <Testport> --content tmp-native-capacity/server-content --out tmp-native-capacity` ausführen.
4. Denselben Befehl mit `--phase measure` ausführen. Keine parallelen Builds oder anderen Lastprüfungen auf dem Prüfrechner starten. Rohprotokolle/Größen bleiben im auftragsbezogenen Ausgabeordner; dauerhaften Nachweis nach Sichtung separat sichern.
5. Eigenen Prüfcluster stoppen und anschließend eigene reproduzierbare Ausgaben nach Pfad-/Verknüpfungsprüfung entfernen.

Die drei Produktmigrationen `20261018085400_review_receipt_retention.sql`, `20261018085401_private_capacity_samples.sql` und `20261018085402_daily_capacity_capture.sql` sind ausschließlich lokal vorbereitet. Vor einer später ausdrücklich freigegebenen Veröffentlichung gemeinsam prüfen und vor dem passenden Appstand aktivieren; die dritte setzt den vorhandenen Betreiberjob voraus. Vollständige gemeinsame Veröffentlichungsprüfungen nach `AGENTS.md` bleiben erforderlich. [Offizieller Migrationsablauf](https://supabase.com/docs/guides/deployment/database-migrations).

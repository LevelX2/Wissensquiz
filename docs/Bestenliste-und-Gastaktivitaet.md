# Öffentliche Bestenliste und Gastaktivität

## Kleine Statistikprojektionen – produktiv eingerichtet am 03.10.2026

Die neue Migration `20261003085256_storage_stat_projections.sql` ersetzt das wiederholte Lesen aller privaten Spielhistorien bei Listenabfragen durch `quiz_round_contributions` und `quiz_player_totals`. Gesamtwerte, angemeldete Genre-/Stufenfilter und kombinierte Auswahl bleiben fachlich gleich. Bestehende Konten erhalten einen einmaligen Legacy-Backfill; später werden ausschließlich betroffene Rundenbeiträge geändert. Gemeinsame Rekorde prüfen nur betroffene Runden mit der bisherigen SQL-Wertung. Sound-/Anzeigeeinstellungen lösen keine Statistik-/Rekordprojektion aus.

Gleichstände, mindestens 50 Antworten für Quotenwertung, Nullrunden, Keine Ahnung, Zeitabläufe, geratene Antworten und Abschlussstatus bleiben erhalten. Vergleiche führen denselben synthetischen Stand zuerst mit den bisherigen App-/SQL-Ableitungen und danach mit Backfill bzw. Eintragsgeneration aus. Öffentliche Ausgaben bleiben auf Namen und zusammengefasste Werte beschränkt; keine privaten Fragen, Antworten, Konto-IDs oder E-Mails. Die Gastmeldungen und ihr Siebentagesvertrag ändern sich nicht.

[Abnahme und lokale Lastmessung](Speicher-und-Sync-Abnahme.md). Die Migration ist nach ausdrücklichem Auftrag produktiv angewendet; unveränderte öffentliche Spielerwerte wurden lesend nachgeprüft. [Produktionsnachweis](Speicher-und-Sync-Produktion.md). Die folgenden sichtbaren Regeln gelten weiterhin.

## Stand am 03.10.2026

Auf Nutzerauftrag ergänzt und am 03.10.2026 als Sites-Version 38 veröffentlicht. Der Nutzer hat ausdrücklich die Sichtbarkeit auch für Gäste gewählt. Migration 202610030001 live angewendet; Erfassungsbeginn 03.10.2026, 07:52:57 Uhr Europe/Berlin. Öffentliche RPCs, sieben Tagessummen und gesperrte Einzelmeldungen lesend geprüft. Private Kontospielstände bleiben geschützt. [Veröffentlichungsnachweis](Sites-Betrieb.md).

## Bestenliste registrierter Spieler

Highscores hat drei direkte Einstiege: Meine Rekorde, Bestenliste und Spielervergleich. Meine Rekorde bleibt der Standard und funktioniert offline. Die öffentliche Bestenliste startet mit der globalen Wertung Level & XP und zeigt bestätigte, nicht anonyme Quiz-Konten, auch Konten ohne abgeschlossene Runde.

Jeder Eintrag enthält Rang, Spielername, Level, Karrieretitel, gesamte XP, abgeschlossene Spiele, richtige und beantwortete Fragen sowie Trefferquote. Andere Wertungen sortieren nach abgeschlossenen Spielen, richtigen Antworten oder Trefferquote. Die Quotenrangliste verlangt mindestens 50 Antworten; eine angezeigte Quote bei weniger Antworten ist nur die persönliche Bilanz. Wiederholungen und geratene Treffer zählen mit. Zeitabläufe ohne Antwort zählen nicht als Antwort. Keine Ahnung zählt als falsche Antwort, in Rekordrunden nur vor Ablauf der Uhr. Aktive und abgebrochene Runden zählen nicht für diese Rangliste. Spiele meint hier eine abgeschlossene Quizrunde; drei Duellrunden sind entsprechend drei Runden und kein einzelnes Match.

XP und Level folgen dem [Karrierevertrag](Filmkarriere-und-XP.md). Gleiche Werte teilen einen Rang, etwa 1, 1, 3. Die Ausgabe enthält höchstens 50 Einträge pro Seite, stabil nach Rang, Name und internem Eigentümer sortiert. Gleiche Spielernamen sind möglich. Ein angemeldeter Spieler erkennt seine Zeile am Zusatz Du; Gäste erhalten keine Kontokennung. Die öffentliche Liste vergleicht immer alle Genres und Schwierigkeiten. Der weiterhin angemeldeten Konten vorbehaltene Spielervergleich bietet die bisherigen Genre-/Stufenfilter und einzelne vergleichbare Rekordergebnisse.

Die Werte stammen aus gesicherten Trainingsständen, einschließlich importierter und offline gespielter Runden. Sie sind kein unabhängig geprüfter Wettbewerb. Registrierung, Profil und Hilfe nennen den öffentlich sichtbaren Umfang. E-Mail, Benutzer-ID, Fragen, Antwortgeschichte und vollständige Spielstände werden nicht ausgegeben.

## Gastaktivität

Unter den Highscore-Ansichten stehen drei Summen für heute und die sechs vorherigen Kalendertage in Europe/Berlin: gestartete Spiele, abgeschlossene Spiele und beantwortete Fragen aus abgeschlossenen Spielen. Die Tagesliste ist aufklappbar und kennzeichnet Tage vor Erfassungsbeginn ausdrücklich als noch nicht erfasst. Null bedeutet keine gemeldete Aktivität im erfassten Zeitraum. Der erste Erfassungstag kann nur ein Teil des Tages sein; Zeitpunkt und Beginn sind sichtbar.

Gemeldet werden ausschließlich tatsächliche Starts und Abschlüsse über die Spieloberfläche, einschließlich erneutem Fehlertraining. Fortsetzen, Seitenaufrufe, Neuladen, Sicherungsimporte und Kontoübernahme liefern keine historischen Gastzählungen. Kontospiele und Duelle liefern keine Gastmeldungen. Alte Gastspiele lassen sich mangels früherer zentraler Erfassung nicht rückwirkend zählen.

Das sind Spielereignisse, keine Besucher- oder Personenzahlen. Eine Person kann mehrere Spiele und Geräte verwenden. Abschlüsse und Starts stehen jeweils am tatsächlichen Ereignistag; ein gestern gestartetes Spiel kann heute abgeschlossen werden. Deshalb ist Abschlüsse / Starts keine belastbare Abschlussquote. Eine Besucherzahl oder ein Rückkehreranteil wird nicht behauptet.

Jede Meldung enthält nur eine zufällige Rundeneventkennung, Ereignisart, Zeitpunkt und Antwort-/Trefferzähler. Die öffentliche Ereigniskennung wird separat erzeugt und entspricht nicht der privaten Runden-ID; nur der lokale Zustellbeleg kennt ihre Zuordnung. Keine Fragen, gewählten Antworten, Spielerprofile oder vollständigen Gaststände verlassen den Browser. Der Gastspielstand bleibt in IndexedDB unverändert; separate Zustellbelege liegen außerhalb von Spielständen und JSON-Sicherungen. Die lokale Warteschlange hält höchstens 100 Belege für sieben Tage, bietet einen Speicherfallback und wiederholt bei Netzrückkehr beziehungsweise alle 30 Sekunden. Eine Anfrage endet spätestens nach zehn Sekunden. Wiederholte Meldungen derselben Ereignisart/Runde verändern die Summen nicht erneut. Bei vollem Puffer, Browserbereinigung, gesperrtem Speicher und verlorenen Meldungen kann Aktivität fehlen.

Der Server akzeptiert nur Gastmeldungen, die höchstens sieben Tage alt und höchstens fünf Minuten in der Zukunft sind, mit höchstens 100 Antworten und konsistenten Trefferzahlen. Meldungen vor Server-Erfassungsbeginn werden nicht gezählt. Belege älter als acht Tage werden beim nächsten gültigen Bericht gelöscht; ohne weitere Berichte gibt es derzeit keinen eigenständigen Löschjob. Die Abfrage liefert dennoch nur die sieben aktuellen Kalendertage. Die Zähler basieren auf Browsermeldungen und können durch manipulierte Clients verfälscht werden; ein Botfilter oder anonymer Personennachweis ist nicht implementiert.

## Server und Einrichtung

[Migration 202610030001](../supabase/migrations/202610030001_public_leaderboard_guest_activity.sql) benötigt die bisherige Konten-/Ranglistengrundlage einschließlich Filmkarriere 004. Für neue Projekte alle Migrationen in Reihenfolge anwenden; bestehende Projekte nur diese neue Migration ergänzen. Die Migration ersetzt weder private Spielstände noch bisherige RPCs.

- `quiz_public_players(text, integer)`: öffentliche, begrenzte Spielersummen; Ausführung für anon und authenticated.
- `quiz_guest_activity()`: sieben öffentliche Tagessummen mit Erfassungsbeginn; Ausführung für anon und authenticated.
- `quiz_report_guest_activity(uuid, text, timestamptz, integer, integer)`: idempotente Gastmeldung; nur anon, zusätzlich Prüfung auf fehlende Kontoidentität.
- `quiz_guest_activity_events` und `quiz_guest_activity_config`: RLS aktiv, keine direkten Clientrechte und keine öffentlichen Einzelmeldungen.

Die bisherigen angemeldeten Ranglisten sowie private Saves behalten ihre Rechte. Ohne Migration zeigen App-Ansichten eine verständliche Meldung zur noch fehlenden Einrichtung. Vor einer Veröffentlichung Migration live anwenden, ihre Rechte und Rückgabeform lesend prüfen und erst danach den App-Stand veröffentlichen. Öffentlichen Sites-Zugang und Projekt-ID erhalten.

## Prüfung

208 Logik-/Persistenz-/Datenbanktests, Produktions-Build und 116 unterschiedliche Browserfälle mit gezielten abschließenden Nachprüfungen erfolgreich. Alle drei neuen Bestenlisten-/Gastfälle gegen den finalen Build erneut bestanden; mobile 320-Pixel-Ansicht mit Axe und Screenshot geprüft. Details einschließlich Prüfgrenzen stehen im [Prüfbericht](Pruefbericht.md).

Für eine feste Testkopie `dist/` nach `tmp-browser-build/port-<Port>/` kopieren und `WISSENSQUIZ_BROWSER_SNAPSHOT=1` setzen; der Port folgt `WISSENSQUIZ_BROWSER_PORT`, Ergebnisse liegen je Port getrennt. Erzeugte Paketimportberichte lassen sich über `WISSENSQUIZ_TEST_REPORT_DIR` in einen eigenen temporären Ordner lenken. Die abschließende Logikprüfung nutzte `npm test -- --maxWorkers=2`.

Lokale PGlite-Prüfung der echten Migration: öffentliche und bisherige Spielerwerte stimmen überein; anonyme Ausgabe ohne private Felder, private Saves und bisherige Spielerabfrage weiter gesperrt. Geprüft sind außerdem Rollen, sieben Kalendertage, deutsche Tagesgrenzen, unveränderliche doppelte Belege, ungültige Meldungen, Erfassungsbeginn und Belegbereinigung. Zustellung prüft Keine Ahnung, Zeitabläufe, Wiederholung, Neuladen, Speicherfallback und abgelaufene Meldungen. Ein getrennter öffentlicher SDK-Client übernimmt Gastmeldungen und öffentliche Gastabfragen ohne gespeicherte Kontoanmeldung. Angemeldete Spieler verwenden für ihre eigene Markierung den geprüften Kontoclient. Browsertests verwenden einen synthetischen Kontodienst, einschließlich separater persistenter Profile; keine Testspiele gegen echte Konten oder Gaststatistiken. Der Browserlauf startet seinen eigenen Preview-Server; bei paralleler lokaler Arbeit ist der Port über `WISSENSQUIZ_BROWSER_PORT` wählbar. Weitere Prüfergebnisse stehen im [Prüfbericht](Pruefbericht.md).

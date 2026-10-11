# Lernablauf ohne Clientkatalog

Stand: 11.10.2026. Als **Version 66 öffentlich veröffentlicht**, nativer Status `succeeded`, um 10:06:12 Uhr Europe/Berlin. Alle sieben Migrationen sowie die Metadaten und 12.787 vorbereiteten Fragendarstellungen sind in Supabase installiert. 480 Tests, 50 gezielte Browserfälle, native Datenbankprüfung, Archivvergleich und öffentliche Dateiprüfung erfolgreich. [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-11-Version-66.json).

## Auftrag und Datenfluss

Der Kontostart lädt kleine Inhaltsmetadaten und privaten Fortschritt; die unabhängigen Metadatenaufrufe erfolgen gleichzeitig. Das aktive Format verwendet `catalog: {source: "server", parts: []}`. Alte Speicherformate werden vor jedem Katalogabruf ausdrücklich abgelehnt. Keine Migration, kein neuer Altstandadapter. Der ausdrücklich freigegebene Entwicklungs-Teststand wurde vor der Veröffentlichung atomar zurückgesetzt. Anmeldung, Profil und bestehende Duelle blieben erhalten; der neue leere Stand enthält keine Katalogverweise. Andere Konten wurden nicht zurückgesetzt. [Ursache und Freigaben](Online-Spielstand-Ladefehler-2026-10-11.md).

- `quiz_game_view`: Auswahlzahlen, Filmreise-Freischaltungen, Lernübersichten und höchstens 40 Themen mit Fortsetzungscursor; keine Fragen oder Lösungen.
- `quiz_game_call`: Auswahl von bis zu zehn verschiedenen Wissenszielen und jeweils einer Variante; die zukünftige Folge bleibt privat. Eine Fragenausgabe enthält nur die aktuelle Frage, vier Antworttexte und sichere Anzeigehinweise. Korrektheit, Rückmeldungen, Namen, Quellen und Vertiefungen erscheinen mit der bestätigten Antwort.
- Serverzeit und geprüfte Zeitzone bestimmen Lernen und Tagesbegrenzung. Wiederaufnahme liefert bestätigte Antworten und die zuletzt tatsächlich ausgegebene Frage. Eine noch nicht angeforderte nächste Frage wird nicht vorab ausgegeben. Die letzte Auflösung bleibt bis zum ausdrücklichen Abschluss sichtbar; „War geraten“ bleibt möglich.
- Der Abschluss schreibt höchstens zehn kompakte Fragenfakten und Ereignisse in das private Fortschrittsprotokoll. Der unmittelbare Rückblick hält nur die aktuelle Runde im RAM. Den vorherigen Lernstand liefert der Server ausschließlich für bereits beantwortete Fragen; eine kleine, auf die Ziele dieser Runde begrenzte Abfrage liefert deren nächste Wiederholungstermine. Geschlossene Runden benötigen keine historischen Fragenkataloge.
- Zeitspiele und Duelle behalten ihre serverseitigen Abläufe. Gemeinsame Lern-/XP-Projektionen nach deren Import und nach der Proberundenübernahme erfolgen serverseitig über `quiz_game_apply`.

## Serverlast und Traffic

Inhaltsmetadaten, Filmgruppen und redaktionelle Darstellung jeder Frage werden einmal vom Betreiber vorbereitet. Kontozugriffe dekomprimieren keine Vollkataloge. Regie-/Besetzungs-/Jahresredaktion, Filmdaten und Bildnachweise gehören zur jeweiligen Frage statt zu großen JavaScript-Sammlungen.

Primärschlüssel liefern ausgegebene Fragen und Wiederholungsbelege. Ein zusätzlicher Index auf Eigentümer, Generation, Wissensziel und Ereignisposition begrenzt die Lernprojektion auf die Historie des betroffenen Ziels. Pro Antwort werden weder alle Ereignisse noch sämtliche Filmreise-Bereiche neu berechnet. Freischaltungen werden beim Abschluss projiziert und bis zum nächsten relevanten Fortschritts- oder Inhaltswechsel zwischengespeichert. Filter- und Tonänderungen erzwingen keine neue Filmreise-Berechnung. Private Fortschrittsabrufe im geöffneten Tab erfolgen inkrementell anhand der Revision. Beim ersten Öffnen wird weiterhin die private Fortschrittshistorie seitenweise geladen; sie ist kein Fragenkatalog. Für sehr lange Kontohistorien ist eine spätere weitere Begrenzung dieses Erstabrufs ein eigener Optimierungspunkt.

Identische gleichzeitige Übersichtsabfragen teilen sich eine Anfrage. Bis zu 40 Ergebnisse liegen höchstens 30 Sekunden im RAM, getrennt nach Kontoverbindung und Revision. Bei Erreichen des nächsten Wiederholungstermins beziehungsweise Rückkehr zum Tab erfolgt eine neue Abfrage. Keine dauernde Netzwerkabfrage im Hintergrund.

Antwortanfragen enthalten Rundennummer, Index, Nonce, Antwortkennung und Rate-/Keine-Ahnung-Markierung. Belege bewahren die genaue Anfrage und das ursprüngliche Ergebnis, auch bei später geänderter Rate-Markierung. Die vollständige Frage wird nicht im Beleg dupliziert; höchstens 1.000 Belege je Konto bleiben gespeichert. Eine Kontosperre innerhalb der Transaktion verhindert konkurrierende Starts und Antwort-/Einstellungsänderungen.

Bilder und der öffentliche Posterindex bleiben statische Hosting-/CDN-Dateien. Der 555.690 Bytes große unkomprimierte Index wird erst zur benötigten Filmauflösung geladen und im Tab wiederverwendet; er enthält Bildzuordnungen, keine Fragen oder Lernstände. So entstehen dafür keine laufenden Datenbankabfragen.

Das Haupt-JavaScript sank im lokalen Build von 5.884,45 kB / 1.340,19 kB gzip auf 1.042,60 kB / 280,59 kB gzip. Das ist die Paketgröße, keine zugesicherte Handy-Ladezeit und keine Mehrspieler-Lastprobe.

## Speicherung und Zugriff

Private Tabellen liegen in `quiz_game_internal`, mit RLS und entzogenen direkten Zugriffsrechten. Konto-RPCs prüfen bestätigte Kontoinhaberschaft. Anonym abrufbar sind nur Proberunden-Genres und genau zehn Proberundenfragen. Der Fragenbestand selbst bleibt öffentlich bekannt; unbekannte Fragenfolge und Serverwertung schützen Zeitspiele.

Kontospielstände bleiben ausschließlich privat online. Keine neue IndexedDB, kein Offline-Paket und keine automatische lokale Kontosicherung. Nur die ausdrücklich erlaubte Zehnerrunde darf bis zu 24 Stunden für die Kontoübernahme vorgemerkt werden. Die Proberunde lädt genau ihre zehn Fragen; ihre einfache Browserauswertung spart anonyme Schreibzugriffe.

Manuelle Sicherungen der aktuellen Fassung tragen `wissensquiz-server-save-v1` und enthalten Fortschritt, Einstellungen und kompakte Runden. Laufende private Serverrunden sind nicht enthalten. Alte Vollsicherungen werden im aktiven Kontoablauf abgelehnt. Rücksetzung/Wiederherstellung aktiviert den Ersatzstand atomar, beendet laufende Lernrunden der vorherigen Generation und projiziert importierten Lernstand auf dem Server neu.

## Betrieb und Prüfgrenzen

Vorbereitung: `npm run prepare:game-content` und `npm run prepare:question-presentations`, aus demselben geprüften Bestand wie der private Zeitrundenkatalog. SQL-Dateien liegen ignoriert unter `tmp-sync-catalog/` und `tmp-sync/`. Nach Inhaltsänderungen Metadaten und Darstellungen neu vorbereiten und installieren.

Sieben Migrationen richten Metadaten/Ansichten, Lernrunden, kanonische Fortschrittsschreibvorgänge, Fragendarstellung, Ersatzstandaktivierung den aktuellen Rundenrückblick und die eindeutige SQL-Themenbindung ein. Betreiber-Datenimporte folgen separat. Installierter Bestand: 12.787 Fragen und Darstellungen mit exakt übereinstimmenden IDs, Versionen und Inhaltsprüfwerten.

Native PostgreSQL-Abnahme: vollständige Zehnerrunde, exakte Wiederholungsbelege für Start/Antwort/Abschluss, Wiederaufnahme, Lernstände, Fehlerrunde, Rundenrückblick und Rollentrennung bestanden. Sämtliche synthetischen Konten, Runden und Antworten wurden innerhalb der Testtransaktion zurückgerollt. Der echte Test-Spielstand blieb bei dieser Prüfung unberührt.

Eine native Messprobe ergab 481 ms für die erste und 224 ms für die zweite Auswahlabfrage sowie durchschnittlich 2,44 ms je Antwort. JSON-Textgrößen in PostgreSQL: Inhaltsinformation 292 Bytes, Start 1.371 Bytes, größte Antwort 6.865 Bytes. Das sind interne Datenbankzeiten und serialisierte JSON-Größen, keine Netzwerklaufzeiten oder Lastabnahme für viele gleichzeitige Spieler.

Supabase-Advisors nach allen Migrationen: neue private RLS-Tabellen sind absichtlich ohne direkte Zugriffspolicies; freigegebene Security-Definer-RPCs prüfen Kontoinhaber beziehungsweise erlauben ausschließlich die Proberunde. Keine neue ungeschützte Tabelle oder Search-Path-Warnung. Bestehende Hinweise auf unindizierte Fremdschlüssel, ungenutzte Indizes und deaktivierten Leaked-Password-Schutz bleiben sichtbar; siehe [RLS-Linter](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [RPC-Linter](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [Fremdschlüssel](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys), [Passwortschutz](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Abnahme und Veröffentlichung: [Prüfbericht](Pruefbericht.md), [Sites-Betrieb](Sites-Betrieb.md). Kein physischer iPhone-Test oder Mehrspieler-Lasttest behauptet.


## Nachprüfung: weitere Optimierungen – 11.10.2026

Anlass: Nutzer fragt nach weiteren Prozessen für geringere Serverlast und weniger Traffic. Prüfung des aktuellen Anwendungscodes und ausschließlich lesende Abfrage der produktiven Funktionsdefinitionen; keine neue Lastmessung, keine Spielstände gelesen oder geändert. Die folgenden Punkte sind bestätigte Datenflüsse und daraus abgeleitete Optimierungsvorschläge, noch keine Umsetzung. [Unveränderte produktive SQL-Definitionen](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-11%20SQL-Definitionen%20Optimierungsnachpruefung.json).

### Höchste Priorität: Rundenabschluss und Duellsperre

**Rundenabschluss:** `finish_projection` ruft `quiz_sync_internal.project(player,target,null,true)` auf. `null` löst dort das Löschen und erneute Erzeugen der eigenen Statistikbeiträge sowie das Durchlaufen aller gespeicherten Runden aus. Die Antwortprojektion ist bereits auf ein Wissensziel begrenzt; der Abschluss ist bei den Statistikbeiträgen noch nicht auf die gerade beendete Runde begrenzt. Mit wachsender Historie steigt damit die Arbeit je Abschluss. Ziel: nur betroffene Runden-/Zielbeiträge und deren Differenz verbuchen; vollständigen Neuaufbau auf ausdrücklich notwendige Ersatzstand-/Reparaturvorgänge begrenzen. XP, Filmreise und Abzeichen nur bei relevanten Änderungen nachführen. Keine neue Altstandübernahme. Belege: `20261011072000_server_progress_writes.sql`, `20261003085256_storage_stat_projections.sql` und native Definitionen.

**Duellsperre:** `quiz_duel_lock` sperrt dieselbe Mutexzeile `id=1` für alle Konten und bereinigt global abgelaufene Duelle. Auch `quiz_duel_list` und `quiz_duel_view` durchlaufen diesen Weg. Damit können unabhängige Duellaufrufe aufeinander warten. Ziel: lesende Übersichten ohne globale Schreibsperre, Änderungen mit Sperren am betroffenen Duell beziehungsweise Konto; nur wirklich globale Zuteilungsschritte gegebenenfalls kurz zentral schützen. Fristen im betroffenen Duell weiterhin transaktional prüfen; globale Bereinigung separat und in begrenzten Paketen. Gegnerzuteilung, Slotgrenzen und gleichzeitige Antworten müssen dabei korrekt bleiben. [PostgreSQL: Wirkung von Zeilensperren](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS).

### Danach: Start, Aktualisierung und vorbereitete Ansichten

| Priorität | Bestätigter Ablauf | Sinnvolle Änderung und erwarteter Nutzen |
| --- | --- | --- |
| Hoch | `OnlineGameStore.open` lädt über `downloadDocument` alle privaten Einträge in Seiten zu 200 Datensätzen, bevor der Einstieg freigegeben wird. | Kleiner serverseitiger Startstand mit Einstellungen, Summen und laufender Runde; ältere Runden und Einzelereignisse erst bei Bedarf mit Cursor. Starttraffic und Wartezeit wachsen dann nicht mit der gesamten Historie. Kein lokaler Kontocache. |
| Hoch, zusammen mit Duellsperre | `DuelCenter` ruft im sichtbaren Übersichts-Tab alle 20 Sekunden sowie bei Fokus die Liste ab; bis zu 100 Duelle werden jeweils mit mehreren Zählabfragen pro Runde zusammengesetzt. | Aktive Duelle und Archiv trennen, kleinere Seiten, Änderungsrevision und vorbereitete Zusammenfassung; bei unverändertem Stand Intervalle verlängern, ohne offene Duelle keine dauernden Abrufe. Aktuelle Zugwechsel zeitnah sichtbar halten. |
| Mittel | Auswahl, Themen und Bereiche gruppieren den aktuellen Metadatenbestand wiederholt; `matches` läuft als Funktion pro Kandidat, Lernübersichten werden je Gruppe ergänzt. | Unveränderliche Themen-/Genre-/Zielmengen beim Betreiberimport vorbereiten und nur privaten Lernstand ergänzen. Filter als indexnutzbare SQL-Prädikate prüfen. Zuerst Ausführungspläne und realistische Messreihen vergleichen; nicht jede Gruppierung pro Antwort global neu erzeugen. |
| Mittel | Ranglistenkategorien und Ergebnisse werden beim erneuten Öffnen beziehungsweise Aktualisieren wieder abgerufen; Listen sind bereits serverseitig projiziert und begrenzt. | Kurzer Cache je Kategorie, Zeitraum und Filter; eigene Ergebnisänderungen gezielt invalidieren. Private Ansichten und `is_mine` niemals kontenübergreifend cachen. Vorhandene Begrenzungen beibehalten. |

### Nachrangige Punkte und Abnahme

Der statische Posterindex wird einmal je Tab bei Bedarf geladen. Einzelne vorbereitete Posterzuordnungen in der Fragendarstellung könnten den rund 556 kB großen unkomprimierten Gesamtindex ersparen. Dabei CDN-Dateien beibehalten und keine Datenbankabfrage je Bild einführen. Geschlossene Serverrunden halten außerdem Fragendarstellungen zusätzlich zu kompakten Fortschrittsarchiven; eine Aufbewahrungs-/Deduplizierungsregel muss aktive Runden, gültige Wiederholungsbelege und benötigte Rückblicke berücksichtigen. Die jüngsten 1.000 Belege sind bereits begrenzt. Beides hat gegenüber Abschluss, Duellsperre und Kontostart geringere Priorität.

Abnahme künftiger Änderungen: synthetische Konten mit kurzen und langen Historien, mehrere unabhängige gleichzeitig spielende Konten, Serverzeit einschließlich Wartezeit, Anfrageanzahl und Antwortbytes, Datenbankarbeit je Rundenabschluss und Sperrwartezeiten. Funktionsprüfungen für Wiederholung identischer Anfragen, Gerätewechsel, Zugwechsel und Fristablauf erhalten. Aus dieser Nachprüfung werden keine gemessenen Beschleunigungsfaktoren oder freigegebene Mehrspielerzahlen abgeleitet.

# Filmkarriere und Erfahrungspunkte

## Aktueller Betriebsvertrag – 12.10.2026

Leveldialog und Zehner-Abzeichen seit [Version 75](Veroeffentlichung-2026-10-12-Version-75.json) öffentlich verfügbar.

Lokal nachfolgend erweitert: [gemeinsames Erfolgssystem](Erfolge.md) mit fünf Stufen, zentralen Icons/Signalen, Profilübersicht und Fortschritt. [Optimierung am 12.10.2026](Erfolge.md#inkrementelle-erfolgsberechnung-und-profilabrufe--lokal-am-12102026): EXP-Gesamtstand aus der Differenz geänderter kanonischer Zielbeiträge statt erneuter Vollsumme, gespeicherte Erfolgszähler und Profilabrufe bei Bedarf. XP-Formel und Levelkurve bleiben unverändert. Dieser neue Stand ist noch nicht veröffentlicht.

Kontorunden werden serverseitig ausgewählt und ausgewertet; der Server leitet XP und Lernstände aus privaten Antwortbelegen ab. Ergebnis und Sammlung erhalten kleine vorbereitete Ansichten. Der Client lädt weder einen Vollkatalog noch eine vollständige Karrierehistorie. Führend ist [Server-Lernablauf](Server-Lernablauf-2026-10-11.md). Die folgenden XP-Regeln und Levelhürden gelten weiter; die ausdrücklich historischen Abschnitte zur früheren Speicherung und Übernahme beschreiben keinen aktuellen Speicherweg.

## Historischer Stand vom 03.10.2026: XP bei Eintragssynchronisierung

03.10.2026 lokal umgesetzt, noch nicht veröffentlicht: Karriere-XP werden weiterhin durch den bestehenden App-Replay berechnet. Die Speicher-/Ranglistenoptimierung vereinfacht sie nicht zu einem Zähler je Antwort. Tagesgrenzen, Varianten desselben Wissensziels, Erstlösung, Fehlerkorrektur, Festigung, ursprüngliche Lernstände und `career.legacyBonus` bleiben vollständig erhalten. Die kleine SQL-Projektion übernimmt bestätigte Karrierewerte nach dem bestehenden v1-Karrierevertrag; der frühere Legacy-Rückfall bleibt in der SQL-Ableitung berücksichtigt.

Antworten und Runden bleiben mit Reihenfolge und historischen Snapshots rekonstruierbar; Vollsicherungen und Wiederherstellungen bewahren Karrieregutschriften und Freischaltungen. Vergleichstests prüfen App und bisherige/neue SQL-Ergebnisse sowie Rate-Korrekturen, Tagesgrenzen und Legacybonus. [Speicher-/Sync-Abnahme](Speicher-und-Sync-Abnahme.md). Die folgenden Fachregeln ändern sich nicht.

Seit Sites-Version 36 am 02.10.2026 veröffentlicht: steigende Levelhürden, leistungsabhängige XP, fünf Karrieretitel und sichtbarer Fortschritt im Profil, in der Sammlung, auf den Hauptseiten und nach einer Runde. Spielerlevel erscheinen auch in beiden gemeinsamen Ranglisten. Karriereaufträge bleiben auf ausdrücklichen Nutzerwunsch für eine spätere Entscheidung offen.

Die [Migration 202610020004](../supabase/migrations/202610020004_film_career.sql) wurde am 02.10.2026 auf dem bestehenden Serverstand nach Migration 003 erfolgreich angewendet. Live geprüft: XP in beiden Ranglisten, neue und übertragene Karrierewerte, unveränderte Konto-Ausführung und gesperrte anonyme sowie direkte Helferrechte. Private Spielstände wurden nicht verändert. Die neue App ist im gemeinsamen Release als Version 36 veröffentlicht; [Betriebsstand](Sites-Betrieb.md).

## XP aus abgeschlossenen Runden

Alle vier Modi verwenden dieselben Karrierewerte. Aktive und abgebrochene Runden vergeben keine XP; ihre bisherigen Lernereignisse bleiben erhalten. Mehrfacher Abschluss, Neuladen und Wiederherstellen erzeugen keine zusätzlichen XP.

| Leistung | XP | Begrenzung |
| --- | ---: | --- |
| Frage beantwortet, einschließlich falsch, geraten und Keine Ahnung | 1 | Einmal je Wissensziel und lokalem Kalendertag. Zeitablauf ohne Wahl zählt nicht. |
| Sicher richtig, leicht | zusätzlich 2 | Sichere Treffer-XP einmal je Wissensziel und Tag, über alle Modi und Varianten. |
| Sicher richtig, mittel | zusätzlich 3 | Wie oben. Die Schwierigkeit der zuerst gewerteten sicheren Antwort zählt. |
| Sicher richtig, schwer oder Experte | zusätzlich 5 | Wie oben. Experte ist seit dem Preisträger-Paket frei auswählbar. |
| Erstmals sicher gelöst in einer abgeschlossenen Runde | zusätzlich 2 | Einmal je Wissensziel über die gesamte Historie. |
| Einen zuvor offenen Fehler erstmals sicher korrigiert in einer abgeschlossenen Runde | zusätzlich 4 | Einmal je Wissensziel. Frühere Fehlantworten und Zeitabläufe aller Rundenstatus können den Fehler begründen. |
| Erstmals als gefestigt durch eine sichere Antwort in einer abgeschlossenen Runde gewertet | zusätzlich 8 | Einmal je Wissensziel, nach den bestehenden Lernabständen. |

Die drei Lernboni können mit Treffer-/Antwort-XP zusammentreffen. Tagesgrenzen für Beantwortung und sicheren Treffer sind getrennt: Auf Keine Ahnung kann noch am selben Tag eine sichere Lösung folgen und die bislang nicht vergebenen sicheren Treffer-XP erhalten. Eine bereits gewertete sichere Lösung zahlt bei späteren Varianten desselben Tages nicht erneut. Geratene Treffer vergeben ausschließlich gegebenenfalls noch offene Antwort-XP. Spätere Fehler entziehen bereits verdiente XP nicht und erneuern einmalige Boni nicht.

Beispiel: zehn beantwortete Fragen, acht sichere mittlere Treffer, drei erstmals sicher gelöste Ziele und zwei erste Fehlerkorrekturen ergeben 10 + 24 + 6 + 8 = **48 XP**, sofern die jeweiligen Tagesgrenzen noch frei sind.

## Levelkurve und Karrieretitel

Für den Aufstieg von Level `L` auf `L + 1` werden `100 + 50 × (L − 1)` XP benötigt. Die gesamte Eintrittsschwelle für Level `L` beträgt `25 × (L − 1) × (L + 2)` XP.

| Aufstieg | XP für diesen Aufstieg |
| --- | ---: |
| 1 → 2 | 100 |
| 2 → 3 | 150 |
| 5 → 6 | 300 |
| 10 → 11 | 550 |
| 20 → 21 | 1.050 |

| Ab Level | Titel |
| ---: | --- |
| 1 | Kinogänger |
| 5 | Filmfan |
| 10 | Cineast |
| 20 | Filmchronist |
| 35 | Filmlegende |

Die Filmklappe wächst farblich und ab Cineast mit einem Rahmen, ab Filmchronist mit Lorbeer und ab Filmlegende mit einem zusätzlichen Sternmotiv. Der Karrieretitel beschreibt Spielerfahrung und Lernleistungen. Genre-Wissensabzeichen und Filmreise-Freischaltungen behalten ihre eigenen Fachregeln; der globale Spielerlevel schaltet keine schwierigeren Fragen frei.

## Darstellung und historische Ergebnisse (Version 75)

Desktop-Seitenleiste und kompakter Handykopf zeigen Level, Titel und Fortschrittsbalken. Profil und Sammlung ergänzen XP bis zum nächsten Level und die Gesamtsumme. Die mobile Spielansicht bleibt frei für die laufende Frage. Die Hilfe erläutert Werte, Grenzen und Titel.

Nach Abschluss zeigt die Runde ihre tatsächlichen XP mit aufklappbarer Aufschlüsselung aller fünf Bestandteile und dem damaligen Levelstand. Der Balken füllt sich; bei einer überschrittenen Levelgrenze läuft die Füllung bis zum Ende und setzt beim neuen Level an. Seit 12.10.2026 erhalten frisch abgeschlossene Runden mit einem XP-Levelaufstieg einen modalen Glückwunschdialog: neues Level und Karrieretitel, Fanfare über den bestehenden abschaltbaren Ton-/Vibrationsweg, ausdrückliche Bestätigung „Weiter zum Ergebnis“. Gleichzeitig erreichte Abzeichen und Filmreise-Freischaltungen stehen im selben Dialog. Pro Abschluss genau ein Erfolgssignal, Vorrang Level vor Abzeichen vor Freischaltung; gewöhnliche Runden behalten ihren Abschlusston. Die normale Ergebnisansicht bleibt nach der Bestätigung zugänglich, der Fokus kehrt auf ihre Überschrift zurück. Historischer Rückblick und Neuladen lösen keine erneute Feier aus. Reduzierte Bewegung deaktiviert Füllbewegung, Funken und Glühen.

Historische XP verwenden ursprüngliche Rundenfragen und die chronologische Ereignisfolge. Spätere Antworten oder Änderungen am aktuellen Fragenkatalog verändern die Belohnung einer früheren Runde nicht. Neue Runden erhalten auch im laufenden Objekt einen eigenen geklonten Inhaltssnapshot.

## Historische Umstellung bestehender Spielstände (02.10.2026)

Ohne Karrierekennung wird zunächst die ursprüngliche Erfahrung aus `10 × abgeschlossene Runden` rekonstruiert. Ein übermittelter alter XP-Zähler gilt nicht als Nachweis. Das bisherige Level und sein anteiliger Fortschritt werden in die neue Kurve übertragen; die Historie wird zusätzlich nach den neuen XP-Regeln ausgewertet.

Falls die neuen historischen XP unter dem übertragenen Mindeststand liegen, ergänzt `career: { version: 1, legacyBonus }` genau die Differenz als dauerhafte Startgutschrift. Bei höheren historischen XP wird keine Gutschrift benötigt. Wiederholte Berechnung und Sicherungsimport erhalten dieselbe Gutschrift. Beispiel: 25 alte Runden entsprechen Level 3 mit 50 Prozent Fortschritt. Der erhaltene Mindeststand ist neu 250 + 100 = **350 XP**. Die Gutschrift wird im Profil und in der Sammlung erklärt.

IndexedDB und JSON verwenden weiterhin Schema 1 mit optionaler Karrierekennung; alte Spielstände bleiben lesbar. Online-Sicherungen mit Karriere verwenden `quiz-cloud-compact-v2`. Die neue App liest weiterhin das frühere Kompaktformat v1. Ältere Apps erkennen v2 nicht und müssen aktualisiert werden, bevor sie diese Kontostände lesen können. Kontosynchronisierung sichert eine beim Lesen erfolgte Karriereumstellung einmal automatisch mit Revisionsschutz, auch wenn die normalisierten Fingerabdrücke bereits gleich aussehen.

## Gemeinsame Highscores

`quiz_players` und `quiz_rankings` liefern zusätzlich die aktuelle globale XP-Summe des gesicherten Kontostands. Dieselbe Levelkurve und dieselben Titel werden daraus im Browser berechnet. Level und Titel stehen direkt beim Namen; der Punktevergleich behält seine bisherigen Kategorien und Gleichstände.

Die zusätzliche Spielerwertung **Level & XP** sortiert absteigend nach Gesamt-XP. Gleiche XP teilen sich einen Platz; Name und interner Eigentümer halten die Reihenfolge stabil, höchstens 50 Spieler pro Seite. Genre-/Stufenfilter werden für diese globale Wertung nicht angewendet. Beim Zurückwechseln bleiben die bisherigen Filter der Treffer-/Rundenwertungen erhalten. Auch neben gefilterten Trefferwerten und vergleichbaren Rekordrunden bleibt der angezeigte Level global.

Noch nicht umgestellte Online-Stände liefern zunächst den übertragenen alten Mindeststand. Die erste neue App-Sitzung berechnet die Historie vollständig und sichert den resultierenden Karrierewert automatisch. Bestätigte Konten ohne Spielstand erscheinen ungefiltert mit 0 XP und Level 1. Die Ranglisten teilen ausschließlich Spielername und Ergebniswerte; private Spielstände, E-Mails und Konto-IDs bleiben geschützt. XP sind gespeicherte browserbasierte Trainingswerte, kein unabhängig geprüfter Wettbewerb.

## Historische Implementierung und Nachweis (03.10.2026)

Lokale Optimierung vom 03.10.2026: Eine neue Antwort in einer noch offenen Runde aktualisiert das betreffende Wissensziel, ohne die gesamte Karrierehistorie erneut abzuspielen. XP, Rekorde und Freischaltungen bleiben bis zum Abschluss unverändert. Bei rückdatierten Antworten oder einer Rate-Korrektur vor späteren Ereignissen erfolgt weiterhin der vollständige Replay. Abschluss und Sicherungsprüfung verwenden ebenfalls die vollständige Berechnung; Rekordpunkte werden dabei einmal je Runde aufsummiert. Vergleichstests prüfen identische Zustände nach beiden Wegen. Der lokale Katalog wird getrennt gespeichert; [Speichervertrag](Lernregeln.md#datenintegrität-und-sicherung).

- Berechnung und Umstellung: [career.ts](../src/career.ts); bestehende Lernregeln zentral in [learning.ts](../src/learning.ts), über engine weiterhin exportiert.
- Anzeige, Füllung und Aufstieg: [CareerProgress.tsx](../src/CareerProgress.tsx).
- Transport und Synchronisierung: [cloudCodec.ts](../src/cloudCodec.ts), [accounts.ts](../src/accounts.ts), [accountSync.ts](../src/accountSync.ts).
- Datenbankvertrag: [Migration 202610020004](../supabase/migrations/202610020004_film_career.sql). Schnelle Ereignisverknüpfung aus 003 und bestehende Zugriffsbeschränkungen erhalten.
- Prüfungen: [Prüfbericht](Pruefbericht.md), [Logiktests](../tests/career.test.ts), [Browserfälle](../tests/browser/career.spec.ts), Konten- und Ranglistentests.


## Perfekte Zehnerrunden – 12.10.2026

Der lokale erweiterte Erfolgskatalog enthält zusätzlich **100/500/1.000/5.000/10.000 EXP** als eigene Meilensteine. EXP und XP bezeichnen denselben Erfahrungswert. Aktuelles Level und Karrieretitel bleiben in der Erfolgsübersicht sichtbar; gleichzeitige Aufstiege und Lern-/Spielerfolge verwenden einen gemeinsamen Dialog und ein Signal. Keine zusätzlichen XP-Boni. [Definitionen und weitere Erfolgsreihen](Erfolge.md#filmwissen-genres-und-exp--erweiterung-am-12102026).

Version 75 vergibt Abzeichen nach 1, 10, 50 und 100 perfekten abgeschlossenen Zehnerrunden, insgesamt über alle Genres, Film-, Schauspieler- und Preisfragen sowie Spielmodi. Der lokale Nachfolgestand ergänzt 25 und ordnet diese fünf Meilensteine Bronze bis Diamant zu; führender Vertrag ist [Erfolge](Erfolge.md). Die Runden müssen nicht aufeinander folgen. Jede Runde zählt höchstens einmal und muss genau zehn verschiedene Filmfakten mit zehn gewählten, sicher richtigen Antworten enthalten. Fehler, Zeitablauf, „Keine Ahnung“, geratene Treffer, verkürzte oder abgebrochene Runden zählen nicht. Keine zusätzlichen XP-Boni und keine Änderung der Levelkurve.

Der Server führt eine private vorbereitete Zeile je qualifizierter Runde und einen Gesamtzähler. Bei Änderungen wird nur die betroffene Zehnerrunde anhand ihrer eigenen indizierten Antwortbelege geprüft; Ergebnis und Sammlung verwenden bestehende Abfragen. Keine neue RPC, kein Clientkatalog und keine vollständige Historienabfrage im normalen Abruf. Ein reiner Abzeichenbeleg (etwa bei Zeitrunden) enthält keine Lern-/XP-Aufschlüsselung; die Ergebnisansicht behandelt beide aktuellen Belegarten ausdrücklich. Bestehende aktuelle Runden werden einmal aus demselben Format abgeleitet, ohne historische Adapter oder Änderungen an Antworten, Lernständen und XP. Die Sammlung zeigt erreichte und noch gesperrte Abzeichen. Erst der aktuelle erfolgreiche Rundenabschluss darf den Dialog und den Ton auslösen; Neuladen und historischer Rückblick feiern nicht erneut. Reset/Import erneuern die Ableitung aus dem aktuellen Stand.

Die Serveransichten invalidieren ihren RAM-Cache ausdrücklich über die bestätigte Serverrevision. Der Wechsel hängt nicht davon ab, ob sich die Uhrzeit der letzten Bestätigung geändert hat; so erscheint ein neues Abzeichen sofort auch in der Sammlung.

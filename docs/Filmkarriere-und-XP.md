# Filmkarriere und Erfahrungspunkte

## Erhaltener XP-Vertrag bei Eintragssynchronisierung

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

## Darstellung und historische Ergebnisse

Desktop-Seitenleiste und kompakter Handykopf zeigen Level, Titel und Fortschrittsbalken. Profil und Sammlung ergänzen XP bis zum nächsten Level und die Gesamtsumme. Die mobile Spielansicht bleibt frei für die laufende Frage. Die Hilfe erläutert Werte, Grenzen und Titel.

Nach Abschluss zeigt die Runde ihre tatsächlichen XP mit aufklappbarer Aufschlüsselung aller fünf Bestandteile und dem damaligen Levelstand. Der Balken füllt sich; bei einer überschrittenen Levelgrenze läuft die Füllung bis zum Ende und setzt beim neuen Level an. Aufstiege erhalten eine einmalige Hervorhebung mit kurzen Funken sowie dem bestehenden abschaltbaren Ton-/Vibrationsweg. Ein gleichzeitiger Filmreise-Aufstieg behält seinen vorhandenen Erfolgsdialog und seine Fanfare. Historischer Rückblick und Neuladen lösen keine erneute Feier aus. Reduzierte Bewegung deaktiviert Füllbewegung, Funken und Glühen.

Historische XP verwenden ursprüngliche Rundenfragen und die chronologische Ereignisfolge. Spätere Antworten oder Änderungen am aktuellen Fragenkatalog verändern die Belohnung einer früheren Runde nicht. Neue Runden erhalten auch im laufenden Objekt einen eigenen geklonten Inhaltssnapshot.

## Umstellung bestehender Spielstände

Ohne Karrierekennung wird zunächst die ursprüngliche Erfahrung aus `10 × abgeschlossene Runden` rekonstruiert. Ein übermittelter alter XP-Zähler gilt nicht als Nachweis. Das bisherige Level und sein anteiliger Fortschritt werden in die neue Kurve übertragen; die Historie wird zusätzlich nach den neuen XP-Regeln ausgewertet.

Falls die neuen historischen XP unter dem übertragenen Mindeststand liegen, ergänzt `career: { version: 1, legacyBonus }` genau die Differenz als dauerhafte Startgutschrift. Bei höheren historischen XP wird keine Gutschrift benötigt. Wiederholte Berechnung und Sicherungsimport erhalten dieselbe Gutschrift. Beispiel: 25 alte Runden entsprechen Level 3 mit 50 Prozent Fortschritt. Der erhaltene Mindeststand ist neu 250 + 100 = **350 XP**. Die Gutschrift wird im Profil und in der Sammlung erklärt.

IndexedDB und JSON verwenden weiterhin Schema 1 mit optionaler Karrierekennung; alte Spielstände bleiben lesbar. Online-Sicherungen mit Karriere verwenden `quiz-cloud-compact-v2`. Die neue App liest weiterhin das frühere Kompaktformat v1. Ältere Apps erkennen v2 nicht und müssen aktualisiert werden, bevor sie diese Kontostände lesen können. Kontosynchronisierung sichert eine beim Lesen erfolgte Karriereumstellung einmal automatisch mit Revisionsschutz, auch wenn die normalisierten Fingerabdrücke bereits gleich aussehen.

## Gemeinsame Highscores

`quiz_players` und `quiz_rankings` liefern zusätzlich die aktuelle globale XP-Summe des gesicherten Kontostands. Dieselbe Levelkurve und dieselben Titel werden daraus im Browser berechnet. Level und Titel stehen direkt beim Namen; der Punktevergleich behält seine bisherigen Kategorien und Gleichstände.

Die zusätzliche Spielerwertung **Level & XP** sortiert absteigend nach Gesamt-XP. Gleiche XP teilen sich einen Platz; Name und interner Eigentümer halten die Reihenfolge stabil, höchstens 50 Spieler pro Seite. Genre-/Stufenfilter werden für diese globale Wertung nicht angewendet. Beim Zurückwechseln bleiben die bisherigen Filter der Treffer-/Rundenwertungen erhalten. Auch neben gefilterten Trefferwerten und vergleichbaren Rekordrunden bleibt der angezeigte Level global.

Noch nicht umgestellte Online-Stände liefern zunächst den übertragenen alten Mindeststand. Die erste neue App-Sitzung berechnet die Historie vollständig und sichert den resultierenden Karrierewert automatisch. Bestätigte Konten ohne Spielstand erscheinen ungefiltert mit 0 XP und Level 1. Die Ranglisten teilen ausschließlich Spielername und Ergebniswerte; private Spielstände, E-Mails und Konto-IDs bleiben geschützt. XP sind gespeicherte browserbasierte Trainingswerte, kein unabhängig geprüfter Wettbewerb.

## Implementierung und Nachweis

Lokale Optimierung vom 03.10.2026: Eine neue Antwort in einer noch offenen Runde aktualisiert das betreffende Wissensziel, ohne die gesamte Karrierehistorie erneut abzuspielen. XP, Rekorde und Freischaltungen bleiben bis zum Abschluss unverändert. Bei rückdatierten Antworten oder einer Rate-Korrektur vor späteren Ereignissen erfolgt weiterhin der vollständige Replay. Abschluss und Sicherungsprüfung verwenden ebenfalls die vollständige Berechnung; Rekordpunkte werden dabei einmal je Runde aufsummiert. Vergleichstests prüfen identische Zustände nach beiden Wegen. Der lokale Katalog wird getrennt gespeichert; [Speichervertrag](Lernregeln.md#datenintegrität-und-sicherung).

- Berechnung und Umstellung: [career.ts](../src/career.ts); bestehende Lernregeln zentral in [learning.ts](../src/learning.ts), über engine weiterhin exportiert.
- Anzeige, Füllung und Aufstieg: [CareerProgress.tsx](../src/CareerProgress.tsx).
- Transport und Synchronisierung: [cloudCodec.ts](../src/cloudCodec.ts), [accounts.ts](../src/accounts.ts), [accountSync.ts](../src/accountSync.ts).
- Datenbankvertrag: [Migration 202610020004](../supabase/migrations/202610020004_film_career.sql). Schnelle Ereignisverknüpfung aus 003 und bestehende Zugriffsbeschränkungen erhalten.
- Prüfungen: [Prüfbericht](Pruefbericht.md), [Logiktests](../tests/career.test.ts), [Browserfälle](../tests/browser/career.spec.ts), Konten- und Ranglistentests.

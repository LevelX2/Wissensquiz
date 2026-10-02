# Spielervergleich: Ladefehler am 02.10.2026

## Ursache und Nachweis

Die Rangliste enthält bestätigte Quiz-Konten unabhängig davon, ob andere Spieler gerade angemeldet sind. Ungefilterte Wertungen nach richtigen Antworten oder Runden enthalten auch Konten ohne Spielstand mit null Ergebnissen. Trefferquoten benötigen weiterhin 50 beantwortete Fragen; Genre-/Stufenfilter können Konten ohne passende abgeschlossene Runden ausschließen.

Die bisherige Funktion `quiz_players` entpackte für jede einzelne Rundenfrage erneut die gesamte Ereignisliste und suchte darin die erste passende Antwort. Diese wiederholte Verarbeitung großer JSON-Spielstände war unnötig teuer. Die Oberfläche beendete die Anfrage nach zehn Sekunden und zeigte für Zeitablauf, Sitzungsfehler, Serverfehler und ungültige Ergebnisse denselben Text „Die Spielerrangliste ist gerade nicht erreichbar“.

Lesende Prüfung im bestehenden Supabase-Projekt: Die alte Funktion konnte den eigenen Eintrag grundsätzlich liefern; der zusätzliche Lauf mit acht Sekunden Abfragegrenze endete im SQL-Editor mit „SQL query ran into an upstream timeout“. Eine reine Mengenprüfung bestätigte eine vorhandene Runden- und Antwortgeschichte; persönliche Fortschrittszahlen werden hier nicht gespeichert. Keine Namen, E-Mails, Konto-IDs oder Spielstandinhalte wurden dafür ausgegeben. Die ursprüngliche Browseranfrage des Nutzers wurde nicht mit ihrem Netzwerkprotokoll aufgezeichnet; die Live-Datenbankprüfung belegt den langsamen Abfrageweg und die vorhandene Teilnahme.

## Korrektur

[Migration 202610020003](../supabase/migrations/202610020003_fast_player_rankings.sql) entpackt die Antwortgeschichte einmal je Konto, erhält durch Ordinalität ausdrücklich das erste Ereignis je Runde/Frage und verknüpft anschließend über Konto-, Runden- und Frage-ID. Der vollständige Fragenkatalog wird nicht in die Arbeitsmenge aufgenommen. JIT-Kompilierung ist ausschließlich für diese kleine Ranglistenfunktion abgeschaltet; globale Datenbankeinstellungen bleiben erhalten.

Ein erster zurückgerollter Live-Messlauf der neuen Verknüpfung benötigte 2.558 ms. Mit den kleineren Arbeitsfeldern und ohne JIT benötigte derselbe Aufruf 932 ms (`EXPLAIN ANALYZE`, jeweiliger Einzelmesswert, keine garantierte Höchstzeit). Die getestete Migration wurde anschließend erfolgreich im bestehenden Projekt angewendet. Der lesende Nachlauf unter Rolle `authenticated` mit acht Sekunden Grenze lieferte für `correct`, `rounds` und `accuracy` jeweils einen Eintrag mit `is_mine = true`; die Antwortfelder haben die erwarteten JSON-Zahlentypen. Anonyme RPC-Ausführung und anonyme Spielstandsleserechte bleiben gesperrt, Konto-Ausführung erlaubt. Keine gespeicherten Nutzerdaten geändert.

Migration 003 enthält auch die vorbereitete Zählung von „Keine Ahnung“. Migration 002 daher im bestehenden Projekt nicht nachträglich einzeln ausführen: Sie würde die langsame Funktion wieder einsetzen. Bei einer frischen Einrichtung gelten alle Migrationen in aufsteigender Reihenfolge; 003 ist der abschließende Funktionsstand. Die App-Option „Keine Ahnung“ ist seit Sites-Version 35 ebenfalls veröffentlicht.

Lokal ergänzt die Oberfläche Hinweise zum einzigen eigenen Eintrag, zum noch leeren Kontostand, zu aktiven Filtern und zur Mindestmenge der Trefferquote. Ladezeitüberschreitung, abgelehnte Anmeldung, Serverfehler und ungültige Antwortdaten erhalten unterschiedliche Meldungen und „Erneut versuchen“. Interne Fehlertexte und private Daten werden nicht angezeigt. Diese Oberflächenänderungen sind seit Sites-Version 35 veröffentlicht; die Datenbankkorrektur wirkt bereits seit Version 34.

## Prüfungen

161 Logik-/Datenbanktests, Produktions-Build und alle 89 Browserfälle erfolgreich (78 Chromium, elf WebKit). Formatierung, Dokumentlinks und `git diff --check` geprüft. Reine testbedingte Berichtzeitstempel nach Inhaltsvergleich zurückgesetzt. Sites-App-Stand 35 veröffentlicht; keine Main-Integration.

PGlite prüft das einzige bestätigte Konto ohne Spielstand sowie eine synthetische Historie mit 600 Runden, großem irrelevantem Katalog, mehrfachen Ereignissen und fremden Runden-IDs. Bestehende Checks für Filter, 50-Antworten-Schwelle, Gleichstände, abgeschlossene Modi, Nichtwissen, Zeitabläufe, private Identitäten und kompakte Sicherungen bestehen weiter.

Browserprüfungen verwenden isolierte Profile und feste Testzeit. Neue Fälle prüfen den eigenen Nullrunden-Eintrag, Quoten-/Filterhinweise, Zeitüberschreitung, abgelehnte Anmeldung, Serverfehler und Wiederladen nach einem Fehler. Die mobile Ansicht mit 320 Pixeln ist ohne horizontalen Überlauf und ohne Axe-Befund. Keine Testspiele in realen Konten.

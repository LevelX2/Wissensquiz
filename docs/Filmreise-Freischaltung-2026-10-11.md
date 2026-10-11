# Filmreise: 50-Prozent-Freischaltung und Fragenauswahl

Stand: 11.10.2026, Umsetzung auf Nutzerauftrag. Ersetzt die eingefrorenen Schwierigkeitsschwellen und ihren Bestandsschutz.

## Freischaltung

Je Filmgenre müssen mindestens 50 Prozent der aktuellen eindeutigen Wissensziele der vorherigen Schwierigkeit sicher beantwortet sein. Aufrunden auf ganze Ziele. Mittel setzt die Leicht-Schwelle voraus, Schwer zusätzlich die Mittel-Schwelle. Schauspieler und Preisträger folgen derselben Regel bis Experte, unabhängig von Filmgenres und ohne Bekanntheitsgruppen.

Gezählt wird jedes aktuelle Ziel einmal je Bereich und Schwierigkeit aus abgeschlossenen Runden aller Modi. Wiederholungen, Varianten, geratene Treffer, falsche oder unbeantwortete Fragen sowie aktive/abgebrochene Runden bringen keinen zusätzlichen Freischaltfortschritt. Spätere Fehler löschen frühere sichere Treffer nicht. Entfernte Ziele zählen nicht mehr; Ergänzungen erhöhen gegebenenfalls den Nenner. Alte Kurzfreigaben umgehen die Berechnung nicht. Antworten, Lerntermine, XP und Rundenergebnisse bleiben erhalten; die gespeicherten Schwierigkeitsfreigaben werden neu projiziert.

Abenteuer: aktuell 203 leichte Ziele → Mittel ab **102**; 387 mittlere Ziele → Schwer ab **194**, zusätzlich muss Mittel geöffnet sein. Die bisherige 2/2-Regel war für den stark gewachsenen Bestand ungeeignet.

Filmgruppen bleiben unabhängig: ihre bestehenden leichten Zielmengen öffnen die nächste vorhandene Gruppe. Alle dafür benötigten Ziele sind im aktuellen Bestand vorhanden. Das Öffnen höherer Schwierigkeiten ist dafür keine Voraussetzung; die 50-Prozent-Regel kann über alle Filmgruppen erfüllt werden. Bestehende Filmgruppenrechte bleiben erhalten. Der Startplan enthält nur noch diese Gruppenregeln, keine Schwierigkeitsschwellen.

## Auswahl neuer Ziele

Der Server begrenzt zuerst den Pool durch Auswahl und aktuelle Freigaben. Für jeden neuen Platz zieht er gleichwahrscheinlich eine Schwierigkeit mit noch ungesehenen geeigneten Zielen, dann gleichwahrscheinlich ein Ziel darin, zuletzt eine passende Variante. Bei zwei verfügbaren Stufen jeweils 50 Prozent, bei drei je ein Drittel. Keine feste Quote je kurzer Runde. Ein Ziel mit Varianten in mehreren Stufen erscheint trotzdem höchstens einmal pro Runde. Leere Stufen nehmen nicht an der Ziehung teil. Der bisherige Vorrang frisch geöffneter Etappen entfällt.

Bei ausreichendem Bestand weiterhin vier fällige Wiederholungen und sechs neue Ziele. Fehlende Wiederholungen werden durch neue Ziele ergänzt; fehlen neue Ziele, kommen weitere fällige und danach bekannte Ziele hinzu. Fällige Wiederholungen werden nicht nach Schwierigkeit gleichverteilt. Freies Spiel und Rekordmodi behalten ihre eigenen Auswahlregeln. Mehrere Genres/Bereiche teilen den Pool; keine feste Genrequote.

## Betrieb und Grenzen

Private SQL-Funktionen berechnen Freigaben aus vorbereiteten aktuellen Zielmengen und inkrementell gepflegten sicheren Zielen. Auswahl bleibt auf dem Server; kein Vollkatalogabruf beim Kontostart, keine neue Clientablage und keine historischen Kataloge. Die lokale Proberunden-/Prüflogik folgt denselben Regeln. Datenbankänderung: `20261011135954_journey_half_progress_and_balanced_new_questions.sql`. Bestehende Caches werden verworfen; die normale Revision informiert weitere Geräte über neu projizierte Freigaben. Bereits laufende Runden behalten ihre beim Start gezogene Folge, neue Starts verwenden die neue Regel.

[Prüfnachweis](Pruefbericht.md), [Modusvertrag](Spielmodi-und-Bekanntheit.md).

Die bestehende Freischaltfeier erhält beim Serverabschluss wieder ihre achtteilige Fanfare statt des normalen Abschlusssignals. Nach Schließen des Dialogs geht der Tastaturfokus in die Ergebnisansicht zurück.

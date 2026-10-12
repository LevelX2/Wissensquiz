# Filmreise: 50-Prozent-Freischaltung und Fragenauswahl

Stand: 12.10.2026, Umsetzung auf Nutzerauftrag. Ersetzt die eingefrorenen Schwierigkeitsschwellen und ihren Bestandsschutz.

## Freischaltung

Je Filmgenre müssen mindestens 50 Prozent der aktuellen eindeutigen Wissensziele der vorherigen Schwierigkeit sicher beantwortet sein. Aufrunden auf ganze Ziele. Mittel setzt die Leicht-Schwelle voraus, Schwer zusätzlich die Mittel-Schwelle. Schauspieler und Preisträger folgen derselben Regel bis Experte, unabhängig von Filmgenres und ohne Bekanntheitsgruppen.

Gezählt wird jedes aktuelle Ziel einmal je Bereich und Schwierigkeit aus abgeschlossenen Runden aller Modi. Wiederholungen, Varianten, geratene Treffer, falsche oder unbeantwortete Fragen sowie aktive/abgebrochene Runden bringen keinen zusätzlichen Freischaltfortschritt. Spätere Fehler löschen frühere sichere Treffer nicht. Entfernte Ziele zählen nicht mehr; Ergänzungen erhöhen gegebenenfalls den Nenner. Alte Kurzfreigaben umgehen die Berechnung nicht. Antworten, Lerntermine, XP und Rundenergebnisse bleiben erhalten; die gespeicherten Schwierigkeitsfreigaben werden neu projiziert.

Abenteuer: aktuell 203 leichte Ziele → Mittel ab **102**; 387 mittlere Ziele → Schwer ab **194**, zusätzlich muss Mittel geöffnet sein. Die bisherige 2/2-Regel war für den stark gewachsenen Bestand ungeeignet.

Filmgruppen folgen ebenfalls 50 Prozent: Die nächste vorhandene Gruppe eines Genres öffnet ab der aufgerundeten Hälfte **aller aktuellen leichten Wissensziele der vorherigen Gruppe**. Varianten zählen einmal. Die Gruppen öffnen nacheinander; leere Gruppen werden übersprungen. Höhere Schwierigkeiten sind dafür keine Voraussetzung. Abenteuer Gruppe 1: 15 leichte Ziele → Gruppe 2 ab **8** sicheren Zielen. Feste Anker-IDs und gespeicherte frühere Gruppenrechte sind keine Berechnungsgrundlage mehr. Ergänzungen und entfernte Ziele wirken auf Nenner und Zähler; Antworten und Lernstände bleiben erhalten. `src/journeyCurriculum.json` und die private Curriculumtabelle sind entfernt.

## Gesamtanzeige auf der Startkarte – 12.10.2026

Auf Nutzerauftrag zeigt die Filmreise-Karte den **gesamten aktuellen Fragenbestand** über alle Filmgenres, Schauspieler und Preisträger: den Anteil kennengelernter Wissensziele als Prozentkreis. Die zunächst vorgeschlagene zweite Zeile für gefestigte und unentdeckte Ziele entfällt auf ausdrücklichen Nutzerwunsch. Die Auswahl eines Genres oder Fragenbereichs verändert diesen Überblick nicht. Varianten zählen einmal. Kennengelernt bedeutet mindestens eine Lernbegegnung, auch bei einer falschen Antwort; es bedeutet weder sicher gewusst noch gefestigt. Der Kreis bildet den Anteil kennengelernter Ziele am gesamten aktuellen Bestand ab, nicht die gewichteten Lernstufen und nicht eine Freischaltschwelle. Prozentzahl mit bis zu zwei Nachkommastellen; beispielsweise 19 von 12.222 → 0,16 %. Die Darstellung ist auch bei 320 Pixeln Breite geprüft.

Die bisherige Auswahl der nächstliegenden einzelnen Genre-Etappe ist aus der Startkarte entfernt; die zugehörige Auswahlfunktion entfällt. Genaue Freischaltungen stehen weiterhin unter „Deine Stufenfortschritte“. Dort werden bei Filmgruppen der vollständige leichte Zielbestand und die benötigte Hälfte getrennt genannt. Beispiel: Martial Arts & Asia-Film besitzt in Gruppe 1 sechs leichte Ziele, Gruppe 2 benötigt drei; Abenteuer 15/8. Schwierigkeitsschwellen werden als benötigte Ziele beschriftet. Die Freischaltregeln bleiben unverändert.

Der Client verwendet die vorhandene globale Serveransicht `summary`, dieselbe wie das Profil. Sie liefert nur aggregierte Zähler und verwendet den bestehenden Cache im Arbeitsspeicher je Konto und Revision. Kein Fragenkatalog, keine Speicherung im Browser, keine neue Backendmigration. Lade- und Fehlerzustände zeigen keine erfundenen Nullstände.

[Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-12%20Nutzerauftrag%20Filmreise%20Gesamtanzeige.txt).

## Auswahl neuer Ziele

Der Server begrenzt zuerst den Pool durch Auswahl und aktuelle Freigaben. Für jeden neuen Platz zieht er gleichwahrscheinlich eine Schwierigkeit mit noch ungesehenen geeigneten Zielen, dann gleichwahrscheinlich ein Ziel darin, zuletzt eine passende Variante. Bei zwei verfügbaren Stufen jeweils 50 Prozent, bei drei je ein Drittel. Keine feste Quote je kurzer Runde. Ein Ziel mit Varianten in mehreren Stufen erscheint trotzdem höchstens einmal pro Runde. Leere Stufen nehmen nicht an der Ziehung teil. Der bisherige Vorrang frisch geöffneter Etappen entfällt.

Bei ausreichendem Bestand weiterhin vier fällige Wiederholungen und sechs neue Ziele. Fehlende Wiederholungen werden durch neue Ziele ergänzt; fehlen neue Ziele, kommen weitere fällige und danach bekannte Ziele hinzu. Fällige Wiederholungen werden nicht nach Schwierigkeit gleichverteilt. Freies Spiel und Rekordmodi behalten ihre eigenen Auswahlregeln. Mehrere Genres/Bereiche teilen den Pool; keine feste Genrequote.

## Betrieb und Grenzen

Private SQL-Funktionen berechnen Freigaben aus vorbereiteten aktuellen Zielmengen und inkrementell gepflegten sicheren Zielen. Auswahl bleibt auf dem Server; kein Vollkatalogabruf beim Kontostart, keine neue Clientablage und keine historischen Kataloge. Die lokale Proberunden-/Prüflogik folgt denselben Regeln. Datenbankänderungen: `20261011135954_journey_half_progress_and_balanced_new_questions.sql` für Schwierigkeiten und Auswahl sowie `20261011201651_journey_group_half_current_goals.sql` für Filmgruppen. Deren aktuelle leichte Zielmengen werden bei Inhaltsaktivierung in der privaten Tabelle `film_group_goals` vorbereitet; Kontoabfragen lesen diese kleinen Mengen und den bestehenden Cache. Kein Fragenbestand wird für jede Berechnung neu durchsucht. Bestehende Caches werden verworfen; die normale Revision informiert weitere Geräte über neu projizierte Freigaben. Bereits laufende Runden behalten ihre beim Start gezogene Folge, neue Starts verwenden die neue Regel.

[Prüfnachweis](Pruefbericht.md), [Modusvertrag](Spielmodi-und-Bekanntheit.md).

Die bestehende Freischaltfeier erhält beim Serverabschluss wieder ihre achtteilige Fanfare statt des normalen Abschlusssignals. Nach Schließen des Dialogs geht der Tastaturfokus in die Ergebnisansicht zurück.

Schwierigkeiten und Fragenauswahl seit Sites-Version 69 am 11.10.2026 um 16:18:29 Uhr Europe/Berlin produktiv. Filmgruppen seit **Version 70 am 11.10.2026 um 22:24:51 Uhr Europe/Berlin**. [Quelle, Checks und Live-Nachweis 69](Veroeffentlichung-2026-10-11-Version-69.json), [Nachweis 70](Veroeffentlichung-2026-10-11-Version-70.json).

## Prüfung der Fragenauswahl am 11.10.2026

**Folgeauftrag lokal umgesetzt, noch nicht veröffentlicht:** Die unten festgehaltenen Befunde beschreiben den geprüften Ausgangsstand. Wiederholen ist inzwischen auf alle gewählten Fragenbereiche erweitert; richtig beantwortete, noch nicht fällige Ziele werden in Filmreise und Freiem Spiel bei Alternativen für 24 Stunden zurückgestellt. Die stufenübergreifende Zielchance und die Viererquote für fällige Filmreiseziele bleiben unverändert. [Aktueller Vertrag](Wiederholungen-und-Lernstufen-2026-10-10.md#alle-fragenbereiche-und-24-stunden-abstand--11102026).

Auf Nutzerfrage die aktuellen Auswahlpfade für Filmreise, Wiederholen, Freies Spiel, Solo-Rekorde, Duelle und Proberunde gelesen und gezielt geprüft. Die folgenden Bewertungen sind eine Code- und Vertragsprüfung des lokalen Main-Stands, keine erneute Prüfung der produktiven Datenbank und keine neue Freigabe geänderter Spielregeln.

### Tatsächliche Auswahl je Zweck

| Modus | Auswahl | Bewertung und Grenze |
| --- | --- | --- |
| Filmreise | Gemeinsamer freigeschalteter Pool; bis zu vier älteste fällige Ziele, danach neue Ziele nach Schwierigkeit → Ziel → Variante, anschließend weitere fällige und bekannte Ziele; abschließend Reihenfolge mischen. | Passend zum Entdecken mit Festigung. Keine feste Stufenquote einer kurzen Runde, keine Genre-/Bereichsquote und keine Obergrenze je Film. |
| Wiederholen | Bis zu zehn bereits bearbeitete, fällige Filmziele; älteste gespeicherte Fälligkeit zuerst, zufällige passende Variante. Keine Auffüllung mit neuen Zielen. | Passend zum Aufholen fälliger Filmziele. Personen-/Preisziele werden trotz gemeinsamer Lernintervalle ausgeschlossen. |
| Freies Spiel | Gleichwahrscheinlich eindeutige passende Ziele, dann jeweils eine zufällige Variante; unabhängig vom Lernstand. | Passend zum freien Zufallsspiel. Keine Vermeidung der vorherigen Runde und keine gleichmäßige Verteilung auf Genres oder Stufen. |
| Solo-Rekorde | Server mischt eindeutige Ziele nach Stufen in Blöcken von 3 leicht / 4 mittel / 3 schwer; Restmengen nach Ausschöpfung einzelner Stufen. Keine Zielwiederholung innerhalb eines Pooldurchgangs. | Vergleichbarer grober Schwierigkeitsmix. Gleichnamige Schwierigkeitsstufen sind keine empirisch kalibrierten gleich schweren Fragen; Thema, Film und konkrete Frage bleiben Glücksfaktoren zwischen Läufen. |
| Duelle | Drei Blöcke mit je 3/4/3, insgesamt 30 verschiedene Ziele; Genres streuen, Bekanntheitsgruppen 1/2 innerhalb der Genreauswahl stärker gewichten. Beide erhalten exakt denselben eingefrorenen Satz und dieselbe Folge. | Besonders passend für den direkten Vergleich. Keine Obergrenze je Film. |
| Proberunde | Zehn verschiedene Filmziele aus leicht/mittel, optional einem Genre; Ziel und Variante zufällig. | Passend zum Ausprobieren; kein garantierter leichter Einstieg oder fester Leicht-/Mittelanteil. |

Lernrunden wählen ihre gesamte Folge beim Start. Der nächste Klick zieht keine neue unabhängige Frage, sondern gibt den nächsten gespeicherten Eintrag aus. Neu laden würfelt eine aktive Lernrunde nicht neu. Solo-Zeitläufe verwalten einen privaten Serverpool, Duelle frieren alle drei Blöcke ein. Antwortreihenfolgen werden ebenfalls gemischt; lokale Logik verwendet Fisher–Yates, die SQL-Auswahl zufällige Sortierungen und Indexziehungen.

### Belegter Sonderfall: Ziele auf mehreren Schwierigkeiten

Die Aussage „Varianten geben keine zusätzlichen Lose“ gilt für neue Filmreiseziele innerhalb einer Schwierigkeit. Sie gilt nicht uneingeschränkt über mehrere Schwierigkeiten: Ein gemeinsames Ziel steht in jeder passenden Stufenmenge und kann darüber erreicht werden. Nach der Ziehung wird es aus allen Mengen entfernt; innerhalb der Runde bleibt es eindeutig.

Für den ersten neuen Platz und D verfügbare Schwierigkeiten ist die Chance eines Ziels die Summe von `1 / (D × Zielzahl der Stufe)` über alle Stufen, in denen es vorkommt. Bei zwei Stufen mit je zwei Zielen, davon einem gemeinsamen Ziel, hat das gemeinsame Ziel 50 Prozent, die beiden anderen je 25 Prozent. Zusätzliche Varianten innerhalb derselben Stufe ändern diese Zielchance nicht. Das ist eine Grenze des hierarchischen Auswahlvertrags und widerspricht der uneingeschränkten Formulierung im SQL-Kommentar, stufenübergreifende Varianten gäben keine zusätzlichen Lose.

Vollständigen lokalen Betreiberbestand über `packages` und `addPackages` im Speicher aufgebaut: **12.787 Fragen, 12.222 Ziele, davon 33 Ziele auf mehreren Schwierigkeiten und 83 Ziele in mehreren Fragenbereichen**. Beispiele: `K-SF-021-truman-darsteller` (leicht/mittel), `K-ACT-06-zug-beschleunigen` (mittel/schwer), `K-DRA-07-01` (leicht/schwer). Welche dieser Varianten an einem konkreten Start teilnehmen, bestimmen Filter und Freischaltungen. Bereichsübergreifende Ziele zählen gemeinsam und werden nicht doppelt gezogen. Keine Veröffentlichung eines veränderten Katalogs durch diese Auswertung.

### Zweckgrenzen und mögliche Folgeentscheidungen

- Filmreise reserviert bei reichlich neuem Stoff vier Wiederholungsplätze, auch bei großem Rückstand. Eine einzelne Runde baut dann höchstens vier alte Fälligkeiten ab; langfristige Beherrschung des gesamten Bestands folgt daraus nicht automatisch. Ein vom Rückstand abhängiger Anteil wäre eine fachliche Änderung. Der bestehende Modus Wiederholen dient bereits zum gezielten Aufholen.
- Personen-/Preisziele besitzen Lerntermine, aber keinen entsprechenden reinen Wiederholungszugang. Für einen bereichsübergreifenden Lernanspruch ist das die wichtigste funktionale Lücke; für den ausdrücklich definierten Filmwiederholungsmodus entspricht es dem Vertrag.
- Gleiche Zielchancen sind keine gleichen Chancen je Film, Genre oder Bereich. Größere Zielmengen erhalten mehr Plätze. Eine Begrenzung je Film oder eine Streuung über Genres könnte abwechslungsreichere kurze Runden erzeugen, müsste aber gegen gezieltes Filmwissen und den bestehenden Gesamtpoolvertrag abgewogen werden.
- Für die 33 stufenübergreifenden Ziele müsste bei einem Folgeauftrag entschieden werden, ob die höhere Gesamtchance akzeptiert und präzise dokumentiert wird oder jedes neue Ziel vor der Stufenziehung genau einer zulässigen Stufe zugeordnet wird. Letzteres verändert den Auswahlvertrag und wurde durch diese Prüfung nicht umgesetzt.

### Nachweis und Grenzen

**67 Tests in sieben Dateien erfolgreich:** `discovery`, `server-learning`, `error-training`, `ranked-runs`, `duels`, `filters`, `question-sources`. Darunter synthetische ungleiche Stufenmengen, vier reservierte Fälligkeiten, Eindeutigkeit gemeinsamer Ziele, feste Rekordmischung und gemeinsame Duellfolgen. Bestehende Gleichverteilungstests prüfen Stufensummen, nicht gleiche Gesamtchancen stufenübergreifender Ziele. Kein Browserlauf oder neuer Build erforderlich, da ausschließlich Wissen gepflegt wurde. Temporäres Auswertungsskript nach Abschluss entfernt.

Führende Implementierung: [Lernauswahl auf dem Server](../supabase/migrations/20261011135954_journey_half_progress_and_balanced_new_questions.sql), [lokale Auswahllogik](../src/engine.ts), [Wiederholungstermine und Lernserver](../supabase/migrations/20261011071000_server_learning_runs.sql), [Solo-Pool](../supabase/migrations/20261010102411_authoritative_ranked_runs.sql), [aktueller Katalogpfad](../supabase/migrations/20261011091304_server_catalog_and_incremental_projection.sql), [Duellziehung](../supabase/migrations/20261003204000_balanced_year_answers.sql), [Proberunde](../supabase/migrations/20261011070000_server_question_views.sql).

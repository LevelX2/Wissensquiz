# Entwurf für asynchrone Filmduelle

**Historischer Entwurf vom 02.10.2026.** Der anschließende Nutzerauftrag „Ok dann leg los“ hat die Umsetzung freigegeben. Aktueller Ablauf, tatsächliche Grenzen und Betriebsstand stehen unter [Asynchrone Filmduelle](Asynchrone-Filmduelle.md). Die folgenden Vorschläge dokumentieren den Entwurfsstand vor der Umsetzung; sie sind keine aktuelle Funktionszusage.

Stand: 02.10.2026. Konzept auf Nutzerwunsch, noch nicht umgesetzt. Ausgangspunkt sind drei gemeinsame Runden mit je zehn Fragen, die zwei Menschen zeitversetzt gegeneinander spielen. Vom Nutzer anschließend festgelegt: Die einzelnen Runden müssen sich wie die vorhandenen Runden auf Zeit anfühlen und ihren Grundaufbau behalten; optische Duellakzente sind möglich. Ergänzend regt der Nutzer eine wählbare Lösungsanzeige nach jeder Frage oder nach der eigenen Runde an, sowohl im Duell als auch im Solospiel.

Empfehlung: ein eigener Modus **Duell** mit drei vertrauten Zehnerrunden auf Zeit, einem Ablauf in vier Spielblöcken und einer Gesamtwertung nach richtigen Antworten. Beide erhalten dieselben Fragen. Frageansicht, Antwortwahl, Erklärungen und Weiter-Aktion behalten den gewohnten Aufbau. Direktes Lösungsfeedback bleibt der Standard; eine Option sammelt die Lösungen bis zum Ende der eigenen Runde. Der erste Spieler legt vor, der zweite beantwortet diese Runde und legt die nächste vor. Jede Zehnerrunde lässt sich separat spielen; niemand muss zwanzig Fragen am Stück erledigen. Für die erste Fassung reichen zufällige Gegner und eine Einladung per Link, ein gemeinsamer Filmmix und eine Duellhistorie.

Die Beibehaltung des Rundenaufbaus ist eine Nutzeranforderung. Die übrigen Spielregeln, Fristen und Ausbauschritte sind Vorschläge. Bestehende Lernmodi, Rekorde und Kontoabläufe werden damit nicht geändert.

## Vertrauter Ablauf jeder Zehnerrunde

Jede Duellrunde verwendet den bestehenden Aufbau der Runde auf Zeit. Die vorhandene Spielansicht soll bei einer Umsetzung gemeinsam verwendet werden, damit Bedienung, Zugänglichkeit und Antwortfeedback nicht auseinanderlaufen.

- Eine Frage erscheint mit dem gewohnten Fragentext, Genre, Schwierigkeit und Fragenzähler. Vorhandene Anzeigeoptionen gelten weiter.
- Die bekannte 30-Sekunden-Uhr beginnt erst, wenn die Frage sichtbar und bedienbar ist. Antwortwahl, Zeitablauf und Hintergrundwechsel verhalten sich wie gewohnt.
- Die vier Antwortmöglichkeiten und „Keine Ahnung“ bleiben an ihren vertrauten Positionen und gleich bedienbar.
- Im Standard folgt nach bestätigtem Speichern unmittelbar die gewohnte Rückmeldung mit Lösung und Erklärung. „Keine Ahnung“ behält die kurze Hervorhebung der richtigen Lösung; „War geraten“, optionale Töne und Vibration bleiben erhalten. Bei gesammelter Lösungsanzeige erscheint zunächst nur die Speicherbestätigung; die Auflösung folgt nach der eigenen Runde.
- Die Erklärung hat keine Uhr. Über die gewohnte Weiter-Aktion beginnt die nächste Frage.
- Nach zehn Fragen erscheint eine eigene Rundenauswertung. Dort ergänzt die App den bereits verfügbaren Gegnervergleich und die nächste Duellaktion.

Die zusätzliche Duellanzeige bleibt kompakt: Gegnername, „Runde 2 von 3“ und gegebenenfalls der gemeinsame Zwischenstand früherer Runden. Eine andere Akzentfarbe oder kleine Duellsymbole sind möglich. Gegnereinblendungen oder Zugwechsel unterbrechen keine laufende Frage. Die asynchrone Organisation findet vor und zwischen den Zehnerrunden statt.

## Wählbare Lösungsanzeige im Duell und Solospiel

Der Nutzer schlägt die Wahl zwischen beiden Abläufen für Duell und Solospiel vor. Die folgende Ausgestaltung ist ein Vorschlag für die spätere Umsetzung. Vor dem Rundenstart steht die Auswahl **Lösungen anzeigen** mit zwei Möglichkeiten bereit:

| Auswahl          | Ablauf                                                                                                                                   | Eignung                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Nach jeder Frage | Sofortige Rückmeldung und Erklärung, anschließend die gewohnte Weiter-Aktion.                                                            | Standard für unmittelbares Lernen und ein selbst gewähltes Lesetempo.              |
| Nach der Runde   | Jede Antwort wird bestätigt. Nach der letzten Frage folgen Ergebnis und Rückblick mit allen eigenen Antworten, Lösungen und Erklärungen. | Optional für einen kompakteren Fragenblock und eine gemeinsame Auswertung am Ende. |

„Nach der Runde“ meint die eigene abgeschlossene Zehnerrunde im Duell und die tatsächliche Rundengröße im Solospiel. Niemand wartet für seine Lösungen auf den Gegner oder das Ende des gesamten Duells.

Die Option verändert weder die Zeitgrenze einer Frage noch die Möglichkeit, vor der nächsten Frage zu pausieren. Auch ohne Erklärung wird die nächste Frage erst über die Weiter-Aktion gestartet. Ein durchgehender Timer über den ganzen Block ist eine andere Regel und wird durch diese Option nicht eingeführt. In Solomodi ohne Uhr entsteht dadurch kein Zeitlimit.

Bei gesammelter Lösungsanzeige verraten weder Antwortfarben noch Richtig-/Falsch-Töne, laufende Punkte, Filmdaten oder Fragehinweise die Auflösung vor dem eigenen Rundenende. Rate-Kennzeichnung und Lernwirkung müssen in beiden Varianten erhalten bleiben; für die gesammelte Anzeige ist die Bedienung der Rate-Kennzeichnung vor Umsetzung gesondert festzulegen, ohne vorzeitige Trefferhinweise.

Für ein Duell empfehle ich dieselbe Auswahl für beide Spieler. Die Rückmeldung früherer Fragen kann spätere Antworten beeinflussen; ein gemeinsamer Ablauf hält die Bedingungen vergleichbar. Der Ersteller legt die Auswahl vor der ersten Frage fest, und sie gehört zur Paarung sowie zum gespeicherten Duellvertrag. Eine laufende Begegnung wechselt die Regel nicht. Im Solospiel entscheidet jeder vor seiner Runde selbst. Auch bei persönlichen Rekorden ist die Anzeigevariante als Vergleichsmerkmal zu berücksichtigen.

## Ablauf mit drei Runden

| Spielblock | Spieler A                                                             | Spieler B                                                                    | Gemeinsamer Stand                                       |
| ---------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1          | Spielt die zehn Fragen von Runde 1 und eröffnet eine Herausforderung. | Noch nicht zugeordnet.                                                       | Herausforderung sucht einen Gegner.                     |
| 2          | Wartet.                                                               | Wird zugeordnet, beantwortet Runde 1 und kann anschließend Runde 2 vorlegen. | Runde 1 ist vergleichbar, Runde 2 wartet auf A.         |
| 3          | Beantwortet Runde 2 und kann anschließend Runde 3 vorlegen.           | Wartet.                                                                      | Runden 1 und 2 sind vergleichbar, Runde 3 wartet auf B. |
| 4          | Wartet.                                                               | Beantwortet Runde 3.                                                         | Endergebnis aus allen 30 Fragen.                        |

So entstehen vier Spielblöcke mit 10 → 20 → 20 → 10 Fragen statt sechs einzelner Wechsel. Nach jeder Zehnerrunde gibt es eine Pause und eine ausdrückliche Aktion für die nächste Runde. Eine bereits vorbereitete nächste Runde beginnt nicht automatisch.

Wer „Zufälligen Gegner finden“ wählt, übernimmt bevorzugt eine passende offene Herausforderung und wird Spieler B. Nur wenn keine vorhanden ist, startet er selbst als Spieler A. Er beantwortet dann sofort die ersten zehn Fragen; die Suche läuft anschließend ohne geöffneten Browser weiter. Die App erklärt vor Beginn, welche Rolle er übernimmt.

Das erste Vorlegen kann bereits vor der Paarung erfolgen. Eine Einladung bindet dieselbe Herausforderung an einen teilbaren Link. Ein Konto kann sie genau einmal annehmen, der Ersteller selbst kann sie nicht übernehmen. Einladung und Zufallssuche sind getrennte Wege: Einladungen wechseln ohne ausdrückliche Wahl des Erstellers nicht in den öffentlichen Pool.

## Wertung und Endergebnis

Jede richtige Antwort zählt einen Duellpunkt. Falsch, „Keine Ahnung“ und Zeitablauf zählen null. Eine nachträgliche Kennzeichnung als geraten betrifft ausschließlich den persönlichen Lernstand. Sie verändert keine bestätigte Duellantwort und keinen Duellpunkt.

**Die Summe aus allen 30 Antworten entscheidet.** Runde 1, 2 und 3 liefern Zwischenstände, aber keine zusätzlichen Siegboni. Damit entscheidet jede Frage gleich viel. Wer in einer Runde deutlich besser ist, verliert diesen Vorsprung nicht durch eine knappe Niederlage in zwei anderen Runden.

| Runde  |        Du |    Gegner |
| ------ | --------: | --------: |
| 1      |      8/10 |      6/10 |
| 2      |      5/10 |      8/10 |
| 3      |      9/10 |      7/10 |
| Gesamt | **22/30** | **21/30** |

Das Ergebnis lautet „Du gewinnst 22 : 21“. Bei gleicher Trefferzahl steht ein Unentschieden. Für die erste Fassung gibt es keinen Zeitbonus und keinen automatischen Stichentscheid. Das reduziert den Einfluss von Gerät, Bediengeschwindigkeit und Verbindung. Ein optionales Entscheidungsspiel mit neuen gemeinsamen Fragen wäre später ein eigener, ausdrücklich angenommener Zusatz.

Die **30 Sekunden pro Frage** und die gewohnte Bedienung bleiben erhalten. Der bisherige Wertungsvorschlag zählt richtige Antworten ohne Zeitbonus; das ist eine gesonderte Duellwertung und keine Änderung des Rundenaufbaus. Erklärungen und die Zeit vor der nächsten Frage haben keine Uhr. Während einer sichtbaren, bedienbaren Frage läuft ihre Zeit auch beim Tabwechsel weiter. Ein entspannter Modus ohne Uhr wäre später eine getrennte Spielvariante.

## Gleiche Fragen und faire Anzeige

Beim Eröffnen werden alle drei Runden mit insgesamt 30 unterschiedlichen Wissenszielen auf dem Server festgelegt. Beide spielen dieselbe konkrete Variante, Inhaltsversion, Fragenfolge, Antwortauswahl und Antwortreihenfolge. Auch die zufälligen falschen Jahresalternativen werden einmal erzeugt und gemeinsam eingefroren. Spätere Inhaltsänderungen verändern das laufende Duell nicht. Die App erhält jeweils nur die nächste freigegebene Frage, keine Vorschau auf spätere Duellfragen.

Die Auswahl verwendet ausschließlich den veröffentlichten gemeinsamen Fragenbestand. Eigene CSV-Importe und der persönliche Lernstand bestimmen keine Duellfragen. Individuelle Freischaltungen begrenzen diesen freien Modus nicht. Varianten eines Wissensziels dürfen innerhalb der gesamten Begegnung nicht doppelt vorkommen.

Für den Start empfehle ich einen festen **Filmmix** mit ausgewogener Genreverteilung und pro Runde drei leichten, vier mittleren und drei schweren Fragen. Film-Ikonen und bekannte Filme sollten überwiegen. Die genaue Bekanntheitsmischung ist vor Umsetzung redaktionell festzulegen; die vorhandenen Gruppen sind Einschätzungen, keine gemessene persönliche Bekanntheit. Zu viele Fragen zum selben Film sollen vermieden werden. Kann der gemeinsame Bestand die vereinbarte Mischung nicht liefern, wird das Duell nicht mit still geänderten Regeln gestartet.

Der aktuelle Gegnerpunktestand dieser Runde bleibt verborgen, bis beide ihre zehn Antworten abgegeben haben. Eine fertige frühere Runde bleibt als gemeinsamer Zwischenstand sichtbar. Die eigene Antwort erhält im Standard sofort die übliche Rückmeldung mit Lösung, Erklärung, Filmdaten und Fragenstatistik entsprechend den vorhandenen Anzeigeoptionen. Bei „Nach der Runde“ folgen diese Inhalte nach den eigenen zehn Fragen. Die eigene Rundenauswertung und der Rückblick sind dann verfügbar, auch wenn der Gegner noch nicht gespielt hat.

Die Lösungsanzeige richtet sich nach der gewählten Option und dem eigenen Spielablauf. Warten auf den Gegner betrifft ausschließlich die gemeinsame Wertung und den nächsten Zug; es verzögert weder die eigenen Lösungen über das eigene Rundenende hinaus noch die eigene Lernwirkung.

Die App gibt keine Lösungen oder Einzelantworten des Gegners vor dessen Abschluss weiter. Bereits gezeigte eigene Lösungen könnten außerhalb der App weitergegeben werden. Das Konzept setzt beim Freizeitduell auf Fairplay; Nachschlagen im bereits verfügbaren Katalog bleibt ebenfalls möglich.

## Paarung bei wenigen und vielen Spielern

Die erste Fassung benötigt nur einen öffentlichen Filmmix-Pool. Viele Genre-, Zeit- und Schwierigkeitskombinationen würden bei wenigen aktiven Menschen zu leeren Warteschlangen führen. Für direkte Einladungen können später frei vereinbarte Genres hinzukommen.

Die Zuordnung nimmt zunächst die älteste passende offene Herausforderung. Beitritt und Reservierung passieren in einem gemeinsamen serverseitigen Schritt: Bei zwei gleichzeitigen Interessenten kann nur einer dieselbe Herausforderung erhalten. Eine Herausforderung wird genau einer Begegnung zugeordnet und nicht mehrfach gegen wechselnde Gegner ausgewertet.

Als Anfangsgrenze schlage ich **höchstens fünf offene Spiele insgesamt pro Konto** vor. Dazu zählen angenommene Duelle ebenso wie noch nicht angenommene Herausforderungen. Innerhalb dieser fünf darf höchstens eine Herausforderung noch auf einen Gegner warten; sie kommt nicht als sechster Platz hinzu. Beispielsweise sind vier angenommene Duelle plus eine offene Herausforderung oder fünf angenommene Duelle möglich. Abgeschlossene, zurückgezogene oder abgelaufene Spiele belegen keinen Platz. Die gemeinsame Reservierung prüft die Grenze für beide Konten. Offene eigene Züge erscheinen vor der Aktion für ein neues Duell. Der Gegnername wird erst nach Zuordnung sichtbar, damit offene Herausforderungen nicht gezielt nach Person oder Erstresultat ausgewählt werden.

Bei wachsender Aktivität kann die Paarung ein eigenes Duell-Spielstärkenmaß berücksichtigen und den Suchbereich bei längerer Wartezeit erweitern. Die bestehenden Trainingsrekorde und Lernlevel sind dafür keine verlässliche Wettbewerbswertung. In der ersten Fassung reichen Siege, Niederlagen und Unentschieden ohne globale Duellrangliste. Automatische Gegner sind ein möglicher eigener Modus und werden immer als Computergegner gekennzeichnet.

## Fristen und abgebrochene Begegnungen

Eine noch nicht angenommene Herausforderung bleibt vorgeschlagen sieben Tage verfügbar. Danach endet sie als „Keinen Gegner gefunden“, ohne Sieg oder Niederlage. Vor Annahme darf der Ersteller sie zurücknehmen. Seine tatsächlich gespielten Antworten bleiben als persönlicher Lernbeitrag erhalten.

Nach der Paarung hat die Person am Zug **72 Stunden für ihren Spielblock**. Diese Frist beginnt mit Freigabe durch den Server, nicht erst beim nächsten Öffnen der App. Für die beiden mittleren Spielblöcke umfasst sie jeweils beide Zehnerrunden; eine Pause nach der ersten setzt die Frist nicht zurück. Die Oberfläche zeigt das konkrete Ende mit Datum und Uhrzeit.

Läuft die Frist ab, endet die Begegnung automatisch und gibt ihren Platz für beide Konten frei. Solange noch keine Runde von beiden fertig ist, lautet der Status „Nicht zustande gekommen“, ohne Sieg oder Niederlage. Sobald mindestens eine Runde gemeinsam abgeschlossen wurde, erhält der wartende Spieler einen gesondert gekennzeichneten Sieg durch Zeitablauf. Eine ausdrückliche Aufgabe folgt derselben Unterscheidung. Es wird kein erfundenes Ergebnis wie 30 : 0 eingetragen. Historie und Statistik trennen vollständig ausgespielte Ergebnisse von Aufgabe und Zeitablauf. Eigene tatsächlich gespielte Antworten und abgeschlossene Zehnerrunden behalten ihre normale Lernwirkung, auch wenn die Begegnung nicht vollständig ausgespielt wurde.

Eine Erinnerung im Duellbereich kann den nahenden Fristablauf anzeigen. E-Mail und Browser-Push sind spätere optionale Erweiterungen mit eigener Nutzereinstellung. Ein nachgewiesener allgemeiner Dienstfehler muss administrativ Fristverlängerung oder Annullierung ermöglichen; ein frei gemeldeter Verbindungsfehler darf kein Neustarten bekannter Fragen erlauben.

## Oberfläche und Einbindung des Lernens

Unter **Spielen** ergänzt „Duell“ die vorhandenen vier Modi. Es benötigt keinen sechsten Hauptpunkt. Der Einstieg bietet „Zufälligen Gegner finden“ und „Per Link einladen“. Direkt darunter stehen die eigenen Begegnungen in drei Gruppen: „Du bist dran“, „Warten“ und „Abgeschlossen“. Karten zeigen Gegner, Rundenzahl, gemeinsamen Zwischenstand, nächste Aktion und gegebenenfalls Frist.

Beispiele für sichtbare Zustände sind „Deine ersten zehn sind gespielt. Wir suchen einen Gegner“, „Runde 1 abgeschlossen. Jetzt kannst Du Runde 2 vorlegen“ und „Du bist dran: Runde 2 beantworten“. Nach einer Runde führt eine klare Aktion weiter; ein zusätzlicher Hinweis erklärt, dass man später fortsetzen kann. Nach dem Endergebnis gibt es „Revanche mit neuen Fragen“ und „Meine Fehler üben“.

Duellpunkte werden getrennt von Rekordpunkten gespeichert. Die eigenen tatsächlich bestätigten Antworten wirken ohne Warten auf den Gegner als normale Lernereignisse. Die Ereigniszeit ist die tatsächliche Spielzeit, nicht ein späterer Synchronisierungszeitpunkt. Eine vollständig selbst gespielte Zehnerrunde kann wie eine abgeschlossene Lernrunde zählen, auch wenn der Gegner später ausfällt. Ungespielte Fragen erzeugen keine Fehlereignisse. Das bloße Lesen einer Erklärung erzeugt keinen Lernfortschritt.

Jede Antwort wird über Duell, Runde, Spieler und Wissensziel eindeutig zugeordnet und höchstens einmal in den persönlichen Lernstand übernommen. Im Standard funktioniert „War geraten“ wie in der vorhandenen Runde nach einem richtigen Treffer und vor dem eigenen Rundenabschluss. Für gesammelte Lösungen muss die Rate-Kennzeichnung ohne vorzeitige Trefferhinweise möglich bleiben; die Duellwertung bleibt davon unberührt. Serverabruf, Gerätewechsel und erneutes Laden dürfen Lernereignisse oder Abschluss-XP nicht duplizieren. Bei verzögerter Synchronisierung müssen neuere persönliche Lernereignisse erhalten und der Lernzustand in der tatsächlichen Ereignisreihenfolge abgeleitet werden. Nach der eigenen Rundenauswertung steht „Meine Fehler üben“ für tatsächlich gespielte Fragen bereit.

## Technische Grundlage und Grenzen

Im aktuellen Projekt existieren bestätigte Quiz-Konten, private Supabase-Spielstände, lokale Rundensnapshots und gemeinsame Trainingsranglisten. Es gibt bisher keinen gemeinsamen Duellzustand. Die Ranglistendaten werden aus browserseitigen Antworten und Zeiten abgeleitet. Beides ist in [Konten und Spielstände](Konten-und-Spielstaende.md) dokumentiert; Auswahl, Lernwirkung und Timer stehen in [Lernregeln](Lernregeln.md) und [Spielmodi und Bekanntheit](Spielmodi-und-Bekanntheit.md).

Für Duelle wird der vorhandene Supabase-Dienst um einen eigenen gemeinsamen Spielzustand erweitert. Duellteilnahme erfordert ein bestätigtes Quiz-Konto; Gastlernen bleibt wie bisher möglich. Der persönliche Sicherungsstand wird nicht als Transportweg für gegnerische Daten verwendet. Das ist wesentlich, weil die bisherige Kontosicherung konkurrierende Geräteänderungen erkennt und keine automatische Zusammenführung bietet.

Ein Duell benötigt Teilnehmer, Regelversion, feste Fragepakete, aktuellen Spielblock, Frist, bestätigte Einzelantworten und Abschlussstatus. Serverseitige Operationen erstellen und reservieren Herausforderungen, geben jeweils die nächste erlaubte Frage frei, bestätigen Antworten und berechnen das Ergebnis. Die Datenbank prüft Konto, Zugehörigkeit, Reihenfolge, bereits verbrauchte Frage und Antwortzeit. Doppelte oder wiederholte Anfragen bestätigen denselben Zustand, statt eine zweite Antwort zu erzeugen.

Vor der eigenen Antwort liefert der Duellabruf keine Lösungsschlüssel oder Erläuterungen. Im Standard gibt der Server nach Bestätigung der eigenen Antwort das gewohnte Lösungsfeedback unmittelbar frei; bei gesammelter Anzeige nach Abschluss der eigenen Zehnerrunde. Antworten und Zwischenstände des Gegners werden erst nach den festgelegten Freigaben geliefert. Die gewählte Anzeigevariante gehört zum gespeicherten Ablauf und bleibt bei Neuladen oder Gerätewechsel erhalten. Teilnehmer können nur ihre eigenen Begegnungen abrufen; öffentliche Listen erhalten höchstens ausdrücklich vorgesehene Ergebniswerte. E-Mail, private Spielstände und Lernhistorien anderer Spieler werden nicht geteilt. Reservierung, Zugwechsel, Fristabschluss und Endabrechnung müssen auch ohne geöffnete Browser zuverlässig funktionieren.

**Der vorhandene Offlinekatalog enthält bereits Fragen und Lösungen.** Serverseitige Wertung verhindert gefälschte Punkte, geänderte Zugfolgen und doppelte Antworten; sie macht die vorhandenen Inhalte nicht geheim und verhindert keine Hilfe durch andere Geräte oder Menschen. Die erste Fassung ist deshalb ein Freizeitduell. Für einen strengeren Wettbewerb wären zusätzlich ein separater, vorher nicht ausgelieferter Fragenbestand und weitere Schutzmaßnahmen nötig. Auch das wäre keine Garantie gegen externe Hilfe.

Die vorgeschlagene erste Fassung verlangt beim Abruf und Bestätigen einer Duellfrage Internet. Der technische Startablauf muss den gewohnten Beginn der 30 Sekunden bei sichtbarer, bedienbarer Frage erhalten. Die Zeit zum Laden einer Frage und zum Lesen der Erklärung darf die Fragezeit nicht verbrauchen. Wie Anzeige, Startbestätigung und serverseitige Frist zusammenpassen, ist vor Umsetzung konkret zu entwerfen und mit Mobilverbindungen zu prüfen. Beim Verbindungsabbruch bleibt die bereits gestartete Frage verbraucht und kann ablaufen. Noch nicht gestartete Fragen werden nicht gestartet.

Nach einer unklaren Antwortbestätigung liest die App zunächst den Serverzustand zurück. Sie behauptet keinen gespeicherten Punkt ohne Bestätigung und zeigt bei Wiederaufnahme keine bereits verbrauchte Frage als neuen Versuch. Vollständig offline gespielte Duellrunden wären eine spätere bewusst weniger kontrollierte Variante, die getrennt gewertet werden müsste.

## Erste Fassung und mögliche Erweiterungen

Die erste Fassung umfasst drei vertraute Runden auf Zeit mit zehn identischen Fragen und wählbarer Lösungsanzeige, den Ablauf in vier Spielblöcken, festen Filmmix, 30 Sekunden ohne Zeitbonus, zufällige Paarung, Einladung per Link, Zugübersicht, Fristen, Ergebnis, Revanche und persönliche Lernübernahme. Dieselbe Anzeigeoption ist auch für Solorunden vorgesehen; direktes Feedback bleibt der Standard. Eine globale Duellrangliste, Chat, Push, Turniere und viele Filter bleiben für spätere Ausbauschritte.

Als zweite Ablaufvariante lohnt sich **freie Reihenfolge nach Paarung**: Beide können ihre drei Runden unabhängig in ihrem Tempo spielen. Vergleiche erscheinen jeweils erst nach beidseitigem Abschluss; das Endergebnis nach beiden dritten Runden. Diese Variante kann Begegnungen schneller abschließen und vermeidet Zugblockaden. Sie bietet weniger unmittelbares Hin und Her und sollte bei der Erstellung als eigene Ablaufregel feststehen. Eine automatische Umschaltung mitten in einer Begegnung würde den Ablauf unklar machen.

Später können beide eine Themenrunde wählen und die dritte Runde aus einem gemeinsamen Mix entstehen. Dafür muss die Auswahl abgeschlossen sein, bevor die betroffene Runde von jemandem gespielt wird. Eine Revanche wechselt den ersten Vorleger und verwendet neue Fragen, soweit genügend gemeinsame Wissensziele verfügbar sind.

## Prüfung vor einer Umsetzung

Vor Umsetzung sind insbesondere die Bekanntheitsmischung des Filmmix, die vorgeschlagenen 72 Stunden, die Duellwertung und die Rate-Kennzeichnung bei gesammelten Lösungen fachlich zu klären. Der vertraute Rundenaufbau bleibt erhalten; der Nutzer schlägt die Lösungsanzeige nach jeder Frage oder nach der eigenen Runde als Option für Duell und Solospiel vor. Der Entwurf ist eine Diskussionsgrundlage und ersetzt keine Umsetzungsfreigabe.

Für eine Umsetzung sind folgende Abnahmen erforderlich:

- Zwei isolierte Konten erhalten exakt dieselben 30 Fragensnapshots einschließlich Jahresalternativen; Inhaltsupdates verändern eine begonnene Begegnung nicht.
- Gleichzeitiger Beitritt reserviert eine Herausforderung genau einmal. Selbstpaarung, fremde Schreibzugriffe und vorzeitige Einsicht in Antworten werden abgewiesen.
- Doppelte Antwort, Tabwechsel, Neuladen, Gerätewechsel und verloren gegangene Bestätigung erzeugen keinen zweiten Versuch und keine doppelte Lernübernahme.
- Alle vier Spielblöcke, Pausen, Zwischenstände, Unentschieden, Aufgabe, Fristablauf und unangenommene Herausforderung folgen den festgelegten Regeln.
- Duell und Solospiel erhalten beide Anzeigeoptionen bei vertrautem Grundaufbau, unverändertem Timerbeginn, Antwortbedienung und Weiter-Aktion. Standardfeedback einschließlich „Keine Ahnung“ bleibt erhalten; die gesammelte Variante löst die eigenen Fragen nach der eigenen Runde auf und verrät vorher keine Treffer. Rate-Kennzeichnung bleibt möglich. Nur der Gegnervergleich wartet auf beidseitigen Abschluss.
- Onlinefehler und mobile Netzlaufzeiten werden mit kontrollierter Zeit und synthetischen Daten geprüft. Bestehende Kontosicherungen, Fehlertraining und Ranglisten bleiben kompatibel.

Diese Abnahmen wurden für den Entwurf nicht durchgeführt. Die vorhandene Implementierung wurde lesend geprüft; es wurde kein Duellcode erstellt und kein Dienst geändert.

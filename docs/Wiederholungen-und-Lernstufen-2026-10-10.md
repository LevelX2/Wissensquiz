# Wiederholungen und Lernstufen

Stand: 10.10.2026, seit Sites-Version 62 um 11:02:31 Uhr Europe/Berlin veröffentlicht. [Nachweis](Veroeffentlichung-2026-10-10-Version-62.json).

**11.10.2026 erweitert und als Version 71 um 23:00:15 Uhr Europe/Berlin veröffentlicht:** Wiederholen berücksichtigt alle gewählten Fragenbereiche. Filmreise und Freies Spiel stellen innerhalb der letzten 24 Stunden richtig beantwortete, noch nicht fällige Wissensziele zurück, solange passende Alternativen vorhanden sind. [Aktueller Auswahlvertrag](#alle-fragenbereiche-und-24-stunden-abstand--11102026), [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-11-Version-71.json).

## Befund und Entscheidung

Die ursprünglichen Bildschirmfotos zeigten unterschiedliche Grundmengen: Filmreise zählte sämtliche fälligen Ziele ihrer freigeschalteten Auswahl, Fehlertraining nur offene Fehler seiner manuellen Filter. Daher konnten 274 und 1 gleichzeitig erscheinen. Gleichlautende Beschriftungen und große Erklärkästen machten diesen Unterschied unverständlich. Der persönliche Spielstand wurde nicht ausgelesen oder verändert.

Die zuerst umgesetzte Zwischenlösung mit kompakter Filmreise-Zahl und Auswahl „Gemischt / Nur fällige Wiederholungen“ ist durch den anschließend ausdrücklich angenommenen Vorschlag abgelöst. Maßgeblich sind nun drei unterschiedliche Aufgaben:

- **Filmreise:** Entdecken und Freischalten. Bei ausreichender Auswahl sechs neue und vier fällige Ziele je Zehnerrunde; auch die erste Runde umfasst bis zu zehn Ziele. Fällige Ziele: älteste Termine zuerst. Seit 11.10.2026 werden neue Ziele gleichwahrscheinlich nach verfügbarer Schwierigkeit, dann Ziel und Variante gezogen; der frühere Vorrang frisch geöffneter Etappen entfällt. Fehlende Plätze werden mit übrigen neuen, fälligen und schließlich bekannten, noch nicht fälligen Zielen ergänzt; ältere Bearbeitungen und Ziele außerhalb der letzten drei Runden zuerst. Gelernte Fragen bleiben verfügbar. Der Modus funktioniert auch nach vollständigem Kennenlernen des Bestands. [Aktuelle Regel und Auswahlprüfung](Filmreise-Freischaltung-2026-10-11.md).
- **Wiederholen:** Ersetzt das frühere Fehlertraining. Ausschließlich bereits bearbeitete, jetzt fällige **Wissensziele aus den gewählten Film-, Schauspieler- und Preisbereichen**, auch früher sicher richtig beantwortete oder geratene. Schwierigkeitsfilter gelten für alle Bereiche; Genres, Kategorien und Filmgruppen für Filmfragen. Keine Bindung an Filmreise-Freischaltungen. Älteste Fälligkeit zuerst, je Ziel eine passende zufällige Variante. Keine neuen oder noch nicht fälligen Ziele zum Auffüllen. Weniger fällige Ziele ergeben kürzere Runden. Ohne fällige Ziele kein Start, verständlicher Hinweis und gegebenenfalls der nächste Termin direkt in der Moduskarte.
- **Freies Spiel:** Zufällige Ziele aus den gewählten Bereichen und Filtern, mit dem unten beschriebenen 24-Stunden-Abstand für richtige, noch nicht fällige Ziele. Zusätzliche Fragevarianten erhöhen die Auswahlchance eines Ziels nicht.

Alle Modi verwenden dieselben Lernereignisse und Lernintervalle. Anzeige und Auswahl verwenden `nextLearningAt`, einschließlich der lokalen Tagesgrenze. Die vorhandene technische Modus-ID `fehler` bleibt bestehen. Die frühere optionale Einstellung `learningSelection` steuert die aktuelle Auswahl nicht mehr. Manuell gewählte Fragenbereiche gelten für Filmreise, Freies Spiel und Wiederholen. Die Erweiterung vom 11.10.2026 benötigt die unten genannte Funktionsänderung in der Datenbank; keine historische Sonderlogik.

## Alle Fragenbereiche und 24-Stunden-Abstand – 11.10.2026

Auf [ausdrücklichen Folgeauftrag zur Auswahlprüfung](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-11%20Nutzerauftrag%20Wiederholen%20und%2024-Stunden-Abstand.txt) erweitert Wiederholen seinen bisherigen Filmumfang auf die gewählten Bereiche `film`, `actors` und `awards`. Auswahlklappe, Vorschaugröße, Zahl fälliger Ziele, nächster Termin, tatsächlicher Serverstart und die Wiederholung aus einem Rundenergebnis verwenden denselben Bereichsumfang. Die Ergebnisaktion bleibt auf Ziele der betreffenden Runde beschränkt. Varianten und bereichsübergreifend gemeinsame Ziele zählen einmal.

In **Filmreise und Freiem Spiel** erhält ein Ziel nach jeder richtigen Antwort für rollende 24 Stunden die niedrigste Auswahlpriorität, wenn sein tatsächlicher nächster Lerntermin noch in der Zukunft liegt. Maßgeblich sind bestehende Antwortereignisse mit `correct=true`, auch geratene Treffer und frühe richtige Übungen ohne Lernstufenaufstieg. Die 24 Stunden laufen ab der Antwortzeit, nicht ab Rundenbeginn oder Kalendertageswechsel; genau nach 24 Stunden endet die Zurückstellung. Zukünftige Ereigniszeiten zählen nicht. Der gemeinsame Zielbezug schließt andere Formulierungen desselben Wissensziels ein.

Passende Alternativen werden zuerst verwendet, einschließlich bereits bekannter, noch nicht fälliger Ziele ohne diese Zurückstellung. Erst wenn davon zu wenige für die Runde vorhanden sind, füllen zurückgestellte Ziele auf. Fällige Ziele werden unabhängig von einem kürzlich richtigen Treffer zugelassen; Lernintervalle und lokale Tagesgrenze bleiben maßgeblich. Wiederholen enthält ohnehin ausschließlich fällige Ziele. Die bestehende Filmreise-Mischung aus vier fälligen und sechs neuen Zielen sowie die Gleichverteilung neuer Schwierigkeiten bleiben erhalten. Rekordläufe und Duelle bleiben vom persönlichen 24-Stunden-Abstand unabhängig und behalten ihre Wettbewerbsregeln.

Der Server liest nur die richtigen Antwortereignisse des aktuellen Kontostands innerhalb dieses Zeitfensters über einen neuen privaten Konto-/Zeitindex. Keine neuen Lernstandfelder, keine Historienrückfüllung und kein zusätzlicher Netzwerkaufruf. Lokale Prüf- und Proberundenlogik verwendet denselben Ereignisbezug. Laufende Runden behalten ihre bereits ausgewählte Folge. Datenbankdatei: `20261011203247_learning_repetition_all_sources_and_correct_cooldown.sql`. Auf anschließenden Veröffentlichungsauftrag produktiv installiert und als Website-Version 71 veröffentlicht; alle privaten Fortschrittseinträge atomar unverändert bestätigt, synthetische Prüfung vollständig zurückgerollt.

## Kompakte Zahlen und goldene Klappen

Große Fälligkeitskästen entfallen. Nur **Wiederholen** zeigt „X Wiederholungen fällig“ kompakt in seiner Moduskarte, bezogen auf die gesamte aktuelle Auswahl und unabhängig von der nächsten Rundengröße. Aktualisierung bei Filterwechsel, neuem Stand, minütlich im sichtbaren Fenster und bei Rückkehr.

Die **Filmreise** zeigt seit 12.10.2026 den Gesamtfortschritt über den gesamten aktuellen Fragenbestand aller Genres und Bereiche: einen Prozentbalken für den Anteil kennengelernter Wissensziele. Filter ändern diesen Überblick nicht. Zusätzliche Zahlenzeilen entfallen. Die genaue Freischaltung je Bereich bleibt unter „Deine Stufenfortschritte“, mit vollständigem Gruppenbestand und getrennt genannter 50-Prozent-Schwelle. [Aktueller Anzeigevertrag](Filmreise-Freischaltung-2026-10-11.md#gesamtanzeige-auf-der-startkarte--12102026). Wiederholungen desselben Ziels erhöhen den Freischaltzähler nicht. Eine eingeschränkte kuratierte Filmauswahl kann für die vollständige Freischaltung weitere Filme desselben Genres erfordern.

Ausklappbereiche erscheinen als warme goldene Laschen mit dezenter Tiefe, Goldsymbol und drehendem Pfeil; Filterleisten mit goldener Plus-/Minus-Taste. Druckzustand und kurze Einblendung unterstützen die Bedienung. Native `details`/`summary` erhalten Tastatursteuerung und Fokus. Reduzierte Bewegung schaltet Animation und Druckbewegung aus. Die vier Lernstufen im Antwortbild und unmittelbaren Rückblick bleiben zunächst geschlossen und öffnen sich pro Antwort neu geschlossen.

Folgeauftrag vom 10.10.2026: Das Genre über der Frage wird durch das vorhandene Themenbild dargestellt. Die Antwortklappen erhalten sechs inhaltlich passende Illustrationen statt des einheitlichen Sterns. [Anzeigevertrag, Bildherkunft und Prompts](Antwortsymbole-2026-10-10.md).

„Fällige Fragen dieser Runde wiederholen“ erscheint im Ergebnis erst bei tatsächlich fälligen Wissenszielen aus den Antworten genau dieser abgeschlossenen Runde, einschließlich Schauspieler- und Preiszielen. Auch richtige Antworten können dazugehören. Andere aktive Runden blockieren den Start wie bisher. Frühere Fehler bleiben für Auswertung und Karriere-XP getrennt aus der Ereignishistorie ableitbar.

## Vier Stufen

Unveränderte Lernregel: sichere Antwort = richtig, ohne „War geraten“. Erste sichere Antwort erreicht Stufe 1; die Wiederholung ist nach 24 Stunden fällig. Ein sicherer Treffer ab Termin erreicht Stufe 2 (weiterer Abstand drei Tage), dann Stufe 3 (sieben Tage), dann Stufe 4 (21 Tage). Ohne Zwischenfehler: Tag 0 → 1 → 4 → 11; an Tag 11 ist das Ziel gefestigt, nächste Wiederholung an Tag 32.

Frühe sichere Antworten erhalten Stufe und Termin; höchstens ein Aufstieg je lokalem Kalendertag. Fehler oder Zeitablauf setzen auf Stufe 0 zurück, mit zehn Minuten bis zur nächsten Wiederholung. „War geraten“ setzt ebenfalls auf 0 zurück, mit sechs Stunden Abstand. Nach einem Aufstieg am selben Tag gilt für die nächste Stufe zusätzlich frühestens der nächste Kalendertag. Die Hilfe nennt nun auch die vier Intervalle einzeln.

## Gesamtübersicht im Profil

„Dein Lernstand“ bleibt im Profil sichtbar, unabhängig von Spielmodus und Auswahlfiltern. Unterschiedliche kennengelernte Fragen zählen anhand eindeutiger Frage-IDs mit Antwortereignis, einschließlich „Keine Ahnung“ und Zeitablauf; Wiederholungen derselben Frage erhöhen diese Zahl nicht. Bloßes Anzeigen ohne Antwort wird weiterhin nicht gespeichert. Die bisherige Ereignissumme heißt zur Abgrenzung „Antworten insgesamt“.

Eine kompakte Liste verteilt alle eindeutigen Wissensziele des aktuellen Fragenbestands vollständig auf „Noch nicht gelernt“, „Stufe 0 · Noch unsicher“ sowie Stufen 1–4. Fragevarianten teilen ihren Lernstand und zählen hier einmal. Die Summe der sechs Gruppen entspricht der Zahl eindeutiger Wissensziele des Bestands. Die Zahl kennengelernter Fragen und diese Zielzahl sind deshalb bewusst unterschiedlich beschriftet. Keine neuen Datenfelder oder Änderungen an Spielständen. [Präzisierter Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerhinweis%20kompakte%20Lernauswahl%20und%20Profil.txt).

## Herkunft und Prüfung

[Nutzerhinweis mit Bildschirmfotos](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerhinweis%20Wiederholungen%20und%20Lernstufen.txt), [angenommene Modustrennung und Veröffentlichungsauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Modustrennung%20und%20goldene%20Klappen.txt). Befund anhand von Auswahl und Lernregeln verifiziert. „Noch nie Stufe 2“ ist durch die frühere Bevorzugung neuer Fragen plausibel erklärt, aber keine Prüfung des persönlichen Kontoverlaufs. Aktuelle Checks und Veröffentlichung werden im [Prüfbericht](Pruefbericht.md) und [Sites-Betrieb](Sites-Betrieb.md) festgehalten.

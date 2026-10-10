# Wiederholungen und Lernstufen

Stand: 10.10.2026, seit Sites-Version 62 um 11:02:31 Uhr Europe/Berlin veröffentlicht. [Nachweis](Veroeffentlichung-2026-10-10-Version-62.json).

## Befund und Entscheidung

Die ursprünglichen Bildschirmfotos zeigten unterschiedliche Grundmengen: Filmreise zählte sämtliche fälligen Ziele ihrer freigeschalteten Auswahl, Fehlertraining nur offene Fehler seiner manuellen Filter. Daher konnten 274 und 1 gleichzeitig erscheinen. Gleichlautende Beschriftungen und große Erklärkästen machten diesen Unterschied unverständlich. Der persönliche Spielstand wurde nicht ausgelesen oder verändert.

Die zuerst umgesetzte Zwischenlösung mit kompakter Filmreise-Zahl und Auswahl „Gemischt / Nur fällige Wiederholungen“ ist durch den anschließend ausdrücklich angenommenen Vorschlag abgelöst. Maßgeblich sind nun drei unterschiedliche Aufgaben:

- **Filmreise:** Entdecken und Freischalten. Bei ausreichender Auswahl sechs neue und vier fällige Ziele je Zehnerrunde, entsprechend drei und zwei in der ersten Fünferrunde. Fällige Ziele: älteste Termine zuerst. Neue Ziele aus frisch geöffneten Etappen werden bevorzugt. Fehlende Plätze werden mit übrigen neuen, fälligen und schließlich bekannten, noch nicht fälligen Zielen ergänzt; ältere Bearbeitungen und Ziele außerhalb der letzten drei Runden zuerst. Gelernte Fragen bleiben verfügbar. Der Modus funktioniert auch nach vollständigem Kennenlernen des Bestands.
- **Wiederholen:** Ersetzt das frühere Fehlertraining. Ausschließlich bereits bearbeitete, jetzt fällige **Filmziele**, auch früher sicher richtig beantwortete oder geratene. Alle passenden Genres, Kategorien, Schwierigkeiten und Filmgruppen werden berücksichtigt; keine Bindung an Filmreise-Freischaltungen. Älteste Fälligkeit zuerst, je Ziel eine passende zufällige Variante. Keine neuen oder noch nicht fälligen Ziele zum Auffüllen. Weniger fällige Ziele ergeben kürzere Runden. Ohne fällige Ziele kein Start, verständlicher Hinweis und gegebenenfalls der nächste Termin direkt in der Moduskarte.
- **Freies Spiel:** Zufällige Ziele aus den gewählten Bereichen und Filtern, unabhängig von Lernstand oder Fälligkeit. Zusätzliche Fragevarianten erhöhen die Auswahlchance eines Ziels nicht.

Alle Modi verwenden dieselben Lernereignisse und Lernintervalle. Anzeige und Auswahl verwenden `nextLearningAt`, einschließlich der lokalen Tagesgrenze. Die vorhandene technische Modus-ID `fehler` bleibt bestehen; keine neue Migration oder historische Sonderlogik. Die frühere optionale Einstellung `learningSelection` steuert die aktuelle Auswahl nicht mehr. Manuell gewählte Fragenbereiche bleiben für Filmreise und Freies Spiel gespeichert; Wiederholen verwendet ausschließlich Filmfragen.

## Kompakte Zahlen und goldene Klappen

Große Fälligkeitskästen entfallen. Nur **Wiederholen** zeigt „X Wiederholungen fällig“ kompakt in seiner Moduskarte, bezogen auf die gesamte aktuelle Auswahl und unabhängig von der nächsten Rundengröße. Aktualisierung bei Filterwechsel, neuem Stand, minütlich im sichtbaren Fenster und bei Rückkehr.

Die **Filmreise** zeigt die nächste erreichbare Freischaltung der gewählten Bereiche: Genre beziehungsweise Bereich, noch fehlende sichere unterschiedliche Wissensziele und einen Fortschrittsbalken. Von den unmittelbar erreichbaren Schwierigkeiten oder Filmgruppen wird das Ziel mit der kleinsten Restmenge angezeigt. Wiederholungen desselben Ziels erhöhen den Freischaltzähler nicht. Sind alle Etappen offen, erscheint die Zahl gefestigter Ziele im gewählten Bereich. Eine eingeschränkte kuratierte Filmauswahl kann für die vollständige Freischaltung weitere Filme desselben Genres erfordern.

Ausklappbereiche erscheinen als warme goldene Laschen mit dezenter Tiefe, Goldsymbol und drehendem Pfeil; Filterleisten mit goldener Plus-/Minus-Taste. Druckzustand und kurze Einblendung unterstützen die Bedienung. Native `details`/`summary` erhalten Tastatursteuerung und Fokus. Reduzierte Bewegung schaltet Animation und Druckbewegung aus. Die vier Lernstufen im Antwortbild und unmittelbaren Rückblick bleiben zunächst geschlossen und öffnen sich pro Antwort neu geschlossen.

Folgeauftrag vom 10.10.2026: Das Genre über der Frage wird durch das vorhandene Themenbild dargestellt. Die Antwortklappen erhalten sechs inhaltlich passende Illustrationen statt des einheitlichen Sterns. [Anzeigevertrag, Bildherkunft und Prompts](Antwortsymbole-2026-10-10.md).

„Fällige Filmfragen dieser Runde wiederholen“ erscheint im Ergebnis erst bei tatsächlich fälligen Filmzielen aus den Antworten genau dieser abgeschlossenen Runde. Auch richtige Antworten können dazugehören. Andere aktive Runden blockieren den Start wie bisher. Frühere Fehler bleiben für Auswertung und Karriere-XP getrennt aus der Ereignishistorie ableitbar.

## Vier Stufen

Unveränderte Lernregel: sichere Antwort = richtig, ohne „War geraten“. Erste sichere Antwort erreicht Stufe 1; die Wiederholung ist nach 24 Stunden fällig. Ein sicherer Treffer ab Termin erreicht Stufe 2 (weiterer Abstand drei Tage), dann Stufe 3 (sieben Tage), dann Stufe 4 (21 Tage). Ohne Zwischenfehler: Tag 0 → 1 → 4 → 11; an Tag 11 ist das Ziel gefestigt, nächste Wiederholung an Tag 32.

Frühe sichere Antworten erhalten Stufe und Termin; höchstens ein Aufstieg je lokalem Kalendertag. Fehler oder Zeitablauf setzen auf Stufe 0 zurück, mit zehn Minuten bis zur nächsten Wiederholung. „War geraten“ setzt ebenfalls auf 0 zurück, mit sechs Stunden Abstand. Nach einem Aufstieg am selben Tag gilt für die nächste Stufe zusätzlich frühestens der nächste Kalendertag. Die Hilfe nennt nun auch die vier Intervalle einzeln.

## Gesamtübersicht im Profil

„Dein Lernstand“ bleibt im Profil sichtbar, unabhängig von Spielmodus und Auswahlfiltern. Unterschiedliche kennengelernte Fragen zählen anhand eindeutiger Frage-IDs mit Antwortereignis, einschließlich „Keine Ahnung“ und Zeitablauf; Wiederholungen derselben Frage erhöhen diese Zahl nicht. Bloßes Anzeigen ohne Antwort wird weiterhin nicht gespeichert. Die bisherige Ereignissumme heißt zur Abgrenzung „Antworten insgesamt“.

Eine kompakte Liste verteilt alle eindeutigen Wissensziele des aktuellen Fragenbestands vollständig auf „Noch nicht gelernt“, „Stufe 0 · Noch unsicher“ sowie Stufen 1–4. Fragevarianten teilen ihren Lernstand und zählen hier einmal. Die Summe der sechs Gruppen entspricht der Zahl eindeutiger Wissensziele des Bestands. Die Zahl kennengelernter Fragen und diese Zielzahl sind deshalb bewusst unterschiedlich beschriftet. Keine neuen Datenfelder oder Änderungen an Spielständen. [Präzisierter Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerhinweis%20kompakte%20Lernauswahl%20und%20Profil.txt).

## Herkunft und Prüfung

[Nutzerhinweis mit Bildschirmfotos](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerhinweis%20Wiederholungen%20und%20Lernstufen.txt), [angenommene Modustrennung und Veröffentlichungsauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Modustrennung%20und%20goldene%20Klappen.txt). Befund anhand von Auswahl und Lernregeln verifiziert. „Noch nie Stufe 2“ ist durch die frühere Bevorzugung neuer Fragen plausibel erklärt, aber keine Prüfung des persönlichen Kontoverlaufs. Aktuelle Checks und Veröffentlichung werden im [Prüfbericht](Pruefbericht.md) und [Sites-Betrieb](Sites-Betrieb.md) festgehalten.

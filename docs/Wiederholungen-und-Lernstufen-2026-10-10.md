# Wiederholungen und Lernstufen

Stand: 10.10.2026, lokale Umsetzung; noch nicht veröffentlicht.

## Befund und Auswahl

Die Bildschirmfotos zeigen unterschiedliche Grundmengen: Filmreise zählt alle fälligen Wissensziele innerhalb der freigeschalteten Auswahl; Fehlertraining nur noch offene Fehlantworten innerhalb seiner manuellen Filter. Bereits sicher gelöste Ziele fallen sofort aus dem Fehlertraining, brauchen aber weitere Wiederholungen zur Festigung. Die Zahlen 274 und 1 lassen sich deshalb nicht gleichsetzen. Der persönliche Spielstand wurde nicht ausgelesen oder verändert; die genaue Verteilung der 274 Ziele ist nicht geprüft.

Die gleiche Beschriftung und anschließend ausführliche Erklärkästen waren missverständlich. Nach erneuter Nutzerpräzisierung entfallen sämtliche großen Fälligkeitskästen. Nur die Filmreise zeigt die Zahl kompakt direkt in der gewählten Moduskarte. Freies Spiel und Fehlertraining zeigen keine Fälligkeit. Varianten zählen weiterhin einmal je Wissensziel. Ob Fehlertraining künftig durch einen allgemeinen Lernmodus für alle fälligen Ziele ersetzt werden soll, wurde ausdrücklich zur Klärung gestellt; bis dahin bleiben die bestehenden Modusregeln erhalten.

Ein zweiter Befund erklärt ausbleibende Zwischenaufstiege: Die bisherige Filmreise nahm zunächst neue Ziele und erst danach fällige Wiederholungen. Ein großer neuer Bestand konnte die Festigung dauerhaft verdrängen. Eine optionale Rückfrage zur Bedeutung von „nur lernen oder gemischt“ wurde gestellt. Ohne weitere Präzisierung wurde die Wahl für die Filmreise als fällige Wiederholungen gegenüber einer Mischung mit neuen Zielen ausgelegt.

In der Filmreise ist jetzt wählbar:

- **Gemischt** (Standard): Zunächst bis zur Hälfte der Plätze für fällige Ziele, älteste Termine zuerst; anschließend neue Ziele, bevorzugt aus neu freigeschalteten Stufen. Freie Plätze werden mit übrigen fälligen Zielen und erst zuletzt früheren, noch nicht fälligen Zielen ergänzt. Bei einer ungeraden Rundengröße wird der Wiederholungsanteil aufgerundet.
- **Nur fällige Wiederholungen:** ausschließlich Ziele mit erreichtem Lerntermin, älteste zuerst; bei kleiner Menge kürzere Runde. Ohne fällige Ziele kein Start, mit verständlichem Wechselhinweis.

`settings.roundSetup.learningSelection` speichert `mixed` oder `due` über den vorhandenen Speicherweg. Ohne explizite Wahl gilt die aktuelle Standardauswahl Gemischt. Die Auswahl wird beim Start umgesetzt; aktive Runden behalten ihre bereits gezogenen Fragen. Keine Migration, kein neuer Modus und keine Änderung von Lernereignissen. Fehlertraining bleibt ausschließlich für offene Fehler; Freies Spiel bleibt zufällig. Anzeige und Filmreise-Auswahl verwenden beide `nextLearningAt`, einschließlich der Tagesgrenze nach einem bereits erfolgten Stufenaufstieg.

## Vier Stufen

Unveränderte Lernregel: sichere Antwort = richtig, ohne „War geraten“. Erste sichere Antwort erreicht Stufe 1; die Wiederholung ist nach 24 Stunden fällig. Ein sicherer Treffer ab Termin erreicht Stufe 2 (weiterer Abstand drei Tage), dann Stufe 3 (sieben Tage), dann Stufe 4 (21 Tage). Ohne Zwischenfehler: Tag 0 → 1 → 4 → 11; an Tag 11 ist das Ziel gefestigt, nächste Wiederholung an Tag 32.

Frühe sichere Antworten erhalten Stufe und Termin; höchstens ein Aufstieg je lokalem Kalendertag. Fehler oder Zeitablauf setzen auf Stufe 0 zurück, mit zehn Minuten bis zur nächsten Wiederholung. „War geraten“ setzt ebenfalls auf 0 zurück, mit sechs Stunden Abstand. Nach einem Aufstieg am selben Tag gilt für die nächste Stufe zusätzlich frühestens der nächste Kalendertag. Die Hilfe nennt nun auch die vier Intervalle einzeln.

## Gesamtübersicht im Profil

„Dein Lernstand“ bleibt im Profil sichtbar, unabhängig von Spielmodus und Auswahlfiltern. Unterschiedliche kennengelernte Fragen zählen anhand eindeutiger Frage-IDs mit Antwortereignis, einschließlich „Keine Ahnung“ und Zeitablauf; Wiederholungen derselben Frage erhöhen diese Zahl nicht. Bloßes Anzeigen ohne Antwort wird weiterhin nicht gespeichert. Die bisherige Ereignissumme heißt zur Abgrenzung „Antworten insgesamt“.

Eine kompakte Liste verteilt alle eindeutigen Wissensziele des aktuellen Fragenbestands vollständig auf „Noch nicht gelernt“, „Stufe 0 · Noch unsicher“ sowie Stufen 1–4. Fragevarianten teilen ihren Lernstand und zählen hier einmal. Die Summe der sechs Gruppen entspricht der Zahl eindeutiger Wissensziele des Bestands. Die Zahl kennengelernter Fragen und diese Zielzahl sind deshalb bewusst unterschiedlich beschriftet. Keine neuen Datenfelder oder Änderungen an Spielständen. [Präzisierter Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerhinweis%20kompakte%20Lernauswahl%20und%20Profil.txt).

## Herkunft und Prüfung

[Nutzerhinweis mit Beschreibung der Bildschirmfotos](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerhinweis%20Wiederholungen%20und%20Lernstufen.txt). Befund anhand von `PlaySetup`, `selectQuestions`, `learn`, `nextLearningAt` und `openMistakes` verifiziert. Die subjektive Beobachtung „noch nie Stufe 2“ ist damit plausibel erklärt, aber keine Prüfung des persönlichen Kontoverlaufs.

433 Logiktests in 70 Dateien bestanden, darunter 54 gezielte Fälle zu Auswahl, Lernstufen, Fehlertraining und Sicherungsvalidierung. Produktionsbuild und TypeScript erfolgreich. Acht relevante Browserfälle in Chromium und mobilem WebKit prüfen Zähler/Filter/Termine, gespeicherte reine Wiederholung mit Aufstieg auf Stufe 2, frühe Wiederholung und Lernanzeige nach Neuladen. Mobile Ansicht bei 320 Pixeln visuell geprüft, Axe und Überlaufprüfung erfolgreich. Synthetische Konten und kontrollierte Uhr; keine echten Spielstände verändert. [Prüfbericht einschließlich reparierter Testdaten und Grenzen](Pruefbericht.md#10102026--wiederholungen-und-lernstufen).

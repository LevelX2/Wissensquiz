# Filmreise mit Schauspielern und Preisträgern

Stand 03.10.2026, als Sites-Version 41 erfolgreich veröffentlicht. Die drei Fragenbereiche Filmfragen, Schauspieler und Preisträger bilden auch in der Filmreise einen gemeinsamen Auswahlpool. Jeder Bereich kann allein oder zusammen mit den anderen gespielt werden. Der Modus wechselt beim Zuschalten nicht mehr automatisch. Filmgenres, Classics/Arthouse und Bekanntheit gelten für Filmfragen; Personen- und Preisfragen erhalten dadurch keine künstliche Genrebindung.

## Fortschritt

Schauspieler und Preisträger beginnen jeweils mit Leicht. 20 sichere leichte Ziele öffnen Mittel; anschließend 20 mittlere Schwer und 20 schwere Experte. Bei einem kleineren eigenen Bestand ist die Schwelle auf die vorhandenen eindeutigen Ziele begrenzt. Sichere Antworten aus abgeschlossenen Runden aller Modi zählen einmal je Wissensziel, Bereich und Schwierigkeit. Varianten, geratene Treffer, Zeitabläufe sowie aktive oder abgebrochene Runden erhöhen den Zähler nicht. Diese Bereiche haben keine Filmgruppen.

Filmgenres behalten den eingefrorenen Lehrplan und ihre Bekanntheitsgruppen. Preis-/Personenantworten erhöhen deren Zähler nicht. Beim ersten Umstieg werden Filmrechte, die frühere Versionen aus Preisantworten abgeleitet haben, einmalig erhalten; `journey.independentAreas` markiert diesen Schritt. Bereits erreichte Rechte bleiben erhalten. Die Einführung einer neuen höchsten Schwierigkeit verwendet das gemeinsame bestehende Einführungskontingent, einschließlich Experte in diesen beiden Bereichen. Kurze gemischte Runden garantieren keinen festen Anteil pro Bereich.

## Namen und Vertiefungen

727 Fragen, die eine Person vorgeben, nennen deren vollständigen öffentlichen Schauspielernamen im Fragetext, etwa „Für welche beiden Filme gewann Tom Hanks nacheinander den Hauptdarsteller-Oscar?“. Bei 73 Erkennungsfragen bleibt der gesuchte Name bis zur Lösung verborgen. Das Namensfeld in der Lösung allein erfüllt die Vorgabe nicht.

Alle 800 Vertiefungen wurden einzeln ergänzt. Die aktuelle Lesefassung enthält die gesamte Redaktion mit Antworten und Quellen. Die Texte umfassen konkrete Handlungskonflikte, Zusammenarbeit, Ausbildung, Bühne, Musik, Produktion und biografische Zusammenhänge. Mindestlänge 26, Median 35 und Höchstlänge 53 Wörter; die Länge ist kein Qualitätsmaß. Unzutreffende Ausgangsangaben zur englischen Howl-Synchronfassung und zur Herkunft des Firmennamens Red Om wurden für die Anzeige korrigiert. Eine zweite unabhängige Vollabnahme aller Aussagen liegt weiterhin nicht vor.

## Filmdaten

549 Fragen sind mit 493 konkreten Filmen verknüpft. Nach der Antwort erscheint der bestehende Bereich „Filmdaten“ mit Originaltitel, erster Veröffentlichung, Regie, Produktionsländern und Quellen. Mehrere Filmreferenzen werden getrennt angezeigt. Biografische Fragen benötigen keinen Film. Serien bleiben Serien und werden nicht als Film katalogisiert. Die reine Schauspielerreferenz erhält keine erfundene Bekanntheitsstufe.

Bestehende Film-Eckdaten werden wiederverwendet und haben Vorrang; 382 zusätzliche Datensätze ergänzen bisher fehlende Filme. Die Quellenprüfung dokumentiert Abrufdatum, HTML-Hash und gelesene Eckdaten. Besondere Jahresfälle unterscheiden etwa Magnolias begrenzten Start 1999 vom breiten Start 2000 sowie die Festivalpremiere von „Nach Fünf im Urwald“ 1995 vom Kinostart 1996. Daraus entstehen keine weiteren Jahres- oder Regiefragen.

## Black-Panther-Reihe: Basisdatenkorrektur

Am 04.10.2026 anhand eines Nutzer-Screenshots und der lokalen Daten geprüft: Die Frage `SCHAUSPIELER-202610-P01-090-L-1` verknüpft korrekt beide Filme `Black Panther|2018` und `Black Panther: Wakanda Forever|2022`. Ihre Vertiefung wechselt ausdrücklich zur Fortsetzung. Die darunter zuerst angezeigten Filmdaten von 2018 sind daher keine falsche Filmzuordnung; der zweite Datenblock folgt im selben Abschnitt.

Beide Einträge in `src/actorFilmFacts.json` enthielten `series: null`. Deshalb zeigte `src/FilmDataPanel.tsx` „Keine Reihe hinterlegt“. Diese Datenlücke ist auf Nutzerauftrag am 04.10.2026 lokal korrigiert: Black-Panther-Reihe, Teil 1 für 2018 und Teil 2 für 2022; die Teilposition bezieht sich auf diese Reihe, nicht auf sämtliche MCU-Filme. Die beiden Datensätze enthalten ergänzende offizielle Quellen: [Marvel bestätigt die Fortsetzung](https://www.marvel.com/articles/movies/black-panther-wakanda-forever-title), [Disney bestätigt Erscheinungsjahr 2022 und Handlung nach T’Challas Tod](https://movies.disney.com/black-panther-wakanda-forever).

Umfang nach Nutzerpräzisierung: ausschließlich zwei Film-Basisdatensätze und ihre Quellen. Keine Migration oder Bearbeitung laufender Spiele und keine Änderung am Recherchewerkzeug. Die bestehende Filmdatenanzeige übernimmt die ergänzte Reihe. Die Korrektur ist mit dem Gesamtstand als Version 52 veröffentlicht. [Lokaler Prüfnachweis](Pruefbericht.md).

## Erhalt und Nachweise

Die Redaktion wird anhand Frage-ID, Personen-ID sowie ursprünglichem Frage- und Vertiefungstext rein für die Anzeige aufgelöst. CSV, Rohquellen, Frageversionen, Wissensergebnisse und Rundensnapshots bleiben erhalten. Alte gespeicherte Runden zeigen ebenfalls die verbesserte Redaktion; eigene Fragen mit wiederverwendeter ID und abweichendem Inhalt bleiben unangetastet. Das logische Sicherungsformat bleibt Schema 1.

- [Überarbeitete Lesefassung](Schauspieler-Fragenpaket/Schauspieler_800_Fragen_Lesefassung_2026-10-03.md)
- [Redaktionsbericht](Schauspieler-Fragenpaket/Redaktionsbericht-2026-10-03.json)
- [Biografiequellen](Schauspieler-Fragenpaket/Quellenpruefung-2026-10-03.json)
- [Filmquellen](Schauspieler-Fragenpaket/Filmquellenpruefung-2026-10-03.json)
- [Prüfbericht](Pruefbericht.md)
- [Veröffentlichungsnachweis](Sites-Betrieb.md)

`node scripts/prepare-actor-editorial.mjs` erzeugt Anzeige, Lesefassung und Bericht aus dem erhaltenen Originalpaket und den individuellen Ergänzungen. `scripts/research-actor-films.py` ergänzt fehlende Film-Eckdaten mit requests/BeautifulSoup im Recherchewerkzeug; diese Python-Bibliotheken sind keine App-Abhängigkeiten. Ganze Webseiten und temporäre Recherchetexte bleiben außerhalb der Veröffentlichung und der Versionierung.

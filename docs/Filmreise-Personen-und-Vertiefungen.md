# Filmreise mit Schauspielern und Preisträgern

**13.10.2026 – Personen- und Preisgruppen lokal integriert:** Auch diese beiden Bereiche besitzen vier Bekanntheitsgruppen mit eigener Fortschrittsanzeige und derselben Gruppenfreischaltung wie Filme. Experte bleibt eine unabhängige Schwierigkeit. 428 Schauspieler mit 3.424 Fragen, viermal 107 Personen; 280 Preisfragen nach Filmgruppe. Historische Porträts bevorzugt, alle Personen mit TMDB-Link. [Aktueller Gesamtvertrag](Bekanntheitsgruppen/App-Integration-2026-10-13.md).

Stand 03.10.2026, als Sites-Version 41 erfolgreich veröffentlicht. Die drei Fragenbereiche Filmfragen, Schauspieler und Preisträger bilden auch in der Filmreise einen gemeinsamen Auswahlpool. Jeder Bereich kann allein oder zusammen mit den anderen gespielt werden. Der Modus wechselt beim Zuschalten nicht mehr automatisch. Filmgenres, Classics/Arthouse und Bekanntheit gelten für Filmfragen; Personen- und Preisfragen erhalten dadurch keine künstliche Genrebindung.

## Fortschritt

Seit 11.10.2026 gilt der [gemeinsame 50-Prozent-Vertrag](Filmreise-Freischaltung-2026-10-11.md): Schauspieler und Preisträger beginnen mit Leicht; mindestens die Hälfte der aktuellen eindeutigen Ziele der vorherigen Schwierigkeit, aufgerundet, öffnet Mittel, Schwer und Experte. Nur sichere Antworten abgeschlossener Runden zählen; jeder Bereich separat, keine Filmgruppen. Alte 20-Ziele-Freigaben werden neu berechnet. Filmgenres verwenden ebenfalls 50 Prozent; Preis-/Personenantworten erhöhen deren Zähler nicht. Neue Fragen werden gleichwahrscheinlich über verfügbare offene Schwierigkeiten gezogen, ohne Einführungsvorrang. Keine feste Quote je Fragenbereich.

## Namen und Vertiefungen

727 Fragen, die eine Person vorgeben, nennen deren vollständigen öffentlichen Schauspielernamen im Fragetext, etwa „Für welche beiden Filme gewann Tom Hanks nacheinander den Hauptdarsteller-Oscar?“. Bei 73 Erkennungsfragen bleibt der gesuchte Name bis zur Lösung verborgen. Das Namensfeld in der Lösung allein erfüllt die Vorgabe nicht.

Alle 800 Vertiefungen wurden einzeln ergänzt. Die aktuelle Lesefassung enthält die gesamte Redaktion mit Antworten und Quellen. Die Texte umfassen konkrete Handlungskonflikte, Zusammenarbeit, Ausbildung, Bühne, Musik, Produktion und biografische Zusammenhänge. Die Grundredaktion vom 03.10.2026 hatte eine Mindestlänge von 26, einen Median von 35 und eine Höchstlänge von 53 Wörtern; spätere Einzelkorrekturen können davon abweichen. Die Länge ist kein Qualitätsmaß. Unzutreffende Ausgangsangaben zur englischen Howl-Synchronfassung und zur Herkunft des Firmennamens Red Om wurden für die Anzeige korrigiert. Eine zweite unabhängige Vollabnahme aller Aussagen liegt weiterhin nicht vor.

## Filmdaten

Am 12.10.2026 wurde die leichte Mifune-Frage `SCHAUSPIELER-202610-P01-049-L-2` auf Sanjuros Stand in „Yojimbo“ (1961) konkretisiert. Vier zum historischen Schauplatz passende Antwortmöglichkeiten, eine Kurzantwort zum herrenlosen Samurai und die Vertiefung zur Bandenrivalität verbinden die Frage jetzt unmittelbar mit den eingeblendeten Filmdaten. Die Quellen von Criterion und BFI wurden gelesen. Die Kategorie bleibt Schauspieler; lokal überarbeitet, noch nicht veröffentlicht. [Aktuelle Fassung](Schauspieler-Fragenpaket/Schauspieler_800_Fragen_Lesefassung_2026-10-03.md#leicht--schauspieler-202610-p01-049-l-2).

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

## Die Maske: natürliche Figurenbezeichnung – 12.10.2026

Die leichte Rollenfrage `SCHAUSPIELER-202610-P01-025-L-2` fragt nach Jim Carreys grünem Alter Ego des Bankangestellten Stanley Ipkiss. Die richtige Antwort lautet „Die Maske“. Der Fragetext nennt den lösungsverratenden Filmtitel nicht. Frage-ID, Filmfakt, Schwierigkeit und Lösungsschlüssel B bleiben erhalten. Kurzantwort und Vertiefung erläutern die Verwandlung sowie den Konflikt um Tina Carlyle. AFI-Credits, AFI Silver und Filmbankmedia am 12.10.2026 gelesen; Quellen in App-CSV und Anzeige hinterlegt. Rohlieferung unverändert. [Aktuelle vollständige Frage](Schauspieler-Fragenpaket/Schauspieler_800_Fragen_Lesefassung_2026-10-03.md#leicht--schauspieler-202610-p01-025-l-2).

Die Korrektur ist seit **Sites-Version 76 vom 12.10.2026, 22:00:55 Uhr Europe/Berlin**, im aktuellen Serverbestand veröffentlicht. 435 Tests und Build erfolgreich; private Spielstände erhalten. [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-12-Version-76.json).

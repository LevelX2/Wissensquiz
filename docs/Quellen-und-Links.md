# Quellen und Links

Stand: 08.11.2026, lokal umgesetzt; noch nicht veröffentlicht.

## Anordnung und Beschriftung

Nach der vorgesehenen Auflösung steht unter dem Lernfortschritt eine standardmäßig geschlossene Klappe **Quellen und Links** mit zwei Abschnitten:

- **Belegquellen:** die fachlichen Nachweise aus Frage, Vertiefung, Besetzung, sämtlichen Filmdaten, Regiehintergründen und Bilderkennungsvarianten.
- **Weiterführende Datenbanken:** bestätigte IMDb- und OFDb-Einträge zu den konkret behandelten Filmen, Serien, Schauspielern und Regiepersonen.

Vertiefung und Filmdaten behalten ihre Texte; ihre wiederholten Quellenlisten sind hier zusammengefasst. Bildnachweise und TMDB-Verweise bleiben zusätzlich unmittelbar am Bild, weil sie dort die Herkunft belegen.

Jeder Verweis steht in einer eigenen Zeile und nennt Anbieter und Gegenstand, etwa „IMDb – Prestige – Die Meister der Magie (2006)“ oder „Wikipedia (EN) – Regie: Christopher Nolan“. Sprachfassungen bleiben erkennbar; weiterführende Einträge nennen zusätzlich Film, Serie, Schauspieler oder Regie. Sonstige Belege verwenden lesbare Artikel-/Dateinamen oder den konkreten Bezug. Gemeinsame Quellen mehrerer Filmverweise führen sämtliche betroffenen Werke auf.

Gleiche Ziel-URLs erscheinen innerhalb der Klappe einmal. Abschließende Schrägstriche und Trackingparameter erzeugen keine Dubletten. Unterschiedliche Sprachfassungen, Inhaltsabschnitte und Beleg-Unterseiten bleiben erhalten. Eine IMDb-Handlungs-/Creditseite oder OFDb-Rezension ist gegenüber der Hauptseite ein eigenständiger Beleg. Ist die Hauptseite bereits Beleg, wird sie nur dort gezeigt.

## Identitäten und Pflege

Werkzuordnungen verwenden Originaltitel und Jahr; Schauspieler die Projekt-ID zusammen mit dem exakten Katalognamen. Regiepersonen müssen am konkreten Werk belegt sein. Film und Serie sowie Remakes und Schnittfassungen auseinanderhalten. Gleicher Titel und gleiches Jahr allein reichen nicht. Unbestätigte Zuordnungen bleiben ohne neuen Direktlink; namenbasierte Such-/Filmografieseiten gelten ohne eindeutig bestätigtes Personenprofil nicht als Personendirektlink.

Die führenden Anzeigeregister sind src/workDatabaseLinks.json, src/personDatabaseLinks.json, src/directorDatabaseLinks.json und src/ofdbLinks.json. Sie enthalten die tatsächlich benötigten Identitäts-/Anzeigefelder. src/sourceLinks.ts löst sie auf und sammelt Belege; QuestionLinks ordnet sie an, SourceLink beschriftet sie. Neue Zuordnungen an konkreten Anbieter- oder fachlichen Primärseiten bestätigen. Keine IDs, Einträge oder Slugs erraten. Bei widersprüchlichen externen Kennungen die Werk-/Personenidentität anhand konkreter Credits, Titel-/Jahresdaten oder eindeutiger Biografie prüfen; bestätigte eigene IMDb-Kennungen nicht blind durch Anbieterfelder ersetzen.

| Aktueller Bestand | Bestätigte Zuordnungen |
|---|---:|
| IMDb-Werke | 3.400 von 3.400 |
| Davon Serien | 3 |
| OFDb-Werke | 3.379 von 3.400 |
| IMDb-Schauspieler | 428 von 428 |
| OFDb-Schauspieler | 419 von 428 |
| IMDb-Regie | 3.569 Werk-/Personenzuordnungen für alle 3.400 Werke |

15 zusätzliche Werk-Identitätsvarianten teilen einen IMDb-Eintrag; bestehende Quiz-/Lernidentitäten bleiben erhalten. Die Serien Dancin’ Days (1978), Gabriela (1975) und L’arte della gioia (2024) sind ausdrücklich als Serien zugeordnet; für letztere ist auch OFDb bestätigt.

## Aktuelle Belege und offene Risiken

Die gepflegten Anbieter-URLs sind die direkten öffentlichen Werk-/Personenbelege. Öffentliche Originalantworten und direkte Zielnachweise unter data/reference-links-2026-11-08/ bleiben als lokale Beleggrundlage erhalten, solange die aktiven Zuordnungen auf ihnen beruhen. Sie werden nicht veröffentlicht. Eine Löschung setzt vollständige ersetzende Identitäts-/Zielnachweise oder entfallene zugehörige Anwendungsdaten voraus. Such-/Bearbeitungsverläufe und doppelte Ergebnisberichte gehören nicht zum geltenden Projektwissen.

- **Gleichnamige Werke:** Bruised (2020) gehört zu Halle Berry, bestätigt durch [IMDb tt8310474](https://www.imdb.com/title/tt8310474/) und [ihre Credits](https://www.imdb.com/title/tt8310474/fullcredits/). Enemy (2013) gehört zu Denis Villeneuve, bestätigt durch [IMDb tt2316411](https://www.imdb.com/title/tt2316411/) und den [Verleiher A24](https://a24films.com/films/enemy).
- **Francisco Rabal:** [OFDb-Profil 9183](https://www.ofdb.de/person/9183,Francisco-Rabal/) ist durch Namen, Geburts-/Sterbedaten und konkrete Credits eindeutig bestätigt; sein dortiges externes IMDb-Feld weicht von der bestätigten [IMDb-ID nm0704719](https://www.imdb.com/name/nm0704719/) ab. Maßgebliche Vergleichsbiografie: [TMDB 9768](https://www.themoviedb.org/person/9768); passende Credits u. a. Nazarín, Viridiana und Sorcerer.
- **Meeting Leila:** [OFDb 238543](https://www.ofdb.de/film/238543,Meeting-Leila/) gehört trotz abweichendem externen IMDb-Feld zu demselben durch Originaltitel, Jahr, Regie und Besetzung bestätigten Werk wie [IMDb tt2076799](https://www.imdb.com/title/tt2076799/). Das unbestätigte Anbieterfeld wird nicht in die eigene IMDb-Zuordnung übernommen.
- **Queen Kelly (1932):** Die aktuellen Filmdaten nennen Gregg Toland als Mitregisseur. [IMDb-Vollcredits](https://www.imdb.com/title/tt0020298/fullcredits/) führen ihn als Kameramann und Richard Boleslawski für die zusätzliche Schlusssequenz; ergänzender [AFI-Beleg](https://catalog.afi.com/Film/11491-QUEEN-KELLY). Bis zur fachlichen Klärung nur den sicheren Stroheim-Regielink verwenden. Betroffen sind die Filmverweise in SCHAUSPIELER-BG-20261013-161-E1 und SCHAUSPIELER-BG-20261013-161-E2; keine stillschweigende Änderung der Quiz-/Lernidentität.

Für folgende 21 Werke ist nach konkreter Anbieter-, Titel-/Alias- und Vollsuche kein eindeutiger OFDb-Direktlink bestätigt. Dies behauptet keine Nichtexistenz:

- Bharatham (1991)
- Bramayugam (2024)
- Crónica de una señora (1971)
- Dancin' Days (1978)
- Gabriela (1975)
- Istgah-e matrouk (2002)
- Kaathal – The Core (2023)
- Khandhar (1984)
- Kireedam (1989)
- Kutty Srank (2009)
- Los herederos (1970)
- Manthan (1976)
- Moondram Pirai (1982)
- On the Job: The Missing 8 (2021)
- Paar (1984)
- Peranbu (2018)
- Shinran: Shiroi michi (1987)
- Sparsh (1980)
- Thevar Magan (1992)
- Un millón en la basura (1967)
- Viudas (2011)

Für neun Schauspieler fehlt ein eindeutig bestätigtes OFDb-Personenprofil: Shin Saburi, Soumitra Chatterjee, Kamal Haasan, Mohanlal, Federico Luppi, Fernanda Montenegro, Graciela Borges, Madhabi Mukherjee, Leila Hatami. Namensbasierte Anbieterfilmografien ohne abgegrenztes Personenprofil werden nicht als bestätigte Profile ausgegeben.

## Lösungsschutz und Prüfung

Die bestehende Freigabe in QuestionScreen, Rundenrückblick und Duellauflösung bestimmt den Zeitpunkt. Vor der Auflösung stehen weder Links noch verräterische Beschriftungen oder URL-/Titelattribute im Fragen-DOM. Geschlossene Details allein ersetzen diesen Schutz nicht. Bei gesammelten Lösungen erscheinen die Links erst im freigegebenen Rundenrückblick.

Es erfolgen keine Rechercheabfragen im Browser; Zugangsdaten sind nicht nötig. Fragen, Antworten, Versionen, Lernidentitäten und private Spielstände bleiben durch diese Anzeige unverändert. Für die Linkanzeige ist keine Serverkatalogänderung oder Migration erforderlich. [Prüfnachweis](Pruefbericht.md#quellen-und-links).

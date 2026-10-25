# GitHub-Tickets vom 25.10.2026

Alle acht offenen Issues #3–#10 und ihre Kommentare wurden gelesen. Es gab keine Kommentare. Sieben Meldungen sind lokal korrigiert; eine betrifft einen inzwischen überarbeiteten Stand. Keine Veröffentlichung, produktive Katalogaktivierung, GitHub-Kommentare, Ticketschließung oder Push. Die Issues bleiben bis zur gesonderten Freigabe und Auslieferung offen.

## Entscheidungen und Änderungen

| Ticket | Befund und lokaler Endstand |
|---|---|
| [#3 – Rambo-Bild](https://github.com/LevelX2/Wissensquiz/issues/3) | Filmidentität `First Blood|1982`, TMDB 1368, ist richtig. Das bisherige deutsche Poster zeigt ein unpassendes Rambo-Motiv. Ersatz aus den aktuellen TMDB-Postern visuell geprüft: „First Blood“ mit Rambo und M60 vor einem Wald. Auswahl in `src/reviewedFilmPosters.json` festgehalten und im lokalen ignorierten Posterindex übernommen. Der Vorbereitungslauf prüft Film-ID und aktuelle Zugehörigkeit des gewählten Bilds; fehlt es, bricht die Vorbereitung ab. Keine Änderung an Frage oder Antwort. |
| [#4 – Tempel des Todes](https://github.com/LevelX2/Wissensquiz/issues/4) | Die Reihe war vorhanden, ihre Position war leer. Jetzt Indiana Jones · Teil 2 nach Kinostartreihenfolge. Hinweis auf die vor dem ersten Film spielende Handlung bleibt ausdrücklich sichtbar. |
| [#5 – Kurt Russell / Elvis](https://github.com/LevelX2/Wissensquiz/issues/5) | Filmtitel fehlte tatsächlich in der Vertiefung. Sie beginnt jetzt mit „Der Fernsehfilm ‚Elvis‘ (1979) …“. Filmreferenz war bereits richtig. Titel nur nach der Antwort ergänzt, da er den gesuchten Sänger verrät. |
| [#6 – Schwarzenegger-Porträt](https://github.com/LevelX2/Wissensquiz/issues/6) | Meldung aus Version 79. Seit der Personenredaktion in Version 83 beschreibt die Vertiefung die Laufbahn zwischen Bodybuilding, Kino und Gouverneursamt. „Pumping Iron“ und „Terminator“ sind darin genannte Beispiele; genau diese beiden Filmdaten sind verknüpft. Kein falscher Filmbezug und kein Foto aus „Terminator“ behauptet. Aktuellen Text und beide Bezüge erhalten; durch eine gezielte Prüfung bestätigt. |
| [#7 – Rocky](https://github.com/LevelX2/Wissensquiz/issues/7) | Reihe fehlte. Jetzt Rocky · Teil 1; Rocky-Kinofilme und anschließende Creed-Ableger klar unterschieden. Preisreferenz und wiederverwendete Personen-Filmdaten gemeinsam berichtigt. |
| [#8 – Titelmaschine](https://github.com/LevelX2/Wissensquiz/issues/8) | Unnatürliche Bezeichnung ersetzt: „Wer spielte den aus der Zukunft geschickten Killer-Cyborg in ‚Terminator‘ von 1984?“ Gesuchter Schauspieler bleibt vor der Antwort verborgen. |
| [#9 – Nomadland](https://github.com/LevelX2/Wissensquiz/issues/9) | Figuren-/Darstellerkontext ergänzt: „… zieht Fern (Frances McDormand) im Van durch die USA.“ Weiterhin wird der Gewinnerfilm gesucht; die vier Filmantworten bleiben unverändert. |
| [#10 – Bourne](https://github.com/LevelX2/Wissensquiz/issues/10) | Reihe fehlte in den Filmdaten. Jetzt Bourne · Teil 2 nach Kinostartreihenfolge. |

## Quellen und Erhalt

- [Unveränderter Ticketabruf](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-25%20GitHub-Tickets.json); [vollständiger Vorher-/Nachher-Nachweis](GitHub-Tickets-2026-10-25.json).
- [AFI Silver: Tempel des Todes als zweiter Film](https://silver.afi.com/movies/detail/0100000080/), [Amblin: Handlung 1935](https://amblin.com/movie/indiana-jones-and-the-temple-of-doom/).
- [John Carpenter: Elvis, Titel, Kurt Russell und Veröffentlichung 1979](https://theofficialjohncarpenter.com/elvis/).
- [Paramount: ursprüngliche Rocky-Reihe und Creed-Filme](https://www.paramountpressexpress.com/paramount-plus/releases/?view=113201-paramount-and-pluto-tv-celebrate-the-50th-anniversary-of-rocky-with-entire-collection-of-films-now-streaming). Suchindex lesbar; direkter Seitenabruf regional gesperrt. [Weitere offizielle Darstellung der Reihe](https://www.skydance.com/news/as-rocky-celebrates-50-years-the-complete-franchise-collection-hits-paramount-and-pluto-tv-ahead-of-tulsa-king-season-4).
- [BFI Player: Bourne Supremacy als zweiter Film](https://player.bfi.org.uk/rentals/film/watch-the-bourne-supremacy-2004-online).
- [Searchlight: Fern und Frances McDormand](https://www.searchlightpictures.com/nomadland/), [Academy: Film-Oscar 2021](https://www.oscars.org/oscars/ceremonies/2021).
- [TMDB-Poster von First Blood](https://www.themoviedb.org/movie/1368-first-blood/images/posters): API am 25.10.2026 gelesen, vorheriges und gewähltes Bild visuell verglichen. Bilddateien und API-Antwort werden nach Abschluss entfernt; nur die redaktionelle Auswahl bleibt versioniert.

Bestehende Originalpakete und Rohquellen bleiben unverändert. Drei aktuelle App-CSV-Zeilen, zwei zugehörige Personenanzeigen und vier Filmdatensätze wurden angepasst; aktuelle Redaktionsreferenz und Prüferwartungen sind nachgezogen. Frage-/Wissensziel-IDs, Antworten, Lösungen, Schwierigkeiten und Variantenbezüge bleiben gleich. Keine Migration oder Erweiterung historischer Kompatibilitätslogik. Gesamtbestand weiterhin 15.295 Fragen / 14.628 Ziele in 39 Paketen.

## Prüfung

Gezielte Parser-, Redaktions-, Quellen-, Filmdaten- und Posterprüfungen einschließlich der tatsächlichen vorbereiteten Anzeigen aller gemeldeten Fragen. Der bestehende 240-Filme-Quellentest musste um den dokumentierten zusätzlichen AFI-Beleg ergänzt werden; sein Nachlauf war erfolgreich. Umfang und abschließende Nachweise stehen im [Prüfbericht](Pruefbericht.md#25102026--github-tickets-lokal-korrigiert).

Die Korrekturen werden bei einer später ausdrücklich beauftragten Veröffentlichung mit dem aktuellen Katalog aktiviert. Die bereits veröffentlichte Behebung von #6 kann separat beim Ticketabschluss erläutert werden.

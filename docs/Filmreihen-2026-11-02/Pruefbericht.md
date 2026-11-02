# Filmreihen und Teilnummern – 02.11.2026

Auf den Nutzerhinweis zur fehlenden Teilnummer bei „Die Mumie: Das Grabmal des Drachenkaisers“ den gesamten tatsächlich vorbereiteten App-Katalog abgeglichen, einschließlich der Filmverweise aus Personen-, Bilderkennungs- und Preisfragen. Mad Max, die beiden „Auf der Jagd …“-Filme und Top Gun wurden zusätzlich ausdrücklich benannt.

## Befund und Ursache

Die Teilnummer des dritten Mumie-Films war seit der Integration vom 07.10.2026 leer. Der Redaktionsentwurf bezeichnet ihn bereits als dritten Teil, speichert bei `series` aber nur den Namen. `scripts/prepare-expansion-20261007.mjs` überführt einen bloßen Namen in `position: null`. Die Anzeige blendet die Teilnummer bei diesem Wert regulär aus. Es handelt sich um eine fortbestehende Datenlücke.

Die allgemeinen alten Tests prüfen positive Nummern nur, **wenn bereits eine Nummer vorhanden ist**. Die späteren Korrekturen vom 25.10.2026 betrafen drei gemeldete Reihen; die Abnahme vom 26.10.2026 alle enthaltenen Mission-Impossible-Filme. Der damalige Prüfnachweis nimmt weitere Filmreihen ausdrücklich aus. Eine bestandene Gesamt-Testsuite belegte deshalb keine vollständige Reihenzuordnung.

## Vollständiger Bestandsabgleich

| Umfang | Ergebnis |
|---|---:|
| App-Pakete / Fragen | 39 / 15.295 |
| Unterschiedliche angezeigte Filmidentitäten, einschließlich Titelvarianten | 2.953 |
| Vorbereitete Filmdatenverweise | 14.911 |
| Bereits benannte Reihen ohne Nummer | 45 |
| Neu ergänzte Reihenzuordnungen | 326 |
| Entfernte irreführende bisherige Zuordnungen | 6 |
| Filmidentitäten mit nummerierter Reihe im Endstand | 624 |
| Ohne belegte nummerierte Filmreihe | 2.329 |
| Benannte Reihen ohne Nummer im Endstand | **0** |
| Widersprüchliche Reihendaten derselben Filmidentität im Endstand | **0** |

Die 45 leeren Nummern wurden durch konkrete Positionen oder eine begründete Entfernung der unzutreffenden Reihenzuordnung geklärt. Die sechs entfernten Angaben betreffen A Star Is Born (1954), Dune (1984), Ichimei (2011), King Kong (2005), Sahara (2005) und The Spiderwick Chronicles (2008): unabhängige Adaptionen oder eine Buch-/Fernsehreihe ergeben keine gemeinsame nummerierte Filmfortsetzung. Bei „Meine Nacht bei Maud“ die Veröffentlichungsposition von 3 auf 4 korrigiert; die abweichende dritte Position in Rohmers Erzählordnung bleibt im Hinweis erklärt.

| Ausdrücklich gemeldete Filme | Teilnummern |
|---|---|
| Die Mumie (1999), Die Mumie kehrt zurück (2001), Das Grabmal des Drachenkaisers (2008) | 1 / 2 / 3 |
| Mad Max (1979), Mad Max 2 (1981), Fury Road (2015) | 1 / 2 / 4 |
| Auf der Jagd nach dem grünen Diamanten (1984), Auf der Jagd nach dem Juwel vom Nil (1985) | 1 / 2 |
| Top Gun (1986), Top Gun: Maverick (2022) | 1 / 2 |

## Quellen und Abgrenzungen

Alle Filmidentitäten und vorhandenen Reihen wurden aus dem echten App-Parser und `preparePresentation` erhoben. Der anschließende Quellenabgleich berücksichtigt vorhandene Filmquellen, die bereits geprüften TMDB-Filmidentitäten des Posterbestands und die aktuellen TMDB-Film-/Sammlungsdaten. Bei Suchzuordnungen zusätzlich Titel, Jahr und bei mehrdeutigen beziehungsweise transliterierten Titeln den Regiecredit abgeglichen. 55 Identitäten waren über die automatische TMDB-Suche nicht eindeutig zuzuordnen; ihre vorhandenen Filmreferenzen und erkannten Reihenfälle wurden einzeln berücksichtigt. Eine fehlende TMDB-Sammlung ist kein Nachweis, dass ein Film unter keinen Umständen zu einer Reihe gehört.

Die 439 abgefragten Sammlungen wurden anhand ihrer enthaltenen Filme und Veröffentlichungsdaten auf passende Reihenabgrenzung durchgesehen. Sammlungen mit ausschließlich einem bis zum Prüfdatum veröffentlichten Film begründen keine neue Fortsetzungsreihe. Datenbankgruppen für bloß verwandte Filme, unabhängige Remakes und Aufführungsdokumentationen wurden ausgeschlossen oder fachlich enger gefasst. Einzelne fehlende Gruppen wie Cornetto, Daredevil/Elektra und TMNT zusätzlich über Film-/Verleihquellen ergänzt.

Wesentliche Abgrenzungen:

- James Bond: Eon-Zählung ohne „Sag niemals nie“; No Time to Die ist Teil 25. Die TMDB-Sammlung enthält zusätzlich den unabhängigen Film. [Offizielle Übersicht](https://www.aboutamazon.com/news/entertainment/james-bond-movies-watch-prime-video), [Filmverzeichnis](https://www.007.com/the-films/).
- Gendai Yakuza: Street Mobster ist Teil 6; die Datenbanksammlung enthält nur fünf Einträge. [Fachbeleg](https://filmint.nu/yakuzas-street-mobster/).
- Star Wars: Veröffentlichungsposition der neun Hauptfilme, Episodennummer und A-Star-Wars-Story-Ableger getrennt erläutert. [Lucasfilm](https://www.starwars.com/films).
- Winnetou: Teile 1 und 2 der Trilogie bleiben 1 und 2; der Hinweis nennt zusätzlich ihre zweite beziehungsweise vierte Position unter allen Pierre-Brice-Winnetou-Filmen. Apanatschi ist Teil 9 dieser umfassenderen Filmfolge. [Teil 1](https://de.wikipedia.org/wiki/Winnetou_1._Teil), [Teil 2](https://de.wikipedia.org/wiki/Winnetou_2._Teil), [Gesamtfolge](https://www.themoviedb.org/collection/9309).
- Themenzyklen und Kurzfilme ausdrücklich gekennzeichnet, etwa Cornetto, Dollar-Trilogie, Ranown, Rohmer und Antoine Doinel. [Cornetto beim Verleih](https://www.focusfeatures.com/article/making_you_scream_for_ice_cream), [Rohmer bei Criterion](https://www.criterion.com/boxsets/417-six-moral-tales), [Ranown bei Criterion](https://www.criterion.com/current/posts/8204-some-things-a-man-can-t-ride-around-budd-boetticher-s-ranown-westerns).

Die [vollständige Einzelprüfung](Pruefung.json) enthält alle 2.953 Identitäten mit Vorher-/Nachher-Zuordnung, Quellen, Methode und Verweiszahl. [Sammlungen.json](Sammlungen.json) bewahrt die gelesenen Titel-/Datumsfolgen einschließlich der ausdrücklich verworfenen Gruppen. Die unveränderten öffentlichen API-Rohantworten liegen als notwendige lokale Quellen unter `data/film-series-audit-2026-11-02/`; Zugangsdaten wurden nicht in Ergebnisse übernommen. Keine unabhängige Vollrecherche sämtlicher denkbarer thematischer Werkgruppen behauptet. „Keine Reihe hinterlegt“ bleibt eine Aussage über den belegten Datenstand.

## Umsetzung und Prüfungen

`src/filmSeries.json` führt für jede aktuell angezeigte Filmidentität eine bewusste Zuordnung oder `null`. `filmData` verwendet diese gemeinsame Redaktion für Filmfragen und sämtliche Personen-/Preisverweise; zusätzliche Reihenquellen werden mit den vorhandenen Filmquellen verbunden. Historische Paketmetadaten und Rohquellen bleiben unverändert erhalten. Frage-/Wissensziel-IDs, Frageinhalte, Lösungen, Schwierigkeiten, Varianten und Spielstände werden nicht verändert. Keine Migration, keine neue historische Kompatibilitätslogik.

44 gezielte Tests in neun Dateien erfolgreich: Filmreihen, Filmdaten, Komödie, Sci-Fi, Alle-Genres, frühere Ticketkorrekturen, Erweiterung 07.10., Genre100 und Schauspieler-Ergänzung. Abschließende Nachprüfung der zehn unmittelbar betroffenen Fälle nach letzten Quellen-/Einzelergänzungen erfolgreich. Der neue Gesamtkatalogtest prüft alle 14.911 vorbereiteten Verweise, identische Angaben je Filmidentität, redaktionelle Bestandsabdeckung und die tatsächliche React-Ausgabe der Teilnummer für jede der 624 nummerierten Filmidentitäten. Neue Filmidentitäten ohne Redaktionsdatensatz lassen diesen Test fehlschlagen. Konkrete Erwartungen für die gemeldeten Filme sowie Bond, Maud, Gendai Yakuza, Star Wars und Police Story ergänzen die strukturelle Prüfung. Die alten Rohquellen-Integritätsprüfungen bleiben erhalten; Clerks wird jetzt innerhalb seiner eigenen Filmreihe als Teil 1 geführt.

Laufzeitmetadaten/TypeScript und `git diff --check` erfolgreich. Keine Layoutänderung, keine vollständige Testsuite, kein Produktionsbuild und kein Browserlauf in diesem lokalen Änderungsblock. Kein Push, keine produktive Katalogaktivierung und keine Veröffentlichung. Die neuen Daten müssen bei einer ausdrücklich beauftragten Veröffentlichung gemeinsam mit dem vorbereiteten Fragenkatalog aktiviert werden; bis dahin bleibt der öffentliche Stand unverändert.

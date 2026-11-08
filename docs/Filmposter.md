# Filmposter nach der Antwort

## Fehlende TMDB-Links nachrecherchiert – 08.11.2026

**Alle 541 Filmfassungen ohne bisherige Posterzuordnung bei TMDB gefunden; nach der Recherche bleiben null ungeklärte Filmidentitäten.** Der aktuelle Katalog mit 19.403 Fragen enthält 1.946 Filmfassungen mit eigenen Film- oder Preisfragen, für die die App ein Poster samt TMDB-Link vorsieht. Der lokale und der zusätzlich lesend geprüfte öffentliche Posterindex enthalten weiterhin nur die 1.405 Zuordnungen vom 10.10.2026. Die Differenz betrifft 4.031 Fragen. Ein fehlender Posterlink belegt hier keine Datenbanklücke: Der vorbereitete Index wurde nicht mit dem gewachsenen Katalog ergänzt.

| Ergebnis der vollständigen Nachrecherche | Filmfassungen |
| --- | ---: |
| Bisher ohne Posterzuordnung und damit ohne Link am Poster | 541 |
| Eindeutig über Titel, Jahresdaten und Regie zugeordnet | 533 |
| Zusätzlich nach Einzelprüfung zugeordnet | 8 |
| Insgesamt nachträglich gefunden | 541 |
| Nach der Prüfung weiterhin ohne gefundenen TMDB-Eintrag | 0 |

Alle 541 gefundenen Einträge besitzen auch einen formal gültigen Posterpfad. Die Suche erfolgte frisch über die TMDB-API, einschließlich alternativer Titel, regionaler Startdaten und Personenaliase für die Regie. Bei 18 eindeutigen Treffern weicht das primäre TMDB-Startjahr vom Katalogjahr ab; passende regionale Startdaten bestätigen die Zuordnung. Die acht einzeln geprüften Fälle:

| Katalogfilm | Geprüfter TMDB-Eintrag | Besonderheit |
| --- | --- | --- |
| Naked Weapon (2002) | [TMDB 10855](https://www.themoviedb.org/movie/10855) | Regie als Tony Ching statt Ching Siu-tung; [Media Asia](https://www.mediaasia.com/En/Movies/Info/87/) bestätigt den vollständigen Namen Tony Ching Siu Tung. |
| Die Nibelungen: Siegfried von Xanten (1966) | [TMDB 5608](https://www.themoviedb.org/movie/5608) | Abweichender Haupttitel „Die Nibelungen, Teil 1: Siegfried“; verkürzte Suche und Abgleich mit [Terence Hills offizieller Filmografie](https://de.terencehill.com/index.php?sel=filmography&sub=136). |
| Die Nibelungen: Kriemhilds Rache (1967) | [TMDB 5609](https://www.themoviedb.org/movie/5609) | Abweichender Haupttitel mit „Teil 2“; Regie, Jahr und Besetzung mit [filmportal](https://www.filmportal.de/film/die-nibelungen-2-kriemhilds-rache_13039209dcdb444cb9e9bcbc328c9562) abgeglichen. |
| Dont Look Back (1967) | [TMDB 135](https://www.themoviedb.org/movie/135) | TMDB ergänzt „Bob Dylan“ im Haupttitel; Titel, Jahr und Regie mit [Criterion](https://www.criterion.com/films/28655-dont-look-back) bestätigt. |
| Winners & Sinners (1983) | [TMDB 25539](https://www.themoviedb.org/movie/25539) | TMDB verwendet „Winners and Sinners“ und eine andere kantonesische Umschrift; [Eureka](https://eurekavideo.co.uk/movie/the-lucky-stars-3-film-collection/) bestätigt Film, Regie und Handlung. |
| Die Farbe des Granatapfels / Sayat-Nova (1969) | [TMDB 26302](https://www.themoviedb.org/movie/26302) | Georgische beziehungsweise internationale Regieschreibweise Sergei Parajanov statt Sergei Paradschanow; mit [Criterion](https://www.criterion.com/films/29219-the-color-of-pomegranates) abgeglichen. |
| Der Mann, der zuviel wusste (1956) | [TMDB 574](https://www.themoviedb.org/movie/574) | Beide Hitchcock-Fassungen gefunden; [Universal](https://www.universalpicturesathome.com/movies/the-man-who-knew-too-much) bestätigt die gesuchte Fassung mit James Stewart und Doris Day. Der Film von 1934 wurde ausgeschlossen. |
| China Swordsman (1992) | [TMDB 18672](https://www.themoviedb.org/movie/18672) | Ching Siu-tung als Tony Ching; Jahr und Besetzung mit Jet Li und Brigitte Lin bestätigen Swordsman II. |

Der [maschinenlesbare Recherchebericht mit allen 541 Direktlinks](TMDB-Linkpruefung-2026-11-08.json) hält die kuratierten Zuordnungsentscheidungen und Quellen fest. Vollständige API-Antworten, Posterpfade und Zugangsdaten werden darin nicht archiviert. Grundlage der Filmsuche ist der [offizielle TMDB-Suchvertrag](https://developer.themoviedb.org/reference/search-movie).

**Umfang und Grenzen:** Dies ist der abgeschlossene Rechercheauftrag. Laufzeitindex und vorbereitete Serverdarstellungen wurden nicht geändert; die fehlenden Links sind noch nicht in die App übernommen oder veröffentlicht. Reine Filmverweise in Personenfragen gehören nicht zur Fehlmenge, weil dort kein eigenes Filmposter vorgesehen ist. Die bestehenden 1.405 Zuordnungen wurden auf Abdeckung geprüft, nicht vollständig neu recherchiert. Die Posterdateien wurden nicht einzeln auf Erreichbarkeit oder Bildmotiv geprüft. Keine Nutzerdaten verändert. Vollständigkeit, eindeutige Film-/TMDB-IDs, Abgleich aller 541 Kandidaten sowie `git diff --check` erfolgreich geprüft; keine Softwareänderung und deshalb kein neuer Build oder vollständiger Testlauf.

## Bisherige Bereitstellung

**25.10.2026 – Rambo-Motiv lokal korrigiert:** Ticket #3 betrifft das Motiv, nicht die Filmidentität. Für „First Blood“ ist ein passendes Poster visuell ausgewählt und in `src/reviewedFilmPosters.json` festgehalten. Der Betreiberlauf berücksichtigt diese redaktionelle Auswahl und prüft Film-ID und aktuelle Bildzugehörigkeit über TMDB; fehlt das ausgewählte Motiv, wird kein neuer Index freigegeben. Der lokale ignorierte Index enthält die neue Auswahl. Auswahlentscheidungen sind Projektquelle; API-Antworten und Bilder bleiben befristete Arbeitsdaten. Seit Version 85 am 28.10.2026 einschließlich Serverdarstellung veröffentlicht. [Befund und Abnahme](GitHub-Tickets-2026-10-25.md).

Stand: 10.10.2026. **Poster für alle Filmgenres und filmbezogenen Preisfragen seit Sites-Version 60 veröffentlicht.** [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-10-Version-60.json). Der vorhandene Zugang des Nutzers wurde nach seiner Anmeldung verwendet. Kein neuer Account, neuer Schlüssel oder neuer API-Antrag war erforderlich.

## Umfang und Darstellung

Der vollständige tatsächliche Onlinekatalog referenziert **1.405 Filmfassungen in 11.013 Fragen**: 1.302 Fassungen in 10.733 Filmfragen sowie 103 zusätzliche Fassungen aus den 280 Preisfragen. Maßgeblich sind `domain = Film`, vorhandener Originaltitel und Filmjahr sowie keine Personen-ID im Katalog `35ba8d20e83b30f5b285abc115ff69f1f416ffde0b44d945840548f18cc8721d`. Alle Genres einschließlich Classics und Arthouse sind erfasst. Keine Fragen wurden ergänzt oder geändert. Die frühere SciFi-Beschränkung entfällt.

Alle 1.405 Filmfassungen haben eine geprüfte TMDB-Zuordnung samt Posterpfad. Originaltitel, Erscheinungsdaten und Regie bestimmen die Fassung. Bei gleichnamigen Filmen wie Arrival und Oblivion entscheidet die passende Regie; Festivalpremieren und spätere Kinostarts werden über die veröffentlichten TMDB-Startdaten geprüft. Alternative Titel und englische Personendetails einschließlich bekannter Namensformen ergänzen die Identitätsprüfung. Die aktuellen Katalogtitel Alphaville, Chocolate und Vampyr sind ausdrücklich mit ihren vollständigen beziehungsweise originalsprachigen Titeln abgeglichen. Für Once (TMDB 5723) bestätigt [Screen Ireland](https://www.screenireland.ie/news-archive/view/518) die Galway-Aufführung im Vorjahr 2006; TMDB führt nur spätere Kinodaten 2007. Das bestehende Katalogjahr bleibt unverändert. Diese belegte Identitätszuordnung verändert keine Lern- oder Bestandsdaten.

`FilmPoster` erscheint ausschließlich in `Explanation`: nach bestätigter Antwort bei direkter Auflösung sowie im unmittelbaren Rundenrückblick. Bei gesammelten Lösungen erscheint das Poster erst im Rückblick. Vor der Lösung wird weder der Posterindex noch das Bild angefordert. Personenfragen bleiben ohne Filmposter. Erklärung und gegebenenfalls ein eigenständiger Antwortzusatz stehen vor dem Poster; „Die Idee dahinter“ und doppelte Erklärungen entfallen. [Kompakte Rückmeldung und Neu-Kennzeichnung](Lernregeln.md#kompakte-antwortansicht--10102026). Frage-IDs, Wissensziel-IDs, Kataloghash und Spielstände sind unverändert.

Bilder werden direkt per HTTPS von `image.tmdb.org` geladen, ohne API-Schlüssel im Browser. Der jeweilige TMDB-Filmnachweis steht am Poster; Hilfe → Bildquellen enthält das unveränderte offizielle Logo und den Anbieterhinweis. Nicht erreichbare Bilder werden ausgeblendet; Erklärung und Spielablauf bleiben verwendbar. Kein Offline-Paket und kein vorsorglicher Bilddownload.

## Zugang und Erneuerung

Die lokale Datei `.env.tmdb.local` enthält `TMDB_API_KEY`, ist durch die bestehende `.env.*`-Regel von Git ausgeschlossen und auf das aktuelle Windows-Konto sowie SYSTEM beschränkt. Keine Zugangsdaten in Dokumentation, Browsercode, Testkopie oder Veröffentlichungsartefakte übernehmen. API-Zugang niemals als `VITE_*`-Variable verwenden.

`npm run prepare:posters` liest im aktuellen lokalen Betreiberweg die offiziellen Fragenpakete unmittelbar ein und erzeugt `public/film-posters.json`; ein vorher erzeugtes Katalogarchiv ist nicht mehr erforderlich. `npm run prepare:server-content` übernimmt daraus die einzelne Zuordnung in jede passende Fragendarstellung. Der Browser lädt in dieser Folgeänderung keinen Gesamtindex mehr. Diese Änderung ist noch nicht ausgerollt. Der Index enthält nur Bildpfade und Filmzuordnungen, keine Zugangsdaten. Er ist ebenfalls von Git ausgeschlossen, damit TMDB-Antworten nicht dauerhaft in der Versionshistorie archiviert werden. Frische Projektkopien brauchen diese Betreiber-Vorbereitung für Poster. Normale Builds benötigen keine API-Zugangsdaten und führen keine TMDB-Anfragen aus. Ein fehlender Index verhindert das Spielen nicht.

Der normale Vorbereitungslauf ruft alle Daten frisch ab. `node scripts/prepare-film-posters.mjs --resume` setzt ausschließlich eine maximal 24 Stunden alte lokale Recherche fort; mehrdeutige oder fehlende Poster verhindern die Freigabe eines neuen Index. Rechercheantworten liegen ignoriert unter `tmp-film-posters/` und dürfen nicht dauerhaft archiviert werden.

Aktueller Index geprüft am **10.10.2026**, gültig bis **10.03.2027**. Vor Ablauf frisch vorbereiten, prüfen und im Rahmen einer ausdrücklich beauftragten Veröffentlichung austauschen. Die App zeigt abgelaufene Zuordnungen nicht mehr an. Betreiber müssen abgelaufene öffentliche Indizes, temporäre Recherchedateien und Veröffentlichungsartefakte rechtzeitig entfernen beziehungsweise ersetzen; die Anzeigegrenze ersetzt keine Löschung alter Kopien. Es wurde keine Erinnerung oder Automatisierung angelegt.

## Nutzung und Quellen

TMDB verlangt Quellenkennzeichnung und Logo; nichtkommerzielle Nutzung ist laut FAQ kostenlos. Die API-Bedingungen begrenzen das Caching auf sechs Monate und verlangen bei Beendigung die Entfernung gespeicherter Inhalte. Die Nutzung der API bestätigt nicht pauschal die Rechte an jedem Poster. Der Einbau ist keine neue rechtliche Rechteprüfung und keine Zusage kommerzieller Nutzbarkeit.

- [API-Anmeldung und Zugang](https://developer.themoviedb.org/docs/getting-started)
- [Kosten, Quellenkennzeichnung und rechtlicher Hinweis](https://developer.themoviedb.org/docs/faq)
- [API-Bedingungen, am 10.10.2026 im angemeldeten Browser gelesen](https://www.themoviedb.org/api-terms-of-use)
- [Offizielle Logos](https://www.themoviedb.org/about/logos-attribution)
- [Bildadressen](https://developer.themoviedb.org/docs/image-basics)
- [Filmsuche](https://developer.themoviedb.org/reference/search-movie) und [Filmdetails](https://developer.themoviedb.org/reference/movie-details)

## Prüfstand und Veröffentlichung

Alle 1.405 Bildadressen über reine HTTP-HEAD-Anfragen mit Status 200 geprüft, ohne Posterdateien herunterzuladen. Bei Juliet, Naked fehlt der Content-Type-Header trotz erfolgreicher Antwort; tatsächliche Bilddekodierung separat im isolierten Browser erfolgreich geprüft und mobile Ansicht visuell abgenommen. Die Zuordnung aller Filmfassungen wird beim Betreiberlauf gegen die bestehende Regie geprüft. Logik-/Browsernachweise, Prüfgrenzen und Build stehen im [Prüfbericht](Pruefbericht.md). Die Tests verwenden synthetische Konten und isolierte Browserprofile; keine echten Spielstände verändert. [Aktueller Online-Spielbetrieb](Anmeldung-und-Online-Spielstand.md).

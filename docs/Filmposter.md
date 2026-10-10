# Filmposter nach der Antwort

Stand: 10.10.2026. **TMDB-Zugang vorhanden und geprüft; Poster lokal auf alle Filmgenres und filmbezogenen Preisfragen erweitert.** SciFi-Poster sind seit Sites-Version 59 veröffentlicht. Der vorhandene Zugang des Nutzers wurde nach seiner Anmeldung verwendet. Kein neuer Account, neuer Schlüssel oder neuer API-Antrag war erforderlich.

## Umfang und Darstellung

Der vollständige tatsächliche Onlinekatalog referenziert **1.405 Filmfassungen in 11.013 Fragen**: 1.302 Fassungen in 10.733 Filmfragen sowie 103 zusätzliche Fassungen aus den 280 Preisfragen. Maßgeblich sind `domain = Film`, vorhandener Originaltitel und Filmjahr sowie keine Personen-ID im Katalog `35ba8d20e83b30f5b285abc115ff69f1f416ffde0b44d945840548f18cc8721d`. Alle Genres einschließlich Classics und Arthouse sind erfasst. Keine Fragen wurden ergänzt oder geändert. Die frühere SciFi-Beschränkung entfällt.

Alle 1.405 Filmfassungen haben eine geprüfte TMDB-Zuordnung samt Posterpfad. Originaltitel, Erscheinungsdaten und Regie bestimmen die Fassung. Bei gleichnamigen Filmen wie Arrival und Oblivion entscheidet die passende Regie; Festivalpremieren und spätere Kinostarts werden über die veröffentlichten TMDB-Startdaten geprüft. Alternative Titel und englische Personendetails einschließlich bekannter Namensformen ergänzen die Identitätsprüfung. Die aktuellen Katalogtitel Alphaville, Chocolate und Vampyr sind ausdrücklich mit ihren vollständigen beziehungsweise originalsprachigen Titeln abgeglichen. Für Once (TMDB 5723) bestätigt [Screen Ireland](https://www.screenireland.ie/news-archive/view/518) die Galway-Aufführung im Vorjahr 2006; TMDB führt nur spätere Kinodaten 2007. Das bestehende Katalogjahr bleibt unverändert. Diese belegte Identitätszuordnung verändert keine Lern- oder Bestandsdaten.

`FilmPoster` erscheint ausschließlich in `Explanation`: nach bestätigter Antwort bei direkter Auflösung sowie im unmittelbaren Rundenrückblick. Bei gesammelten Lösungen erscheint das Poster erst im Rückblick. Vor der Lösung wird weder der Posterindex noch das Bild angefordert. Personenfragen bleiben ohne Filmposter. Erklärung und gegebenenfalls ein eigenständiger Antwortzusatz stehen vor dem Poster; „Die Idee dahinter“ und doppelte Erklärungen entfallen. [Kompakte Rückmeldung und Neu-Kennzeichnung](Lernregeln.md#kompakte-antwortansicht--10102026). Frage-IDs, Wissensziel-IDs, Kataloghash und Spielstände sind unverändert.

Bilder werden direkt per HTTPS von `image.tmdb.org` geladen, ohne API-Schlüssel im Browser. Der jeweilige TMDB-Filmnachweis steht am Poster; Hilfe → Bildquellen enthält das unveränderte offizielle Logo und den Anbieterhinweis. Nicht erreichbare Bilder werden ausgeblendet; Erklärung und Spielablauf bleiben verwendbar. Kein Offline-Paket und kein vorsorglicher Bilddownload.

## Zugang und Erneuerung

Die lokale Datei `.env.tmdb.local` enthält `TMDB_API_KEY`, ist durch die bestehende `.env.*`-Regel von Git ausgeschlossen und auf das aktuelle Windows-Konto sowie SYSTEM beschränkt. Keine Zugangsdaten in Dokumentation, Browsercode, Testkopie oder Veröffentlichungsartefakte übernehmen. API-Zugang niemals als `VITE_*`-Variable verwenden.

Nach `npm run prepare:sync-catalog` erzeugt `npm run prepare:posters` anhand des tatsächlichen Katalogs den öffentlichen Index `public/film-posters.json`. Der Index enthält nur Bildpfade und Filmzuordnungen, keine Zugangsdaten. Er ist ebenfalls von Git ausgeschlossen, damit TMDB-Antworten nicht dauerhaft in der Versionshistorie archiviert werden. Frische Projektkopien brauchen diese Betreiber-Vorbereitung für Poster. Normale Builds benötigen keine API-Zugangsdaten und führen keine TMDB-Anfragen aus. Ein fehlender Index verhindert das Spielen nicht.

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

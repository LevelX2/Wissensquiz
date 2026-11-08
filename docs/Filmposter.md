# Filmposter nach der Antwort

Filmposter erscheinen nach bestätigter Antwort in der Auflösung und im Rundenrückblick. Vor der Lösung wird kein Poster angefordert. Personenfragen bleiben ohne Filmposter. Erklärung und Antwortzusatz stehen vor dem Bild.

Die Filmfassung wird über Originaltitel und Jahr bestimmt. Die aktuellen TMDB-IDs stehen in `src/filmTmdbIds.json`; sie gelten bei jeder Vorbereitung und verhindern eine erneute Zuordnung anhand ähnlich geschriebener Titel. Die redaktionelle Motivauswahl in `src/reviewedFilmPosters.json` bleibt verbindlich.

Bilder werden per HTTPS direkt von `image.tmdb.org` geladen. Der Link am Poster führt zur zugeordneten TMDB-Filmseite. Nicht erreichbare Bilder werden ausgeblendet. Hilfe → Bildquellen enthält das offizielle TMDB-Logo und den Anbieterhinweis.

## Vorbereitung und Erneuerung

- `npm run prepare:posters` liest den aktuellen Fragenkatalog, verwendet die gepflegten TMDB-IDs und erzeugt `public/film-posters.json`. Neue, noch nicht zugeordnete Filme werden anhand von Titeln, Jahresdaten und Regie gesucht. Fehlende oder widersprüchliche Zuordnungen verhindern die Freigabe eines neuen Index.
- `npm run prepare:server-content` übernimmt daraus jeweils das passende Poster und den TMDB-Link in die Fragendarstellung. Die Aktivierung dieser Inhalte gehört zur gesondert freizugebenden Veröffentlichung.
- Der lokale Zugang liegt ausschließlich in der ignorierten Datei `.env.tmdb.local` als `TMDB_API_KEY`. Keine Zugangsdaten in Browsercode, Testkopien oder Veröffentlichungsartefakte übernehmen; keine `VITE_*`-Variable verwenden.
- Der erzeugte Index und vollständige API-Antworten werden nicht versioniert. API-Antworten unter `tmp-film-posters/` nach erfolgreicher Vorbereitung entfernen. `--resume` verwendet ausschließlich Recherchedateien, die höchstens 24 Stunden alt sind.
- Zuordnungen besitzen ein Ablaufdatum innerhalb der zulässigen Cachefrist. Die App zeigt abgelaufene Poster nicht an. Rechtzeitig frisch vorbereiten und alte veröffentlichte Kopien ersetzen oder entfernen.
- Normale Builds benötigen keine TMDB-Zugangsdaten und führen keine API-Anfragen aus. Ein fehlender Index verhindert das Spielen nicht.

## Nutzung und Quellen

TMDB verlangt Quellenkennzeichnung und Logo. Die API-Bedingungen begrenzen das Caching auf sechs Monate; ein vorhandener API-Zugang ist keine pauschale Rechtefreigabe für jedes Poster.

- [API-Zugang](https://developer.themoviedb.org/docs/getting-started)
- [Quellenkennzeichnung und Anbieterhinweis](https://developer.themoviedb.org/docs/faq)
- [API-Bedingungen](https://www.themoviedb.org/api-terms-of-use)
- [Offizielle Logos](https://www.themoviedb.org/about/logos-attribution)
- [Bildadressen](https://developer.themoviedb.org/docs/image-basics)
- [Filmsuche](https://developer.themoviedb.org/reference/search-movie) und [Filmdetails](https://developer.themoviedb.org/reference/movie-details)

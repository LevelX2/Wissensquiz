# Filmposter nach der Antwort

Stand: 10.10.2026. **TMDB-Zugang vorhanden und geprüft; SciFi-Poster lokal eingebaut, noch nicht veröffentlicht.** Der vorhandene Zugang des Nutzers wurde nach seiner Anmeldung verwendet. Kein neuer Account, neuer Schlüssel oder neuer API-Antrag war erforderlich.

## Umfang und Darstellung

Der vollständige tatsächliche Onlinekatalog enthält **154 SciFi-Filmfassungen mit 1.173 Filmfragen**. Die frühere Angabe 153/1.168 war unvollständig und wird hier korrigiert; keine Fragen wurden ergänzt oder geändert. Maßgeblich sind `domain = Film`, `subdomain = Science-Fiction`, Originaltitel und Filmjahr im Katalog `35ba8d20e83b30f5b285abc115ff69f1f416ffde0b44d945840548f18cc8721d`.

Alle 154 Filmfassungen haben eine geprüfte TMDB-Zuordnung samt Posterpfad. Originaltitel, Erscheinungsdaten und Regie bestimmen die Fassung. Bei gleichnamigen Filmen wie Arrival und Oblivion entscheidet die passende Regie; Festivalpremieren und spätere Kinostarts werden über die veröffentlichten TMDB-Startdaten geprüft. Bekannte Schreibweisen von Katsuhiro Otomo, Junta Yamaguchi und Andrei Tarkovsky sind explizit abgeglichen.

`FilmPoster` erscheint ausschließlich in `Explanation`: nach bestätigter Antwort bei direkter Auflösung sowie im unmittelbaren Rundenrückblick. Bei gesammelten Lösungen erscheint das Poster erst im Rückblick. Vor der Lösung wird weder der Posterindex noch das Bild angefordert. Andere Genres und Personenfragen bleiben ohne Filmposter. Frage-IDs, Wissensziel-IDs, Kataloghash und Spielstände sind unverändert.

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

Alle 154 Bildadressen über reine HTTP-HEAD-Anfragen erfolgreich geprüft, ohne Posterdateien herunterzuladen. Die Zuordnung aller Filmfassungen wird beim Betreiberlauf gegen die bestehende Regie geprüft. Logik-/Browsernachweise, Prüfgrenzen und Build stehen im [Prüfbericht](Pruefbericht.md). Die Tests verwenden synthetische Konten und isolierte Browserprofile; keine echten Spielstände verändert. Kein Push und keine Veröffentlichung in diesem Auftrag. [Aktueller Online-Spielbetrieb](Anmeldung-und-Online-Spielstand.md).

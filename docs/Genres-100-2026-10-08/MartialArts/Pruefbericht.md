# Martial Arts & Asia-Film: Ausbau auf 100 Filme

Stand: 08.10.2026. Im autorisierten Worktree lokal eingebunden; noch nicht veröffentlicht.

## Ergebnis und Auswahl

75 vorhandene Filme / 630 Fragen wurden um **25 Filme und 200 Fragen** ergänzt. Damit sind **100 Filme mit 830 Fragen** enthalten. Der begründete [Klassikerkern](Klassikerkern.json) umfasst 14 vorher vorhandene und sechs ergänzte Werke. Fehlende Kernwerke hatten Vorrang; die übrige Auswahl berücksichtigt die lokal geschützte Filmsammlung. Private Einzelbesitzangaben werden nicht veröffentlicht.

Gesamtkatalog: **28 Pakete, 11.829 Fragen, 11.266 Wissensziele, 1.184 Filmfassungen und 9.789 Filmfragen**. Personen- und Preisfragen behalten ihren Bestand.

## Redaktion und Belege

Jeder neue Film hat zwei eigenständige Inhaltsziele je leicht, mittel und schwer sowie Jahr und vollständige Hauptregie: 150 Inhaltsziele, 25 Jahresziele, 25 Regieziele. Der Abgleich mit dem vollständigen Altbestand einschließlich Personen-/Preisfragen und den drei vorher ergänzten Genres ergab keine erforderliche Wissenszielvariante.

Alle Fragen besitzen vier vergleichbare Antwortmöglichkeiten mit individuellen Rückmeldungen, Erklärung, Vertiefung, Merksatz und Zielquellen. Bekanntheit und Schwierigkeit sind getrennt behandelt. [Lesefassung](Fragenlesefassung.md), [Quellennachweis](Quellennachweis.json), [Filmdaten](Filmdaten.json) und [formale Prüfung](Formale-Pruefung.json) sind vollständig.

Die unabhängigen Gegenprüfungen [001–009](Gegenpruefung-001-009.md), [010–017](Gegenpruefung-010-017.md) und [018–025](Gegenpruefung-018-025.md) haben alle 200 Fragen samt Optionen, Rückmeldungen, Vertiefungen und Metadaten gelesen. Sie präzisierten Belege, ergänzten Originaldarsteller, ersetzten schwache Fehlantworten und entfernten Lösungshinweise. Zusätzlich wurden zentral die Regie-/Reihenhinweise in die bereits bestehenden Metadatenfelder überführt und die Fehlantwort-Regiepaare bei Ong Bak 2 so korrigiert, dass kein Mitglied des richtigen Teams darin vorkommt. Keine neue Kompatibilitätslogik. Quellenlektüre und Zugriffsgrenzen sind dokumentiert; keine Filmsichtung oder zweite vollständige Produktionsrecherche behauptet.

A Touch of Zen verwendet den Beginn der ursprünglichen zweiteiligen Taiwan-Veröffentlichung 1970, mit ausdrücklicher Abgrenzung zur Fortsetzung/Gesamtfassung 1971 und abweichenden institutionellen Katalogjahren. Ong Bak 2 beginnt 2008 vor späteren internationalen Starts. Unleashed unterscheidet Produktionsjahr 2003 und belegten Frankreichstart 2005. Hauptregie und zusätzliche Einheiten sind getrennt, etwa Lo Wei gegenüber dem früh ausgeschiedenen Wu Chia-hsiang, Peter Chan gegenüber zusätzlicher Regie bei The Warlords und Wong Jing gegenüber Action-Choreografie. Twin Dragons und Ong Bak 2 führen beide Hauptregisseure. Abweichende Ländercredits bleiben nachvollziehbar dokumentiert. Der Löwentanz-Bezug beim Finale von Last Hero in China ist ausdrücklich die Einordnung des Rezensenten David Brook.

## Technische Abnahme

- 200 CSV-Zeilen rückgelesen und exakt mit der Redaktion verglichen. Acht verschiedene Wissensziele pro Film, vollständige Antwortfelder und gültige Quellenkeys; null formale Warnungen. CSV-SHA256: `706f9b8870a6fd78404c73d964ba565a7df4dc9e6a37495e7e094a92aaf4a4a4`.
- Echter App-Parser: alle Fragen akzeptiert; keine Ablehnungen, Duplikate, Warnungen oder Importprobleme. Wiederholungsimport unverändert; keine zusätzlichen Generatorfragen. Gesamter vorheriger Fragenbestand unverändert.
- Alle neuen Filmdaten/Bekanntheiten und 20 Kernreferenzen innerhalb echter Filmfragen bestätigt. Die 94 zuvor ergänzten Filmdatensätze bleiben unverändert. Redaktionsdatei, öffentliche CSV und erhaltene Rohquelle bytegleich.
- **387 Logiktests in 65 Dateien bestanden**, vollständiger Lauf mit zwei Workern und 8-GiB-Node-Heap.
- TypeScript und Produktionsbuild erfolgreich. Offline-Paket `film-0376002a585e`, 470 Dateien. Bestehende Paketannotations- und Bundlegrößenhinweise bleiben.
- **Neun Browserfälle in Chromium/Firefox bestanden**, mit isolierten Profilen, kontrollierter Testzeit und synthetischen Spielständen/Kontodiensten. Geprüft: 100 Martial-Arts-Filme / 830 Fragen, Erstveröffentlichung 1970 gegenüber 1971, Filmdaten erst nach der Antwort, exaktes Offline-CSV und unveränderter Nachladebestand. Abenteuer, Thriller, Action sowie Kontowiederaufnahme und Schutz lokaler Offlineabsichten erneut geprüft.

Keine echten Nutzerdaten verändert. Bestehender Importweg verwendet; keine neuen Lern-, Konto- oder Kompatibilitätswege. Lokaler Arbeitsbranch; Push und Veröffentlichung sind nicht beauftragt.

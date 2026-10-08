# Musik: Ausbau auf 100 Filme

Stand: 08.10.2026. Im autorisierten Worktree lokal eingebunden; noch nicht veröffentlicht.

## Ergebnis und Auswahl

76 vorhandene Filme / 638 Fragen wurden um **24 Filme und 192 Fragen** ergänzt. Damit sind **100 Filme mit 830 Fragen** enthalten. Der begründete [Klassikerkern](Klassikerkern.json) enthält 13 bereits vorhandene und sieben ergänzte Werke. Fehlende Kernwerke hatten Vorrang; die übrige Auswahl berücksichtigt die lokal geschützte Filmsammlung. Private Einzelbesitzangaben werden nicht veröffentlicht.

Gesamtkatalog: **29 Pakete, 12.021 Fragen, 11.457 Wissensziele, 1.208 Filmfassungen und 9.981 Filmfragen**. Personen- und Preisfragen behalten ihren Bestand.

## Redaktion und Belege

Jeder neue Film hat zwei eigenständige Inhaltsziele je leicht, mittel und schwer sowie Jahr und vollständige Hauptregie: 144 Inhaltsfragen, 24 Jahresfragen und 24 Regiefragen. Der Burton-Regiesachverhalt zu Sweeney Todd ist ausdrücklich als Variante von `SCHAUSPIELER-202610-P01-004-M-2` an dessen vorhandene Wissensziel-ID gebunden. Daher entstehen 191 neue Wissensziele. Andere bereits bestehende Personen-, Preis- und Filmziele wurden bei der Inhaltswahl berücksichtigt.

Alle Fragen besitzen vier vergleichbare Antwortmöglichkeiten, individuelle Rückmeldungen, Erklärung, Vertiefung, Merksatz und Zielquellen. Bekanntheit und Schwierigkeit sind getrennt; zentrale Schlussauflösungen tragen die passende Spoilerkennzeichnung. [Lesefassung](Fragenlesefassung.md), [Quellennachweis](Quellennachweis.json), [Filmdaten](Filmdaten.json) und [formale Prüfung](Formale-Pruefung.json) sind vollständig.

Die unabhängigen Gegenprüfungen [001–008](Gegenpruefung-001-008.md), [009–016](Gegenpruefung-009-016.md) und [017–024](Gegenpruefung-017-024.md) haben alle 192 Fragen samt Optionen, Rückmeldungen, Vertiefungen und Metadaten gelesen. Sie ergänzten Originaldarsteller, verbesserten Fehlantworten und entfernten Lösungshinweise. Der Knöchelbefund bei 42nd Street ist auf die sichere gemeinsame Aussage „Verletzung“ begrenzt. Gigi unterscheidet Minnellis Hauptregie und Walters' Musiknummer. Fiddler on the Roof führt die belegten Länder UK/Jugoslawien/USA, Yentl erläutert UK/USA. When You're Strange verwendet die Sundance-Erstveröffentlichung **2009** vor TV-/Kinostarts 2010. High School Musical 1/2 sind TV-Filme von 2006/2007; Teil 3 ist der Kinofilm von 2008. Quellenwidersprüche, Lektüre und Zugriffsgrenzen sind dokumentiert; keine vollständige Filmsichtung oder zweite vollständige Produktionsrecherche behauptet.

## Technische Abnahme

- 192 CSV-Zeilen rückgelesen und exakt mit der Redaktion verglichen; acht verschiedene Ziele je Film, vollständige Antwortfelder und gültige Quellenkeys, null formale Warnungen. CSV-SHA256: `364903c5bfaa6235fe03ba3d3f74eec5c44ebccf16019d98ced7cfd72900c00c`.
- Echter App-Parser: alle Fragen akzeptiert, keine Ablehnungen, Duplikate, Warnungen oder Importprobleme. Wiederholungsimport unverändert; keine zusätzlichen Generatorfragen. Gesamter vorheriger Fragenbestand unverändert.
- Filmdaten, Bekanntheiten und alle 20 Kernreferenzen bestätigt. Die 119 zuvor ergänzten Filmdatensätze bleiben unverändert. Redaktionsdatei, öffentliche CSV und erhaltene Rohquelle bytegleich.
- **388 Logiktests in 65 Dateien bestanden**, vollständiger Lauf mit zwei Workern und 8-GiB-Node-Heap.
- TypeScript und Produktionsbuild erfolgreich. Offline-Paket `film-30ffb29fdcd2`, 471 Dateien. Bestehende Paketannotations- und Bundlegrößenhinweise bleiben.
- **Zehn Browserfälle in Chromium/Firefox bestanden**, mit isolierten Profilen, kontrollierter Testzeit und synthetischen Spielständen/Kontodiensten. Geprüft: 100 Musikfilme / 830 Fragen, bestehende Burton-Wissenszielidentität, Erstveröffentlichung 2009 gegenüber 2010, Filmdaten erst nach der Antwort, exaktes Offline-CSV und unveränderter Nachladebestand. Die vorher erweiterten Genres sowie Kontowiederaufnahme und Schutz lokaler Offlineabsichten erneut geprüft.

Keine echten Nutzerdaten verändert. Bestehender Importweg verwendet; keine neuen Lern-, Konto- oder Kompatibilitätswege. Lokal im Arbeitsbranch; Push und Veröffentlichung sind nicht beauftragt.

# Western: Ausbau auf 100 Filme

Stand: 08.10.2026. Im autorisierten Worktree lokal eingebunden; noch nicht veröffentlicht.

## Ergebnis und Auswahl

76 vorhandene Filme / 640 Fragen wurden um **24 Filme und 192 Fragen** ergänzt. Damit sind **100 Filme mit 832 Fragen** enthalten. Der begründete [Klassikerkern](Klassikerkern.json) umfasst 16 vorhandene und vier ergänzte Werke; alle 20 Referenzen sind im Gesamtkatalog nachgewiesen. Fehlende Kernwerke hatten Vorrang, weitere Titel stammen bevorzugt aus der geschützten Filmsammlung. Private Einzelbesitzangaben werden nicht veröffentlicht.

Gesamtkatalog: **31 Pakete, 12.405 Fragen, 11.839 Wissensziele, 1.256 Filmfassungen und 10.365 Filmfragen**. Personen- und Preisfragen behalten ihren Bestand.

## Redaktion und Belege

Jeder neue Film hat zwei eigenständige Inhaltsziele je leicht, mittel und schwer sowie Jahr und vollständige Hauptregie: 144 Inhaltsfragen, 24 Jahresfragen und 24 Regiefragen. Alle 192 Fragen führen neue Wissensziele. Der vollständige vorhandene Film-, Personen- und Preisbestand und die bereits fertiggestellten Genreblöcke wurden beim Zielabgleich berücksichtigt. Ein wiederholtes Marshal-Ziel zu Wyatt Earp wurde durch Docs konkrete Messerabwehr ersetzt; Hollidays bereits abgefragte Tuberkulose wird ebenfalls nicht wiederholt.

Alle Fragen besitzen vier vergleichbare Antwortmöglichkeiten, individuelle Rückmeldungen, Erklärung, Vertiefung, Merksatz und Zielquellen. Bekanntheit und Schwierigkeit bleiben getrennt; zentrale Schlussauflösungen tragen die passende Spoilerkennzeichnung. [Lesefassung](Fragenlesefassung.md), [Quellennachweis](Quellennachweis.json), [Filmdaten](Filmdaten.json) und [formale Prüfung](Formale-Pruefung.json) sind vollständig.

Die Gegenprüfungen [001–008](Gegenpruefung-001-008.md), [009–016](Gegenpruefung-009-016.md) und [017–024](Gegenpruefung-017-024.md) haben sämtliche 192 Fragen mit allen Erklärungsfeldern und Metadaten gelesen und freigegeben. Pat Garrett folgt der Kinofassung 1973, trennt Rough-Cut-Vorführung 1986 und Turner-Restaurierung mit eingeladener DGA-Vorführung 1988. Die Yuma- und True-Grit-Originale verwenden gegenüber den vorhandenen Neuverfilmungen eigene konkrete Ziele. Bei Katie Elder bleibt die abweichend geschilderte Schussabsicht offen, die Frage beschränkt sich auf das bezeugte Geständnis. Gabriels Darsteller in Shenandoah folgt dem vollständigen AFI-Credit Eugene Jackson Jr. Hauptregie und zweite Einheit sind getrennt; die Trinity-Filme folgen der Originalhandlung. Cowboys hat Erstjahr 1972, Tom Horn 1980. Quigley berücksichtigt USA/Australien und unterscheidet Produktionsjahr, Länderstarts und spätere Klassifikation. Ned Kelly verwendet die spezifische Screen-Australia-Zuordnung Australien/UK und dokumentiert die weiter gefasste BFI-Zuordnung. Die Filmhandlung gilt nicht als Beweis historischer Schuld oder als unveränderte Geschichte.

Tatsächliche Lektüre, Quellenwidersprüche, Fassungsgrenzen und erfolglose Einzelabrufe sind in den Autoren-/Prüfberichten dokumentiert. Keine eigene Filmsichtung wird behauptet.

## Technische Abnahme

- 192 CSV-Zeilen rückgelesen und exakt mit der Redaktion verglichen; acht verschiedene Ziele je Film, vollständige Antwortfelder und gültige Quellenkeys, null formale Warnungen. CSV-SHA256: `ac690e2d168d5ebd5ec0b7dc130132a60b31fbac9409deeca44b484e57428229`.
- Echter App-Parser: alle Fragen akzeptiert; keine Ablehnungen, Duplikate, Warnungen oder Importprobleme. Wiederholungsimport unverändert; keine zusätzlichen Generatorfragen. Gesamter vorheriger Fragenbestand unverändert.
- Filmdaten, Bekanntheiten und alle 20 Kernreferenzen bestätigt. Die 167 zuvor ergänzten Filmdatensätze bleiben nach Identität vollständig unverändert. Redaktionsdatei, öffentliche CSV und erhaltene Rohquelle bytegleich.
- **390 Logiktests in 65 Dateien bestanden**, vollständiger Lauf mit zwei Workern und 8-GiB-Node-Heap.
- TypeScript und Produktionsbuild erfolgreich. Offline-Paket `film-b0ada8c5ac96`, 473 Dateien. Bestehende Paketannotations- und Bundlegrößenhinweise bleiben.
- **Zwölf Browserfälle in Chromium/Firefox bestanden**, mit isolierten Profilen, kontrollierter Testzeit und synthetischen Spielständen/Kontodiensten. Geprüft: 100 Westernfilme / 832 Fragen, Don Siegels Hauptregie gegenüber der zweiten Einheit, Mexiko als Koproduktionsland, Filmdaten erst nach der Antwort, exaktes Offline-CSV und unveränderter Nachladebestand. Die sechs vorher erweiterten Genres sowie Kontowiederaufnahme und Schutz lokaler Offlineabsichten wurden erneut geprüft.

Keine echten Nutzerdaten verändert. Bestehender Importweg verwendet; keine neuen Lern-, Konto- oder Kompatibilitätswege. Lokal im Arbeitsbranch; Push und Veröffentlichung sind nicht beauftragt.

# Action: Ausbau auf 100 Filme

Stand: 08.10.2026. Im autorisierten Worktree lokal eingebunden; noch nicht veröffentlicht.

## Ergebnis und Auswahl

75 vorhandene Filme / 628 Fragen wurden um **25 Filme und 200 Fragen** ergänzt. Damit sind **100 Actionfilme mit 828 Fragen** enthalten. Der begründete [Klassikerkern](Klassikerkern.json) umfasst 15 vorher vorhandene und fünf ergänzte Werke. Polizei-, Agenten-, Buddy-, Flucht- und Fahrzeugfilme sind vertreten; keine objektive Top-20-Rangliste. Fehlende Kernwerke hatten Vorrang, weitere Ergänzungen stammen überwiegend aus der lokal geschützten Filmsammlung. Private Einzelbesitzangaben werden nicht veröffentlicht.

Gesamtkatalog: **27 Pakete, 11.629 Fragen, 11.066 Wissensziele, 1.159 Filmfassungen und 9.589 Filmfragen**. Personen- und Preisfragen behalten ihren Bestand.

## Redaktion und Belege

Jeder neue Film hat zwei eigenständige Inhaltsziele je leicht, mittel und schwer sowie Jahr und vollständige Hauptregie: 150 Inhaltsziele, 25 Jahresziele, 25 Regieziele. Alle 200 Ziele sind neu; der Abgleich mit dem vollständigen Altbestand einschließlich Personen-/Preisfragen und den vorher ergänzten Abenteuer-/Thrillerfragen ergab keine erforderliche Wissenszielvariante.

Alle Fragen besitzen vier vergleichbare Antwortmöglichkeiten mit individuellen Rückmeldungen, Erklärung, Vertiefung, Merksatz und Zielquellen. Bekanntheit und Schwierigkeit sind getrennt behandelt. [Lesefassung](Fragenlesefassung.md), [Quellennachweis](Quellennachweis.json), [Filmdaten](Filmdaten.json) und [formale Prüfung](Formale-Pruefung.json) sind vollständig.

Die unabhängigen Gegenprüfungen [001–009](Gegenpruefung-001-009.md), [010–017](Gegenpruefung-010-017.md) und [018–025](Gegenpruefung-018-025.md) haben alle 200 Fragen samt Optionen, Rückmeldungen, Vertiefungen und Metadaten gelesen. Sie präzisierten Handlungsschritte, ergänzten Originaldarsteller, ersetzten schwache Fehlantworten und entfernten Lösungshinweise. Der Police-Story-Vergleich bei Bad Boys II ist ausdrücklich Elena Lazics BFI-Beurteilung; er wird nicht als Produktionszeugnis ausgegeben. Die Stilfrage zur Bourne Verschwörung beschränkt sich auf die tatsächlich belegte Handkamera und belebten realen Schauplätze. Quellenprüfung ist dokumentiert; keine Filmsichtung oder zweite vollständige Produktionsrecherche behauptet.

Erstjahre berücksichtigen Mad Max 1979 vor dem US-Start 1980, Express in die Hölle 1985 vor späterer Auswertung 1986, Liebesgrüße aus Moskau 1963 vor US-Start 1964 und Tropa de Elite 2007 vor internationalen Starts 2008. Einzelne abweichende Premieren-/Starttage bleiben ausdrücklich dokumentiert. Fluchtpunkt San Francisco fragt nicht den strittigen Wett-Wochentag oder eine nur in der UK-Fassung enthaltene Szene ab. Hauptregie und zweite Einheit sind getrennt: Peter R. Hunt bei Im Geheimdienst Ihrer Majestät, beide Hauptregisseure Neveldine/Taylor bei Crank, José Padilha gegenüber Phil Neilsons zweiter Einheit. Institutionell unterschiedlich katalogisierte Produktionsländer sind in den jeweiligen Notizen nachvollziehbar.

## Technische Abnahme

- 200 CSV-Zeilen rückgelesen und exakt mit der Redaktion verglichen. Acht verschiedene Wissensziele pro Film, vollständige Antwortfelder und gültige Quellenkeys; null formale Warnungen. CSV-SHA256: `46fdacde5fe67af36191457288d081dfa722699fae7638a77cb4416c0a8f0e3d`.
- Echter App-Parser: alle Fragen akzeptiert; keine Ablehnungen, Duplikate, Warnungen oder Importprobleme. Wiederholungsimport unverändert; keine zusätzlichen Generatorfragen. Gesamter vorheriger Fragenbestand unverändert.
- Alle neuen Filmdaten/Bekanntheiten und 20 Kernreferenzen innerhalb echter Filmfragen bestätigt. Redaktionsdatei, öffentliche CSV und erhaltene Rohquelle bytegleich.
- **386 Logiktests in 65 Dateien bestanden**, vollständiger Lauf mit zwei Workern und 8-GiB-Node-Heap.
- TypeScript und Produktionsbuild erfolgreich. Offline-Paket `film-5b0934a83be4`, 469 Dateien. Bestehende Paketannotations- und Bundlegrößenhinweise bleiben.
- **Acht Browserfälle in Chromium/Firefox bestanden**, mit isolierten Profilen, kontrollierter Testzeit und synthetischen Spielständen/Kontodiensten. Geprüft: 100 Actionfilme / 828 Fragen, Peter R. Hunt als Hauptregisseur gegenüber John Glens zweiter Einheit, Metadaten erst nach der Antwort, exaktes Offline-CSV und unveränderter Nachladebestand. Abenteuer/Thriller sowie Kontowiederaufnahme und Schutz lokaler Offlineabsichten erneut geprüft.

Keine echten Nutzerdaten verändert. Bestehender Importweg verwendet; keine neuen Lern-, Konto- oder Kompatibilitätswege. Lokaler Arbeitsbranch; Push und Veröffentlichung sind nicht beauftragt.

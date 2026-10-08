# Abenteuer: Ausbau auf 100 Filme

Stand: 08.10.2026. Im autorisierten Worktree lokal in den App-Katalog eingebunden, noch nicht veröffentlicht.

## Ergebnis und Auswahl

57 vorhandene Filme / 458 Fragen sind um 43 neue Filmfassungen / 344 Fragen ergänzt: **100 Abenteuerfilme und 802 Fragen**. Der begründete [Klassikerkern](Klassikerkern.json) umfasst 20 Werke, davon 15 vorher vorhandene und fünf ergänzte Klassiker. Die Liste ist eine redaktionelle Auswahl über verschiedene Abenteuertraditionen, keine objektive Rangliste. Danach wurden weitere Titel vorrangig anhand der lokal geschützten Sammlung ausgewählt; private Besitzzuordnungen werden nicht veröffentlicht.

Der vollständige lokale App-Katalog enthält jetzt 25 Pakete, 11.221 Fragen und 10.659 Wissensziele. 1.108 unterschiedliche Filmfassungen gehören zum Filmfragenbereich; Personen- und Preisfragen sind getrennte Bereiche. Alle vorherigen Fragen, IDs und Versionen bleiben erhalten.

## Redaktion und Belege

Alle 43 Filme liefern je zwei eigenständige Inhaltsziele auf leicht, mittel und schwer sowie je ein Jahres- und Regieziel: 258 Inhaltsziele, 43 Jahresziele, 43 Regieziele, insgesamt 344 neue Ziele. Keine Bestandsvarianten erforderlich. Bekannte Personen-/Preisziele wurden gezielt vermieden, etwa Rickmans Sheriffrolle, Master-and-Commander-Kamera-Oscar, Greystoke-Nachsynchronisation und Wilds Vorlagen-/Mutterrollenfragen.

Die [Lesefassung](Fragenlesefassung.md), [Quellennachweise je Ziel](Quellennachweis.json), [Filmdaten](Filmdaten.json) und [formale Prüfung](Formale-Pruefung.json) sind vollständig. Alle Fragen haben vier individuelle Antwortbegründungen, kurze Erklärung, Vertiefung und Merksatz. Jahresanker verbinden die Veröffentlichung mit einem konkreten weiteren Ereignis oder Werk. Bekanntheit ist redaktionell eingeschätzt und von Schwierigkeit getrennt.

Zentrale Redaktion und Gegenprüfung haben alle Filmblöcke gelesen. Die unabhängigen Berichte [001–015](Gegenpruefung-001-015.md), [016–030](Gegenpruefung-016-030.md) und [036–043](Gegenpruefung-036-043.md) dokumentieren fachliche Korrekturen, Lösungsschutz und plausiblere Alternativen. 031–035 wurden von der zentralen Redaktion mit den vollständigen Handlungsauszügen abgeglichen. Quellen wurden tatsächlich gelesen; eine erneute Filmsichtung oder zweite vollständige unabhängige Recherche wird nicht behauptet.

Abweichende Credits/Länderangaben stehen in den jeweiligen Filmdaten. Erstveröffentlichungen sind insbesondere Allan Quatermain **1986** (USA 1987) und Münchhausen **1988** (USA/Großbritannien 1989). Monte Christos zwei Teile von 1954 zählen als ein Werk. Disney-Regieteams sind vollständig. Königreich der Himmel verwendet Inhalte der Kinofassung; zusätzlich markierter deutscher Fassungsabgleich und Filmportal-Credits sind dokumentiert.

## Technische Abnahme

- CSV erneut eingelesen und exakt mit der Redaktion verglichen; alle IDs eindeutig, Quellenkeys gültig, acht verschiedene Wissensziel-IDs je Film, keine formalen Warnungen oder wörtlichen Lösungslecks.
- Echter App-Parser: 344 akzeptierte Zeilen, keine Ablehnungen, Duplikate, Warnungen oder Importprobleme. Wiederholungsimport unverändert; keine zusätzlichen Generatorfragen.
- Vorheriger vollständiger Fragenbestand im App-Test unverändert. Metadaten und Bekanntheit für alle neuen Fragen verfügbar; öffentliche CSV und erhaltene Rohquelle bytegleich.
- **383 Logiktests in 65 Dateien bestanden**, vollständiger Lauf mit zwei Workern und 8-GiB-Node-Heap. Anschließender Rücklauf von 16 relevanten Katalog-/Jahresfällen am endgültigen CSV ebenfalls erfolgreich.
- TypeScript und Produktionsbuild erfolgreich; Offline-Paket `film-a2677b7a29fa`, 467 Dateien. Bestehende Buildgrößen- und Paketannotationshinweise bleiben.
- **26 unterschiedliche Browserfälle bestanden**, ein bereits geplanter WebKit-Desktopfall übersprungen: 27 Fälle im Erstlauf, davon 22 erfolgreich, vier nach Korrektur erfolgreich wiederholt. Der Rücklauf enthielt sechs erfolgreiche Fälle einschließlich zweier Kontrollfälle. Chromium, Firefox und mobiles WebKit, isolierte Profile, kontrollierte Testzeit, ausschließlich synthetische Spielstände/Kontodienste.
- Neue Abenteuerfälle prüfen 100 Filme, vollständige Tarzan-Doppelregie erst zur Lösung, Allan-Quatermain-Erstjahr, exaktes Offline-CSV und idempotentes Nachladen. Weitere Fälle prüfen additive Quellenfilter, Sicherung, Offline-Wiederaufnahme und unveränderte Jahresantworten.

Frühere Testversuche scheiterten an veralteten historischen Paketabgrenzungen/Bestandszahlen, paralleler Last und einer 4-GiB-Speichergrenze. Historische Regressionen behalten jetzt ihren ursprünglichen Paketstand; aktuelle Prüfzahlen sind separat fixiert. Die Firefox-Erstübernahme wartet auf bestätigte Speicherung bis zu 20 Sekunden statt fünf. Kein neues Kontoprotokoll oder Kompatibilitätsweg. Keine fehlgeschlagenen Pflichtchecks offen; keine echten Nutzerdaten verändert. Veröffentlichung, Push und Online-/Duellkatalogfreigabe sind nicht Teil dieses Blocks.

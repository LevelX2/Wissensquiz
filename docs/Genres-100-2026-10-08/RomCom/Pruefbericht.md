# Rom-Com: Ausbau auf 100 Filme

Stand: 08.10.2026. Im autorisierten Worktree lokal eingebunden; noch nicht veröffentlicht.

## Ergebnis und Auswahl

76 vorhandene Filme / 638 Fragen wurden um **24 Filme und 192 Fragen** ergänzt. Damit sind **100 Filme mit 830 Fragen** enthalten. Der begründete [Klassikerkern](Klassikerkern.json) umfasst 13 vorhandene und sieben ergänzte Werke. Das bereits unter Komödie geführte Kernwerk The Apartment bleibt dort zugeordnet; alle 20 Kernreferenzen sind im Gesamtkatalog abgedeckt. Fehlende Kernwerke hatten Vorrang, weitere Titel stammen bevorzugt aus der geschützten Filmsammlung. Private Einzelbesitzangaben werden nicht veröffentlicht.

Gesamtkatalog: **30 Pakete, 12.213 Fragen, 11.647 Wissensziele, 1.232 Filmfassungen und 10.173 Filmfragen**. Personen- und Preisfragen behalten ihren Bestand.

## Redaktion und Belege

Jeder neue Film hat zwei eigenständige Inhaltsziele je leicht, mittel und schwer sowie Jahr und vollständige Hauptregie: 144 Inhaltsfragen, 24 Jahresfragen und 24 Regiefragen. Die Regiefragen zu Annie Hall und Silver Linings Playbook teilen ausdrücklich die Wissensziel-IDs von `SCHAUSPIELER-202610-P01-070-S-1` beziehungsweise `SCHAUSPIELER-202610-P01-081-S-2`. Deshalb entstehen 190 neue Wissensziele. Der gesamte vorhandene Film-, Personen- und Preisbestand wurde beim Zielabgleich berücksichtigt.

Alle Fragen besitzen vier vergleichbare Antwortmöglichkeiten, individuelle Rückmeldungen, Erklärung, Vertiefung, Merksatz und Zielquellen. Bekanntheit und Schwierigkeit bleiben getrennt; zentrale Schlussauflösungen tragen die passende Spoilerkennzeichnung. [Lesefassung](Fragenlesefassung.md), [Quellennachweis](Quellennachweis.json), [Filmdaten](Filmdaten.json) und [formale Prüfung](Formale-Pruefung.json) sind vollständig.

Die Gegenprüfungen [001–008](Gegenpruefung-001-008.md), [009–016](Gegenpruefung-009-016.md) und [017–024](Gegenpruefung-017-024.md) haben sämtliche 192 Fragen einschließlich Optionen, Rückmeldungen, Vertiefungen und Metadaten gelesen. Die Prüfung korrigierte den Erinnerungsbericht zur Figur Amanda und Cole Porters Lied in Adam's Rib, prüfte die Prozessrollen gegen zusätzliche Filmforschung und Dialogbelege und verbesserte mehrere Fehlantworten. Harold and Maude vermeidet eine unbelegte Zuordnung des Tattoos zu einem bestimmten Lager. Bend It Like Beckham verwendet den britischen Erststart 2002 und die BFI-Länder UK/Deutschland; die abweichende AFI-Zuordnung einschließlich USA und der US-Start 2003 bleiben sichtbar erläutert. Love, Rosie belegt UK/Deutschland zusätzlich über filmportal. Im Juli folgt dessen Produktionsland Deutschland und unterscheidet institutionelle Angaben von einem Nutzerkommentar. Keinohrhasen trennt Til Schweigers Hauptregie von Torsten Künstlers zweiter Einheit. Love, Simon verwechselt eine nachfolgende TV-Serie nicht mit einem weiteren Kinofilm. Quellenwidersprüche, tatsächliche Lektüre und Zugriffsgrenzen sind in den Prüfberichten dokumentiert; eine Filmsichtung wird nicht behauptet.

## Technische Abnahme

- 192 CSV-Zeilen rückgelesen und exakt mit der Redaktion verglichen; acht verschiedene Ziele je Film, vollständige Antwortfelder und gültige Quellenkeys, null formale Warnungen. CSV-SHA256: `67ee8b27e27e51ed654d869c6446ddcd5318398860f609208931f5094c07c4cf`.
- Echter App-Parser: alle Fragen akzeptiert, keine Ablehnungen, Duplikate, Warnungen oder Importprobleme. Wiederholungsimport unverändert; keine zusätzlichen Generatorfragen. Gesamter vorheriger Fragenbestand unverändert.
- Filmdaten, Bekanntheiten und alle 20 Kernreferenzen bestätigt. Die 143 zuvor ergänzten Filmdatensätze bleiben nach Identität vollständig unverändert. Redaktionsdatei, öffentliche CSV und erhaltene Rohquelle bytegleich.
- **389 Logiktests in 65 Dateien bestanden**, vollständiger Lauf mit zwei Workern und 8-GiB-Node-Heap.
- TypeScript und Produktionsbuild erfolgreich. Offline-Paket `film-67af60bedd08`, 472 Dateien. Bestehende Paketannotations- und Bundlegrößenhinweise bleiben.
- **Elf Browserfälle in Chromium/Firefox bestanden**, mit isolierten Profilen, kontrollierter Testzeit und synthetischen Spielständen/Kontodiensten. Geprüft: 100 Rom-Com-Filme / 830 Fragen, beide bestehenden Regieziele, Filmdaten erst nach der Antwort, exaktes Offline-CSV und unveränderter Nachladebestand. Die vorher erweiterten Genres sowie Kontowiederaufnahme und Schutz lokaler Offlineabsichten wurden erneut geprüft. Ein zunächst belegter Vorschauport wurde durch Beenden des eigenen Vorschauservers freigegeben; der vollständige Lauf mit dem Playwright-Testserver ist erfolgreich.

Keine echten Nutzerdaten verändert. Bestehender Importweg verwendet; keine neuen Lern-, Konto- oder Kompatibilitätswege. Lokal im Arbeitsbranch; Push und Veröffentlichung sind nicht beauftragt.

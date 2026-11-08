# Animationsfilme und Serien

## Aktueller Fachbestand

Lokal vollständig redigiert und geprüft, nicht veröffentlicht. 1.104 zusätzliche Fragen mit 1.104 eigenständigen Wissenszielen behandeln 200 verschiedene Werkidentitäten. Jede Frage und jedes Werk wird für diese Abdeckung genau einem Bereich zugerechnet; weitere passende Genres bleiben erhalten.

| Auswahlbereich | Werke | Neue Fragen/Ziele | Leicht | Mittel | Schwer |
|---|---:|---:|---:|---:|---:|
| Animationsfilme | 50 | 204 | 50 | 104 | 50 |
| Science-Fiction-Serien | 50 | 300 | 100 | 100 | 100 |
| Fantasy-Serien | 50 | 300 | 100 | 100 | 100 |
| Serien anderer Genres | 50 | 300 | 100 | 100 | 100 |
| Gesamt | 200 | 1.104 | 350 | 404 | 350 |

Die Filmauswahl wurde mit der dokumentierten persönlichen Sammlung abgeglichen. Private Sammlungsdaten bleiben außerhalb der versionierten Fachbestände. 22 erstmals vollständig redigierte Filmblöcke enthalten je zwei eigenständige Inhaltsziele auf leicht, mittel und schwer sowie Jahr und vollständige Regie: insgesamt 176 neue Ziele. Bei 28 weiteren Filmen werden 241 vorhandene spielbare Werkziele angerechnet und je ein weiteres Inhaltsziel ergänzt. Die Abnahme prüft die tatsächlichen Werkfragen; Personen- und Preisfragen ersetzen keine fehlenden Mindestplätze. Alle 150 Serienblöcke enthalten je sechs unabhängige Inhaltsziele mit 2/2/2-Verteilung. Gestaltungs- und Erzählwissen bleibt entsprechend dem Redaktionsvertrag zulässig.

Keine neuen Varianten. Die 753 vorhandenen Variantenbezüge bleiben erhalten. Bereits vorhandene Rollenkenntnisse unter anderem zu Woody/Tom Hanks, Marlin/Albert Brooks, Mufasa/James Earl Jones und der Großmutter in Persepolis/Danielle Darrieux wurden bei der Zielwahl berücksichtigt. Alle 19.403 bisherigen Frageobjekte sind gegenüber dem abgeglichenen Main-Stand feldgleich erhalten; Fragen- und Wissensziel-IDs bleiben stabil.

## Werkdaten und Belege

Neue Fragen stehen unmittelbar in den aktuellen Genrebeständen beziehungsweise `content/serienfragen.jsonl`. `src/editorialFilmFacts.json` enthält die geprüften Metadaten der 22 neuen Filmblöcke und ihre Belege, keine Fragenkopien. Film/Serie, Genres, Machart und kuratierte Zuordnungen bleiben getrennte Merkmale. Animation ersetzt kein Genre; die übergreifende Serienauswahl ist ebenfalls kein Genre. Vorhandene Bekanntheitseinstufungen des gemeinsamen Bestands haben Vorrang vor abweichenden Neueinschätzungen derselben Werkidentität; Schwierigkeit bleibt davon unabhängig.

Deutsche, originale und international gebräuchliche Titel wurden mit den konkreten Fassungen abgeglichen. Filmvarianten stehen in `src/filmAlternativeTitles.json`. Serien führen geprüfte Bezeichnungen in `series_title_de`, `series_title_original` und gegebenenfalls `series_alternative_titles`; `series_title_sources` nennt die Belege. Frage, Titel und alle vier Optionen wurden gemeinsam auf Lösungshinweise geprüft. Geprüfte Staffel-/Folgenbezüge sind im typisierten Werkbezug enthalten; pauschale Gesamtregien werden Serien nicht zugeschrieben. Pilotveröffentlichungen, reguläre Serienstarts und Neuauflagen sind in der Titel-/Identitätsrecherche abgegrenzt.

Die 708 verschiedenen Beleg-URLs stehen bei den aktuellen Fragen. Abweichende externe Angaben, etwa zu Co-Regie, Produktionsländern oder Premieren, sind an den betroffenen Filmdaten erläutert. Bei gemeinsamen Regiecredits werden vollständige Teams verwendet. Originalstimmen und Darsteller werden unterschieden; Jahresvertiefungen enthalten individuelle zeitliche Bezüge.

## Quellen und Links

Die vorhandene Gestaltung der Quellenklappe bleibt maßgeblich. Die Quellenbeschriftung berücksichtigt Serientitel und konkrete Werkbezüge. Neue Anbieterkennungen werden nur nach bestätigtem Identitätsabgleich ergänzt; ParaNorman besitzt einen so bestätigten IMDb-Eintrag. Von den 200 hier behandelten Werkidentitäten sind derzeit 38 IMDb- und 37 OFDb-Direktprofile im Anzeigeregister bestätigt. Für die übrigen 162 beziehungsweise 163 fehlen zusätzliche bestätigte Direktprofile; die fachlichen Belege sind vorhanden. Unbestätigte Profile werden nicht durch geratene URLs ersetzt. [Verweisvertrag](Quellen-und-Links.md).

## Abnahme

Der Gesamtbestand umfasst 20.507 Fragen, 19.754 Ziele und 753 Variantenbezüge in 15 Fachdateien. `npm run check:questions` bestätigt Schema, eindeutige IDs, Variantenbezüge, Bereichszuordnung, unabhängige Einlesereihenfolge, Idempotenz, Sicherungsvalidierung und verlustfreie Kodierung. Hash und aktuelle Zählungen stehen in [Fragedaten-Pruefung.json](Fragedaten-Pruefung.json).

TypeScript und 91 gezielte Tests in 14 Dateien bestanden, einschließlich der Mindestabdeckung von 50 Werken je Bereich, spielbarer Filmziele, Quellenbeschriftung, Filmreihen, Titel-/Jahresschutz, Werkzuordnungen, Zeitkonto und Kodierung. Die interne Kataloggrenze wurde für den Bestand über 20.000 Fragen auf 100.000 angehoben; der tatsächliche Katalog und ein daraus gestarteter Zeitkontolauf sind validiert. Keine neue Sicherungsoberfläche.

54 komplexe Fragen einschließlich aller Antwortoptionen liegen bei 61–74 Wörtern über dem Richtwert von 60. Die präzisen Staffel-/Folgenabgrenzungen, Originaldarsteller-/Stimmenhinweise und vergleichbaren Handlungsalternativen bleiben dort für eindeutige Lösungen erhalten. Dazu zählen etwa die Familien-/Zeitebenen in Your Name, der Schlusskonflikt in Isle of Dogs und die Zukunftseingriffe in Continuum. Keine Mengen- oder Schwierigkeitslücken. Zusätzliche Datenbankprofile sind der verbleibende Linkpflegepunkt. Keine Veröffentlichung, kein Push und keine produktive Datenbankänderung. [Prüfnachweis](Pruefbericht.md).

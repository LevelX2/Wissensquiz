# Horror: Ausbau auf 100 Filme

Stand: 08.10.2026. Im autorisierten Worktree lokal eingebunden und vollständig geprüft; noch nicht veröffentlicht.

## Ergebnis und Auswahl

77 vorhandene Filme / 643 Fragen wurden um **23 Filme und 184 Fragen** ergänzt. Damit sind **100 Filme mit 827 Fragen** enthalten. Der begründete [Klassikerkern](Klassikerkern.json) umfasst zwölf vorhandene und acht ergänzte Werke; alle 20 Referenzen sind im Gesamtkatalog nachgewiesen. Fehlende Kernwerke hatten Vorrang, weitere Titel stammen bevorzugt aus der geschützten Filmsammlung. Alien und The Thing bleiben in ihrer vorhandenen Science-Fiction-Zuordnung. Private Einzelbesitzangaben werden nicht veröffentlicht.

Gesamtkatalog: **33 Pakete, 12.773 Fragen, 12.207 Wissensziele, 1.302 Filmfassungen und 10.733 Filmfragen**. Alle zwölf Filmgenres haben mindestens 100 Filme. Die neun beauftragten Blöcke ergänzen zusammen **237 Filme und 1.896 Fragen**.

## Redaktion und Quellen

Jeder neue Film besitzt zwei eigenständige Inhaltsziele je leicht, mittel und schwer sowie Erstjahr und vollständige Hauptregie: 138 Inhaltsfragen, 23 Jahresfragen und 23 Regiefragen. Alle 184 Horrorfragen führen neue Wissensziele; keine zusätzliche Variantenbindung erforderlich. Der gesamte Altbestand einschließlich Personen-/Preisfragen und die acht zuvor fertigen Genreblöcke wurden in den Zielabgleich einbezogen.

Vier vergleichbare Optionen und individuelle Rückmeldungen, Kurztext, Vertiefung, Merksatz, Interesse und konkrete Zielquellen sind vollständig. Bekanntheit bleibt von Schwierigkeit getrennt. Zentrale Enthüllungen und Todesfolgen tragen hohen Spoilerstatus. [Lesefassung](Fragenlesefassung.md), [Quellennachweis](Quellennachweis.json), [Filmdaten](Filmdaten.json) und [formale Prüfung](Formale-Pruefung.json) dokumentieren das Paket.

Die unabhängigen Gegenprüfungen [001–008](Gegenpruefung-001-008.md), [009–016](Gegenpruefung-009-016.md) und [017–023](Gegenpruefung-017-023.md) haben alle 184 Frageobjekte mit sämtlichen Feldern und Metadaten freigegeben. Die Wurzel hat alle Autoren-/QA-Berichte und sämtliche Gegenkorrekturen vollständig gelesen; den letzten Block prüfte sie selbst unabhängig. Die Spiegelziele unterscheiden den konkreten Nachweisgegenstand in Dracula 1931 von der verräterischen Splitterfolge in Fright Night. Die neue Peggy-/Janet-Beziehung wiederholt nicht das alte Warrens-Paarziel.

Universal-Dracula auf Englisch und Hammer-Dracula, RKO-Katzenmenschen und Remake, Hitcher-Original und Remake sowie Ju-on-Video-/Kino-/US-Fassungen bleiben getrennt. Vampyr bezieht sich auf die restaurierte deutsche Fassung mit Allan Gray. Hauptregie ist von Kamera, Produktion, zweiter Einheit und früheren Regieplänen getrennt; bei Frankenstein wird die historische Creditänderung und die vollständige restaurierte Handlung präzisiert. Originaldarsteller sind angegeben, öffentliche Namensformen werden erhalten.

Erstveröffentlichungen sind von Copyright, Dreharbeit und späterem Länderstart getrennt: Insidious **2010** vor Kinoauswertung 2011, Hostel **2005** vor US-Kino 2006, Ju-on **2002** vor Japanstart Januar 2003. Der Augusttermin 2003 gehört dessen Fortsetzung. Alle Jahresvertiefungen führen einen belegten zweiten Sachverhalt, beide Jahre und den Abstand. Der zunächst falsche Cannes-Presseheft-Seitenverweis wurde durch tatsächliche PDF-Lektüre geklärt; Longs Stirb langsam 4.0 / 2007 steht auf PDF-/Druckseite 23, nicht 22.

Institutionelle Länderbelege führen Vampyr Deutschland/Frankreich gegenüber Criterion Dänemark, Conjuring 2 UK/USA gegenüber dem engeren Artikel, Hostel USA/Tschechien, Jeepers Creepers Deutschland/USA und Insidious UK/Kanada/USA. Drehorte sind keine automatischen Produktionsländer. Die falsche Nationalgarde-Synopsis der Hills-Studioseite wird nicht als Carter-Handlungsbeleg verwendet. Halloween III fragt weder die strittige TV-Uhrzeit noch einen gesicherten Ursprung der robotischen Ellie oder vollständige Gesamtrettung. Phantasm-Traumerklärung, Evil Eds endgültiger Tod und Carters Schlussende bleiben angemessen begrenzt.

Tatsächliche Quellenlektüre und enger cachegestützte Details sind in den Berichten sichtbar. Referierte Universal-Produktionsnotizen werden nicht als separat gelesene Originale ausgegeben. Keine eigene Filmsichtung behauptet. Keine offenen redaktionellen Blocker.

## Technische Abnahme

- 184 CSV-Zeilen exakt rückgelesen; acht unterschiedliche Ziele je Film, vollständige Rückmeldungen und gültige Quellen, null formale Warnungen. CSV-SHA256: `1b241b0274b6ad1025b345217a8e0613f860f04a6c733cdee4345ee2aae92b81`.
- Echter App-Parser: alle Fragen akzeptiert, keine Ablehnungen, Duplikate, Warnungen oder Importprobleme. Wiederholungsimport unverändert, keine zusätzlichen Generatorfragen. Vollständiger vorheriger Fragenbestand erhalten.
- Filmdaten, Bekanntheiten und alle 20 Kernreferenzen bestätigt. Die 214 vorher ergänzten Filmdatensätze sind nach Identität vollständig unverändert. Öffentliche CSV, Redaktions-CSV und erhaltene Rohquelle bytegleich.
- **392 Logiktests in 65 Dateien bestanden**, vollständiger Lauf mit zwei Workern und 8-GiB-Node-Heap.
- TypeScript und Produktionsbuild erfolgreich. Offline-Paket `film-2b8e9de7a89c`, 475 Dateien. Bestehende Hinweise zu Paketannotationspositionen und Bundlegröße bleiben.
- **14 Browserfälle in Chromium/Firefox abgenommen**: 13 unveränderte Fälle im gemeinsamen Lauf erfolgreich; der neue Horrorfall nach Korrektur seines synthetischen Rundenablaufs in gezielter Wiederholung erfolgreich. Der erste Testversuch startete eine zweite Runde nach bloßem Pausieren. Der korrigierte Test beendet die Runde über die Oberfläche und bestätigt den gespeicherten Abschluss. Keine App-Reparatur oder neue Sonderlogik erforderlich.
- Horror-Browserfall bestätigt 100 Filme / 827 Fragen, beide Festival-Erstjahre, Filmdaten erst nach der Antwort, spätere Kinojahre in der Vertiefung, exaktes Offline-CSV und unveränderten Nachladebestand. Vorherige Genreblöcke und beide Kontofälle erfolgreich. Isolierte Browserprofile, kontrollierte Testzeit, synthetische Kontodienste und Spielstände.

Keine echten Nutzerdaten verändert. Bestehender Importweg verwendet; keine neuen Lern-, Konto- oder Kompatibilitätswege. Lokal im Arbeitsbranch; Push und Veröffentlichung sind nicht beauftragt.

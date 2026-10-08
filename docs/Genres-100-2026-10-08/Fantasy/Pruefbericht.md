# Fantasy: Ausbau auf 100 Filme

Stand: 08.10.2026. Im autorisierten Worktree lokal eingebunden und vollständig geprüft; noch nicht veröffentlicht.

## Ergebnis und Auswahl

77 vorhandene Filme / 648 Fragen wurden um **23 Filme und 184 Fragen** ergänzt. Damit sind **100 Filme mit 832 Fragen** enthalten. Der begründete [Klassikerkern](Klassikerkern.json) umfasst 14 vorhandene und sechs ergänzte Werke; alle 20 Referenzen sind im Gesamtkatalog nachgewiesen. Fehlende Kernwerke hatten Vorrang, weitere Titel stammen bevorzugt aus der geschützten Filmsammlung. Private Einzelbesitzangaben werden nicht veröffentlicht.

Gesamtkatalog: **32 Pakete, 12.589 Fragen, 12.023 Wissensziele, 1.279 Filmfassungen und 10.549 Filmfragen**. Personen-, Preis- und vorhandene Filmfragen behalten ihren Bestand.

## Redaktion und Quellen

Jeder neue Film besitzt zwei eigenständige Inhaltsziele je leicht, mittel und schwer sowie Jahr und vollständige Hauptregie: 138 Inhaltsfragen, 23 Jahresfragen und 23 Regiefragen. Alle 184 Fragen führen neue Wissensziele; keine zusätzliche Variantenbindung war erforderlich. Der gesamte Altbestand einschließlich Personen-/Preisfragen sowie die sieben zuvor fertigen Genres wurden in den Zielabgleich einbezogen. Die unterschiedlichen Belle-/Aladdin-Fassungen und Shrek-Abenteuer verwenden eigene Ziele.

Vier vergleichbare Optionen und individuelle Rückmeldungen, Kurztext, Vertiefung, Merksatz, Interesse und Zielquellen sind vollständig. Bekanntheit bleibt von Schwierigkeit getrennt. Zentrale Enthüllungen und Schlussauflösungen tragen hohen Spoilerstatus. [Lesefassung](Fragenlesefassung.md), [Quellennachweis](Quellennachweis.json), [Filmdaten](Filmdaten.json) und [formale Prüfung](Formale-Pruefung.json) dokumentieren das vollständige Paket.

Die unabhängigen Gegenprüfungen [001–008](Gegenpruefung-001-008.md), [009–016](Gegenpruefung-009-016.md) und [017–023](Gegenpruefung-017-023.md) haben alle 184 Frageobjekte mit sämtlichen Feldern und Metadaten gelesen und freigegeben. Die Wurzel hat alle Autoren-/QA-Berichte und alle 25 Gegenkorrekturen der ersten beiden Blöcke vollständig gelesen und den letzten Block selbst unabhängig geprüft. Die richtige Zeitoption bei Fiona wurde durch die ausdrücklich gefragte Ogerverwandlung eindeutig; Meridas Zielübungen grenzen ihre ebenfalls belegte Schwertfertigkeit ab. Der Schüsselzugang in NIMH bleibt trotz unterschiedlicher Quellenangabe zum Schüsselinhalt korrekt neutral formuliert.

Berger, Powell und Whelan bilden das vollständige Hauptteam von Der Dieb von Bagdad; Rankin/Bass das von Das letzte Einhorn. Merida nennt Andrews, Chapman und Co-Regisseur Purcell; Shrek 2 Adamson, Asbury und Vernon. Technische Beratung, zusätzliche Einheit, Produzentenarbeit und frühere Regiepläne werden nicht zu weiteren Hauptcredits umgedeutet. Japanische Ghibli-Stimmen sind von englischen Synchronfassungen getrennt. Timothy verwendet die öffentliche Namensform Ina Fried und den belegten historischen Credit Ian Fried ohne zusätzliche biografische Behauptung.

Die Länderentscheidungen sind quellenbezogen dokumentiert: Bagdad UK/USA nach AFI, Einhorn USA trotz japanischer Animationsherstellung, Ponyo japanische Originalproduktion, Eragon USA/UK, Beauty 2017 USA/UK nach BFI-Jahrbuch und Warcraft Japan/Kanada/USA/China nach AFI Watch. Aschenbrödel führt Tschechoslowakei/DDR und Erstjahr 1973, getrennt vom späteren DDR-Start. Red Sonja bleibt USA, weil AFI italienische Koproduktion ohne Screencredit als unklar bezeichnet. Drehorte sind kein automatischer Länderbeleg.

Beowulfs widersprüchlich beschriebene Drachenverwandlung und Ikols widersprüchlicher Todesmechanismus bleiben außerhalb der Fragen. Kalidor ist keine identische Conan-Figur. Produktions-, Copyright-, Festival- und regionale Startangaben werden getrennt. Tatsächliche Quellenlektüre, nicht zugängliche Einzelquellen und enger cachegestützte Detailziele sind in den Berichten sichtbar. Keine eigene Filmsichtung wird behauptet.

## Technische Abnahme

- 184 CSV-Zeilen exakt rückgelesen; acht unterschiedliche Ziele je Film, vollständige Rückmeldungen und gültige Quellen, null formale Warnungen. CSV-SHA256: `7c9c1ea1478747af055e76c60edf9036d87b7d64eb33815416e3c0c7502e79de`.
- Echter App-Parser: alle Fragen akzeptiert, keine Ablehnungen, Duplikate, Warnungen oder Importprobleme. Wiederholungsimport unverändert; keine zusätzlichen Generatorfragen. Baselinebestand vollständig unverändert.
- Filmdaten, Bekanntheiten und alle 20 Kernreferenzen bestätigt. Die 191 vorher ergänzten Filmdatensätze sind nach Identität vollständig unverändert. Öffentliche CSV, Redaktions-CSV und erhaltene Rohquelle bytegleich.
- **391 Logiktests in 65 Dateien bestanden**, vollständiger Lauf mit zwei Workern und 8-GiB-Node-Heap.
- TypeScript und Produktionsbuild erfolgreich. Offline-Paket `film-2bbb2de17d72`, 474 Dateien. Bestehende Hinweise zu Paketannotationspositionen und Bundlegröße bleiben.
- **13 Browserfälle in Chromium/Firefox bestanden**, mit isolierten Profilen, kontrollierter Testzeit und synthetischen Kontodiensten/Spielständen. Fantasy: 100 Filme / 832 Fragen, alle drei Merida-Regienamen, Filmdaten erst nach der Antwort, exaktes Offline-CSV und unveränderter Nachladebestand. Vorherige Genreblöcke und beide Kontofälle erneut erfolgreich.

Keine echten Nutzerdaten verändert. Bestehender Importweg verwendet; keine neuen Lern-, Konto- oder Kompatibilitätswege. Lokal im Arbeitsbranch; Push und Veröffentlichung sind nicht beauftragt.

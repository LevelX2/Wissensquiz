# Filmgenres und Kategorien auf mindestens 150 Filme ausbauen

Auftrag vom 03.11.2026: zusätzliche Filme auswählen und nach dem bestehenden Redaktionsvertrag ausarbeiten, bis jedes Filmgenre und jeder Filmtyp mindestens 150 Filme enthält. Drei Redaktionsagenten arbeiten in getrennten Paketen; Auswahl, Dublettenabgleich und Abnahme werden zentral zusammengeführt. Eigener Worktree ausdrücklich freigegeben. Der Ausbau erfolgt sukzessive; Auswahlentwürfe zählen noch nicht als fertige Filme.

## Ausgangsbestand und Ziel

Aktueller lokaler Katalog: 39 Pakete, 15.295 Fragen, 14.628 Wissensziele. Im Filmfragenbereich 1.302 unterschiedliche Filmfassungen mit 11.591 Fragen. Identität: Originaltitel und Jahr der ersten Veröffentlichung. Personen- und Preisverweise allein sind keine Genreabdeckung.

| Bereich | Filme vor Ausbau | Mindestziel | Fehlend |
|---|---:|---:|---:|
| Abenteuer | 100 | 150 | 50 |
| Action | 100 | 150 | 50 |
| Thriller | 100 | 150 | 50 |
| Musik | 100 | 150 | 50 |
| Fantasy | 100 | 150 | 50 |
| Rom-Com | 100 | 150 | 50 |
| Western | 100 | 150 | 50 |
| Horror | 100 | 150 | 50 |
| Martial Arts & Asia-Film | 100 | 150 | 50 |
| Drama | 120 | 150 | 30 |
| Komödie | 129 | 150 | 21 |
| Science-Fiction | 153 | 150 | 0 |
| Arthouse | 85 | 150 | 65 |
| Classics | 156 | 150 | 0 |
| Preisträger | 155 | 150 | 0 |

Die Genreergänzung benötigt 501 Filmfassungen und mindestens 4.008 spielbare Fragen: 3.006 Inhaltsziele und jeweils 501 Jahres-/Regieziele, abzüglich bereits vorhandener identischer Sachverhalte. Vorhandene passende Personen-/Preisziele werden als gemeinsame Wissensidentitäten weiterverwendet. Schauspieler umfasst bereits 428 Personen; eine Person wird nicht als Film gezählt.

Arthouse und Classics sind kuratierte Zusatzfilter. Eine belegte Arthouse-Zuordnung kann mit einem Genre zusammenfallen. Bestehende Filmfragen werden nur bei fachlich begründeter Auswahl berücksichtigt; keine Genreumordnung und keine künstlichen Zuordnungen zum Auffüllen einer Quote.

## Auswahl und Redaktion

Sammlung vor Auswahl anhand des vorhandenen Originals und Extrakts geprüft: Listenstand 25.09.2026, Originalprüfsumme stimmt mit der dokumentierten Quelle überein. Persönliche Besitzangaben, Sammlungszeilen und private Auswahlabgleiche bleiben im ignorierten Datenbereich.

Pro Film mindestens zwei eigenständige Inhaltsziele je leicht/mittel/schwer sowie Jahr und vollständige Regie. Bekanntheit ist davon unabhängig. Quellen werden tatsächlich gelesen und einzelnen Zielen zugeordnet. Vier plausible Antworten, geschützte Lösungen, eigenständige Vertiefungen und bewusste Prüfung der Filmreihe mit Teilnummer gehören zur Abnahme. Keine Merksätze, austauschbaren Fülltexte oder unbelegten Detailfragen.

Führend: [Fragenredaktion](../Fragenredaktion.md), [Importformat](../Importformat.md), [Filmdaten und Reihen](../Filmwissen-und-Filmdaten.md). Neue Filme werden in kleinen abgeschlossenen Paketen bearbeitet. Die aktuellen Redaktionsdaten enthalten die Fragen und ihre Quellen; Bearbeitungsstand steht hier. Keine zusätzlichen Alt/Neu- oder Einzelprüfprotokolle.

## Aktueller Stand

- [Vollständige Vorauswahl](Auswahl.json): 501 Kandidaten in elf Genres. Keine exakten oder normalisierten Titel-/Jahr-Doppelungen untereinander oder zum aktuellen Genrepool. 80 Kandidaten sind als Arthouse-Ergänzung vorgeschlagen; die fachliche Zuordnung ist Teil ihrer Einzelredaktion.
- Drei Auswahlbereiche: Abenteuer/Action/Thriller; Musik/Fantasy/Rom-Com; Western/Horror/Martial Arts/Drama/Komödie.
- Erste Redaktionswelle: je drei Filme in den elf unterversorgten Genres, insgesamt 33 Filme und geplant 264 Fragen. 21 Filme lokal abgenommen; die übrige Redaktion und Gegenlesung laufen.
- **W01 lokal integriert:** je drei Abenteuer-, Musik- und Westernfilme, neun Filme mit 72 Fragen und 72 neuen Zielen: 54 Inhaltsziele sowie je neun Jahres-/Regieziele. Keine Bestandsvariante in diesem Teilpaket.
- **W02 lokal integriert:** je drei Action-, Thriller-, Fantasy- und Rom-Com-Filme, zwölf Filme mit 96 Fragen und 96 neuen Zielen: 72 Inhaltsziele sowie je zwölf Jahres-/Regieziele. Keine Bestandsvariante in diesem Teilpaket. Offizieller Einzelcredit Joel Coen bei „Blood Simple“ von der gemeinsamen kreativen Arbeit unterschieden; gemeinsame Safdie-Regie bei „Der schwarze Diamant“ vollständig.
- **Aktueller lokaler Katalog:** 41 Pakete, 15.463 Fragen, 14.796 Ziele, davon 1.323 Genre-Filmfassungen mit 11.759 Fragen. Die sieben erweiterten Genres haben jeweils 103 Filme, Arthouse 91 und Classics 157.
- Echte App-Parser-Prüfung: alle 168 neuen Zeilen ohne Fehler, Warnungen oder Duplikate angenommen; Texte, Optionen, Rückmeldungen und Metadaten exakt erhalten. Wiederholter Import überspringt alle 168; der Generator ergänzt keine doppelten Jahres-/Regieziele. Bestehende Frageobjekte bleiben unverändert. Metadaten/TypeScript und zwölf gezielte Filmdaten-/Reihentests am jeweiligen Teilpaket erfolgreich. Kein vollständiger Testlauf oder Produktionsbuild in diesen lokalen Blöcken.
- Aktuelle Fragen und gelesene Quellen stehen filmweise in `Redaktion/`; [Filmdaten](Filmdaten.json) und [abgeschlossene Pakete](Pakete.json) werden getrennt von der Vorauswahl geführt. Beim Erstjahr von „The Grey“ ist die öffentliche Vorführung 2011 maßgeblich; US-Start 2012 bleibt als spätere Veröffentlichung erklärt. Bei „Die vier Federn“ werden unabhängige Romanverfilmungen von Filmfolgen unterschieden.
- Veröffentlichung und produktive Katalogaktivierung sind nicht beauftragt.

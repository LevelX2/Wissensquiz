# Preisträger – aktueller Fragenbereich

Stand: 07.11.2026, **seit Version 88 veröffentlicht**. **380 Preisfragen**, davon 102 leicht, 120 mittel, 97 schwer und 61 Experte. Alle 100 zusätzlichen Oscarfragen sind im produktiven Preisbereich enthalten. Maßgeblich ist [content/preisfragen.jsonl](../content/preisfragen.jsonl); frühere Fragenfassungen sind über Git nachvollziehbar. [Veröffentlichungsnachweis](Veroeffentlichung-2026-11-07-Version-88.json).

## Inhalt

Oscar-, Cannes- und Venedigfragen bilden einen eigenen Fragenbereich. Die Auswahl ist unabhängig von Filmgenres; Bekanntheit und Schwierigkeit sind getrennte Attribute. Eine Frage über die ausgezeichnete Leistung eines Schauspielers gehört hier zu Preisträger. Sie wird durch den Personennamen im Fragetext nicht zur Schauspielerfrage.

Die 100 Ergänzungen fragen nach Gewinnerfilm, ausgezeichneter Rolle, Beruf, historischer Person, Instrument, Figurenbeziehung, Darsteller, ausgezeichnetem Duo und Verbindungen zwischen mehreren Leistungen. Hinzu kommen Sieg gegenüber Nominierung, verschiedene Darsteller derselben Figur, unterschiedliche Verfilmungen, Haupt- gegenüber Nebenrolle, ungewöhnliche Besetzung und Darstellungsform. Die 20 redaktionellen Fragearten beschreiben unterschiedliche Zugänge; sie erzeugen keine Lieferpakete.

Die Ergänzung verteilt sich auf 32 leicht, 50 mittel, 14 schwer und vier Experte. Sie enthält **62 neue Wissensziele und 38 Varianten** zu vorhandenen oder gemeinsamen Zielen. Varianten verwenden dieselbe Wissensziel-ID, auch über Film-, Personen- und Preisfragen hinweg. Alte Fragen-IDs und ihre Inhalte wurden nicht überschrieben. Alle 100 haben vier unterschiedliche Optionen, eine eindeutige Lösung, individuelle Kurzantwort und Vertiefung. Die gespeicherten Lösungsschlüssel sind mit je 25 gleich verteilt; die App mischt die Optionen zusätzlich.

## Quellen und Filmfassungen

Die Verleihungsjahre, Kategorien, Sieger und im Text genannten weiteren Nominierungen wurden mit den offiziellen [Jahreslisten der Academy](https://www.oscars.org/oscars/ceremonies/2024) abgeglichen. Jede Frage enthält ihre konkreten Jahresquellen. Filmhandlung und Figuren wurden anhand der verknüpften Filmreferenzen geprüft, ergänzend unter anderem mit Academy, Paramount, Apple, Vision Kino, FBW, Filmportal, BFI und NFSA. Die individuelle Quellenzuordnung steht direkt in der aktuellen Frage.

Das Verleihungsjahr ist vom Jahr der ersten Veröffentlichung getrennt. Der Filmbezug allein verpflichtet nicht zur Erstellung weiterer Filmfragen. Die neuen Fragen verwenden 94 Filmfassungen einschließlich Mehrfachverweisen; elf davon hatten bisher keine Filmdaten. Für diese elf sind Originaltitel, erste Veröffentlichung, vollständige Regie, Produktionsländer, Reihenabgrenzung und deutsche/internationale Titel geprüft und zentral hinterlegt. Bei 46 erstmals für eigene Film-/Preisfragen eingeordneten Fassungen wurde die Bekanntheit redaktionell begründet; Personenbekanntheit wurde nicht als Filmbekanntheit übernommen. Die vorhandene persönliche Sammlung wurde lokal für die Auswahl abgeglichen. Besitzangaben stehen nicht im Katalog.

Quellenabgrenzungen: Bei „Ein Jahr in der Hölle“ gelten Australien/USA nach BFI und Filmdienst; die Philippinen sind durch die NFSA als Drehort belegt und werden nicht zusätzlich als Produktionsland übernommen. „Gangs of New York“ führt die vollständige Fünfländerzuordnung von Filmdienst, während die englische Wikipedia nur USA/Italien nennt. „Paper Moon“ hat nach Paramount und den Veröffentlichungsterminen das Filmjahr 1973; die abweichende Produktionsjahrangabe 1972 bei Filmdienst wird nicht als Erstveröffentlichung verwendet. Linda Hunts Auszeichnung gehört zur Oscarverleihung 1984; Filmjahr 1982 und spätere US-Veröffentlichung bleiben getrennt.

## Anzeige und Auswahl

Vor der Antwort stehen die gesuchte Lösung und der Filmname bei Gewinnerfilmfragen ausschließlich in den vier Optionen. Filmdaten, Quellen und Vertiefungen erscheinen erst nach der Antwort. Bei Preisverbindungen enthält `film_refs` alle beteiligten Fassungen; die Auflösung zeigt jede mit ihrem eigenen Filmjahr. Beispielsweise bleiben die beiden Fassungen von „West Side Story“ aus 1961 und 2021 getrennt.

Die Metadatenauflösung verwendet vorhandene Filmreferenzen auch für Preisfragen. Der zuvor nur über Personenfragen erreichbare Datensatz zu „The Holdovers“ ist damit verfügbar. Der uneinheitliche Schlüssel von „Adaptation.“ wurde in den betroffenen aktuellen Metadaten auf dieselbe Originaltitel-/Jahridentität berichtigt.

## Abnahme

Alle 100 mit dem echten CSV-Importer gegen den vollständigen aktuellen Katalog geprüft und direkt in Preisfragen übernommen: keine Ausschlüsse, Duplikate, Warnungen oder Variantenkonflikte. Alle 19.303 bisherigen Frageobjekte anschließend vollständig feldweise unverändert nachgewiesen. Aktuell insgesamt **19.403 Fragen und 18.650 Wissensziele** in drei Fachbeständen.

50 gezielte Tests in zehn Dateien erfolgreich: vollständige Preisfragen, Filmdaten und Filmreihen, gemeinsame Wissensziele, Bereichsfilter, Bekanntheit, Personenreferenzen, Metadatenkodierung und Lösungsschutz. Die tatsächlichen App-Komponenten wurden für alle 100 neuen Fragen vor der Antwort gerendert; keine vorweggenommenen Lösungen, Filmdaten, Alternativtitelhinweise oder Quellen. Alle sechs Preisfragen mit mehreren Filmverweisen zeigen die zugehörigen Fassungen vollständig in den Filmdaten. Laufzeitmetadaten/TypeScript, aktuelle Katalogprüfung und Diffprüfung erfolgreich. Keine Veröffentlichung oder produktive Aktivierung. [Gemeinsamer Prüfnachweis](Pruefbericht.md), [aktuelle Katalogprüfung](Fragedaten-Pruefung.json).

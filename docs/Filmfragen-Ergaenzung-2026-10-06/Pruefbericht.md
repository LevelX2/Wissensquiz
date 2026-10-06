# 20 zusätzliche Filme je Genre – Redaktion vom 06.10.2026

Die Lieferung enthält **240 zusätzliche Filme und 1.920 ausgearbeitete Fragen**: je 20 Filme in den zwölf bestehenden Filmgenres. Pro Film stehen zwei eigenständige Inhaltsziele auf leicht, mittel und schwer sowie eine Jahres- und eine Regiefrage bereit. Classics und Arthouse sind zusätzliche Filter, keine weiteren Genres.

Auftrag: [unveränderter Nutzertext](../../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-06%20Nutzerauftrag%2020%20Filme%20je%20Kategorie.txt). Führender Maßstab: [Fragenredaktion](../Fragenredaktion.md). Die parallele Mitarbeit von drei zusätzlichen Redaktionsagenten wurde ausdrücklich beauftragt.

## Lieferung

- [Vollständige Lesefassung mit Antworten, Erklärungen, Merksätzen und Quellen](Fragenlesefassung.md)
- [CSV: 240 Filme, 1.920 Fragen](Filmfragen_240_Filme_1920_Fragen.csv)
- [Filmauswahl und Bekanntheitsgruppen](Auswahl.tsv)
- [Getrennte Filmdaten mit Regieteams, Veröffentlichung und Bekanntheit](Filmdaten.json)
- [Quellenbindung und Auswahlgrund für jedes Wissensziel](Quellennachweis.json)
- [Formale Einzelprüfung aller 240 Filme](Formale-Pruefung.json)
- [Prüfung mit dem tatsächlichen App-Parser](App-Parser-Pruefung.json)
- [Bestandsabgleich und vorhandenes Wissensziel](Bestandsabgleich.json)
- [Nachredaktion und Umfang der redaktionellen Durchsicht](Zentrale-Nachredaktion.json)

Die einzelnen Autorenstände in `Redaktion/001.json` bis `Redaktion/240.json` bleiben als prüfbare Ausgangsdaten der Zusammenstellung erhalten. Sie enthalten die richtige Antwort jeweils zuerst; der Zusammenbau verteilt sie ausgewogen auf die vier CSV-Positionen und verschiebt das zugehörige Feedback gemeinsam mit der Antwort.

| Genre | Zusätzliche Filme | Fragen |
|---|---:|---:|
| Abenteuer | 20 | 160 |
| Action | 20 | 160 |
| Drama | 20 | 160 |
| Fantasy | 20 | 160 |
| Horror | 20 | 160 |
| Komödie | 20 | 160 |
| Martial Arts & Asia-Film | 20 | 160 |
| Musik | 20 | 160 |
| Rom-Com | 20 | 160 |
| Science-Fiction | 20 | 160 |
| Thriller | 20 | 160 |
| Western | 20 | 160 |
| **Gesamt** | **240** | **1.920** |

Die 1.440 Inhaltsfragen verteilen sich auf 480 leichte, 480 mittlere und 480 schwere Fragen. Die 240 Jahres- und 240 Regiefragen sind zusätzlich als mittel eingestuft; damit umfasst die CSV insgesamt 480 leichte, 960 mittlere und 480 schwere Fragen. Jede korrekte Antwortposition A/B/C/D kommt genau 480-mal vor.

## Redaktion und Quellen

Die Auswahl deckt bekannte Klassiker, gegenwärtig vertraute Werke und weniger bekannte Entdeckungen ab. Bekanntheitsgruppen sind redaktionelle Einschätzungen für ein breites deutschsprachiges Publikum. Sie werden je Film separat begründet und stellen keine gemessenen Bekanntheitsquoten oder empirisch kalibrierten Fragenschwierigkeiten dar.

Die Autoren haben Handlung, Besetzung und relevante Eckdaten ihrer Filme in den gebundenen Quellen gelesen. Offizielle Filmarchive, Studios, Festivals, Produktionsunterlagen und weitere gezielte Belege ergänzen die Filmartikel. Die Quellen werden je Frage über Wissensziel und Lösung gebunden. Das Herunterladen eines Artikels wurde nicht als Quellenprüfung gezählt. Es erfolgte keine zweite unabhängige Vollrecherche aller Fakten.

Die sechs Inhaltsfragen und ihre vier Antwortmöglichkeiten wurden für alle 240 Filme auch zentral im Zusammenhang gelesen. Die Autoren prüften ihre vollständigen Blöcke einschließlich Erklärung, Merksatz und Quellen; zentrale Nachprüfungen konzentrierten sich zusätzlich auf Lösungslecks, mögliche Zielüberschneidungen, Veröffentlichungsjahre und Regiecredits. Diese Arbeit ersetzte schwache Ablenker und doppelte Ziele, etwa bei Frühling für Hitler, Kill Bill – Volume 2, Die Falschspielerin, Dune und Beyond the Infinite Two Minutes. Die Jahresvertiefungen verbinden das Jahr mit einem konkreten weiteren Sachverhalt; bei unterschiedlichen Jahren nennen sie beide Zeitpunkte und deren zeitlichen Zusammenhang.

### Besondere Abgrenzungen

- **Once:** Die offizielle Galway-Fleadh-Broschüre belegt eine öffentliche Weltpremiere des Rohschnitts 2006. Die fertige Sundance- und Kinofassung folgte 2007. Die Jahresfrage benennt die erste öffentliche Vorführung einschließlich Rohschnitt; die sechs Inhaltsfragen beziehen sich auf die reguläre Fassung. Filmdaten und Erklärung legen diese Unterscheidung offen.
- **Frühling für Hitler:** Bereits 1967 öffentlich gezeigt; der breite US-Start 1968 ist nicht das erste Veröffentlichungsjahr. Der AFI-Nachweis unterscheidet Weltpremiere und Pittsburgh-Eröffnung.
- **Haywire, Die versunkene Stadt Z, Coherence und Timecrimes:** Die frühere Festivalvorführung zählt; spätere allgemeine Kinostarts ersetzen deren Jahr nicht.
- **La Jetée:** BFI und Cinémathèque française führen 1962. Criterion verwendet 1963. Der abweichende Katalogeintrag bleibt sichtbar; das Paket verwendet die Einordnung der beiden Filmarchive und behauptet keinen ungeprüften exakten Premierentag.
- **King Kong von 1933:** Abweichende Angaben zum genauen New Yorker Erstaufführungstag werden nicht als Tagesfrage verwendet. Das Veröffentlichungsjahr 1933 ist davon unberührt.
- **Der Zug:** John Frankenheimer ersetzte Arthur Penn. Bernard Farrel besitzt einen Co-Regiecredit in französischsprachigen Kopien; die Regiefrage benennt diese Fassungsabgrenzung ausdrücklich. Credit und bestrittene tatsächliche Regieleistung werden unterschieden.
- **Funny Girl und Flammendes Inferno:** Gesamtregie wird von der gesonderten Leitung von Musiknummern beziehungsweise Actionszenen unterschieden. Herbert Ross und Irwin Allen erscheinen nicht als eindeutig falsche Alternativen.
- **O Brother, Where Art Thou? und Hondo:** Gemeinsame beziehungsweise ungenannte Mitarbeit wird ausdrücklich von den damaligen Einzelcredits unterschieden. Die Fragen benennen den tatsächlich gefragten Beitrag; sie schreiben keine zusätzlichen offiziellen Credits zu.
- **Dredd:** Gefragt ist der offizielle Pete-Travis-Credit. Alex Garlands Drehbuch- und Produktionsarbeit wird separat erläutert. Die weiter gefassten Produktionsländer beim BFI sind in den Filmdaten mit dem abweichenden Infoboxumfang abgegrenzt.
- **Shaolin Soccer:** Miramax und Hong Kong Film Archive führen Stephen Chow. Die zusätzliche Lee-Lik-chi-Nennung bei Rotten Tomatoes wurde mit diesen Primärbelegen abgeglichen und als abweichende Datenbankangabe in der Regienotiz dokumentiert.
- **Red River und Animationsfilme:** Relevante Co-Regie beziehungsweise Gesamt- und Sequenzregie werden vollständig aufgeführt.
- **Ein Fremder ohne Namen:** Die Identitätsdeutung gilt für die englische Originalfassung; zusätzliche Erklärungen mancher Synchronfassungen sind kenntlich gemacht.
- **Rio Bravo:** Ein versehentlich heruntergeladener Artikel über den Fluss Rio Grande wurde ausgeschlossen. Der gelesene AFI-Filmeintrag belegt die Eckdaten.

Zwei fachlich notwendige Längenausnahmen bleiben: die vollständigen Regieteams von **Pinocchio** (066 D: 94 Wörter) und **Schneewittchen und die sieben Zwerge** (067 D: 86 Wörter), jeweils Fragetext und vier Antworten zusammen. Die Teamalternativen sind ebenfalls vollständige Teams; Namen werden zur Einhaltung der Orientierung nicht abgeschnitten. Diese beiden Fragen brauchen im Rekordmodus entsprechend mehr Lesezeit.

## Bestand und Identitäten

Der isoliert gelesene öffentliche Ausgangskatalog umfasst 6.277 Fragen, 5.734 globale Wissensziele und 545 Filmidentitäten. Auch die noch nicht installierte [40-Filme-Ergänzung vom 04.10.2026](../Filmfragen-Ergaenzung-2026-10-04/Pruefbericht.md) wurde für die Auswahl reserviert. Keiner der 240 gewählten Originaltitel-/Jahr-Schlüssel dupliziert diese beiden Filmbestände.

Titel- und Namenssuchen lieferten 100 Kandidaten aus bestehenden Personen-, Preis- und Filmfragen. Diese Treffer wurden auf konkrete Wissensziele geprüft; sie enthalten auch andere Filmfassungen und bloße Wortüberschneidungen. Die neue Nomadland-Regiefrage verwendet das bereits vorhandene Chloé-Zhao-Ziel mit gültigem `variant_of`. Die übrigen Fragen wurden auf eigenständige Ziele ausgerichtet. Ergebnis: **1.919 neue Wissensziele und eine Variante eines bestehenden Ziels**. Titelbasierte Kandidatensuche ist kein automatischer Beweis vollständiger semantischer Neuheit.

## Prüfungen

Der vollständige Zusammenbau prüft 240 eindeutige Filmidentitäten, zwölf Mengen zu je 20 Filmen, acht Ziele je Film, zwei Inhaltsziele je Schwierigkeit, eindeutige IDs, Variantenbezüge, vier verschiedene Antworten, individuelles positionsunabhängiges Feedback und gültige Quellenbindungen. Jahresoptionen liegen im Filmzeitraum 1895–2026; Mitglieder des richtigen Regieteams stehen nicht als falsche Regiealternativen. Die CSV wurde exakt zurückgelesen. Eingangsdateihashes bestätigen den unveränderten Fragenbestand.

Der echte Importparser akzeptiert **1.920 von 1.920 Fragen**, ohne Warnungen, Zurückweisungen oder Duplikate. Antworten, Antwortfeedback, Erklärung, Kontext, Merksatz und Wissensidentität bleiben erhalten. Der wiederholte simulierte Import überspringt alle 1.920 IDs. Die vorhandene Faktenerzeugung fügt keine doppelten Jahres-/Regiefragen hinzu. Der isolierte Ergebniskatalog umfasst 8.197 Fragen und 7.653 Wissensziele; der Ausgangskatalog bleibt unverändert.

- **Logiktests:** 61 Dateien, 367 Tests erfolgreich mit `npm test -- --testTimeout=30000`. Im ersten Standardlauf überschritt ein vorhandener Schauspieler-Sicherungstest die Fünf-Sekunden-Grenze; der vollständige Rücklauf bestand ohne Assertionsfehler.
- **TypeScript und Produktionsbuild:** `npm run build` erfolgreich. Bestehende Warnungen zu Zod-Annotationen und Bundlegröße bleiben unverändert.
- **Formatierung und Links:** abschließender Diff- und lokaler Linkcheck erfolgreich.

Diese Lieferung ändert keine Oberfläche, Persistenz, Abhängigkeit oder Offlinefunktion; die Prüfungen arbeiten mit öffentlichen Fragen in isoliertem Hauptspeicher und kontrollierter Zeit. Echte Spielstände oder Konten wurden nicht verwendet.

Reproduktion im bestehenden Projekt:

```powershell
node node_modules/esbuild/bin/esbuild scripts/snapshot-film-editorial.ts --bundle --platform=node --format=esm --outfile=data/filmplanung-2026-10-06/snapshot.mjs
node data/filmplanung-2026-10-06/snapshot.mjs
node scripts/prepare-film240-package.mjs
node node_modules/esbuild/bin/esbuild scripts/check-film240-parser.ts --bundle --platform=node --format=esm --outfile=data/filmplanung-2026-10-06/check-film240-parser.mjs
node data/filmplanung-2026-10-06/check-film240-parser.mjs
```

Das Quellenrecherche-Skript legt seine Downloads ausschließlich im ignorierten Arbeitsverzeichnis ab. Archivierte Webinhalte und erzeugte Builds gehören nicht zur versionierten Lieferung.

## Übergabestand

Die Fragen sind als redaktionelles Paket fertiggestellt und lokal auf `main` gesichert. **Sie sind noch nicht in den aktiven App-Katalog übernommen oder veröffentlicht.** Bekanntheit, Produktionsländer und Regienotizen liegen in der getrennten Filmdatenübergabe; der CSV-Parser aktiviert diese Angaben nicht automatisch. Für eine spätere Übernahme müssen die bereits enthaltenen Jahres-/Regiezeilen erhalten und eine zusätzliche Faktenerzeugung für diese neuen Filme vermieden werden.

Vorgefundene fremde Änderungen bleiben außerhalb dieses Änderungsblocks erhalten. Push und Veröffentlichung wurden nicht ausgeführt.

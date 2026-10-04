# Filmfragen-Ergänzung: 40 Filme und 320 Fragen

Stand: 04.10.2026. Die erste Ausbauwelle ist als redaktionelles Fragenpaket erstellt. Drei Subagenten haben die Filmblöcke recherchiert und geschrieben; anschließend wurden alle 320 Fragen zentral gelesen und die beanstandeten Stellen überarbeitet. Grundlage sind die zuvor ausgewählten 40 Filme und der [führende Redaktionsvertrag](../Fragenredaktion.md).

Die Lieferung enthält pro Film **zwei unterschiedliche Inhaltsziele auf leicht, mittel und schwer sowie zusätzlich eine Jahres- und eine Regiefrage**. Bekanntheit und Schwierigkeit bleiben getrennt. Die Fragen behandeln unter anderem Entscheidungen und ihre Folgen, Figurenbeziehungen, Erzählweise, Musik und belegte Produktionsumstände. Erklärung, Vertiefung, Merksatz und vier Antwortbegründungen gehören zu jeder Frage.

## Dateien und Umfang

- [Fragenlesefassung](Fragenlesefassung.md): alle Fragen, Antworten, Erklärungen und Quellen, nach Film gegliedert. Die Überschriften nennen Jahr und Regie und die Lösungen stehen offen dabei; dies ist eine redaktionelle Lesefassung.
- [CSV mit 320 Fragen](Filmfragen_40_Filme_320_Fragen.csv): 31 Felder nach dem tatsächlichen Importvertrag, einschließlich der individuell formulierten Jahres- und Regiefragen.
- [Filmdaten und Bekanntheitsvorschläge](Filmdaten.json): vollständige Regieteams, Länder, Filmfassungen, Veröffentlichungsabgrenzungen und Eckdaten-Frage-IDs. Diese JSON ist eine redaktionelle Übergabe, keine Spielstandsicherung und kein bereits installierter App-Katalog.
- [Quellennachweis](Quellennachweis.json): Wissensziel und Auswahlgrund sowie Belegzuordnung je Frage; Recherchehinweise zu Aliasen und Datumsabweichungen.
- [Formale Prüfung](Formale-Pruefung.json), [App-Parser-Prüfung](App-Parser-Pruefung.json) und [zentrale Redaktionsprüfung](Redaktionspruefung.json): getrennte Nachweise der erreichten Prüfstände.

| Genre | Neue Filme | Fragen | Inhaltsziele leicht / mittel / schwer |
|---|---:|---:|---:|
| Abenteuer | 10 | 80 | 20 / 20 / 20 |
| Thriller | 10 | 80 | 20 / 20 / 20 |
| Action | 5 | 40 | 10 / 10 / 10 |
| Fantasy | 5 | 40 | 10 / 10 / 10 |
| Komödie | 5 | 40 | 10 / 10 / 10 |
| Rom-Com | 5 | 40 | 10 / 10 / 10 |
| **Gesamt** | **40** | **320** | **80 / 80 / 80** |

Zusätzlich: 40 Jahres- und 40 Regieziele. Über alle acht Fragen je Film ergeben sich 89 leichte, 131 mittlere und 100 schwere Fragen. Die vorgeschlagenen Bekanntheiten verteilen sich auf 3 Film-Ikonen, 7 bekannte Filme, 14 Kennerfilme und 16 Entdeckungen. Die Einordnung und die Schwierigkeit sind redaktionelle Einschätzungen, keine Messung des Publikums oder der tatsächlichen Lösungsquote.

## Neue und wiederverwendete Ziele

Die 320 Fragen haben unterschiedliche Frage-IDs und innerhalb jedes Films acht eigenständige Ziel-IDs. **316 Ziele sind neu; vier bestehende Ziele werden als bereichsübergreifende Varianten erhalten**:

| Neue Frage | Bereits vorhandener Sachverhalt |
|---|---|
| `F40-001-L1` | Keira Knightley als Elizabeth Swann |
| `F40-002-L1` | Evelyns Beruf als Bibliothekarin |
| `F40-006-S2` | Kamera-Oscar für Russell Boyd bei „Master and Commander“ |
| `F40-014-L1` | Lou Blooms Geschäft mit Unfall- und Verbrechensvideos |

Die Varianten übernehmen die vorhandene `knowledge_id` und verweisen mit `variant_of` auf die bestehende Frage. Sie zählen als neue spielbare Filmzeile, aber nicht als neues globales Wissen. Der Kamera-Oscar bleibt in diesem Paket eine Filmfrage; der Bereichstag `Preisträger` wird hier deshalb nicht gesetzt.

## Redaktion und Quellenprüfung

Die Autoren haben die verwendeten Quellen zu ihren Blöcken gelesen und die einzelnen Behauptungen zugeordnet. Bevorzugt wurden Credits, Filmarchive, Verleihmaterial, Festivalunterlagen und Interviews mit Beteiligten. Ergänzend dienen ausführliche Inhaltsdarstellungen als Belege für konkrete Handlungsdetails. Eine allgemeine Filmseite wird nicht als Nachweis jeder Anekdote behandelt.

Die zentrale Durchsicht umfasste sämtliche Fragen und Filmblöcke. Überarbeitet wurden insbesondere sachfremde Antwortalternativen, durch die Formulierung ausschließbare Optionen und unklare Ursachen oder Figurenbeziehungen. Beispielsweise wurden Fernseherlebnisse in „The Game“ und Eingriffe ins Unfallbild bei „Nightcrawler“ vergleichbar formuliert. Bei „Bunraku“ ersetzt ein belegter Mifune-Bezug eine zu allgemein belegte Stuntfrage. Die Opernfrage zu „Ariane“ fragt nach Filmherstellung, nicht nach Datenbankkenntnis.

Bei 47 Fragen wurde zusätzlich eine Titelkennzeichnung ergänzt: Die App fügt den Filmtitel vor der Antwort nicht automatisch aus den Metadaten hinzu. Die konkreten Fragen und Denkaufgaben bleiben individuell, während der gemeinte Film auch in gemischten Runden eindeutig erkennbar ist. Eine zusätzliche unabhängige Autorenkontrolle prüfte 20 Fragen beziehungsweise Eckdatenübergaben zu „Bunraku“, „Solomon Kane“, „Ruby Sparks“ und „Dungeons & Dragons“. Alle endgültigen Frage-/Antwortkombinationen bleiben innerhalb der 60-Wörter-Orientierung; der formale Schlusslauf hat keine Warnungen.

Zusätzliche zentrale Quellenstichproben sind mit URL, geprüfter Aussage und Frage-ID im Redaktionsnachweis dokumentiert. Sie betreffen unter anderem die Filmfassung von „20.000 Meilen unter dem Meer“, die Entstehung von Wilson in „Cast Away“, die Musik-/Aufnahmeentscheidungen von „Nightcrawler“, die Farb- und Besetzungsentscheidungen von „Memories of Murder“ und die zwei unterschiedlichen Wohnungen hinter „Kleine Morde unter Freunden“. Diese Stichproben ersetzen keine zweite unabhängige Vollrecherche aller 320 Aussagen. Der Nachweis unterscheidet Autorenprüfung und zentrale Nachprüfung.

## Technische Prüfung und Integrationsstand

Alle Felder, Frage-IDs, Ziel- und Variantenbezüge, Stufenmengen, Antwortoptionen, Quellenreferenzen und der vollständige CSV-Rücklesevergleich wurden geprüft. Die richtigen Buchstaben verteilen sich gleichmäßig auf A–D mit je 80 Fragen; Antwortfeedback ist von den Bildschirmpositionen unabhängig.

Der echte App-Parser wurde bei fester Testzeit ausschließlich mit einem isolierten Katalog im Arbeitsspeicher ausgeführt: **320 angenommen, 0 abgewiesen, 0 Dubletten, 0 Parserwarnungen**. Metadaten, Antwortfeedback, Vertiefungen und Merksätze bleiben erhalten. Ein wiederholter Import überspringt alle 320 IDs. Der unveränderte bisherige Filmfaktengenerator legt in dieser Simulation keine zusätzlichen Eckdatenfragen an. Die Simulation ergibt 6.597 Fragen und 6.050 globale Ziele gegenüber dem bestehenden Katalog mit 6.277 Fragen und 5.734 Zielen.

Das Paket wurde **noch nicht in die App übernommen**. Für die Übernahme sind zusätzlich die Bekanntheits- und Filmdatenzuordnungen einzubinden. Jahr und Regie sind bereits eigene CSV-Zeilen und dürfen nicht nochmals automatisch als neue Ziele erzeugt werden. Bei „Parasite“ ist der gewählte Schlüssel `Gisaengchung|2019` mit vorhandenen Aliasen zusammenzuführen; bei „Memories of Murder“ ist der koreanische Titelalias dokumentiert. Bestehende Lernidentitäten bleiben maßgeblich. Alle Regieteams, insbesondere bei „Ruby Sparks“ und „Dungeons & Dragons“, sind vollständig angegeben.

Die Filmauswahl verbreitert die zuvor festgestellten Lücken, schließt sie aber noch nicht vollständig. Bei Übernahme würde Abenteuer von 16 auf 26 und Thriller von 22 auf 32 Filme wachsen. Am seltenen Ende kämen vier Action- und drei Rom-Com-Filme hinzu; Fantasy hätte drei und Komödie sechs Entdeckungen. Die festen Freischaltschwellen verlängern sich durch diese Redaktion nicht automatisch. Ein neuer Lernpfad benötigt weiterhin eine gesonderte Prüfung.

## Wiederholung der Dateiprüfung

Die Redaktion wird aus den drei `*.redaktion.json` zusammengestellt. Der Bestandsabgleich wird zuvor mit den echten Paketfunktionen neu aufgebaut; sein lokaler Zwischennachweis bleibt außerhalb von Git. Diese Befehle ändern nur die redaktionellen Liefer- und Prüfnachweise:

```powershell
New-Item -ItemType Directory -Path data/filmplanung-2026-10-04 -Force | Out-Null
node node_modules/esbuild/bin/esbuild scripts/check-film40-parser.ts --bundle --platform=node --format=esm --outfile=data/filmplanung-2026-10-04/check-film40-parser.mjs
node data/filmplanung-2026-10-04/check-film40-parser.mjs --prepare-baseline
node scripts/prepare-film40-package.mjs
node data/filmplanung-2026-10-04/check-film40-parser.mjs
```

Spätere Katalogänderungen können neue Konflikte sichtbar machen. Die datierten Ergebnisse gelten für den hier geprüften Stand. Allgemeine App- und Browsertests wurden für die reine Redaktion nicht wiederholt; die Paketprüfung verwendet unmittelbar den tatsächlichen Parser.

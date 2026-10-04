# Filmabdeckung und Lernkurven – 04.10.2026

Die größten Mengenlücken liegen bei **Abenteuer und Thriller**. Die größten Lücken am seltenen Ende liegen bei **Action und Rom-Com** (keine Entdeckungen), **Fantasy** (ein Film) und **Komödie** (zwei Filme). Das bekannte Einstiegsende ist bei Thriller und Martial Arts & Asia-Film sehr schmal. Neue Fragen sollten diese konkreten Zellen verbreitern; zusätzliche Varianten allein helfen nicht.

## Grundlage und Grenzen

Vollständiger lokaler offizieller Katalog aus 19 Paketen, aufgebaut mit denselben Funktionen wie die App: `addPackages`, Kategorienzuordnungen und generierte Filmwissensfragen. Stand und Eingangsprüfsummen: [maschineller Nachweis](Filmabdeckung-2026-10-04.json). Auswertung: [analyze-film-coverage.ts](../scripts/analyze-film-coverage.ts). Keine Spielerstände oder Produktionsdaten gelesen. Die bestehenden offenen Importberichtänderungen sind keine Grundlage dieser Messung.

Der Gesamtkatalog enthält 6.277 Fragen und 5.734 eindeutige Wissensziele. Für Genre- und Bekanntheitskurven zählen ausschließlich **4.677 Filmfragen, 4.197 Wissensziele und 545 Filme**. Davon sind 3.360 Ziele aus CSV-Fragen und 837 generierte Jahres-/Regieziele. Zusätzlich existieren 200 Preisfragen sowie 1.400 Schauspielerfragen mit 1.399 Zielen. 62 Ziele werden zwischen Bereichen geteilt; die Bereichssummen der Ziele sind deshalb nicht additiv. Die 656 eingeordneten Filme im Projektstart umfassen auch Filme aus Preisfragen und sind nicht gleichbedeutend mit 656 Filmen im Genrepool.

Filme werden über Originaltitel und Jahr unterschieden, Ziele über `knowledge_id`. Varianten erhöhen die Abdeckung nicht. Bekanntheit ist eine redaktionelle Einordnung für ein breites deutschsprachiges Kinopublikum. Sie ist unabhängig von der Schwierigkeit. Gruppe 4 heißt **Entdeckungen**; die separate Frageschwierigkeit **Experte** ist in der Filmreise nur bei Schauspielern und Preisträgern vorhanden.

## Filmvielfalt nach Bekanntheit

| Genre | Filme | Wissensziele | Film-Ikonen | Bekannte Filme | Kennerfilme | Entdeckungen |
|---|---:|---:|---:|---:|---:|---:|
| Abenteuer | 16 | 127 | 3 | 8 | 4 | 1 |
| Thriller | 22 | 176 | 1 | 11 | 7 | 3 |
| Action | 35 | 278 | 7 | 23 | 5 | 0 |
| Martial Arts & Asia-Film | 35 | 280 | 2 | 5 | 17 | 11 |
| Fantasy | 36 | 287 | 8 | 17 | 10 | 1 |
| Western | 36 | 287 | 4 | 7 | 19 | 6 |
| Musik | 36 | 288 | 6 | 21 | 6 | 3 |
| Rom-Com | 36 | 288 | 5 | 20 | 11 | 0 |
| Horror | 37 | 293 | 9 | 17 | 8 | 3 |
| Drama | 54 | 429 | 9 | 24 | 16 | 5 |
| Komödie | 89 | 712 | 12 | 50 | 25 | 2 |
| Science-Fiction | 113 | 752 | 18 | 51 | 38 | 6 |
| **Gesamt** | **545** | **4.197** | **84** | **254** | **166** | **41** |

Entdeckungen machen nur 7,5 % des Filmfragenbestands aus. Science-Fiction und Komödie sind insgesamt breit, aber am seltenen Ende deutlich dünner. Martial Arts ist umgekehrt bei Kennerfilmen und Entdeckungen gut vertreten, bei bekannten Einstiegstiteln schmal. Für Thriller stammen sämtliche Ikonenfragen aus „Das Schweigen der Lämmer“; Abenteuer hat als Ikonen „Ben Hur“ und zwei Indiana-Jones-Filme. Mehr Fragen zu diesen Titeln schaffen noch keine breitere Auswahl von Werken.

## Schwierigkeit innerhalb der Bekanntheitsgruppen

Zahlen sind **eindeutige Wissensziele**, jeweils **Leicht / Mittel / Schwer**, einschließlich generierter Filmwissensfragen.

| Genre | Film-Ikonen | Bekannte Filme | Kennerfilme | Entdeckungen |
|---|---:|---:|---:|---:|
| Abenteuer | 7 / 9 / 8 | 16 / 25 / 23 | 8 / 11 / 13 | 2 / 2 / 3 |
| Thriller | 2 / 3 / 3 | 28 / 32 / 28 | 15 / 23 / 18 | 6 / 9 / 9 |
| Action | 16 / 23 / 17 | 46 / 76 / 60 | 10 / 16 / 14 | 0 / 0 / 0 |
| Martial Arts & Asia-Film | 4 / 6 / 6 | 11 / 16 / 13 | 36 / 49 / 51 | 22 / 34 / 32 |
| Fantasy | 23 / 22 / 19 | 38 / 58 / 39 | 20 / 31 / 29 | 2 / 3 / 3 |
| Western | 13 / 9 / 9 | 18 / 19 / 19 | 41 / 59 / 52 | 13 / 17 / 18 |
| Musik | 12 / 20 / 16 | 42 / 71 / 55 | 12 / 17 / 19 | 6 / 7 / 11 |
| Rom-Com | 12 / 16 / 12 | 40 / 65 / 55 | 22 / 28 / 38 | 0 / 0 / 0 |
| Horror | 26 / 24 / 21 | 36 / 56 / 43 | 16 / 22 / 26 | 6 / 8 / 9 |
| Drama | 24 / 30 / 18 | 52 / 79 / 60 | 33 / 52 / 42 | 10 / 18 / 11 |
| Komödie | 29 / 40 / 27 | 109 / 179 / 112 | 54 / 75 / 71 | 4 / 6 / 6 |
| Science-Fiction | 44 / 31 / 24 | 92 / 163 / 95 | 65 / 90 / 109 | 9 / 13 / 17 |

**Alle 545 Filme besitzen mindestens ein nicht generiertes Inhaltsziel auf jeder der drei Schwierigkeiten.** Es gibt innerhalb der bestehenden Werke keine komplett fehlende Schwierigkeitsstufe. Insgesamt stehen 1.152 leichte, 1.662 mittlere und 1.383 schwere Filmziele bereit. Ohne generierte Jahres-/Regieziele sind es 1.040 / 1.160 / 1.160: Der größere Mittel-Pool entsteht wesentlich durch Filmwissen; er beweist keinen Mangel an schweren Inhaltsfragen.

Sehr kleine Zellen wiederholen sich zwangsläufig schnell: Die Entdeckungen von Fantasy enthalten nur zwei nicht generierte Ziele je Schwierigkeit; Komödie vier; Thriller, Horror und Musik jeweils sechs. Filmvielfalt und Inhaltstiefe müssen deshalb gemeinsam wachsen.

## Freischaltplan als zweite Ursache kurzer Kurven

Die App hat keinen linearen zwölfstufigen Pfad. Schwierigkeit und Bekanntheitsgruppen werden getrennt freigeschaltet. Die meisten Schwellen und die Ziel-IDs für Bekanntheitsübergänge sind aus einem älteren Katalog eingefroren. Neue Fragen verlängern diese Schwellen nicht automatisch.

| Bereich | Aktuelle Schwierigkeitsschwellen Mittel / Schwer | Auffälliger Bekanntheitsübergang |
|---|---:|---|
| Abenteuer | 2 / 2 | Gruppe 1 → 2 nach zwei festen leichten Zielen; die drei möglichen Ankerziele stammen allein aus „Ben Hur“. Gruppe 2 → 3 nach drei festen Zielen. |
| Thriller | 10 / 9 | Gruppe 1 → 2 nach den zwei leichten Inhaltszielen aus „Das Schweigen der Lämmer“. |
| Martial Arts & Asia-Film | 2 / 2 | Gruppe 1 → 2 nach zwei festen leichten „Rush Hour“-Zielen; neue Ikonenfragen erweitern die Anker nicht automatisch. |
| Musik | 2 / 2 | Gruppe 2 → 3 nach zwei festen Zielen aus „Singin’ in the Rain“, obwohl die Gruppe heute 42 leichte Ziele bietet. |
| Action | 10 / 14 | Ende bei Gruppe 3; Gruppe 4 existiert nicht. |
| Rom-Com | 8 / 10 | Ende bei Gruppe 3; Gruppe 4 existiert nicht. |

Die festen Anker sind vollständig vorhanden und erreichbar. Es liegt kein nachgewiesener Freischaltblocker vor. Inhaltliche Erweiterung und Kurvenplanung sind zwei getrennte Aufgaben. Soll die Reise länger werden, braucht es einen ausdrücklich geprüften neuen Plan, der bereits erworbene Rechte erhält. Zusätzliche Fragepakete allein beheben die kurzen Schwellen nicht. Bei einer erstmaligen Gruppe 4 muss ihre Einbindung samt Zielmenge bewusst geprüft werden; für nicht definierte Gruppen berechnet die Implementierung ansonsten Ziele aus dem aktuellen Bestand.

## Weitere Gebiete mit wenig Material

- **Neuere Filme:** Nur ein Film im Genrepool ist aus den 2020ern („Elvis“, 2022). Aus 1980–2009 stammen 333 von 545 Filmen (61,1 %). Neuere Filmbezüge in Schauspieler- und Preisfragen ersetzen keine spielbaren Genrefragen.
- **Filmgeschichte vor 1950:** 16 Filme, davon vier aus den 1920ern, fünf aus den 1930ern und sieben aus den 1940ern. Classics ist mit 136 Filmen insgesamt groß, aber seine historische Frühzeit bleibt schmal.
- **Internationales Kino:** 440 Filme (80,7 %) haben laut Basisdaten eine US-Produktionsbeteiligung, 105 nicht. Japan ist bei sieben, Südkorea bei zwei und Indien bei einem Film als Produktionsland vermerkt. Koproduktionen sind Mehrfachzählungen und keine belastbare Messung nationaler Kinotraditionen; beispielsweise ist der einzige Indien-Verweis „Tucker & Dale vs. Evil“. Diese Angaben sprechen für eine gezielte Sichtung von japanischem, koreanischem, indischem, afrikanischem und lateinamerikanischem Kino, nicht für erfundene Länderquoten. Historische Länderbezeichnungen bleiben im Nachweis unverändert und unvereinheitlicht.
- **Arthouse:** 65 Filme, davon 23 bekannte, 27 Kennerfilme und 15 Entdeckungen. Kein vorrangiger Gesamtengpass. Arthouse und Classics überschneiden sich mit Genres und dürfen nicht zusätzlich zur Gesamtsumme gezählt werden.

## Empfohlene Ergänzungsfolge

Die folgenden Mengen sind **Redaktionsvorschläge**, keine empirischen Spielspaßgrenzen und keine beschlossene Änderung der App.

1. **Abenteuer: etwa 20–25 zusätzliche Werke**, besonders bekannte Einstiege, Kennerfilme und Entdeckungen. Der gesamte Pool ist klein; zwei der drei Ikonen gehören derselben Reihe an.
2. **Thriller: etwa 15–20 zusätzliche Werke**, darunter mehrere plausibel breit bekannte Einstiegsfilme sowie seltenere Titel. Priorität: den Ein-Film-Einstieg und die kleine Gruppe 4 aufbrechen.
3. **Action und Rom-Com: jeweils etwa 8–10 Entdeckungen**, Action zusätzlich mehr Kennerfilme. Damit erstmals ein sinnvoll gefülltes seltenes Ende entsteht.
4. **Fantasy und Komödie: jeweils etwa 6–8 zusätzliche Entdeckungen.** Die Gesamtmenge ist kein passender Prioritätsmaßstab für diese Lücke.
5. **Martial Arts: bekannte Einstiegstitel verbreitern; Musik und Horror: seltene Titel ergänzen.** Western und Drama sind momentan weniger dringlich. Science-Fiction braucht bei weiterer Ergänzung eher seltene oder international vielfältige Werke als nochmals einen großen allgemeinen Block.

Für einen neuen Film sind mindestens **zwei eigenständige Inhaltsziele je Schwierigkeit** ein sinnvoller Ausgangspunkt: sechs neue Ziele, dazu geprüfte Filmmetadaten. Varianten zählen dabei nicht. Als vorläufige Planungsuntergrenze für einen länger nutzbaren Bereich bieten sich **mindestens 20 Inhaltsziele je Kombination und mehrere unabhängige Werke** an; 20 Ziele erlauben zwei Zehnerrunden ohne inhaltliche Wiederholung. Das ist eine Mengenheuristik, keine pädagogische Garantie. Bekanntheit darf nicht künstlich umgestuft werden, um Sollzahlen zu erfüllen.

Neue Filmfassungen gegen die gesamte aktuelle Filmliste und die bereits vorhandenen Preis-/Personenbezüge abgleichen: Ein Film kann im Genrepool neu sein, obwohl seine Basisdaten oder einzelne Ziele schon existieren. Bestehende IDs, Rohquellen und erreichte Freischaltungen erhalten. Keine neuen Fragen, Einstufungen oder Spielregeln wurden durch diese Analyse eingebunden.

## Erste Ausbauwelle als Vorschlag

Am 04.10.2026 eine erste Auswahl von 40 zusätzlichen Filmidentitäten gegen den vollständigen lokalen Filmfragenbestand und die bestehenden Basisdaten abgeglichen: zehn Abenteuer, zehn Thriller und jeweils fünf Action-, Fantasy-, Komödien- und Rom-Com-Filme. Alle 40 fehlen bislang im Filmfragenpool; sieben besitzen bereits Basisdaten oder Personen-/Preisbezüge. Der geplante Redaktionsumfang beträgt sechs eigenständige Inhaltsziele je Film, insgesamt 240 vor Abgleich einzelner bereits vorhandener Sachverhalte. Neue internationale und aktuelle Stoffe ergänzen die Genreprioritäten. Die vier Bekanntheitsgruppen bleiben vorläufige redaktionelle Vorschläge.

Dies ist eine erste Welle, keine vollständige Schließung der oben quantifizierten Unterdeckung. Insbesondere die seltenen Gruppen müssen danach weiter wachsen; die Freischaltschwellen sind gesondert zu prüfen. Persönliche Sammlungszuordnungen, Quellextraktionen und der vollständige Titelvorschlag bleiben ausschließlich in lokal ausgeschlossenen Daten. Keine Fragen importiert oder App-Regeln geändert. Sämtliche 87 Eingangsprüfsummen des Bestandsnachweises vor der Auswahl erneut unverändert bestätigt.

## Prüfung und Wiederholung

Die erste Ausbauwelle liegt inzwischen als [redaktionell geprüftes Paket mit 320 Fragen](Filmfragen-Ergaenzung-2026-10-04/Pruefbericht.md) vor: 240 Inhaltsziele (80 je Filmschwierigkeit) plus 40 Jahres- und 40 Regieziele. Vier Sachverhalte teilen bestehende Personen-/Preisziel-IDs; 316 globale Ziele sind neu. Drei Subagenten haben die Filmblöcke recherchiert, sämtliche Fragen wurden zentral gelesen und überarbeitet. Die isolierte Prüfung mit dem echten App-Parser nimmt alle 320 Fragen ohne Fehler oder Warnung an. Die oben ausgewerteten Bestandszahlen bleiben der historische Katalogstand; das neue Paket ist noch nicht eingebunden und verlängert die Freischaltschwellen nicht automatisch. [Fragenlesefassung](Filmfragen-Ergaenzung-2026-10-04/Fragenlesefassung.md), [Filmdatenübergabe](Filmfragen-Ergaenzung-2026-10-04/Filmdaten.json).

Die Auswertung prüft eindeutige Frage-IDs, abgewiesene/duplizierte Imports, vollständige Bekanntheits- und Basisdatenzuordnung, konsistente Gruppen, genreübergreifende Zielkollisionen und alle festen Freischaltanker. Der Nachweis enthält je Film die Inhaltsziele pro Schwierigkeit und die vorhandenen Produktionsländer. Er ist eine quantitative Bestandsprüfung; einzelne Aussagen und die pädagogische Qualität der Fragen wurden nicht erneut quellengeprüft.

Zusätzlicher direkter CSV-Abgleich bestätigt 3.840 Filmzeilen, 3.360 Inhaltsziele und 545 Filmidentitäten ohne fehlende Ziel-IDs. Genresummen ergeben 545 Filme und 4.197 Ziele. Produktionsbuild erfolgreich. Beim Kontrolllauf am 04.10.2026 bestanden mit `npm test -- --maxWorkers=2` alle 333 Tests in 55 Dateien; der erste ungedrosselte Lauf hatte zwei 5-Sekunden-Zeitüberschreitungen. Diese App-Prüfung bezieht sich auf den dabei vorhandenen Arbeitsstand, nicht auf später parallel entstehende Oberflächenänderungen. Die Bestandsübersicht wurde mit isoliertem Browser und fester Testzeit bei Desktop- und Mobilbreite dargestellt; keine Browser-Spielstände verwendet.

```powershell
New-Item -ItemType Directory -Path tmp-film-coverage -Force | Out-Null
node node_modules/esbuild/bin/esbuild scripts/analyze-film-coverage.ts --bundle --platform=node --format=esm --outfile=tmp-film-coverage/analyze.mjs
node tmp-film-coverage/analyze.mjs
```

Der Befehl aktualisiert den datierten JSON-Nachweis ausdrücklich; den historischen Snapshot bei späteren Analysen erhalten und dafür einen neuen Ausgabestand verwenden.

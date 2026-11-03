# Filmgenres und Kategorien auf mindestens 150 Filme ausbauen

Auftrag vom 03.11.2026: zusätzliche Filme auswählen und nach dem bestehenden Redaktionsvertrag ausarbeiten, bis jedes Filmgenre und jeder Filmtyp mindestens 150 Filme enthält. Drei Redaktionsagenten arbeiten in getrennten Paketen; Auswahl, Dublettenabgleich und Abnahme werden zentral zusammengeführt. Eigener Worktree ausdrücklich freigegeben. Der Ausbau erfolgt sukzessive; Auswahlentwürfe zählen noch nicht als fertige Filme.

**Fortsetzung ausdrücklich bis zur Zielerreichung beauftragt:** Nach Abschluss eines Genres unmittelbar das nächste bearbeiten; ein fertiges Zwischenpaket beendet den Auftrag nicht. [Wortlaut der Präzisierung](../../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-11-03%20Nutzerauftrag%20kontinuierlicher%20Ausbau%20bis%20Zielerreichung.txt). Zuständigkeiten: A bearbeitet Abenteuer → Action → Thriller, B Musik → Fantasy → Rom-Com, C Western → Horror → Martial Arts & Asia-Film; die zentrale Redaktion übernimmt Drama → Komödie. Die zentrale Abnahme integriert abgeschlossene Pakete und zählt den tatsächlichen App-Katalog. Die abschließende Zielprüfung erfolgt mit `scripts/inspect-genre150.ts --require-target`; Arthouse und Classics werden unabhängig von den Genres gezählt. Noch keine Veröffentlichung beauftragt.

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

- [Vollständige Vorauswahl](Auswahl.json): 501 Kandidaten in elf Genres. Keine exakten oder normalisierten Titel-/Jahr-Doppelungen untereinander oder zum aktuellen Genrepool. 88 Kandidaten sind als Arthouse-Ergänzung vorgeschlagen; die fachliche Zuordnung ist Teil ihrer Einzelredaktion.
- Drei Auswahlbereiche: Abenteuer/Action/Thriller; Musik/Fantasy/Rom-Com; Western/Horror/Martial Arts/Drama/Komödie.
- **Erste Redaktionswelle abgeschlossen:** je drei Filme in den elf unterversorgten Genres, insgesamt 33 Filme mit 264 Fragen. 260 globale Wissensziele sind neu; vier bestehende Ziele werden als Varianten weiterverwendet. Alle 33 Filme besitzen zwei unabhängige Inhaltsziele je Schwierigkeit und zusätzliche Jahres-/Regieziele.
- **W01 lokal integriert:** je drei Abenteuer-, Musik- und Westernfilme, neun Filme mit 72 Fragen und 72 neuen Zielen: 54 Inhaltsziele sowie je neun Jahres-/Regieziele. Keine Bestandsvariante in diesem Teilpaket.
- **W02 lokal integriert:** je drei Action-, Thriller-, Fantasy- und Rom-Com-Filme, zwölf Filme mit 96 Fragen und 96 neuen Zielen: 72 Inhaltsziele sowie je zwölf Jahres-/Regieziele. Keine Bestandsvariante in diesem Teilpaket. Offizieller Einzelcredit Joel Coen bei „Blood Simple“ von der gemeinsamen kreativen Arbeit unterschieden; gemeinsame Safdie-Regie bei „Der schwarze Diamant“ vollständig.
- **W03 lokal integriert:** je drei Horror-, Martial-Arts-/Asia-, Drama- und Komödienfilme, zwölf Filme mit 96 Fragen: 92 neue Ziele und vier Varianten bestehender Personenfragen. Hulot-Urlaubsort und Hotelfassade, Acostas Botschafteramt und Chances Gartenvergleiche behalten ihre vorhandenen Lernidentitäten. Die unabhängige Gegenlesung hat insbesondere filmisch plausible Ablenker und starke Finalspoiler nachgeschärft.
- **W04 lokal integriert:** sechs weitere Western, 48 Fragen und 47 neue globale Ziele; eine Variante bewahrt das vorhandene Ziel zum Familiengeheimnis in „Verfolgt“. Quellengeprüfte Gegenlesung, echter App-Parser, unveränderte Bestandsfragen, Wiederholimport und Generatorabgrenzung erfolgreich; Metadaten/TypeScript und alle vier Filmreihentests bestanden.
- **W05 und W06 lokal integriert:** je sechs Musik- und Dramafilme, zusammen 96 Fragen mit 92 neuen globalen Zielen und vier Bestandsvarianten. Musikporträts und Konzertfilm gegenüber Spielfilmen abgegrenzt; doppelte Regie bei „Tina“ vollständig. Neue Bergman- und Fellini-Filme unabhängig gegengelesen; vier bereits vorhandene Masina-/Quinn-Sachverhalte als Varianten erhalten.
- **W07 lokal integriert:** sechs Abenteuerfilme mit 48 neuen Fragen und Zielen. Die Gegenlesung korrigierte die zeitliche Reihenfolge von Himmlers Vollmachtsvernichtung und Radls Hinrichtung sowie zwei schwache Ablenker. Quellengeprüfte Buchjahre verankern die Jahresvertiefungen zu „Der Adler ist gelandet“ und „Der 13te Krieger“.
- **W08 lokal integriert:** sechs weitere Western mit 48 neuen Zielen. Die Teile 2–5 des bewusst eng benannten Ranown-Columbia-Zyklus vervollständigen dessen vorhandene Zuordnung. Hauptregie Daves bei „Der Galgenbaum“ von der ungenannten Fertigstellung durch Malden und zeitweiligen Mitarbeit Shermans unterschieden; keine beteiligten Regisseure als falsche Antwort.
- **W09 lokal integriert:** sechs Musikfilme mit 48 neuen Zielen, darunter das klassische Familienmusical, deutsche Bandkomödie, zwei Jugend-/Popformate und „The Disciple“. Gegenlesung schärfte plausible Optionen sowie den Peter-Kraus-Zeitanker; beim indischen Film sind Venedig-Premiere 2020 und spätere Netflix-Auswertung getrennt.
- **W10 lokal integriert:** sechs Abenteuerfilme mit 48 neuen Zielen. Die unabhängige Gegenlesung präzisierte die gescheiterte Hospital-Falle in „Der Geist und die Dunkelheit“; ein unplausibler Jagdablenker ersetzt. Erstvorführungen bei Centurion/Dein Weg von abweichenden Werkjahren abgegrenzt, vollständige gemeinsame Regie bei „The Peanut Butter Falcon“.
- **W11 lokal integriert:** sechs Western mit 48 neuen Zielen, darunter zwei eigenständige Hellman-Filme. Früheste Festivalvorführungen 1966 sind gegenüber US-Kinokopf 1972 begründet. Gegenlesung präzisierte die Onkel-Neffe-Richtung, plausiblere Banküberfall-Optionen und zwei zeitliche Filmverbindungen; das Doppelgängerfinale bleibt ohne behauptete abschließende Psychodeutung.
- **W12 lokal integriert:** sechs Musikfilme mit 48 neuen Zielen; Musik jetzt 121. Sundance-Erstjahr 2005 von Produktionsjahr 2004 bei Kifferwahn getrennt, Joker-Fortsetzung als Teil 2 mit Chomets Prolog als gesonderter Leistung. Beim Jazzsänger technische Tonfilmform präzise eingeordnet und ein aus dem bürgerlichen Namen ableitbarer Lösungshinweis entfernt.
- **W13 lokal integriert:** sechs Dramen mit 48 Fragen, 46 neuen globalen Zielen und zwei bestehenden Personenvarianten. Alle sechs kuratiert Arthouse, fünf auch Classics. Unabhängige Gegenlesung beseitigte einen Titelhinweis bei den Müßiggängern, schärfte vergleichbare Ablenker und die Logik des Aufsatzbetrugs. Zwei vorhandene Figuren-/Berufsziele behalten ihre Lernidentitäten.
- **W14 lokal integriert:** sechs Abenteuerfilme mit 48 neuen Zielen; Abenteuer jetzt 121. Vollständige zentrale und unabhängige Gegenlesung ohne Sachblocker, ein ferner Finanzierungsablenker ersetzt. Stockwell/Bryson-Adaption, Videospielvorlage und Überlebensgeschichten eigenständig eingeordnet; Länder und vollständige Regie geprüft.
- **W15 lokal integriert:** sechs klassische Western mit 48 neuen Zielen; Western jetzt 127. Eisenbahnziel ohne aus dem Titel ableitbare Bauart, historische Verdichtung mit plausiblen Zeitmodellen und Zeitungsverleger trotz AFI-/TCM-Namensabweichung eindeutig beschrieben. Erste öffentliche Jahre 1924/1936/1946 gegenüber späteren AFI-Kopfjahren erklärt; Fox-Jesse-James-Zweiteiler vollständig.
- **W16 lokal integriert:** sechs Western mit 48 Fragen, 47 neuen globalen Zielen und einer Silverado-Regievariante; Western jetzt 133. Beide vollständigen Gegenlesungen und Quellenverbreiterung abgeschlossen. Titelhinweis bei Die erste Kugel trifft durch Besetzungsziel ersetzt, Ranch-/Farm-/Prozessalternativen präzisiert. Stammeszuordnung bei Die Unbesiegten wegen Quellenwiderspruch nicht behauptet.
- **Aktueller lokaler Katalog:** 55 Pakete, 16.183 Fragen, 15.504 Ziele, davon 1.413 Genre-Filmfassungen mit 12.479 Fragen. Western 133, Musik/Abenteuer jeweils 121; sechs weitere zuvor unterversorgte Genres jeweils 103, Drama 135, Komödie 132, Science-Fiction weiterhin 153. Arthouse 124; Classics 201. Insgesamt 111 neue Filme mit 888 Fragen, davon 876 neue globale Ziele und zwölf Bestandsvarianten. Alle 888 CSV-Zeilen mit echtem Parser exakt und konfliktfrei geprüft; Bestand unverändert, Wiederholimport und Generatorabgrenzung erfolgreich. Nach W16 Metadaten/TypeScript und vier Reihenprüfungen bestanden; letzte gebündelte Abnahme: 70 gezielte Tests in sieben Dateien nach W13.
- Echte App-Parser-Prüfung: alle 264 neuen Zeilen ohne Fehler, Warnungen oder Duplikate angenommen; Texte, Optionen, Rückmeldungen und Metadaten exakt erhalten. Wiederholter Import überspringt alle 264; der Generator ergänzt keine doppelten Jahres-/Regieziele. Bestehende Frageobjekte bleiben unverändert. Metadaten/TypeScript und 68 unterschiedliche gezielte Tests in sieben Dateien erfolgreich, einschließlich Paket-, Filmdaten-, Reihen-, Jahresauswahl-, Kategorien- und Bekanntheits-/Filmreiseprüfungen. Kein vollständiger Testlauf, Produktionsbuild oder Browserlauf in diesen lokalen Blöcken.
- Die Hulot-Filmfolge ist mit Criterion/Janus belegt: 1953 Teil 1, „Mon Oncle“ 1958 Teil 2, „Playtime“ 1967 Teil 3, „Trafic“ 1971 Teil 4. Die zwei bereits angezeigten Bestandsfilme sind entsprechend nachgezogen; das noch nicht als Genrefrage integrierte „Trafic“ bleibt Kandidat. Aktuelle Zusatzentscheidungen stehen in den Filmdaten, die historische Reihenabnahme vom 02.11. bleibt unverändert. Mit den späteren Paketen aktuell 3.042 angezeigte Filmidentitäten, davon 644 nummeriert. Neu sind zwei Teile der thematischen Bergman-Glaubenstrilogie und zwei Teile der beim BFI benannten Fellini-Trilogie der Einsamkeit; eigenständige Handlungen sind in den Reihennotizen erklärt.
- **Bis zum Gesamtziel offen:** 390 Genreergänzungen, davon je 47 in sechs 103er-Genres, je 29 Abenteuer/Musik, 17 Western, 15 Drama und 18 Komödien. Arthouse benötigt weitere 26 passende Werke und darf sich mit diesen Genreergänzungen überschneiden. Die übrigen Kandidaten sind ausdrücklich noch keine quellengeprüfte Redaktion.
- Aktuelle Fragen und gelesene Quellen stehen filmweise in `Redaktion/`; [Filmdaten](Filmdaten.json) und [abgeschlossene Pakete](Pakete.json) werden getrennt von der Vorauswahl geführt. Beim Erstjahr von „The Grey“ ist die öffentliche Vorführung 2011 maßgeblich; US-Start 2012 bleibt als spätere Veröffentlichung erklärt. Bei „Die vier Federn“ werden unabhängige Romanverfilmungen von Filmfolgen unterschieden.
- Veröffentlichung und produktive Katalogaktivierung sind nicht beauftragt.

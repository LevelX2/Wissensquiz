# Jahresfragen, Regiefragen und Filmdaten

Komödie-Erweiterung 29.09.2026: [50 zusätzliche Filme](Komoedie-Ergaenzung.md) ergeben 425 Filme, 425 Jahresfragen und 412 neue Regiefragen; 13 bestehende Regieziele bleiben erhalten. Neue Regievorlagen verwenden einen festen Pool von 425 Filmen. Die gelieferten Regie-Hintergründe sind nach der Antwort in den Filmdaten aufklappbar und vertiefen neue Regiefragen. „Clerks“ zeigt ein gemeinsames Figurenuniversum ohne nummerierte Teilposition. Frühere Fragevorlagen bleiben unverändert.

Erweiterung 29.09.2026: [50 zusätzliche Sci-Fi-Filme](SciFi-Ergaenzung.md) ergeben 375 Filme, 375 Jahresfragen und 362 neue Regiefragen; 13 bestehende Regieziele bleiben erhalten. Neue Regievorlagen verwenden einen festen Pool von 375 Filmen. Die gelieferten Regie-Hintergründe sind nach der Antwort in den Filmdaten aufklappbar und vertiefen neue Regiefragen. Frühere Fragevorlagen bleiben unverändert.

Stand: 26.09.2026. Die Ergänzung gehört zu den bestehenden Genres und Film-/Reihenthemen. Es gibt keine neue Auswahl „Filmwissen“.

Erweiterung 27.09.2026: [25 Musikfilme](Musik-Ergaenzung.md) ergänzen den Katalog auf 325 Filme, 325 Jahresfragen und 312 neue Regiefragen. Die 13 bereits vorhandenen Regieziele bleiben erhalten. Bestehende generierte Vorlagen verwenden weiterhin den ursprünglichen Alternativenpool mit 300 Filmen; neue Vorlagen pinnen den Pool auf 325. Neue Musikangaben stammen aus dem gelieferten Redaktionspaket, ohne unabhängige Vollprüfung. Die Zahlen der folgenden Abschnitte beschreiben den Initialstand.

## Umfang und Identität

300 verschiedene Filmfassungen im gelieferten Bestand erhalten jeweils eine Jahresfrage. Bei 287 Filmen kommt eine Regiefrage hinzu; bei 13 Filmen decken vorhandene Fragen das Regiewissen bereits ab. Diese bisherigen Fragen und Wissensziele bleiben unverändert. Insgesamt 587 neue Fragen/Ziele, damit 2.567 Fragen und 2.237 Wissensziele. Die 258 Themen und zwölf Genres bleiben bestehen.

Die redaktionelle Filmdatei `src/filmFacts.json` identifiziert Fassungen über Originaltitel und Jahr sowie eine konkrete bestehende Frage-ID. Neue Frage-IDs `FF-xxx-YEAR` bzw. `FF-xxx-DIRECTOR`, Lernziele `K-FF-xxx-…`. Nur passende vorhandene Filmreferenzen werden ergänzt; fehlende oder abweichende Referenzen bleiben unangetastet. Wiederholte Anwendung legt nichts doppelt an. Bereits vorhandene IDs werden nicht überschrieben. Der Abgleich läuft mit der bisherigen Paketergänzung in derselben Speichertransaktion, auch für vollständig importierte ältere Bestände.

Genres und Themen stammen aus der vorhandenen Filmreferenz. Classics und Arthouse werden aus den Zuordnungen desselben Filmwerks übernommen; keine neuen Kategorien und keine automatischen Altersgrenzen. Globale Summen zählen jede ID einmal. Aktuell Classics: 557 Fragen/479 Ziele; Arthouse: 389 Fragen/341 Ziele. Die bisherigen 1.980 CSV-Fragen bleiben unverändert, ebenso historische Rundensnapshots, Ereignisse und Fortschritte.

## Jahresfragen

Gemeint ist die erste Veröffentlichung einschließlich Premiere/Festival, nicht zwingend der deutsche oder breite reguläre Kinostart. Die Jahreszahlen sämtlicher 300 Quellenreferenzen stimmen mit der ersten in der jeweiligen Filmquelle angegebenen Veröffentlichung überein. Bei abweichenden späteren Länderstarts steht ein Hinweis in der Vertiefung und in Filmdaten. Die Regie im Fragetext grenzt Fassungen und Remakes ein.

Vor der Antwort steht die gesuchte Jahreszahl nicht im Fragetext. Für die Orwell-Verfilmung „1984“ identifizieren John Hurt und Richard Burton die Fassung, damit auch der Titel die Lösung nicht verrät. Quellen, Merksatz, Erklärung und Filmdaten erscheinen erst nach der Antwort. Die Jahreszahlen in den vier Antwortoptionen sind natürlich sichtbar.

Drei falsche Jahre werden beim Start jeder Runde neu gewählt. Leicht: Abstand 8–25 Jahre; Mittel: 2–10 Jahre; Schwer: 1–4 Jahre. Grenzen 1895–2026 sind Teil dieser Inhaltsversion; kein datumsabhängiges Verhalten beim späteren Wiederherstellen alter Runden. Die Alternativen sind verschieden, enthalten nicht die richtige Lösung und wiederholen bei der nächsten Begegnung nicht genau dasselbe Trio. Die tatsächliche Bildschirmreihenfolge wird wie bisher unabhängig gemischt.

Antwort-IDs enthalten den zugehörigen Jahreswert. Antwort, Feedback und Richtigkeitsmerkmal bleiben verbunden. Die gesamte Auswahl liegt im Rundensnapshot: Neuladen, Offline-Fortsetzen und Online-/JSON-Sicherung würfeln nichts neu aus. Frage-/Wissensziel-ID und Inhaltsversion ändern sich durch die Antwortvariation nicht. Die Backup-Prüfung erlaubt ausschließlich vollständige, im begrenzten Kandidatenpool gültige Antwortobjekte; Änderungen an Lösung, Feedback, Frage, Metadaten oder anderen Inhalten werden nicht darüber freigegeben.

## Regie und Quellen

Regieangaben wurden aus den verlinkten Filmquellen abgeglichen, überwiegend den bereits im Bestand referenzierten Wikipedia-Filmseiten. `source`, `checkedOn`, `releaseEvidence` und gegebenenfalls `additionalSources` dokumentieren Herkunft und Abgrenzung je Film. Keine unabhängige Vollprüfung der Filmhandlungen oder aller Credits. Die neuen Fragen und Erläuterungen sind eigene Formulierungen.

Gefragt ist die genannte Regie. Gemeinsame Regiearbeiten werden als Team angeboten; falsche Optionen enthalten keine Mitglieder des richtigen Teams. Bei Teams erhalten auch die Alternativen mehrere Namen. Schwierigkeit ist redaktionell gesetzt, nicht empirisch gemessen: neue Jahresfragen 57 leicht/179 mittel/64 schwer; neue Regiefragen 39 leicht/155 mittel/93 schwer.

Explizite Abgrenzungen:

- Halloween II: Rick Rosenthal ist der Regiecredit; Carpenters zusätzliche ungenannte Szenen werden erläutert, Carpenter nicht als falsche Regiealternative verwendet. [Filmquelle](https://en.wikipedia.org/wiki/Halloween_II_(1981_film)).
- The Big Lebowski: Joel Coen im offiziellen Credit; Ethans Mitarbeit wird erläutert und nicht als falsche Alternative angeboten. [Verleihquelle](https://www.focusfeatures.com/the-big-lebowski).
- Pappa ante portas: Loriot/Vicco von Bülow entsprechend Filmportal. Die abweichende englische Infobox mit Renate Westphal-Lorenz wurde nicht übernommen. [Filmportal](https://www.filmportal.de/film/pappa-ante-portas_f991ebe4e3694a9aaaf35cc56f47cee9).
- John Wick und Drunken Master II unterscheiden offiziellen Credit und zusätzliche Mitarbeit. David Leitch bzw. Jackie Chan werden nicht als falsche Alternativen verwendet.
- Armour of God: Jackie Chan und Eric Tsang; erster Start 1986 in Japan, Hongkong erst 1987. [Filmquelle](https://en.wikipedia.org/wiki/Armour_of_God_(film)).

## Filmdaten nach der Antwort

Aufklappbarer Abschnitt neben „Etwas tiefer eintauchen“, standardmäßig geschlossen: Originaltitel, erste Veröffentlichung, Regie, Produktionsländer/-regionen und gegebenenfalls Filmreihe mit Teilnummer. Die Angaben sind für alle 300 enthaltenen Filme verfügbar, auch bei bestehenden Fragen und historischen Rückblicken. Sie werden rein lesend zugespielt; keine Änderung an CSV oder gespeicherten Fragen. Fremde importierte Filme ohne passende Referenz erhalten keine erfundenen Daten.

Produktionsangaben sind keine Drehorte. Koproduktionen zeigen mehrere Länder/Regionen, historische Bezeichnungen werden kenntlich gemacht. Die Angaben stammen aus den verlinkten Filmquellen. 111 Filme haben derzeit eine konkrete Reihenzuordnung; sonst steht „Keine Reihe hinterlegt“, keine Behauptung, der Film sei sicher ein Einzelfilm.

Teilnummern beziehen sich auf Veröffentlichungsreihenfolge der Kinofilme, nicht auf Anzahl der Fragenpakete oder Handlungschronologie. Sonderfälle sind bezeichnet: offizielle Eon-Bond-Reihe, Star-Wars-Episoden versus Filmreihenfolge, Jurassic World als vierter Film insgesamt/erster seiner Trilogie, First Contact als achter Star-Trek-Kinofilm/zweiter mit der TNG-Crew, New Police Story als fünfter Film und eigenständiger Neustart, Dollar-Trilogie als lose verbundene Reihe. [Dollar-Trilogie](https://en.wikipedia.org/wiki/Dollars_Trilogy), [Star-Wars-Filme](https://en.wikipedia.org/wiki/List_of_Star_Wars_films).

Prüfzahlen: [Maschineller Ergänzungsbericht](film-facts-bericht.json). Einzelne Quellen und redaktionelle Stufen: [Filmkatalog](../src/filmFacts.json).

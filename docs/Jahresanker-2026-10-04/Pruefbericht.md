# Jahresfragen als zeitliches Merkgitter

## Auftrag und Ergebnis

Auf Nutzerauftrag vom 04.10.2026 sind die Vertiefungen und Merksätze aller **545 aktiven Film-Jahresfragen** neu entwickelt: 425 automatisch erzeugte und 120 bereits als CSV gelieferte Fragen. Ziel ist eine interessante zeitliche Verbindung, die den Film in ein größeres Wissensraster einordnet. Unterschiede zwischen Länderstarts bilden nicht mehr den Schwerpunkt der Vertiefung. Die korrekte Antwort bleibt das belegte Jahr der ersten Veröffentlichung einschließlich Premiere oder Festival.

**447 Verbindungen betreffen dasselbe Jahr, 98 einen ausdrücklich genannten zeitlichen Abstand.** 294 Anker führen über weitere Filme hinaus; 251 verbinden Filme oder Film-/Fernsehstationen. Die Auswahl umfasst 117 zeitgeschichtliche, 63 technische, 49 wissenschaftliche, 33 musikalische, 24 biografische und acht literarische Anker. Die Kategorien beschreiben den jeweils führenden Bezug; mehrere Aspekte können in einem Text vorkommen.

Die fünf übrigen numerischen Jahresfragen im aktiven Bestand prüfen andere Ereignisse oder Preisjahre und gehören nicht zu dieser Überarbeitung. Das separate, noch nicht eingebundene 40-Filme-Paket bleibt außerhalb des aktiven Umfangs.

## Redaktioneller Maßstab

- Einen konkreten zweiten Sachverhalt mit Jahreszahl nennen und verständlich mit diesem Film verbinden: Thema, Schauplatz, Technik, Musik, beteiligte Person oder Werkgeschichte.
- Direkte Beziehungen bevorzugen. Auch ein passendes Ereignis oder ein anschaulicher Gegensatz im gleichen Jahr kann einen Kalenderanker geben.
- Bei unterschiedlichen Jahren beide Zeitpunkte und Reihenfolge oder Abstand nennen. Historische Handlungszeit und Veröffentlichungsjahr unterscheiden.
- Die thematische Verknüpfung ist eine Merkhilfe. Gleichzeitigkeit allein belegt keine Produktionsursache, Inspiration oder historische Einflussnahme.
- Figuren bei der ersten Nennung mit Originaldarstellern verbinden, sofern die Zuordnung nicht bereits ausdrücklich formuliert ist; Originalstimmen entsprechend kennzeichnen.
- Den Merksatz als konkretes Zahlen-/Ereignispaar formulieren. Die Jahrgangsverbindung ersetzt die bisherige bloße Wiederholung „Filmtitel → Jahr“.

## Beispiele

| Filmjahr                       | Zweiter Anker                                         | Verbindung                                                                                  |
| ------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Forrest Gump, 1994             | Richard Nixon stirbt 1994                             | Der Präsident kommt im filmischen Rückblick auf die amerikanische Geschichte vor.           |
| Jurassic Park, 1993            | Kary Mullis erhält 1993 den Chemie-Nobelpreis für PCR | Reale DNA-Vervielfältigung und fantastische Wiedererschaffung aus Erbinformation.           |
| Alien – Die Wiedergeburt, 1997 | Dolly wird 1997 öffentlich bekannt                    | Ripley kehrt als Klon zurück; Dollys Geburt 1996 und Bekanntgabe 1997 werden unterschieden. |
| Les Misérables, 2012           | Victor Hugos Roman erscheint 1862                     | Genau 150 Jahre zwischen Roman und dieser Filmmusicalfassung.                               |
| Life of Pi, 2012               | Costa Concordia verunglückt 2012                      | Schiffbruch verbindet reale Nachricht und fantastische Rettungsbootgeschichte.              |

Die Ereignisbelege sind im [Quellenkatalog](Quellen.json) mit Datum, Sachangabe und URLs aufgeführt, unter anderem [Nixon Library](https://www.nixonlibrary.gov/president-nixon), [Nobelpreis-Mitteilung](https://www.nobelprize.org/prizes/chemistry/1993/press-release/), [Roslin Foundation](https://roslinfoundation.uk/dolly-the-sheep/) und [britische Regierungsmitteilung zur Costa Concordia](https://www.gov.uk/government/news/costa-concordia-cruise-ship-update). Der [vollständige Vorher-/Nachher-Nachweis](Redaktion.json) enthält alle 545 Frage-IDs, Texte, Merksätze, Quellen, Bezugsjahre, Abstände und gegebenenfalls die ID der verbundenen Filmfrage.

## Quellenprüfung und Grenzen

Datums- und Ereignisangaben wurden anhand gelesener Web-Auszüge und öffentlich zugänglicher Artikelzusammenfassungen geprüft. Offizielle Institutionen, Archive, Künstlerseiten und Hersteller werden nach Möglichkeit verwendet; bei weiteren Filmwerken und einigen biografischen oder kulturellen Angaben kommen auch Wikipedia-Artikel zum Einsatz. Ungeeignete oder nicht mehr vorhandene Verweise wurden durch passende Belege ersetzt. Bei nur eingeschränkt direkt abrufbaren Seiten wurden verfügbare Quellenansichten oder andere geeignete Belege gelesen. Ein HTTP-Erfolg oder eine Jahreszahl in einer Navigation allein gilt nicht als fachlicher Nachweis.

Für die bestehenden Filme werden zusätzlich die Identitäts-, Jahres-, Besetzungs- und Inhaltsnachweise der Bestandsredaktion wiederverwendet. Diese Arbeit ist eine Prüfung der neuen Jahresanker und ihrer Formulierung, keine neue Vollprüfung sämtlicher Aussagen in den 6.277 Bestandsfragen. Thematische Analogien und Gegensätze sind redaktionelle Interpretationen. Ob ein bestimmter Anker individuell gut im Gedächtnis bleibt, ist damit nicht empirisch nachgewiesen.

## Einbindung und Prüfung

`src/yearEditorial.json` enthält die neuen Anzeigetexte. `yearPresentation` ordnet sie einer bestehenden Frage über ID, Originaltitel/Jahr, Fragetext, bisherigen Kontext und richtige Jahresantwort zu. Eigene abweichende Fragen erhalten keine unpassende Vertiefung. Die Auflösung erfolgt ausschließlich in der Erklärung nach der Antwort, auch im Rundenrückblick. Merksatz und Ereignisquellen folgen derselben Auflösung. Die Texte gehören zum Offline-Build; externe Quellen benötigen Netz.

Rohquellen, CSV-Fragen, Generatorvorlagen, Frage- und Wissensziel-IDs, Antworten, Inhaltsversionen und Lernstände werden nicht umgeschrieben. Der synchronisierte Katalog bleibt bei 6.277 Fragen; sein Hash bleibt `fb8615bdb752106dbaf9d8979854a106586cfde4959043024f289bc439c5a759`. Kein Import, keine Migration, keine neuen Fragen und keine Veröffentlichung gehören zu diesem Auftrag.

**367 Tests in 61 Dateien, TypeScript und Produktionsbuild erfolgreich.** Vier neue redaktionelle Prüfungen bestätigen die vollständige Zuordnung aller 545 Fragen, unveränderten Bestand, individuelle Texte, gültige Quellen, wechselnde Jahresantworten und konsistente Vorher-/Nachher-Nachweise samt Bezugsjahren und Abständen. Ein bestehender Schauspieler-Sicherungstest überschritt beim parallelen Test-/Buildlauf die Fünf-Sekunden-Grenze; der gezielte Rücklauf und der vollständige Lauf mit `npm test -- --maxWorkers=2` bestanden.

**20 unterschiedliche Browserfälle erfolgreich:** 13 Chromium und sieben mobiles WebKit. Generierte und CSV-Jahresfragen, drei Antwortpositionen einschließlich historischer Snapshots, Lösungsschutz, Quellen, Neuladen, Offline-Fortsetzen und gespeicherte Lernstände sind geprüft. Die bestehenden Filmfragen-/Regiefälle bestätigen den unveränderten übrigen Erklärungsablauf. Eine veraltete Erwartung im Regietest wurde auf den bereits bestehenden Fox-Plaza-Text abgeglichen; danach bestanden alle fünf Fälle dieser Datei. Der für WebKit nicht vorgesehene Desktop-Quellenfall bleibt planmäßig übersprungen. Browserprofile und Testzeit sind isoliert beziehungsweise kontrolliert; echte Spielstände wurden nicht verändert.

Die beiden neuen Jahresvertiefungen und Merksätze auf 320 Pixeln sind visuell geprüft; die vorhandenen Axe-Prüfungen bestanden. Der geprüfte Offline-Build heißt `film-3e927165f687`. Formatierung der neuen Code-/Redaktionsdateien und `git diff --check` erfolgreich. Der bekannte Buildgrößenhinweis bleibt. Kein vollständiger Durchlauf aller Browserdateien und keine physische Geräteabnahme. Lokal auf `main` abgeschlossen; noch nicht veröffentlicht. Fremde Arbeitsstände bleiben außerhalb des Commits erhalten.

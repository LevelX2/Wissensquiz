# Quellen und Links

Stand: 08.11.2026, einschließlich der beauftragten Einzel-Nachrecherche lokal im Worktree `codex/quellen-und-links` umgesetzt; noch nicht veröffentlicht. Führender Produktauftrag: [Organisation der Fragedaten](Fragedaten-Organisation.md#quellen-und-links).

## Anordnung und Beschriftung

Die gemeinsame Auflösung zeigt nach dem Lernfortschritt genau eine geschlossene Klappe **„Quellen und Links“**. Sie enthält zwei getrennte Abschnitte:

- **Belegquellen:** die bisherigen fachlichen Nachweise aus Frage, Vertiefung, Besetzung, sämtlichen Filmdaten, Regiehintergründen und Bilderkennungsvarianten.
- **Weiterführende Datenbanken:** bestätigte IMDb- und OFDb-Einträge zu den konkret behandelten Filmen, Serien, Schauspielern und Regiepersonen.

„Etwas tiefer eintauchen“, „Filmdaten“ und „Über die Regie“ behalten ihre Texte und Fakten; ihre wiederholten Quellenlisten stehen jetzt gemeinsam unter „Quellen und Links“. Bildnachweise und die bereits beauftragten TMDB-Verweise bleiben unmittelbar am Bild. Sie erfüllen dort eine eigene Herkunftsfunktion.

Jeder Verweis steht in einer eigenen Zeile. Die Beschriftung nennt Anbieter und Ziel, beispielsweise „IMDb – Prestige – Die Meister der Magie (2006)“, „OFDb – Tom Hanks“ oder „Wikipedia (EN) – Regie: Christopher Nolan“. Wikipedia-Sprachfassungen bleiben unterscheidbar. Bei weiterführenden Einträgen nennt eine kleine Zusatzzeile Film, Serie, Schauspieler oder Regie. Bei sonstigen Belegen werden lesbare Artikel-/Dateinamen aus der URL verwendet; reine Kennungen erhalten den konkreten Frage- oder Werkbezug. Gemeinsame Quellen mehrerer Filmverweise nennen bei diesem Bezug sämtliche betroffenen Werke.

Gleiche Ziel-URLs erscheinen innerhalb der Klappe einmal. Ein abschließender Schrägstrich und reine Trackingparameter erzeugen keine weiteren Verweise. Unterschiedliche Sprachfassungen, Inhaltsabschnitte und Beleg-Unterseiten bleiben erhalten. Insbesondere sind eine IMDb-Handlungs-/Creditseite oder eine OFDb-Rezension eigenständige Belege gegenüber dem allgemeinen Datenbankeintrag. Ist bereits die Hauptseite ein Beleg, wird sie nur dort gezeigt.

## Bestätigte Zuordnungen

Die Umsetzung verwendet das bestehende Modell: Originaltitel und Jahr für Werke, Projekt-Personen-ID zusammen mit dem exakten Katalognamen für Schauspieler und konkrete Werk-/Regiecredits für Regiepersonen. Sie führt keine neuen Genre-, Freischalt- oder Lernregeln ein. Die Werkregister vermerken den tatsächlich bestätigten Film-/Serientyp; eine numerisch gleiche TMDB-Film- und Serien-ID begründet keine gemeinsame Identität. Unbestätigte Einträge erhalten keinen neuen Direktlink.

| Bestand | Bestätigte Zuordnungen |
|---|---:|
| IMDb-Werke | 3.400 von 3.400 aktuellen Werkidentitäten |
| Davon Serien | 3 |
| OFDb-Werke | 3.379 von 3.400 Werkidentitäten / 3.364 unterschiedliche Einträge |
| IMDb-Schauspieler | 428 von 428 Personen |
| OFDb-Schauspieler | 419 von 428 Personen |
| IMDb-Regie | 3.569 Werk-/Personenzuordnungen für alle 3.400 Werke, 1.696 unterschiedliche Personen |

15 zusätzliche Werk-Identitätsvarianten teilen einen bereits verwendeten IMDb-Eintrag; die bestehenden Quizidentitäten bleiben erhalten. Alle 23 zunächst offenen IMDb-Werkzuordnungen wurden durch Einzelrecherche geklärt. Die bestätigten Serien sind Dancin’ Days (1978), Gabriela (1975) und L’arte della gioia (2024); letztere besitzt jetzt auch einen bestätigten OFDb-Link. Für **21 Werke und neun Schauspieler** blieb nach tatsächlicher Anbieter-, Titel-/Namens-, Alias- und Vollsuche kein eindeutiger OFDb-Direktlink bestätigt. Die vollständigen Restlisten stehen in der [aktuellen Abnahme](Quellenlinks-Nachrecherche-Abnahme.json). Das ist kein Beweis, dass beim Anbieter kein Eintrag existiert. Bei den neun Schauspielern gefundene namensbasierte Filmografieseiten ohne hinreichend abgegrenztes Personenprofil wurden nicht als bestätigte Personenprofile ausgegeben.

Die Erstprüfung verwendete öffentliche TMDB-Antworten und frühere Filmreihenbelege. Die Nachrecherche wertet zusätzlich konkrete IMDb-Werk-/Personen- und Creditseiten, offizielle IMDb-Suchantworten sowie Verleiher-, Festival- und Archivbelege aus. Titel-/Namensvarianten, abweichende Erstjahre, Mitregie und konkret abgedeckte Schnittfassungen wurden einzeln entschieden. Ein gleichlautender Titel mit gleichem Jahr allein genügt nicht: Bei **Bruised (2020)** wurde der fremde Eintrag von Ali Tavakkoli durch Halle Berrys Film `tt8310474` ersetzt; bei **Enemy (2013)** der fremde Shatru-Eintrag durch Denis Villeneuves Film `tt2316411`. Die früheren Inventardateien bleiben Ausgangsnachweise; für diese korrigierten Identitäten sind das aktuelle Register und die Nachrecherche maßgeblich. Dies ist keine Behauptung, sämtliche IMDb-Seiten direkt mit HTTP 200 abgerufen zu haben.

OFDb wurde nach der ersten Cross-ID-Recherche für sämtliche Ausgangslücken direkt über die Anbieter-Quicksearch und die tatsächliche POST-Vollsuche nach IMDb-Kennung, Namen und Titeln geprüft; Castseiten, belegte Aliasse und gezielte externe Suchen ergänzen schwierige Fälle. Zwölf indische Titel wurden zusätzlich unabhängig vertieft. Jede neu übernommene OFDb-Seite ist eine tatsächlich abgerufene passende Zielseite. Im Regelfall stimmt die externe IMDb-Kennung unmittelbar überein. Abweichungen wurden einzeln anhand der konkreten Werk-/Personenidentität und Primärbelege entschieden: Mehrere zunächst zurückgestellte Fälle betreffen bestätigte Alias-/Sammelzuordnungen; Meeting Leila und Francisco Rabal besitzen ausdrücklich dokumentierte widersprüchliche externe IMDb-Felder. Bei Rabal bestätigen Name, Geburts-/Sterbedaten und sechs konkrete Katalogcredits das richtige OFDb-Profil. Die bestätigten eigenen IMDb-Zuordnungen werden durch solche Anbieterfelder nicht überschrieben. Die Links führen zu OFDb unter `ofdb.de`; generische Suchseiten oder Shopartikel werden nicht als Werke beziehungsweise Personenprofile ausgegeben.

## Fachlicher Restpunkt außerhalb der Linkzuordnung

Die bestehenden Filmdaten zu **Queen Kelly (1932)** nennen Gregg Toland als Mitregisseur. Die in der Nachrecherche geprüften IMDb-Primärcredits führen ihn als Kameramann und Richard Boleslawski für die zusätzliche Schlusssequenz. Der sichere Regielink zu Erich von Stroheim ist ergänzt; zu Toland wurde kein irreführender Regielink erzeugt. Die gespeicherten Quiz-/Filmdaten wurden im Linkauftrag nicht umgeschrieben. Der [IMDb-Nachrecherchebericht](Quellenlinks-Nachrecherche-IMDb.json) dokumentiert die Quellen und die beiden betroffenen Gloria-Swanson-Fragen für die gesonderte fachliche Klärung.

## Lösungsschutz und technische Pflege

`Explanation` bindet die Klappe ein. Die bestehenden Freigaben in `QuestionScreen`, Rundenrückblick und Duellauflösung bleiben maßgeblich. Vor der vorgesehenen Auflösung stehen weder Links noch verräterische Linkbeschriftungen oder URL-/Titelattribute im Fragen-DOM. Bei gesammelten Lösungen erscheinen sie im freigegebenen Rundenrückblick. Ein geschlossenes Quellenfeld allein dient nicht als Lösungsschutz.

`src/sourceLinks.ts` sammelt Belege und löst ausschließlich bestätigte Datenbankverknüpfungen auf; `QuestionLinks` ordnet sie an und `SourceLink` beschriftet sie. Die vier Runtime-Register `workDatabaseLinks.json`, `personDatabaseLinks.json`, `directorDatabaseLinks.json` und `ofdbLinks.json` enthalten nur die für diese Anzeige benötigten Felder. Im Browser erfolgen keine Rechercheabfragen und es wird kein Recherchezugang benötigt. Fragen, Antworten, Versionen, Lernidentitäten und private Spielstände werden nicht verändert. Eine Serverkatalogänderung oder Datenbankmigration ist für diese Anzeigeergänzung nicht erforderlich.

Maßgeblich für die Nachrecherche sind die [Abnahme mit Vorher-/Nachhervergleich und Restlisten](Quellenlinks-Nachrecherche-Abnahme.json), die [IMDb-Einzelfälle und Korrekturen](Quellenlinks-Nachrecherche-IMDb.json), die [OFDb-Werkprüfung](Quellenlinks-Nachrecherche-OFDb-Werke.json), die [OFDb-Personenprüfung](Quellenlinks-Nachrecherche-OFDb-Personen.json) und die [zusätzliche Indienprüfung](Quellenlinks-Nachrecherche-OFDb-Indien.json). Die Quellen und damaligen Prüfgrenzen der Erstprüfung bleiben in den [Werk-](Quellenlinks-Werke-Pruefung.json), [Personen-](Quellenlinks-Personen-Pruefung.json), [Regie-](Quellenlinks-Regie-Pruefung.json), [OFDb-Werk-](Quellenlinks-OFDb-Pruefung.json) und [OFDb-Personenbelegen](Quellenlinks-Personen-OFDb-Pruefung.json) nachvollziehbar. Deren Vollregister-Hashes beziehen sich auf den damaligen Stand vor der Kürzung der Auditfelder; später erkannte Fehlzuordnungen sind in der aktuellen Nachrecherche ausdrücklich korrigiert.

Öffentliche Originalantworten und direkte Zielnachweise unter `data/reference-links-2026-11-08/` bleiben als geschützte fachliche Recherchebelege erhalten. Sie sind keine Builds, Testprofile oder Veröffentlichungsartefakte und werden nicht mit der Website veröffentlicht. Aufbewahrung, solange diese Register auf ihnen beruhen; eine Löschung setzt vollständige ersetzende Identitäts- und Zielnachweise voraus. Temporäre Browser-, Cache- und Hilfsdateien werden nach abgeschlossener Prüfung entfernt. [Aktueller Registerumfang](Quellenlinks-Registerumfang.json), [gezielter Prüfnachweis der Nachrecherche](Pruefbericht.md#08112026--quellenlinks-nachrecherche-lokal).

# Quellen und Links

Stand: 08.11.2026, lokal im Worktree `codex/quellen-und-links` umgesetzt; noch nicht veröffentlicht. Führender Produktauftrag: [Organisation der Fragedaten](Fragedaten-Organisation.md#quellen-und-links).

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
| IMDb-Werke | 3.377 von 3.400 aktuellen Werkidentitäten |
| Davon Serien | 3 |
| OFDb-Werke | 3.204 Werkidentitäten / 3.191 unterschiedliche Einträge |
| IMDb-Schauspieler | 428 von 428 Personen |
| OFDb-Schauspieler | 188 von 428 Personen |
| IMDb-Regie | 3.527 Werk-/Personenzuordnungen für 3.370 Werke, 1.671 unterschiedliche Personen |

13 Werk-Identitätsvarianten teilen denselben IMDb-Eintrag; die bestehenden Quizidentitäten bleiben erhalten. 23 nicht eindeutig bestätigte Werkzuordnungen stehen vollständig im [Werkprüfbericht](Quellenlinks-Werke-Pruefung.json), darunter Schnittfassungen und abweichende vollständige Regiecredits. Die bestätigten Serien sind Dancin’ Days (1978), Gabriela (1975) und L’arte della gioia (2024). Dafür ist kein OFDb-Crosslink bestätigt. Eine leere Zuordnung behauptet nicht, dass bei einem Anbieter kein Eintrag existiert.

IMDb-Kennungen stammen aus den exakt zugeordneten öffentlichen TMDB-Antworten. 2.898 frühere Werkzuordnungen wurden zusätzlich gegen den abschließenden Filmreihen-Audit und dessen Originalantworten abgeglichen. Neue Zuordnungen benötigen Titel oder belegten Alternativtitel, Jahr und vollständige passende Regie; bei Serien wurden der TV-Endpunkt und konkrete Personencredits geprüft. Namen-/Aliasprüfungen sichern die Personenlinks. Dies ist eine Prüfung der Identitätsverknüpfung, keine Behauptung, sämtliche IMDb-Seiten direkt mit HTTP 200 abgerufen zu haben.

OFDb-Kandidaten wurden über genaue IMDb-Cross-IDs ermittelt und anschließend direkt abgerufen. Jede übernommene Werk- beziehungsweise Personenseite lieferte HTTP 200 und die erwartete `tt`- beziehungsweise `nm`-Kennung. Fünf falsche Crosslinks wurden ausgeschlossen; zwei Mehrdeutigkeiten durch den tatsächlichen Zielinhalt aufgelöst. Die Links führen zu OFDb unter `ofdb.de`, nicht zu einer anderen deutschen Datenbank oder einem Shopartikel. Personenlinks verwenden tatsächlich beobachtete Anbieter-URLs, in einem Fall den ebenfalls direkt bestätigten dokumentierten `.wd`-Verweis.

## Lösungsschutz und technische Pflege

`Explanation` bindet die Klappe ein. Die bestehenden Freigaben in `QuestionScreen`, Rundenrückblick und Duellauflösung bleiben maßgeblich. Vor der vorgesehenen Auflösung stehen weder Links noch verräterische Linkbeschriftungen oder URL-/Titelattribute im Fragen-DOM. Bei gesammelten Lösungen erscheinen sie im freigegebenen Rundenrückblick. Ein geschlossenes Quellenfeld allein dient nicht als Lösungsschutz.

`src/sourceLinks.ts` sammelt Belege und löst ausschließlich bestätigte Datenbankverknüpfungen auf; `QuestionLinks` ordnet sie an und `SourceLink` beschriftet sie. Die vier Runtime-Register `workDatabaseLinks.json`, `personDatabaseLinks.json`, `directorDatabaseLinks.json` und `ofdbLinks.json` enthalten nur die für diese Anzeige benötigten Felder. Im Browser erfolgen keine Rechercheabfragen und es wird kein Recherchezugang benötigt. Fragen, Antworten, Versionen, Lernidentitäten und private Spielstände werden nicht verändert. Eine Serverkatalogänderung oder Datenbankmigration ist für diese Anzeigeergänzung nicht erforderlich.

Vollständige Einzelbelege und Prüfgrenzen stehen in den [Werk-](Quellenlinks-Werke-Pruefung.json), [Personen-](Quellenlinks-Personen-Pruefung.json), [Regie-](Quellenlinks-Regie-Pruefung.json), [OFDb-Werk-](Quellenlinks-OFDb-Pruefung.json) und [OFDb-Personenprüfungen](Quellenlinks-Personen-OFDb-Pruefung.json). Die dortigen Hashes des geprüften Vollregisters beziehen sich auf den Belegstand vor der Kürzung ungenutzter Runtime-Auditfelder.

Öffentliche Originalantworten und direkte Zielnachweise unter `data/reference-links-2026-11-08/` bleiben als geschützte fachliche Recherchebelege erhalten. Sie sind keine Builds, Testprofile oder Veröffentlichungsartefakte und werden nicht mit der Website veröffentlicht. Aufbewahrung, solange diese Register auf ihnen beruhen; eine Löschung setzt vollständige ersetzende Identitäts- und Zielnachweise voraus. Temporäre Browser-, Cache- und Hilfsdateien werden nach abgeschlossener Prüfung entfernt. [Gezielter Prüfnachweis](Pruefbericht.md#08112026--quellen-und-links-lokal).

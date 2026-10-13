# Gesamtkatalog der Fragen – 13.10.2026

Enthalten sind **13.684 Fragen**: **7.461 überarbeitet**, **6.223 offen** im fortlaufenden Redaktionslauf. Die 7.461 redigierten Fragen umfassen 6.550 bearbeitete ursprüngliche IDs und 911 Ergänzungen. Ersatzfragen stehen mit ihrer neuen ID anstelle der bisherigen Frage.

[Alle Fragen als CSV](Alle-Fragen.csv) (29,95 MiB). [Alle Genre-Dateien und Anleitung als ZIP](Fragen-nach-Genre.zip).

| Genre / Bereich | Fragen | Überarbeitet | Offen | Dateigröße |
|---|---:|---:|---:|---:|
| [Abenteuer](Abenteuer.csv) | 840 | 448 | 392 | 1,89 MiB |
| [Action](Action.csv) | 908 | 652 | 256 | 2,00 MiB |
| [Drama](Drama.csv) | 1.103 | 768 | 335 | 2,42 MiB |
| [Fantasy](Fantasy.csv) | 902 | 526 | 376 | 2,12 MiB |
| [Horror](Horror.csv) | 908 | 585 | 323 | 2,05 MiB |
| [Komödie](Komoedie.csv) | 1.221 | 856 | 365 | 2,70 MiB |
| [Martial Arts & Asia-Film](Martial-Arts-und-Asia-Film.csv) | 879 | 486 | 393 | 2,11 MiB |
| [Musik](Musik.csv) | 896 | 632 | 264 | 2,03 MiB |
| [Rom-Com](Rom-Com.csv) | 897 | 607 | 290 | 1,97 MiB |
| [Science-Fiction](Science-Fiction.csv) | 1.331 | 893 | 438 | 2,96 MiB |
| [Thriller](Thriller.csv) | 880 | 543 | 337 | 1,94 MiB |
| [Western](Western.csv) | 879 | 465 | 414 | 1,97 MiB |
| [Preisträger](Preistraeger.csv) | 280 | 0 | 280 | 0,65 MiB |
| [Schauspieler](Schauspieler.csv) | 1.760 | 0 | 1.760 | 3,13 MiB |

## Verwendung im anderen Chat

1. Diese Anleitung, die beiliegenden [Redaktionsregeln](Redaktionsregeln.md), die [Rückgabeanleitung](Rueckgabeformat.md) und die gewünschte Genre-CSV mitgeben.
2. Zuerst sämtliche Fragen eines Films lesen, einschließlich der bereits überarbeiteten. Bei zusätzlichen Filmbezügen auch die anderen Genre-Dateien beziehungsweise den Gesamtkatalog durchsuchen.
3. Zur weiteren Bearbeitung Fragen mit `editorial_status=offen` auswählen. Die Sammlung als Kontext nutzen; nur die ausgewählten Fragen samt Ergänzungen zurückgeben. Auswahl-IDs im Begleittext nennen, damit parallel arbeitende Chats denselben Bestand nicht versehentlich zweimal bearbeiten.
4. CSV-Texte, Lösungen und Identitäten nach dem Rückgabeformat liefern. Neue eigenständige Fragen dürfen ohne Frage- und Wissensziel-ID zurückkommen. Varianten und Ersatzfragen eindeutig zuordnen.
5. Die 31 ursprünglichen Film-CSV-Spalten stehen am Anfang. Die zusätzlichen Katalogspalten dürfen zur Zuordnung mitgeliefert werden; sie dienen als Kontext und sind kein Auftrag, App-Metadaten oder Bearbeitungsstatus zu ändern. Für Personen-/Preisfragen zusätzlich die jeweiligen Bereichsverträge beachten.

## Bedeutung der Statusfelder

- `editorial_status`: `überarbeitet` bedeutet im laufenden Redaktionsbestand vorhanden; `offen` bedeutet dort noch nicht abgeschlossen. Es ist keine Behauptung, dass diese Frage nie zuvor redaktionell bearbeitet wurde. Der Export führt keine neue inhaltliche Prüfung aller Fragen durch.
- `editorial_kind`: Bestandsfrage, ausdrücklich neu vergebene Ersatzfrage oder Ergänzung. `original_question_id` und `replaces_question_id` erhalten die Zuordnung.
- `app_status`: Vergleich mit dem **lokalen App-Quellkatalog** zum Exportzeitpunkt. Eine redigierte Fassung kann noch fehlen oder inzwischen erneut abweichen. Das Feld bestätigt keine Veröffentlichung und keine produktive Aktivierung.
- `catalog_group`: Datei-Zuordnung. Alle Filmfragen desselben Originaltitels und Erstveröffentlichungsjahrs stehen in derselben Genre-Datei; bei mehreren vorhandenen Genrezuordnungen entscheidet die häufigste. Die ursprüngliche Zuordnung bleibt in `subdomain` erhalten. Schauspieler und Preisträger sind eigene Dateien.
- `film_key`: Originaltitel und Erstveröffentlichungsjahr; `film_refs` nennt weitere Filmbezüge, insbesondere bei Personenfragen.
- `verification_status`: Übernommener redaktioneller Quellenstatus, kein Beleg einer neuen Quellenprüfung durch diesen Export.

## Umfang und Formate

UTF-8 mit BOM, Komma, vollständig gequotete Felder, CRLF. Reihenfolge nach Bereich, Genre, Film beziehungsweise Person, Jahr und Schwierigkeit. Enthalten sind der genaue Fragetext, vier Antworten, Lösung, Kurzantwort, Vertiefung, Feedback, Quellen und Zuordnungen. `answer_ids` erhält die internen Antwort-IDs; A–D bezeichnet die gespeicherte Reihenfolge, die App kann sie mischen. `display_additional_context` und `display_films_json` erhalten zusätzliche bisherige Anzeigeinformationen, soweit vorhanden. Die zentralen Texte stammen bei überarbeiteten Fragen aus der aktuellen Redaktion; sonst aus der derzeitigen App-Anzeige.

Bei neuen redaktionellen Ergänzungen werden fehlende Film-Stammdaten aus dem vorhandenen selben Film übernommen; Frage, Wissensziel, Antworttexte und Quellen stammen unverändert aus der Redaktion. Genre-/Filmzuordnung ist Kontext, keine neue Faktenabnahme.

Bei Bilderkennungsfragen sind die Bild-IDs beziehungsweise vorhandenen Bildverweise enthalten. Für eine visuelle Prüfung benötigt der bearbeitende Chat zusätzlich Zugriff auf die zugehörigen Bilder.

Der Gesamtkatalog umfasst die zusammengesetzten lokalen App-Pakete und die aktuellen abgeschlossenen Fassungen aus `Fragen.json`. Laufende Entwürfe anderer Chats, Spielstände und private Nutzerdaten sind nicht enthalten. Die extern zurückgegebenen 50 Vorschläge wurden noch nicht freigegeben und ersetzen daher nicht den gespeicherten Ausgangsstand. Der Redaktionslauf bleibt pausiert.

Der Gesamtbestand ersetzt keine vollständige Sichtung durch den bearbeitenden Chat. Die Genreaufteilung verringert die Dateigröße; bei großen Genres weiterhin filmweise arbeiten und relevante Datensätze gezielt lesen.

Dieser Kontextkatalog ist kein direkt auszuführender App-Import. Bestehende IDs werden beim normalen Import übersprungen; 5 Variantenbezüge verweisen auf ursprüngliche, inzwischen ersetzte Frage-IDs und müssen bei betroffenen Integrationen anhand Wissensziel und Originalzuordnung beurteilt werden. Auch generierte Jahres-/Regiefragen dürfen nicht doppelt angelegt werden.

Quellstand: lokaler Commit `35d324021ff585ee308e6bb9e0c82205d7208ee1`; Seriengrundlage `3cada41bbf13a3aff0db4b2d5a229aaeea064ac7`, abgeschlossen bis Block 128. Der Export verändert weder Fragen noch Bearbeitungszähler.

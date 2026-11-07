# Organisation der Fragedaten

Stand: 07.11.2026, **seit Version 88 veröffentlicht**. Die aktuelle Nutzeranweisung ist in [AGENTS.md](../AGENTS.md#aktueller-fragenkatalog-statt-pakethistorie) verankert. [Veröffentlichung und Live-Abnahme](Veroeffentlichung-2026-11-07-Version-88.json).

## Führender aktueller Bestand

| Fachbereich | Redaktion | Aktuelle Fragen |
|---|---|---:|
| Filmfragen | `content/filmfragen/*.jsonl`, zwölf Genres | 15.599 |
| Schauspieler | `content/schauspielerfragen.jsonl` | 3.424 |
| Preisträger | `content/preisfragen.jsonl` | 380 |
| Gesamt | Drei aktuelle Fachbestände | 19.403 |

Eine UTF-8-Zeile enthält ein vollständiges aktuelles Frageobjekt. `src/questionSchema.ts` definiert die Felder. Fragen-IDs identifizieren Fragenfassungen; Wissensziel-IDs verbinden Varianten und ihren Lernfortschritt. Bei Änderungen am Inhalt werden Frage, Antworten, Erklärung, Quellen, Version und zugehörige Metadaten gemeinsam gepflegt.

Die drei Fachbereiche liegen in 14 aktuellen Dateien. Filmfragen werden anhand ihres Genre-Attributs in zwölf Dateien geführt. Die zuvor gemeinsame Datei mit 46.457.606 Bytes überschritt die Sites-Grenze von 32 MiB je Git-Objekt. Alle 15.599 Filmfragen wurden zeilengetreu auf die aktuellen Genres aufgeteilt; keine zusätzlichen Kopien oder Lieferpakete. Import und Prüfung verwenden dieselbe fachliche Zuordnung.

Noch nicht übernommene fremde Redaktion bleibt Arbeitsmaterial. Die vorbereiteten 320 Fragen aus der 40-Filme-Redaktion sind kein zweiter aktueller Spielbestand und wurden nicht als abgeschlossene Lieferkopie gelöscht.

Frühere Lieferungen und Bearbeitungsstände sind über Git nachvollziehbar. Zusätzliche Lieferarchive, wellenweise Original-CSV, historische Zwischenbestände und von Lieferdateinamen abhängige Prüfstufen gehören nicht zum aktuellen Katalogaufbau. Die 123 bisherigen CSV-Lieferpakete und ihre doppelten Originalablagen wurden aus diesem Weg entfernt. Auch die abschließend gefundenen 48 ungenutzten CSV-/JSON-Lieferkopien, Katalogexporte und Transport-/Leseexemplare wurden entfernt (88,8 MB). Fachliche Belegquellen, aktuelle Filmdaten und Bildrechtsnachweise bleiben erhalten.

## Aufbau und Übernahme

`src/packages.ts` liest die drei aktuellen Fachbestände, prüft ihr Schema, ihre Bereichszuordnung und die eindeutigen Fragen-IDs. Variantenbezüge werden gegen den gesamten eingelesenen Bestand aufgelöst. Vor einer Übernahme werden alle Eingaben geprüft; fehlerhafte Daten verändern den vorgeschlagenen Zustand nicht. Ein wiederholtes Einlesen erzeugt keine Duplikate. Dateinamen historischer Lieferungen und deren Einlesereihenfolge haben keine Sonderbedeutung mehr.

Alle bestehenden Jahres- und Regiefragen stehen ausdrücklich im aktuellen Bestand. Beim Einlesen werden keine weiteren Fragen erzeugt. Die laufende Variation von Jahresantworten und die Prüfung von Rundensnapshots bleiben davon getrennt.

Neue CSV-Redaktion wird mit `scripts/import-current-questions.mjs` gegen den aktuellen Gesamtkatalog geprüft und mit `--write` unmittelbar in den passenden Fachbestand übernommen. Eine zusätzliche Paketregistrierung oder Lieferkopie entfällt. [Eingabeformat und Aufruf](Importformat.md#aktueller-fragenbestand--07112026).

## Veröffentlichung und Spielbetrieb

`npm run prepare:server-content` erstellt aus dem aktuellen Bestand den gemeinsamen Serverkatalog. Die bestehenden Serverfunktionen bilden Auswahlmengen anhand von Bereich, Genre, Schwierigkeit, Bekanntheit, Themen und Fragen-/Wissensziel-IDs. Technische SQL-Transportteile werden nach Größe gebildet; sie bilden keine Lieferhistorie ab.

Der Browser lädt einzelne Fragen aus dem aktuellen Onlinebestand. Die redaktionellen Quelldateien liegen außerhalb von `public` und werden nicht in den statischen Website-Build kopiert. Veröffentlichung und produktive Aktivierung benötigen weiterhin eine ausdrückliche Freigabe für den konkreten Stand. [Onlinevertrag](Anmeldung-und-Online-Spielstand.md), [Betrieb](Sites-Betrieb.md).

## Prüfung und Grenzen

`npm run check:questions` prüft den aktuellen Gesamtkatalog: Schema, eindeutige IDs, Variantenbezüge, Bereichszuordnung, von der Einlesereihenfolge unabhängige Inhalte, wiederholtes Einlesen, Sicherungsvalidierung und verlustfreie Metadatenkodierung. Der aktuelle Nachweis steht in [Fragedaten-Pruefung.json](Fragedaten-Pruefung.json).

Bei der Umorganisation wurden sämtliche Felder der 19.303 bestehenden Fragen mit dem zuvor tatsächlich aufgebauten Katalog verglichen. Inhalte, Antworten, Quellen, Versionen und Wissensziel-IDs sind unverändert. Der über nach Fragen-ID und Objektschlüsseln sortierte Daten gebildete SHA-256 ist vor und nach der Umorganisation `5e176851d58d94879b7c874e460f8d0c8d0170c45d769fa4965e75e8e3c809fb`.

Danach wurden 100 Oscar-Darstellungsfragen unmittelbar in Preisfragen ergänzt: 62 neue Wissensziele und 38 Varianten mit gemeinsamem Fortschritt. Aktuell 18.650 Ziele und 753 Variantenbezüge; alle 19.303 vorherigen Frageobjekte bleiben feldgleich erhalten. [Inhalt, Quellen und Abnahme](Preistraeger.md).

Eine zusätzliche Prüfung erkannte einen bestehenden Zuordnungsfehler bei kompakten Spielstandsbelegen: Eine leere Personen-ID kann als numerischer Metadatenverweis kodiert sein und wurde als gefüllte ID behandelt. Die seit Version 88 produktive SQL-Korrektur liest den tatsächlichen Wert im bestehenden Format. Private Aufrufrechte, leere Suchpfade und fünf konkrete Decoderfälle sind lokal und nativ geprüft. Die Aktivierung hat im konsistenten Snapshot 46 Quelltabellen unverändert erhalten; der Serverbestand enthält 19.403 Fragen / 18.650 Ziele, die Bereitstellung ist leer. Die nativen Security-/Performance-Advisors zeigen keine neuen Befunde. Die lokale gemeinsame Git-Historie bleibt erhalten; für die Sites-Quellgrenze dient ein identischer aktueller Quellbaum auf dem bestehenden Hostingbranch.

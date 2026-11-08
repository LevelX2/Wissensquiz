# Organisation der Fragedaten

Stand: 07.11.2026, **seit Version 88 veröffentlicht**. Die aktuelle Nutzeranweisung ist in [AGENTS.md](../AGENTS.md#aktueller-fragenkatalog-statt-pakethistorie) verankert. [Veröffentlichung und Live-Abnahme](Veroeffentlichung-2026-11-07-Version-88.json).

## Beschlossener Zielzustand: Werkarten und Mehrfachzuordnungen – 08.11.2026

**Status: lokal umgesetzt und geprüft, noch nicht veröffentlicht.** Die folgenden Vorgaben stammen aus Luis sechs Auswahlantworten vom 08.11.2026. Werkarten und Mehrfachzuordnungen sind in [fünf sequenziellen Activities](activities/README.md) umgesetzt. Die ergänzende Linkaufgabe übernimmt auf Nutzerwunsch ein anderer Chat. Der unten beschriebene veröffentlichte Katalog und seine Software unterstützen dieses Modell noch nicht.

Werkart (Film/Serie), Genres, Fragenbereich (Werkfragen/Schauspieler/Preisträger), Machart (einschließlich Animation) und kuratierte Zuordnungen (Classics/Arthouse) sind getrennte, kombinierbare Merkmale. Mehrere Genres sind möglich. Eine Frage zu einer Serienbesetzung kann damit Serie, Sci-Fi, Fantasy und Schauspieler zugleich zugeordnet sein. TV-Serien und nummerierte Filmreihen haben unterschiedliche Bedeutungen.

| Entscheidung | Verbindliches Ziel |
|---|---|
| Genre-Freischaltung | Ein sicher beantwortetes Ziel mit mehreren passenden Genres bringt die Freischaltung aller dieser Genres voran. |
| Schauspieler- und Preisfragen | Sichere Antworten zählen zusätzlich für die passenden Werkfragen-Bereiche. Der Fragenbereich der Frage bleibt Schauspieler beziehungsweise Preisträger. |
| Filme und Serien | Freischaltungen nach Werkart trennen; Filmwissen öffnet nicht allein aufgrund desselben Genres Serienwissen. |
| Filmreise | Ausgewogene Lernbereiche; zusätzliche Zuordnungen erzeugen keine zusätzlichen Lose für dasselbe Ziel. Ein Ziel höchstens einmal je Runde. |
| Fragesymbole | Mehrere Symbole für die passenden Zuordnungen zeigen. Die zuvor vorgeschlagene Beschränkung auf ein Hauptsymbol ist nicht gewählt. |
| Gezielte Filter | Nur Fragen mit passendem konkretem Bezug aufnehmen. Allgemeine Karriere- oder Preisfragen bleiben über die breite Bereichsauswahl erreichbar. |

Ein Wissensziel behält einen gemeinsamen Lernstatus, Wiederholungstermin und Fehlerstand. Themenansichten dürfen denselben Stand zeigen. Globale Summen und der Bestand einer kombinierten Auswahl zählen eindeutige Wissensziel-IDs; überlappende Themenzahlen werden nicht addiert. Mehrfachzuordnungen erzeugen keine zusätzlichen XP oder Lernereignisse. Sichere Treffer für Freischaltungen, bloßes Kennenlernen und der aktuelle Lernstatus bleiben unterschiedliche Größen.

Bereichsübergreifende Anrechnung benötigt einen geprüften konkreten Werk-/Genrebezug des Wissensziels. Die Filmografie einer Person oder eine Preisnennung liefert keine pauschale Zuordnung zu allen ihren Werken oder Genres. Zähler und Nenner einer Freischaltung verwenden dieselbe aktuelle Zielmenge, je Ziel und Freischaltpfad einmal. Eine leichte Frage zählt nicht als sicherer Treffer einer höheren Schwierigkeit. Nur tatsächlich vorgesehene Stufen können geöffnet werden; die Experte-Stufe einer Preisfrage erzeugt keine neue Werkfragen-Stufe.

### Lokaler Umsetzungsstand

Alle fünf Softwarepakete sind lokal umgesetzt: typisierte Werkbezüge und korrelierte Filter; gemeinsame Zielbelege mit getrennter Film-/Serienfreischaltung; ausgewogene Auslosung ohne zusätzliche Lose; mehrere lösungssichere Symbole; getrennte Rekord- und Duellthemen. SQL ausschließlich lokal. Im unveränderten Gesamtbestand von 19.403 Fragen sind 109 Fragen zu 99 Serien sowie 561 Fragen zu 84 Animationsfilm-Identitäten eingeordnet; zehn Serienfragen betreffen Sci-Fi, fünf Fantasy. Die neun Werkfragen mit Serienbezug behalten zusätzlich ihren konkreten Filmbezug; 100 Serienfragen bleiben Schauspielerfragen. Die separate Datei für reine Serien-Werkfragen ist noch leer. Vier passende Bildmotive für Film, Serie, Animation und Realfilm ergänzen die bisherigen Genreillustrationen. Bestehende Fragen-/Ziel-IDs, redigierte Texte und private Belege bleiben erhalten. Links aus dem anderen Chat übernommen. [Datenvertrag](Importformat.md#werkarten-in-den-spielwegen), [Prüfnachweis](Pruefbericht.md), [Bildmotive](Genreillustrationen.md#werkarten-und-macharten).

### Quellen und Links

**Lokal umgesetzt, noch nicht veröffentlicht.** Die gemeinsame Klappe mit getrennten Belegquellen und weiterführenden Datenbanken, bestätigte IMDb-/OFDb-Zuordnungen, Lösungsschutz und offene fachliche Punkte regelt [Quellen und Links](Quellen-und-Links.md). Dieser Vertrag ist unabhängig vom Umbau der Werkarten und Mehrfachzuordnungen.

Der Bereich heißt einheitlich **„Quellen und Links“**. Neben den fachlichen Belegen erscheinen bestätigte IMDb-Verweise und vorhandene bestätigte OFDb-Verweise zum konkreten Film, zur Serie oder zur Person. Lui hat ausdrücklich bestätigt, dass mit „UFDB“ **OFDb unter ofdb.de** gemeint ist.

Verweise werden gegen den richtigen Werk- oder Personeneintrag geprüft und zentral an dessen Identität gepflegt. Gleiche Titel, Remakes, Serien, Filmreihen und namensgleiche Personen müssen unterschieden werden. Vorhandene geprüfte Referenzen wiederverwenden; keinen Eintrag und keine URL erraten. Fehlende oder ungeklärte Einträge erzeugen keinen scheinbar gültigen Direktlink. Belegquellen und weiterführende Links bleiben in ihrer Funktion erkennbar; Dubletten erscheinen einmal. Linktexte sollen Anbieter und Gegenstand verständlich nennen, etwa „IMDb – Interstellar (2014)“ oder „IMDb – Matthew McConaughey“, statt lediglich einen Hostnamen anzuzeigen. Bei mehreren betroffenen Werken oder Personen muss die Beschriftung den jeweiligen Gegenstand nennen. Die bestehende Lösungsanzeige nach einer Antwort beziehungsweise am Rundenende bestimmt auch den Zeitpunkt dieser Links.

Die hiesigen Activities legen gezielte Prüfungen für Datenmodell, Anrechnung, Auswahl und Oberfläche fest. Die Gewichtung ist im Auswahlvertrag festgelegt. Der Datenvertrag unterscheidet Serienbeginn, Gesamtserie und konkrete Staffel-/Folgenbezüge; Spoiler- und Titelprüfung gehören vor neuen Serienfragen zur Redaktion. Neue Fragenbestände und eine Veröffentlichung sind durch diese Festlegung nicht erledigt oder automatisch freigegeben. Bestehende Fragen-/Wissensziel-IDs und private Nutzerdaten bleiben erhalten; die aktuelle Katalogdirektive gilt auch für Mehrfachzuordnungen.

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

Die interne Vollkatalogvalidierung erlaubt bis zu 100.000 Fragen und zugehörige Katalog-IDs. Auswahlpool und Warteschlange eines Zeitkontolaufs verwenden dieselbe Obergrenze. Der aktuelle Werkbestand überschreitet 20.000 Fragen und wird einschließlich eines daraus gestarteten Zeitkontolaufs geprüft. Dies ergänzt keine Sicherungsoberfläche und ändert keine Onlineablage.

`npm run check:questions` prüft den aktuellen Gesamtkatalog: Schema, eindeutige IDs, Variantenbezüge, Bereichszuordnung, von der Einlesereihenfolge unabhängige Inhalte, wiederholtes Einlesen, Sicherungsvalidierung und verlustfreie Metadatenkodierung. Der aktuelle Nachweis steht in [Fragedaten-Pruefung.json](Fragedaten-Pruefung.json).

Bei der Umorganisation wurden sämtliche Felder der 19.303 bestehenden Fragen mit dem zuvor tatsächlich aufgebauten Katalog verglichen. Inhalte, Antworten, Quellen, Versionen und Wissensziel-IDs sind unverändert. Der über nach Fragen-ID und Objektschlüsseln sortierte Daten gebildete SHA-256 ist vor und nach der Umorganisation `5e176851d58d94879b7c874e460f8d0c8d0170c45d769fa4965e75e8e3c809fb`.

Danach wurden 100 Oscar-Darstellungsfragen unmittelbar in Preisfragen ergänzt: 62 neue Wissensziele und 38 Varianten mit gemeinsamem Fortschritt. Aktuell 18.650 Ziele und 753 Variantenbezüge; alle 19.303 vorherigen Frageobjekte bleiben feldgleich erhalten. [Inhalt, Quellen und Abnahme](Preistraeger.md).

Eine zusätzliche Prüfung erkannte einen bestehenden Zuordnungsfehler bei kompakten Spielstandsbelegen: Eine leere Personen-ID kann als numerischer Metadatenverweis kodiert sein und wurde als gefüllte ID behandelt. Die seit Version 88 produktive SQL-Korrektur liest den tatsächlichen Wert im bestehenden Format. Private Aufrufrechte, leere Suchpfade und fünf konkrete Decoderfälle sind lokal und nativ geprüft. Die Aktivierung hat im konsistenten Snapshot 46 Quelltabellen unverändert erhalten; der Serverbestand enthält 19.403 Fragen / 18.650 Ziele, die Bereitstellung ist leer. Die nativen Security-/Performance-Advisors zeigen keine neuen Befunde. Die lokale gemeinsame Git-Historie bleibt erhalten; für die Sites-Quellgrenze dient ein identischer aktueller Quellbaum auf dem bestehenden Hostingbranch.

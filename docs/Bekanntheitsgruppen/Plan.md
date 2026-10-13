# Vier Bekanntheitsgruppen in allen Fragenbereichen

**Seit Version 80 am 13.10.2026 veröffentlicht:** 428 Personen mit viermal 107, 3.424 Schauspielerfragen und gemeinsame Gruppenfilter/Freischaltungen für Schauspieler und Preise. Die folgenden Bestandszahlen dokumentieren die ursprüngliche Einordnung vor dem Ausbau. [Aktueller App-Vertrag und Mengen](App-Integration-2026-10-13.md).

Stand: 13.10.2026. Auf [Nutzerauftrag](../../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-13%20Nutzerauftrag%20Bekanntheitsgruppen.txt) redaktionell vorbereitet. Die Einordnung und der vollständige Ausbau sind lokal in Auswahl, Oberfläche und serverseitige Freischaltungen integriert. Anschließend begann der beauftragte Ausbau: [208 zusätzliche Personen, 1.664 geprüfte Fragen und geprüfte Porträts](../Schauspieler-Bekanntheit-2026-10-13/Plan.md) redaktionell fertig und lokal installiert. Die Bestandszahlen dieser Seite beziehen sich weiterhin auf die bisherigen 220 Personen.

## Gemeinsamer Maßstab

Vier Bekanntheitsgruppen gelten in jedem der drei Fragenbereiche Filmfragen, Schauspieler und Preisträger. Die vier Gruppen sind keine vier Fragenbereiche. Bereichsübergreifende Bezeichnungen sind **Sehr bekannt**, **Bekannt**, **Für Filmkenner** und **Entdeckungen**. Die bisherigen Filmbezeichnungen Film-Ikonen, Bekannte Filme, Kennerfilme und Entdeckungen entsprechen denselben Stufen.

Bezugsrahmen ist das breite deutschsprachige Kinopublikum, einschließlich älterer Filmklassiker und aktueller populärer Filme. Bekanntheit kann über den Namen oder ein wiedererkennbares Gesicht entstehen. Alter, Herkunft, schauspielerische Qualität und Preise allein bestimmen keine Gruppe. Die Zuordnung ist eine redaktionelle Einschätzung und keine gemessene Bekanntheitsquote. Regionale und generationelle Unterschiede bleiben möglich; spätere sachlich begründete Korrekturen sind zulässig.

- **1 Sehr bekannt:** Namen beziehungsweise Gesichter mit breiter Bekanntheit auch außerhalb einzelner Filmrichtungen; etwa Tom Hanks, Romy Schneider und Bud Spencer.
- **2 Bekannt:** Vertraute Namen oder Gesichter für ein regelmäßig Filme schauendes Publikum, ohne durchgängige Wiedererkennung in allen Generationen; etwa Gary Oldman, Daniel Brühl und Rachel Weisz.
- **3 Für Filmkenner:** Eher über bestimmte Filmrichtungen, Filmografien oder markante Nebenrollen vertraut; etwa Toshirō Mifune, Isabelle Huppert und Bill Paxton.
- **4 Entdeckungen:** Im breiten Bezugsrahmen selten vertraute Namen und Gesichter, häufig mit stärkerem Bezug zum klassischen oder internationalen Autorenkino; im aktuellen Bestand Julie Christie, Emily Watson, Liv Ullmann, Julie Delpy und Barbara Stanwyck.

Grenzfälle sind ausdrücklich redaktionell: Angela Bassett oder Imelda Staunton können als Rollenfiguren stärker erkannt werden als namentlich; ihre Gruppe 3 ist eine Ersteinschätzung. Stars wie Gong Li und Song Kang-ho sind in ihren Heimatmärkten besonders bekannt, werden hier nach dem ausdrücklich deutschsprachigen Bezugsrahmen eingeordnet. Die geringe Größe von Gruppe 4 folgt aus der bisherigen Auswahl überwiegend bekannter Personen und wird nicht durch künstliches Herabstufen anderer Namen ausgeglichen.

Bekanntheit bleibt unabhängig von der Schwierigkeit einer konkreten Frage. Personen- und Preisfragen behalten leicht, mittel, schwer und experte; Filme leicht, mittel und schwer. Alle Fragen zu einer Person verwenden dieselbe Personengruppe. Variationen desselben Fakts behalten ihre gemeinsame Lernidentität.

## Bestehender Bestand und Einordnung

Vollständige aktuelle Zuordnungen: [220 Personen](Personen.json), [280 Preisfragen](Preistraeger.json). Abgleich mit den tatsächlich vorhandenen öffentlichen Fragenpaketen; keine Änderungen an den Roh-CSV, Fragen-IDs oder Wissenszielen.

| Gruppe | Personen | Schauspielerfragen | Eindeutige Schauspielerziele | Preisfragen | Filmfassungen der Preisfragen |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 Sehr bekannt | 83 | 647 | 646 | 77 | 26 |
| 2 Bekannt | 107 | 878 | 878 | 113 | 53 |
| 3 Für Filmkenner | 25 | 207 | 207 | 61 | 47 |
| 4 Entdeckungen | 5 | 28 | 28 | 29 | 29 |
| Gesamt | 220 | 1.760 | 1.757 | 280 | 155 |

Die Zielzahlen je Gruppe sind nicht vollständig addierbar: Zwei bereits geteilte Wissensziele besitzen Personenvarianten in unterschiedlichen Bekanntheitsgruppen. Insgesamt bleiben es 1.757 verschiedene Personenziele. Bei späterer Auswahl muss die tatsächlich passende Variante berücksichtigt werden; eine andere Gruppenzuordnung erzeugt kein neues Wissensziel.

Preisfragen übernehmen die vorhandene Gruppe der betreffenden Filmfassung aus `src/filmFamiliarity.json`. Alle 280 aktuellen Fragen haben eine eindeutige passende Filmzuordnung; keine offene Zuordnung und keine neue Einstufung anhand der Bekanntheit von Oscar, Cannes oder anderen Veranstaltungen. Verleihungsjahr und Filmjahr bleiben getrennt. Fragen über mehrere Filme oder ohne eindeutigen Filmbezug benötigen bei zukünftigen Ergänzungen eine bewusste Zuordnung; keine automatische Höherstufung wegen eines berühmten Preises.

## Gezielter Ausbau

Zuerst sinnvoll einteilen, anschließend unterbesetzte Gruppen durch geeignete neue Personen ergänzen. Keine Viertelquote durch Verschieben der bestehenden Einordnung und keine Füllfragen, um Mengen zu erreichen. Künstlerische Vielfalt, interessante belegbare Frageziele und die Bekanntheitsgruppe entscheiden gemeinsam über Kandidaten.

Für den vollständigen Ausgleich auf **107 Personen pro Gruppe** wurden folgende Ergänzungen redaktionell abgenommen:

| Gruppe | Fertige neue Personen |
| --- | ---: |
| 1 | 24 |
| 2 | 0 |
| 3 | 82 |
| 4 | 102 |
| Gesamt | 208 |

Die vollständige Erweiterung umfasst **1.664 Personenfragen**, je Person zwei unabhängige Ziele pro Schwierigkeit, gegen vorhandene Film-/Preisziele abgeglichen. 105 Fragen verwenden bestätigte Bestandsziele als Varianten; 1.559 neue Ziele wurden ergänzt. Neue Personen bedeuten deshalb nicht automatisch ebenso viele neue Lernfakten.

Der Ausbau erfolgte in zehn redaktionellen Paketen mit gezielten Ergänzungen in den Gruppen 1, 3 und 4. Der bestehende Bestand enthält 25 Personen mit ausschließlich einer Bilderkennungsfrage. Dieser ausdrücklich beauftragte frühere Erkennungsumfang erzeugt keine nachträgliche automatische Acht-Fragen-Pflicht. Deshalb bedeuten gleich große Personengruppen nur annähernd gleich große Fragenpools; Fragen- und Zielzahlen bleiben zusätzlich sichtbar. Neue vollständige Personenpakete folgen dem aktuellen [Redaktionsvertrag](../Fragenredaktion.md#schauspielerfragen).

## App-Integration

Alle 208 zusätzlichen Personen/1.664 Fragen sind redaktionell abgeschlossen und lokal eingebaut. Viermal 107 Personen, zusammen 428 Personen und 3.424 Schauspielerfragen. Gruppenfilter, serverseitige Auswahl, Freischaltungen und sichtbarer Fortschritt gelten gemeinsam für Film-, Schauspieler- und Preisfragen. Die nächste Gruppe öffnet analog zum bestehenden Filmprinzip ab aufgerundet 50 Prozent der aktuellen leichten Ziele der vorherigen Gruppe. Schwierigkeiten einschließlich Experte bei Personen/Preisen bleiben eine getrennte Achse. [App-Vertrag und Prüfnachweis](App-Integration-2026-10-13.md).

Es wurde keine feste Mischung wie 6/2/2 und keine gleichmäßige Bereichsquote eingeführt. Die ursprüngliche Einordnung des Bestands bleibt dokumentiert; erweitert wurden die unterbesetzten Personengruppen.

## Prüfung

220 eindeutige Personen-IDs mit übereinstimmenden Katalognamen vollständig zugeordnet; keine Mehrfachzuordnung. Alle 1.760 Personenfragen sind abgedeckt. Alle 280 Preisfragen übernehmen exakt die aktuelle Filmgruppe über Originaltitel und Filmjahr; 155 unterschiedliche Filmfassungen. Einteilungen, Mengen und Summen maschinell geprüft; redaktionelle Bekanntheit nicht als empirisch validiert ausgegeben. Der ursprüngliche Einordnungsschritt enthielt keine App-, Speicher- oder API-Änderung; dessen damalige Prüfgrenze bleibt dokumentiert. Die zusätzliche App-Integration erhält eigene zentrale Veröffentlichungschecks. `git diff --check` gehört zum lokalen Abschluss.

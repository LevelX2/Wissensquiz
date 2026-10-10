# Vierte Qualitätsrunde: 100 weitere Filmfragen

Stand: 10.10.2026. **Redaktionell ausgearbeitet und lokal gesichert; noch nicht in die App integriert.** Alle Originale mit tatsächlichem Anzeigezustand bleiben im JSON erhalten. Die vollständigen Alt/Neu-Vergleiche stehen hier; im Gespräch nur ausgewählte starke Verbesserungen und der offene Deutungsfall.

Auswahl aus 12.773 App-Fragen: 25 weitere Filme aus zehn Genres, je vier eigenständige Ziele. Die 50 Filme aus den ersten drei Runden ausgeschlossen. Seed `Qualitaetsrunde-4-100-2026-10-10`, Basiscommit `ba675a8ff8195472cff33472c4d884696af2c8d3`. 25 bisher nicht behandelte Filme, je vier unterschiedliche Wissensziele. Zehn Genres zyklisch. Film je Position mit kleinstem SHA-256(seed|Originaltitel|Jahr); Fragen mit kleinstem SHA-256(seed|Frage-ID), zuerst leicht/mittel/schwer und eine zyklisch gewählte vierte Stufe; falls dort kein weiteres Ziel, nächstes unbenutztes Ziel. 50 Filme der ersten drei Runden ausgeschlossen. Auswahl vor Redaktion, tatsächlicher App-Importer und Anzeigehelfer. Keine repräsentative Qualitätsquote.

## Ergebnis

- 100 Fragen mit allen vier Optionen, Kurzantwort, Vertiefung, Merksatz und angezeigtem Antwortfeedback geprüft.
- 98 Vertiefungen überarbeitet; zwei bewusst im Wortlaut erhalten: Nr. 75 (Muntz in „Oben“) und Nr. 100 (Friseur in „Der große Diktator“).
- 14 Kurzantworten, 27 Frage-/Antwortkompositionen, 31 Merksätze überarbeitet.
- Zwei schwache schwere Besetzungsziele ersetzt: Zoey → Aladeens Begegnung mit angeblich Hingerichteten; Hannah → Hynkels vorübergehende Schonung wegen eines erhofften Kredits. Jeweils neue Frage- und Wissensziel-ID; kein stilles Überschreiben.
- Antwortfeedback in 99 Einträgen bereinigt. Nützliche Zuordnungen und Fassungsunterschiede bleiben; reine Verneinungen entfallen.
- Ein Deutungsfall ausdrücklich begrenzt: genaue Wirkung der Parallelrituale in „The Wailing“. Der beobachtbare Anlass des Ritualabbruchs ist davon unabhängig klar.
- 98 vorhandene Wissensziele weiterverwendet, zwei neue entwickelt. Je Film zwei Inhaltsziele je Stufe sowie Jahres- und Regieziel im Bestand nachgewiesen; Varianten getrennt gezählt. Die vier redigierten Fragen je Film sind keine erneute Vollredaktion aller acht Ziele.

[Originaldaten, Vorschläge, Quellen und Filmabdeckung](Runde-04.json) · [Prüfnachweis](Runde-04-Pruefnachweis.json) · [Nutzerauftrag](../../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Qualitaetsrunde%20100%20Fragen.txt)

## Anwendung der bestehenden Skillregeln

Die Texte erzählen den für die jeweilige Frage nützlichen Ausschnitt: ein Ermittlungsschritt, eine Täuschung, eine Beziehung, eine Entscheidung oder deren Folgen. Andere Vertiefungen erschließen passende Besonderheiten wie die Autorenpaare in „Parade im Rampenlicht“, Waititis Romanadaption oder das echte Geschwisterpaar in „Donnie Darko“. Nach jeweils vier Fragen zum selben Film wurde auf Dopplungen und ähnliche Verläufe gelesen. Allgemeine Schlusssätze wurden gestrichen, wenn die konkreten Vorgänge bereits für sich sprechen.

Keine zusätzliche Skill-Verankerung aus dieser Runde: Die vorhandenen Regeln decken diese Befunde bereits ab. Keine feste Satzanzahl, keine Handlungsquote und kein obligatorisches Spezialwissen ableiten. Gut heißt hier passend und geprüft, nicht unverbesserlich. Die Auswahl ist keine repräsentative Fehlerquote für den Gesamtkatalog.

## Quellen und Prüfgrenzen

Gelesene Handlungs- und Besetzungsartikel; ergänzend AFI, Library of Congress, New Zealand Film Commission, offizielle Harry-Potter-Faktseiten und Chaplins offizielle Synopsis. Konkrete Belegreichweite pro Film dokumentiert. Keine vollständige neue Filmsichtung. Viele Handlungsdetails nur sekundär geprüft. Primärseiten und Institutionsseiten nur für die dort tatsächlich bestätigten Aussagen. Keine offenen Interpretationen als einzig richtige Tatsachenlösung verwendet.

Vollständiger importierter Bestand (12.773 Fragen) verfügbar. Für alle 25 Filme die unabhängigen Inhaltsziele anhand von Frage und learning_objective abgeglichen. Neue Ziele zusätzlich katalogweit nach Nadal/Hingerichteten/Exil und Hynkel/Kredit/Schonung durchsucht; kein gleiches Filmziel gefunden. Keine Behauptung eines vollständig redigierten übrigen Katalogs.

Strukturprüfungen bestätigen Anzahl, erhaltene Originale, IDs, vier verschiedene Optionen, einen Lösungsschlüssel, Quellenzuordnung, Stufenabdeckung und lokale Links. Sie beweisen weder historische Tatsachen noch filmische Deutungen. Kein App-Code und kein importiertes Fragenpaket geändert; deshalb keine neuen App-Tests nötig.

## Filmabdeckung und gemeinsame Textprüfung

| Film | Inhaltsziele im Bestand L/M/S | Jahr/Regie | Überprüfte Ziele weiterverwendet / neu | Varianten im Film-Inhaltsbestand |
| --- | --- | --- | --- | --- |
| Donnie Darko (2001) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 1 |
| James Bond 007 – Der Spion, der mich liebte (1977) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Dracula (1931) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Harry Potter und der Orden des Phönix (2007) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Midnight Run – Fünf Tage bis Mitternacht (1988) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Der Mann aus Laramie (1955) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Alles über Eva (1950) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 3 |
| Parade im Rampenlicht (1933) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Wo die wilden Menschen jagen (2016) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Redbelt (2008) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Westworld (1973) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Rambo (1982) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Die Stunde, wenn Dracula kommt (1960) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Aladdin (1992) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Der Diktator (2012) | 2 / 2 / 2 | 1 / 1 | 3 / 1 | 1 |
| Um Kopf und Kragen (1957) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| City of God (2002) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Absolute Beginners (1986) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Oben (2009) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Das Schwert der gelben Tigerin (1966) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Die Weite der Nacht (2019) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Universal Soldier (1992) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| The Wailing (2016) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Harry Potter und der Feuerkelch (2005) | 2 / 2 / 2 | 1 / 1 | 4 / 0 | 0 |
| Der große Diktator (1940) | 2 / 2 / 2 | 1 / 1 | 3 / 1 | 1 |

Die Jahres-/Regieziele sind vorhandene Fragen, nicht nur Metadaten. Ihre IDs und alle sechs Inhaltsziel-IDs je Film stehen im JSON. Bei „Der Diktator“ und „Der große Diktator“ ersetzt der Entwurf jeweils ein schweres Ziel durch ein neues schweres Ziel; beide Abdeckungsstände sind getrennt ausgewiesen. Unveränderte Varianten sind keine zusätzlich redigierten Fragen.

**Donnie Darko:** Erscheinung, auslösendes Ereignis, Wissensquelle und Besetzung ergänzen sich. Die Zeitreise bleibt als gezeigter Handlungsbogen beschrieben; keine verbindliche Theorie aus einer bestimmten Schnittfassung.

**James Bond 007 – Der Spion, der mich liebte:** Ermittlungsanlass, Beziehungskonflikt, technische Gegenmaßnahme und Ziel des Gegners sind verschiedene Zugänge. Die gegenseitige Zerstörung wird von einem Beschuss des jeweils eigenen Boots unterschieden.

**Dracula:** Geschäftsreise, Schutzmittel, Tod des Dieners und Lockmittel erhalten getrennte Szenen. Kein Transfer aus der spanischsprachigen Parallelproduktion oder aus anderen Dracula-Fassungen.

**Harry Potter und der Orden des Phönix:** Lerngruppe, körperliche Strafe, Täuschung und institutionelle Machtübernahme erschließen den politischen Konflikt aus verschiedenen Handlungen. Kein Buchdetail als sichere Filmszene eingeführt.

**Midnight Run – Fünf Tage bis Mitternacht:** Auftrag, falsche Behördenidentität, letzte Entscheidung und Reisehindernis ergänzen sich. Die Reihenfolge von Freiheit und Geschenk verhindert eine falsche Bestechungsdeutung. Ein nicht sicher bestätigtes Schlussgeständnis zur Flugangst entfällt.

**Der Mann aus Laramie:** Die alten Laramie-Vertiefungen wiederholten überwiegend ihre Kurzantwort. Nun sind Suchmotiv, Vics Interessen, Buchhaltungsspur und Ende getrennte Abschnitte derselben Ermittlung.

**Alles über Eva:** Eves Zugang, Karens Verstrickung, Addisons Erpressung und Margos Entscheidung bilden unterschiedliche Figurenlinien. Der zusätzliche Besetzungsbezug bleibt bei Margos Entwicklung, statt dieselbe Fan-Geschichte nochmals zu erzählen.

**Parade im Rampenlicht:** Geschäftsmodell, Probenkonflikt, getrennte Songcredits und Bühnenvorgeschichte variieren auch die Wissensart. Produktionswissen wird nur dort ergänzt, wo es genau die gesuchte Nummer beziehungsweise den Auftritt erklärt.

**Wo die wilden Menschen jagen:** Familienausgangslage, Beginn der Fahndung, spätere Ortung und Romanadaption greifen verschiedene Phasen auf. Der Vorlagentext enthält Produktionsentwicklung, die anderen drei Handlungsentwicklung.

**Redbelt:** Unterricht, Übungsregel, Anerkennung und Wettkampfskepsis bleiben eigenständig. Insbesondere Professor und Morisaki nicht zu einem Verleiher verschmelzen; keine realen Gürtelrangregeln aus der Filmhandlung ableiten.

**Westworld:** Verfolger, Sicherheitsmechanismus, vermeintliche Rettung und Kontrollzentrum zeigen verschiedene Teile des Parks. Keine unbelegte technische Spezifikation zur Sensorik ergänzen.

**Rambo:** Verlust vor der Handlung, örtliche Eskalation, konkrete Traumaauslösung und Zusammenbruch am Ende bleiben unterscheidbar. Nur Ende der Kinofassung behauptet, keine Details eines alternativen Endes.

**Die Stunde, wenn Dracula kommt:** Hinrichtung, Wiederbelebung, Täuschung und Verwandtschaft erhalten unterschiedliche Ausschnitte. Die Doppelbesetzung erklärt die Ähnlichkeit; daraus keine abschließende Aussage über sämtliche metaphysischen Reinkarnationsdeutungen ableiten.

**Aladdin:** Begegnung, Wunschtrick, Befreiung/Eherecht und Höhleneinsturz greifen verschiedene Ursachen auf. Originalstimmen sind als solche bezeichnet. Nicht mit der Realverfilmung aus Runde 3 vermischen.

**Der Diktator:** Doppelrolle, Reise/Entmachtung, unerwartet lebende Verurteilte und Sprachgag ergänzen sich. Die schwache schwere Zoey-Besetzungsfrage wird durch ein neues schweres Handlungsziel ersetzt; keine neue Identität unter alter ID.

**Um Kopf und Kragen:** Zufällige Geiselnahme, Verrat des Ehemanns, taktische Gegenwehr und Herkunft des Lösegelds ergänzen sich. Die Texte erklären jeweils den benötigten Abschnitt, nicht viermal den ganzen Überfall.

**City of God:** Ort/Erzählperspektive, verlorener Ausstieg, Veröffentlichungsauswahl und früher Mord zeigen unterschiedliche Verbindungen. Konkrete Fotos ersetzen die pauschale Deutung von Verantwortung.

**Absolute Beginners:** Modekarriere, Werbung, historischer Konflikt und gescheiterte Enthüllung erschließen das Milieu. Historische Einordnung ausdrücklich vom fiktionalen Ablauf unterschieden; keine neue Behauptung über tatsächliche einzelne Täter.

**Oben:** Aufbruch, Wendepunkt, Gegenfigur und Beziehung zu Russell greifen ineinander, ohne identische Schlüsse. Muntz-Vertiefung bleibt im Wortlaut: bereits verständlicher Zusammenhang, kein Bedarf für Verlängerung.

**Das Schwert der gelben Tigerin:** Rettungsauftrag, feindlicher Stützpunkt, gesungene Schriftzeichenhilfe und Verwundung tragen unterschiedliche Wissensanteile. Frühere Verbindung ist keine erfundene biologische Verwandtschaft.

**Die Weite der Nacht:** Öffentliche Zeugensuche, Archivspur, körperliche Tonwirkung und offenes Ende bleiben verschiedene Abschnitte. Nicht aus dem Verschwinden einen vollständig gezeigten Transport oder eine erklärte Reise machen.

**Universal Soldier:** Entstehung, Körpergrenze, Scotts Erinnerung und Veronicas Funktion variieren Perspektive und Erklärung. Gregors Mechanismus ist Filmfiktion, kein medizinischer Befund.

**The Wailing:** Familienkrise, verdachtsverstärkender Fund, missachtete Bedingung und väterlicher Ritualabbruch sind konkret. Unsicherheit bleibt auf Ritualdeutung begrenzt und macht die beobachtbare Abbruchmotivation nicht unklar.

**Harry Potter und der Feuerkelch:** Turnier, Buch/Film-Abweichung, scheinbare Hilfe des Lehrers und Ziel am Friedhof verknüpfen den Entführungsplan. „Warum lebend“ auf den belegbaren Verwendungszweck verengt.

**Der große Diktator:** Doppelbesetzung, Requisit, finanzielle Motive der vorübergehenden Schonung und Beruf/Verwechslung unterscheiden sich. Die schwache schwere Hannah-Besetzungsfrage erhält ein neues Handlungsziel. Die vorhandene konkrete Berufsvertiefung bleibt; die Kurzantwort wird auf den erfragten Beruf zugespitzt.

## Einzelprüfung

A–D entsprechen der Originalreihenfolge; die App kann Antworten mischen. „Neu“ bezeichnet den redaktionellen Vorschlag. Bei unverändertem Text wird das ausdrücklich benannt.

### 1. Donnie Darko (2001)

Frage-ID: `SF-202609-P02-L-096` · Wissensziel: `K-SF-202609-P02-L-096` · Science-Fiction · leicht.

**Originalfrage:** „Donnie Darko“ (2001): In welcher Gestalt erscheint Frank (James Duval)?

- **A:** Als weißer Astronaut
- **B:** Als brennender Vogel
- **C:** In einer Ritterrüstung
- **D:** In einem unheimlichen Hasenkostüm **✓ richtig**

**Kurzantwort bisher:** Frank erscheint in einem unheimlichen Hasenkostüm.

**Vertiefung bisher (angezeigt):** Frank (James Duval) verbindet die vertraute Form eines Kostüms mit einer starren, bedrohlichen Maske. Donnie Darko (Jake Gyllenhaal) begegnet dadurch keinem eindeutig alltäglichen Gesprächspartner. Die Gestaltung arbeitet gerade mit dieser Mehrdeutigkeit: Ein verkleideter Mensch ist denkbar, aber sein Auftreten passt nicht in eine gewöhnliche Begegnung. Der Film lässt die visuelle Fremdheit lange wirksam bleiben, bevor spätere Ereignisse neue Beziehungen erkennen lassen.

**Merksatz bisher:** Das Hasenkostüm macht Frank vertraut und unheimlich zugleich.

**Urteil:** Überarbeiten. Die ursprüngliche Maskenbeschreibung blieb bei Mehrdeutigkeit stehen. Die Verbindung zum späteren Kostümträger macht das Bild erinnerbar, ohne eine abschließende Zeitreisetheorie zu behaupten.

**Wissensziel beibehalten:** Franks Erscheinung erkennen

**Neue vollständige Komposition:** „Donnie Darko“ (2001): In welcher Gestalt erscheint Frank (James Duval)?

- **A:** In einem Totenkopfkostüm
- **B:** Mit einer Clownsmaske
- **C:** In einem Vogelkostüm
- **D:** In einem unheimlichen Hasenkostüm **✓ richtig**

**Kurzantwort beibehalten:** Frank erscheint in einem unheimlichen Hasenkostüm.

**Vertiefung neu:** Die Hasengestalt lockt Donnie (Jake Gyllenhaal) nachts aus dem Haus und kündigt das Ende der Welt an. Später trägt auch der junge Autofahrer Frank (James Duval) dieses Kostüm, als er Gretchen (Jena Malone) überfährt. Das unheimliche Bild gehört damit zugleich zu Donnies Visionen und zu einem konkreten Menschen im Verlauf der Halloween-Nacht.

**Merksatz neu:** Frank trägt ein Hasenkostüm – auch in der Halloween-Nacht.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** D: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: Kostüm/Autofahrer Frank, Triebwerk und Rückkehr zur Unglücksnacht, Monnitoff und Sparrow, tatsächliches Geschwisterpaar Gyllenhaal.

[Beleg 1](https://en.wikipedia.org/wiki/Donnie_Darko).

### 2. Donnie Darko (2001)

Frage-ID: `SF-202609-P02-M-095` · Wissensziel: `K-SF-202609-P02-M-095` · Science-Fiction · mittel.

**Originalfrage:** „Donnie Darko“ (2001): Welcher Gegenstand stürzt in Donnies (Jake Gyllenhaal) Schlafzimmer?

- **A:** Ein Satellitenpanel
- **B:** Ein Wassertank
- **C:** Ein Flugzeugtriebwerk **✓ richtig**
- **D:** Eine Kirchenglocke

**Kurzantwort bisher:** Ein Flugzeugtriebwerk stürzt in Donnies Zimmer.

**Vertiefung bisher (angezeigt):** Donnie Darko (Jake Gyllenhaal) ist während des Einschlags nicht im Bett. Das zerstörte Zimmer macht eine gerade vermiedene Möglichkeit sichtbar, ohne ihre Ursache sofort zu erklären. Ein großes technisches Objekt liegt im privaten Familienraum und passt nicht zur verfügbaren Geschichte seiner Herkunft. Der Film setzt damit ein konkretes materielles Rätsel neben die subjektiven Erfahrungen des Jugendlichen, statt alles nur auf dessen Wahrnehmung zu begrenzen.

**Merksatz bisher:** Das Triebwerk ist ein greifbares Rätsel im Schlafzimmer.

**Urteil:** Überarbeiten. Statt lediglich ein objektives Rätsel zu behaupten, erzählt die Vertiefung den Bogen zwischen Anfang und Ende. Die Kurzantwort benennt den Gegenstand bereits genau.

**Wissensziel beibehalten:** Das Triebwerk als auslösendes Ereignis einordnen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Ein Flugzeugtriebwerk stürzt in Donnies Zimmer.

**Vertiefung neu:** Donnie (Jake Gyllenhaal) überlebt nur, weil Frank (James Duval) ihn zuvor nach draußen gelockt hat. Die Herkunft des Triebwerks bleibt zunächst ungeklärt. Erst gegen Ende sieht Donnie, wie ein Flugzeug in einen Wirbel gerät und ein Triebwerk verliert; die Handlung kehrt zur Unglücksnacht zurück. Diesmal bleibt er im Bett.

**Merksatz neu:** Das Flugzeugtriebwerk stürzt in Donnies Schlafzimmer.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** C: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: Kostüm/Autofahrer Frank, Triebwerk und Rückkehr zur Unglücksnacht, Monnitoff und Sparrow, tatsächliches Geschwisterpaar Gyllenhaal.

[Beleg 1](https://en.wikipedia.org/wiki/Donnie_Darko).

### 3. Donnie Darko (2001)

Frage-ID: `SF-202609-P02-S-095` · Wissensziel: `K-SF-202609-P02-S-095` · Science-Fiction · schwer.

**Originalfrage:** „Donnie Darko“ (2001): Wie heißt das Buch, das Donnie (Jake Gyllenhaal) zur Erklärung der Vorgänge erhält?

- **A:** Die Mechanik des Träumens
- **B:** Die Geometrie der Erinnerung
- **C:** Die Philosophie des Zeitreisens **✓ richtig**
- **D:** Die Anatomie der Zukunft

**Kurzantwort bisher:** Das Buch heißt Die Philosophie des Zeitreisens.

**Vertiefung bisher (angezeigt):** Roberta Sparrow (Patience Cleveland) ist die Verfasserin des Buchs, das Donnie Darko (Jake Gyllenhaal) als Erklärungshilfe erhält. Die zurückgezogen lebende Frau ist dadurch mit dem rätselhaften Geschehen verbunden, lange bevor Donnie diese Verbindung versteht. Im Director’s Cut werden Auszüge stärker in die Erzählung eingebaut. Die Kinofassung lässt mehr Zusammenhänge offen und lenkt den Blick stärker auf Donnies Erleben als auf ein ausformuliertes Regelwerk.

**Merksatz bisher:** Sparrows Buch bietet ein Modell, keine einfache Universalantwort.

**Urteil:** Überarbeiten. Buchtitel und Optionen sind eindeutig. Die konkrete Weitergabe ist für diese Frage ergiebiger als ein allgemeiner Vergleich der Filmfassungen.

**Wissensziel beibehalten:** Das Zeitreisebuch und seine Herkunft kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Das Buch heißt Die Philosophie des Zeitreisens.

**Vertiefung neu:** Donnie (Jake Gyllenhaal) bekommt das Buch von seinem Naturwissenschaftslehrer Monnitoff (Noah Wyle). Verfasst hat es Roberta Sparrow (Patience Cleveland), die früher selbst unterrichtete und im Ort als „Grandma Death“ bekannt ist. Aus einer scheinbaren Außenseiterin wird so eine mögliche Wissensquelle für das, was Donnie erlebt.

**Merksatz neu:** Roberta Sparrow schrieb „Die Philosophie des Zeitreisens“.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** C: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: Kostüm/Autofahrer Frank, Triebwerk und Rückkehr zur Unglücksnacht, Monnitoff und Sparrow, tatsächliches Geschwisterpaar Gyllenhaal.

[Beleg 1](https://en.wikipedia.org/wiki/Donnie_Darko).

### 4. Donnie Darko (2001)

Frage-ID: `SF-202609-P02-L-095` · Wissensziel: `K-SF-202609-P02-L-095` · Science-Fiction · leicht.

**Originalfrage:** „Donnie Darko“ (2001): Wer spielt Donnie Darko?

- **A:** Elijah Wood
- **B:** Tobey Maguire
- **C:** Jake Gyllenhaal **✓ richtig**
- **D:** Jared Leto

**Kurzantwort bisher:** Jake Gyllenhaal spielt Donnie Darko.

**Vertiefung bisher (angezeigt):** Jake Gyllenhaal verbindet Donnies scharfen Witz mit Rückzug und Verunsicherung. Später wurde er etwa durch „Brokeback Mountain“, „Zodiac“ und „Nightcrawler“ bekannt. In dieser frühen Hauptrolle muss er widersprüchliche Eindrücke nebeneinander tragen: Der Jugendliche kann verletzlich, provokant und aufmerksam wirken, ohne dass der Film jede seiner Wahrnehmungen eindeutig bestätigt. Die Darstellung ist deshalb zentral für die Schwebe zwischen subjektiver Krise und ungewöhnlichem Geschehen.

**Merksatz bisher:** Gyllenhaals Donnie bleibt verletzlich und schwer einzuordnen.

**Urteil:** Überarbeiten. Die gesuchte Besetzung bleibt verborgen. Ein passender Castingbezug ersetzt die austauschbare Filmografie und die allgemeine Beschreibung jugendlicher Unruhe.

**Wissensziel beibehalten:** Jake Gyllenhaal der Hauptrolle zuordnen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Jake Gyllenhaal spielt Donnie Darko.

**Vertiefung neu:** Jake Gyllenhaal spielt den Jugendlichen, dessen nächtliche Begegnungen mit Frank (James Duval) den Alltag der Familie durchbrechen. Seine Filmschwester Elizabeth wird von Maggie Gyllenhaal gespielt, die auch im wirklichen Leben seine ältere Schwester ist. Der Film besetzt die Geschwisterbeziehung also mit einem tatsächlichen Geschwisterpaar.

**Merksatz neu:** Donnie: Jake Gyllenhaal; Elizabeth: seine Schwester Maggie.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** C: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: Kostüm/Autofahrer Frank, Triebwerk und Rückkehr zur Unglücksnacht, Monnitoff und Sparrow, tatsächliches Geschwisterpaar Gyllenhaal.

[Beleg 1](https://en.wikipedia.org/wiki/Donnie_Darko).

### 5. James Bond 007 – Der Spion, der mich liebte (1977)

Frage-ID: `G100-20261008-ACTION-010-L1` · Wissensziel: `K-G100-20261008-ACTION-010-L1` · Action · leicht.

**Originalfrage:** Welches rätselhafte Ereignis bringt Bond (Roger Moore) und die sowjetische Seite in „James Bond 007 – Der Spion, der mich liebte“ auf dieselbe Spur?

- **A:** Der Diebstahl britischer und sowjetischer Satellitencodes
- **B:** Das Verschwinden zweier Geheimdienstchefs
- **C:** Das Verschwinden britischer und sowjetischer Atom-U-Boote **✓ richtig**
- **D:** Der Überfall auf zwei gemeinsame Waffenlager

**Kurzantwort bisher:** Zwei verschwundene Atom-U-Boote führen die rivalisierenden Dienste zusammen.

**Vertiefung bisher (angezeigt):** Bond (Roger Moore) untersucht zunächst den Verlust eines britischen U-Boots. Anya Amasova (Barbara Bach) verfolgt einen ähnlichen Fall für die sowjetische Seite. Beide suchen ein System, das die normalerweise schwer auffindbaren Boote orten kann. Aus konkurrierenden Ermittlungen entsteht eine gemeinsame Aufgabe, weil die Bedrohung beide Staaten trifft und ihre bisherigen Feindbilder dafür nicht ausreichen.

**Merksatz bisher:** Eine gemeinsame U-Boot-Bedrohung verbindet die Gegenspieler des Kalten Kriegs.

**Urteil:** Überarbeiten. Das gemeinsame Problem und der Weg von Konkurrenz zu Kooperation werden konkret. Die bestehenden vier Ereignisse sind als Optionen brauchbar.

**Wissensziel beibehalten:** Den gemeinsamen Ermittlungsanlass der Geheimdienste verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Zwei verschwundene Atom-U-Boote führen die rivalisierenden Dienste zusammen.

**Vertiefung neu:** Ein britisches und ein sowjetisches Atom-U-Boot verschwinden. Bond (Roger Moore) und Anya Amasova (Barbara Bach) suchen zunächst getrennt nach Plänen eines Ortungssystems, die in Ägypten verkauft werden sollen. Erst die Zusammenarbeit ihrer Vorgesetzten macht aus den konkurrierenden Agenten ein Team. Hinter den Vermisstenfällen steckt ein Tanker, der ganze U-Boote aufnehmen kann.

**Merksatz beibehalten:** Eine gemeinsame U-Boot-Bedrohung verbindet die Gegenspieler des Kalten Kriegs.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Satellitencodes sind hier nicht der gemeinsame Ermittlungsanlass. · B: Die Geheimdienstchefs sind nicht die Vermissten. · C: Die verschwundenen U-Boote lösen die Ermittlungen beider Seiten aus. · D: Zwei überfallene Waffenlager bilden nicht die Ausgangslage.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: verschwundene britische/sowjetische U-Boote, Barsovs Tod beim Skikampf, Kooperation, geänderte Zielkoordinaten und Strombergs Atlantis-Plan.

[Beleg 1](https://en.wikipedia.org/wiki/The_Spy_Who_Loved_Me_(film)).

### 6. James Bond 007 – Der Spion, der mich liebte (1977)

Frage-ID: `G100-20261008-ACTION-010-M1` · Wissensziel: `K-G100-20261008-ACTION-010-M1` · Action · mittel.

**Originalfrage:** Warum kündigt Anya Amasova (Barbara Bach) in „James Bond 007 – Der Spion, der mich liebte“ an, Bond (Roger Moore) nach der Mission zu töten?

- **A:** Er hat ihren Geliebten bei der Skiverfolgung erschossen. **✓ richtig**
- **B:** Er hat ihre Identität an den britischen Dienst verraten.
- **C:** Er hat ihren Vorgesetzten in eine tödliche Falle gelockt.
- **D:** Er hat ihren gemeinsamen Auftrag eigenmächtig abgebrochen.

**Kurzantwort bisher:** Anya erkennt, dass Bond ihren Geliebten getötet hat.

**Vertiefung bisher (angezeigt):** Sergei Barsov (Michael Billington) verfolgt Bond (Roger Moore) in der Eröffnung auf Skiern und wird von ihm getötet. Erst später erfährt Anya Amasova (Barbara Bach), wer dafür verantwortlich war. Ihr Rachewunsch entsteht damit aus einem Ereignis, das das Publikum schon kennt. Die nötige Zusammenarbeit wird zur persönlichen Belastungsprobe, deren Auflösung bis nach der gemeinsamen Mission verschoben bleibt.

**Merksatz bisher:** Der frühere Skikampf bedroht die spätere Agentenpartnerschaft.

**Urteil:** Überarbeiten. Die alte Erklärung war richtig, aber die Reihenfolge macht den Konflikt erst verständlich. Keine neue Behauptung über ein einzelnes verräterisches Requisit ergänzen.

**Wissensziel beibehalten:** Anyas persönliche Racheabsicht begründen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Anya erkennt, dass Bond ihren Geliebten getötet hat.

**Vertiefung neu:** Den sowjetischen Agenten Sergei Barsov (Michael Billington) tötet Bond (Roger Moore) bereits bei der Skiverfolgung am Anfang. Als Anya (Barbara Bach) später erfährt, dass Bond ihren Geliebten erschossen hat, arbeiten die beiden längst zusammen. Sie verschiebt ihre Rache bis nach dem Auftrag; die Partnerschaft bleibt dadurch von einer ausgesprochenen Todesdrohung begleitet.

**Merksatz beibehalten:** Der frühere Skikampf bedroht die spätere Agentenpartnerschaft.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Der getötete Verfolger war Anyas Geliebter Sergei Barsov. · B: Ein Verrat ihrer Identität ist nicht der Grund für ihre Drohung. · C: Ihr Vorgesetzter stirbt nicht in einer solchen Falle. · D: Ein abgebrochener Auftrag erklärt ihre persönliche Rache nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: verschwundene britische/sowjetische U-Boote, Barsovs Tod beim Skikampf, Kooperation, geänderte Zielkoordinaten und Strombergs Atlantis-Plan.

[Beleg 1](https://en.wikipedia.org/wiki/The_Spy_Who_Loved_Me_(film)).

### 7. James Bond 007 – Der Spion, der mich liebte (1977)

Frage-ID: `G100-20261008-ACTION-010-S1` · Wissensziel: `K-G100-20261008-ACTION-010-S1` · Action · schwer.

**Originalfrage:** Wie verhindert Bond (Roger Moore) in „James Bond 007 – Der Spion, der mich liebte“ die vorgesehenen Atomangriffe der bereits ausgelaufenen U-Boote?

- **A:** Er lässt beide Boote mit gefälschten Hafenbefehlen zurückkehren.
- **B:** Er überträgt einen Abschaltcode an ihre Raketensteuerungen.
- **C:** Er ändert die Zielkoordinaten, sodass die Boote einander zerstören. **✓ richtig**
- **D:** Er lenkt beide Boote in eine vorbereitete Minensperre.

**Kurzantwort bisher:** Die umprogrammierten Raketen treffen die beiden U-Boote selbst.

**Vertiefung bisher (angezeigt):** Nach dem Kampf im Tanker erreicht Bond (Roger Moore) den Kontrollraum, doch die eroberten Boote sind bereits zur Durchführung des Angriffs unterwegs. Er kann die Katastrophe nicht durch eine bloße Festnahme des Gegners verhindern. Stattdessen verändert er die Zielkoordinaten. Die Angriffswaffen werden dadurch gegeneinander gerichtet, bevor die vorgesehenen Städte getroffen werden können; die militärische Bedrohung wird technisch umgekehrt.

**Merksatz bisher:** Bond richtet den vorbereiteten Angriff gegen dessen Träger.

**Urteil:** Überarbeiten. „Sie treffen sich selbst“ war missverständlich: Nicht jedes Boot beschießt sich selbst. Kurzantwort und richtige Option benennen nun die gegenseitige Zerstörung.

**Wissensziel beibehalten:** Die Umleitung der Atomraketen verstehen

**Neue vollständige Komposition:** Wie verhindert Bond (Roger Moore) in „James Bond 007 – Der Spion, der mich liebte“ die vorgesehenen Atomangriffe der bereits ausgelaufenen U-Boote?

- **A:** Er lässt beide Boote mit gefälschten Hafenbefehlen zurückkehren.
- **B:** Er überträgt einen Abschaltcode an ihre Raketensteuerungen.
- **C:** Er ändert die Zielkoordinaten, sodass die U-Boote einander treffen. **✓ richtig**
- **D:** Er lenkt beide Boote in eine vorbereitete Minensperre.

**Kurzantwort neu:** Bond ändert die Zielkoordinaten so, dass die beiden U-Boote einander zerstören.

**Vertiefung neu:** Nach der Befreiung der Besatzungen erobert Bond (Roger Moore) den Kontrollraum des Tankers. Die beiden entführten U-Boote sind aber bereits für den Raketenstart vorbereitet. Er ersetzt die Ziele New York und Moskau durch die Positionen der jeweils anderen Boote. Die Angriffswaffen treffen dadurch Strombergs eigene Einheiten.

**Merksatz neu:** Bond lässt die beiden U-Boote einander als Ziel ansteuern.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Die Besatzungen kehren nicht aufgrund fingierter Hafenbefehle zurück. · B: Ein zentraler Abschaltcode löst den Konflikt nicht. · C: Die neuen Koordinaten machen die beiden Boote selbst zu den Zielen. · D: Eine Minensperre stoppt die beiden Boote nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: verschwundene britische/sowjetische U-Boote, Barsovs Tod beim Skikampf, Kooperation, geänderte Zielkoordinaten und Strombergs Atlantis-Plan.

[Beleg 1](https://en.wikipedia.org/wiki/The_Spy_Who_Loved_Me_(film)).

### 8. James Bond 007 – Der Spion, der mich liebte (1977)

Frage-ID: `G100-20261008-ACTION-010-M2` · Wissensziel: `K-G100-20261008-ACTION-010-M2` · Action · mittel.

**Originalfrage:** Was soll der von Stromberg (Curd Jürgens) geplante Angriff in „James Bond 007 – Der Spion, der mich liebte“ bewirken?

- **A:** Ein begrenzter Angriff soll den Verkauf seiner Ortungstechnik erzwingen.
- **B:** Ein Atomkrieg soll den Weg für seine Unterwasserzivilisation freimachen. **✓ richtig**
- **C:** Eine Hafenblockade soll ihn zum Monopolisten im Seehandel machen.
- **D:** Eine fingierte Havarie soll neue staatliche Forschungsaufträge sichern.

**Kurzantwort bisher:** Stromberg will einen Weltkrieg auslösen und unter Wasser überleben.

**Vertiefung bisher (angezeigt):** Karl Stromberg (Curd Jürgens) verbindet die entführten U-Boote mit seiner abgeschlossenen Unterwasserbasis. Die geplanten Angriffe auf New York und Moskau sollen einen globalen Krieg auslösen. Sein Rückzugsort ist deshalb mehr als ein luxuriöses Versteck: Er soll zum Ausgangspunkt einer neuen Zivilisation werden. Bond (Roger Moore) muss die Abschüsse verhindern, bevor eine technische Entführung zur weltweiten Vernichtung führt.

**Merksatz bisher:** Die Unterwasserbasis ist Teil eines Plans gegen die ganze Oberfläche.

**Urteil:** Überarbeiten. Die Ausgangsfassung enthält die richtigen konkreten Ziele. Der neue Text bündelt sie und verzichtet auf den zusätzlichen abstrakten Schlusssatz.

**Wissensziel beibehalten:** Strombergs Vernichtungsplan und sein eigenes Überleben verbinden

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Stromberg will einen Weltkrieg auslösen und unter Wasser überleben.

**Vertiefung neu:** Stromberg (Curd Jürgens) will mit den gekaperten U-Booten New York und Moskau atomar angreifen. Die gegenseitigen Beschuldigungen der Großmächte sollen einen weltweiten Atomkrieg auslösen. Er selbst will in seiner Unterwasserbasis Atlantis überleben und anschließend eine neue Zivilisation im Meer aufbauen.

**Merksatz neu:** Atomkrieg an Land, Strombergs Neubeginn unter Wasser.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Der Plan beschränkt sich nicht auf erpresste Technikverkäufe. · B: Stromberg will die Oberfläche zerstören und unter Wasser neu beginnen. · C: Sein Ziel geht weit über ein Seehandelsmonopol hinaus. · D: Forschungsaufträge sind nicht der Zweck des geplanten Atomangriffs.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: verschwundene britische/sowjetische U-Boote, Barsovs Tod beim Skikampf, Kooperation, geänderte Zielkoordinaten und Strombergs Atlantis-Plan.

[Beleg 1](https://en.wikipedia.org/wiki/The_Spy_Who_Loved_Me_(film)).

### 9. Dracula (1931)

Frage-ID: `G100-20261008-HORROR-002-L1` · Wissensziel: `K-G100-20261008-HORROR-002-L1` · Horror · leicht.

**Originalfrage:** Welches Geschäft führt Renfield (Dwight Frye) in der englischen Fassung von „Dracula“ zum Grafen?

- **A:** Der Kauf eines Londoner Stadthauses
- **B:** Die Verwaltung eines englischen Landsitzes
- **C:** Die Pacht von Carfax Abbey **✓ richtig**
- **D:** Die Vermietung einer Wohnung in London

**Kurzantwort bisher:** Renfields Auftrag betrifft die Pacht von Carfax Abbey in England.

**Vertiefung bisher (angezeigt):** Renfield (Dwight Frye) kommt zunächst als geschäftlicher Besucher zu Dracula (Bela Lugosi). Er soll die Pacht von Carfax Abbey in England regeln. Die Reise ist deshalb kein freiwilliger Besuch bei einem bekannten Vampir. Das gewöhnliche Immobiliengeschäft schafft den Kontakt, aus dem seine Abhängigkeit entsteht. In dieser Fassung übernimmt Renfield die Schlossreise, während John Harker (David Manners) später in England zur Handlung gehört.

**Merksatz bisher:** Eine Immobilienpacht führt Renfield zum Grafen.

**Urteil:** Überarbeiten. Vertrag und spätere Lage der Abtei ergänzen einander. Die Verwechslung mit einem Kauf wird durch die präzise Kurzantwort vermieden.

**Wissensziel beibehalten:** Renfields Geschäftsreise und Carfax Abbey zuordnen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Renfields Auftrag betrifft die Pacht von Carfax Abbey in England.

**Vertiefung neu:** Renfield (Dwight Frye) reist als Geschäftsmann nach Transsilvanien, um für Dracula (Bela Lugosi) Carfax Abbey zu pachten. Die englische Abtei liegt neben Dr. Sewards Anwesen und wird später Draculas Rückzugsort. Der zunächst gewöhnliche Immobilienauftrag bereitet damit den Ortswechsel des Vampirs nach England vor.

**Merksatz beibehalten:** Eine Immobilienpacht führt Renfield zum Grafen.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Ein Stadthauskauf ist nicht der Auftrag. · B: Er soll keinen englischen Landsitz verwalten. · C: Renfield wickelt die Pacht von Carfax Abbey ab. · D: Eine Londoner Wohnung ist nicht Gegenstand des Vertrags.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Englischsprachiger Film von 1931: Carfax-Pacht, Lage bei Seward, Wolfsbann und Entfernung, Renfields Tod, Versprechen von Ratten. Handlung und Hauptbesetzung zusätzlich AFI; den strittigen Darstellercredit der Pflegerin nicht übernommen.

[Beleg 1](https://en.wikipedia.org/wiki/Dracula_(1931_English-language_film)) · [Beleg 2](https://catalog.afi.com/Film/7690-DRACULA).

### 10. Dracula (1931)

Frage-ID: `G100-20261008-HORROR-002-M2` · Wissensziel: `K-G100-20261008-HORROR-002-M2` · Horror · mittel.

**Originalfrage:** Welchen pflanzlichen Schutz trägt Mina (Helen Chandler) in der englischen Fassung von „Dracula“?

- **A:** Knoblauch
- **B:** Wolfsbann **✓ richtig**
- **C:** Mistel
- **D:** Lorbeer

**Kurzantwort bisher:** Mina wird mit Wolfsbann geschützt.

**Vertiefung bisher (angezeigt):** Van Helsing (Edward Van Sloan) lässt Mina (Helen Chandler) beim Schlafen durch Wolfsbann schützen. Der Schutz funktioniert nur, solange er am vorgesehenen Ort bleibt. Dracula (Bela Lugosi) beeinflusst die betreuende Frau und lässt ihn entfernen, um wieder Zugang zu erhalten. Die Bedrohung durchbricht damit nicht einfach eine feste magische Grenze: Sie benutzt einen Menschen im Haus, um die Vorsichtsmaßnahme außer Kraft zu setzen.

**Merksatz bisher:** Wolfsbann schützt Mina, solange niemand ihn entfernt.

**Urteil:** Überarbeiten. Eisenhut statt des aus anderen Vampirgeschichten vertrauten Knoblauchs bleibt ein sinnvoller Fassungsunterschied. Die Szene ersetzt eine allgemeine Aussage über Schutzregeln.

**Wissensziel beibehalten:** Den konkreten Schutz Minas in der Filmfassung kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Mina wird mit Wolfsbann geschützt.

**Vertiefung neu:** Van Helsing (Edward Van Sloan) lässt Mina (Helen Chandler) einen Kranz aus Eisenhut tragen und warnt die Pflegerin davor, ihn abzunehmen. Dracula (Bela Lugosi) umgeht den Schutz, indem er die Pflegerin hypnotisch beeinflusst. Sie entfernt den Kranz.

**Merksatz beibehalten:** Wolfsbann schützt Mina, solange niemand ihn entfernt.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Knoblauch gehört nicht zu diesem konkret gezeigten Schutz. · B: Van Helsing ordnet Wolfsbann als Schutz an. · C: Mistel wird hier nicht als Schutz verwendet. · D: Lorbeer ist nicht die angeordnete Pflanze.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Englischsprachiger Film von 1931: Carfax-Pacht, Lage bei Seward, Wolfsbann und Entfernung, Renfields Tod, Versprechen von Ratten. Handlung und Hauptbesetzung zusätzlich AFI; den strittigen Darstellercredit der Pflegerin nicht übernommen.

[Beleg 1](https://en.wikipedia.org/wiki/Dracula_(1931_English-language_film)) · [Beleg 2](https://catalog.afi.com/Film/7690-DRACULA).

### 11. Dracula (1931)

Frage-ID: `G100-20261008-HORROR-002-S2` · Wissensziel: `K-G100-20261008-HORROR-002-S2` · Horror · schwer.

**Originalfrage:** Warum greift Dracula (Bela Lugosi) Renfield (Dwight Frye) in Carfax Abbey in „Dracula“ tödlich an?

- **A:** Er glaubt, Renfield habe seinen Sarg verbrannt.
- **B:** Er glaubt, Renfield habe seine Gefangene bereits getötet.
- **C:** Er glaubt, Renfield habe seinen Sarg den Jägern ausgeliefert.
- **D:** Er glaubt, Renfield habe die Verfolger zu ihm geführt. **✓ richtig**

**Kurzantwort bisher:** Dracula hält die Verfolgung für Renfields Verrat.

**Vertiefung bisher (angezeigt):** Van Helsing (Edward Van Sloan) und John Harker (David Manners) folgen Renfield (Dwight Frye) nach Carfax Abbey. Als Dracula (Bela Lugosi) ihre Anwesenheit bemerkt, nimmt er an, sein Helfer habe sie absichtlich dorthin gebracht. Er stößt Renfield die Treppe hinunter. Die Verfolgung führt damit nicht nur zur Konfrontation mit dem Vampir: Sie löst auch eine tödliche Fehlinterpretation innerhalb seines eigenen Abhängigkeitsverhältnisses aus.

**Merksatz bisher:** Die Verfolger kommen, der Graf vermutet Verrat.

**Urteil:** Überarbeiten. Die Verfolger und die unmittelbare Folge werden benannt. Keine bewusste Absicht Renfields zur Rettung Minas erfinden.

**Wissensziel beibehalten:** Renfields Tod als Folge der Verfolgung verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Dracula hält die Verfolgung für Renfields Verrat.

**Vertiefung neu:** Van Helsing (Edward Van Sloan) und Harker (David Manners) folgen Renfield (Dwight Frye) zur Abtei. Dracula (Bela Lugosi) hält seinen Diener deshalb für einen Verräter und stößt ihn die Treppe hinab. Renfields Tod verhindert die Entdeckung nicht: Bei Tagesanbruch finden die Verfolger Dracula in seinem Sarg.

**Merksatz beibehalten:** Die Verfolger kommen, der Graf vermutet Verrat.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Ein verbrannter Sarg löst die Tat nicht aus. · B: Eine vermeintliche Tötung der Gefangenen ist nicht sein Grund. · C: Eine vermeintliche Übergabe des Sargs ist nicht der Anlass. · D: Der Graf deutet die Ankunft der Verfolger als Verrat.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Englischsprachiger Film von 1931: Carfax-Pacht, Lage bei Seward, Wolfsbann und Entfernung, Renfields Tod, Versprechen von Ratten. Handlung und Hauptbesetzung zusätzlich AFI; den strittigen Darstellercredit der Pflegerin nicht übernommen.

[Beleg 1](https://en.wikipedia.org/wiki/Dracula_(1931_English-language_film)) · [Beleg 2](https://catalog.afi.com/Film/7690-DRACULA).

### 12. Dracula (1931)

Frage-ID: `G100-20261008-HORROR-002-S1` · Wissensziel: `K-G100-20261008-HORROR-002-S1` · Horror · schwer.

**Originalfrage:** Womit lockt Dracula (Bela Lugosi) Renfield (Dwight Frye) in „Dracula“ zur weiteren Hilfe?

- **A:** Mit unerschöpflichen Vorräten menschlichen Blutes
- **B:** Mit einem Leben ohne Hunger und Krankheit
- **C:** Mit Tausenden Ratten als Nahrung **✓ richtig**
- **D:** Mit der freien Jagd auf die Anstaltspatienten

**Kurzantwort bisher:** Dracula lockt Renfield mit einer ungeheuren Menge Ratten.

**Vertiefung bisher (angezeigt):** Renfield (Dwight Frye) berichtet vom Versprechen des Grafen, ihm zahlreiche Ratten zu geben. Für den Patienten, der kleinere Lebewesen als Nahrung sucht, ist dieses Angebot ein wirksames Lockmittel. Dracula (Bela Lugosi) nutzt also nicht nur unmittelbare Hypnose, sondern auch ein Begehren seines Helfers. Die Erzählung erklärt dadurch einen weiteren Weg, auf dem die Abhängigkeit den Zugang zum Haus ermöglicht.

**Merksatz bisher:** Das Rattenversprechen macht Renfields Begehren zur Falle.

**Urteil:** Überarbeiten. Die ungewöhnliche richtige Antwort erhält ihren szenischen Zusammenhang. Die Abgrenzung zur Vampirverwandlung macht eine naheliegende Fehlannahme verständlich.

**Wissensziel beibehalten:** Draculas Rattenversprechen an Renfield erklären

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Dracula lockt Renfield mit einer ungeheuren Menge Ratten.

**Vertiefung neu:** Renfield (Dwight Frye) ernährt sich im Sanatorium von kleinen Tieren und Insekten. Dracula (Bela Lugosi) verspricht ihm Tausende Ratten voller Blut und Leben, wenn er ihm Zugang verschafft. Die Verlockung passt zu Renfields bereits gezeigter Besessenheit; sie ist kein Versprechen, ihn selbst zum Vampir zu machen.

**Merksatz neu:** Dracula lockt Renfield mit Tausenden Ratten.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Unerschöpfliche menschliche Blutvorräte sind nicht das berichtete Versprechen. · B: Ein Leben ohne Hunger und Krankheit ist nicht das konkrete Lockmittel. · C: Der Graf verspricht ihm zahlreiche Ratten voller Blut und Leben. · D: Freie Jagd auf Patienten ist nicht das Angebot.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Englischsprachiger Film von 1931: Carfax-Pacht, Lage bei Seward, Wolfsbann und Entfernung, Renfields Tod, Versprechen von Ratten. Handlung und Hauptbesetzung zusätzlich AFI; den strittigen Darstellercredit der Pflegerin nicht übernommen.

[Beleg 1](https://en.wikipedia.org/wiki/Dracula_(1931_English-language_film)) · [Beleg 2](https://catalog.afi.com/Film/7690-DRACULA).

### 13. Harry Potter und der Orden des Phönix (2007)

Frage-ID: `FAN-L-022` · Wissensziel: `K-FAN-11-dumbledores-armee` · Fantasy · leicht.

**Originalfrage:** „Harry Potter und der Orden des Phönix“ (2007): Wie heißt Harrys (Daniel Radcliffe) geheime Übungsgruppe für Verteidigungszauber?

- **A:** Das Inquisitionskommando
- **B:** Der Orden des Phönix
- **C:** Dumbledores Armee **✓ richtig**
- **D:** Die Todesser

**Kurzantwort bisher:** Harry unterrichtet seine Mitschüler in Dumbledores Armee.

**Vertiefung bisher (angezeigt):** Die Gruppe entsteht, weil den Jugendlichen praktische Verteidigung fehlt. Harry hat Gefahren bereits selbst erlebt und gibt seine Erfahrungen weiter. Der Name signalisiert Verbundenheit mit Dumbledore, obwohl dieser den Unterricht nicht leitet. Lernen wird hier zu einer gemeinsamen Antwort auf Einschüchterung und auf den eingeschränkten offiziellen Unterricht.

**Merksatz bisher:** Dumbledores Armee übt, was Umbridges Unterricht ausspart.

**Urteil:** Überarbeiten. Der Gruppenname wird mit Unterricht, Treffpunkt und späterer Beschuldigung verknüpft. Die anderen realen Gruppen sind sinnvolle Alternativen.

**Wissensziel beibehalten:** Dumbledores Armee als Lerngruppe erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Harry unterrichtet seine Mitschüler in Dumbledores Armee.

**Vertiefung neu:** Weil Umbridge (Imelda Staunton) keine praktischen Verteidigungszauber unterrichtet, organisieren Hermine (Emma Watson) und Ron (Rupert Grint) mit Harry (Daniel Radcliffe) heimliche Übungsstunden. Im Raum der Wünsche gibt Harry seine Kampferfahrung weiter. Dumbledore (Michael Gambon) leitet die Gruppe trotz ihres Namens nicht; die Behörden benutzen den Namen später gegen ihn.

**Merksatz beibehalten:** Dumbledores Armee übt, was Umbridges Unterricht ausspart.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Das Inquisitionskommando unterstützt Umbridges Überwachung. · B: Der Orden ist die separate Widerstandsorganisation der Erwachsenen. · D: Todesser folgen Voldemort und bilden nicht Harrys Lerngruppe.

**Antwortfeedback neu:** A: Das Inquisitionskommando unterstützt Umbridges Überwachung. · B: Der Orden ist die separate Widerstandsorganisation der Erwachsenen. · D: Todesser folgen Voldemort.

**Quellenprüfung:** Filmhandlung und Besetzung: heimliche Verteidigungsgruppe, Strafeder, Arthur-Vision und spätere Sirius-Täuschung, Umbridges Ämter und Erlasse.

[Beleg 1](https://en.wikipedia.org/wiki/Harry_Potter_and_the_Order_of_the_Phoenix_(film)).

### 14. Harry Potter und der Orden des Phönix (2007)

Frage-ID: `FAN-M-021` · Wissensziel: `K-FAN-11-blutfeder` · Fantasy · mittel.

**Originalfrage:** „Harry Potter und der Orden des Phönix“ (2007): Was macht Umbridges (Imelda Staunton) Strafarbeit für Harry (Daniel Radcliffe) besonders grausam?

- **A:** Die Feder überträgt mit jedem Satz einen Teil seiner Erinnerungen.
- **B:** Die geschriebenen Worte schneiden sich in seine Hand. **✓ richtig**
- **C:** Die geschriebenen Worte lassen ihn körperlich erstarren.
- **D:** Die Feder zwingt ihn bei jedem Satz zu einem unfreiwilligen Geständnis.

**Kurzantwort bisher:** Die magische Feder überträgt den geschriebenen Satz als Verletzung auf Harrys Hand.

**Vertiefung bisher (angezeigt):** Die Strafe verbindet eine scheinbar gewöhnliche Schulaufgabe mit körperlicher Gewalt. Harry soll eine Version der Ereignisse übernehmen, die seiner Erfahrung widerspricht. Seine Hand macht sichtbar, dass Umbridges Ordnung nicht nur aus Vorschriften besteht. Die Szene erklärt auch, weshalb ihr freundlicher Ton den bedrohlichen Eindruck eher verstärkt als mildert.

**Merksatz bisher:** Umbridges Strafsatz hinterlässt eine Wunde auf Harrys Hand.

**Urteil:** Überarbeiten. Die Kurzantwort war mechanisch korrekt. Anlass und Wortinhalt erklären nun, weshalb diese Strafe zum politischen Konflikt des Films gehört.

**Wissensziel beibehalten:** Die Wirkung von Umbridges Strafeder verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die magische Feder überträgt den geschriebenen Satz als Verletzung auf Harrys Hand.

**Vertiefung neu:** Harry (Daniel Radcliffe) muss zur Strafe wiederholt schreiben, dass er nicht lügen dürfe. Umbridges (Imelda Staunton) Feder ritzt die geschriebenen Worte zugleich in seine Hand. Bestraft wird seine Aussage, Voldemort (Ralph Fiennes) sei zurückgekehrt – genau die Wahrheit, die das Ministerium öffentlich bestreitet.

**Merksatz beibehalten:** Umbridges Strafsatz hinterlässt eine Wunde auf Harrys Hand.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die gezeigte Grausamkeit sind die Wunden, kein Erinnerungstransfer. · C: Harry erstarrt nicht; die Worte verletzen seine Hand. · D: Sie schreibt einen vorgegebenen Satz in seine Haut, erzwingt aber kein wahres Geständnis.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Filmhandlung und Besetzung: heimliche Verteidigungsgruppe, Strafeder, Arthur-Vision und spätere Sirius-Täuschung, Umbridges Ämter und Erlasse.

[Beleg 1](https://en.wikipedia.org/wiki/Harry_Potter_and_the_Order_of_the_Phoenix_(film)).

### 15. Harry Potter und der Orden des Phönix (2007)

Frage-ID: `FAN-S-021` · Wissensziel: `K-FAN-11-vision-falle` · Fantasy · schwer.

**Originalfrage:** „Harry Potter und der Orden des Phönix“ (2007): Warum führt Harrys (Daniel Radcliffe) Vision von Sirius' (Gary Oldman) Folter ins Ministerium?

- **A:** Sirius sendet Harry bewusst einen verschlüsselten Hilferuf.
- **B:** Dumbledore stellt Harry damit eine geheime Abschlussprüfung.
- **C:** Umbridge erzeugt die Vision mit ihrer Strafschreibfeder.
- **D:** Voldemort benutzt eine falsche Vision, um Harry dorthin zu locken. **✓ richtig**

**Kurzantwort bisher:** Die vermeintliche Foltervision ist eine Falle Voldemorts.

**Vertiefung bisher (angezeigt):** Harry hat bereits erlebt, dass seine inneren Bilder auf reale Gefahren hinweisen können. Genau dieses Vertrauen macht die Täuschung wirksam. Der Wunsch, Sirius sofort zu retten, verdrängt die Prüfung der Information. Die Szene verbindet Harrys stärkste Bindung mit einer Schwäche, die sein Gegner gezielt ausnutzt.

**Merksatz bisher:** Voldemort tarnt den Köder als Notlage von Harrys Paten.

**Urteil:** Überarbeiten. Der zuvor behauptete Vertrauenseffekt wird am früheren echten Angriff belegt. Die spätere Täuschung wird nicht mit einer Buchszene ausgeschmückt.

**Wissensziel beibehalten:** Die falsche Sirius-Vision als Falle einordnen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die vermeintliche Foltervision ist eine Falle Voldemorts.

**Vertiefung neu:** Eine frühere Vision hatte Harry (Daniel Radcliffe) tatsächlich vor dem Angriff auf Arthur Weasley (Mark Williams) gewarnt. Als er nun Sirius (Gary Oldman) in Voldemorts (Ralph Fiennes) Gewalt zu sehen glaubt, hält er auch dieses Bild für eine reale Notlage. Im Ministerium warten jedoch Todesser; die Rettungsaktion führt ihn in die Falle.

**Merksatz beibehalten:** Voldemort tarnt den Köder als Notlage von Harrys Paten.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Sirius übermittelt diese Szene nicht als echten Hilferuf. · B: Dumbledore hat keine solche Prüfung organisiert. · C: Die Strafschreibfeder verursacht diese Vision nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Filmhandlung und Besetzung: heimliche Verteidigungsgruppe, Strafeder, Arthur-Vision und spätere Sirius-Täuschung, Umbridges Ämter und Erlasse.

[Beleg 1](https://en.wikipedia.org/wiki/Harry_Potter_and_the_Order_of_the_Phoenix_(film)).

### 16. Harry Potter und der Orden des Phönix (2007)

Frage-ID: `FAN-L-021` · Wissensziel: `K-FAN-11-umbridge` · Fantasy · leicht.

**Originalfrage:** „Harry Potter und der Orden des Phönix“ (2007): Welche Lehrerin übernimmt im Auftrag des Ministeriums zunehmend die Kontrolle über Hogwarts?

- **A:** Sybill Trelawney
- **B:** Dolores Umbridge **✓ richtig**
- **C:** Minerva McGonagall
- **D:** Pomona Sprout

**Kurzantwort bisher:** Dolores Umbridge setzt die Vorgaben des Ministeriums an Hogwarts durch.

**Vertiefung bisher (angezeigt):** Imelda Staunton spielt Umbridge mit betont höflichem Auftreten, hinter dem sich große Grausamkeit verbirgt. Ihre Regeln beschränken Unterricht und Schülerleben. Für Harry wird dadurch ausgerechnet die Schule zu einem Ort politischer Kontrolle. Der Konflikt dreht sich auch darum, wer entscheiden darf, welche Erfahrungen als Wahrheit gelten.

**Merksatz bisher:** Umbridges höfliche Fassade verbirgt autoritäre Kontrolle.

**Urteil:** Überarbeiten. Die Ämterfolge vermittelt die tatsächliche Handlung statt nur höfliches Auftreten und Grausamkeit zu beschreiben.

**Wissensziel beibehalten:** Umbridges Rolle bei der Übernahme Hogwarts verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Dolores Umbridge setzt die Vorgaben des Ministeriums an Hogwarts durch.

**Vertiefung neu:** Das Ministerium schickt Umbridge (Imelda Staunton) zunächst als Lehrerin für Verteidigung gegen die dunklen Künste nach Hogwarts. Als Großinquisitorin überwacht sie anschließend die anderen Lehrkräfte. Nach Dumbledores (Michael Gambon) Flucht übernimmt sie die Schulleitung. Neue Erlasse und das Inquisitionskommando sichern ihre wachsende Macht im Schulalltag ab.

**Merksatz neu:** Umbridge steigt von der Lehrerin zur Großinquisitorin und Schulleiterin auf.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Trelawney wird selbst zum Ziel von Umbridges Eingriffen. · C: McGonagall widerspricht Umbridges Vorgehen; sie ist keine Gesandte des Ministers. · D: Sprout leitet nicht die politische Überwachung der Schule.

**Antwortfeedback neu:** A: Trelawney wird selbst zum Ziel von Umbridges Eingriffen. · C: McGonagall widerspricht Umbridges Vorgehen.

**Quellenprüfung:** Filmhandlung und Besetzung: heimliche Verteidigungsgruppe, Strafeder, Arthur-Vision und spätere Sirius-Täuschung, Umbridges Ämter und Erlasse.

[Beleg 1](https://en.wikipedia.org/wiki/Harry_Potter_and_the_Order_of_the_Phoenix_(film)).

### 17. Midnight Run – Fünf Tage bis Mitternacht (1988)

Frage-ID: `E20261007-F-123-L1` · Wissensziel: `K-E20261007-F-123-L1` · Komödie · leicht.

**Originalfrage:** Welchen Auftrag übernimmt Jack Walsh (Robert De Niro) in „Midnight Run – Fünf Tage bis Mitternacht“?

- **A:** Einen Bankräuber aus Mexiko befreien
- **B:** Einen Diplomaten nach Washington eskortieren
- **C:** Einen verschwundenen Rennfahrer nach Chicago holen
- **D:** Einen flüchtigen Buchhalter nach Los Angeles bringen **✓ richtig**

**Kurzantwort bisher:** Jack Walsh (Robert De Niro) soll den Buchhalter Jonathan Mardukas (Charles Grodin) nach Los Angeles bringen.

**Vertiefung bisher (angezeigt):** Jack Walsh (Robert De Niro) soll den Buchhalter Jonathan Mardukas (Charles Grodin) nach Los Angeles bringen. Der Auftrag verspricht eine hohe Prämie und scheint zunächst Routine. Doch Mafia und FBI haben eigene Interessen an dem Flüchtigen. Der Transport wird dadurch zur Reise, auf der Walsh immer wieder entscheiden muss, wem seine Loyalität eigentlich gilt.

**Merksatz bisher:** Der Buchhalter soll nach Los Angeles zurück.

**Urteil:** Überarbeiten. Die präzise Kurzantwort bleibt. Herkunft des Geldes und Kautionsfrist erklären, weshalb mehrere Parteien denselben Mann verfolgen.

**Wissensziel beibehalten:** Walshs Transportauftrag samt Frist verstehen

**Neue vollständige Komposition:** Welchen Auftrag übernimmt Jack Walsh (Robert De Niro) in „Midnight Run – Fünf Tage bis Mitternacht“?

- **A:** Einen Kronzeugen nach Washington eskortieren
- **B:** Einen flüchtigen Buchhalter nach Chicago bringen
- **C:** Einen verurteilten Betrüger aus Los Angeles abholen
- **D:** Einen flüchtigen Buchhalter nach Los Angeles bringen **✓ richtig**

**Kurzantwort beibehalten:** Jack Walsh (Robert De Niro) soll den Buchhalter Jonathan Mardukas (Charles Grodin) nach Los Angeles bringen.

**Vertiefung neu:** Mardukas (Charles Grodin) hat Geld der Mafia unterschlagen und an wohltätige Einrichtungen verteilt. Nachdem er gegen Kaution freigekommen und geflohen ist, droht dem Kautionsvermittler ein hoher Verlust. Walsh (Robert De Niro) soll ihn deshalb binnen fünf Tagen zurückbringen. Das FBI braucht den Buchhalter als Zeugen, die Mafia will ihn zum Schweigen bringen.

**Merksatz beibehalten:** Der Buchhalter soll nach Los Angeles zurück.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die Reise ist keine Befreiung eines Bankräubers aus Mexiko. · B: Ein Diplomat nach Washington ist nicht der Auftrag. · C: Ein Rennfahrer gehört nicht zum gesuchten Transport.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: unterschlagenes Mafiageld, Kaution/Fünftagesfrist, Moselys Ausweis und Vereinbarung, Freilassung vor Geschenk, vorgetäuschte Flugpanik.

[Beleg 1](https://en.wikipedia.org/wiki/Midnight_Run).

### 18. Midnight Run – Fünf Tage bis Mitternacht (1988)

Frage-ID: `E20261007-F-123-M2` · Wissensziel: `K-E20261007-F-123-M2` · Komödie · mittel.

**Originalfrage:** Warum benutzt Jack Walsh (Robert De Niro) in „Midnight Run – Fünf Tage bis Mitternacht“ den Ausweis von Agent Mosely (Yaphet Kotto)?

- **A:** Er will damit eine amtliche Vorladung fingieren.
- **B:** Er überlässt ihn Mardukas für eine alleinige Grenzüberquerung.
- **C:** Er gibt sich unterwegs als FBI-Agent aus. **✓ richtig**
- **D:** Er lässt damit seine eigene Polizeiakte umschreiben.

**Kurzantwort bisher:** Walsh (Robert De Niro) benutzt Moselys Ausweis, um sich als FBI-Agent auszugeben.

**Vertiefung bisher (angezeigt):** Walsh (Robert De Niro) benutzt Moselys Ausweis, um sich als FBI-Agent auszugeben. Der ehemalige Polizist verschafft sich so Zugang und Autorität, die ihm als Kopfgeldjäger fehlen. Zugleich macht er sich gegenüber dem wirklichen FBI angreifbar. Der gestohlene Ausweis hilft kurzfristig bei der Reise, wird aber zu einem weiteren Punkt, den Walsh am Ende aushandeln muss.

**Merksatz bisher:** Ein geliehener FBI-Status hilft und schafft neue Schwierigkeiten.

**Urteil:** Überarbeiten. Die Ironie beginnt beim Diebstahl vom Verfolger. Das spätere Aushandeln wird konkretisiert, statt nur als zusätzliche Schwierigkeit bezeichnet zu werden.

**Wissensziel beibehalten:** Die Funktion des gestohlenen FBI-Ausweises erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Walsh (Robert De Niro) benutzt Moselys Ausweis, um sich als FBI-Agent auszugeben.

**Vertiefung neu:** Mosely (Yaphet Kotto) will Walsh (Robert De Niro) gerade von der Suche nach Mardukas (Charles Grodin) abhalten. Walsh stiehlt ihm stattdessen den Ausweis und reist mit geliehener Behördenautorität weiter. Später handelt er mit dem echten Agenten Straffreiheit für diese Amtsanmaßung aus, als er bei der Festnahme des Mafiabosses hilft.

**Merksatz neu:** Walsh reist mit Moselys gestohlenem FBI-Ausweis.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Walsh verwendet den Ausweis unmittelbar als falschen Dienstausweis, nicht zum Ausstellen einer Vorladung. · B: Walsh gibt den Ausweis nicht für eine alleinige Auslandsreise an Mardukas weiter. · D: Der Ausweis dient der Reise und den Kontrollen, nicht einer Umschreibung seiner früheren Akte.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: unterschlagenes Mafiageld, Kaution/Fünftagesfrist, Moselys Ausweis und Vereinbarung, Freilassung vor Geschenk, vorgetäuschte Flugpanik.

[Beleg 1](https://en.wikipedia.org/wiki/Midnight_Run).

### 19. Midnight Run – Fünf Tage bis Mitternacht (1988)

Frage-ID: `E20261007-F-123-S2` · Wissensziel: `K-E20261007-F-123-S2` · Komödie · schwer.

**Originalfrage:** Welche Entscheidung trifft Walsh (Robert De Niro) nach der Ankunft in Los Angeles am Ende von „Midnight Run – Fünf Tage bis Mitternacht“?

- **A:** Er lässt Mardukas frei. **✓ richtig**
- **B:** Er übergibt Mardukas der Mafia.
- **C:** Er stellt Mardukas als seinen neuen Mitarbeiter ein.
- **D:** Er nimmt Mardukas für einen zweiten Transport fest.

**Kurzantwort bisher:** Walsh (Robert De Niro) lässt Mardukas (Charles Grodin) frei.

**Vertiefung bisher (angezeigt):** Walsh (Robert De Niro) lässt Mardukas (Charles Grodin) frei. Er weiß, dass eine Gefängniseinlieferung den Buchhalter weiterhin der Mafia aussetzen würde. Die Reise endet deshalb mit einem Verzicht auf die ursprüngliche Prämienlogik. Das spätere Geldgeschenk des Buchhalters folgt erst dieser Entscheidung; es ist nicht die Bezahlung, mit der Walsh vorher zur Freilassung gekauft wurde.

**Merksatz bisher:** Erst die Freiheit, danach das Geschenk.

**Urteil:** Überarbeiten. Die bisherige Trennung von Entscheidung und Geldgeschenk ist bereits stark. Nur die abstrakte „Prämienlogik“ und eine Dopplung entfallen.

**Wissensziel beibehalten:** Walshs Freilassungsentscheidung von einer Bestechung unterscheiden

**Neue vollständige Komposition:** Welche Entscheidung trifft Walsh (Robert De Niro) nach der Ankunft in Los Angeles am Ende von „Midnight Run – Fünf Tage bis Mitternacht“?

- **A:** Er lässt Mardukas frei. **✓ richtig**
- **B:** Er übergibt Mardukas dem FBI.
- **C:** Er liefert Mardukas beim Kautionsvermittler ab.
- **D:** Er überlässt Mardukas dem rivalisierenden Kopfgeldjäger.

**Kurzantwort beibehalten:** Walsh (Robert De Niro) lässt Mardukas (Charles Grodin) frei.

**Vertiefung neu:** Walsh (Robert De Niro) lässt Mardukas (Charles Grodin) frei. Er weiß, dass eine Gefängniseinlieferung den Buchhalter weiterhin der Mafia aussetzen würde. Das spätere Geldgeschenk folgt erst dieser Entscheidung; es ist nicht die Bezahlung, mit der Walsh vorher zur Freilassung gekauft wurde.

**Merksatz beibehalten:** Erst die Freiheit, danach das Geschenk.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** B: Die Mafia erhält den Buchhalter nicht. · C: Die Freilassung ist keine formale Neueinstellung. · D: Ein weiterer Transport ist nicht das Finale.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: unterschlagenes Mafiageld, Kaution/Fünftagesfrist, Moselys Ausweis und Vereinbarung, Freilassung vor Geschenk, vorgetäuschte Flugpanik.

[Beleg 1](https://en.wikipedia.org/wiki/Midnight_Run).

### 20. Midnight Run – Fünf Tage bis Mitternacht (1988)

Frage-ID: `E20261007-F-123-M1` · Wissensziel: `K-E20261007-F-123-M1` · Komödie · mittel.

**Originalfrage:** Wie verhindert Mardukas (Charles Grodin) in „Midnight Run – Fünf Tage bis Mitternacht“ den geplanten schnellen Rückflug?

- **A:** Er vernichtet sämtliche Reisepapiere.
- **B:** Er täuscht im Flugzeug eine Panikattacke vor. **✓ richtig**
- **C:** Er besticht den Piloten beim Einstieg.
- **D:** Er behauptet, eine Bombe im Gepäck zu haben.

**Kurzantwort bisher:** Mardukas (Charles Grodin) täuscht eine Panikattacke vor.

**Vertiefung bisher (angezeigt):** Mardukas (Charles Grodin) täuscht eine Panikattacke vor. Der direkte Flug scheitert, und Jack Walsh (Robert De Niro) muss den Gefangenen auf anderen Wegen quer durch die USA bewegen. Die scheinbare Flugangst wirkt dadurch als Erzählmotor: Aus einem kurzen Transport werden Züge, Autos und wechselnde Notlösungen, die dem Paar Zeit für Konflikte und Annäherung geben.

**Merksatz bisher:** Die vorgetäuschte Flugpanik macht aus dem Transport eine Reise.

**Urteil:** Überarbeiten. Die vorhandene Erklärung enthält den richtigen Reisebogen. Statt des abstrakten Wortes „Erzählmotor“ wird die Bedeutung des Zeitverlusts für Walshs Auftrag benannt.

**Wissensziel beibehalten:** Die vorgetäuschte Flugangst als Reisehindernis verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Mardukas (Charles Grodin) täuscht eine Panikattacke vor.

**Vertiefung neu:** Der geplante Flug würde Walsh (Robert De Niro) und Mardukas (Charles Grodin) schnell nach Los Angeles bringen. Mardukas spielt jedoch im Flugzeug eine Panikattacke, und die beiden müssen auf den Zug ausweichen. Weitere Verfolger zwingen sie später zu Autos und anderen Notlösungen. Jeder gescheiterte Anschluss kostet Walsh Zeit von seiner Fünftagesfrist.

**Merksatz beibehalten:** Die vorgetäuschte Flugpanik macht aus dem Transport eine Reise.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die Flugänderung entsteht nicht durch zerstörte Papiere. · C: Eine Pilotenbestechung wird nicht eingesetzt. · D: Er löst keinen Bombenalarm aus.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: unterschlagenes Mafiageld, Kaution/Fünftagesfrist, Moselys Ausweis und Vereinbarung, Freilassung vor Geschenk, vorgetäuschte Flugpanik.

[Beleg 1](https://en.wikipedia.org/wiki/Midnight_Run).

### 21. Der Mann aus Laramie (1955)

Frage-ID: `F240-20261006-227-L1` · Wissensziel: `K-F240-20261006-227-L1` · Western · leicht.

**Originalfrage:** Was sucht Will Lockhart (James Stewart) in „Der Mann aus Laramie“ in Coronado?

- **A:** Die Lieferanten der Gewehre, mit denen sein Bruder getötet wurde **✓ richtig**
- **B:** Den Dieb eines Geldtransports
- **C:** Den Besitzer einer aufgegebenen Goldmine
- **D:** Den verschollenen Käufer seiner Ranch

**Kurzantwort bisher:** Will Lockhart (James Stewart) sucht die Männer, die Apachen Repetiergewehre verkauft haben.

**Vertiefung bisher (angezeigt):** Will Lockhart (James Stewart) sucht die Männer, die Apachen Repetiergewehre verkauft haben. Sein Bruder starb beim damit ausgeführten Angriff auf eine Kavallerieeinheit.

**Merksatz bisher:** Der Waffenhandel verbindet persönliche Rache mit lokaler Macht.

**Urteil:** Überarbeiten. Zwei fast identische Sätze werden durch Tarnanlass, persönliche Suche und örtlichen Konflikt ersetzt. Die klare Frage bleibt.

**Wissensziel beibehalten:** Lockharts Suche nach den Waffenlieferanten begründen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Will Lockhart (James Stewart) sucht die Männer, die Apachen Repetiergewehre verkauft haben.

**Vertiefung neu:** Lockhart (James Stewart) liefert zunächst Waren nach Coronado und gerät mit der mächtigen Familie Waggoman aneinander. Sein eigentlicher Grund für die Reise ist der Tod seines Bruders bei einem Angriff auf eine Kavallerieeinheit. Er sucht die Händler, die den Apachen die Repetiergewehre geliefert haben, und stößt dabei auf Geschäfte innerhalb dieser Familie.

**Merksatz neu:** Lockhart sucht die Gewehrlieferanten hinter dem Tod seines Bruders.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** B: Ein Geldraub ist nicht sein Anlass. · C: Eine Mine sucht er nicht. · D: Ein Ranchverkauf ist nicht sein Hintergrund.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: Bruder/Kavallerie, versprochenes Erbe, Vics und Daves Waffenhandel, Drahtrechnung, Sturz Alecs, Vernichtung der Gewehre und Tötung Vics.

[Beleg 1](https://en.wikipedia.org/wiki/The_Man_from_Laramie).

### 22. Der Mann aus Laramie (1955)

Frage-ID: `F240-20261006-227-M2` · Wissensziel: `K-F240-20261006-227-M2` · Western · mittel.

**Originalfrage:** Warum hält Vic (Arthur Kennedy) in „Der Mann aus Laramie“ trotz Konflikten an Alec Waggomans (Donald Crisp) Ranch fest?

- **A:** Er muss dort eine Haftstrafe abarbeiten
- **B:** Er versteckt dort seine entführte Schwester
- **C:** Er schuldet Barbara einen hohen Geldbetrag
- **D:** Er hofft auf den versprochenen Anteil am Erbe **✓ richtig**

**Kurzantwort bisher:** Vic Hansbro (Arthur Kennedy) erwartet einen Anteil an Alec Waggomans (Donald Crisp) Ranch.

**Vertiefung bisher (angezeigt):** Vic Hansbro (Arthur Kennedy) erwartet einen Anteil an Alec Waggomans (Donald Crisp) Ranch. Die Aussicht auf Eigentum bindet ihn an den alten Mann und dessen gefährlichen Sohn.

**Merksatz bisher:** Das erhoffte Erbe macht Vic vom Familienpatriarchen abhängig.

**Urteil:** Überarbeiten. Das Erbe erklärt nicht nur ein Gefühl von Abhängigkeit, sondern Vics konkrete Interessen im Familienkonflikt.

**Wissensziel beibehalten:** Vics Bindung an die Ranch erklären

**Neue vollständige Komposition:** Warum hält Vic (Arthur Kennedy) in „Der Mann aus Laramie“ trotz Konflikten an Alec Waggomans (Donald Crisp) Ranch fest?

- **A:** Er erwartet eine Beteiligung am Verkauf der Ranch.
- **B:** Er will Alec zum Kauf seiner eigenen Herde bewegen.
- **C:** Er hofft auf die Rückzahlung eines privaten Darlehens.
- **D:** Er hofft auf den versprochenen Anteil am Erbe. **✓ richtig**

**Kurzantwort beibehalten:** Vic Hansbro (Arthur Kennedy) erwartet einen Anteil an Alec Waggomans (Donald Crisp) Ranch.

**Vertiefung neu:** Alec Waggoman (Donald Crisp) hat Vic (Arthur Kennedy) einen Anteil an der Ranch in Aussicht gestellt. Doch sein leiblicher Sohn Dave (Alex Nicol) beansprucht ebenfalls Macht und Besitz. Vic versucht, seine erhoffte Zukunft in diesem Haushalt zu sichern, obwohl er selbst mit Dave in den illegalen Gewehrhandel verwickelt ist.

**Merksatz beibehalten:** Das erhoffte Erbe macht Vic vom Familienpatriarchen abhängig.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Er verbüßt keine Arbeitsstrafe. · B: Eine entführte Schwester wird nicht versteckt. · C: Sein Bleiben folgt keinem Geldschuldvertrag mit Barbara.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: Bruder/Kavallerie, versprochenes Erbe, Vics und Daves Waffenhandel, Drahtrechnung, Sturz Alecs, Vernichtung der Gewehre und Tötung Vics.

[Beleg 1](https://en.wikipedia.org/wiki/The_Man_from_Laramie).

### 23. Der Mann aus Laramie (1955)

Frage-ID: `F240-20261006-227-S2` · Wissensziel: `K-F240-20261006-227-S2` · Western · schwer.

**Originalfrage:** Wie beendet Lockhart (James Stewart) in „Der Mann aus Laramie“ die Gefahr der versteckten Gewehre?

- **A:** Er verkauft sie an eine andere Ranch
- **B:** Er zwingt Vic, sie mit ihm über eine Klippe zu stoßen **✓ richtig**
- **C:** Er vergräbt sie unter dem Salzsee
- **D:** Er tauscht sie gegen Alec Waggomans Freilassung

**Kurzantwort bisher:** Lockhart (James Stewart) zwingt Vic (Arthur Kennedy), die Gewehre über eine Klippe zu werfen.

**Vertiefung bisher (angezeigt):** Lockhart (James Stewart) zwingt Vic (Arthur Kennedy), die Gewehre über eine Klippe zu werfen. Das zerstört die Lieferung; Vic wird anschließend von den um ihre Ware gebrachten Käufern getötet.

**Merksatz bisher:** Die zerstörte Lieferung beendet den Handel und besiegelt Vics Ende.

**Urteil:** Überarbeiten. Der Ablauf trennt Lockharts Handlung von Vics späterer Tötung. Die bisherige Erklärung verkürzte diese entscheidende Unterscheidung.

**Wissensziel beibehalten:** Die Zerstörung der letzten Waffenlieferung kennen

**Neue vollständige Komposition:** Wie beendet Lockhart (James Stewart) in „Der Mann aus Laramie“ die Gefahr der versteckten Gewehre?

- **A:** Er gibt die Gewehre einem verbündeten Rancher zur Verwahrung.
- **B:** Er zwingt Vic, sie mit ihm über eine Klippe zu stoßen. **✓ richtig**
- **C:** Er versteckt sie in einem verlassenen Minenstollen.
- **D:** Er liefert sie beim Sheriff als Beweismittel ab.

**Kurzantwort beibehalten:** Lockhart (James Stewart) zwingt Vic (Arthur Kennedy), die Gewehre über eine Klippe zu werfen.

**Vertiefung neu:** Am Waffenversteck trifft Lockhart (James Stewart) Vic (Arthur Kennedy), der gerade die Käufer herbeiruft. Statt Vic für den Tod seines Bruders zu erschießen, zwingt er ihn, die Gewehre mit ihm über den Abhang zu stoßen. Anschließend töten die um ihre Lieferung gebrachten Apachen Vic. Lockharts Suche endet mit der Vernichtung der Waffen.

**Merksatz beibehalten:** Die zerstörte Lieferung beendet den Handel und besiegelt Vics Ende.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Ein Weiterverkauf würde die Gefahr fortsetzen. · C: Sie werden nicht vergraben. · D: Alec ist nicht als Geisel festgehalten.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: Bruder/Kavallerie, versprochenes Erbe, Vics und Daves Waffenhandel, Drahtrechnung, Sturz Alecs, Vernichtung der Gewehre und Tötung Vics.

[Beleg 1](https://en.wikipedia.org/wiki/The_Man_from_Laramie).

### 24. Der Mann aus Laramie (1955)

Frage-ID: `F240-20261006-227-S1` · Wissensziel: `K-F240-20261006-227-S1` · Western · schwer.

**Originalfrage:** Welche Rechnung lässt Alec (Donald Crisp) in „Der Mann aus Laramie“ den illegalen Handel seines Sohnes vermuten?

- **A:** Ein unnötiger Kauf von Zaundraht **✓ richtig**
- **B:** Eine Rechnung für neue Sättel
- **C:** Eine hohe Hotelrechnung
- **D:** Ein Auftrag für einen Brunnenbau

**Kurzantwort bisher:** Alec Waggoman (Donald Crisp) entdeckt einen unnötigen Zaundrahtkauf und vermutet die Tarnung eines Gewehrkaufs.

**Vertiefung bisher (angezeigt):** Alec Waggoman (Donald Crisp) entdeckt einen unnötigen Zaundrahtkauf und vermutet die Tarnung eines Gewehrkaufs. Er sucht das Versteck auf und gefährdet damit Vics (Arthur Kennedy) Beteiligung am Geschäft.

**Merksatz bisher:** Die nutzlose Drahtrechnung lässt das Waffengeschäft durchsichtig werden.

**Urteil:** Überarbeiten. Der Drahtposten ist eine Schlussfolgerung aus der Buchhaltung, keine offen beschriftete Waffenrechnung. Der Text macht daraus eine zusammenhängende Ermittlungsszene. „Unnötig“ entfällt als zusätzlicher Hinweis nur in der richtigen Option.

**Wissensziel beibehalten:** Den Rechnungsfund als Spur zum Waffengeschäft verstehen

**Neue vollständige Komposition:** Welche Rechnung lässt Alec (Donald Crisp) in „Der Mann aus Laramie“ den illegalen Handel seines Sohnes vermuten?

- **A:** Eine Rechnung für Zaundraht **✓ richtig**
- **B:** Eine Rechnung für neue Sättel
- **C:** Eine hohe Hotelrechnung
- **D:** Ein Auftrag für einen Brunnenbau

**Kurzantwort beibehalten:** Alec Waggoman (Donald Crisp) entdeckt einen unnötigen Zaundrahtkauf und vermutet die Tarnung eines Gewehrkaufs.

**Vertiefung neu:** Nach Daves (Alex Nicol) Tod entdeckt Alec (Donald Crisp) eine Zahlung für Zaundraht, den die Ranch gar nicht benötigt. Er vermutet, dass sein Sohn damit den Gewehrkauf verschleiert hat, und sucht das Versteck. Vic (Arthur Kennedy) folgt ihm und versucht, ihn aufzuhalten; dabei stürzt Alec den Hang hinunter.

**Merksatz neu:** Unnötiger Zaundraht lässt Alec einen verdeckten Gewehrkauf vermuten.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** B: Sättel sind nicht der verdächtige Rechnungsposten. · C: Eine Hotelrechnung bringt ihn nicht auf die Waffen. · D: Ein Brunnenauftrag ist nicht beteiligt.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: Bruder/Kavallerie, versprochenes Erbe, Vics und Daves Waffenhandel, Drahtrechnung, Sturz Alecs, Vernichtung der Gewehre und Tötung Vics.

[Beleg 1](https://en.wikipedia.org/wiki/The_Man_from_Laramie).

### 25. Alles über Eva (1950)

Frage-ID: `CLA-L-006` · Wissensziel: `K-CLA-03-02` · Drama · leicht.

**Originalfrage:** „Alles über Eva“ (1950): Als was nähert sich Eve (Anne Baxter) zunächst Margo (Bette Davis)?

- **A:** Als unbekannte Halbschwester
- **B:** Als hingebungsvolle Bewunderin **✓ richtig**
- **C:** Als konkurrierende Theaterdirektorin
- **D:** Als beauftragte Steuerprüferin

**Kurzantwort bisher:** Eve (Anne Baxter) stellt sich Margo (Bette Davis) als besonders treuer Fan vor.

**Vertiefung bisher (angezeigt):** Eve (Anne Baxter) gewinnt Zugang, indem sie anderen eine angenehme Rolle anbietet: Sie dürfen großzügig sein und ihr eigenes Talent bewundert sehen. Für Margo (Bette Davis) wirkt die Hilfe zunächst wie ein Geschenk. Die besondere Gefahr liegt darin, dass die Grenzüberschreitung als Dankbarkeit auftritt und deshalb schwer zurückzuweisen ist, ohne selbst herzlos oder eitel zu erscheinen.

**Merksatz bisher:** Eves (Anne Baxter) Eintrittskarte ist Bewunderung.

**Urteil:** Überarbeiten. An die Stelle einer allgemeinen Analyse von Dankbarkeit tritt Eves tatsächlich erzählte Geschichte und ihr Weg ins Haus.

**Wissensziel beibehalten:** Eves ersten Auftritt als Fan erkennen

**Neue vollständige Komposition:** „Alles über Eva“ (1950): Als was nähert sich Eve (Anne Baxter) zunächst Margo (Bette Davis)?

- **A:** Als entfernte Verwandte
- **B:** Als hingebungsvolle Bewunderin **✓ richtig**
- **C:** Als Bewerberin um eine Nebenrolle
- **D:** Als Vertreterin eines Theatermagazins

**Kurzantwort beibehalten:** Eve (Anne Baxter) stellt sich Margo (Bette Davis) als besonders treuer Fan vor.

**Vertiefung neu:** Eve (Anne Baxter) erzählt von einem entbehrungsreichen Leben und einem im Krieg gefallenen Ehemann. Margo (Bette Davis) nimmt die scheinbar bescheidene Bewunderin daraufhin als Helferin bei sich auf. Aus der Nähe zum Star gewinnt Eve später Zugang zu dessen Bühne und Umfeld. Ihre rührende Lebensgeschichte erweist sich schließlich als erfunden.

**Merksatz beibehalten:** Eves (Anne Baxter) Eintrittskarte ist Bewunderung.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Eine familiäre Verwandtschaft behauptet sie dabei nicht. · C: Sie tritt anfangs nicht als Direktorin auf. · D: Eine Steuerprüfung dient nicht als Vorwand.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: erfundene Witwengeschichte, Karen als Vermittlerin und spätere Helferin, Addisons Wissen über Gertrude Slescynski, Margos Rollenverzicht/Ehe.

[Beleg 1](https://en.wikipedia.org/wiki/All_About_Eve).

### 26. Alles über Eva (1950)

Frage-ID: `CLA-M-006` · Wissensziel: `K-CLA-03-04` · Drama · mittel.

**Originalfrage:** „Alles über Eva“ (1950): Wer ermöglicht Eve (Anne Baxter) den ersten persönlichen Zugang zu Margo (Bette Davis)?

- **A:** Phoebe
- **B:** Karen Richards **✓ richtig**
- **C:** Bill Simpson
- **D:** Addison DeWitt

**Kurzantwort bisher:** Karen (Celeste Holm) stellt Eve (Anne Baxter) ihrer Freundin Margo (Bette Davis) vor.

**Vertiefung bisher (angezeigt):** Karen (Celeste Holm) handelt zunächst aus Mitgefühl und glaubt, zwei Menschen etwas Gutes zu tun. Dass ihre Vermittlung später Folgen hat, macht sie zu mehr als einer Randfigur. Eve (Anne Baxter) nutzt ein bereits bestehendes Vertrauensverhältnis. Der Film zeigt damit eine soziale Schwachstelle: Freundlichkeit kann zur Eintrittskarte werden, wenn niemand die erzählte Bedürftigkeit genauer hinterfragt.

**Merksatz bisher:** Karen (Celeste Holm) öffnet Eve (Anne Baxter) die Tür zu Margo (Bette Davis).

**Urteil:** Überarbeiten. Die Vermittlerin erhält eine konkrete Rolle im weiteren Verlauf. Das erklärt mehr als die vorherige allgemeine Warnung vor ausgenutzter Freundlichkeit.

**Wissensziel beibehalten:** Karens Vermittlung und spätere Beteiligung einordnen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Karen (Celeste Holm) stellt Eve (Anne Baxter) ihrer Freundin Margo (Bette Davis) vor.

**Vertiefung neu:** Karen Richards (Celeste Holm), die Frau des Dramatikers Lloyd (Hugh Marlowe), bringt Eve (Anne Baxter) hinter die Bühne zu ihrer Freundin Margo (Bette Davis). Später hilft sie Eve noch einmal: Sie sorgt dafür, dass Margo eine Vorstellung verpasst und die junge Zweitbesetzung auftreten kann. Eve benutzt diese Hilfe schließlich, um Karen unter Druck zu setzen.

**Merksatz beibehalten:** Karen (Celeste Holm) öffnet Eve (Anne Baxter) die Tür zu Margo (Bette Davis).

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Phoebe (Barbara Bates) tritt erst gegen Ende als neue Bewunderin auf. · C: Bill (Gary Merrill) stellt den ersten Kontakt nicht her. · D: Addison (George Sanders) wird später wichtig, ist aber nicht diese erste Vermittlungsperson.

**Antwortfeedback neu:** A: Phoebe (Barbara Bates) tritt erst gegen Ende als neue Bewunderin auf.

**Quellenprüfung:** Handlung und Besetzung: erfundene Witwengeschichte, Karen als Vermittlerin und spätere Helferin, Addisons Wissen über Gertrude Slescynski, Margos Rollenverzicht/Ehe.

[Beleg 1](https://en.wikipedia.org/wiki/All_About_Eve).

### 27. Alles über Eva (1950)

Frage-ID: `CLA-S-005` · Wissensziel: `K-CLA-03-05` · Drama · schwer.

**Originalfrage:** „Alles über Eva“ (1950): Wodurch gewinnt Addison (George Sanders) entscheidende Macht über Eve (Anne Baxter)?

- **A:** Er kennt die erfundene Vorgeschichte hinter ihrem Auftreten. **✓ richtig**
- **B:** Er ist Eves heimlicher Vater.
- **C:** Er besitzt Margos gesamten Theatervertrag.
- **D:** Er hat ihren Preis eigenhändig gestiftet.

**Kurzantwort bisher:** Addison (George Sanders) entlarvt Eves (Anne Baxter) erfundene Biografie und nutzt dieses Wissen zur Kontrolle.

**Vertiefung bisher (angezeigt):** Eve (Anne Baxter) ist darin geübt, die Bedürfnisse anderer zu erkennen und für ihren Aufstieg einzusetzen. Addison (George Sanders) begegnet ihr mit einer verwandten Fähigkeit, aber größerer Erfahrung. Die Enthüllung bedeutet deshalb keine einfache Wiederherstellung von Gerechtigkeit. Ihre Täuschung endet in einem neuen Abhängigkeitsverhältnis, in dem jemand anderes über die verwundbare Stelle ihrer Karriere verfügt.

**Merksatz bisher:** Addison (George Sanders) kennt Eves (Anne Baxter) erfundene Geschichte.

**Urteil:** Überarbeiten. Die behauptete erfundene Biografie wird erstmals mit überprüfbaren Einzelheiten belegt. Die richtige Antwort bleibt auf den größeren Sachverhalt gerichtet.

**Wissensziel beibehalten:** Addisons Druckmittel gegen Eve konkret kennen

**Neue vollständige Komposition:** „Alles über Eva“ (1950): Wodurch gewinnt Addison (George Sanders) entscheidende Macht über Eve (Anne Baxter)?

- **A:** Er kennt die erfundene Vorgeschichte hinter ihrem Auftreten. **✓ richtig**
- **B:** Er hat Belege für einen Betrug bei der Preisvergabe.
- **C:** Er kann ihren Vertrag als Zweitbesetzung kündigen.
- **D:** Er besitzt die Rechte an ihrem nächsten Theaterstück.

**Kurzantwort beibehalten:** Addison (George Sanders) entlarvt Eves (Anne Baxter) erfundene Biografie und nutzt dieses Wissen zur Kontrolle.

**Vertiefung neu:** Addison (George Sanders) hat herausgefunden, dass Eve (Anne Baxter) weder verheiratet war noch einen Mann im Krieg verloren hat. Auch ihr Name ist angenommen; tatsächlich heißt sie Gertrude Slescynski. Als sie ihm ihre Pläne für Lloyd (Hugh Marlowe) eröffnet, benutzt er dieses Wissen zur Erpressung und beansprucht die Kontrolle über ihre weitere Karriere.

**Merksatz beibehalten:** Addison (George Sanders) kennt Eves (Anne Baxter) erfundene Geschichte.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** B: Eine Vaterschaft wird nicht enthüllt. · C: Margos (Bette Davis) Vertrag ist nicht das entscheidende Druckmittel. · D: Die Stiftung des Preises begründet seine Macht nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: erfundene Witwengeschichte, Karen als Vermittlerin und spätere Helferin, Addisons Wissen über Gertrude Slescynski, Margos Rollenverzicht/Ehe.

[Beleg 1](https://en.wikipedia.org/wiki/All_About_Eve).

### 28. Alles über Eva (1950)

Frage-ID: `CLA-L-005` · Wissensziel: `K-CLA-03-01` · Drama · leicht.

**Originalfrage:** „Alles über Eva“ (1950): Wer spielt den etablierten Theaterstar Margo Channing?

- **A:** Bette Davis **✓ richtig**
- **B:** Katharine Hepburn
- **C:** Gloria Swanson
- **D:** Joan Crawford

**Kurzantwort bisher:** Bette Davis spielt Margo Channing.

**Vertiefung bisher (angezeigt):** Margo (Bette Davis) beherrscht den öffentlichen Auftritt, fühlt sich privat aber keineswegs unangreifbar. Die Figur verbindet Witz und Schärfe mit der Angst, ersetzt zu werden. Das macht ihre Abwehr gegen die junge Bewunderin doppeldeutig: Sie kann verletzend wirken und trotzdem etwas wahrnehmen, das höflichere Menschen in ihrem Umfeld zunächst nicht erkennen wollen.

**Merksatz bisher:** Margo Channing: Bette Davis im Theatermilieu.

**Urteil:** Überarbeiten. Die Entwicklung Margos ergänzt die Besetzungsantwort. Ein Produktionsumstand über eine vorher vorgesehene Darstellerin wird nicht ohne zusätzlichen Beleg eingefügt.

**Wissensziel beibehalten:** Bette Davis als Margo Channing erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Bette Davis spielt Margo Channing.

**Vertiefung neu:** Bette Davis spielt einen etablierten Star, der auf der Bühne weiterhin junge Frauen verkörpern soll und seine Austauschbarkeit fürchtet. Die Nähe der ehrgeizigen Eve (Anne Baxter) verschärft diese Angst. Später verzichtet Margo bewusst auf die junge Hauptrolle in Lloyds (Hugh Marlowe) neuem Stück und entscheidet sich für die Ehe mit Bill (Gary Merrill).

**Merksatz beibehalten:** Margo Channing: Bette Davis im Theatermilieu.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** C: Gloria Swanson spielt nicht Margo (Bette Davis) Channing. · D: Joan Crawford ist hier nicht Margo (Bette Davis).

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung: erfundene Witwengeschichte, Karen als Vermittlerin und spätere Helferin, Addisons Wissen über Gertrude Slescynski, Margos Rollenverzicht/Ehe.

[Beleg 1](https://en.wikipedia.org/wiki/All_About_Eve).

### 29. Parade im Rampenlicht (1933)

Frage-ID: `G100-20261008-MUSIK-007-L1` · Wissensziel: `K-G100-20261008-MUSIK-007-L1` · Musik · leicht.

**Originalfrage:** Was produziert Chester Kent (James Cagney) in „Parade im Rampenlicht“ nach dem Einbruch seines bisherigen Theatergeschäfts?

- **A:** Tourneerevuen in wechselnden Varietétheatern
- **B:** Musikalische Radiosendungen vor dem Abendprogramm
- **C:** Gefilmte Musiknummern für das Kinovorprogramm
- **D:** Kurze Live-Shows vor Kinovorführungen **✓ richtig**

**Kurzantwort bisher:** Kent stellt Live-Prologe für die Kinovorführung her.

**Vertiefung bisher (angezeigt):** Chester Kent (James Cagney) verliert durch den Erfolg des Tonfilms die Grundlage seines bisherigen Bühnenbetriebs. Er organisiert stattdessen kurze Live-Produktionen, die in Kinos vor dem eigentlichen Film gezeigt werden. Damit nutzt er die vorhandenen Bühnenräume der Häuser. Der neue Betrieb verbindet Theaterarbeit und Filmvorführung, verlangt aber ständig frische, zugleich wirtschaftlich herstellbare Nummern. Die Konkurrenz um Ideen wächst dadurch ebenso wie der Druck auf die Mitarbeitenden.

**Merksatz bisher:** Live-Prologe verbinden Bühnenproduktion und Kinoprogramm.

**Urteil:** Überarbeiten. Die historische Geschäftsform ist schon gut erklärt. Das belegte Kettenprinzip ersetzt Wiederholungen über allgemeinen Arbeitsdruck.

**Wissensziel beibehalten:** Das Geschäftsmodell der Kino-Prologe verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Kent stellt Live-Prologe für die Kinovorführung her.

**Vertiefung neu:** Der Tonfilm verdrängt Chester Kents (James Cagney) bisherige Bühnenproduktionen. Er übernimmt das Prinzip der Ladenkette: Wiederholt einsetzbare kurze Shows sollen die Kosten pro Kino senken. Diese Live-Prologe stehen vor dem Hauptfilm auf der Kinobühne. Für einen großen Auftrag muss Kent schließlich drei besonders aufwendige Nummern an einem Abend präsentieren.

**Merksatz beibehalten:** Live-Prologe verbinden Bühnenproduktion und Kinoprogramm.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Tourneerevuen in Varietétheatern sind nicht sein neues Geschäftsmodell. · B: Radiosendungen sind nicht der neue Produktionszweig. · C: Die Prologe werden live auf der Kinobühne aufgeführt, nicht als kurze Filme.

**Antwortfeedback neu:** C: Die Prologe werden live auf der Kinobühne aufgeführt, nicht als kurze Filme.

**Quellenprüfung:** Handlung/Besetzung sowie LoC-Essay: Live-Prologe und Kettenprinzip, Ideendiebstahl/abgeschottete Proben, Fain/Kahal gegenüber Warren/Dubin, Berkeley, Cagneys Varietéherkunft und Einspringen für betrunkenen Darsteller.

[Beleg 1](https://en.wikipedia.org/wiki/Footlight_Parade) · [Beleg 2](https://www.loc.gov/static/programs/national-film-preservation-board/documents/footlight_parade.pdf).

### 30. Parade im Rampenlicht (1933)

Frage-ID: `G100-20261008-MUSIK-007-M1` · Wissensziel: `K-G100-20261008-MUSIK-007-M1` · Musik · mittel.

**Originalfrage:** Warum schließt Chester Kent (James Cagney) in „Parade im Rampenlicht“ seine Mitarbeiter während der entscheidenden Proben im Studio ein?

- **A:** Um die unfertigen Nummern vor der Presse geheim zu halten
- **B:** Um das Weitergeben seiner neuen Ideen zu verhindern **✓ richtig**
- **C:** Um die Gruppe vor einem Streik der Theater zu schützen
- **D:** Um sie für kurzfristige Umbesetzungen verfügbar zu halten

**Kurzantwort bisher:** Die Abschottung soll den Ideendiebstahl stoppen.

**Vertiefung bisher (angezeigt):** Ein Konkurrent bringt Chester Kents (James Cagney) neue Ideen heraus, bevor sein eigener Betrieb sie nutzen kann. Kent vermutet daher einen Informanten in den eigenen Reihen. Vor der entscheidenden Präsentation lässt er die Mitarbeitenden im Studio bleiben und schirmt die Proben ab. Die Maßnahme richtet sich gegen die Weitergabe des Materials. Der Zeitdruck wird dadurch mit einem Vertrauensproblem verbunden, das innerhalb der Produktionsgemeinschaft gelöst werden muss.

**Merksatz bisher:** Die abgeschotteten Proben sollen den Abfluss der Ideen verhindern.

**Urteil:** Überarbeiten. Das konkrete Konkurrenzproblem erklärt die ungewöhnliche Maßnahme; kein allgemeiner Schluss über Geheimhaltung nötig.

**Wissensziel beibehalten:** Die eingeschlossene Probe als Schutz vor Ideendiebstahl erklären

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die Abschottung soll den Ideendiebstahl stoppen.

**Vertiefung neu:** Ein Konkurrent bringt Kents (James Cagney) Einfälle auf die Bühne, bevor er selbst sie nutzen kann. Für die entscheidende Vorführung vor dem Kinokettenbesitzer lässt Kent deshalb das Ensemble im Betrieb bleiben und unter Ausschluss der Außenwelt proben. Die drei neuen Prologe sollen diesmal bis zu ihrer Premiere geheim bleiben.

**Merksatz beibehalten:** Die abgeschotteten Proben sollen den Abfluss der Ideen verhindern.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Presseberichte über unfertige Nummern sind nicht der Anlass. · C: Ein Theaterstreik ist nicht der Grund. · D: Umbesetzungen begründen die Abschottung nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung sowie LoC-Essay: Live-Prologe und Kettenprinzip, Ideendiebstahl/abgeschottete Proben, Fain/Kahal gegenüber Warren/Dubin, Berkeley, Cagneys Varietéherkunft und Einspringen für betrunkenen Darsteller.

[Beleg 1](https://en.wikipedia.org/wiki/Footlight_Parade) · [Beleg 2](https://www.loc.gov/static/programs/national-film-preservation-board/documents/footlight_parade.pdf).

### 31. Parade im Rampenlicht (1933)

Frage-ID: `G100-20261008-MUSIK-007-S1` · Wissensziel: `K-G100-20261008-MUSIK-007-S1` · Musik · schwer.

**Originalfrage:** Welches Duo schrieb Musik und Text zu „By a Waterfall“ in „Parade im Rampenlicht“?

- **A:** Harry Warren und Al Dubin
- **B:** Arthur Schwartz und Howard Dietz
- **C:** Richard Rodgers und Lorenz Hart
- **D:** Sammy Fain und Irving Kahal **✓ richtig**

**Kurzantwort bisher:** By a Waterfall stammt von Sammy Fain und Irving Kahal.

**Vertiefung bisher (angezeigt):** Sammy Fain komponierte By a Waterfall, Irving Kahal schrieb den Text. Der vom LoC veröffentlichte Essay unterscheidet diese Zusammenarbeit von Harry Warren und Al Dubin, die unter anderem Honeymoon Hotel und Shanghai Lil beitrugen. Der Film hat somit nicht nur ein einziges Liedteam. Die genaue Zuordnung zu einer Nummer macht eine musikalische Arbeitsaufteilung sichtbar, die sich weder aus dem Hauptregiecredit noch allein aus dem Namen des Tanzgestalters ergibt.

**Merksatz bisher:** By a Waterfall: Fain und Kahal, nicht Warren und Dubin.

**Urteil:** Überarbeiten. Die richtige Nennung bleibt. Die Ergänzung hilft, zwei Autorenpaare und den Choreografen auseinanderzuhalten, statt nur die Quellenautorität zu erwähnen.

**Wissensziel beibehalten:** Die Urheber von By a Waterfall unterscheiden

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** By a Waterfall stammt von Sammy Fain und Irving Kahal.

**Vertiefung neu:** Die Musik zu „By a Waterfall“ stammt von Sammy Fain, der Text von Irving Kahal. Harry Warren und Al Dubin schrieben dagegen „Honeymoon Hotel“ und „Shanghai Lil“. Die Wasserbilder und geometrischen Schwimmerformationen gestaltete Busby Berkeley. Songautoren und Inszenierung der Nummer sind also getrennte Beiträge.

**Merksatz beibehalten:** By a Waterfall: Fain und Kahal, nicht Warren und Dubin.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Warren und Dubin schrieben andere Nummern dieses Films. · B: Schwartz und Dietz tragen diesen Liedcredit nicht. · C: Rodgers und Hart sind nicht das Team dieser Nummer.

**Antwortfeedback neu:** A: Warren und Dubin schrieben „Honeymoon Hotel“ und „Shanghai Lil“.

**Quellenprüfung:** Handlung/Besetzung sowie LoC-Essay: Live-Prologe und Kettenprinzip, Ideendiebstahl/abgeschottete Proben, Fain/Kahal gegenüber Warren/Dubin, Berkeley, Cagneys Varietéherkunft und Einspringen für betrunkenen Darsteller.

[Beleg 1](https://en.wikipedia.org/wiki/Footlight_Parade) · [Beleg 2](https://www.loc.gov/static/programs/national-film-preservation-board/documents/footlight_parade.pdf).

### 32. Parade im Rampenlicht (1933)

Frage-ID: `G100-20261008-MUSIK-007-M2` · Wissensziel: `K-G100-20261008-MUSIK-007-M2` · Musik · mittel.

**Originalfrage:** Warum übernimmt Chester Kent (James Cagney) in „Parade im Rampenlicht“ selbst die männliche Hauptrolle der letzten Präsentation?

- **A:** Der vorgesehene Darsteller verliert seine Stimme
- **B:** Der vorgesehene Darsteller bricht sich den Knöchel
- **C:** Der vorgesehene Darsteller ist betrunken **✓ richtig**
- **D:** Der vorgesehene Darsteller kündigt wegen des Honorars

**Kurzantwort bisher:** Kent springt für den betrunkenen Darsteller ein.

**Vertiefung bisher (angezeigt):** Bei der entscheidenden Vorstellung kann der vorgesehene Hauptdarsteller wegen seiner Trunkenheit nicht auftreten. Chester Kent (James Cagney) übernimmt selbst und tanzt mit Bea Thorn (Ruby Keeler) in Shanghai Lil. Der Erfolg verlangt deshalb im letzten Moment mehr als seine bisherige organisatorische Arbeit. Die Figur muss ihre eigene Bühnenfähigkeit einsetzen, um den Auftrag zu retten. Die Handlung führt den gestressten Produzenten unmittelbar in die Darbietung hinein, die er zuvor vorbereitet hat.

**Merksatz bisher:** Der Produzent ersetzt im letzten Moment einen betrunkenen Darsteller.

**Urteil:** Überarbeiten. Der Ausfall bleibt die Antwort. Der belegte Bühnenhintergrund Cagneys ergänzt genau diesen Auftritt statt eine beliebige Anekdote anzuhängen.

**Wissensziel beibehalten:** Kents Einspringen in Shanghai Lil begründen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Kent springt für den betrunkenen Darsteller ein.

**Vertiefung neu:** Der vorgesehene Darsteller ist betrunken, und Kent (James Cagney) übernimmt selbst die Rolle in „Shanghai Lil“. Damit tritt der Organisator plötzlich als Tänzer auf. Auch für das damalige Publikum war das bemerkenswert: Cagney war vor allem als harter Gangsterdarsteller bekannt, hatte aber seine Karriere auf der Varietébühne begonnen.

**Merksatz beibehalten:** Der Produzent ersetzt im letzten Moment einen betrunkenen Darsteller.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Stimmverlust ist nicht der Ausfallgrund. · B: Ein Knöchelbruch macht diesen Einsatz nicht nötig. · D: Ein Honorarstreit ist nicht der Anlass.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung sowie LoC-Essay: Live-Prologe und Kettenprinzip, Ideendiebstahl/abgeschottete Proben, Fain/Kahal gegenüber Warren/Dubin, Berkeley, Cagneys Varietéherkunft und Einspringen für betrunkenen Darsteller.

[Beleg 1](https://en.wikipedia.org/wiki/Footlight_Parade) · [Beleg 2](https://www.loc.gov/static/programs/national-film-preservation-board/documents/footlight_parade.pdf).

### 33. Wo die wilden Menschen jagen (2016)

Frage-ID: `F240-20261006-013-L1` · Wissensziel: `K-F240-20261006-013-L1` · Abenteuer · leicht.

**Originalfrage:** Welche Beziehung haben Ricky (Julian Dennison) und Hec (Sam Neill) zu Beginn von „Wo die wilden Menschen jagen“?

- **A:** Ricky ist der neu aufgenommene Pflegesohn in Hecs Familie. **✓ richtig**
- **B:** Ricky ist Hecs Enkel und zieht nach dem Tod seiner Eltern zu ihm.
- **C:** Hec ist der Jugendbetreuer, der Ricky auf einer Bewährungsfahrt begleitet.
- **D:** Ricky lebt als Nachbarskind auf einem nahe gelegenen Hof.

**Kurzantwort bisher:** Ricky kommt als Pflegekind zu Bella und Hec.

**Vertiefung bisher (angezeigt):** Bella (Rima Te Wiata) gewinnt schnell Rickys Vertrauen. Hec bleibt zunächst distanziert. Als Bella stirbt, müssen sich die beiden ohne die vermittelnde Person miteinander auseinandersetzen.

**Merksatz bisher:** Bella nimmt Ricky auf; ihr Tod bringt Ricky und Hec allein zusammen.

**Urteil:** Überarbeiten. Die Familienbeziehung wird über Bellas Bedeutung verständlich. Der spätere Zusammenhalt erscheint als Entwicklung, nicht als schon bestehende Nähe.

**Wissensziel beibehalten:** Rickys anfängliche Familienposition erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Ricky kommt als Pflegekind zu Bella und Hec.

**Vertiefung neu:** Ricky (Julian Dennison) kommt als Pflegekind zu Bella (Rima Te Wiata) und ihrem Mann Hec (Sam Neill) auf die Farm. Bella nimmt ihn herzlich auf, während Hec Abstand hält. Nach ihrem plötzlichen Tod fehlt gerade die Person, die zwischen den beiden vermittelt hat. Erst die gemeinsame Flucht bringt den Jungen und seinen widerwilligen Pflegeonkel näher zusammen.

**Merksatz beibehalten:** Bella nimmt Ricky auf; ihr Tod bringt Ricky und Hec allein zusammen.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Bella und Hec nehmen Ricky als Pflegekind auf. · B: Er kommt als Pflegekind in die Familie und ist nicht Hecs Enkel. · C: Hec ist kein dienstlicher Jugendbetreuer auf einer Bewährungsfahrt. · D: Die beiden werden durch die neue Pflegefamilie verbunden, nicht nur als Nachbarn.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Pflegefamilie, Bellas Tod, Flucht und Verletzung Hecs, Sams Handyverbindung und Geländewagen. Vorlage Wild Pork and Watercress und Waititis seit 2005 entwickelte Adaption; NZFC bestätigt Vorlagen- und Autorenbezug.

[Beleg 1](https://en.wikipedia.org/wiki/Hunt_for_the_Wilderpeople) · [Beleg 2](https://www.nzfilm.co.nz/films/hunt-wilderpeople).

### 34. Wo die wilden Menschen jagen (2016)

Frage-ID: `F240-20261006-013-M1` · Wissensziel: `K-F240-20261006-013-M1` · Abenteuer · mittel.

**Originalfrage:** Warum versteckt sich Ricky (Julian Dennison) nach Bellas (Rima Te Wiata) Tod in „Wo die wilden Menschen jagen“?

- **A:** Er fürchtet eine Bestrafung wegen eines Diebstahls im Dorf.
- **B:** Er will allein die Reise zu einem versprochenen Verwandten antreten.
- **C:** Er will nicht erneut von der Jugendfürsorge umplatziert werden. **✓ richtig**
- **D:** Er glaubt, Hec werde ihn nach einem Streit ausliefern.

**Kurzantwort bisher:** Ricky möchte bei Hec bleiben und eine neue Unterbringung verhindern.

**Vertiefung bisher (angezeigt):** Paula (Rachel House) vertritt die Jugendfürsorge. Ihre angekündigte Entscheidung löst Rickys Flucht aus. Was Ricky als Versuch versteht, eine Beziehung zu erhalten, wird bald als Entführung durch Hec (Sam Neill) behandelt.

**Merksatz bisher:** Ricky flieht vor der nächsten Unterbringung, nicht vor Hec.

**Urteil:** Überarbeiten. Der Text erzählt, wie aus dem Versuch, eine neue Unterbringung zu vermeiden, eine Fahndung nach beiden entsteht.

**Wissensziel beibehalten:** Rickys Flucht nach Bellas Tod begründen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Ricky möchte bei Hec bleiben und eine neue Unterbringung verhindern.

**Vertiefung neu:** Nach Bellas (Rima Te Wiata) Tod soll Ricky (Julian Dennison) wieder abgeholt werden. Er täuscht seinen Tod vor und läuft in den Busch. Hec (Sam Neill) findet ihn, verletzt sich aber, sodass beide länger dort bleiben müssen. Die Behörden deuten das gemeinsame Verschwinden als Entführung und beginnen eine große Suche.

**Merksatz beibehalten:** Ricky flieht vor der nächsten Unterbringung, nicht vor Hec.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die drohende erneute Umplatzierung durch die Fürsorge treibt ihn an. · B: Ein verabredeter Verwandtenbesuch ist nicht der Anlass. · C: Ricky fürchtet die Rückkehr in das Fürsorgesystem. · D: Seine Flucht folgt Bellas Tod und der drohenden Umplatzierung, nicht einem solchen Streit.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Pflegefamilie, Bellas Tod, Flucht und Verletzung Hecs, Sams Handyverbindung und Geländewagen. Vorlage Wild Pork and Watercress und Waititis seit 2005 entwickelte Adaption; NZFC bestätigt Vorlagen- und Autorenbezug.

[Beleg 1](https://en.wikipedia.org/wiki/Hunt_for_the_Wilderpeople) · [Beleg 2](https://www.nzfilm.co.nz/films/hunt-wilderpeople).

### 35. Wo die wilden Menschen jagen (2016)

Frage-ID: `F240-20261006-013-S1` · Wissensziel: `K-F240-20261006-013-S1` · Abenteuer · schwer.

**Originalfrage:** Wie wird der Aufenthaltsort von Ricky (Julian Dennison) und Hec (Sam Neill) bei Psycho Sam (Rhys Darby) in „Wo die wilden Menschen jagen“ entdeckt?

- **A:** Sam verbindet Rickys Handy mit dem Internet. **✓ richtig**
- **B:** Ricky ruft vom Versteck aus eine Hilfsstelle an.
- **C:** Ein Nachbar erkennt die beiden und meldet sie.
- **D:** Hec benutzt eine Bankkarte in einem nahen Ort.

**Kurzantwort bisher:** Psycho Sam verbindet das Handy mit dem Internet.

**Vertiefung bisher (angezeigt):** Sam (Rhys Darby) lebt zurückgezogen und gibt den beiden Unterkunft. Trotzdem schafft die alltägliche Technik eine Verbindung zur Suche draußen. Das vermeintliche Versteck endet durch einen kleinen praktischen Handgriff.

**Merksatz bisher:** Sams Internetverbindung beendet das abgelegene Versteck.

**Urteil:** Überarbeiten. Die Technik wird ausdrücklich als Handyverbindung benannt. Die Kausalität ist belegt; keine erfundene Ortungssoftware ergänzen.

**Wissensziel beibehalten:** Die digitale Spur bei Psycho Sam kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort neu:** Sam verbindet Rickys Handy mit dem Internet und macht die Flüchtigen dadurch auffindbar.

**Vertiefung neu:** Monatelang sind Ricky (Julian Dennison) und Hec (Sam Neill) der Suche im Busch entkommen. Bei Psycho Sam (Rhys Darby) finden sie einen Schlafplatz. Ausgerechnet dessen Verbindung von Rickys Handy mit dem Internet verrät ihren Aufenthaltsort. Der nächste Fluchtversuch mit Sams rotem Geländewagen endet in der Konfrontation mit der Polizei.

**Merksatz beibehalten:** Sams Internetverbindung beendet das abgelegene Versteck.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die Internetverbindung des Handys verrät den Standort. · B: Sams Internetverbindung mit Rickys Handy verrät den Ort. · C: Keine Nachbarmeldung löst diese Entdeckung aus. · D: Eine Bankkartennutzung ist nicht die Spur zu Sams Versteck.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Pflegefamilie, Bellas Tod, Flucht und Verletzung Hecs, Sams Handyverbindung und Geländewagen. Vorlage Wild Pork and Watercress und Waititis seit 2005 entwickelte Adaption; NZFC bestätigt Vorlagen- und Autorenbezug.

[Beleg 1](https://en.wikipedia.org/wiki/Hunt_for_the_Wilderpeople) · [Beleg 2](https://www.nzfilm.co.nz/films/hunt-wilderpeople).

### 36. Wo die wilden Menschen jagen (2016)

Frage-ID: `F240-20261006-013-S2` · Wissensziel: `K-F240-20261006-013-S2` · Abenteuer · schwer.

**Originalfrage:** Auf welcher literarischen Vorlage beruht „Wo die wilden Menschen jagen“?

- **A:** Alan Duff: Once Were Warriors
- **B:** Barry Crumps Wild Pork and Watercress **✓ richtig**
- **C:** Witi Ihimaera: The Whale Rider
- **D:** Keri Hulme: The Bone People

**Kurzantwort bisher:** Die Vorlage ist Barry Crumps „Wild Pork and Watercress“.

**Vertiefung bisher (angezeigt):** Die New Zealand Film Commission beschreibt, dass Waititi zunächst als beauftragter Autor an der Adaption arbeitete. Später führte er selbst Regie. Die Romanverfilmung verbindet damit fremde Vorlage und mehrere eigene Filmaufgaben.

**Merksatz bisher:** Crump liefert den Roman; Waititi entwickelt die Adaption und inszeniert sie.

**Urteil:** Überarbeiten. Die Vorlagenfrage bleibt eigenständig. Der konkrete Adaptionsverlauf ergänzt sie; Hinweise auf die prüfende Institution und auf falsche Optionen gehören nicht in die Vertiefung.

**Wissensziel beibehalten:** Barry Crumps Roman als Vorlage erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die Vorlage ist Barry Crumps „Wild Pork and Watercress“.

**Vertiefung neu:** Barry Crumps „Wild Pork and Watercress“ liefert die Grundlage für die gemeinsame Flucht eines Jungen und eines älteren Mannes durch Neuseelands Busch. Taika Waititi begann 2005 mit der Adaption und schrieb mehrere Fassungen. Seine frühen Entwürfe hielten sich enger an den Roman, spätere entfernten sich davon. Schließlich übernahm er auch die Regie.

**Merksatz beibehalten:** Crump liefert den Roman; Waititi entwickelt die Adaption und inszeniert sie.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Duffs Roman ist eine andere neuseeländische Geschichte. · B: Crump schrieb die Vorlage über die Flucht in den Busch. · C: Ihimaeras Roman ist nicht diese Vorlage. · D: Hulmes Roman wurde hier nicht adaptiert.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Pflegefamilie, Bellas Tod, Flucht und Verletzung Hecs, Sams Handyverbindung und Geländewagen. Vorlage Wild Pork and Watercress und Waititis seit 2005 entwickelte Adaption; NZFC bestätigt Vorlagen- und Autorenbezug.

[Beleg 1](https://en.wikipedia.org/wiki/Hunt_for_the_Wilderpeople) · [Beleg 2](https://www.nzfilm.co.nz/films/hunt-wilderpeople).

### 37. Redbelt (2008)

Frage-ID: `E20261007-F-159-L1` · Wissensziel: `K-E20261007-F-159-L1` · Martial Arts & Asia-Film · leicht.

**Originalfrage:** Welche Kampfkunst unterrichtet Mike Terry (Chiwetel Ejiofor) in „Redbelt“?

- **A:** Taekwondo
- **B:** Kendo
- **C:** Capoeira
- **D:** Brasilianisches Jiu-Jitsu **✓ richtig**

**Kurzantwort bisher:** Mike Terry (Chiwetel Ejiofor) unterrichtet brasilianisches Jiu-Jitsu.

**Vertiefung bisher (angezeigt):** Mike Terry (Chiwetel Ejiofor) unterrichtet brasilianisches Jiu-Jitsu. Die Schule vermittelt Selbstverteidigung, während Wettkämpfe für ihn ein anderes Verhältnis zum Können bedeuten. Die Geschichte fragt deshalb nicht allein nach sportlichem Erfolg. Sie untersucht, ob ein Lehrer sein Verständnis der Disziplin unter finanziellem Druck tatsächlich bewahren kann.

**Merksatz bisher:** Mikes Schule dient der Selbstverteidigung.

**Urteil:** Überarbeiten. Die Kampfkunst bleibt klar benannt. Der Schulkosmos und der finanzielle Konflikt geben der Besetzungs- und Sportbezeichnung einen konkreten Filmbezug.

**Wissensziel beibehalten:** Mike Terrys Kampfkunst und Lehrverständnis kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Mike Terry (Chiwetel Ejiofor) unterrichtet brasilianisches Jiu-Jitsu.

**Vertiefung neu:** Mike Terry (Chiwetel Ejiofor) leitet eine kleine Schule für brasilianisches Jiu-Jitsu. Seine Übungen sollen Schüler darauf vorbereiten, auch aus einer nachteiligen Lage herauszukommen. Er versteht die Kampfkunst als Selbstverteidigung und lehnt bezahlte Wettkämpfe ab. Die Schule gerät jedoch in finanzielle Schwierigkeiten.

**Merksatz neu:** Mike Terry unterrichtet brasilianisches Jiu-Jitsu zur Selbstverteidigung.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Taekwondo ist nicht die unterrichtete Disziplin. · B: Kendo ist nicht Mikes Schule. · C: Capoeira ist nicht der Schwerpunkt.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Wikipedia-Handlung/Besetzung: BJJ, schwarze/weiße Kugeln und manipulierte Auswahl, Ricardo/Morisaki/Professor in der Schlussfolge, Joes Tod und Mikes Wettkampfablehnung. Tribeca: Mamets eigene Einordnung als Kampf- und Samurai-Film, kein zusätzlicher Beleg für Einzelheiten der Schlussfolge.

[Beleg 1](https://en.wikipedia.org/wiki/Redbelt) · [Beleg 2](https://tribecafilm.com/news/512c0f631c7d76d9a90006d0-world-premiere-of-david-m).

### 38. Redbelt (2008)

Frage-ID: `E20261007-F-159-M2` · Wissensziel: `K-E20261007-F-159-M2` · Martial Arts & Asia-Film · mittel.

**Originalfrage:** Welche Regel verwendet Mike Terry (Chiwetel Ejiofor) in „Redbelt“ für eine besondere Trainingsübung?

- **A:** Ein Würfel bestimmt die Dauer jedes Kampfes.
- **B:** Eine Karte verbietet dem Gewinner den nächsten Angriff.
- **C:** Eine schwarze Kugel weist einem Kämpfer eine Einschränkung zu. **✓ richtig**
- **D:** Ein Münzwurf wählt den Trainer als Gegner.

**Kurzantwort bisher:** Die schwarze Kugel weist einem Kämpfer eine Einschränkung zu.

**Vertiefung bisher (angezeigt):** Die schwarze Kugel weist einem Kämpfer eine Einschränkung zu. Die zufällige Bedingung soll Anpassungsfähigkeit trainieren. Lernen bedeutet für Mike Terry (Chiwetel Ejiofor), unter einem Nachteil einen Ausweg zu finden. Die Regel ist deshalb mehr als ein Spiel: Sie bringt sein Verständnis der Selbstverteidigung in eine konkrete Übung.

**Merksatz bisher:** Die schwarze Kugel fordert einen Ausweg aus dem Nachteil.

**Urteil:** Überarbeiten. Die Regel erhält ihren späteren Gegenpart. Der Text behauptet nicht, dass jede schwarze Kugel immer genau dieselbe Einschränkung auslöst.

**Wissensziel beibehalten:** Die schwarze Kugel als Trainingshandicap verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die schwarze Kugel weist einem Kämpfer eine Einschränkung zu.

**Vertiefung neu:** Vor dem Übungskampf ziehen die Kämpfer aus zwei weißen und einer schwarzen Kugel. Wer Schwarz zieht, muss mit einem Handicap antreten. Später übernehmen Veranstalter dieses Verfahren für bezahlte Kämpfe, manipulieren aber die Auswahl für ihre Wetten. Was im Unterricht den Umgang mit Nachteilen schulen soll, wird dadurch zum Instrument des Betrugs.

**Merksatz beibehalten:** Die schwarze Kugel fordert einen Ausweg aus dem Nachteil.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Ein Würfel bestimmt nicht die Kampfdauer. · B: Eine Karte ist nicht die Methode. · D: Ein Münzwurf wählt nicht den Trainer.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Wikipedia-Handlung/Besetzung: BJJ, schwarze/weiße Kugeln und manipulierte Auswahl, Ricardo/Morisaki/Professor in der Schlussfolge, Joes Tod und Mikes Wettkampfablehnung. Tribeca: Mamets eigene Einordnung als Kampf- und Samurai-Film, kein zusätzlicher Beleg für Einzelheiten der Schlussfolge.

[Beleg 1](https://en.wikipedia.org/wiki/Redbelt) · [Beleg 2](https://tribecafilm.com/news/512c0f631c7d76d9a90006d0-world-premiere-of-david-m).

### 39. Redbelt (2008)

Frage-ID: `E20261007-F-159-S2` · Wissensziel: `K-E20261007-F-159-S2` · Martial Arts & Asia-Film · schwer.

**Originalfrage:** Wer verleiht Mike Terry (Chiwetel Ejiofor) am Ende von „Redbelt“ den roten Gürtel?

- **A:** Der anwesende alte Kampfkunstmeister **✓ richtig**
- **B:** Der Veranstalter des manipulierten Turniers
- **C:** Der gerettete Hollywoodstar
- **D:** Der Versicherungsgutachter

**Kurzantwort bisher:** Der alte Kampfkunstmeister, gespielt von Dan Inosanto, verleiht Mike Terry (Chiwetel Ejiofor) den roten Gürtel.

**Vertiefung bisher (angezeigt):** Der alte Kampfkunstmeister, gespielt von Dan Inosanto, verleiht Mike Terry (Chiwetel Ejiofor) den roten Gürtel. Anerkennung kommt damit aus der Tradition seiner Disziplin. Der Ausgang belohnt nicht einfach einen offiziellen Turniersieg. Der Meister erkennt ein Verhalten an, das Mike gegen die kommerzielle Ordnung der Veranstaltung gezeigt hat.

**Merksatz bisher:** Die Anerkennung kommt vom Meister statt aus der Turnierwertung.

**Urteil:** Überarbeiten. Die genaue Schlussfolge erklärt die naheliegende Verwechslung. Die Optionen sind nun durchweg anwesende Figuren statt eines beliebigen Versicherungsexperten.

**Wissensziel beibehalten:** Den Professor als Überbringer des roten Gürtels erkennen

**Neue vollständige Komposition:** Wer verleiht Mike Terry (Chiwetel Ejiofor) am Ende von „Redbelt“ den roten Gürtel?

- **A:** Der alte Meister, genannt der Professor **✓ richtig**
- **B:** Der Kampfveranstalter Marty Brown
- **C:** Der Hollywoodstar Chet Frank
- **D:** Der japanische Kämpfer Morisaki

**Kurzantwort beibehalten:** Der alte Kampfkunstmeister, gespielt von Dan Inosanto, verleiht Mike Terry (Chiwetel Ejiofor) den roten Gürtel.

**Vertiefung neu:** Nach Mikes (Chiwetel Ejiofor) Kampf gegen Ricardo (John Machado) bietet ihm zunächst Morisaki (Enson Inoue) seinen wertvollen Gürtel an. Danach tritt der Professor (Dan Inosanto) selbst hinzu und überreicht den roten Gürtel. Die beiden unmittelbar aufeinanderfolgenden Ehrungen stammen also von verschiedenen Männern.

**Merksatz neu:** Morisaki bietet seinen Gürtel an; den roten übergibt der Professor.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** B: Der Veranstalter verleiht den Gürtel nicht. · C: Der Hollywoodstar ist nicht der Verleiher. · D: Ein Versicherungsgutachter übernimmt diese Rolle nicht.

**Antwortfeedback neu:** D: Morisaki bietet zunächst seinen eigenen Gürtel an; den roten überreicht danach der Professor.

**Quellenprüfung:** Wikipedia-Handlung/Besetzung: BJJ, schwarze/weiße Kugeln und manipulierte Auswahl, Ricardo/Morisaki/Professor in der Schlussfolge, Joes Tod und Mikes Wettkampfablehnung. Tribeca: Mamets eigene Einordnung als Kampf- und Samurai-Film, kein zusätzlicher Beleg für Einzelheiten der Schlussfolge.

[Beleg 1](https://en.wikipedia.org/wiki/Redbelt) · [Beleg 2](https://tribecafilm.com/news/512c0f631c7d76d9a90006d0-world-premiere-of-david-m).

### 40. Redbelt (2008)

Frage-ID: `E20261007-F-159-L2` · Wissensziel: `K-E20261007-F-159-L2` · Martial Arts & Asia-Film · leicht.

**Originalfrage:** Warum lehnt Mike Terry (Chiwetel Ejiofor) in „Redbelt“ zunächst bezahlte Wettkämpfe ab?

- **A:** Er hält Konkurrenzkämpfe für eine Schwächung des Kämpfers. **✓ richtig**
- **B:** Er hat eine lebenslange Verbandssperre.
- **C:** Er will zunächst seine verletzte Hand ausheilen lassen.
- **D:** Er möchte sich ausschließlich auf die Schulgründung konzentrieren.

**Kurzantwort bisher:** Mike Terry (Chiwetel Ejiofor) lehnt Wettkämpfe aus Überzeugung ab.

**Vertiefung bisher (angezeigt):** Mike Terry (Chiwetel Ejiofor) lehnt Wettkämpfe aus Überzeugung ab. Eine Einschränkung von außen zwingt ihn nicht dazu. Das macht seine spätere Teilnahme zum Konflikt mit einer eigenen Regel. Geldnot kann ihn zu einer Entscheidung bewegen, die er aus der Sicht seines Unterrichts gerade vermeiden wollte.

**Merksatz bisher:** Die selbst gesetzte Regel gerät unter Geldnot unter Druck.

**Urteil:** Überarbeiten. Die Haltung bekommt eine Prüfung durch spätere Ereignisse. Aus einer statischen Charakterbeschreibung wird ein nachvollziehbarer Entscheidungsbogen.

**Wissensziel beibehalten:** Mikes Ablehnung bezahlter Wettkämpfe begründen

**Neue vollständige Komposition:** Warum lehnt Mike Terry (Chiwetel Ejiofor) in „Redbelt“ zunächst bezahlte Wettkämpfe ab?

- **A:** Er glaubt, dass Wettkampfdenken einen Kämpfer schwächt. **✓ richtig**
- **B:** Er will seine Schüler nicht als Zuschauer eines Kampfes zulassen.
- **C:** Er hält nur Kämpfe ohne Preisgeld für sportlich zulässig.
- **D:** Er lehnt die vom Veranstalter verlangte Gewichtsklasse ab.

**Kurzantwort beibehalten:** Mike Terry (Chiwetel Ejiofor) lehnt Wettkämpfe aus Überzeugung ab.

**Vertiefung neu:** Mike (Chiwetel Ejiofor) lehnt das Angebot eines bezahlten Kampfes zunächst ab, obwohl seine Schule Geld braucht. Er hält Wettkämpfe für unehrenhaft und glaubt, dass sie den Kämpfer schwächen. Erst der Tod seines Schülers Joe (Max Martini) und die Not von dessen Familie bringen ihn dazu, doch anzutreten – kurz bevor er die Manipulation des Turniers entdeckt.

**Merksatz neu:** Mike hält Wettkämpfe für eine Schwächung des Kämpfers.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** B: Mike begründet die Ablehnung grundsätzlich mit seiner Haltung zur Konkurrenz, nicht mit einer Sperre. · C: Seine Überzeugung gegen Konkurrenzkämpfe ist keine vorübergehende Verletzungspause. · D: Seine Ablehnung geht über eine zeitweilige Konzentration auf den Schulaufbau hinaus.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Wikipedia-Handlung/Besetzung: BJJ, schwarze/weiße Kugeln und manipulierte Auswahl, Ricardo/Morisaki/Professor in der Schlussfolge, Joes Tod und Mikes Wettkampfablehnung. Tribeca: Mamets eigene Einordnung als Kampf- und Samurai-Film, kein zusätzlicher Beleg für Einzelheiten der Schlussfolge.

[Beleg 1](https://en.wikipedia.org/wiki/Redbelt) · [Beleg 2](https://tribecafilm.com/news/512c0f631c7d76d9a90006d0-world-premiere-of-david-m).

### 41. Westworld (1973)

Frage-ID: `E20261007-F-208-L2` · Wissensziel: `K-E20261007-F-208-L2` · Science-Fiction · leicht.

**Originalfrage:** Welche Figur verfolgt Peter Martin (Richard Benjamin) in „Westworld“?

- **A:** Ein römischer Senator mit bewaffneten Wachen.
- **B:** Ein schwarz gekleideter Revolverheld-Roboter. **✓ richtig**
- **C:** Ein menschlicher Mitarbeiter im Sheriffkostüm.
- **D:** Ein Ritter, der den Park heimlich verlassen hat.

**Kurzantwort bisher:** Yul Brynner spielt den verfolgenden Gunslinger.

**Vertiefung bisher (angezeigt):** Der Revolverheld (Yul Brynner) gehört zuerst zum käuflichen Westernabenteuer. Peter kann ihn scheinbar folgenlos besiegen. Als die Steuerung versagt, wird aus der wiederholbaren Attraktion ein ausdauernder Verfolger. Dieselbe vertraute Figur erhält dadurch eine neue Bedeutung: Ihre berechenbare Rolle schlägt in eine Bedrohung um, die Peter nicht mehr abschalten kann.

**Merksatz bisher:** Der zuvor besiegte Revolverheld kehrt als nicht mehr beherrschbarer Gegner zurück.

**Urteil:** Überarbeiten. Die Kurzantwort nennt nun Figur und Roboterstatus statt nur den Darsteller. Die Vertiefung zeigt den konkreten Umschlag vom Angebot des Parks zur tödlichen Verfolgung.

**Wissensziel beibehalten:** Den Gunslinger als Verfolger erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort neu:** Der schwarz gekleidete Revolverheld ist ein Roboter, gespielt von Yul Brynner.

**Vertiefung neu:** Anfangs lässt sich der Revolverheld (Yul Brynner) von den Gästen im Duell erschießen und anschließend reparieren. Als die Parksteuerung versagt, behandelt John Blane (James Brolin) die nächste Herausforderung noch immer als harmloses Spiel. Der Roboter erschießt ihn wirklich. Für Johns Begleiter Peter Martin (Richard Benjamin) beginnt daraufhin die Flucht durch die verschiedenen Erlebniswelten.

**Merksatz beibehalten:** Der zuvor besiegte Revolverheld kehrt als nicht mehr beherrschbarer Gegner zurück.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Peters Hauptverfolger stammt aus der Westernwelt. · C: Der Gegner ist ein Android und kein verkleideter Mitarbeiter. · D: Der entscheidende Gegner ist kein flüchtiger Ritter.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: wiederholt reparierter Gunslinger, Johns Tod, Waffensensoren, Frau/Wasser/Kurzschluss, Reserveversorgung und erstickte Techniker.

[Beleg 1](https://en.wikipedia.org/wiki/Westworld_(film)).

### 42. Westworld (1973)

Frage-ID: `E20261007-F-208-M1` · Wissensziel: `K-E20261007-F-208-M1` · Science-Fiction · mittel.

**Originalfrage:** Warum sollen die Schusswaffen des Parks in „Westworld“ Menschen zunächst nicht verletzen?

- **A:** Sämtliche Patronen bestehen nur aus ungefährlichem Papier.
- **B:** Die Waffen sind für jeden Besucher durch einen persönlichen Code gesperrt.
- **C:** Sensoren sollen Schüsse auf lebende Körper verhindern. **✓ richtig**
- **D:** Die Waffen werden ausschließlich als Attrappen ausgegeben.

**Kurzantwort bisher:** Eine technische Sperre unterscheidet menschliche Ziele.

**Vertiefung bisher (angezeigt):** Die Waffen sollen lebende Körper erkennen und Schüsse auf Menschen verhindern. Besucher vertrauen deshalb darauf, echte Duelle gefahrlos nachspielen zu können. Die technische Unterscheidung ist eine Voraussetzung des Angebots. Sobald sie versagt, besitzen dieselben Waffen ihre tödliche Wirkung; die Gäste müssen ihr Verhalten ohne die zuvor eingeplante Sicherheit neu bewerten.

**Merksatz bisher:** Die Sicherheit hängt von der technischen Unterscheidung zwischen Mensch und Android ab.

**Urteil:** Überarbeiten. Die funktionale Unterscheidung genügt. Keine zusätzliche technische Behauptung über Wärmegrenzen oder ein bestimmtes Bauteil ohne konkreten Beleg einführen.

**Wissensziel beibehalten:** Die Sicherheitsfunktion der Waffen verstehen

**Neue vollständige Komposition:** Warum sollen die Schusswaffen des Parks in „Westworld“ Menschen zunächst nicht verletzen?

- **A:** Die Munition soll menschliche Haut nicht durchdringen können.
- **B:** Die Besucher müssen außerhalb markierter Duellplätze ihre Waffen sperren.
- **C:** Sensoren sollen Schüsse auf lebende Körper verhindern. **✓ richtig**
- **D:** Eine zentrale Leitstelle soll jeden Schuss auf einen Gast einzeln blockieren.

**Kurzantwort beibehalten:** Eine technische Sperre unterscheidet menschliche Ziele.

**Vertiefung neu:** Die Schusswaffen des Parks sollen lebende Gäste erkennen und verhindern, dass sie einander erschießen. Gegen die künstlichen Figuren funktionieren sie dagegen mit echter Wirkung; beschädigte Roboter werden anschließend wiederhergestellt. Diese Trennung macht die Duelle für Besucher scheinbar ungefährlich. Beim Zusammenbruch des Parks gilt das Versprechen der kontrollierten Gewalt nicht mehr.

**Merksatz beibehalten:** Die Sicherheit hängt von der technischen Unterscheidung zwischen Mensch und Android ab.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Der Schutz beruht nicht auf Papierpatronen. · B: Die Sicherung unterscheidet über Sensoren lebende Ziele; sie beruht nicht auf einem individuellen Code. · D: Die Waffen funktionieren gegen Roboter tatsächlich.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: wiederholt reparierter Gunslinger, Johns Tod, Waffensensoren, Frau/Wasser/Kurzschluss, Reserveversorgung und erstickte Techniker.

[Beleg 1](https://en.wikipedia.org/wiki/Westworld_(film)).

### 43. Westworld (1973)

Frage-ID: `E20261007-F-208-S2` · Wissensziel: `K-E20261007-F-208-S2` · Science-Fiction · schwer.

**Originalfrage:** Was entlarvt die vermeintlich gefangene Frau im Kerker von „Westworld“ als Androidin?

- **A:** Eine Verletzung legt ein Metallgelenk in ihrem Arm frei.
- **B:** Das ihr gegebene Wasser verursacht einen Kurzschluss. **✓ richtig**
- **C:** Ihre Stimme fällt mitten in einem Satz aus.
- **D:** Sie reagiert auf einen Befehl aus dem Kontrollraum.

**Kurzantwort bisher:** Die gut gemeinte Hilfe legt ihre technische Natur offen.

**Vertiefung bisher (angezeigt):** Peter (Richard Benjamin) glaubt, im Kerker endlich jemandem helfen zu können. Er gibt der Frau Wasser und löst dadurch einen Kurzschluss aus. Nach dem Kampf mit einem erkennbaren Gegner scheitert nun auch die sichere Unterscheidung im Hilfsmoment. Die erschöpfende Flucht endet deshalb nicht mit ungetrübtem Vertrauen in die Menschen, die er zu sehen meint.

**Merksatz bisher:** Wasser verwandelt einen Rettungsversuch in die Entlarvung eines weiteren Androiden.

**Urteil:** Überarbeiten. Die Kurzantwort beantwortet nun ausdrücklich das gefragte Woran. Die Orts- und Handlungseinordnung reicht; die zusätzliche Moral der Ausgangsfassung entfällt.

**Wissensziel beibehalten:** Die vermeintliche Gefangene als Androidin erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort neu:** Als Peter ihr Wasser gibt, löst es einen Kurzschluss aus und entlarvt sie als Androidin.

**Vertiefung neu:** Im Kerker der mittelalterlichen Erlebniswelt findet Peter Martin (Richard Benjamin) eine angekettete Frau. Nach seiner Flucht vor dem Revolverhelden hält er sie für einen Menschen, dem er helfen kann. Doch seine Hilfe löst einen Kurzschluss aus. Auch diese scheinbar hilflose Person gehört zur künstlichen Ausstattung des Parks.

**Merksatz beibehalten:** Wasser verwandelt einen Rettungsversuch in die Entlarvung eines weiteren Androiden.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Der Kurzschluss beim Trinken entlarvt die Androidin. · C: Die Entlarvung geschieht durch das Wasser, nicht durch einen Ausfall ihrer Stimme. · D: Peter erkennt ihre künstliche Natur an der Reaktion auf das Wasser.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: wiederholt reparierter Gunslinger, Johns Tod, Waffensensoren, Frau/Wasser/Kurzschluss, Reserveversorgung und erstickte Techniker.

[Beleg 1](https://en.wikipedia.org/wiki/Westworld_(film)).

### 44. Westworld (1973)

Frage-ID: `E20261007-F-208-M2` · Wissensziel: `K-E20261007-F-208-M2` · Science-Fiction · mittel.

**Originalfrage:** Warum rettet das Abschalten der Hauptversorgung in „Westworld“ die Techniker nicht?

- **A:** Die Abschaltung versetzt alle Gäste sofort in einen Schlafzustand.
- **B:** Die Roboter brauchen ausschließlich Sonnenlicht aus der Wüste.
- **C:** Die Abschaltung öffnet nur die Türen der Gästeunterkünfte.
- **D:** Roboter laufen auf Reserve weiter; die Techniker sind eingeschlossen. **✓ richtig**

**Kurzantwort bisher:** Reserveenergie und verschlossene Kontrollräume machen den Eingriff fatal.

**Vertiefung bisher (angezeigt):** Die Leitstelle versucht die Katastrophe durch einen zentralen Eingriff zu stoppen. Die Androiden können jedoch mit Reserveenergie weiterarbeiten. Zugleich bleiben die Techniker in den Kontrollräumen gefangen und verlieren ihre Versorgung. Die organisatorische Zentrale wird damit selbst zur Falle: Ein Eingriff, der Kontrolle zurückbringen soll, nimmt den Verantwortlichen die eigene Fluchtmöglichkeit.

**Merksatz bisher:** Die Reserve schützt die Androiden, während die Leitstelle durch ihren Eingriff zur Falle wird.

**Urteil:** Überarbeiten. Reserveversorgung und eingeschlossene Belegschaft werden kausal auseinandergehalten. Gute Grundidee, aber bisher fehlte die Konsequenz der ausgefallenen Luftversorgung.

**Wissensziel beibehalten:** Das Scheitern der Notabschaltung erklären

**Neue vollständige Komposition:** Warum rettet das Abschalten der Hauptversorgung in „Westworld“ die Techniker nicht?

- **A:** Mit dem Parkstrom fällt auch der Funk zur anrückenden Rettungsmannschaft aus.
- **B:** Die Abschaltung sperrt ihre Zugangsausweise für die Roboterwerkstatt.
- **C:** Das Notprogramm verlagert die Roboter aus den Parks in die Leitstelle.
- **D:** Roboter laufen auf Reserve weiter; die Techniker sind eingeschlossen. **✓ richtig**

**Kurzantwort beibehalten:** Reserveenergie und verschlossene Kontrollräume machen den Eingriff fatal.

**Vertiefung neu:** Die Techniker schalten den Parkstrom ab, um die Roboter zu stoppen. Diese laufen jedoch auf Reserve weiter. Im Kontrollzentrum sind dagegen die Ausgänge blockiert und die Luftversorgung fällt aus. Als Peter Martin (Richard Benjamin) später hinabsteigt, findet er die Mitarbeiter erstickt vor.

**Merksatz beibehalten:** Die Reserve schützt die Androiden, während die Leitstelle durch ihren Eingriff zur Falle wird.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Ein Schlafmodus für Gäste ist nicht die Folge. · B: Sonnenlicht erklärt den Weiterbetrieb nicht. · C: Die Roboter arbeiten auf Reserve weiter, während die Techniker im geschlossenen Kontrollbereich zurückbleiben.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: wiederholt reparierter Gunslinger, Johns Tod, Waffensensoren, Frau/Wasser/Kurzschluss, Reserveversorgung und erstickte Techniker.

[Beleg 1](https://en.wikipedia.org/wiki/Westworld_(film)).

### 45. Rambo (1982)

Frage-ID: `ACT-L-029` · Wissensziel: `K-ACT-15-rambo-stallone` · Action · leicht.

**Originalfrage:** „Rambo“ (1982): Wer spielt John Rambo?

- **A:** Arnold Schwarzenegger
- **B:** Chuck Norris
- **C:** Jean-Claude Van Damme
- **D:** Sylvester Stallone **✓ richtig**

**Kurzantwort bisher:** Sylvester Stallone verkörpert den traumatisierten Veteranen John Rambo.

**Vertiefung bisher (angezeigt):** Der erste Rambo-Film stellt zunächst einen entwurzelten Heimkehrer vor, keinen Soldaten auf neuer Auslandsmission. Stallones Figur findet in der amerikanischen Kleinstadt keine Ruhe. Seine körperlichen Fähigkeiten stehen neben tiefer Verletzlichkeit. Diese Kombination ist wichtig, weil die spätere Eskalation nicht allein als Demonstration militärischer Stärke verstanden werden kann.

**Merksatz bisher:** Sylvester Stallone spielt den verletzlichen und gefährlichen John Rambo.

**Urteil:** Überarbeiten. Der konkrete Einstieg vermittelt den Unterschied zur späteren Serienfigur, ohne lediglich auf die Fortsetzungen zu verweisen.

**Wissensziel beibehalten:** Stallone der ursprünglichen Rambo-Figur zuordnen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Sylvester Stallone verkörpert den traumatisierten Veteranen John Rambo.

**Vertiefung neu:** Sylvester Stallone spielt hier einen Vietnamveteranen auf der Suche nach einem früheren Kameraden. Dessen Familie teilt ihm mit, dass der Mann an den Folgen von Agent Orange gestorben ist. Ohne dieses letzte Bindeglied zieht Rambo weiter und trifft auf Sheriff Teasle (Brian Dennehy). Der erste Film beginnt also mit Verlust und Orientierungslosigkeit, bevor die Verfolgung einsetzt.

**Merksatz neu:** Sylvester Stallone spielt John Rambo.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Schwarzenegger spielt John Matrix, nicht John Rambo. · B: Norris spielt andere militärische Actionhelden; Rambo ist Stallones Rolle. · C: Van Damme ist nicht der Darsteller dieses Veteranen.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung, AFI-Synopsis: Tod des Kameraden durch Agent Orange, Teasles Ausweisung/Festnahme, Hochdruckschlauch und Rasiermesser mit Foltererinnerungen, verletzter Teasle, Trautmans Eingreifen und Festnahme.

[Beleg 1](https://en.wikipedia.org/wiki/First_Blood) · [Beleg 2](https://catalog.afi.com/Catalog/moviedetails/56779).

### 46. Rambo (1982)

Frage-ID: `ACT-M-029` · Wissensziel: `K-ACT-15-teasle-sheriff` · Action · mittel.

**Originalfrage:** „Rambo“ (1982): Welcher örtliche Amtsträger treibt den Konflikt mit Rambo (Sylvester Stallone) voran?

- **A:** Marshal Sam Gerard
- **B:** Sheriff Will Teasle **✓ richtig**
- **C:** Captain Roger Murtaugh
- **D:** Colonel Sam Trautman

**Kurzantwort bisher:** Sheriff Teasle will Rambo aus der Stadt fernhalten und lässt ihn später festnehmen.

**Vertiefung bisher (angezeigt):** Teasle betrachtet den fremden Wanderer zunächst als unerwünschten Störenfried. Sein Bestehen auf Autorität verwandelt eine vermeidbare Begegnung in einen persönlichen Machtkampf. Er unterschätzt dabei sowohl Rambos Fähigkeiten als auch dessen psychische Belastung. Der Film entwickelt die Verfolgung aus einer Kette von Entscheidungen, in denen keiner der Beteiligten rechtzeitig von seinem Anspruch abrückt.

**Merksatz bisher:** Teasles Ausgrenzung setzt die Eskalation in Gang.

**Urteil:** Überarbeiten. Die Eskalation ersetzt die allgemeine Beschreibung eines Autoritätskonflikts. Trautman wird als Gegenposition kenntlich.

**Wissensziel beibehalten:** Teasle als Rambos örtlichen Gegner erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Sheriff Teasle will Rambo aus der Stadt fernhalten und lässt ihn später festnehmen.

**Vertiefung neu:** Sheriff Teasle (Brian Dennehy) fährt Rambo (Sylvester Stallone) aus der Stadt und macht ihm deutlich, dass er unerwünscht ist. Rambo kehrt zu Fuß zurück, woraufhin Teasle ihn festnimmt. Nach der Misshandlung auf dem Revier und Rambos Flucht besteht der Sheriff weiter auf seiner Verfolgung, selbst als Trautman (Richard Crenna) vor dem ausgebildeten Soldaten warnt.

**Merksatz beibehalten:** Teasles Ausgrenzung setzt die Eskalation in Gang.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Gerard gehört zu Auf der Flucht. · C: Murtaugh ist ein Ermittler aus Lethal Weapon. · D: Trautman versucht, den Konflikt zu begrenzen, und ist nicht der örtliche Sheriff.

**Antwortfeedback neu:** D: Trautman versucht, den Konflikt zu begrenzen.

**Quellenprüfung:** Handlung und Besetzung, AFI-Synopsis: Tod des Kameraden durch Agent Orange, Teasles Ausweisung/Festnahme, Hochdruckschlauch und Rasiermesser mit Foltererinnerungen, verletzter Teasle, Trautmans Eingreifen und Festnahme.

[Beleg 1](https://en.wikipedia.org/wiki/First_Blood) · [Beleg 2](https://catalog.afi.com/Catalog/moviedetails/56779).

### 47. Rambo (1982)

Frage-ID: `ACT-S-029` · Wissensziel: `K-ACT-15-rasur-flashback` · Action · schwer.

**Originalfrage:** „Rambo“ (1982): Warum löst die brutale Behandlung auf der Wache bei Rambo (Sylvester Stallone) einen Zusammenbruch aus?

- **A:** Sie lässt ihn erstmals von einer geheimen Anklage erfahren.
- **B:** Sie ruft Erinnerungen an Folter in Gefangenschaft hervor. **✓ richtig**
- **C:** Sie beweist ihm, dass Trautman ihn verraten hat.
- **D:** Sie verhindert die Einnahme einer notwendigen Medizin.

**Kurzantwort bisher:** Die Misshandlungen und die drohende Rasur lösen traumatische Erinnerungen an Vietnam aus.

**Vertiefung bisher (angezeigt):** Die Polizeiszene erklärt Rambos Gegenwehr nicht nur durch Ärger über eine Festnahme. Die Bilder seiner früheren Gefangenschaft drängen in die Gegenwart. Damit wird eine alltägliche Amtshandlung aus seiner Sicht Teil einer existenziellen Bedrohung. Die Zuspitzung zeigt, wie gefährlich grobe Demütigung werden kann, wenn die Beteiligten das Trauma des Gegenübers nicht erkennen.

**Merksatz bisher:** Die Gewalt auf der Wache lässt Rambos Kriegstrauma wiederaufleben.

**Urteil:** Überarbeiten. Die ursprüngliche Deutung wird an Misshandlung und Flucht geerdet. Die offizielle Behandlung darf dabei nicht als bloß gewöhnlicher Verwaltungsakt verharmlost werden.

**Wissensziel beibehalten:** Rambos Reaktion auf die Misshandlung psychologisch und szenisch verstehen

**Neue vollständige Komposition:** „Rambo“ (1982): Warum reagiert Rambo (Sylvester Stallone) auf die brutale Behandlung auf der Wache mit heftiger Gegenwehr?

- **A:** Sie lässt ihn erstmals von einer geheimen Anklage erfahren.
- **B:** Sie ruft Erinnerungen an Folter in Gefangenschaft hervor. **✓ richtig**
- **C:** Sie beweist ihm, dass Trautman ihn verraten hat.
- **D:** Sie verhindert die Einnahme einer notwendigen Medizin.

**Kurzantwort beibehalten:** Die Misshandlungen und die drohende Rasur lösen traumatische Erinnerungen an Vietnam aus.

**Vertiefung neu:** Auf dem Revier wird Rambo (Sylvester Stallone) mit einem Hochdruckschlauch abgespritzt und zum Rasieren festgehalten. Die Behandlung löst Erinnerungsbilder an seine Folter in Vietnam aus. Er schlägt die Beamten nieder und entkommt auf einem Motorrad. Die Flucht beginnt mit dem Wiedererleben früherer Gewalt.

**Merksatz beibehalten:** Die Gewalt auf der Wache lässt Rambos Kriegstrauma wiederaufleben.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Eine neu enthüllte Anklage ist nicht der gezeigte Auslöser. · C: Trautmans Verrat wird in dieser Szene nicht festgestellt. · D: Ein Medikamentenentzug wird nicht als Ursache gezeigt.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung, AFI-Synopsis: Tod des Kameraden durch Agent Orange, Teasles Ausweisung/Festnahme, Hochdruckschlauch und Rasiermesser mit Foltererinnerungen, verletzter Teasle, Trautmans Eingreifen und Festnahme.

[Beleg 1](https://en.wikipedia.org/wiki/First_Blood) · [Beleg 2](https://catalog.afi.com/Catalog/moviedetails/56779).

### 48. Rambo (1982)

Frage-ID: `ACT-S-030` · Wissensziel: `K-ACT-15-kinoende` · Action · schwer.

**Originalfrage:** „Rambo“ (1982): Wie endet Rambos (Sylvester Stallone) Konfrontation in der regulären Kinofassung?

- **A:** Er übernimmt die Führung der örtlichen Polizei.
- **B:** Er flieht mit Teasle als Geisel ins Ausland.
- **C:** Er bricht zusammen und lässt sich mit Trautman abführen. **✓ richtig**
- **D:** Er stirbt durch einen Schuss Trautmans.

**Kurzantwort bisher:** Trautman bringt Rambo zum Aufgeben; Rambo wird lebend in Gewahrsam genommen.

**Vertiefung bisher (angezeigt):** Am Ende erzählt Rambo von Verlusten und seiner Unfähigkeit, im zivilen Leben Fuß zu fassen. Die Entladung ist emotional, nicht nur militärisch. Trautman kann ihn schließlich erreichen und aus dem zerstörten Gebäude begleiten. Die ausdrückliche Beschränkung auf die Kinofassung ist wichtig, weil Romanvorlage und verworfene Filmfassungen andere Möglichkeiten für Rambos Ende enthalten.

**Merksatz bisher:** Der Kinofilm endet mit Rambos Zusammenbruch und Festnahme, nicht mit seinem Tod.

**Urteil:** Überarbeiten. Die Frage nach der Filmfassung ist berechtigt. Der neue Text erklärt den Zusammenbruch aus der letzten Konfrontation; unbelegte Details alternativer Endfassungen bleiben draußen.

**Wissensziel beibehalten:** Das Ende der Kinofassung kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Trautman bringt Rambo zum Aufgeben; Rambo wird lebend in Gewahrsam genommen.

**Vertiefung neu:** Rambo (Sylvester Stallone) kehrt bewaffnet in die Stadt zurück und verletzt Teasle (Brian Dennehy) im Sheriffbüro. Trautman (Richard Crenna) hält ihn davon ab, den Sheriff zu töten. Daraufhin erzählt Rambo unter Tränen vom Tod eines Kameraden und von seinem gescheiterten zivilen Leben. Er lässt sich schließlich abführen; die Kinofassung endet mit seiner Festnahme.

**Merksatz beibehalten:** Der Kinofilm endet mit Rambos Zusammenbruch und Festnahme, nicht mit seinem Tod.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Rambo wird nicht zum neuen Polizeichef. · B: Er nimmt Teasle nicht als Geisel mit ins Ausland. · D: Ein tödlicher Schuss gehört nicht zum Ende der regulären Kinofassung.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung und Besetzung, AFI-Synopsis: Tod des Kameraden durch Agent Orange, Teasles Ausweisung/Festnahme, Hochdruckschlauch und Rasiermesser mit Foltererinnerungen, verletzter Teasle, Trautmans Eingreifen und Festnahme.

[Beleg 1](https://en.wikipedia.org/wiki/First_Blood) · [Beleg 2](https://catalog.afi.com/Catalog/moviedetails/56779).

### 49. Die Stunde, wenn Dracula kommt (1960)

Frage-ID: `F240-20261006-095-L2` · Wissensziel: `K-F240-20261006-095-L2` · Horror · leicht.

**Originalfrage:** Was sollen die mit Spitzen besetzten Masken am Anfang von „Die Stunde, wenn Dracula kommt“ bewirken?

- **A:** Die Gesichter der Opfer für die Ewigkeit bewahren
- **B:** Die Verurteilten grausam töten **✓ richtig**
- **C:** Die Verurteilten am Sprechen eines weiteren Fluchs hindern
- **D:** Die Wiederkehr der Toten durch bloßes Bedecken verhindern

**Kurzantwort bisher:** Die Masken werden als Hinrichtungswerkzeug eingeschlagen.

**Vertiefung bisher (angezeigt):** Die Masken werden als Hinrichtungswerkzeug eingeschlagen. Asa (Barbara Steele) verflucht ihre Familie; die körperliche Strafe eröffnet damit die spätere Rachegeschichte.

**Merksatz bisher:** Die Maske verbindet Hinrichtung und Fluch.

**Urteil:** Überarbeiten. Die Frage ist klar, aber die alte Kurzantwort wiederholende Vertiefung erklärte die Szene kaum. Der Erhalt des Körpers verbindet Hinrichtung und spätere Handlung.

**Wissensziel beibehalten:** Die Stachelmasken als Hinrichtungsinstrument erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die Masken werden als Hinrichtungswerkzeug eingeschlagen.

**Vertiefung neu:** Zu Beginn werden Asa (Barbara Steele) und Javutich (Arturo Dominici) wegen Hexerei zum Tod verurteilt. Die Henker schlagen ihnen Metallmasken mit nach innen gerichteten Spitzen auf die Gesichter. Ein aufziehender Sturm verhindert anschließend die Verbrennung. Asas Körper bleibt in einer Gruft erhalten, die zwei Jahrhunderte später geöffnet wird.

**Merksatz neu:** Die Spitzen der Totenmasken töten Asa und Javutich.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die Spitzen machen die Maske zum Tötungswerkzeug. · C: Das Einschlagen tötet statt nur Sprache zu verhindern. · D: Die Hinrichtung geht über bloßes Bedecken hinaus.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Stachelmasken und ausgebliebene Verbrennung, Gruft/Glas/Kruvajans Blut, Lebenskraftentzug, Familienlinie und Barbara Steeles Doppelrolle, Kreuz an Katia.

[Beleg 1](https://en.wikipedia.org/wiki/Black_Sunday_(1960_film)).

### 50. Die Stunde, wenn Dracula kommt (1960)

Frage-ID: `F240-20261006-095-M1` · Wissensziel: `K-F240-20261006-095-M1` · Horror · mittel.

**Originalfrage:** Wie wird Asa (Barbara Steele) in „Die Stunde, wenn Dracula kommt“ unbeabsichtigt wiederbelebt?

- **A:** Katia spricht bewusst einen Zauber.
- **B:** Die Dorfbewohner öffnen gemeinsam das Grab.
- **C:** Blut eines verletzten Arztes tropft auf ihren Körper. **✓ richtig**
- **D:** Ein Priester tauft ihre Gebeine.

**Kurzantwort bisher:** Kruvajans (Andrea Checchi) Blut trifft den Körper.

**Vertiefung bisher (angezeigt):** Kruvajans (Andrea Checchi) Blut trifft den Körper. Der Arzt hatte Schutzglas und Kreuz beschädigt; seine Untersuchung schafft dadurch den Zugang, den er als medizinisch neugieriger Besucher nicht beabsichtigt.

**Merksatz bisher:** Die unbedachte Untersuchung liefert Asa Blut und Zugang.

**Urteil:** Überarbeiten. Eine konkrete Abfolge ersetzt „medizinische Neugier“ als pauschale Ursache. Glasbruch, Schnitt und Blut bleiben unterscheidbar.

**Wissensziel beibehalten:** Den Auslöser von Asas Wiederkehr kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Kruvajans (Andrea Checchi) Blut trifft den Körper.

**Vertiefung neu:** Dr. Kruvajan (Andrea Checchi) zerschlägt beim Schlag nach einer Fledermaus die Glasabdeckung von Asas Grab und das Kreuz darüber. Er nimmt die Totenmaske ab und schneidet sich am Glas. Das Blut, das auf Asa (Barbara Steele) tropft, weckt sie. Der Arzt bemerkt nicht, dass sein Besuch die vermeintlich Tote wieder zum Leben bringt.

**Merksatz neu:** Kruvajans Blut erweckt Asa in der Gruft.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Katia führt diese Wiederbelebung nicht herbei. · B: Eine gemeinsame Dorföffnung ist nicht die Ursache. · D: Eine Taufe belebt sie nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Stachelmasken und ausgebliebene Verbrennung, Gruft/Glas/Kruvajans Blut, Lebenskraftentzug, Familienlinie und Barbara Steeles Doppelrolle, Kreuz an Katia.

[Beleg 1](https://en.wikipedia.org/wiki/Black_Sunday_(1960_film)).

### 51. Die Stunde, wenn Dracula kommt (1960)

Frage-ID: `F240-20261006-095-S1` · Wissensziel: `K-F240-20261006-095-S1` · Horror · schwer.

**Originalfrage:** Warum will Asa (Barbara Steele) in „Die Stunde, wenn Dracula kommt“ Katias Lebenskraft entziehen?

- **A:** Sie will über Katias Jugend wieder einen lebendigen Körper gewinnen. **✓ richtig**
- **B:** Sie will Katia dauerhaft zu ihrer Dienerin machen.
- **C:** Sie will durch Katias Tod nur den Fürsten bestrafen.
- **D:** Sie will Katias Körper ihrem toten Gefährten überlassen.

**Kurzantwort bisher:** Asa (Barbara Steele) beansprucht Katias Jugend.

**Vertiefung bisher (angezeigt):** Asa (Barbara Steele) beansprucht Katias Jugend. Katia (ebenfalls Steele) ist deshalb mehr als eine zufällige Gegnerin: Ihre Ähnlichkeit macht sie zum passenden Träger eines geraubten Lebens.

**Merksatz bisher:** Die Ähnlichkeit bestimmt das Opfer für Asas Körpererneuerung.

**Urteil:** Überarbeiten. Die körperliche Wirkung und die anschließende Täuschung sind ergiebiger als eine allgemeine Aussage über Jugend. Keine tatsächliche Verwandlung Katias in Asa behaupten.

**Wissensziel beibehalten:** Asas Zugriff auf Katias Lebenskraft verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Asa (Barbara Steele) beansprucht Katias Jugend.

**Vertiefung neu:** Während Asa (Barbara Steele) Katia ihre Lebenskraft entzieht, wird die junge Frau immer schwächer und Asa gewinnt ihr jugendliches Aussehen zurück. Beide Rollen spielt dieselbe Schauspielerin. Diese Ähnlichkeit ermöglicht es der Hexe, sich gegenüber Gorobec (John Richardson) als Katia auszugeben – bis er das Kreuz an der wirklichen Katia bemerkt.

**Merksatz neu:** Asa entzieht Katia Jugend und gibt sich als sie aus.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** B: Asa will selbst Katias Jugend und Erscheinung übernehmen. · C: Die Rache ist mit eigenem Lebensraub verbunden, nicht nur der Bestrafung des Fürsten. · D: Sie beansprucht den Körper selbst.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Stachelmasken und ausgebliebene Verbrennung, Gruft/Glas/Kruvajans Blut, Lebenskraftentzug, Familienlinie und Barbara Steeles Doppelrolle, Kreuz an Katia.

[Beleg 1](https://en.wikipedia.org/wiki/Black_Sunday_(1960_film)).

### 52. Die Stunde, wenn Dracula kommt (1960)

Frage-ID: `F240-20261006-095-L1` · Wissensziel: `K-F240-20261006-095-L1` · Horror · leicht.

**Originalfrage:** Welche Verbindung besteht zwischen Asa (Barbara Steele) und Katia in „Die Stunde, wenn Dracula kommt“?

- **A:** Sie gleichen einander äußerlich und gehören zur selben Familienlinie. **✓ richtig**
- **B:** Sie sind Schwestern, die zur selben Zeit aufwuchsen.
- **C:** Sie sind Mutter und Tochter mit unterschiedlicher Erscheinung.
- **D:** Sie sind nicht verwandte Frauen, die durch einen Fluch verbunden werden.

**Kurzantwort bisher:** Asa und Katia gehören zur selben Familienlinie und gleichen einander.

**Vertiefung bisher (angezeigt):** Asa und Katia gehören zur selben Familienlinie und gleichen einander. Barbara Steele spielt beide Frauen; diese Ähnlichkeit ermöglicht später Asas Versuch, Katias Lebenskraft zu rauben und als sie aufzutreten.

**Merksatz bisher:** Die gleiche Erscheinung bereitet den Austauschversuch vor.

**Urteil:** Überarbeiten. Der Stammbaum und die zwei Zeitebenen werden gegenüber einer unklaren Doppelrollenbeschreibung präzisiert.

**Wissensziel beibehalten:** Die Verwandtschaft und Doppelbesetzung von Asa und Katia verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Asa und Katia gehören zur selben Familienlinie und gleichen einander.

**Vertiefung neu:** Zwischen Asas Hinrichtung und Katias Geschichte liegen zwei Jahrhunderte. Katia gehört zu den Nachkommen der Familie, die Asa (beide Barbara Steele) verflucht hat. Die gemeinsame Besetzung macht ihre Ähnlichkeit sichtbar, obwohl es zwei eigenständige Figuren sind.

**Merksatz neu:** Asa und Katia: gleiche Familienlinie, gleiche Darstellerin, zwei Jahrhunderte Abstand.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** B: Zwischen ihnen liegen Generationen derselben Familie. · C: Die Ähnlichkeit besteht über eine längere Familienlinie. · D: Die familiäre Abstammung ist für Asas Rache wichtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Stachelmasken und ausgebliebene Verbrennung, Gruft/Glas/Kruvajans Blut, Lebenskraftentzug, Familienlinie und Barbara Steeles Doppelrolle, Kreuz an Katia.

[Beleg 1](https://en.wikipedia.org/wiki/Black_Sunday_(1960_film)).

### 53. Aladdin (1992)

Frage-ID: `F240-20261006-069-L2` · Wissensziel: `K-F240-20261006-069-L2` · Fantasy · leicht.

**Originalfrage:** Warum verlässt Jasmin in „Aladdin“ heimlich den Palast?

- **A:** Sie will heimlich einen vom Sultan bestimmten Bräutigam treffen.
- **B:** Sie möchte dem abgeschirmten Palastleben entkommen. **✓ richtig**
- **C:** Sie möchte die Herrschaft Jafars unterstützen.
- **D:** Sie soll im Auftrag des Sultans den Markt prüfen.

**Kurzantwort bisher:** Jasmin (Originalstimme Linda Larkin) entzieht sich ihrem abgeschirmten Leben.

**Vertiefung bisher (angezeigt):** Jasmin (Originalstimme Linda Larkin) entzieht sich ihrem abgeschirmten Leben. Auf dem Markt begegnet sie Aladdin (Originalstimme Scott Weinger), bevor er ihre tatsächliche Stellung kennt.

**Merksatz bisher:** Jasmins eigener Ausbruch führt zum Treffen auf dem Markt.

**Urteil:** Überarbeiten. Der Marktbesuch erhält einen konkreten Anlass für die Begegnung. Die vier Optionen werden als persönliche Fluchtmotive gleichartig gefasst.

**Wissensziel beibehalten:** Jasmins Flucht aus dem Palast begründen

**Neue vollständige Komposition:** Warum verlässt Jasmin in „Aladdin“ heimlich den Palast?

- **A:** Sie will einem vom Sultan bestimmten Bräutigam folgen.
- **B:** Sie möchte dem abgeschirmten Palastleben entkommen. **✓ richtig**
- **C:** Sie will Aladdin aus dem Gefängnis befreien.
- **D:** Sie möchte Jafar bei seiner Suche nach der Lampe helfen.

**Kurzantwort beibehalten:** Jasmin (Originalstimme Linda Larkin) entzieht sich ihrem abgeschirmten Leben.

**Vertiefung neu:** Jasmin (Originalstimme Linda Larkin) will selbst über ihr Leben entscheiden und entzieht sich der abgeschirmten Welt des Palasts. Auf dem Markt gibt sie einem hungrigen Kind einen Apfel, ohne die Regeln des Bezahlens zu kennen. Aladdin (Originalstimme Scott Weinger) hilft ihr aus der Auseinandersetzung mit dem Händler. Die Begegnung beginnt, bevor er weiß, dass sie die Prinzessin ist.

**Merksatz beibehalten:** Jasmins eigener Ausbruch führt zum Treffen auf dem Markt.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Sie entzieht sich gerade dem fremdbestimmten Palastleben. · C: Jafars Herrschaft ist nicht ihr Ziel. · D: Der Besuch erfolgt ohne offiziellen Auftrag.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Animationsfassung 1992, AFI-Synopsis/Besetzung: Jasmins Marktbesuch/Apfel, Herausforderung des Dschinnis und kein Wunschverbrauch, Befreiungswunsch versus Gesetzesänderung des Sultans, Abus Edelstein und Jafars Verrat.

[Beleg 1](https://en.wikipedia.org/wiki/Aladdin_(1992_Disney_film)) · [Beleg 2](https://catalog.afi.com/Catalog/moviedetails/67020).

### 54. Aladdin (1992)

Frage-ID: `F240-20261006-069-M2` · Wissensziel: `K-F240-20261006-069-M2` · Fantasy · mittel.

**Originalfrage:** Wie entkommt Aladdin (Originalstimme: Scott Weinger) in „Aladdin“ der Höhle, ohne einen Wunsch zu verbrauchen?

- **A:** Er verwendet einen zuvor aufgesparten vierten Wunsch.
- **B:** Er erklärt die Rettung zur Belohnung für das Finden der Lampe.
- **C:** Er lässt den Teppich ohne Hilfe einen Ausgang finden.
- **D:** Er fordert den Dschinni durch Zweifel an dessen Können heraus. **✓ richtig**

**Kurzantwort bisher:** Aladdin (Originalstimme Scott Weinger) reizt den Dschinni (Originalstimme Robin Williams) durch einen Zweifel an dessen Fähigkeiten.

**Vertiefung bisher (angezeigt):** Aladdin (Originalstimme Scott Weinger) reizt den Dschinni (Originalstimme Robin Williams) durch einen Zweifel an dessen Fähigkeiten. Die Vorführung seiner Macht ermöglicht die Rettung ohne ausdrücklich eingesetzten Wunsch.

**Merksatz bisher:** Ein provozierter Beweis ersetzt den ersten Rettungswunsch.

**Urteil:** Überarbeiten. Die Provokation war richtig, aber die Rückfrage nach dem Wunschverbrauch fehlte. Die Kurzantwort beantwortet jetzt beide Teile des gefragten Tricks.

**Wissensziel beibehalten:** Aladdins Rettung ohne eingesetzten Wunsch verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort neu:** Aladdin provoziert den Dschinni mit Zweifeln an dessen Können; die Rettung erfolgt ohne ausgesprochenen Wunsch.

**Vertiefung neu:** Der Dschinni (Originalstimme Robin Williams) hat Aladdin (Originalstimme Scott Weinger) drei Wünsche angeboten. Aladdin bezweifelt demonstrativ, dass dieser sie überhaupt aus der verschütteten Höhle befreien könne. Der gekränkte Dschinni beweist seine Macht sofort. Draußen macht Aladdin geltend, dass er gar keinen Wunsch ausgesprochen hat.

**Merksatz beibehalten:** Ein provozierter Beweis ersetzt den ersten Rettungswunsch.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Ein vierter Wunsch ist nicht verfügbar. · B: Die Herausforderung, nicht eine Finderbelohnung, bewegt den Dschinni. · C: Der Dschinni hilft gerade bei dieser Rettung.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Animationsfassung 1992, AFI-Synopsis/Besetzung: Jasmins Marktbesuch/Apfel, Herausforderung des Dschinnis und kein Wunschverbrauch, Befreiungswunsch versus Gesetzesänderung des Sultans, Abus Edelstein und Jafars Verrat.

[Beleg 1](https://en.wikipedia.org/wiki/Aladdin_(1992_Disney_film)) · [Beleg 2](https://catalog.afi.com/Catalog/moviedetails/67020).

### 55. Aladdin (1992)

Frage-ID: `F240-20261006-069-S2` · Wissensziel: `K-F240-20261006-069-S2` · Fantasy · schwer.

**Originalfrage:** Welche Entscheidung verbindet Aladdins (Originalstimme: Scott Weinger) letzten Wunsch und die spätere Heirat in „Aladdin“?

- **A:** Er wünscht sich erneut Prinzenstatus und lässt den Dschinni gebunden.
- **B:** Er befreit den Dschinni; der Sultan ändert das Heiratsgesetz. **✓ richtig**
- **C:** Er lässt den Dschinni das Heiratsgesetz ändern.
- **D:** Er wünscht Jasmin aus der Familie des Sultans fort.

**Kurzantwort bisher:** Aladdin (Originalstimme Scott Weinger) befreit den Dschinni (Originalstimme Robin Williams).

**Vertiefung bisher (angezeigt):** Aladdin (Originalstimme Scott Weinger) befreit den Dschinni (Originalstimme Robin Williams). Der Sultan (Originalstimme Douglas Seale) erlaubt Jasmin (Originalstimme Linda Larkin) daraufhin eine freie Partnerwahl; Ehrlichkeit ersetzt die Prinzentarnung.

**Merksatz bisher:** Freiheit für den Dschinni, freie Wahl für Jasmin.

**Urteil:** Überarbeiten. Die alte Kurzantwort beantwortete nur die Hälfte der zusammengesetzten Frage. Der neue Text trennt Wunsch, Entscheidung des Sultans und Heirat.

**Wissensziel beibehalten:** Dschinnis Befreiung und Jasmins freie Partnerwahl auseinanderhalten

**Frage und vier Optionen:** unverändert.

**Kurzantwort neu:** Aladdin befreit mit seinem letzten Wunsch den Dschinni; der Sultan erlaubt Jasmin danach die freie Partnerwahl.

**Vertiefung neu:** Der Dschinni (Originalstimme Robin Williams) bietet an, Aladdin (Originalstimme Scott Weinger) wieder zum Prinzen zu machen, damit er Jasmin (Originalstimme Linda Larkin) heiraten darf. Aladdin hält stattdessen sein Versprechen und schenkt ihm die Freiheit. Die rechtliche Hürde beseitigt der Sultan (Originalstimme Douglas Seale) anschließend selbst. Die Ehe wird also nicht durch einen weiteren Zauber ermöglicht.

**Merksatz beibehalten:** Freiheit für den Dschinni, freie Wahl für Jasmin.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Er setzt den Wunsch zur Befreiung ein. · C: Die Gesetzesänderung trifft der Sultan selbst. · D: Jasmins Herkunft wird nicht weggewünscht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Animationsfassung 1992, AFI-Synopsis/Besetzung: Jasmins Marktbesuch/Apfel, Herausforderung des Dschinnis und kein Wunschverbrauch, Befreiungswunsch versus Gesetzesänderung des Sultans, Abus Edelstein und Jafars Verrat.

[Beleg 1](https://en.wikipedia.org/wiki/Aladdin_(1992_Disney_film)) · [Beleg 2](https://catalog.afi.com/Catalog/moviedetails/67020).

### 56. Aladdin (1992)

Frage-ID: `F240-20261006-069-M1` · Wissensziel: `K-F240-20261006-069-M1` · Fantasy · mittel.

**Originalfrage:** Was löst in „Aladdin“ den Einsturz der Wunderhöhle aus?

- **A:** Aladdin versucht zusätzliches Gold mitzunehmen.
- **B:** Der Teppich berührt einen verbotenen Schatz.
- **C:** Abu greift nach einem verbotenen Edelstein. **✓ richtig**
- **D:** Jafar greift selbst nach dem Edelstein.

**Kurzantwort bisher:** Abu (Originalstimme Frank Welker) greift nach einem Edelstein.

**Vertiefung bisher (angezeigt):** Abu (Originalstimme Frank Welker) greift nach einem Edelstein. Die Regel erlaubt nur die Lampe; das zusätzliche Begehren gefährdet den Rückweg von Aladdin (Originalstimme Scott Weinger).

**Merksatz bisher:** Abus Griff nach mehr bringt die Höhle zum Einsturz.

**Urteil:** Überarbeiten. Die unmittelbare Ursache bleibt. Der Rückweg und Jafars Verrat verbinden den Regelbruch mit der Lage, aus der später der Dschinni befreit.

**Wissensziel beibehalten:** Abus Regelbruch als Ursache des Einsturzes erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort neu:** Abu greift trotz des Verbots nach einem Edelstein und löst damit den Einsturz aus.

**Vertiefung neu:** In der Wunderhöhle darf Aladdin (Originalstimme Scott Weinger) nur die Lampe nehmen. Abu (Originalstimme Frank Welker) kann dem großen Edelstein dennoch nicht widerstehen. Der Schatzraum bricht zusammen, und die Flucht auf dem Teppich führt zunächst zurück zum Eingang. Dort lässt Jafar (Originalstimme Jonathan Freeman) Aladdin und Abu in die Höhle stürzen.

**Merksatz neu:** Abu berührt den verbotenen Edelstein; die Wunderhöhle stürzt ein.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Abu greift nach dem Edelstein. · B: Der Teppich verursacht den Bruch nicht. · D: Jafar ist nicht der Dieb in der Höhle.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Animationsfassung 1992, AFI-Synopsis/Besetzung: Jasmins Marktbesuch/Apfel, Herausforderung des Dschinnis und kein Wunschverbrauch, Befreiungswunsch versus Gesetzesänderung des Sultans, Abus Edelstein und Jafars Verrat.

[Beleg 1](https://en.wikipedia.org/wiki/Aladdin_(1992_Disney_film)) · [Beleg 2](https://catalog.afi.com/Catalog/moviedetails/67020).

### 57. Der Diktator (2012)

Frage-ID: `KOM-202609-P02-L-031-V1` · Wissensziel: `K-KOM-202609-P02-L-031` · Komödie · leicht.

**Originalfrage:** „Der Diktator“ (2012): Welcher Schauspieler steckt hinter Aladeen?

- **A:** Steve Coogan
- **B:** Sacha Dhawan
- **C:** Ben Kingsley
- **D:** Sacha Baron Cohen **✓ richtig**

**Kurzantwort bisher:** Sacha Baron Cohen spielt Aladeen.

**Vertiefung bisher (angezeigt):** Aladeen (Sacha Baron Cohen) erwartet, dass selbst alltägliche Vorgänge seinem Willen folgen. Der Film überträgt dieses Selbstverständnis später auf Situationen, in denen der Herrscher nicht mehr als Herrscher erkannt wird. Die Figur behält ihre Befehlsgewohnheiten bei, während die Umgebung ihnen keine automatische Gültigkeit mehr zugesteht. Selbst kleine Arbeitsabläufe werden dadurch zu Machtproblemen.

**Merksatz bisher:** Aladeen = Baron Cohen.

**Urteil:** Überarbeiten. Die Besetzungsfrage gewinnt einen passenden Doppelrollenbezug statt einer allgemeinen Charakterbeschreibung.

**Wissensziel beibehalten:** Sacha Baron Cohen als Aladeen erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Sacha Baron Cohen spielt Aladeen.

**Vertiefung neu:** Sacha Baron Cohen spielt sowohl Aladeen als auch dessen Doppelgänger Efawadh. Der einfältige Ersatzmann soll während Aladeens Entführung Staatsgeschäfte unterschreiben, die dessen Onkel Tamir (Ben Kingsley) durchsetzen will. Die Ähnlichkeit dient hier einer geplanten Entmachtung, während der echte Herrscher ohne Bart auf New Yorks Straßen nicht mehr erkannt wird.

**Merksatz beibehalten:** Aladeen = Baron Cohen.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** D: Richtig.

**Antwortfeedback neu:** C: Ben Kingsley spielt Tamir, Aladeens Onkel.

**Quellenprüfung:** Handlung/Besetzung: Cohen als Aladeen/Efawadh, UN-Reise nach New York, Tamirs Entführung, Nadal und die ins Exil Geschickten, Namensersetzung. Für die Arztpointe siehe den zusätzlichen gelesenen Dialog- und Besetzungsbeleg direkt bei Nr. 60; keine neue medizinische Sachbehauptung.

[Beleg 1](https://en.wikipedia.org/wiki/The_Dictator_(2012_film)).

### 58. Der Diktator (2012)

Frage-ID: `KOM-202609-P02-M-031` · Wissensziel: `K-KOM-202609-P02-M-031` · Komödie · mittel.

**Originalfrage:** „Der Diktator“ (2012): In welche Stadt reist Aladeen wegen eines Auftritts bei den Vereinten Nationen?

- **A:** Brüssel
- **B:** Wien
- **C:** New York **✓ richtig**
- **D:** Genf

**Kurzantwort bisher:** Aladeen reist nach New York.

**Vertiefung bisher (angezeigt):** Der Auftritt bei den Vereinten Nationen führt Aladeen (Sacha Baron Cohen) aus seiner kontrollierten Heimat in eine Stadt mit anderen Regeln. Die Reise liefert zugleich den Rahmen für seine Entmachtung. Seine Befehle funktionieren außerhalb des eigenen Apparats nicht mehr selbstverständlich; der Film kann so die routinierte Machtpose mit banalen amerikanischen Alltagssituationen kollidieren lassen.

**Merksatz bisher:** UN-Reise nach New York.

**Urteil:** Überarbeiten. Reisezweck und Komplott erklären den Ortswechsel konkret. Die konkurrierenden UN-Städte sind gute geografische Alternativen.

**Wissensziel beibehalten:** New York als Ziel der UN-Reise kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Aladeen reist nach New York.

**Vertiefung neu:** Aladeen (Sacha Baron Cohen) reist wegen der drohenden internationalen Intervention zum UN-Sitz in New York. Dort lässt sein Onkel Tamir (Ben Kingsley) ihn entführen und durch einen Doppelgänger ersetzen. Der Besuch, mit dem der Herrscher sein Regime verteidigen wollte, verschafft seinem Verwandten damit die Gelegenheit, ihn aus dem Amt zu drängen.

**Merksatz beibehalten:** UN-Reise nach New York.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** C: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Cohen als Aladeen/Efawadh, UN-Reise nach New York, Tamirs Entführung, Nadal und die ins Exil Geschickten, Namensersetzung. Für die Arztpointe siehe den zusätzlichen gelesenen Dialog- und Besetzungsbeleg direkt bei Nr. 60; keine neue medizinische Sachbehauptung.

[Beleg 1](https://en.wikipedia.org/wiki/The_Dictator_(2012_film)).

### 59. Der Diktator (2012)

Frage-ID: `KOM-202609-P02-S-031` · Wissensziel: `K-KOM-202609-P02-S-031` · Komödie · schwer.

**Originalfrage:** „Der Diktator“ (2012): Wer spielt die Ladenbetreiberin Zoey?

- **A:** Kristen Wiig
- **B:** Melissa McCarthy
- **C:** Anna Faris **✓ richtig**
- **D:** Amy Poehler

**Kurzantwort bisher:** Anna Faris spielt Zoey.

**Vertiefung bisher (angezeigt):** Zoey (Anna Faris) betreibt einen kooperativ organisierten Laden und hilft dem unbekannten Aladeen (Sacha Baron Cohen). Ihr Arbeitsumfeld setzt gemeinsame Entscheidungen voraus, die seiner gewohnten Herrschaftsweise fremd sind. Die Szenen gewinnen ihren Witz aus konkreten Abläufen wie Beschäftigung und Organisation, in die der ehemalige Alleinherrscher seine Befehlsreflexe unpassend hineinträgt. Kooperation verlangt hier mehr als ein Machtwort.

**Merksatz bisher:** Zoey = Anna Faris.

**Urteil:** Wissensziel ersetzen. Die bisher schwere Besetzungsfrage nach Anna Faris verlangt nur eine Schauspielerzuordnung. Statt einer Umstufung, die dem Film ein schweres Wissensziel nehmen würde, wird ein eigenständiges Handlungsziel vorgeschlagen. Neue Frage- und Wissensziel-ID; das alte Ziel wird nicht überschrieben.

**Wissensziel neu:** Aladeens Begegnung mit den angeblich Hingerichteten erklären

**Neue vollständige Komposition:** „Der Diktator“ (2012): Warum trifft Aladeen (Sacha Baron Cohen) in New York auf Männer, deren Hinrichtung er angeordnet hatte?

- **A:** Sie waren vor ihrer Festnahme geflohen.
- **B:** Sie hatten sich durch Doppelgänger ersetzen lassen.
- **C:** Sie waren heimlich ins Exil geschickt worden. **✓ richtig**
- **D:** Tamir hatte ihre Todesurteile erst nach Aladeens Abreise aufgehoben.

**Neue Identitäten:** Frage `QR4-20261010-DICTATOR-S-001`, Wissensziel `K-QR4-20261010-DICTATOR-S-001`. Die bisherige Besetzungsfrage bleibt als Original erhalten; der Entwurf ist ein Ersatzvorschlag mit neuem Ziel, keine historische Migration.

**Kurzantwort neu:** Die Hinrichtungsbefehle wurden nicht ausgeführt; die Betroffenen leben im amerikanischen Exil.

**Vertiefung neu:** Aladeen (Sacha Baron Cohen) trifft in New York den Nukleartechniker Nadal (Jason Mantzoukas), dessen Hinrichtung er befohlen hatte. In einem Restaurant entdeckt er weitere vermeintlich Getötete. Nadal erklärt, dass die Befehle heimlich durch Verbannung ersetzt wurden. Der Herrscher erfährt dadurch, wie wenig er über die tatsächliche Ausführung seiner eigenen Anordnungen wusste.

**Merksatz neu:** Aladeens angeblich Hingerichtete leben im amerikanischen Exil.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** C: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Cohen als Aladeen/Efawadh, UN-Reise nach New York, Tamirs Entführung, Nadal und die ins Exil Geschickten, Namensersetzung. Für die Arztpointe siehe den zusätzlichen gelesenen Dialog- und Besetzungsbeleg direkt bei Nr. 60; keine neue medizinische Sachbehauptung.

[Beleg 1](https://en.wikipedia.org/wiki/The_Dictator_(2012_film)).

### 60. Der Diktator (2012)

Frage-ID: `KOM-202609-P02-S-032` · Wissensziel: `K-KOM-202609-P02-S-032` · Komödie · schwer.

**Originalfrage:** „Der Diktator“ (2012): Was macht Aladeen mit Wörtern für positive und negative Zustände?

- **A:** Er nummeriert sie ohne Namen
- **B:** Er verbietet nur die negativen Wörter
- **C:** Er übersetzt sie ins Lateinische
- **D:** Er ersetzt beide durch seinen Namen **✓ richtig**

**Kurzantwort bisher:** Aladeen lässt gegensätzliche Begriffe durch Aladeen ersetzen.

**Vertiefung bisher (angezeigt):** Der Personenkult Aladeens (Sacha Baron Cohen) erfasst sogar die Sprache. Wenn gegensätzliche Zustände dasselbe Wort erhalten, verliert eine Auskunft ihren eindeutigen Sinn. Ein medizinischer Befund kann dadurch beruhigend und bedrohlich zugleich klingen. Die Pointe ist ungewöhnlich präzise: Politische Selbstverherrlichung zerstört hier eine elementare Funktion von Kommunikation, nämlich Unterschiede verständlich mitzuteilen.

**Merksatz bisher:** Aladeen kann gut und schlecht heißen.

**Urteil:** Überarbeiten. Die genaue Benennung der Wortgegensätze klärt die vage Frage. Die vorhandene Deutung bleibt an der Arztpointe verankert; ein zusätzlicher allgemeiner Schluss ist entbehrlich.

**Wissensziel beibehalten:** Die Ersetzung gegensätzlicher Wörter durch Aladeen verstehen

**Neue vollständige Komposition:** „Der Diktator“ (2012): Wie verändert Aladeen (Sacha Baron Cohen) die Wörter für „positiv“ und „negativ“?

- **A:** Er nummeriert sie ohne Namen
- **B:** Er verbietet nur die negativen Wörter
- **C:** Er übersetzt sie ins Lateinische
- **D:** Er ersetzt beide durch seinen Namen **✓ richtig**

**Kurzantwort beibehalten:** Aladeen lässt gegensätzliche Begriffe durch Aladeen ersetzen.

**Vertiefung neu:** Aladeens (Sacha Baron Cohen) Name steht nun sowohl für „positiv“ als auch für „negativ“. Ein Arzt (Aasif Mandvi) teilt einem Patienten (Rizwan Manji) deshalb einen „HIV-Aladeen“-Befund mit. Aus dieser Auskunft kann der Mann nicht erkennen, welches der beiden Ergebnisse gemeint ist.

**Merksatz beibehalten:** Aladeen kann gut und schlecht heißen.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** D: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Namensersetzung im Handlungsartikel; Arzt/Patient, Befund und Dialog zusätzlich im gelesenen ClipCafe-Transkript samt Besetzungsangaben. Keine Sichtung des Videos behauptet.

[Beleg 1](https://en.wikipedia.org/wiki/The_Dictator_(2012_film)) · [Beleg 2](https://clip.cafe/the-dictator-2012/do-want-the-aladeen-news-the-aladeen-news/).

### 61. Um Kopf und Kragen (1957)

Frage-ID: `G100-20261008-WESTERN-003-L1` · Wissensziel: `K-G100-20261008-WESTERN-003-L1` · Western · leicht.

**Originalfrage:** Welchen Beruf hat Pat Brennan (Randolph Scott) in „Um Kopf und Kragen“?

- **A:** Kopfgeldjäger
- **B:** Sheriff
- **C:** Postkutscher
- **D:** Rancher **✓ richtig**

**Kurzantwort bisher:** Brennan ist Rancher.

**Vertiefung bisher (angezeigt):** Pat Brennan (Randolph Scott) gerät als Rancher in die Geschichte. Sein Besuch in der Stadt und bei einer anderen Ranch führt ihn zufällig in die Kutsche, die später überfallen wird. Er verfolgt ursprünglich keinen Verbrecher und handelt nicht im Auftrag der Justiz. Die Lage verlangt deshalb von einem privaten Mann, ohne institutionelle Unterstützung Verantwortung für sich und eine weitere Geisel zu übernehmen.

**Merksatz bisher:** Ein Rancher wird zufällig zur Geisel.

**Urteil:** Überarbeiten. Der konkrete Verlust des Pferdes erklärt die zufällige Mitfahrt. Die vorhandenen Berufe bilden eine passende Auswahl.

**Wissensziel beibehalten:** Brennans Beruf und den Zufall seiner Reise einordnen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Brennan ist Rancher.

**Vertiefung neu:** Brennan (Randolph Scott) verliert sein Pferd bei einer Wette und muss sich eine Mitfahrgelegenheit suchen. Der Kutscher Rintoon (Arthur Hunnicutt) nimmt den Rancher in der Kutsche eines frisch verheirateten Paars mit. Am nächsten Halt geraten sie in einen Überfall. Brennan ist dadurch selbst Gefangener der Bande, ohne zuvor auf Verbrecherjagd gewesen zu sein.

**Merksatz beibehalten:** Ein Rancher wird zufällig zur Geisel.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Er lebt nicht als professioneller Kopfgeldjäger. · B: Er bekleidet kein Sheriffamt. · C: Er nimmt die Kutsche als Fahrgast, nicht als Kutscher.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Pferdewette/Rintoon, Willards Vorschlag und späterer Tod, Ushers Abwesenheit/Chinks Misstrauen, Dorettas Vater als Kupferminenbesitzer.

[Beleg 1](https://en.wikipedia.org/wiki/The_Tall_T).

### 62. Um Kopf und Kragen (1957)

Frage-ID: `G100-20261008-WESTERN-003-M2` · Wissensziel: `K-G100-20261008-WESTERN-003-M2` · Western · mittel.

**Originalfrage:** Was schlägt Willard Mims (John Hubbard) den Entführern in „Um Kopf und Kragen“ vor?

- **A:** Ihn für den Minenbesitzer arbeiten zu lassen.
- **B:** Mit ihm die Mine zu überfallen.
- **C:** Seine Frau als Lösegeldgeisel zu nutzen. **✓ richtig**
- **D:** Ihn gegen die anderen Gefangenen einzutauschen.

**Kurzantwort bisher:** Willard bietet seine eigene Frau als Lösegeldquelle an.

**Vertiefung bisher (angezeigt):** Willard Mims (John Hubbard) versucht, sein eigenes Leben zu retten, indem er den Wert seiner Frau Doretta (Maureen O’Sullivan) hervorhebt. Er schlägt der Bande vor, von ihrem reichen Vater Lösegeld zu verlangen. Seine Entscheidung offenbart fehlende Verbundenheit mit der frisch angetrauten Frau. Selbst der Bandenführer Frank Usher (Richard Boone) betrachtet diese Rücksichtslosigkeit mit Verachtung.

**Merksatz bisher:** Willard macht die eigene Frau zur Lösegeldquelle.

**Urteil:** Überarbeiten. Das Motiv war schon erklärt. Die Rückkehr und sein Tod machen die Folge seines Angebots sichtbar.

**Wissensziel beibehalten:** Willards Lösegeldvorschlag als Verrat an Doretta verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Willard bietet seine eigene Frau als Lösegeldquelle an.

**Vertiefung neu:** Willard Mims (John Hubbard) versucht, sein eigenes Leben zu retten, indem er die Bande auf den reichen Vater seiner Frau Doretta (Maureen O’Sullivan) hinweist. Die Entführer schicken ihn mit ihrer Forderung los. Als er zurückkommt, darf er scheinbar gehen, wird jedoch erschossen. Sein Versuch, sich auf Kosten seiner Frau freizukaufen, rettet ihn nicht.

**Merksatz beibehalten:** Willard macht die eigene Frau zur Lösegeldquelle.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Ein Arbeitsangebot an die Mine ist nicht sein Vorschlag. · B: Er plant keinen gemeinsamen Überfall auf die Mine. · D: Er opfert sich nicht als Ersatz für die anderen.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Pferdewette/Rintoon, Willards Vorschlag und späterer Tod, Ushers Abwesenheit/Chinks Misstrauen, Dorettas Vater als Kupferminenbesitzer.

[Beleg 1](https://en.wikipedia.org/wiki/The_Tall_T).

### 63. Um Kopf und Kragen (1957)

Frage-ID: `G100-20261008-WESTERN-003-S1` · Wissensziel: `K-G100-20261008-WESTERN-003-S1` · Western · schwer.

**Originalfrage:** Womit bringt Brennan (Randolph Scott) Chink (Henry Silva) in „Um Kopf und Kragen“ dazu, seinen Wachposten zu verlassen?

- **A:** Mit dem Versprechen eines Fluchtpferds
- **B:** Mit einer angeblichen nahenden Patrouille
- **C:** Mit einem Hinweis auf versteckten Whiskey
- **D:** Mit Misstrauen gegen Ushers (Richard Boone) Geldteilung **✓ richtig**

**Kurzantwort bisher:** Brennan behauptet, Usher könnte das ganze Lösegeld behalten.

**Vertiefung bisher (angezeigt):** Brennan (Randolph Scott) erkennt die Schwäche der Bande: Ihre Mitglieder vertrauen einander nicht vollständig. Er pflanzt Chink (Henry Silva) den Gedanken ein, Frank Usher (Richard Boone) könne mit dem gesamten Lösegeld verschwinden. Chink verlässt deshalb das Versteck, um nach seinem Anführer zu sehen. Brennan erzeugt damit eine Gelegenheit zur Gegenwehr, indem er Gier und Misstrauen gegeneinander ausspielt.

**Merksatz bisher:** Misstrauen gegen die Geldteilung öffnet eine Lücke.

**Urteil:** Überarbeiten. Die vorhandene Erklärung war brauchbar. Die konkrete Aufteilung der Bande erklärt, warum das Misstrauen taktisch nützt.

**Wissensziel beibehalten:** Brennans Täuschung gegenüber Chink nachvollziehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Brennan behauptet, Usher könnte das ganze Lösegeld behalten.

**Vertiefung neu:** Während Usher (Richard Boone) das Lösegeld abholt, bewachen Chink (Henry Silva) und Billy Jack (Skip Homeier) die Geiseln. Brennan (Randolph Scott) bringt Chink auf den Gedanken, ihr Anführer könnte mit der ganzen Summe verschwinden. Chink geht ihm nach. Erst dadurch ist Brennan mit nur noch einem Bewacher im Lager und kann die Gegenwehr beginnen.

**Merksatz beibehalten:** Misstrauen gegen die Geldteilung öffnet eine Lücke.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Ein angebotenes Pferd ist nicht der entscheidende Köder. · B: Eine erfundene Patrouille bewegt Chink hier nicht weg. · C: Whiskey lockt ihn nicht von seiner Bewachung fort.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Pferdewette/Rintoon, Willards Vorschlag und späterer Tod, Ushers Abwesenheit/Chinks Misstrauen, Dorettas Vater als Kupferminenbesitzer.

[Beleg 1](https://en.wikipedia.org/wiki/The_Tall_T).

### 64. Um Kopf und Kragen (1957)

Frage-ID: `G100-20261008-WESTERN-003-L2` · Wissensziel: `K-G100-20261008-WESTERN-003-L2` · Western · leicht.

**Originalfrage:** Woher stammt das Familienvermögen Dorettas (Maureen O’Sullivan) in „Um Kopf und Kragen“?

- **A:** Aus Kupferminen **✓ richtig**
- **B:** Aus Viehzucht
- **C:** Aus Eisenbahnbau
- **D:** Aus Ölquellen

**Kurzantwort bisher:** Dorettas Vater besitzt Kupferminen.

**Vertiefung bisher (angezeigt):** Doretta Mims (Maureen O’Sullivan) ist die Tochter eines wohlhabenden Kupferminenbesitzers. Dieser familiäre Hintergrund macht sie für die Entführer zu einer wertvollen Lösegeldgeisel. Die Bande erkennt, dass mit ihr weit mehr zu gewinnen ist als mit den Fahrgästen einer gewöhnlichen Kutsche. Ihr Reichtum schützt sie also nicht vor Gefahr, sondern verändert gerade die Art der Bedrohung.

**Merksatz bisher:** Kupfervermögen macht Doretta zur Lösegeldgeisel.

**Urteil:** Überarbeiten. Der soziale Hintergrund wird mit dem Wechsel des Verbrechensplans verbunden. Der zusätzliche allgemeine Satz über Reichtum als Gefahr entfällt.

**Wissensziel beibehalten:** Dorettas Familienvermögen als Grundlage der Entführung kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Dorettas Vater besitzt Kupferminen.

**Vertiefung neu:** Dorettas (Maureen O’Sullivan) Vater ist ein reicher Kupferminenbesitzer. Als ihr Mann der Bande dies verrät, ändert sich deren Plan: Aus dem Überfall auf eine vermeintlich gewöhnliche Postkutsche wird eine Entführung mit hoher Lösegeldforderung. Doretta ist dabei auf Hochzeitsreise; gerade ihr frisch angetrauter Mann liefert den Entführern den entscheidenden Hinweis.

**Merksatz beibehalten:** Kupfervermögen macht Doretta zur Lösegeldgeisel.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** B: Das Familienvermögen stammt nicht aus Viehzucht. · C: Ihr Vater wird nicht als Eisenbahnbauer vorgestellt. · D: Ölquellen erklären das Lösegeldpotenzial nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Pferdewette/Rintoon, Willards Vorschlag und späterer Tod, Ushers Abwesenheit/Chinks Misstrauen, Dorettas Vater als Kupferminenbesitzer.

[Beleg 1](https://en.wikipedia.org/wiki/The_Tall_T).

### 65. City of God (2002)

Frage-ID: `F240-20261006-053-L2` · Wissensziel: `K-F240-20261006-053-L2` · Drama · leicht.

**Originalfrage:** Bei welcher brasilianischen Stadt liegt das Viertel in „City of God“?

- **A:** Salvador
- **B:** Rio de Janeiro **✓ richtig**
- **C:** Brasília
- **D:** Recife

**Kurzantwort bisher:** Das Viertel liegt in Rio de Janeiro.

**Vertiefung bisher (angezeigt):** Das Viertel liegt in Rio de Janeiro. Über mehrere Lebensphasen verfolgt die Erzählung dort wachsende organisierte Gewalt, während Buscapé (Alexandre Rodrigues) nach einer eigenen Perspektive sucht.

**Merksatz bisher:** Die Cidade de Deus liegt in Rio de Janeiro.

**Urteil:** Überarbeiten. „Bei welcher Stadt“ war räumlich ungenau. Der neue Wortlaut entspricht der Antwort; die Erzählperspektive ergänzt die reine Ortsangabe.

**Wissensziel beibehalten:** Rio de Janeiro als Schauplatz kennen

**Neue vollständige Komposition:** In welcher brasilianischen Stadt liegt das Viertel aus „City of God“?

- **A:** Salvador
- **B:** Rio de Janeiro **✓ richtig**
- **C:** Brasília
- **D:** Recife

**Kurzantwort beibehalten:** Das Viertel liegt in Rio de Janeiro.

**Vertiefung neu:** Cidade de Deus ist das Viertel in Rio de Janeiro, in dem Buscapé (Alexandre Rodrigues) aufwächst. Der Film springt von seiner Kindheit in die Zeit mächtiger Drogenbanden und erzählt dieselben Orte unter wechselnden Gewaltherrschern. Buscapés Weg zur Fotografie verläuft dabei neben den Geschichten der Täter, nicht außerhalb des Viertels.

**Merksatz beibehalten:** Die Cidade de Deus liegt in Rio de Janeiro.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Salvador ist nicht der Schauplatz. · C: Die Hauptstadt liegt nicht dem Viertel zugrunde. · D: Recife ist nicht der Ort.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Cidade de Deus in Rio, Benés geplanter Ausstieg/versehentliche Tötung, Buscapés zwei Fotomotive und Zeitungspraktikum, Dadinhos falsche Warnung/Motelmorde/spätere Identität.

[Beleg 1](https://en.wikipedia.org/wiki/City_of_God_(2002_film)).

### 66. City of God (2002)

Frage-ID: `F240-20261006-053-M2` · Wissensziel: `K-F240-20261006-053-M2` · Drama · mittel.

**Originalfrage:** Warum gerät Benés (Phellipe Haagensen) Abschiedsparty in „City of God“ zum Wendepunkt?

- **A:** Bené wird beim Verlassen der Stadt von der Polizei erschossen.
- **B:** Zé verliert dort seine Führung nach einer Abstimmung.
- **C:** Bené erklärt der gesamten Bande öffentlich den Krieg.
- **D:** Bené wird versehentlich statt Zé erschossen. **✓ richtig**

**Kurzantwort bisher:** Bené (Phellipe Haagensen) wird versehentlich erschossen.

**Vertiefung bisher (angezeigt):** Bené (Phellipe Haagensen) wird versehentlich erschossen. Sein geplanter Ausstieg endet damit; Zé Pequeno (Leandro Firmino) verliert zugleich einen Partner, der sein Verhalten begrenzen konnte.

**Merksatz bisher:** Benés Ausstieg endet tödlich und verschärft Zés Herrschaft.

**Urteil:** Überarbeiten. Die Kurzantwort nennt jetzt ausdrücklich das verfehlte Ziel. Die geplante gemeinsame Zukunft erklärt, weshalb es überhaupt eine Abschiedsparty gibt.

**Wissensziel beibehalten:** Benés Tod und dessen Bedeutung für die weitere Gewalt verstehen

**Neue vollständige Komposition:** Warum gerät Benés (Phellipe Haagensen) Abschiedsparty in „City of God“ zum Wendepunkt?

- **A:** Bené liefert Zé auf der Party an die Polizei aus.
- **B:** Zé erschießt Bené nach einem Streit über dessen Ausstieg.
- **C:** Bené wird von einem rivalisierenden Händler als Geisel genommen.
- **D:** Bené wird versehentlich statt Zé erschossen. **✓ richtig**

**Kurzantwort neu:** Ein Schütze will Zé treffen, erschießt auf der Abschiedsparty aber versehentlich Bené.

**Vertiefung neu:** Bené (Phellipe Haagensen) will mit Angélica (Alice Braga) das Viertel und den Drogenhandel verlassen. Auf seiner Abschiedsparty richtet sich ein Schuss gegen Zé Pequeno (Leandro Firmino), trifft jedoch Bené. Zé verliert damit den Partner, der seine Angriffe auf rivalisierende Händler bisher begrenzen konnte. Der Ausstieg eines Freundes wird zum Auftakt weiterer Gewalt.

**Merksatz beibehalten:** Benés Ausstieg endet tödlich und verschärft Zés Herrschaft.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Der tödliche Schuss fällt auf der Party. · B: Eine Abstimmung entmachtet Zé nicht. · C: Bené will sich zurückziehen, nicht den Krieg erklären.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Cidade de Deus in Rio, Benés geplanter Ausstieg/versehentliche Tötung, Buscapés zwei Fotomotive und Zeitungspraktikum, Dadinhos falsche Warnung/Motelmorde/spätere Identität.

[Beleg 1](https://en.wikipedia.org/wiki/City_of_God_(2002_film)).

### 67. City of God (2002)

Frage-ID: `F240-20261006-053-S2` · Wissensziel: `K-F240-20261006-053-S2` · Drama · schwer.

**Originalfrage:** Welches Foto wählt Buscapé (Alexandre Rodrigues) am Ende von „City of God“ zur Veröffentlichung?

- **A:** Eine Aufnahme der neuen Kinderbande
- **B:** Zé Pequenos Leiche **✓ richtig**
- **C:** Ein Porträt des lebenden Zé
- **D:** Eine Aufnahme von Benés Abschiedsparty

**Kurzantwort bisher:** Buscapé wählt das Foto von Zé Pequenos Leiche.

**Vertiefung bisher (angezeigt):** Buscapé (Alexandre Rodrigues) wählt das Foto von Zé Pequenos Leiche. Die Aufnahme bringt ihm eine Chance bei der Zeitung; das riskante Bild der korrupten Polizei behält er zurück.

**Merksatz bisher:** Das veröffentlichte Leichenfoto eröffnet die Zeitungsarbeit.

**Urteil:** Überarbeiten. Beide tatsächlich verfügbaren Aufnahmen und die berufliche Folge werden genannt. Das ersetzt die bisher nur angedeutete riskante Alternative.

**Wissensziel beibehalten:** Buscapés Veröffentlichungsauswahl und ihr Risiko verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Buscapé wählt das Foto von Zé Pequenos Leiche.

**Vertiefung neu:** Buscapé (Alexandre Rodrigues) fotografiert sowohl die Polizisten, die Zé Pequeno (Leandro Firmino) Geld abnehmen und freilassen, als auch dessen späteren Leichnam. Das erste Bild würde die Korruption der Polizei enthüllen und ihn gefährden. Er entscheidet sich für das Leichenfoto, das ihm ein Praktikum bei der Zeitung einbringt. Die Fotos der Polizisten behält er zurück.

**Merksatz beibehalten:** Das veröffentlichte Leichenfoto eröffnet die Zeitungsarbeit.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Das gewählte Bild zeigt Zés Leiche. · C: Zé lebt auf dem veröffentlichten Schlussfoto nicht mehr. · D: Das ältere Partybild ist nicht seine Schlusswahl.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Cidade de Deus in Rio, Benés geplanter Ausstieg/versehentliche Tötung, Buscapés zwei Fotomotive und Zeitungspraktikum, Dadinhos falsche Warnung/Motelmorde/spätere Identität.

[Beleg 1](https://en.wikipedia.org/wiki/City_of_God_(2002_film)).

### 68. City of God (2002)

Frage-ID: `F240-20261006-053-M1` · Wissensziel: `K-F240-20261006-053-M1` · Drama · mittel.

**Originalfrage:** Was geschieht beim frühen Motelüberfall in „City of God“ gegen den Plan der älteren Räuber?

- **A:** Die Gäste werden von den Räubern als Geiseln mitgenommen.
- **B:** Dadinho warnt vorab die Polizei.
- **C:** Der junge Dadinho tötet die Gäste. **✓ richtig**
- **D:** Die Räuber brechen den Überfall ohne Beute ab.

**Kurzantwort bisher:** Dadinho (Douglas Silva) tötet die Gäste, obwohl die älteren Räuber niemanden töten wollen.

**Vertiefung bisher (angezeigt):** Dadinho (Douglas Silva) tötet die Gäste, obwohl die älteren Räuber niemanden töten wollen. Der spätere Zé Pequeno (Leandro Firmino) etabliert so früh eine Gewalt, die nicht nur Mittel zur Beute ist.

**Merksatz bisher:** Der Motelüberfall zeigt Dadinhos eigenständige Grausamkeit.

**Urteil:** Überarbeiten. Der Ablauf und die spätere Namensidentität sind wichtiger als das pauschale Urteil, Gewalt sei für ihn mehr als Mittel zur Beute.

**Wissensziel beibehalten:** Dadinho als Urheber des Motelmassakers erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Dadinho (Douglas Silva) tötet die Gäste, obwohl die älteren Räuber niemanden töten wollen.

**Vertiefung neu:** Die älteren Räuber lassen Dadinho (Douglas Silva) beim Motelüberfall als Aufpasser zurück. Mit einer falschen Warnung vor der Polizei bringt er sie zur Flucht und tötet anschließend die Menschen im Motel. Erst später ordnet die Erzählung das Massaker seinem Handeln zu. Dadinho ist derselbe Mensch, der als Erwachsener Zé Pequeno (Leandro Firmino) heißt.

**Merksatz beibehalten:** Der Motelüberfall zeigt Dadinhos eigenständige Grausamkeit.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Das Massaker durch Dadinho überschreitet den Plan. · B: Eine Polizeiwarnung ist nicht seine Handlung. · D: Der Überfall wird nicht einfach abgebrochen.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Cidade de Deus in Rio, Benés geplanter Ausstieg/versehentliche Tötung, Buscapés zwei Fotomotive und Zeitungspraktikum, Dadinhos falsche Warnung/Motelmorde/spätere Identität.

[Beleg 1](https://en.wikipedia.org/wiki/City_of_God_(2002_film)).

### 69. Absolute Beginners (1986)

Frage-ID: `E20261007-F-162-L2` · Wissensziel: `K-E20261007-F-162-L2` · Musik · leicht.

**Originalfrage:** Welche Branche verbindet Suzette (Patsy Kensit) in „Absolute Beginners“ mit Henley (James Fox)?

- **A:** Filmverleih
- **B:** Immobilienversicherung
- **C:** Zeitungsdruck
- **D:** Mode **✓ richtig**

**Kurzantwort bisher:** Suzette (Patsy Kensit) arbeitet in der Modewelt.

**Vertiefung bisher (angezeigt):** Suzette (Patsy Kensit) arbeitet in der Modewelt. Henley (James Fox) nutzt ihre Entwürfe für sein eigenes Ansehen. Die gewünschte Karriere schafft daher eine ungleiche Verbindung. Ihre Vorstellung von Erfolg betrifft nicht nur Können, sondern den Zugang zu Namen, Beziehungen und Möglichkeiten, die andere bereits kontrollieren.

**Merksatz bisher:** Suzettes Entwürfe geraten unter Henleys Namen.

**Urteil:** Überarbeiten. Die bestehende Berufsnennung bleibt. Heirat und Colins Reaktion machen das ungleiche Arbeitsverhältnis zu einem Handlungszusammenhang.

**Wissensziel beibehalten:** Suzettes Modekarriere und Bindung an Henley verstehen

**Neue vollständige Komposition:** Welche Branche verbindet Suzette (Patsy Kensit) in „Absolute Beginners“ mit Henley (James Fox)?

- **A:** Fotografie
- **B:** Werbung
- **C:** Musikproduktion
- **D:** Mode **✓ richtig**

**Kurzantwort beibehalten:** Suzette (Patsy Kensit) arbeitet in der Modewelt.

**Vertiefung neu:** Suzette (Patsy Kensit) entwirft Mode, die ihr Chef Henley (James Fox) für sein eigenes Ansehen nutzt. Dennoch heiratet sie ihn, weil sie sich davon den Zugang zu Erfolg und Wohlstand verspricht. Colin (Eddie O’Connell) verliert sie zunächst an diese Karriereentscheidung. Auch seine spätere Hinwendung zur Werbefotografie hängt mit dem Versuch zusammen, sie zurückzugewinnen.

**Merksatz beibehalten:** Suzettes Entwürfe geraten unter Henleys Namen.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Filmverleih verbindet sie nicht. · B: Eine Versicherung ist nicht die gemeinsame Arbeit. · C: Zeitungsdruck ist nicht ihre Branche.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung und Liedliste: Suzettes Entwürfe/Heirat, Bowie als Vendice Partners/That’s Motivation, Bauprojekt/Didos Verbindung, Filmbezug zu Notting Hill 1958.

[Beleg 1](https://en.wikipedia.org/wiki/Absolute_Beginners_(film)).

### 70. Absolute Beginners (1986)

Frage-ID: `E20261007-F-162-M1` · Wissensziel: `K-E20261007-F-162-M1` · Musik · mittel.

**Originalfrage:** Welche Rolle spielt David Bowie in „Absolute Beginners“?

- **A:** Den Werbemann Vendice Partners **✓ richtig**
- **B:** Den Schneider Henley
- **C:** Den Reporter Colin
- **D:** Den Musiker Mr. Cool

**Kurzantwort bisher:** David Bowie spielt den Werbemann Vendice Partners.

**Vertiefung bisher (angezeigt):** David Bowie spielt den Werbemann Vendice Partners. Seine Angebote richten Colins (Eddie O’Connell) Kamera auf einen kommerziellen Zweck. Die Figur stellt Erfolg als überzeugendes Bild in Aussicht. Der Film kann dadurch die Anziehung der Werbung zeigen, während ihre Verbindung zu weitergehenden Machtinteressen erst erkennbar wird.

**Merksatz bisher:** Bowie verkörpert das verführerische Karriereangebot der Werbung.

**Urteil:** Überarbeiten. Musiknummer und Bauprojekt geben Bowies Rolle ein unverwechselbares Profil. Die Rollenoptionen bleiben gute Alternativen.

**Wissensziel beibehalten:** Bowies Werbemann Vendice Partners erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** David Bowie spielt den Werbemann Vendice Partners.

**Vertiefung neu:** Vendice Partners (David Bowie) wirbt Colin (Eddie O’Connell) als Fotografen für seine Agentur an. Seine große musikalische Selbstdarstellung heißt „That’s Motivation“. Hinter dem versprochenen Aufstieg steht jedoch auch ein Immobilienprojekt, das Colins vielfältige Nachbarschaft verdrängen soll. Der Werbemann gehört damit zu der Geschäftswelt, gegen die Colin später Beweise sammelt.

**Merksatz neu:** David Bowie spielt den Werbemann Vendice Partners.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** B: Henley wird von James Fox gespielt. · C: Colin spielt Eddie O’Connell. · D: Mr. Cool spielt Tony Hippolyte.

**Antwortfeedback neu:** B: Henley wird von James Fox gespielt. · C: Colin spielt Eddie O’Connell. · D: Mr. Cool spielt Tony Hippolyte.

**Quellenprüfung:** Handlung/Besetzung und Liedliste: Suzettes Entwürfe/Heirat, Bowie als Vendice Partners/That’s Motivation, Bauprojekt/Didos Verbindung, Filmbezug zu Notting Hill 1958.

[Beleg 1](https://en.wikipedia.org/wiki/Absolute_Beginners_(film)).

### 71. Absolute Beginners (1986)

Frage-ID: `E20261007-F-162-S2` · Wissensziel: `K-E20261007-F-162-S2` · Musik · schwer.

**Originalfrage:** Welcher reale Konflikt erreicht in „Absolute Beginners“ die Nachbarschaft der Hauptfiguren?

- **A:** Der britische Generalstreik
- **B:** Die Belagerung von Cable Street
- **C:** Die Proteste gegen die Poll Tax
- **D:** Die rassistischen Unruhen von Notting Hill **✓ richtig**

**Kurzantwort bisher:** Die rassistischen Unruhen von Notting Hill erreichen die Nachbarschaft.

**Vertiefung bisher (angezeigt):** Die rassistischen Unruhen von Notting Hill erreichen die Nachbarschaft. Der Film verbindet junge Liebe und musikalische Wünsche mit Gewalt gegen die vielfältige Bevölkerung des Viertels. Die private Entwicklung bleibt dadurch von der gesellschaftlichen Umgebung abhängig. Eine persönliche Versöhnung kann die zuvor sichtbaren Konflikte nicht aus ihrer Geschichte entfernen.

**Merksatz bisher:** Die Musicalwelt gerät in die rassistische Gewalt ihres Viertels.

**Urteil:** Überarbeiten. Das historische Jahr dient der Einordnung, nicht einer zweiten Jahresfrage. Der Film wird nicht als dokumentarisch genaue Rekonstruktion jedes Geschehens ausgegeben.

**Wissensziel beibehalten:** Den historischen Bezug der Gewalt in Notting Hill kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die rassistischen Unruhen von Notting Hill erreichen die Nachbarschaft.

**Vertiefung neu:** Die Geschichte spielt 1958, im Jahr der rassistischen Ausschreitungen in Notting Hill. Colin (Eddie O’Connell) erlebt, wie sich die Feindseligkeit gegen die schwarzen Bewohner seines Viertels organisiert und schließlich in Gewalt umschlägt. Seine Suche nach künstlerischem Erfolg und die Beziehung zu Suzette (Patsy Kensit) verlaufen in diesem bedrohten Umfeld.

**Merksatz beibehalten:** Die Musicalwelt gerät in die rassistische Gewalt ihres Viertels.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Der Generalstreik gehört zu einer anderen Zeit. · B: Cable Street bezeichnet ein früheres Ereignis. · C: Die Poll-Tax-Proteste liegen deutlich später.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung und Liedliste: Suzettes Entwürfe/Heirat, Bowie als Vendice Partners/That’s Motivation, Bauprojekt/Didos Verbindung, Filmbezug zu Notting Hill 1958.

[Beleg 1](https://en.wikipedia.org/wiki/Absolute_Beginners_(film)).

### 72. Absolute Beginners (1986)

Frage-ID: `E20261007-F-162-S1` · Wissensziel: `K-E20261007-F-162-S1` · Musik · schwer.

**Originalfrage:** Warum hilft Dido (Anita Morris) Colin bei der Aufdeckung des Bauprojekts in „Absolute Beginners“ nicht?

- **A:** Sie kann die Fotos wegen einer Erblindung nicht sehen.
- **B:** Sie hat London schon verlassen.
- **C:** Sie arbeitet mit dem verantwortlichen Werbemann zusammen. **✓ richtig**
- **D:** Sie wurde zuvor von Colin wegen Diebstahls angezeigt.

**Kurzantwort bisher:** Dido (Anita Morris) ist mit dem verantwortlichen Werbemann verbunden.

**Vertiefung bisher (angezeigt):** Dido (Anita Morris) ist mit dem verantwortlichen Werbemann verbunden. Colins (Eddie O’Connell) Versuch, Beweise öffentlich zu machen, trifft damit auf eine Abhängigkeit in der vermeintlichen Vermittlung. Das Vorhandensein von Bildern genügt nicht. Ihre Veröffentlichung benötigt jemanden, dessen Interessen dem Aufdeckungsversuch nicht entgegenstehen.

**Merksatz bisher:** Die vermeintliche Vermittlerin gehört zum entlarvten Interesse.

**Urteil:** Überarbeiten. Die konkrete Veröffentlichungssituation ersetzt die abstrakte Aussage über Vermittlung. Abwegige Ablenkungen durch Erblindung oder eine Diebstahlsanzeige werden durch plausible Interessen ersetzt.

**Wissensziel beibehalten:** Didos Interessenkonflikt bei der Veröffentlichung verstehen

**Neue vollständige Komposition:** Warum hilft Dido (Anita Morris) Colin bei der Aufdeckung des Bauprojekts in „Absolute Beginners“ nicht?

- **A:** Sie hält die Bilder für eine von Colin inszenierte Werbung.
- **B:** Sie will zuerst Henleys Einwilligung zur Veröffentlichung erhalten.
- **C:** Sie arbeitet mit dem verantwortlichen Werbemann zusammen. **✓ richtig**
- **D:** Sie erwartet von Colin Geld für die Veröffentlichung.

**Kurzantwort beibehalten:** Dido (Anita Morris) ist mit dem verantwortlichen Werbemann verbunden.

**Vertiefung neu:** Colin (Eddie O’Connell) schickt der Gesellschaftskolumnistin Dido (Anita Morris) belastende Fotos über das Bauprojekt. Er hofft, dass sie die Pläne öffentlich macht. Dido steht jedoch mit Vendice Partners (David Bowie) in Verbindung, dessen Geschäfte die Bilder betreffen. Seine Beweise gelangen so ausgerechnet an eine Verbündete des Mannes, den er entlarven will.

**Merksatz neu:** Dido ist mit Vendice Partners verbündet, den Colin entlarven will.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Eine Erblindung ist nicht der Grund. · B: Sie fehlt nicht wegen einer Abreise. · D: Eine Diebstahlsanzeige erklärt ihre Reaktion nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung und Liedliste: Suzettes Entwürfe/Heirat, Bowie als Vendice Partners/That’s Motivation, Bauprojekt/Didos Verbindung, Filmbezug zu Notting Hill 1958.

[Beleg 1](https://en.wikipedia.org/wiki/Absolute_Beginners_(film)).

### 73. Oben (2009)

Frage-ID: `F240-20261006-012-L1` · Wissensziel: `K-F240-20261006-012-L1` · Abenteuer · leicht.

**Originalfrage:** Wie macht Carl Fredricksen (Originalstimme Ed Asner) sein Haus in „Oben“ reisefähig?

- **A:** Er befestigt zahlreiche Heliumballons daran. **✓ richtig**
- **B:** Er montiert Flugzeugpropeller an den Dachbalken.
- **C:** Er baut das Haus auf einen fahrbaren Anhänger.
- **D:** Er befestigt es an einem großen Luftschiff.

**Kurzantwort bisher:** Viele Heliumballons lassen das Haus fliegen.

**Vertiefung bisher (angezeigt):** Carl hat früher Ballons verkauft. Nun nutzt er sie für eine Reise, die er mit seiner Frau Ellie geplant hatte. Ellie wird nur als Kind von Elie Docter gesprochen; als Erwachsene ist sie in der weitgehend wortlosen Lebensmontage zu sehen. Carls vertraute Berufswelt liefert das fantastische Transportmittel.

**Merksatz bisher:** Der frühere Ballonverkäufer hebt sein Haus mit Ballons an.

**Urteil:** Überarbeiten. Der Berufsbezug ist gut. Die unverbundene Sprecherinneninformation über Ellie wird durch Anlass und Reiseziel ersetzt.

**Wissensziel beibehalten:** Die Ballons als Transportmittel und Carls Aufbruch einordnen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Viele Heliumballons lassen das Haus fliegen.

**Vertiefung neu:** Carl (Originalstimme Ed Asner) hat früher Ballons verkauft. Als er in ein Seniorenheim umziehen soll, lässt er stattdessen sein ganzes Haus mit Heliumballons aufsteigen. Sein Ziel sind die südamerikanischen Paradiesfälle, von denen er und Ellie seit ihrer Kindheit geträumt haben. Er nimmt den vertrauten Wohnort buchstäblich auf die versäumte Reise mit.

**Merksatz beibehalten:** Der frühere Ballonverkäufer hebt sein Haus mit Ballons an.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die Ballons heben das Haus in die Luft. · B: Keine Propeller tragen das Haus. · C: Das Haus fliegt durch Ballons und fährt nicht auf einem Anhänger. · D: Es hängt nicht an einem Luftschiff, sondern an vielen Ballons.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Originalstimmen: Ballonverkäufer/Seniorenheim/Paradiesfälle, Carls Entscheidung vor dem Buchfund und Möbelentladung, Muntz’ angezweifeltes Skelett, Russell/Abzeichen/Kronkorken.

[Beleg 1](https://en.wikipedia.org/wiki/Up_(2009_film)).

### 74. Oben (2009)

Frage-ID: `F240-20261006-012-M2` · Wissensziel: `K-F240-20261006-012-M2` · Abenteuer · mittel.

**Originalfrage:** Was erkennt Carl (Originalstimme Ed Asner) beim erneuten Lesen von Ellies Abenteuerbuch in „Oben“?

- **A:** Ellie plante die Südamerikareise heimlich mit einem anderen Begleiter.
- **B:** Ellie wollte die früheren gemeinsamen Erlebnisse vergessen.
- **C:** Ellie betrachtete erst die Reise als Beginn ihres wirklichen Lebens.
- **D:** Ihr gemeinsames Alltagsleben war für sie bereits das Abenteuer. **✓ richtig**

**Kurzantwort bisher:** Ellies Buch würdigt ihr gemeinsames Leben als erfülltes Abenteuer.

**Vertiefung bisher (angezeigt):** Carl hatte das ausgebliebene Reiseziel als unerfülltes Versprechen verstanden. Ellies Erinnerungsseiten setzen dem die Bedeutung des Zusammenlebens entgegen. Danach kann er sich stärker auf Russell (Jordan Nagai) und die gegenwärtige Rettungsaufgabe einlassen.

**Merksatz bisher:** Ellies Abenteuerbuch öffnet Carl für ein neues Abenteuer.

**Urteil:** Überarbeiten. Die alte Deutung trifft zu. Jetzt wird sichtbar, nach welcher Fehlentscheidung Carl liest und welche konkrete Handlung daraus folgt.

**Wissensziel beibehalten:** Ellies Abenteuerbuch als Wendepunkt verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Ellies Buch würdigt ihr gemeinsames Leben als erfülltes Abenteuer.

**Vertiefung neu:** Carl (Originalstimme Ed Asner) hat gerade sein Haus gerettet und dafür zugelassen, dass Muntz (Originalstimme Christopher Plummer) den Vogel Kevin mitnimmt. Dann findet er in Ellies Buch Fotos ihres gemeinsamen Alltags und ihren Dank für dieses Abenteuer. Er räumt die schweren Möbel aus dem Haus, gewinnt Auftrieb zurück und folgt Russell (Originalstimme Jordan Nagai) zur Rettung Kevins.

**Merksatz neu:** Ellies Abenteuer war das gemeinsame Leben; Carl darf weiterziehen.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Die Erinnerungsseiten belegen die Bedeutung ihres gemeinsamen Lebens. · B: Ellie bewahrt und würdigt die Erinnerungen, statt sie zu verwerfen. · C: Gerade das bereits gelebte gemeinsame Leben zählt für sie als Abenteuer. · D: Die gemeinsamen Lebensbilder verändern seinen Blick auf die unerfüllte Reise.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Originalstimmen: Ballonverkäufer/Seniorenheim/Paradiesfälle, Carls Entscheidung vor dem Buchfund und Möbelentladung, Muntz’ angezweifeltes Skelett, Russell/Abzeichen/Kronkorken.

[Beleg 1](https://en.wikipedia.org/wiki/Up_(2009_film)).

### 75. Oben (2009)

Frage-ID: `F240-20261006-012-S2` · Wissensziel: `K-F240-20261006-012-S2` · Abenteuer · schwer.

**Originalfrage:** Wozu will Charles Muntz (Originalstimme Christopher Plummer) in „Oben“ den seltenen Vogel lebend fangen?

- **A:** Er will ihn als besonderes Ausstellungsstück an einen Zoo verkaufen.
- **B:** Er will seinen angezweifelten Fund wissenschaftlich bestätigen. **✓ richtig**
- **C:** Er will die Art in seinem eigenen Tierpark züchten.
- **D:** Er will einen neuen Rekord für seine Flugexpedition aufstellen.

**Kurzantwort bisher:** Muntz will nach der Zurückweisung seines früheren Fundes rehabilitiert werden.

**Vertiefung bisher (angezeigt):** Ein Vogelskelett hatte ihm statt Anerkennung den Verdacht einer Fälschung eingebracht. Die Suche nach einem lebenden Beweis bestimmt sein weiteres Leben. Carls (Ed Asner) Jugendidol wird dadurch zum gefährlichen Gegner.

**Merksatz bisher:** Muntz jagt den Vogel als Beweis für seine angezweifelte Entdeckung.

**Urteil:** Vertiefung beibehalten. Die vorhandenen drei Sätze verbinden das angezweifelte Skelett, den lebenden Beweis und die Wendung vom Idol zum Gegner bereits präzise. Kein zusätzlicher Handlungsabriss nötig. Nur die bereits gefragte Motivation bleibt der Fokus.

**Wissensziel beibehalten:** Muntz’ Jagd als Versuch der Rehabilitierung verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Muntz will nach der Zurückweisung seines früheren Fundes rehabilitiert werden.

**Vertiefung beibehalten:** Ein Vogelskelett hatte ihm statt Anerkennung den Verdacht einer Fälschung eingebracht. Die Suche nach einem lebenden Beweis bestimmt sein weiteres Leben. Carls (Ed Asner) Jugendidol wird dadurch zum gefährlichen Gegner.

**Merksatz beibehalten:** Muntz jagt den Vogel als Beweis für seine angezweifelte Entdeckung.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Ein Verkaufsauftrag an einen Zoo ist nicht der entscheidende Antrieb. · B: Ein lebendes Exemplar soll seine frühere Entdeckung bestätigen. · C: Die Rehabilitierung seiner früheren Entdeckung treibt die Jagd an. · D: Ein Flugrekord erklärt seine Fixierung auf den lebenden Vogel nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Originalstimmen: Ballonverkäufer/Seniorenheim/Paradiesfälle, Carls Entscheidung vor dem Buchfund und Möbelentladung, Muntz’ angezweifeltes Skelett, Russell/Abzeichen/Kronkorken.

[Beleg 1](https://en.wikipedia.org/wiki/Up_(2009_film)).

### 76. Oben (2009)

Frage-ID: `F240-20261006-012-L2` · Wissensziel: `K-F240-20261006-012-L2` · Abenteuer · leicht.

**Originalfrage:** Wer reist in „Oben“ unbeabsichtigt auf Carls (Originalstimme Ed Asner) Veranda mit?

- **A:** Ein Arbeiter von der benachbarten Baustelle
- **B:** Der junge Pfadfinder Russell **✓ richtig**
- **C:** Ein Mitarbeiter des Seniorenheims
- **D:** Ein Besucher von Charles Muntz

**Kurzantwort bisher:** Der junge Pfadfinder Russell wird zum unerwarteten Mitreisenden.

**Vertiefung bisher (angezeigt):** Russell (Jordan Nagai) möchte einem älteren Menschen helfen, um sein letztes Abzeichen zu verdienen. Sein kleiner Hilfsauftrag führt ihn plötzlich nach Südamerika. Carl erhält einen Begleiter, den er nicht eingeplant hat.

**Merksatz bisher:** Russells Hilfsabzeichen führt ihn auf eine unerwartete Reise.

**Urteil:** Überarbeiten. Der Anfang mit dem fehlenden Abzeichen erhält seinen passenden Abschluss. Dieser Beziehungsbogen ergänzt die andere Vertiefung über Carls Haus.

**Wissensziel beibehalten:** Russell als unbeabsichtigten Mitreisenden erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Der junge Pfadfinder Russell wird zum unerwarteten Mitreisenden.

**Vertiefung neu:** Russell (Originalstimme Jordan Nagai) braucht noch ein Abzeichen für Hilfe an älteren Menschen und sucht deshalb Carl (Originalstimme Ed Asner) auf. Beim Abheben steht er auf dessen Veranda. Aus dem lästigen Besucher wird auf der Reise ein Begleiter, für den Carl Verantwortung übernimmt. Zurück zu Hause überreicht Carl ihm schließlich Ellies alten Kronkorken als besonderes Abzeichen.

**Merksatz beibehalten:** Russells Hilfsabzeichen führt ihn auf eine unerwartete Reise.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Kein Bauarbeiter wird als unerwarteter Mitreisender mitgenommen. · B: Russell bleibt auf der Veranda und wird mitgenommen. · C: Russell ist kein Mitarbeiter des Seniorenheims. · D: Der Junge besucht Carl für sein Hilfsabzeichen, nicht im Auftrag von Muntz.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Originalstimmen: Ballonverkäufer/Seniorenheim/Paradiesfälle, Carls Entscheidung vor dem Buchfund und Möbelentladung, Muntz’ angezweifeltes Skelett, Russell/Abzeichen/Kronkorken.

[Beleg 1](https://en.wikipedia.org/wiki/Up_(2009_film)).

### 77. Das Schwert der gelben Tigerin (1966)

Frage-ID: `G100-20261008-MARTIALARTS-002-L1` · Wissensziel: `K-G100-20261008-MARTIALARTS-002-L1` · Martial Arts & Asia-Film · leicht.

**Originalfrage:** Wen will Golden Swallow (Cheng Pei-pei) in „Das Schwert der gelben Tigerin“ aus der Gewalt der Banditen befreien?

- **A:** Ihren Vater
- **B:** Ihren Verlobten
- **C:** Ihren Bruder **✓ richtig**
- **D:** Ihren Lehrer

**Kurzantwort bisher:** Golden Swallow sucht ihren entführten Bruder.

**Vertiefung bisher (angezeigt):** Golden Swallow (Cheng Pei-pei) ist die Tochter des Gouverneurs. Banditen halten ihren Bruder gefangen und verlangen die Freilassung ihres eigenen inhaftierten Anführers. Sie zieht aus, um ihn zu retten, und tritt zunächst in Männerkleidung auf. Die Familienbindung gibt der Mission einen persönlichen Grund, während die Erpressung zugleich die staatliche Ordnung trifft. Ihre Fähigkeiten werden früh sichtbar, als sie den Männern in einer Herberge entgegentritt.

**Merksatz bisher:** Eine Schwester übernimmt die Rettung ihres Bruders.

**Urteil:** Überarbeiten. Die guten Handlungselemente bleiben erhalten und werden gestrafft. Keine weitere abstrakte Bewertung ihrer Fähigkeiten nötig.

**Wissensziel beibehalten:** Golden Swallows Rettungsauftrag und die Erpressung verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Golden Swallow sucht ihren entführten Bruder.

**Vertiefung neu:** Die Banditen wollen ihren inhaftierten Anführer freipressen und entführen dazu den Sohn des Gouverneurs. Dessen Schwester Golden Swallow (Cheng Pei-pei) übernimmt die Rettung. In Männerkleidung stellt sie sich den Gegnern zunächst in einer Herberge. Ihre Mission betrifft somit die eigene Familie und eine Erpressung der staatlichen Autorität zugleich.

**Merksatz beibehalten:** Eine Schwester übernimmt die Rettung ihres Bruders.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Ihr Vater ist nicht die festgehaltene Geisel. · B: Die Rettung gilt keinem Verlobten. · C: Der Gefangene ist ihr Bruder, der Sohn des Gouverneurs. · D: Ein entführter Lehrer ist nicht der Anlass der Mission.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: entführter Gouverneurssohn/Schwester, Kloster und korrupter Abt, Tempel-Schriftzeichen im Lied, Giftpfeil, Pflege durch Fan Da-pei und gemeinsame Kampfkunst-Vorgeschichte mit Liao Kung.

[Beleg 1](https://en.wikipedia.org/wiki/Come_Drink_with_Me).

### 78. Das Schwert der gelben Tigerin (1966)

Frage-ID: `G100-20261008-MARTIALARTS-002-M1` · Wissensziel: `K-G100-20261008-MARTIALARTS-002-M1` · Martial Arts & Asia-Film · mittel.

**Originalfrage:** Welchen Ort haben Jade-Faced Tiger (Chan Hung-lit) und seine Banditen in „Das Schwert der gelben Tigerin“ als Stützpunkt besetzt?

- **A:** Ein buddhistisches Kloster **✓ richtig**
- **B:** Eine aufgegebene Grenzfestung
- **C:** Das Anwesen eines Provinzrichters
- **D:** Eine Herberge an der Handelsstraße

**Kurzantwort bisher:** Die Banditen nutzen ein buddhistisches Kloster.

**Vertiefung bisher (angezeigt):** Der korrupte Abt Liao Kung (Yeung Chi-hing) unterstützt die Bande in seinem Kloster. Golden Swallow (Cheng Pei-pei) nähert sich der Anlage in der Verkleidung einer Gläubigen, wird aber erkannt und angegriffen. Ein religiöser Ort bietet damit Schutz für ein kriminelles Vorhaben. Der Schauplatz verbindet die Rettungsmission mit einem zweiten Konflikt: Innerhalb der Kampfkunstschule wird um die rechtmäßige Nachfolge und die Verantwortung ihres Leiters gestritten.

**Merksatz bisher:** Das Kloster dient der Bande als geschützter Stützpunkt.

**Urteil:** Überarbeiten. Der Schauplatz wird mit dem zweiten Konflikt verbunden. Die alte vage Formulierung eines Nachfolgestreits wird durch den Anlass präzisiert.

**Wissensziel beibehalten:** Das besetzte Kloster und Liao Kungs Unterstützung erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die Banditen nutzen ein buddhistisches Kloster.

**Vertiefung neu:** Die Bande hält sich mit Unterstützung des korrupten Abts Liao Kung (Yeung Chi-hing) im buddhistischen Kloster auf. Golden Swallow (Cheng Pei-pei) betritt es als vermeintliche Gläubige, wird aber entdeckt. Liao Kung ist außerdem mit ihrem Helfer Fan Da-pei (Yueh Hua) verbunden: Beide gehörten derselben Kampfkunstschule an, deren Meister Liao ermordet hat.

**Merksatz beibehalten:** Das Kloster dient der Bande als geschützter Stützpunkt.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die Bande versteckt sich in einem buddhistischen Kloster. · B: Die besetzte Anlage ist keine Grenzfestung. · C: Das Richteranwesen ist nicht ihr Stützpunkt. · D: Die Herberge ist ein früherer Schauplatz, aber nicht dieser Stützpunkt.

**Antwortfeedback neu:** D: Die Herberge ist ein früherer Schauplatz, aber nicht dieser Stützpunkt.

**Quellenprüfung:** Handlung/Besetzung: entführter Gouverneurssohn/Schwester, Kloster und korrupter Abt, Tempel-Schriftzeichen im Lied, Giftpfeil, Pflege durch Fan Da-pei und gemeinsame Kampfkunst-Vorgeschichte mit Liao Kung.

[Beleg 1](https://en.wikipedia.org/wiki/Come_Drink_with_Me).

### 79. Das Schwert der gelben Tigerin (1966)

Frage-ID: `G100-20261008-MARTIALARTS-002-S1` · Wissensziel: `K-G100-20261008-MARTIALARTS-002-S1` · Martial Arts & Asia-Film · schwer.

**Originalfrage:** Wie übermittelt Fan Da-pei (Yueh Hua) Golden Swallow (Cheng Pei-pei) in „Das Schwert der gelben Tigerin“ unauffällig den Aufenthaltsort der Banditen?

- **A:** Durch eine Karte im Boden ihrer Reisschüssel
- **B:** Durch Schriftzeichen auf gestohlenen Spielkarten
- **C:** Durch einen verschlüsselten Hinweis in einem Lied **✓ richtig**
- **D:** Durch Kerben im Griff ihres Schwertes

**Kurzantwort bisher:** Ein Lied verschlüsselt den Hinweis auf den Tempel.

**Vertiefung bisher (angezeigt):** Fan Da-pei (Yueh Hua) will seine Hilfe nicht offen zugeben. In einem Lied versteckt er deshalb einen Hinweis, der auf das chinesische Schriftzeichen für Tempel führt. Golden Swallow (Cheng Pei-pei) kann daraus den gesuchten Aufenthaltsort ableiten. Die Information wird in eine alltägliche Darbietung eingebaut. Der Film nutzt also nicht nur Waffen und Körperbewegungen, sondern auch die Verbindung von Sprache, Musik und Schrift als Mittel verdeckter Verständigung.

**Merksatz bisher:** Das gesungene Rätsel führt zum Tempel.

**Urteil:** Überarbeiten. Das Schriftzeichen ist der interessante Kern des bereits guten Textes. Die anschließende allgemeine Aufzählung filmischer Ausdrucksmittel entfällt.

**Wissensziel beibehalten:** Den gesungenen Hinweis als Schriftzeichenrätsel verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Ein Lied verschlüsselt den Hinweis auf den Tempel.

**Vertiefung neu:** Fan Da-pei (Yueh Hua) gibt sich als umherziehender Trinker und Bettler, der seine Fähigkeiten verbirgt. Sein Lied beschreibt das chinesische Schriftzeichen für einen Tempel. Golden Swallow (Cheng Pei-pei) muss den Hinweis entschlüsseln, um das Versteck zu finden. Die Hilfe bleibt so in einer unauffälligen Darbietung verborgen.

**Merksatz beibehalten:** Das gesungene Rätsel führt zum Tempel.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Eine versteckte Karte in der Schüssel gibt es bei dieser Mitteilung nicht. · B: Spielkarten tragen den Hinweis nicht. · C: Das Lied enthält einen Hinweis auf das Schriftzeichen für Tempel. · D: Der Schwertgriff wird nicht als Nachrichtenträger verwendet.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: entführter Gouverneurssohn/Schwester, Kloster und korrupter Abt, Tempel-Schriftzeichen im Lied, Giftpfeil, Pflege durch Fan Da-pei und gemeinsame Kampfkunst-Vorgeschichte mit Liao Kung.

[Beleg 1](https://en.wikipedia.org/wiki/Come_Drink_with_Me).

### 80. Das Schwert der gelben Tigerin (1966)

Frage-ID: `G100-20261008-MARTIALARTS-002-M2` · Wissensziel: `K-G100-20261008-MARTIALARTS-002-M2` · Martial Arts & Asia-Film · mittel.

**Originalfrage:** Wodurch wird Golden Swallow (Cheng Pei-pei) bei ihrem Angriff auf die Banditen in „Das Schwert der gelben Tigerin“ vergiftet?

- **A:** Durch einen präparierten Weinbecher
- **B:** Durch einen vergifteten Wurfpfeil **✓ richtig**
- **C:** Durch Rauch aus einer Räucherschale
- **D:** Durch Pulver auf einer Schwertklinge

**Kurzantwort bisher:** Ein vergifteter Wurfpfeil zwingt die Heldin zum Rückzug.

**Vertiefung bisher (angezeigt):** Golden Swallow (Cheng Pei-pei) kämpft im besetzten Kloster gegen eine Überzahl von Gegnern. Ein vergifteter Wurfpfeil verletzt sie, und sie kann nur mit Hilfe von Fan Da-pei (Yueh Hua) entkommen. Er versorgt sie anschließend und ermöglicht ihre Genesung. Die Verletzung unterbricht die scheinbar souveräne Einzelmission. Während der erzwungenen Pause erfährt die Heldin mehr über ihren Helfer und dessen komplizierte Verbindung zum Gegner.

**Merksatz bisher:** Der Giftpfeil führt von der Einzelmission zur Zusammenarbeit.

**Urteil:** Überarbeiten. Die gute Kausalität der alten Vertiefung wird erhalten. Die zuvor bloß „komplizierte Verbindung“ wird als tatsächliche Jugendbeziehung benannt.

**Wissensziel beibehalten:** Die Giftverletzung und Fan Da-peis Hilfe verbinden

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Ein vergifteter Wurfpfeil zwingt die Heldin zum Rückzug.

**Vertiefung neu:** Beim Kampf im Kloster trifft Golden Swallow (Cheng Pei-pei) ein vergifteter Wurfpfeil. Fan Da-pei (Yueh Hua) rettet und pflegt sie. Während sie sich erholt, erfährt sie, dass der scheinbare Trinker ein Kampfkunstmeister ist und Liao Kung (Yeung Chi-hing) seit seiner Jugend kennt. Die Verletzung unterbricht die Rettungsmission und legt die Vorgeschichte ihres Helfers frei.

**Merksatz neu:** Nach dem Giftpfeil rettet und pflegt Fan Da-pei Golden Swallow.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die Vergiftung erfolgt nicht beim Trinken. · B: Im Kampf trifft sie ein mit Gift versehener Wurfpfeil. · C: Rauch ist nicht der gezeigte Übertragungsweg. · D: Die konkrete Waffe ist ein Wurfpfeil, keine präparierte Schwertklinge.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: entführter Gouverneurssohn/Schwester, Kloster und korrupter Abt, Tempel-Schriftzeichen im Lied, Giftpfeil, Pflege durch Fan Da-pei und gemeinsame Kampfkunst-Vorgeschichte mit Liao Kung.

[Beleg 1](https://en.wikipedia.org/wiki/Come_Drink_with_Me).

### 81. Die Weite der Nacht (2019)

Frage-ID: `F240-20261006-191-L2` · Wissensziel: `K-F240-20261006-191-L2` · Science-Fiction · leicht.

**Originalfrage:** Welches Medium nutzt Everett (Jake Horowitz) in „Die Weite der Nacht“, um Zeugen des Signals zu finden?

- **A:** Eine Fernsehliveshow
- **B:** Seine Radiosendung **✓ richtig**
- **C:** Eine Zeitungsanzeige
- **D:** Ein öffentlicher Kinofilm

**Kurzantwort bisher:** Everett bittet über seinen Radiosender um Informationen.

**Vertiefung bisher (angezeigt):** Everett bittet über seinen Radiosender um Informationen. Der lokale Empfang verbindet einzelne Beobachtungen; die Suche entwickelt sich durch Stimmen und Geschichten, bevor die Figuren einen sichtbaren Beleg erhalten.

**Merksatz bisher:** Das Radio verbindet die verstreuten Zeugen.

**Urteil:** Überarbeiten. Sender, Anrufer und dessen konkrete Information ersetzen eine allgemeine Aussage über Stimmen und Geschichten.

**Wissensziel beibehalten:** Die Radiosendung als Mittel der Zeugensuche verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Everett bittet über seinen Radiosender um Informationen.

**Vertiefung neu:** Fay (Sierra McCormick) hört das Signal während ihrer Arbeit an der Telefonvermittlung und informiert Everett (Jake Horowitz). Er fordert die Hörer seines Radiosenders WOTW zu Hinweisen auf. Daraufhin meldet sich Billy (Bruce Davis), der denselben Ton bei einem geheimen Militäreinsatz gehört haben will. Ein lokaler Sendeabend wird dadurch zur öffentlich geführten Spurensuche.

**Merksatz beibehalten:** Das Radio verbindet die verstreuten Zeugen.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Eine Fernsehsendung moderiert er nicht. · C: Eine Anzeige ist nicht das unmittelbare Medium. · D: Ein Kinofilm sammelt die Aussagen nicht.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: WOTW/Fay/Billy, ältere Aufnahme und Bibliothek, Mabels Sprache/Trance im Auto, Basketballabend/Lichtung/Mutterschiff/verschwundene drei und zurückgebliebene Spuren.

[Beleg 1](https://en.wikipedia.org/wiki/The_Vast_of_Night).

### 82. Die Weite der Nacht (2019)

Frage-ID: `F240-20261006-191-M2` · Wissensziel: `K-F240-20261006-191-M2` · Science-Fiction · mittel.

**Originalfrage:** Wo finden Fay (Sierra McCormick) und Everett (Jake Horowitz) in „Die Weite der Nacht“ eine frühere Aufnahme des Signals?

- **A:** Im Archiv des Radiosenders
- **B:** Im Unterrichtsraum der Schule
- **C:** Im Büro des Polizeichefs
- **D:** In der Bibliothek **✓ richtig**

**Kurzantwort bisher:** Ein verstorbener Beteiligter hat Tonbänder der Bibliothek hinterlassen.

**Vertiefung bisher (angezeigt):** Ein verstorbener Beteiligter hat Tonbänder der Bibliothek hinterlassen. Fay (Sierra McCormick) holt sie; Everett (Jake Horowitz) kann das aktuelle Signal dadurch mit einer älteren dokumentierten Erfahrung verknüpfen.

**Merksatz bisher:** Das Bibliotheksband verbindet frühere und aktuelle Ereignisse.

**Urteil:** Überarbeiten. Die Bibliothek ist kein beliebiger Archivort mehr. Herkunft, Suche und erneute Ausstrahlung bilden einen eigenständigen Handlungsabschnitt.

**Wissensziel beibehalten:** Den Weg zur älteren Signalaufnahme nachvollziehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Ein verstorbener Beteiligter hat Tonbänder der Bibliothek hinterlassen.

**Vertiefung neu:** Billy (Bruce Davis) berichtet, dass ein früherer Kamerad das Signal heimlich auf Tonband aufgenommen und Kopien verteilt habe. Eine davon gehörte einem inzwischen verstorbenen Mann aus Cayuga, dessen Bänder in die Bibliothek gelangten. Fay (Sierra McCormick) holt sie, und Everett (Jake Horowitz) sendet die gefundene Aufnahme. Kurz darauf fällt im Sender der Strom aus.

**Merksatz beibehalten:** Das Bibliotheksband verbindet frühere und aktuelle Ereignisse.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die gesuchte Aufnahme findet sich in der Bibliothek. · B: Ein Klassenraum ist nicht ihr Fundort. · C: Die Bibliothek liefert die Aufnahme.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: WOTW/Fay/Billy, ältere Aufnahme und Bibliothek, Mabels Sprache/Trance im Auto, Basketballabend/Lichtung/Mutterschiff/verschwundene drei und zurückgebliebene Spuren.

[Beleg 1](https://en.wikipedia.org/wiki/The_Vast_of_Night).

### 83. Die Weite der Nacht (2019)

Frage-ID: `F240-20261006-191-S2` · Wissensziel: `K-F240-20261006-191-S2` · Science-Fiction · schwer.

**Originalfrage:** Was bleibt nach dem Spiel am Ende von „Die Weite der Nacht“ von Fay (Sierra McCormick), Everett (Jake Horowitz) und Maddie zurück?

- **A:** Ein Auto mit eingeschaltetem Funkgerät
- **B:** Fußspuren und das Aufnahmegerät **✓ richtig**
- **C:** Ein Brief mit einer erklärten Abreise
- **D:** Die unveränderte Wohnung mit allen drei Personen

**Kurzantwort bisher:** Fay (Sierra McCormick), Everett (Jake Horowitz) und die kleine Maddie sind verschwunden.

**Vertiefung bisher (angezeigt):** Fay (Sierra McCormick), Everett (Jake Horowitz) und die kleine Maddie sind verschwunden. Die Einwohner finden nur Spuren und das Aufnahmegerät; das zuvor zentrale Sammeln von Stimmen endet mit einer auffälligen Abwesenheit seiner jungen Ermittler.

**Merksatz bisher:** Der aufgezeichneten Zeugenschaft fehlen am Schluss ihre Sammler.

**Urteil:** Überarbeiten. „Nach dem Spiel“ wird als Basketballspiel präzisiert. Die Kurzantwort nennt jetzt die gefragten Gegenstände. Keine erklärte Reise oder sicher beobachtete Entführung aus der Leerstelle erfinden.

**Wissensziel beibehalten:** Die am Ende zurückgebliebenen Spuren erkennen

**Neue vollständige Komposition:** Was bleibt nach dem Basketballspiel am Ende von „Die Weite der Nacht“ von Fay (Sierra McCormick), Everett (Jake Horowitz) und der kleinen Maddie zurück?

- **A:** Ein Auto mit eingeschaltetem Funkgerät
- **B:** Fußspuren und das Aufnahmegerät **✓ richtig**
- **C:** Ein zurückgelassenes Tonband mit einer Abschiedsnachricht
- **D:** Ein verbrannter Kinderwagen und Kleidungsstücke

**Kurzantwort neu:** Zurück bleiben ihre Fußspuren und das Aufnahmegerät; die drei selbst sind verschwunden.

**Vertiefung neu:** Fay (Sierra McCormick), Everett (Jake Horowitz) und Maddie erreichen eine Lichtung und sehen, wie ein kleineres Flugobjekt zu einem riesigen Mutterschiff aufsteigt. Nach dem Basketballspiel fehlen die drei; nur Fußspuren und das Aufnahmegerät bleiben. Ihr genauer weiterer Verbleib wird nicht gezeigt.

**Merksatz neu:** Fay, Everett und Maddie fehlen; Fußspuren und Aufnahmegerät bleiben.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Zurück bleiben Fußspuren und das Tonbandgerät. · C: Eine schriftliche Erklärung finden die Menschen nicht. · D: Die Personen sind fort; ihre Spuren bleiben.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: WOTW/Fay/Billy, ältere Aufnahme und Bibliothek, Mabels Sprache/Trance im Auto, Basketballabend/Lichtung/Mutterschiff/verschwundene drei und zurückgebliebene Spuren.

[Beleg 1](https://en.wikipedia.org/wiki/The_Vast_of_Night).

### 84. Die Weite der Nacht (2019)

Frage-ID: `F240-20261006-191-S1` · Wissensziel: `K-F240-20261006-191-S1` · Science-Fiction · schwer.

**Originalfrage:** Welche Reaktion löst Mabels aufgezeichnete Sprache in „Die Weite der Nacht“ bei den Autofahrern aus?

- **A:** Sie geraten in eine Trance. **✓ richtig**
- **B:** Sie können das Signal nun bewusst übersetzen.
- **C:** Sie erkennen darin ihre eigenen Stimmen.
- **D:** Sie verlassen den Ort mit vollständiger Erinnerung.

**Kurzantwort bisher:** Beim Abspielen von Mabels Sprache geraten Gerald und Bertsie in Trance.

**Vertiefung bisher (angezeigt):** Beim Abspielen von Mabels Sprache geraten Gerald und Bertsie in Trance. Fay (Sierra McCormick) und Everett (Jake Horowitz) verlassen das Auto; die Aufnahme ist damit nicht nur Information, sondern selbst eine wirksame Gefahr.

**Merksatz bisher:** Die aufgezeichnete Aussage beeinflusst ihre Hörer körperlich.

**Urteil:** Überarbeiten. Die beobachtbare Wirkung und die anschließende Flucht sind ausreichend. Über die genaue Herkunft oder Übersetzung der Sprache wird nichts hinzuerfunden.

**Wissensziel beibehalten:** Die Wirkung von Mabels Aufnahme im Auto kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Beim Abspielen von Mabels Sprache geraten Gerald und Bertsie in Trance.

**Vertiefung neu:** Everett (Jake Horowitz) spielt im Auto die Sprache ab, die er bei Mabel (Gail Cronauer) aufgenommen hat. Gerald und Bertsie geraten dabei in Trance und verlieren beinahe die Kontrolle über den Wagen. Fay (Sierra McCormick) und Everett fliehen mit Maddie in den Wald.

**Merksatz neu:** Mabels aufgezeichnete Sprache versetzt die Autofahrer in Trance.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** B: Die aufgezeichnete Sprache versetzt sie in einen veränderten Zustand. · C: Die Reaktion ist Trance, keine Wiedererkennung. · D: Sie geraten unter den Einfluss der Aufnahme.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: WOTW/Fay/Billy, ältere Aufnahme und Bibliothek, Mabels Sprache/Trance im Auto, Basketballabend/Lichtung/Mutterschiff/verschwundene drei und zurückgebliebene Spuren.

[Beleg 1](https://en.wikipedia.org/wiki/The_Vast_of_Night).

### 85. Universal Soldier (1992)

Frage-ID: `E20261007-F-028-L1` · Wissensziel: `K-E20261007-F-028-L1` · Action · leicht.

**Originalfrage:** Welche Vergangenheit haben Luc Deveraux (Jean-Claude Van Damme) und Andrew Scott (Dolph Lundgren) in „Universal Soldier“?

- **A:** Sie sind im Vietnamkrieg getötete und später wiederbelebte Soldaten. **✓ richtig**
- **B:** Sie sind lebende Brüder, die gemeinsam in die Armee eintreten.
- **C:** Sie sind Polizeibeamte, die eine militärische Tarnidentität erhalten.
- **D:** Sie sind Versuchspiloten, deren Flugzeug über Vietnam verschwand.

**Kurzantwort bisher:** Das Programm verwendet zwei zuvor getötete Soldaten.

**Vertiefung bisher (angezeigt):** Luc Deveraux (Jean-Claude Van Damme) und Andrew Scott (Dolph Lundgren) töten einander im Vietnamkrieg. Ihre Körper werden geborgen und konserviert. Jahrzehnte später setzt ein geheimes Militärprogramm sie erneut ein. Die neuen Einsatznummern bedeuten daher keine neue Person ohne Vergangenheit; verdrängte frühere Konflikte können hinter der scheinbar kontrollierten Funktion wiederkehren.

**Merksatz bisher:** Die neuen Einsatznummern verbergen eine gemeinsame gewaltsame Vergangenheit.

**Urteil:** Überarbeiten. Die gegenseitige Tötung bekommt ihren Anlass. Die unterschiedliche Haltung zu den Zivilisten erklärt den späteren Gegensatz besser als eine allgemeine Aussage über Vergangenheit.

**Wissensziel beibehalten:** Deveraux’ und Scotts Herkunft aus dem Vietnamkrieg verstehen

**Neue vollständige Komposition:** Welche Vergangenheit haben Luc Deveraux (Jean-Claude Van Damme) und Andrew Scott (Dolph Lundgren) in „Universal Soldier“?

- **A:** Sie sind im Vietnamkrieg getötete und später wiederbelebte Soldaten. **✓ richtig**
- **B:** Sie sind lebende Vietnamveteranen mit nachträglich implantierten Kampfreflexen.
- **C:** Sie sind nach einer Kriegsverletzung vollständig durch Roboter ersetzte Soldaten.
- **D:** Sie sind in Vietnam vermisste Soldaten, die jahrzehntelang im Koma lagen.

**Kurzantwort beibehalten:** Das Programm verwendet zwei zuvor getötete Soldaten.

**Vertiefung neu:** Luc Deveraux (Jean-Claude Van Damme) widersetzt sich in Vietnam dem Befehl seines wahnsinnig gewordenen Vorgesetzten Scott (Dolph Lundgren), eine Zivilistin zu töten. Die beiden erschießen einander. Ihre konservierten Körper werden Jahrzehnte später als UniSols eingesetzt, während Medikamente die Erinnerungen unterdrücken sollen. Der alte Konflikt kehrt dennoch in die neue Militäreinheit zurück.

**Merksatz neu:** Deveraux und Scott töten einander in Vietnam und werden als UniSols wiederbelebt.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Ihre Leichen werden konserviert und für das Programm wiederbelebt. · B: Die Figuren sind keine gemeinsam eintretenden Brüder. · C: Eine Polizeikarriere erklärt ihre Herkunft nicht. · D: Sie sterben nicht als Versuchspiloten eines verschollenen Flugzeugs.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Vietnamkonflikt/Tod/Reanimation, Überhitzung und Eisbad, Gregors Erklärung wiederkehrender Erinnerungen, Veronicas Recherche/Kameramann/Lucs Rettung.

[Beleg 1](https://en.wikipedia.org/wiki/Universal_Soldier_(1992_film)).

### 86. Universal Soldier (1992)

Frage-ID: `E20261007-F-028-M1` · Wissensziel: `K-E20261007-F-028-M1` · Action · mittel.

**Originalfrage:** Welche körperliche Schwäche müssen die wiederbelebten Soldaten in „Universal Soldier“ regelmäßig ausgleichen?

- **A:** Sie verlieren außerhalb der Basis sofort ihr Sehvermögen.
- **B:** Sie können ohne tägliche Bluttransfusion nicht stehen.
- **C:** Sie überhitzen und benötigen starke Kühlung. **✓ richtig**
- **D:** Sie werden durch Sonnenlicht dauerhaft gelähmt.

**Kurzantwort bisher:** Die Soldaten müssen gekühlt werden.

**Vertiefung bisher (angezeigt):** Das Programm verleiht Luc Deveraux (Jean-Claude Van Damme) und den anderen Versuchspersonen große Kraft und beschleunigte Heilung. Diese Überlegenheit besitzt eine praktische Grenze: Ihre Körper überhitzen. Luc benötigt auf der Flucht ein Eisbad. Die Szene zeigt, dass eine vermeintlich perfekte Waffe von Wartung abhängt und außerhalb ihrer Kontrollumgebung verwundbar wird.

**Merksatz bisher:** Die überlegenen Körper bleiben von Kühlung abhängig.

**Urteil:** Überarbeiten. Das Eisbad ist ein geeigneter konkreter Beleg und bleibt. Die Vertiefung wird von der pauschalen Waffenmetapher auf den tatsächlichen Versorgungsbedarf zugespitzt.

**Wissensziel beibehalten:** Den Kühlbedarf der UniSols als körperliche Grenze kennen

**Neue vollständige Komposition:** Welche körperliche Schwäche müssen die wiederbelebten Soldaten in „Universal Soldier“ regelmäßig ausgleichen?

- **A:** Ihre Muskelkraft bricht ohne regelmäßige Elektrostimulation ein.
- **B:** Ihr Blut muss regelmäßig außerhalb des Körpers gereinigt werden.
- **C:** Sie überhitzen und benötigen starke Kühlung. **✓ richtig**
- **D:** Ihre künstlichen Gelenke müssen nach jedem Einsatz neu justiert werden.

**Kurzantwort beibehalten:** Die Soldaten müssen gekühlt werden.

**Vertiefung neu:** Auf der Flucht bricht Luc Deveraux (Jean-Claude Van Damme) durch Überhitzung zusammen. Veronica Roberts (Ally Walker) muss ihn in einem Eisbad abkühlen. Die Kühlung gehört zur Funktionsweise des UniSol-Programms und ist außerhalb der militärischen Versorgung schwerer sicherzustellen. Große Kraft und schnelle Heilung machen diese Körper deshalb nicht unabhängig von ihrer Betreuung.

**Merksatz beibehalten:** Die überlegenen Körper bleiben von Kühlung abhängig.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Ein sofortiger Sehverlust ist nicht das Problem. · B: Bluttransfusionen ersetzen hier nicht die Kühlung. · C: Kühlung verhindert den Zusammenbruch der überhitzenden Körper. · D: Sonnenlicht ist kein solcher Lähmungsmechanismus.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Vietnamkonflikt/Tod/Reanimation, Überhitzung und Eisbad, Gregors Erklärung wiederkehrender Erinnerungen, Veronicas Recherche/Kameramann/Lucs Rettung.

[Beleg 1](https://en.wikipedia.org/wiki/Universal_Soldier_(1992_film)).

### 87. Universal Soldier (1992)

Frage-ID: `E20261007-F-028-S1` · Wissensziel: `K-E20261007-F-028-S1` · Action · schwer.

**Originalfrage:** Warum behandelt Andrew Scott (Dolph Lundgren) Luc Deveraux (Jean-Claude Van Damme) in „Universal Soldier“ wieder als Kriegsverräter?

- **A:** Er erlebt seine letzten Kriegserinnerungen als fortdauernde Gegenwart. **✓ richtig**
- **B:** Er erhält einen neuen gerichtlichen Verratsbeschluss aus Vietnam.
- **C:** Luc hat ihm nach der Wiederbelebung heimlich militärische Befehlsgewalt entzogen.
- **D:** Veronica fälscht eine Kriegserklärung und überzeugt ihn damit.

**Kurzantwort bisher:** Scotts alte Erinnerung wird für ihn zur aktuellen Wirklichkeit.

**Vertiefung bisher (angezeigt):** Andrew Scott (Dolph Lundgren) reagiert anders auf die Rückkehr der Erinnerung als Luc Deveraux (Jean-Claude Van Damme). Seine frühere Gewalttätigkeit und Vorstellung von Verrat setzen sich fort. Der Film stellt damit zwei Folgen derselben experimentellen Wiederbelebung gegenüber: Luc gewinnt eine persönliche Orientierung zurück, während Scott den alten Konflikt erneut und zunehmend unkontrolliert auslebt.

**Merksatz bisher:** Luc findet zurück ins Leben; Scott bleibt im alten Krieg gefangen.

**Urteil:** Überarbeiten. Die medizinische Erklärung ist Filmfiktion. Sie wird der erklärenden Figur zugeordnet und mit Scotts Ungehorsam verbunden, statt nur zwei Charaktertypen gegenüberzustellen.

**Wissensziel beibehalten:** Scotts wiederkehrende Kriegserinnerung als Ursache seines Handelns verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Scotts alte Erinnerung wird für ihn zur aktuellen Wirklichkeit.

**Vertiefung neu:** Dr. Gregor (Jerry Orbach) erklärt, dass die letzten Erinnerungen vor dem Tod bei den Wiederbelebten verstärkt zurückkehren können. Andrew Scott (Dolph Lundgren) glaubt deshalb, noch in Vietnam zu kämpfen. Er behandelt Luc (Jean-Claude Van Damme) wieder als Verräter und widersetzt sich schließlich sogar der eigenen Einsatzleitung. Sein alter Ausnahmezustand verdrängt die Gegenwart.

**Merksatz beibehalten:** Luc findet zurück ins Leben; Scott bleibt im alten Krieg gefangen.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Scotts reaktivierte Erinnerungen halten ihn geistig im alten Krieg fest. · B: Ein neuer Gerichtsbeschluss entscheidet sein Verhalten nicht. · C: Eine heimliche Amtsentziehung durch Luc ist nicht die Ursache. · D: Eine gefälschte Kriegserklärung spielt dabei keine Rolle.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Vietnamkonflikt/Tod/Reanimation, Überhitzung und Eisbad, Gregors Erklärung wiederkehrender Erinnerungen, Veronicas Recherche/Kameramann/Lucs Rettung.

[Beleg 1](https://en.wikipedia.org/wiki/Universal_Soldier_(1992_film)).

### 88. Universal Soldier (1992)

Frage-ID: `E20261007-F-028-L2` · Wissensziel: `K-E20261007-F-028-L2` · Action · leicht.

**Originalfrage:** Welche zivile Verbündete begleitet Luc Deveraux (Jean-Claude Van Damme) auf seiner Flucht in „Universal Soldier“?

- **A:** Die Militärärztin Veronica Roberts (Ally Walker)
- **B:** Die Fernsehjournalistin Veronica Roberts (Ally Walker) **✓ richtig**
- **C:** Die Staatsanwältin Veronica Roberts (Ally Walker)
- **D:** Die Pilotin Veronica Roberts (Ally Walker)

**Kurzantwort bisher:** Veronica Roberts ist eine recherchierende Fernsehjournalistin.

**Vertiefung bisher (angezeigt):** Veronica Roberts (Ally Walker) möchte das geheime Programm aufdecken und gerät dabei selbst in Gefahr. Luc Deveraux (Jean-Claude Van Damme) hilft ihr gegen seine Einsatzbefehle. Die Flucht verbindet ihre Suche nach einer berichtbaren Wahrheit mit seiner Suche nach der eigenen Vergangenheit. Beide brauchen Informationen, aber aus unterschiedlichen persönlichen Gründen.

**Merksatz bisher:** Veronica sucht eine Geschichte; Luc sucht seine eigene Geschichte.

**Urteil:** Überarbeiten. Das auslösende Ereignis der gemeinsamen Flucht fehlt im alten Text. Die vier Berufe bleiben als Optionen auf derselben Vergleichsebene.

**Wissensziel beibehalten:** Veronica als Journalistin und Verbündete erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Veronica Roberts ist eine recherchierende Fernsehjournalistin.

**Vertiefung neu:** Veronica Roberts (Ally Walker) schleicht mit einem Kameramann in die geheime Militäranlage, um über die UniSols zu berichten. Scott (Dolph Lundgren) tötet ihren Begleiter; Luc (Jean-Claude Van Damme) rettet sie gegen den Einsatzbefehl. Auf der Flucht helfen ihr recherchierte Unterlagen und Kontakte zugleich dabei, Lucs frühere Identität aufzuklären.

**Merksatz neu:** Die Journalistin Veronica Roberts flieht gemeinsam mit Luc.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Sie ist nicht die Militärärztin des Projekts. · B: Veronica recherchiert als Journalistin über das Programm. · C: Sie arbeitet nicht als Staatsanwältin. · D: Eine Pilotentätigkeit ist nicht ihre Rolle.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Vietnamkonflikt/Tod/Reanimation, Überhitzung und Eisbad, Gregors Erklärung wiederkehrender Erinnerungen, Veronicas Recherche/Kameramann/Lucs Rettung.

[Beleg 1](https://en.wikipedia.org/wiki/Universal_Soldier_(1992_film)).

### 89. The Wailing (2016)

Frage-ID: `E20261007-F-086-L2` · Wissensziel: `K-E20261007-F-086-L2` · Horror · leicht.

**Originalfrage:** Wodurch wird die Mordserie in „The Wailing“ für Jong-goo (Kwak Do-won) zu einer unmittelbaren Familienkrise?

- **A:** Seine Frau wird als Verdächtige verhaftet.
- **B:** Sein Vater gesteht den ersten Mord.
- **C:** Sein Bruder verschwindet als wichtigster Zeuge.
- **D:** Seine Tochter zeigt die rätselhaften Symptome. **✓ richtig**

**Kurzantwort bisher:** Hyo-jins Zustand macht aus der Untersuchung den Kampf um sein Kind.

**Vertiefung bisher (angezeigt):** Hyo-jin (Kim Hwan-hee), die Tochter von Jong-goo (Kwak Do-won), zeigt die bedrohlichen Veränderungen. Seine Suche nach der Ursache wird nun von Angst um sie bestimmt. Die Geschichte prüft dadurch, ob der Wunsch zu helfen klare Beobachtung ermöglicht oder ihn anfälliger für vorschnelle Erklärungen macht.

**Merksatz bisher:** Die Symptome der Tochter verwandeln den Fall in einen Rettungsversuch.

**Urteil:** Überarbeiten. Die persönliche Zuspitzung wird in die Ermittlungs- und Hilfesuche eingebettet. Keine psychologische Gesetzmäßigkeit über besorgte Eltern ableiten.

**Wissensziel beibehalten:** Hyo-jins Zustand als persönliche Zuspitzung verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Hyo-jins Zustand macht aus der Untersuchung den Kampf um sein Kind.

**Vertiefung neu:** Jong-goo (Kwak Do-won) untersucht rätselhafte Gewalttaten in seinem Dorf, als auch seine Tochter Hyo-jin (Kim Hwan-hee) auffällig krank wird und sich verändert. Nun sucht er die Ursache nicht mehr allein als Polizist, sondern als Vater. Die Familie zieht einen Schamanen hinzu, während Jong-goo seinen Verdacht gegen den japanischen Fremden verfolgt.

**Merksatz beibehalten:** Die Symptome der Tochter verwandeln den Fall in einen Rettungsversuch.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Eine Verhaftung seiner Frau ist nicht der entscheidende Auslöser. · B: Sein Vater legt kein solches Geständnis ab. · C: Ein verschollener Bruder löst die Familienkrise nicht aus.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Tochter Hyo-jin, Fotos/Opfergegenstände/Schuh, dritte-Hahnenschrei-Bedingung und Anruf Il-gwangs, Schmerz und Abbruch des Rituals. Genaue Wirkung der Parallelrituale nicht als eindeutiger Fakt bewertet.

[Beleg 1](https://en.wikipedia.org/wiki/The_Wailing_(2016_film)).

### 90. The Wailing (2016)

Frage-ID: `E20261007-F-086-M1` · Wissensziel: `K-E20261007-F-086-M1` · Horror · mittel.

**Originalfrage:** Was verstärkt in „The Wailing“ den Verdacht gegen den japanischen Fremden bei der Durchsuchung seiner Unterkunft?

- **A:** Fotos und Gegenstände der betroffenen Dorfbewohner **✓ richtig**
- **B:** Ein detaillierter schriftlicher Mordbericht
- **C:** Ein von ihm signierter Brief an sämtliche Opfer
- **D:** Ein eindeutiger Film des ersten Angriffs

**Kurzantwort bisher:** Die gesammelten Opferbezüge wirken wie belastende Hinweise.

**Vertiefung bisher (angezeigt):** In der Unterkunft des Fremden (Jun Kunimura) finden sich Fotos und persönliche Gegenstände der Opfer. Jong-goo (Kwak Do-won) erhält damit einen konkreten Anlass zum Verdacht. Der Fund beantwortet jedoch nicht unmittelbar, welche Funktion die Sammlung erfüllt. Beweisstücke und ihre Deutung bleiben unterschiedliche Schritte.

**Merksatz bisher:** Die Opferfotos verstärken den Verdacht, ohne ihn vollständig zu erklären.

**Urteil:** Überarbeiten. Der Schuh macht die familiäre Bedrohung konkret. Die vorsichtige Trennung von Fund und Deutung bleibt ausdrücklich erhalten.

**Wissensziel beibehalten:** Die Funde beim Fremden als Anlass des Verdachts kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die gesammelten Opferbezüge wirken wie belastende Hinweise.

**Vertiefung neu:** In der Unterkunft des japanischen Fremden (Jun Kunimura) entdecken Jong-goo (Kwak Do-won) und sein Begleiter Fotos sowie persönliche Dinge der Opfer. Dazu gehört ein Schuh seiner Tochter Hyo-jin (Kim Hwan-hee). Der Fund verbindet die Mordserie unmittelbar mit ihrem Zustand. Was die Sammlung genau bedeutet, ist damit noch nicht vollständig geklärt.

**Merksatz beibehalten:** Die Opferfotos verstärken den Verdacht, ohne ihn vollständig zu erklären.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** B: Die beunruhigenden Funde sind Opferfotos und persönliche Gegenstände, kein vollständiger Bericht. · C: Es gibt keinen solchen offenen Brief als Grundlage des Verdachts. · D: Die Durchsuchung bringt keine eindeutige Aufnahme des ersten Mordes.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Tochter Hyo-jin, Fotos/Opfergegenstände/Schuh, dritte-Hahnenschrei-Bedingung und Anruf Il-gwangs, Schmerz und Abbruch des Rituals. Genaue Wirkung der Parallelrituale nicht als eindeutiger Fakt bewertet.

[Beleg 1](https://en.wikipedia.org/wiki/The_Wailing_(2016_film)).

### 91. The Wailing (2016)

Frage-ID: `E20261007-F-086-S1` · Wissensziel: `K-E20261007-F-086-S1` · Horror · schwer.

**Originalfrage:** Welche Bedingung der Frau in Weiß missachtet Jong-goo (Kwak Do-won) im Schluss von „The Wailing“?

- **A:** Er betritt die Unterkunft des Fremden ohne Kerze.
- **B:** Er spricht den Namen seiner Tochter laut aus.
- **C:** Er kehrt vor dem dritten Hahnenschrei nach Hause zurück. **✓ richtig**
- **D:** Er nimmt die Schuhe des Schamanen über die Türschwelle.

**Kurzantwort bisher:** Moo-myeong verlangt, bis zum dritten Hahnenschrei zu warten.

**Vertiefung bisher (angezeigt):** Moo-myeong (Chun Woo-hee) fordert Jong-goo (Kwak Do-won) zum Warten auf. Gegenläufige Warnungen und die Gegenstände der Opfer lassen ihn ihr misstrauen. Er handelt zu früh. Die Szene verdichtet den Konflikt auf eine Zeitentscheidung, deren Folgen er erst erkennt, nachdem das verlangte Warten bereits abgebrochen ist.

**Merksatz bisher:** Misstrauen lässt Jong-goo die Wartefrist vor dem dritten Hahnenschrei brechen.

**Urteil:** Überarbeiten. Die gegensätzlichen Ratgeber und die vorgefundene Folge ersetzen die abstrakte „Zeitentscheidung“. Die Schutzwirkung wird als Behauptung der Figur formuliert, nicht als vollständig erklärte Filmmetaphysik.

**Wissensziel beibehalten:** Die missachtete Wartebedingung im Finale kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Moo-myeong verlangt, bis zum dritten Hahnenschrei zu warten.

**Vertiefung neu:** Moo-myeong (Chun Woo-hee) behauptet, eine Falle zum Schutz der Familie gestellt zu haben, und verlangt das Warten bis zum dritten Hahnenschrei. Il-gwang (Hwang Jung-min) warnt Jong-goo (Kwak Do-won) dagegen telefonisch vor ihr. Er vertraut dem Schamanen und kehrt zu früh heim. Dort findet er seine Frau und Schwiegermutter von Hyo-jin (Kim Hwan-hee) getötet.

**Merksatz beibehalten:** Misstrauen lässt Jong-goo die Wartefrist vor dem dritten Hahnenschrei brechen.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Eine Kerze beim Fremden bildet nicht diese Bedingung. · B: Die Bedingung betrifft Warten, nicht den Namen des Kindes. · D: Die Schuhe des Schamanen sind nicht Gegenstand der Schlussbedingung.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Tochter Hyo-jin, Fotos/Opfergegenstände/Schuh, dritte-Hahnenschrei-Bedingung und Anruf Il-gwangs, Schmerz und Abbruch des Rituals. Genaue Wirkung der Parallelrituale nicht als eindeutiger Fakt bewertet.

[Beleg 1](https://en.wikipedia.org/wiki/The_Wailing_(2016_film)).

### 92. The Wailing (2016)

Frage-ID: `E20261007-F-086-M2` · Wissensziel: `K-E20261007-F-086-M2` · Horror · mittel.

**Originalfrage:** Warum bricht Jong-goo (Kwak Do-won) in „The Wailing“ das Ritual des Schamanen ab?

- **A:** Er glaubt, das Ritual schütze gerade den Fremden.
- **B:** Er hält das weitere Leiden seiner Tochter nicht aus. **✓ richtig**
- **C:** Er erkennt in den Zeichen des Schamanen die des Täters.
- **D:** Er fürchtet, das Ritual werde seine Frau statt der Tochter treffen.

**Kurzantwort bisher:** Die Schmerzen und Reaktionen Hyo-jins bringen ihn zum Eingreifen.

**Vertiefung bisher (angezeigt):** Il-gwang (Hwang Jung-min) führt das Ritual aus, während Hyo-jin (Kim Hwan-hee) leidet. Jong-goo (Kwak Do-won) greift ein. Sein Schutzimpuls richtet sich gegen eine Maßnahme, die ebenfalls Hilfe verspricht. Die Szene macht die Entscheidung schwierig, weil sichtbarer Schmerz und behaupteter Rettungszweck nicht übereinstimmen.

**Merksatz bisher:** Hyo-jins sichtbares Leiden lässt den Vater das versprochene Heilritual stoppen.

**Urteil:** Überarbeiten. Der väterliche Grund des Abbruchs ist klar. Aus der Parallelmontage wird keine unbelegte Sicherheit darüber abgeleitet, wen das Ritual tatsächlich angreift.

**Wissensziel beibehalten:** Den Abbruch des Schamanenrituals aus Jong-goos Beobachtung verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Die Schmerzen und Reaktionen Hyo-jins bringen ihn zum Eingreifen.

**Vertiefung neu:** Il-gwang (Hwang Jung-min) verspricht Hilfe durch ein Ritual, während Hyo-jin (Kim Hwan-hee) unter heftigen Schmerzen leidet. Jong-goo (Kwak Do-won) hält die sichtbare Qual nicht länger aus, unterbricht den Ablauf und bringt sie ins Krankenhaus. Der Film verschränkt das Ritual mit Vorgängen beim Fremden, macht deren genaue Beziehung an dieser Stelle aber nicht eindeutig.

**Merksatz beibehalten:** Hyo-jins sichtbares Leiden lässt den Vater das versprochene Heilritual stoppen.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Das sichtbare Leiden seiner Tochter veranlasst ihn zum Eingreifen. · C: Nicht ein sicher erkannter Täterhinweis, sondern die Not der Tochter bestimmt den Abbruch. · D: Er bricht wegen des aktuellen Leidens der Tochter ab, nicht wegen einer vorhergesagten Übertragung auf die Frau.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung: Tochter Hyo-jin, Fotos/Opfergegenstände/Schuh, dritte-Hahnenschrei-Bedingung und Anruf Il-gwangs, Schmerz und Abbruch des Rituals. Genaue Wirkung der Parallelrituale nicht als eindeutiger Fakt bewertet.

[Beleg 1](https://en.wikipedia.org/wiki/The_Wailing_(2016_film)).

**Bewusst offene Deutung:** Die Frage ist tragfähig. Eine weitergehende Erklärung der Ritualwirkung bleibt bewusst offen; hierfür keine eindeutige Gut/Böse-Zuordnung ergänzen.

### 93. Harry Potter und der Feuerkelch (2005)

Frage-ID: `FAN-L-019` · Wissensziel: `K-FAN-10-trimagisch` · Fantasy · leicht.

**Originalfrage:** „Harry Potter und der Feuerkelch“ (2005): An welchem gefährlichen Wettbewerb muss Harry (Daniel Radcliffe) teilnehmen?

- **A:** An einem Duell um die Leitung von Hogwarts
- **B:** An einer Prüfung zum Zaubereiminister
- **C:** An der Quidditch-Weltmeisterschaft als Spieler
- **D:** Am Trimagischen Turnier **✓ richtig**

**Kurzantwort bisher:** Harry wird zum zusätzlichen Teilnehmer des Trimagischen Turniers.

**Vertiefung bisher (angezeigt):** Der Wettbewerb bringt Vertreter verschiedener Schulen zusammen und verlangt mehrere unterschiedliche Prüfungen. Harry hat sich nicht freiwillig auf gewöhnliche Weise angemeldet, muss aber dennoch antreten. Dadurch verbindet der Film sportliche Konkurrenz mit einer verborgenen Manipulation. Die Frage, wie sein Name in die Auswahl gelangte, bleibt neben den sichtbaren Aufgaben bestehen.

**Merksatz bisher:** Harry wird unerwartet Teilnehmer des Trimagischen Turniers.

**Urteil:** Überarbeiten. Die Kurzantwort nennt nun den Wettbewerbsnamen. Schulen, zusätzliche Auswahl und Aufgaben erklären den Unterschied zu einer freiwilligen sportlichen Teilnahme.

**Wissensziel beibehalten:** Das Trimagische Turnier als erzwungenen Wettbewerb erkennen

**Neue vollständige Komposition:** „Harry Potter und der Feuerkelch“ (2005): An welchem gefährlichen Wettbewerb muss Harry (Daniel Radcliffe) teilnehmen?

- **A:** Am Wettkampf des Duellierclubs
- **B:** An einer Auswahlprüfung für das Zaubereiministerium
- **C:** An der Quidditch-Weltmeisterschaft als Spieler
- **D:** Am Trimagischen Turnier **✓ richtig**

**Kurzantwort neu:** Harry muss als zusätzlicher Champion am Trimagischen Turnier teilnehmen.

**Vertiefung neu:** Eigentlich soll je ein Champion aus Hogwarts, Beauxbatons und Durmstrang antreten. Der Feuerkelch nennt jedoch zusätzlich Harry (Daniel Radcliffe), obwohl er zu jung ist und sich nicht beworben hat. Er muss die drei gefährlichen Aufgaben absolvieren. Die unerklärliche Auswahl ist der Beginn des Plans, der ihn später zu Voldemort (Ralph Fiennes) führen soll.

**Merksatz beibehalten:** Harry wird unerwartet Teilnehmer des Trimagischen Turniers.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Die Schulleitung wird nicht auf diese Weise vergeben. · B: Eine Ministerprüfung ist nicht sein Wettbewerb. · C: Die Weltmeisterschaft erlebt Harry als Besucher, nicht als Spieler.

**Antwortfeedback neu:** C: Die Weltmeisterschaft erlebt Harry als Besucher, nicht als Spieler.

**Quellenprüfung:** Filmhandlung/Besetzung: zusätzlicher Harry, Neville als Helfer statt Dobby, Crouch junior/Vielsafttrank/echter Moody/Portschlüssel, Harrys Blut. Offizielle Faktseiten bestätigen Dianthuskraut-Wirkung und Bestandteile des Wiederherstellungsrituals.

[Beleg 1](https://en.wikipedia.org/wiki/Harry_Potter_and_the_Goblet_of_Fire_(film)) · [Beleg 2](https://www.harrypotter.com/fact-file/plants-and-potions/gillyweed) · [Beleg 3](https://www.harrypotter.com/fact-file/plants-and-potions/voldemorts-resurrection-potion).

### 94. Harry Potter und der Feuerkelch (2005)

Frage-ID: `FAN-M-019` · Wissensziel: `K-FAN-10-kiemenkraut-neville` · Fantasy · mittel.

**Originalfrage:** „Harry Potter und der Feuerkelch“ (2005): Wer gibt Harry (Daniel Radcliffe) im Film das Dianthuskraut für die Unterwasseraufgabe?

- **A:** Viktor Krum
- **B:** Neville Longbottom **✓ richtig**
- **C:** Ron Weasley
- **D:** Dobby

**Kurzantwort bisher:** Im Film erhält Harry das Kraut von Neville.

**Vertiefung bisher (angezeigt):** Nevilles Interesse an Pflanzen bekommt eine unmittelbare praktische Bedeutung. Das Kraut ermöglicht Harry, sich für die Aufgabe unter Wasser anzupassen. Die Helferrolle muss ausdrücklich nach der Verfilmung beantwortet werden, weil sie in der Romanvorlage anders verteilt ist. Der Film nutzt die Szene außerdem, um einem sonst häufig unterschätzten Mitschüler einen wichtigen Beitrag zu geben.

**Merksatz bisher:** Im Feuerkelch-Film hilft Neville mit dem Unterwasserkraut.

**Urteil:** Überarbeiten. Die bestehende Fassungsabgrenzung ist richtig und bleibt. Die Wirkung der Pflanze wird konkret beschrieben, eine allgemeine Aufwertung des Mitschülers entfällt.

**Wissensziel beibehalten:** Nevilles Hilfe in der Verfilmung von Dobbys Buchrolle unterscheiden

**Frage und vier Optionen:** unverändert.

**Kurzantwort neu:** Im Film gibt Neville Longbottom (Matthew Lewis) Harry das Dianthuskraut.

**Vertiefung neu:** Das Dianthuskraut lässt Harry (Daniel Radcliffe) Kiemen und Schwimmhäute wachsen, sodass er zur Rettungsaufgabe in den See tauchen kann. Im Film hilft ihm Neville (Matthew Lewis) mit seinem Pflanzenwissen; im Roman besorgt Dobby das Kraut. Gerade diese Rollenverteilung macht die ausdrückliche Formulierung „im Film“ nötig.

**Merksatz beibehalten:** Im Feuerkelch-Film hilft Neville mit dem Unterwasserkraut.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Krum verfolgt eine andere Lösung und gibt Harry das Kraut nicht. · C: Ron ist während der Aufgabe selbst unter Wasser gefangen. · D: Dobby übernimmt diese Hilfe im Buch, nicht in dieser Filmszene.

**Antwortfeedback neu:** C: Ron ist während der Aufgabe selbst unter Wasser gefangen. · D: Dobby übernimmt diese Hilfe im Buch, nicht in dieser Filmszene.

**Quellenprüfung:** Filmhandlung/Besetzung: zusätzlicher Harry, Neville als Helfer statt Dobby, Crouch junior/Vielsafttrank/echter Moody/Portschlüssel, Harrys Blut. Offizielle Faktseiten bestätigen Dianthuskraut-Wirkung und Bestandteile des Wiederherstellungsrituals.

[Beleg 1](https://en.wikipedia.org/wiki/Harry_Potter_and_the_Goblet_of_Fire_(film)) · [Beleg 2](https://www.harrypotter.com/fact-file/plants-and-potions/gillyweed) · [Beleg 3](https://www.harrypotter.com/fact-file/plants-and-potions/voldemorts-resurrection-potion).

### 95. Harry Potter und der Feuerkelch (2005)

Frage-ID: `FAN-S-019` · Wissensziel: `K-FAN-10-moody-crouch` · Fantasy · schwer.

**Originalfrage:** „Harry Potter und der Feuerkelch“ (2005): Wer gibt sich mithilfe von Vielsafttrank als Mad-Eye Moody aus?

- **A:** Barty Crouch junior **✓ richtig**
- **B:** Barty Crouch senior
- **C:** Peter Pettigrew
- **D:** Igor Karkaroff

**Kurzantwort bisher:** Barty Crouch junior nimmt Moodys Gestalt an.

**Vertiefung bisher (angezeigt):** Der vermeintliche Lehrer kann Harry aus nächster Nähe beeinflussen, weil seine Rolle an Hogwarts ihm Vertrauen und Zugang verschafft. Seine Hilfe bei den Aufgaben dient daher einem anderen Ziel, als Harry glaubt. Die Enthüllung trennt Erscheinungsbild und tatsächliche Person. Auch hier kann eine nützliche Unterstützung zugleich Teil einer feindlichen Planung sein.

**Merksatz bisher:** Der Moody des Schuljahrs ist größtenteils Barty Crouch junior.

**Urteil:** Überarbeiten. Gefangener, Tarnmittel und Portschlüssel zeigen die tatsächliche Durchführung. Erscheinung und Charakter werden nicht nur abstrakt gegenübergestellt.

**Wissensziel beibehalten:** Barty Crouch juniors Tarnung als Moody verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Barty Crouch junior nimmt Moodys Gestalt an.

**Vertiefung neu:** Barty Crouch junior (David Tennant) hält den echten Moody (Brendan Gleeson) gefangen und nimmt mit Vielsafttrank dessen Gestalt an. Als vermeintlicher Lehrer lenkt er Harry (Daniel Radcliffe) durch die Aufgaben. Seine Hilfen sollen Harry bis zum Turnierpokal bringen, der als Portschlüssel zum Friedhof präpariert ist. Die nützlichen Hinweise gehören damit zum Entführungsplan.

**Merksatz beibehalten:** Der Moody des Schuljahrs ist größtenteils Barty Crouch junior.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** B: Crouch senior wird nicht als Moody enttarnt. · C: Pettigrew wirkt an Voldemorts Rückkehr mit, trägt aber nicht diese Tarnung. · D: Karkaroff ist Durmstrangs Schulleiter, nicht der verkleidete Lehrer.

**Antwortfeedback neu:** C: Pettigrew wirkt an Voldemorts Rückkehr mit. · D: Karkaroff ist Durmstrangs Schulleiter.

**Quellenprüfung:** Filmhandlung/Besetzung: zusätzlicher Harry, Neville als Helfer statt Dobby, Crouch junior/Vielsafttrank/echter Moody/Portschlüssel, Harrys Blut. Offizielle Faktseiten bestätigen Dianthuskraut-Wirkung und Bestandteile des Wiederherstellungsrituals.

[Beleg 1](https://en.wikipedia.org/wiki/Harry_Potter_and_the_Goblet_of_Fire_(film)) · [Beleg 2](https://www.harrypotter.com/fact-file/plants-and-potions/gillyweed) · [Beleg 3](https://www.harrypotter.com/fact-file/plants-and-potions/voldemorts-resurrection-potion).

### 96. Harry Potter und der Feuerkelch (2005)

Frage-ID: `FAN-S-020` · Wissensziel: `K-FAN-10-harrys-blut` · Fantasy · schwer.

**Originalfrage:** „Harry Potter und der Feuerkelch“ (2005): Warum braucht Voldemorts (Ralph Fiennes) Ritual Harry (Daniel Radcliffe) lebend am Friedhof?

- **A:** Harry muss seinen Zauberstab als Ersatz für Voldemorts Knochen opfern.
- **B:** Harrys Zauberkraft muss durch einen freiwilligen Eid übertragen werden.
- **C:** Harry muss den Zauber aussprechen, der Voldemorts Körper erschafft.
- **D:** Harrys Blut wird für die Wiederherstellung seines Körpers verwendet. **✓ richtig**

**Kurzantwort bisher:** Pettigrew verwendet Harrys Blut im Ritual für Voldemorts neuen Körper.

**Vertiefung bisher (angezeigt):** Der Plan hinter dem Turnier zielt nicht darauf, Harry möglichst früh zu töten. Er muss den Friedhof erreichen, weil Voldemort eine bestimmte körperliche Verbindung nutzen will. Die Aufgaben erhalten dadurch rückblickend eine andere Funktion. Dass Harry immer wieder Hilfe bekam, war nicht bloß Glück, sondern Teil der Vorbereitung auf diesen Moment.

**Merksatz bisher:** Harry soll lebend ankommen, weil Voldemort sein Blut benötigt.

**Urteil:** Überarbeiten. „Warum lebend“ setzte eine nicht erklärte biologische Notwendigkeit voraus. Die engere Frage prüft sicher den Zweck des Plans und wahrt das vorhandene Wissensziel.

**Wissensziel beibehalten:** Harrys Blut als Bestandteil des Wiederherstellungsrituals kennen

**Neue vollständige Komposition:** „Harry Potter und der Feuerkelch“ (2005): Wozu benötigt Voldemort (Ralph Fiennes) Harry (Daniel Radcliffe) am Friedhof?

- **A:** Harry muss seinen Zauberstab als Ersatz für Voldemorts Knochen opfern.
- **B:** Harrys Zauberkraft muss durch einen freiwilligen Eid übertragen werden.
- **C:** Harry muss den Zauber aussprechen, der Voldemorts Körper erschafft.
- **D:** Harrys Blut wird für die Wiederherstellung seines Körpers verwendet. **✓ richtig**

**Kurzantwort beibehalten:** Pettigrew verwendet Harrys Blut im Ritual für Voldemorts neuen Körper.

**Vertiefung neu:** Der Turnierpokal bringt Harry (Daniel Radcliffe) und Cedric (Robert Pattinson) als Portschlüssel auf den Friedhof. Cedric wird getötet, Harry dagegen festgebunden. Pettigrew (Timothy Spall) nimmt ihm Blut ab und verwendet es zusammen mit einem Knochen von Voldemorts Vater und seiner eigenen Hand im Ritual. Danach steigt Voldemort (Ralph Fiennes) mit neuem Körper aus dem Kessel.

**Merksatz neu:** Pettigrew nimmt Harry Blut für Voldemorts neuen Körper ab.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Harrys Zauberstab ist nicht dieser Bestandteil des Rituals. · B: Kein freiwilliger Eid überträgt Harrys Kraft; benötigt wird sein Blut. · C: Pettigrew führt das Ritual aus; Harry ist nicht dessen Zaubernder.

**Antwortfeedback neu:** C: Pettigrew führt das Ritual aus; Harry ist nicht dessen Zaubernder.

**Quellenprüfung:** Filmhandlung/Besetzung: zusätzlicher Harry, Neville als Helfer statt Dobby, Crouch junior/Vielsafttrank/echter Moody/Portschlüssel, Harrys Blut. Offizielle Faktseiten bestätigen Dianthuskraut-Wirkung und Bestandteile des Wiederherstellungsrituals.

[Beleg 1](https://en.wikipedia.org/wiki/Harry_Potter_and_the_Goblet_of_Fire_(film)) · [Beleg 2](https://www.harrypotter.com/fact-file/plants-and-potions/gillyweed) · [Beleg 3](https://www.harrypotter.com/fact-file/plants-and-potions/voldemorts-resurrection-potion).

### 97. Der große Diktator (1940)

Frage-ID: `KOM-202609-P02-L-073` · Wissensziel: `K-KOM-202609-P02-L-073` · Komödie · leicht.

**Originalfrage:** „Der große Diktator“ (1940): Wer spielt sowohl Hynkel als auch den jüdischen Friseur?

- **A:** Charles Chaplin **✓ richtig**
- **B:** Buster Keaton
- **C:** Stan Laurel
- **D:** Harold Lloyd

**Kurzantwort bisher:** Charles Chaplin spielt Hynkel und den Friseur.

**Vertiefung bisher (angezeigt):** Charles Chaplin setzt denselben Körper für den verfolgten Friseur und den herrschenden Hynkel ein. Die Doppelrolle stellt körperliche Ähnlichkeit neben politische Gegensätzlichkeit. Ihre Wirkung geht über eine Verwechslungspointe hinaus: Gesten können bei gleicher äußerer Erscheinung ganz unterschiedliche Beziehungen zu anderen Menschen ausdrücken, je nachdem, ob die Figur Fürsorge sucht oder uneingeschränkte Macht demonstrieren möchte.

**Merksatz bisher:** Chaplin ist Verfolgter und Herrscher.

**Urteil:** Überarbeiten. Die Doppelrolle wird an den zwei Ausgangslagen erläutert. Der Friseur verwandelt sich nicht tatsächlich in den Diktator.

**Wissensziel beibehalten:** Chaplins Doppelrolle ohne Figurenverwandlung verstehen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Charles Chaplin spielt Hynkel und den Friseur.

**Vertiefung neu:** Chaplin stellt zwei getrennte Lebensläufe dar: den jüdischen Friseur, der nach langer Behandlung wegen Gedächtnisverlusts in sein altes Viertel zurückkehrt, und Hynkel, der inzwischen als Diktator herrscht. Während der eine die veränderte Welt erst begreifen muss, ordnet der andere ihre gewaltsame Umgestaltung an. Die Ähnlichkeit der beiden führt später zur Verwechslung, nicht zu einem Rollenwechsel des Friseurs.

**Merksatz beibehalten:** Chaplin ist Verfolgter und Herrscher.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung und offizielle Synopsis: zwei Chaplin-Figuren, Amnesie/Friseur, Hynkels Ballon, zeitweiliges Aussetzen der Verfolgung wegen erhofften Kredits, Verweigerung und erneute Repression, Lagerflucht und Verwechslung.

[Beleg 1](https://en.wikipedia.org/wiki/The_Great_Dictator) · [Beleg 2](https://www.charliechaplin.com/en/films/7-The-Great-Dictator/articles/93-The-Great-Dictator-Synopsis).

### 98. Der große Diktator (1940)

Frage-ID: `KOM-202609-P02-M-073` · Wissensziel: `K-KOM-202609-P02-M-073` · Komödie · mittel.

**Originalfrage:** „Der große Diktator“ (1940): Mit welchem Gegenstand tanzt Hynkel (Charles Chaplin) in der berühmten Szene?

- **A:** Mit einer aufblasbaren Weltkugel **✓ richtig**
- **B:** Mit einer Landkarte aus Stoff
- **C:** Mit einem riesigen Orden
- **D:** Mit einem goldenen Schwert

**Kurzantwort bisher:** Hynkel tanzt mit einer aufblasbaren Weltkugel.

**Vertiefung bisher (angezeigt):** Hynkel (Charles Chaplin) behandelt die Weltkugel wie ein leicht verfügbares Spielzeug. Die schwebende, elegante Bewegung macht seinen Herrschaftswunsch körperlich sichtbar. Als Lesart lässt sich die Szene als Fantasie unbegrenzter Verfügung verstehen: Der Herrscher möchte die Welt nicht kennenlernen, sondern besitzen und bewegen. Die Zerbrechlichkeit des Gegenstands untergräbt diesen Anspruch anschließend mit einer sehr einfachen visuellen Pointe.

**Merksatz bisher:** Weltmacht als zerbrechlicher Ballon.

**Urteil:** Überarbeiten. Die treffende Lesart bleibt. An die Stelle der umschreibenden „Zerbrechlichkeit des Gegenstands“ tritt die sichtbare Pointe.

**Wissensziel beibehalten:** Die Weltkugel als Requisit von Hynkels Herrschaftsfantasie erkennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort beibehalten:** Hynkel tanzt mit einer aufblasbaren Weltkugel.

**Vertiefung neu:** Hynkel (Charles Chaplin) lässt die aufblasbare Weltkugel schweben, fängt sie auf und tanzt mit ihr. Die Welt ist in seiner Fantasie ein Spielzeug, über das er allein verfügt. Dann platzt der Ballon. Die Szene beendet seinen eleganten Größenwahn mit einem sichtbaren Missgeschick; es ist keine tatsächliche Erdkugel, die er beherrscht.

**Merksatz beibehalten:** Weltmacht als zerbrechlicher Ballon.

**Schwierigkeit:** mittel. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung und offizielle Synopsis: zwei Chaplin-Figuren, Amnesie/Friseur, Hynkels Ballon, zeitweiliges Aussetzen der Verfolgung wegen erhofften Kredits, Verweigerung und erneute Repression, Lagerflucht und Verwechslung.

[Beleg 1](https://en.wikipedia.org/wiki/The_Great_Dictator) · [Beleg 2](https://www.charliechaplin.com/en/films/7-The-Great-Dictator/articles/93-The-Great-Dictator-Synopsis).

### 99. Der große Diktator (1940)

Frage-ID: `KOM-202609-P02-S-073` · Wissensziel: `K-KOM-202609-P02-S-073` · Komödie · schwer.

**Originalfrage:** „Der große Diktator“ (1940): Wer spielt Hannah?

- **A:** Paulette Goddard **✓ richtig**
- **B:** Jean Arthur
- **C:** Claudette Colbert
- **D:** Carole Lombard

**Kurzantwort bisher:** Paulette Goddard spielt Hannah.

**Vertiefung bisher (angezeigt):** Hannah (Paulette Goddard) gehört zu den Menschen, die der jüdische Friseur (Charles Chaplin) im bedrohten Wohnviertel kennenlernt. Ihre Gegenwehr und ihre Hoffnungen erweitern die Geschichte über die Doppelrolle hinaus. Der Film zeigt dadurch nicht nur zwei außergewöhnliche Männer, sondern auch eine Gemeinschaft, deren Alltag von Gewalt und Unsicherheit bestimmt wird und die dennoch persönliche Bindungen aufrechterhält.

**Merksatz bisher:** Hannah = Goddard.

**Urteil:** Wissensziel ersetzen. Auch diese schwere Besetzungsfrage prüft nur einen Schauspielernamen. Der Ersatz erschließt einen konkreten politischen Handlungszusammenhang: finanzielle Interessen, befristete Schonung und erneute Verfolgung. Die offizielle Chaplin-Synopsis bestätigt die Reihenfolge. Neues Ziel und neue Identitäten statt Umstufung oder Überschreiben.

**Wissensziel neu:** Den Widerruf der vorübergehenden Schonung mit dem verweigerten Kredit verbinden

**Neue vollständige Komposition:** Warum beendet Hynkel (Charles Chaplin) in „Der große Diktator“ (1940) die vorübergehende Schonung der jüdischen Bevölkerung?

- **A:** Ein jüdischer Geldgeber verweigert ihm den erhofften Kredit. **✓ richtig**
- **B:** Schultz lässt politische Gefangene aus dem Lager frei.
- **C:** Napaloni macht die Verfolgung zur Bedingung für ein Bündnis.
- **D:** Ein Minister meldet ihm einen bewaffneten Aufstand im Ghetto.

**Neue Identitäten:** Frage `QR4-20261010-GREATDICTATOR-S-001`, Wissensziel `K-QR4-20261010-GREATDICTATOR-S-001`. Die bisherige Besetzungsfrage bleibt als Original erhalten; der Entwurf ist ein Ersatzvorschlag mit neuem Ziel, keine historische Migration.

**Kurzantwort neu:** Der erhoffte Kredit bleibt aus; Hynkel nimmt die Verfolgung wieder auf.

**Vertiefung neu:** Hynkel (Charles Chaplin) braucht Geld und lässt die Verfolgung vorübergehend ruhen, solange er auf einen jüdischen Kreditgeber hofft. Als dieser ablehnt, verschärft er die Repressionen wieder. Für den Friseur (ebenfalls Chaplin) und Hannah (Paulette Goddard) endet damit eine Phase vergleichsweiser Ruhe im Ghetto.

**Merksatz neu:** Hynkel schont die jüdische Bevölkerung, solange er auf den Kredit hofft.

**Schwierigkeit:** schwer. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Handlung.

**Antwortfeedback bisher (angezeigt):** A: Richtig.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung und offizielle Synopsis: zwei Chaplin-Figuren, Amnesie/Friseur, Hynkels Ballon, zeitweiliges Aussetzen der Verfolgung wegen erhofften Kredits, Verweigerung und erneute Repression, Lagerflucht und Verwechslung.

[Beleg 1](https://en.wikipedia.org/wiki/The_Great_Dictator) · [Beleg 2](https://www.charliechaplin.com/en/films/7-The-Great-Dictator/articles/93-The-Great-Dictator-Synopsis).

### 100. Der große Diktator (1940)

Frage-ID: `KOM-202609-P02-L-074` · Wissensziel: `K-KOM-202609-P02-L-074` · Komödie · leicht.

**Originalfrage:** „Der große Diktator“ (1940): Welchen Beruf hat die von Charlie Chaplin gespielte Figur, die am Ende mit Diktator Hynkel (Charles Chaplin) verwechselt wird?

- **A:** Uhrmacher
- **B:** Friseur **✓ richtig**
- **C:** Schneider
- **D:** Bäcker

**Kurzantwort bisher:** Charlie Chaplin spielt zwei verschiedene Figuren: den Diktator Hynkel und einen jüdischen Friseur. Der Friseur wird später für Hynkel gehalten.

**Vertiefung bisher (angezeigt):** Charlie Chaplin spielt zwei verschiedene Figuren: den Diktator Hynkel und einen jüdischen Friseur. Während Hynkel die jüdische Bevölkerung verfolgen lässt, gehört der Friseur selbst zu den Verfolgten. Gegen Ende flieht der Friseur aus einem Konzentrationslager. Wegen seiner Ähnlichkeit mit Hynkel wird er für den Diktator gehalten. Diese Verwechslung führt zur berühmten Schlussrede: Der Friseur spricht an Hynkels Stelle und fordert Menschlichkeit und Demokratie.

**Merksatz bisher:** Zwei Figuren, ein Darsteller: Der Friseur wird für Hynkel gehalten.

**Urteil:** Vertiefung beibehalten. Die Vertiefung erklärt schon konkret Verfolgung, Lagerflucht, Verwechslung und Schlussrede und unterscheidet beide Figuren. Sie bleibt vollständig. Nur die Kurzantwort wird unmittelbar auf den gefragten Beruf zugeschnitten.

**Wissensziel beibehalten:** Den Beruf des mit Hynkel verwechselten Mannes kennen

**Frage und vier Optionen:** unverändert.

**Kurzantwort neu:** Der Mann ist ein jüdischer Friseur; Chaplin spielt ihn ebenso wie den Diktator Hynkel.

**Vertiefung beibehalten:** Charlie Chaplin spielt zwei verschiedene Figuren: den Diktator Hynkel und einen jüdischen Friseur. Während Hynkel die jüdische Bevölkerung verfolgen lässt, gehört der Friseur selbst zu den Verfolgten. Gegen Ende flieht der Friseur aus einem Konzentrationslager. Wegen seiner Ähnlichkeit mit Hynkel wird er für den Diktator gehalten. Diese Verwechslung führt zur berühmten Schlussrede: Der Friseur spricht an Hynkels Stelle und fordert Menschlichkeit und Demokratie.

**Merksatz beibehalten:** Zwei Figuren, ein Darsteller: Der Friseur wird für Hynkel gehalten.

**Schwierigkeit:** leicht. Redaktionelle Einordnung, keine empirisch gemessene Schwierigkeit. **Spoilereinstufung des Entwurfs:** Finale.

**Antwortfeedback bisher (angezeigt):** A: Die mit Hynkel verwechselte Figur arbeitet als jüdischer Friseur. · B: Richtig. Chaplin spielt einen jüdischen Friseur, der später für den Diktator Hynkel gehalten wird. · C: Die mit Hynkel verwechselte Figur arbeitet als jüdischer Friseur. · D: Die mit Hynkel verwechselte Figur arbeitet als jüdischer Friseur.

**Antwortfeedback neu:** leer; kein eigenständiger Zusatznutzen.

**Quellenprüfung:** Handlung/Besetzung und offizielle Synopsis: zwei Chaplin-Figuren, Amnesie/Friseur, Hynkels Ballon, zeitweiliges Aussetzen der Verfolgung wegen erhofften Kredits, Verweigerung und erneute Repression, Lagerflucht und Verwechslung.

[Beleg 1](https://en.wikipedia.org/wiki/The_Great_Dictator) · [Beleg 2](https://www.charliechaplin.com/en/films/7-The-Great-Dictator/articles/93-The-Great-Dictator-Synopsis).

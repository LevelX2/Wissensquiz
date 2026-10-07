# Redaktion von Filmfragen, Schauspielerfragen und Preisfragen

Stand: 07.10.2026. Dieser Fachvertrag gilt für neu erstellte und ausdrücklich beauftragte redaktionelle Überarbeitungen in Wissensquiz. Er setzt den Nutzerauftrag zu interessanten, individuell entwickelten Fragen um. Bestehende Rohquellen und Lernidentitäten werden dadurch nicht rückwirkend geändert.

Quelle: [unveränderter Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-04%20Nutzerauftrag%20Fragenredaktions-Skill.txt). Bestehende technische Bereichs- und Importverträge wurden für den Stand abgeglichen.

Der persönliche Skill `wissensquiz-fragen-redigieren` führt durch die Redaktion und verweist auf diesen Vertrag. Die führenden fachlichen Regeln stehen hier im Projekt; die Skill-Quelle wird nach den persönlichen Installationsregeln gepflegt. Der [ältere kopierfertige Musikauftrag](Prompt-Neue-Fragenpakete.md) bleibt ein historisches Beispiel. Bei neuen Aufträgen haben die aktuellen Anforderungen dieser Seite Vorrang.

## Filmauswahl anhand der persönlichen Sammlung

Künftige Filmerweiterungen orientieren sich vorrangig an der persönlichen Filmsammlung. Vor der Auswahl die verfügbare Filmliste auswerten und passende, im Quiz noch unterrepräsentierte Werke daraus bevorzugen. Die Sammlung ist eine Auswahlpriorität, keine ausschließliche Titelliste und keine feste Quote. Begründete Ergänzungen außerhalb bleiben möglich, etwa für Genrelücken oder besonders interessante Wissensziele. Aktuelle ausdrückliche Auswahlvorgaben haben Vorrang.

Sammlungsbezüge vor der Redaktion anhand Titelvarianten, Filmfassungen und gegebenenfalls abweichender Jahresangaben prüfen. Im lokal geschützten Auswahlnachweis zwischen Sammlungsbezug, ungeklärter Zuordnung und begründeter Ergänzung außerhalb unterscheiden. Verfügbare Originale und Extrakte mit geprüftem Stand wiederverwenden; fehlenden Zugriff offen benennen und die Quelle klären. Private Sammlungsdaten und Zuordnungen bleiben außerhalb veröffentlichter Pakete.

Der Nutzer hat das bereits veröffentlichte 240-Filme-Paket akzeptiert; daraus folgt keine nachträgliche Neuauswahl. [Unveränderte Präzisierung vom 07.10.2026](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-07%20Nutzerpraezisierung%20Filmauswahl%20nach%20Sammlung.txt).

## Schwierigkeiten und Bekanntheit

| Fragenbereich | Schwierigkeiten | Bekanntheitsgruppen |
|---|---|---|
| Filme | leicht, mittel, schwer | 1 Film-Ikonen, 2 Bekannte Filme, 3 Kennerfilme, 4 Entdeckungen |
| Schauspieler | leicht, mittel, schwer, experte | Keine eigenen Filmgruppen für Personen |
| Preise und Preisträger | leicht, mittel, schwer, experte | Keine Filmgruppen als Voraussetzung für Preisfragen |

Die vierte Personenstufe wurde in bisherigen Redaktionspaketen „außergewöhnlich“ genannt und für die App auf `experte` abgebildet. Die vier Filmgruppen beschreiben eine redaktionelle Bekanntheitseinschätzung für ein breites deutschsprachiges Kinopublikum, keine gemessene Quote. Seltenheit ist keine Fragenschwierigkeit: Ein wenig bekannter Film braucht ebenfalls leichte Einstiegsfragen. Alle Fragen derselben Filmfassung behalten dieselbe Bekanntheitsgruppe.

[Auswahl und Bekanntheit](Spielmodi-und-Bekanntheit.md), [Personen- und Preisreisen](Filmreise-Personen-und-Vertiefungen.md) sowie die tatsächliche Bereichszuordnung in `src/filters.ts` bleiben maßgeblich. Classics und Arthouse sind zusätzliche Filmfilter; sie ersetzen kein Genre und sind keine weiteren Schwierigkeiten.

## Mindestumfang eines Films

Für jede neu als Filmfragen behandelte Filmfassung müssen im resultierenden Katalog mindestens folgende eigenständige Wissensziele vorhanden sein:

| Bestandteil | Mindestumfang |
|---|---:|
| Interessante Inhaltsfragen auf leicht | 2 |
| Interessante Inhaltsfragen auf mittel | 2 |
| Interessante Inhaltsfragen auf schwer | 2 |
| Jahr der ersten Veröffentlichung | 1 zusätzliches Ziel |
| Offizieller Regiecredit | 1 zusätzliches Ziel |
| Gesamt | Mindestens 8 Ziele je Film |

Jahres- und Regiewissen wird nicht auf die sechs Inhaltsziele angerechnet, auch wenn diese Fragen als normale CSV-Zeilen ohne `fact_kind` vorliegen. Die beiden Zusatzfragen erhalten jeweils eine passende der drei Filmschwierigkeiten; sie sind nicht auf allen drei Stufen zu wiederholen.

Es zählt der Wissensinhalt, nicht die Zahl der Formulierungen. Zwei Fragen nach demselben Namen, Gegenstand oder Ereignis sind Varianten eines Ziels. Sie teilen eine `knowledge_id` und erfüllen keine zweite Mindestposition. Auch ein umgekehrter Fragesatz kann denselben Sachverhalt prüfen. Vorhandene passende Fragen werden angerechnet und mit ihren IDs weiterverwendet; nicht für jeden Auftrag acht weitere Ziele erzeugen.

Für diese Filmabdeckung müssen die anrechenbaren Fragen tatsächlich im Filmfragenbereich spielbar sein. Ein Sachverhalt aus einer Personen- oder Preisfrage kann dieselbe Wissensziel-ID teilen, ersetzt aber allein keine Filmfrage in der jeweiligen Schwierigkeit. Ebenso erfüllt eine reine Anzeige von Jahr oder Regie in den Filmdaten kein spielbares Zusatzfragenziel.

Die Abnahme weist pro Film getrennt aus: Inhaltsziele leicht/mittel/schwer, Jahresziel, Regieziel, vorhandene Ziele, neue Ziele und Varianten. Ein Film mit zwei Fragen auf einer Stufe, die beide dasselbe Ziel prüfen, ist nicht vollständig. Lässt sich ein Mindestziel nicht belastbar entwickeln, bleibt der Film als unvollständiger Entwurf gekennzeichnet; fehlende Plätze werden nicht mit unbelegten oder belanglosen Fragen gefüllt.

Für ein Paket mit 25 völlig neuen Filmen bedeutet das mindestens 150 Inhaltsziele plus 25 Jahres- und 25 Regieziele, insgesamt 200 Ziele. Varianten kommen gegebenenfalls hinzu. Das ist keine automatische Pflicht zu 200 CSV-Zeilen: Die technischen Wege für die Zusatzfragen sind getrennt zu prüfen.

## Vom bemerkenswerten Inhalt zur Frage

Vor dem Formulieren recherchieren, was den konkreten Film, die Person oder den Preisfall interessant macht. Geeignete Ansatzpunkte sind ein prägender Konflikt, eine ungewöhnliche Entscheidung, eine markante Figur, ein wichtiges Motiv, eine besondere Erzählweise, nachvollziehbare Gestaltung, eine Zusammenarbeit, ein belegter Produktionsumstand oder ein ungewöhnlicher Preisverlauf.

Eine Frage soll einen konkreten Sachverhalt erschließen, an den sich die spielende Person mit Interesse erinnern kann. Intern müssen Wissensziel, Quellenbeleg und der Grund für die Auswahl klar sein. „Es lässt sich dazu eine Frage bilden“ genügt nicht. Beiläufige Namen, Gegenstände oder Zahlen können sinnvoll sein, wenn sie eine erkennbare Funktion oder Bedeutung haben; zufällige Detailjagd ist kein Standard für schwere Fragen.

Aus dem Inhalt heraus einen passenden Zugang wählen. Beispielsweise lässt sich nach einer Entscheidung, einer Konsequenz, dem Einsatz eines Gegenstands, einer ungewöhnlichen Zusammenarbeit oder der Abgrenzung zweier Leistungen fragen. Diese Möglichkeiten sind ein Repertoire, keine Schablone und keine feste Quote.

Die Variation betrifft Perspektive, Denkaufgabe und Wissensinhalt, nicht nur wechselnde Verben. Sechs nach demselben Muster gebaute „Wie heißt …?“-Fragen werden nicht dadurch individuell, dass sie verschiedene Nebennamen verlangen. Umgekehrt muss eine gute direkte Namensfrage nicht künstlich umständlich werden. Die Frage wird jedes Mal für ihren Inhalt neu überlegt.

Den Fragenblock eines Films und anschließend das ganze Paket zusammen lesen. Wiederholen sich Frageanfänge, Denkaufgaben, Nebendetails oder Erklärungssätze ohne fachlichen Grund, die betroffenen Fragen neu entwickeln. Keine starre Handlungs-, Rollen- oder Technikquote erzwingen. Ein Film mit besonderer Erzählweise darf andere Schwerpunkte erhalten als ein Musical oder ein Seeabenteuer.

Jahres- und Regiefragen dürfen als klar abgegrenzte Eckdatenfragen eine einfache Grundform verwenden. Sie benötigen trotzdem filmbezogene Abgrenzung, Quellen und einen individuellen erklärenden Hintergrund. Technisch fest vorgegebene Generatorfragen nicht als neu variierte Redaktion ausgeben.

## Schwierigkeiten sinnvoll gestalten

- **Leicht:** Zentrale, gut erkennbare Ausgangslage, Hauptfigur oder prägender Zusammenhang; ein zugänglicher Einstieg in das jeweilige Werk.
- **Mittel:** Konkrete Beziehungen, Entscheidungen, Ereignisfolgen oder auffällige Gestaltung; verlangt genaueres Erinnern oder Verknüpfen.
- **Schwer:** Präzise belegte, weniger offensichtliche Zusammenhänge, besondere Inszenierung oder relevant eingeordnete Produktions- und Filmgeschichte. Nicht lediglich durch extrem ähnliche Alternativen oder nebensächliche Zahlen künstlich erschweren.
- **Experte bei Personen und Preisen:** Spezielle berufliche Zusammenhänge, seltenere Leistungen oder differenzierte Preisgeschichte mit erkennbarem Erkenntniswert. Nicht als Film-Bekanntheitsgruppe 4 behandeln.

Die Einstufung ist redaktionell. Schwierige Formulierungen, Fachwortballungen oder absichtlich missverständliche Antworten machen keinen guten schweren Inhalt. Erklärungen sollen Verständnis aufbauen, statt nur die Lösung zu wiederholen.

Spielspaß, die verständliche Beschäftigung mit dem Thema und die Festigung des eigenen Wissens führen die Gestaltung, Prüfung und Neuentwicklung. Bei Fragen zu handelnden Filmfiguren den Originaldarsteller in der Regel bereits im Fragetext mitnennen. Dies ist eine Empfehlung, kein Zwang: Bei sehr bekannten Filmen und Figuren kann der Zusatz bewusst entfallen; bei schwierigeren Fragen und spezielleren Themen hilft dieser Kontext besonders. Wird gerade der Schauspielername gesucht, bleibt er vor der Antwort verborgen.

## Struktur jeder Frage

Jede neue Frage enthält einen eindeutig formulierten Fragetext, ein präzises Wissensziel, vier verschiedene Antwortmöglichkeiten und genau eine belegbare richtige Lösung. Hinzu kommen eine kurze Begründung der Lösung, eine konkrete Vertiefung, ein Merksatz, passende Quellen und bei Filmfragen die Spoilereinstufung. Zu jeder Antwort ist in der Redaktion festzuhalten, warum sie richtig oder falsch ist. Für Film- und Preis-CSV gehören diese Texte in `feedback_a` bis `feedback_d`; für Personenfragen die gewählte Übergabe auf Erhalt der Inhalte prüfen.

„Keine Ahnung“ ist die zusätzliche App-Auswahl und gehört nicht zu den vier redaktionellen Antwortoptionen.

Drei falsche Antworten müssen im gefragten Kontext plausibel sein, aber belegbar ausscheiden. Vergleichbare Antwortarten, ähnliche sprachliche Form und angemessene Länge wählen. Keine zweite vertretbare Lösung, keine sich überschneidenden Optionen und keine durch bloße Form auffällige richtige Antwort. Vollständige Teams bei gemeinsamer Regie oder gemeinsam ausgezeichneten Leistungen auch in den Alternativen als Teams behandeln.

Die kurze Erklärung beantwortet „Warum ist diese Lösung richtig?“. Die Vertiefung erklärt einen konkreten Hintergrund, eine Verbindung oder die Bedeutung des Sachverhalts. Für Filmfragen sind etwa 50–75 Wörter eine Orientierung; Inhalt und Verständlichkeit haben Vorrang. Personen- und Preistexte sollen ebenfalls konkrete Zusatzinformation vermitteln, ohne mit Füllsätzen eine Länge zu erreichen. Der Merksatz ist knapp und zum Ziel passend.

Für Film-Jahresfragen gilt der Nutzermaßstab vom 04.10.2026: Die Vertiefung verbindet das Veröffentlichungsjahr mit einem interessanten, passenden zweiten Sachverhalt und bildet einen zeitlichen Erinnerungsanker. Geschichte, Musik, Technik, Biografie, Literatur und sinnvolle Filmverbindungen kommen infrage; direkte Filmbezüge sind besonders geeignet. Unterschiedliche Länderstarts allein sind keine interessante Vertiefung. Bei verschiedenen Jahren beide Zeitpunkte und Reihenfolge oder Abstand verständlich nennen. Eine zeitliche oder thematische Merkhilfe nicht als unbelegte Produktionsursache ausgeben. Der Merksatz hält die konkrete Verbindung knapp fest. [Nutzerauftrag und vollständige Jahresredaktion](Jahresanker-2026-10-04/Pruefbericht.md).

Frage und vier Antworten zusammen möglichst unter 60 Wörtern halten. Längere, fachlich notwendige Kombinationen im Prüfbericht kenntlich machen; der Rekordmodus sieht 30 Sekunden pro Frage vor. Interpretationen und eigene Beobachtungshinweise als solche kennzeichnen und nicht als einzig objektiv richtige Multiple-Choice-Lösung anbieten.

Antwortfeedback darf nicht auf Buchstaben oder Bildschirmpositionen verweisen: Die App mischt die Optionen. Richtige Buchstaben innerhalb eines Pakets möglichst ausgewogen verteilen, ohne dafür schlechte Alternativen zu bauen.

## Filmfassung, Eckdaten und Lösungsschutz

Filmidentität über tatsächlichen Originaltitel und Jahr der ersten Veröffentlichung einschließlich Premiere/Festival feststellen. Remakes, Fortsetzungen, alternative Titel, Schnittfassungen und Sprachfassungen abgrenzen. Produktionsjahr, erste Veröffentlichung, deutscher Kinostart und Preisverleihungsjahr nicht vermischen.

Die Jahresfrage darf die gesuchte Jahreszahl vor der Antwort nicht verraten, auch nicht durch eine routinemäßige Titel-Jahr-Klammer. Enthält der Titel selbst das Lösungsjahr, die Fassung mit anderen belegten Angaben identifizieren. Eine Regiefrage darf den gesuchten Namen nicht als einleitenden Regiehinweis nennen. Metadaten, Überschrift, Lernziel, Tags und sichtbare Zusatztexte auf solche Hinweise prüfen; Erklärungen und Filmdaten erscheinen nach der Antwort.

Auch Inhaltsfragen müssen diese gemeinsame Prüfung von Fragetext, Filmtitel und vier Antworten bestehen. Die gesuchte Antwort darf weder direkt darin stehen noch allein durch die Formulierungslogik eindeutig ableitbar sein. Die Frage nach den herrschenden Wesen in „Planet der Affen“ scheitert am Titelhinweis; ein anderes Wissensziel ist nötig. Eine Hangover-Frage, die Phil, Stu und Alan als Suchende vorwegnimmt und dieselben Personen neben Doug als Optionen anbietet, verrät Doug durch Ausschluss. Suchende im Fragetext weglassen; hilfreiche Zusätze hinter den Antwortnamen dürfen bleiben. [Korrigierte Beispiele](Fragenkorrekturen.md).

In Film-Vertiefungen namentlich genannte Figuren bei der ersten Nennung als `Figurenname (Originaldarsteller)` einführen, sofern die Zuordnung nicht bereits ausdrücklich formuliert ist. Originalstimmen bei Animation entsprechend bezeichnen. Synchronsprecher sind keine Originaldarsteller. Keine Figuren oder Besetzungsangaben für reine Gestaltungsfragen erfinden.

Bei gemeinsamer Regie alle relevanten offiziellen Credits verwenden; ungenannte Mitwirkung und abweichende Fassungscredits erläutern. Regisseurinnen und Regisseure der richtigen Antwort sowie belegte Mitwirkende nicht als eindeutig falsche Alternativen anbieten.

## Schauspielerfragen

Der bisherige Personenstandard umfasst mindestens zwei eigenständige Ziele je Person auf leicht, mittel, schwer und experte, also acht pro Person. Bestehende gleichbedeutende Rollen-, Regie- oder Preisziele aus anderen Bereichen als Varianten zuordnen und im Neuheitsnachweis abziehen.

Rollen und Filme mit besonderen Karrierewegen, Bühne, Musik, Produktion, Zusammenarbeit, Ausbildung oder belegtem öffentlichen Engagement verbinden, soweit sie für die betreffende Person interessant sind. Nicht bei jeder Person dieselben biografischen Felder abfragen. Geburtsdaten und frühere Berufe sind nicht automatisch interessanter als eine prägende künstlerische Arbeit. Aktuelle oder strittige biografische Aussagen anhand geeigneter Quellen prüfen; ungeprüfte Gerüchte sind kein Fragenmaterial.

Wenn eine Person vorgegeben ist, ihren vollständigen öffentlichen Schauspielernamen im Fragetext nennen. Wenn der Name selbst gesucht wird, ihn vor der Antwort auch in Überschrift und Metadatenanzeige verborgen halten; `person_name_before_answer=false` beziehungsweise `actor_name_before_answer=false` in der gewählten Übergabe korrekt setzen.

Konkrete Filmbezüge nach der Antwort mit passenden vorhandenen oder geprüften ergänzten Filmdaten verknüpfen, bei mehreren Filmen getrennt. Biografien benötigen keinen künstlichen Filmbezug, Serien werden nicht als Filme ausgegeben. Ein Filmverweis in einer Personenfrage erzeugt allein keine Pflicht zu einem zusätzlichen Filmfragenpaket mit Jahres-/Regiefragen.

Die native Personen-JSON und die abgeleitete App-CSV sind unterschiedliche Formate. Vor Erweiterungen [Personenpaket](Schauspieler-Fragenpaket.md), [Anzeigevertrag](Filmreise-Personen-und-Vertiefungen.md) und den tatsächlich zuständigen Adapter lesen. Die vorhandenen Ableitungsskripte können feste Paketgrößen voraussetzen und sind nicht ungeprüft universelle Importer.

## Preisfragen

Alle vier Preis-Schwierigkeiten passend zum beauftragten Schwerpunkt abdecken und die Verteilung vor der Lieferung ausweisen. Für einzelne Preisverleihungen oder Gewinnerfilme gilt ohne zusätzlichen Auftrag keine pauschale Acht-Fragen-Pflicht.

Veranstaltung, Ausgabe beziehungsweise Verleihungsjahr, Wettbewerb und genaue Preiskategorie eindeutig nennen. Sieg, Nominierung, Ehrenpreis, Hauptpreis und Handwerkspreis auseinanderhalten. Bei Auszeichnungen für eine konkrete Leistung die Person und den betreffenden Film korrekt verknüpfen; geteilte Preise und Teams vollständig nennen.

Nicht nur Jahreslisten von Gewinnerfilmen abfragen. Interessante Ansätze sind besondere Leistungen, Mehrfachauszeichnungen, nachvollziehbare Verbindungen zwischen Festivals, ungewöhnliche Preisverläufe, Juryentscheidungen und belegte Meilensteine. Nicht aus einem Preisurteil eine objektive allgemeine Filmqualität ableiten. Rekorde wie „erster“, „einziger“ oder „meiste“ brauchen klare Abgrenzung und einen belegten Stichtag.

Offizielle Listen der Academy, des jeweiligen Festivals oder der verleihenden Institution bevorzugen und die konkrete Jahres-/Kategorieseite prüfen. Das Verleihungsjahr steht in der Preisfrage; das erste Veröffentlichungsjahr steht in den Filmdaten. Preisfragen erhalten die bestehenden Bereichstags `Preisträger`; Filmbezüge machen sie nicht automatisch zu Filmgenrefragen. Siehe [Preisvertrag](Preistraeger.md).

## Recherche und Übergabe

Für neue Inhalte die aktuellen Bestandsquellen und tatsächlichen Fragen heranziehen. Ein datierter Film-Snapshot genügt für eine Vorauswahl, aber nicht als vollständige Prüfung aller bereits vorhandenen Sachverhalte. Gegen Film-, Personen- und Preisziele abgleichen; bei fehlenden Quellen die Grenze benennen.

Fachliche Aussagen anhand tatsächlich gelesener geeigneter Quellen prüfen. Credits, Verleihunterlagen, Archive, Filminstitutionen und offizielle Preislisten bevorzugen. Für genaue Handlung, Zitate, Produktionsanekdoten und Biografien reicht eine allgemeine Kurzsynopsis nicht. Widersprüche auflösen oder den fraglichen Inhalt aus dem geprüften Paket auslassen. Eigene Texte schreiben und konkret dokumentieren, welche Quelle welchen Sachverhalt trägt.

Bei Filmfragen ist der bestehende [CSV-Vertrag](Importformat.md) führend. Bekannte Feldnamen, stabile Frage- und Wissensziel-IDs sowie gültige Variantenbezüge erhalten. Die Bekanntheit separat in der redaktionellen Filmdatenübergabe führen; eine erfundene CSV-Spalte aktiviert keine Filmgruppe.

Für Jahr und Regie pro Film genau einen Integrationsweg wählen: vorhandene Ziele wiederverwenden, gesondert aus geprüften Filmdaten erzeugen lassen oder ausdrücklich als zusätzliche CSV-Ziele liefern. Vor einer späteren Integration den zusammengesetzten App-Katalog prüfen, damit kein Generator zusätzlich dieselben Fakten anlegt. Filmdaten allein sind keine spielbare Frage. Die zusätzlichen Preis-/Personen-Filmdaten erzeugen derzeit keine Jahres-/Regiefragen. Siehe [Filmwissen und Filmdaten](Filmwissen-und-Filmdaten.md).

Bei einer beauftragten Überarbeitung bestehende Rohquellen, IDs und Fortschritte erhalten und den etablierten Redaktionsweg prüfen. Die Erstellung eines Pakets oder der Einsatz des Skills ist keine automatische Freigabe für Import, Änderung von Freischaltschwellen oder Veröffentlichung.

## Abnahme

Vor der Abgabe sowohl jede Frage einzeln als auch Film-/Personenblöcke und das gesamte Paket prüfen:

1. Fachliche Eindeutigkeit, interessante Auswahl, angemessene Schwierigkeit und tatsächlich gelesene Belege.
2. Abwechslung in Perspektive und Denkaufgabe; keine Serie austauschbarer Schablonen oder generischer Erklärungen.
3. Vollständige Mindestabdeckung und unabhängige Ziele; Jahr/Regie getrennt von Inhaltszielen; Varianten und bereichsübergreifende Dubletten korrekt gezählt.
4. Vier unterschiedliche Antworten, genau eine richtige, plausible falsche Optionen und inhaltlich passendes Feedback.
5. Lösungsschutz vor der Antwort, richtige Filmfassung, Namen, Teams, Datumsarten und Spoilerangaben.
6. Erneutes Einlesen der erzeugten Dateien, unveränderte Zellwerte/Sonderzeichen, eindeutige IDs, Variantenreferenzen und passendes Importformat; bei Integrationsauftrag zusätzlich tatsächlicher App-Parser und Projekttests.

Der Prüfbericht unterscheidet Entwurf, formale Prüfung, redaktionellen Quellenabgleich, App-Parser-Prüfung und tatsächlichen Import. Er nennt Film-/Personenzahlen, eigenständige Ziele und Varianten, Stufenverteilung, Bekanntheitsverteilung nur für Filmfragen, gesonderte Jahres-/Regieabdeckung, inhaltliche Auswahlbegründung sowie offene oder ausgesonderte Punkte. Keine Abnahme behaupten, die nicht durchgeführt wurde.

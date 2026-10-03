# Schauspieler: 200 weitere Fragen vorbereitet

Stand: 03.10.2026. Paket `SCHAUSPIELER-202610-P02` ergänzt **25 bisher nicht im Personenpaket enthaltene Schauspielerinnen und Schauspieler** mit je acht Fragen. Je Person gibt es zwei Fragen in Leicht, Mittel, Schwer und Außergewöhnlich, insgesamt 50 je Stufe. Außergewöhnlich entspricht Experte in der App. Die Ergänzung ist als fertiges Redaktionspaket vorbereitet, noch nicht in die App integriert oder veröffentlicht. Der veröffentlichte Stand bleibt Version 41 mit 800 Schauspielerfragen.

## Dateien

- [Lesefassung mit allen 200 Fragen, Antwortmöglichkeiten, Lösungen, Vertiefungen und Quellen](Schauspieler-Ergaenzung-P02/Schauspieler_200_Fragen_Lesefassung.md)
- [Strukturiertes vollständiges JSON-Paket](Schauspieler-Ergaenzung-P02/Schauspieler_25_Personen_200_Fragen.json)
- [127 Film-Eckdatensätze](Schauspieler-Ergaenzung-P02/Filmdaten.json)
- [Prüfbericht mit Verteilung, Grenzen und Prüfsummen](Schauspieler-Ergaenzung-P02/Pruefbericht.json)
- [Quellenstand für Biografien und Filme](Schauspieler-Ergaenzung-P02/Quellenstand.json)
- [Abrufnachweis zusätzlicher Fachquellen](Schauspieler-Ergaenzung-P02/Zusatzquellen-Abrufe.json)
- [Bestandsabgleich und fachliche Entscheidungen](Schauspieler-Ergaenzung-P02/Bestandsabgleich.json)
- [Vier verknüpfte Bestandsziele](Schauspieler-Ergaenzung-P02/Bestandsziel-Zuordnungen.json)
- [Eigene redaktionelle Ausgangsfassung](../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspieler_25_Personen_200_Fragen_Redaktion.txt)

Die Lesefassung zeigt die Lösungen unmittelbar und verwendet Personenüberschriften. Sie ist für die Redaktion gedacht; die spätere Spielansicht muss bei Erkennungsfragen den Namen bis zur Lösung verbergen.

## Inhalt und Schwierigkeit

13 Schauspieler und zwölf Schauspielerinnen ergänzen den bisherigen Bestand. Dazu gehören Kevin Costner, Russell Crowe, Hugh Jackman, Ryan Gosling, Robert Downey Jr., Edward Norton, Nicolas Cage, Steve Martin, Jeff Bridges, Dustin Hoffman, Antonio Banderas, Ulrich Tukur, Armin Mueller-Stahl, Olivia Colman, Emily Blunt, Rachel Weisz, Tilda Swinton, Saoirse Ronan, Kirsten Dunst, Helena Bonham Carter, Jennifer Aniston, Julie Andrews, Isabelle Huppert, Hildegard Knef und Iris Berben.

Die Fragen behandeln Rollen, Figurenkonflikte, Serien, Regie, Produktion, Literaturvorlagen, Bühne, Musik, Ausbildung, öffentliche Projekte und Auszeichnungen. Es gibt neun thematische Suchgruppen; die Texte wurden einzeln formuliert. Unter den außergewöhnlichen Fragen finden sich beispielsweise Jeff Bridges' Klangprojekt „Sleeping Tapes“, Tilda Swintons Performance „The Maybe“ und Helena Bonham Carters Finanzierung ihres ersten Spotlight-Eintrags. Die Stufen sind redaktionelle Einschätzungen, noch nicht mit Spielenden kalibriert.

Alle 200 Vertiefungen enthalten konkrete Zusammenhänge. Sie umfassen 40–50 Wörter, Median 44,5. Die Länge ist nur ein Prüfwert, kein Ersatz für inhaltliche Tiefe. Bei 195 Fragen steht der vollständige öffentliche Schauspielername in der Frage. Fünf Erkennungsfragen suchen die Person selbst und behalten den Namen bis zur Antwort verborgen. Personen in Antwortmöglichkeiten werden mit vollständigem Namen genannt; Titel, Rollen- und Künstlernamen bleiben als solche erkennbar.

## Filme und Quellen

126 Fragen verweisen auf konkrete Filme; acht davon auf mehrere. 127 eindeutige Filmidentitäten haben Eckdaten mit Originaltitel, erster Veröffentlichung, Regie, Produktionsländern und Quellen. 74 Fragen bleiben ohne Filmverweis. Serien und Bühnenproduktionen erhalten keinen erfundenen Kinofilm. Zwei tatsächliche Fernsehfilme sind als solche gekennzeichnet.

Erste Veröffentlichung meint auch eine Festival- oder sonstige öffentliche Premiere. Besondere Fälle sind separat erläutert: „Lost River“ und „The Cat's Meow“ wurden vor ihrem regulären Kinostart auf Festivals gezeigt; „¡Átame!“ hatte im Dezember 1989 Premiere und kam im Januar 1990 regulär in spanische Kinos. Bei „Kikis kleiner Lieferservice“ unterscheiden sich japanische Erstveröffentlichung und die spätere englische Disney-Synchronfassung. Bei „Tod eines Handlungsreisenden“ nennt die englische Wikipedia-Infobox nur USA, während deutsche Verleih- und Archivquellen eine US-/BRD-Koproduktion ausweisen; der Ergänzungsdatensatz dokumentiert diesen Unterschied und verwendet die Verleih-/Archivangaben.

209 verschiedene Quellenadressen sind frageweise hinterlegt. 50 deutsche/englische Biografieseiten und 127 Filmseiten wurden direkt gelesen und mit Datum und HTML-Hash dokumentiert. Ergänzend sind 32 Fachseiten lesend abgerufen, unter anderem Künstlerseiten, Theater, Verlage, Hochschulen, Cannes und unterstützte Organisationen. Ganze Webseiten werden nicht in das Paket kopiert. Die Texte sind eigenständige Zusammenfassungen. Die Recherche und redaktionelle Durchsicht sind erfolgt; eine zweite unabhängige Vollabnahme aller Aussagen liegt nicht vor.

## Vorbereitung der Integration

Das Format `wissensquiz-redaktion-personen-v2` erweitert das bisherige Redaktionsformat um `film_refs` je Frage und ein `films`-Verzeichnis im selben Paket. Die separate Filmdaten-Datei enthält dieselben Datensätze. Es handelt sich um keinen CSV- oder Spielstandimport. Die Personenkennungen `ACTOR-101` bis `ACTOR-125` und die Paketkennung P02 kollidieren nicht mit dem bisherigen Paket.

Vier Fragen beschreiben bereits vorhandene Film-Wissensziele: Sebastians Klavierspiel, das Dokument in „National Treasure“, Jeff Bridges als Dude und Julie Andrews als Mary Poppins. Sie verwenden die bestehenden `knowledge_id`-Werte und einen ausdrücklichen `variant_of`-Verweis. Zwei weitere automatische Kandidaten wurden als andere Aussagen erkannt: Maximus' Besetzung ist kein Oscar-Gewinn, und die Besetzung von Bellatrix ist nicht die Handlung ihrer Tötung von Sirius. 196 weitere Wissensziel-IDs bleiben vorgeschlagen; weitere sinngleiche Ziele sind vor Integration fachlich abzugleichen. Die Erweiterung der Personenkategorie erzeugt somit keine behaupteten 200 neuen Lernziele.

Bei einer späteren Einbindung gelten die veröffentlichten [Filmreise-/Anzeigeverträge](Filmreise-Personen-und-Vertiefungen.md): additive Personenfragen auch in der Filmreise, gemeinsame Lernstände bei Varianten, vollständige vorgegebene Namen und Filmdaten erst nach der Antwort. Bestehende Film-Eckdaten werden bevorzugt wiederverwendet. Filmreferenzen ordnen Personenfragen weder einem Genre noch einer Bekanntheitsgruppe zu. App-Pakete, Offline-Katalog und Duellkatalog sind in dieser Vorbereitung nicht verändert.

## Prüfung und Wiedererzeugung

`node scripts/prepare-actor-supplement.mjs` prüft und erzeugt das Paket aus der eigenen Redaktion, den Quellenmanifesten sowie den kuratierten Zusatzquellen und Filmangaben. Der commitbare Quellenstand genügt für eine Wiedererzeugung ohne erneuten Netzabruf. Dies wurde in einem getrennten Verzeichnis ohne Recherchecache geprüft: alle sechs abgeleiteten Dateien bytegleich. `scripts/research-actor-supplement.py`, `scripts/research-actor-supplement-films.py` und `scripts/research-actor-supplement-extra.py` ermöglichen einen öffentlichen Quellenabruf; die beiden ersten Skripte verwenden vorhandene Cache-Einträge erneut. Neue Abrufe erhalten ihr tatsächliches Tagesdatum, wiederverwendete Einträge behalten ihr ursprüngliches. Die Recherche ist getrennt von der Paketableitung. Temporäre Volltexte liegen ausschließlich im ignorierten Recherchecache.

Geprüft: 25 Personen, je acht Fragen und zwei pro Stufe, 200 eindeutige Frage-IDs, vier unterschiedliche Antwortmöglichkeiten, gültige Lösungsschlüssel, alle Filmverweise auflösbar, alle angegebenen Veröffentlichungsjahre in den abgerufenen Eckdaten vorhanden, Namenssichtbarkeit und JSON-Rücklesen. Fragen mit Antwortmöglichkeiten umfassen höchstens 60 Wörter. Antworten sind insgesamt genau 50-mal A, B, C und D; je Stufe verteilen sich die 50 Lösungen möglichst gleichmäßig auf 12/13 pro Buchstabe. Der Schlüssel wurde unabhängig vom Inhalt gemischt.

Ein separater Vergleich bestätigt für jede der 200 Fragen identische Fragetexte, Antwortmengen, Lösungen, Vertiefungen und Filmverweise gegenüber der Ausgangsfassung. Das separate Filmverzeichnis stimmt mit dem im Paket überein. Alle 209 frageweise verlinkten Quellenadressen sind in den Abrufmanifesten vorhanden; die Zusatzabrufe haben HTTP 200 und lesbaren Text. 176 lokale Dokumentverweise in den betroffenen Fach- und Einstiegsseiten sind auflösbar; 18 öffentliche CSV einschließlich Demo stimmen mit ihren festgehaltenen Prüfsummen überein.

Wie beim ursprünglichen Personenpaket schützt `.gitattributes` die Dateien im Ergänzungsordner vor automatischer Zeilenendekonvertierung. Dadurch bleiben die dokumentierten Byte-Prüfsummen auch bei einem Git-Checkout erhalten.

Der Vergleich mit dem erhaltenen 800er-Paket und sämtlichen öffentlichen CSV-Zeilen ergab keine identischen normalisierten Fragetexte oder kollidierenden neuen Frage-IDs. Die vier fachlich gleichen Aussagen bleiben ausdrücklich Varianten. Das 800er-Original hat unverändert SHA-256 `8588de53610bf411d1588fd06aa00c47d6862cb43c3be9889e67970ac7850df8`. Die Prüfsummen der unveränderten öffentlichen CSV sind im Bericht festgehalten.

Zusätzlich am vorbereiteten Stand erneut ausgeführt: `npm test -- --fileParallelism=false`, 234 Tests in 40 Dateien erfolgreich, sowie `npm run build`, erfolgreich. Das Offline-Paket bleibt `film-6f3c67a766d8` mit 48 Dateien; die Ergänzung ist nicht im spielbaren Katalog enthalten. Bekannte Zod-Annotations- und Bundlegrößenhinweise bleiben. JavaScript- und Python-Syntaxprüfung erfolgreich. Anwendungscode und spielbarer Katalog unverändert; die Inhaltsabnahme erfolgt am Redaktionspaket. Die Browsernachweise der Version 41 sind frühere Prüfungen.

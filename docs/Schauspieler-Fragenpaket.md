# Schauspieler: Fragenpaket für 100 Personen

Stand: 03.10.2026. **800 Fragen für 50 Schauspieler und 50 Schauspielerinnen**, mit jeweils zwei Fragen pro Person und Schwierigkeitsstufe. Das am 02.10.2026 vorbereitete Paket ist auf den anschließenden Veröffentlichungsauftrag als eigene App-Kategorie **Schauspieler** eingebaut. Als **Sites-Version 37** am 03.10.2026 erfolgreich veröffentlicht, nativer Status `succeeded`. [Veröffentlichungsnachweis](Sites-Betrieb.md).

| Stufe im Paket | Pro Person | Insgesamt |
| --- | ---: | ---: |
| Leicht | 2 | 200 |
| Mittel | 2 | 200 |
| Schwer | 2 | 200 |
| Außergewöhnlich | 2 | 200 |
| **Gesamt** | **8** | **800** |

Die Fragen sind einzeln formuliert. Neben bekannten Figuren und Filmpartnerschaften behandeln sie Bühnenarbeit, Musik, Ausbildung, frühere Berufe, Produktion, Auszeichnungen, Sport und öffentliches Engagement. Die Zusatzinformationen erläutern jeweils den konkreten Umstand. Filmdaten sind kein Pflichtbestandteil. Die Auswahl umfasst Hollywood, europäisches Kino, deutschsprachige Darsteller und bekannte Gesichter des asiatischen Kinos; sie bildet keine Rangliste.

## Dateien

- [Vollständige Lesefassung mit Personenübersicht, Antworten und Zusatzinformationen](Schauspieler-Fragenpaket/Schauspieler_800_Fragen_Lesefassung.md)
- [Strukturiertes JSON-Paket](Schauspieler-Fragenpaket/Schauspieler_100_Personen_800_Fragen.json)
- [Maschineller Prüfnachweis](Schauspieler-Fragenpaket/Pruefbericht.json)
- [Abgeleitete CSV im App-Format](../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspieler_800_Fragen_App.csv)
- [App-Importbericht und Zuordnung vorhandener Wissensziele](importbericht-schauspieler.json)
- [Eigene redaktionelle Ausgangsfassung](../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspieler_100_Personen_Redaktion.txt)
- [Quellenstand mit Abrufdatum und Recherchebegriffen](../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspieler_Quellenstand_2026-10-02.json)

Die Lesefassung ist für die Redaktion gedacht und zeigt Lösungen unmittelbar. Ihre Personenüberschriften können Erkennungsfragen vorwegnehmen; bei einer späteren Spielansicht gilt stattdessen das Sichtbarkeitsfeld des JSON-Pakets.

## JSON-Vertrag

Das Paket verwendet `wissensquiz-redaktion-personen-v1` und die Paket-ID `SCHAUSPIELER-202610-P01`. Es ist ein eigenes Redaktionsformat, kein Spielstand und keine CSV für den bestehenden Importer.

| Feld | Bedeutung |
| --- | --- |
| `actors` | 100 Personen mit Name, Personen-ID und ihren acht Frage-IDs |
| `questions` | 800 eigenständige Frageobjekte |
| `question_id` | Eindeutige Paketkennung mit Person, Stufe und laufender Nummer |
| `knowledge_id` | Vorgeschlagene Wissensziel-ID; vor Integration mit dem Bestand abgleichen |
| `variant_of` | Im Paket immer `null`; bestehende Variantenbeziehungen sind noch nicht zugeordnet |
| `actor_id` | Verweis auf die Person |
| `difficulty` | `leicht`, `mittel`, `schwer` oder `außergewöhnlich` |
| `question_type` | Grobe thematische Suchhilfe; keine App-Kategorie |
| `question` | Eigenständig verständlicher deutscher Fragetext |
| `answers` | Vier unterschiedliche Antworttexte mit den Kennungen A–D |
| `correct_answer` | Kennung der vorgesehenen richtigen Antwort |
| `additional_info` | Individueller Hintergrund zur Lösung |
| `source_urls` | Verlinkte Biografien und gegebenenfalls zusätzliche Fach- oder Filmseiten |
| `actor_name_before_answer` | Bei 73 Erkennungsfragen `false`, damit der Personenname die Lösung nicht verrät |
| `verification_status` | `redaktionell_recherchiert`; keine unabhängige Zweitabnahme |

## Recherche und Prüfung

226 unterschiedliche Quellenadressen sind hinterlegt: überwiegend deutsche und englische Biografien, ergänzt durch Filmseiten und ausgewählte offizielle Quellen wie Oscars, Verlage und die Terence-Hill-Filmografie. Das Quellenmanifest dokumentiert Abrufdatum und bei direktem Abruf den Hash der gelesenen HTML-Fassung. Vollständige Webseiten werden nicht als Paketinhalt übernommen. Recherchebegriffe helfen beim Wiederfinden; ihr Vorkommen allein belegt keine Aussage.

Die Strukturprüfung bestätigt 100 Personen, acht Fragen pro Person und genau zwei je Stufe, 800 eindeutige Frage-IDs, vier unterschiedliche Antworten sowie einen vollständigen Lösungsschlüssel. Lösungen sind je Stufe gleichmäßig verteilt: jeweils 50-mal A, B, C und D. Jede Frage enthält Zusatzinformation und Quellen. Es gibt keine exakt doppelt formulierten Fragen nach Normalisierung; alle Fragen einschließlich Antwortmöglichkeiten bleiben unter 60 Wörtern. JSON-Rücklesen und Dateihashes sind geprüft.

Die Schwierigkeiten sind redaktionelle Einschätzungen und noch nicht mit Spielenden kalibriert. Das Paket wurde inhaltlich recherchiert und bei der Durchsicht korrigiert; eine zweite unabhängige Vollabnahme aller 800 Aussagen liegt nicht vor. Die 800 vorgeschlagenen Wissensziel-IDs bedeuten noch nicht, dass es gegenüber dem bestehenden Filmkatalog 800 neue Lernziele gibt.

## App-Kategorie

**Themen → Schauspieler spielen** öffnet das Freie Spiel mit der ausgewählten Personenkategorie. **Personen ansehen** zeigt die 100 Personen und ihren Lernfortschritt. Auch unter „Zusätzliche Kategorien“ lässt sich Schauspieler auswählen, gemeinsam mit Classics, Arthouse oder Preisträger. Beim Auswählen aus der Filmreise wechselt die App ins Freie Spiel. Rekordrunden und Fehlertraining unterstützen die Kategorie ebenfalls.

Die vierte Paketstufe **Außergewöhnlich** wird in der App als **Experte** geführt, jeweils mit 200 Fragen pro Stufe. Personenfragen sind unabhängig von Filmgenres und Filmgruppen; die Auswahl braucht keine Filmdaten. Bei Erkennungsfragen verraten Überschrift und Kategoriehinweis den Namen nicht. Nach der Antwort erscheinen Name, Lösung, die individuelle Vertiefung unter „Etwas tiefer eintauchen“ und die Quellen. Es erscheint kein künstlicher Filmdatenblock.

50 Fragen wurden redaktionell vorhandenen Rollen-, Regie-, Vorlagen- oder Preiszielen zugeordnet; diese Varianten nutzen dieselben Wissensziel-IDs. Die übrigen 750 ergänzen neue Ziele. Der Gesamtbestand umfasst nun **5.677 Fragen und 5.147 Wissensziele**. Bestehende Fragen, Versionen, Lernereignisse und Rundensnapshots bleiben erhalten. Schauspielerfragen verändern die festen Filmreise-Ziele und ihre Bekanntheitsgruppen nicht; Lernen, Fehlertraining, Karriere-XP und persönliche Rekordrunden funktionieren über die bestehenden Regeln.

Die App-CSV wird mit `node scripts/prepare-actor-package.mjs` aus dem unveränderten JSON-Paket und den Bestandszuordnungen in `src/actorKnowledgeLinks.json` abgeleitet. Die ursprüngliche Redaktion, IDs, Texte, Antworten, Zusatzinformationen und Quellen bleiben erhalten. Nur für die App werden Stufennamen und die 50 Wissensziel-Zuordnungen aufgelöst. Der reguläre Paketimport läuft transaktional und idempotent, die CSV ist im Offline-Cache enthalten. Sicherungen erhalten die Personenmetadaten und alle vier Kategorieauswahlen. Die einzelne abgeleitete CSV benötigt für ihre Variantenverweise den bestehenden Filmkatalog; der automatische App-Paketimport stellt diese Reihenfolge sicher.

Die Kategorie wird für die Solomodi veröffentlicht. Der eingerichtete Filmduell-Katalog bleibt bei seinen 4.827 Fragen; die Vorbereitung schließt Personenfragen ausdrücklich aus. Schauspielerduelle benötigen eine eigene serverseitige Freigabe und das Verbergen von Personennamen vor der Antwort.

193 Logik-/Datenbanktests und der Produktions-Build erfolgreich. Paketimport, bytegleiche App-Kopie, 50 Bestandszuordnungen, unveränderte ältere Fragen und Lernstände, Kategorievereinigung, Filmreise-Erhalt sowie JSON- und Kontokompaktsicherungen geprüft. Die Browserabnahme wird im [Prüfbericht](Pruefbericht.md) dokumentiert. Schwierigkeiten und fachliche Prüfgrenzen der Redaktion gelten weiterhin.

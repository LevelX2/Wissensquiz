# Fragenimport – Vertrag Version 1

Lokale Speicherorganisation seit 03.10.2026: Originalspalten bleiben vollständig im logischen Frageobjekt und in JSON-Sicherungen erhalten. Im getrennten IndexedDB-Katalog verweisen exakt doppelte Metadatenwerte verlustfrei auf normalisierte Fragefelder; Versionen und Importformat bleiben gleich. `npm run check:questions` prüft alle Pakete einschließlich Rohquellenvergleich und exakter Rekonstruktion. [Organisation und Nachweis](Fragedaten-Organisation.md).

Aktueller lokaler Gesamtstand (03.10.2026): [Schauspieler](Schauspieler-Fragenpaket.md) ergänzt 800 Fragen, davon 50 Varianten bestehender Wissensziele und 750 neue Ziele. 17 CSV-Pakete plus bestehende Filmfragen: 5.677 Fragen/5.147 Ziele. `person_name` hat für das Thema Vorrang vor Film-/Reihentiteln; `person_id` kennzeichnet die eigenständige Personenkategorie. `person_name_before_answer` und `source_difficulty` bleiben in den Metadaten erhalten. Außergewöhnlich aus der Redaktion wird in der App-CSV als `experte` geführt. Die ursprüngliche Redaktions-JSON ist weiterhin kein direkter CSV- oder Spielstandimport. Schauspieler ist als vierte Kategorie in Auswahl und Sicherungen erlaubt; Personenfragen benötigen keine Filmfelder und werden nicht in die Filmreise eingeordnet.

Für Duelle werden keine CSV-Felder geändert. `npm run prepare:duels` erzeugt aus den öffentlichen App-Paketen einen getrennten Betreiberkatalog mit eingefrorenen vollständigen Frageobjekten; keine privaten Importe oder Spielstände. Aktuell 4.827 zulässige Fragen/4.347 Ziele ohne Demo/Experte. Historische Duellinhalte mit inzwischen geänderter lokaler ID erhalten bei Lernübernahme eine `DUEL-…`-ID und `metadata.duel_question_id`, bewahren aber ihr Wissensziel. Bestehende Fragen werden nicht überschrieben. Optionale Rundenfelder `solutionDisplay` und `duel` sowie die entsprechende Einstellung bleiben in JSON und Kontokompaktformaten erhalten; Altstände ohne Felder sind gültig. [Duellvertrag](Asynchrone-Filmduelle.md).

Aktueller lokaler Gesamtstand (02.10.2026): [Preisträger](Preistraeger.md) ergänzt 200 Fragen/200 Ziele, je 50 leicht/mittel/schwer/experte. 16 CSV-Pakete: 4.040 Fragen/3.560 Ziele; mit den 837 bisherigen Filmfragen 4.877 Fragen/4.397 Ziele. Der Import akzeptiert nun vier Schwierigkeiten; Kategorienauswahl und Sicherungen erlauben Preisträger zusätzlich zu Classics/Arthouse.

Vorherige lokale Ergänzung (02.10.2026): [Alle-Genres-Paket](Alle-Genres-Ergaenzung.md) mit 960 gelieferten Fragen zu 120 Filmen integriert, darunter je 120 bereits enthaltene Regie- und Jahresfragen. Die nachgelieferte Filmdaten-JSON versorgt nun auch diese 120 Filme mit dem aufklappbaren Filmdatenbereich, ohne zusätzliche Fragen anzulegen. 15 CSV-Pakete: 3.840 Fragen/3.360 Ziele; einschließlich 837 älterer, separat generierter Jahres-/Regieergänzungen 4.677 Fragen/4.197 Ziele. Die folgenden Paketabschnitte dokumentieren ihren jeweiligen historischen Importstand.

## Tatsächlich gelieferte Quelle

`SciFi_Quiz_180_Fragen.csv`: UTF-8, 31 Spalten, Komma und vollständig gequotete Felder. Alle 180 Datensätze wurden mit dem tatsächlichen App-Parser ausgewertet. Kein Datensatz musste ausgeschlossen werden; 150 Wissensziel-IDs, 30 explizite Varianten, 39 Themen, 50 leichte Wissensziele für die begrenzte Auszeichnung. Alle vier Antwortfeedbacks, Vertiefungen, Merksätze und Quellenfelder sind vorhanden. Vollständiger struktureller Bericht: [importbericht.json](importbericht.json).

## Feldzuordnung

Das zusätzlich gelieferte `Action_Quiz_180_Fragen.csv` hat dasselbe Format mit 31 Spalten. Mit dem App-Parser vollständig geprüft: 180 akzeptierte Fragen, 150 Wissensziele, 30 Varianten, 17 Themen; keine Ausschlüsse, Warnungen oder ID-Konflikte mit Sci-Fi. Insgesamt 360 Fragen, 300 Wissensziele und 56 Themen. [Action-Bericht](importbericht-action.json). Die Paketergänzung läuft innerhalb einer IndexedDB-Transaktion; vorhandene Fragen, Antwortereignisse und laufende Runden werden nicht überschrieben. Beide Originaldateien bleiben unverändert.

Am 26.09.2026 zusätzlich geliefert: `Horror_Quiz_180_Fragen.csv`, ebenfalls mit 31 Spalten. Alle 180 Datensätze wurden mit dem App-Parser gegen den vorhandenen Sci-Fi-/Action-Bestand ausgewertet: 150 Wissensziele, 30 Varianten und 20 Themen, keine Ausschlüsse, Warnungen oder ID-Konflikte. Der Gesamtbestand umfasst jetzt 540 Fragen, 450 Wissensziele und 76 Themen. Rohquelle und `public/horror-fragen.csv` sind bytegleich. Die automatische transaktionale Ergänzung erhält bestehende Fragen und Lernstände; der Produktions-Build nimmt das Paket in den Offline-Cache auf. [Horror-Bericht](importbericht-horror.json). Die fachlichen Aussagen und Quellenkennzeichnungen stammen unverändert aus der Nutzerdatei; keine unabhängige Faktenprüfung.

Ebenfalls am 26.09.2026 geliefert: `Fantasy_Quiz_180_Fragen.csv`, 31 Spalten. Vollständige Prüfung mit dem App-Parser gegen alle drei vorhandenen Pakete: 180 akzeptierte Fragen, 150 Wissensziele, 30 Varianten und zwölf Themen; keine Ausschlüsse, Warnungen oder ID-Konflikte. Aktueller Gesamtbestand: 720 Fragen, 600 Wissensziele, 120 Varianten und 88 Themen. Rohquelle, `public/fantasy-fragen.csv` und Build-Kopie bytegleich. Automatische Ergänzung innerhalb derselben Speichertransaktion; vorhandene Inhalte und Lernstände bleiben erhalten. [Fantasy-Bericht](importbericht-fantasy.json). Filmangaben nicht unabhängig fachlich geprüft.

| CSV | Intern und Verwendung |
| --- | --- |
| `question_id` | `id`; verpflichtend und eindeutig. Bereits gespeicherte IDs werden mit Hinweis übersprungen. |
| `knowledge_id` | `knowledgeId`; gemeinsame Lernidentität von Frage und Varianten. |
| `variant_of` | Verweis auf Fragen-ID; rekursive Auflösung im neuen und bestehenden Bestand. Fehlende, zyklische oder widersprüchliche Zuordnungen werden ausgeschlossen. |
| `language` | `language=de`; leer bedeutet Deutsch, auch de-DE/de-AT/de-CH akzeptiert. Andere Sprachen werden ausgeschlossen. |
| `domain` | `domain`, original erhalten; fehlt es, „Importierte Inhalte“. |
| `subdomain`, `franchise`, `film_title_de`, `film_title_original` | Thema: vorhandene Filmreihe → deutscher Filmtitel → Originaltitel → Untergebiet → Gebiet → „Importierte Fragen“. Nur vorhandene Informationen werden verwendet. |
| `film_year` | Original in `metadata`, in den gelieferten Fragen bereits Teil des Fragetexts. |
| `difficulty` | `leicht`, `mittel`, `schwer`, `experte`; alternativ easy/medium/hard/expert oder 1/2/3/4. Fehlend: vorläufig mittel mit Bericht. Unbekannte Werte werden ausgeschlossen. |
| `question_type` | Redaktionelle Kategorie, original in `metadata`. In dieser Datei z. B. Handlung, Technik und Filmgeschichte; **kein Interaktionstyp**. Vier Antworten und ein Lösungsfeld definieren die Einzelwahl. |
| `topic_tags`, `badge_tags` | Listen, getrennt durch Pipe, Semikolon oder Komma; keine erfundenen Tags. |
| `learning_objective` | Original in `metadata`; keine lösungsverratende Anzeige vor der Antwort. |
| `question` | `question`; verpflichtend. |
| `answer_a` bis `answer_d` | Vier Antwortobjekte mit stabiler ID `<question_id>:a` bis `:d`. Leere oder gleiche Texte sind ungültig. |
| `correct_answer` | `correctId`; A–D, answer_a–d oder eindeutiger exakter Antworttext. |
| `feedback_a` bis `feedback_d` | Feedback am jeweiligen Antwortobjekt, bleibt beim Mischen erhalten. Fehlende Texte bleiben leer. |
| `explanation_short` | `explanation`; verpflichtend, nach der Antwort sichtbar. Bei „Keine Ahnung“ folgt die Erklärung auf die kurze Hervorhebung der richtigen Lösung. |
| `explanation_context` | Optionale Vertiefung; fehlt sie, entfällt der Abschnitt. |
| `memory_anchor` | Optionaler Merksatz. |
| `spoiler_level` | Original in `metadata`; vor jeder Runde allgemeiner Spoilerhinweis. |
| `source_urls` | HTTP-/HTTPS-URLs; Pipe, Semikolon oder Leerraum als Trenner. Ungültige/andere Protokolle schließen den Datensatz aus. |
| `verification_status` | Unverändert in `metadata`. „redaktionell_geprueft“ wird nicht als eigene Faktenprüfung ausgegeben. „demo-redaktionell“ kennzeichnet das separate Beispielpaket. |
| Unbekannte zusätzliche Spalten | Werden in `metadata` erhalten. |

Die zusätzliche UI-Auswahl „Keine Ahnung“ gehört nicht zu `answer_a`–`answer_d`. Importierte und gespeicherte Fragen behalten genau vier Antworten und denselben Lösungsschlüssel; die ausdrückliche Nichtwissensantwort wird ausschließlich als Ereignis gespeichert. [Antwortvertrag](Lernregeln.md#keine-ahnung-als-antwortoption).

## Identität und Fehlerbehandlung

- `.gitattributes` verhindert die automatische Zeilenenden-Konvertierung von CSV-Dateien durch Git. Die ursprünglichen CRLF-Zeilenenden bleiben zusammen mit dem Inhalt bytegenau erhalten.
- Fehlende Fragen-ID: Ausschluss, keine zufällig generierte Identität.
- Fehlendes Wissensziel ohne Variantenverweis: `question:<question_id>` plus Warnung. Nicht markierte Varianten lassen sich dadurch nicht erkennen.
- Mehrfach dieselbe ID innerhalb einer Datei: alle entsprechenden Datensätze ausschließen. Vorhandene IDs aus dem Browserbestand bleiben unverändert.
- Fehlerhafte Spaltenzahl: Datensatz ausschließen. Doppelte Header, fehlende Pflichtspalten oder kaputtes Quoting: Datei ablehnen.
- Varianten eines ausgeschlossenen Datensatzes werden ebenfalls ausgeschlossen, sofern kein gültiger bestehender Bezug existiert.
- Jede Frage erhält eine deterministische Inhaltsversion `csv-<Fingerprint>` aus dem vollständigen normalisierten Datensatz. Dies ist eine Versionskennung, kein kryptografischer Integritätsnachweis.
- Die CSV wird nur nach Vorschau und ausdrücklichem Import übernommen. Der Parser läuft in der Schreibtransaktion erneut gegen den aktuellen Bestand, damit parallele Importe keine IDs duplizieren.
- Maximal 20 MiB je CSV-Datei. JSON-Spielstandsicherungen dürfen seit der lokalen Korrektur vom 03.10.2026 bis zu 64 MiB groß sein, passend zur entpackten Online-Sicherung: der aktuelle vollständige Fragenbestand überschreitet bereits die frühere gemeinsame 20-MiB-Grenze. Inhaltsvalidierung und ausdrückliche Wiederherstellungsbestätigung bleiben erforderlich. Der Parser arbeitet synchron; sehr große Bibliotheken benötigen künftig einen Worker.
- Kein Auto-Update bestehender Fragen: IDs werden weder überschrieben noch still dupliziert. Runden enthalten zusätzlich unveränderliche Inhaltssnapshots.

Es wurden keine Filmplakate, externen Bilder oder Audiodateien eingebunden. Die Oberfläche verwendet eigene geometrische Grafiken und Systemschriften.

## Redaktionelle Vertiefung

Geprüfte Zusatzangaben können getrennt vom Import in der Erklärung erscheinen. Derzeit betrifft dies die Besetzung von „Conjuring – Die Heimsuchung“ (2013). Rohdateien, Frageversionen, IDs und Rundensnapshots werden dabei nicht überschrieben. Umfang, Quelle und Grenzen: [Erklärungstiefe](Erklaerungstiefe.md).

## Komödie und Western (26.09.2026)

`Komoedie_Quiz_180_Fragen.csv` und `Western_Quiz_180_Fragen.csv` haben ebenfalls 31 Spalten. Alle jeweils 180 Datensätze mit dem App-Parser gegen sämtliche Vorgängerpakete geprüft: je 150 Wissensziele, 30 Varianten und 25 Themen. Keine Ausschlüsse, Warnungen oder ID-Konflikte. Gesamtbestand 1.080 Fragen, 900 Wissensziele, 180 Varianten und 138 Themen. Rohquellen und öffentliche Kopien bytegleich zu den gelieferten Dateien; vorhandene Rohquellen unverändert.

Beide Genres werden automatisch ergänzt, sind kombinierbar und Teil des Offline-Pakets. Prüfung der transaktionalen Ergänzung umfasst ältere Stände mit einem bis fünf Paketen. Berichte: [Komödie](importbericht-komoedie.json), [Western](importbericht-western.json). Inhalte einschließlich bereits enthaltener Darstellernamen stammen aus den neuen Nutzerdateien; keine unabhängige fachliche oder vollständige redaktionelle Darstellerprüfung dieser 360 Fragen.

## Drama (26.09.2026)

`Drama_Quiz_180_Fragen.csv`: 31 Spalten, 180 akzeptierte Fragen, 150 Wissensziele, 30 Varianten und 25 Themen. App-Parser gegen alle sechs bestehenden Pakete ausgeführt: keine Ausschlüsse, Warnungen oder ID-Konflikte. Gesamtbestand 1.260 Fragen, 1.050 Wissensziele, 210 Varianten und 163 Themen. Gelieferte Datei, Rohquelle, öffentliche Kopie und Build-Kopie bytegleich (SHA-256 `62262f8338959dc79b9714c7bc9480005ae56de4ee21f780813c1150d599fc4f`).

Automatische Ergänzung bestehender Gast-/Kontostände, Genre-Symbol Theatermaske, Lernpfad und Offline-Paket eingebunden. App-Inhalte stammen unverändert aus der Quelle; keine unabhängige Prüfung ihrer Filmaussagen. [Drama-Importbericht](importbericht-drama.json).


## Classics (26.09.2026)

Die unverändert erhaltene Classics-CSV enthält 180 neue Fragen, 150 Ziele, 30 Varianten und 25 Filme. Vollständig mit dem App-Parser gegen den tatsächlich vorhandenen Bestand aus sieben Paketen geprüft: keine Konflikte, Ausschlüsse oder Warnungen. Gesamt: 1.440 Fragen, 1.200 Ziele und 188 Film-/Reihenthemen. Zehn Genres; neu sind Abenteuer, Musik und Thriller. Die Quellbezeichnung Sci-Fi wird beim Import auf das vorhandene Science-Fiction normalisiert; der unveränderte Originalwert steht zusätzlich in metadata.source_subdomain. Damit bleiben auch bestehende Ranglisten- und Lernpfadgruppen einheitlich.

Die unveränderte JSON-Zuordnung ist eine getrennte kuratierte Ergänzung. 225 Referenzen passen zu vorhandenen Fragen, 33 fehlen (12 RomCom, 21 Martial Arts); keine abweichenden Referenzen. Vorhandene Quelldateien stimmen mit ihren angegebenen SHA-256-Werten überein. Prüfung gegen Frage-ID, Wissensziel-ID, Variantenverweis, Originaltitel, Jahr und Genre; fehlende oder abweichende Fragen werden nicht angelegt. Die internen Listen tags und badgeTags erhalten Classics als idempotente Mengenergänzung. Die CSV-Metadaten bleiben als Originalbeleg erhalten, ebenso Frageversionen und alle übrigen Felder.

Historische Rundensnapshots bleiben unverändert. Die Backup-Prüfung normalisiert ausschließlich die autorisierte, referenzgeprüfte Tag-Ergänzung für ihren Inhaltsvergleich; Manipulationen an anderen Inhalten werden weiterhin abgelehnt. Der neue Fragenbestand ersetzt betroffene Objekte statt sie gemeinsam mit Rundensnapshots zu verändern. Keine Lernereignisse, Termine oder Punkte werden geändert. Ein erneuter Start prüft die Zuordnungen erneut, sodass später gelieferte fehlende Pakete berücksichtigt werden können.

Classics ist ein zusätzlicher Filter, kein Genre und keine Altersregel. Aktuell umfasst die Auswahl 405 Fragen, 336 Wissensziele und 57 Filme. Globale Summen bleiben nach Identität dedupliziert. Runden speichern die Kategorie im vorhandenen Themenfeld (Classics bzw. Classics: Filmtitel), sodass auch ihre Rekordkategorien getrennt bleiben; keine Datenbankmigration nötig. Die Auswahl und Backup-Prüfung verwenden dieselbe Kategorieauflösung. Die bisherigen Lernregeln gelten weiterhin je tatsächlichem Genre.

Nachweise: [Importbericht](importbericht-classics.json), [Zuordnungsbericht mit fehlenden IDs](classics-zuordnungsbericht.json). Roh-CSV SHA-256: 35a1a4cd6abfc74823af08d6113d8d984689c63a0ccf12b08a2211e7f1f1c944; Zuordnungsdatei: f65107dd2177f3fff1a4544b1baf6c9c48f4e65ee0fd0d0df9b328e694000eba. Filmaussagen und redaktionelle Auswahl stammen aus der gelieferten Quelle; keine zusätzliche unabhängige fachliche Prüfung. Arthouse ist lediglich angekündigt, ohne erfundene Zuordnungen.

## Martial Arts & Asia-Film, Rom-Com und Arthouse (26.09.2026)

Drei weitere unveränderte CSV-Pakete mit je 180 Fragen, 150 Wissenszielen und 30 Varianten eingebunden. Der App-Parser akzeptiert alle 540 Einträge ohne Ausschlüsse, Warnungen oder ID-Konflikte. Martial Arts & Asia-Film enthält 25 Filme in 22 Film-/Reihenthemen; Rom-Com 25 Filme in 23 Themen; Arthouse 25 Filme in 25 Themen. Gesamtbestand: elf Pakete, 1.980 eindeutige Fragen, 1.650 Wissensziele, 330 Varianten, 258 Themen und zwölf Genres.

Die Asia-Bezeichnung folgt dem gelieferten subdomain-Feld: neben Kampfkunstfilmen enthält das Paket Actionkomödien und Polizeifilme. Arthouse bleibt eine kuratierte Kategorie über bestehenden Genres. Der Alias RomCom im Arthouse-Paket wird beim Import mit Rom-Com vereinheitlicht, der Originalwert in metadata.source_subdomain erhalten. Sci-Fi wird weiterhin zu Science-Fiction normalisiert. Keine Änderungen an Rohdateien oder bisherigen Frageversionen.

Alle 33 zuvor fehlenden Classics-Verweise sind mit den beiden nachgelieferten Paketen aufgelöst; alle referenzierten Quellhashes passen. Classics enthält nun 438 Fragen, 360 Ziele und 61 Filme. Die zusätzliche Arthouse-Zuordnung ergänzt 126 vorhandene Fragen/108 Ziele aus 19 Filmen; mit dem neuen Paket sind das 306 Fragen, 258 Ziele und 44 Filme. Es gibt keine fehlenden oder abweichenden Referenzen. 48 Fragen gehören zu beiden Kategorien; deren Vereinigung umfasst 696 Fragen. Genres, Variantenbezüge, alte Tags, Texte, Quellen, IDs und Rundensnapshots bleiben erhalten. Die Zuordnungen werden anhand Frage-ID und Referenzfeldern geprüft und idempotent ergänzt; unbekannte und abweichende Referenzen weiterhin übersprungen und gemeldet.

Genres und zusätzliche Kategorien kombinieren sich als Einschränkung: eine oder beide Kategorien innerhalb der gewählten Genres, optional weiter auf Film/Reihe begrenzt. Beide Kategorien bedeuten Classics ODER Arthouse. Identitäten und Lernfortschritt werden nicht kopiert. Die bestehende Backup-Prüfung erlaubt ausschließlich die autorisierten Tag-Ergänzungen. Keine Datenbankmigration und keine neue automatische fachliche oder Darstellerprüfung. Filmaussagen und kuratierte Auswahl stammen aus den gelieferten Quellen.

Berichte: [Martial Arts](importbericht-martialarts.json), [Rom-Com](importbericht-romcom.json), [Arthouse](importbericht-arthouse.json), [Arthouse-Zuordnungen](arthouse-zuordnungsbericht.json), [aktualisierte Classics-Zuordnungen](classics-zuordnungsbericht.json).

SHA-256 der gelieferten und bytegleich erhaltenen Quellen:

- MartialArts_Quiz_180_Fragen.csv: ebc619048ce638866e2f40679200b3ee6e1d3e4c234805264d4687830d13961b
- RomCom_Quiz_180_Fragen.csv: b8d1fe55b82369a24c1d1b30ac801fd9a4131d2130d8f116819695a827a3d3ae
- Arthouse_Quiz_180_Fragen.csv: 84274af394d4bdc1952ea47716abd62331d45bd768ece7e72b17051b5a52af91
- Arthouse_Zuordnungen_Bestand.json: d133752f227d0412ffe2056dab94c952bdd0e58d50e0efafa339008c87adda49

Die zugestellte Martial-Arts-Datei hatte den Dateinamenszusatz „1“; sie ist unter dem von den Zuordnungen referenzierten kanonischen Namen abgelegt, mit unverändertem Inhalt.

## Jahres- und Regieergänzung (26.09.2026)

587 redaktionelle Zusatzfragen aus 300 referenzgeprüften Filmwerken ergänzen die elf unveränderten CSV-Pakete: 300 Jahresfragen und 287 Regiefragen. 13 vorhandene Regieziele werden weiterverwendet. Gesamt 2.567 Fragen/2.237 Ziele, gleiche Genres und Themen. Idempotente Ergänzung, feste Lernidentitäten und geprüfte variable Jahresantworten; historische Inhalte und Lernstände bleiben erhalten. Details: [Filmwissen und Filmdaten](Filmwissen-und-Filmdaten.md).

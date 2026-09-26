# Fragenimport – Vertrag Version 1

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
| `difficulty` | `leicht`, `mittel`, `schwer`; alternativ easy/medium/hard oder 1/2/3. Fehlend: vorläufig mittel mit Bericht. Unbekannte Werte werden ausgeschlossen. |
| `question_type` | Redaktionelle Kategorie, original in `metadata`. In dieser Datei z. B. Handlung, Technik und Filmgeschichte; **kein Interaktionstyp**. Vier Antworten und ein Lösungsfeld definieren die Einzelwahl. |
| `topic_tags`, `badge_tags` | Listen, getrennt durch Pipe, Semikolon oder Komma; keine erfundenen Tags. |
| `learning_objective` | Original in `metadata`; keine lösungsverratende Anzeige vor der Antwort. |
| `question` | `question`; verpflichtend. |
| `answer_a` bis `answer_d` | Vier Antwortobjekte mit stabiler ID `<question_id>:a` bis `:d`. Leere oder gleiche Texte sind ungültig. |
| `correct_answer` | `correctId`; A–D, answer_a–d oder eindeutiger exakter Antworttext. |
| `feedback_a` bis `feedback_d` | Feedback am jeweiligen Antwortobjekt, bleibt beim Mischen erhalten. Fehlende Texte bleiben leer. |
| `explanation_short` | `explanation`; verpflichtend, sofort nach der Antwort sichtbar. |
| `explanation_context` | Optionale Vertiefung; fehlt sie, entfällt der Abschnitt. |
| `memory_anchor` | Optionaler Merksatz. |
| `spoiler_level` | Original in `metadata`; vor jeder Runde allgemeiner Spoilerhinweis. |
| `source_urls` | HTTP-/HTTPS-URLs; Pipe, Semikolon oder Leerraum als Trenner. Ungültige/andere Protokolle schließen den Datensatz aus. |
| `verification_status` | Unverändert in `metadata`. „redaktionell_geprueft“ wird nicht als eigene Faktenprüfung ausgegeben. „demo-redaktionell“ kennzeichnet das separate Beispielpaket. |
| Unbekannte zusätzliche Spalten | Werden in `metadata` erhalten. |

## Identität und Fehlerbehandlung

- `.gitattributes` verhindert die automatische Zeilenenden-Konvertierung von CSV-Dateien durch Git. Die ursprünglichen CRLF-Zeilenenden bleiben zusammen mit dem Inhalt bytegenau erhalten.
- Fehlende Fragen-ID: Ausschluss, keine zufällig generierte Identität.
- Fehlendes Wissensziel ohne Variantenverweis: `question:<question_id>` plus Warnung. Nicht markierte Varianten lassen sich dadurch nicht erkennen.
- Mehrfach dieselbe ID innerhalb einer Datei: alle entsprechenden Datensätze ausschließen. Vorhandene IDs aus dem Browserbestand bleiben unverändert.
- Fehlerhafte Spaltenzahl: Datensatz ausschließen. Doppelte Header, fehlende Pflichtspalten oder kaputtes Quoting: Datei ablehnen.
- Varianten eines ausgeschlossenen Datensatzes werden ebenfalls ausgeschlossen, sofern kein gültiger bestehender Bezug existiert.
- Jede Frage erhält eine deterministische Inhaltsversion `csv-<Fingerprint>` aus dem vollständigen normalisierten Datensatz. Dies ist eine Versionskennung, kein kryptografischer Integritätsnachweis.
- Die CSV wird nur nach Vorschau und ausdrücklichem Import übernommen. Der Parser läuft in der Schreibtransaktion erneut gegen den aktuellen Bestand, damit parallele Importe keine IDs duplizieren.
- Maximal 20 MB je UI-Datei; für die erste Version als synchroner Parser ausgelegt. Sehr große Bibliotheken benötigen künftig einen Worker.
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

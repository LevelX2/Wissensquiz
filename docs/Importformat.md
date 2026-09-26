# Fragenimport – Vertrag Version 1

## Tatsächlich gelieferte Quelle

`SciFi_Quiz_180_Fragen.csv`: UTF-8, 31 Spalten, Komma und vollständig gequotete Felder. Alle 180 Datensätze wurden mit dem tatsächlichen App-Parser ausgewertet. Kein Datensatz musste ausgeschlossen werden; 150 Wissensziel-IDs, 30 explizite Varianten, 39 Themen, 50 leichte Wissensziele für die begrenzte Auszeichnung. Alle vier Antwortfeedbacks, Vertiefungen, Merksätze und Quellenfelder sind vorhanden. Vollständiger struktureller Bericht: [importbericht.json](importbericht.json).

## Feldzuordnung

Das zusätzlich gelieferte `Action_Quiz_180_Fragen.csv` hat dasselbe Format mit 31 Spalten. Mit dem App-Parser vollständig geprüft: 180 akzeptierte Fragen, 150 Wissensziele, 30 Varianten, 17 Themen; keine Ausschlüsse, Warnungen oder ID-Konflikte mit Sci-Fi. Insgesamt 360 Fragen, 300 Wissensziele und 56 Themen. [Action-Bericht](importbericht-action.json). Die Paketergänzung läuft innerhalb einer IndexedDB-Transaktion; vorhandene Fragen, Antwortereignisse und laufende Runden werden nicht überschrieben. Beide Originaldateien bleiben unverändert.

Am 26.09.2026 zusätzlich geliefert: `Horror_Quiz_180_Fragen.csv`, ebenfalls mit 31 Spalten. Alle 180 Datensätze wurden mit dem App-Parser gegen den vorhandenen Sci-Fi-/Action-Bestand ausgewertet: 150 Wissensziele, 30 Varianten und 20 Themen, keine Ausschlüsse, Warnungen oder ID-Konflikte. Der Gesamtbestand umfasst jetzt 540 Fragen, 450 Wissensziele und 76 Themen. Rohquelle und `public/horror-fragen.csv` sind bytegleich. Die automatische transaktionale Ergänzung erhält bestehende Fragen und Lernstände; der Produktions-Build nimmt das Paket in den Offline-Cache auf. [Horror-Bericht](importbericht-horror.json). Die fachlichen Aussagen und Quellenkennzeichnungen stammen unverändert aus der Nutzerdatei; keine unabhängige Faktenprüfung.

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

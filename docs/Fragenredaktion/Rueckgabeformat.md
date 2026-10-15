# Rückgabe bearbeiteter Filmfragen

Für die externe Überarbeitung der nächsten 50 Fragen die Datei `Naechste-50-Fragen-Bearbeitung.csv` bearbeiten und als CSV zurückgeben. Die HTML-Datei dient zum Lesen; die CSV ist die strukturierte Rückgabevorlage. Grundlage ist dieselbe offene Warteschlange nach Block 128 und derselbe festgehaltene Katalogstand wie im HTML-Export. Die exportierten Texte sind noch nicht nach dem aktuellen Qualitätsmaßstab überarbeitet. Der Lauf bleibt pausiert.

Für eine Auswahl aus dem [Gesamtkatalog](Gesamtkatalog-2026-10-13/README.md) dieselben Inhalts- und Identitätsregeln anwenden. Dort dienen bereits überarbeitete Fragen als Filmkontext. Nur die tatsächlich ausgewählten Fragen samt neuen Ergänzungen zurückgeben und die ausgewählten Ausgangs-IDs im Begleittext nennen; der gesamte Katalog muss nicht zurückgegeben werden. Alle ausgewählten Ausgangsfragen erhalten, auch wenn einzelne unverändert bleiben.

## Dateiformat

- UTF-8, Trennzeichen Komma, eine Kopfzeile und ein Datensatz pro Frage.
- Die 30 Spaltennamen und deren Reihenfolge aus der aktuellen Filmvorlage erhalten. Der Gesamtkatalog enthält mit seinen zusätzlichen Kontextspalten 53 Spalten; die Kontextspalten dürfen bei dessen Rückgabe unverändert mitgeliefert oder weggelassen werden. Bearbeitungs- und App-Status setzt Codex nach Prüfung. Keine Markdown-Codeblöcke, Kommentare, Zwischenüberschriften oder Zusatzzeilen in die CSV schreiben.
- Merksätze entfallen vollständig. Das frühere Zusatzfeld `memory_anchor` weglassen; enthält eine eingehende CSV es noch, wird es bei der Übernahme verworfen. Sein Inhalt oder Fehlen ist kein Qualitätskriterium. Alte Originalvorlagen und Archive bleiben unverändert.
- Alle Felder in gerade doppelte Anführungszeichen setzen. Gerade doppelte Anführungszeichen innerhalb eines Feldes verdoppeln. Echte Umlaute und ß verwenden. Zeilenumbrüche innerhalb korrekt gequoteter Textfelder sind erlaubt; CRLF-Zeilenenden sind der bestehende Paketstandard.
- Alle 50 Ausgangsfragen vollständig zurückgeben, auch unverändert beibehaltene. Neue Fragen dürfen als zusätzliche Datensätze in derselben CSV stehen. Für die Rückgabe zählen Datensätze, nicht physische Textzeilen.
- `question_id`, `knowledge_id` und `variant_of` bei Überarbeitungen desselben Wissensziels exakt erhalten. Nur bei neuen Fragen darf `question_id` leer bleiben; bei einem neuen Wissensziel bleibt auch `knowledge_id` leer. Die Antwortpositionen bestehender Fragen möglichst erhalten; bei Änderungen muss `correct_answer` weiterhin zur richtigen Option passen.

## Felder

| Spalten | Rückgaberegel |
|---|---|
| `question_id`, `knowledge_id`, `variant_of` | Bei bestehenden Fragen stabile Identitäten und Variantenbezug erhalten. Bei einer neuen eigenständigen Frage alle drei Felder leer lassen; bei einer neuen Variante `question_id` leer lassen und die bestehende Ausgangsfrage in `variant_of` angeben. Ihre `knowledge_id` darf leer bleiben oder muss dem bestehenden Ziel entsprechen. Keine stillen Umbenennungen oder Änderung des abgefragten Sachverhalts unter einer alten Wissensziel-ID. |
| `language`, `domain`, `subdomain` | Vorhandene Zuordnung erhalten; Sprache `de`. |
| `film_title_de`, `film_title_original`, `film_year`, `franchise` | Filmidentität erhalten. `film_year` bezeichnet die erste Veröffentlichung einschließlich Premiere/Festival, nicht einen späteren deutschen Kinostart. |
| `difficulty` | Redaktionell passend `leicht`, `mittel` oder `schwer`. |
| `question_type` | Inhaltlicher Fragetyp, etwa `Handlung`, `Besetzung`, `Filmgestaltung`, `Filmjahr` oder `Regie`; kein technischer Interaktionstyp. |
| `topic_tags`, `badge_tags` | Vorhandene Zuordnungen erhalten, keine neuen Kategorien erfinden. Listen mit `|` trennen. |
| `learning_objective` | Präzise benennen, welcher Sachverhalt abgefragt wird. |
| `question` | Vollständiger endgültiger Fragetext. |
| `answer_a`, `answer_b`, `answer_c`, `answer_d` | Vier verschiedene, plausible Optionen; genau eine richtige Lösung. |
| `correct_answer` | Genau `A`, `B`, `C` oder `D`, passend zu den gelieferten Optionen. |
| `explanation_short` | Kurzantwort, die exakt die gestellte Frage beantwortet. |
| `explanation_context` | Individuelle endgültige Vertiefung gemäß Redaktionsregeln. |
| `feedback_a`, `feedback_b`, `feedback_c`, `feedback_d` | Nur belegbare Zusatzinformation mit eigenständigem Erkenntniswert; sonst leer. Keine Buchstaben-/Positionsverweise, da die App mischt. |
| `spoiler_level` | Passende Spoilerkennzeichnung; vorhandene Bezeichnungen bei unverändertem Umfang erhalten. |
| `source_urls` | Tatsächlich verwendete Quellen als vollständige URLs, mehrere mit `|` trennen. |
| `verification_status` | Vorhandener Quellenstatus ist keine neue Prüfung. Bei der Rückgabe nur `redaktionell_geprueft` setzen, wenn diese Prüfung tatsächlich durchgeführt wurde; sonst `Entwurf`. |

Die Vorlage übernimmt die bisherigen Anzeigetexte für Vertiefung und Antwortfeedback. Deshalb können diese Felder von den hinterlegten Rohtexten im aufklappbaren HTML-Datensatz abweichen. Leeres Feedback ist ein vollständiger gültiger Wert und soll nicht automatisch aufgefüllt werden.

Die CSV bezeichnet die Optionen über ihre Spalten A–D. Einige vorhandene Jahresfragen besitzen intern andere Antwort-IDs als der CSV-Parser erzeugt. Bei der gezielten Übernahme werden die Optionen daher den bestehenden Antwort-IDs zugeordnet; die Vorlage ist kein Auftrag, diese IDs neu zu vergeben.

## Ersatzfragen und Ergänzungen

Neue Fragen dürfen in derselben CSV als zusätzliche Zeilen ohne `question_id` stehen. Für ein neues eigenständiges Wissensziel auch `knowledge_id` und `variant_of` leer lassen. Alle übrigen fachlichen Felder einschließlich vier Antworten, Lösung, Erklärungen, Schwierigkeit und Quellen vollständig ausfüllen. Keine Nummern oder Platzhalter wie `NEU-1` erfinden. Codex prüft bei der Integration die neuen Ziele gegen den Gesamtbestand und vergibt anschließend eindeutige Frage- und Wissensziel-IDs.

Bei einer neuen Variante einer bestehenden Frage die vorhandene Ausgangs-ID in `variant_of` angeben. Sie erhält eine neue Frage-ID, teilt jedoch die bestehende Wissensziel-ID. Soll eine Variante auf eine ebenfalls neue, noch unnummerierte Frage verweisen, diesen Zusammenhang im Begleittext eindeutig anhand von Film und vollständigem Fragetext benennen; die endgültigen Bezüge werden bei der Integration vergeben.

Wenn ein Wissensziel grundsätzlich ersetzt werden soll, die alte Zeile nicht still mit einem anderen Sachverhalt überschreiben. Die Ausgangszeile erhalten, den Ersatz als neue Zeile ohne ID ergänzen und im Begleittext die zu ersetzende `question_id` mit dem vollständigen neuen Fragetext zuordnen. Ergänzungen und Ersatzfragen müssen so unterscheidbar sein. Unveränderte Rohquellen bleiben erhalten.

## Übernahme

Die zurückgegebene CSV ist eine redaktionelle Übergabe, kein automatischer Bestandsupdate-Import. Der normale App-Parser überspringt vorhandene Frage-IDs und lehnt Zeilen ohne Frage-ID ab. Codex prüft deshalb zunächst Struktur, Vollständigkeit der Ausgangsfragen, Identitäten, Lösungen, Varianten und Quellen sowie die redaktionelle Gesamtkomposition. Neue Fragen werden vor dem Parserlauf mit endgültigen IDs versehen; fehlende IDs einer Ausgangsfrage gelten nicht als neue Frage. Anschließend können die freigegebenen Fassungen gezielt in die bestehende Redaktion und bei entsprechendem Auftrag in die Anwendung übernommen werden. Die Formatvorlage selbst ändert keine App-Inhalte, Spielstände oder Bearbeitungszähler. Veröffentlichung und produktive Aktivierung benötigen weiterhin die Freigabe des konkreten aktuellen Stands.

Führend bleiben [Importformat](../Importformat.md) und [Redaktionsvertrag](../Fragenredaktion.md).

Bei Personen- und Preisfragen zusätzlich die jeweiligen Bereichsverträge verwenden. Ihre zusätzlichen Identitäts-, Sichtbarkeits-, Bild- und Filmbezugsfelder aus dem Katalog erhalten; das Filmformat allein beschreibt diese Bereiche nicht vollständig.

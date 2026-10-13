# Rückgabe bearbeiteter Filmfragen

Für die externe Überarbeitung der nächsten 50 Fragen die Datei `Naechste-50-Fragen-Bearbeitung.csv` bearbeiten und als CSV zurückgeben. Die HTML-Datei dient zum Lesen; die CSV ist die strukturierte Rückgabevorlage. Grundlage ist dieselbe offene Warteschlange nach Block 128 und derselbe festgehaltene Katalogstand wie im HTML-Export. Die exportierten Texte sind noch nicht nach dem aktuellen Qualitätsmaßstab überarbeitet. Der Lauf bleibt pausiert.

## Dateiformat

- UTF-8, Trennzeichen Komma, eine Kopfzeile und ein Datensatz pro Frage.
- Die 31 Spaltennamen und deren Reihenfolge aus der Vorlage erhalten. Keine Markdown-Codeblöcke, Kommentare, Zwischenüberschriften oder Zusatzzeilen in die CSV schreiben.
- Alle Felder in gerade doppelte Anführungszeichen setzen. Gerade doppelte Anführungszeichen innerhalb eines Feldes verdoppeln. Echte Umlaute und ß verwenden. Zeilenumbrüche innerhalb korrekt gequoteter Textfelder sind erlaubt; CRLF-Zeilenenden sind der bestehende Paketstandard.
- Alle 50 Fragen vollständig zurückgeben, auch unverändert beibehaltene. Für die Rückgabe zählen Datensätze, nicht physische Textzeilen.
- `question_id`, `knowledge_id` und `variant_of` bei Überarbeitungen desselben Wissensziels exakt erhalten. Die Antwortpositionen möglichst erhalten; bei Änderungen muss `correct_answer` weiterhin zur richtigen Option passen.

## Felder

| Spalten | Rückgaberegel |
|---|---|
| `question_id`, `knowledge_id`, `variant_of` | Stabile Identitäten und vorhandener Variantenbezug. Keine stillen Umbenennungen oder Änderung des abgefragten Sachverhalts unter einer alten Wissensziel-ID. |
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
| `memory_anchor` | Bestehender Merksatz; kann sinnvoll überarbeitet werden. Er wird laut aktuellem Importvertrag lokal nicht mehr angezeigt. |
| `spoiler_level` | Passende Spoilerkennzeichnung; vorhandene Bezeichnungen bei unverändertem Umfang erhalten. |
| `source_urls` | Tatsächlich verwendete Quellen als vollständige URLs, mehrere mit `|` trennen. |
| `verification_status` | Vorhandener Quellenstatus ist keine neue Prüfung. Bei der Rückgabe nur `redaktionell_geprueft` setzen, wenn diese Prüfung tatsächlich durchgeführt wurde; sonst `Entwurf`. |

Die Vorlage übernimmt die bisherigen Anzeigetexte für Vertiefung, Merksatz und Antwortfeedback. Deshalb können diese Felder von den hinterlegten Rohtexten im aufklappbaren HTML-Datensatz abweichen. Leeres Feedback ist ein vollständiger gültiger Wert und soll nicht automatisch aufgefüllt werden.

Die CSV bezeichnet die Optionen über ihre Spalten A–D. Einige vorhandene Jahresfragen besitzen intern andere Antwort-IDs als der CSV-Parser erzeugt. Bei der gezielten Übernahme werden die Optionen daher den bestehenden Antwort-IDs zugeordnet; die Vorlage ist kein Auftrag, diese IDs neu zu vergeben.

## Ersatzfragen und Ergänzungen

Wenn ein Wissensziel grundsätzlich ersetzt werden soll, die alte Zeile nicht still mit einem anderen Sachverhalt überschreiben. Den Ersatz separat mit Bezug auf die ursprüngliche `question_id` liefern. Für zusätzliche Ziele ebenfalls eine getrennte Datei oder eindeutig bezeichnete Liste verwenden. Frage-, Wissensziel- und Variantenidentitäten werden vor der Übernahme ausdrücklich zugeordnet; Varianten desselben Ziels teilen ihre Lernidentität. Unveränderte Rohquellen bleiben erhalten.

## Übernahme

Die zurückgegebene CSV ist eine redaktionelle Übergabe, kein automatischer Bestandsupdate-Import. Der normale App-Parser überspringt vorhandene Frage-IDs. Codex prüft deshalb zunächst Struktur, Identitäten, Lösungen, Varianten und Quellen sowie die redaktionelle Gesamtkomposition. Anschließend können die freigegebenen Fassungen gezielt in die bestehende Redaktion und bei entsprechendem Auftrag in die Anwendung übernommen werden. Die Formatvorlage selbst ändert keine App-Inhalte, Spielstände oder Bearbeitungszähler. Veröffentlichung und produktive Aktivierung benötigen weiterhin die Freigabe des konkreten aktuellen Stands.

Führend bleiben [Importformat](../Importformat.md) und [Redaktionsvertrag](../Fragenredaktion.md).

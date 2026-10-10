# Genre und Symbole der Antwortbereiche

Nutzerauftrag vom 10.10.2026: [unveränderte Rohquelle](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Genre%20und%20Antwortsymbole.txt).

Über der Frage ersetzt das vorhandene Themenbild die bisherige Genre-Textplakette. Filmfragen verwenden ihr Genre, Personenfragen das Schauspielerbild und Preisfragen das Preisträgerbild. Der Name bleibt als zugängliche Bildbezeichnung und Tooltip erhalten. Die vorhandene Genre-Option blendet weiterhin die gesamte Anzeige aus; Schwierigkeit und Neu/Wiederholung bleiben unabhängig.

Die Antwortbereiche erhalten sechs eigene plastische Illustrationen in Gold, Creme und Petrol. Sie ersetzen dort den generischen Stern, einschließlich der Unterbereiche Regie und Bildnachweis. Zusammenfassungen bleiben native `summary`-Elemente mit ihrem bisherigen Text, Fokus, Tastaturbedienung und Pfeil; die Bilder sind dekorativ. 40 Pixel große Motive stehen auf mindestens 62 Pixel hohen Laschen. Vier Lernstufen bleiben zunächst geschlossen.

| Datei unter `public/disclosures/` | Motiv | Bereich |
| --- | --- | --- |
| `history.png` | Uhr und Rückpfeil | Fragenstatistik |
| `answers.png` | Antwortkarte und Haken | Alle Antworten |
| `context.png` | Lupe und Buch | Hintergrundwissen |
| `film.png` | Filmklappe | Filmdaten, Regie |
| `sources.png` | Dokumente und Kettenglied | Quellen, Bildnachweis |
| `learning.png` | Vier Stufen und Zielfahne | Lernfortschritt |

## Bildherkunft und Prompts

Sechs getrennte Aufrufe des eingebauten Imagegen-Werkzeugs, jeweils mit transparentem Hintergrund. `public/genres/scifi.png` diente ausschließlich als Stilreferenz. Originale bleiben am Erzeugungsort erhalten; optimierte finale PNG-Dateien mit 160 × 160 Pixeln und Alpha liegen im Projekt. Keine neue Abhängigkeit.

Gemeinsamer Prompt (jeweils mit einem der folgenden Motive eingesetzt):

> Use case: stylized-concept. Asset type: one compact illustrated UI icon for a film quiz. Primary request: SUBJECT. Input image is STYLE REFERENCE ONLY: match its high-quality dimensional illustration, creamy ivory enamel, deep petrol teal, polished warm gold metal, tasteful realistic highlights and soft sculptural shading. New subject, not a rocket. One single centered isolated object composition, bold recognizable silhouette readable at 40 pixels, square canvas, fill about 85% of canvas with comfortable margins. Slight three-quarter perspective. Genuinely transparent background. No lettering, numbers, stars, badges, frame, scenery, watermark, or extra symbols. Production-quality cohesive game interface artwork.

Motivtexte für `SUBJECT`:

- history: a small antique clock with a round teal face and an elegant gold circular return arrow, representing personal answer history
- answers: an ivory answer card with three bold teal horizontal answer bars and one large gold-framed teal check mark, representing answer choices
- context: a beautiful thick gold magnifying glass with teal glass over a small open ivory book, representing deeper background knowledge
- film: a cinema clapperboard with ivory and teal diagonal stripes, gold hinges and rim, representing film details
- sources: two overlapping ivory source documents with gold edges and a prominent polished teal chain link in front, representing linked sources
- learning: four ascending ivory and teal steps edged in polished gold, a small elegant gold flag at the highest step, representing learning progress through four stages

Aktuelle Prüfungen und Veröffentlichung: [Prüfbericht](Pruefbericht.md), [Sites-Betrieb](Sites-Betrieb.md). Lernlogik und Spielstände werden durch diesen Darstellungsauftrag nicht geändert.

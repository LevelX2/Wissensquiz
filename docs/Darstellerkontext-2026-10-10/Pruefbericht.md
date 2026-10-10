# Darstellernamen im Fragenbestand

Stand: 10.10.2026. Seit Sites-Version 62 um 11:02:31 Uhr Europe/Berlin veröffentlicht; Online- und Duellkatalog abgeglichen. [Veröffentlichungsnachweis](../Veroeffentlichung-2026-10-10-Version-62.json).

Auf den [Nutzerauftrag](../../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Darstellernamen%20im%20Fragenbestand.txt) hin den gesamten öffentlichen Fragenbestand gezielt auf fehlenden Darstellerkontext durchgesehen. Der Ausgangshinweis zur [Brazil-Frage](../Fragenkorrekturen.md#brazil-1985--10102026) war bereits separat umgesetzt.

## Ergebnis und Umfang

| Bestandteil | Anzahl |
|---|---:|
| Fragen im geprüften Katalog | 12.773 |
| Fragen aus 33 CSV-Paketen | 11.936 |
| Zusätzlich generierte Jahres-/Regiefragen | 837 |
| Fragen mit ergänzten Namen | 2.612 |
| Filmfassungen mit Ergänzungen | 845 |
| Bearbeitete öffentliche CSV-Dateien | 27 |
| Ergänzte Darstellerangaben | 3.345 |

Geändert wurde ausschließlich das Feld `question`. Frage- und Wissensziel-IDs, Varianten, Schwierigkeiten, Antworten, Lösungen, Erklärungen, Vertiefungen und übrige Metadaten bleiben erhalten. Es entstehen keine neuen Fragen, Ziele oder Varianten. Neue Frageversionen ergeben sich regulär aus den geänderten Texten; die 412 betroffenen Einträge der bestehenden 720-Fragen-Darstellerprüfung wurden auf diese Fassungen abgeglichen, ohne deren Rollen- und Zusatztexte zu ändern. Die 393 dazugehörigen Anzeigeeinträge in `src/castEditorial.json` verwenden dieselben aktualisierten Versions- und Inhaltsschlüssel, damit vorhandene Erläuterungen nach der Textkorrektur weiter angezeigt werden.

Die [Lesefassung](Fragenlesefassung.md) enthält jede geänderte Frage. [Durchsicht.json](Durchsicht.json) weist für jede CSV-Frage die Entscheidung aus; die zusätzlichen 837 Generatorfragen fragen Jahr oder Regie ab und benötigen keinen Darstellerzusatz. Die bestehende [chronologische Redaktionskette](../Bestandsredaktion-2026-10-04/Index.json) enthält vollständige Vorher-/Nachher-Zeilen und die herangezogenen Zuordnungen im [neuen Nachtrag](../Bestandsredaktion-2026-10-04/Nachtrag-2026-10-10-Darstellerkontext.json). Original-CSV bleiben unverändert.

## Redaktionelle Entscheidungen

Namen stehen unmittelbar bei der betreffenden Figur; vollständige vorhandene Figurennamen werden nicht durch eine Klammer getrennt. Bereits genannte Darsteller werden nicht nochmals eingefügt. Bis zu drei passende Zusätze pro Frage; die Kombination aus Frage und vier Antworten bleibt bei diesen Änderungen innerhalb von 60 Wörtern.

Alle 1.760 Personenfragen sind unverändert. Besetzungs-, Schauspieler- und Originalstimmenfragen sowie Fragen mit einem betreffenden Darstellernamen in den Antwortoptionen erhalten keinen verräterischen Zusatz. Jahres-, Regie- und reine Hintergrundfragen werden nicht pauschal mit Rollencredits angereichert. Filmtitel und Komposita werden nicht durch Klammern aufgetrennt.

Gemeinsame Familiennamen bezeichnen nicht automatisch eine einzelne Figur. So bleiben etwa die Atreides als Familie, die Lohses und die beiden Charlies ohne einzelne Schauspielerzuordnung. Mehrere Lebensalter, wechselnde Identitäten und Masken-/Puppenspiel wurden gesondert betrachtet. Uneindeutige Zuordnungen wurden ausgelassen, unter anderem in „Face/Off“, „Predestination“, „Dämonisch“ und „Der dunkle Kristall“. Keine zusätzliche Besetzungsbehauptung für den jungen Josh beim Wunschautomaten in „Big“, für Darth Vader oder für Michael Myers in „Halloween“ (1978).

Bei animierten Figuren und klaren Sprechrollen wird die **Originalstimme** ausdrücklich bezeichnet, etwa bei Pinocchio (1940), Aladdin (1992), Dobby, Aslan, Smaug und Fuchur. Realverfilmungen und deren Animationsvorlagen werden getrennt behandelt. Darstellerzusätze an allgemeinen Wörtern wie „Familie“, „Frau“ oder „Musiker“ wurden aus den Vorschlägen entfernt, wenn keine eindeutige einzelne Figur benannt ist.

## Belege und Grenzen

Figur/Darsteller-Zuordnungen aus vorhandenen redaktionellen Vertiefungen und der bestehenden Darstellerprüfung wiederverwendet und gegen erhaltene oder neu gelesene Besetzungsabschnitte abgeglichen. Bei 2.032 geänderten Fragen sind alle Ergänzungen durch solche Besetzungsabschnitte hinterlegt. Bei 580 Fragen wird für mindestens eine Ergänzung eine bereits vorhandene redaktionelle Zuordnung verwendet; dies ist im Nachtrag ausdrücklich bezeichnet. Die Quellen sind je Änderung verlinkt. Beispielsweise belegen die offiziellen Seiten zu [Oddjob](https://www.007.com/focus-week-oddjob/) und [Indiana Jones und der Tempel des Todes](https://amblin.com/movie/indiana-jones-and-the-temple-of-doom/) die betreffenden Credits.

Diese Abnahme betrifft Darstellerkontext, Formulierung, Lösungsschutz und unveränderte Lernidentitäten. Sie behauptet keine erneute vollständige Quellenprüfung aller unveränderten Handlungs-, Produktions- und Preisbehauptungen. Keine automatische Laufzeit-Ergänzung, Migration oder neue Behandlung älterer Spielstände. Keine privaten Spielstände oder Konten bearbeitet.

## Technische Abnahme

Alle bearbeiteten CSV erneut eingelesen und vollständig mit den geplanten Datensätzen verglichen: genau das Fragefeld geändert, alle übrigen Felder erhalten, unbearbeitete CSV-Zeilen bytegleich. Gegen den tatsächlichen Arbeitsstand unmittelbar vor der Änderung geprüft.

- `npm run check:questions` erfolgreich: 33 Pakete, 12.773 Fragen, 12.207 Ziele; 2.840 bestehende und neue redaktionell geänderte Zeilen lückenlos nachgewiesen. Keine doppelten Frage-IDs, Importablehnungen oder Importduplikate; validierter Spielstand und verlustfreier Katalog-Rundlauf. [Katalogprüfung](../Fragedaten-Pruefung.json).
- Vollständiger Testlauf mit einem Worker, 8 GiB Node-Heap und 60-Sekunden-Limits: 422 von 435 Tests in 71 Dateien bestanden. 13 Fehler betrafen die bisherige direkte Rohquellengleichheit, zwei durch eine vorübergehende Zeichenkodierung beschädigte Komödienprüfungen und zwei noch nicht angeglichene Darsteller-Anzeigeschlüssel. Ursachen behoben; alle 33 Tests der sieben betroffenen Prüfdateien anschließend erfolgreich, einschließlich der chronologischen Redaktionskette, 720 versionsgenauer Darstellerprüfungen und der drei unabhängig neu berechneten Katalogfingerabdrücke. Die Rohquellenprüfung verwendet weiterhin vollständige Zeilenvergleiche und akzeptiert ausschließlich dokumentierte Änderungen.
- Abschließendes `npm run build` einschließlich TypeScript und Katalogvorbereitung erfolgreich. Bestehende Paketgrößen- und Zod-Kommentarhinweise bleiben.
- `git diff --check` erfolgreich; [zusätzliche Inhalts- und Rückleseprüfung](Inhaltspruefung.json). Importberichte ausschließlich im isolierten temporären Testverzeichnis; vorgefundene fremde Berichte erhalten. Für reine Text- und redaktionelle Datenänderungen kein zusätzlicher Browserlauf.

Lokal auf `main` abgeschlossen. Keine Veröffentlichung, kein Push und keine Veränderung realer Konten oder Spielstände.

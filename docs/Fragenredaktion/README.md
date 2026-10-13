# Fragenredaktion

[Fragen.json](Fragen.json) enthält die jeweils letzte redaktionelle Fassung der bearbeiteten Fragen und Ergänzungen samt Quellen. `originalId` ordnet eine Fassung der bearbeiteten Katalog-ID zu; Ersatzfragen behalten ihre ausdrücklich vergebenen neuen Frage- und Wissensziel-IDs. Es werden keine alten Textfassungen, Vergleiche oder Einzelbewertungen gespeichert.

[Fortschritt.json](Fortschritt.json) führt geprüfte Original-IDs und die verbleibende filmweise Warteschlange. Aktueller abgeschlossener Stand: 6.550 von 12.773 Original-IDs geprüft; 6.223 offen. Block 128 ist abgeschlossen. Zusatzfragen zählen nicht als weitere geprüfte Original-IDs.

Die App enthält seit Version 65 die bis Block 17 übernommenen Fassungen: 999 Original-IDs, 41 Ersatzfragen, 14 Ergänzungen und 78 Jahres-/Regievorlagen. Spätere redaktionelle Fassungen sind noch nicht in die App übernommen. Die aktuellen erwarteten Daten dieser bereits angewandten Redaktion liegen für die bestehenden Tests in `tests/fixtures/appliedEditorial.json`.

Auf Nutzerwunsch werden keine Umstellungsprotokolle erstellt oder gespeichert. Die Fragen werden weiterhin nach dem [Redaktionsvertrag](../Fragenredaktion.md) geprüft; Zahlenstatus und lokaler Commit folgen nach jeweils 50 neu bearbeiteten Original-IDs.

Für die externe Bearbeitung der nächsten 50 offenen Fragen stehen der [bisherige Lesestand](Naechste-50-Fragen-Stand-2026-10-13.html), die [CSV-Vorlage](Naechste-50-Fragen-Bearbeitung.csv) und die [Rückgabeanleitung](Rueckgabeformat.md) bereit. Der Export zählt keine Fragen als überarbeitet und setzt den pausierten Lauf nicht fort.

Der [Gesamtkatalog vom 13.10.2026](Gesamtkatalog-2026-10-13/README.md) verbindet den lokalen App-Fragenbestand mit den aktuellen abgeschlossenen redaktionellen Fassungen. Er enthält 13.684 Fragen: 7.461 redigierte Fassungen einschließlich 911 Ergänzungen sowie 6.223 offene Fragen. Eine Gesamt-CSV und 14 Dateien nach Genre beziehungsweise Fragenbereich stehen bereit. Bearbeitungsstatus und Abgleich mit dem lokalen App-Katalog sind getrennt gekennzeichnet. Die extern zurückgegebenen 50 Vorschläge sind noch nicht integriert.

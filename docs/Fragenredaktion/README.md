# Fragenredaktion

[Fragen.json](Fragen.json) enthält die jeweils letzte redaktionelle Fassung der bearbeiteten Fragen und Ergänzungen samt Quellen. `originalId` ordnet eine Fassung der bearbeiteten Katalog-ID zu; Ersatzfragen behalten ihre ausdrücklich vergebenen neuen Frage- und Wissensziel-IDs. Es werden keine alten Textfassungen, Vergleiche oder Einzelbewertungen gespeichert.

[Fortschritt.json](Fortschritt.json) führt geprüfte Original-IDs und die verbleibende filmweise Warteschlange. Aktueller abgeschlossener Stand: 4.850 von 12.773 Original-IDs geprüft; 7.923 offen. Block 94 ist abgeschlossen. Zusatzfragen zählen nicht als weitere geprüfte Original-IDs.

Die App enthält seit Version 65 die bis Block 17 übernommenen Fassungen: 999 Original-IDs, 41 Ersatzfragen, 14 Ergänzungen und 78 Jahres-/Regievorlagen. Spätere redaktionelle Fassungen sind noch nicht in die App übernommen. Die aktuellen erwarteten Daten dieser bereits angewandten Redaktion liegen für die bestehenden Tests in `tests/fixtures/appliedEditorial.json`.

Auf Nutzerwunsch werden keine Umstellungsprotokolle erstellt oder gespeichert. Die Fragen werden weiterhin nach dem [Redaktionsvertrag](../Fragenredaktion.md) geprüft; Zahlenstatus und lokaler Commit folgen nach jeweils 50 neu bearbeiteten Original-IDs.

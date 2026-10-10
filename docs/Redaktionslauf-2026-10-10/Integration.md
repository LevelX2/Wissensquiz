# Integration der Fragenredaktion

Stand: 10.10.2026. Seit Sites-Version 65 öffentlich veröffentlicht, 10.10.2026 um 19:00:52 Uhr Europe/Berlin.

Der Nutzer hat den aktuellen Main-Stand einschließlich der überarbeiteten Fragen zur Veröffentlichung beauftragt. Grundlage sind die erste freigegebene Zehnerrunde, Runde 02 bis 04, der gesonderte Nightmare-Ersatz und die abgeschlossenen Blöcke 01 bis 17. Spätere Redaktionsblöcke gehören nicht zu diesem eingefrorenen Stand. Die ursprünglichen Redaktionsdateien und Roh-CSV bleiben unverändert.

Von 1.000 dokumentierten Original-IDs werden 999 übernommen. Die ungeprüfte Stativszene aus der ersten Zehnerrunde zu „Vier im roten Kreis“ bleibt ausgenommen; die bisherige Frage bleibt erhalten. Vollständige spätere Filmfassungen haben Vorrang vor früheren Einzelvorschlägen. Die vier gesonderten Gruppen-Nacharbeiten sind ebenfalls enthalten. Bei der zusätzlichen Aguirre-Frage wurde ausschließlich der doppelte Schlusspunkt berichtigt.

41 ausdrücklich beschlossene Ersatzfragen erhalten neue Frage- und Wissensziel-IDs; vorgesehene Varianten teilen ihre neue Wissensziel-ID. 14 zusätzliche Fragen ergänzen die Filmabdeckung. Unveränderte Lernziele behalten ihre Identität. Der Katalog umfasst weiterhin 33 Pakete, jetzt **12.787 Fragen und 12.222 Wissensziele**, davon 10.747 Filmfragen. Keine neuen Filme oder Personen hinzugefügt.

Die redigierten CSV-Zeilen werden in den ausgelieferten Paketen geändert und beim Import deterministisch neu versioniert. 78 Jahres-/Regievorlagen liegen in `src/reviewedFilmFacts.json`; der bestehende Filmfaktengenerator verwendet diese vollständigen aktuellen Texte und erhält seine Jahresantwort-Identitäten. Die abgeschlossenen Fassungen erscheinen dadurch tatsächlich in der App. Vorhandene Schutzprüfungen verhindern, dass ältere Anzeigeergänzungen die neuen Vertiefungen verdrängen.

Bei `KOM-M-010-V1` schreibt Block 17 die inhaltliche Überarbeitung ausdrücklich erst für Block 18 vor. Frage, Antworten und altes Lernziel bleiben erhalten. Nur der nicht mehr gültige Variantenbezug auf die ersetzte Grundfrage wird gelöst; die neue Rettungsfrage wird dieser Variante nicht unter der alten Identität untergeschoben. Die Filmfakten-Referenz für Nightmare verweist auf die neue Rod-Frage.

Sechs feste Lernreise-Verweise werden an ersetzte oder anders eingestufte Ziele angepasst. Gruppengrößen, Schwierigkeiten und Freischaltschwellen bleiben gleich. Drei neue Ersatzziele werden unmittelbar referenziert; zwei neue leichte Filmfragen ersetzen inzwischen mittlere Ziele desselben Films. Für das jetzt mittlere Stirb-langsam-Jahr übernimmt ein bestehendes leichtes Top-Gun-Inhaltsziel derselben Filmgruppe den festen Platz. Bereits erworbene Freigaben erhält weiterhin der vorhandene Mechanismus.

Bestehende Rundensnapshots und private Spielstände werden nicht umgeschrieben. Die Veröffentlichung nutzt die vorhandenen unveränderlichen Onlinekataloge; es gibt keine neue Datenbankmigration oder historische Anpassungsschicht. Der Duellkatalog bekommt die aktuellen Inhalte und deaktiviert ersetzte Auswahl-IDs. Bereits begonnene Duelle behalten ihre eingefrorenen Fragen.

Der [strukturierte Integrationsnachweis](Integration.json) enthält vollständige Vorher-/Nachher-Zeilen, Ergänzungen, Ersatzidentitäten, Vorlagen, Lernreise-Verweise und SHA-256-Werte aller verwendeten Redaktionsquellen. Die Abnahme prüft den tatsächlichen App-Parser, sämtliche Varianten und die wirksamen Vertiefungen. Historische Quellprüfungen werden gegen ihren dokumentierten damaligen Stand geführt; aktuelle Pakete müssen lückenlos zur neuen Redaktion passen. Eine neue vollständige Filmsichtung oder Faktenrecherche des übrigen Katalogs wird damit nicht behauptet.

Abnahme: 470/470 Tests in 76 Dateien, zwölf gezielte Browserfälle, TypeScript/Versionsbuild 65 und separate Fragenorganisation erfolgreich. 3.504 dokumentierte CSV-Abweichungen geprüft; null doppelte IDs oder Importkonflikte, verlustfreier Katalog-Rundlauf. Keine vollständige neue Browser-Suite oder physische Geräteabnahme.

Online-, Ranglisten- und Duellkatalog vollständig gegen den Veröffentlichungsbuild geprüft. Eine ältere abweichende Duellvertiefung zu ACT-L-028 dabei angeglichen. [Veröffentlichungs- und Live-Nachweis](../Veroeffentlichung-2026-10-10-Version-65.json).

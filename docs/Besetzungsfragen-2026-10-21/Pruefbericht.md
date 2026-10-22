# Besetzungsfragen mit erkennbarem Figurenkontext

Redaktion: 21.10.2026. Seit 23.10.2026 als Version 84 öffentlich veröffentlicht. [Veröffentlichungsnachweis](../Veroeffentlichung-2026-10-23-Version-84.json).

Auf [Nutzerauftrag](../../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-21%20Nutzerauftrag%20Besetzungsfragen.txt) gezielt die Kombination aus wenig aussagekräftigem Rollennamen, leichter Einstufung und mehreren Mitspielern unter den Antworten durchgesehen. Der Figurenkontext hat Vorrang. Eine höhere Schwierigkeit oder andere Antwortalternativen sind nachrangige Möglichkeiten, wenn ein kurzer, hilfreicher Hinweis nicht genügt.

Die Suche über die 39 aktiven CSV-Pakete mit 14.470 Zeilen lieferte 687 textuelle Besetzungstreffer. Davon wurden 183 kurze Rollenabfragen, darunter 144 leichte Fragen, redaktionell gelesen. Weitere 14 kurze Formulierungen und Varianten kamen beim Bestandsabgleich hinzu. Der vollständige App-Katalog enthält zusätzlich generierte Jahres-/Regiefragen und zählt weiterhin 15.295 Fragen und 14.628 Wissensziele.

Von **197 geprüften Kompositionen** wurden **158 Fragetexte in zwölf Paketen** verbessert: **132 leicht, 20 mittel, sechs schwer**. **39 Fragen** bleiben erhalten, weil eine erkennbare Rollenfunktion oder eine etablierte Titel-/Kulturfigur bereits einen brauchbaren Zugang bietet. Alle geprüften aktuellen Fragen mit ihren vier Antworten, Lösungen, Stufen und Quellen stehen in [Pruefung.json](Pruefung.json).

Alle Frage- und Wissensziel-IDs, Variantenbezüge, vier Antworten, Lösungsschlüssel und Schwierigkeiten bleiben erhalten. Bei diesen Fällen war ein konkreter Figurenhinweis möglich; deshalb waren weder ein pauschales Höherstufen noch das Austauschen aller Mitspieler erforderlich. Die gesamte Komposition wurde auf Eindeutigkeit und versehentliche Lösungshinweise gelesen. Ein Hinweis darf die Figur erkennen lassen, verrät aber nicht ihren Darsteller.

Passende individuelle Formulierungen aus der vorhandenen Redaktion wurden gezielt wiederverwendet. Weitere Hinweise stammen aus vorhandenen Filmkontexten und gezielt gegengeprüften Handlungs-/Besetzungsabschnitten der verlinkten Quellen. Vorhandene Quellenbezüge bleiben erhalten, neue Belege sind ergänzt. Beim „Paterson“-Abruf enthielt ein Wikipedia-Abschnitt die abweichende Berufsbezeichnung „busser“. Der [Verleih Bleecker Street](https://bleeckerstreetmedia.com/editorial/people-of-paterson) bestätigt ausdrücklich Adam Driver als Busfahrer und Dichter und ist als Primärbeleg ergänzt. Die Gino-Frage aus „Guest House Paradiso“ beschreibt den gewalttätigen Verlobten der Schauspielerin Gina; sie verwechselt ihn nicht mit dem Filmstar.

Die App-CSV und die jeweils letzte Fragefassung in `Fragenredaktion/Fragen.json` enthalten die Hinweise. Das bestehende Integrationsmanifest erhält den aktuellen erwarteten Endstand; kein zusätzlicher Vorher-/Nachher-Verlauf. Die frühere vollständige Redaktionswarteschlange bleibt abgeschlossen und pausiert. Die 158 gezielten Fragekorrekturen bedeuten keine erneute vollständige Redaktion der betroffenen Filmblöcke oder Übernahme aller sonstigen älteren Entwürfe.

## Abnahme und Grenzen

- CSV-Ausgaben erneut eingelesen und vollständig mit den beabsichtigten Datensätzen verglichen.
- Tatsächlicher App-Parser und vorbereitete Anzeige aller 197 geprüften Kompositionen erfolgreich abgeglichen: Fragetexte, hervorgehobene Filmtitel, Antworttexte und Lösungsschlüssel stimmen überein; kein gesuchter Darstellername im Fragetext. 158 Änderungen zu 133 Filmen; nur `question` und bei Quellenpflege `source_urls` geändert. Frage und vier Optionen umfassen höchstens 36 Wörter.
- **Neun bestehende Tests in zwei Dateien erfolgreich:** `npx vitest run tests/editorial-revision.test.ts tests/reviewed-questions.test.ts`. Vollständige Rohquellenkette, dokumentierte aktuelle Zeilen, unveränderte übrige Datensätze und tatsächlicher App-Import geprüft.
- `git diff --check` erfolgreich.

Die Mustersuche ist ein Kandidatenfilter und kein vollständiger semantischer Qualitätsnachweis sämtlicher Besetzungsfragen. Keine erneute Filmsichtung oder Vollprüfung aller verlinkten Texte. Die Stufen sind redaktionell eingeschätzt, nicht empirisch gemessen. Da alle Stufen und Wissensziele erhalten bleiben, entstehen durch diesen Block keine neuen Stufenlücken oder Ziel-Dubletten. Rohquellen und historische Exporte bleiben unverändert. Keine Veröffentlichung, kein Push und keine Änderung privater Spielstände; kein vollständiger Veröffentlichungsprüflauf für diesen lokalen Inhaltsblock.

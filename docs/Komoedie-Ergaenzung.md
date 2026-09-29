# Komödie-Ergänzung – 29.09.2026

Die gelieferten Dateien ergänzen 50 bisher nicht vorhandene Filmfassungen. Die CSV enthält 360 Fragen: 300 unabhängige Wissensziele und 60 Varianten, je 120 Zeilen pro Schwierigkeit. Die korrekten Antwortbuchstaben sind insgesamt gleich verteilt (je 90). Alle 31 Spalten, Variantenbezüge und 50 Filmdatenreferenzen wurden mit dem App-Parser geprüft: keine Ausschlüsse, Warnungen oder ID-Konflikte.

## Einbindung und Inhalt

- Roh-CSV und Roh-JSON unverändert unter `KI-Wissen-Wissensquiz/01 Rohquellen/`; öffentliche CSV bytegleich unter `public/komoedie-ergaenzung-fragen.csv`.
- Automatische transaktionale Paketergänzung, im Offline-Paket enthalten. Keine Änderung an Supabase oder am Datenbankschema.
- Filmdaten `FF-376` bis `FF-425`: Originaltitel, Jahr, Regie, Produktionsländer, Quellen, Abgrenzungen und gegebenenfalls Reihenangaben übernommen. Je eine Jahres- und Regiefrage ergänzt, insgesamt 100 weitere Ziele.
- 50 Bekanntheitszuordnungen aus der Quelle: fünf Film-Ikonen, 32 bekannte Filme, zwölf Kennerfilme, eine Entdeckung. Gesamtverteilung über 425 Filme: 77/184/124/40.
- 15 neue Classics-Filme und ein Arthouse-Film als zusätzliche Ansichten, ohne Fragekopien oder getrennte Lernstände.
- Alle 50 Regie-Hintergründe übernommen: bei neuen Regiefragen als Vertiefung und nach jeder Antwort auf den jeweiligen Film unter **Filmdaten → Über die Regie**. Beide Klappen zunächst geschlossen; vor der Antwort keine Anzeige.

Aktueller Gesamtbestand: **3.717 Fragen, 3.237 Wissensziele, 425 Filme, 378 Film-/Reihenthemen**. Darin 14 unveränderte CSV-Pakete mit 2.880 Fragen/2.400 Zielen/480 Varianten sowie 837 Jahres-/Regieziele. Komödie: **725 Fragen, 632 Ziele, 79 Filme**. Classics: 929 Fragen/799 Ziele/101 Filme; Arthouse: 461/405/52. Überlappende Kategorien nicht addieren.

## Abgrenzungen und Fortschritt

„Clerks“ gehört laut Quelle zum gemeinsamen „View Askewniverse“, jedoch ohne eindeutige Teilnummer; Filmdaten nennen das Universum und den Hinweis ohne erfundene Reihenposition. „Der General“ verwendet die Erstveröffentlichung 1926, „Der rosarote Panther“ die erste Aufführung 1963 und „Nichts zu verzollen“ die Premiere 2010. Bei „Guest House Paradiso“ gilt der britische Kinostart 1999. Die gelieferten Hinweise unterscheiden außerdem die gekürzte deutsche Synchronfassung von „Louis, der Geizkragen“, die Regie von „Monty Pythons wunderbare Welt der Schwerkraft“ und den Regiecredit von „Dumm und Dümmer“.

Alle bisherigen Frage- und Wissensziel-IDs, Texte, Versionen und Antwortvorlagen bleiben unverändert. Ein vollständiger Inhalts-Hash über die bisherigen 3.257 Fragen bestätigt dies. Regiealternativen verwenden je Paket einen festen Pool: die neuen Fragen pinnen 425 Filme; ältere Vorlagen behalten ihre damaligen Pools. Historische Rundensnapshots, Antwortereignisse, Wiederholungsplanung und Einstellungen werden nicht ersetzt. Die bestehenden festen Filmreise-Ziele werden nicht vergrößert; erreichte Freischaltungen bleiben bestehen. Neue Fragen sind entsprechend ihrer Genre-, Schwierigkeits- und Bekanntheitszuordnung spielbar.

## Prüfung und Herkunft

Rohhashes, vollständiger Import, Varianten, Lösungen und Feedback, Filmdatenreferenzen, Bekanntheit und Kategorien automatisiert geprüft. Der Upgrade-Test bewahrt aktive Runden, Lernereignisse, Einstellungen und erworbene Stufen; erneutes Nachladen erzeugt keine Doppelungen. Isolierter mobiler Browserfall prüft die neue Filmfrage samt Regie-Hintergrund, Offline-Neuladen und Fortsetzen. Keine echten Nutzerdaten für Tests verwendet.

Die Filmaussagen und redaktionellen Einstufungen stammen aus den gelieferten Dateien. Die Prüfung bestätigt Struktur und Konsistenz, keine unabhängige Vollprüfung aller Filme und verlinkten Quellen. Neue generierte Fragen kennzeichnen dies als „Redaktionelle Quelle 2026-09-29“.

SHA-256:

- CSV: `3e267acea78956d1179207a644a31be5d6151cb230dc1272206177b5cf12a96d`
- JSON: `37a63023fa4dca4e81134f3ec3631332a4ad7d94ba526f484e045348c3f7c9d9`

Nachweise: [Importbericht](importbericht-komoedie-ergaenzung.json), [Filmwissen-Bericht](film-facts-bericht.json), [Prüfbericht](Pruefbericht.md). Der datierte Bestands-Snapshot vom 27.09.2026 bleibt historisch; Abenteuer und Thriller bleiben die nächsten Mengenprioritäten.

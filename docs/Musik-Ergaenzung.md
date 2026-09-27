# Musik-Ergänzung – 27.09.2026

Die gelieferten Dateien ergänzen das bisher nur mit einem Film besetzte Musikgenre um 25 Filmfassungen. Die CSV enthält 180 Fragen: 150 unabhängige Wissensziele und 30 Varianten, je 60 Zeilen pro Schwierigkeit. Die richtige Antwort liegt je Schwierigkeit jeweils 15-mal auf A/B/C/D. Alle 31 Spalten, Pflichtangaben, Variantenbezüge, Filmdatenreferenzen und kuratierten Kategorien stimmen überein. Der App-Parser akzeptiert alle Zeilen ohne Warnungen, Ausschlüsse oder ID-Konflikte. Keine Filmüberschneidung mit den bisherigen 300 Fassungen.

## Einbindung

- Roh-CSV und Roh-JSON unverändert unter `KI-Wissen-Wissensquiz/01 Rohquellen/`; öffentliche CSV bytegleich unter `public/musik-fragen.csv`.
- Automatische transaktionale Paketergänzung und Offline-Cache über den bestehenden Paketmechanismus. Kein Datenbankschema geändert.
- 25 referenzgeprüfte Filmdatensätze in `src/filmFacts.json`: Originaltitel, Jahr, Regie, Produktionsländer/-regionen, vier Reihenpositionen und mitgelieferte Abgrenzungen. IDs `FF-301` bis `FF-325`; jeweils eine Jahres- und Regiefrage, insgesamt 50 zusätzliche Ziele.
- Gemeinschaftsregie von West Side Story und Inside Llewyn Davis als vollständige Teams. Dexter Fletcher wird bei Bohemian Rhapsody nicht als falsche Alternative angeboten; die gelieferte Erklärung unterscheidet offiziellen Credit und Fertigstellung.
- 25 neue Bekanntheitszuordnungen: 5 Film-Ikonen, 12 bekannte Filme, 5 Kennerfilme, 3 Entdeckungen. Zusammen mit Singin’ in the Rain umfasst Musik jetzt 26 Filme in der Verteilung 5/13/5/3.
- Classics/Arthouse als zusätzliche Tags aus der Quelle, keine neuen Fragekopien. Die acht zusätzlichen Classics-Filme umfassen auch neuere redaktionell ausgewählte Klassiker wie Dirty Dancing; eine Altersgrenze wird nicht erfunden.

Aktueller Gesamtbestand: **2.797 Fragen, 2.437 Wissensziele, 325 Filme, 283 Film-/Reihenthemen**. Darin 2.160 gelieferte CSV-Zeilen aus zwölf Paketen (1.800 Ziele, 360 Varianten) und 637 ergänzende Jahres-/Regieziele. Musik: **238 Fragen, 208 Ziele, 26 Filme**. Classics: 631 Fragen/543 Ziele/69 Filme; Arthouse: 407/357/46. Überschneidende Kategorien nicht addieren.

## Fortschritt und Kompatibilität

Neue Spieler beginnen Musik mit leichten Fragen aus Gruppe 1. Neue feste Gruppenziele definieren die bisher nicht vorhandenen Gruppen 1, 3 und 4. Bestehende Schwierigkeitsgrenzen und die Zielmenge der bisherigen Gruppe 2 bleiben erhalten. Vor einer Katalogergänzung werden erreichte Freischaltungen und ein bisheriger Einstieg oberhalb von Gruppe 1 festgehalten. Dadurch behalten auch bestehende Musikspieler ohne bisherige richtige Antwort ihren zuvor verfügbaren Gruppe-2-Zugang.

Alte Frage-/Wissensziel-IDs, Antwortvorlagen und Frageversionen bleiben unverändert. Für generierte Regiealternativen ist die damalige Kataloggröße nun festgehalten: die ursprünglichen 300 Filme verwenden weiter ausschließlich diesen Pool, die neue Gruppe einen Pool von 325. So verändert eine Ergänzung nicht rückwirkend gespeicherte Regiefragen oder die Backup-Prüfung.

## Prüfung und Grenzen

Automatisierte Prüfungen kontrollieren Rohhashes, sämtliche Filmreferenzen, Varianten und Lösungen, Bekanntheits-/Kategoriezuordnung, Erhalt aller 2.567 bisherigen Fragen durch einen vollständigen Inhalts-Hash, idempotente Ergänzung, historische Freischaltungen, Lernereignisse, aktive Runden und Wiederherstellung. Gesonderte mobile Browserprüfung für Musik und Offline-Filmdaten.

Die Filmaussagen, Produktionsangaben und redaktionellen Bekanntheitseinstufungen stammen aus dem gelieferten Paket. Struktur und Konsistenz wurden geprüft; keine unabhängige Vollprüfung sämtlicher Handlungsaussagen oder verlinkter Filmquellen. Neue generierte Fragen kennzeichnen ihre Herkunft als „Redaktionelle Quelle 2026-09-27“, nicht als eigene Quellenprüfung.

SHA-256:

- CSV: `d8c47f7931d31ba0bf1108bf1b860e001170a44c7fa21449f514d03e1baab132`
- JSON: `6b5ab699adeb3e5bc90ddab1237409b106a6fbe536b25a6e936b055dbd9b5026`

Nachweise: [Importbericht](importbericht-musik.json), [Filmwissen-Bericht](film-facts-bericht.json), [Prüfbericht](Pruefbericht.md). Der vor dieser Ergänzung erstellte [Fragenbestand](Fragenbestand-2026-09-27.json) bleibt als datierter Stand mit 300 Filmen erhalten; die dortige Musik-Priorität ist durch diese Lieferung erfüllt. Nächste Mengenprioritäten sind Abenteuer und Thriller.

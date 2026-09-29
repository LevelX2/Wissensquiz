# Sci-Fi-Ergänzung – 29.09.2026

Die gelieferten Dateien ergänzen 50 bisher nicht vorhandene Filmfassungen. Die CSV enthält 360 Fragen: 300 unabhängige Wissensziele und 60 Varianten, je 120 Zeilen pro Schwierigkeit. Die korrekten Antwortbuchstaben sind insgesamt gleich verteilt (je 90). Alle 31 Spalten, Variantenbezüge und 50 Filmdatenreferenzen wurden mit dem tatsächlichen App-Parser geprüft: keine Ausschlüsse, Warnungen oder ID-Konflikte.

## Einbindung und Inhalt

- Roh-CSV und Roh-JSON unverändert unter `KI-Wissen-Wissensquiz/01 Rohquellen/`; öffentliche CSV bytegleich unter `public/scifi-ergaenzung-fragen.csv`.
- Automatische transaktionale Paketergänzung, im Offline-Paket enthalten. Keine Änderung an Supabase oder am Datenbankschema.
- Filmdaten `FF-326` bis `FF-375`: Originaltitel, Jahr, Regie, Produktionsländer, vorhandene Reihenpositionen, Quellen und Abgrenzungen übernommen. Je eine Jahres- und Regiefrage ergänzt, insgesamt 100 weitere Ziele.
- 50 Bekanntheitszuordnungen aus der Quelle: 3 Film-Ikonen, 26 bekannte Filme, 20 Kennerfilme, eine Entdeckung. Gesamtverteilung über 375 Filme: 72/152/112/39.
- 17 neue Classics-Filme und fünf Arthouse-Filme als zusätzliche Ansichten, ohne Fragekopien oder getrennte Lernstände.
- Alle 50 Regie-Hintergründe übernommen: bei neuen Regiefragen als Vertiefung und nach jeder Antwort auf den jeweiligen Film unter **Filmdaten → Über die Regie**. Beide Klappen zunächst geschlossen; vor der Antwort keine Anzeige.

Gesamtbestand nach dieser Ergänzung: **3.257 Fragen, 2.837 Wissensziele, 375 Filme, 328 Film-/Reihenthemen**. Darin 13 unveränderte CSV-Pakete mit 2.520 Fragen/2.100 Zielen/420 Varianten sowie 737 Jahres-/Regieziele. Sci-Fi: **768 Fragen, 672 Ziele, 103 Filme**. Classics: 793 Fragen/679 Ziele/86 Filme; Arthouse: 452/397/51. Überlappende Kategorien nicht addieren.

## Abgrenzungen und Fortschritt

Pitch Black verwendet entsprechend der Quelle 2000; Fortress die erste Festivalaufführung 1992; Under the Skin die Festivalpremiere 2013. Die Quelle grenzt Dark Star (1974) von der erweiterten Kinofassung 1975 ab. Diese Hinweise bleiben in den Filmdaten sichtbar. Bei Enemy Mine wird Richard Loncraine wegen seiner früheren verworfenen Produktionsphase nicht als falsche Regiealternative verwendet. A.I. unterscheidet Spielbergs Regie von Kubricks Vorarbeit; Transcendence unterscheidet Pfisters Regiedebüt von seinen Kameraarbeiten.

Alle bisherigen Frage- und Wissensziel-IDs, Texte, Versionen und Antwortvorlagen bleiben unverändert. Ein vollständiger Inhalts-Hash über die bisherigen 2.797 Fragen sichert dies zusätzlich ab. Regiealternativen nutzen je Paket einen festen Pool: 300, 325 oder jetzt 375 Filme. Historische Rundensnapshots, Antwortereignisse, Wiederholungsplanung und Einstellungen werden nicht ersetzt. Die bestehenden festen Filmreise-Ziele werden nicht vergrößert; erreichte Freischaltungen bleiben bestehen. Neue Fragen sind entsprechend ihrer vorhandenen Genre-, Schwierigkeits- und Bekanntheitszuordnung spielbar.

## Prüfung und Herkunft

Rohhashes, vollständiger Import, Varianten, Antworten/Feedback, Filmdatenreferenzen, Bekanntheit und Kategorien automatisiert geprüft. Der Upgrade-Test bewahrt aktive Runden, Lernereignisse und erworbene Stufen; erneutes Nachladen erzeugt keine Doppelungen. Isolierter mobiler Browserfall prüft die neue Filmfrage samt Regie-Hintergrund, Offline-Neuladen und Fortsetzen. Keine echten Nutzerdaten für Tests verwendet.

Die Filmaussagen und redaktionellen Einstufungen stammen aus den gelieferten Dateien. Die Prüfung bestätigt Struktur und Konsistenz, keine unabhängige Vollprüfung aller Filme und verlinkten Quellen. Neue generierte Fragen kennzeichnen dies als „Redaktionelle Quelle 2026-09-29“.

SHA-256:

- CSV: `c5af33b206ed17443fc1283e7dbf5e028f3514ddd4d95db056de0799c6726af8`
- JSON: `d033f824c77f44eed72485c38bd30b0c8908a19a629f65c7b2a12bc380f032af`

Nachweise: [Importbericht](importbericht-scifi-ergaenzung.json), [Filmwissen-Bericht](film-facts-bericht.json), [Prüfbericht](Pruefbericht.md). Die datierte Bestandsanalyse vom 27.09.2026 bleibt als historischer Snapshot erhalten; Abenteuer und Thriller bleiben die nächsten Mengenprioritäten.

# Preisträger – 200 Filmfragen

Am 02.10.2026 auf Nutzerauftrag redaktionell erstellt und lokal integriert. Neue Zusatzkategorie **Preisträger**, neben Classics und Arthouse, mit **je 50 Fragen für Leicht, Mittel, Schwer und Experte**. 200 neue Fragen und Wissensziele, keine Varianten. 100 Fragen im Oscar-Schwerpunkt, 50 zu Cannes und 50 zu Venedig; darunter Verbindungen zwischen den Veranstaltungen. Der Schwerpunkt umfasst historische Verleihungen von 1940 bis 2024, keine vollständige aktuelle Siegerchronik.

## Inhalt und Vertiefung

Fünf wiederkehrende Fragesysteme: 45 Gewinnerfilme, 55 Schauspielpreise, 54 Filmhandwerk, 43 Preisverbindungen und drei Festivalgeschichte. Neben Jahresgewinnern geht es um konkrete Darstellungen, Musik, Kamera, Schnitt, Kostüme, Schreiben, geteilte Preise, Ensembles, Juryvorsitz und ungewöhnliche Preisverläufe. Die Schwierigkeitszuordnung ist redaktionell, nicht empirisch gemessen. Fachcredits und weniger präsente Preisverbindungen liegen überwiegend auf Schwer und Experte.

Jede Frage enthält vier verschiedene Antworttexte, konkretes Feedback zu jeder Option, kurze Erklärung, Vertiefung mit 38–83 Wörtern, Merksatz und Quellen. Die Lösungsschlüssel A/B/C/D sind mit je 50 gleich verteilt; die App mischt die Bildschirmreihenfolge zusätzlich. Gemeinsam ausgezeichnete Autorenteams haben auch mehrteilige falsche Optionen. Darstellungen werden über Person und Film beschrieben; keine erfundenen Figurenangaben. Die Vertiefung erklärt Preiszusammenhänge und unterscheidet Hauptpreis, Einzelleistung und Wettbewerbsebene. Eigene Beobachtungsanregungen zum Wiedersehen sind von den belegten Preisangaben zu unterscheiden.

Oscarfragen nennen ausdrücklich das **Verleihungsjahr**. Die Filmdaten nennen dagegen das Jahr der **ersten Veröffentlichung**. Beispiel: Oscarabend 1940, „Vom Winde verweht“, Filmjahr 1939. Bei Fragen nach dem Gewinnerfilm steht die Lösung vor der Antwort nur unter den vier Optionen; Erklärung, Quellen, Lernziel und Filmdaten bleiben bis zur Antwort verborgen.

## Quellen und Filmdaten

Die Preiszuordnungen und konkreten Preisangaben der Vertiefungen wurden mit den offiziellen jährlichen Listen von [Academy](https://www.oscars.org/oscars/ceremonies/2024), [Festival de Cannes](https://www.festival-cannes.com/en/retrospective/2023/awards/) und [Biennale di Venezia](https://www.labiennale.org/en/news/official-awards-80th-venice-film-festival) abgeglichen. Juryfragen verwenden zusätzlich die offiziellen Juryübersichten. Jeder Datensatz verlinkt seine passende Jahresquelle; der [Quellennachweis](../KI-Wissen-Wissensquiz/01%20Rohquellen/Preistraeger_Quellennachweis.json) ordnet sie der stabilen Frage-ID zu. Er enthält Quellenreferenzen und geprüfte Zuordnungen, keinen vollständigen Archivabzug.

135 Filmfassungen sind betroffen, davon 111 neu im Bekanntheitskatalog. Alle haben nach der Antwort Originaltitel, erste Veröffentlichung, Regie und Produktionsländer/-regionen. Bestehende Zuordnungen der bisherigen 545 Filme bleiben erhalten. Neue Daten stammen aus den verlinkten Filmreferenzen, überwiegend Wikipedia; Regie, Länder und erste Veröffentlichung wurden in den Filmangaben abgeglichen. Keine vollständige Überprüfung sämtlicher Handlungsaussagen der älteren Fragenpakete. Bekanntheit ist eine redaktionelle Einschätzung für ein breites deutschsprachiges Kinopublikum, keine gemessene Quote.

[Filmdaten-Rohquelle](../KI-Wissen-Wissensquiz/01%20Rohquellen/Preistraeger_Filmdaten.json) mit 135 Einträgen. `src/awardFilmFacts.json` ergänzt 114 Datensätze rein lesend. Davon haben drei Filme bereits Daten aus dem zeitgleich eingepflegten Alle-Genres-Katalog; dort gilt weiterhin dessen bestehende Darstellung. Auflösung: älterer Filmkatalog → Alle-Genres-Daten → zusätzliche Preisträger-Daten. Identität über Originaltitel und Filmjahr. **Keine zusätzlichen Jahres- oder Regiefragen**; die Kategorie bleibt exakt 200 Fragen groß. Bei „Wife of a Spy“ wird die frühe Fernsehausstrahlung 2020 von der späteren Venedig-Kinofassung unterschieden; „Vom Winde verweht“ erläutert den offiziellen Regiecredit und zusätzliche ungenannte Dreharbeiten.

## Auswahl, Fortschritt und Sicherungen

Die bisherige App hatte drei Schwierigkeiten. Für die gewünschten viermal 50 wurde **Experte** ergänzt. Im Freien Spiel und in Rekordrunden frei wählbar; im Fehlertraining für offene Expertenfehler verfügbar. Die Filmreise behält ihre drei Stufen Leicht/Mittel/Schwer und festen Ziele. Expertenantworten erzeugen keinen vierten Filmreise-Gate. Eine sichere Expertenantwort bringt wie Schwer zusätzlich fünf Karriere-XP; die bestehenden Tagesgrenzen und Lernboni gelten weiter.

Preisträger lässt sich mit Genres und anderen Zusatzkategorien kombinieren. Mehrere Kategorien bilden eine Vereinigung; dieselbe Frage und dasselbe Wissensziel zählen innerhalb einer Runde einmal. Das Paket kennzeichnet gezielt Preisfragen, nicht sämtliche bestehenden Fragen zu ausgezeichneten Filmen. Historische Classics-/Arthouse-Zuordnungen werden dadurch nicht erweitert. JSON- und kompakte Kontosicherungen erhalten vier Schwierigkeiten, die dritte Kategorie und Expertenrunden.

Die neue CSV wird beim App-Start transaktional und idempotent ergänzt. Bisherige Fragen, IDs, Inhaltsversionen, Ereignisse, Runden, Einstellungen, Karriere- und Lernstände bleiben erhalten. Gesamtbestand lokal: **16 CSV-Pakete, 4.877 Fragen, 4.397 Wissensziele, 604 Film-/Reihenthemen und 656 eingeordnete Filme**; davon 837 schon zuvor generierte Filmfragen. Rohquelle und `public/preistraeger-fragen.csv` sind bytegleich und Bestandteil des Offline-Pakets.

[CSV-Rohquelle](../KI-Wissen-Wissensquiz/01%20Rohquellen/Preistraeger_200_Fragen.csv), [Importbericht](importbericht-preistraeger.json). Keine Veröffentlichung oder Main-Integration in diesem Auftrag.

## Prüfung

Struktur mit dem echten App-Parser geprüft: alle 200 akzeptiert, keine Ausschlüsse, Warnungen oder ID-Konflikte. Geprüft wurden außerdem Filmdaten für alle 135 Filmidentitäten, unveränderte Bestandsdaten, Kategorievereinigung, wiederholter Paketimport, Erhalt von Rundensnapshots/Freischaltungen, Experten-XP sowie JSON-/Kontosicherungsrücklauf. Browserprüfung deckt die mobile Kategorien-/Stufenauswahl, verborgene Filmdaten vor der Antwort, Erklärung nach der Antwort und Offline-Wiederaufnahme ab. Endgültiger Prüfnachweis und Grenzen: [Prüfbericht](Pruefbericht.md).

182 Logik-/Datenbanktests und alle 99 unterschiedlichen Browserfälle erfolgreich. Abschließender Produktions-Build des aktuellen Arbeitsstands erfolgreich. Parallel weiterbearbeitete fremde Änderungen bleiben erhalten.

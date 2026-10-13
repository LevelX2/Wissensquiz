# Ausbau der Schauspielergruppen

Begonnen am 13.10.2026 auf Nutzerauftrag. Ziel ist der schrittweise Ausbau der sinnvoll eingeteilten Bekanntheitsgruppen, zunächst besonders Gruppen 3 und 4. Der vollständige Ausgleich auf je 107 Personen umfasst 208 zusätzliche Personen. Maßgeblich bleiben [Fragenredaktion](../Fragenredaktion.md) und [Bekanntheitsgruppen](../Bekanntheitsgruppen/Plan.md).

Der erste Redaktionsblock ist abgeschlossen: acht neue Personen und 64 Fragen, jeweils zwei unabhängige Ziele auf leicht, mittel, schwer und experte. Vier Personen gehören zu Gruppe 3, vier zu Gruppe 4. Namen und IDs sind gegen den vorhandenen Personenbestand abgeglichen. [Vollständige Fragen mit Lösungen, Bildern und Quellen](Lesefassung.md), [native Einzelfassungen](Personen/), [CSV-Übergabe](Fragen.csv), [Fortschritt](Fortschritt.json).

| Person | Gruppe | Porträtzeit |
| --- | ---: | --- |
| Peter Lorre | 3 | 1930er/1940er Jahre, genauer Zeitpunkt unbekannt |
| Charles Laughton | 3 | 1934 |
| Gena Rowlands | 3 | 1967 |
| Deborah Kerr | 3 | 1958 |
| Setsuko Hara | 4 | um 1951 |
| Kinuyo Tanaka | 4 | 1951 |
| Chishū Ryū | 4 | 1953 |
| Jean-Pierre Léaud | 4 | 1959 |

Gruppe 3 ergänzt bekannte Gesichter des klassischen Kinos, deren Namen heute weniger selbstverständlich sind. Gruppe 4 erschließt insbesondere das japanische Nachkriegskino und die Nouvelle Vague. Die Zuordnung bleibt eine redaktionelle Einschätzung für ein breites deutschsprachiges Publikum. Léauds Aufnahme zeigt bewusst seine Durchbruchsphase; der Ausbau bevorzugt prägende Arbeitsperioden, keine ausschließlich aktuellen Pressebilder.

Die Fragen werden individuell entwickelt und an tatsächlich gelesenen Quellen geprüft. Konkrete Filmbezüge erhalten vorhandene oder ergänzende geprüfte Filmdaten. Gleichbedeutende Bestandsziele bleiben Varianten desselben Wissensziels. Reine Negationen und Lösungswiederholungen werden nicht als Antwortfeedback ergänzt.

Porträts bevorzugt aus der prägenden Schaffenszeit der jeweiligen Person. Nachweise unterscheiden Aufnahme-/Veröffentlichungszeit von Upload, Digitalisierung oder Zuschnitt. Frei lizenzierte beziehungsweise gemeinfreie Quellen mit vollständigem Bildnachweis verwenden; Rohdaten der ausgewählten Commons-Bilder unverändert sichern. Keine künstlich erzeugten historischen Porträts. Der Nutzerwunsch betrifft die neuen Personen; bereits vorhandene Porträts werden hier nicht pauschal ersetzt.

Redaktion, Prüfung mit dem bestehenden CSV-Parser, App-Integration und Veröffentlichung werden getrennt ausgewiesen. Dieser Auftrag startet den inhaltlichen Ausbau; er erteilt keine Veröffentlichungsfreigabe. Keine produktiven Daten oder echten Spielstände bearbeiten.

## Abgeschlossener erster Block

64 eigenständige Ziele innerhalb des Pakets; fünf sind Varianten bestehender Filmziele, 59 kommen neu hinzu. Der Abgleich berücksichtigt auch die erzeugte Regiefrage zu Charles Laughtons „Die Nacht des Jägers“. Vier Antwortpositionen jeweils 16-mal, vier Schwierigkeiten jeweils 16-mal. Alle Fragen mit ihren Optionen bleiben unter 60 Wörtern. Texte, Antwortzusätze und Quellen wurden einzeln gelesen; drei Subagents unterstützten die Recherche, die gemeinsame Redaktion und Abnahme erfolgten zentral. Kein vollständiger neuer Faktencheck des übrigen Altbestands.

Die 56 konkreten Filmreferenzen verwenden zwölf vorhandene Metadatensätze und 44 geprüfte Ergänzungen. [Referenzübersicht](Filmdaten.json); die vier Dateien `Filmdaten-001-002.json` bis `Filmdaten-007-008.json` enthalten ausschließlich neue Eckdaten. Keine zusätzlichen Filmfragen aus diesen Personenbezügen.

Alle acht Originalbilder visuell geprüft, mit SHA-256, Datierung, Urheberangabe und Commons-Nutzungsbasis in [Portraets.json](Portraets.json). Ausgewählte API-Rohantworten unverändert unter [Bildquellen](../../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspieler-Ausbau-2026-10-13-Bilder/) erhalten. Die Nutzungskennzeichnung ist die Angabe der jeweiligen Commons-Dateiseite. Bei Ryū bezeichnet das Metadatenjahr 2010 die digitale Bearbeitung, das Motiv stammt aus „Tokyo Story“ von 1953. [TMDB-Identitäten](TMDB-Personen.json) anhand Namen und bekannter Rollen abgeglichen; gleichnamige andere Personen ausgeschlossen.

`node scripts/prepare-actor-familiarity-20261013.mjs` erstellt die redaktionelle Übergabe; `--check` prüft deren Übereinstimmung. Der echte App-Parser akzeptiert alle 64 Fragen gegen den geladenen Katalog mit 12.787 Fragen, ohne Ausschluss, ID-Konflikt oder Warnung. Erhalt von Lösung, Texten, Feedback, Personen- und Filmreferenzen nach Import geprüft. Dies ist eine Prüfung in Arbeitsspeicher, keine Installation in App oder Datenbank.

## Fortsetzung

Bis zum vollständigen Ausgleich sind noch **200 Personen** zu redigieren: 24 in Gruppe 1, 78 in Gruppe 3 und 98 in Gruppe 4. Nach Einbau dieses Blocks wäre die Verteilung 83/107/29/9. Der aktuelle App-Bestand bleibt bei 220 Personen und 1.760 Personenfragen; die acht neuen Personen sind separat redaktionell fertig. Weitere Blöcke sollen die Auswahl nach Regionen und Schaffensperioden verbreitern.

Bei der späteren lokalen App-Integration sind dieses Fragenpaket, die 44 neuen Filmreferenzen, Personen-/Bekanntheitszuordnung, acht TMDB-Links und historische Porträts gemeinsam anzubinden. Die Umsetzung der vier Gruppenfilter und Freischaltungen ist weiterhin ein eigener offener Teil des [gemeinsamen Plans](../Bekanntheitsgruppen/Plan.md). Preiszuordnungen und Fragenbereichsmischung bleiben beim dort dokumentierten Stand.

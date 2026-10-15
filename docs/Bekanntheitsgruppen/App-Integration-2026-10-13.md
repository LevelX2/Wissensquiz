# Bekanntheitsgruppen und Schauspielerausbau in der App

Stand: 14.10.2026. Auf ausdrücklichen Auftrag vollständig eingebaut und am 13.10.2026 um 23:59:07 Uhr Europe/Berlin als Version 80 öffentlich veröffentlicht. [Veröffentlichungsnachweis](../Veroeffentlichung-2026-10-13-Version-80.json). [Redaktion und Einordnung](Plan.md), [208 neue Schauspieler](../Schauspieler-Bekanntheit-2026-10-13/Plan.md).

Die App lädt 34 offizielle Pakete mit **14.451 Fragen und 13.781 Wissenszielen**. Das neue Schauspielerpaket enthält sämtliche 1.664 redaktionell abgenommenen Fragen unverändert, darunter 105 bestätigte Varianten vorhandener Ziele. 1.559 Ziele sind neu. Die 10.747 Filmfragen und 280 Preisfragen bleiben erhalten; ergänzende Filmreferenzdaten erzeugen keine zusätzlichen Jahres-, Regie- oder Filmfragen. Rohquellen, bestehende Frage-IDs und gemeinsame Lernidentitäten bleiben erhalten.

| Bekanntheitsgruppe | Schauspieler | Schauspielerfragen | Preisfragen |
| --- | ---: | ---: | ---: |
| 1 Sehr bekannt | 107 | 839 | 77 |
| 2 Bekannt | 107 | 878 | 113 |
| 3 Für Filmkenner | 107 | 863 | 61 |
| 4 Entdeckungen | 107 | 844 | 29 |
| Gesamt | 428 | 3.424 | 280 |

Bekanntheit und Schwierigkeit bleiben unabhängige Achsen. Personen verwenden die redaktionelle Personengruppe; Preisfragen die vorhandene Gruppe ihrer Filmfassung. Alle drei Bereiche verwenden die vier gemeinsamen Bezeichnungen. Genres betreffen weiterhin Filmfragen. In gemischten Runden entsteht keine feste Bereichsquote und keine Viertelquote der Fragen.

Im Freien Spiel sind Bekanntheitsgruppen auch bei reinen Schauspieler- und Preisrunden wählbar, einschließlich Experte. In der Filmreise öffnet die nächste vorhandene Gruppe ab aufgerundet 50 Prozent der aktuellen leichten Ziele der vorherigen Gruppe, analog zu den Filmgruppen. Varianten und geratene Treffer erhöhen den Zähler nicht. Schwierigkeitsfreigaben bleiben separat: Personen/Preise besitzen leicht, mittel, schwer und experte, Filme drei Schwierigkeiten. Bestehende Antworten bleiben Belege; bei Katalogzuwachs zählen die aktuellen Ziele. Keine zusätzliche Bestandsschutz- oder Altbestandslogik. Wiederholen berücksichtigt fällige passende Ziele.

195 neue Commons-Porträts sind unverändert aus den geprüften Originalfassungen übernommen. Zusammen mit 25 bisherigen freien Porträts sind 220 lokale Bildfassungen hinterlegt. Hinterlegte Porträts haben in der Auflösung Vorrang vor einem allgemeinen TMDB-Porträt; Bilderkennungsfragen behalten ihre Fragefassung. Die 13 neuen TMDB-Ausnahmen verwenden die ausdrücklich redaktionell gewählte Bildreferenz. Für alle 428 Personen führt das Bild zur passenden TMDB-Personenseite; der Name bleibt Klartext. Historische Datierung, Urheber, Nutzungsbasis und dokumentierte Ausnahmen bleiben im Bildnachweis sichtbar. Keine TMDB-Bildkopien in Git.

Der reproduzierbare Helfer `scripts/integrate-actor-familiarity-20261013.mjs` erstellt das App-Paket und seine Personen-, Text-, Filmreferenz-, TMDB- und Bildzuordnungen. `--check` prüft deren Übereinstimmung mit der redaktionellen Übergabe. `scripts/prepare-actor-tmdb-portraits.mjs` bereitet nur benötigte Onlinezuordnungen vor und erhält die 13 ausgewählten Bildpfade. Anbieterzugang ausschließlich lokal; veröffentlicht werden nur erlaubte kleine Porträtmetadaten.

Serverseitig stammen alle Gruppenzuordnungen aus der vorbereiteten Darstellung der jeweiligen Frage. Migration `20261013215224_all_source_familiarity_groups.sql` erweitert vorbereitete Gruppenmengen, Filter und Freischaltung auf alle Quellen. Die bestehende Erfolgs-Katalogaktualisierung bleibt erhalten. Kleine abgeleitete Katalogmengen und der vorhandene Journey-Cache werden erneuert; keine Vollkataloge für Browser oder Kontostart. Native Aktivierung nach den zentralen Prüfungen erfolgreich ausgeführt; zehn private Quelltabellen atomar unverändert bestätigt. Laufende Runden behalten ihre bereits ausgegebenen Fragen.

Die bestehende Prüfung historischer Personen-Snapshots bleibt erhalten; keine zusätzliche Altstandsanpassung. Der anfängliche Gruppenzustand 1 erzeugt keine erspielte Freischaltungsfeier. 473 Unit-Tests, Build 80 und 370 unterschiedliche Browserfälle einschließlich zehn erfolgreicher Nachprüfungen bestanden; ein vorgesehener Skip. Veröffentlichung und Bereinigung dokumentiert.

Der vorbereitende Helfer `scripts/prepare-actor-familiarity-20261013.mjs --check` prüft die redaktionelle Übergabe gegen den damaligen Bestand mit 12.787 Fragen. Den aktuellen App-Einbau bestätigen `scripts/integrate-actor-familiarity-20261013.mjs --check`, Fortschritt und Veröffentlichungsnachweis. Beide Prüfungen nach dem Abschluss erneut erfolgreich.

## Auswahl seit Version 81 – 15.10.2026

Auf präzisierten Nutzerauftrag werden neue Filmreiseziele zuerst gleichwahrscheinlich nach freigespielter Bekanntheitsgruppe gewählt. Erst innerhalb dieser Gruppe folgen Schwierigkeit, Ziel und Variante. Die seit Version 80 bestehenden Freischaltungen je Bereich bleiben die Voraussetzung; offene Filmgruppen öffnen keine Schauspieler-/Preisgruppen. Keine Bereichsquote oder feste Viertelung einer Runde. Fällige Wiederholungen bleiben nach Lerntermin priorisiert. [Seit Version 81 veröffentlicht und produktiv aktiviert](../Veroeffentlichung-2026-10-15-Version-81.json). [Auswahl und Grenzen](../Filmreise-Freischaltung-2026-10-11.md#auswahl-neuer-ziele).

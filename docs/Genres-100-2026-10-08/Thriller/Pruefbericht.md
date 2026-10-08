# Thriller: Ausbau auf 100 Filme

Stand: 08.10.2026. Im autorisierten Worktree lokal eingebunden und geprüft, noch nicht veröffentlicht.

## Ergebnis und Auswahl

74 vorhandene Filme / 604 Fragen sind um 26 Filmfassungen / 208 Fragen ergänzt: **100 Thrillerfilme und 812 Fragen**. Der begründete [Klassikerkern](Klassikerkern.json) umfasst zwölf vorher vorhandene und acht ergänzte Werke. Er verbindet frühen Tonfilm, Film noir, Hitchcock-Suspense, Spionage, Überwachung und moderne Ermittlung; keine objektive Top-20-Rangliste. Fehlende Kernwerke hatten Vorrang, anschließend wurde anhand der lokal geschützten Sammlung ergänzt. Private Besitzzuordnungen bleiben außerhalb der öffentlichen Dateien.

Gesamtkatalog: **26 Pakete, 11.429 Fragen, 10.866 Wissensziele, 1.134 Filmfassungen und 9.389 Filmfragen**. Personen- und Preisfragen behalten ihre bisherigen Mengen und Inhalte.

## Redaktion und Belege

Jeder neue Film hat zwei eigenständige Inhaltsziele je leicht, mittel und schwer sowie Jahres- und Regieziel: 156 Inhaltsziele, 26 Jahresziele, 26 Regieziele. Die 208 Fragen liefern **207 neue Wissensziele und eine Bestandsvariante**: Blow Ups Regie verwendet `K-SCHAUSPIELER-202610-P03-153-M-1` und `variant_of=SCHAUSPIELER-202610-P03-153-M-1`. Innerhalb des Films bleiben acht unterschiedliche Ziele erhalten. Bestehende Personen-/Preisziele wurden gezielt abgeglichen; andere Abrufe nicht allein wegen derselben Filmreferenz als Dublette behandelt.

Alle Fragen enthalten vier individuelle Antwortbegründungen, Erklärung, Vertiefung, Merksatz und Quellen. Bekanntheit ist redaktionell eingeschätzt und von Schwierigkeit getrennt. Die [Lesefassung](Fragenlesefassung.md), [Zielbelege](Quellennachweis.json), [Filmdaten](Filmdaten.json) und [formale Prüfung](Formale-Pruefung.json) sind vollständig.

Die voneinander unabhängigen Gegenprüfungen [001–009](Gegenpruefung-001-009.md), [010–018](Gegenpruefung-010-018.md) und [019–026](Gegenpruefung-019-026.md) haben alle 208 Fragen samt Optionen und Vertiefungen gelesen. Die Quellen- und Sachverhaltsprüfung ist dokumentiert; keine vollständige erneute Filmsichtung oder zweite Vollrecherche behauptet. Titelhinweise bei Bei Anruf Mord, The Game und Black Swan führten zu anderen Wissenszielen. Handlungsschritte, Rollen, vergleichbare Distraktoren und Jahresanker wurden präzisiert. Ungeklärte Schlussabsichten in Shutter Island, Blow Up und Der eiskalte Engel werden nicht als bewiesene Lösungen abgefragt.

Blow Up erschien zuerst 1966 in den USA, vor europäischen Starts und Cannes 1967. Die drei Tage des Condor berücksichtigt die New Yorker Premiere vom 24. September 1975. Abweichende Länderkatalogisierungen, insbesondere bei Blow Up, Der Spion, der aus der Kälte kam und den beiden Melville-Filmen, sind ausdrücklich dokumentiert. Vollständige Regiecredits bleiben von Produktion, Kamera und Schnitt getrennt.

## Technische Abnahme

- 208 CSV-Zeilen erneut eingelesen und exakt mit der Redaktion verglichen. Acht verschiedene Wissensziel-IDs je Film, gültige Quellenkeys, vollständige Antwortfelder, null formale Warnungen. CSV-SHA256: `695be20c0c11158060d86633919fc376db42bda3231a39946bb2084dc246b877`.
- Echter App-Parser: alle Zeilen akzeptiert; keine Ablehnungen, Duplikate, Warnungen oder Importprobleme. Wiederholungsimport unverändert, keine zusätzlichen Generatorfragen. Der vollständige bisherige Fragenbestand bleibt im Vergleich unverändert.
- Metadaten und Bekanntheit für alle neuen Fragen bestätigt. Öffentliche Datei, Redaktions-CSV und erhaltene Rohquelle bytegleich. Variante mit vorhandener Wissensziel-ID geprüft.
- **385 Logiktests in 65 Dateien bestanden**, vollständiger Lauf mit zwei Workern und 8-GiB-Node-Heap. Ein vorausgehender Lauf fand irrtümlich mitgeführte Preisfragen in den Kernreferenzen; diese Referenzen wurden vor dem erfolgreichen vollständigen Rücklauf entfernt.
- Anschließend fünf Genreabnahmefälle erneut erfolgreich: Kernreferenzen werden innerhalb echter Filmfragen im Gesamtkatalog und mit passender Filmidentität geprüft. So bleiben bereits anders zugeordnete Genreüberschneidungen ohne Umordnung nachweisbar.
- TypeScript und Produktionsbuild erfolgreich. Offline-Paket `film-e86df6f7303d`, 468 Dateien. Bestehende Hinweise zu Paketannotationspositionen und Bundlegröße bleiben.
- **Neun Browserfälle bestanden**, Chromium und Firefox mit isolierten Profilen, kontrollierter Testzeit und synthetischen Spielständen/Kontodiensten. Geprüft: 100 Thrillerfilme / 812 Fragen, Blow-Up-Wissenszielvariante, Erstjahr 1966 gegenüber 1967 und Metadaten erst nach der Antwort, exaktes Offline-CSV, unveränderter Nachladebestand. Zusätzlich Abenteuer, Arthouse/Classics und Kontowiederaufnahme geprüft.

Keine fehlgeschlagenen Pflichtchecks offen und keine echten Nutzerdaten verändert. Keine neuen Import-, Lern-, Konto- oder Kompatibilitätswege. Lokal im autorisierten Arbeitsbranch; Push und Veröffentlichung sind nicht beauftragt.

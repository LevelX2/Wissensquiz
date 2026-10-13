# Ausbau der Schauspielergruppen

Stand: 13.10.2026. Der Dauerauftrag umfasst den vollständigen Ausgleich auf **107 Personen je Bekanntheitsgruppe**. Dafür werden 208 neue Personen mit jeweils acht individuellen Fragen entwickelt. Die Auswahl berücksichtigt den breiten deutschsprachigen Bezugsrahmen; Bekanntheit und Schwierigkeit bleiben getrennt. Maßgeblich sind [Fragenredaktion](../Fragenredaktion.md) und [Bekanntheitsgruppen](../Bekanntheitsgruppen/Plan.md).

**Aktuell redaktionell fertig: 32 Personen, 256 Fragen.** Zwei eigenständige Ziele je Person und je leicht/mittel/schwer/experte. Darunter 28 Varianten bestätigter Bestandsziele und 228 neue Ziele. Die gemeinsame Übergabe enthält sämtliche angenommenen Fragen mit Lösungen, Vertiefungen, Merksätzen und tatsächlich gelesenen Quellen: [Lesefassung](Lesefassung.md), [native Personenfassungen](Personen/), [CSV](Fragen.csv). Noch keine Appinstallation oder Veröffentlichung.

| Bekanntheitsgruppe | Bisherige Personen | Neue fertig | Nach Einbau | Noch zu ergänzen |
| --- | ---: | ---: | ---: | ---: |
|1 Sehr bekannt |83|24|107|0|
|2 Bekannt |107|0|107|0|
|3 Für Filmkenner |25|4|29|78|
|4 Entdeckungen |5|4|9|98|
|Gesamt |220|32|252|176|

Die restlichen Kandidaten stehen in [Ausbauauswahl.json](Ausbauauswahl.json), abgeschlossene und laufende Blöcke in [Fortschritt.json](Fortschritt.json). Ein Kandidat zählt erst nach acht tragfähigen Fragen und abgeschlossener Quellen-, Filmreferenz-, Bild- und Parserprüfung als fertig. Der Auftrag wird ohne erneute Fortsetzungsfreigabe bis zum Ausgleich bearbeitet; geprüfte Blöcke erhalten lokale Commits. Ungeprüfte Arbeitsdateien sind keine fertigen Pakete.

Die 256 Fragen enthalten 182 unterschiedliche Filmreferenzen: 57 vorhandene Metadatensätze und 125 geprüfte Ergänzungen. Originaltitel, Erstveröffentlichung, vollständige Regiecredits, Produktionsländer und Quellen sind aufgelöst; keine zusätzlichen Filmfragen aus diesen Personenbezügen. [Referenzübersicht](Filmdaten.json). Gleichbedeutende vorhandene Ziele behalten ihre Lernidentität, einschließlich der erzeugten Jahres-/Regiefragen.

Porträts stammen bevorzugt aus prägenden Schaffensperioden. Datierung trennt Aufnahme oder Veröffentlichung von Upload, Digitalisierung und Zuschnitt. Commons-Dateien mit nachgewiesener Nutzungsbasis werden bevorzugt; Originalfassungen bleiben unverändert, ohne künstlich erzeugte historische Bilder. Für Heinz Erhardt und Uschi Glas fehlen geeignete freie Porträtfassungen; beide verwenden die bestehende TMDB-Onlineanbindung, ohne Bildkopie in Git und ohne behauptete freie Lizenz. Erhardts Aufnahme ist historisch, aber undatiert; für Glas wird kein Aufnahmejahr und keine Hauptschaffenszeit behauptet. Götz George ist mit einer späteren freien Aufnahme von 2009 vertreten. Die bewussten Ausnahmen stehen ebenso wie Bilddaten, Urheber, Nutzungsbasis, Originalquelle und Prüfnachweis in [Portraets.json](Portraets.json) und blockweise unter [Bildauswahl](Bildauswahl/).

Alle 32 benötigten Bildfassungen sind visuell geprüft; 30 Commons-Dateien besitzen Hash und unverändert gesicherte API-Rohdaten, zwei TMDB-Bildreferenzen den zugehörigen originalen Personendatensatz. [Ausgewählte Rohquellen](../../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspieler-Ausbau-2026-10-13-Bilder/). Alle 32 [TMDB-Identitäten](TMDB-Personen.json) sind anhand Namen und bekannter Arbeiten abgeglichen. Zusätzlich sind die 24 Porträts des folgenden Blocks 033–056 bereits visuell geprüft; diese Personenfragen zählen erst nach gemeinsamer Abnahme zum fertigen Umfang.

Drei Subagents unterstützen die Recherche. Die zentrale Abnahme liest Fragen, vier Optionen und Vertiefungen und prüft insbesondere eindeutige Ziele, plausible Ablenkungen und verräterische Titelwörter. Der echte App-Parser akzeptiert alle 256 Fragen gegen 12.787 vorhandene Katalogfragen ohne Ausschluss, Dublette oder Warnung; Lösungen, Texte, Feedback und Referenzen bleiben erhalten. Die vier Antwortpositionen und vier Schwierigkeiten sind jeweils 64-mal vertreten. Alle Fragen mit sämtlichen Optionen bleiben unter 60 Wörtern. Kein erneuter Faktencheck des übrigen Altbestands.

`node scripts/prepare-actor-familiarity-20261013.mjs` erzeugt die redaktionelle Übergabe; `--check` prüft ihre Übereinstimmung. Standardmäßig gilt der angenommene Umfang aus `validatedThroughEntry`. Vor Abnahme eines weiteren Blocks ausdrücklich `--through-entry N` verwenden; laufende spätere Dateien werden dadurch nicht als fertig ausgewiesen. Reine Inhalts- und Parserprüfung ohne Oberfläche oder Speicheränderung, daher kein Produktionsbuild oder Browserlauf. `git diff --check` gehört zum lokalen Blockabschluss.

Die lokale App-Integration bleibt offen: Fragen, ergänzende Filmdaten, Personen-/Bekanntheitszuordnung, TMDB-Verknüpfungen und historische Porträts gemeinsam anbinden. Gruppenfilter, Freischaltungen und sichtbarer Fortschritt sind im [gemeinsamen Plan](../Bekanntheitsgruppen/Plan.md) dokumentiert. Die 25 bisherigen reinen Bilderkennungspersonen behalten ihren früher beauftragten Umfang. Der aktuelle App-Bestand bleibt bei 220 Personen und 1.760 Personenfragen. Keine feste Gewichtung der drei Fragenbereiche, keine produktiven Daten oder echten Spielstände verändern; Veröffentlichung benötigt eine eigene aktuelle Freigabe.

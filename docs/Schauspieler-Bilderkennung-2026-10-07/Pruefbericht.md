# 200 Schauspieler am Porträt erkennen

Erstintegration: 07.10.2026. Lokal eingebunden; noch nicht veröffentlicht.

**Aktuelle Präzisierung vom 07.10.2026:** „Archetypisch“ meint das vertraute Gesicht aus der prägenden Filmzeit. Auf zusätzlichen Nutzerwunsch werden die bisherigen Bilder erhalten und um jeweils ein zweites Foto ergänzt. Die Auswahl wechselt zwischen Fragerunden; Bild und Nachweis bleiben innerhalb einer Begegnung gleich. [Aktueller Stand, alle Bildpaare und Prüfung](Bildvarianten.md). Die nachfolgenden Mengen und Prüfergebnisse dokumentieren die Erstlieferung vor dieser Ergänzung.

## Auftrag und Redaktion

Genau 200 neue Bildfragen für 100 Schauspieler und 100 Schauspielerinnen. Die Erstlieferung verwendete charakteristische Fotos der echten Person, darunter zahlreiche späte Veranstaltungsaufnahmen. Die anschließende Nutzerpräzisierung verlangt zusätzlich vertraute Bilder aus früheren Schaffensperioden. Die Auswahl umfasst 175 vorhandene Personen und 25 Ergänzungen, darunter Robert Redford, Paul Newman, Humphrey Bogart, Marlon Brando, Monica Bellucci, Emma Watson und Julie Delpy. Sie ist keine Rangliste.

Der ausdrücklich beauftragte Umfang ergibt ein Gesichts-Ziel je Person. Die allgemeine Acht-Ziele-Abdeckung eines neuen Karrierepakets wird hier nicht zusätzlich aufgebaut. Der gesuchte Name steht ausschließlich in den vier Antwortmöglichkeiten und nach der Antwort in der Auflösung. Die gleiche einfache Frageform ist für diesen visuellen Erkennungsauftrag beabsichtigt; das Bild ist der individuelle Frageninhalt.

104 Fragen sind leicht, 44 mittel, 42 schwer und zehn Experte. Die Einstufung schätzt die visuelle Vertrautheit mit dem gezeigten Gesicht und den angebotenen Alternativen; sie ist redaktionell, nicht mit Spielenden kalibriert. Die drei anderen Namen stammen jeweils aus derselben Geschlechtsgruppe und einer ähnlichen Schauspielergeneration. Alle Antwortpositionen sind mit je 50 richtigen Lösungen ausgewogen; die App mischt sie weiterhin.

Jede Frage enthält vier unterschiedliche Namen, Antwortfeedback, Erklärung, eine konkrete Karriereverbindung, Merksatz und Quellen. 175 Vertiefungen verwenden die bereits redigierten Personeninformationen mit einem ergänzten eigenständig verständlichen Einleitungssatz. Diese älteren Aussagen wurden nicht erneut vollständig unabhängig geprüft. Die 25 ergänzten Karriereverbindungen wurden mit gelesenen Biografien und Film-Besetzungsangaben abgeglichen. Reine Serienbezüge werden nicht als Kinofilme katalogisiert.

Alle 200 Gesichtsziele sind gegenüber dem vorhandenen Katalog eigenständig. Rollen-, Preis- und Regiewissen ersetzt kein Gesichtserkennen. Neue IDs `SCHAUSPIELER-BILD-20261007-001` bis `-200`; Wissensziele `K-ACTOR-FACE-ACTOR-001` bis `-200`. Bestehende Frage- und Wissensziel-IDs bleiben erhalten. Künftige Bildvarianten derselben Person müssen dieselbe Gesichts-Lernidentität nutzen.

## Bildauswahl, Rechte und Anzeige

Alle 200 Bilder sind auf Wikimedia Commons unter CC BY, CC BY-SA, CC0 oder als gemeinfrei ausgewiesen. Originale API-Antworten, Lizenzversion, Urheber, besondere Zuschreibungen, Bildbeschreibung und SHA-256 der Downloads sind erhalten. Die vorhandenen WikiPortraits-Zuschreibungen werden übernommen. Bilddateien bleiben unverändert; keine eigene Retusche, Beschneidung oder synthetische Gesichtserzeugung. Die Commons-Vorschaubreite von 400 Pixeln wird überwiegend als 500-Pixel-Datei geliefert.

24 bisherige Porträts werden wiederverwendet; 176 Dateien ergänzen `public/portraits/recognition/`. Insgesamt 17.380.310 Bytes für die 200 verwendeten Bilddateien, einschließlich sechs PNG-Dateien. Die bisherigen 25 Fotos bei normalen Personenfragen bleiben separat erhalten. Für die neue Sandra-Bullock-Frage wird ein näher aufgenommenes Foto verwendet.

Alle 200 Fotos wurden als Kontaktübersichten visuell auf Person, Erkennbarkeit und eindeutiges Hauptmotiv geprüft. Vier zunächst zu weit entfernte Ansichten durch nähere Porträts ersetzt: Sandra Bullock, James Dean, Steve McQueen und Emma Roberts. Song Kang-ho erhält eine frei lizenzierte Commons-Alternative zur ursprünglich angebotenen GODL-Datei. „Archetypisch“ behauptet kein einziges objektiv repräsentatives Aussehen über alle Lebensalter und Rollen hinweg.

Vor der Auswahl erscheint ein Foto mit neutralem Alternativtext „Schauspielerporträt für die Namensfrage“. Urheber, Dateititel und Quellenlinks werden mit der Lösung angezeigt, weil diese Angaben oft den Namen enthalten. Erklärungen und Bildnachweise erscheinen auch nach falscher Antwort und „Keine Ahnung“ sowie im unmittelbaren Rundenrückblick. Die vorhandene gesammelte Lösungsanzeige bleibt maßgeblich. Der Bildpfad enthält nur die Personen-ID.

Commons-Lizenzen betreffen die Urheberrechte der jeweiligen Datei. Fotos werden sachlich zur abgebildeten öffentlichen Person im Lernquiz verwendet; eine individuelle Einwilligung wird nicht behauptet. Es gelten die bereits dokumentierten Grenzen der [Porträtnutzung](../Schauspielerportraets.md#dateien-bildrechte-und-offlinebetrieb).

## App-Integration und Filmdaten

Das native Redaktions-JSON bleibt vom App-CSV getrennt. `scripts/prepare-actor-recognition.py` erhält Texte, Quellen, Antworten und IDs bei der CSV-Ableitung. Die öffentliche CSV und die erhaltene Rohquelle sind bytegleich. Paket 21: `Schauspieler_Bilderkennung_200_Fragen.csv`; die App verwendet ihren regulären Parser und Katalogimport. `question_image_id` bleibt als zusätzliche CSV-Metadatenspalte im bestehenden Sicherungsformat erhalten; keine Migration oder neue Kompatibilitätslogik.

Die Personenreferenz und der Name müssen zum Bildregister passen. `ActorPortrait` zeigt das passende Bild vor der Frageauswahl und die vollständigen Nachweise in der Lösung. `FilmDataPanel` liest die gelieferten Bildfragen-Filmverweise. 34 bisher fehlende Film-Basisdatensätze wurden aus tatsächlich gelesenen Filmseiten ergänzt: Originaltitel, erstes Veröffentlichungsjahr einschließlich Festivals, vollständige Regie und Produktionsländer. Sie erzeugen keine zusätzlichen Filmfragen. Vorhandene Film-Basisdaten haben Vorrang; die ergänzten Datensätze dienen den Karriereverbindungen dieser Personenfragen.

Der vollständige lokale Katalog umfasst **8.397 Fragen / 7.853 Ziele / 544 Varianten**, davon **1.600 Schauspielerfragen für 200 Personen**. Vollständige Katalogprüfung: 21 Pakete, keine abgelehnten Importe, keine doppelte Frage-ID, Sicherungsvalidierung und verlustfreier Katalog-Roundtrip erfolgreich. Frühere Fragen und Lernidentitäten werden beim Ergänzen und Wiederholungsimport erhalten.

Der Build enthält die CSV und sämtliche Bilder im geprüften Offline-Paket. Keine Bildabrufe bei Commons während des Spiels. Keine Nutzerdaten in Paket, Quellen oder Bildern. Duellkatalog und Remote-Freigaben wurden nicht veröffentlicht.

## Technische Abnahme

374 Tests in 63 Dateien, TypeScript und Produktionsbuild erfolgreich. Der neue Pakettest prüft sämtliche 200 Bilddateien und Nachweise, neutrale Anzeige ohne Namen beziehungsweise Quellenlink, vier Antworten und Feedbacks, alle Filmverweise, 200 neue Gesichtsziele sowie unveränderte ältere Fragen und wiederholbaren Gesamtimport. Alle älteren Bildtests bestehen ebenfalls.

Die Katalogprüfung `npm run check:questions` bestätigt die vollständigen öffentlichen Quellen und die weiterhin genau dokumentierten 238 älteren CSV-Redaktionsabweichungen. `git diff --check` erfolgreich. Keine Abhängigkeitsänderungen. Bekannte Bundlegrößen- und Zod-Kommentarhinweise bleiben.

23 gezielte Browserfälle bestanden: neue Bildfragen sowie vorhandene Porträt-, Personen-, Filmreise- und Bereichsauswahlprüfungen in Chromium und WebKit mit iPhone-Profil. Alle sechs neuen Bildfälle bestanden: richtige, falsche und Nichtwissensantwort; Bild vor der Auswahl, neutraler Alternativtext, Name/Urheber/Lizenz nachher, 320-Pixel-Ansicht ohne Überlauf, Axe ohne Verstöße, Neuladen und Fortsetzen. Der vorhandene WebKit-Fall zur 1440-Pixel-Desktopansicht bleibt planmäßig übersprungen; insgesamt 24 Fälle angesetzt.

Chromium bestätigt das echte Offline-Neuladen mit der Bildanzeige. Bei ausgeschaltetem Netzwerk sind alle 200 Dateien im App-Cache vorhanden. Windows-WebKit bestätigt mobiles Online-Neuladen, anschließende Offline-Fortsetzung und sämtliche 200 Cache-Einträge; die bekannte Einschränkung des vollständigen Offline-Neuladens auf dieser Plattform bleibt ausdrücklich erhalten. Kein Nachweis auf einem physischen iPhone. Bildansichten in beiden Browsern und alle Kontaktübersichten visuell geprüft.

Offline-Paket `film-123f84ff1fb5`, 263 Dateien. Isolierte Profile, kontrollierte Testzeit, synthetischer Kontodienst und separater Preview-Port 43917; keine echten Nutzerdaten. Testberichte im erneuten vollständigen Logiklauf unter dem ignorierten Testverzeichnis geführt. Die ersten Fehlversuche betrafen historische Bestandszahlen, die fälschliche Annahme eines letzten Film-Pakets, den bisherigen Personenredaktions-Testumfang und ein fehlendes JSON-Importattribut im neuen Browsertest; im erfolgreichen Endstand korrigiert.

## Dateien und Nachweise

- [Alle 200 Fragen als Lesefassung mit Bildern und Lösungen](Lesefassung.md)
- [Natives Redaktionspaket](Schauspieler_Bilderkennung_200_Fragen.json)
- [App-CSV](../../public/schauspieler-bilder-fragen.csv)
- [Nutzerauftrag, unveränderte Wikimedia-Antworten und Bildnachweise](../../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspieler-Bilderkennung-2026-10-07/Nachweis.json)
- [Filmverweise](Filmverweise.json) und [Filmquellenprüfung](Filmquellenpruefung.json)
- [Vollständige Katalogprüfung](../Fragedaten-Pruefung.json)
- [Paketstatistik und Prüfergebnisse](Pruefung.json)

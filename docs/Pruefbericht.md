# Prüfnachweis – 26. September 2026

## Umgebung und Ergebnis

Windows, Node 24.19.0, npm 11.17.0, React 19, TypeScript 5.9, Vite 7.3.6, Vitest 4.1.11, Playwright Chromium 153. Produktions-Build erfolgreich, zuletzt 103 Logik-/Persistenz-/Datenbanktests und alle 56 Browserfälle erfolgreich (55 im vollständigen Lauf, einer nach Testdatenergänzung gezielt nachgeprüft). Nach Ergänzung von Supabase SDK und PGlite `npm audit` erneut ausgeführt: 0 bekannte Schwachstellen. Tests in separaten Browserprofilen; kontrollierte Testdaten wurden nicht in einen Nutzerbrowser übernommen.

## Tatsächlich ausgeführt

| Prüfung | Ergebnis |
| --- | --- |
| Vollständiger Import der gelieferten CSV | 180 akzeptiert, 0 verworfen, 0 Duplikate; 150 Ziele, 30 Varianten, 39 Themen, 50 leichte Abzeichenziele. |
| BOM/UTF-8, CRLF, Komma/Semikolon/Tabulator, Quotes und mehrzeilige Felder | Gezielte Parserprüfungen bestanden. |
| Fehlende Spalten, ungültige Lösung, kaputtes Quoting, doppelte Header und Variantenfehler | Nachvollziehbar ausgeschlossen. |
| Antwortmischung und Feedback | Für jede der 720 Fragen stabile Zuordnung geprüft. |
| Punkte und Zeit | Grenzen bei 0, 5.000, 5.001, 29.999, 30.000 und 31.000 ms sowie falsche Antworten geprüft. |
| Lernfortschritt | Kontrollierte Tage 0/1/4/11/32, frühe und gleichentägige Wiederholung, falsch und geraten geprüft. |
| Auswahl | 5/3/2-Mischung, einzigartige Wissensziele, kleine Themen, begrenzte Fälligkeiten geprüft. |
| Abzeichen | Keine Vorabvergabe vor Abschluss; geratener letzter Treffer reicht nicht, Erwerb bleibt nach Bestandserweiterung erhalten. |
| Persistenz | Parallele IDB-Transaktionen, Rollback, doppelte Antworten/Abschlüsse, JSON-Struktur, Querverweise und manipulierte Ableitungen geprüft. |
| Vollständige Browserrunde | Fünf Fragen, richtig/falsch, geraten, lokale Meldung, Ergebnis, Favorit, Sammlung und Rundenrückblick. |
| Datenverwaltung im Browser | JSON-Download und Wiederimport, beschädigte Sicherung, CSV-Duplikate und Zusatzimport, Reset nur nach Texteingabe. |
| Mobile Ansicht | 390 × 844 und 320 × 740 px, keine horizontale Scrollpflicht im geprüften Einstieg/Fragen-/Feedbackablauf; Antwortflächen mindestens 44 px hoch. |
| Rekordmodus im Browser | Zeitablauf, keine Uhr in Erklärung, verspätete Wertung verhindert, Hintergrundzeit, Doppelklick und Abbruch nach Reload. |
| Offline | Nach bestätigtem Precache Netzwerk im Browser abgeschaltet, vollständiges Neuladen und Fortsetzen/Beantworten weiterer Fragen bestanden. |
| App-Update | Neue Worker-Version wartet, während laufende Frage erhalten und beantwortbar bleibt. |
| Browserneustart | Browser vollständig geschlossen und mit demselben isolierten Profil neu gestartet; Antwort/Erklärung und Runde wiederhergestellt. |
| Tastatur | Start und Antwort mit Enter, sichtbarer Fokus, Fokuswechsel auf Erklärung geprüft. |
| Automatische Barrierearmut | axe-core WCAG 2 A/AA und 2.1 AA auf Start- und Feedbackansicht: keine gefundenen Verstöße. |
| Sichtkontrolle | Desktop-Startseite, mobile Frage und Feedback anhand tatsächlich gerenderter Screenshots angesehen. |
| Lokale Netzwerkadresse | `http://192.168.178.141:4173` antwortet vom Rechner mit HTTP 200. Kein Test von einem physischen Telefon. |

Rohquelle und ausgeliefertes Fragenpaket haben denselben SHA-256-Wert: `E928647423F3781BDBCC6E17B2AB0C35FAD38D76483E3470DDC312F7D8BDF968`.

Die anfänglich gefundenen moderaten Vitest-Entwicklungsabhängigkeitslücken wurden durch Aktualisierung auf 4.1.11 beseitigt. Der Offline-Test deckte einen tatsächlichen Fehler durch `Vary: Origin` im Vorschau-Server auf; nach gezielter Korrektur wurde der vollständige Browserlauf erneut erfolgreich ausgeführt.

## Grenzen

- Kein Test auf einem physischen Smartphone, Safari, Firefox oder installierter iOS-/Android-PWA. Chromium-Mobilgrößen sind keine vollständige Geräteprüfung.
- PWA/Offline im Heimnetz über HTTP ist browserbedingt nicht verfügbar. Privates HTTPS-Hosting über Sites ist eingerichtet; dort noch kein PWA-Gerätetest. Auf localhost wurde Offlinebetrieb tatsächlich geprüft.
- Die automatisierte Barrierearmutsprüfung ersetzt keine vollständige Prüfung mit Screenreader oder Menschen mit unterschiedlichen Bedürfnissen.
- Keine unabhängige fachliche Überprüfung sämtlicher Filmaussagen und Quellenlinks. Gelieferte Quellenkennzeichnung bleibt nachvollziehbar erhalten.
- Zeitversetztes Lernen mit kontrollierter Testzeit, nicht über elf reale Tage geprüft. Spielspaß und Motivation brauchen Nutzerfeedback.
- Kontenanbindung mit manueller Online-Sicherung vorbereitet, aber noch kein echter Dienst eingerichtet; keine automatische Synchronisierung oder manipulationssicheren Rekorde. Für Spielrunden nur ein App-Fenster verwenden; Start eines weiteren Fensters beendet einen aktiven Rekord als Reload-Schutz.
- Große Datenmengen sind nicht Last-getestet. Die einfache Zustandsablage und vollständige Neuberechnung sind auf die Testversion ausgerichtet.

## Wiederholen

`npm test`, `npm run build`, `npm run test:browser`, `npm audit`. Browserartefakte und Fehlerspuren liegen im ignorierten `test-results/`. Die lokale Vorschau verwendet Port 4173. Vor Wiederholung laufende Nutzerrunden beenden, da ein neuer Build erst nach Schließen alter App-Fenster aktiv werden soll.

## Action-Paket und Veröffentlichung

180 weitere Fragen, 150 Wissensziele und 17 Themen vollständig mit dem App-Parser importiert; keine Ausschlüsse oder ID-Konflikte. Paketergänzung bei konkurrierenden Transaktionen geprüft. Im Browser bestehenden Sci-Fi-Stand simuliert und nach Neuladen Action ergänzt; laufende Runde und Erklärung erhalten. Beide Pakete auch im Offline-Test enthalten. Action-Rohquelle und öffentliche Datei bytegleich (SHA-256: A96725F37C330014F5424A4552F2963B79C485DEBB5B88A559DFC35082FB8163). Erste private Sites-Veröffentlichung nativ als succeeded bestätigt; kein zusätzlicher Live-Browsertest behauptet.

## Horror-Paket

Am 26.09.2026 alle 180 gelieferten Horror-Fragen mit dem App-Parser gegen Sci-Fi und Action importiert: 150 Wissensziele, 30 Varianten, 20 Themen, keine Ausschlüsse, Warnungen oder ID-Konflikte. Gesamtbestand: 540 Fragen, 450 Wissensziele und 76 Themen. Alle Lösungen, Antwortfeedbacks und Variantenverknüpfungen geprüft. Nutzerdatei, archivierte Rohquelle und öffentliche Datei bytegleich (SHA-256: `DD3D2C14FA779DC08E0BA87A89CB8F0112FD0AC33F8FF496EC5B43B3249A6E1D`).

35 Logik-/Persistenztests, Produktions-Build und elf Chromium-Prüfungen erfolgreich. Paketergänzung aus reinem Sci-Fi-Bestand sowie aus Sci-Fi und Action auch bei konkurrierenden Schreibtransaktionen geprüft: vorhandene Fragen, Runden, Antwortereignisse und Lernstände unverändert. Beide Altstände zusätzlich in isolierten Browserprofilen mit kontrollierter Zeit ergänzt und laufende Erklärung wiederaufgenommen. Horror-CSV im Service-Worker-Cache nachgewiesen und eine Halloween-Runde nach Offline-Neuladen fortgesetzt. Export/Import und Browserneustart mit erweitertem Bestand erfolgreich. Keine neue Sites-Veröffentlichung oder unabhängige Faktenprüfung durchgeführt; die oben genannten Geräte- und Live-Grenzen gelten weiter.

## Nachfolgende private Live-Aktualisierung

Auf ausdrücklichen Auftrag am 26.09.2026 den unveränderten geprüften Anwendungscode aus Commit `f871f709ef6fd413c9a3a159b27fe13d07daac9e` erneut erfolgreich gebaut und als Sites-Version 3 veröffentlicht. Deployment `appgdep_6ab7a24215f48191b7c425ba389f75d8` meldet `succeeded`. Authentifizierte HTTP-Prüfung: Startseite, Service Worker und Horror-CSV jeweils Status 200; Horror-CSV bytegleich, im Worker-Manifest enthalten. Zugriff weiterhin nur für Eigentümer; Einladungsfunktion verfügbar. Kein zusätzlicher Live-Browser-, Smartphone- oder PWA-Installationstest.

## Mehrfachauswahl von Genres und Stufen

42 Logik-/Persistenztests und zwölf Browserprüfungen bestanden. In allen drei Modi Auswahl auf Horror + Sci-Fi und Leicht + Mittel begrenzt, Wissensziele eindeutig, leere Auswahl ohne Rundenerzeugung, zukünftiges Genre Fantasy aus Metadaten erkennbar, optionale Filmreihe weiter einschränkend. Rekordschlüssel unabhängig von Klickreihenfolge, getrennte Kombinationen und unveränderte historische Schlüssel geprüft. Sicherungen erhalten neue Filter und alte Runden ohne Filter; widersprüchliche Filter/Snapshots werden abgelehnt.

Im isolierten Chromium-Profil bei kontrollierter Zeit die Checkboxen kombiniert, leere Genre-/Stufenauswahl geprüft, eine passende Runde beantwortet und nach Neuladen unverändert fortgesetzt. Mobile Ansicht bei 320 Pixeln ohne horizontalen Überlauf; tatsächlich gerenderten Screenshot der Auswahl angesehen. Export/Import, Offline-Neuladen, Browserneustart und automatische Barrierearmutsprüfung weiterhin erfolgreich. Keine echten Nutzerstände verwendet oder hochgeladen. Konten/Datenbank/Bestenliste bisher nur Entwurf.

## Sound, Vibration und Icons

43 Logik-/Persistenztests einschließlich alter/neuer Sicherungseinstellungen erfolgreich. 15 Browserprüfungen erfolgreich: 14 im Gesamtlauf, Soundprüfung nach Korrektur der Wartebedingung für das asynchrone Speichern gezielt erneut bestanden. Web-Audio-Oszillatorerzeugung im echten Browser beobachtet: keine Töne beim Laden, Signale nach Nutzeraktion und bei Antwortfeedback, kein Ton nach gespeichertem Stummschalten und Reload. Vibrationsaufrufe im Test abgefangen und Muster überprüft; fehlende Audio-/Vibrations-APIs verhindern keine Runde. Keine physische Hör- oder Vibrationsprüfung behauptet.

Abgeschlossene Rekordrunde mit mehreren Genres/Stufen und anschließende Sammlung ohne JavaScript-Fehler geprüft; dabei den alten Positionsparser für Rekordschlüssel durch die lesbare Rundenzuordnung ersetzt. Genre-SVGs und gesperrte Abzeichenmedaille anhand gerenderter Screenshots kontrolliert. Bestehende Regeln für das einzige Sci-Fi-Abzeichen unverändert; weitere Genre-Abzeichen nicht umgesetzt.

## Fantasy, Conjuring-Vertiefung und sichtbare Schwierigkeit

180 Fantasy-Fragen vollständig akzeptiert: 150 Ziele, 30 Varianten, zwölf Themen, keine Warnungen, Ausschlüsse oder ID-Konflikte. Gesamtbestand 720 Fragen, 600 Ziele und 88 Themen. Originaldatei, Rohquellenkopie, öffentliche Datei und Build-Kopie bytegleich (SHA-256: `1245252AD7CDBCFCD2954E7752906E1B2F350A8D6F0110E58DA96165D5CC1796`). Keine pauschale Faktenprüfung der Fantasy-Fragen.

45 Logik-/Persistenztests und vollständiger Lauf mit 18 Chromium-Prüfungen erfolgreich. Altstände mit einem, zwei und drei Paketen transaktional ergänzt; Fragen, Runden, Lernereignisse, Einstellungen und Favoriten erhalten. Fantasy im Offline-Cache nachgewiesen und eine Herr-der-Ringe-Runde offline nach Neuladen fortgesetzt. Rekordprüfung wartet nun auf den fertigen Rundenabschluss, bevor sie zur Sammlung navigiert; zuvor konnte die Testnavigation zu früh erfolgen.

Darsteller von Ed/Lorraine Warren und Roger/Carolyn Perron einzeln im AFI-Filmkatalog geprüft. Browserprüfung bestätigt: Ergänzung erst nach der Antwort, unter geschlossener Vertiefung zunächst verborgen, nach Aufklappen mit korrekter Rollenzuordnung und Quellenlink sichtbar, auch nach Wiederaufnahme. Keine gespeicherten Frageinhalte geändert. Weitere Erklärungstexte nicht systematisch überarbeitet.

Schwierigkeitsanzeige aus der jeweiligen Frage vor und nach Antworten in den Browserabläufen geprüft; mobile Darstellung und Umbruch bei 390/320 Pixeln ohne horizontalen Überlauf, Screenshot der Fragenansicht angesehen. Produktions-Build und `git diff --check` erfolgreich. Geräte-/Live-PWA-Grenzen unverändert.

## Darstellerprüfung, Fragehinweise und Bestenliste

Am 26.09.2026 sämtliche 720 Fragen zu 125 Filmen hinsichtlich fehlender Darstellernamen durchgesehen; 627 Vertiefungen ergänzt, 64 bereits ausreichend zugeordnet, 29 ohne einzelne gespielte Figur im Mittelpunkt. Besetzungsquellen und Einzelentscheidungen in `Darstellerpruefung.json`, Grenzen unter `Erklaerungstiefe.md`. Versions-, Film-/Jahres- und Inhaltsabgleich schützt andere Imports und historische Snapshots. Rohquellen und ausgelieferte CSV unverändert. Keine pauschale Prüfung aller Handlungsaussagen.

51 Logik-/Speicherprüfungen erfolgreich: vollständige redaktionelle Abdeckung, Originalversionen/Inhalte, Schutz vor falscher Zuordnung, Rollenwechsel/Originalstimmen, alte/neue Anzeigeeinstellungen, Rangfolge/Gleichstand, sämtliche abgeschlossenen Spiele, Backup und Trennung der Kategorien einschließlich historischer Runden. Produktions-Build erfolgreich. Bekannte Buildhinweise: bestehende Zod-Kommentaranmerkungen und JavaScript-Bündel über 500 kB (rund 149 kB gzip).

20 Chromium-Prüfungen erfolgreich. Neue Prüfungen für unabhängige Genre-/Schwierigkeitsanzeige einschließlich Neuladen, gefilterte Bestenliste, Rundenrückblick, Offline-Bestand und 320-Pixel-Ansicht. Mobile Bestenliste anhand gerendertem Screenshot geprüft. Bisherigen Rekordtest auf die neue Kategorienansicht aktualisiert; Einstellungstest wartet auf die abgeschlossene Speicherung. Quellen und Darstellerzusätze bleiben vor der Antwort unsichtbar und werden nach Wiederaufnahme angezeigt. Isolierte Testprofile und kontrollierte Zeit, keine echten Nutzerstände verändert. Physische Geräte-/Hör-/Vibrations-/private Live-PWA-Prüfungen weiterhin offen.

## Vorbereitung eigener Konten

57 Logik-/Speicher-/Datenbankprüfungen erfolgreich. Drei neue Konfigurations-/Speichertests prüfen erlaubte öffentliche Schlüssel, sichere Linkauswertung, getrennte Gast-/Konto-/Projektschlüssel und Sicherungsersatz. Drei neue Datenbanktests führen die echte SQL-Migration in PGlite mit nachgebildetem Supabase-Auth-Schema aus: anonyme/unbestätigte Benutzer abgewiesen, fremde Zeilen unsichtbar, direkte Schreibrechte gesperrt, veraltete Revision ohne Überschreiben abgelehnt, nachträglich entzogene E-Mail-Bestätigung wirksam.

25 unterschiedliche Chromium-Prüfungen erfolgreich. Die fünf Kontenprüfungen verwenden das echte SDK mit simulierten HTTP-Antworten: deaktivierte Einrichtung ohne Passwortformular, Registrierung/erneute Bestätigung/Reset-Anforderung, Link erst nach Klick verbraucht und aus URL entfernt, Passwortwechsel einschließlich Neuladen der Reset-Ansicht und Abmeldung, Gast-/Zwei-Konten-Trennung und ausdrücklich ausgelöste Sicherung/Gastübernahme, falsches Passwort und abgelaufener Link. Kontoformular bei 320 px ohne Überlauf und ohne von axe erkannte Verstöße. In Kontentests ist der Service Worker für zuverlässige HTTP-Simulation blockiert; Offline-/Updateprüfungen laufen separat mit dem echten Worker.

Produktions-Build und Abhängigkeitsprüfung erfolgreich, 0 bekannte Schwachstellen. Build meldet einen großen JavaScript-Chunk (rund 772 kB unkomprimiert); Aufteilung ist eine spätere Optimierung. Roh-CSV unverändert. Zu diesem Vorbereitungszeitpunkt noch kein echtes Supabase-Projekt, keine Mailzustellung oder Live-Kontoabnahme geprüft; Konfiguration deaktiviert und privater Sites-Zugriff erhalten.

## SMTP-Einrichtung und private Kontenaktivierung

Am 26.09.2026 Brevo-Free-Konto mit verifiziertem Absender und ausdrücklich freigegebenem SMTP-Schlüssel verbunden. Supabase speichert SMTP-Passwort verborgen; Bestätigungs- und Reset-Vorlagen bearbeitbar und gespeichert. Brevo-Schlüssel aktiv, Ablauf 26.09.2027 (zusätzliche Inaktivitätsgrenze laut Dialog: 90 Tage). Tracking anonymisiert, aber kein vollständiger Abschalter verfügbar. Brevo wartet noch auf den ersten Versandlog; Mailzustellung und reale Linkweiterleitungen sind ausdrücklich ungetestet.

Öffentliche Konto-Konfiguration für den privaten Eigentümertest aktiviert. Die bestehende Prüfung für deaktivierte Konten setzt ihre Testkonfiguration jetzt ausdrücklich per Route, unabhängig von der produktiven Konfiguration. Erneut 57 Logik-/Datenbanktests, Produktions-Build und 25 Chromium-Prüfungen erfolgreich. Keine Abhängigkeiten geändert. Alle getrackten CSV bytegleich, nur testbedingte Importbericht-Zeitstempel wiederhergestellt. Echte Nutzerpasswörter, Mails, Konto-/Zwei-Geräte-Tests und private Live-PWA-Abnahme bleiben offen.

## Automatische Kontosicherung und verständliche Bestätigung (26.09.2026)

63 Logik-/Datenbanktests, Produktions-Build und alle 27 Chromium-Prüfungen erfolgreich. Sechs neue Logiktests prüfen initiales Laden, dauerhaft erkennbare Offline-Änderungen, serielle Uploads, Konflikte, verlorene Speicherbestätigungen und das Stoppen bei parallelen Uploads. Browserprüfungen umfassen zwei isolierte Geräteprofile mit simuliertem Kontodienst, Netzunterbrechung/Wiederholung, automatisches Laden, konkurrierende Änderungen und ausdrückliches Fortsetzen mit dem Online-Stand. Ein dabei gefundener Lock-Freigabe-Wettlauf beim Wiederholen wurde korrigiert; anschließend vollständiger Browserlauf erfolgreich.

Bestätigungsseite erklärt Kontoaktivierung, anschließende Anmeldung sowie Abbruch; Token wird weiterhin erst nach Klick geprüft. 320-Pixel-Ansicht ohne Überlauf und gerenderten Screenshot kontrolliert. Gastdaten bleiben auf Wunsch des Nutzers gerätelokal erhalten. Alle CSV unverändert, keine Abhängigkeiten geändert.

Echte Dienstbelege: Nutzer erhielt nach SMTP-Korrektur die Bestätigungsmail, Kontoaktivierung im Supabase-Dashboard bestätigt. Zwei spätere POST-/token-Anfragen vom Quiz wurden mit HTTP 400 „Invalid login credentials“ abgelehnt. Identische Mail-Endung vom Nutzer bestätigt; Passwort-Reset empfohlen. Kein Passwort eingesehen oder geändert. Erfolgreicher Passwort-Reset, Smartphone-Anmeldung und echte Zwei-Konten-/Geräte-Abnahme bleiben offen; HTTP-Simulationen ersetzen diese Nachweise nicht.

## Passwortanzeige, erfolgreicher Reset sowie Komödie und Western (26.09.2026)

Der Nutzer hat den erfolgreichen Passwort-Reset und die anschließende Anmeldung am Handy bestätigt. Das ist ein realer Authentifizierungsnachweis; geräteübergreifende Fortschrittsübernahme, zweite Person und physische PWA-/Offline-Funktion bleiben gesondert offen. Alle Passwortfelder bieten Anzeigen/Verbergen mit zugänglichem Namen und Auge. Umschalten verändert oder sendet das Passwort nicht; Leeren und Formularwechsel verbergen es erneut. Anmeldung, Registrierung und beide Reset-Felder im Browser geprüft.

Je 180 Komödie-/Western-Fragen vollständig mit dem tatsächlichen App-Parser angenommen, jeweils 150 Ziele, 30 Varianten und 25 Themen. Keine Warnungen, Ausschlüsse oder ID-Konflikte. Originaldateien unverändert übernommen, bytegleiche Roh-/Public-/Build-Kopien geprüft. Gesamtbestand 1.080 Fragen, 900 Ziele und 138 Themen. Der bestehende Darstellernachweis bleibt ausdrücklich auf die bisherigen vier Pakete begrenzt.

67 Logik-/Datenbanktests bestanden; Build erfolgreich. Der erweiterte Browserlauf umfasst 31 Prüfungen, zusätzlich ältere Stände mit vier/fünf Paketen und Offline-Neuladen der beiden neuen Genres. 30 Prüfungen im Gesamtlauf bestanden; der Zusatzimport-Test erwartete noch die alte Fragenzahl. Erwartung auf 1.092 Fragen nach zwölf Demo-Imports korrigiert, gezielter Wiederholungslauf bestanden. Damit alle 31 unterschiedlichen Browserprüfungen erfolgreich. Keine Abhängigkeiten geändert.

## Profilstatistik und gemeinsame Trainingsrangliste — 26.09.2026

- `npm test`: 70 Prüfungen in neun Dateien erfolgreich. Drei neue Datenbanktests führen beide Migrationen in PGlite mit nachgebildeten Auth-Rollen aus: Standard ohne Freigabe, serverseitige Neuberechnung, private Kontotrennung, Eigentümerprüfung, automatische Aktualisierung, Pagination mit 53 Einträgen, Gleichstände, Rücknahme und widerrufene E-Mail-Bestätigung.
- `npm run build` erfolgreich. 31 Browserprüfungen im Gesamtlauf plus der neue gezielte Profiltest erfolgreich, insgesamt 32 verschiedene Fälle. Der neue Test belegt historische Statistik, eingeklappte Kontohilfe, freiwillige Freigabe/Rücknahme, eigene/gemeinsame Ergebnisse, Ausfall der gemeinsamen API bei weiterhin nutzbarer persönlicher Liste sowie 320-Pixel-Ansicht ohne horizontalen Überlauf und ohne Axe-Verstöße. Screenshot visuell geprüft.
- Migration 002 im echten bestehenden Supabase-Projekt erfolgreich angewandt. Anschließende SQL-Abfrage: RLS auf beiden Tabellen, keine anonymen Leserechte, keine direkten Kontoschreibrechte, Ranglisten-RPC für Konten und keine Freigabe der internen Ableitung. Keine echten Spielstände für Tests verändert, keine bestehenden Spieler automatisch beteiligt.
- Gemeinsame Ranglisten enthalten ausdrücklich Trainingswerte; Browserzeiten und Antwortnachweise sind kein unabhängiger Wettbewerbsnachweis. Echte Abnahme mit zwei Konten und physischen Geräten bleibt offen. CSV-Rohdaten unverändert; keine Abhängigkeitsänderung.

## Lernpfad, helle Spielansicht und Spielerranglisten — 26.09.2026

- Nutzerentscheidung zum optionalen Lernpfad umgesetzt; zwei zusätzliche Logiktests prüfen historische Zählung, Duplikate, geratene/abgebrochene Runden, getrennte Genres, beide Schwellen, Durchsetzung beim Start und Sicherungsimport. Zusätzlicher Datenbanktest prüft Spieleraggregation, Mindestantwortenzahl, Genre/Stufe und sichere Rückgabefelder. Gesamtstand: **73 Tests in zehn Dateien erfolgreich**.
- **33 Chromium-Prüfungen im Gesamtlauf erfolgreich**. Neuer Lernpfadtest prüft gespeicherte Option, ausschließlich leichte Fragen bei neuem Stand, erhaltene Vertiefung und zentrale Soundoptionen. Profiltest um Spielerlisten, Filterparameter, 320-Pixel-Ansicht und Axe erweitert. Bestehende Offline-/Soundtests an den zentralen Optionszugang angepasst; keine Prüfungen entfernt.
- Helle Farbpalette und kompakte Abstände: automatische Kontrast-/Barriereprüfungen erfolgreich, 390-Pixel-Fragenansicht visuell geprüft. Dabei umgebrochene mobile Vierer-Navigation erkannt und auf eine Zeile korrigiert; Produktions-Build sowie gezielte Lernpfad-, Mobil- und Tastatur-/Axe-Prüfungen erneut erfolgreich. Keine echte physische Smartphone-/PWA-/Haptikprüfung ersetzt.
- SQL-Migration 003 im bestehenden Dienst erfolgreich. Benutzerteilnahme wird nicht automatisch aktiviert. Reale Zwei-Spieler-Abnahme der Listen bleibt offen. Keine neuen Abhängigkeiten; bestehende Bundlegrößenwarnung bleibt.

## Drama-Erweiterung — 26.09.2026

180 Datensätze mit dem App-Parser gegen sämtliche Vorgängerfragen geprüft und angenommen; keine Warnungen, Ausschlüsse oder Konflikte. Lösungen, Antwortfeedback, Variantenverweise, Erklärungen und Quellen strukturell geprüft. 150 Ziele, 30 Varianten, 25 Themen; Gesamtbestand 1.260 Fragen und 1.050 Ziele. Gelieferte/Roh-/Public-/Build-Datei bytegleich. Bestehende CSV unverändert.

`npm test`: 75 Tests in zehn Dateien erfolgreich. Erhaltende transaktionale Ergänzung jetzt für historische Stände mit einem bis sechs Paketen geprüft. Produktions-Build erfolgreich, Offline-Paket mit 15 Dateien. 35 unterschiedliche Chromium-Prüfungen erfolgreich: 34 im Gesamtlauf; ein Zusatzimport-Test erwartete noch die alte Bestandsgröße, wurde auf 1.272 Fragen inklusive zwölf Demo-Fragen korrigiert und gezielt erfolgreich wiederholt. Einschließlich Ergänzung eines vorhandenen Sechs-Genre-Spielstands und Drama-Runde mit Offline-Neuladen. Siebenfachauswahl und Lernpfad berücksichtigt. Keine unabhängige Filmfaktenprüfung oder physische Geräteabnahme.

## Genreillustrationen und hervorgehobene Filmtitel

26.09.2026: 77 Logik-/Datenbanktests in elf Dateien, Produktions-Build und sämtliche 36 Chromium-Prüfungen im Gesamtlauf erfolgreich. Neuer Browserfall prüft sieben geladene Illustrationen, Offline-Neuladen, Tombstone-Titel ohne Anführungszeichen mit erhaltenem Jahr sowie 320-Pixel-Umbruch ohne horizontalen Überlauf. Desktop-Karten, mobile Action-Karte bei 390 Pixeln und Frage bei 320 Pixeln als Screenshots visuell geprüft. Bestehende Axe-, Persistenz-, Backup-, Update- und Kontenprüfungen weiterhin erfolgreich.

Alle sieben generierten Originale sind RGBA-PNG mit transparenten und deckenden Pixeln (Alpha 0 bis 255), unverändert übernommen. Offline-Build enthält 22 Dateien. Alle 1.260 Fragen besitzen einen exakt erkennbaren zitierten Filmtitel; Metadatenlosigkeit und unbekannte Zitate verändern den Text nicht. Sämtliche getrackten CSV bytegleich zum vorherigen Commit, Importberichte nur um Testzeitstempel bereinigt. Bekannter Buildhinweis: JavaScript-Bündel über 500 kB. Physische Smartphone-/PWA-Abnahme weiterhin offen.

## Direkte Highscores, automatische Teilnahme, Standard-Lernpfad und Hilfe

26.09.2026: 79 Logik-/Datenbanktests erfolgreich, einschließlich Übernahme zuvor nicht freigegebener Altstände, automatischer Projektion neuer Spiele, bestätigter Konten ohne Runden, Namensänderungen und Ausschluss unbestätigter/anonymer Konten. Abwahl- und interne Projektions-RPC bleiben für Konten gesperrt; private Spielstände werden nicht verändert. Neue freie Schwierigkeitsauswahl bleibt in Sicherungen erhalten; Standard-Lernpfad auch für Altsicherungen, Freispielantworten zählen beim Rückwechsel und aktive Rundensnapshots bleiben erhalten.

37 unterschiedliche Chromium-Prüfungen erfolgreich: 34 im ersten Gesamtlauf; zwei Prüfungen warteten beim neuen asynchron gespeicherten Häkchen nicht auf den Zustand, eine erwartete nach Reset noch das alte Navigationsziel. Wartebedingungen auf Klick plus sichtbaren Zustand korrigiert, Reset zur Startseite beibehalten; alle betroffenen Fälle gezielt erfolgreich wiederholt. Profil/Highscores und Hilfe abschließend erneut erfolgreich, einschließlich mobiler Navigation mit fünf Punkten, fehlendem Optionsbutton außerhalb des Profils, schwerer Runde bei freier Auswahl, neuer Hilfe offline und Axe-Prüfung. Mobile Highscores und Hilfe anhand gerenderter Screenshots geprüft.

Produktions-Build und Diff-Prüfung erfolgreich; Offline-Paket weiterhin 22 Dateien. Bestehende CSV bytegleich, keine Rohquellen- oder Nutzerspielstandänderungen. Migration 004 im echten Supabase-Projekt erfolgreich; Ausführungsrechte nachgewiesen. Reale Zwei-Spieler-/Geräteabnahme und physische PWA-/Offline-Prüfung bleiben offen. Kein Asia-Fragenimport oder endgültiges Asia-Icon ohne die angekündigte Quelle.

## Animierte Lernpfad-Freischaltung

26.09.2026: 79 Logik-/Datenbanktests und alle 41 Chromium-Prüfungen im Gesamtlauf erfolgreich. Vier neue End-to-End-Fälle erzeugen in isolierten Testständen echte Übergänge: Mittel, Schwer, beide gleichzeitig sowie ein geratener Treffer ohne Freischaltung. Alle werden offline durchgespielt. Nachweis für genau acht Fanfaren-Noten zusätzlich zum Antwortsignal, optionale Vibration, Stummschaltung, reduzierte Bewegung, Fokus im Dialog und Rückgabe per Schaltfläche/Escape. Rundenrückblick und Neuladen wiederholen die Feier nicht. Mobile Ansicht bei 320 Pixeln und Axe ohne Befund; gerenderten Erfolgsdialog visuell geprüft. Kleine abschließende Textkorrektur und Screenshot nach der Einblendung mit erneuter gezielter Prüfung aller vier Fälle.

Produktions-Build erfolgreich, 22 Offline-Dateien; keine neue Medienabhängigkeit. Bekannte Bündelgrößenwarnung bleibt. Keine Änderung an Rohfragen, Speicherformat oder realen Nutzerfortschritten. Physische Hör-/Vibrationsprüfung weiterhin offen.

## 26.09.2026 — Sammlungsfilter und nutzbare Vibrationsoption

„Alle“ / „Mit beantworteten Fragen“ filtert ausschließlich die Detailkarten nach vorhandenen gewählten Antworten. Richtige, falsche und geratene Antworten zählen; reine Zeitabläufe nicht. Leerer Zustand bietet Rückkehr zu allen Einträgen. Ursache des blockierten Vibrationsschalters bestätigt: disabled war an supportsHaptics gekoppelt. Präferenz jetzt unabhängig davon speicherbar; fehlende Schnittstelle, abgelehnte Ausgabe und angefordertes Signal verständlich erklärt.

81 Logik-/Datenbanktests, Produktions-Build und alle 44 Chromium-Prüfungen im vollständigen Lauf erfolgreich. Nachweis für richtige/falsche Antworten, historische Varianten, Leerzustand, unveränderten gespeicherten Testfortschritt, 320-Pixel-Ansicht ohne Überlauf und Axe. Mobile Filteransicht visuell geprüft. Vibration bei fehlender API, false-Rückgabe und Ausnahme geprüft; Ein-/Ausschalten bleibt über Neuladen erhalten, vorhandener Test für unterstützte Ausgabe ebenfalls erfolgreich. Keine Änderung an CSV, Lernregeln oder Speicherformat. Testzeitstempel der Importberichte nach Inhaltsvergleich zurückgesetzt. Physische Vibration auf einem Smartphone weiterhin nicht geprüft.

## 26.09.2026 — Neue Ziele beim Entdecken und kompakte mobile Antwortansicht

Auf Nutzerwunsch Entdecken auf tatsächlich unbearbeitete Wissensziele ausgerichtet. Bei ausreichend neuen Zielen keine Wiederholungen; andernfalls bevorzugt ältere Ziele außerhalb der drei letzten Runden, insgesamt weiterhin höchstens fünf fällige Wiederholungen. Höchste erworbene Stufe Mittel/Schwer erhält bis zur Hälfte der Plätze als Einführung, solange dort weniger als fünf Ziele bearbeitet wurden. Bestehende Filter, Variantenidentität, aktive Rundensnapshots, Lernfortschritt und Rekordwertung erhalten. Besser werden bleibt der gezielte Wiederholungsmodus. Hilfe und Lernvertrag angepasst.

Nach einer Antwort sind alle vier Möglichkeiten aufklappbar; gewählte/richtige Antwort, Erklärung und Merksatz bleiben sichtbar. Auf Handybreite ersetzt eine feste untere Weiter-/Geraten-Leiste die Hauptnavigation während der Runde; Pause bleibt oben. Sicherheitsabstand am iPhone berücksichtigt. Lange Inhalte dürfen weiter scrollen, Weiter bleibt erreichbar.

87 Logik-/Datenbanktests, Build und alle 48 Browserprüfungen (46 Chromium, zwei WebKit mit iPhone-Profil) im abschließenden Gesamtlauf erfolgreich. Sechs Auswahlfälle prüfen neue Ziele, drei direkte Sci-Fi-Runden ohne Wiederholung, Drei-Runden-Rückstellung mit kleinem Restbestand, echte Mittel-/Schwer-Einführung, Filter, historische Runden und unveränderte Wiederholungs-/Rekordmodi. Browsernachweis bei 390×664 und 320×568: richtige/falsche Antwort, Geraten, aufklappbare Antworten/Vertiefung, sichtbare und unverdeckte Weiter-Aktion ohne automatisches Scrollen durch den Klick sowie Rundenabschluss. Axe und gerenderte mobile Screenshots geprüft. Zwei ältere Tests zunächst an die neue Position der Weiter-Aktion bzw. den mobilen Pause-Zugang angepasst; finaler Gesamtlauf erfolgreich. Keine Änderungen an Roh-CSV, Speicherformat, Authentifizierung oder Datenbank. WebKit-Test ersetzt keine physische iPhone-Abnahme. Bekannte Bündelgrößenwarnung unverändert.

## 26.09.2026 — Kompakter Kopf, Genre-Bilder und robuste Ranglisten

Kontoname und normale Online-Speicherbestätigung stehen nur noch im Profil; online bleibt kein leerer Kopfbereich. Offline-Sicherung und Konflikte bleiben sichtbar. Genreauswahl bietet „Alle Genres abwählen“ und die vorhandenen PNG-Illustrationen in kleiner Größe. Filmkarten verwenden passende Genre-Bilder, bei mehreren Genres mehrere Motive. Wartende Updates werden außerhalb aktiver Runden sichtbar angekündigt, ohne eine Runde zwangsweise neu zu laden.

Ranglistenanfragen enden spätestens nach zehn Sekunden mit dem vorhandenen Fehlerhinweis und Wiederholungsmöglichkeit. Geprüft für Kategorien, Rekordwerte und Spielerleistungen, einschließlich erfolgreichem Wiederholen. Die alte Oberfläche mit freiwilliger Freigabe gehörte zu einer überholten Offline-Version; der Nutzer bestätigte inzwischen die aktuelle Version. Keine Datenbankänderung.

Final vollständig erfolgreich: 87 Logik-/Persistenz-/Datenbanktests, Produktions-Build, 50 Browserprüfungen (48 Chromium, zwei WebKit mit iPhone-Profil). Neue Prüfung bei 320 × 740 px: alle Genres abwählen, Start gesperrt bei leerer Auswahl, einzelnes Genre und alle Genres erneut wählen; PNG-Bilder geladen, Filmkarte mit Genre-Bild, kein horizontaler Überlauf und Axe ohne Befund. Gerenderte Auswahl und Sammlung visuell geprüft. Profilstatus, globaler Offlinehinweis, Wiederaufnahme und sicheres Updateverhalten ebenfalls geprüft. Ein erster Test deckte eine fehlende Zeitbegrenzung bei Spielerleistungen auf; korrigiert. Ein vorübergehender Chromium-Ressourcenfehler trat im abschließenden vollständigen Lauf nicht mehr auf.

Roh-CSV, Genre-Assets und Supabase-Migrationen unverändert. Importbericht-Zeitstempel nach Inhaltsvergleich zurückgesetzt. Tests ausschließlich mit isolierten Daten; keine echten Spielstände verändert. Physisches iPhone und echte angemeldete Live-Ranglisten nicht zusätzlich geprüft.


## 26.09.2026 — Kompakter Spieleinstieg und Classics

Große Einstiegswerbung entfernt, Losspielen unmittelbar unter der Moduswahl mit Auswahlzusammenfassung; Fortsetzen ebenfalls direkt erreichbar. Gleich breite Genre-Felder, freie Stufenwahl unter einem aufklappbaren Bereich; normaler Lernpfad nutzt automatisch sämtliche freigeschalteten Stufen. Unabhängig aufklappbare Stufenfortschritte verwenden dieselben PNG-Motive. Kleine neue Genres erklären die derzeit mangels 20 Zielen nicht erreichbare Freischaltung.

Classics als zusätzliche Kategorie mit Genre-/Filmfiltern umgesetzt. 180 neue Fragen strukturell vollständig akzeptiert, 150 Ziele/30 Varianten/25 Filme. 225 Bestandsreferenzen passend ergänzt; 33 fehlen (12 RomCom, 21 Martial Arts), keine abweichenden Referenzen. Gesamtbestand 1.440 Fragen/1.200 Ziele/188 Filmthemen/zehn Genres. Classics umfasst 405 Fragen/336 Ziele/57 Filme, keine zweite Lernidentität. Vier neue transparente Motive für Abenteuer, Musik, Thriller und Classics, vorhandene Bilder unverändert.

Final: 93 Logik-/Persistenz-/Datenbanktests erfolgreich, Produktions-Build erfolgreich. Alle 51 Browserfälle bestanden (49 Chromium, zwei WebKit mit iPhone-Profil): 50 im letzten vollständigen Lauf; der neue kombinierte Einstiegs-/Classics-Fall nach Korrektur seines Optionsbutton-Locators separat erfolgreich. Vorherige Testanpassungen betreffen den verlegten Highscore-Zugang und das asynchrone Speichern des Freigabeschalters. Keine verbleibenden Produktfehler aus diesen Läufen. Neue Prüfung: Start vollständig oberhalb 600 px bei 320 × 740, gleich breite Genre-Auswahl, alle zehn Stufenbilder geladen, Rückkehr von nur Schwer zur automatischen Auswahl, Classics + Western, keine doppelten Fragen, Offline-Neuladen und Axe ohne Befund. Einstieg, Genre-Raster und Stufenfortschritt anhand gerenderter Bilder visuell geprüft.

Zusätzliche Logikprüfungen: alle Zuordnungen und Quellhashes, wiederholte Mengenergänzung, abweichende Referenzen, unveränderte alte Rundensnapshots, gemeinsame Lernidentität, Backup-Annahme bei erlaubten Tags und Ablehnung manipulierter Texte, Sci-Fi-Normalisierung mit erhaltenem Quellwert. Ein erster Test zeigte gemeinsame Objektreferenzen zwischen Fragenbestand und alter Runde; Ergänzung ersetzt nun ausschließlich Bestandsobjekte. Erweiterung älterer Spielstände mit ein bis sieben Paketen geprüft. Sieben historische Importberichte nach Inhaltsvergleich nur bezüglich Testzeitstempel zurückgesetzt.

Rohdateien bytegleich zu den gelieferten SHA-256-Prüfsummen; keine Änderungen an bestehenden Rohquellen, Supabase-Migrationen oder echten Nutzerdaten. Keine erneute unabhängige Faktenprüfung der Filmsätze und keine physische iPhone-/PWA-Abnahme. Arthouse und die fehlenden Pakete bleiben offen.


## 26.09.2026 — Persönliche Fragenstatistik im Lernmodus

Entdecken und Besser werden zeigen die Anzahl beantworteter, richtiger und falscher Antworten zur konkreten Frage direkt unter dem Fragetext. Aufklappbar: Zeitabläufe ohne Antwort, richtige geratene Treffer und gemeinsame Bilanz aller Wiederholungsvarianten. Alle vorhandenen Antwortereignisse zählen, auch aus Rekord- und abgebrochenen Runden. Die aktuelle Antwort wird nach dem Speichern einbezogen; Anzeigen und Neuladen erzeugen keine Zählung. Die Variantenbilanz nutzt die gemeinsame Wissensziel-ID. Keine zusätzlichen Speicherfelder, Datenbankänderung oder Fortschrittsmigration.

95 Logik-/Datenbanktests, Produktions-Build und alle 53 Browserprüfungen im vollständigen Lauf erfolgreich (51 Chromium, zwei WebKit mit iPhone-Profil). Nach abschließender sprachlicher Korrektur Build und beide neuen Browserfälle erneut erfolgreich. Neue Fälle prüfen beide Lernmodi, konkrete Frage versus historische Variante, richtig/falsch/geraten/Zeitablauf, Aktualisierung nach Antwort, Neuladen ohne Doppelzählung, keine Anzeige in Rekordrunden, Axe, 320-Pixel-Breite und erreichbaren Abschlussbutton. Neue mobile Ansicht anhand gerendertem Screenshot visuell geprüft; bestehende mobilen Weiter-/Offline-/Kontosicherungsprüfungen weiterhin erfolgreich. Bestehende Importberichte nach Inhaltsvergleich zurückgesetzt.

Rohquellen, Nutzerdaten und Lernregeln unverändert. Keine neue physische iPhone-Prüfung und keine Änderung der bereits bekannten Hosting-/Kontendienstgrenzen.

## 26.09.2026 — Zeitpunkt der Fragenstatistik einstellbar

Standard „Nach der Antwort“, alternativ „Immer anzeigen“ und „Ausblenden“ unter Profil → Optionen. Optionales settings.questionHistory mit Rückfall auf after, über bestehende Sicherungswege erhalten.

95 Logik-/Datenbanktests und Produktions-Build erfolgreich. Alle 53 Browserfälle erfolgreich: 51 im vollständigen Lauf, beide erweiterten Statistikfälle nach Korrektur des Optionsbutton-Locators gezielt erneut bestanden. Die Fälle prüfen ältere Spielstände ohne Einstellung, Standard erst nach Antwort, alle drei Anzeigeoptionen, Speicherung über Neuladen, aktuelle Antwort inklusive und unveränderte Variantenbilanz; Rekordrunden bleiben ohne Anzeige. Kein Produktfehler aus dem ersten Lauf, keine Änderungen an Rohquellen, Ereignissen oder Lernfortschritt.

## 26.09.2026 — Martial Arts, Rom-Com und Arthouse

540 neue Fragen/450 Ziele aus drei Paketen eingebunden; Rohdateien sowie öffentliche und Build-Kopien bytegleich. Alle bestehenden CSV unverändert. Gesamt 1.980 Fragen/1.650 Ziele/258 Film- und Reihenthemen/zwölf Genres. Die Bezeichnung Martial Arts & Asia-Film folgt dem breiten Inhalt der Quelle; RomCom im Arthouse-Paket wird mit erhaltenem Quellwert zu Rom-Com normalisiert.

Alle 258 Classics-Referenzen jetzt vorhanden, darunter die zuvor fehlenden 33. Alle 126 Arthouse-Referenzen passend; keine fehlenden oder abweichenden IDs, alle referenzierten Quellhashes passen. Kategorieansichten Classics (438 Fragen/360 Ziele/61 Filme) und Arthouse (306/258/44) überlappen bei 48 Fragen; die gemeinsame Auswahl umfasst 696 Fragen ohne doppelte Identitäten. Bestehende Tags werden als Mengenergänzung erhalten, Rundensnapshots nicht verändert. Keine Datenbankmigration oder Eingriffe in persönliche Spielstände.

Drei neue transparente Genre-/Kategoriebilder mit integriertem image_gen erzeugt und als Originale eingebunden, visuell und Alpha geprüft. Themenansicht auf Desktop und beide Kategorien auf 320-Pixel-Breite anhand gerenderter Screenshots geprüft. Hilfe erklärt kuratierte Kategorien und ODER-Kombination innerhalb der Genre-/Filmfilter.

103 Logik-/Datenbanktests, Produktions-Build und alle 56 Browserfälle erfolgreich (54 Chromium, zwei WebKit/iPhone-Profil): 55 im letzten vollständigen Lauf, der Rekordübersichtstest nach Aktualisierung seiner festen Genreauswahl gezielt nachgeprüft. Ein erster Lauf traf auf alte Paketlisten/Zählwerte in Testhilfen und einen falschen Screenshot-Locator; diese Tests wurden auf den erweiterten Bestand angepasst. Kein verbleibender Produktfehler aus den Läufen. Die sechs Kategorietests wurden nach Ergänzung der kombinierten Backup-Prüfung erneut erfolgreich ausgeführt.

Zusätzliche Prüfungen: vollständiger Import samt Antworten/Feedback und Variantenverweisen, parallele Paketergänzung älterer Stände mit einem bis zehn Paketen, bisheriger Acht-Pakete-Stand auch im Browser, Kategorie-Mehrfachzuordnung/Fehlreferenzen/Idempotenz, genreübergreifende Deduplizierung, gemeinsame Lernidentität, historische Rundensnapshots und Backup nach Kategorienwechsel. Browser: Arthouse allein/gemeinsam mit Classics plus Rom-Com und Amélie, Bilder, Axe, Offline-Neuladen und erhaltene Antwortstatistik. Keine zusätzliche unabhängige fachliche Filmprüfung und keine physische Smartphone-Abnahme.

## 26.09.2026 — Spielmodus-Illustrationen und Kino-Kulisse

Entdecken, Besser werden und Rekordrunde erhalten drei mit image_gen erzeugte transparente Originalillustrationen. Eine helle Kino-Kulisse mit Vorhängen rahmt ausschließlich den Spieleinstieg; Spielansicht und sämtliche Daten bleiben unverändert. Drei gleichmäßig ausgerichtete Moduskarten, Auswahlmarkierung und sichtbare Beschriftung; reduzierte Bewegung berücksichtigt. Alle vier Bilddateien im Offline-Paket.

103 Logik-/Datenbanktests, Produktions-Build und alle 56 Browserfälle im vollständigen Lauf erfolgreich. Nach abschließender mobiler Ausrichtung und Hintergrundanpassung Build und erweiterter Einstiegstest erneut erfolgreich. Desktop (1440 px) und schmale Handyansicht (320 px) anhand gerenderter Screenshots geprüft. Der Einstiegstest prüft geladene Bilder, Hintergrund, Losspielen oberhalb 600 px, Genre-Raster, Tastatur-/ARIA-Verträge über bestehende Tests, Axe sowie Bilder und Hintergrund nach Offline-Neuladen. Kein Eingriff in Nutzerdaten, Rohquellen, Lernregeln oder Datenbank. Physisches Smartphone weiterhin separat abzunehmen.

## 26.09.2026 — Jahres-/Regiefragen, Filmdaten und Rundenfortschritt

300 Jahresfragen und 287 neue Regiefragen ergänzen die bisherigen Genres; 13 vorhandene Regiefragen und ihre Lernziele bleiben erhalten. Gesamt 2.567 Fragen/2.237 Ziele. Quellenabgleich für 300 Filmfassungen, Produktionsländer/-regionen und 111 konkrete Reihenpositionen; besondere Credits und Veröffentlichungsjahre dokumentiert. Keine unabhängige Vollprüfung aller Filmhandlungen, Schwierigkeit redaktionell. Roh-CSV unverändert.

Jahresalternativen variieren zwischen Runden, bleiben im gespeicherten Rundensnapshot stabil. Enge Backup-Validierung erhält dynamische Antworten und weist manipulierte Antworten, Lösung, Feedback und Fragetexte zurück. Bestehende Ereignisse, Rundensnapshots und Lernstände unverändert, Ergänzung idempotent. Nach der Antwort geschlossene Klappe „Filmdaten“; keine Lösungshinweise vor Beantwortung. Fortschrittsfelder grün/✓, rot/× bzw. Zeitablauf/–, grau/offen und deutlich umrahmte aktuelle Frage, mit Screenreader-Beschriftungen.

109 Logik-/Datenbanktests und Produktions-Build erfolgreich. Alle 60 Browserfälle geprüft (58 Chromium, zwei WebKit/iPhone-Profil): 59 im vollständigen Abschlusslauf, Fortschrittsanzeige nach Ergänzung des im Test fehlenden Weiter-Klicks gezielt erfolgreich nachgeprüft. Ältere Testhilfen lesen jetzt den tatsächlichen Rundensnapshot und kennen den erweiterten Fragenbestand. Neue Fälle prüfen Jahresfrage, Regiefrage und historische Originalfrage einschließlich Offline-Fortsetzen, stabilen Alternativen, Filmdaten, Lernstand und JSON-Validierung. Fortschrittsanzeige mit richtig/falsch/Zeitablauf/aktuell/offen bei 320 Pixeln, Farbwerten, Symbolen, Wechsel nach Antwort, ohne Überlauf und mit Axe geprüft; Screenshot visuell abgenommen. Auch die neuen Filmfragen und Filmdaten wurden anhand gerenderter Handyansichten geprüft. git diff --check erfolgreich. Keine Änderungen am Supabase-Schema oder an realen Nutzerdaten. Physische Smartphone-Abnahme bleibt offen.

## 27.09.2026 — Speicherstatus ohne Layoutsprünge

Die aus- und eingeblendete globale Fehlerzeile verursachte Layoutsprünge. Ersetzt durch feste Statusmarkierungen am Profil und neben dem Spielmodus: grün/✓ bestätigt, blau/↑ ausstehend/laufend, orange/! unbestätigt. In der Runde öffnen sich Details und erneuter Versuch über dem Inhalt. Keine zusätzliche Kopfzeile bei Verbindungswechseln angemeldeter Konten; Gastmodus behält den Offline-Hinweis. Ausführliche Hinweise im Profil unter „Konto & Speicherung“. Bekannte HTTP-Fehler verständlicher unterschieden, keine internen Servertexte sichtbar.

Schnelle lokale Änderungen werden vor dem Upload in einem festen 800-ms-Fenster gebündelt; lokales Speichern bleibt unmittelbar. Hintergrundwechsel und ausdrücklicher Versuch leeren die Warteschlange ohne Wartefenster. Während Folgeänderungen ausstehen, wird kein vorzeitig grüner Zustand gezeigt. Revisionsschutz, Wiederholungen und verlorene Bestätigungen bleiben geprüft. Weiterhin vollständige Spielstandsübertragung: synthetischer leerer Kontostand mit 2.567 Fragen rund 8 MB. Die konkrete Ursache der vom Nutzer gemeldeten Fehlschläge wurde nicht anhand echter Kontodaten festgestellt.

111 Logik-/Datenbanktests und Produktions-Build erfolgreich. Alle 60 Browserfälle geprüft: 59 im vollständigen Lauf; der um mobile Geometrieprüfungen erweiterte Kontentest nach Anpassung der Navigation an die mobile Ansicht erfolgreich. Nach Verschieben des ausführlichen Profilhinweises alle neun Kontentests sowie der Navigationstest erneut erfolgreich. Der Kontentest prüft exakt identische Positionen von Fragenkarte, Statusknopf und Scrollposition beim Wechsel saving/offline/saved, bei Verbindungsereignissen und geöffneten Details auf 320 Pixeln; zusätzlich Axe, visuelle Screenshot-Abnahme, Nachspeichern, zweites Gerät und Revisionskonflikt. Keine Änderungen an Rohfragen, Lernständen oder Datenbankrechten. Physischer Handy-Netzwerktest bleibt offen.

## 27.09.2026 — Themen zu Filmblöcken und Favoritenerklärung

Doppelte große Genrekarten am Ende von Spielen entfernt; Rundenauswahl, Stufen und Filmverfeinerung bleiben vorhanden. Jede Genre- und Kategorienkarte unter Themen führt zu passenden Film-/Reihenblöcken mit Rückweg. Kartenstatistiken zählen nur die passenden Wissensziel-IDs; Filmwahl übernimmt Genre bzw. kuratierte Kategorie in die Rundenvorbereitung. Favoriten unverändert als maximal drei nach oben sortierte Sammlungsblöcke, jetzt mit Erklärung ohne Einfluss auf Fragen, Fortschritt oder Punkte.

111 Logik-/Datenbanktests, Produktions-Build und alle 61 Browserfälle erfolgreich geprüft (59 Chromium, zwei WebKit/iPhone-Profil): 60 im vollständigen Lauf; der neue Browsing-Test nach Korrektur seines verkürzten Amélie-Titels gezielt bestanden. Er prüft Horror, Classics und Arthouse, vollständige passende Kartenlisten, gefilterte Zielzahlen, Rückweg, erhaltenen Spielstand, Genres/Kategorien/Film beim Start sowie Axe und fehlenden Überlauf auf 320 Pixeln. Screenshot der Filmübersicht visuell geprüft. Bestehende Sammlungsfilter/Favoriten, Offline und Rundenspeicherung in den bisherigen Fällen weiterhin erfolgreich. git diff --check erfolgreich. Keine Änderungen an Rohquellen, Lernständen, Datenbank oder Speicherung; physische Smartphone-Abnahme offen.


## 27.09.2026 — Auswahl speichern, Favoriten entfernen und Online-Sicherung verkleinern

Favoritenfunktion einschließlich Sortierung entfernt; historische Werte ausschließlich zur Sicherungskompatibilität erhalten. Keine neue Auswahl einzelner Filme/Reihen mehr, auch nicht über Filmkarten oder am Rundenende. Filmblöcke bleiben Fortschrittsübersichten, historische Runden bleiben fortsetzbar. Rundenvorbereitung (Modus, Genres, Zusatzkategorien, manuelle Stufen) wird transaktional pro Gast/Konto gespeichert, einschließlich bewusster leerer Auswahl. Vorläufige Klickanzeige gelangt nicht vor erfolgreichem Speichern in die Kontosynchronisierung.

Online-Sicherung mit komprimiertem vollständigem Katalog und versionsgebundenen Fragenverweisen; Antwortvarianten bleiben erhalten. Synthetischer Katalog mit 2.567 Fragen: 8.006.151 auf 1.535.197 Bytes (80,8 % weniger Übertragungsgröße). Rundentransport enthält kleine Ergebnisfelder für unveränderte SQL-Ranglistenprojektionen. Gemeinsame Highscores speichern bereits nur Ergebnisse; persönliche Gruppenberechnung wird bei Filterwechseln wiederverwendet. Lokale Stände/JSON-Vollbackups bleiben unverändert; alte Online-Stände lesbar, für neue Kompaktstände aktualisierten App-Build verwenden. Keine SQL-Migration, keine Nutzerdaten oder Rohquellen verändert.

116 Logik-/Datenbanktests, Produktions-Build, vollständiger Lauf aller 62 Browserprüfungen (60 Chromium, zwei WebKit/iPhone-Profil) und git diff --check erfolgreich. Neu geprüft: alte Backups, leere Auswahl, Neuladen vor einer Runde, Stufenwechsel, Themenbrowsing ohne Fortschrittsänderung, automatische Übernahme auf ein zweites simuliertes Gerät, verlustfreier Kompakt-Rückweg einschließlich variabler Jahresantworten und unverändertem Synchronisationsfingerabdruck, defekte Kompression/Verweise sowie identische Highscores und Spielerleistungen in PGlite vor/nach Kompaktkodierung. Bestehende mobile, Offline-, Import-, Wiederherstellungs- und Kontentests ebenfalls erfolgreich. Physisches Smartphone und reale Zwei-Geräte-Abnahme weiterhin offen.

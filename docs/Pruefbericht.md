# Prüfnachweis – 26. September 2026

## Umgebung und Ergebnis

Windows, Node 24.19.0, npm 11.17.0, React 19, TypeScript 5.9, Vite 7.3.6, Vitest 4.1.11, Playwright Chromium 153. Produktions-Build erfolgreich, zuletzt 81 Logik-/Persistenz-/Datenbanktests und 44 Browserprüfungen im vollständigen Lauf erfolgreich. Nach Ergänzung von Supabase SDK und PGlite `npm audit` erneut ausgeführt: 0 bekannte Schwachstellen. Tests in separaten Browserprofilen; kontrollierte Testdaten wurden nicht in einen Nutzerbrowser übernommen.

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

# Projektlog

## 2026-09-26 – Projektanlage

Projekt Wissensquiz mit Projektanweisungen, lokaler Auflösung, Ausschlüssen und Wissensbasis vorbereitet. Git-Modell: lokal ohne Remote, Integrationsbranch `main`. Anforderungen und Technologie-Stack bleiben offen. Die Registrierung des vorhandenen Ordners in der Codex-App steht noch aus.

## 2026-09-26 – Spielbare Testversion und Fragenpaket

React-/TypeScript-App mit drei Spielmodi, Erklärungen, Lernheuristik pro Wissensziel, Expertenalbum, Erfahrung und lokalen Rekorden umgesetzt. IndexedDB-Transaktionen sichern Runden und eindeutige Lernereignisse; CSV-Import, validierte JSON-Sicherung und lokale Fragenmeldungen ergänzen den Testbetrieb.

Die nachgelieferte CSV unverändert als Rohquelle abgelegt und vollständig strukturell ausgewertet: 180 akzeptierte Fragen, 150 Wissensziele, 30 Varianten, keine Ausschlüsse. Vorbereitete Demo-Fragen bleiben nur separates Formatbeispiel. Keine eigenen Ergänzungen der gelieferten Filmerklärungen.

31 automatisierte Logik-/Persistenztests und 9 Browserprüfungen bestanden. Bei Offlineprüfung einen Cache-Mismatch durch `Vary: Origin` gefunden und für statische Same-Origin-Dateien behoben. Dokumentierte Verträge in `docs/`, Navigation aktualisiert. Lokale Vorschau verfügbar, HTTPS-Smartphone-Installation und unabhängige Faktenprüfung der Filmangaben noch offen. Keine Veröffentlichung und kein Remote eingerichtet.

## 2026-09-26 – Sites als Hostingoption geprüft

Auf Nutzerhinweis die vorhandenen Sites-Werkzeuge und offizielle Dokumentation geprüft. Sites unterstützt bestehende Webprojekte und statische Builds und eignet sich grundsätzlich für diese App. Die bisherige Beschränkung auf lokale Vorschau bedeutet nicht, dass kein Hostingweg verfügbar ist. README um diese Option, Zugriffsschutz sowie Grenzen bei PWA-Prüfung und gerätelokalem Fortschritt ergänzt. Noch keine Registrierung oder Veröffentlichung durchgeführt.

## 2026-09-26 – Sites-Veröffentlichung beauftragt

Nutzer beauftragt die Bereitstellung der ersten Testversion über Sites und eine Test-URL. Private Site einmalig registriert und Projekt-ID in `.openai/hosting.json` gespeichert. Vorhandene React-App bleibt erhalten; veröffentlicht wird `dist/` ohne Backend oder Übertragung lokaler Spielstände. Der erfolgreiche Live-Stand wird nach Abschluss separat dokumentiert. Keine Erweiterung des Zugriffskreises beauftragt.

## 2026-09-26 – Sites und Action-Paket

Die private Sites-Veröffentlichung der Sci-Fi-Version wurde erfolgreich bestätigt. Die nachgelieferte Action-CSV unverändert abgelegt und vollständig geprüft: 180 weitere Fragen, 150 Ziele, 30 Varianten, 17 Themen; keine Ausschlüsse oder ID-Konflikte. Zusammen 360 Fragen, 300 Ziele und 56 Themen. Transaktionale Paketergänzung erhält vorhandenen Fortschritt und laufende Runden. 33 Logiktests und zehn Browserprüfungen erfolgreich. Veröffentlichungsablauf samt Windows-Besonderheiten in docs/Sites-Betrieb.md dokumentiert. Keine unabhängige Faktenprüfung und keine Prüfung auf einem physischen Smartphone.

## 2026-09-26 – Horror-Paket integriert

Die nachgelieferte Horror-CSV unverändert als Rohquelle und öffentliches Fragenpaket übernommen. Vollständig mit dem App-Parser ausgewertet: 180 Fragen, 150 Wissensziele, 30 Varianten, 20 Themen; keine Ausschlüsse, Warnungen oder ID-Konflikte. Insgesamt 540 Fragen, 450 Ziele und 76 Themen. Bestehende Sci-Fi-/Action-Spielstände werden transaktional ergänzt, Horror-Inhalte in den Offline-Cache aufgenommen. 35 Logik-/Persistenztests, Produktions-Build und elf Browserprüfungen erfolgreich, darunter beide Altbestände und eine offline fortgesetzte Halloween-Runde. Originaldatei und beide Kopien haben denselben SHA-256-Wert. Keine unabhängige Faktenprüfung oder neue Sites-Veröffentlichung; bestehende Projekt-ID und Zugriff unverändert.

## 2026-09-26 – Horror-Version privat veröffentlicht

Auf Nutzerauftrag den geprüften Horror-Stand lokal als `f871f70` committet und über die vorhandene Sites-Quellverknüpfung veröffentlicht. Version 3, Deployment `appgdep_6ab7a24215f48191b7c425ba389f75d8`, Status `succeeded`; bestehende URL und privater Eigentümerzugriff erhalten. Live-Startseite, Worker und Horror-CSV per authentifiziertem HTTP-Abruf geprüft: Status 200, CSV bytegleich, Horror im Offline-Manifest enthalten. Der lokale Sites-Helfer fehlte; stattdessen die verfügbaren nativen Sites-Schnittstellen mit kurzlebiger Git-Authentifizierung im Speicher genutzt. Kein dauerhafter Remote und keine GitHub-Verknüpfung. Externe Einladungen sind für die Site verfügbar; Anleitung dokumentiert, noch keine Empfänger hinzugefügt. Smartphone/PWA unter der Live-Adresse weiterhin offen.

## 2026-09-26 – Genres und Schwierigkeitsstufen kombinieren

Nutzerfeedback umgesetzt: große Filmgenres als Hauptauswahl, Mehrfachauswahl von Genres und Stufen, Film-/Reihenauswahl optional aufklappbar. Themenübersicht und Startseitenkarten auf Genres umgestellt; Sammlung und bestehende Favoriten erhalten. Auswahl im Rundensnapshot gespeichert, kanonische Rekordkategorien und abwärtskompatible Sicherungsprüfung ergänzt. 42 Logik-/Persistenztests und zwölf Browserprüfungen erfolgreich, mobile Auswahl visuell geprüft. Konten, gemeinsame Spielstände und serverseitige Bestenliste als Entwurf dokumentiert; Nutzer wünscht eigene Anmeldung unabhängig von ChatGPT. Noch keine Datenbank, Cloud-Migration oder Zugriffsänderung.

## 2026-09-26 – Mehrfachauswahl veröffentlicht und Rückmeldungen ergänzt

Mehrfachauswahl als Sites-Version 4 aus Commit `ffdeeb6989fb5a98850e0cc0068d2b9aa8e97462` veröffentlicht, Deployment `appgdep_6ab7a53ad8a88191bb0cdb6cfc05ac20` erfolgreich. Live-JavaScript, CSS und Service Worker bytegleich mit dem Build; Zugriff privat erhalten.

Weiteres Nutzerfeedback: kurze Soundeffekte und optionale Vibration implementiert, Ton jederzeit abschaltbar und Präferenzen lokal/sicherbar. Genre-SVGs sowie Schloss-/Sternmedaille für das bisher einzige Sci-Fi-Abzeichen ergänzt; keine neuen Vergaberegeln erfunden. Bei der ergänzenden Prüfung einen Darstellungsfehler der Rekordübersicht für neue Filterkategorien gefunden und behoben; Ansicht liest nun die zugehörige Runde statt alte Schlüsselpositionen. 43 Logik-/Persistenztests und 15 Browserprüfungen erfolgreich (Soundprüfung nach Korrektur einer zu frühen Testabfrage gezielt wiederholt). Keine physische Hör-/Vibrationsprüfung oder neue Kontospeicherung.

Anschließend als private Sites-Version 5 veröffentlicht: Commit `2e99f637538370d1a5a9faa9a856a8713860ffdd`, Deployment `appgdep_6ab7a740aaf08191b7cc7c38f569006f`, Status `succeeded`. Live-Startseite referenziert den aktuellen Build; JS, CSS und Worker authentifiziert mit HTTP 200 und bytegleich geprüft. Zugriff und URL unverändert. Konten unabhängig von ChatGPT und gemeinsame Bestenliste bleiben als noch nicht implementierter Entwurf festgehalten.

## 2026-09-26 – Fantasy und weitere Hinweise beim Spielen

Fantasy-Rohquelle unverändert übernommen: 180 Fragen, 150 Ziele, 30 Varianten und zwölf Themen, keine Importkonflikte. Insgesamt 720 Fragen, 600 Ziele und 88 Themen. Vorhandene Spielstände bleiben bei Paketerweiterung erhalten; Fantasy auch offline verfügbar.

Nutzer vermisst Schauspielernamen in der Horror-Vertiefung. Konkrete Lücke in `HOR-L-045` bestätigt; Besetzung der Warrens und Perrons für Conjuring (2013) im AFI-Katalog geprüft und separat in der Erklärung ergänzt. Originaltexte und gespeicherte Rundensnapshots bleiben unverändert. Darstellernamen bei zentralen Figuren als redaktionellen Maßstab dokumentiert; systematische Überarbeitung aller Genres noch offen. Auf weiteres Feedback hin die Schwierigkeit der einzelnen Frage vor und nach der Antwort sichtbar gemacht.

45 Logik-/Persistenztests, Produktions-Build und 18 Chromium-Prüfungen erfolgreich, einschließlich drei Altbeständen, Fantasy-Offlinebetrieb, Darstellerergänzung und Schwierigkeit. Mobile Fragenansicht visuell geprüft. Der offizielle Sites-Helfer ist wieder verfügbar; Veröffentlichung über den dokumentierten gebündelten Workflow vorbereitet.

Anschließend privat als Version 6 veröffentlicht: Quellcommit `44f6a2882948e5ea56b90b1377aa75ba16564968`, Deployment `appgdep_6ab7b115975481918fe0410551c6019e`, Status `succeeded`. URL und Zugriff unverändert, keine Testpersonen hinzugefügt. Git bewahrt CSV-Zeilenenden jetzt ausdrücklich ohne automatische Konvertierung; alle neun CSV-Dateien im Commit bytegleich mit den lokalen Dateien, bestehende Rohquellen inhaltlich unverändert. Keine zusätzliche Live-PWA-/Geräteprüfung.

## 26.09.2026 – Erklärungstiefe, Fragehinweise und Rekord-Bestenliste

- Alle 720 Fragen zu 125 Filmen auf fehlende Darstellernamen geprüft: 627 passende Ergänzungen, 64 bereits zugeordnet, 29 ohne zusätzliche einzelne gespielte Figur im Mittelpunkt. Quellen und Einzelentscheidungen dokumentiert. Film/Jahr, Frageversion und Inhalt schützen die Zuordnung; Roh-CSV und Spielstände unverändert. Besetzungsprüfung ist keine vollständige Faktenprüfung der Filmaussagen.
- Genre und Schwierigkeit pro Frage standardmäßig sichtbar, unabhängig abschaltbar; alte Sicherungen kompatibel.
- Persönliche Bestenliste aus sämtlichen abgeschlossenen Rekordrunden, filterbar nach Genre-Kombination, Stufen und Rundengröße. Eigene Ränge je bestehender Kategorie, Gleichstände, Datum, Treffer, Antwortzeit und Rundenrückblick. Bereits gespielte Runden automatisch enthalten, keine neue Speicherstruktur. Gemeinsame Konten/Bestenliste weiterhin offen.
- 51 Logik-/Speicherprüfungen, Build und 20 lokale Chromium-Prüfungen erfolgreich, mobile Bestenliste visuell geprüft. Geräte-/private Live-PWA-Grenzen bestehen fort. Veröffentlichung im bestehenden privaten Sites-Projekt folgt nach finaler Quellprüfung.

- Veröffentlichung desselben geprüften App-Stands `b043771740024602b28afb1180868732893cfcc8` erfolgreich: Deployment `appgdep_6ab7b95a04c48191a694ebfc92e40514`, Status `succeeded`, bestehende private URL erhalten. Native Browserübergabe ausgeführt; keine weitere Live-Geräteprüfung. Lokaler Arbeitsbranch bleibt `codex/spielbare-testversion`, keine Main-Integration oder GitHub-Verknüpfung.

## 26.09.2026 – Eigene Konten zur Einrichtung vorbereitet

Auf Auftrag eigene Anmeldung unabhängig von ChatGPT mit Spielername, E-Mail/Passwort, Verifikation und Reset umgesetzt. Nutzer hat noch keinen Kontodienst und wünscht Vorbereitung. Supabase-Anbindung, SQL-Migration mit Eigentümer-/Bestätigungsprüfung und RLS, Mailvorlagen und Schrittfolge ergänzt. Konten bleiben per Konfiguration deaktiviert; keine echten Konten oder Mails, keine Spielstände hochgeladen. Gastdaten unverändert, Kontostände je Projekt/Benutzer getrennt. Online-Sicherung und Laden ausdrücklich manuell mit Revisionsschutz, keine automatische Zusammenführung. Gemeinsame geprüfte Bestenliste bleibt Folgearbeit.

57 Logik-/Persistenz-/SQL-Tests, Produktions-Build und 25 unterschiedliche Browserprüfungen erfolgreich; Audit 0. Datenbanktest in Postgres/WASM mit Auth-Nachbildung, Browser mit simuliertem Kontodienst; keine echte Provider-/Mailabnahme. Echte Einrichtung sowie späterer unabhängiger Besucherzugang noch offen. Anleitung unter docs/Konten-Einrichtung.md. Bestehende private Sites-Freigabe erhalten.

Private Veröffentlichung anschließend erfolgreich: App-Commit `a34a0e0a0bff476d92f91b0bc9932a07b36ff923`, Deployment `appgdep_6ab7c027da548191adef4fe60691f08b`, Status `succeeded`. Kontoansicht live, Anmeldung weiterhin bewusst deaktiviert. Bestehende URL und Projekt-ID erhalten, keine Nutzerdaten übertragen. Browserübergabe erfolgt; kein zusätzlicher echter Mail-/Kontodiensttest.

## 26.09.2026 – Supabase-Projekt eingerichtet, Maildienst offen

Per beauftragter Browserbedienung Organisation Wissensquiz im Free-Tarif angelegt; Nutzer hat Projektpasswort selbst eingegeben und Projekt erstellt. Projekt nadhixddmpshndqpmzqi läuft in Frankfurt. Quiz-Migration nach Prüfung auf leere Zieltabelle transaktional erfolgreich ausgeführt; RLS, Policy und Rollenrechte per SQL im echten Projekt geprüft. E-Mail-Bestätigung aktiv, Mindestpasswortlänge zwölf Zeichen gespeichert, Linkablauf eine Stunde, exakte Live-/Redirect-Adresse gesetzt. Keine geheimen Schlüssel gelesen oder gespeichert, keine echten Quiz-Konten oder Mails angelegt.

Mailvorlagen im Free-Dashboard erst nach eigener SMTP-Anbindung bearbeitbar. Nutzer wünscht kostenlosen Versand ohne vorhandene Domain; Brevo Free recherchiert und Registrierung zur persönlichen Übernahme geöffnet. Konto-/Absenderverifikation, Versandfreigabe, SMTP, Vorlagen und echte Konten-/Mailtests bleiben offen. App-Konfiguration deaktiviert und Sites privat erhalten; keine neue Veröffentlichung nötig, da Anwendung unverändert. Projektanleitung und Status nachgezogen.

## 26.09.2026 – Brevo verbunden und private Kontenaktivierung vorbereitet

Brevo Free mit verifiziertem Absender eingerichtet. Nach ausdrücklicher Nutzerbestätigung SMTP-Schlüssel „Wissensquiz Supabase“ erstellt und ausschließlich im bestehenden Supabase-Projekt hinterlegt; kein Secret in Chat, Dateien oder Git. Ablauf 26.09.2027, zusätzliche 90-Tage-Inaktivitätsgrenze laut Brevo-Dialog. Deutsche Bestätigungs- und Reset-Vorlagen gespeichert. Anonymisiertes Tracking aktiviert; vollständige Tracking-Abschaltung in der Oberfläche nicht verfügbar, Linkweiterleitung muss tatsächlich getestet werden. Erste Mail und Zustellung noch offen; keine Quiz-Konten oder Online-Spielstände erzeugt.

Öffentliche Supabase-Konfiguration für privaten Eigentümertest aktiviert; Veröffentlichung vorbereitet. Deaktivierungsprüfung von produktiver Konfiguration entkoppelt. Erneut 57 Logik-/Datenbanktests, Build und 25 Browserprüfungen erfolgreich; Roh-CSV unverändert. Äußere Sites-Freigabe bleibt privat. Gebündelter Sites-Helfer aktuell nicht installiert; dokumentierter nativer Veröffentlichungsablauf wird verwendet, Sites-Quellbranch ist Vorfahr des lokalen Stands. Keine neue Site oder dauerhafter Git-Remote.

Private Aktivierung anschließend veröffentlicht: App-Commit `f115047ce8f4f75114a8204680feecb49e4b3057`, Deployment `appgdep_6ab7ca90deec8191ac5d8482f6f57fa4`, Status `succeeded`. Anmeldung und Registrierung im internen Live-Browser sichtbar. Registrierungsformular für persönliche Passwortwahl durch den Nutzer geöffnet; tatsächliche Registrierung, Mailzustellung und Reset noch nicht geprüft. Gaststände unverändert, keine Besucher ergänzt.

## 26.09.2026 – Fehler im ersten echten Registrierungstest eingegrenzt

Nutzer meldet geleertes Passwortfeld und generische Fehlermeldung nach Registrierung. Supabase-Auth-Protokoll zeigt bei beiden Versuchen HTTP 500 und SMTP `535 5.7.8 Authentication failed`; Ursache liegt in der Maildienst-Anmeldung, nicht in nachgewiesener zu geringer Passwortlänge. Browser-Zwischenablage lieferte nach Brevos Kopierbutton weiter vorherigen Text. Ersatzschlüssel direkt aus dem sichtbaren Brevo-Feld gelesen, Format geprüft, in Supabase gespeichert (Erfolgsmeldung) und ursprünglichen Schlüssel deaktiviert. Kein Secret in Dateien oder Git. Nutzer um erneuten eigenen Registrierungsversuch gebeten; erfolgreicher Versand noch nicht bestätigt. App-Code und Veröffentlichung unverändert.

## 26.09.2026 – Konten vereinfachen und Anmeldung prüfen

Auf Nutzerwunsch automatische Online-Sicherung und Laden bei Anmeldung/Neuladen umgesetzt; manuelle Kontosicherungsbuttons entfernt. Gastspielstand bleibt ausdrücklich auf diesem Gerät erhalten, Übernahme ins Konto nur nach Auswahl. Dauerhafte Synchronisierungsbelege, Wiederholungen bei Netzfehlern, Revisionskonflikte ohne stilles Überschreiben und Tab-Sperre schützen Fortschritte. Bestätigungs- und Reset-Seiten erklären die nächste Aktion und Abbruchfolgen. 63 Logik-/Datenbanktests, Build und 27 Browserprüfungen bestanden.

Nach korrigierter Brevo-Verbindung echte Bestätigungsmail empfangen und Kontoaktivierung im Supabase-Dashboard verifiziert. Smartphone-Anmeldung danach mit „Invalid login credentials“ abgewiesen; Nutzer bestätigt exakte Mail-Endung und wurde zum eigenen Passwort-Reset aufgefordert. Keine Passwörter eingesehen oder geändert. Öffentlicher Zugriff ohne vorgelagerte ChatGPT-Anmeldung ausdrücklich beauftragt; Veröffentlichungsnachweis folgt unter Sites-Betrieb.

## 26.09.2026 – Reset bestätigt, Passwortanzeige und neue Genres

Nutzer bestätigt erfolgreichen Passwort-Reset und Anmeldung am Handy. Auge zum Anzeigen/Verbergen aller Passwortfelder ergänzt. Komödie und Western unverändert übernommen: je 180 akzeptierte Fragen, 150 Ziele, 30 Varianten, 25 Themen, keine Importwarnungen/ID-Konflikte. Gesamtbestand 1.080 Fragen, 900 Wissensziele und 138 Themen. Eigene Genre-Icons, transaktionale Ergänzung und Offline-Paket eingebunden. Bestehende Darstellerprüfung gilt weiterhin für die bisherigen 720 Fragen; neue Filmtexte nicht unabhängig geprüft.

## 26.09.2026 – Aktualisiert veröffentlicht und öffentlich freigegeben

App-Commit `b33ae2a` auf derselben Sites-Projekt-ID/URL erfolgreich veröffentlicht; Deployment `appgdep_6ab7d405ebf48191a386d6cef3be524c`, Status `succeeded`. Anschließend Besucherzugriff auf Nutzerauftrag öffentlich (Revision 2), Eigentümerrechte erhalten. Anonymer Live-Aufruf direkt mit Status 200 und aktuellem JavaScript; beide neuen CSV und Service Worker bytegleich zum Build. 67 Logik-/Datenbanktests, Build und alle 31 Browserfälle erfolgreich (alte Anzahl im Zusatzimport-Test korrigiert und gezielt erneut bestanden). Gastdaten und Rohquellen erhalten. Physische PWA-/Offline- und echte geräteübergreifende Fortschrittsprüfung weiterhin offen.

## 26.09.2026 — Profilstatistik und freiwillige gemeinsame Rekordergebnisse

Profil auf Spiel-/Antwortstatistik, Trefferquote, Level und XP ausgerichtet; Kontotexte eingeklappt. Persönliche und gemeinsame Bestenliste umschaltbar, Teilnahme explizit und widerrufbar. Neue Supabase-Migration mit geschützten Ergebniszusammenfassungen, Kategorien, Gleichständen und Pagination im bestehenden Projekt erfolgreich ausgeführt; reale Rechte geprüft. Private Spielstände und Rohquellen erhalten. 70 Logik-/Datenbankprüfungen, Build und 32 unterschiedliche Browserprüfungen erfolgreich. Reale Zwei-Spieler-Abnahme bleibt offen; gemeinsame Werte sind ausdrücklich Trainingswerte, kein manipulationsgeschützter Wettbewerb. Freischalten von Schwierigkeitsstufen als optionalen Lernpfad vorgeschlagen, noch nicht umgesetzt.

## 26.09.2026 — Lernpfad, Lesbarkeit und Spielerleistungen

Nutzer wählt optionalen Lernpfad bei weiterhin offenem freien Spiel. Je Genre 20 sichere unterschiedliche leichte bzw. mittlere Ziele aus abgeschlossenen Runden, vorhandener Fortschritt zählt. Fortschrittsbalken, Freigaben und Erfolgshinweis umgesetzt. Oberfläche auf helle Leseflächen umgestellt, Fragen/Antworten und mobile Navigation gestrafft, Ton in zentrale Optionen verschoben. Dauerndes „Online“ entfernt, Offline-/Synchronisierungszustände erhalten.

Zusätzlicher Nutzerwunsch nach Spielerlisten umgesetzt: Rundenanzahl, richtige Antworten, Trefferquote ab 50 Antworten, je Genre und Stufe filterbar. Freiwillige Freigabe umfasst sichtbar erklärt Rekorde und Statistik. SQL-Migration 003 erfolgreich im bestehenden Supabase-Projekt, ohne Teilnahme für vorhandene Konten einzuschalten. 73 Logik-/Datenbanktests und 33 Browserprüfungen erfolgreich; finale mobile Layoutkorrektur gezielt nachgeprüft. Spielstände, Quellen und bestehende öffentliche Site-ID erhalten.

Veröffentlichung abgeschlossen: Sites-Version 11, App-Commit `cb41de13027a2a583b06bec7696160b01beec737`, Deployment `appgdep_6ab7dd62d35c819184f474ab382e85e2`, Status `succeeded`. Regulären wieder verfügbaren Sites-Workflow verwendet; öffentliche URL und Zugriff erhalten. Native Browserübergabe erfolgt. Echter SQL-Rechtenachweis für Spieler-RPC: anonym nicht ausführbar, für Konten ausführbar; null teilnehmende Konten bei Einrichtung. Echte Zwei-Spieler-Abnahme weiterhin offen.

## 26.09.2026 — Drama als siebtes Genre

Gelieferte Drama-CSV unverändert übernommen und vollständig mit dem App-Parser ausgewertet. 180 Fragen, 150 Ziele, 30 Varianten und 25 Themen ohne Warnungen/Ausschlüsse/Kollisionen. Gesamtbestand 1.260 Fragen, 1.050 Ziele und 163 Themen. Automatische Paketergänzung erhält vorhandene Spielstände; Drama-Symbol, Genreauswahl, Lernpfad und Offline-Cache angebunden. 75 Logik-/Datenbanktests, Build und 35 Browserprüfungen erfolgreich. Fachliche Aussagen stammen weiterhin aus der Nutzerdatei.

## 26.09.2026 — Kontrastreiche Genreillustrationen und Filmtitel

Sieben zusammenpassende freigestellte Genre-Motive mit eingebauter Bildgenerierung erstellt und unverändert eingebunden; kleine SVG-Symbole erhalten, zuvor zu dunkle Symbolfarben korrigiert. Bildherkunft und vollständige Prompts dokumentiert. Filmtitel in Fragen hellgold hinterlegt, dunkel gesetzt und nur in der Anzeige von Anführungszeichen befreit. Alle 1.260 gelieferten Fragen abgedeckt; Rohquellen und Speicherstände unverändert. 77 Logik-/Datenbanktests, Build und 36 Browserprüfungen erfolgreich; Desktop-/Handyansichten visuell und Offline-Bilder automatisiert geprüft.

Version 12 am 26.09.2026: Drama als siebtes Genre, sieben freigestellte Genreillustrationen und hervorgehobene Filmtitel ohne umschließende Anführungszeichen. App-Commit `0bbb53123060682f9a5e21751cb87ae57f348c55`, Version `appgprj_6ab78f6468648191a8895f7a1d9dbf23~appgver_423d658310f48191a8097edddd9f856c`, Deployment `appgdep_6ab7e14655888191ba70de6d3eb95743`, nativer Status `succeeded`. Bestehende Projekt-ID, öffentliche URL und Freigabe erhalten. Regulären Sites-Workflow mit geprüftem Build verwendet; 77 Logik-/Datenbanktests und 36 Browserprüfungen erfolgreich. Keine zusätzliche Live-Browserprüfung; physische PWA-/Offline-Abnahme weiterhin offen.

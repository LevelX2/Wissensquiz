# Konten und gemeinsame Spielstände

## Aktueller Stand

Eigene Quiz-Anmeldung unabhängig von ChatGPT mit Spielername, E-Mail, Passwort, Bestätigung und Reset ist eingerichtet. Supabase Free in Frankfurt schützt private Spielstände mit serverseitiger Benutzerprüfung und Row Level Security. Brevo SMTP und deutsche Mailvorlagen sind aktiv. Nach Korrektur des SMTP-Schlüsseltransfers hat der Nutzer die Bestätigungsmail erhalten; die erfolgreiche Kontoaktivierung wurde im Supabase-Dashboard am 26.09.2026 geprüft. Ein anschließender Smartphone-Login wurde vom Dienst mit „Invalid login credentials“ abgelehnt; Der Nutzer hat anschließend einen erfolgreichen Passwort-Reset und die Anmeldung am Handy bestätigt. Die ursprüngliche Passwortabweichung bleibt ungeklärt. Passwörter werden nicht eingesehen.

Alle Passwortfelder bieten ein Auge zum Ein- und Ausblenden; der Wert wird dabei nicht verändert und nach dem Leeren wieder verborgen. Die Bestätigungsseite erklärt Aktivierung, anschließende Anmeldung und Speicherung sowie die Wirkung des Abbruchs. Die E-Mail-Adresse dient zur Anmeldung, der frei gewählte Name zur Anzeige. Konkrete Einrichtung: [Konten einrichten](Konten-Einrichtung.md).

## Spielstände und Gerätewechsel

- Angemeldete Spieler laden beim Anmelden oder Neuladen automatisch ihren Online-Stand. Lokal gespeicherte Änderungen werden anschließend automatisch online gesichert; Aktionen innerhalb eines festen 800-ms-Fensters werden zum neuesten Stand gebündelt. Lokale Speicherung wartet nicht auf diesen Upload. Die bisherigen manuellen Sichern-/Prüfen-/Laden-Schaltflächen entfallen. Vor Gerätewechsel auf „Spielstand online gespeichert“ warten.
- Der Gaststand bleibt ausschließlich auf diesem Gerät und unter seinem bisherigen IndexedDB-Schlüssel erhalten. Jedes Konto hat einen eigenen, zusätzlich nach Supabase-Projekt getrennten Schlüssel. Der Gaststand wird nur auf ausdrücklichen Wunsch ins Konto kopiert; das Original bleibt erhalten.
- Eine gespeicherte Bestätigung aus Revision und Inhaltsfingerabdruck erkennt noch nicht hochgeladene Änderungen auch nach Neuladen. Fehlgeschlagene Uploads werden bei Netzrückkehr bzw. alle zehn Sekunden wiederholt. Lokale Änderungen bleiben erhalten.
- Revisionsprüfung verhindert stilles Überschreiben durch veraltete Geräte. Bei konkurrierenden Änderungen stoppt die Synchronisierung; die Oberfläche bietet eine Dateisicherung und ausdrücklich den Wechsel zum Online-Stand. Der ersetzte Stand bleibt zusätzlich als lokale Rückfallkopie erhalten. Keine automatische Zusammenführung.
- Web Locks erlauben nur ein aktives Kontofenster pro Browser, sofern unterstützt. Andere Geräte sind durch serverseitige Revisionsprüfung geschützt. Ein bereits geöffnetes Gerät übernimmt externe Änderungen nicht laufend im Hintergrund; Anmeldung/Neuladen gleicht ab, jeder Upload prüft erneut die Revision.
- Nach Neuladen benötigt ein Konto Internet zur Sitzungs- und Spielstandsprüfung. Eine bereits geöffnete Runde kann bei Netzausfall lokal weiterlaufen; noch nicht gesicherter Fortschritt ist gekennzeichnet. Gastmodus bleibt offline nutzbar.
- Abmeldung entfernt die Kontodaten aus der Ansicht, löscht jedoch keine lokalen Stände oder Rückfallkopien. Kontolöschung ist derzeit über den Eigentümer im Supabase-Dashboard möglich; die Online-Zeile wird mitgelöscht.

## Hosting und Freigabe

Sites-Zutritt und Quiz-Konto sind getrennt. Der Nutzer hat die öffentliche Erreichbarkeit ohne vorgeschaltetes ChatGPT-Konto beauftragt. Aktueller Veröffentlichungs- und Freigabestatus: [Sites-Betrieb](Sites-Betrieb.md). Ein öffentlicher Quiz-Aufruf gibt keine privaten Supabase-Spielstände frei. Diese bleiben an die bestätigte Benutzer-ID gebunden.

Die App spricht Supabase über HTTPS an. Project URL und Publishable Key sind öffentliche Konfiguration; SMTP-, Datenbank- und geheime API-Schlüssel bleiben ausschließlich in den jeweiligen Diensten. Brevo Free wird ohne eigene Domain verwendet, Tracking ist anonymisiert, aber nicht vollständig abschaltbar.

## Profil und gemeinsame Trainingsrangliste

Das Profil zeigt gespielte und abgeschlossene Runden, beantwortete Fragen, Trefferquote, abgeschlossene Rekordrunden, gefestigte Wissensziele sowie Level und XP. Konto- und Speicherhilfen stehen kompakt unter „Konto & Speicherung“.

Der eigene Navigationspunkt „Highscores“ bietet drei gleich sichtbare Ansichten: „Meine Ergebnisse“, „Alle Spieler“ und „Spielerleistungen“. Im Profil stehen Statistik, Optionen und Hilfe. Die persönliche Liste bleibt Teil des privaten Spielstands und offline verfügbar. Gemeinsame Ergebnisse sind nur für bestätigte, angemeldete Quiz-Konten abrufbar. Bestätigte Konten nehmen auf Nutzerauftrag automatisch teil; es gibt keine Abwahl. Der Umfang wird vor Registrierung und im Profil erklärt. Auch vorhandene gesicherte Rekordrunden werden abgeleitet. In ungefilterten Spielerwertungen erscheinen bestätigte Konten auch mit null abgeschlossenen Runden.

Geteilt werden Spielername, Kategorie, Punkte, richtige Antworten, Antwortzeit und Abschlussdatum sowie zusammengefasste Spielerstatistiken (abgeschlossene Runden, Antworten und Trefferquote). Keine E-Mail, Konto-ID, Frageninhalte oder vollständigen Spielstände. Kategorien trennen Genre-Kombination, Stufen, optionales Einzelthema, Fragenzahl und Regelversion. Gleichstände teilen den Rang (1, 1, 3); Seiten enthalten höchstens 50 Ergebnisse. Die Datenbank berechnet Punkte aus Antwort-IDs und Zeiten neu und aktualisiert die Ergebnisse bei jeder Kontosicherung.

Dies ist ausdrücklich eine gemeinsame Trainingsrangliste: Antworten und Zeiten stammen weiterhin aus dem Browser; Offline- und importierte Runden können enthalten sein. Für einen manipulationsgeschützten Wettbewerb wären serverseitig gestartete und kontrollierte Runden nötig. Automatische Zusammenführung mehrerer Geräte und Selbstbedienung zur Kontolöschung bleiben ebenfalls offen.

Unter „Spielerleistungen“ stehen Aktivitäts- und Trefferwertungen bereit: meiste abgeschlossene Runden, meiste richtige Antworten, höchste Trefferquote ab 50 Antworten in der gewählten Genre-/Stufengruppe. Migration 004 ersetzt die bisherigen Teilnahmebedingungen durch automatische Aufnahme bestätigter Konten; alte Abwahl-RPCs sind nicht mehr für Konten ausführbar. Keine direkten Leserechte auf fremde Spielstände. Ergebnisse basieren weiterhin auf gespeicherten Trainingsdaten, nicht auf unabhängig geprüften Spielabläufen.

Der Speicherstatus erscheint als fest bemessene Markierung am Profil und während einer Runde neben dem Modus: grün/✓ bestätigt, blau/↑ Sicherung wartet oder läuft, orange/! ausstehende Online-Sicherung. Während einer Runde öffnet Antippen einen Hinweis über dem Inhalt mit erneutem Versuch; im Profil steht die Erklärung unter „Konto & Speicherung“, damit Statuswechsel auch dort die Statistik nicht verschieben. Es wird keine wechselnde Hinweiszeile oberhalb des Spiels eingefügt, auch nicht bei einem Verbindungswechsel. Konflikte behalten ihre gesonderte Auflösung. Ranglistenanfragen (Kategorien, Ergebnisse, Spielerwerte) haben eine Ladegrenze von zehn Sekunden mit Abbruchsignal und verständlicher Fehleranzeige; Aktualisieren erlaubt einen erneuten Versuch. Die Grenze gilt auch, wenn die Sitzungserneuerung hängt. Keine Änderungen an Datenbankrechten oder automatischer Teilnahme.

## Speicheranzeige und Datenmenge (27.09.2026)

Die bisherige globale Meldung wurde ausschließlich beim Fehlerstatus eingefügt und nach erfolgreicher Bestätigung entfernt. Dieser Wechsel veränderte die Höhe oberhalb der App und verursachte Layoutsprünge. Der interne Status offline umfasst fehlgeschlagene Bestätigungen allgemein, nicht nur physisch fehlendes Internet. Die konkrete Ursache der vom Nutzer beobachteten Fehlschläge ist nicht anhand realer Kontodaten nachgewiesen.

Der aktuelle synthetische leere Kontostand mit 2.567 Fragen belegt als JSON rund 8 MB (8.006.151 Bytes im Messlauf, Zeitstempellängen können variieren). Dieser Messwert beschreibt das bisherige Vollformat; die nachfolgend dokumentierte Kompaktkodierung reduziert die Übertragung. Die Änderung bündelt schnell aufeinanderfolgende Aktionen ohne dauerhaftes Verschieben des Uploads. Wechsel in den Hintergrund oder ausdrücklicher neuer Versuch stößt die vorhandene Warteschlange sofort an; eine erfolgreiche Übertragung beim Schließen des Browsers ist dadurch nicht garantiert. Unbestätigte Stände bleiben lokal und werden weiter erkannt.

Bekannte HTTP-Fehler werden jetzt in den Details unterschieden (Zugriff, abgelehnte Größe/Inhalt, zu viele Anfragen, Serverfehler); interne Servertexte und private Daten erscheinen nicht. Die Anzeige behauptet bei generischen Fehlern keine bestimmte Ursache. Grün erscheint erst nach Bestätigung des neuesten Stands; bei noch ausstehenden Änderungen während eines Uploads gibt es keine zwischenzeitliche grüne Bestätigung. Revisionsschutz, Wiederholungen und Konfliktauflösung bleiben bestehen; keine Datenbankmigration.


Die Rundenvorbereitung (Modus, Genres, Zusatzkategorien, manuelle Stufen) gehört als optionales `settings.roundSetup` zum privaten Kontospielstand. Sie nutzt denselben lokalen Schreibweg, Upload, Revisionsschutz und Geräteabruf wie bisherige Einstellungen. Gast- und Kontopräferenzen bleiben getrennt; keine Datenbankänderung nötig. Einzelne Filme und Favoriten sind keine wählbaren Präferenzen mehr.


Highscore-Speicherung geprüft (27.09.2026): `quiz_shared_scores` enthält bereits ausschließlich Ergebniswerte und Kategorie-Metadaten, keine Fragekopien oder vollständigen Runden. Die persönliche Rundengeschichte wird separat im privaten `quiz_saves`-Spielstand gehalten und ist derzeit Grundlage für Rückblicke, Freischaltungen, Statistik und Sicherungsprüfung. Nutzer wünscht keine vollständige Spielspeicherung nur für Highscores; die neue kompakte Online-Speicherung erhält Frageverweise und Antwortgeschichte. Es wurden dafür keine alten Runden gelöscht und keine Live-Datenbankrechte geändert.


## Kompakte Online-Sicherung (27.09.2026)

`quiz-cloud-compact-v1` komprimiert den vollständigen persönlichen Fragenkatalog verlustfrei per gzip/base64. Runden speichern statt voller Fragen einen ID-/Versionsverweis, die kleinen für Ranglisten nötigen Felder und ausschließlich abweichende Werte (insbesondere zufällige Jahresantworten). Antworten, Rundendaten, Lernstände und Einstellungen bleiben erhalten. Vor Nutzung wird dekomprimiert, auf maximal 64 MiB begrenzt, jeder Verweis und seine Ergebnisfelder geprüft und anschließend der bisherige vollständige Sicherungsvalidator ausgeführt. Revisionsprüfung und Inhaltsfingerabdruck beziehen sich weiterhin auf den rekonstruierten Stand.

Messung ohne persönliche Fortschritte: 2.567 Fragen, bisher 8.006.151 Bytes, kompakt 1.535.197 Bytes (80,8 % weniger JSON-Übertragung; keine Messung der physischen PostgreSQL-Belegung). Vier synthetische Runden bleiben im Test ebenfalls unter 35 % des Vollformats. Das Format benötigt keine SQL-Migration: Highscores und Spielerstatistik können ihre bisherigen kleinen Felder direkt lesen. Vorher-/Nachher-Vergleich beider SQL-Projektionen erfolgreich.

Alte Vollsicherungen werden weiter gelesen; die nächste erfolgreiche Kontosicherung schreibt kompakt. Browser ohne Kompressionsschnittstelle senden weiterhin das Vollformat. Ein älterer App-Build kann das neue Format nicht lesen und lehnt es ab, statt Teile zu verlieren; alte Quiz-Tabs vor dem Gerätewechsel schließen und die aktuelle Version öffnen. Lokaler IndexedDB-Stand und JSON-Export bleiben in diesem Schritt vollständig im bisherigen Format, damit Offline-Fortsetzen und unabhängige Rückfallkopien erhalten bleiben. Keine automatische Löschung historischer Runden.

Die öffentliche Highscore-Tabelle enthält weiterhin nur Ergebniswerte. Ihre Abfrage nutzt den vorhandenen Kategorie-/Punkte-/Datumsindex und liefert 50 Zeilen pro Seite, keine Fragekataloge. Persönliche Listen berechnen ihre Gruppen einmal je geändertem Spielstand und verwenden sie bei Filterwechseln erneut. Die separate Spielerleistungsabfrage aggregiert weiterhin gespeicherte Antworten; eine materialisierte Spielerstatistik bleibt bei wachsendem Bestand eine mögliche weitere Optimierung.

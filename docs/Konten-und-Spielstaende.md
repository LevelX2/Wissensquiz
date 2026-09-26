# Konten und gemeinsame Spielstände

## Aktueller Stand

Eigene Quiz-Anmeldung unabhängig von ChatGPT mit Spielername, E-Mail, Passwort, Bestätigung und Reset ist eingerichtet. Supabase Free in Frankfurt schützt private Spielstände mit serverseitiger Benutzerprüfung und Row Level Security. Brevo SMTP und deutsche Mailvorlagen sind aktiv. Nach Korrektur des SMTP-Schlüsseltransfers hat der Nutzer die Bestätigungsmail erhalten; die erfolgreiche Kontoaktivierung wurde im Supabase-Dashboard am 26.09.2026 geprüft. Ein anschließender Smartphone-Login wurde vom Dienst mit „Invalid login credentials“ abgelehnt; Der Nutzer hat anschließend einen erfolgreichen Passwort-Reset und die Anmeldung am Handy bestätigt. Die ursprüngliche Passwortabweichung bleibt ungeklärt. Passwörter werden nicht eingesehen.

Alle Passwortfelder bieten ein Auge zum Ein- und Ausblenden; der Wert wird dabei nicht verändert und nach dem Leeren wieder verborgen. Die Bestätigungsseite erklärt Aktivierung, anschließende Anmeldung und Speicherung sowie die Wirkung des Abbruchs. Die E-Mail-Adresse dient zur Anmeldung, der frei gewählte Name zur Anzeige. Konkrete Einrichtung: [Konten einrichten](Konten-Einrichtung.md).

## Spielstände und Gerätewechsel

- Angemeldete Spieler laden beim Anmelden oder Neuladen automatisch ihren Online-Stand. Jede lokal gespeicherte Änderung wird anschließend automatisch online gesichert. Die bisherigen manuellen Sichern-/Prüfen-/Laden-Schaltflächen entfallen. Vor Gerätewechsel auf „Spielstand online gespeichert“ warten.
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

Die Bestenliste lässt sich zwischen „Meine Ergebnisse“ und „Alle Spieler“ umschalten. Die persönliche Liste bleibt Teil des privaten Spielstands und offline verfügbar. Gemeinsame Ergebnisse sind nur für bestätigte, angemeldete Quiz-Konten abrufbar. Teilnahme ist standardmäßig ausgeschaltet. „Meine Ergebnisse und Spielerstatistik teilen“ veröffentlicht nach gespeicherter Kontosicherung auch vorhandene abgeschlossene Rekordrunden. Ausschalten entfernt die abgeleiteten geteilten Ergebnisse, bewahrt aber den privaten Spielstand.

Geteilt werden Spielername, Kategorie, Punkte, richtige Antworten, Antwortzeit und Abschlussdatum sowie zusammengefasste Spielerstatistiken (abgeschlossene Runden, Antworten und Trefferquote). Keine E-Mail, Konto-ID, Frageninhalte oder vollständigen Spielstände. Kategorien trennen Genre-Kombination, Stufen, optionales Einzelthema, Fragenzahl und Regelversion. Gleichstände teilen den Rang (1, 1, 3); Seiten enthalten höchstens 50 Ergebnisse. Die Datenbank berechnet Punkte aus Antwort-IDs und Zeiten neu und aktualisiert freigegebene Ergebnisse bei jeder Kontosicherung.

Dies ist ausdrücklich eine gemeinsame Trainingsrangliste: Antworten und Zeiten stammen weiterhin aus dem Browser; Offline- und importierte Runden können enthalten sein. Für einen manipulationsgeschützten Wettbewerb wären serverseitig gestartete und kontrollierte Runden nötig. Automatische Zusammenführung mehrerer Geräte und Selbstbedienung zur Kontolöschung bleiben ebenfalls offen.

Unter „Spielerranglisten ansehen“ stehen zusätzlich Aktivitäts- und Trefferwertungen bereit: meiste abgeschlossene Runden, meiste richtige Antworten, höchste Trefferquote ab 50 Antworten in der gewählten Genre-/Stufengruppe. Die bestehende freiwillige Freigabe gilt für beide Listenarten und erklärt den Umfang vor Aktivierung. Migration 003 aggregiert ausschließlich bestätigte und freiwillig teilnehmende Konten; keine direkten Leserechte auf fremde Spielstände. Ergebnisse basieren weiterhin auf gespeicherten Trainingsdaten, nicht auf unabhängig geprüften Spielabläufen.

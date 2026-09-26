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

## Gemeinsame Bestenliste als nächster Ausbau

Die persönliche Bestenliste ist vorhanden und Bestandteil des automatisch gesicherten Kontospielstands. Eine gemeinsame Wettbewerbsrangliste ist noch nicht umgesetzt. Dafür müssen Online-Rekordrunden serverseitig gestartet, Fragen und Zeiten zugeordnet und Punkte geprüft werden. Gesicherte lokale oder offline erspielte Rekorde bleiben persönliche Trainingswerte.

Geplant sind getrennte Kategorien nach Genre-Kombination, Stufen, Rundengröße und Regelversion, freiwillige Teilnahme und Anzeige ausschließlich des Spielernamens. Automatische Zusammenführung mehrerer Geräte und Selbstbedienung zur Kontolöschung bleiben weitere Ausbauschritte.

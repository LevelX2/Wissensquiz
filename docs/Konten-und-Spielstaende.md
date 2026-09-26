# Konten und gemeinsame Spielstände

## Aktueller Stand

Der Nutzer hat eine eigene Anmeldung unabhängig von ChatGPT mit Spielername, E-Mail, Passwort, E-Mail-Bestätigung und Passwort-Reset beauftragt. Am 26.09.2026 wurden Supabase Free in Frankfurt mit Datenbankregeln sowie Brevo SMTP mit verifiziertem Absender und deutschen Mailvorlagen eingerichtet. Die App-Konfiguration ist für den privaten Eigentümertest aktiviert, Veröffentlichung vorbereitet. Echte Mailzustellung, Bestätigungs-/Reset-Links und Zwei-Konten-Abnahme sind noch offen; keine echten Quiz-Konten oder Online-Spielstände angelegt. Brevo Free wird ohne eigene Domain verwendet, Tracking ist anonymisiert, aber nicht vollständig abschaltbar.

Die React-App enthält Registrierung, Anmeldung, erneute Bestätigung, Reset und Abmeldung. Die E-Mail-Adresse dient zur Anmeldung, der frei gewählte Name zur Anzeige. Supabase Auth verwaltet Passwörter und Sitzungen. Die SQL-Migration schützt private Spielstände mit serverseitiger Benutzerprüfung und Row Level Security. Ein unbestätigtes oder fremdes Konto erhält keinen Zugriff.

Konkrete Anleitung einschließlich SQL-Migration, Mailvorlagen, Aktivierung und noch erforderlicher echter Dienstprüfungen: [Konten einrichten](Konten-Einrichtung.md).

## Spielstände und Gerätewechsel

- Der bisherige Gaststand bleibt unter seinem unveränderten IndexedDB-Schlüssel erhalten. Jedes Konto erhält einen eigenen, zusätzlich nach Supabase-Projekt getrennten Schlüssel.
- Online sichern und Laden erfolgen ausdrücklich im Kontobereich. Eine Revisionsprüfung verhindert, dass ein veraltetes Gerät einen neueren Online-Stand still überschreibt. Es gibt noch keine automatische Zusammenführung mehrerer Geräte.
- Gaststand ins Konto kopieren und Online-Stand lokal übernehmen erfordern eine ausdrückliche Auswahl. JSON-Export und eine zusätzliche lokale Rückfallkopie sichern den bisherigen Stand. Keine automatische Übertragung bestehender Nutzerdaten.
- Abmelden entfernt die Kontodaten aus der aktiven Ansicht, löscht jedoch keine lokalen Kontostände oder Rückfallkopien. Kontolöschung ist derzeit über den Eigentümer im Supabase-Dashboard möglich; die Online-Zeile wird mitgelöscht.
- Nach Neuladen benötigt ein Konto Internet zur Sitzungsprüfung. Der Gastmodus bleibt offline spielbar. Bestehende Spiel-, Lern- und Sicherungsregeln bleiben erhalten.

## Hosting und Freigabe

Sites-Zutritt und App-Identität sind getrennt. Die [Sites-Dokumentation](https://learn.chatgpt.com/docs/sites#control-access-and-secrets) beschreibt diese Trennung und unterstützt externe Identitätsdienste. Das vorhandene Projekt bietet private und öffentliche Besucherfreigabe. Die statische App spricht Supabase über HTTPS an; Datenzugriff wird im Dienst geprüft. Keine zusätzliche Sites-Datenbank und kein eigener Passwortserver erforderlich.

Die Site bleibt vorerst privat unter derselben Projekt-ID und URL. Vollständig von ChatGPT unabhängiger Besucherzugang erfordert nach Einrichtung und echten Konten-/Mailprüfungen zusätzlich eine passende Freigabe der äußeren Sites-Zugangsschranke. Diese wurde noch nicht geändert. Project URL und Publishable Key dürfen in die öffentliche App-Konfiguration; SMTP-, Datenbank- und geheime API-Schlüssel ausschließlich in den jeweiligen Dienst.

## Gemeinsame Bestenliste als nächster Ausbau

Die persönliche lokale Bestenliste ist vorhanden. Eine gemeinsame Wettbewerbsrangliste ist noch nicht umgesetzt. Dafür müssen Online-Rekordrunden serverseitig gestartet, Fragen und Zeiten zugeordnet und Punkte geprüft werden. Gesicherte lokale oder offline erspielte Rekorde bleiben persönliche Trainingswerte.

Geplant sind getrennte Kategorien nach Genre-Kombination, Stufen, Rundengröße und Regelversion, freiwillige Teilnahme und Anzeige ausschließlich des Spielernamens. Automatische Ereignissynchronisierung, Zusammenführung mehrerer Geräte und eine Selbstbedienung zur Kontolöschung bleiben weitere Ausbauschritte.

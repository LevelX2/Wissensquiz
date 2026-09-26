# Eigene Quiz-Konten einrichten

## Stand

Die App-Anbindung ist vorbereitet und lokal getestet. Es existiert noch kein Supabase-Projekt und kein eingerichteter Mailversand. `public/account-config.json` enthält deshalb `enabled: false`. Die Live-Site bleibt privat; „Konto“ erklärt den Einrichtungsstand und nimmt keine Passwörter entgegen. Es wurden keine echten Konten angelegt und keine E-Mails versendet.

## 1. Supabase-Projekt

Unter [Supabase](https://supabase.com/dashboard) ein eigenes Konto und ein Projekt anlegen, möglichst in einer passenden europäischen Region. Organisations-/Tarifwahl und ein eventuell erforderliches Zahlungsmittel übernimmt der Eigentümer. Das Datenbankpasswort gehört in den persönlichen Passwortmanager, nicht in Chat, Git oder die öffentliche App.

Benötigt werden anschließend die **Project URL** (`https://….supabase.co`) und der **Publishable API Key** (`sb_publishable_…`). Beide sind für die Browser-App vorgesehen. `service_role`, `sb_secret_…`, Datenbankpasswort, SMTP-Passwort und persönliche Access Tokens dürfen niemals in die öffentliche Konfiguration gelangen. Die App lehnt dort andere Schlüsseltypen ab.

## 2. Datenbank vorbereiten

Die vollständige Datei [202609260001_quiz_accounts.sql](../supabase/migrations/202609260001_quiz_accounts.sql) einmal im SQL Editor des neuen Projekts ausführen. Sie legt `quiz_saves`, Row Level Security und die Funktionen `quiz_verified_user`/`quiz_save_state` an. Nicht manuell RLS abschalten oder anonymen Zugriff erlauben.

Die Datenbank bindet jede Zeile an die serverseitig geprüfte Benutzer-ID. Nur bestätigte, nicht anonyme Konten dürfen ihre eigene Zeile lesen. Direkte Schreibrechte fehlen; Speichern läuft über eine Funktion, die Eigentümer und Revision selbst prüft. Passwörter und Mailtokens verwaltet ausschließlich Supabase Auth. Die Migration ist bewusst für ein neues Projekt; nicht blind mehrfach oder über bestehende gleichnamige Tabellen ausführen.

## 3. E-Mail/Passwort einschalten

In Supabase Authentication die E-Mail/Passwort-Anmeldung und **Confirm email** aktivieren. Mindestpasswortlänge auf **12** setzen. Registrierung muss bis zur bestätigten Mail ohne aktive Sitzung bleiben. Ablaufzeit der Bestätigungs-/Reset-Tokens auf beispielsweise eine Stunde begrenzen und passende Versand-/Anmelderaten einstellen.

Als **Site URL** ohne abschließenden Schrägstrich eintragen:

`https://wissensquiz-filmkosmos.levelx2.chatgpt.site`

Als erlaubte Redirect-URL exakt `https://wissensquiz-filmkosmos.levelx2.chatgpt.site/` verwenden. Keine Wildcard für fremde Adressen. `http://localhost:4173/` nur in einem getrennten Testprojekt freigeben.

## 4. Mailversand verbinden

Einen SMTP-fähigen Transaktionsmaildienst mit verifizierter Absenderadresse bzw. Absenderdomain einrichten und die Zugangsdaten ausschließlich im Supabase-Dashboard hinterlegen. Supabase-Standardversand ist für Produktion ungeeignet und auf Projektmitglieder eingeschränkt. Deshalb reicht er nicht für Sohn/Schwager als beliebige Testpersonen.

In den Supabase-E-Mail-Vorlagen:

- **Confirm signup:** [confirmation.html](../supabase/templates/confirmation.html), Betreff „Bestätige Dein Wissensquiz-Konto“.
- **Reset password:** [recovery.html](../supabase/templates/recovery.html), Betreff „Wissensquiz: Passwort zurücksetzen“.

Die beiden Vorlagen sind notwendig: Die App verwendet ausdrücklich `token_hash` und `type` im URL-Fragment. Sie entfernt den Token sofort aus der sichtbaren Adresse und prüft ihn erst nach dem Klick auf „Link bestätigen“. Dadurch verbraucht ein einfacher Mail-Linkscanner den Token nicht schon beim Öffnen. Tokens erscheinen nicht im HTTP-Pfad, in Quiz-Sicherungen oder in App-Logs. Keine Link-Umschreibung/Click-Tracking für diese Mails aktivieren. Es werden keine eigenen Mailpasswörter im Frontend benötigt.

## 5. Anbindung aktivieren und prüfen

Nach eingerichteter Datenbank und Mailversand `public/account-config.json` mit Project URL, Publishable Key und `enabled: true` befüllen. Der Account-Dienst wird per HTTPS aus dem Browser angesprochen; Postgres-Regeln im Dienst übernehmen die serverseitige Autorisierung. Die bestehende statische Sites-App benötigt dafür keinen eigenen Passwortserver und keine neue Site-ID.

Vor einer Freigabe für andere Personen folgende echte Dienstprüfungen mit getrennten Testkonten durchführen:

1. Registrieren → echte Bestätigungsmail → Link → Anmeldung. Vor Bestätigung keine private Speicherung.
2. Bestätigung erneut anfordern sowie abgelaufene und bereits verwendete Links prüfen.
3. Passwort-Reset → echte Mail → neues Passwort → Abmeldung → Anmeldung nur mit neuem Passwort. Auch Linköffnung auf einem anderen Gerät prüfen.
4. Konto A/B strikt getrennt; Gastspielstand erhalten. Online sichern, auf anderem Gerät laden, parallelen Speicherkonflikt prüfen. Anonyme und fremde API-Zugriffe müssen abgewiesen werden.
5. Erst nach diesen Prüfungen die bisherige äußere Sites-Zugangsschranke passend freigeben. Der Nutzer hat die von ChatGPT unabhängige Anmeldung beauftragt; das ist das angestrebte Endergebnis. Bis die Einrichtung vollständig ist, bleibt die bestehende private Freigabe bestehen.

Anschließend nach [Sites-Betrieb](Sites-Betrieb.md) veröffentlichen, dieselbe Projekt-ID und URL verwenden. Ein öffentlicher Site-Aufruf und private Kontodaten sind getrennte Dinge; Gastmodus und Quizfragen wären dann öffentlich erreichbar, Kontodaten weiter durch Supabase Auth/RLS geschützt.

## Grenzen dieser Ausbaustufe

- Online-Spielstände werden ausdrücklich gespeichert und geladen, nicht automatisch zwischen Geräten zusammengeführt. Ein veralteter Upload überschreibt keinen neueren Online-Stand.
- Lokaler Gast- und Kontospielstand sind getrennt. Kopieren des Gaststands und Ersetzen durch den Online-Stand verlangen eine ausdrückliche Auswahl; vorher JSON sichern. Zusätzliche lokale Rückfallkopie unter `recovery:…` im bestehenden IndexedDB-Store.
- Abmeldung blendet Kontodaten aus; sie löscht nicht deren lokale Rückfallkopien. Ein Gerät mit fremdem Browserprofil ist kein privater Datentresor. Kontolöschung kann der Eigentümer derzeit im Supabase-Dashboard durchführen; die Online-Zeile wird durch den Fremdschlüssel mitgelöscht. Eine Selbstbedienungsfunktion zur Kontolöschung ist noch nicht eingebaut.
- Ein neu geladenes Konto benötigt Internet zur Sitzungsprüfung. Der bisherige Offline-Gastmodus bleibt verfügbar. Bereits geladene Kontorunden speichern lokal; Online-Abgleich erfolgt mit Verbindung.
- Eine gemeinsame Bestenliste mit serverseitiger Punkteprüfung ist noch nicht implementiert. Online gesicherte lokale Rekorde sind keine manipulationssicheren Wettbewerbswerte.

## Quellen und Prüfstand

[Sites: getrennte Freigabe und Identität](https://learn.chatgpt.com/docs/sites#control-access-and-secrets), [Supabase Passwort-Anmeldung](https://supabase.com/docs/guides/auth/passwords), [Mailvorlagen](https://supabase.com/docs/guides/auth/auth-email-templates), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

Der Datenbanktest führt die echte Migration in lokalem Postgres/WASM (PGlite) mit nachgebildetem `auth.users`/`auth.uid()` aus und prüft Rollen, RLS und Revisionskonflikte. Browserprüfungen nutzen das echte Supabase-SDK mit simulierten HTTP-Antworten; sie belegen keine Mailzustellung und keine Einrichtung eines echten Supabase-Projekts.

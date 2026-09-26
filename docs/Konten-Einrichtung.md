# Eigene Quiz-Konten einrichten

## Stand

Die App-Anbindung und das Supabase-Projekt sind eingerichtet. Brevo SMTP und deutsche Bestätigungs-/Reset-Vorlagen sind gespeichert. `public/account-config.json` enthält jetzt `enabled: true` mit Project URL und öffentlichem Publishable Key; Veröffentlichung für den privaten Eigentümertest vorbereitet. Echte Mailzustellung, Linkverhalten und Kontenabnahme stehen noch aus. Es wurden noch keine echten Quiz-Konten angelegt und keine Quiz-E-Mails versendet. Die äußere Sites-Freigabe bleibt privat.

### Tatsächlich eingerichtet am 26.09.2026

- Organisation und Projekt **Wissensquiz**, Tarif **Free**, Region **Central EU (Frankfurt)** (`eu-central-1`). Projekt-ID `nadhixddmpshndqpmzqi`, Project URL `https://nadhixddmpshndqpmzqi.supabase.co`.
- Das Datenbankpasswort hat der Nutzer selbst im Dashboard eingegeben. Keine geheimen Zugangsdaten in App oder Repository übernommen. Der vorhandene öffentliche Publishable Key ist in die App-Konfiguration übernommen.
- Migration `202609260001_quiz_accounts.sql` über den SQL Editor innerhalb einer Transaktion erfolgreich ausgeführt. Vorher war `public.quiz_saves` nicht vorhanden. Nicht erneut ausführen.
- Direkte SQL-Prüfung im echten Projekt: RLS aktiv, eine SELECT-Policy, kein anonymer Tabellenzugriff, keine direkten INSERT-/UPDATE-/DELETE-Rechte für angemeldete Benutzer; Speicherfunktion ausschließlich für angemeldete Benutzer ausführbar. Inhalt und Revisionsregeln stammen aus der lokal getesteten Migration. Echte Zwei-Konten-Prüfung weiterhin offen.
- E-Mail-Provider, Registrierung und Confirm email aktiviert vorgefunden; anonyme Anmeldung deaktiviert. Mindestpasswortlänge auf zwölf Zeichen gespeichert, Linkablauf 3.600 Sekunden beibehalten.
- Site URL und genau eine Redirect-URL entsprechend Abschnitt 3 gespeichert.
- Brevo-Free-Konto eingerichtet, 300 Mails/Tag im Dashboard angezeigt, Absender „Wissensquiz“ verifiziert. Nutzer hat die Erstellung des SMTP-Schlüssels „Wissensquiz Supabase“ und dessen ausschließliche Hinterlegung in Supabase ausdrücklich bestätigt. Schlüssel erstellt, aktiv, Ablauf 26.09.2027; laut Erstellungsdialog zusätzlich Ablauf nach 90 Tagen Inaktivität. Vor Ablauf erneuern. Kein Schlüssel in Chat, Dateien oder Git.
- Custom SMTP in Supabase gespeichert: `smtp-relay.brevo.com`, Port 587, Absendername „Wissensquiz“, verifizierte Absenderadresse und Brevo-Zugang ausschließlich im Dienst. Mindestintervall 60 Sekunden; Dashboard nennt nach Aktivierung 30 Mails/Stunde. Deutsche Confirm-sign-up- und Reset-password-Vorlagen aus Abschnitt 4 gespeichert; kein kostenpflichtiges Upgrade.
- Brevo zeigt bei der SMTP-Überprüfung „Warten auf Log“. Die erste echte Mail und Zustellung sind noch nicht geprüft. Anonymes Tracking aktiviert; vollständige Tracking-Abschaltung ist in der aktuellen Oberfläche nicht verfügbar. Das Verhalten umgeschriebener Links muss bei der Abnahme geprüft werden.

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

Für die Testphase wird **Brevo Free** vorbereitet (aktuell 300 E-Mails täglich). [Tarifbeschreibung](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans). Eine einzelne [Absenderadresse lässt sich per Mail bestätigen](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email). Brevo beschreibt für nicht authentifizierte oder freie Absenderadressen eine vorübergehende Ersetzung durch eine konforme Absenderadresse; eine eigene authentifizierte Domain bleibt die verlässlichere spätere Lösung. [Absenderanforderungen](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders). Noch keine konkrete Versandfreigabe zugesichert: Konto und zulässige Absenderadresse müssen zunächst bestätigt und echte Mails getestet werden. Kein kostenpflichtiges Abo oder Domainkauf beauftragt.

In den Supabase-E-Mail-Vorlagen:

- **Confirm signup:** [confirmation.html](../supabase/templates/confirmation.html), Betreff „Bestätige Dein Wissensquiz-Konto“.
- **Reset password:** [recovery.html](../supabase/templates/recovery.html), Betreff „Wissensquiz: Passwort zurücksetzen“.

Die beiden Vorlagen sind notwendig: Die App verwendet ausdrücklich `token_hash` und `type` im URL-Fragment. Sie entfernt den Token sofort aus der sichtbaren Adresse und prüft ihn erst nach dem Klick auf „Link bestätigen“. Dadurch verbraucht ein einfacher Mail-Linkscanner den Token nicht schon beim Öffnen. Im direkten App-Link erscheinen Tokens nicht im HTTP-Pfad, in Quiz-Sicherungen oder in App-Logs. Brevo bietet in der aktuellen Oberfläche nur anonymisiertes Tracking, keine vollständige Abschaltung an. Die Anonymisierung ist aktiviert; sie verhindert keine Link-Umschreibung. Daher müssen zugestellte Bestätigungs-/Reset-Links einschließlich Fragment, privater Sites-Anmeldung und Weiterleitung vor Besucherfreigabe tatsächlich geprüft werden. [Brevo: anonymes Tracking](https://help.brevo.com/hc/en-us/articles/11643306229906-Can-I-anonymize-the-tracking-of-opens-and-clicks-for-my-emails). Es werden keine eigenen Mailpasswörter im Frontend benötigt.

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

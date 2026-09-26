# Eigene Quiz-Konten einrichten

## Stand

Die App-Anbindung und das Supabase-Projekt sind eingerichtet. Brevo SMTP und deutsche Bestätigungs-/Reset-Vorlagen sind gespeichert. `public/account-config.json` enthält jetzt `enabled: true` mit Project URL und öffentlichem Publishable Key; private Veröffentlichung erfolgreich, echte Live-Registrierungsansicht geöffnet. Nach korrigiertem SMTP-Schlüsseltransfer wurde eine echte Bestätigungsmail zugestellt und das Konto erfolgreich aktiviert (Dashboard geprüft). Erfolgreicher Passwort-Reset und Anmeldung am Handy wurden danach vom Nutzer bestätigt. Echte Zwei-Konten- und geräteübergreifende Spielstandsabnahme stehen aus. Der Nutzer hat inzwischen öffentliche Erreichbarkeit ohne vorgeschaltete ChatGPT-Anmeldung beauftragt; aktueller Status unter Sites-Betrieb.md.

### Tatsächlich eingerichtet am 26.09.2026

- Organisation und Projekt **Wissensquiz**, Tarif **Free**, Region **Central EU (Frankfurt)** (`eu-central-1`). Projekt-ID `nadhixddmpshndqpmzqi`, Project URL `https://nadhixddmpshndqpmzqi.supabase.co`.
- Das Datenbankpasswort hat der Nutzer selbst im Dashboard eingegeben. Keine geheimen Zugangsdaten in App oder Repository übernommen. Der vorhandene öffentliche Publishable Key ist in die App-Konfiguration übernommen.
- Migration `202609260001_quiz_accounts.sql` über den SQL Editor innerhalb einer Transaktion erfolgreich ausgeführt. Vorher war `public.quiz_saves` nicht vorhanden. Nicht erneut ausführen.
- Direkte SQL-Prüfung im echten Projekt: RLS aktiv, eine SELECT-Policy, kein anonymer Tabellenzugriff, keine direkten INSERT-/UPDATE-/DELETE-Rechte für angemeldete Benutzer; Speicherfunktion ausschließlich für angemeldete Benutzer ausführbar. Inhalt und Revisionsregeln stammen aus der lokal getesteten Migration. Echte Zwei-Konten-Prüfung weiterhin offen.
- E-Mail-Provider, Registrierung und Confirm email aktiviert vorgefunden; anonyme Anmeldung deaktiviert. Mindestpasswortlänge auf zwölf Zeichen gespeichert, Linkablauf 3.600 Sekunden beibehalten.
- Site URL und genau eine Redirect-URL entsprechend Abschnitt 3 gespeichert.
- Brevo-Free-Konto eingerichtet, 300 Mails/Tag im Dashboard angezeigt, Absender „Wissensquiz“ verifiziert. Nutzer hat die Erstellung des SMTP-Schlüssels „Wissensquiz Supabase“ und dessen ausschließliche Hinterlegung in Supabase ausdrücklich bestätigt. Ursprünglichen Schlüssel später deaktiviert und durch „Wissensquiz Supabase Ersatz“ ersetzt; dessen Ablauf 26.09.2027; laut Erstellungsdialog zusätzlich Ablauf nach 90 Tagen Inaktivität. Vor Ablauf erneuern. Kein Schlüssel in Chat, Dateien oder Git.
- Custom SMTP in Supabase gespeichert: `smtp-relay.brevo.com`, Port 587, Absendername „Wissensquiz“, verifizierte Absenderadresse und Brevo-Zugang ausschließlich im Dienst. Mindestintervall 60 Sekunden; Dashboard nennt nach Aktivierung 30 Mails/Stunde. Deutsche Confirm-sign-up- und Reset-password-Vorlagen aus Abschnitt 4 gespeichert; kein kostenpflichtiges Upgrade.
- Erster echter Registrierungsversuch am 26.09.2026 scheiterte mit HTTP 500; Supabase-Auth-Log zeigt SMTP `535 5.7.8 Authentication failed`. Kein Hinweis auf ein zu kurzes Quiz-Passwort. Bei der Diagnose lieferte die Browser-Zwischenablage nach Brevos Kopierbutton noch vorherigen Text; der ursprüngliche Schlüsseltransfer war daher nicht belastbar verifiziert.
- Ersatzschlüssel „Wissensquiz Supabase Ersatz“ direkt aus dem sichtbaren Brevo-Eingabefeld übernommen (Format geprüft), ausschließlich in Supabase eingetragen und mit „Successfully updated settings“ gespeichert. Ursprünglichen Schlüssel deaktiviert, nicht gelöscht. Neuer Schlüssel mit gleichem Ablauf 26.09.2027. Erneuter Nutzertest erfolgreich: Bestätigungsmail angekommen, Kontoaktivierung im Dashboard nachgewiesen.
- Brevo zeigte zunächst „Warten auf Log“; inzwischen ist die Bestätigungsmail beim Nutzer angekommen. Anonymes Tracking aktiviert; vollständige Tracking-Abschaltung ist in der aktuellen Oberfläche nicht verfügbar. Das Verhalten umgeschriebener Links muss bei der Abnahme geprüft werden.

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

Die beiden Vorlagen sind notwendig: Die App verwendet ausdrücklich `token_hash` und `type` im URL-Fragment. Sie entfernt den Token sofort aus der sichtbaren Adresse und prüft ihn erst nach dem ausdrücklich beschrifteten Bestätigungsbutton. Dadurch verbraucht ein einfacher Mail-Linkscanner den Token nicht schon beim Öffnen. Im direkten App-Link erscheinen Tokens nicht im HTTP-Pfad, in Quiz-Sicherungen oder in App-Logs. Brevo bietet in der aktuellen Oberfläche nur anonymisiertes Tracking, keine vollständige Abschaltung an. Die Anonymisierung ist aktiviert; sie verhindert keine Link-Umschreibung. Daher müssen zugestellte Bestätigungs-/Reset-Links einschließlich Fragment, privater Sites-Anmeldung und Weiterleitung vor Besucherfreigabe tatsächlich geprüft werden. [Brevo: anonymes Tracking](https://help.brevo.com/hc/en-us/articles/11643306229906-Can-I-anonymize-the-tracking-of-opens-and-clicks-for-my-emails). Es werden keine eigenen Mailpasswörter im Frontend benötigt.

## 5. Anbindung aktivieren und prüfen

Nach eingerichteter Datenbank und Mailversand `public/account-config.json` mit Project URL, Publishable Key und `enabled: true` befüllen. Der Account-Dienst wird per HTTPS aus dem Browser angesprochen; Postgres-Regeln im Dienst übernehmen die serverseitige Autorisierung. Die bestehende statische Sites-App benötigt dafür keinen eigenen Passwortserver und keine neue Site-ID.

Echte Dienstabnahme (offene Punkte unabhängig von lokalen Simulationen weiterverfolgen):

1. Registrieren → echte Bestätigungsmail → Link → Anmeldung. Vor Bestätigung keine private Speicherung.
2. Bestätigung erneut anfordern sowie abgelaufene und bereits verwendete Links prüfen.
3. Passwort-Reset → echte Mail → neues Passwort → Abmeldung → Anmeldung nur mit neuem Passwort. Auch Linköffnung auf einem anderen Gerät prüfen.
4. Konto A/B strikt getrennt; Gastspielstand erhalten. Automatische Sicherung, Laden bei Anmeldung auf anderem Gerät und parallelen Speicherkonflikt prüfen. Anonyme und fremde API-Zugriffe müssen abgewiesen werden.
5. Der Nutzer hat die öffentliche Erreichbarkeit jetzt ausdrücklich beauftragt. Die bisherigen Testempfehlungen werden dadurch nicht zu erledigten Prüfungen. Tatsächliche Freigabe unter Sites-Betrieb.md dokumentieren; offene Reset-/Geräteprüfungen beibehalten.

Anschließend nach [Sites-Betrieb](Sites-Betrieb.md) veröffentlichen, dieselbe Projekt-ID und URL verwenden. Ein öffentlicher Site-Aufruf und private Kontodaten sind getrennte Dinge; Gastmodus und Quizfragen wären dann öffentlich erreichbar, Kontodaten weiter durch Supabase Auth/RLS geschützt.

## Grenzen dieser Ausbaustufe

- Automatisches Laden bei Anmeldung/Neuladen und automatische Sicherung nach lokalen Änderungen. Offene Uploads werden wiederholt; Revision und Inhaltsfingerabdruck schützen vor Datenverlust. Keine automatische Zusammenführung konkurrierender Änderungen. Details unter Konten-und-Spielstaende.md.
- Lokaler Gast- und Kontospielstand sind getrennt. Kopieren des Gaststands und Ersetzen durch den Online-Stand verlangen eine ausdrückliche Auswahl; vorher JSON sichern. Zusätzliche lokale Rückfallkopie unter `recovery:…` im bestehenden IndexedDB-Store.
- Abmeldung blendet Kontodaten aus; sie löscht nicht deren lokale Rückfallkopien. Ein Gerät mit fremdem Browserprofil ist kein privater Datentresor. Kontolöschung kann der Eigentümer derzeit im Supabase-Dashboard durchführen; die Online-Zeile wird durch den Fremdschlüssel mitgelöscht. Eine Selbstbedienungsfunktion zur Kontolöschung ist noch nicht eingebaut.
- Ein neu geladenes Konto benötigt Internet zur Sitzungsprüfung. Der bisherige Offline-Gastmodus bleibt verfügbar. Bereits geladene Kontorunden speichern lokal; Online-Abgleich erfolgt mit Verbindung.
- Die freiwillige gemeinsame Trainingsrangliste berechnet Punkte serverseitig aus dem gespeicherten Stand, überprüft aber nicht unabhängig den Spielablauf. Online gesicherte lokale Rekorde sind keine manipulationssicheren Wettbewerbswerte.

## Quellen und Prüfstand

[Sites: getrennte Freigabe und Identität](https://learn.chatgpt.com/docs/sites#control-access-and-secrets), [Supabase Passwort-Anmeldung](https://supabase.com/docs/guides/auth/passwords), [Mailvorlagen](https://supabase.com/docs/guides/auth/auth-email-templates), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

Der Datenbanktest führt die echte Migration in lokalem Postgres/WASM (PGlite) mit nachgebildetem `auth.users`/`auth.uid()` aus und prüft Rollen, RLS und Revisionskonflikte. Browserprüfungen nutzen das echte Supabase-SDK mit simulierten HTTP-Antworten; sie belegen keine Mailzustellung und keine Einrichtung eines echten Supabase-Projekts.

## Ergänzung: gemeinsame Trainingsrangliste, 26.09.2026

[202609260002_shared_records.sql](../supabase/migrations/202609260002_shared_records.sql) wurde nach der Kontenmigration im bestehenden Projekt erfolgreich innerhalb einer Transaktion ausgeführt. Nicht erneut ausführen. Die Erweiterung legt nur getrennte Freigaben und abgeleitete Ergebniszusammenfassungen an; sie ändert keine privaten Spielstände und aktiviert keine Teilnahme für bestehende Konten.

Im echten SQL Editor nachgewiesen: RLS auf beiden neuen Tabellen aktiv, keine anonymen Leserechte, keine direkten Schreibrechte für Konten, Ranglistenfunktion nur für angemeldete Konten ausführbar, interne Ableitungsfunktion nicht für Konten ausführbar. Die Funktionen prüfen zusätzlich bestätigte, nicht anonyme Identität. Lokale Datenbanktests prüfen Einwilligung, Rücknahme, Eigentümerbindung, Pagination und Gleichstände. Ein gemeinsamer Nutzertest mit zwei echten Konten bleibt offen.

Migration [202609260003_player_rankings.sql](../supabase/migrations/202609260003_player_rankings.sql) wurde anschließend ebenfalls im bestehenden Projekt erfolgreich ausgeführt. Sie ergänzt ausschließlich die lesende Funktion `quiz_players` mit eigener bestätigter Benutzerprüfung, freiwilliger Teilnahme, begrenzter Ergebnismenge und ohne private IDs. Anonyme Ausführung entzogen, für Konten erlaubt. Keine zusätzlichen Konten oder Teilnahmefreigaben angelegt.

## Automatische Teilnahme und direkte Highscores, 26.09.2026

Auf ausdrücklichen Nutzerauftrag [Migration 004](../supabase/migrations/202609260004_automatic_rankings.sql) im bestehenden Projekt erfolgreich ausgeführt. Nicht erneut ausführen. Ersetzt die freiwillige Teilnahme aus 002/003: bestätigte Konten sind automatisch in den Ranglisten, bestehende gesicherte Ergebnisse wurden neu abgeleitet, keine privaten Spielstände geändert. Spieler ohne Runde erscheinen in ungefilterten Aktivitätslisten mit null; Trefferquoten behalten die Mindestmenge. Namens-/Bestätigungsänderungen aktualisieren Ergebniszusammenfassungen.

Echter Rechtenachweis: anonyme Spieler-RPC-Ausführung false, Konto-Ausführung true, Abwahl-RPC-Ausführung für Konten false, direkte Ergebnisleserechte false. Ergebnisableitung enthält keine Freigabeprüfung mehr. Zum Prüfzeitpunkt null vorhandene Rekordzusammenfassungen; keine echten Testspiele angelegt. Lokale Datenbanktests prüfen Altbestandübernahme, automatische Aufnahme, Sperre der Abwahl, Fremdzugriff, Nullrunden-Spieler und unbestätigte Konten. Gemeinsame echte Zwei-Spieler-Abnahme weiterhin offen.

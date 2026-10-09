# Eigene Quiz-Konten einrichten

## Stand

03.10.2026 lokal vorbereitet: [Rekordmodi und Zeitranglisten](Rekordmodi-und-Zeitranglisten.md) mit Migration `20261003103026_record_modes_highscores.sql`. Sie setzt die ebenfalls lokal vorbereitete Migration `202610030001_public_leaderboard_guest_activity.sql` voraus. Beide sind vor Veröffentlichung der neuen gemeinsamen Listen in dieser Reihenfolge anzuwenden; anschließend Rechte, öffentliche Kategorien/Einzelläufe, Duellrangliste, private Duellhistorie und Kontosicherung lesend prüfen. Der aktuelle Umsetzungsauftrag umfasst keine Live-Ausführung. Persönliche Rekordspiele sind offline nutzbar.

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

## Inaktivität und Entwicklungsbetrieb (geprüft am 09.10.2026)

Die bestehende Einrichtung hat drei getrennte Inaktivitätsregeln:

- **Brevo-SMTP-Schlüssel:** Nach 90 Tagen ohne erfolgreich über genau diesen Schlüssel versendete E-Mail wird er deaktiviert. Ein Login ins Brevo-Dashboard, eine Quiz-Anmeldung mit Passwort oder Versand über einen anderen Schlüssel genügt dafür nicht. Selbst „kein Ablaufdatum“ hebt die Inaktivitätsregel nicht auf. Deaktivierte Schlüssel lassen sich im Dashboard reaktivieren. Zusätzlich bleibt das bei unserer Einrichtung dokumentierte feste Ablaufdatum **26.09.2027** bestehen; regelmäßige Nutzung verlängert dieses nicht. [Offizielle Schlüsselregeln](https://help.brevo.com/hc/en-us/articles/7959631848850-Create-and-manage-your-SMTP-keys).
- **Brevo-Free-Konto:** Nach vier Monaten ohne Nutzung droht dauerhafte Kontolöschung. Brevo kündigt dies 30, 15, sieben und einen Tag vorher an. Dashboard-Anmeldung setzt die Frist zurück; automatische Aktivitäten wie Transaktionsmails gelten ebenfalls als Nutzung. [Offizielle Kontoregeln](https://help.brevo.com/hc/en-us/articles/4410311028626-Can-my-Free-Plan-account-be-deleted-due-to-inactivity-).
- **Supabase Free:** Geringe Benutzer-Datenbankaktivität über sieben Tage kann zur Projektpause führen. Laut Anbieter reichen üblicherweise einige Datenbankanfragen täglich; eine exakte garantierte Mindestzahl wird nicht genannt. Eine einzelne Anmeldung alle paar Wochen ist keine verlässliche Vorsorge. Pausierte Projekte lassen sich laut aktueller Dokumentation bis zu einem Jahr nach der Pause im Dashboard wieder aufnehmen; frühere Angaben von 90 Tagen sind für diese aktuelle Regel überholt. Pro verhindert Inaktivitätspausen. [Offizielle Pausenregeln](https://supabase.com/docs/guides/platform/free-project-pausing).

**Betriebsvorschlag, noch nicht eingerichtet:** Für die Entwicklungsphase täglich einige kleine lesende Anfragen über die Datenbank-API und monatlich eine gekennzeichnete Testmail an ein festgelegtes eigenes Testpostfach über denselben SMTP-Schlüssel wie Supabase. Keine wiederholten Registrierungen oder Passwortänderungen an echten Konten. Mailannahme durch den Versanddienst und tatsächliche Zustellung unterscheiden; Fehler sichtbar melden. Der Zeitgeber sollte unabhängig vom geöffneten Quiz und möglichst von einem eingeschalteten Entwicklungsrechner laufen. Ein solcher Prüfjob vermindert das Pausenrisiko im Free-Tarif, garantiert aber keine Verfügbarkeit. Vor dem festen Schlüsselablauf separat erneuern. Bei verbindlich erforderlicher Erreichbarkeit ist ein Tarif ohne Inaktivitätspause die belastbarere Lösung.

Diese Recherche bestätigt Anbieterregeln und die dokumentierte Einrichtung, keinen aktuellen Live-Konto- oder Schlüsselstatus. Keine Testmail, Automatisierung, Tarifänderung oder Live-Konfigurationsänderung ausgeführt.

### Täglicher Betriebsjob ab 09.10.2026

Auf anschließenden Nutzerauftrag **live eingerichtet**: `wissensquiz-daily-service-check` läuft über Supabase Cron täglich um **07:17 UTC**, entsprechend **09:17 Uhr im Sommer / 08:17 Uhr im Winter** in Europe/Berlin. Der Rechner und die Quiz-App müssen dafür nicht laufen. Ein erster manueller Live-Lauf um 09:36:48 Uhr Europe/Berlin lieferte dreimal HTTP 200 und eine gültige Antwort der vorhandenen öffentlichen Versionsabfrage `quiz_app_release(57)`.

Der Job führt drei kleine HTTP-API-Abfragen der vorhandenen Versionsmetadaten aus. Die bewährte Veröffentlichungszeile 57 bleibt ein dauerhafter Prüfanker, unabhängig von neueren App-Versionen. Bei konfigurierter, bestätigter eigener Empfängeradresse fordert er außerdem alle **30 Tage** eine reguläre **„Passwort zurücksetzen“-Mail** über Supabase an. Damit wird genau die bestehende Brevo-SMTP-Anbindung verwendet; kein SMTP-Schlüssel muss kopiert oder zusätzlich gespeichert werden. Der Job bestätigt keinen Mailtoken, meldet sich nicht als Spieler an und ändert kein Passwort. Eine erfolgreiche HTTP-Annahme bestätigt noch keine Zustellung im Postfach. Fehlgeschlagene Mailanforderungen werden frühestens nach einem Tag erneut versucht; parallele Aufrufe sind serialisiert.

**Noch offen:** eigene Empfängeradresse vom Nutzer erfragt, bisher nicht konfiguriert. Datenbankprüfung läuft bereits, Mailprüfung steht bis dahin auf `not_configured`. Es wurde keine Mail an eine vermutete Adresse gesendet.

Die [SQL-Einrichtung](../supabase/migrations/20261009073417_daily_service_check.sql) aktiviert `pg_cron` und `http`. Konfiguration und Status liegen im nicht öffentlich freigegebenen Schema `quiz_ops`; RLS ist aktiv, `anon`, `authenticated` und `service_role` haben weder Schema-/Tabellenzugriff noch Ausführungsrecht. Die Funktion läuft mit Betreiberrechten als `SECURITY INVOKER`. Sie verwendet ausschließlich den vorhandenen öffentlichen Publishable Key. Private Empfängeradressen gehören nur in die geschützte Live-Konfiguration, nicht ins Repository. Die Statushistorie enthält ausschließlich Zeit, HTTP-Status, Ergebniskennungen und gegebenenfalls SQLSTATE-Codes; keine Mailadressen, Mailinhalte, Tokens oder Spielstände. Nur Betriebsprotokolle älter als 90 Tage werden entfernt.

Eine ergänzende **Codex-Kontrolle täglich um 10:00 Uhr Europe/Berlin** ist als aktiver Termin in diesem Chat eingerichtet (`wissensquiz-betriebspr-fung`). Sie meldet neue Störungen, Erholungen, ausbleibende Läufe über 36 Stunden und den festen SMTP-Ablauf spätestens 30 Tage vorher. Gesunde oder unveränderte Zustände bleiben still. Diese Kontrolle ändert keine Daten und fordert keine weiteren Mails an; sie hängt von der Verfügbarkeit der Codex-Automation ab. [Offizielle Hinweise zu lokalen Terminen](https://learn.chatgpt.com/docs/automations?surface=app).

**Betriebsgrenzen:** Der eigentliche Cronjob liegt im überwachten Supabase-Projekt. Er kann ein bereits pausiertes Projekt nicht selbst wieder aufnehmen und ist keine garantierte Ausnahme von der Free-Pausenregel. Die zusätzliche Kontrolle meldet eine erkannte Pause. Das feste dokumentierte Schlüsselablaufdatum 26.09.2027 bleibt bestehen. Keine Tarifänderung, kein GitHub-Push und keine neue Sites-Veröffentlichung erforderlich.

Betreiberprüfung ohne private Konfiguration auszulesen:

```sql
select jobname, schedule, active from cron.job
where jobname = 'wissensquiz-daily-service-check';
select checked_at, database_statuses, database_ok, mail_state, mail_status, error_codes
from quiz_ops.service_checks order by id desc limit 5;
select smtp_expires_on, mail_recipient is not null as mail_configured
from quiz_ops.service_config;
```

Zum Anhalten `select cron.unschedule('wissensquiz-daily-service-check');` ausführen und den ergänzenden Codex-Termin separat deaktivieren. Status und Konfiguration bleiben erhalten. [Supabase Cron](https://supabase.com/docs/guides/cron), [HTTP-Erweiterung](https://supabase.com/docs/guides/database/extensions/http), [Mailanforderung und Passwortänderung als getrennte Schritte](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail).

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


## Fehlertraining: Migration angewendet (02.10.2026)

[202610020001_error_training_rankings.sql](../supabase/migrations/202610020001_error_training_rankings.sql) wurde nach der lokalen PGlite-Prüfung im bestehenden Supabase-Projekt erfolgreich ausgeführt. Nicht erneut ausführen. Die Migration erweitert die Modusliste der Spielerleistungsfunktion um Fehlertraining; Tabellen, private Stände, automatische Teilnahme und Rekordprojektion bleiben erhalten. Die anschließende lesende Live-Prüfung bestätigt: Fehlertraining aktiv, anonyme RPC-Ausführung gesperrt, Konto-Ausführung erlaubt und keine anonymen Leserechte auf private Spielstände. Tests decken 50-Antworten-Schwelle, Fehler/Zeitabläufe, Filter und abgebrochene Fehlerrunden ab. Keine realen Spielstände für Testspiele verändert.

## Spielervergleich und Keine Ahnung: Migration angewendet (02.10.2026)

[202610020003_fast_player_rankings.sql](../supabase/migrations/202610020003_fast_player_rankings.sql) nach PGlite- und zurückgerollter Live-Prüfung erfolgreich angewendet. Antwortgeschichten werden einmal entpackt und anschließend zugeordnet; Live-Messung rund 932 ms. Alle drei Wertungen liefern den eigenen Eintrag. Rechte unverändert bestätigt. Die Funktion enthält bereits die Zählung von „Keine Ahnung“; Migration 002 im bestehenden Projekt nicht nachträglich einzeln ausführen, da sie die langsamere Abfrage wieder einsetzen würde. Frische Projekte verwenden alle Migrationen in aufsteigender Reihenfolge. Tabellen, private Stände, automatische Teilnahme und Rekordprojektion bleiben erhalten. [Diagnose und Nachweis](Spielervergleich-Stoerung.md).


## Filmkarriere am 02.10.2026

[Migration 202610020004](../supabase/migrations/202610020004_film_career.sql) ergänzt globale XP in quiz_players und quiz_rankings sowie die globale Sortierung experience. Am 02.10.2026 nach PGlite-Prüfung im bestehenden Projekt nach Migration 003 erfolgreich innerhalb einer Transaktion angewendet. Nicht erneut ausführen. Acht lesende Live-Prüfungen erfolgreich: neue Rückgabeformen, Konto-Ausführung beider Ranglisten, gesperrte anonyme Ausführung, gesperrte interne XP-Ableitung für Konten und anonyme Zugriffe, geschützte private Stände, aktuelle XP und übertragener Altlevel sowie erhaltener Duellkatalog. Keine Nutzerspielstände verändert. Historische Migrationen nicht nachträglich einzeln einspielen. [Fachvertrag](Filmkarriere-und-XP.md).

## Asynchrone Filmduelle eingerichtet (02.10.2026)

[Migration 202610020005](../supabase/migrations/202610020005_async_duels.sql) im bestehenden Wissensquiz-Projekt erfolgreich in einer Transaktion ausgeführt. Nicht erneut ausführen. Sie benötigt die Kontengrundlage aus 202609260001 und ist unabhängig von der inzwischen ebenfalls angewendeten Filmkarriere-Migration 004. Vier getrennte Tabellen mit RLS, keine direkten Clientrechte, acht authentifizierte RPCs und fünf gesperrte interne Helfer. Private Spielstände, Kontenkonfiguration und Ranglistenfunktionen werden nicht ersetzt. Die abschließende Metadatenfilterung in `quiz_duel_view` wurde vor Freigabe ebenfalls live aktualisiert; lokale Migration enthält den finalen Stand.

`npm run prepare:duels` erzeugt ausschließlich aus öffentlichen App-Paketen `tmp-duels/catalog.sql` und `tmp-duels/catalog.csv`, aktuell **4.827 Fragen/4.347 Wissensziele** ohne Demo/Experte. Kein persönlicher Spielstand wird gelesen. Erzeugte Dateien bleiben lokal ignoriert. Erstbefüllung am 02.10.2026 über CSV-Import in die vorher leere `quiz_duel_catalog` erfolgreich; alle Frageobjekte sind JSON-Objekte mit vier Antworten. Bei späteren Katalogupdates das transaktionale SQL mit Upsert verwenden: bisherige Einträge deaktivieren, aktuelle aktivieren und aktualisieren. Laufende Duelle behalten ihre eigenen eingefrorenen Snapshots. CSV-Import ist für eine leere Tabelle gedacht und überschreibt keine vorhandenen IDs.

Lesender Live-Nachweis: vier RLS-Tabellen, null direkte Tabellenrechte für `anon`/`authenticated`, acht ausführbare Duell-RPCs für Konten, null anonyme Ausführungsrechte und null Kontorechte auf interne Helfer. Zusätzlich eine transaktionale Funktionsprüfung mit synthetischem Konto: Duellstart aus dem echten Katalog, bestätigte Antwort, idempotente Wiederholung und gesammelte Lösungsfilter einschließlich CSV-Metadaten erfolgreich. Gesamter Lauf zurückgerollt; anschließende Prüfung bestätigt keine verbliebenen Testkonten oder Testduelle. Keine echten Nutzerspielstände als Testmaterial verwendet.

Fristablauf wird bei jeder Duelloperation serverseitig ausgewertet, einschließlich Listenabruf und neuem Start; kein Cron-/Pushdienst erforderlich. Effektiver Abschlusszeitpunkt ist die Frist. E-Mail-Erinnerungen, Push und administrative Fristkorrektur sind nicht implementiert. [Spielvertrag](Asynchrone-Filmduelle.md).

Die App mit Duelleinstieg und Filmkarriere ist als Sites-Version 36 veröffentlicht. Beide Servermigrationen sind live eingerichtet. Lokale SQL-/Browsertests ersetzen keinen Nutzertest mit zwei echten Konten und Mobilverbindungen; dieser bleibt nach Veröffentlichung offen.

## Ausgeglichene Jahresantworten für neue Duelle (03.10.2026)

[20261003204000_balanced_year_answers.sql](../supabase/migrations/20261003204000_balanced_year_answers.sql) und [20261003205300_year_answer_ids.sql](../supabase/migrations/20261003205300_year_answer_ids.sql) am 03.10.2026 nativ erfolgreich angewendet. Nicht erneut ausführen. Die erste Migration ergänzt den privaten, flüchtigen Helfer `quiz_year_question(jsonb)` und ruft ihn einmal je ausgewählter Frage beim Erstellen eines neuen Duells auf. Die zweite erhält bei CSV-Fragen alle ursprünglichen Antwort-IDs, damit deren Schreibweise keinen Lösungshinweis gibt. Richtige Lösung und ID bleiben erhalten. Der gemeinsame Fragensatz mit Antwortreihenfolge wird danach wie bisher unveränderlich gespeichert; wiederholter Start mit derselben Anforderungs-ID liefert dasselbe Duell.

Die chronologische Position der richtigen Jahresantwort wird gleichmäßig unter den möglichen vier Rängen gezogen. Falsche Jahre liegen bei leicht 8–25, mittel 3–10 und schwer/Experte 3–8 Jahre entfernt. Katalog und bestehende Duelle werden nicht umgeschrieben. Lesender Produktionsvergleich vor und nach beiden Migrationen bestätigt unveränderte Inhalte: ein Duell (`ec4e3383d5fd0ce9aa39d41abb46ee75`), zehn Antworten (`1e1f257d20e6718a2b863068792cba0f`) und 4.827 Katalogfragen (`14a457c93f970556278edee92b72c1bb`). Private Kontospeicherung ist nicht Gegenstand der Migrationen.

`anon` und `authenticated` besitzen keine Ausführungsrechte auf den Helfer; `quiz_duel_create(text,boolean,uuid)` bleibt nur für angemeldete Konten zugänglich. Keine anonymen Leserechte auf Duelltabellen. Synthetische lesende Generatoraufrufe gegen den öffentlichen Katalog bestätigen alle vier Ränge und bei 100 CSV-Varianten unveränderte Antwort-IDs. Keine Testkonten oder Testduelle in Produktion angelegt. Lokal prüfen vier PGlite-Fälle alle 550 Jahresfragen, Verteilung, Rollen sowie unveränderte alte und idempotente neue Duelle. Die frühere vollständige Funktionsdefinition ist als ignorierter lokaler Rückfallentwurf erhalten. [Fachvertrag](Asynchrone-Filmduelle.md), [Prüfnachweis](Pruefbericht.md).

## Öffentliche Bestenliste und Gastaktivität eingerichtet (03.10.2026)

[Migration 202610030001](../supabase/migrations/202610030001_public_leaderboard_guest_activity.sql) am 03.10.2026 erfolgreich über die Supabase-Verbindung angewendet; nicht erneut ausführen. Im Migrationsverlauf als `20261003055257_public_leaderboard_guest_activity` registriert. Erfassungsbeginn 07:52:57 Uhr Europe/Berlin. Ergänzt die auf ausdrücklichen Nutzerwunsch öffentliche Spielerbestenliste, sieben deutsche Gastaktivitätstage und eine anonyme idempotente Meldefunktion. Zwei neue RLS-Tabellen ohne direkte Clientrechte; private Saves und bestehende angemeldete Ranglisten unverändert geschützt. Lesender Live-Nachweis erfolgreich: beide Tabellen mit RLS und ohne direkte Clientrechte, öffentliche RPC-Ausführung für anon/authenticated, Gastmeldung nur für anon; private Saves ohne anonyme Rechte und ohne direkte Kontoschreibrechte. Bestehender gefilterter Spieler-RPC weiterhin nur für Konten. Beide öffentlichen Lese-RPCs liefern HTTP 200 und die erwarteten Rückgabefelder; Gastübersicht mit sieben Tagen. App anschließend als Sites-Version 38 veröffentlicht. Keine historischen Migrationen erneut einzeln ausführen. Die Erfassung beginnt mit der Migration; Gastmeldungen davor werden nicht nachträglich gezählt. [Fachvertrag, Aufbewahrung und Grenzen](Bestenliste-und-Gastaktivitaet.md).

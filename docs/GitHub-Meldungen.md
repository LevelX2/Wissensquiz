# Meldungen aus Spiel und Profil

## Stand – 04.10.2026

Auf [Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-04%20Nutzerauftrag%20GitHub-Meldungen.txt) umgesetzt: „Frage melden“ öffnet das gemeinsame Meldeformular mit Fragenbezug. Profil → „Problem oder Verbesserung melden“ bietet dasselbe Formular für allgemeine Rückmeldungen. Angemeldete, bestätigte Quiz-Konten können ein öffentliches Issue in [LevelX2/Wissensquiz](https://github.com/LevelX2/Wissensquiz/issues) erstellen; ein eigenes GitHub-Konto ist nicht erforderlich. Gäste erhalten einen Anmeldehinweis.

Die Oberfläche ist seit **Sites-Version 55** am 04.10.2026 um 18:41:47 Uhr Europe/Berlin veröffentlicht. Die neue Datenbankerweiterung und Edge Function sind in Supabase eingerichtet. **Der GitHub-Schlüssel fehlt noch:** Im Dashboard waren am 04.10.2026 keine benutzerdefinierten Function-Secrets hinterlegt. Ein echter Versand bis zum GitHub-Issue wurde deshalb noch nicht abgenommen. [Veröffentlichungsnachweis](Sites-Betrieb.md#version-55-porträts-lösungsanzeige-antworttöne-und-github-meldeformulare).

## Formular und veröffentlichte Angaben

| Auswahl | GitHub-Label |
| --- | --- |
| Technischer Fehler | `meldung:technik` |
| Inhalt falsch | `meldung:inhalt` |
| Textverbesserung | `meldung:text` |
| Sonstiges | `meldung:sonstiges` |

Erforderlich sind ein Kurztitel mit 3–120 Zeichen, eine Beschreibung mit 10–4.000 Zeichen und die ausdrückliche Zustimmung zur öffentlichen Veröffentlichung. Das Issue enthält Typ, Titel, Beschreibung, App-Version und bei Fragenmeldungen Fragen-ID sowie Inhaltsversion. Die Version stammt aus der veröffentlichten Sites-Version; lokale Builds ohne Versionswert melden 0. E-Mail-Adresse, Kontoname, Konto-ID, Antworten und Spielstand werden nicht automatisch übertragen. Der Hinweis warnt vor privaten Angaben im Freitext. HTML und automatische @-Erwähnungen werden im Issue-Text entschärft.

Erfolg erscheint erst nach einem bestätigten GitHub-Beleg und enthält einen Link zur konkreten Issue-Nummer. Bis dahin bleibt der eingereichte Inhalt mit derselben Meldungs-ID im Sitzungsspeicher des Browser-Tabs, getrennt nach Konto und Fragenbezug. Er übersteht Neuladen desselben Tabs und wird nach bestätigtem Versand entfernt. „Versand erneut prüfen“ verwendet denselben Inhalt und dieselbe ID. Währenddessen ist die eingereichte Meldung nicht mehr editierbar. Schließen des Tabs beendet diese lokale Wiederaufnahmemöglichkeit; der Serverbeleg bleibt erhalten.

Neue Meldungen werden nicht im Quiz-Spielstand gespeichert. Frühere lokale Fragenmeldungen bleiben über Profil → Optionen als JSON exportierbar und werden nicht automatisch versendet. Kontoübernahme, private Sicherung und Meldungsversand sind getrennte Vorgänge.

## Versand und Berechtigungen

Der Browser ruft `quiz-report` mit der bestehenden Quiz-Sitzung auf. Die Plattformprüfung `verify_jwt` bleibt eingeschaltet. Die Function prüft zusätzlich den aktuellen Benutzer über Supabase Auth `/user`, einschließlich bestätigter E-Mail und Ausschluss anonymer Konten. Ein öffentlicher API-Schlüssel allein berechtigt nicht zum Versand. Erlaubte Browser-Ursprünge sind die bestehende öffentliche Quiz-URL sowie `localhost:5173` und `localhost:4173`. [Supabase-Authentifizierung](https://supabase.com/docs/guides/functions/auth-headers).

`supabase/functions/quiz-report/index.ts` verwendet die automatisch injizierte `SUPABASE_URL` und den Eintrag `default` aus `SUPABASE_SECRET_KEYS`. Der Schlüssel bleibt ausschließlich in der Serverlaufzeit. Datenbankaufrufe verwenden ihn im `apikey`-Header; der Benutzer-Bearer wird nur für die Auth-Prüfung verwendet. [Supabase-Schlüssel](https://supabase.com/docs/guides/getting-started/api-keys).

Die neue Tabelle `quiz_reporting.submissions` speichert Meldungs-ID, privaten Kontobezug, Inhalts-Hash, Status, Zeitpunkte und gegebenenfalls den GitHub-Beleg. Sie speichert keinen Beschreibungstext und keinen Spielstand. RLS ist eingeschaltet; `anon` und `authenticated` haben weder Schema- noch Tabellenrechte. Die beiden RPCs `quiz_issue_begin` und `quiz_issue_finish` laufen als `SECURITY INVOKER` und sind nur für `service_role` ausführbar. Bei Kontolöschung wird der private Versandbeleg mit gelöscht; das bereits veröffentlichte GitHub-Issue wird dadurch nicht gelöscht.

Pro Konto gelten höchstens fünf neue Meldungen in 24 Stunden und mindestens 60 Sekunden Abstand. Gleichzeitige Reservierungen werden je Konto serialisiert. Gleiche ID mit gleichem Inhalt liefert denselben Beleg; eine andere Konto-ID oder geänderter Inhalt bei gleicher Meldungs-ID wird abgewiesen.

Vor dem Issue wird das feste Typ-Label geprüft und bei Bedarf erstellt. Ein Fehler vor der Issue-Erstellung oder eine eindeutige GitHub-Ablehnung bleibt mit derselben ID wiederholbar. Bei unklarem Ausgang eines Create-Aufrufs wird **kein zweites Issue automatisch erstellt**: Nach mindestens 60 Sekunden sucht die Function anhand ihrer eingebetteten Meldungs-ID nach dem vorhandenen Issue. Die Suche umfasst bis zu fünf Seiten mit je 100 seit der Reservierung aktualisierten Issues, einschließlich geschlossener Issues. Ein Treffer bestätigt den Versand. Ohne Treffer bleibt er unbestätigt; bei dauerhaft unklarem Zustand ist eine manuelle Betreiberprüfung erforderlich. Es gibt keine Hintergrundwarteschlange.

## GitHub-Schlüssel einrichten

1. In [GitHub einen Fine-grained Personal Access Token erstellen](https://github.com/settings/personal-access-tokens/new). Zugriff ausschließlich auf `LevelX2/Wissensquiz` begrenzen; Repository-Berechtigung **Issues: Read and write** wählen. Keine Code- oder Organisations-Schreibrechte für diesen Versand nötig.
2. In [Supabase → Edge Functions → Secrets](https://supabase.com/dashboard/project/nadhixddmpshndqpmzqi/functions/secrets) den Namen `GITHUB_REPORT_TOKEN` und den Token-Wert hinterlegen. Den Wert nicht in Chat, Quellcode, Dokumentation oder Veröffentlichungspaket kopieren.
3. Nach ausdrücklich beauftragter Sites-Veröffentlichung eine bewusst freigegebene Meldung mit bestätigtem Quiz-Konto prüfen: genau ein Issue, passendes Label, richtige App-/Fragenversion und nachvollziehbarer Link. Dieselbe Meldung erneut prüfen darf kein zweites Issue erzeugen. Bei Ablauf oder Widerruf den Token im selben Secret ersetzen.

Supabase übernimmt geänderte Secrets ohne erneute Function-Bereitstellung. Labels werden beim ersten Versand je Typ angelegt. [Function-Secrets](https://supabase.com/docs/guides/functions/secrets), [GitHub: Issue erstellen](https://docs.github.com/en/rest/issues/issues#create-an-issue), [GitHub: Label erstellen](https://docs.github.com/en/rest/issues/labels#create-a-label).

## Einrichtung und Prüfnachweis

Migration `20261004161423_quiz_issue_reporting` nativ erfolgreich im bestehenden Projekt eingerichtet; lokaler Dateiname an die bestätigte Remote-Version angeglichen. Function `quiz-report`, ID `4966b4e0-fb40-4d69-a6f6-e175001b2b47`, Version 2, Status `ACTIVE`, JWT-Prüfung eingeschaltet. Paket-SHA-256: `c802c13ffdf937037a60e7e9abe378288cbc004f81ed22a46222bb1e6bb1c41a`. Beim Update musste der Importmap-Pfad ausdrücklich auf `deno.json` gesetzt werden, da der native Dienst sonst den absoluten Pfad der früheren Bereitstellung übernahm.

Live lesend geprüft: Tabellen-RLS, fehlende Clientrechte und ausschließlich serverseitige RPC-Ausführung. HTTP-Vorprüfung liefert 204 mit passendem Ursprung; fehlender Benutzer und öffentlicher API-Schlüssel ohne Benutzersitzung werden mit 401 abgewiesen. Die öffentlichen Signaturschlüssel verwenden ES256, von der aktuellen Plattformprüfung unterstützt. Der neue Advisor-Hinweis `rls_enabled_no_policy` ist hier beabsichtigt: Diese private Tabelle besitzt überhaupt keinen Clientzugang; nur die Serverrolle greift darauf zu. Keine neue Advisor-Warnung durch die Erweiterung.

Lokale Tests simulieren GitHub und Quiz-Konten; sie erzeugen keine echten Issues und verändern keine echten Spielstände. Datenbankrechte, Parallel-/Wiederholungszustände, Grenzen, Veröffentlichungseinwilligung, Datenschutz und mobile Anzeige sind abgedeckt. Details und verbleibende Abnahmegrenzen im [Prüfbericht](Pruefbericht.md#04102026--github-meldungen-aus-spiel-und-profil).

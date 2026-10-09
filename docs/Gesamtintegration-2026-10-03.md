# Gesamtintegration und Finale vom 03.10.2026

Auftrag: alle offenen Änderungen aller Branches unter Erhaltung ihrer Absichten lokal nach `main` integrieren und anschließend die bestehende öffentliche Site veröffentlichen. GitHub-Push und Branchlöschung sind nicht Teil des Auftrags.

## Erhaltene Arbeit

Alle 22 lokalen Branches sind Vorfahren des gemeinsamen Integrationsstands und bleiben im Git-Verlauf erhalten. Die offenen Arbeitsstände im Hauptordner und im Rekordmodi-Worktree wurden zuvor in nachvollziehbaren lokalen Commits gesichert. Die übrigen vier Worktrees waren sauber.

- Strukturverbesserungen, ausgelagerte Oberflächenmodule, verzögert geladene Nebenansichten, Antwortoptimierung und Eintragskontospeicher aus `codex/speicher-sync-optimierung` bilden die aktuelle Grundlage.
- Offene Fragedaten-/Bestenlistenarbeit, Quellen und kompakte Auswahlklappen aus `codex/schauspieler-veroeffentlichung` bleiben erhalten. Die Sololösungswahl bleibt entsprechend dem späteren Bedienvertrag unter Profil → Optionen.
- `codex/rekordmodi` ergänzt Lernen/Auf Zeit/Duell, 10 Fragen/Fehlerfrei/Zeitkonto, jeden abgeschlossenen Lauf einschließlich Nullpunkten und die Berliner Zeiträume Woche/Monat/Jahr/Allzeit. Die Implementierung ist in die aktuellen Modul- und Speichergrenzen übertragen; unabhängige Personenreisen bleiben erhalten.
- Personenredaktion und Veröffentlichung 41, Kategorieillustrationen und Veröffentlichung 35 mit Keine-Ahnung-/Vergleichsverbesserungen sind im Verlauf enthalten. Frühere Veröffentlichungsnachweise bleiben dokumentiert.
- P02/P03 mit 600 weiteren Fragen für 75 Personen sind vollständig in den spielbaren App-Katalog integriert: 1.400 Schauspielerfragen für 175 Personen, insgesamt 6.277 Fragen und 5.734 Wissensziele. Originalquellen und Recherchebelege bleiben bytegleich; 13 bestätigte Bestandsbezüge teilen ihre Wissensziele. Die Ableitung und Prüfsummen dokumentiert [Schauspieler-Ergaenzungen-Integration.json](Schauspieler-Ergaenzungen-Integration.json).

Alle 18 bisherigen öffentlichen CSV und die bisherigen Roh-CSV sind gegenüber der neuesten Speicher-/Sync-Grundlage unverändert. Lernidentitäten, ursprüngliche Fragen und bestehende Kontosicherungen bleiben erhalten. Zwei neue abgeleitete App-CSV ergänzen den Bestand. Build, Testprofile, Quellcheckout, Laufzeitartefakte und Zugangsdaten bleiben außerhalb der Versionierung.

## Server

Die Migration `20261003103026_record_modes_highscores.sql` ist als Supabase-Migration `20261003121414_record_modes_highscores` erfolgreich live eingerichtet. Sie ergänzt begrenzte öffentliche Einzellauf-Ergebnisse und Duellwertung, private Duellhistorie und die erweiterten Speicherfelder. Bestehende Eintragssynchronisierung und kleine Statistikprojektionen bleiben erhalten. Ereignisse sind eindeutig je Antwortposition, wiederholte Fragen nur in Endlosmodi erlaubt.

Die ergänzende Migration `20261003121600_record_statistics_event_lookup.sql` erstellt eine Ereigniszuordnung einmal je abgeschlossenem Lauf. Dadurch wird die Antwortliste auch bei langen Endlosläufen nicht pro Frage erneut durchlaufen. Lokale Datenbankprüfungen und native Anwendung erfolgreich; live registriert als `20261003121725_record_statistics_event_lookup`.

Private Alt-Sicherung und Kontoeinträge sind vor/nach der Migration inhaltgleich geprüft. Öffentliche Ergebnisse sind freigegeben; direkte Ergebnis-Tabellenzugriffe, private Projektionen und Gastzugriff auf die eigene Duellhistorie bleiben gesperrt. Es wurden keine realen Testspiele oder Gastmeldungen erzeugt.

Die Sicherheitsprüfung meldet weiterhin die bewusst über geschützte Funktionen verwendeten Tabellen ohne direkte RLS-Policy und die ausdrücklich öffentlichen Ergebnisfunktionen. Der bestehende Hinweis zur fehlenden Prüfung kompromittierter Passwörter bleibt unverändert: [Supabase-Hinweis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Keine neuen direkten Zugriffe auf private Daten.

Die Migration `20261003125000_app_release_metadata.sql` ist live als `20261003125739_app_release_metadata` eingerichtet. Profil zeigt die Build-Version sowie den erst nach bestätigtem Deployment eingetragenen Veröffentlichungszeitpunkt aus der öffentlichen Abfrage `quiz_app_release`. Der letzte bestätigte Zeitwert bleibt offline verfügbar; ein Ausfall blockiert das Spiel nicht. Keine direkte Tabellenfreigabe für Browserkonten.

Der neue unveränderliche offizielle Katalog ist live veröffentlicht: `c976df8caf9146bb7bc6903ff94ce07382ea15596785b65116e3c57d13cc9fa2`, 6.277 Fragen, je 6.277 Digests und Wertungsdatensätze. Die operatorgeschützte Übertragung verwendete 266 begrenzte Teile, überprüfte den Manifest-Hash und entfernte nach erfolgreicher Veröffentlichung die Zwischenstücke. Der frühere 5.677-Fragen-Katalog bleibt für historische Referenzen erhalten.

## Prüfnachweis

**295 Tests in 50 Dateien** und Produktionsbuild erfolgreich. Nach der abschließenden SQL-Anpassung erneut alle 33 betroffenen Eintrags-/Rekord-/Statistiktests erfolgreich; der Integrationstest umfasst einen wiederholten Einzielpool, 13 Antwortvorkommen, Nullpunkt-Zeitkonto und Karriere-XP in der öffentlichen Ergebnisabfrage. TypeScript und Diff ohne Befund.

Der erste vollständige Browserlauf erfasste sämtliche Befunde. Auswahltests öffnen nun die standardmäßig geschlossenen Klappen und beachten die gemerkte Gruppenauswahl; verspätet geladene Ansichten werden nach Fortsetzung der kontrollierten Testuhr geprüft. Die drei Gruppenkarten sind auch mobil gleich breit; nach allen Solorekordmodi führt ein Ergebnislink zur Bestenliste. Ein zusätzlicher Timertakt nach einem Uhrsprung prüft in WebKit den gespeicherten Zeitkontoabschluss. Gezielte Nachprüfungen bestanden; der vollständige Browserlauf gegen den eingefrorenen 6.277-Fragen-Build erfasste 162 Fälle: 152 bestanden, neun zunächst fehlgeschlagen, ein vorgesehener Skip. Acht veraltete Mengenerwartungen nach der Erweiterung korrigiert. Den neunten Befund der Duellmessung durch Festhalten allein des Datums bei nativen Bildtakten geklärt; die bisherige Playwright-Uhr ersetzte auch den Frame-Scheduler. Drei isolierte Chromium-Wiederholungen lagen bei 112–152 ms. Alle 24 gezielten Nachprüfungen erfolgreich, einschließlich aller neun zuvor fehlgeschlagenen Fälle, Speicherung, Wiederaufnahme, Versionsanzeige und Solo-/Duellreaktion in beiden Browsern. Duellreaktion abschließend Chromium/WebKit 141/157 ms nach Serverbestätigung; Solo bei 0/100/500 Runden 109/203/201 ms beziehungsweise 116/118/104 ms. Grenzwerte unverändert. Insgesamt 161 unterschiedliche Fälle erfolgreich abgedeckt; keine verbleibenden roten Pflichtchecks. Die gezielten neuen Schauspieler-, Kontoeintrags-, Versions- und Duellprüfungen bestanden. Windows-WebKit benötigt für den Metadaten-Test nach Service-Worker-Aktivierung eine synthetische Antwort direkt am Fetch-Aufruf; Chromium prüft den HTTP-RPC und echtes Offline-Neuladen. Der bisherige große Kompressionsrücklauf erhielt wegen des erweiterten Katalogs 15 Sekunden Testbudget; sämtliche Inhalts- und Größenassertionen bleiben bestehen. Die Duellantwortgrenze von 250 ms unter vierfacher CPU-Drosselung bleibt unverändert.

Der Kontospeicher vermeidet zwei vollständige Katalogkopien je Antwort. Bei unverändertem Katalog werden neue Endlospositionen trotzdem in die Rundensnapshots übernommen; der neue serielle Integrationstest prüft Positionen, unveränderliche Katalogreferenzen, abgewiesene Katalogmutation und Onlinebestätigung. Paketübergreifende Varianten sind vollständig als offizielle Fragen markiert, ohne fremde Fragen mit gleichen IDs zu ersetzen.

## Veröffentlichung

Der reguläre Sites-Workflow hat die bestehende öffentliche Site und ihren Quellstand geöffnet. Projekt-ID, Adresse und öffentlicher Zugriff bleiben erhalten. Alle Branchstände lokal nach `main` integriert und Sites-Version **43** am 03.10.2026 um **15:46:07 Uhr Europe/Berlin** veröffentlicht. Nativer Status `succeeded`; Quellcommit `aa8f22ad019fed488330096677fa35897016c983`, Version `appgprj_6ab78f6468648191a8895f7a1d9dbf23~appgver_e49ce6383b3c819197428ac790445391`, Deployment `appgdep_6ac1070c3c608191a0fff9cb2edd0d62`. Der tatsächliche Deploymentzeitpunkt ist in der öffentlichen Versionsabfrage hinterlegt. Der finale Produktionsbuild ist bytegleich zum geprüften Browserbuild. Offline `film-09f66dbdcdb2`, 59 Dateien. Archiv: 41656320 Bytes/62 Dateien, `sha256:8fe4e8cc38fdd8880edf0a559372f4ce3817dc7a2f0758fb6ef2bcbdb69b8d68`. [Betriebsnachweis](Sites-Betrieb.md).

Langzeit-Spielgefühl, physische Geräte-/Hörabnahme und reale Zwei-Konten-/Zwei-Geräte-Prüfung bleiben die bereits dokumentierten Grenzen. Bekannte Hinweise zur Größe der Startdatei bleiben bestehen.

## Nachabgleich und Branchbereinigung am 04.10.2026

Auf erneuten ausdrücklichen Nutzerauftrag alle lokalen Änderungen zusammengeführt und entbehrliche, vollständig integrierte Branches bereinigt. `main` enthält sämtliche 27 vorherigen Arbeitsbranchköpfe einschließlich der Versionen 49–51 und der lokalen Black-Panther-Basisdatenkorrektur. Korrekturcommit `5f35b7f`; Abgleich von `main` in den Arbeitsbranch mit Mergecommit `d7fa9a5`, danach Fast-Forward nach `main`. Vier ausschließlich dokumentarische Konflikte in Projektstart, Log, Prüfbericht und Sites-Betrieb aufgelöst: aktueller Snapshot Version 51, frühere Version-48-Nachweise vollständig erhalten; beide chronologischen Logfolgen textlich unverändert zusammengeführt. App-Code während der Konfliktauflösung unverändert.

26 lokale Arbeitsbranches mit `git branch -d` nach vollständigem Vorfahrennachweis entfernt, einschließlich des bisherigen Arbeitsbranches nach der letzten Main-Integration. Auch jüngere Branches auf ausdrücklichen aktuellen Aufräumauftrag berücksichtigt; keine neue generische Regel. Alle Commits bleiben in `main` erreichbar. Fünf saubere Worktrees auf ihrem bisherigen Commit ohne Branchzuordnung erhalten; keine Worktree-Dateien oder lokalen Laufzeitartefakte gelöscht. Die bisherigen Worktree-Branches waren `codex/antwortreaktion-optimieren`, `codex/komoedie-ergaenzung`, `codex/schauspieler-400-ergaenzung`, `codex/rekordmodi` und `codex/speicher-sync-optimierung`.

`codex/schauspieler-veroeffentlichung` bleibt gemäß Abschlussregel erhalten: drei lokale Commits mehr als sein Remote-Branch. Auch dieser lokale Kopf `11b53c11613e` ist vollständig in `main` enthalten. Lesende Prüfung ergab keine offenen GitHub-PRs. Remote-Branches und `origin/main` unverändert; kein Push, keine Veröffentlichung oder produktive Datenbankänderung. Veröffentlichter Stand weiterhin Version 51, die Black-Panther-Korrektur bleibt lokal.

Die 14 bereits vorhandenen offenen Importberichte enthalten ausschließlich abweichende Prüfzeitstempel. Ihre Bytes und ihr offener Status blieben beim Abgleich erhalten; nicht mit dem fachlichen Abschluss committen. Keine unklaren ungetrackten Dateien. Frühere 333 Tests in 55 Dateien, Produktionsbuild und acht Browserfälle für exakt denselben App-Code wiederverwendet; nach dem Main-Fast-Forward alle zehn gezielten Film-/Personenredaktionstests erneut erfolgreich. Diff- und Vorfahrenprüfungen bestanden.

Die folgenden Köpfe wurden zum Abschluss vollständig integriert und ihre lokalen Branchnamen entfernt; der abschließende Dokumentcommit des aktuellen Arbeitsbranches ist zusätzlich in `main` enthalten.

| Entfernter lokaler Branch | Gesicherter Kopf vor Bereinigung |
| --- | --- |
| codex/additive-fragenauswahl | `40d58cd73ade` |
| codex/antwortreaktion-optimieren | `b33c3973cb32` |
| codex/eine-moduskachel | `d7fa9a5d1900` |
| codex/eine-moduskachel-release | `119f0bd2cc57` |
| codex/fehlertraining-rundenauswertung | `577782448a75` |
| codex/filmkarriere-level-xp | `577782448a75` |
| codex/filmreise-personen-vertiefung | `fbb0bfc91fef` |
| codex/fragedaten-gesamtveroeffentlichung | `8685fb2f806e` |
| codex/gesamtintegration-20261003 | `796816893022` |
| codex/kategorie-illustrationen | `bd0536c691af` |
| codex/keine-ahnung-antwort | `577782448a75` |
| codex/komoedie-ergaenzung | `24b64b03c13c` |
| codex/modusauswahl-laufhistorie | `1d7add42b82e` |
| codex/moduskachel-und-ergebnis-highscores | `e57a37141ac1` |
| codex/preistraeger-fragen | `9c828d36878a` |
| codex/projektanlage | `fe5bc228cd0b` |
| codex/rekord-altwertungen-entfernen | `c3b81505aaf6` |
| codex/rekordmodi | `0c9b3498d16b` |
| codex/schauspieler-200-ergaenzung | `83c936fe5fe6` |
| codex/schauspieler-400-ergaenzung | `09bf31df54a8` |
| codex/schauspieler-release | `f5c66aec3c4d` |
| codex/speicher-sync-optimierung | `c080a378088d` |
| codex/spielbare-testversion | `56c12c282e4d` |
| codex/spielkacheln-und-rekordauswahl | `780c9030362b` |
| codex/strukturverbesserungen | `bac3c4009037` |
| codex/veroeffentlichung-keine-ahnung-spielervergleich | `cfff2b5ae27b` |

## Entfernung alter Worktrees am 04.10.2026

Auf anschließenden ausdrücklichen Nutzerauftrag alle fünf alten, vollständig integrierten Worktrees aus Git entfernt; registriert bleibt ausschließlich der Hauptarbeitsordner. Vorher erneut saubere Arbeitsstände und vollständige Erreichbarkeit aller fünf Köpfe in `main` geprüft. Private Produktionssicherungen, Recherchebelege, lokale Pfadauflösung und sonstige nicht reproduzierbare Arbeitsartefakte in der ignorierten Ablage `.sites-runtime/worktree-cleanup-20261004/preserved/` gesichert; 2.336 Dateien/Verweise, 387.088.712 Bytes, kopierte Dateien per SHA-256 geprüft. Reproduzierbare Builds, Abhängigkeiten und die dokumentierte synthetische lokale PostgreSQL-Prüfinstanz nicht in die Sicherung übernommen. Laufende Parallelaufgaben im Hauptordner unverändert erhalten.

Dateisystem-Cleanup noch nicht vollständig: Ordnerreste von `schauspieler-release` (leer), `wissensquiz-rekordmodi` (Abhängigkeitsverweis) und `wissensquiz-strukturverbesserungen` (lange Pfade der portablen PostgreSQL-Werkzeuge) bleiben bestehen. Git meldete zunächst fehlende Freigabe beziehungsweise zu lange Dateinamen. Die automatische Freigabeprüfung blockierte danach die direkten PowerShell-Ordnerlöschungen ohne nähere Begründung. Keine Umgehung und keine Löschung im Hauptarbeitsordner. Inventar, Sicherungsmanifest und tatsächlicher Endstand liegen ignoriert unter `.sites-runtime/worktree-cleanup-20261004/`.

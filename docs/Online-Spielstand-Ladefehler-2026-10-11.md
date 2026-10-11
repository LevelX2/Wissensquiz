# Online-Spielstand: Vollkatalogabrufe entfernen

Stand: 11.10.2026. Serverumbau geprüft und als Version 66 öffentlich veröffentlicht. Der ausdrücklich freigegebene Entwicklungs-Teststand wurde zurückgesetzt; Anmeldung und Profil bleiben erhalten. Kontoöffnung und normale Lernrunden benötigen keine Vollkataloge mehr. [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-11-Version-66.json).

## Befund

Der Nutzer meldet wiederholt „Dein Online-Spielstand konnte nicht geöffnet werden“; auch Schließen des Tabs hilft nicht. Der Screenshot zeigt die Kontoöffnung mit erneutem Ladeversuch und Abmeldung. [Originalmeldungen und Entscheidungen](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-11%20Nutzerhinweis%20Online-Spielstand%20oeffnet%20nicht.txt).

Produktive, ausschließlich lesende Diagnose: Am 11.10.2026 zwischen 06:12 und 06:13 UTC brechen mehrere gleichzeitige `quiz_sync_catalog`-Anfragen aus mobilem Firefox/iOS mit HTTP 500 und PostgreSQL-Code `57014` ab. PostgreSQL protokolliert `canceling statement due to statement timeout`. Die vorherigen `quiz_sync_page`-Anfragen funktionieren. Der betroffene Stand verweist auf fünf frühere Katalogausgaben; hinzu kommt der aktuelle offizielle Bestand. Das sind vollständige öffentliche Fragenkataloge, keine einzelnen Fragen. Alle zehn vorhandenen Ausgaben sind vorhanden. Eine allgemeine Unterbrechung der Internetverbindung ist dadurch nicht belegt.

Zwei einzeln gemessene anonyme Abrufe der aktuellen und unmittelbar vorherigen Ausgabe liefern HTTP 200 mit 7.483.339 beziehungsweise 7.420.403 Antwortbytes in 2.886 beziehungsweise 2.662 ms. Das sind lokale Einzelmessungen, keine garantierten Ladezeiten auf dem betroffenen Handy.

## Ursache in der Architektur

`compileState` speichert den vollständigen persönlichen Fragenbestand als Teile früherer öffentlicher Katalogausgaben. Auch Rundensnapshots können auf diese Ausgaben verweisen. `downloadDocument` lädt alle referenzierten Ausgaben vollständig, bevor `reconstructState` den Spielstand zusammensetzt. Der aktive `OnlineGameStore` übernimmt zusätzlich einen früheren Online-Stand bei der Erstaktivierung. Die Oberfläche berechnet Auswahl, Fragenpools, Themen und Lernübersichten aus `State.questions`; normale Lernrunden werden im Client ausgewählt und ausgewertet.

Die bereits produktiven servergeprüften Zeitrunden zeigen den geeigneten Datenfluss: Serverauswahl, einzelne Fragenausgabe, serverseitige Antwortannahme und kleine Ergebnisdaten. Sie benötigen den großen Clientbestand für ihren eigentlichen Spielablauf nicht; die gemeinsame bisherige Kontoöffnung lädt ihn trotzdem.

## Verbindlicher neuer Auftrag

- Normale Lernrunden ebenfalls auf einzelne Fragen und serverseitige Auswertung umstellen; beim Kontostart keinen Vollkatalog laden.
- Auswahlmöglichkeiten, Filmreise und Sammlungs-/Lernübersichten mit bedarfsgerechten Metadaten beziehungsweise aggregierten Ergebnissen versorgen. Keine vollständigen Fragen, Lösungen oder Erklärungen als Voraussetzung für Start und Navigation.
- Nur tatsächlich angeforderte Frage, bestätigte Auflösung und unmittelbaren Rundenrückblick zum Client übertragen. Kein vorsorglicher Download historischer Ausgaben.
- Entwicklungsphase: keine zusätzliche Altstandmigration, kein Adapter und kein Fallback zur Erhaltung alter Katalogverweise.
- Nutzer hat die Rücksetzung seines bisherigen Test-Spielstands ausdrücklich erlaubt. Erst ausführen, wenn die Änderung zur Veröffentlichung bereit ist; kein pauschaler Reset anderer Konten.
- Nutzer hat die Umsetzung im eigenen Worktree ausdrücklich beauftragt. Bestehende öffentliche Sites-Adresse erhalten; weiteren Spielern erst nach belastbarer Prüfung zugänglich machen. Kein Auftrag zum Anschreiben oder Einladen anderer Personen.

## Umsetzung und Abnahme

Der vorläufige Ansatz mit seriellen historischen Vollabrufen und statischen Kopien aller früheren Ausgaben wurde nach der Nutzerpräzisierung verworfen und aus dem Arbeitsstand entfernt. Auch der Zwischenansatz mit nur einem aktuellen Vollkatalog genügt dem neuen Auftrag nicht. Keine dieser Fassungen wurde veröffentlicht.

Abnahme des neuen Ablaufs: isolierte Konten und kontrollierte Testzeit, vollständige Fach-/SQL-Tests und Build, Desktop-/Mobilbrowser einschließlich Kontoöffnung, Lernrunden, Wiederaufnahme, Konflikt-/Wiederholungsverhalten, Filmreise, Sammlung, Zeitrunde und Proberunde. Netzwerkprüfung muss null Vollkatalogabrufe beim Kontostart und begrenzte Fragenantworten belegen. Produktionsdaten nicht für Testspiele verändern. Freigegebene Teststandrücksetzung, Backendbereitstellung und Sites-Veröffentlichung erst nach erfolgreicher lokaler Abnahme dokumentieren.

## Aktuelle Umsetzung

[Server-Lernablauf und Optimierung](Server-Lernablauf-2026-10-11.md): einzelne Fragenausgabe, serverseitige Auswertung und Freischaltung, vorbereitete Redaktion, paginierte Themen, begrenzte Belege und inkrementeller privater Fortschritt. Vollständige Lernrunde in Chromium, Firefox und mobilem WebKit ohne Katalogabruf erfolgreich. 480 Tests und 50 unterschiedliche gezielte Browserfälle bestanden. Backend eingerichtet und Version 66 am 11.10.2026 um 10:06:12 Uhr Europe/Berlin veröffentlicht; reale Handy- und Mehrspieler-Lastabnahme weiterhin nicht behauptet.

## Erneuter Ladefehler nach Version 67: alter Schreibweg gesperrt

Am 11.10.2026 um 12:45:24 UTC nahm der ältere Schreibendpunkt `quiz_sync_apply` ein Paket aus mobilem Firefox/iOS an. Der bereits serverseitige Spielstand erhielt dadurch wieder einen Vollkatalogverweis und eine unnötige Liste sämtlicher Fragen-IDs. Die neue App führte ihre Serverabfragen erfolgreich aus, wies aber das unzulässige Format zurück. Die Verwendung eines älteren Clients ist aus dem Endpunkt abgeleitet; die konkrete Tab-Version wurde nicht erfasst.

Die Backendkorrektur `20261011125253_protect_server_save_format.sql` ist produktiv installiert. Der ältere Endpunkt lehnt für aktive Server-Spielstände **alle** Schreibpakete mit `obsolete_client` ab, auch ohne Katalogänderung. Eigentümerprüfung und Kontosperre erfolgen vorher. Die Aktivierung darf einen aktiven Server-Spielstand außerdem nicht durch eine Generation mit Katalogformat ersetzen. Aktuelle `quiz_game_apply`-Schreibvorgänge und neue Server-Generationen funktionieren weiter. Keine Altstandübernahme und kein zusätzlicher Kompatibilitätspfad.

Der beschädigte Formatverweis wurde mit Versionsprüfung und Kontosperre korrigiert; die unnötige Fragen-ID-Liste wurde als gelöscht markiert. Hashvergleiche über alle jeweils unbeteiligten Einträge bestätigen deren unveränderten Inhalt. Eine Runde und zehn Antwortbelege bleiben erhalten; **kein Zurücksetzen**. Die Katalogreferenztabelle der aktiven Generation ist leer. Unbenutzte private Objekte wurden nicht pauschal gelöscht.

Die unveränderten produktiven Antworten des Kontostarts wurden ausschließlich im Arbeitsspeicher durch den gebündelten aktuellen `OnlineGameStore.open()` verarbeitet: erfolgreich geöffnet, Revision 20, eine Runde, zehn Antworten, kein Katalogabruf. Der Startumfang beträgt 34.595 UTF-8-Bytes statt der zuvor zusätzlich enthaltenen rund 295 KB Fragen-IDs. Dieser Nachweis prüft die Clientverarbeitung der Serverantworten; eine Anmeldung im echten Nutzerbrowser wurde nicht simuliert und kein Fortschritt gespielt.

Abnahme: beide neuen Regressionen scheiterten vor der Korrektur; danach alle 492 Tests in 78 Dateien, TypeScript und Vite-Produktionsbuild erfolgreich. Produktiv wurde ein weiterer alter Schreibversuch ohne Änderung des Kontostands abgewiesen. Der neue interne Helfer ist für anonyme Zugriffe gesperrt; die öffentliche Hülle bleibt Security Invoker. Bestehende Advisor-Hinweise zu gesperrten Tabellen, freigegebenen Fach-RPCs und Passwortschutz bleiben unverändert. Website-Version 67 genügt für diese Backendkorrektur; keine neue Sites-Veröffentlichung und kein GitHub-Push.

Die vollständige Serverrunde einschließlich Wiederaufnahme, zehn Antworten, Neuladen und anschließendem Reset ausschließlich des synthetischen Testkontos besteht zusätzlich in Chromium, Firefox und mobilem WebKit: drei Browserfälle erfolgreich, keine Katalogabrufe und keine lokale Kontospielstandsablage. Der lokale Testserver wurde wegen eines Startproblems der npm-Hülle direkt mit Vite gestartet; Produktcode und Testinhalt blieben unverändert.

## Folgeauftrag: alte Speicherwege vollständig entfernen

Die Sperre war eine Sofortkorrektur. Der anschließende Nutzerauftrag verlangt die tatsächliche Entfernung der Endpunkte und sämtlicher zugehörigen Katalog-/Rückfallwege. [Entfernung und Datenerhalt](Alte-Speicherwege-entfernt-2026-10-11.md). Der bereits reparierte Spielstand wird dabei nicht zurückgesetzt.

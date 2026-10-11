# Online-Spielstand: Vollkatalogabrufe entfernen

Stand: 11.10.2026. Diagnose abgeschlossen; Serverumbau im eigenen Worktree ausdrücklich beauftragt. Noch keine Veröffentlichung oder Rücksetzung vorgenommen.

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

# Abnahme der Strukturverbesserungen

Stand: 03.10.2026. Umsetzung auf Nutzerauftrag in einem eigenen Worktree, sequenziell und mit lokalem Commit je Paket. **Am 03.10.2026 als Teil des lokalen Gesamtstands bis einschließlich `60ab29f` auf `codex/speicher-sync-optimierung` freigegeben.** Der Worktree ist noch nicht nach `main` integriert oder veröffentlicht; keine Remote-Aktion.

## Prüfbarer Änderungsumfang

Branch `codex/strukturverbesserungen`. Der separat übernommene, zuvor geprüfte lokale Gesamtstand ist Ausgangscommit `708bf19`; die Strukturänderungen lassen sich mit `git diff 708bf19..HEAD` getrennt prüfen. Der Ausgangscommit enthält bereits vorher vorhandene Arbeit und gehört nicht zum neu entwickelten Strukturumfang. [Paketprozess](Strukturverbesserungen-Prozess.md), [ursprüngliche Befunde](Strukturpruefung-2026-10-03.md).

| Paket | Ergebnis | Commit |
| --- | --- | --- |
| P1 | Kontoöffnung/Upload begrenzen und unbestätigte Uploads vor neueren Änderungen abgleichen | `c2dcc07` |
| P2 | Gemeinsame Spielansichten und große Seiten aus der App lösen; Importkreis entfernen | `f2b3c93` |
| P3 | Auswertungen auf sichtbare Seiten beschränken und Themenzugriffe indizieren | `339fef3` |
| P4 | Styles in 15 geordnete Zuständigkeitsbereiche teilen, Kaskade erhalten | `2aac6b4` |
| P5 | Nebenansichten getrennt laden, Ladefehler und vollständigen Offlinecache prüfen | `5d27a0f` |
| P6 | Sicherungstypen aus gemeinsamen Schemas ableiten; Validierung und Speicher trennen | `dfbc031` |
| P7 | Rückfallkopien exportieren, Dienst erneut laden, letzte Onlinebestätigung anzeigen | `3432e07` |
| P8 | Kontoansichten abschließend trennen, Statusseiten verdichten, Historie erhalten und Abnahme abschließen | Dieser Abschlusscommit |

Spiel- und Lernregeln, Auswahlalgorithmus, XP, Fragen-/Wissensziel-IDs, historische Snapshots und Kodierungsverträge sind erhalten. Rohquellen, auslieferbare Pakete, Datenbankmigrationen, Abhängigkeiten und Lockfile wurden gegenüber dem Ausgangscommit nicht geändert. Die kleinen Funktionsänderungen betreffen Sicherungsrobustheit, Ladefehler und ausdrücklich vorgeschlagene Profilhilfen.

## Struktur und Größen

- `App.tsx`: **654 statt 2.806 Zeilen**. Gemeinsame Solo-/Duellansichten haben eigene Module; der Importkreis ist entfernt. Die ursprünglichen Funktionskörper wurden bei der Auslagerung unverändert verglichen.
- `AccountApp.tsx`: **255 statt 667 Zeilen**. Konto- und Linkformulare liegen in `AccountPanel.tsx` und `AccountLinkPanel.tsx`; ihre Funktionskörper und der Steuerungskörper sind bei der Trennung unverändert geblieben. Anmeldung und Formularabläufe sind erneut im Browser geprüft.
- Themen-/Sammlungsindizes gehören zur jeweiligen Seite und zum aktuellen Fragenarray. Nach einer Speicheränderung wird der Index neu aufgebaut, weil der bestehende Speicherpfad den Katalog neu rekonstruiert. Dieser Speicherpfad wurde nicht grundlegend umgestaltet. Fälligkeiten werden nicht dauerhaft memoisiert; die sichtbare Startseite aktualisiert nach Rückkehr und regelmäßig.
- Styles: Bei vereinheitlichten Zeilenenden ergeben die zusammengefügten Quellen wieder exakt das vorherige Stylesheet. Hilfe und Freischaltfeier haben getrennte Bereiche, insgesamt 16 Dateien. Der Produktions-CSS-Hash bleibt gleich; **50,61 kB / gzip 11,86 kB**.
- Start-JavaScript: **1.760,46 kB / gzip 405,02 kB** statt **1.817,17 / 421,02** bei der ursprünglichen Prüfung. Hilfe, Optionen, Duelle, Ranglisten, Sammlung und Themen sind eigene Ladeabschnitte. Die Startdatei enthält weiterhin umfangreiche statische Zuordnungsdaten; der Buildhinweis zur Größe bleibt bestehen.
- Offline-Paket: **53 statt 46 Dateien**, Kennung `film-811ed19886ae`. Das bestehende Buildskript erfasst sämtliche neuen JavaScript-Dateien. Private Spielstände gehören nicht dazu.
- Sicherungsschema 1 und IndexedDB-Version 2 bleiben erhalten. Synchronisierungsbelege erhalten optional `confirmedAt`; neue lokale Rückfallkopien eine datierte Hülle. Altbelege und alte vollständige Kopien bleiben lesbar; JSON-Export liefert weiterhin den vollständigen geprüften Spielstand.

## Verifikation

- Gesamter Logik-/Persistenz-/Datenbanklauf: **221 Tests in 36 Dateien erfolgreich**.
- TypeScript und Produktions-Build erfolgreich. Nicht blockierende Hinweise zu Zod-Kommentarannotationen und großer Startdatei bleiben sichtbar.
- `git diff --check` ohne Befund; 255 lokale Dokumentationslinks geprüft. Die drei datierten Historien enthalten jeweils den vollständigen vorherigen Inhalt; die geordnete CSS-Zusammenfügung ist unverändert. Der Ausgangsordner und die Fach-/Quellenpfade wurden separat verglichen.
- **124 unterschiedliche Browserfälle erfolgreich abgedeckt**, ein vorhandener Desktop-WebKit-Fall ausdrücklich ausgelassen. Der vollständige Lauf ergab zunächst 120 erfolgreiche Fälle und vier überholte Testannahmen. Alle vier betroffenen Fälle bestanden nach Korrektur der Erwartungen in gezielten Wiederholungen. Die abschließende Prüfung der getrennten Kontoformulare und der Offline-Nebenansichten bestand ebenfalls. Die Paketprüfungen und Wiederholungen sind im Prozess dokumentiert; kein erneut vollständig durchgelaufener Browserlauf nach den Erwartungskorrekturen.
- Neue Fälle decken hängende Kontoöffnung/Uploads, verlorene Antworten mit neueren lokalen Änderungen, Revisionskonflikte, besondere importierte Themennamen, offline unbesuchte Nebenansichten, Dateiladefehler/Wiederherstellung, alte/neue Rückfallkopien, Konto-Trennung, Dienstwiederholung und unverfälschte Onlinebestätigung ab.
- Zwei zuvor korrigierte alte Browserannahmen betreffen die Filmquellen-Grenze der Horrorübersicht und die Kennung `Filmfragen + Classics`. Im vollständigen Lauf wurden vier weitere alte Oberflächenannahmen gefunden: früherer Freispieltext, Auswahlhinweis samt gespeichertem Quellenfilter, Illustrationszahl und Quellenbezeichnung in Rekordkarten. Die Erwartungen folgen dem bereits vorhandenen Ausgangsverhalten; dafür wurde keine Funktion geändert. Der Schlussabgleich entfernt außerdem ungenutzte Importe aus den ausgelagerten Modulen; der Anwendungscode besteht die zusätzliche Prüfung auf ungenutzte Namen.

Tests laufen mit isolierten Profilen, abgefangenem Kontodienst und kontrollierten Uhren/Zeitzone für Zeitfälle. Die lokalen Datenbanktests bestätigen weiterhin Zugriffs- und Projektionsverträge. Keine Live-Migration oder Produktionsschreibprüfung.

## Wissens- und Arbeitsstände

README, Projektstart und Qualitätsseite sind aktuelle Snapshots. Ihre vorherigen Fassungen bleiben vollständig als datierte Historie am bisherigen Ort erhalten, sodass relative Fachlinks weiter funktionieren. Der Ausgangsordner wurde von dieser Umsetzung nicht verändert. Ein Hashvergleich umfasst 286 ursprüngliche Dateien: Anwendungscode und Originalquellen sind erhalten; drei Wissensdateien wurden währenddessen unabhängig um eine neue Infrastruktur-Fachseite ergänzt. Diese fremde Ergänzung wird nicht in die Paketcommits aufgenommen und darf bei späterer Integration nicht verdrängt werden.

Testgenerierte Importberichte mit ausschließlich geändertem Zeitstempel werden auf ihren vorherigen Stand zurückgeführt; fachliche Berichte werden dadurch nicht umgeschrieben. Index und chronologisches Log verweisen auf Umsetzung und Abnahme.

## Grenzen und weiterer Auftrag

Reale Konten-/Geräteabnahme, Mobilnetz, physische Hörprüfung und PWA-Installation am Smartphone bleiben offen. Der bekannte Windows-WebKit-Offline-Neuladefall wird getrennt behandelt; Chromium weist den echten Offline-Neustart nach. Zeitangaben der Onlinebestätigung verwenden die Geräteuhr und ersetzen den aktuellen Sicherungsstatus nicht. Rückfallkopien bleiben lokal erhalten, können Speicher belegen und werden nicht automatisch gelöscht.

Die zunächst zurückgestellten größeren Speicherpfade und Statistikprojektionen wurden anschließend auf ergänzenden Nutzerauftrag umgesetzt und gemessen; [Abnahme des lokalen Gesamtstands](Speicher-und-Sync-Abnahme.md). Dieser Gesamtstand ist lokal freigegeben. Main-Integration, Push, GitHub-PR, Produktionsmigration und Sites-Veröffentlichung brauchen weiterhin einen ausdrücklichen Auftrag. Der Worktree bleibt erhalten.

# Strukturprüfung und Verbesserungsvorschläge

Stand: 03.10.2026. Geprüft wurde der aktuelle lokale Arbeitsstand auf `codex/schauspieler-veroeffentlichung`, einschließlich der bereits vorhandenen uncommitteten Änderungen. Der zugrunde liegende Commit ist `8faf5e8`; er beschreibt allein nicht den geprüften Gesamtstand. Die Prüfung umfasst Modulgrenzen, React-Oberfläche, Berechnungen, Speicherverträge, Kontosynchronisierung, Offlineaufbau und die lokale SQL-Implementierung. Die veröffentlichte Site und reale Kontodaten wurden dabei nicht verändert oder erneut abgenommen.

Die fachlichen Grundlagen sind tragfähig. Den größten Nutzen versprechen klarere Zuständigkeiten in der Oberfläche und eine begrenzte Wartezeit bei Kontosicherungen. Die folgenden Punkte sind Empfehlungen; Anwendungscode, Spiellogik und Speicherformate wurden in dieser Prüfung nicht geändert.

## Vorhandene Stärken

- Lernregeln, Auswahl, Filmreise, Fehlertraining, Karriere und Rundenauswertung liegen bereits in eigenen Modulen. Diese Aufteilung sollte erhalten bleiben.
- Frage-ID, Wissensziel-ID, Inhaltsversion und Rundensnapshot erfüllen getrennte Aufgaben. Katalogkodierungen erhalten Originaldaten und dynamische Antwortvarianten; historische Runden bleiben nachvollziehbar.
- IndexedDB-Schreibtransaktionen schützen zusammengehörige Änderungen und doppelte Antworten. Der getrennte Katalog reduziert bereits das Schreibvolumen.
- Kontosynchronisierung besitzt eine eigene Warteschlange mit Revisionsschutz und Bestätigungsbelegen. Gast-, Konto- und öffentliche Aktivitätsdaten haben getrennte Schreibwege.
- Lokale Datenbanktests prüfen erlaubte und verbotene Zugriffe. Die geprüften Migrationen enthalten RLS, ausdrücklich vergebene Rechte und eingeschränkte Funktionen. Die Trennung von Tabellenrechten und Zeilenregeln entspricht der [Supabase-Dokumentation](https://supabase.com/docs/guides/database/postgres/row-level-security). Dies ist keine neue Live-Sicherheitsabnahme.
- Der Service Worker aktiviert Updates erst nach dem Schließen alter Fenster. Browserprüfungen arbeiten mit isolierten Profilen und einem synthetischen Kontodienst.

## Empfohlene Reihenfolge

| Reihenfolge | Verbesserung | Nutzen | Eingriff |
| --- | --- | --- | --- |
| 1 | Kontosicherungen und Kontoöffnung zeitlich begrenzen | Hängende Anfragen werden erkennbar und erneut behandelbar | Kleine Robustheitsverbesserung mit eigenem Fehlerfall |
| 2 | Gemeinsame Spielansichten aus der App herauslösen | Importkreis entfernen und Änderungen überschaubar machen | Strukturänderung mit gleichem Verhalten |
| 3 | Berechnungen an die sichtbare Seite und relevante Daten binden | Unnötige Katalogdurchläufe vermeiden | Strukturänderung mit gleichen Ergebnissen |
| 4 | Globale Styles nach Zuständigkeiten ordnen | Weniger unbeabsichtigte Auswirkungen zwischen Ansichten | Strukturänderung mit gleicher Darstellung |
| 5 | Selten benötigte Ansichten getrennt laden | Anfangs geladenen Anwendungscode verkleinern | Strukturänderung mit zusätzlicher Ladephase |
| 6 | Sicherungsschemas und Typen gemeinsam pflegen | Abweichungen bei neuen Feldern früher erkennen | Interne Vertragsorganisation |
| 7 | Statusdokumentation auf einen aktuellen Überblick verdichten | Veraltete Aussagen schneller erkennen | Wissenspflege |
| Bei Wachstum | Öffentliche Spielerstatistik und große Speicherstände gezielt optimieren | Kosten wachsen weniger mit der gesamten Historie | Erst nach Messung und eigenem Speichervertrag |

## Kontosynchronisierung bei hängenden Anfragen

**Befund:** [accounts.ts](../src/accounts.ts) begrenzt `cloudRead` und `cloudSave` nicht selbst. In [accountSync.ts](../src/accountSync.ts) bleibt `running` bestehen, bis die laufende Sicherung endet; weitere `flush`-Aufrufe erhalten dasselbe Promise. Auch die Sitzungsprüfung in [AccountApp.tsx](../src/AccountApp.tsx) besitzt keine eigene Wartegrenze für `getSession` und `getUser`. Die fünf Sekunden beim Konfigurationsabruf decken diese späteren Schritte nicht ab.

**Nachweis:** Eine ausschließlich synthetische Ausführung des tatsächlichen `AccountSync` mit einer nie aufgelösten Speicheranfrage blieb auf `saving`. Eine weitere angebotene Änderung erzeugte keine zweite Speicheranfrage; beide `flush`-Aufrufe lieferten dasselbe laufende Promise. Der Prüfcode verwendete einen leeren Testspielstand und keine Datenbank oder Netzverbindung. Das zeigt den fehlenden Abbruchpfad, keine beobachtete Störung eines echten Kontos.

**Vorschlag:** Das vorhandene Muster aus [rankingRequest.ts](../src/rankingRequest.ts) als allgemeine Anfragehilfe verwenden. Ranglisten, Duelle und Gastmeldungen besitzen bereits eine begrenzte Wartezeit. Bei einer Kontosicherung muss ein unklarer Ausgang als unbestätigt behandelt werden: lokale Änderungen erhalten, Serverrevision und Inhaltsfingerabdruck beim erneuten Versuch abgleichen und eine möglicherweise bereits ausgeführte Speicherung nicht blind wiederholen. Eine passende Wartegrenze für größere Uploads gesondert bestimmen.

**Abnahme:** Hängender Erstabruf, hängender Upload, erfolgreiche Speicherung mit verlorener Antwort und erfolgreiche Nachsicherung prüfen. Bestehende Konfliktregeln und Gast-/Kontotrennung erhalten.

## Gemeinsame Spielansichten und Appsteuerung

**Befund:** [App.tsx](../src/App.tsx) umfasst 2.806 Zeilen und 34 lokale Modulimporte. Sie enthält Initialisierung, Persistenzanbindung, Navigation, Rundenvorbereitung, mehrere Seiten und die wiederverwendbaren Komponenten `Explanation`, `QuestionScreen` und `Result`. [DuelCenter.tsx](../src/DuelCenter.tsx) importiert diese Spielkomponenten aus der App; die App importiert ihrerseits `DuelCenter`. Eine lokale Analyse der ausführbaren TypeScript-Importe hat genau diesen Importkreis gefunden.

**Vorschlag:** Zuerst `Explanation`, `QuestionScreen` und `Result` in eigene gemeinsame Module verschieben. Solo und Duell verwenden weiterhin dieselben Komponenten und bisherigen Props. Danach die großen Seiten für Rundenvorbereitung, Sammlung und Einstellungen auslagern. Appinitialisierung und lokale Mutationen können eine eigene Anbindung erhalten. `App.tsx` behält Navigation und Zusammensetzung der Seiten. Kontoidentität, Synchronisierungssteuerung und Formularansichten in der 667 Zeilen langen `AccountApp.tsx` bei passenden Folgeänderungen ebenfalls deutlicher trennen.

**Abnahme:** Importkreis verschwunden; gleiche Frageuhr, Speicherfolge, Lösungsanzeige, Rate-Korrektur und Lernübernahme. Die vorhandenen Solo-, Duell-, Sicherungs- und Navigationstests eignen sich dafür. Zusätzliche Architekturwerkzeuge erst bei einer tatsächlich festgelegten Modulgrenze einführen.

## Berechnungen pro Ansicht

**Befund:** Ab Zeile 442 berechnet `App.tsx` Themen, Genres und Auswahlgrundlagen während jedes App-Renders. Ab Zeile 491 wird `selectQuestions(pathQuestions(...))` unabhängig von der geöffneten Seite aufgerufen. Im Filmreisemodus baut `pathQuestions` dabei Fortschrittsgrundlagen aus Katalog und Historie auf. `TopicCard` filtert den übergebenen Fragenbestand für jede Karte erneut. Untergeordnete Komponenten besitzen dagegen bereits einzelne gezielte Memoisierungen.

**Vorschlag:** Die Vorschauauswahl in die Rundenvorbereitung verschieben und nur dort berechnen. Themen-, Genre- und Wissenszielzuordnungen einmal pro relevantem Katalogstand aufbauen und passende Teilbestände oder fertige Zählwerte an Karten geben. Historienauswertungen pro bestätigtem Spielstand wiederverwenden. React-Hooks vor bedingten Rückgaben einsetzen oder die betreffende Berechnung in die ausgelagerte Seite aufnehmen.

**Grenze:** Fälligkeiten hängen auch von der Zeit ab. Eine reine Memoisierung auf `state` darf nach längerer Pause oder Rückkehr zur Auswahl keine veraltete Fälligkeit zeigen. Import, Wiederherstellung und Kontowechsel müssen Zuordnungen erneuern. Die Prüfung belegt unnötige Durchläufe; sie enthält keine neue Messung ihrer Latenz auf einem Smartphone.

## Styles und Ladeumfang

**Befund:** [style.css](../src/style.css) umfasst 3.714 Zeilen. Regeln für dieselbe Spielansicht stehen an mehreren Stellen, beispielsweise `.question-card` um Zeile 1006 und 2546 sowie `.answers` um Zeile 1065 und 2562, ergänzt durch mehrere Mobilblöcke. Die Reihenfolge der späteren Überschreibungen ist Teil der aktuellen Darstellung.

**Vorschlag:** Bestehende Regeln zunächst in eindeutig geordnete Bereiche für Grundgestaltung, Layout, Spiel, Konten, Ranglisten und Karriere aufteilen. Ihre wirksame Reihenfolge erhalten. Erst anschließend redundant gewordene Regeln anhand der tatsächlichen berechneten Styles konsolidieren. Vorhandene Farbvariablen weiterverwenden. Eine neue CSS-Bibliothek ist dafür nicht erforderlich.

**Befund zum Build:** Der lokale Produktions-Build erzeugte ein JavaScript-Paket mit **1.817,17 kB**, gzip **421,02 kB**, und CSS mit **50,61 kB**, gzip **11,86 kB**. Vite meldete die JavaScript-Größe. Statische Imports ziehen unter anderem Konto-, Duell-, Hilfe- und Ranglistenoberflächen sowie Filmmetadaten in denselben Modulgraphen.

**Vorschlag zum Laden:** Nach Entfernung des Importkreises selten benötigte Ansichten schrittweise über dynamische Imports laden. Alle erzeugten Pakete müssen weiter im Offlinepaket enthalten sein; [build-sw.mjs](../scripts/build-sw.mjs) sammelt bereits JavaScript-Dateien aus dem gesamten Buildverzeichnis. Die Kernmetadaten werden auch für Auswahl, Snapshots und Import benötigt und lassen sich nicht allein durch das Auslagern einer Anzeige einsparen. Erwartete Größenänderungen daher messen.

**Abnahme:** Darstellung, Tastaturfokus, kleine Mobilansichten und reduzierte Animationen vergleichen. Nach vollständiger Offlinevorbereitung jede ausgelagerte Ansicht ohne Netz öffnen. Langsame oder fehlgeschlagene Nachladung verständlich darstellen.

## Speicherverträge und Wachstum

**Befund:** [model.ts](../src/model.ts) definiert die meisten Zustandstypen als Interfaces. [storage.ts](../src/storage.ts) definiert zusätzlich die entsprechenden Zod-Schemas und konvertiert das Ergebnis mit `as State`. Sie enthält sowohl Sicherungsprüfung als auch IndexedDB-Zugriffe. Das Fragenschema liefert seinen Typ bereits direkt aus Zod.

**Vorschlag:** Die übrigen Sicherungsschemas in einem eigenen Vertragsmodul führen und Typen, soweit ohne Kompatibilitätsänderung möglich, daraus ableiten. Strukturelle Prüfung, fachliche Konsistenzprüfung, Wiederaufbau abgeleiteter Werte und Datenbankzugriff klarer voneinander trennen. Defaults, optionale Altstandfelder und erlaubte historische Formen dabei exakt erhalten. SQL-Projektionen bleiben eigenständige Serververträge und benötigen weiterhin die vorhandenen Vergleichsprüfungen.

**Befund bei Wachstum:** Der getrennte IndexedDB-Katalog wird nicht bei jeder Änderung geschrieben, aber für jeden `update` noch vollständig gelesen, rekonstruiert und zum Inhaltsvergleich kodiert. Fingerabdruck und Online-Sicherung prüfen beziehungsweise kodieren ebenfalls den vollständigen logischen Stand. [Fragedaten-Organisation](Fragedaten-Organisation.md) dokumentiert diese Kosten bereits zutreffend.

**Vorschlag bei Wachstum:** Zunächst die überflüssigen UI-Berechnungen reduzieren. Bei nachgewiesenen Speicherlatenzen getrennte Schreibpfade für Fortschritt und Katalog oder einen ausdrücklich versionierten Katalognachweis untersuchen. Ein ungesicherter dauerhaft gespeicherter In-Memory-Katalog würde den vorhandenen Schutz vor fremden Tabänderungen schwächen. Historische Snapshots erst bei belegtem Bedarf normalisieren.

Die öffentliche Spielerabfrage in [Migration 202610030001](../supabase/migrations/202610030001_public_leaderboard_guest_activity.sql) entpackt und aggregiert die privaten Runden-/Antwortarrays aller Teilnehmer vor der begrenzten Ergebnisausgabe. **Bei größerer Nutzung** wäre eine beim Speichern erneuerte öffentliche Statistikprojektion eine passende Erweiterung der bereits für Rekorde verwendeten kleinen Projektion. Dafür zuerst synthetische Lastmessungen und einen Vergleich der bisherigen Quoten-, XP- und Nullrundenregeln durchführen. Diese Prüfung hat keinen neuen Live-Timeout festgestellt.

## Kleine funktionale Vorschläge

1. **Rückfallkopien zugänglich machen.** `replaceAccountState` speichert alte Kontostände unter `recovery:<Kontoschlüssel>:<ID>`. Die Oberfläche bietet vor der Übernahme den Export des aktuellen Standes, aber keinen späteren Zugriff auf die bereits gespeicherten Rückfallkopien. Im Profil eine Liste mit Datum und Export anbieten; eine Wiederherstellung bleibt eine ausdrückliche Auswahl mit vorhandener Validierung. Aufbewahrung und Speicherbedarf dabei sichtbar machen, keine automatische Löschung einführen.
2. **Kontodienst-Ausfälle korrekt erklären.** Wenn die Konfiguration nicht geladen wird, zeigt `AccountPanel` zusätzlich die Aussage, Anmeldung und Mails seien noch nicht eingerichtet. Das passt zum unkonfigurierten Zustand, aber nicht zu einem vorübergehend ausgefallenen eingerichteten Dienst. Die Zustände unterscheiden und einen erneuten Konfigurationsabruf ermöglichen. `setupAccounts` hält derzeit auch ein fehlgeschlagenes Ergebnis bis zum Neuladen fest.
3. **Letzte bestätigte Online-Sicherung anzeigen.** Neben dem vorhandenen Status einen verständlichen Bestätigungszeitpunkt anbieten. Das hilft vor einem Gerätewechsel. Ein lokaler Schreibzeitpunkt darf dabei nicht als Onlinebestätigung ausgegeben werden.

Diese Ergänzungen verbessern Sicherung und Fehlerrückmeldung. Änderungen an Auswahlregeln, XP, Lernintervallen, Rangwertungen oder dem Duellablauf sind aus der Strukturprüfung nicht abgeleitet.

## Statuswissen

Projektstart und README mischen aktuelle Meldungen mit vielen früheren Bestands- und Veröffentlichungsständen. Im Abschnitt „Offen“ des Projektstarts wird beispielsweise noch Version 36 als aktuelle Veröffentlichung bezeichnet, während der Seitenanfang Version 39 dokumentiert. Die Qualitätsseite enthält zusätzlich alte Testzahlen in allgemeinen Prüfungsbeschreibungen.

**Vorschlag:** Projektstart und README auf eine kurze aktuelle Bestands-/Veröffentlichungsübersicht und die wirklich offenen Abnahmen verdichten. Historische Entwicklungen im chronologischen Log und datierten Fachnachweisen erhalten. Allgemeine Checkbeschreibungen nicht mit ständig veraltenden Testzahlen versehen. Dieser Bericht dokumentiert die Widersprüche, ohne die gesamte vorhandene Historie umzuschreiben.

## Prüfnachweis und Grenzen

- `npm test`: **214 Tests in 35 Dateien erfolgreich**.
- `npm run build`: erfolgreich; Bundlegrößen siehe oben. Zod-Kommentarannotationen erzeugten zusätzliche nicht blockierende Buildhinweise.
- Gezielter Browserlauf für Konten, Duelle, Navigation, Speicherorganisation und Robustheit: **30 Browserfälle erfolgreich**, 26 Chromium und vier WebKit, Laufzeit 5,9 Minuten. Kontodienst abgefangen; isolierte Profile, festgelegte Zeitzone und kontrollierte Uhren für zeitabhängige Fehlerfälle. Dies war ein gezielter Lauf, kein erneuter vollständiger Browserlauf.
- Die bestehende Katalogmessung wurde dabei wiederholt: 5.677 Fragen, 13.248.306 Bytes Katalog und 10.654 Bytes Fortschrittsdaten pro geprüfter Einstellungsänderung statt 18.069.123 Bytes Vollstand. Median der sieben abwechselnden Schreibmessungen vorher/nachher: Chromium 136/128 ms, WebKit 142/139 ms. Der Befund bestätigt vor allem die geringere Schreibnutzlast und begründet keinen pauschalen Geschwindigkeitsgewinn.
- `git diff --check`: erfolgreich; Git meldete ausschließlich Hinweise zur bestehenden LF-/CRLF-Konfiguration.
- Importanalyse: ein ausführbarer lokaler Modulkreis, `App.tsx` ↔ `DuelCenter.tsx`.
- Fehlerprobe: hängende Kontosicherung mit synthetischem Store reproduziert; keine privaten Spielstände verwendet.

Es wurden weder Datenbankmigrationen ausgeführt noch Abhängigkeiten aktualisiert. Produktionskonten, echte Geräte-/Mobilnetzabnahme und die öffentlich veröffentlichte Site gehören nicht zu diesem neuen Nachweis. Die Vorschläge für Leistung und Serverwachstum benötigen eigene Vorher-/Nachher-Messungen bei ihrer Umsetzung.

# Rekordmodi und Zeitranglisten

**Bezeichnung 10.10.2026 lokal geändert, noch nicht veröffentlicht:** Die bereichsübergreifende Rekordauswahl heißt „Universal“, ergänzt um „Alle Bereiche“. Auswahl, Modushilfe sowie persönliche und gemeinsame Ranglisten verwenden denselben Namen. Technische Kennungen, Auswahlregeln und gespeicherte Rekorde bleiben unverändert. „Königsklasse“ in früheren Rohquellen und Veröffentlichungsnachweisen bezeichnet dieselbe Auswahl.

Prüfung der Umbenennung: elf Rekordmodus-Tests, Produktionsbuild einschließlich Katalogvorbereitung und vier gezielte Browserfälle in Chromium und WebKit mobil erfolgreich. Vollständige Testläufe wegen Zeitüberschreitungen beziehungsweise Node-Speicherlimit abgebrochen, auch bei einem Worker; daraus folgt keine vollständige Abnahme des übrigen aktuellen Projektstands.

Nachfolgende Prüfung am 10.10.2026: Ursache in der simulierten Testdatenbank behoben; anschließend alle 467 Logiktests mit normalem Speicherlimit und Produktionsbuild erfolgreich. [Speichermessungen und vollständiger Prüfnachweis](Pruefbericht.md#10102026--speicherverbrauch-des-vollständigen-testlaufs).

**Serversteuerung 10.10.2026 lokal umgesetzt, noch nicht veröffentlicht:** Neue gewertete Solo-Zeitläufe verwenden `solo-server-v1`, Serverauswahl und Serverzeit. Nur die aktuelle Frage ohne Lösung wird ausgegeben; zukünftiger Pool und Folge bleiben privat. Öffentliche Solo-Ranglisten lesen ausschließlich serverbestätigte Läufe, keine importierten oder gewöhnlich gespeicherten Clientresultate. Frühere private Läufe bleiben mit ihrer Regelkennung getrennt erhalten. [Führender aktueller Vertrag einschließlich Zeit-/Geräteregel, Datenmenge und Einführung](Servergepruefte-Zeitrunden-2026-10-10.md), [Ausgangsbefund](Zeitrunden-Manipulationsschutz-2026-10-10.md). Die folgenden Beschreibungen dokumentieren den älteren Stand; bei Zeitmessung, Wiederaufnahme, Listenablage und öffentlicher Wertungsquelle gilt dieser neue Vertrag vorrangig.

Stand: 03.10.2026. **Version 47 entfernt die früheren Sonderwertungen auf ausdrücklichen Nutzerauftrag; am 03.10.2026 um 18:32:06 Uhr Europe/Berlin öffentlich veröffentlicht, in `main` integriert und mit GitHub synchronisiert.** Die Serverbereinigung ist angewendet. Frühere Erhaltungsaussagen aus Version 46 sind damit abgelöst. Die nachfolgende Auswahl- und Archivregel ist als Version 46 am 03.10.2026 um 18:12:06 Uhr Europe/Berlin öffentlich veröffentlicht, in `main` integriert und mit GitHub synchronisiert; tatsächlichen Veröffentlichungsnachweis führt [Sites-Betrieb](Sites-Betrieb.md). Ältere Veröffentlichungen und ihre Prüfungen bleiben dort erhalten.

## Einstieg und Regeln

Die standardmäßig geschlossene Auswahlklappe „Spielmodus“ enthält Lernen, Auf Zeit und Duell. Die übrigen Auswahlklappen zeigen ihre gespeicherten Werte in der Zusammenfassung; Lösungen bleiben unter Profil → Optionen. Lernen bietet Filmreise, Freies Spiel und Fehlertraining. Auf Zeit bietet 10 Fragen, Fehlerfrei und Zeitkonto. Der Wechsel bleibt auf derselben Seite; jede Gruppe merkt ihre zuletzt gewählte Variante. Beim ersten Wechsel zu Auf Zeit gilt 10 Fragen im Standardmix. Duell behält seinen bestehenden Ablauf mit drei Zehnerrunden und 30 Sekunden je Frage.

Die Gruppen sind Textschalter; jede konkrete Variante einschließlich Duell hat eine gleich gestaltete illustrierte Kachel. Ein Klick wählt die Variante, speichert sie und schließt die Auswahl. Die große Startkachel zeigt anschließend den gewählten Modus. Erst „Losspielen“ startet die Runde beziehungsweise öffnet die Duellübersicht. Durchsehen anderer Gruppen verändert den Startmodus noch nicht. Eine laufende Runde blockiert weitere Starts; leere Varianten können ausgewählt, aber nicht gestartet werden. Die Radiobuttons Universal/Ein Genre bleiben mit festen Maßen und umbrechenden Beschreibungen innerhalb ihrer Box. [Bedienung und Gestaltung](Hilfe-und-Navigation.md#spielkacheln-und-rekordauswahl--03102026).

Auch bei geschlossener Auswahl zeigt eine Kachel den gewählten Modus mit großem Motiv und seiner kurzen Spielregel. „Modus ändern“ öffnet die Varianten, ohne eine Runde zu starten. Die ausgewählte Kachel und die Auswahlkacheln verwenden dieselbe Bildzuordnung; die Motive sind auf kleinen Geräten ebenfalls deutlich größer.

| Variante | Zeit | Ende |
| --- | --- | --- |
| 10 Fragen | 30 Sekunden je Frage | Nach zehn beantworteten Fragen; Fehler beenden die Runde nicht. |
| Fehlerfrei | 30 Sekunden je Frage | Erster Fehler, „Keine Ahnung“ oder Zeitablauf. |
| Zeitkonto | 120 Sekunden Start und Obergrenze; je Frage höchstens 30 Sekunden oder der kleinere Restvorrat | Vorrat leer. Richtige Antwort +15 Sekunden, falsche Antwort/„Keine Ahnung“ −45 Sekunden, zusätzlich tatsächlich verbrauchte Antwortzeit. |

Die Uhr startet nach dem Rendern der bedienbaren Frage. Erklärungen, Speichern und der Weiterknopf verbrauchen keine Antwortzeit. Ein Tabwechsel pausiert die laufende Frage nicht. Bei leerem Vorrat gibt es keinen nachträglichen Bonus. Die Antwort wird bei Erreichen der Grenze als Zeitablauf gespeichert. Laufende Rekordspiele werden bei Neuladen oder Verlassen abgebrochen. Ein reguläres Endlosende wird mit der letzten Antwort atomar als abgeschlossen gesichert, auch wenn der Nutzer vor der Ergebnisansicht neu lädt.

Korrektur vom 04.10.2026: Alle drei Zeitmodi verwenden die Lösungswahl unter Profil → Optionen. Direktes Feedback erlaubt Lesen und manuelles Weitergehen ohne laufende Frageuhr. Bei gesammelten Lösungen folgen die Fragen nach dem Speichern automatisch aufeinander; der unmittelbare Rundenrückblick öffnet sich am Laufende. Neue Duelle verwenden zwingend gesammelte Lösungen nach der eigenen Zehnerrunde. Neue Zehnerrekorde verwenden unabhängig davon dieselbe Wertungskategorie; `.L`-Zusatzwertungen und frühere eigene Filterwertungen werden nicht mehr geführt. [Vollständige Zuordnung](Lernregeln.md#korrigierte-zuordnung-und-ablauf--04102026).

## Zeitkonto-Balance

Bei einer Trefferquote p und mittlerer Antwortzeit t Sekunden beträgt die mittlere Veränderung ohne Deckelung `60p − 45 − t` Sekunden je Antwort. Für Neutralität braucht man `p = (45 + t) / 60`.

| Mittlere Antwortzeit | Trefferquote für neutralen Vorrat |
| --- | --- |
| 0 Sekunden | 75 % |
| 3 Sekunden | 80 % |
| 6 Sekunden | 85 % |

50 % Wissen plus zufälliges Raten des unbekannten Rests bei vier Antworten ergibt 62,5 % Treffer und verliert schon ohne Antwortzeit im Mittel 7,5 Sekunden je Frage. Die Obergrenze verhindert einen beliebig großen Vorrat; eine neutrale Erwartung garantiert wegen Fehlerserien kein endloses Überleben. Die Werte sind ein abgestimmter erster Stand; das Spielgefühl wurde mit kontrollierten Abläufen, noch nicht mit längeren Nutzertests untersucht. Änderungen brauchen eine neue Regelversion.

## Pool und Wertung

**Universal** verwendet alle mitgelieferten offiziellen Filmgenres sowie Filmfragen, Preisträger und Schauspieler; **Ein Genre** verwendet ausschließlich Filmfragen eines der zwölf offiziellen Genres. Eigene Importe, zusätzliche private Genres, Genre-Kombinationen, einzelne Filme, Classics/Arthouse und freie Bekanntheits- oder Stufenfilter erzeugen keine neuen Rekordkategorien. Die beim Paketladen ermittelte Zuordnung `bundledQuestionIds` grenzt den offiziellen Pool ab. Vor dem Start müssen die offiziellen Pakete vollständig verfügbar sein.

Beide Auswahlen ziehen je Zehnerblock drei leichte, vier mittlere und drei schwere Ziele, innerhalb des Blocks zufällig gemischt. Alle vier Filmgruppen sind eingeschlossen; Experte ist in neuen Rekordspielen ausgeschlossen. Nach Ausschöpfen einer Stufenmenge werden Restplätze aus den verbleibenden Zielen ergänzt. Freie Kombinationen bleiben in Lernmodi möglich; ihre gespeicherten Filter werden durch einen Rekordwechsel nicht verändert. Ungültige frühere Vorbereitungseinstellungen fallen auf Universal zurück. Frühere Sonderwertungen werden lokal beim Neuaufbau und serverseitig aus der Ergebnisprojektion entfernt; ihre Antwortfakten erzeugen weiterhin Lernfortschritt und XP.

Es gibt somit **13 Kategorien je Rekordmodus**: Universal plus zwölf Genres. Nur die aktuelle genaue Regelkennung und der feste Auswahlvertrag werden gewertet. Frühere Filterkombinationen, `.L`-Zusatzregeln, alte Fünferrunden und sonstige Regelkennungen entfallen. Bereits vorhandene Läufe, die dem aktuellen Vertrag entsprechen, bleiben gültig.


Varianten erhalten keine zusätzlichen Lose. Jedes Wissensziel erscheint höchstens einmal je vollständigem Pooldurchgang. Danach wird neu gemischt, ohne unmittelbare Zielwiederholung, wenn mindestens zwei Ziele verfügbar sind. Der Pool und die Restfolge werden eingefroren, Fragendaten und Antwortreihenfolgen schrittweise ergänzt. Die Serie hat keine feste spielerische Fragenzahl.

Alle drei Solo-Rekordmodi vergeben pro rechtzeitigem Treffer `100 + 2 × floor((30000 − elapsedMs) / 1000)` Punkte, Fehler null. Die kleinere verbleibende Zeitkontogrenze ändert die 30-Sekunden-Basis des Bonus nicht. Restvorrat und Schwierigkeit geben keine zusätzlichen Laufpunkte. Lern-XP bleiben getrennt und behalten die bestehenden Boni und Grenzen pro Wissensziel/Tag. Wiederholungen liefern Laufpunkte und einzelne Antwortstatistiken, keine mehrfachen Lernboni für dasselbe Ziel am selben Tag.

## Highscores

Rekordspiele, Duelle und Karriere bilden getrennte Bereiche. Rekordspiele unterscheiden die drei Modi sowie Meine Läufe/Gemeinsame Rangliste. **Jeder abgeschlossene Lauf wird einzeln aufgelistet**, auch mit null Punkten. Derselbe Spieler kann mehrere Plätze belegen. Es gibt keine Reduktion auf den besten Lauf je Spieler und keine Summenwertung der Solo-Läufe.

Die Ergebnisaktion „Bestenliste ansehen“ übergibt die konkrete Runde. Meine Läufe/Allzeit öffnet dadurch mit dem tatsächlichen Modus und ihrem vollständigen kanonischen `recordKey`, einschließlich Filter, Thema, Größe und Regelversion. „Dieser Lauf“ markiert genau den übergebenen Eintrag; Scrollen und Tastaturfokus machen ihn auch unter vielen besseren Ergebnissen sichtbar. Abweichende frühere Regelkennungen erscheinen nicht mehr. Sind andere Kategorien ausgeblendet, zeigt die Liste dies und bietet „Alle Kategorien anzeigen“. Allgemeine Navigation über Highscores bleibt die Übersicht; ein früherer Ergebnisbezug wird dabei nicht übernommen. Die unmittelbaren Duellergebnisse übergeben stattdessen die Begegnung und öffnen den Bereich Duelle mit den eigenen Allzeit-Ergebnissen. Die geladenen eigenen Ergebnisse markieren das passende Duell; die bestehende Begrenzung auf 50 Einträge je Seite bleibt erhalten.

Woche beginnt Montag, Monat und Jahr sind aktuelle Kalenderzeiträume in Europe/Berlin. Allzeit umfasst alle gültigen Ergebnisse. Maßgeblich ist der gespeicherte Abschlusszeitpunkt, auch bei späterer Offline-Sicherung. Zeitraumwechsel löschen keine Ergebnisse.

Platzierung nach Laufpunkten absteigend; Gleichstände teilen sich einen Platz (1, 1, 3). Früherer Abschluss steht innerhalb eines Gleichstands zuerst. Modus, kanonische Filter, Thema, Regelversion sowie bei festen Runden die tatsächliche Größe definieren die Kategorie. Endloslänge und tatsächlich gezogener Mix sind Ergebnisse und teilen die Kategorie nicht nachträglich auf. Zehnerrekorde brauchen genau zehn Fragen; frühere Fünferrunden und freie Mischungsregeln zählen nicht mehr. Aktive und abgebrochene Solo-Läufe fehlen in der Rangliste. Der unmittelbare Rundenrückblick ordnet wiederkehrende Fragen der jeweiligen Antwort zu; später bleiben nur Ergebniswerte.

Gemeinsame Solo-Listen sind auch Gästen zugänglich. Sie zeigen nur Spielernamen, Ergebniswerte, Abschlusszeit, Rang, eigene Markierung und Karriere-XP bestätigter Konten. Private Rundennummern, Einzelantworten, E-Mail und Kontokennung werden nicht ausgegeben. Gastläufe bleiben persönlich auf dem Gerät. Seiten enthalten höchstens 50 Einträge; Ränge werden vor der Begrenzung berechnet. Primärschlüssel je Konto/Lauf verhindern Duplikate bei erneutem Sichern. Es bleiben Trainingsvergleiche aus vom Client erzeugten Sicherungen, keine manipulationssicheren Wettbewerbe.

## Duelle und Karriere

Die öffentliche Duellrangliste summiert je Zeitraum vollständig beendete, serverseitig gewertete Begegnungen: Sieg 3, Remis 1, Niederlage 0. Beide bestätigten Teilnehmer müssen ihre jeweils 30 Antworten abgegeben haben. Aufgabe, Fristablauf und ausgefallene Begegnungen liefern keine Ranglistenpunkte und bleiben in der privaten Einzelhistorie sichtbar. Diese Regel verhindert Punkte durch gegenseitige frühe Aufgabe. Die bestehende Trefferwertung innerhalb eines Duells bleibt erhalten.

Karriere zeigt die bisherigen globalen XP-/Level- und Lernleistungslisten; angemeldete Konten können weiterhin nach Genre und Stufe vergleichen. Die neuen Modi zählen mit; ihre Ergebniskarten führen direkt zur Bestenliste. Wiederholte Frage-IDs werden in der Serverstatistik nach Antwortvorkommen zugeordnet, ohne Mehrfachjoins. Gastaktivitätsmeldungen erlauben nun bis zu 100.000 Antworten pro Lauf; bereits zugestellte Meldungen bleiben idempotent.

## Speicher und Server

Neue Regelkennungen: `solo-v1.<rekord|fehlerfrei|zeitkonto>.<standard|genre>`. `custom`, `.L` und andere veraltete Rekordkennungen erzeugen keine Wertungen mehr. Die früheren Kategorie-Schlüssel und Projektions-Fallbacks entfallen; vorhandene Antwortfakten bleiben ausschließlich für Lernfortschritt und XP lesbar. Endlosereignisse verwenden zusätzliche Fragepositionen in ihrer ID. Der transaktionale Antwortaufruf prüft die erwartete Position, damit auch ein Einzielpool durch einen Doppelklick nicht zweimal beantwortet wird.

Sicherungsprüfung rekonstruiert Vorrat, Fragegrenzen, reguläres Ende und Ereigniszuordnung; aktive Endlosrunden behalten zusätzlich ihren vollständigen Pool und die Restfolge. Kompakte Kontosicherungen verwenden bei neuen Daten `quiz-cloud-compact-v3`; v1/v2 bleiben lesbar. Runden erlauben in der Sicherungsprüfung höchstens 100.000 Frageneinträge, der Gesamtkatalog höchstens 20.000 Fragen. Bestehende JSON-/Servergrößengrenzen gelten weiter; sehr lange Läufe können die Online-Sicherungsgrenze erreichen und bleiben dann lokal.

### Ergebnisarchive statt späterer Fragenrückblicke

Nach dem Spiel bleibt die aktuelle Ergebnisansicht mit Fragen, eigener Antwort und Erklärung verfügbar. Beim Verlassen dieser Ansicht und beim nächsten Laden werden abgeschlossene beziehungsweise abgebrochene lokale Runden verkürzt: keine Fragentexte, Antworttexte, Erklärungen, Antwortreihenfolgen, großen `before`-Maps oder alten Endlos-Pools mehr. Sammlung und Highscores listen weiterhin die Ergebniswerte jedes abgeschlossenen Laufs. „Spiel ansehen“ und die späteren Duellrunden-Rückblicke entfallen. Sammlung bleibt für Lernfortschritt und die Ergebnisliste bestehen; eine zusätzliche Gesamtliste ist nicht nötig.

Erhalten bleiben Antwort-/Lernereignisse und minimale Wertungsfakten: Frage-/Ziel-/Versions-IDs, Schwierigkeit, Bereich, richtige Antwort-ID und vier Antwort-IDs sowie sparsame Bereichsmerkmale. Diese sichern die unveränderte Rekonstruktion von Lernzustand, XP, Trefferzahlen, Zeiten, Rekordpunkten und Filmreise-Freischaltungen auch nach einer redaktionellen Änderung. Aktive Solorunden behalten ihren vollständigen Inhalt. Ein pausiertes Duell kann weitere bestätigte Antworten an ein verkürztes Teilergebnis anhängen und die Abschluss-XP genau einmal erhalten; seinen unmittelbaren Rückblick erzeugt der Client nur im Arbeitsspeicher aus den freigegebenen Serverlösungen.

Eintrags- und kompakte Kontosicherungen transportieren dieselben Fakten mit `archive: {version: 1}`. Nicht mehr referenzierte private Inhaltsobjekte werden lokal erst nach vollständiger Outbox-Bestätigung ohne vorgemerkte Migration freigegeben; serverseitig schützt zusätzlich eine Tagesfrist verspätete Pakete. Aktuelle Kataloge, aktive Runden und referenzierte Objekte bleiben erhalten. Temporäre `DUEL-`-Katalogkopien entfallen erst ohne aktive Referenz. Gefrorene Betreiber-Rückfallkopien werden weiterhin nach dem gesonderten [Wartungsablauf](Speicher-und-Sync-Migration.md) behandelt, nicht automatisch gelöscht. Der gemeinsame serverseitige Duell-Spielstand behält seinen bisherigen asynchronen Wiederaufnahmevertrag.

Die neue [Migration für Ergebnisarchive und Genre-Rekorde](../supabase/migrations/20261003150524_compact_round_results.sql) erweitert Validator und Ergebnisprojektion. Die [ergänzende Objektfreigabe](../supabase/migrations/20261003155030_archive_object_gc_references.sql) berechnet die noch benötigten Referenzen einmal je Prüfung statt erneut je altem Objekt. Beide Migrationen sind nach vollständiger privater Sicherung live eingerichtet und schreiben beim Anwenden keine Konten, Runden oder Highscores um. Neue interne Helfer bleiben für PUBLIC, anon und authenticated gesperrt. Der lokale logische Sicherungsvertrag bleibt Schema 1; ein alter Client lehnt das unbekannte Archiv ab, statt einen unvollständigen Stand zurückzuschreiben. Alte App-Fenster vor dem Update schließen; Browserdaten nicht löschen.

Live eingerichtet sind die Rekordmigration und die ergänzende [Ereigniszuordnung für lange Läufe](../supabase/migrations/20261003121600_record_statistics_event_lookup.sql). Migration: [20261003103026_record_modes_highscores.sql](../supabase/migrations/20261003103026_record_modes_highscores.sql). Sie ergänzt öffentliche, begrenzte Ergebnis-RPCs, private Duellhistorie, interne Statistikprojektion und die erweiterte Gastmeldungsgrenze. Direkter Tabellenzugriff bleibt gesperrt. Vorhandene Rekorde werden lokal im Migrationslauf neu projiziert, ohne Frage- oder Lerninhalte umzuschreiben. Alte RPCs und gesicherte Runden bleiben lesbar. Der Kontodienst benötigt die öffentliche Karriere/Gastaktivität. Bei vorhandenem Eintragsprotokoll erhält die Migration dessen kleine Statistikprojektionen: Antworten werden positionsgenau zugeordnet, wiederholte Fragen nur in Endlosmodi zugelassen, offizielle Katalog-IDs synchronisiert und öffentliche Karriere-XP aus den bestehenden Summen gelesen. Private Kontoeinträge und alte Sicherungen werden dabei nicht verändert.

Der Serverrollout und die Veröffentlichung als Version 43 sind abgeschlossen. Die gemeinsamen Listen verwenden die eingerichteten Funktionen. Bei einem Dienstausfall bieten sie erneutes Laden; persönliche Läufe bleiben offline verfügbar.

## Quellen und Prüfung

Der [ursprüngliche Vorschlag](Endlos-Rekord-Konzept.md) und fünf unveränderte Nutzernachrichten dokumentieren Ursprung und Klarstellung. Der Nutzer beauftragte anschließend alle Änderungen im Worktree. [Umsetzungsauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/Rekordmodi-Worktree-Auftrag-2026-10-03.md). Prüfstand siehe [Prüfbericht](Pruefbericht.md).

Die [Nutzerklarstellungen zur Auswahl, zu Ergebnisarchiven und begrenzten Rekordkategorien](../KI-Wissen-Wissensquiz/01%20Rohquellen/Spielauswahl-und-Rekordkategorien-2026-10-03.md) lösen den Direktstart und beliebige Rekordkombinationen der Versionen 44/45 ab.

## Sonderwertungen entfernt, Version 47

Der [ausdrückliche Bereinigungsauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/Rekord-Sonderwertungen-Entfernung-2026-10-03.md) hebt die Erhaltung alter Rekordkategorien auf. [Migration](../supabase/migrations/20261003161636_current_record_categories_only.sql): bisherige Highscore-Projektion entfernen, nur gültige aktuelle Läufe neu projizieren, alte Projektionsfunktionen löschen. Der gleiche Gültigkeitsvertrag gilt lokal, serverseitig und beim erneuten Synchronisieren. So können alte Clients oder wiederhergestellte Sicherungen entfernte Sonderwertungen nicht erneut erzeugen. Eine reale alte Sonderwertung gelöscht; vier aktuelle Läufe erhalten. Inhaltsnachweise bestätigen unveränderte private Spielstände, Einträge, Objekte, Generationen und Lern-/XP-Summen. Eingefrorene Kontosicherungen und gemeinsame Fragekataloge gehören nicht zu den entfernten Rekordwertungen.

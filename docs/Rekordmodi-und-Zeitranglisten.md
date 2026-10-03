# Rekordmodi und Zeitranglisten

Stand 03.10.2026: auf Nutzerauftrag im isolierten Worktree `codex/rekordmodi` umgesetzt. Die Änderungen sind lokal; die neue Servermigration ist nicht live angewendet und die App nicht veröffentlicht. Grundlage ist der veröffentlichte Quellstand `0db3262`. Andere Arbeiten im Hauptarbeitsordner wurden nicht übernommen.

## Einstieg und Regeln

Die Startseite zeigt Lernen, Auf Zeit und Duell. Lernen bietet Filmreise, Freies Spiel und Fehlertraining. Auf Zeit bietet 10 Fragen, Fehlerfrei und Zeitkonto. Der Wechsel bleibt auf derselben Seite; jede Gruppe merkt ihre zuletzt gewählte Variante. Beim ersten Wechsel zu Auf Zeit gilt 10 Fragen im Standardmix. Duell behält seinen bestehenden Ablauf mit drei Zehnerrunden und 30 Sekunden je Frage.

| Variante | Zeit | Ende |
| --- | --- | --- |
| 10 Fragen | 30 Sekunden je Frage | Nach zehn beantworteten Fragen; Fehler beenden die Runde nicht. Kleine eigene Pools können weniger Fragen liefern. |
| Fehlerfrei | 30 Sekunden je Frage | Erster Fehler, „Keine Ahnung“ oder Zeitablauf. |
| Zeitkonto | 120 Sekunden Start und Obergrenze; je Frage höchstens 30 Sekunden oder der kleinere Restvorrat | Vorrat leer. Richtige Antwort +15 Sekunden, falsche Antwort/„Keine Ahnung“ −45 Sekunden, zusätzlich tatsächlich verbrauchte Antwortzeit. |

Die Uhr startet nach dem Rendern der bedienbaren Frage. Erklärungen, Speichern und der Weiterknopf verbrauchen keine Antwortzeit. Ein Tabwechsel pausiert die laufende Frage nicht. Bei leerem Vorrat gibt es keinen nachträglichen Bonus. Die Antwort wird bei Erreichen der Grenze als Zeitablauf gespeichert. Laufende Rekordspiele werden bei Neuladen oder Verlassen abgebrochen. Ein reguläres Endlosende wird mit der letzten Antwort atomar als abgeschlossen gesichert, auch wenn der Nutzer vor der Ergebnisansicht neu lädt.

Endlosmodi zeigen Lösungen direkt je Frage. 10 Fragen und Duelle behalten die bestehende Wahl zwischen sofortigen und gesammelten Lösungen; die gesammelte Zehnerwertung hat eine eigene Regelkennung.

## Zeitkonto-Balance

Bei einer Trefferquote p und mittlerer Antwortzeit t Sekunden beträgt die mittlere Veränderung ohne Deckelung `60p − 45 − t` Sekunden je Antwort. Für Neutralität braucht man `p = (45 + t) / 60`.

| Mittlere Antwortzeit | Trefferquote für neutralen Vorrat |
| --- | --- |
| 0 Sekunden | 75 % |
| 3 Sekunden | 80 % |
| 6 Sekunden | 85 % |

50 % Wissen plus zufälliges Raten des unbekannten Rests bei vier Antworten ergibt 62,5 % Treffer und verliert schon ohne Antwortzeit im Mittel 7,5 Sekunden je Frage. Die Obergrenze verhindert einen beliebig großen Vorrat; eine neutrale Erwartung garantiert wegen Fehlerserien kein endloses Überleben. Die Werte sind ein abgestimmter erster Stand; das Spielgefühl wurde mit kontrollierten Abläufen, noch nicht mit längeren Nutzertests untersucht. Änderungen brauchen eine neue Regelversion.

## Pool und Wertung

Standardmix verwendet nur die mitgelieferten Fragenpakete: Filmfragen, Preisträger, Schauspieler, alle offiziellen Filmgenres und Filmgruppen, leicht/mittel/schwer. Für den Standardstart müssen die Pakete vollständig verfügbar sein. Eigene Importe ergänzen diesen Pool nicht. Die beim Paketladen ermittelte Zuordnung `bundledQuestionIds` bleibt im Spielstand und in Sicherungen erhalten; Altstände werden beim Laden der Paketquellen ergänzt.

Der Standard zieht je Zehnerblock drei leichte, vier mittlere und drei schwere Ziele, im Block zufällig gemischt. Nach Ausschöpfen einer Stufenmenge werden Restplätze aus den verbleibenden Zielen ergänzt. Eigene Auswahl unterstützt alle bisherigen Filter einschließlich Experte. Ihre festen Runden behalten die Mischung nach Schwierigkeit und Filmgruppe; Endlosblöcke verteilen verfügbare Stufen möglichst gleichmäßig. Kleine Pools und eigene Filter bleiben in getrennten Kategorien.

Varianten erhalten keine zusätzlichen Lose. Jedes Wissensziel erscheint höchstens einmal je vollständigem Pooldurchgang. Danach wird neu gemischt, ohne unmittelbare Zielwiederholung, wenn mindestens zwei Ziele verfügbar sind. Der Pool und die Restfolge werden eingefroren, Fragendaten und Antwortreihenfolgen schrittweise ergänzt. Die Serie hat keine feste spielerische Fragenzahl.

Alle drei Solo-Rekordmodi vergeben pro rechtzeitigem Treffer `100 + 2 × floor((30000 − elapsedMs) / 1000)` Punkte, Fehler null. Die kleinere verbleibende Zeitkontogrenze ändert die 30-Sekunden-Basis des Bonus nicht. Restvorrat und Schwierigkeit geben keine zusätzlichen Laufpunkte. Lern-XP bleiben getrennt und behalten die bestehenden Boni und Grenzen pro Wissensziel/Tag. Wiederholungen liefern Laufpunkte und einzelne Antwortstatistiken, keine mehrfachen Lernboni für dasselbe Ziel am selben Tag.

## Highscores

Rekordspiele, Duelle und Karriere bilden getrennte Bereiche. Rekordspiele unterscheiden die drei Modi sowie Meine Läufe/Gemeinsame Rangliste. **Jeder abgeschlossene Lauf wird einzeln aufgelistet**, auch mit null Punkten. Derselbe Spieler kann mehrere Plätze belegen. Es gibt keine Reduktion auf den besten Lauf je Spieler und keine Summenwertung der Solo-Läufe.

Woche beginnt Montag, Monat und Jahr sind aktuelle Kalenderzeiträume in Europe/Berlin. Allzeit umfasst alle gültigen Ergebnisse. Maßgeblich ist der gespeicherte Abschlusszeitpunkt, auch bei späterer Offline-Sicherung. Zeitraumwechsel löschen keine Ergebnisse.

Platzierung nach Laufpunkten absteigend; Gleichstände teilen sich einen Platz (1, 1, 3). Früherer Abschluss steht innerhalb eines Gleichstands zuerst. Modus, kanonische Filter, Thema, Regelversion sowie bei festen Runden die tatsächliche Größe definieren die Kategorie. Endloslänge und tatsächlich gezogener Mix sind Ergebnisse und teilen die Kategorie nicht nachträglich auf. Historische Fünfer-/Zehner- und frühere Mischungsregeln bleiben separat. Aktive und abgebrochene Solo-Läufe fehlen in der Rangliste. Rückblicke ordnen wiederkehrende Fragen der jeweiligen Antwort zu.

Gemeinsame Solo-Listen sind auch Gästen zugänglich. Sie zeigen nur Spielernamen, Ergebniswerte, Abschlusszeit, Rang, eigene Markierung und Karriere-XP bestätigter Konten. Private Rundennummern, Einzelantworten, E-Mail und Kontokennung werden nicht ausgegeben. Gastläufe bleiben persönlich auf dem Gerät. Seiten enthalten höchstens 50 Einträge; Ränge werden vor der Begrenzung berechnet. Primärschlüssel je Konto/Lauf verhindern Duplikate bei erneutem Sichern. Es bleiben Trainingsvergleiche aus vom Client erzeugten Sicherungen, keine manipulationssicheren Wettbewerbe.

## Duelle und Karriere

Die öffentliche Duellrangliste summiert je Zeitraum vollständig beendete, serverseitig gewertete Begegnungen: Sieg 3, Remis 1, Niederlage 0. Beide bestätigten Teilnehmer müssen ihre jeweils 30 Antworten abgegeben haben. Aufgabe, Fristablauf und ausgefallene Begegnungen liefern keine Ranglistenpunkte und bleiben in der privaten Einzelhistorie sichtbar. Diese Regel verhindert Punkte durch gegenseitige frühe Aufgabe. Die bestehende Trefferwertung innerhalb eines Duells bleibt erhalten.

Karriere zeigt die bisherigen globalen XP-/Level- und Lernleistungslisten; angemeldete Konten können weiterhin nach Genre und Stufe vergleichen. Die neuen Modi zählen mit. Wiederholte Frage-IDs werden in der Serverstatistik nach Antwortvorkommen zugeordnet, ohne Mehrfachjoins. Gastaktivitätsmeldungen erlauben nun bis zu 100.000 Antworten pro Lauf; bereits zugestellte Meldungen bleiben idempotent.

## Speicher und Server

Neue Regelkennungen: `solo-v1.<rekord|fehlerfrei|zeitkonto>.<standard|custom>`, optional `.L` nur für gesammelte Zehnerlösungen. Endlosereignisse verwenden zusätzliche Fragepositionen in ihrer ID. Der transaktionale Antwortaufruf prüft die erwartete Position, damit auch ein Einzielpool durch einen Doppelklick nicht zweimal beantwortet wird.

Sicherungsprüfung rekonstruiert Vorrat, Fragegrenzen, reguläres Ende, Pooldurchgänge und Ereigniszuordnung. Kompakte Kontosicherungen verwenden bei neuen Daten `quiz-cloud-compact-v3`; v1/v2 bleiben lesbar. Runden erlauben in der Sicherungsprüfung höchstens 100.000 Frageneinträge, der Gesamtkatalog höchstens 20.000 Fragen. Bestehende JSON-/Servergrößengrenzen gelten weiter; sehr lange Läufe können die Online-Sicherungsgrenze erreichen und bleiben dann lokal.

Migration: [20261003103026_record_modes_highscores.sql](../supabase/migrations/20261003103026_record_modes_highscores.sql). Sie ergänzt öffentliche, begrenzte Ergebnis-RPCs, private Duellhistorie, interne Statistikprojektion und die erweiterte Gastmeldungsgrenze. Direkter Tabellenzugriff bleibt gesperrt. Vorhandene Rekorde werden lokal im Migrationslauf neu projiziert, ohne Frage- oder Lerninhalte umzuschreiben. Alte RPCs und gesicherte Runden bleiben lesbar. Der Kontodienst benötigt zunächst die schon vorbereitete Migration zur öffentlichen Karriere/Gastaktivität, danach diese Migration.

Bis zum beauftragten Serverrollout erklären die neuen gemeinsamen Listen fehlende Funktionen und bieten erneutes Laden; persönliche Läufe funktionieren vollständig offline. Keine Live-Datenbankänderung, Veröffentlichung, Main-Integration oder Remote-Aktion gehört zu diesem Umsetzungsauftrag.

## Quellen und Prüfung

Der [ursprüngliche Vorschlag](Endlos-Rekord-Konzept.md) und fünf unveränderte Nutzernachrichten dokumentieren Ursprung und Klarstellung. Der Nutzer beauftragte anschließend alle Änderungen im Worktree. [Umsetzungsauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/Rekordmodi-Worktree-Auftrag-2026-10-03.md). Prüfstand siehe [Prüfbericht](Pruefbericht.md).

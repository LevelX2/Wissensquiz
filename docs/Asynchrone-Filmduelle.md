# Asynchrone Filmduelle

**10.10.2026 lokal abgesichert, noch nicht produktiv:** Unbeantwortete Fragen erst gemeinsam mit der ersten Serverstartzeit; keine ungestartete Frage über Views oder Antwortbestätigungen. Kompakter Startabruf ohne Wiederholung früherer Fragetexte. Die erste vollständig beendete Begegnung eines Kontopaars je UTC-Tag zählt zur Duellrangliste, weitere sind Freundschaftsspiele. Eigene vollständige Zehnerrunden speisen separate öffentliche Wettbewerbswerte aus bestätigten Antworten. [Aktueller Ergänzungsvertrag und Grenzen](Servergepruefte-Zeitrunden-2026-10-10.md#umsetzung-der-ersten-drei-zusatzmaßnahmen). Historische Aussagen zum Start erst nach Darstellung und zu öffentlichen Wertungsquellen gelten nicht mehr für den lokalen Stand.

## Private Übernahme in den neuen Kontopfad

03.10.2026 lokal umgesetzt, noch nicht veröffentlicht: Eigene bestätigte Duellantworten gehen unverändert über `importDuelView` in den vollständigen privaten State ein. Der neue Eintragscompiler prüft bei diesen Importen auch Katalogänderungen; historische Duellfragen mit abweichenden Fassungen bleiben private Snapshotobjekte. Die tatsächlichen Antwortvarianten, Reihenfolgen und ursprünglichen before-Maps werden nicht gekürzt.

Ein zusätzlicher Test übernimmt denselben Duellblock schrittweise mit drei, sechs und zehn Antworten, bewahrt eine alte before-Map mit 2.000 Zielen, bestehende Rate-Markierungen und historische Frageversionen und zählt Wiederholungen nicht doppelt. Getrennte Duell-RPCs, serverseitige Zeitprüfung, Gegnerprivatsphäre und Drei-Runden-Wertung bleiben bestehen. Der öffentliche Duellkatalog mit seinem früheren Umfang ersetzt nicht den vollständigen App-Katalog für Kontosicherungen.

[Abnahme und neue Kontospeicherung](Speicher-und-Sync-Abnahme.md), [Übernahmeablauf](Speicher-und-Sync-Migration.md).

Stand: 02.10.2026. Auf Nutzerauftrag umgesetzt und als Sites-Version 36 veröffentlicht; Servermigration und öffentlicher Duellkatalog mit 4.827 Fragen im bestehenden Supabase-Projekt eingerichtet. [Betriebsnachweis](Konten-Einrichtung.md#asynchrone-filmduelle-eingerichtet-02102026). Der [ursprüngliche Entwurf](Asynchrone-Filmduelle-Konzept.md) bleibt als historische Diskussionsgrundlage erhalten.

## Ablauf und Wertung

Drei Runden mit je zehn Fragen. Beide erhalten dieselben konkreten Fragen, Inhaltsversionen, Fragenfolgen, Antworten und Antwortreihenfolgen. Ein Punkt pro Treffer, null bei falsch, „Keine Ahnung“ oder Zeitablauf. Die Summe entscheidet, Gleichstände sind Unentschieden. Keine Zeitboni oder Rekordpunkte.

Neue Duelle ziehen bei Jahresfragen zuerst den zeitlichen Rang der richtigen Lösung ausgewogen und danach die drei passenden falschen Jahre: Leicht 8–25, Mittel 3–10, Schwer 3–8 Jahre Abstand. Beide Spieler erhalten denselben einmal gespeicherten Satz; vorhandene Duelle und idempotente Wiederholungen behalten ihre Antworten. Alle CSV-Antwort-IDs bleiben erhalten und verraten durch ihre Form keine Lösung. [Jahresvertrag und Nachweis](Filmwissen-und-Filmdaten.md#korrektur-und-verteilungsnachweis--version-51).

| Spielblock | Spieler A | Spieler B |
| --- | --- | --- |
| 1 | Legt Runde 1 vor. | Noch nicht zugeordnet. |
| 2 | Wartet. | Beantwortet Runde 1 und legt Runde 2 vor. |
| 3 | Beantwortet Runde 2 und legt Runde 3 vor. | Wartet. |
| 4 | Wartet. | Beantwortet Runde 3; anschließend Endergebnis. |

Nach jeder Zehnerrunde erscheinen das eigene Ergebnis und der Rückblick. Die nächste Runde beginnt ausdrücklich; niemand muss zwanzig Fragen am Stück spielen. Gegnerwerte einer Runde erscheinen erst, wenn beide sie beendet haben. Fertige frühere Vergleiche bleiben sichtbar. Keine gegnerischen Einzelantworten oder privaten Lernstände werden ausgeliefert.

## Vertraute Runde auf Zeit

Duell und Solospiel verwenden dieselbe Frage-, Erklärungs- und Ergebnisansicht. Vier gemischte Antworten, „Keine Ahnung“, Fragehinweise und Fehlertraining bleiben erhalten. Duelle haben 30 Sekunden pro Frage. Neue Duelle spielen die Fragen automatisch hintereinander; Erklärungen und Vertiefungen stehen nach der eigenen Zehnerrunde ohne Frageuhr bereit. Eine Runde lässt sich über die Duellübersicht unterbrechen; die gestartete Frage läuft währenddessen weiter.

Nach sichtbarer Frage und zwei Animationsframes fordert die App den Serverstart an. Erst nach Bestätigung werden Antworten bedienbar. Der Server speichert die erste Startzeit; Pause, Tabwechsel, Wiederholung, Gerätewechsel und Neuladen setzen sie nicht zurück. Die App zeigt bei Wiederaufnahme die verstrichene Zeit. Ab 30 Sekunden gilt eine noch nicht bestätigte Antwort als Zeitablauf. Die serverseitige Uhr entscheidet; der Browser kann keine eigene Antwortzeit behaupten.

Abruf und Bestätigung benötigen Internet. Serverlaufzeit und Rückweg der Startbestätigung liegen innerhalb der serverseitigen Fragezeit; langsame Verbindungen können die sichtbare Restzeit von der Annahmegrenze abweichen lassen. Eine bereits gestartete Frage kann bei Verbindungsabbruch ablaufen. Noch nicht gestartete Fragen beginnen dadurch nicht. „Stand erneut laden“ liest nach unklarer Bestätigung den verbindlichen Stand zurück. Bestätigte Antworten werden weder ersetzt noch doppelt gezählt.

## Lösungen und Rate-Kennzeichnung

| Auswahl | Ablauf |
| --- | --- |
| Nach der Runde | Verbindlich für neue Duelle: Fragen folgen nach dem Speichern direkt aufeinander; Lösungen und Vertiefungen im eigenen Ergebnis und Rückblick. |

Nutzerkorrektur vom 04.10.2026: Beim Anlegen eines Duells entfällt die Lösungswahl. Der Client verwendet den vorhandenen Parameter `display: "round"` für Zufallsgegner und Linkeinladung. „Nach der Runde“ bedeutet immer die eigene Zehnerrunde; die Lösungen warten niemals auf den Gegner. Nach der Antwort wird automatisch weitergespielt und nach Antwort zehn der Rückblick geöffnet. Die 30 Sekunden je Frage und die serverseitige Startzeit bleiben erhalten. Bereits gespeicherte Duellsnapshots werden nicht umgeschrieben. Für Zeitspiele und Freies Spiel bleibt die persönliche Wahl unter Profil → Optionen; Filmreise und Fehlertraining zeigen Lösungen immer direkt. Die frühere freie Duellwahl und die manuelle Weiter-Bestätigung bei gesammelten Lösungen sind abgelöst. [Führender Lösungsvertrag](Lernregeln.md#korrigierte-zuordnung-und-ablauf--04102026).

Gesammelte Anzeige verbirgt Antwortfarben, Richtig-/Falsch-Töne, laufende Trefferwerte, Fragehistorie und Erklärung. Vor der Antwort lässt sich „Ich rate bei dieser Frage“ markieren. Nur ein tatsächlich richtiger Treffer wird als geratenes Lernereignis behandelt; falsche Antworten bleiben Fehler. Duellpunkte ändern sich dadurch nicht.

Der Ersteller legt die Anzeige für beide fest. Sie bleibt im Duell unverändert und gehört zum zufälligen Paarungspool. Solo speichert die Einstellung und friert sie beim Rundenstart ein. Alte Sicherungen ohne Feld verwenden direktes Feedback. Gesammelte Rekordrunden erhalten den Regelzusatz `.L` und werden separat verglichen.

## Gegner, Einladungen und offene Spiele

Unter **Spielen → Duell** stehen „Zufälligen Gegner finden“ und „Per Link einladen“. Seit der lokalen Änderung vom 03.10.2026 führt die fünfte Spielkachel im gemeinsamen Raster direkt in diese Übersicht; der separate breite Einstieg entfällt. Neue und offene Duelle bleiben gemeinsam erreichbar. Duelle benötigen ein bestätigtes Quiz-Konto. Zufälliger Start übernimmt die älteste offene Herausforderung mit gleicher Lösungsanzeige. Gibt es keine, legt der Spieler selbst Runde 1 vor. Erst nach diesen zehn Fragen ist die Herausforderung für Gegner freigegeben. Linkeinladungen bleiben vom öffentlichen Pool getrennt.

Pro Konto sind **fünf offene Spiele insgesamt** erlaubt, darin höchstens eine noch nicht angenommene Herausforderung. Sie belegt einen der fünf Plätze. Abgeschlossene, zurückgenommene und abgelaufene Spiele belegen keinen Platz. Trotz eigener wartender Herausforderung darf ein Konto eine fremde passende Herausforderung übernehmen, sofern ein Platz frei ist. Slotgrenzen und Zuordnung werden gemeinsam serverseitig gesperrt und geprüft.

Einladungen haben einen zufälligen 64-stelligen Token im URL-Fragment. Selbstannahme ist ausgeschlossen. Nur ein Gegner wird zugeordnet; seine Wiederholung liefert dieselbe Zuordnung, weitere Konten werden abgewiesen. Bereits geöffnete Apps erkennen einen neuen Link auch im selben Tab. Nach Annahme entfernt die App das Fragment. Ein Link sollte nur an den gewünschten Gegner weitergegeben werden.

Die Übersicht zeigt belegte Plätze und alle offenen Spiele in **Du bist dran**, **Warten auf Gegner** und **Gegner wird gesucht**. Karten enthalten Gegnername, Runde, eigene Antwortzahl, freigegebene Rundenergebnisse, Frist und nächste Aktion. Eigene fertige Runden lassen sich ansehen. Der Abruf enthält bis zu 100 Begegnungen, offene zuerst und danach die neueste Historie. Aktualisierung per Knopf, bei Fokus und etwa alle 20 Sekunden, solange keine Frage läuft.

## Fristen und Ausfälle

- **72 Stunden pro freigegebenem Spielblock** ab Serverfreigabe. Die beiden mittleren Blöcke teilen sich jeweils eine Frist über zwei Zehnerrunden; eine Pause setzt sie nicht zurück.
- Auch für das erste Vorlegen gelten 72 Stunden. Danach wartet eine noch nicht angenommene Herausforderung **sieben Tage** auf einen Gegner.
- Ohne Gegner endet sie als „Keinen Gegner gefunden“, ohne Sieg oder Niederlage. Vorher kann sie zurückgenommen werden.
- Solange keine Runde von beiden fertig ist, beendet Ausfall oder Aufgabe das Duell als „Nicht zustande gekommen“, ohne Sieg oder Niederlage.
- Nach mindestens einer beidseitig fertigen Runde gewinnt bei Fristablauf der Wartende, bei ausdrücklicher Aufgabe der andere Teilnehmer. Zeitablauf bzw. Aufgabe werden eigens gekennzeichnet. Kein erfundenes 30 : 0.

Die Serveruhr wertet Fristen bei jeder Duelloperation aus, einschließlich Listenabruf und neuem Start. Abgelaufene Plätze sind vor der nächsten Verwendung frei. Als Abschlusszeit wird der tatsächliche Fristzeitpunkt gespeichert. Ein Hintergrundjob, E-Mails und Push sind derzeit nicht eingerichtet.

## Gemeinsamer Filmmix

Der Betreiber stellt ausschließlich den öffentlichen App-Katalog bereit. Eigene CSV-Importe, Lernstände, Filter und Freischaltungen bestimmen keine Duellfragen. Pro Runde **drei leichte, vier mittlere und drei schwere Fragen**, insgesamt 30 unterschiedliche Wissensziele. Experten- und Demo-Fragen sind ausgeschlossen. Die Auswahl verteilt Genres und gewichtet ikonische/bekannte Filme höher; feste Genre-/Bekanntheitsquoten oder eine eigene Obergrenze pro Film sind nicht umgesetzt.

Varianten, Jahresalternativen und Antwortreihenfolgen werden beim Erstellen gemeinsam eingefroren. Generierte Jahresalternativen stammen aus dem bereitgestellten Katalog. Katalogupdates wirken nur auf neue Duelle. Die App erhält nur eigene beantwortete Fragen und die nächste freigegebene Frage. Vor der Auflösung werden Lösungsschlüssel, Erklärungen, Antwortfeedback und sämtliche CSV-Metadaten außer dem Genre entfernt; dadurch werden auch dort enthaltene Antwort- und Erklärungsspalten nicht vorzeitig ausgeliefert.

Der Offlinekatalog enthält bereits Lösungen. Die Serverregeln verhindern fremde Zugriffe, doppelte Antworten, veränderte Zugfolgen und erfundene Wertungen, aber kein Nachschlagen oder externe Hilfe. Dies ist ein Freizeitduell, keine manipulationssichere Wettbewerbsgarantie.

## Lernstand und Speicherung

Eigene bestätigte Antworten gehen in die vorhandene Lernhistorie ein: bei direkter Anzeige nach jeder Antwort, bei gesammelter Anzeige nach den eigenen zehn Fragen oder nach endgültigem Ende eines unvollständigen Duells, sobald Lösungen freigegeben sind. Maßgeblich ist die serverseitige Antwortzeit, nicht der Abruf. Ungespielte Fragen erzeugen keine Fehler. Teilrunden behalten Antwortlernen, erhalten aber keine Abschluss-XP. Eigene vollständige Zehnerrunden zählen als abgeschlossene Lernrunden, unabhängig vom Gegnerausfall. Bei direktem Feedback wartet der lokale Abschluss bis „Runde abschließen“, damit die letzte Rate-Korrektur vorher möglich bleibt; ein späterer Abruf übernimmt eine serverseitig vollständige Runde ebenfalls genau einmal.

Lokale Runden tragen `duel: { id, number }`, `solutionDisplay` und `ruleVersion: "duel-v1"`. Intern verwenden sie den vorhandenen Modus `ueben`; der bestehende Spielleistungsvergleich ordnet diese Lernrunden damit Freies Spiel zu. Es gibt keine eigene Duellrangliste. Teilimporte sind lokal als abgebrochen geführt und blockieren keine aktive Solorunde; der gemeinsame Serverzustand bleibt fortsetzbar.

Stabile Rundenschlüssel `duel-<Duell-ID>-<Runde>` und Ereignisschlüssel `<Rundenschlüssel>:<Wissensziel>` verhindern doppelte Lernereignisse und Abschluss-XP. Ein veralteter Duellsnapshot mit inzwischen geänderter lokaler Fragen-ID erhält eine eigene `DUEL-…`-ID mit Originalverweis in `metadata.duel_question_id`. Das Wissensziel bleibt erhalten; der lokale Katalog wird nicht überschrieben.

Der gemeinsame Spielzustand liegt in getrennten Supabase-Tabellen. Das persönliche Kontobackup enthält nur die eigene bestätigte Lernkopie. Der bestehende Revisionsschutz und ausdrücklich zu lösende Gerätekonflikte bleiben bestehen. Alle Duelltabellen haben RLS und keine direkten Rechte für Gäste oder Konten. Acht freigegebene RPCs prüfen bestätigte Identität und Zugehörigkeit; interne Funktionen sind nicht direkt ausführbar.

## Betrieb und Ausbau

Lokale Antwortoptimierung vom 03.10.2026: Bereits bestätigte Teilantworten aktualisieren das betroffene Wissen ohne vollständigen Karriere-Replay. Unveränderte Wiederholungen erzeugen keine erneute Ableitungsberechnung. Neue historische Fragenfassungen, Rate-Korrekturen und Abschlüsse werden weiterhin vollständig berücksichtigt. PostgreSQL `jsonb` kann Objektschlüssel anders anordnen: Der Snapshotvergleich prüft die Inhalte unabhängig von dieser Reihenfolge, erhält aber die Reihenfolge von Arrays und lehnt tatsächliche Inhaltsänderungen weiterhin ab. Identische Serverfragen erzeugen damit keine unnötige `DUEL-…`-Fassung und Katalogkopie. Die bestätigte Frage erhält einen unabhängigen historischen Snapshot; geprüfte Jahresalternativen bleiben erhalten. Der persönliche Fragenkatalog wird beim normalen Antwortimport wiederverwendet; neue Fassungen ersetzen ihn atomar. Die sichtbare Lösung wartet weiterhin auf die Serverbestätigung und erfolgreiche lokale Speicherung. Der [Prüfbericht](Pruefbericht.md) unterscheidet die lokale Verarbeitungszeit von der tatsächlichen Netzlaufzeit.

[Konten-Einrichtung](Konten-Einrichtung.md#asynchrone-filmduelle-eingerichtet-02102026) beschreibt Migration und Katalog. [Prüfbericht](Pruefbericht.md) trennt lokale SQL-/Browsertests von echter Dienstabnahme. Bestehende Kontokonfiguration und Site-ID werden weiterverwendet; Solo-/Gastspiel bleiben offline verfügbar.

Später möglich: freie Reihenfolge nach Paarung, Themenwahl, eigene Revancheaktion mit gewechseltem Vorleger, Duellrangliste, Push und administrative Fristkorrektur. Diese Funktionen sind nicht Teil der ersten Umsetzung. Jede andere Ablaufregel müsste vor Beginn vereinbart werden.

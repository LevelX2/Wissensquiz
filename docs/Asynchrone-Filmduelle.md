# Asynchrone Filmduelle

## Duellablauf und Übersicht – 01.11.2026, lokal

**Seit Version 86 am 01.11.2026 um 19:58:09 Uhr Europe/Berlin veröffentlicht.** Alle drei vorbereiteten Servermigrationen gemeinsam atomar aktiviert; 42 private Quelltabellen unverändert bestätigt. [Veröffentlichungs- und Prüfnachweis](Veroeffentlichung-2026-11-01-Version-86.json).

Auf [Nutzerauftrag vom 01.11.2026](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-11-01%20Nutzerauftrag%20Duellablauf.txt): neue Duelle zeigen jede bestätigte Antwort für **2,5 Sekunden** farbig und gehen automatisch weiter. Nach Paarung spielen beide ihre drei Runden unabhängig voneinander. **Zehn offene Duelle je Konto**, auch zehn ungepaarte Herausforderungen. Rundenkarten unterscheiden offene, laufende, eigene fertige und beidseitig fertige Runden mit Status, Farben und Ergebnis. „Duell“ bezeichnet die Begegnung, „Runde“ eine ihrer drei Zehnerrunden. Die Serveränderungen zu Runden, Themenwahl und direkter Suche sind seit Version 86 produktiv. Diese Korrektur ersetzt den Ablauf mit vier abwechselnden Spielblöcken und die frühere Duellpflicht „Nach der Runde“.

**10.10.2026 lokal abgesichert, noch nicht produktiv:** Unbeantwortete Fragen erst gemeinsam mit der ersten Serverstartzeit; keine ungestartete Frage über Views oder Antwortbestätigungen. Kompakter Startabruf ohne Wiederholung früherer Fragetexte. Die erste vollständig beendete Begegnung eines Kontopaars je UTC-Tag zählt zur Duellrangliste, weitere sind Freundschaftsspiele. Eigene vollständige Zehnerrunden speisen separate öffentliche Wettbewerbswerte aus bestätigten Antworten. [Aktueller Ergänzungsvertrag und Grenzen](Servergepruefte-Zeitrunden-2026-10-10.md#umsetzung-der-ersten-drei-zusatzmaßnahmen). Historische Aussagen zum Start erst nach Darstellung und zu öffentlichen Wertungsquellen gelten nicht mehr für den lokalen Stand.

## Private Übernahme in den neuen Kontopfad

03.10.2026 lokal umgesetzt, noch nicht veröffentlicht: Eigene bestätigte Duellantworten gehen unverändert über `importDuelView` in den vollständigen privaten State ein. Der neue Eintragscompiler prüft bei diesen Importen auch Katalogänderungen; historische Duellfragen mit abweichenden Fassungen bleiben private Snapshotobjekte. Die tatsächlichen Antwortvarianten, Reihenfolgen und ursprünglichen before-Maps werden nicht gekürzt.

Ein zusätzlicher Test übernimmt denselben Duellblock schrittweise mit drei, sechs und zehn Antworten, bewahrt eine alte before-Map mit 2.000 Zielen, bestehende Rate-Markierungen und historische Frageversionen und zählt Wiederholungen nicht doppelt. Getrennte Duell-RPCs, serverseitige Zeitprüfung, Gegnerprivatsphäre und Drei-Runden-Wertung bleiben bestehen. Der öffentliche Duellkatalog mit seinem früheren Umfang ersetzt nicht den vollständigen App-Katalog für Kontosicherungen.

[Abnahme und neue Kontospeicherung](Speicher-und-Sync-Abnahme.md), [Übernahmeablauf](Speicher-und-Sync-Migration.md).

Stand: 02.10.2026. Auf Nutzerauftrag umgesetzt und als Sites-Version 36 veröffentlicht; Servermigration und öffentlicher Duellkatalog mit 4.827 Fragen im bestehenden Supabase-Projekt eingerichtet. [Betriebsnachweis](Konten-Einrichtung.md#asynchrone-filmduelle-eingerichtet-02102026). Der [ursprüngliche Entwurf](Asynchrone-Filmduelle-Konzept.md) bleibt als historische Diskussionsgrundlage erhalten.

## Ablauf und Wertung

Drei Runden mit je zehn Fragen. Beide erhalten dieselben konkreten Fragen, Inhaltsversionen, Fragenfolgen, Antworten und Antwortreihenfolgen. Ein Punkt pro Treffer, null bei falsch, „Keine Ahnung“ oder Zeitablauf. Die Summe entscheidet, Gleichstände sind Unentschieden. Keine Zeitboni oder Rekordpunkte.

Neue Duelle ziehen bei Jahresfragen zuerst den zeitlichen Rang der richtigen Lösung ausgewogen und danach die drei passenden falschen Jahre: Leicht 8–25, Mittel 3–10, Schwer 3–8 Jahre Abstand. Beide Spieler erhalten denselben einmal gespeicherten Satz; vorhandene Duelle und idempotente Wiederholungen behalten ihre Antworten. Alle CSV-Antwort-IDs bleiben erhalten und verraten durch ihre Form keine Lösung. [Jahresvertrag und Nachweis](Filmwissen-und-Filmdaten.md#korrektur-und-verteilungsnachweis--version-51).

| Phase | Ersteller | Gegner |
| --- | --- | --- |
| Vorbereitung | Legt Runde 1 vor. | Noch nicht zugeordnet. |
| Suche | Wartet auf Paarung. | Nimmt eine fertige Herausforderung an. |
| Gepaarte Begegnung | Spielt Runde 2 und 3 im eigenen Tempo. | Spielt Runde 1 bis 3 im eigenen Tempo. |
| Abschluss | Kann fertig auf den Gegner warten. | Kann fertig auf den Gegner warten. |

Nach Paarung blockiert kein gegnerischer Zwischenstand die eigene nächste Runde. Beide dürfen auch gleichzeitig spielen. Jede Person durchläuft ihre Fragen und Runden in Reihenfolge; Überspringen bleibt ausgeschlossen. Erst bei 30 bestätigten Antworten auf beiden Seiten entsteht das Endergebnis.

Nach jeder Zehnerrunde erscheinen das eigene Ergebnis und der Rückblick. Die nächste Runde beginnt ausdrücklich; niemand muss zwanzig Fragen am Stück spielen. Gegnerwerte einer Runde erscheinen erst, wenn beide sie beendet haben. Fertige frühere Vergleiche bleiben sichtbar. Keine gegnerischen Einzelantworten oder privaten Lernstände werden ausgeliefert.

## Vertraute Runde auf Zeit

Duell und Solospiel verwenden dieselbe Frage-, Erklärungs- und Ergebnisansicht. Vier gemischte Antworten, „Keine Ahnung“, Fragehinweise und Fehlertraining bleiben erhalten. Duelle haben 30 Sekunden pro Frage. Neue Duelle spielen die Fragen automatisch hintereinander; Erklärungen und Vertiefungen stehen nach der eigenen Zehnerrunde ohne Frageuhr bereit. Eine Runde lässt sich über die Duellübersicht unterbrechen; die gestartete Frage läuft währenddessen weiter.

Die App fordert zuerst den Serverstart an. Erst dessen Antwort liefert die nächste Frage mit erster Startzeit; nach Darstellung und zwei Animationsframes werden die Antworten bedienbar. Der Server speichert die erste Startzeit; Pause, Tabwechsel, Wiederholung, Gerätewechsel und Neuladen setzen sie nicht zurück. Die App zeigt bei Wiederaufnahme die verstrichene Zeit. Ab 30 Sekunden gilt eine noch nicht bestätigte Antwort als Zeitablauf. Die serverseitige Uhr entscheidet; der Browser kann keine eigene Antwortzeit behaupten.

Abruf und Bestätigung benötigen Internet. Serverlaufzeit und Rückweg der Startbestätigung liegen innerhalb der serverseitigen Fragezeit; langsame Verbindungen können die sichtbare Restzeit von der Annahmegrenze abweichen lassen. Eine bereits gestartete Frage kann bei Verbindungsabbruch ablaufen. Noch nicht gestartete Fragen beginnen dadurch nicht. „Stand erneut laden“ liest nach unklarer Bestätigung den verbindlichen Stand zurück. Bestätigte Antworten werden weder ersetzt noch doppelt gezählt.

## Lösungen und Rate-Kennzeichnung

Neue Duelle verwenden für beide Spieler den vorhandenen RPC-Parameter display: "question". Nach erfolgreicher Serverbestätigung und Lernübernahme bleiben die vier Antworten 2,5 Sekunden sichtbar: richtige Lösung grün mit Häkchen, eigene falsche Auswahl rot. Auch „Keine Ahnung“ und Zeitabläufe zeigen die richtige Lösung; dabei wird keine ungewählte falsche Antwort markiert. Die Zehnerleiste zeigt Treffer, Fehler und Zeitablauf sofort. Anschließend startet automatisch die nächste Frage bzw. nach Frage zehn der eigene Rundenrückblick. Während der Antwortanzeige beginnt noch keine neue Serverfrage.

Erklärungen und Vertiefungen stehen im Rückblick nach den eigenen zehn Fragen bereit, unabhängig vom Gegner. Es gibt keine zusätzliche Weiter-Bestätigung innerhalb der Zehnerrunde. Die nächste Zehnerrunde startet ausdrücklich über „Runde N spielen“. Der Soloregler für die Antwortanzeige verändert die feste Duellzeit nicht.

Bei aktiviertem Ton begleitet der gemeinsame Antwortklang die bestätigte Wertung: aufsteigendes Signal für richtig, absteigendes für falsch, eigenes Auflösungssignal für „Keine Ahnung“ und eigenes Zeitablaufsignal. Die bisherige neutrale Klickrückmeldung gesammelter Duelllösungen entfällt für neue Duelle. „Ton an/aus“ und die gespeicherte Toneinstellung bleiben maßgeblich; keine Ausgabe ohne freigegebene Browser-Audiositzung.

Vor jeder Antwort lässt sich „Ich rate bei dieser Frage“ markieren. Nur ein tatsächlich richtiger Treffer wird als geratenes Lernereignis behandelt; falsche Antworten bleiben Fehler. Duellpunkte ändern sich dadurch nicht. Bereits gespeicherte Lösungsanzeigen werden nicht umgeschrieben; die bestehende Verarbeitung gesammelter Lösungen bleibt erhalten, ohne neue Adapter oder Fallbacks. Zufällige Paarungen bleiben nach gespeicherter Lösungsanzeige getrennt.

## Gegner, Einladungen und offene Spiele

Unter **Spielen → Duell → Duell wählen** sind Gegnersuche und eigenes Vorlegen getrennt. „Duell vorlegen“ erstellt immer eine eigene Herausforderung mit genau einem Thema; eine vorhandene fremde Herausforderung wird dabei nicht automatisch angenommen. Nach den eigenen ersten zehn Antworten ist das öffentliche Duell bereit. „Per Link einladen“ legt dieselbe Themenauswahl als private Einladung an; sie bleibt vom öffentlichen Pool getrennt. Für die Suche wählt der Spieler unabhängig davon die zulässigen Duellthemen.

Pro Konto sind **zehn offene Spiele insgesamt** erlaubt. Alle zehn dürfen noch ungepaart sein, sowohl in Vorbereitung als auch zur Suche freigegeben. Die bisherige Zusatzgrenze einer nicht angenommenen Herausforderung entfällt. Abgeschlossene, zurückgenommene und abgelaufene Spiele belegen keinen Platz. Eigene wartende Herausforderungen verhindern die Annahme einer fremden Herausforderung nicht, sofern ein Platz frei ist. Erstellen und Annehmen prüfen dieselbe Grenze unter Kontosperre; die Zuordnung sperrt das konkrete Duell. Wiederholte Erstellungsanfragen bleiben idempotent.

Einladungen haben einen zufälligen 64-stelligen Token im URL-Fragment. Selbstannahme ist ausgeschlossen. Nur ein Gegner wird zugeordnet; seine Wiederholung liefert dieselbe Zuordnung, weitere Konten werden abgewiesen. Bereits geöffnete Apps erkennen einen neuen Link auch im selben Tab. Nach Annahme entfernt die App das Fragment. Ein Link sollte nur an den gewünschten Gegner weitergegeben werden.

Die Übersicht zeigt belegte Plätze und offene Spiele in **Du bist dran**, **Warten auf Gegner** und **Gegner wird gesucht**. Leere Gruppen entfallen; „Neues Duell“ steht vor den offenen Spielen. Ein gelber Gegnerbereich nennt „Noch nicht gepaart“, der grüne Bereich nennt den feststehenden Gegner. Jede Karte erklärt die nächste Aktion. Die drei Rundenkarten zeigen eigene und gegnerische Antwortzahlen; Gegnerpunkte erscheinen erst bei beidseitigem Rundenabschluss. Noch offene Runden sind grau, laufende blau, eigene fertige Runden mit ausstehendem Gegner gelb. Beidseitig fertige Runden erhalten eine durchgezogene Umrandung, großes Ergebnis und „gewonnen“ (grün), „verloren“ (rot) oder „unentschieden“ (violett). Symbole und ausgeschriebene Status ergänzen alle Farben. Der Zwischenstand summiert nur verglichene Runden und nennt deren Anzahl. Eigene 30 Antworten bei ausstehendem Gegner bleiben sichtbar offen; „Duellstand aktualisieren“ aktualisiert auch den unmittelbaren Rückblick. Ein neues Duell heißt „Neues Duell starten“, seine einzelnen Abschnitte „Runde N spielen“.

## Fristen und Ausfälle

- **72 Stunden ab Paarung** gemeinsam für alle drei Runden. Eigener Rundenabschluss, Pause, Gerätewechsel und Fortschritt des Gegners verlängern diese Frist nicht.
- Auch für das erste Vorlegen gelten 72 Stunden. Danach wartet eine noch nicht angenommene Herausforderung **sieben Tage** auf einen Gegner.
- Ohne Gegner endet sie als „Keinen Gegner gefunden“, ohne Sieg oder Niederlage. Vorher kann sie zurückgenommen werden.
- Solange keine Runde von beiden fertig ist, beendet Ausfall oder Aufgabe das Duell als „Nicht zustande gekommen“, ohne Sieg oder Niederlage.
- Bei Fristablauf gewinnt nur, wer alle drei eigenen Runden beendet hat, sofern mindestens eine Runde beidseitig fertig ist. Sind beide unvollständig oder fehlt jede beidseitig fertige Runde, endet das Duell ohne Sieg/Niederlage. Bei ausdrücklicher Aufgabe gewinnt nach mindestens einer beidseitig fertigen Runde der andere Teilnehmer. Zeitablauf bzw. Aufgabe werden eigens gekennzeichnet. Kein erfundenes 30 : 0.

Die Serveruhr wertet Fristen bei jeder Duelloperation aus, einschließlich Listenabruf und neuem Start. Abgelaufene Plätze sind vor der nächsten Verwendung frei. Als Abschlusszeit wird der tatsächliche Fristzeitpunkt gespeichert. Ein Hintergrundjob, E-Mails und Push sind derzeit nicht eingerichtet.

## Gemeinsamer Filmmix

### Duellthema – 01.11.2026, lokal

Beim Erstellen wird genau eine Auswahl eingefroren: **Alle Genres (gemischt)**, eines der zwölf Filmgenres, **Schauspieler** oder **Preise**. Keine Mehrfachauswahl und keine Spezialkategorien Classics/Arthouse. Filme aus diesen Paketen können weiterhin über ihr tatsächliches Genre vorkommen; ihre Paketkennzeichnung ist kein eigenes Duellthema. Filmgenre-Auswahl enthält ausschließlich Filmfragen dieses Genres; Schauspieler und Preise bilden getrennte Quellen. „Alle Genres (gemischt)“ umfasst alle drei Quellen. Expertenfragen bleiben ausgeschlossen.

Der Server prüft die Auswahl und friert dieselben 30 Fragen für beide ein. Bei der Gegnersuche wird die älteste freigegebene öffentliche Herausforderung aus den zugelassenen Themen sofort angenommen. Linkeinladungen behalten das Thema des Erstellers. Das Thema steht in Spiel, Übersicht und Ergebnis. Die Standardauswahl ist „Alle Genres (gemischt)“; es gibt keine zweite API oder Umsetzung für frühere Clients. Vorhandene Duelle werden der bisherigen unbeschränkten Auswahl zugeordnet, ihre Fragen bleiben eingefroren. Die neue Auswahl ist als reguläres Feld mit dieser Standardbelegung angelegt; keine historischen Fragenpakete werden umgeschrieben.

Migration `20261101163118_duel_topic_selection.sql` ergänzt Auswahl und Paarungsindex, stellt den aktuellen öffentlichen Schauspielerkatalog bereit und berücksichtigt Schauspieler bei künftigen Katalogaktivierungen. Nur öffentliche Betreiberfragen und Duellregeln, keine privaten Kontospielstände. Alle drei Duellmigrationen sind lokal vorbereitet und müssen gemeinsam mit der Oberfläche ausdrücklich zur Veröffentlichung freigegeben werden.

Der Betreiber stellt ausschließlich den öffentlichen App-Katalog bereit. Eigene CSV-Importe, Lernstände, Filter und Freischaltungen bestimmen keine Duellfragen. Pro Runde **drei leichte, vier mittlere und drei schwere Fragen**, insgesamt 30 unterschiedliche Wissensziele. Experten- und Demo-Fragen sind ausgeschlossen. Die Auswahl verteilt Genres und gewichtet ikonische/bekannte Filme höher; feste Genre-/Bekanntheitsquoten oder eine eigene Obergrenze pro Film sind nicht umgesetzt.

Varianten, Jahresalternativen und Antwortreihenfolgen werden beim Erstellen gemeinsam eingefroren. Generierte Jahresalternativen stammen aus dem bereitgestellten Katalog. Katalogupdates wirken nur auf neue Duelle. Die App erhält nur eigene beantwortete Fragen und die nächste freigegebene Frage. Vor der Auflösung werden Lösungsschlüssel, Erklärungen, Antwortfeedback und sämtliche CSV-Metadaten außer dem Genre entfernt; dadurch werden auch dort enthaltene Antwort- und Erklärungsspalten nicht vorzeitig ausgeliefert.

Der Offlinekatalog enthält bereits Lösungen. Die Serverregeln verhindern fremde Zugriffe, doppelte Antworten, veränderte Zugfolgen und erfundene Wertungen, aber kein Nachschlagen oder externe Hilfe. Dies ist ein Freizeitduell, keine manipulationssichere Wettbewerbsgarantie.

### Gegnersuche mit unabhängigen Themenfeldern – 01.11.2026, lokal

Auf die letzten Nutzerpräzisierungen sind beim Suchen alle 15 Themenfelder anfangs gewählt. Jedes kann einzeln abgewählt werden. **„Alle Genres (gemischt)“ ist ein eigenständiges Feld neben den zwölf Einzelgenres, Schauspieler und Preise.** Es bleibt unabhängig angehakt, auch wenn einzelne eingeschränkte Genres abgewählt werden. Beispielsweise bedeutet Horror abwählen bei weiterhin gewähltem „Alle Genres (gemischt)“: kein reines Horrorduell, gemischte Duelle mit möglichen Horrorfragen bleiben erlaubt. Es gibt keinen zusätzlichen Schalter für eine andere Suchart und keinen zweiten Bestätigungsdialog.

Die Felder bezeichnen die zugelassenen **Duellarten**, keinen Ausschluss einzelner Fragen aus einem gemischten Duell. Eine leere Auswahl sperrt die Suchaktion. Ein Treffer zeigt sofort seinen eingefrorenen Themenbereich und startet die eigene Runde. Ohne Treffer erscheint ein Hinweis, ohne ein neues Duell anzulegen. Beim eigenen Vorlegen bleibt es bei genau einem gewählten Thema. Vorlegen und Suchen beeinflussen ihre Auswahl gegenseitig nicht.

Migration 20261101164913_duel_match_preferences.sql ergänzt den authentifizierten RPC quiz_duel_find(allowed_topics, request), die gemeinsame Zehn-Plätze-Prüfung und idempotente direkte Zuordnung unter Konto-/Duellsperre. Der Erstellungsaufruf legt grundsätzlich eine eigene Herausforderung an; die frühere implizite Annahme beim Erstellen entfällt. Dafür gibt es keine Kompatibilitätsoption oder zweite Erstellungsvariante. Auswahl und Suchanfragen enthalten keine fremden Einzelantworten; Selbstpaarung, private Einladungen, abgelaufene Herausforderungen und nicht zugelassene Themen sind vom Suchpool ausgeschlossen.

## Lernstand und Speicherung

Eigene bestätigte Antworten gehen in die vorhandene Lernhistorie ein: bei direkter Anzeige nach jeder Antwort, bei gesammelter Anzeige nach den eigenen zehn Fragen oder nach endgültigem Ende eines unvollständigen Duells, sobald Lösungen freigegeben sind. Maßgeblich ist die serverseitige Antwortzeit, nicht der Abruf. Ungespielte Fragen erzeugen keine Fehler. Teilrunden behalten Antwortlernen, erhalten aber keine Abschluss-XP. Eigene vollständige Zehnerrunden zählen als abgeschlossene Lernrunden, unabhängig vom Gegnerausfall. Der lokale Abschluss erfolgt nach der zehnten bestätigten Antwort; Rate-Markierungen werden vor der Antwort gewählt. Ein späterer Abruf übernimmt dieselbe vollständige Runde ebenfalls genau einmal.

Lokale Runden tragen `duel: { id, number }`, `solutionDisplay` und `ruleVersion: "duel-v1"`. Intern verwenden sie den vorhandenen Modus `ueben`; der bestehende Spielleistungsvergleich ordnet diese Lernrunden damit Freies Spiel zu. Vollständige Begegnungen zählen zusätzlich zur eigenen Duellrangliste gemäß dem Ergänzungsvertrag vom 10.10.2026. Teilimporte sind lokal als abgebrochen geführt und blockieren keine aktive Solorunde; der gemeinsame Serverzustand bleibt fortsetzbar.

Stabile Rundenschlüssel `duel-<Duell-ID>-<Runde>` und Ereignisschlüssel `<Rundenschlüssel>:<Wissensziel>` verhindern doppelte Lernereignisse und Abschluss-XP. Ein veralteter Duellsnapshot mit inzwischen geänderter lokaler Fragen-ID erhält eine eigene `DUEL-…`-ID mit Originalverweis in `metadata.duel_question_id`. Das Wissensziel bleibt erhalten; der lokale Katalog wird nicht überschrieben.

Der gemeinsame Spielzustand liegt in getrennten Supabase-Tabellen. Das persönliche Kontobackup enthält nur die eigene bestätigte Lernkopie. Der bestehende Revisionsschutz und ausdrücklich zu lösende Gerätekonflikte bleiben bestehen. Alle Duelltabellen haben RLS und keine direkten Rechte für Gäste oder Konten. Acht freigegebene RPCs prüfen bestätigte Identität und Zugehörigkeit; interne Funktionen sind nicht direkt ausführbar.

## Betrieb und Ausbau

Lokale Antwortoptimierung vom 03.10.2026: Bereits bestätigte Teilantworten aktualisieren das betroffene Wissen ohne vollständigen Karriere-Replay. Unveränderte Wiederholungen erzeugen keine erneute Ableitungsberechnung. Neue historische Fragenfassungen, Rate-Korrekturen und Abschlüsse werden weiterhin vollständig berücksichtigt. PostgreSQL `jsonb` kann Objektschlüssel anders anordnen: Der Snapshotvergleich prüft die Inhalte unabhängig von dieser Reihenfolge, erhält aber die Reihenfolge von Arrays und lehnt tatsächliche Inhaltsänderungen weiterhin ab. Identische Serverfragen erzeugen damit keine unnötige `DUEL-…`-Fassung und Katalogkopie. Die bestätigte Frage erhält einen unabhängigen historischen Snapshot; geprüfte Jahresalternativen bleiben erhalten. Der persönliche Fragenkatalog wird beim normalen Antwortimport wiederverwendet; neue Fassungen ersetzen ihn atomar. Die sichtbare Lösung wartet weiterhin auf die Serverbestätigung und erfolgreiche lokale Speicherung. Der [Prüfbericht](Pruefbericht.md) unterscheidet die lokale Verarbeitungszeit von der tatsächlichen Netzlaufzeit.

[Konten-Einrichtung](Konten-Einrichtung.md#asynchrone-filmduelle-eingerichtet-02102026) beschreibt Migration und Katalog. [Prüfbericht](Pruefbericht.md) trennt lokale SQL-/Browsertests von echter Dienstabnahme. Bestehende Kontokonfiguration und Site-ID werden weiterverwendet; Solo-/Gastspiel bleiben offline verfügbar.

Später möglich: eigene Revancheaktion mit gewechseltem Vorleger, Push und administrative Fristkorrektur. Themenwahl und unabhängiger Fortschritt nach Paarung sind lokal umgesetzt; die eigene Duellrangliste besteht bereits. Weitere Ablaufänderungen benötigen einen neuen Auftrag.

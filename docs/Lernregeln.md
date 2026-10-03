# Lern-, Runden- und Speichervertrag

## Aktuelle Auswahl und Ergebnisarchive – Version 46

Spielkacheln wählen eine Variante, schließen die Auswahl und zeigen den gewählten Modus auf der Startseite; erst „Losspielen“ startet. Zeitrekorde erlauben Königsklasse oder genau ein offizielles Filmgenre, immer 3 leicht / 4 mittel / 3 schwer und alle Filmgruppen. Lernfilter bleiben frei. Neue Rekordschlüssel unterscheiden keine Lösungsanzeige mehr; historische `.L`- und eigene Kategorien bleiben getrennt erhalten.

Fragen und Erklärungen erscheinen im unmittelbaren Ergebnisrückblick. Beim Verlassen oder späteren Laden wird die geschlossene Runde auf Antwortereignisse und minimale Wertungs-/Lernfakten verkürzt. Ergebnisse, Rekorde, XP, Lernstand und Freischaltungen bleiben unverändert. Aktive Runden sind vollständig wiederaufnehmbar; pausierte Duelle können weitere Antworten übernehmen. Spätere Fragenrückblicke entfallen. Das ersetzt die unten dokumentierte frühere Speicherung vollständiger historischer Rundensnapshots und großer `before`-Maps. IndexedDB-Version 3 und das logische Sicherungsschema 1 bleiben bestehen. [Führender Vertrag einschließlich Migration und Rückfallkopien](Rekordmodi-und-Zeitranglisten.md#ergebnisarchive-statt-späterer-fragenrückblicke).

## Neue Rekordmodi – 03.10.2026

Lokal im beauftragten Worktree umgesetzt: Gruppen Lernen/Auf Zeit/Duell, feste Zehnerrunde, Fehlerfrei und Zeitkonto (120 / +15 / −45). Jeder abgeschlossene Lauf wird einzeln nach Modus, Auswahl und deutschem Kalenderzeitraum gelistet. Endlosziele dürfen nach einem vollständigen Pooldurchgang erneut erscheinen; Laufpunkte, Antwortstatistik und begrenzte Lern-XP bleiben getrennt. Gemeinsame Soloergebnisse und vollständige Duellranglisten sind öffentlich, persönliche Duellhistorie privat. Die bisherigen Rekordmigrationen sind seit Version 43 live eingerichtet; die neue Ergebnisarchiv-Migration ist im oben verlinkten Vertrag dokumentiert. Der ergänzende Vertrag [Rekordmodi und Zeitranglisten](Rekordmodi-und-Zeitranglisten.md) hat für die neuen Modi Vorrang vor den unten dokumentierten historischen Rekordschlüsseln.

## Additive Fragenbereiche – 03.10.2026

**Filmfragen, Preisträger und Schauspieler sind drei unabhängig wählbare Bereiche.** Alle gewählten Bereiche bilden einen gemeinsamen Pool. Für die Mischung aus dem gesamten Bestand: alle drei Bereiche, alle Filmgenres und die gewünschten Stufen auswählen. Für reine Schauspielerfragen: nur Schauspieler auswählen. Ohne Filmfragen sind Filmgenres und Filmgruppen inaktiv; die gespeicherte Filmauswahl bleibt für die spätere Zuschaltung erhalten. Beim Zuschalten von Schauspieler oder Preisträger aus der Filmreise wechselt die App ins Freie Spiel; der Wechsel zurück zur Filmreise wählt Filmfragen.

Genres, Bekanntheitsgruppen sowie Classics/Arthouse begrenzen nur den Bereich Filmfragen. Classics und Arthouse sind weiterhin kuratierte Filmfilter, zusammen als Vereinigung. Preis- und Personenfragen werden zusätzlich aufgenommen, unabhängig von vorhandenen Filmmetadaten. Die manuell gewählten Schwierigkeitsstufen gelten für alle Bereiche. Der Gesamtpool umfasst 4.677 Filmfragen, 200 Preisfragen und 800 Personenfragen; alle drei zusammen ergeben 5.677 Fragen und 5.147 eindeutige Wissensziele. Freies Spiel zieht zufällig aus den eindeutigen Zielen; Varianten erhalten keine zusätzlichen Lose. Kein fester Anteil pro Fragenbereich und keine Garantie, dass in einer kurzen Runde jeder Bereich vorkommt. Rekordrunden behalten ihre bestehende Mischung nach Schwierigkeit und Filmgruppe; Fehlertraining seine offenen Fehler.

Die frühere Beschriftung „Nur Preisträger“/„Nur Schauspieler“ entfällt. Themenkarten starten weiterhin gezielt einen einzelnen Bereich; zusätzliche Bereiche lassen sich danach zuschalten. Filmgenre-Karten und ihre Themen-/Fortschrittszahlen zeigen den Filmfragenbereich. Inhaltsdaten, Frage-/Wissensziel-IDs, frühere Rundensnapshots und Lernstände werden nicht umgeschrieben.

Optionales `sources` in Rundenvorbereitung und Rundenfiltern verwendet `film`, `awards`, `actors`. Neue Rundenvorbereitungen wählen standardmäßig `film`; ein vorhandenes `sources: []` bleibt bewusst leer. Alte Kategorieauswahlen werden beim Lesen ohne Mutation in ihre bisherigen reinen/kuratierten Bereiche übersetzt. Historische Runden ohne `sources` behalten die bisherigen Auswahlregeln. Neue gemischte Themen heißen etwa `Filmfragen + Classics + Preisträger + Schauspieler`. In reinen Zusatzrunden werden irrelevante Genre-/Bekanntheitsfilter im Rundensnapshot weggelassen. JSON, IndexedDB und kompakte Kontosicherungen erhalten die Auswahl; Rekordschlüssel unterscheiden die Bereiche.

## Asynchrone Duelle und Lösungsanzeige

Seit 02.10.2026 lokal ergänzt: drei gemeinsame Zehnerrunden mit 30 Sekunden pro Frage, vier Spielblöcken und serverseitiger Wertung von einem Punkt pro Treffer. Eigenes Antwortlernen bleibt erhalten; eine komplett selbst gespielte Runde erhält normale Abschluss-XP, auch bei späterem Gegnerausfall. Duellpunkte sind keine Rekordpunkte. Der Server friert Fragen und Reihenfolgen ein und bewahrt die erste Startzeit auch bei Pause und Wiederaufnahme. [Vollständiger Duellvertrag](Asynchrone-Filmduelle.md).

`solutionDisplay: "question" | "round"` lässt sich für Solospiele unter **Profil → Optionen → Lösungen in Solospielen** wählen; seit 03.10.2026 steht die Wahl nicht mehr auf dem Spieleinstieg. Sie gilt für alle neuen Solorunden. Eine begonnene Runde behält ihren gespeicherten Wert, auch wenn die Option geändert wird. Für Duelle wird die gemeinsame Wahl beim Anlegen getroffen. Fehlend bedeutet bisheriges direktes Feedback. Bei gesammelter Anzeige erscheinen neutrale Bestätigung und eine Rate-Kennzeichnung vor der Antwort, Lösungen erst nach der eigenen Runde. Keine Trefferfarben, Antworttöne, laufenden Trefferwerte oder lösungsverratenden Zusatzansichten vorher. Timer und manuelle Weiter-Aktion bleiben erhalten. „Keine Ahnung“ hat dann ebenfalls erst im Rückblick eine Auflösung. Frühere Rekordregeln erhielten `.L` für gesammelte Anzeige und bleiben getrennt lesbar. Neue Rekorde ab Version 46 verwenden unabhängig von der Lösungsanzeige dieselbe Kategorie.

Duell-Lernereignisse werden nach serverseitiger Freigabe eigener Lösungen übernommen, bei direktem Feedback je Antwort, bei gesammeltem Feedback nach den eigenen zehn Fragen bzw. endgültigem Duellende. Ihre ursprünglichen Antwortzeiten und Wissensziele bleiben erhalten. Stabile IDs machen Wiederabruf und Gerätewechsel idempotent; Teilrunden werden lokal als abgebrochen geführt und erhalten keine Abschluss-XP. Lokaler Modus `ueben` plus Duellkennung, kein zusätzlicher Rekordmodus. Der vorhandene Spielleistungsvergleich zählt diese Lernrunden zu Freies Spiel. Migration und Katalog sind live eingerichtet, die App ist seit Version 36 veröffentlicht: [Einrichtung](Konten-Einrichtung.md#asynchrone-filmduelle-eingerichtet-02102026).

## Lernzustand pro Wissensziel

Fragenvarianten teilen die explizite `knowledge_id`. Eine feste Runde verwendet jedes Wissensziel höchstens einmal; in Endlosläufen gilt diese Grenze je vollständigem Pooldurchgang. Noch ungesehene Ziele besitzen keinen Lernzustand. Jede beantwortete oder abgelaufene Frage erzeugt ein Ereignis.

| Antwort | Wirkung |
| --- | --- |
| Erste sichere richtige Antwort | Stufe 1, „geübt“, nächste Wiederholung nach 24 Stunden. |
| Sichere fällige Antwort an neuem lokalem Kalendertag | Stufe um eins erhöhen, maximal 4; Abstände der Stufen: 1, 3, 7, 21 Tage. |
| Sichere Antwort am selben Tag oder vor Fälligkeit bei bestehender Stufe | Teilnahme zählen, Stufe und Termin nicht erhöhen. |
| Falsch, „Keine Ahnung“ oder Zeit abgelaufen | Aktuelle Stufe 0, „entdeckt“, Wiederholung nach zehn Minuten. |
| Richtige Antwort als geraten markiert | Punkte unverändert; Lernereignis mit demselben eindeutigen Schlüssel korrigieren, Fortschritt neu ableiten. Stufe 0, „entdeckt“, Wiederholung nach sechs Stunden. |

„Gefestigt“ erfordert Stufe 4, sichere stufenwirksame Antworten an mindestens vier verschiedenen Tagen und mindestens sieben Tage seit der vorherigen Antwort auf dieses Wissensziel. Auch eine frühe Zwischenantwort setzt diesen tatsächlichen Abstand neu an, ohne Stufe oder Fälligkeit zu erhöhen. Beispiel ohne Zwischenantwort: Tag 0 → Tag 1 → Tag 4 → Tag 11; nächste Wiederholung Tag 32. Eine zusätzliche Antwort an Tag 10 verhindert die Festigung an Tag 11; nach ausreichendem Abstand kann die nächste fällige Antwort festigen. Ein einzelner Treffer, eine gelesene Erklärung oder sofortiges Wiederholen reichen nicht.

Nach einem Fehler kann bereits eine neue sichere Antwort wieder „geübt“ ergeben; am gleichen Tag darf aber keine zweite Erhöhung stattfinden, wenn an diesem Tag bereits eine sichere Stufe erreicht wurde. Die Grenze verwendet lokale Kalendertage. Lernintervalle verwenden Millisekunden seit dem Ereignis. Diese konfigurierbare Startheuristik steht in `RULES` in `src/engine.ts` und ist keine validierte Wissensdiagnostik.

Eine einmal erreichte Festigung bleibt bei weiteren sicheren Antworten erhalten; erst falsch oder geraten setzt die aktuelle Stufe zurück. Frühe Zwischenantworten verhindern also eine erstmalige verfrühte Festigung, nehmen aber bestätigtes Wissen bei erneuter richtiger Antwort nicht zurück.

## Keine Ahnung als Antwortoption

Seit 02.10.2026 lokal umgesetzt: Unter den vier gemischten Antworten steht in allen Modi die zusätzliche Auswahl **Keine Ahnung**. Sie gehört nicht zum Frageninhalt und wird nicht mitgemischt. Nutzerziel ist, bewusstes Nichtwissen auszudrücken, ohne eine beliebige falsche Antwort als eigene Wahl zu sehen. Keine Änderung an CSV, Frageobjekten, Antwort-IDs oder Lösungsschlüsseln.

Die Auswahl erzeugt genau ein normales Fehlereignis mit `answerId: null`, `dontKnow: true`, `correct: false`, `guessed: false` und null Rekordpunkten. Lernstufe 0, zehn Minuten Fälligkeit, offene Fehler, Tagesgrenzen und die nur beim Abschluss vergebenen Karriere-XP verwenden ihre jeweiligen Fachregeln. In der Rekordrunde gilt die bestehende 30-Sekunden-Grenze weiter: eine verspätete Auswahl wird als Zeitablauf ohne `dontKnow` gespeichert. Nachträgliche Antwortwahl oder „War geraten“ machen daraus keinen Treffer.

Erst nach erfolgreichem lokalem Speichern zeigt die Oberfläche für 1,1 Sekunden nur die richtige Lösung mit zwei sanften Leuchteffekten und einem optionalen leisen Zweiklang. Falsche Antwortmöglichkeiten, Erklärung und Weiter-Aktion erscheinen in dieser Phase nicht. Danach folgen normale Erklärung, Merksatz und aufklappbare Antworten; keine falsche Möglichkeit ist als gewählt markiert. Bei reduzierten Animationen bleibt die Lösung ruhig hervorgehoben. Neuladen/Wiederaufnahme zeigt unmittelbar die normale gespeicherte Antwortansicht, ohne erneute Animation oder erneutes Ereignis.

Rundenauswertung zählt „Keine Ahnung“ unter falsch, mit sichtbarer Teilmenge; Zeitabläufe bleiben getrennt. Rückblick und Fortschrittsbeschriftung nennen die bewusste Auswahl. Fragenstatistik, Profilquote und Sammlung zählen sie als beantwortet und falsch. Das optionale Ereignisfeld bleibt in lokaler, JSON- und komprimierter Kontosicherung erhalten; widersprüchliche Markierungen werden abgewiesen. Ältere Sicherungen bleiben lesbar. Alte App-Tabs vor der Nutzung neuer Kontostände aktualisieren, damit sie die Kennzeichnung erhalten.

Für die gemeinsame Spielerquote liegt Migration `202610020002_dont_know_rankings.sql` bereit: explizite Nichtwissensantworten zählen als falsche Antworten einschließlich der 50-Antworten-Schwelle, Zeitabläufe weiterhin nicht. Rekordprojektion und Zugriffsrechte bleiben erhalten. Vor der nächsten Veröffentlichung einmal im bestehenden Supabase-Projekt anwenden; aktuell nur lokal geprüft.

## Auswahl und Runden

Die Hauptauswahl kombiniert mehrere Filmgenres und Schwierigkeitsstufen. Ein Genre stammt unverändert aus `metadata.subdomain`, ersatzweise aus `domain`; `Science-Fiction` wird als „Sci-Fi“ angezeigt. Innerhalb einer Gruppe gilt ODER, zwischen Genre und Stufe UND. Genres werden aus den vorhandenen Fragen abgeleitet. Classics und Arthouse schränken den Filmfragenbereich zusätzlich ein; Preisträger und Schauspieler ergänzen ihn unabhängig von Genres; keine neue Auswahl einzelner Filme/Reihen. Leere Auswahl liefert keine Runde. Die gewählten Genres werden nicht künstlich gleichverteilt; die bestehenden Lernregeln wählen aus dem passenden Gesamtbestand.

Neue Runden speichern `filters.genres`, `filters.difficulties` und `filters.familiarities` als sortierte, duplikatfreie Listen. Sicherungen behalten diese Felder und prüfen, dass die Rundensnapshots zur Auswahl passen. Alte Runden ohne `filters` verwenden weiterhin ihre bisherigen `topic`-/`difficulty`-Felder; keine Migration von Fragen oder Lernereignissen nötig.

Jede Frage zeigt standardmäßig ihr Genre sowie vor und nach der Antwort ihre eigene Schwierigkeit als Text („Leicht“, „Mittel“ oder „Schwer“) aus dem gespeicherten Fragensnapshot. Eine kombinierte Rundenauswahl ersetzt diese Einzelangabe nicht; Punkte und Lernregeln ändern sich dadurch nicht. `settings.showGenre` und `settings.showDifficulty` sind unabhängig gespeicherte optionale Booleans; bei fehlendem Feld gilt die Anzeige als eingeschaltet. Alte Sicherungen bleiben gültig.

Filmreise wählt zuerst tatsächlich unbearbeitete Wissensziele (noch kein Lernereignis, Varianten zählen gemeinsam). Bei genügend passenden neuen Zielen besteht die ganze Runde daraus. Zum Kennenlernen der höchsten tatsächlich freigeschalteten Stufe Mittel/Schwer werden bis zur Hälfte der Rundenplätze bevorzugt mit deren neuen Zielen belegt, solange in dieser Genre/Stufe weniger als fünf unterschiedliche Ziele bearbeitet wurden. Historische Bearbeitungen zählen; bloßes manuelles Freigeben aller Stufen erzeugt keine Lernpfad-Freischaltung. Genre-, Stufen- und Themenfilter gelten weiterhin. Mehrere Genres teilen sich dieses Kontingent; keine künstliche Gleichverteilung. Keine neue gespeicherte Einstellung.

Fehlen neue Ziele, werden bearbeitete Ziele außerhalb der drei zuletzt gestarteten Runden bevorzugt. Maßgeblich sind tatsächliche Antwort-/Zeitablaufereignisse, nicht bloß ungespielte Fragen im Rundensnapshot. Fällige Ziele zuerst, dann übrige; innerhalb der Gruppen ältere letzte Bearbeitung vor jüngerer, bei Gleichstand seltenere vor häufigerer. Ziele aus den letzten drei Runden dienen erst als Ersatz, wenn sonst Plätze frei bleiben. Damit sind kleine Themen weiterhin spielbar. Höchstens fünf fällige Wiederholungen pro Runde; ausschließlich fälliger Bestand führt weiterhin zu kürzeren Runden. In jeder Runde bleibt jedes Wissensziel eindeutig; keine Wiederholung zum Auffüllen. Startvorschau und tatsächlicher Start verwenden denselben Auswahlkontext.

Freies Spiel ersetzt Besser werden und zieht Ziele zufällig ohne Lernstandsgewichtung. Rekordrunden mischen die gewählten Schwierigkeit-/Bekanntheitsgruppen möglichst gleichmäßig und ziehen innerhalb dieser Gruppen zufällig. Beide Modi sind unabhängig von Freischaltungen. Bekanntheitsfilter und tatsächliche Mischung gehören zur neuen Vergleichsregel; historische Rekorde bleiben separat. Details unter [Spielmodi und Bekanntheit](Spielmodi-und-Bekanntheit.md).

Die erste abgeschlossene Runde wird mit bis zu fünf Fragen vorbereitet, spätere mit bis zu zehn. Vorab steht die tatsächliche Größe fest. Nach einer Pause startet keine automatische Wiederholungswelle. Entspannte Runden dürfen über Startseite, Neuladen oder Browserneustart fortgesetzt werden; beim Wiederaufnehmen erscheint gegebenenfalls die zuletzt gespeicherte Erklärung.

## Fehlertraining und Rundenauswertung

Seit 02.10.2026 ergänzt `fehler` die drei bisherigen Modi. Offene Fehler werden ohne neue gespeicherte Zähler aus der chronologischen Ereignishistorie je Wissensziel abgeleitet: falsch/abgelaufen aufnehmen, sicher richtig entfernen, geraten richtig erhält nur einen schon vorhandenen Fehler. Ereignisse aller Modi und Rundenstatus zählen. Nach einer sicheren Antwort beginnt ein späterer Fehler eine neue offene Fehlerfolge.

Fehlertraining wählt ausschließlich solche offenen Ziele innerhalb der gewählten Genres, Schwierigkeiten, Filmgruppen und Kategorien. Häufigere Fehler seit der letzten sicheren Antwort zuerst, bei Gleichstand jüngster Fehler zuerst, weitere Gleichstände zufällig. Die zuletzt falsch beantwortete konkrete Frage wird bevorzugt; passt sie nicht zur Auswahl, darf eine passende Variante desselben Ziels verwendet werden. Je Ziel ein Platz, erste Runde bis fünf, danach bis zehn; weniger offene Fehler ergeben kürzere Runden. Kein Auffüllen mit ungespielten oder sicheren Fragen. Startvorschau und Rundenstart verwenden denselben Ereigniskontext.

Die Zehn-Minuten-Fälligkeit muss für dieses bewusst gestartete Training nicht abgewartet werden. Die bestehenden Lernintervalle, Tagesgrenzen, „War geraten“-Korrektur, Freischaltungen gelten weiter; Karriere-XP werden nach den Antwort-/Lernleistungen dieser abgeschlossenen Runde vergeben. Sofort sicher gelöst bedeutet nicht langfristig gefestigt. Fehlerrunden sind entspannte, offline fortsetzbare Runden mit den üblichen Snapshots und Antwortreihenfolgen; keine Rekordpunkte.

Die Ergebnisansicht zeigt Trefferquote (richtige Antworten einschließlich geratener Treffer / tatsächliche Fragenzahl), Antwortfolge, falsche Antworten, Zeitabläufe ohne Wahl, geratene Treffer und die längste Folge sicherer richtiger Antworten. Dazu neu kennengelernte Ziele (vor der Runde noch ohne Lernstand), in dieser Runde sicher gelöste frühere Fehler, neu geübte/gefestigte Ziele, damalige Freischaltungen und Treffer je Genre. Historische Zahlen beziehen sich auf den Rundensnapshot, seine Ereignisse und die vorherigen Runden; spätere Trainings ändern sie nicht.

„Fehler dieser Runde üben“ startet unmittelbar eine neue Fehlerrunde mit den ursprünglichen Filtern und ausschließlich den aktuell noch offenen Fehlzielen der betrachteten abgeschlossenen Runde. Schon später sicher gelöste Ziele entfallen. Eine andere aktive Runde verhindert diesen Start mit Hinweis. Ohne verfügbare Fehler wird keine leere Runde erzeugt. Rückblickfilter „Alle“, „Fehler“ (einschließlich Zeitablauf) und „Geraten“ zeigen gezielt passende Erklärungen; bei Fehlern auch die damalige gewählte Antwort. Die Filter sind flüchtiger UI-Zustand.

## Rekorde und Zeit

Zeitbasis: Maximum aus verstrichener `performance.now()`-Zeit und verstrichener `Date.now()`-Zeit. Die monotone Uhr schützt vor zurückgestellter Systemzeit, die Wandzeit erfasst Suspend-/Hintergrundzeit auch bei pausierter monotoner Uhr. Vorstellen der Systemuhr kann eine Trainingsfrage vorzeitig beenden; lokale Rekorde sind nicht manipulationssicher und kein Wettbewerb.

Start nach zwei Animationsframes mit gerenderter und bedienbarer Frage. UI-Intervalle aktualisieren nur die Anzeige; jede Antwort prüft die tatsächlich verstrichene Zeit erneut. Ab 30.000 ms gilt die Frage als abgelaufen. Erklärungen haben keine Uhr. Beim Hintergrundwechsel wird nichts pausiert; Rückkehr aktualisiert sofort. Rekordrunden werden nach Neuladen oder erneutem App-Start abgebrochen, gespeicherte Antworten bleiben als Lernereignisse erhalten, es gibt keine Abschluss-XP oder Rekorde dafür.

Punkte: richtig und innerhalb der Zeit = 100 + 2 × floor((30.000 − vergangene ms) / 1.000). Falsch/abgelaufen = 0. Rekordschlüssel: Thema, Schwierigkeit, tatsächliche Rundengröße, Regelversion. Antwortreihenfolge wird einmal pro Runde gespeichert; Lösung und Feedback bleiben über Antwort-IDs verbunden.

Für neue Runden beginnt der Rekordschlüssel mit `genres-v1`, gefolgt von der kanonischen Genre-/Stufenkombination, optionalem Einzelthema, Rundengröße und Regelversion. Die Klickreihenfolge ändert die Kategorie nicht. Neue Kategorien werden getrennt von den unveränderten historischen Rekordschlüsseln geführt.

## Persönliche Bestenliste (aktualisiert 03.10.2026)

Highscores startet mit Rekordspiele → Meine Läufe. Alle abgeschlossenen Einzelergebnisse stehen sichtbar in ihren Vergleichskategorien; Modus, Zeitraum und Kategorie sind auswählbar. Weitere Bereiche sind Duelle und Karriere. Gemeinsame Rekordläufe sind öffentlich; Filter für Karriereleistungen bleiben bei Anmeldung erreichbar. Die genauen neuen Auswahl- und Rangregeln stehen in [Rekordmodi und Zeitranglisten](Rekordmodi-und-Zeitranglisten.md).

Aus sämtlichen abgeschlossenen Rekordrunden und ihren Antwortereignissen abgeleitet, ohne neue Datenablage oder Migration. Aktive, abgebrochene und entspannte Runden zählen nicht. Jede bestehende `recordKey`-Kategorie hat eine eigene Rangliste: Genre-/Stufenkombination, optionales Filmthema, tatsächliche Fragenzahl und Regelversion. Historische Themenkategorien bleiben separat. Die Genre-Auswahl filtert exakt die gespielte Kombination; „Alle Genre-Kombinationen“ zeigt alle Kategorien getrennt, nicht eine vermischte Gesamtwertung.

Absteigend nach Gesamtpunkten; gleiche Punktzahl ergibt denselben Rang (1, 1, 3). Bei Gleichstand steht das früher abgeschlossene Spiel zuerst. Antwortzeit summiert ausschließlich `elapsedMs` der Antworten, ohne Lesezeit der Erklärungen; sie ist kein zusätzlicher Rangentscheid. Sichtbar sind Punkte, richtige Antworten, Rundengröße, Antwortzeit, Abschlussdatum und Rundenrückblick. Filter ändern die Kategorie-Ränge nicht. Vorhandene abgeschlossene Spiele erscheinen automatisch und werden mit der JSON-Sicherung erhalten. Die Liste ist persönlich und Bestandteil des jeweiligen Gast- oder Kontostands; die getrennte gemeinsame Trainingsrangliste ist unter [Konten und Spielstände](Konten-und-Spielstaende.md) beschrieben. Bestätigte Konten nehmen automatisch teil; die Spielabläufe bleiben browserbasiert.

## Erfahrung und Abzeichen

Genre-Icons illustrieren die Auswahl, sind keine erworbenen Abzeichen. Das bestehende Sci-Fi-Abzeichen wird mit einem Schloss vor Erwerb und einer Medaille mit Stern nach Erwerb dargestellt. Es gibt noch keine eigenen Action-/Horror-/Fantasy-Abzeichen; die bisherigen Vergaberegeln bleiben unverändert.

Seit 02.10.2026 lokal: Filmkarriere statt pauschaler Runden-XP. Beantwortete Frage +1 XP; sichere richtige Antwort zusätzlich +2/+3/+5/+5 für leicht/mittel/schwer/experte. Antwort- und Treffer-XP jeweils einmal je Wissensziel und lokalem Kalendertag, über alle Modi und Varianten. Erstmals sicher gelöst +2, ersten offenen Fehler sicher korrigiert +4, erstmals gefestigt +8, jeweils einmal je Wissensziel. Nur abgeschlossene Runden vergeben XP; Zeitabläufe keine Antwort-XP, geratene Treffer keine sicheren Treffer-XP. Mehrfacher Abschluss und Wiederherstellung zahlen nicht erneut.

Aufstieg von Level L auf L + 1: `100 + 50 × (L − 1)` XP. Eintrittsschwelle Level L: `25 × (L − 1) × (L + 2)`. Titel ab Level 1/5/10/20/35: Kinogänger, Filmfan, Cineast, Filmchronist, Filmlegende. Bestehende Level und ihr Teilfortschritt werden bei Bedarf mit einmaliger Startgutschrift erhalten; die historische Antwortfolge wird neu ausgewertet. Karriere-XP verändern weder Rekordpunkte noch Genre-Abzeichen oder Filmreise-Freischaltungen. Vollständige Regeln, Anzeige, Altstände und Ranglistenvertrag unter [Filmkarriere und XP](Filmkarriere-und-XP.md).

Die Auszeichnung **„Sci-Fi – 10 leichte Wissensziele gefestigt“** wird nur bei mindestens zehn geeigneten Zielen angeboten. Geeignet sind im gelieferten Bestand `domain=Film`, `subdomain=Science-Fiction`, `difficulty=leicht`; es existieren 50 unterschiedliche Ziele. Vergabe erst beim Rundenabschluss nach einer möglichen „War geraten“-Korrektur. Die Auszeichnung bleibt nach Erwerb bestehen, auch bei neuen Inhalten oder späteren Fehlern. Die Favoritenfunktion ist entfernt. Das historische Feld `favorites` bleibt ausschließlich zur Sicherungskompatibilität erhalten.

## Datenintegrität und Sicherung

IndexedDB-Datenbank `wissensquiz`, Datenbankversion 2, Store `state`, Gastschlüssel `current`; das logische Spielstand-/JSON-Schema bleibt 1. Optionale Konten verwenden `account:<Supabase-Host>:<Benutzer-ID>` im selben Store. Der Fragenkatalog liegt getrennt unter `catalog:<Spielstandschlüssel>` und wird beim Lesen verlustfrei rekonstruiert. Fortschritt und Katalogänderungen werden gemeinsam atomar gespeichert; ein unveränderter Katalog wird nicht erneut geschrieben. Alte Vollstände werden bei erfolgreichem Speichern überführt. Der logische Zustand enthält weiterhin Fragen inklusive Themen-/Wissenszielzuordnung, Inhaltsversionen, Runden mit vollständigen Fragensnapshots und Antwortreihenfolge, Ereignisse, Lernstände, Termine, XP, Rekorde, Abzeichen, historische Favoritenwerte, Einstellungen, Importberichte und lokale Meldungen. Neue Solorunden speichern in `before` nur vorhandene Lernstände ihrer höchstens zehn Wissensziele; alte Rundensnapshots bleiben erhalten. [Speicherlayout, Messungen und Prüfung](Fragedaten-Organisation.md).

Jede Änderung liest den aktuellen Spielstand innerhalb einer einzigen Readwrite-Transaktion. Die Veröffentlichung führt die Antwortoptimierung mit dem bereits veröffentlichten kompakten Speicherlayout zusammen: Datenbankversion 2 und catalog:<Spielstandschlüssel> mit json-field-refs-v1 bleiben erhalten. Der Katalogverweis erhält eine optionale Revision. Antworten und Rate-Markierungen verwenden bei passender Revision den vollständig schreibgeschützten Katalog im Speicher; eine kleine Schlüsselabfrage bestätigt seine Existenz, ohne die große JSON-Zeichenfolge zu übertragen. Import, Wiederherstellung und ältere Clients ohne Revision lesen und vergleichen weiterhin den vollständigen Katalog. Inhaltsänderungen schreiben Katalog und neuen Revisionsverweis atomar. Gleiche historische Fragensnapshots teilen intern ein Objekt mit vollständigem Inhalt. read, JSON-Export und Online-Sicherung liefern weiterhin Schema 1 mit vollständigen Fragen; Gast und Konten bleiben getrennt. Fehlende Katalogdaten brechen den Vorgang ab.

Antwort-ID = Runden-ID + Wissensziel-ID. Eine Frage akzeptiert nur die erste Antwort an der erwarteten Rundenposition. Transaktionsabbruch hinterlässt keinen Teilstand; Feedback und Antwortsignale erscheinen weiterhin erst nach erfolgreichem lokalen Speichern. Neue chronologische Antworten aktualisieren nur das betroffene Wissensziel. XP, Rekorde und Filmreise-Rechte ändern sich erst mit abgeschlossenen Runden. Rundenabschluss, Startvalidierung, Sicherungsprüfung und rückdatierte Ereignisse berechnen die Historie vollständig neu; ältere Rate-Markierungen berücksichtigen spätere Ereignisse. Die nächste Rundenauswahl wird nur auf der Startseite berechnet. Fachliche Lern-, Zeit- und Wertungsregeln bleiben erhalten.

JSON-Wiederimport prüft Schema, Grenzen, eindeutige IDs, Antwortreihenfolge, Fragensnapshots, Ereigniszuordnungen und Punkte. Abgeleitete Werte werden neu berechnet. Bestehende Abzeichen bleiben Bestandteil der Sicherung; diese ist kein manipulationssicherer Leistungsnachweis. Import ersetzt den Stand erst nach ausdrücklicher Bestätigung. Aktive Rekordrunden werden dabei abgebrochen. Reset verlangt die Texteingabe `LÖSCHEN` und löscht Fortschritt, nicht den Fragenbestand.

Browserdaten sind nicht Teil des Git-Repositories. Backup: JSON über Einstellungen herunterladen, nach wichtigen Sitzungen und vor Browser-/Adresswechseln erneut exportieren, mindestens die letzten drei Sicherungen an einem selbst gewählten sicheren Ort behalten. Wiederherstellung im Browser aus diesem JSON; der vollständige Export-/Importweg und Browserneustart wurden in isolierten Testprofilen geprüft. Aktivierte Konten laden bei Anmeldung/Neuladen und sichern lokale Änderungen automatisch. Gastdaten bleiben ausschließlich auf diesem Gerät. Ein Synchronisierungsbeleg unter `sync:<Kontoschlüssel>` speichert bestätigte Revision und Inhaltsfingerabdruck; fehlgeschlagene Uploads werden wiederholt, konkurrierende Änderungen stoppen ohne Überschreiben. Web Locks begrenzen aktive Kontofenster pro Browser; siehe [Konten und Spielstände](Konten-und-Spielstaende.md). Ein paralleles Fenster kann eine Rekordrunde beim Start abbrechen; für Spielrunden nur ein App-Fenster verwenden.

## Akustisches und haptisches Feedback

Soundeffekte sind standardmäßig eingeschaltet, werden aber erst durch eine Spielaktion bzw. das Probesignal freigegeben. Keine Wiedergabe beim Laden oder bloßen Wiederanzeigen gespeicherter Antworten. Kurze synthetische Töne mit sanfter Lautstärkehüllkurve unterscheiden Start, nächste Frage, richtige/falsche Antwort, Zeitablauf, Abschluss und neu erworbenes Abzeichen. Signale bestätigen gespeicherte Antworten/Abschlüsse; Fehler der Audioausgabe beeinflussen den Speicherablauf nicht. Keine Hintergrundmusik, keine externen Audiodateien.

`settings.sound` und `settings.haptics` sind optionale, abwärtskompatible Sicherungsfelder. Ohne Werte gilt Ton an, Vibration aus. Ton und Vibration gesammelt unter Optionen → Ton & Vibration änderbar. Vibration ist ein optionales Zusatzsignal für unterstützte Geräte/Browser. Sichtbares Feedback bleibt erhalten; in ausgeblendeten Tabs werden keine neuen Signale abgespielt. Stummschalten stoppt laufende Töne. Technische Grundlagen: [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [Vibration](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).

## Offline und Updates

Build erzeugt eine versionierte Precache-Liste aus der tatsächlich gebauten Oberfläche, Icons und CSV-Paketen. Eine Online-Anzeige allein bedeutet nicht Offline-Verfügbarkeit: Der Paketstatus wird beim aktiven Service Worker anhand aller Cache-Einträge abgefragt. IndexedDB enthält die importierten Lerninhalte.

Neue Worker verwenden kein `skipWaiting`. Neue Versionen warten auf das Schließen der alten App-Fenster. Cache-Bereinigung erfolgt erst bei Aktivierung. Fortschritt bleibt in IndexedDB. Nur statische gleichartige Same-Origin-Dateien werden mit `ignoreVary` aus dem Precache gelesen, damit der Vorschau-Header `Vary: Origin` Modulskripte offline nicht blockiert.

HTTPS oder localhost erforderlich. Die HTTP-Heimnetzadresse ist zum Onlinespielen geeignet, aber nicht zur PWA-Installation. Quellenlinks sind extern und werden nicht offline heruntergeladen.

## Profilstatistik

Alle Zahlen werden aus dem aktuellen Kontospielstand abgeleitet; bestehende Runden zählen mit. „Runden gespielt“ umfasst auch aktive und abgebrochene Runden, „Runden abgeschlossen“ nur abgeschlossene Runden aller Modi. „Fragen beantwortet“ zählt Ereignisse mit gewählter Antwort; reine Zeitabläufe ohne Antwort zählen nicht. Trefferquote = richtige gewählte Antworten / alle gewählten Antworten, auf ganze Prozent gerundet; ohne Antworten wird keine Quote behauptet. „Rekordrunden abgeschlossen“ zählt abgeschlossene Rekordrunden, „Wissensziele gefestigt“ den aktuellen Lernstatus. Keine neue Speicherung oder Veränderung historischer Ereignisse.

## Filmreise und freie Auswahl

Die Filmreise öffnet je Genre Schwierigkeiten und vier Bekanntheitsgruppen. Feste 60-Prozent-Ziele, Einstiegsgruppen, Bestandsrechte und Speicherung sind im [Fachvertrag](Spielmodi-und-Bekanntheit.md) beschrieben. Die globale Einstellung `allDifficulties` und das alte `learningPath` bleiben nur für Sicherungskompatibilität lesbar. Die aktuelle Moduswahl bestimmt die freie oder fortschrittsgebundene Auswahl. Sichere Antworten abgeschlossener Runden aus allen Modi zählen mit; Wiederholungen und geratene Treffer zählen nicht zusätzlich. Erworbene Rechte bleiben erhalten.

## Gemeinsame Spielerranglisten

Zusätzlich zu einzelnen Rekordrunden: meiste abgeschlossene Runden, meiste richtige Antworten und beste Trefferquote. Alle vier Spielmodi zählen, ausschließlich abgeschlossene Runden; Fehlertraining seit der am 02.10.2026 lokal geprüften und live angewendeten Migration `202610020001_error_training_rankings.sql` enthalten. Filter: einzelnes Genre oder alle Genres, einzelne Schwierigkeit oder alle Stufen. Bei gemischten Runden zählen nur passende Fragen, die Runde einmal. Richtige Antworten umfassen auch Wiederholungen und nachträglich als geraten markierte Treffer; diese Leistungslisten verwenden nicht die strengere Lernpfaddefinition.

Trefferquote = richtige gewählte Antworten / alle gewählten Antworten; Zeitabläufe ohne Wahl zählen nicht. Mindestumfang für die Quotenrangliste: 50 Antworten innerhalb der ausgewählten Vergleichsgruppe. Anzeige mit einer Nachkommastelle und immer zusammen mit Runden-/Antwortanzahlen; Rang nach ungerundeter Quote. Gleiche Werte teilen den Rang, stabile Reihenfolge nach Name und internem Eigentümer, 50 Spieler pro Seite. Inaktivität, abgebrochene Runden und reine Anmeldungen ergeben keine Rundenpunkte. Keine zusätzliche E-Mail-/Identitätsfreigabe.

## Filmtitel und Genreillustrationen

Die Fragenansicht hebt den ersten exakt zitierten deutschen oder originalen Filmtitel aus den Metadaten farbig hinterlegt hervor. Nur seine umschließenden Anführungszeichen entfallen in der Anzeige; Jahr, restlicher Fragetext, Rohquelle, Frage-ID und gespeicherte Snapshots bleiben unverändert. Unbekannte Zitate und Fragen ohne passende Metadaten bleiben unverändert. Alle 1.260 gelieferten Fragen enthalten einen passenden Titel. Der Text bleibt inline umbrechbar; keine zusätzliche Titelzeile.

Große Genrekarten verwenden sieben dekorative PNG-Illustrationen mit echter Transparenz, Textnamen bleiben zugänglich. Kleine Auswahlfelder und filmbezogene Karten verwenden dieselben Genreillustrationen; Themen mit mehreren Genres zeigen mehrere Motive. Unbekannte Genres behalten die SVG-Darstellung. Motive und Herkunft: [Genreillustrationen](Genreillustrationen.md). Alle Motive gehören zum Offline-Paket.


## Freischaltfeier

Eine tatsächlich neue Mittel-/Schwer-Freischaltung beim erfolgreichen Speichern des Rundenabschlusses öffnet eine eigene Feier: aufspringendes Schloss, drei kurze Feuerwerksfolgen, große Genre-/Stufenanzeige, einmalige Fanfare und optionale Vibration. Der Vorher-/Nachher-Vergleich findet innerhalb derselben Speichertransaktion statt. Auch Antworten bei freier Schwierigkeitsauswahl können den Erfolg auslösen; mehrere neue Stufen erscheinen gemeinsam.

Die Feier ist flüchtiger UI-Zustand, kein neues Spielstandfeld. Ein alter Rundenrückblick, Neuladen oder das reine Laden eines Online-Spielstands löst sie nicht aus. Der vorhandene Ergebnishinweis bleibt nachlesbar. Die Animation endet nach knapp drei Sekunden; der Erfolg bleibt sichtbar, bis „Weiter zum Ergebnis“ oder Escape gewählt wird. Der Dialog hält den Tastaturfokus und gibt ihn an das Ergebnis zurück.

Die achtteilige Fanfare ersetzt das normale Abschlusssignal. Ton aus bleibt stumm, Vibration wird nur bei eingeschalteter Option angefordert. Die Betriebssystem-/Browsereinstellung für reduzierte Bewegung ersetzt Raketen, Partikel und Schlossanimation durch eine ruhende Auszeichnung. Keine externen Audio-, Bild- oder Animationsdienste; funktioniert mit dem Offline-Paket. Unveränderte Freischaltbedingungen: sichere unterschiedliche Ziele aus abgeschlossenen Runden, keine geratenen Treffer.

## Sammlungsfilter und Vibrationspräferenz

Der Sammlungsfilter „Mit beantworteten Fragen“ zeigt nur Themen mit mindestens einem Antwortereignis mit gewählter Antwort. Richtig, falsch und geraten zählen, auch in aktiven oder abgebrochenen Runden. Reine Zeitabläufe ohne Antwort zählen nicht. Die Zuordnung erfolgt über Wissensziel-IDs zu den vorhandenen Themen; historische Varianten bleiben berücksichtigt. Standard ist „Alle“; der Filter bleibt beim Seitenwechsel innerhalb der App erhalten, wird aber nicht im Spielstand gespeichert. Keine Änderung an Lernereignissen oder Fortschritt.

Die Vibrationspräferenz ist unabhängig von der aktuellen Browserunterstützung einstellbar. Der Schalter ist nur während einer laufenden Speicheraktion gesperrt. Die Einstellung verwendet weiterhin settings.haptics und die vorhandene lokale/automatische Kontosicherung, ohne Migration. Fehlende Vibration-API, abgelehnte Ausgabe (false/Exception) und erfolgreich angefordertes Signal werden unterschieden. Ein akzeptierter API-Aufruf beweist keine physisch spürbare Vibration.


## Spieleinstieg und Zusatzkategorie Classics

Manuelle Stufen- und Bekanntheitsauswahl gelten im Freien Spiel und in der Rekordrunde. Filmreise verwendet alle freigeschalteten Bereiche je Genre; zuvor manuell abgewählte Bereiche blockieren sie nicht. Die aufklappbare Fortschrittsübersicht zeigt beide Dimensionen und erreichbare Ziele je Genre.

Classics überschneidet sich mit Genres. Wissensziel-ID und Lernereignisse sind gemeinsam, Fortschritt und Wiederholungsplanung werden nicht dupliziert. Klassifizierungen verändern keine alten Rundensnapshots. Details zur Referenzprüfung und rückwärtskompatiblen Sicherung unter Importformat → Classics.


## Statistik zur einzelnen Frage

In Filmreise und Freiem Spiel steht unter dem Fragetext eine kompakte, aufklappbare Statistik: Anzahl beantwortet, richtig und falsch für die konkrete Frage-ID. Standardmäßig erscheint sie erst nach erfolgreichem Speichern der Antwort und enthält dann das aktuelle Ergebnis. Unter Profil → Optionen → „Fragenstatistik im Lernmodus“ sind „Nach der Antwort“, „Immer anzeigen“ und „Ausblenden“ wählbar. Die optionale Einstellung settings.questionHistory erlaubt after/always/hidden; fehlt sie in älteren Spielständen, gilt after. Sie wird über die vorhandene lokale und automatische Kontosicherung sowie JSON-Backups erhalten. In Rekordrunden wird diese Anzeige nicht eingeblendet.

Die Bilanz wird rein lesend aus vorhandenen Antwortereignissen abgeleitet, über sämtliche Spielmodi und Rundenstatus. Antworten aus aktiven oder abgebrochenen Runden zählen mit. Eine gewählte Antwort erhöht beantwortet und entweder richtig oder falsch. Zeitabläufe ohne Antwort zählen separat als ohne Antwort. Richtige geratene Treffer bleiben statistisch richtig; ihre Anzahl wird in der Detailansicht ausgewiesen, ohne die strengeren Lernregeln zu ändern.

Die aufgeklappte Ansicht zeigt außerdem die gemeinsame Bilanz aller Formulierungen/Varianten desselben Wissensziels nach knowledgeId. Auch historische, nicht mehr im aktuellen Fragenbestand befindliche Varianten werden über ihre gespeicherten Ereignisse berücksichtigt. Genre-/Classics-Wechsel erzeugen keinen zweiten Zähler. „Keine Ahnung“ zählt als beantwortet/falsch; ohne Antwort bedeutet weiterhin Zeitablauf. Nur angezeigte Fragen ohne gespeicherte Antwort bzw. Zeitablauf lassen sich aus dem bisherigen Verlauf nicht verlässlich zählen und erhöhen diese Statistik nicht. Neuladen zählt nicht erneut.

Keine neuen Statistikzähler, keine Migration und keine Änderung an Lernfortschritt oder Ereignissen. Die vorhandene lokale/automatische Kontosicherung und JSON-Sicherung enthalten bereits die benötigte Historie. Der allgemeine Ruhehinweis unter den Lernantworten entfällt zugunsten der kompakten Statistik; mobile Weiter-Aktion bleibt fest erreichbar.

## Arthouse und gemeinsame Kategorienauswahl

Classics und Arthouse sind unabhängig wählbare kuratierte Filmfilter innerhalb der ausgewählten Genres. Preisträger und Schauspieler sind additive Fragenbereiche. Mehrere gewählt bedeuten eine Vereinigung (ODER), keine Schnittmenge. Die Rundenkategorie wird kanonisch als Classics + Arthouse und optional mit „: Film/Reihe“ gespeichert; frühere Classics-Runden bleiben gültig. Globale Summen, Auswahl und Fortschritt bleiben nach Frage-/Wissensziel-ID eindeutig. RomCom und Rom-Com werden beim neuen Import zum Genre Rom-Com zusammengeführt, Quellwert bleibt erhalten. Details und vollständige Zahlen im Importvertrag.

## Jahresfragen, Regie und Filmdaten (26.09.2026)

Neue Jahres- und Regiefragen verwenden die normalen Genre-, Stufen-, Lern- und Punkteregeln. Wechselnde falsche Jahresantworten werden nur beim Rundenstart erzeugt und als vollständiger Snapshot gespeichert; Lernidentität und Statistiken bleiben dieselben. Nach der Antwort bietet Filmdaten die geprüften Eckdaten des Films in einem zunächst geschlossenen Abschnitt. [Vertrag und Quellen](Filmwissen-und-Filmdaten.md).

Fragenfortschritt: Grün mit Häkchen bedeutet richtig, Rot mit Kreuz falsch; ohne Antwort erscheint ein roter Strich. Offene Fragen sind grau, die aktuelle Frage zusätzlich deutlich umrandet und vor der Antwort mit Punkt markiert. Zugängliche Beschriftungen nennen Nummer und Status, damit Farbe nicht die einzige Unterscheidung ist.


## Gespeicherte Rundenvorbereitung (27.09.2026)

Optionales `settings.roundSetup`: `mode`, `genres` (null = alle einschließlich späterer Imports, [] = keine), `categories` (Classics/Arthouse/Preisträger/Schauspieler) und `difficulties`. Defaults für fehlende Rundenvorbereitung: entdecken, alle Genres, keine Zusatzkategorie, alle vier manuellen Stufen. Bereits gespeicherte Dreistufen-Auswahlen bleiben erhalten; Experte kann ausdrücklich zugeschaltet werden. Nicht mehr vorhandene Genres werden bei der Anzeige entfernt; fallen alle früher gewählten Genres weg, gilt wieder alle. Eine absichtlich leere Auswahl bleibt leer. Keine einzelne Film-/Reihenauswahl in neuen Runden; historische Rundensnapshots und Themenfilter bleiben lesbar und fortsetzbar.

Auswahländerungen werden transaktional gespeichert; die Oberfläche zeigt die Wahl sofort, Kontosynchronisierung erhält ausschließlich bestätigte Speicherstände. Speicherfehler nehmen die vorläufige Auswahl zurück und zeigen den vorhandenen Fehlerhinweis. Die Filmreise ignoriert manuelle Stufen-/Bekanntheitsfilter, erhält sie aber für den späteren Wechsel zurück. JSON- und Kontosicherungsvalidierung erhalten das optionale Objekt; Lernereignisse und IDs ändern sich nicht.


Online-Sicherungen verwenden zusätzlich eine verlustfreie Kompaktkodierung des Fragenkatalogs und versionsgebundene Rundenverweise. Nach dem Lesen entsteht derselbe vollständige Zustand; die bisherigen Sicherungs-, Lern- und Ranglistenregeln gelten unverändert. Der JSON-Export behält das vollständige Format. IndexedDB verwendet seit 03.10.2026 das [getrennte lokale Kataloglayout](Fragedaten-Organisation.md). Details zur Onlinekodierung und ihrer Größenmessung unter [Konten und Spielstände](Konten-und-Spielstaende.md#kompakte-online-sicherung-27092026).


## Antwortsignale (27.09.2026)

Richtig: heller aufsteigender Sinus-Zweiklang (659 → 880 Hz), insgesamt 250 ms. Falsch: tiefer absteigender Dreieck-Zweiklang (277 → 196 Hz), insgesamt 265 ms, geringerer Spitzenpegel. Beide weich ein- und ausgeblendet; keine laute Fehlersirene. Die vorhandene Soundoption, Offlinefähigkeit und Wiedergabe erst nach gespeicherter Antwort bleiben erhalten. Start, Weiter, Zeitablauf, Abschluss, Freischaltungen und Vibration unverändert. Der wahrgenommene Pegel hängt weiterhin von Gerät und Systemlautstärke ab.


## Preisträger und Experte (02.10.2026)

200 neue Fragen mit je 50 Zielen pro Schwierigkeit. Experte ist im Freien Spiel, in Rekordrunden und für offene Fehler frei auswählbar. Filmfragen behalten Leicht/Mittel/Schwer und ihre festen Freischaltziele; der unabhängige Preisträgerbereich entwickelt sich mit eigenen Zählern bis Experte. Sichere Expertenantworten bringen zusätzlich fünf Karriere-XP. Speicherung und Kategorievereinigung erhalten historische Ereignisse, Runden und verdiente Rechte. [Inhalts- und Quellenvertrag](Preistraeger.md).


## Personenkategorie Schauspieler

Seit 03.10.2026 stehen 800 Fragen zu 100 Personen in Filmreise, Freiem Spiel, Rekordrunden und Fehlertraining bereit. Personenmetadaten und Kategorieauswahl bleiben in JSON und kompakter Kontosicherung erhalten. Filmgenre- und Bekanntheitsfilter beschränken Personenfragen nicht; die Personenkategorie muss ausgewählt sein. Die vorhandenen Filmreise-Ziele zählen weiterhin Filmfragen aus abgeschlossenen Runden. Schauspieler und Preisträger haben separate Filmreise-Zähler: je 20 sichere Ziele der vorherigen Stufe öffnen Mittel, Schwer und Experte. Nur abgeschlossene Runden zählen; Varianten, geratene und nicht beantwortete Fragen erhöhen den Zähler nicht. Filmgenre-Zähler wachsen durch diese Antworten nicht. Ihre Lernwirkung und Karriere-XP folgen den bestehenden Regeln. 50 Varianten teilen vorhandene Wissensziel-IDs; Antworten und Fortschritte bleiben zielbezogen. Erkennungsfragen zeigen den Namen erst in der Lösung; spätere Quellen und Vertiefungen gehören zum Antwortbereich. [Paketvertrag](Schauspieler-Fragenpaket.md).


## Eigenständige Filmreise-Bereiche und Personenredaktion (03.10.2026)

Optionales `journey.independentAreas: true` markiert die einmalige Trennung historischer Preisantworten von Filmgenre-Zählern. Vorher erworbene Filmrechte werden zuvor abgeleitet und erhalten. `journey.earned[Bereich].difficulty` erlaubt 0–3; 3 bezeichnet Experte für Schauspieler/Preisträger. `round.unlocks` unterstützt dort ebenfalls `difficulty: experte`. Sicherungen ohne diese Felder bleiben lesbar; Schema 1 und Frageidentitäten bleiben erhalten. Frühere App-Versionen mit maximal zwei gespeicherten Freischaltstufen können neue Expertenrechte nicht prüfen; für solche Sicherungen ist der aktuelle App-Stand erforderlich.

Die Schauspielerredaktion wird anhand Frage-ID, Personen-ID sowie ursprünglichem Frage- und Vertiefungstext ausschließlich für die Anzeige aufgelöst. 727 Fragen nennen die vorgegebene Person mit vollem Namen; 73 Erkennungsfragen behalten den verdeckten Namen bis zur Lösung. Alle 800 Vertiefungen erhalten individuelle Ergänzungen; 549 Fragen verweisen auf 493 konkrete Filme. Filmdaten erscheinen ausschließlich nach der Antwort. Bestehende CSV, Frageversionen, Lernereignisse und Rundensnapshots bleiben unverändert. Eigene Fragen mit abweichendem Inhalt werden nicht überschrieben. [Fachvertrag](Filmreise-Personen-und-Vertiefungen.md).

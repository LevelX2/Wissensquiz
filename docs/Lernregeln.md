# Lern-, Runden- und Speichervertrag

## Lernzustand pro Wissensziel

Fragenvarianten teilen die explizite `knowledge_id`. Eine Runde verwendet jedes Wissensziel höchstens einmal. Noch ungesehene Ziele besitzen keinen Lernzustand. Jede beantwortete oder abgelaufene Frage erzeugt ein Ereignis.

| Antwort | Wirkung |
| --- | --- |
| Erste sichere richtige Antwort | Stufe 1, „geübt“, nächste Wiederholung nach 24 Stunden. |
| Sichere fällige Antwort an neuem lokalem Kalendertag | Stufe um eins erhöhen, maximal 4; Abstände der Stufen: 1, 3, 7, 21 Tage. |
| Sichere Antwort am selben Tag oder vor Fälligkeit bei bestehender Stufe | Teilnahme zählen, Stufe und Termin nicht erhöhen. |
| Falsch oder Zeit abgelaufen | Aktuelle Stufe 0, „entdeckt“, Wiederholung nach zehn Minuten. |
| Richtige Antwort als geraten markiert | Punkte unverändert; Lernereignis mit demselben eindeutigen Schlüssel korrigieren, Fortschritt neu ableiten. Stufe 0, „entdeckt“, Wiederholung nach sechs Stunden. |

„Gefestigt“ erfordert Stufe 4, sichere stufenwirksame Antworten an mindestens vier verschiedenen Tagen und mindestens sieben Tage seit der vorherigen Antwort auf dieses Wissensziel. Auch eine frühe Zwischenantwort setzt diesen tatsächlichen Abstand neu an, ohne Stufe oder Fälligkeit zu erhöhen. Beispiel ohne Zwischenantwort: Tag 0 → Tag 1 → Tag 4 → Tag 11; nächste Wiederholung Tag 32. Eine zusätzliche Antwort an Tag 10 verhindert die Festigung an Tag 11; nach ausreichendem Abstand kann die nächste fällige Antwort festigen. Ein einzelner Treffer, eine gelesene Erklärung oder sofortiges Wiederholen reichen nicht.

Nach einem Fehler kann bereits eine neue sichere Antwort wieder „geübt“ ergeben; am gleichen Tag darf aber keine zweite Erhöhung stattfinden, wenn an diesem Tag bereits eine sichere Stufe erreicht wurde. Die Grenze verwendet lokale Kalendertage. Lernintervalle verwenden Millisekunden seit dem Ereignis. Diese konfigurierbare Startheuristik steht in `RULES` in `src/engine.ts` und ist keine validierte Wissensdiagnostik.

Eine einmal erreichte Festigung bleibt bei weiteren sicheren Antworten erhalten; erst falsch oder geraten setzt die aktuelle Stufe zurück. Frühe Zwischenantworten verhindern also eine erstmalige verfrühte Festigung, nehmen aber bestätigtes Wissen bei erneuter richtiger Antwort nicht zurück.

## Auswahl und Runden

Die Hauptauswahl kombiniert mehrere Filmgenres und Schwierigkeitsstufen. Ein Genre stammt unverändert aus `metadata.subdomain`, ersatzweise aus `domain`; `Science-Fiction` wird als „Sci-Fi“ angezeigt. Innerhalb einer Gruppe gilt ODER, zwischen Genre und Stufe UND. Aktuell sind Sci-Fi, Action, Horror, Fantasy, Komödie, Western und Drama enthalten; zukünftige importierte Genres werden aus den vorhandenen Fragen abgeleitet. Classics und Arthouse schränken zusätzlich ein; keine neue Auswahl einzelner Filme/Reihen. Leere Auswahl liefert keine Runde. Die gewählten Genres werden nicht künstlich gleichverteilt; die bestehenden Lernregeln wählen aus dem passenden Gesamtbestand.

Neue Runden speichern `filters.genres`, `filters.difficulties` und `filters.familiarities` als sortierte, duplikatfreie Listen. Sicherungen behalten diese Felder und prüfen, dass die Rundensnapshots zur Auswahl passen. Alte Runden ohne `filters` verwenden weiterhin ihre bisherigen `topic`-/`difficulty`-Felder; keine Migration von Fragen oder Lernereignissen nötig.

Jede Frage zeigt standardmäßig ihr Genre sowie vor und nach der Antwort ihre eigene Schwierigkeit als Text („Leicht“, „Mittel“ oder „Schwer“) aus dem gespeicherten Fragensnapshot. Eine kombinierte Rundenauswahl ersetzt diese Einzelangabe nicht; Punkte und Lernregeln ändern sich dadurch nicht. `settings.showGenre` und `settings.showDifficulty` sind unabhängig gespeicherte optionale Booleans; bei fehlendem Feld gilt die Anzeige als eingeschaltet. Alte Sicherungen bleiben gültig.

Filmreise wählt zuerst tatsächlich unbearbeitete Wissensziele (noch kein Lernereignis, Varianten zählen gemeinsam). Bei genügend passenden neuen Zielen besteht die ganze Runde daraus. Zum Kennenlernen der höchsten tatsächlich freigeschalteten Stufe Mittel/Schwer werden bis zur Hälfte der Rundenplätze bevorzugt mit deren neuen Zielen belegt, solange in dieser Genre/Stufe weniger als fünf unterschiedliche Ziele bearbeitet wurden. Historische Bearbeitungen zählen; bloßes manuelles Freigeben aller Stufen erzeugt keine Lernpfad-Freischaltung. Genre-, Stufen- und Themenfilter gelten weiterhin. Mehrere Genres teilen sich dieses Kontingent; keine künstliche Gleichverteilung. Keine neue gespeicherte Einstellung.

Fehlen neue Ziele, werden bearbeitete Ziele außerhalb der drei zuletzt gestarteten Runden bevorzugt. Maßgeblich sind tatsächliche Antwort-/Zeitablaufereignisse, nicht bloß ungespielte Fragen im Rundensnapshot. Fällige Ziele zuerst, dann übrige; innerhalb der Gruppen ältere letzte Bearbeitung vor jüngerer, bei Gleichstand seltenere vor häufigerer. Ziele aus den letzten drei Runden dienen erst als Ersatz, wenn sonst Plätze frei bleiben. Damit sind kleine Themen weiterhin spielbar. Höchstens fünf fällige Wiederholungen pro Runde; ausschließlich fälliger Bestand führt weiterhin zu kürzeren Runden. In jeder Runde bleibt jedes Wissensziel eindeutig; keine Wiederholung zum Auffüllen. Startvorschau und tatsächlicher Start verwenden denselben Auswahlkontext.

Freies Spiel ersetzt Besser werden und zieht Ziele zufällig ohne Lernstandsgewichtung. Rekordrunden mischen die gewählten Schwierigkeit-/Bekanntheitsgruppen möglichst gleichmäßig und ziehen innerhalb dieser Gruppen zufällig. Beide Modi sind unabhängig von Freischaltungen. Bekanntheitsfilter und tatsächliche Mischung gehören zur neuen Vergleichsregel; historische Rekorde bleiben separat. Details unter [Spielmodi und Bekanntheit](Spielmodi-und-Bekanntheit.md).

Die erste abgeschlossene Runde wird mit bis zu fünf Fragen vorbereitet, spätere mit bis zu zehn. Vorab steht die tatsächliche Größe fest. Nach einer Pause startet keine automatische Wiederholungswelle. Entspannte Runden dürfen über Startseite, Neuladen oder Browserneustart fortgesetzt werden; beim Wiederaufnehmen erscheint gegebenenfalls die zuletzt gespeicherte Erklärung.

## Fehlertraining und Rundenauswertung

Seit 02.10.2026 ergänzt `fehler` die drei bisherigen Modi. Offene Fehler werden ohne neue gespeicherte Zähler aus der chronologischen Ereignishistorie je Wissensziel abgeleitet: falsch/abgelaufen aufnehmen, sicher richtig entfernen, geraten richtig erhält nur einen schon vorhandenen Fehler. Ereignisse aller Modi und Rundenstatus zählen. Nach einer sicheren Antwort beginnt ein späterer Fehler eine neue offene Fehlerfolge.

Fehlertraining wählt ausschließlich solche offenen Ziele innerhalb der gewählten Genres, Schwierigkeiten, Filmgruppen und Kategorien. Häufigere Fehler seit der letzten sicheren Antwort zuerst, bei Gleichstand jüngster Fehler zuerst, weitere Gleichstände zufällig. Die zuletzt falsch beantwortete konkrete Frage wird bevorzugt; passt sie nicht zur Auswahl, darf eine passende Variante desselben Ziels verwendet werden. Je Ziel ein Platz, erste Runde bis fünf, danach bis zehn; weniger offene Fehler ergeben kürzere Runden. Kein Auffüllen mit ungespielten oder sicheren Fragen. Startvorschau und Rundenstart verwenden denselben Ereigniskontext.

Die Zehn-Minuten-Fälligkeit muss für dieses bewusst gestartete Training nicht abgewartet werden. Die bestehenden Lernintervalle, Tagesgrenzen, „War geraten“-Korrektur, Freischaltungen und einmaligen 10 Abschluss-XP gelten weiter. Sofort sicher gelöst bedeutet nicht langfristig gefestigt. Fehlerrunden sind entspannte, offline fortsetzbare Runden mit den üblichen Snapshots und Antwortreihenfolgen; keine Rekordpunkte.

Die Ergebnisansicht zeigt Trefferquote (richtige Antworten einschließlich geratener Treffer / tatsächliche Fragenzahl), Antwortfolge, falsche Antworten, Zeitabläufe ohne Wahl, geratene Treffer und die längste Folge sicherer richtiger Antworten. Dazu neu kennengelernte Ziele (vor der Runde noch ohne Lernstand), in dieser Runde sicher gelöste frühere Fehler, neu geübte/gefestigte Ziele, damalige Freischaltungen und Treffer je Genre. Historische Zahlen beziehen sich auf den Rundensnapshot, seine Ereignisse und die vorherigen Runden; spätere Trainings ändern sie nicht.

„Fehler dieser Runde üben“ startet unmittelbar eine neue Fehlerrunde mit den ursprünglichen Filtern und ausschließlich den aktuell noch offenen Fehlzielen der betrachteten abgeschlossenen Runde. Schon später sicher gelöste Ziele entfallen. Eine andere aktive Runde verhindert diesen Start mit Hinweis. Ohne verfügbare Fehler wird keine leere Runde erzeugt. Rückblickfilter „Alle“, „Fehler“ (einschließlich Zeitablauf) und „Geraten“ zeigen gezielt passende Erklärungen; bei Fehlern auch die damalige gewählte Antwort. Die Filter sind flüchtiger UI-Zustand.

## Rekorde und Zeit

Zeitbasis: Maximum aus verstrichener `performance.now()`-Zeit und verstrichener `Date.now()`-Zeit. Die monotone Uhr schützt vor zurückgestellter Systemzeit, die Wandzeit erfasst Suspend-/Hintergrundzeit auch bei pausierter monotoner Uhr. Vorstellen der Systemuhr kann eine Trainingsfrage vorzeitig beenden; lokale Rekorde sind nicht manipulationssicher und kein Wettbewerb.

Start nach zwei Animationsframes mit gerenderter und bedienbarer Frage. UI-Intervalle aktualisieren nur die Anzeige; jede Antwort prüft die tatsächlich verstrichene Zeit erneut. Ab 30.000 ms gilt die Frage als abgelaufen. Erklärungen haben keine Uhr. Beim Hintergrundwechsel wird nichts pausiert; Rückkehr aktualisiert sofort. Rekordrunden werden nach Neuladen oder erneutem App-Start abgebrochen, gespeicherte Antworten bleiben als Lernereignisse erhalten, es gibt keine Abschluss-XP oder Rekorde dafür.

Punkte: richtig und innerhalb der Zeit = 100 + 2 × floor((30.000 − vergangene ms) / 1.000). Falsch/abgelaufen = 0. Rekordschlüssel: Thema, Schwierigkeit, tatsächliche Rundengröße, Regelversion. Antwortreihenfolge wird einmal pro Runde gespeichert; Lösung und Feedback bleiben über Antwort-IDs verbunden.

Für neue Runden beginnt der Rekordschlüssel mit `genres-v1`, gefolgt von der kanonischen Genre-/Stufenkombination, optionalem Einzelthema, Rundengröße und Regelversion. Die Klickreihenfolge ändert die Kategorie nicht. Neue Kategorien werden getrennt von den unveränderten historischen Rekordschlüsseln geführt.

## Persönliche Bestenliste

Highscores startet für Gäste und Konten mit „Meine Rekorde“. Kurze Karten zeigen den Bestwert je exakter Vergleichskategorie; die jüngst gespielten Kategorien stehen zuerst. Innerhalb einer Kategorie bleiben Punkte, Gleichstände und die Reihenfolge der einzelnen Runden unverändert. „Alle Runden“ enthält die vollständige Liste, „Auswahl & Vergleich“ die ausführlichen Vergleichsmerkmale. Genre ist direkt filterbar; weitere Filter sind aufklappbar und gemeinsam zurücksetzbar. Der getrennte „Spielervergleich“ beginnt mit richtigen Antworten aller Spielmodi und bietet zusätzlich Runden, Trefferquote sowie passende Rekordpunkte. Keine neue Speicherung und keine Ranglistenmigration für diese Oberflächenvereinfachung.

Aus sämtlichen abgeschlossenen Rekordrunden und ihren Antwortereignissen abgeleitet, ohne neue Datenablage oder Migration. Aktive, abgebrochene und entspannte Runden zählen nicht. Jede bestehende `recordKey`-Kategorie hat eine eigene Rangliste: Genre-/Stufenkombination, optionales Filmthema, tatsächliche Fragenzahl und Regelversion. Historische Themenkategorien bleiben separat. Die Genre-Auswahl filtert exakt die gespielte Kombination; „Alle Genre-Kombinationen“ zeigt alle Kategorien getrennt, nicht eine vermischte Gesamtwertung.

Absteigend nach Gesamtpunkten; gleiche Punktzahl ergibt denselben Rang (1, 1, 3). Bei Gleichstand steht das früher abgeschlossene Spiel zuerst. Antwortzeit summiert ausschließlich `elapsedMs` der Antworten, ohne Lesezeit der Erklärungen; sie ist kein zusätzlicher Rangentscheid. Sichtbar sind Punkte, richtige Antworten, Rundengröße, Antwortzeit, Abschlussdatum und Rundenrückblick. Filter ändern die Kategorie-Ränge nicht. Vorhandene abgeschlossene Spiele erscheinen automatisch und werden mit der JSON-Sicherung erhalten. Die Liste ist persönlich und Bestandteil des jeweiligen Gast- oder Kontostands; die getrennte gemeinsame Trainingsrangliste ist unter [Konten und Spielstände](Konten-und-Spielstaende.md) beschrieben. Bestätigte Konten nehmen automatisch teil; die Spielabläufe bleiben browserbasiert.

## Erfahrung und Abzeichen

Genre-Icons illustrieren die Auswahl, sind keine erworbenen Abzeichen. Das bestehende Sci-Fi-Abzeichen wird mit einem Schloss vor Erwerb und einer Medaille mit Stern nach Erwerb dargestellt. Es gibt noch keine eigenen Action-/Horror-/Fantasy-Abzeichen; die bisherigen Vergaberegeln bleiben unverändert.

10 XP pro eindeutig abgeschlossener Runde; erneutes Laden/Abschließen erzeugt keine weiteren XP. Level = 1 + floor(XP / 100). XP werden aus abgeschlossenen Runden abgeleitet und schalten keine Wissensabzeichen frei.

Die Auszeichnung **„Sci-Fi – 10 leichte Wissensziele gefestigt“** wird nur bei mindestens zehn geeigneten Zielen angeboten. Geeignet sind im gelieferten Bestand `domain=Film`, `subdomain=Science-Fiction`, `difficulty=leicht`; es existieren 50 unterschiedliche Ziele. Vergabe erst beim Rundenabschluss nach einer möglichen „War geraten“-Korrektur. Die Auszeichnung bleibt nach Erwerb bestehen, auch bei neuen Inhalten oder späteren Fehlern. Die Favoritenfunktion ist entfernt. Das historische Feld `favorites` bleibt ausschließlich zur Sicherungskompatibilität erhalten.

## Datenintegrität und Sicherung

IndexedDB-Datenbank `wissensquiz`, Store `state`, Gastschlüssel `current`, Schema 1. Optionale Konten verwenden `account:<Supabase-Host>:<Benutzer-ID>` im selben Store; bestehende Gastdaten bleiben unverändert. Der Zustand enthält Fragen inklusive Themen-/Wissenszielzuordnung, Inhaltsversionen, Runden mit vollständigen Fragensnapshots und Antwortreihenfolge, Ereignisse, Lernstände, Termine, XP, Rekorde, Abzeichen, historische Favoritenwerte, Einstellungen, Importberichte und lokale Meldungen.

Jede Änderung liest den aktuellen Zustand innerhalb einer einzigen Readwrite-Transaktion und schreibt ihn vollständig zurück. Antwort-ID = Runden-ID + Wissensziel-ID. Eine Frage akzeptiert nur die erste Antwort an der erwarteten Rundenposition. Transaktionsabbruch hinterlässt keinen Teilstand. Lernstände werden deterministisch aus Ereignissen neu aufgebaut; XP und Rekorde aus abgeschlossenen Runden. Für den Testbestand ist dieser schlanke Ansatz ausreichend, bei großen Ereignisarchiven wäre inkrementelle Verarbeitung sinnvoll.

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

Die aufgeklappte Ansicht zeigt außerdem die gemeinsame Bilanz aller Formulierungen/Varianten desselben Wissensziels nach knowledgeId. Auch historische, nicht mehr im aktuellen Fragenbestand befindliche Varianten werden über ihre gespeicherten Ereignisse berücksichtigt. Genre-/Classics-Wechsel erzeugen keinen zweiten Zähler. Nur angezeigte Fragen ohne gespeicherte Antwort bzw. Zeitablauf lassen sich aus dem bisherigen Verlauf nicht verlässlich zählen und erhöhen diese Statistik nicht. Neuladen zählt nicht erneut.

Keine neuen Statistikzähler, keine Migration und keine Änderung an Lernfortschritt oder Ereignissen. Die vorhandene lokale/automatische Kontosicherung und JSON-Sicherung enthalten bereits die benötigte Historie. Der allgemeine Ruhehinweis unter den Lernantworten entfällt zugunsten der kompakten Statistik; mobile Weiter-Aktion bleibt fest erreichbar.

## Arthouse und gemeinsame Kategorienauswahl

Classics und Arthouse sind unabhängig wählbare kuratierte Zusatzkategorien innerhalb der ausgewählten Genres. Beide gewählt bedeutet eine Vereinigung (ODER), keine Schnittmenge. Die Rundenkategorie wird kanonisch als Classics + Arthouse und optional mit „: Film/Reihe“ gespeichert; frühere Classics-Runden bleiben gültig. Globale Summen, Auswahl und Fortschritt bleiben nach Frage-/Wissensziel-ID eindeutig. RomCom und Rom-Com werden beim neuen Import zum Genre Rom-Com zusammengeführt, Quellwert bleibt erhalten. Details und vollständige Zahlen im Importvertrag.

## Jahresfragen, Regie und Filmdaten (26.09.2026)

Neue Jahres- und Regiefragen verwenden die normalen Genre-, Stufen-, Lern- und Punkteregeln. Wechselnde falsche Jahresantworten werden nur beim Rundenstart erzeugt und als vollständiger Snapshot gespeichert; Lernidentität und Statistiken bleiben dieselben. Nach der Antwort bietet Filmdaten die geprüften Eckdaten des Films in einem zunächst geschlossenen Abschnitt. [Vertrag und Quellen](Filmwissen-und-Filmdaten.md).

Fragenfortschritt: Grün mit Häkchen bedeutet richtig, Rot mit Kreuz falsch; ohne Antwort erscheint ein roter Strich. Offene Fragen sind grau, die aktuelle Frage zusätzlich deutlich umrandet und vor der Antwort mit Punkt markiert. Zugängliche Beschriftungen nennen Nummer und Status, damit Farbe nicht die einzige Unterscheidung ist.


## Gespeicherte Rundenvorbereitung (27.09.2026)

Optionales `settings.roundSetup`: `mode`, `genres` (null = alle einschließlich späterer Imports, [] = keine), `categories` (Classics/Arthouse) und `difficulties`. Defaults für alte Sicherungen: entdecken, alle Genres, keine Zusatzkategorie, alle drei manuellen Stufen. Nicht mehr vorhandene Genres werden bei der Anzeige entfernt; fallen alle früher gewählten Genres weg, gilt wieder alle. Eine absichtlich leere Auswahl bleibt leer. Keine einzelne Film-/Reihenauswahl in neuen Runden; historische Rundensnapshots und Themenfilter bleiben lesbar und fortsetzbar.

Auswahländerungen werden transaktional gespeichert; die Oberfläche zeigt die Wahl sofort, Kontosynchronisierung erhält ausschließlich bestätigte Speicherstände. Speicherfehler nehmen die vorläufige Auswahl zurück und zeigen den vorhandenen Fehlerhinweis. Die Filmreise ignoriert manuelle Stufen-/Bekanntheitsfilter, erhält sie aber für den späteren Wechsel zurück. JSON- und Kontosicherungsvalidierung erhalten das optionale Objekt; Lernereignisse und IDs ändern sich nicht.


Online-Sicherungen verwenden zusätzlich eine verlustfreie Kompaktkodierung des Fragenkatalogs und versionsgebundene Rundenverweise. Nach dem Lesen entsteht derselbe vollständige Zustand; die bisherigen Sicherungs-, Lern- und Ranglistenregeln gelten unverändert. IndexedDB und JSON-Export behalten das bisherige Vollformat. Details und Größenmessung unter [Konten und Spielstände](Konten-und-Spielstaende.md#kompakte-online-sicherung-27092026).


## Antwortsignale (27.09.2026)

Richtig: heller aufsteigender Sinus-Zweiklang (659 → 880 Hz), insgesamt 250 ms. Falsch: tiefer absteigender Dreieck-Zweiklang (277 → 196 Hz), insgesamt 265 ms, geringerer Spitzenpegel. Beide weich ein- und ausgeblendet; keine laute Fehlersirene. Die vorhandene Soundoption, Offlinefähigkeit und Wiedergabe erst nach gespeicherter Antwort bleiben erhalten. Start, Weiter, Zeitablauf, Abschluss, Freischaltungen und Vibration unverändert. Der wahrgenommene Pegel hängt weiterhin von Gerät und Systemlautstärke ab.

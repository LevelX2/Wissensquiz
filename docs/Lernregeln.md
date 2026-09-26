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

Die Hauptauswahl kombiniert mehrere Filmgenres und Schwierigkeitsstufen. Ein Genre stammt unverändert aus `metadata.subdomain`, ersatzweise aus `domain`; `Science-Fiction` wird als „Sci-Fi“ angezeigt. Innerhalb einer Gruppe gilt ODER, zwischen Genre und Stufe UND. Aktuell sind Sci-Fi, Action, Horror, Fantasy, Komödie, Western und Drama enthalten; zukünftige importierte Genres werden aus den vorhandenen Fragen abgeleitet. Eine optionale Film-/Reihenauswahl schränkt zusätzlich ein. Leere Auswahl liefert keine Runde. Die gewählten Genres werden nicht künstlich gleichverteilt; die bestehenden Lernregeln wählen aus dem passenden Gesamtbestand.

Neue Runden speichern `filters.genres` und `filters.difficulties` als sortierte, duplikatfreie Listen. Sicherungen behalten diese Felder und prüfen, dass die Rundensnapshots zur Auswahl passen. Alte Runden ohne `filters` verwenden weiterhin ihre bisherigen `topic`-/`difficulty`-Felder; keine Migration von Fragen oder Lernereignissen nötig.

Jede Frage zeigt standardmäßig ihr Genre sowie vor und nach der Antwort ihre eigene Schwierigkeit als Text („Leicht“, „Mittel“ oder „Schwer“) aus dem gespeicherten Fragensnapshot. Eine kombinierte Rundenauswahl ersetzt diese Einzelangabe nicht; Punkte und Lernregeln ändern sich dadurch nicht. `settings.showGenre` und `settings.showDifficulty` sind unabhängig gespeicherte optionale Booleans; bei fehlendem Feld gilt die Anzeige als eingeschaltet. Alte Sicherungen bleiben gültig.

Entdecken zielt bei zehn Fragen auf 5 neue/wenig bekannte, 3 fällige und 2 gefestigte, noch nicht fällige Ziele. Besser werden erhöht den Anteil fälliger Ziele auf bis zu 5. Fehlende Gruppen werden aus anderen Gruppen aufgefüllt. Insgesamt höchstens fünf fällige Ziele pro Runde: Bei ausschließlich fälligem Bestand wird die Runde kürzer. Keine Wiederholung desselben Wissensziels zum Auffüllen. Rekordrunden ziehen zufällig aus dem gewählten Thema und der Schwierigkeit, ebenfalls ohne Zielduplikate.

Die erste abgeschlossene Runde wird mit bis zu fünf Fragen vorbereitet, spätere mit bis zu zehn. Vorab steht die tatsächliche Größe fest. Nach einer Pause startet keine automatische Wiederholungswelle. Entspannte Runden dürfen über Startseite, Neuladen oder Browserneustart fortgesetzt werden; beim Wiederaufnehmen erscheint gegebenenfalls die zuletzt gespeicherte Erklärung.

## Rekorde und Zeit

Zeitbasis: Maximum aus verstrichener `performance.now()`-Zeit und verstrichener `Date.now()`-Zeit. Die monotone Uhr schützt vor zurückgestellter Systemzeit, die Wandzeit erfasst Suspend-/Hintergrundzeit auch bei pausierter monotoner Uhr. Vorstellen der Systemuhr kann eine Trainingsfrage vorzeitig beenden; lokale Rekorde sind nicht manipulationssicher und kein Wettbewerb.

Start nach zwei Animationsframes mit gerenderter und bedienbarer Frage. UI-Intervalle aktualisieren nur die Anzeige; jede Antwort prüft die tatsächlich verstrichene Zeit erneut. Ab 30.000 ms gilt die Frage als abgelaufen. Erklärungen haben keine Uhr. Beim Hintergrundwechsel wird nichts pausiert; Rückkehr aktualisiert sofort. Rekordrunden werden nach Neuladen oder erneutem App-Start abgebrochen, gespeicherte Antworten bleiben als Lernereignisse erhalten, es gibt keine Abschluss-XP oder Rekorde dafür.

Punkte: richtig und innerhalb der Zeit = 100 + 2 × floor((30.000 − vergangene ms) / 1.000). Falsch/abgelaufen = 0. Rekordschlüssel: Thema, Schwierigkeit, tatsächliche Rundengröße, Regelversion. Antwortreihenfolge wird einmal pro Runde gespeichert; Lösung und Feedback bleiben über Antwort-IDs verbunden.

Für neue Runden beginnt der Rekordschlüssel mit `genres-v1`, gefolgt von der kanonischen Genre-/Stufenkombination, optionalem Einzelthema, Rundengröße und Regelversion. Die Klickreihenfolge ändert die Kategorie nicht. Neue Kategorien werden getrennt von den unveränderten historischen Rekordschlüsseln geführt.

## Persönliche Bestenliste

Aus sämtlichen abgeschlossenen Rekordrunden und ihren Antwortereignissen abgeleitet, ohne neue Datenablage oder Migration. Aktive, abgebrochene und entspannte Runden zählen nicht. Jede bestehende `recordKey`-Kategorie hat eine eigene Rangliste: Genre-/Stufenkombination, optionales Filmthema, tatsächliche Fragenzahl und Regelversion. Historische Themenkategorien bleiben separat. Die Genre-Auswahl filtert exakt die gespielte Kombination; „Alle Genre-Kombinationen“ zeigt alle Kategorien getrennt, nicht eine vermischte Gesamtwertung.

Absteigend nach Gesamtpunkten; gleiche Punktzahl ergibt denselben Rang (1, 1, 3). Bei Gleichstand steht das früher abgeschlossene Spiel zuerst. Antwortzeit summiert ausschließlich `elapsedMs` der Antworten, ohne Lesezeit der Erklärungen; sie ist kein zusätzlicher Rangentscheid. Sichtbar sind Punkte, richtige Antworten, Rundengröße, Antwortzeit, Abschlussdatum und Rundenrückblick. Filter ändern die Kategorie-Ränge nicht. Vorhandene abgeschlossene Spiele erscheinen automatisch und werden mit der JSON-Sicherung erhalten. Die Liste ist persönlich und Bestandteil des jeweiligen Gast- oder Kontostands; die getrennte gemeinsame Trainingsrangliste ist unter [Konten und Spielstände](Konten-und-Spielstaende.md) beschrieben. Bestätigte Konten nehmen automatisch teil; die Spielabläufe bleiben browserbasiert.

## Erfahrung und Abzeichen

Genre-Icons illustrieren die Auswahl, sind keine erworbenen Abzeichen. Das bestehende Sci-Fi-Abzeichen wird mit einem Schloss vor Erwerb und einer Medaille mit Stern nach Erwerb dargestellt. Es gibt noch keine eigenen Action-/Horror-/Fantasy-Abzeichen; die bisherigen Vergaberegeln bleiben unverändert.

10 XP pro eindeutig abgeschlossener Runde; erneutes Laden/Abschließen erzeugt keine weiteren XP. Level = 1 + floor(XP / 100). XP werden aus abgeschlossenen Runden abgeleitet und schalten keine Wissensabzeichen frei.

Die Auszeichnung **„Sci-Fi – 10 leichte Wissensziele gefestigt“** wird nur bei mindestens zehn geeigneten Zielen angeboten. Geeignet sind im gelieferten Bestand `domain=Film`, `subdomain=Science-Fiction`, `difficulty=leicht`; es existieren 50 unterschiedliche Ziele. Vergabe erst beim Rundenabschluss nach einer möglichen „War geraten“-Korrektur. Die Auszeichnung bleibt nach Erwerb bestehen, auch bei neuen Inhalten oder späteren Fehlern. Bis zu drei Themen können Favoriten sein.

## Datenintegrität und Sicherung

IndexedDB-Datenbank `wissensquiz`, Store `state`, Gastschlüssel `current`, Schema 1. Optionale Konten verwenden `account:<Supabase-Host>:<Benutzer-ID>` im selben Store; bestehende Gastdaten bleiben unverändert. Der Zustand enthält Fragen inklusive Themen-/Wissenszielzuordnung, Inhaltsversionen, Runden mit vollständigen Fragensnapshots und Antwortreihenfolge, Ereignisse, Lernstände, Termine, XP, Rekorde, Abzeichen, Favoriten, Einstellungen, Importberichte und lokale Meldungen.

Jede Änderung liest den aktuellen Zustand innerhalb einer einzigen Readwrite-Transaktion und schreibt ihn vollständig zurück. Antwort-ID = Runden-ID + Wissensziel-ID. Eine Frage akzeptiert nur die erste Antwort an der erwarteten Rundenposition. Transaktionsabbruch hinterlässt keinen Teilstand. Lernstände werden deterministisch aus Ereignissen neu aufgebaut; XP und Rekorde aus abgeschlossenen Runden. Für den Testbestand ist dieser schlanke Ansatz ausreichend, bei großen Ereignisarchiven wäre inkrementelle Verarbeitung sinnvoll.

JSON-Wiederimport prüft Schema, Grenzen, eindeutige IDs, Antwortreihenfolge, Fragensnapshots, Ereigniszuordnungen und Punkte. Abgeleitete Werte werden neu berechnet. Bestehende Abzeichen bleiben Bestandteil der Sicherung; diese ist kein manipulationssicherer Leistungsnachweis. Import ersetzt den Stand erst nach ausdrücklicher Bestätigung. Aktive Rekordrunden werden dabei abgebrochen. Reset verlangt die Texteingabe `LÖSCHEN` und löscht Fortschritt, nicht den Fragenbestand.

Browserdaten sind nicht Teil des Git-Repositories. Backup: JSON über Einstellungen herunterladen, nach wichtigen Sitzungen und vor Browser-/Adresswechseln erneut exportieren, mindestens die letzten drei Sicherungen an einem selbst gewählten sicheren Ort behalten. Wiederherstellung im Browser aus diesem JSON; der vollständige Export-/Importweg und Browserneustart wurden in isolierten Testprofilen geprüft. Aktivierte Konten laden bei Anmeldung/Neuladen und sichern lokale Änderungen automatisch. Gastdaten bleiben ausschließlich auf diesem Gerät. Ein Synchronisierungsbeleg unter `sync:<Kontoschlüssel>` speichert bestätigte Revision und Inhaltsfingerabdruck; fehlgeschlagene Uploads werden wiederholt, konkurrierende Änderungen stoppen ohne Überschreiben. Web Locks begrenzen aktive Kontofenster pro Browser; siehe [Konten und Spielstände](Konten-und-Spielstaende.md). Ein paralleles Fenster kann eine Rekordrunde beim Start abbrechen; für Spielrunden nur ein App-Fenster verwenden.

## Akustisches und haptisches Feedback

Soundeffekte sind standardmäßig eingeschaltet, werden aber erst durch eine Spielaktion bzw. das Probesignal freigegeben. Keine Wiedergabe beim Laden oder bloßen Wiederanzeigen gespeicherter Antworten. Sinustöne mit kurzer Lautstärkehüllkurve unterscheiden Start, nächste Frage, richtige/falsche Antwort, Zeitablauf, Abschluss und neu erworbenes Abzeichen. Signale bestätigen gespeicherte Antworten/Abschlüsse; Fehler der Audioausgabe beeinflussen den Speicherablauf nicht. Keine Hintergrundmusik, keine externen Audiodateien.

`settings.sound` und `settings.haptics` sind optionale, abwärtskompatible Sicherungsfelder. Ohne Werte gilt Ton an, Vibration aus. Ton und Vibration gesammelt unter Optionen → Ton & Vibration änderbar. Vibration ist ein optionales Zusatzsignal für unterstützte Geräte/Browser. Sichtbares Feedback bleibt erhalten; in ausgeblendeten Tabs werden keine neuen Signale abgespielt. Stummschalten stoppt laufende Töne. Technische Grundlagen: [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [Vibration](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).

## Offline und Updates

Build erzeugt eine versionierte Precache-Liste aus der tatsächlich gebauten Oberfläche, Icons und CSV-Paketen. Eine Online-Anzeige allein bedeutet nicht Offline-Verfügbarkeit: Der Paketstatus wird beim aktiven Service Worker anhand aller Cache-Einträge abgefragt. IndexedDB enthält die importierten Lerninhalte.

Neue Worker verwenden kein `skipWaiting`. Neue Versionen warten auf das Schließen der alten App-Fenster. Cache-Bereinigung erfolgt erst bei Aktivierung. Fortschritt bleibt in IndexedDB. Nur statische gleichartige Same-Origin-Dateien werden mit `ignoreVary` aus dem Precache gelesen, damit der Vorschau-Header `Vary: Origin` Modulskripte offline nicht blockiert.

HTTPS oder localhost erforderlich. Die HTTP-Heimnetzadresse ist zum Onlinespielen geeignet, aber nicht zur PWA-Installation. Quellenlinks sind extern und werden nicht offline heruntergeladen.

## Profilstatistik

Alle Zahlen werden aus dem aktuellen Kontospielstand abgeleitet; bestehende Runden zählen mit. „Runden gespielt“ umfasst auch aktive und abgebrochene Runden, „Runden abgeschlossen“ nur abgeschlossene Runden aller Modi. „Fragen beantwortet“ zählt Ereignisse mit gewählter Antwort; reine Zeitabläufe ohne Antwort zählen nicht. Trefferquote = richtige gewählte Antworten / alle gewählten Antworten, auf ganze Prozent gerundet; ohne Antworten wird keine Quote behauptet. „Rekordrunden abgeschlossen“ zählt abgeschlossene Rekordrunden, „Wissensziele gefestigt“ den aktuellen Lernstatus. Keine neue Speicherung oder Veränderung historischer Ereignisse.

## Lernpfad und freie Schwierigkeitsauswahl

Auf aktualisierten Nutzerwunsch ist der Lernpfad Standard. `settings.allDifficulties` ist optional und standardmäßig false; das Häkchen „Alle Schwierigkeitsstufen freigeben“ setzt true und öffnet alle Stufen. Das alte optionale `settings.learningPath` bleibt zur Sicherungskompatibilität lesbar, steuert aber nicht mehr die Auswahl. Auch alte Stände starten mit Lernpfad, sofern die neue freie Auswahl noch nicht ausdrücklich gewählt wurde. Vorhandene Runden und Lernereignisse bleiben unverändert. Im Lernpfad ist Leicht je Genre offen; 20 unterschiedliche sicher richtig beantwortete leichte Wissensziele öffnen Mittel. Für Schwer müssen sowohl 20 leichte als auch 20 mittlere Ziele erreicht sein. Verschiedene Fragevarianten desselben Wissensziels zählen nur einmal pro Genre/Stufe. Wiederholungen, geratene Treffer, falsche Antworten und bloß gelesene Erklärungen erhöhen den Zähler nicht.

Es zählen nur abgeschlossene Runden, damit „War geraten“ vor Abschluss berücksichtigt ist. Historische und frei gespielte Runden zählen mit. Genre/Stufe stammen aus dem damaligen Fragensnapshot. Spätere Fehler nehmen eine durch frühere sichere Treffer erreichte Freischaltung nicht zurück. Der Lernpfad ist eine Motivation, keine Festigungsdiagnose und kein eigener Wettbewerb. Importierte Genres mit weniger als 20 geeigneten Zielen können die nächste Stufe nicht öffnen; freies Spiel bleibt möglich.

Startvorschau und tatsächlicher Rundenstart verwenden denselben eingeschränkten Fragenpool, zusätzlich zu den gewählten Genres/Stufen/Themen. Bei mehreren Genres gelten deren Freigaben einzeln. Aktive historische Runden bleiben unverändert. Fortschrittsbalken und Freigabestatus stehen an der Rundenauswahl; ein neuer Erfolg erscheint nach Rundenabschluss. Die Einstellung wird mit Gast-/Kontostand, JSON und automatischer Kontosicherung erhalten.

## Gemeinsame Spielerranglisten

Zusätzlich zu einzelnen Rekordrunden: meiste abgeschlossene Runden, meiste richtige Antworten und beste Trefferquote. Alle drei Spielmodi zählen, ausschließlich abgeschlossene Runden. Filter: einzelnes Genre oder alle Genres, einzelne Schwierigkeit oder alle Stufen. Bei gemischten Runden zählen nur passende Fragen, die Runde einmal. Richtige Antworten umfassen auch Wiederholungen und nachträglich als geraten markierte Treffer; diese Leistungslisten verwenden nicht die strengere Lernpfaddefinition.

Trefferquote = richtige gewählte Antworten / alle gewählten Antworten; Zeitabläufe ohne Wahl zählen nicht. Mindestumfang für die Quotenrangliste: 50 Antworten innerhalb der ausgewählten Vergleichsgruppe. Anzeige mit einer Nachkommastelle und immer zusammen mit Runden-/Antwortanzahlen; Rang nach ungerundeter Quote. Gleiche Werte teilen den Rang, stabile Reihenfolge nach Name und internem Eigentümer, 50 Spieler pro Seite. Inaktivität, abgebrochene Runden und reine Anmeldungen ergeben keine Rundenpunkte. Keine zusätzliche E-Mail-/Identitätsfreigabe.

## Filmtitel und Genreillustrationen

Die Fragenansicht hebt den ersten exakt zitierten deutschen oder originalen Filmtitel aus den Metadaten farbig hinterlegt hervor. Nur seine umschließenden Anführungszeichen entfallen in der Anzeige; Jahr, restlicher Fragetext, Rohquelle, Frage-ID und gespeicherte Snapshots bleiben unverändert. Unbekannte Zitate und Fragen ohne passende Metadaten bleiben unverändert. Alle 1.260 gelieferten Fragen enthalten einen passenden Titel. Der Text bleibt inline umbrechbar; keine zusätzliche Titelzeile.

Große Genrekarten verwenden sieben dekorative PNG-Illustrationen mit echter Transparenz, Textnamen bleiben zugänglich. Kleine Auswahl-Icons und unbekannte Genres behalten die SVG-Darstellung. Motive und Herkunft: [Genreillustrationen](Genreillustrationen.md). Alle Motive gehören zum Offline-Paket.


## Freischaltfeier

Eine tatsächlich neue Mittel-/Schwer-Freischaltung beim erfolgreichen Speichern des Rundenabschlusses öffnet eine eigene Feier: aufspringendes Schloss, drei kurze Feuerwerksfolgen, große Genre-/Stufenanzeige, einmalige Fanfare und optionale Vibration. Der Vorher-/Nachher-Vergleich findet innerhalb derselben Speichertransaktion statt. Auch Antworten bei freier Schwierigkeitsauswahl können den Erfolg auslösen; mehrere neue Stufen erscheinen gemeinsam.

Die Feier ist flüchtiger UI-Zustand, kein neues Spielstandfeld. Ein alter Rundenrückblick, Neuladen oder das reine Laden eines Online-Spielstands löst sie nicht aus. Der vorhandene Ergebnishinweis bleibt nachlesbar. Die Animation endet nach knapp drei Sekunden; der Erfolg bleibt sichtbar, bis „Weiter zum Ergebnis“ oder Escape gewählt wird. Der Dialog hält den Tastaturfokus und gibt ihn an das Ergebnis zurück.

Die achtteilige Fanfare ersetzt das normale Abschlusssignal. Ton aus bleibt stumm, Vibration wird nur bei eingeschalteter Option angefordert. Die Betriebssystem-/Browsereinstellung für reduzierte Bewegung ersetzt Raketen, Partikel und Schlossanimation durch eine ruhende Auszeichnung. Keine externen Audio-, Bild- oder Animationsdienste; funktioniert mit dem Offline-Paket. Unveränderte Freischaltbedingungen: sichere unterschiedliche Ziele aus abgeschlossenen Runden, keine geratenen Treffer.

## Sammlungsfilter und Vibrationspräferenz

Der Sammlungsfilter „Mit beantworteten Fragen“ zeigt nur Themen mit mindestens einem Antwortereignis mit gewählter Antwort. Richtig, falsch und geraten zählen, auch in aktiven oder abgebrochenen Runden. Reine Zeitabläufe ohne Antwort zählen nicht. Die Zuordnung erfolgt über Wissensziel-IDs zu den vorhandenen Themen; historische Varianten bleiben berücksichtigt. Favoriten allein reichen nicht. Standard ist „Alle“; der Filter bleibt beim Seitenwechsel innerhalb der App erhalten, wird aber nicht im Spielstand gespeichert. Keine Änderung an Lernereignissen oder Fortschritt.

Die Vibrationspräferenz ist unabhängig von der aktuellen Browserunterstützung einstellbar. Der Schalter ist nur während einer laufenden Speicheraktion gesperrt. Die Einstellung verwendet weiterhin settings.haptics und die vorhandene lokale/automatische Kontosicherung, ohne Migration. Fehlende Vibration-API, abgelehnte Ausgabe (false/Exception) und erfolgreich angefordertes Signal werden unterschieden. Ein akzeptierter API-Aufruf beweist keine physisch spürbare Vibration.

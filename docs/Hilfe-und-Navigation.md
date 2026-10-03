# Navigation und Hilfe

03.10.2026 – **Noch nicht umgesetzter Vorschlag:** drei Einstiege Lernen, Auf Zeit und Duell; unter Auf Zeit die Varianten 10 Fragen, Fehlerfrei und Zeitkonto. Highscores soll Solo-Rekorde, Duelle und Karriere sichtbar unterscheiden und alle neuen Solo-Varianten mit persönlichen/gemeinsamen Zeitranglisten abbilden. Die folgenden Abschnitte beschreiben die vorhandene Oberfläche. [Vorschlag mit Zeitregeln und Rekordstruktur](Endlos-Rekord-Konzept.md).

03.10.2026 – **Fragenbereiche** zeigt Filmfragen, Preisträger und Schauspieler als kombinierbare Checkboxen. Alle drei zusammen ergeben den gemeinsamen Pool; für eine reine Schauspielerrunde Filmfragen und Preisträger abwählen. Filmgenres, Bekanntheit und die gesonderte Filmauswahl mit Nur Classics/Nur Arthouse wirken nur auf Filmfragen. Schwierigkeit gilt für alle Bereiche. Themenkarten starten einen einzelnen Bereich, der danach ergänzt werden kann. [Auswahlvertrag](Spielmodi-und-Bekanntheit.md#additive-fragenbereiche--03102026).

## Kategorieillustrationen – 03.10.2026

**Preisträger** verwendet einen goldenen Filmpreis mit Lorbeerzweigen und Filmstreifen; **Schauspieler** zwei anonyme Porträtbüsten mit Filmklappe. Beide Motive wurden mit dem eingebauten Imagegen im Gold-/Elfenbein-/Petrol-Stil der bestehenden Illustrationen erzeugt und unverändert als transparente RGBA-PNGs mit 1254 × 1254 Pixeln übernommen. Die gemeinsame Bildzuordnung in `GenreArtwork` versorgt große Themenkarten und kleine Kategorie-Auswahlfelder. Kategoriennamen bleiben als Text und ARIA erhalten, die Bilder sind dekorativ. Beide Dateien werden offline zwischengespeichert. [Originalprompts, Dateihashes und Prüfungen](Kategorie-Illustrationen.json). Beide Kategorieillustrationen sind in Sites-Version 38 veröffentlicht.

Seit 02.10.2026 lokal: **Spielen → Duell** mit den Gruppen „Du bist dran“, „Warten auf Gegner“ und „Gegner wird gesucht“, fünf gemeinsamen Spielplätzen, Rundenergebnissen, Fristen und Historie. Konto erforderlich; Gäste gelangen zum Profil. Zufallspaarung und Linkeinladung verwenden drei vertraute Zehnerrunden auf Zeit. Die Hilfe erklärt Ablauf, Gegnerausfall und Slotgrenzen. Vor Solo-/Duellstart steht „Lösungen anzeigen“; gesammeltes Feedback bleibt bis zur eigenen Rundenauswertung neutral und erlaubt vorher eine Rate-Kennzeichnung. Auf dem Handy unterdrückt die Duellfrage wie die Solofrage den zusätzlichen Karrierekopf. Neue Linkfragmente werden auch in einer bereits geöffneten App erkannt. [Fachvertrag und Betriebsgrenzen](Asynchrone-Filmduelle.md).

Seit 02.10.2026 lokal: dritte Zusatzkategorie **Preisträger** und vierte manuelle Stufe **Experte**. 200 Preisfragen, je 50 pro Stufe, in Themenübersicht und Rundenvorbereitung eingebunden. Kategorien sind mit Genres und miteinander kombinierbar. Die Hilfe erläutert Preise, Kategorievereinigung und die Beschränkung von Experte auf freie Modi/Fehlertraining. Die Filmreise führt weiterhin durch drei Stufen. [Inhalt und Quellen](Preistraeger.md).

## Filmkarriere

Seit 02.10.2026 lokal: Level, Karrieretitel und XP-Balken in der Desktop-Seitenleiste und im kompakten Handykopf der Hauptseiten. Profil und Sammlung zeigen zusätzlich den Weg zum nächsten Level, die Gesamtsumme und eine gegebenenfalls erhaltene Startgutschrift. Nach Abschluss stehen die tatsächlichen Runden-XP, ihre aufklappbare Aufschlüsselung und der damalige Karrierefortschritt im Ergebnis. Neue Aufstiege werden einmal hervorgehoben; Rückblicke feiern sie nicht erneut, reduzierte Bewegung bleibt ruhig. Während einer mobilen Frage wird kein zusätzlicher Karrierekopf eingeblendet. Level/Titel erscheinen in beiden gemeinsamen Ranglisten; „Level & XP“ vergleicht die globale Karriere und erhält die Filter anderer Wertungen beim Zurückwechseln. Karriereaufträge bleiben offen. [Fachvertrag](Filmkarriere-und-XP.md).

## Keine Ahnung

In allen vier Spielmodi steht „Keine Ahnung“ als fünfte Auswahl unter den vier Antworten. Ein kurzer Hinweis erklärt die Wertung als falsch. Nach erfolgreichem Speichern erscheint für 1,1 Sekunden nur die richtige Lösung mit sanfter Hervorhebung; anschließend die normale Erklärung. Reduzierte Animationen bleiben ruhig. Die Weiter-Aktion steht nach dieser kurzen Phase bereit. Keine falsche Möglichkeit wird als eigene Antwort markiert; „Alle Antworten ansehen“ bleibt danach aufklappbar. Rückblick, Fortschritt und Fehlerstatistik unterscheiden „Keine Ahnung“ von einem Zeitablauf. Die Hilfe erklärt die bewusste Wahl, Punkte und Wiederholung. [Fachvertrag](Lernregeln.md#keine-ahnung-als-antwortoption).

Spielervergleich am 02.10.2026 lokal verständlicher: erklärt die automatische Teilnahme unabhängig von gleichzeitig angemeldeten Spielern, den einzigen eigenen Eintrag und Konten ohne Runde. Leere Genre-/Stufenfilter und die 50-Antworten-Schwelle der Trefferquote haben eigene Hinweise. Ladegrenze, Anmeldung, Serverfehler und unlesbare Daten werden unterschieden; „Erneut versuchen“ lädt neu. Die langsamere Datenbankfunktion wurde bereits live ersetzt, diese UI-Texte sind seit Sites-Version 35 veröffentlicht. [Diagnose](Spielervergleich-Stoerung.md).

Fünf dauerhafte Hauptpunkte, auf dem Handy in einer unteren Zeile: Spielen, Themen, Sammlung, Highscores und Profil. Highscores beginnt für Gäste und Konten mit „Meine Rekorde“. Lokal am 03.10.2026 um den direkten Einstieg „Bestenliste“ zwischen „Meine Rekorde“ und „Spielervergleich“ ergänzt: öffentlich sichtbare bestätigte Spieler mit Level/Titel, XP und abgeschlossenen Spielen, Antworten und Trefferquote; Standardwertung Level & XP. Unter jeder Highscore-Ansicht neue Gastaktivität mit Siebentagessummen und aufklappbaren deutschen Kalendertagen. App und neue Migration noch nicht veröffentlicht. [Vertrag und Grenzen](Bestenliste-und-Gastaktivitaet.md). Eigene Bestwerte stehen in kurzen Genre-Karten mit Punkten, Antwortbilanz und direktem Rückblick; „Alle Runden“ enthält sämtliche früheren Ergebnisse. Genre ist direkt filterbar, Schwierigkeit, Filmbekanntheit und Rundengröße unter „Weitere Filter“. Ohne Rekorde führt „Rekordrunde vorbereiten“ zur gespeicherten Modusauswahl, ohne eine Runde zu starten.

„Spielervergleich“ beginnt für angemeldete Konten mit „Alle Spielmodi“ und der Wertung „Richtige Antworten“. Runden und Trefferquote sind direkt wählbar; Genre-/Stufenfilter unter „Vergleich eingrenzen“. „Rekordrunden“ bietet getrennt den Punktevergleich mit Genre- und Rundenauswahl, zunächst passend zur jüngsten eigenen Rekordrunde, falls verfügbar. Vergleichsregeln bleiben aufklappbar. Gäste gelangen über „Im Profil anmelden“ direkt ins Profil. Alle früheren Ergebnisse und die exakte Trennung vergleichbarer Kategorien bleiben erhalten.

Optionen sind ausschließlich über das Profil erreichbar, auch im Gastmodus. Der Kopfbereich und die Desktop-Seitenleiste enthalten keinen zusätzlichen Optionszugang. Die Einstellungsseite führt zurück zum Profil; ein ausdrücklich ausgeführtes Zurücksetzen führt zur Startseite.

„So funktioniert’s“ ist im Profil und im Seitenfuß erreichbar. Die Seite ist im App-Bündel enthalten und offline verfügbar. Der erste Abschnitt zu „entdeckt“, „geübt“ und „gefestigt“ ist geöffnet und enthält das konkrete Wiederholungsbeispiel heute → morgen → drei Tage später → sieben Tage später. Weitere aufklappbare Abschnitte erklären Wissensziele, Modi, Filmreise/freie Auswahl, XP/Abzeichen, Highscores und Speicherung. Fachliche Grundlage sind [Lernregeln](Lernregeln.md) und [Konten und Spielstände](Konten-und-Spielstaende.md); Inhalte müssen bei Regeländerungen gemeinsam gepflegt werden.

Filmreise ist der Fortschrittsmodus. Freies Spiel, Rekordrunde und Fehlertraining bieten alle Schwierigkeiten und Bekanntheitsgruppen; das frühere Freigabehäkchen ist entfernt. Alle Modi verwenden denselben Lernfortschritt aus abgeschlossenen Runden. Ein Moduswechsel löscht keine erworbenen Rechte.

Für angekündigte asiatische Filmfragen ist „Asia-Kino“ vorläufig vorgeschlagen. Die endgültige Benennung, Abgrenzung und Illustration bleiben auf Nutzerwunsch offen, bis die Fragen vorliegen. Ein bereits gestarteter Bildentwurf wurde nicht in die App übernommen.

Neu erreichte Lernpfad-Stufen öffnen beim Rundenabschluss einen zugänglichen Erfolgsdialog mit kurzer Animation, Stufenübersicht und „Weiter zum Ergebnis“. Escape schließt ebenfalls; die Fokusführung kehrt zum Ergebnis zurück. Der ruhige Hinweis im Rundenergebnis bleibt zusätzlich erhalten. Details unter Lernregeln → Freischaltfeier.

In der Sammlung kann die Übersicht der Detailerfolge zwischen „Alle“ und „Mit beantworteten Fragen“ umgeschaltet werden. Jede gewählte Antwort zählt, unabhängig von richtig/falsch. Bei leerem Ergebnis erklärt ein Hinweis die Auswahl und bietet „Alle Einträge anzeigen“. Die übrigen Sammlungsinformationen bleiben unverändert.

Unter Profil → Optionen lässt sich Vibration auch ohne Unterstützung des aktuellen Browsers ein- und ausschalten und speichern. Ein Hinweis erklärt die technische Einschränkung; „Signal ausprobieren“ meldet gegebenenfalls eine abgelehnte Ausgabe.

Während einer Runde entfällt auf schmalen Bildschirmen die Hauptnavigation; „Pause & Startseite“ bleibt oben erreichbar. Nach einer Antwort werden die vier Möglichkeiten unter „Alle Antworten ansehen“ gesammelt; gewählte und richtige Antwort, Erklärung und Merksatz bleiben sichtbar. Vertiefung und Quellen bleiben aufklappbar. „War geraten“ und „Nächste Frage“/„Runde abschließen“ stehen in einer festen unteren Aktionsleiste mit Abstand zur iPhone-Sicherheitszone. Die Seite erhält ausreichend Platz darunter, damit längere Erklärungen vollständig lesbar bleiben. Auf kleinen Displays, mit großer Schrift oder langen Texten kann Lesen weiter Scrollen erfordern, der Weiter-Button bleibt dennoch erreichbar.

„Alle Genres abwählen“ leert die Genreauswahl. Danach lässt sich ein einzelnes Genre bequem einschalten; für reine Filmfragen bleibt ohne Genre der Rundenstart gesperrt. Zusätzlich ausgewählte Schauspieler- und Preisfragen bleiben spielbar. Auswahlfelder und filmbezogene Sammlungskarten verwenden die vorhandenen freigestellten Genre-Motive.

Der Kontoname steht im Profil, ausführliche Speicherhinweise unter „Konto & Speicherung“. Eine kompakte feste Markierung am Profil bzw. während der Runde neben dem Modus zeigt grün/✓ für online bestätigt, blau/↑ für laufende oder wartende Sicherung und orange/! für unbestätigte Sicherung. Antippen in der Runde öffnet Details über dem Inhalt, ohne die Frage zu verschieben. Konflikte behalten ihre eigene Auflösungsansicht. Wartende App-Updates werden außerhalb einer laufenden Runde auch auf den Hauptseiten erklärt. Alte Tabs weiterhin schließen und neu öffnen; kein automatischer Versionswechsel in einer laufenden Runde.


## Kompakter Spieleinstieg und Classics

Seit 03.10.2026 lokal sind **Spielmodus**, **Fragenbereiche**, **Filmgenres & Filmauswahl**, in freien Modi **Schwierigkeit & Filmgruppen** sowie **Lösungen anzeigen** standardmäßig eingeklappt. Jede Kopfzeile zeigt die aktuelle Auswahl; leere Auswahlen werden ausdrücklich benannt. Filmfilter erklären bei abgewählten Filmfragen, dass sie derzeit nicht wirken. Die vier Moduskarten und sämtliche bisherigen Auswahlfelder bleiben beim Öffnen verfügbar. Enter und Leertaste bedienen die nativen Klappen ebenfalls.

„Losspielen“ steht direkt unter der kompakten Spielmoduszeile, mit der Zusammenfassung der aktuellen Runde. Alle gewählten Stufen und Filmgruppen werden dort kurz als „Alle Stufen“ beziehungsweise „Alle Filmgruppen“ bezeichnet. Bei einer begonnenen Runde bleibt „Fortsetzen“ direkt erreichbar. Die längere Moduserklärung steht ebenfalls unter „Mehr zu Auswahl und Ablauf“; der Hinweis auf mögliche Handlungsauflösungen bleibt sichtbar. „Deine Stufenfortschritte“ ist unabhängig davon aufklappbar und nutzt dieselben Genreillustrationen.

Öffnen und Schließen ändern ausschließlich die Darstellung. Die gewählten Filter und Lösungen werden weiterhin über die vorhandene Rundenvorbereitung gespeichert; beim Neuladen und nach dem Rückweg von einer Runde beginnen die Klappen wieder geschlossen. Filmreise berücksichtigt automatisch die je Genre freigeschalteten Stufen, freie Modi die gespeicherte manuelle Auswahl. Bestehende Spielstände und Lernregeln bleiben erhalten. Diese Verdichtung ist noch nicht veröffentlicht.

„Nur Classics“ schränkt die gewählten Genres auf die kuratierte Zusatzkategorie ein. Unter Themen gibt es zusätzlich eine Classics-Karte mit nach Wissensziel-ID deduplizierten Fortschrittszahlen. Kategorien überschneiden sich, erzeugen aber keine weiteren Fragen, Ereignisse oder Lernstände. Arthouse ist eine weitere kuratierte Zusatzkategorie.


## Statistik zur einzelnen Frage

Entdecken und Besser werden zeigen direkt unter dem Fragetext die persönliche Bilanz der konkreten Frage: beantwortet, richtig und falsch. Aufklappbar sind Zeitabläufe, geratene Treffer und die gemeinsame Bilanz mit Wiederholungsvarianten. Vorhandene Antworten aller Modi und Rundenstatus zählen mit; Neuladen oder bloßes Anzeigen zählt nicht. Details zur Zählweise unter [Lernregeln](Lernregeln.md#statistik-zur-einzelnen-frage). Keine neue Speicherung, bestehende Fortschritte bleiben erhalten.

Die Fragenstatistik erscheint standardmäßig erst nach der Antwort. Unter Profil → Optionen lässt sie sich auf „Immer anzeigen“ umstellen oder ausblenden. Die Auswahl wird mit dem Spielstand gesichert; ältere Spielstände verwenden „Nach der Antwort“.

## Arthouse und gemeinsame Kategorienauswahl

Classics und Arthouse sind unabhängig wählbare kuratierte Filmfilter innerhalb der ausgewählten Genres. Beide gewählt bedeuten eine Vereinigung (ODER), keine Schnittmenge. Preisträger und Schauspieler sind seit 03.10.2026 eigenständige, zusätzlich auswählbare Fragenbereiche und unterliegen diesen Filmfiltern nicht. Neue Rundenkategorien enthalten die gewählten Bereiche und Filmfilter in fester Reihenfolge, etwa Filmfragen + Classics + Arthouse + Preisträger; frühere Runden mit „: Film/Reihe“ bleiben gültig. Globale Summen, Auswahl und Fortschritt bleiben nach Frage-/Wissensziel-ID eindeutig. RomCom und Rom-Com werden beim neuen Import zum Genre Rom-Com zusammengeführt, Quellwert bleibt erhalten. Details im [Auswahlvertrag](Spielmodi-und-Bekanntheit.md#additive-fragenbereiche--03102026) und Importvertrag.

Spielmodi mit eigenen transparenten Illustrationen: Filmreise (Lupe mit Stern), Freies Spiel (Stufen mit Stern), Rekordrunde (Pokal mit Stoppuhr). Fehlertraining verwendet die vorhandene SVG-Illustration. Die Startseite erhält eine helle Kino-Kulisse; Spielansicht und Daten bleiben unverändert. Die Moduskarten liegen in der Spielmodusklappe; Losspielen bleibt darunter direkt erreichbar. Alle Bilder sind im Offline-Paket enthalten; die Auswahl ist weiterhin per Tastatur und mit sichtbarer Markierung bedienbar.

## Rundenfortschritt und Filmdaten

Die kleinen Felder neben der Fragenzahl zeigen richtige Antworten grün mit Häkchen, falsche rot mit Kreuz und Zeitabläufe rot mit Strich. Offene Fragen bleiben grau. Die aktuelle Frage hat eine dunkle Umrandung; vor ihrer Beantwortung zusätzlich einen Punkt. Farbe ist damit nicht das einzige Unterscheidungsmerkmal.

„Filmdaten“ lässt sich nach der Antwort neben der Vertiefung öffnen. Der Abschnitt enthält Originaltitel, Erscheinungsjahr, Regie, Produktionsländer/-regionen und bekannte Reihenposition samt Abgrenzungen. Jahres- und Regiefragen gehören direkt zu ihren bisherigen Genres. Ihre fachlichen und technischen Regeln stehen unter [Filmwissen und Filmdaten](Filmwissen-und-Filmdaten.md).

## Themenübersicht und Filmblöcke (27.09.2026)

Die doppelten großen Genrekarten am Ende von Spielen entfallen. Genreauswahl und Stufenfortschritte zur Rundenvorbereitung bleiben vorhanden. Die vollständige Kartenübersicht liegt unter Themen.

Jede Genre- und Kategorienkarte bietet zusätzlich „Filme & Reihen ansehen“. Der direkte Wechsel innerhalb von Themen zeigt nur zugehörige Film-/Reihenblöcke mit ihren vorhandenen Lernständen und führt über „Zur Themenübersicht“ zurück. Classics, Arthouse und Preisträger bleiben kuratierte Ansichten. Wissensziele werden innerhalb der gewählten Ansicht nach ID gezählt; bei gemischten Reihen zählen nur die dort passenden Fragen. Film- und Reihenblöcke zeigen den Fortschritt; eine Auswahl einzelner Filme für neue Runden gibt es nicht mehr. Reines Stöbern verändert weder Lernstände noch gespeicherte Fragen.

Favoriten sind auf Nutzerwunsch entfernt. Die Sammlung zeigt Film-/Reihenblöcke alphabetisch, weiterhin mit „Alle“ / „Mit beantworteten Fragen“. Historische Favoritenwerte werden nur zur Sicherungskompatibilität erhalten und nicht mehr ausgewertet.

## Gespeicherte Auswahl

Spielmodus, Genres, Classics/Arthouse und manuell gewählte Schwierigkeitsstufen werden schon bei der Auswahl gespeichert. „Alle Genres auswählen“ schließt später importierte Genres ein; eine ausdrücklich leere Auswahl bleibt leer. Ohne bisherige Auswahl gelten Filmreise, alle Genres, keine Zusatzkategorie und alle manuellen Stufen/Filmgruppen. Filmreise verwendet freigeschaltete Bereiche; Freies Spiel, Rekordrunde und Fehlertraining die gespeicherten manuellen Filter. Historische freie Einstellung ohne Rundenvorbereitung öffnet Freies Spiel.

Wie Ton, Vibration, Fragehinweise und Fragenstatistik liegen diese Werte im Gast-/Kontospielstand. Gäste speichern auf diesem Gerät; angemeldete Spieler sichern automatisch online. JSON-Sicherung und Wiederherstellung nehmen die Auswahl mit. Keine gesonderte Datenbankmigration; bestehende Runden und Lernfortschritte bleiben unverändert.

Die Bekanntheitseinteilung, parallelen Freischaltungen und die Vergleichbarkeit der Rekordmischungen erklärt die Hilfe ebenfalls. Bei leerer Filmreise-Auswahl direkter Wechsel ins Freie Spiel; alle freien Filter sind gespeichert. Details: [Spielmodi und Bekanntheit](Spielmodi-und-Bekanntheit.md).


## Fehlertraining und Ergebnisansicht

Seit 02.10.2026 steht Fehlertraining als vierte Moduskarte bereit, mit offline verfügbarer SVG-Illustration. Desktop vier Karten nebeneinander, auf schmalen Bildschirmen zwei mal zwei. Der leere Zustand erklärt fehlende offene Fehler oder zu enge Filter. Die Rundenauswahl wird wie bisher unmittelbar gespeichert.

Das Ergebnis zeigt eine Quote im Ring, die farbige Antwortfolge mit Symbolen, Fehler, Zeitabläufe, geratene Treffer und die längste sichere Serie. Neue Wissensziele und sicher gelöste frühere Fehler werden hervorgehoben; Treffer je Genre ergänzen die Lernfortschritte. Fehler dieser Runde lassen sich direkt ohne Zeitdruck trainieren. Der Rückblick ist nach Alle / Fehler / Geraten filterbar und zeigt bei Fehlern auch die damalige Antwort. Sicherungs- und Lernregeln: [Lernregeln](Lernregeln.md#fehlertraining-und-rundenauswertung).

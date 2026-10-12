# Erfolge und Erfolgsstufen

## Stand – 12.10.2026

Lokal umgesetzt, noch nicht veröffentlicht. Erweitert die mit Version 75 veröffentlichten Level- und Zehnerrundenmeldungen. App und private SQL-Projektion benötigen eine gemeinsame Veröffentlichung. [Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-12%20Nutzerauftrag%20Erfolgssystem.txt).

## Gemeinsamer Vertrag

Ein Erfolg besteht aus stabiler ID, Erfolgsreihe, Zielwert, kurzem Namen, Bedingung, Motiv und Stufe. Die fünf Stufen sind **I Bronze, II Silber, III Gold, IV Platin und V Diamant**. Die Position des Meilensteins bestimmt die Stufe; bei den acht bestehenden Entdecker-Zielen tragen die letzten vier das Diamantmotiv mit ihrem jeweiligen Zielwert. Stufe und Bedingung stehen als Text dabei; Farbe allein trägt keine Information. Definitionen liegen zentral in `src/achievements.ts` und `src/learningAchievements.ts`, Darstellung und Signale in `src/successTiers.ts`.

| Erfolgsreihe | Meilensteine / Stufen I bis V | Motiv | Zählregel |
| --- | --- | --- | --- |
| Immer eine Runde weiter | 1, 10, 25, 50, 100 | Filmklappe | Abgeschlossene Runden über alle Spielarten und Fragenbereiche; auch kurze Runden. Aktive und abgebrochene Runden zählen nicht. |
| Perfekte Zehnerrunden | 1, 10, 25, 50, 100 | Stern mit Haken | Genau zehn verschiedene Filmfakten in einer abgeschlossenen Runde, jeweils mit gewählter, sicher richtiger Antwort; keine geratenen Treffer. |
| Heute war nicht mein Tag | 1 / Bronze | Regenwolke | Eine vollständig beantwortete Zehnerrunde ohne richtige Antwort. „Keine Ahnung“ zählt als Antwort; Zeitablauf, verkürzte und abgebrochene Runden nicht. |

Das ist der ursprüngliche Spielkatalog mit elf Erfolgen. Der folgende Lernkatalog erweitert denselben Vertrag. Erfolge verändern weder XP noch Lernstufen, Rekorde oder freigeschaltete Fragen. Eine perfekte Zehnerrunde ist ein Rundenereignis; zehn einzelne richtige Antworten in verschiedenen Runden erfüllen diese Bedingung nicht, können aber den neuen Erfolg „10 Fakten sicher gewusst“ erreichen.

## Filmwissen, Genres und EXP – Erweiterung am 12.10.2026

[Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-12%20Nutzerauftrag%20Weitere%20Erfolge%20und%20EXP.txt). Lokal umgesetzt, noch nicht veröffentlicht. „EXP“ und das bestehende „XP“ bezeichnen denselben Erfahrungswert; keine zweite Währung und keine Änderung seiner Berechnung.

| Erfolgsreihe | Ziele | Motiv / Bedeutung |
| --- | --- | --- |
| Erfahrung gesammelt | 100, 500, 1.000, 5.000, 10.000 EXP | Pokal; Gesamt-Erfahrung. Level und aktueller Karrieretitel stehen zusätzlich in der Übersicht. |
| Filmkenner | 1, 10, 25, 50, 100 Filme | Filmstreifen; jeden Film insgesamt einmal zählen. |
| Filmkenner je Genre | 1, 10, 25, 50, 100 Filme je Genre | Filmstreifen; eigene Reihe für jedes Genre mit geeigneten Filmen im aktuellen Bestand. |
| Sicher gewusst | 1, 10, 25, 50, 100 Wissensziele | Stern mit Haken; unterschiedliche Fakten sicher richtig aus abgeschlossenen Runden, über alle Bereiche. |
| Wissen, das bleibt | 10, 25, 50, 100, 250 Wissensziele gefestigt | Buch; Lernstufe 4 erreicht. |
| Entdecker-Medaillen | 50, 100, 250, 500, 1.000, 2.500, 5.000, 10.000 Fakten | Kompass; alle acht bisherigen Ziele, keine verlorene Schwelle. |
| Gesichter des Kinos | 1, 10, 25, 50, 100 Personen | Person; leichte Wissensziele eines Personenthemas sicher gewusst. |
| Preiswissen | 1, 10, 25, 50, 100 Preisthemen | Pokal; leichte Wissensziele eines Preisthemas sicher gewusst. Kein Zählen einzelner Oscars als vollständiges Thema. |
| Über den Tellerrand | 1, 3, 5, 10, 15 Genres | Kompass; in jedem gezählten Genre mindestens einen Film gelernt. |
| Science-Fiction-Meisterschaft | 10 leichte Sci-Fi-Fakten gefestigt | Stern; das vorhandene Abzeichen in der gemeinsamen Übersicht. |

### Was bedeutet „Film gelernt“?

Arbeitsannahme mangels bisheriger Definition: **Alle aktuellen leichten Wissensziele dieses Films einmal sicher richtig beantwortet**, jeweils in einer abgeschlossenen Runde. Eine optionale Rückfrage hat die Alternativen „ein Fakt reicht“ und „alle Fakten gefestigt“ abgegrenzt; die Arbeitsannahme ist keine ausdrückliche Nutzerentscheidung. Film, Person und Preisthema bleiben getrennte Einheiten. Die Zuordnung verwendet die aktuellen Themen und Quellen des Katalogs. Ein Thema ohne leichte Wissensziele qualifiziert sich nicht durch eine leere Bedingung.

Fragevarianten teilen ein Wissensziel. Wiederholung derselben Tatsache und geratene Treffer bringen keinen zusätzlichen Film. Mittlere und schwere Fakten sind für diese erste Filmreihe nicht nötig; vollständige Meisterschaft ist als eigener, anspruchsvollerer Vorschlag unten beschrieben. Ein Film mit mehreren Genrezuordnungen zählt insgesamt einmal und in jedem passenden Genre einmal; für seine Qualifikation zählen alle leichten Ziele des Films.

### Fortschritt und Vergabe

Die Klappe **Deine Erfolge** bündelt alle Reihen. Jede Reihe lässt sich separat öffnen; geschlossen bleiben Motiv, Zahl, erreichte Meilensteine und aktueller Stufenname sichtbar. Geöffnet zeigt sie Bedingung, Balken, nächstes Ziel und alle Medaillen. Die Anzahl aktuell geeigneter Filme/Fakten/Themen steht dabei. Ein Ziel von 100 Filmen bleibt auch in einem Genre mit weniger Filmen sichtbar und trägt „Mit weiteren Inhalten“; es wird nicht als bereits erfüllbar ausgegeben.

Erreichte Lern-Erfolgsstände werden als bisher höchster Stand je Konto und Spielstandsgeneration festgehalten. Neue Fakten im Katalog, ein späterer Fehler oder ein kleinerer aktueller Bestand entziehen kein bereits erworbenes Abzeichen. Der aktuelle Lernstand bleibt unverändert in der Lernübersicht sichtbar. Ein ausdrücklich bestätigter Neustart beginnt eine neue Generation; ein Import wird aus dem importierten aktuellen Stand abgeleitet.

Die Vergabe prüft **vorher < Ziel ≤ nachher**. Eine Runde, die von neun auf elf gelernte Filme führt, vergibt den Zehner-Erfolg. Mehrere neue Erfolge, EXP-Meilensteine, Levelaufstieg und Freischaltungen landen in demselben Dialog; das höchste Motiv steuert einmalig Ton, Haptik und Animation. Ergebnis-Neuladen feiert nichts erneut. Die bestehende Sammlung und Filmreise verwenden für Entdecker-Medaillen ebenfalls das gemeinsame Kompassmotiv; ihre Lernbalken bleiben aktuelle Bestandsansichten.

Die Erfolgskarten verwenden kurze Glückwunsch-/Leistungstexte; die vollständige Zählbedingung bleibt im Profil nachlesbar. Die Bestätigung bleibt auch bei einer langen gemeinsamen Meldung im sichtbaren Dialogbereich, damit der Autofokus den Titel nicht aus dem Bild scrollt.

### Technischer Umfang

Die zusätzliche kompakte Aktion `learning-achievements` in der bestehenden privaten Ansichts-RPC liefert nur Zähler und Bestandsgrößen. Der aktuelle Katalog wird serverseitig über vorbereitete Metadaten mit sicheren Wissenszielen und Lernzeilen verknüpft; keine Vollhistorie und kein Katalogdownload an den Browser. Die kleinen privaten Tabellen `learning_achievements` und `round_learning_achievements` speichern Höchststände beziehungsweise den ersten Rundenbeleg. Abschlussprojektion statt Zählung bei jeder einzelnen Antwort; identische Wiederholung erhält denselben Beleg. Tabellen und Hilfsfunktionen sind direkt für anon/authenticated gesperrt; die autorisierte bestehende RPC liefert nur das eigene Konto.

Migration `20261012201611_learning_achievements.sql` initialisiert aktuelle Generationen aus ihrem aktuellen Format. Sie verändert keine Antworten, Lernstände, Revisionen oder XP und fügt keinen historischen Adapter hinzu. Wie der bisherige lokale Erfolgsstand ist sie noch nicht produktiv bereitgestellt. PGlite prüft Bedingungen, Rollen, Kontentrennung und Vergabe. Der lokale Supabase-Advisor erreicht mangels laufendem lokalen Server weiterhin keine Datenbank; vor Bereitstellung ist dieser Nachweis offen.

## Weitere sinnvolle Reihen – Vorschläge, noch nicht implementiert

Nicht jede denkbare Statistik sollte ein Abzeichen werden. Priorität haben unterschiedliche Leistungen: Wissen erwerben, Wissen behalten, neugierig bleiben und nach Fehlern weitermachen. Die folgenden Vorschläge ergänzen den implementierten Katalog; sie sind keine schon vorhandenen Zähler.

| Vorschlag | Konkrete Bedingung / mögliche Stufen | Einordnung |
| --- | --- | --- |
| Fehler überwunden | 10/25/50/100/250 unterschiedliche zunächst falsch beantwortete Ziele später sicher lösen; jedes Ziel einmal | Hohe Priorität: belohnt Lernen nach einem Fehler. Vorhandene Lernbelege nutzen. |
| Film gemeistert | 1/10/25/50/100 Filme, deren sämtliche aktuellen Wissensziele gefestigt sind | Hohe Priorität: anspruchsvoller Gegenpart zu „Film gelernt“, kein irreführendes Meisterlabel nach einer Antwort. |
| Wiedersehen lohnt sich | 5/10/25/50/100 fällige Wissensziele nach dem vorgesehenen Abstand sicher wiederholen | Hohe Priorität: belohnt echte Wiederholung. Sofortiges Neubeantworten darf den Zähler nicht erhöhen. |
| Classics-Kenner / Arthouse-Kenner | 1/10/25/50/100 gelernte Filme mit entsprechender Katalogzuordnung | Vorhandene Sammlungsmerkmale verwenden; Filmqualifikation bleibt identisch. |
| Schweres Wissen / Expertenwissen | 1/10/25/50/100 unterschiedliche schwere bzw. Expertenziele sicher wissen | Bereiche ohne Expertenfragen erhalten keine künstlichen Expertenziele. |
| Durch die Filmgeschichte | Filme aus 3/5/7/10 unterschiedlichen Jahrzehnten gelernt | Abwechslung über Jahrgänge; zuerst Metadatenabdeckung prüfen. |
| Regiehandschrift | Mehrere Filme derselben Regie gelernt; weitere Stufen für verschiedene Regien | Nur bei zuverlässigen, einheitlichen Regieidentitäten; Namen nicht ungeprüft zusammenwerfen. |
| Filmwelten komplett | Alle verfügbaren Filme einer Reihe bzw. eines kuratierten Sets gelernt | Redaktionell definierte Sets mit klaren enthaltenen Filmen; bisher keine vollständige Set-Zuordnung. |
| Sicherer Lauf | 5/10/25/50/100 unterschiedliche Ziele sicher richtig in Folge | Über Runden hinweg; Fehler, geraten und unbeantwortet beenden die Serie. Wiederholungsfarmen ausschließen. |
| Starkes Comeback | Nach einer trefferlosen Zehnerrunde ist die nächste abgeschlossene Zehnerrunde perfekt | Ein einzelner besonderer Erfolg; nicht für jedes erneute Nullergebnis ausschütten. |
| Knapp daneben | Eine abgeschlossene Zehnerrunde mit neun sicheren Treffern | Ein humorvoller Einzelerfolg, keine wachsende Fehlerserie. |
| Duellfreund | 1/10/25/50/100 vollständig absolvierte Duelle | Teilnahme und Sieg als unterschiedliche Bedingungen behandeln; Abbrüche ausschließen. |

Tages- oder Wochenserien sind möglich, aber nachrangig: Sie benötigen eine feste Zeitzonenregel und einen klaren Umgang mit Pausentagen. Reine Klickzahlen, bloße Anwesenheit oder absichtlich häufige Fehler bekommen keine ausgebauten Belohnungsreihen. Die vorhandene Nulltreffer-Auszeichnung bleibt eine einmalige freundliche Ausnahme. Neue Erfolge geben vorerst keine zusätzlichen EXP; dadurch bleibt die Lernkurve unverändert.

## Profil, Sammlung und Ergebnis

Im Profil enthält die Klappe **Deine Erfolge** alle erreichten und offenen Stufen, die Gesamtzahl erreichter Erfolge sowie für jede Reihe den Fortschrittsbalken und das nächste Ziel. Beispiel: elf perfekte Zehnerrunden bedeuten Silber erreicht, 11 von 25 und noch 14 bis Gold. Nach dem letzten Meilenstein bleibt „Alle Meilensteine erreicht“ sichtbar.

Die Sammlung zeigt perfekte Zehnerrunden mit denselben Stufen, Icons und Balken. Das unmittelbare Ergebnis einer perfekten Zehnerrunde zeigt zusätzlich ihre laufende Nummer und das nächste Ziel. So bleibt der Fortschritt zwischen den Meilensteinen sichtbar.

## Gemeinsame Erfolgsmeldung

Nur ein frisch bestätigter Rundenabschluss darf eine Meldung auslösen. Neue Erfolge, Karriereaufstieg und Filmreise-Freischaltungen stehen in **einem** Dialog mit einer Bestätigung. Jede Leistung bleibt einzeln benannt. Neuladen, Profilaufruf und historischer Rückblick wiederholen weder Dialog noch Signal. Ein Fehler beim Laden der Belohnung erhält eine Wiederholungsaktion und verbraucht das Erfolgssignal nicht vorzeitig.

Die höchste gleichzeitig erreichte Stufe bestimmt die Gesamtinszenierung. Einzelne Erfolgskarten behalten ihre eigene Stufe. Karriereaufstiege verwenden die fünf bestehenden Titelbereiche (ab Level 1/5/10/20/35); eine Filmreise-Freischaltung ohne weiteren Erfolg verwendet Bronze. XP-Level und Erfolgsstufe bleiben getrennt benannt.

| Stufe | Anzeige | Akustik | Haptik | Animation |
| --- | --- | --- | --- | --- |
| I Bronze | Bronze, ein Stufenpunkt, „Stufe I · Bronze“ | 3 aufsteigende Töne | 2 kurze Impulse | Medailleneintritt 650 ms, 1 Funkenausbruch |
| II Silber | Silber, zwei Stufenpunkte | 4 aufsteigende Töne | 3 kurze Impulse | 750 ms, 2 Ausbrüche |
| III Gold | Gold, drei Stufenpunkte | 5 aufsteigende Töne | 3 stärkere Impulse | 850 ms, 3 Ausbrüche |
| IV Platin | Grünsilber, vier Stufenpunkte | 6 aufsteigende Töne | 4 Impulse | 950 ms, 4 Ausbrüche |
| V Diamant | Blauviolett, fünf Stufenpunkte | 7 aufsteigende Töne | 4 stärkere Impulse | 1050 ms, 5 Ausbrüche |

Bestehende Ton- und Vibrationseinstellungen gelten unabhängig voneinander. Haptik ist ein optionaler Browser-/Geräteimpuls; eine erfolgreiche API-Anfrage belegt keine physische Vibration. Reduzierte Bewegung deaktiviert Eintrittsbewegung und Feuerwerk; Stufe, Icon und Text bleiben sichtbar. Der Dialog erhält Tastaturfokus, lässt sich bestätigen oder per Escape schließen und setzt den Fokus anschließend auf das Rundenergebnis.

## Private Zählung und Bereitstellung

Die bestehenden kleinen Ansichten `profile-stats` und `round-experience` liefern Gesamtzähler beziehungsweise den zum Rundenabschluss erreichten Stand. Kein Download der vollständigen Kontohistorie. Die private Tabelle `round_achievements` ergänzt die vorhandenen perfekten Runden und Statistikzähler. Indizierte Trigger prüfen nur die betroffene Runde und laufen nach der Statistikfortschreibung; identisches erneutes Schreiben erhöht nichts.

Die lokale Migration `20261012194444_round_achievements.sql` leitet den neuen Index einmal aus aktuellen privaten Runden und Antworten ab. Quelldaten, Revisionen, Lernstände und XP bleiben dabei unverändert; keine Anpassung historischer Formate. Unmittelbare und kompakte archivierte Rundenfakten werden über das bestehende aktuelle Speicherformat ausgewertet. Tabellen und Hilfsfunktionen sind für `anon` und `authenticated` direkt gesperrt; kontogebundene RPCs liefern nur den eigenen Stand. Reset und Import leiten die Werte aus der jeweiligen aktuellen Generation ab.

Der neue Trigger läuft als `security invoker` im bereits autorisierten Schreibweg und benötigt keine zusätzliche Rechteerhöhung. Die lokale SQL-/Rollenprüfung erfolgt mit PGlite. Der Supabase-Advisor konnte mangels laufender lokaler Supabase-Datenbank nicht verbinden; dieser Nachweis bleibt vor der Serverbereitstellung offen. Keine Produktivmigration in diesem Auftrag.

Die konkret gemeldete fehlende Meldung wurde ohne den damaligen persönlichen Rundenstand nicht abschließend rekonstruiert. Der bestehende Vertrag feiert feste Zahlen perfekter Runden; eine weitere perfekte Runde zwischen zwei Schwellen erzeugt keine neue Meldung. Genau dieser Zwischenstand und die Schwellen 1, 10 und 25 sind jetzt explizit geprüft und sichtbar dargestellt.

[Filmkarriere und XP](Filmkarriere-und-XP.md) · [Prüfbericht](Pruefbericht.md)

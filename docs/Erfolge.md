# Erfolge und Erfolgsstufen

## Filmkarriere innerhalb der Erfolge – lokal

„Deine Erfolge“ beginnt im Profil mit der Filmkarriere: aktueller Titel und Level, XP-Fortschritt, nächster benannter Rang einschließlich fehlender XP und alle acht Rangembleme. Die frühere separate Karriereklappe entfällt. Anschließend folgen die bisherigen Erfolgsreihen mit ihren zwölf Erfolgsstufen. Für die Karriereanzeige werden keine zusätzlichen Serverdaten benötigt; sie bleibt auch bei einem Fehler der Erfolgsabfrage sichtbar.

Karriereembleme verwenden den eigenen gemeinsamen goldenen Filmstreifenring mit Lorbeer und Band sowie acht große, plastische Innenmotive. Dasselbe Rangmotiv erscheint bei Aufstiegen, in den kompakten Karriereanzeigen, der Sammlung und den Ranglisten. Offene Ränge sind neutral mit explizitem Status, der aktuelle Rang zusätzlich markiert. Die acht Karriereembleme zählen nicht doppelt zu den übrigen Erfolgsmeilensteinen. Titel und Grenzen sind im [Karrierevertrag](Filmkarriere-und-XP.md#levelkurve-und-karrieretitel) definiert. Noch nicht veröffentlicht.

**21.10.2026 – Seit Version 83 veröffentlicht:** Die unten datiert dokumentierten lokalen Änderungen sind jetzt Teil des öffentlichen Main-Stands. [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-21-Version-83.json).

## Gemeinsame Embleme und gleichwertige Feier – 17.10.2026

**Lokal umgesetzt, noch nicht veröffentlicht.** [Nutzerauftrag](<../KI-Wissen-Wissensquiz/01 Rohquellen/2026-10-17 Nutzerauftrag gemeinsame Erfolgsembleme.txt>). Gleichzeitig erreichte Erfolge, Karrierelevel und Filmreise-Freischaltungen erscheinen gleichwertig als einzelne Emblemkarten untereinander. Es gibt kein übergeordnetes großes Gewinner-Motiv mehr. Bei mehreren Ereignissen lautet die gemeinsame Überschrift „Das hast Du erreicht!“. Jede Karte besitzt denselben Aufbau, dieselbe Emblemgröße und denselben gestalterischen Stellenwert. Der bestehende höchste Erfolgsrang steuert weiterhin genau ein Ton-/Haptiksignal und die begrenzte Feuerwerksanimation; er bestimmt keine visuelle Rangfolge der Karten.

`AchievementIcon` zeichnet die gemeinsame skalierbare Medaille mit Metallverlauf, dunklem Innenfeld, Lorbeer, Band und kräftigem Motiv. Zwölf Stufen bleiben durch ihre Farben, Rangpunkte und ausgeschriebenen Stufennamen erkennbar. Offene Ziele verwenden eine gedämpfte neutrale Palette und tragen weiterhin ihren textlichen Status. Wiederholt dargestellte Medaillen besitzen eigene SVG-Verlaufs-IDs, damit sich die Farben innerhalb langer Profilübersichten nicht gegenseitig überschreiben.

Feierdialog, Profil-Erfolgsübersicht, Sammlung und Entdeckeranzeigen verwenden dieselben Motive und Stufenfarben. Im Profil sind die Embleme in geschlossenen Reihen und besonders auf den einzelnen Meilensteinkarten größer. Karrierelevel verwenden die acht eigenen Rangmotive aus `CareerIcon` in Feier und Karriereanzeigen; Bekanntheitsgruppen das Kinokartenmotiv, Schwierigkeiten das offene Schloss. `JourneyUnlockIcon` wird sowohl in der Feier als auch unter „Deine Stufenfortschritte“ verwendet. Bekanntheitsgruppe und Schwierigkeit bleiben textlich ausdrücklich getrennt.

Bei langen gemeinsamen Feiern scrollt nur die Emblemliste. Überschrift und „Weiter zum Ergebnis“ bleiben sichtbar, auch bei 320 Pixeln Breite. Fokus auf die Bestätigung, Escape, Rückkehr zur Ergebnisüberschrift und reduzierte Bewegung bleiben erhalten. Erfolgsbedingungen, Schwellen, XP, Lernregeln und Online-Spielstände sind unverändert; keine zusätzlichen Datenabrufe oder Backendänderungen. 17 gezielte Tests, 15 unterschiedliche Browserfälle, TypeScript und Diff-Prüfung erfolgreich. [Prüfnachweis](Pruefbericht.md#17102026--gemeinsame-erfolgsembleme-lokal), [Feier-Vorschau](Erfolgsembleme-2026-10-17/Feier-Mobil.png), [Profil-Vorschau](Erfolgsembleme-2026-10-17/Erfolge-Profil.png).

## Prüfung und Progressionsentscheidung – 15.10.2026

**Seit Version 81 am 15.10.2026 veröffentlicht:** zehn bis zwölf Meilensteine je wachsender Reihe und zwölf unterscheidbare Erfolgsstufen. [Auftrag](<../KI-Wissen-Wissensquiz/01 Rohquellen/2026-10-15 Nutzerauftrag Erfolgsprogression.txt>). Die folgenden Tabellen sind der aktuelle veröffentlichte Vertrag; die Abschnitte ab „Veröffentlichter Ausgangsstand“ dokumentieren die ursprüngliche Fassung. [Veröffentlichungsnachweis Version 81](Veroeffentlichung-2026-10-15-Version-81.json).

Die Stufen sind **I Bronze, II Silber, III Gold, IV Platin, V Diamant, VI Saphir, VII Smaragd, VIII Rubin, IX Amethyst, X Meister, XI Legende, XII Film-Olymp**. Die Position des Meilensteins bestimmt den Rang; Reihen mit zehn Zielen enden bei Meister. Jede Entdecker-Medaille hat jetzt eine eigene Stufe. Rangpunkte sind für zwölf Stufen auf zwei Reihen verteilt; Signale bleiben auf höchstens fünf Feuerwerksimpulse begrenzt. Karrierelevel und Titelkurve ändern sich nicht.

| Reihe | Meilensteine in Stufenreihenfolge |
| --- | --- |
| Immer eine Runde weiter | 1, 10, 25, 50, 100, 250, 500, 1.000, 2.500, 5.000, 10.000, 25.000 |
| Perfekte Zehnerrunden | 1, 10, 25, 50, 100, 200, 350, 500, 750, 1.000, 1.500, 2.500 |
| Erfahrung gesammelt | 100, 500, 1.000, 5.000, 10.000, 25.000, 50.000, 100.000, 150.000, 250.000, 500.000, 1.000.000 EXP |
| Filmkenner | 1, 10, 25, 50, 100, 200, 350, 500, 750, 1.000 |
| Filmkenner je Genre | 1, 3, 5, 10, 15, 25, 40, 50, 75, 100 |
| Sicher gewusst | 1, 10, 25, 50, 100, 250, 500, 1.000, 2.500, 5.000, 10.000, 12.500 |
| Wissen, das bleibt | 10, 25, 50, 100, 250, 500, 1.000, 2.500, 5.000, 7.500, 10.000, 12.500 |
| Entdecker-Medaillen | 50, 100, 250, 500, 1.000, 2.500, 5.000, 10.000, 12.500, 15.000, 20.000, 25.000 |
| Gesichter des Kinos | 1, 10, 25, 50, 100, 150, 200, 300, 400, 500 |
| Preiswissen | 1, 3, 5, 10, 15, 25, 40, 50, 75, 100 |
| Über den Tellerrand | 1, 2, 3, 4, 5, 7, 9, 10, 12, 15 |

Alle 34 lokalen App-Pakete mit dem bestehenden Parser und der lokalen Erfolgsprojektion ausgewertet, ohne Kontodaten: **13.781 Fakten, 1.215 geeignete Filmthemen, zwölf Genres mit 83 bis 135 Filmthemen, 412 geeignete Personenthemen und 67 Preisthemen**. Das sind Themen mit mindestens einem leichten Ziel gemäß Erfolgsvertrag; nicht die Zahl aller Metadateneinträge oder einzelner Preise.

100 sichere Fakten entsprechen nur etwa 0,73 Prozent des Bestands; die bisherigen 100 Filme rund 8,2 Prozent. Die neuen höchsten sicheren/gefestigten Faktenziele liegen bei rund 90,7 Prozent, das höchste Filmziel bei rund 82,3 Prozent. Kumulierte Runden und EXP erhalten längere Reihen, weil Wiederholung ihren Wert weiter erhöhen kann. Perfekte Zehnerrunden steigen langsamer als bloß abgeschlossene Runden. Begrenzte Kategorien erhalten kleinere Zwischenschritte statt derselben Tausenderziele; ein vollständig erlerntes Genre darf seine Reihe abschließen. Keine Verlängerung durch mehrfaches Zählen derselben Fakten.

Alle bisherigen Erfolgs-IDs und Schwellen bleiben enthalten. Zwischenziele bei Genre-, Preis- und Breitenreihen können den angezeigten Rang anheben; bestehende Ziele und Abzeichen entfallen nicht. Die alten Entdeckerziele ab 2.500 erhalten eigene höhere Ränge. Der vorhandene Höchststand genügt für die erweiterten Profilanzeigen. Neue Dialogmeldungen entstehen weiterhin nur beim Überschreiten einer Schwelle in einer Runde; das Profil feiert bereits überschrittene neue Ziele nicht rückwirkend.

Ziele oberhalb des Bestands bleiben als Ausbauziele bestehen, darunter 15 Genres und 500 Personenthemen. Auch die nächste Zielüberschrift weist nun ausdrücklich auf benötigte weitere Inhalte hin. EXP und Runden sind unbegrenzt kumulierbar; höhere EXP-Abzeichen tragen deshalb nicht mehr irreführend „Mit weiteren Inhalten“. Die einmalige Nulltreffer-Auszeichnung und das bestehende besondere Sci-Fi-Abzeichen bleiben einzeln.

Zähldimensionen bleiben getrennt: sichere Fakten, gefestigte Fakten, Begegnungen, vollständige leichte Themen, Genrebreite, Runden und EXP. Keine zusätzlichen EXP-Belohnungen. Für die Erfolgsprogression war keine zusätzliche Datenbankänderung erforderlich; seit Version 81 veröffentlicht. Bedingungen, Höchststände, Kontotrennung und Vergabewege entsprechen dem bestehenden Vertrag unten. [Gezielte lokale Prüfung](Pruefbericht.md#15102026--erweiterte-erfolgsprogression-lokal).

## Veröffentlichter Ausgangsstand

**Veröffentlicht am 13.10.2026 um 00:35:53 Uhr Europe/Berlin:** gemeinsame Erfolgsstufen, Film-/Genre-/EXP-Reihen, bedarfsgerechte Profilansichten und inkrementelle Zähler aktiv. Jede produktive SQL-Aktivierung bestätigt innerhalb derselben Transaktion unveränderte Antworten, Kontoköpfe, Generationen und kanonische XP-Beiträge. Native synthetische Zähler-/Differenz-/Höchststands-/Beleg-/Rechteprüfung vollständig zurückgerollt. Der zusätzliche Ansichtsabruf während einer noch laufenden Antwort ist gesperrt; neun gezielte Browserfälle bestätigen Wiederholung und Profilfehler. [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-13-Version-77.json). Die historischen lokalen Prüfgrenzen unten bleiben als Messgrenzen bestehen.

## Stand – 13.10.2026

Seit **Version 77** öffentlich verfügbar; App und alle drei privaten SQL-Projektionen gemeinsam aktiviert. Erweitert die mit Version 75 veröffentlichten Level- und Zehnerrundenmeldungen. [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-13-Version-77.json). [Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-12%20Nutzerauftrag%20Erfolgssystem.txt).

## Gemeinsamer Vertrag

Ein Erfolg besteht aus stabiler ID, Erfolgsreihe, Zielwert, kurzem Namen, Bedingung, Motiv und Stufe. Die fünf Stufen sind **I Bronze, II Silber, III Gold, IV Platin und V Diamant**. Die Position des Meilensteins bestimmt die Stufe; bei den acht bestehenden Entdecker-Zielen tragen die letzten vier das Diamantmotiv mit ihrem jeweiligen Zielwert. Stufe und Bedingung stehen als Text dabei; Farbe allein trägt keine Information. Definitionen liegen zentral in `src/achievements.ts` und `src/learningAchievements.ts`, Darstellung und Signale in `src/successTiers.ts`.

| Erfolgsreihe | Meilensteine / Stufen I bis V | Motiv | Zählregel |
| --- | --- | --- | --- |
| Immer eine Runde weiter | 1, 10, 25, 50, 100 | Filmklappe | Abgeschlossene Runden über alle Spielarten und Fragenbereiche; auch kurze Runden. Aktive und abgebrochene Runden zählen nicht. |
| Perfekte Zehnerrunden | 1, 10, 25, 50, 100 | Stern mit Haken | Genau zehn verschiedene Filmfakten in einer abgeschlossenen Runde, jeweils mit gewählter, sicher richtiger Antwort; keine geratenen Treffer. |
| Heute war nicht mein Tag | 1 / Bronze | Regenwolke | Eine vollständig beantwortete Zehnerrunde ohne richtige Antwort. „Keine Ahnung“ zählt als Antwort; Zeitablauf, verkürzte und abgebrochene Runden nicht. |

Das ist der ursprüngliche Spielkatalog mit elf Erfolgen. Der folgende Lernkatalog erweitert denselben Vertrag. Erfolge verändern weder XP noch Lernstufen, Rekorde oder freigeschaltete Fragen. Eine perfekte Zehnerrunde ist ein Rundenereignis; zehn einzelne richtige Antworten in verschiedenen Runden erfüllen diese Bedingung nicht, können aber den neuen Erfolg „10 Fakten sicher gewusst“ erreichen.

## Filmwissen, Genres und EXP – Erweiterung am 12.10.2026

[Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-12%20Nutzerauftrag%20Weitere%20Erfolge%20und%20EXP.txt). Seit Version 77 öffentlich verfügbar. „EXP“ und das bestehende „XP“ bezeichnen denselben Erfahrungswert; keine zweite Währung und keine Änderung seiner Berechnung.

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

Die kompakte Aktion `learning-achievements` in der bestehenden privaten Ansichts-RPC liefert gespeicherte Zähler und vorbereitete Bestandsgrößen. Katalogzuordnung und Bestandsgrößen werden nur beim Inhaltswechsel aufgebaut. Beim normalen Abschluss werden seit dem letzten Abschluss geänderte Wissensziele und deren betroffene Themen ausgewertet; keine Vollhistorie und kein Katalogdownload an den Browser. Die privaten Tabellen `learning_achievements` und `round_learning_achievements` speichern Höchststände beziehungsweise den ersten Rundenbeleg; zusätzliche private Projektionen halten aktuelle Beiträge für die Differenzbildung. Abschlussprojektion statt Erfolgszählung bei jeder einzelnen Antwort; identische Wiederholung erhält denselben Beleg. Tabellen und Hilfsfunktionen sind direkt für anon/authenticated gesperrt; die autorisierte bestehende RPC liefert nur das eigene Konto.

Migration `20261012201611_learning_achievements.sql` initialisiert aktuelle Generationen aus ihrem aktuellen Format. Sie verändert keine Antworten, Lernstände, Revisionen oder XP und fügt keinen historischen Adapter hinzu. Seit Version 77 produktiv bereitgestellt. PGlite prüft Bedingungen, Rollen, Kontentrennung und Vergabe. Native Aktivierung, vollständig zurückgerollte synthetische Rollen-/Zählerprüfung und Advisors sind im [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-13-Version-77.json) bestätigt.

### Leistungsprüfung am 12.10.2026 – Optimierung noch offen

Historischer Befund zum Stand vor der folgenden Optimierung; die beschriebenen zusätzlichen Katalogdurchläufe sind seit Version 77 ersetzt.

Codeprüfung des lokalen Stands, keine Last- oder Trafficmessung: Die Erfolgsansichten übertragen kompakte Zähler und Rundenbelege statt Katalog oder Kontohistorie. Der gemeinsame Ansichts-Cache hält identische Anfragen bei unveränderter Kontorevision 30 Sekunden im Arbeitsspeicher und bündelt gleichzeitige Abrufe. Icons, Ton, Haptik und Animation werden im Browser erzeugt.

Die neue Berechnung ist dennoch nicht vollständig inkrementell: `learning_achievement_progress` durchläuft den gesamten aktuellen Metadatenkatalog bei jedem relevanten Rundenabschluss und jedem frischen Abruf von `learning-achievements`. Beim Profilabruf werden auch aktuelle Zähler berechnet, obwohl anschließend die gespeicherten Höchststände zurückgegeben werden. `ProfileStats` fordert Statistik, Lernübersicht und Lernerfolge bereits beim Einhängen an, auch bei geschlossenen Klappen. Kompakte Antworten begrenzen den Traffic, beseitigen aber diese Serverarbeit nicht.

Offene Verbesserungen: katalogabhängige Bestandsgrößen einmal je Inhaltsstand vorbereiten, im Profil gespeicherte Erfolgszähler lesen, beim Abschluss nur betroffene Ziele und Themen fortschreiben und getrennte Profilabrufe bündeln beziehungsweise nach Bedarf laden. Die bisherige Funktionsprüfung ist kein Leistungsnachweis für diese Erweiterung; ältere Messungen des Server-Lernablaufs gelten nicht als Messung der neuen Erfolgsberechnung. In dieser Prüfung keine Implementierung oder Bereitstellung geändert.

### Inkrementelle Erfolgsberechnung und Profilabrufe – lokal am 12.10.2026

Auf ausdrücklichen [Optimierungsauftrag](<../KI-Wissen-Wissensquiz/01 Rohquellen/2026-10-12 Nutzerauftrag Erfolgsberechnung optimieren.txt>) mit Migration `20261012204500_incremental_learning_achievements.sql` umgesetzt:

- Gemeinsame Definitionen für Wissensziele, leichte Themenanforderungen, Genres und Bestandsgrößen entstehen im vorhandenen Betreiberweg `refresh_groups`. Ein Fingerabdruck der zählrelevanten Definitionen verhindert unnötigen Neuaufbau bei unveränderten Inhalten; zusätzliche Fragevarianten verändern diese Definition nicht.
- Die kanonische Wissenszielprojektion markiert geänderte Ziele einmal in einer privaten Wartemenge. Beim nächsten abgeschlossenen Ergebnis werden ihre alten/neuen Faktenbeiträge und betroffenen Film-/Personen-/Preisthemen verglichen. Unveränderte Beiträge werden nicht neu geschrieben. Änderungen aus zuvor abgebrochenen Runden bleiben bis zum nächsten Abschluss vorgemerkt. Sichere Fakten benötigen weiterhin passende Bereichs-/Schwierigkeitsbelege; ein Film in mehreren Genres benötigt sämtliche leichten Anforderungen.
- Aktuelle Beiträge und höchste erreichte Zähler bleiben getrennt. Korrekturen können aktuelle Beiträge senken, ohne Erfolge zurückzunehmen; spätere Wiederherstellung zählt nichts doppelt. Bei einer neuen Kontogeneration oder geänderter Inhaltsdefinition wird die aktuelle Projektion einmal aus den eigenen vorhandenen Lern-/Sicherheitsbelegen aufgebaut. Ein Inhaltswechsel löst beim Profilabruf keinen solchen Neuaufbau aus. Das ist eine Ableitung des aktuellen Formats, kein historischer Adapter.
- EXP summiert die Differenz eines geänderten kanonischen Wissenszielbeitrags in `goal_reward_totals`. Abschluss und Serverantwort lesen diesen einen Gesamtstand; die bisherige Summe über alle Wissenszielbelohnungen entfällt. Formel, Lernregeln, Quelleinträge und Karrierekurve bleiben unverändert.
- Erfolgsabrufe lesen gespeicherte Höchststände und gemeinsame Bestandsgrößen. `summary` zählt die eigenen aktuellen Lernzeilen mit vorbereiteter Zielzuordnung; ungesehene Ziele und Gesamtgrößen werden aus dem gemeinsamen Bestand abgeleitet. Dabei wird kein vollständiger Fragenkatalog mehr durchlaufen. Die detaillierte Lernübersicht bleibt proportional zu den eigenen gelernten Zielen; sie wird nicht als konstante Arbeit behauptet.
- Geschlossene Statistik-/Lern-/Erfolgsklappen im Profil lösen keine eigenen Datenabfragen aus. Beim Öffnen teilen sich Statistik und Erfolge eine kompakte Aktion `profile-progress`; nur die Lernstufenklappe benötigt zusätzlich `summary`. Der bestehende kontogetrennte, revisionsabhängige RAM-Cache bündelt und wiederverwendet diese Abrufe. Fehler werden innerhalb der betroffenen Klappe angezeigt; „Erneut versuchen“ wiederholt nur tatsächlich fehlgeschlagene Abfragen.

Lokale Messung in der isolierten PGlite-Datenbank, je acht Abrufe nach einem Aufwärmabruf, synthetische Metadaten und zwei sichere Ziele: bisherige vollständige Erfolgsberechnung gegenüber neuem gespeicherten Abruf **26,476 ms → 0,719 ms** bei 12.000 und **210,185 ms → 0,727 ms** bei 48.000 Metadatenzeilen. Die Erfolgsantwort blieb in beiden Fällen **350 Byte JSON** groß; diese Ein-Genre-Messung ist keine Größenangabe für den vollständigen echten Erfolgsbestand. Gemessen wurden Datenbankaufrufe ohne HTTP/TLS und keine Mehrbenutzerlast. Aussagekräftig ist auch die strukturelle Prüfung: normale Fortschreibung wertet genau das eine geänderte Ziel aus, der EXPLAIN-Plan greift indiziert auf höchstens zwei Metadatenzeilen zu, und Erfolgs-/Profil-/Lernübersichtsabrufe funktionieren auch bei vorübergehend umbenannter Metadatentabelle im isolierten Test.

Einmalige Initialisierung der aktuellen Kontogenerationen und Inhaltsaufbereitung bleiben Betreiberarbeit. Bestehende Zielhistorien werden weiterhin nur im kanonischen Projektor des betroffenen Ziels ausgewertet; die übrigen Lern-/Filmreisewege sind keine neu gemessene Gesamtlastprüfung. Neue private Tabellen mit RLS und gesperrtem Direktzugriff, keine zusätzlichen öffentlichen Funktionen oder Rechteerhöhungen. Seit Version 77 produktiv aktiviert; native Rollen-/Zählerprüfung und Supabase-Advisors gegenüber dem Ausgangsstand bestätigt. Bestehende Hinweise bleiben bestehen; zwölf zusätzliche private RLS-Tabellen ohne direkte Policies sind beabsichtigt. [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-13-Version-77.json), [lokale Leistungsgrenzen](Pruefbericht.md#12102026--inkrementelle-erfolgsberechnung-und-profilabrufe-lokal).

Die nativen Advisor-Hinweise sind im Nachweis vor/nach der Aktivierung gegenübergestellt. Die zwölf zusätzlichen [RLS-Tabellen ohne Policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) verweigern direkten Zugriff absichtlich. Bestehende Hinweise zu [anonym ausführbaren öffentlichen RPCs](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [angemeldeten RPC-Aufrufen](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [Passwort-Leak-Prüfung](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [Fremdschlüsselindizes](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys) und [ungenutzten Indizes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) sind unverändert; dieser Auftrag ändert keine unabhängigen Auth-Einstellungen.

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

Die höchste gleichzeitig erreichte Stufe bestimmt die Gesamtinszenierung. Einzelne Erfolgskarten behalten ihre eigene Stufe. Karriereaufstiege verwenden die acht Titelbereiche (ab Level 1/3/6/10/15/20/27/35); eine Filmreise-Freischaltung ohne weiteren Erfolg verwendet Bronze. XP-Level und Erfolgsstufe bleiben getrennt benannt.

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

Der neue Trigger läuft als `security invoker` im bereits autorisierten Schreibweg und benötigt keine zusätzliche Rechteerhöhung. Lokale SQL-/Rollenprüfung mit PGlite und native Prüfung bei Veröffentlichung bestanden. Alle zwölf neuen privaten Tabellen haben RLS und verweigern direkte Konten-/Gastzugriffe; zehn geprüfte Helfer bleiben Invoker mit leerem Suchpfad und ohne direkte Ausführungsrechte. Advisors gegenüber dem Ausgangsstand verglichen; [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-13-Version-77.json).

Die konkret gemeldete fehlende Meldung wurde ohne den damaligen persönlichen Rundenstand nicht abschließend rekonstruiert. Der bestehende Vertrag feiert feste Zahlen perfekter Runden; eine weitere perfekte Runde zwischen zwei Schwellen erzeugt keine neue Meldung. Genau dieser Zwischenstand und die Schwellen 1, 10 und 25 sind jetzt explizit geprüft und sichtbar dargestellt.

[Filmkarriere und XP](Filmkarriere-und-XP.md) · [Prüfbericht](Pruefbericht.md)

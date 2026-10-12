# Erfolge und Erfolgsstufen

## Stand – 12.10.2026

Lokal umgesetzt, noch nicht veröffentlicht. Erweitert die mit Version 75 veröffentlichten Level- und Zehnerrundenmeldungen. App und private SQL-Projektion benötigen eine gemeinsame Veröffentlichung. [Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-12%20Nutzerauftrag%20Erfolgssystem.txt).

## Gemeinsamer Vertrag

Ein Erfolg besteht aus stabiler ID, Erfolgsreihe, Zielwert, kurzem Namen, Bedingung, Motiv und Stufe. Die fünf Stufen sind **I Bronze, II Silber, III Gold, IV Platin und V Diamant**. Die Position des Meilensteins bestimmt die Stufe. Stufe und Bedingung stehen als Text dabei; Farbe allein trägt keine Information. Definitionen liegen zentral in `src/achievements.ts`, Darstellung und Signale in `src/successTiers.ts`.

| Erfolgsreihe | Meilensteine / Stufen I bis V | Motiv | Zählregel |
| --- | --- | --- | --- |
| Immer eine Runde weiter | 1, 10, 25, 50, 100 | Filmklappe | Abgeschlossene Runden über alle Spielarten und Fragenbereiche; auch kurze Runden. Aktive und abgebrochene Runden zählen nicht. |
| Perfekte Zehnerrunden | 1, 10, 25, 50, 100 | Stern mit Haken | Genau zehn verschiedene Filmfakten in einer abgeschlossenen Runde, jeweils mit gewählter, sicher richtiger Antwort; keine geratenen Treffer. |
| Heute war nicht mein Tag | 1 / Bronze | Regenwolke | Eine vollständig beantwortete Zehnerrunde ohne richtige Antwort. „Keine Ahnung“ zählt als Antwort; Zeitablauf, verkürzte und abgebrochene Runden nicht. |

Das ist der erste Katalog mit elf Erfolgen. Weitere Reihen ergänzen denselben Vertrag. Erfolge verändern weder XP noch Lernstufen, Rekorde oder freigeschaltete Fragen. Eine perfekte Zehnerrunde ist ein Rundenereignis; zehn einzelne richtige Antworten in verschiedenen Runden erfüllen diese Bedingung nicht.

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

# Sichtbarer Lernfortschritt

Stand: 04.10.2026. Grundfunktion seit Sites-Version 52 veröffentlicht; die folgende Anordnungspräzisierung ist seit Sites-Version 54 ebenfalls veröffentlicht. [Veröffentlichungsnachweis](Sites-Betrieb.md#version-54-gesamter-main-stand-mit-individuellen-fragenvertiefungen).

## Anlass und Entscheidung

Der Nutzer konnte Fehlerpool und langfristige Festigung nicht klar unterscheiden und empfand die groben Status „entdeckt/geübt/gefestigt“ als intransparent und demotivierend. Er bestätigte die Umsetzung des Vorschlags: alle vier vorhandenen Lernstufen sichtbar machen, Zwischenaufstiege in der Rundenauswertung nennen, Wiederholungstermine erklären und frühe sichere Wiederholungen nicht mehr durch eine spätere Festigung beantworten. [Unveränderter Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-04%20Nutzerauftrag%20sichtbare%20Lernstufen.txt).

## Resultierendes Verhalten

- Ein sicherer richtiger Treffer entfernt das Ziel sofort aus dem Fehlertraining. Ein späterer Fehler nimmt es wieder auf. Das ist unabhängig von der langfristigen Festigung und der täglichen Grenze für Lernstufen.
- Nach der Auflösung: Lernstufe 0–4, vier sichtbare Schritte, konkrete nächste Wiederholung mit Abstand sowie Datum/Uhrzeit. Frühe Wiederholungen und die Tagesgrenze erhalten eine Erklärung. Bei gesammelten Lösungen erscheinen die Hinweise erst im unmittelbaren Rundenrückblick.
- Die Sammlung und Themen-/Genrekarten zählen ungesehen, entdeckt und alle vier Stufen. Der Balken wächst bereits mit den Zwischenstufen. Die Sammlung nennt zusätzlich die absolute Zahl erreichter Lernstufen; bei einem großen Bestand bleiben kleine Fortschritte dadurch sichtbar.
- Die Rundenauswertung ergänzt erstmals sicher gelöste Ziele und Ziele mit verbessertem Lernstand einschließlich Stufe 1→2 und 2→3. Fehlerkorrekturen bleiben separat sichtbar.
- Die Sieben-Tage-Grenze zählt ab dem letzten Stufenaufstieg. Tag 0→1→4→11 festigt auch dann, wenn an Tag 10 zusätzlich sicher wiederholt wurde. Tagesgrenzen, Fehler-/Rate-Rücksetzung und die vier Intervalle bleiben erhalten.

## Implementierung und Grenzen

Auf [Nutzerhinweis](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-04%20Nutzerhinweis%20Lernstufe%20am%20Ende.txt) steht die Lernstufe nun ganz am Ende der Antwortauflösung: hinter Erklärung, Vertiefungen, Filmdaten, Merksatz, Quellen und einem eventuellen Ratehinweis, unmittelbar vor den Weiter-/Abschlussaktionen. Dieselbe Reihenfolge gilt im unmittelbaren Rundenrückblick. Es wird ausschließlich die Anordnung verändert.

Die vorhandenen Ereignisse, `stage`, `lastSecure`, `due` und `lastAdvancedDay` reichen aus. Keine neue Speicherung, Migration, Abhängigkeit oder Kompatibilitätslogik. Die normale Neuberechnung verwendet die korrigierte Lernregel auch für vorhandene Ereignisse und deren Lern-XP. Technische Zähler beziehen sich auf eindeutige Wissensziele; Varianten erzeugen keinen zusätzlichen Fortschritt. Der Balken misst erreichte App-Lernstufen und keine diagnostische Wissenssicherheit. Eine falsche oder geratene Antwort kann ihn entsprechend der vorhandenen Rücksetzungsregel verringern.

Die Filmreise bevorzugt weiterhin neue passende Ziele. Ein Lerntermin garantiert deshalb keine automatische Aufnahme in die nächste Filmreise-Runde. Gefestigte Ziele bleiben spielbar. [Führender Lernvertrag](Lernregeln.md#sichtbare-lernstufen--04102026).

## Prüfung

337 Logik-/Datenbanktests insgesamt erfolgreich, ein Zeitüberschreitfall separat nachgeprüft; alle 43 betroffenen Logiktests nach letzter Anpassung erneut bestanden. TypeScript und Produktionsbuild erfolgreich. 19 unterschiedliche relevante Browserfälle bestanden (elf Chromium, acht WebKit/iPhone-Profil); abschließender Zwölferlauf und beide verstärkten Lernstufenfälle gegen den eingefrorenen Build erfolgreich. Geprüft: Stufen und fällige/frühe Wiederholungen, Rundenvorstand und Zwischenaufstiege, Fehlerkorrekturen, gesammelte neutrale Lösungen, mobile Ansichten, Axe/Überlauf, Neuladen und Offline-Speicherung. Mobile Frage-, Ergebnis- und Sammlungsansichten visuell geprüft.

Chromium mit Offline-Neuladen, Windows-WebKit mit Online-Neuladen und anschließendem Offline-Fortsetzen; die zuvor ungeöffnete lazy geladene Sammlung wird wegen einer Windows-WebKit-Prüfgrenze online geprüft. Physische Geräteabnahme weiterhin offen. Browserprofile, Zeit und Kontodienste sind isoliert beziehungsweise kontrolliert; echte Nutzerdaten wurden nicht für Tests verwendet. Keine Veröffentlichung. [Vollständiger Prüfnachweis](Pruefbericht.md#04102026--sichtbare-lernstufen-und-zwischenfortschritt).

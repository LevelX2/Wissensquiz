# Erklärungstiefe und redaktionelle Ergänzungen

## Maßstab

„Etwas tiefer eintauchen“ soll über die kurze Lösung hinausgehen. Figuren, die in Frage, Lösung oder Vertiefung im Mittelpunkt stehen, werden mit ihren Darstellern verbunden. Ergänzungen bleiben knapp und beziehen sich auf den jeweiligen Film und das Erscheinungsjahr. Reine Orts-, Technik-, Kreaturen- oder Regiefragen erhalten keine beliebige komplette Besetzungsliste.

## Prüfung am 26.09.2026

Alle **720 Fragen einschließlich Varianten** aus Sci-Fi, Action, Horror und Fantasy wurden auf diesen Aspekt geprüft: **125 Filme**, **627 Fragen mit ergänzter Vertiefung**, **64 bereits mit den betreffenden Darstellern versehene Fragen**, **29 ohne zusätzliche einzelne gespielte Figur im Mittelpunkt**. Varianten werden einzeln gegen ihren Originalinhalt geprüft, auch wenn sie denselben Kontext teilen.

Der vollständige [Prüfnachweis](Darstellerpruefung.json) enthält für jede Frage die Inhaltsversion, den Inhaltsfingerabdruck, Film/Jahr, zugeordnete Rollen, Ergänzung und Entscheidung; die Filmliste enthält die nachgeschlagenen Quellen. Basis sind die Besetzungsabschnitte der verlinkten Filmartikel, ergänzend der AFI-Katalog zu Conjuring und die offiziellen Back-to-the-Future-Credits. Das ist eine Besetzungsprüfung anhand dieser Quellen, keine unabhängige Sichtung aller Filme oder Prüfung sämtlicher Handlungsaussagen.

Besonders berücksichtigt: Richard Harris/Michael Gambon als Dumbledore, Ian Holm/Martin Freeman als Bilbo, Eddie Izzard/Simon Pegg als Riepischiep, unterschiedliche Michael-Myers-Darsteller, Jasons maskierte/unmaskierte Darstellung, kindliche/erwachsene Figuren, Puppenspiel und digitale Figuren. Originalstimmen sind ausdrücklich als solche bezeichnet; deutsche Synchronstimmen werden damit nicht behauptet.

Die leichte Conjuring-Frage `HOR-L-045` nennt Patrick Wilson als Ed Warren, Vera Farmiga als Lorraine Warren, Ron Livingston als Roger Perron und Lili Taylor als Carolyn Perron. Die Ergänzungen zu den anderen Fragen passen zu den jeweils angesprochenen Figuren; Bathsheba wird Joseph Bishara zugeordnet. [AFI-Besetzung](https://catalog.afi.com/Catalog/MovieDetails/69558), [Filmartikel](https://en.wikipedia.org/wiki/The_Conjuring).

## Rohinhalt, Anzeige und Pflege

`src/castEditorial.json` enthält ausschließlich die ausgelieferten Ergänzungen samt Quellen und Schutzschlüsseln. `src/filmDetails.ts` prüft Fragen-ID, Originalversion, Originaltitel/Jahr und einen Fingerabdruck von Frage, Kurzlösung und Kontext. Fremde oder geänderte Imports erhalten dadurch keine unpassenden Ergänzungen. Die redaktionellen Entscheidungen werden ausdrücklich gepflegt; es gibt keine automatische Namensvermutung zur Laufzeit.

Die Ergänzung erscheint erst nach der Antwort in der zunächst geschlossenen Vertiefung und im Rundenrückblick. Roh-CSV, importierte Frageversionen und historische Rundensnapshots bleiben unverändert. Bestehende passende Runden zeigen den Zusatz nach dem App-Update ohne Datenmigration. Die Texte gehören zum Offline-Build; Quellenlinks benötigen Netz. Der JSON-Spielstand enthält weiter die Originalfragen, während die redaktionellen Zusätze zur App-Version gehören.

Bei künftigen Inhaltsänderungen die betroffenen Quellen erneut prüfen, den Eintrag im Prüfnachweis und im Laufzeitbestand gemeinsam aktualisieren und die Versions-/Inhaltsprüfung in `tests/editorial.test.ts` ausführen. Neue CSV-Pakete benötigen eine eigene redaktionelle Prüfung.

# Bestätigte Fragenkorrekturen

Die drei Korrekturen sind seit Sites-Version 52 (04.10.2026) veröffentlicht, auch im öffentlichen Katalog für neue Duelle. Laufende Duellsnapshots bleiben erhalten. [Veröffentlichungsnachweis](Sites-Betrieb.md#version-52-gesamter-main-stand-mit-sichtbarem-lernfortschritt).

## Redaktionelle Folgerungen

Im persönlichen Skill `wissensquiz-fragen-redigieren` sind beide Fehlerfälle ausdrücklich verankert: Fragetext, Titel und Antwortoptionen gemeinsam auf verratene Lösungen beziehungsweise eindeutigen Ausschluss durch die Formulierung prüfen. Eine leichte Frage benötigt weiterhin eigenes Wissen.

Neuentwicklung, Überarbeitung und Prüfung orientieren sich an Spielspaß, verständlichem Kontext und Wissensfestigung. Bei handelnden Filmfiguren den Originaldarsteller häufig schon im Fragetext nennen; dies ist eine Empfehlung, kein Zwang. Bei sehr bekannten Filmen und Figuren darf die Angabe bewusst entfallen. Bei schwierigeren Fragen und spezielleren Themen ist Kontext besonders hilfreich. Gesuchte Schauspielernamen bleiben vor der Antwort verborgen. Skill-Quelle und lokale Installation sind synchron und formal validiert.

Fragen und Erklärungen sollen, wo es dem Wissensziel hilft, Handlungsabläufe und Figurenbeziehungen verständlich machen, damit sich die Zusammenhänge beim Spielen besser einprägen. Bei Doppelrollen deutlich zwischen Schauspieler und Figuren unterscheiden und relevante Verwechslungen oder Veränderungen erklären. Anschauliche Szenen und Produktionsanekdoten ergänzen das Verständnis der Handlung. Diese [Nutzerpräzisierung](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-04%20Nutzerhinweis%20Handlungszusammenhaenge.txt) ist in der Skill-Quelle und der lokalen Installation ergänzt und formal validiert.

## Hangover (2009) – 04.10.2026

Die Variante `KOM-L-026-V1` wurde direkt in `public/komoedie-fragen.csv` korrigiert. Die alte Frage nannte Phil, Stu und Alan bereits als Suchende und schloss damit drei Antwortoptionen aus. Bestätigte neue Fassung:

**„Hangover“ (2009): Wer ist nach dem Junggesellenabschied verschwunden?**

- Stu – der Zahnarzt
- Phil – der Trauzeuge
- Alan – der Mitreisende
- Doug – der Bräutigam – richtig

Die Zusätze hinter den Namen bleiben auf Nutzerwunsch erhalten. Die vier Antwortfeedbacks passen zur neuen Fassung. Frage-/Wissensziel-ID, Lösungsschlüssel und alle übrigen CSV-Zeilen bleiben gleich; die ursprüngliche Lieferung ist unverändert erhalten. Keine neue Kompatibilitätslogik oder Migration.

## Planet der Affen (1968) – 04.10.2026

Der Nutzer hat die folgende leichte Frage als Ersatz für die Frage nach den herrschenden Wesen bestätigt. Der Filmtitel verriet bei der alten Fassung bereits die passende Antwort; die neue Fassung fragt die Stellung der Menschen ab.

**„Planet der Affen“ (1968): Wie behandelt die herrschende Affengesellschaft die Menschen?**

- Als wilde Tiere – richtig
- Als gleichberechtigte Bürger
- Als angesehene Wissenschaftler
- Als religiöse Autoritäten

Menschen werden gejagt, gefangen gehalten und für Experimente eingesetzt. Der [AFI-Katalog](https://catalog.afi.com/Film/22314-PLANET-OFTHEAPES) belegt die Gefangennahme, die Käfighaltung und die geplanten Experimente sowie Taylors Sprachfähigkeit. Die Besetzung von Taylor und Zira steht in den Credits desselben Eintrags. Die Vertiefung erläutert die Umkehrung der Rollen; alle vier Antwortoptionen erhalten ein eigenes Feedback.

Die Frage `SF-202609-P02-L-014` wurde direkt in `public/scifi-ergaenzung-fragen.csv` korrigiert: Frage, vier Antworten, Lösung, Wissenszieltext, Erklärung, Vertiefung, Antwortfeedback, Merksatz und Quellenangabe. Frage- und Wissensziel-ID bleiben erhalten. Alle übrigen CSV-Zeilen sind unverändert.

Die ursprüngliche Lieferung unter `KI-Wissen-Wissensquiz/01 Rohquellen/SciFi_Ergaenzung_360_Fragen.csv` bleibt als Rohquelle erhalten. Die öffentliche Basisdatei ist seit dieser ausdrücklich bestätigten Redaktion für genau einen Datensatz eine bearbeitete Fassung. Die vorhandenen Prüfungen berücksichtigen diese konkrete Abweichung und den aktualisierten Katalogfingerabdruck.

Auf ausdrückliche Nutzerpräzisierung erfolgt die Korrektur ohne neue Kompatibilitätslogik, Adapter, Migration oder Sonderbehandlung älterer Spiele. Die damalige Basisdatenkorrektur wurde zunächst lokal abgeschlossen und im anschließenden Gesamtauftrag als Version 52 veröffentlicht.

Prüfnachweis: [Prüfbericht](Pruefbericht.md).

## Der große Diktator (1940) – 04.10.2026

Die Frage `KOM-202609-P02-L-074` wurde in `public/komoedie-ergaenzung-fragen.csv` präzisiert:

**„Der große Diktator“ (1940): Welchen Beruf hat die von Charlie Chaplin gespielte Figur, die am Ende mit Diktator Hynkel verwechselt wird?**

Die richtige Antwort bleibt **Friseur**. Die Erklärung unterscheidet Chaplins zwei Figuren ausdrücklich: Diktator Hynkel verfolgt die jüdische Bevölkerung, der jüdische Friseur gehört selbst zu den Verfolgten. Nach seiner Flucht aus einem Konzentrationslager wird der Friseur für Hynkel gehalten und hält an dessen Stelle die Schlussrede für Menschlichkeit und Demokratie. Die [offizielle Chaplin-Inhaltsbeschreibung](https://www.charliechaplin.com/en/films/7-The-Great-Dictator/articles/93-The-Great-Dictator-Synopsis) belegt die Doppelrolle, Flucht, Verwechslung und Rede.

Frage, Wissenszieltext, kurze Erklärung, Vertiefung, Antwortfeedback, Merksatz, Spoilereinstufung und Quellenangaben passen zum klargestellten Zusammenhang. Frage-/Wissensziel-ID, Antwortoptionen und Lösungsschlüssel bleiben erhalten. Alle übrigen Datensätze und die ursprüngliche Rohquelle bleiben unverändert.

Prüfnachweis: [Prüfbericht](Pruefbericht.md).

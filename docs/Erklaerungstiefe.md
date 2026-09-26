# Erklärungstiefe und redaktionelle Ergänzungen

## Maßstab aus dem Nutzerfeedback

„Etwas tiefer eintauchen“ soll über die kurze Lösung hinausgehen. Stehen Figuren im Mittelpunkt, sollen die betreffenden Rollen nach Möglichkeit mit ihren Schauspielern genannt werden. Die gelieferten CSV-Pakete erfüllen dies bisher unterschiedlich; eine vollständige redaktionelle Prüfung aller vier Genres steht noch aus.

## Geprüfte Ergänzung: Conjuring – Die Heimsuchung (2013)

Die leichte Frage `HOR-L-045` fragt nach Ed und Lorraine Warren. Ihr ursprünglicher Kontext erläutert das Paar, nennt jedoch keine Darsteller. Das ist eine Inhaltslücke in der gelieferten CSV, kein Ausblenden durch die Horror-Oberfläche.

Am 26.09.2026 anhand der [Besetzung im AFI-Filmkatalog](https://catalog.afi.com/Catalog/MovieDetails/69558) geprüft:

| Figur | Schauspieler |
| --- | --- |
| Ed Warren | Patrick Wilson |
| Lorraine Warren | Vera Farmiga |
| Roger Perron | Ron Livingston |
| Carolyn Perron | Lili Taylor |

Diese Zuordnungen erscheinen bei den sechs enthaltenen Fragen zu diesem Film in der aufklappbaren Vertiefung nach der Antwort, mit direktem Quellenlink. Sie gelten für den Spielfilm und treffen keine Aussage über die Realität übernatürlicher Ereignisse.

## Trennung von Rohinhalt und Ergänzung

`src/filmDetails.ts` enthält separat gepflegte Angaben mit Prüfdatum und Quelle. Zuordnung nach Originaltitel und Erscheinungsjahr, damit Remakes und Fortsetzungen nicht vermischt werden. Die Ergänzung wird nur in der Erklärung angezeigt; Roh-CSV, importierte Frageversionen und historische Rundensnapshots bleiben unverändert. Daher ist sie nach dem App-Update auch in bestehenden gespeicherten Runden sichtbar, ohne Migration von Spielständen. Der Text wird mit der App offline ausgeliefert; der externe Quellenlink benötigt Internet.

Die übrigen Horror-Erklärungen und die anderen Genres wurden dadurch nicht pauschal fachlich geprüft oder ergänzt. Weitere Lücken sind anhand verlässlicher Besetzungsquellen zu bearbeiten.

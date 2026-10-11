# Profilklappen und Entfernung des Merksatzes

Seit 11.10.2026 als **Version 67 öffentlich veröffentlicht**. [Gemeinsamer Nachweis](Veroeffentlichung-2026-10-11-Version-67.json). Auftrag: [unveränderte Nutzerquelle](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-11%20Nutzerauftrag%20Profilklappen%20und%20Merksatz.txt).

Die Profilseite verwendet die goldenen, illustrierten Klappen der Frageseite mit denselben 62 Pixel hohen Kopfzeilen, 40 Pixel großen dekorativen Bildern, Richtungspfeilen, Fokusmarkierungen und nativer Maus-/Tastaturbedienung. Filmkarriere, Lernstand, Spielstatistik, Konto & Speicherung und Problem-/Verbesserungsmeldung beginnen geschlossen. Die Filmkarriere nennt das aktuelle Level bereits in der Kopfzeile. Optionen und Hilfe bleiben direkt erreichbar. Bei erneutem Seitenbesuch beginnen die Klappen geschlossen; Öffnen und Schließen verändern keinen Spielstand. Datenschutz- und Speicherhinweise stehen gemeinsam im Kontobereich.

Der Merksatz entfällt aus der gemeinsamen Antwortdarstellung einschließlich Rundenrückblick und Duellauflösung. Erklärung, Vertiefung, Filmdaten, Quellen und Lernfortschritt bleiben vorhanden. Die Hilfe beschreibt den Ablauf ohne Merksatz. Quelldatenfelder bleiben unverändert erhalten; kein Eingriff in Fragen-IDs, Lernregeln oder Online-Speicherung.

## Bildsymbole

Drei neue Symbole wurden mit dem eingebauten Imagegen-Werkzeug erstellt, mit `public/disclosures/learning.png` als reiner Stilreferenz. Die Originale bleiben am Erzeugungsort; finale transparente PNGs mit 160 × 160 Pixeln liegen unter `public/disclosures/`:

| Datei | Motiv | Profilbereich |
| --- | --- | --- |
| statistics.png | Drei Balken und Rundinstrument | Spielstatistik |
| account.png | Wolke und Schloss | Konto & Speicherung |
| report.png | Sprechblase und Stift | Problem oder Verbesserung melden |

Die vorhandenen Motive `film.png` und `learning.png` stehen für Filmkarriere und Lernstand. Bilder haben leere Alternativtexte; die Beschriftung der Klappe liefert den zugänglichen Namen.

## Originalprompts

### statistics.png

Use case: stylized-concept. Asset type: one compact illustrated UI icon for a film quiz. Primary request: three distinct ascending teal bar-chart columns with ivory tops on a polished gold base, a small round gold-rimmed gauge alongside, representing personal game statistics. Reference image is STYLE REFERENCE ONLY: match the dimensional ivory enamel, deep petrol teal and polished warm gold metal, realistic highlights and sculptural shading. One single centered isolated object composition, bold recognizable silhouette readable at 40 pixels. Square canvas, fill about 85% with comfortable margins. Slight three-quarter perspective. Transparent background. No lettering, numbers, stars, badges, frame, scenery, watermark or extra symbols. Cohesive with the supplied UI illustration.

### account.png

Use case: stylized-concept. Asset type: one compact illustrated UI icon for a film quiz. Primary request: a polished teal cloud with a prominent ivory padlock with a warm gold shackle, representing a private safely saved online account. Reference image is STYLE REFERENCE ONLY: match the dimensional ivory enamel, deep petrol teal and polished warm gold metal, realistic highlights and sculptural shading. One single centered isolated object composition, bold recognizable silhouette readable at 40 pixels. Square canvas, fill about 85% with comfortable margins. Slight three-quarter perspective. Transparent background. No lettering, numbers, stars, badges, frame, scenery, watermark or extra symbols. Cohesive with the supplied UI illustration.

### report.png

Use case: stylized-concept. Asset type: one compact illustrated UI icon for a film quiz. Primary request: a single ivory speech bubble with gold edging and a chunky teal pencil resting diagonally against it, representing reporting a problem or suggesting an improvement. Reference image is STYLE REFERENCE ONLY: match the dimensional ivory enamel, deep petrol teal and polished warm gold metal, realistic highlights and sculptural shading. One single centered isolated object composition, bold recognizable silhouette readable at 40 pixels. Square canvas, fill about 85% with comfortable margins. Slight three-quarter perspective. Transparent background. No lettering, numbers, stars, badges, frame, scenery, watermark or extra symbols. Cohesive with the supplied UI illustration.


## Prüfung

Prüfergebnisse werden im [Prüfbericht](Pruefbericht.md) geführt. Neue Browserfälle prüfen bei 320 und 1280 Pixeln alle fünf Klappen, geladene Bildsymbole, Enter/Leertaste, Richtungspfeile, erreichbare Konto-/Meldungsaktionen, WCAG-Automatik, unveränderte Spieldaten und geschlossenen Zustand beim Rückweg.


## Optionsbereinigung und Übernahme

Der Nutzer hat den offenen Profil-/Optionsauftrag für die gemeinsame Main-Veröffentlichung übernommen. Entfernt sind manuelle JSON-Sicherung/Wiederherstellung, Export historischer lokaler Meldungen sowie die doppelten Infoblöcke „Dein Lernpaket“ und „So wächst Dein Wissen“. Spielbezogene Einstellungen und automatische Online-Speicherung bleiben bestehen. Der bestehende bewusst bestätigte Neustart mit Eingabe „LÖSCHEN“ bleibt verfügbar; keine echten Konten werden hierfür zurückgesetzt.

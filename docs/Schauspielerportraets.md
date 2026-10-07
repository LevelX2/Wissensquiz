# Schauspielerporträts nach der Antwort

07.10.2026 – **Wechselnde Fotos ergänzt:** Die 200 Erkennungsfragen verwenden je zwei verschiedene Fotos, insgesamt 400. Frühere Schaffensperioden ergänzen die vorhandenen Aufnahmen. Auswahl pro Fragerunde, gleiches Foto vor und nach der Antwort, beim Fortsetzen und im Rundenrückblick. [Bildpaare, Quellen und aktueller Prüfnachweis](Schauspieler-Bilderkennung-2026-10-07/Bildvarianten.md).

07.10.2026 – **200 neue Bild-Erkennungsfragen lokal ergänzt:** Bei diesen ausdrücklich beauftragten Fragen erscheint das charakteristische Porträt vor der Namensauswahl. Alternativtext und Bildnachweis verraten den Namen erst nach der Antwort. 24 vorhandene Fotos wiederverwendet, 176 weitere frei lizenzierte beziehungsweise gemeinfreie Dateien eingebunden und für offline bereitgestellt. Die nachfolgend dokumentierten 25 Fotos bei normalen Personenfragen bleiben erhalten. [Paket, Bildrechte und Prüfung](Schauspieler-Bilderkennung-2026-10-07/Pruefbericht.md).

Stand: 04.10.2026. Auf Nutzerwunsch 25 vorhandene Schauspielerpersonen mit Fotos als Auflockerung ergänzt. Seit Sites-Version 55 veröffentlicht; [Betriebsnachweis](Sites-Betrieb.md#version-55-porträts-lösungsanzeige-antworttöne-und-github-meldeformulare).

## Anzeige und Zuordnung

Das Porträt erscheint in der Antwortauflösung unter dem Personennamen, vor der Erklärung. Richtige Antworten, falsche Antworten und „Keine Ahnung“ erhalten dieselbe Bildanzeige. Die gemeinsame Erklärung stellt das Bild auch in der Filmreise und im unmittelbaren Rundenrückblick bereit. Vor der Antwort bleibt das Foto verborgen.

Die Zuordnung erfolgt ausschließlich über die vorhandene `person_id` und den übereinstimmenden `person_name`. Die 25 Personen haben jeweils acht vorhandene Fragen; damit sind 200 bestehende Fragen illustriert. Fragen anderer Personen bleiben ohne Foto. Es werden keine Filmfragen über beiläufig genannte Schauspielernamen bebildert.

`src/actorPortraits.json` enthält Bildpfad, tatsächliche Abmessungen, Fotograf beziehungsweise vorgeschriebene Namensnennung, Commons-Dateititel, Quelle, Lizenz und Änderungshinweis. `ActorPortrait.tsx` bindet die Angaben als Text und Links ein. Externes HTML aus den Quellen wird nicht ausgeführt.

## Dateien, Bildrechte und Offlinebetrieb

Alle 25 Dateien sind auf Wikimedia Commons ausdrücklich mit CC BY beziehungsweise CC BY-SA freigegeben. Verwendet werden die jeweils dort bereits bereitgestellten Porträtfassungen; einige sind schon auf Commons zugeschnitten. Der Download übernimmt die JPEG-Dateien unverändert. Die angeforderte Vorschau mit 400 Pixeln wird vom Commons-Server tatsächlich als 500 Pixel breite Datei geliefert; in der App sind die gemessenen Abmessungen hinterlegt. Kein zusätzlicher Zuschnitt oder Retusche.

Die Fotos liegen unter `public/portraits/` und umfassen zusammen **1.807.768 Bytes**, etwa 1,81 MB. Die Anzeige begrenzt die Höhe auf 190 Pixel und die Breite auf 160 Pixel; das Seitenverhältnis bleibt erhalten. Ein direkt unter dem Foto erreichbarer „Bildnachweis“ nennt Fotograf, Lizenz mit Link, Commons-Dateiseite, Dateititel und Verkleinerung beziehungsweise bereits vorhandenen Zuschnitt. Besondere Zuschreibungen an WikiPortraits und der von Martin Kraft angegebene Fotografenlink sind übernommen. CC BY-SA gilt für die jeweiligen Bilddateien und etwaige Bildbearbeitungen.

Die Urheberlizenz ist keine pauschale Freigabe aller Persönlichkeitsrechte. Die ausgewählten Fotos zeigen öffentliche Veranstaltungs-/Interview-/Porträtkontexte; sie werden sachlich zur betreffenden Person im Lernquiz eingesetzt. Eine individuelle Einwilligung der abgebildeten Personen ist damit nicht behauptet. Führende Hinweise: [Commons zur Wiederverwendung](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.de) und [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.de). Die genaue Lizenzversion steht bei jedem Bild.

Die Bilder werden zusammen mit den App-Dateien ausgeliefert. `scripts/build-sw.mjs` nimmt JPEG-Dateien in den vollständig geprüften Offline-Cache auf. Beim Spielen ist kein Abruf bei Wikimedia oder einem anderen Bildanbieter erforderlich. Bilddateien und Bildnachweise bleiben getrennt vom privaten Spielstand. Die vorhandenen Frage-/Wissensziel-IDs, CSV-Dateien und Bewertungsregeln werden durch die Bildanzeige nicht verändert.

## Herkunft und Nachweise

- [Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspielerportraets-2026-10-04/Nutzerauftrag.txt)
- [Unveränderte Commons-API-Antwort mit vollständigen Bildmetadaten](../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspielerportraets-2026-10-04/Commons-imageinfo.json)
- [Zuordnung, Download-URLs, tatsächliche Abmessungen, Dateigrößen und SHA-256-Prüfsummen](../KI-Wissen-Wissensquiz/01%20Rohquellen/Schauspielerportraets-2026-10-04/Nachweis.json)

Die Metadaten aller 25 Dateien wurden ausgewertet, die Porträts als gemeinsame Kontaktübersicht visuell geprüft und die Namenszuordnungen mit dem vorhandenen Schauspielerbestand abgeglichen.

## Prüfung

**342 Logiktests in 58 Dateien**, TypeScript und Produktionsbuild erfolgreich. Der Bildtest prüft alle 25 Zuordnungen und je acht vorhandene Fragen, zulässige Lizenzversionen sowie die SHA-256-Identität der unveränderten JPEG-Dateien mit den Downloadnachweisen. Alle 25 Lizenz-/Fotografenangaben zusätzlich gegen die ursprüngliche API-Antwort abgeglichen. Der Fragenkatalog behält die Kennung `fb8615bdb752106dbaf9d8979854a106586cfde4959043024f289bc439c5a759`.

**Zehn unterschiedliche Browserfälle erfolgreich**, fünf in Chromium und fünf in WebKit mit iPhone-Profil. Geprüft: kein Foto vor der Antwort; Foto nach richtiger, falscher und Nichtwissensantwort; andere Personen ohne Foto; korrekte Urheber-/Lizenzlinks; 320-Pixel-Ansicht ohne Überlauf; Axe-Prüfung ohne Verstöße; Neuladen und Fortsetzen. Die 25 Porträts und beide Antwortansichten mit geschlossenem/geöffnetem Bildnachweis visuell geprüft.

Chromium bestätigt das echte Offline-Neuladen sowie das Laden aller 25 Bilder über ihre normalen App-URLs. Windows-WebKit zeigt in der Offline-Simulation interne Ladefehler auch für vorhandene SVG-/PNG-Dateien und Blob-URLs. Deshalb bestätigt dieser Nachweis die mobile Anzeige und das Online-Neuladen sowie anschließend bei abgeschaltetem Netzwerk die exakte Dateigröße und SHA-256-Prüfsumme aller 25 JPEG-Dateien im Cache. Eine vollständige Offline-Anzeige auf einem physischen iPhone ist damit nicht geprüft. Acht Browserfälle bestanden im gemeinsamen Lauf; die zwei WebKit-Porträtfälle anschließend mit dieser ausdrücklich begrenzten Prüfung.

Prüfung gegen eine isolierte Kopie des erfolgreichen Porträtbuilds auf Port 43683, Offline-Paket `film-46b39a9219ed` mit 86 Dateien. Isolierte Browserprofile, kontrollierte Testzeit und synthetischer Kontodienst; keine echten Nutzerdaten. Grundlage ist Main-Commit `4fca70c` mit den Porträtänderungen. Die während der Prüfung parallel entstandenen Änderungen an Antwort-/Rundenabläufen gehören nicht zu diesem Buildnachweis.

Der erste Logiklauf hatte zwei Fehler in unveränderten Bestandsprüfungen: Windows-Dateizugriff auf einen Importbericht und die 5-Sekunden-Zeitgrenze einer Datenbankprüfung. Der vollständige Lauf mit einem Worker bestand danach mit allen 342 Tests. Importberichte im erneuten Pakettest wurden getrennt unter dem ignorierten Testverzeichnis geschrieben. Formatierung und `git diff --check` erfolgreich. Keine Abhängigkeitsänderung; bekannte Buildgrößenhinweise bleiben.

## Enthaltene Personen und Bildnachweise

| Person | Fotograf / Namensnennung | Lizenz | Quelle |
| --- | --- | --- | --- |
| Tom Hanks | [Raph_PH](https://commons.wikimedia.org/wiki/File:TomHanksPrincEdw031223_(11_of_41)_(cropped).jpg) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:TomHanksPrincEdw031223_(11_of_41)_(cropped).jpg) |
| Leonardo DiCaprio | [Raph_PH](https://commons.wikimedia.org/wiki/File:LeoPTABFI191125-28_(cropped).jpg) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:LeoPTABFI191125-28_(cropped).jpg) |
| Brad Pitt | [Harald Krichel](https://www.wikidata.org/wiki/Q640) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Brad_Pitt-69858.jpg) |
| Denzel Washington | [Gabriel Hutchinson / WikiPortraits](https://commons.wikimedia.org/wiki/User:Gabriel_Hutchinson) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg) |
| Morgan Freeman | [Peabody Awards](https://commons.wikimedia.org/wiki/File:Morgan_Freeman_in_2022.jpg) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Morgan_Freeman_in_2022.jpg) |
| Harrison Ford | [Kevin Paul](https://commons.wikimedia.org/wiki/User:PaulLim11) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Harrison_Ford_-_Televerse_2025-03.jpg) |
| Tom Cruise | [Kevin Paul](https://commons.wikimedia.org/wiki/User:PaulLim11) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Tom_Cruise_at_53rd_Saturn_Awards_2026-01.jpg) |
| Keanu Reeves | [Gabriel Hutchinson / WikiPortraits](https://commons.wikimedia.org/wiki/User:Gabriel_Hutchinson) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Keanu_Reeves_at_TIFF_2025_02_(Cropped).jpg) |
| Arnold Schwarzenegger | [Bernhard Holub](https://commons.wikimedia.org/wiki/User:Dromedar61) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Arnold_Schwarzenegger_-_Austrian_World_Summit_2026_BHO-2906.jpg) |
| Will Smith | [TechCrunch](https://www.flickr.com/people/52522100@N07) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:TechCrunch_Disrupt_San_Francisco_2019_-_Day_1_(48834070763)_(cropped).jpg) |
| Christoph Waltz | [LucaFazPhoto](https://commons.wikimedia.org/wiki/User:LucaFazPhoto) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Christoph_Waltz_at_82nd_Venice_International_Film_Festival-1_(cropped).jpg) |
| Daniel Brühl | [Martin Kraft](https://photo.martinkraft.com/) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:MJK_68238_Daniel_Br%C3%BChl_(Berlinale_2020).jpg) |
| Jackie Chan | [Segolene Liger](https://commons.wikimedia.org/wiki/User:Segolene_Liger) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Jackie_Chan.jpg) |
| Meryl Streep | [Ministry of culture, sports and Tourism- Lee Jeong-woo](https://commons.wikimedia.org/wiki/File:Meryl_Streep-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194765350_(cropped1).jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Meryl_Streep-_Press_conference_for_the_film_%22The_Devil_Wears_Prada_2%22_-_55194765350_(cropped1).jpg) |
| Julia Roberts | [Colleen Sturtevant](https://commons.wikimedia.org/wiki/User:Colleen_Sturtevant) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Julia_Roberts_2025.jpg) |
| Sandra Bullock | [Kevin Paul](https://commons.wikimedia.org/wiki/User:PaulLim11) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Sandra_Bullock_at_The_Egyptian_Theatre_2024.jpg) |
| Jodie Foster | [Bryan Berlin](https://commons.wikimedia.org/wiki/User:Berlination) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Jodie_Foster_Taxi_Driver_Tribeca_Festival_2026-20_(cropped).jpg) |
| Nicole Kidman | [Martin Kraft](https://photo.martinkraft.com/) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:MKr384262_Nicole_Kidman_(Women_In_Motion,_Cannes_2025).jpg) |
| Cate Blanchett | [Harald Krichel](https://www.wikidata.org/wiki/Q640) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Cate_Blanchett-63298_(cropped_2).jpg) |
| Kate Winslet | [Colleen Sturtevant](https://commons.wikimedia.org/wiki/User:Colleen_Sturtevant) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:KateWinslet_(cropped).jpg) |
| Natalie Portman | [Colleen Sturtevant / WikiPortraits](https://commons.wikimedia.org/wiki/User:Colleen_Sturtevant) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:NataliePortman.jpg) |
| Scarlett Johansson | [Harald Krichel / WikiPortraits](https://www.wikidata.org/wiki/Q640) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Scarlett_Johansson-8588.jpg) |
| Penélope Cruz | [Colleen Sturtevant](https://commons.wikimedia.org/wiki/User:Colleen_Sturtevant) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Penelope_Cruz_Venice_Film_Festival.jpg) |
| Michelle Yeoh | [Harald Krichel](https://www.wikidata.org/wiki/Q640) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:Michelle_Yeoh-2268.jpg) |
| Franka Potente | [Martin Kraft](https://photo.martinkraft.com/) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons-Datei](https://commons.wikimedia.org/wiki/File:MJK_335110_Franka_Potente_(NRW-Empfang,_Berlinale_2019).jpg) |

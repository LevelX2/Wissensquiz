# Organisation der Fragedaten

Stand: 03.10.2026, lokal umgesetzt. Die Grundstruktur passt zum aktuellen Bestand: 17 Quellenpakete, 5.677 eindeutige Fragen, 5.147 Wissensziele und 530 ausdrücklich verknüpfte Varianten. Fragenidentität, Wissensziel, Genre, Zusatzkategorie und historische Inhaltsversion haben unterschiedliche Aufgaben und bleiben getrennt. Alle Pakete sind strukturell gültig und bytegleich mit ihren Rohquellen. Die Prüfung bewertet Organisation und Speicherung; sie bestätigt keine neuen fachlichen Filmaussagen.

## Quellen und Zuständigkeiten

- `KI-Wissen-Wissensquiz/01 Rohquellen/` erhält die unveränderten gelieferten CSVs und ergänzenden Quellen.
- `public/` enthält die auslieferbaren CSVs. Diese Kopien sind für den statischen Offlinebetrieb erforderlich; sie sind keine zweite Redaktion.
- `src/packages.ts` führt die Pakete und den gemeinsamen Katalogaufbau. `src/importer.ts` prüft Querverweise, erhält Originalspalten und überschreibt keine bestehenden IDs.
- Filmwissen und redaktionelle Anzeigen bleiben separat nach stabiler Film-/Fragenidentität zugeordnet. Laufende und historische Runden behalten vollständige Snapshots.
- `src/catalogCodec.ts` kodiert den lokalen Katalog verlustfrei; `src/localCatalog.ts` übersetzt zwischen Speicherlayout und vollständigem App-Zustand. Die Speichertransaktionen liegen weiterhin in `src/storage.ts`.

## Lokales Speicherlayout

Die IndexedDB-Datenbank `wissensquiz` verwendet jetzt Datenbankversion **2** und weiterhin den Store `state`. Das öffentliche Spielstand-/JSON-Schema bleibt **1**. Unter `current` bzw. dem bisherigen Kontoschlüssel liegt der Fortschritt mit Einstellungen, Runden, Ereignissen, Importberichten und einem Katalogverweis. Unter `catalog:<Spielstandschlüssel>` liegt der zugehörige Fragenkatalog als JSON-Zeichenfolge mit Kodierung `json-field-refs-v1`. Gast und Konten haben unabhängige Katalogeinträge, damit eigene Importe und Wiederherstellungen getrennt bleiben.

Der Katalog wird beim Lesen vollständig rekonstruiert. Exakt gleiche Metadatenwerte verweisen auf bereits vorhandene Fragefelder; etwa ein nochmals enthaltenes `explanation_short` auf die normalisierte Erklärung. Abweichende Originalwerte, eigene Importspalten, leere Felder, Zahlen als Text und die Reihenfolge der Metadaten bleiben erhalten. Die Werte und ihre Feldpositionen bilden einen versionierten Kodierungsvertrag. IDs, Versionsfingerabdrücke und fachliche Originaldaten ändern sich dadurch nicht.

Schreibtransaktionen lesen Fortschritt und Katalog gemeinsam, wenden die Änderung an und vergleichen den exakten kodierten Kataloginhalt. Nur ein veränderter Katalog wird erneut geschrieben. Die Fortschrittsänderung und eine gegebenenfalls erforderliche Katalogänderung werden in derselben Transaktion bestätigt oder gemeinsam zurückgerollt. Es gibt keinen dauerhaften Cache, der Änderungen aus einem anderen Fenster übersehen könnte.

Bestehende Vollstände bleiben lesbar und werden erst bei einer erfolgreichen Schreibtransaktion in das neue Layout überführt. Ein fehlender oder unlesbarer referenzierter Katalog führt zu einem Fehler, nicht zu einem leeren Ersatzstand. Bestehende Synchronisierungsbelege und Rückfallkopien bleiben erhalten. Datenbankversion 2 verhindert, dass ältere Builds, die ausdrücklich Version 1 öffnen, das neue Layout schreiben. Vor der Nutzung eines veröffentlichten Updates müssen alte Quiz-Fenster geschlossen werden. Die aktuellen JSON-Exporte und Online-Sicherungen enthalten weiterhin den vollständigen logischen Zustand und alle historischen Inhalte.

## Speicherbedarf und Zugriff

Der öffentliche Katalog benötigt als UTF-8-JSON jetzt **13.248.306 statt 18.058.574 Bytes**: **4.810.268 Bytes bzw. 26,64 % weniger**. Dabei werden 82.963 doppelte Metadatenwerte durch Verweise dargestellt. Dies misst die Nutzdaten; die interne Speicherquote eines Browsers enthält zusätzliche Verwaltungsdaten und ist nicht identisch mit diesen Werten.

Zusätzlich wurde in einem frischen isolierten Chromium-Profil die vom Browser geschätzte IndexedDB-Belegung verglichen. Eine Vollkopie desselben Katalogs mit leerem Fortschritt erhöhte `navigator.storage.estimate().usageDetails.indexedDB` um **3.915.776 Bytes**, die getrennte Darstellung um **3.080.192 Bytes** (rund **21,3 % weniger**). Jeweils 500 ms nach Transaktionsabschluss gemessen; Cache- und Service-Worker-Belegung blieben dabei gleich. Diese Browserabschätzung ist kein plattformübergreifender Nachweis der tatsächlichen Dateigröße.

In der isolierten Browsermessung mit dem vollständigen Katalog und noch ohne gespielte Runden schrumpft die pro Einstellungsänderung geschriebene Fortschrittsnutzlast von rund **18,07 MB auf 10,65 KB**. Der unveränderte Katalog wird dabei nicht erneut geschrieben. Historische Runden vergrößern die Fortschrittsnutzlast weiterhin; die Messung ist keine konstante Größe für jeden Spielstand.

Die sieben abwechselnden Messungen pro Browser nach Aufwärmen im abschließenden Browserlauf ergaben für unveränderten Katalog ungefähr **125/132 ms** vorher/nachher in Chromium und **138/111 ms** in WebKit. Ein pauschaler Geschwindigkeitsgewinn beim gesamten Speichern lässt sich daraus nicht ableiten: Lesen, Rekonstruktion und Inhaltsvergleich benötigen weiterhin Zeit. Die Trennung reduziert vor allem Schreibvolumen und Kataloggröße.

Für wachsende Historien sind gezielte Zugriffspfade verbessert:

- Die Sicherungsprüfung verwendet Maps für Frage-, Runden- und Ereignis-IDs statt wiederholter vollständiger Listensuchen. Die Inhalts- und Punktprüfungen bleiben gleich.
- Der Filmfragenaufbau ordnet Fragen einmal nach Film zu, statt den Katalog für jeden Film erneut zu filtern.
- Die Rekordberechnung summiert Ereignispunkte einmal je Runde, statt alle Ereignisse für jede Rekordrunde erneut zu durchsuchen.
- Beim Rundenstart wird die letzte verwendete Frage einmal je ID ermittelt. Neue Solorunden kopieren nur vorhandene Lernstände der ausgewählten, höchstens zehn Wissensziele in `before`.

Die temporären Maps benötigen zusätzlichen Arbeitsspeicher, vermeiden aber wiederholte Suchläufe und müssen nicht versioniert oder bei Importen dauerhaft aktualisiert werden. Historische `before`-Maps und die schrittweise eintreffenden Duellsnapshots bleiben erhalten. Die Rundenauswertung benötigt nur die zur jeweiligen Runde gehörenden Ausgangslernstände; die Gleichheit der Auswertung ist geprüft.

Ein lokaler Vergleich mit rekonstruierten bisherigen Suchschleifen und identischen Inhalten ergab für die vollständige Sicherungsprüfung **327 → 206 ms** bei 300 synthetischen Runden/3.000 Ereignissen. Der wiederholte Filmfragenabgleich im bestehenden Katalog benötigte **109 → 8 ms**. Je fünf abwechselnde Messungen nach Aufwärmen, Median, Node/Vite-Laufzeit; die Ergebnisse belegen die vermiedenen Suchläufe auf diesem Rechner und sind keine zugesicherte Gerätelatenz. Beide Prüfvarianten lieferten denselben rekonstruierten Spielstand.

## Prüfung und Grenzen

Abschließender Nachweis: **208 Logik-/Persistenz-/Datenbanktests**, Produktions-Build und **alle 116 Browserfälle** erfolgreich (95 Chromium, 21 WebKit). Der vollständige Browserlauf prüft den bestehenden Gesamtarbeitsstand einschließlich Konten, Gastmodus, Fragenpaketen, Sicherungen, Duellen, Rekorden, Lernfortschritt und Offlinebetrieb. `git diff --check` ohne Befund; 175 lokale Dokumentationsverweise der betroffenen Seiten auf vorhandene Ziele geprüft.

`npm run check:questions` wertet alle öffentlichen Quellen mit dem tatsächlichen App-Parser aus, prüft Bytegleichheit der Quellen, eindeutige IDs, Importkonflikte und Sicherungsvalidierung sowie die exakt gleiche JSON-Rekonstruktion des kompakten Katalogs. Das Ergebnis steht in [Fragedaten-Pruefung.json](Fragedaten-Pruefung.json). Die Prüfung verwendet keine privaten Spielerdaten.

Zusätzliche Tests prüfen Datenbankupgrade, Altclient-Sperre, Vollstandmigration, fehlende Kataloge, gleichzeitige Änderungen, Rückrollen nach einem Katalogschreibversuch, getrennte Konten, eigene Metadaten, Jahresantwortvarianten und gleiche Rundenauswertung mit begrenztem `before`. Die Browserprüfung verwendet den tatsächlichen Speicher-Code in isolierten Profilen; Chromium prüft außerdem Offline-Antwort und Neuladen. Offline-Navigation des Windows-WebKit-Testbrowsers bleibt wegen dessen internem Navigationsfehler unbestätigt.

Weitere Normalisierung historischer Fragensnapshots wäre möglich, würde aber ihren unabhängigen Inhaltsschutz und die Migration komplexer machen. Sie wird erst bei belegtem Bedarf vorgesehen. Quellen und Rückfallkopien werden nicht zur Platzersparnis gelöscht. Eine Veröffentlichung ist nicht Teil dieser lokalen Strukturänderung.

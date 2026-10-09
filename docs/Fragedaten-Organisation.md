# Organisation der Fragedaten

## Veröffentlichter Bestand – 09.10.2026, Version 58

**33 Pakete, 12.773 Fragen und 12.207 Wissensziele.** Genreausbau mit 237 zusätzlichen Filmfassungen und 1.896 Fragen vollständig veröffentlicht. Onlinekatalog `35ba8d20e83b30f5b285abc115ff69f1f416ffde0b44d945840548f18cc8721d` mit allen Nachweisen und Bewertungsfeldern geprüft, sechs frühere Releases erhalten und keine Bereitstellungsteile offen. Duellkatalog 10.943 aktive Fragen; bisherige 9.047 Fragen unverändert. [Betrieb und Katalognachweise](Sites-Betrieb.md#version-58-genreausbau-und-fällige-wiederholungen). Die nachfolgenden datierten Bestände dokumentieren die früheren Stände.

07.10.2026 – **320 Einträge und 2.480 Fragen lokal ergänzt:** Je 20 neue Einträge in allen 16 Auswahlkategorien. Gesamt **24 Pakete, 10.877 Fragen und 10.315 Wissensziele**; 8.837 Filmfragen, 1.760 Personenfragen für 220 Personen und 280 Preisfragen. Filmauswahl vorrangig aus der persönlichen Sammlung; Einzelbesitzangaben bleiben privat. Seit Sites-Version 57 veröffentlicht. [Redaktion, Lesefassung und Prüfnachweise](Erweiterung-2026-10-07/Pruefbericht.md).


## Früherer veröffentlichter Bestand – 06.10.2026, Version 56

**20 Pakete, 8.197 Fragen, 7.653 Wissensziele und 544 Variantenbezüge.** Die 240-Filme-Ergänzung ist das letzte Paket und verwendet eine bestehende Nomadland-Regieidentität aus dem Personenpaket. Ihr App-CSV ist bytegleich zur gesonderten Redaktionsquelle; die Quellenprüfung löst diesen Pfad ausdrücklich auf. [Integration, Filmdaten und Abgrenzungen](Filmfragen-Ergaenzung-2026-10-06/Integration.md).

Aktueller öffentlicher Serverkatalog: `628460bcd19115a855850aa7ff1953cd5989387c358edd1616085a09e26c5adb`, 8.197 Fragen/Nachweise/Bewertungsfelder. Vier frühere Releases bleiben erhalten. Verlustfreier Katalogrücklauf und Sicherungsprüfung bestanden; der [aktuelle Organisationsnachweis](Fragedaten-Pruefung.json) umfasst alle 20 Pakete. Vollständiges Frage-JSON 25.909.209 Bytes, kompakter Katalog 18.826.672 Bytes, Einsparung 27,34 Prozent. Dies sind Nutzdatenmengen, keine Browser-Speicherquoten oder allgemeine Zeitmessung. Die folgenden Abschnitte dokumentieren frühere Rolloutstände.

## Schauspieler-Ergänzungen und offizieller Rekordpool – 03.10.2026

Der damalige Gesamtbestand umfasst **19 Pakete, 6.277 Fragen, 5.734 Wissensziele und 543 Varianten**. Darunter sind **1.400 Schauspielerfragen für 175 Personen** einschließlich P02/P03. Die ursprünglichen 17 Paket-CSV waren beim Import bytegleich mit ihren Rohquellen. Am 04.10.2026 sind 20 ausdrücklich dokumentierte Datensätze redigiert (drei bereits veröffentlichte Korrekturen plus 17 in Block 1); die Rohquellen bleiben erhalten. [Redaktion und Grenzen](Fragenkorrekturen.md#bestandsredaktion-block-1--04102026). Die beiden neuen App-CSV werden reproduzierbar aus den erhaltenen Redaktions-JSONs abgeleitet; Original- und Ableitungsprüfsummen stehen im [Integrationsbericht](Schauspieler-Ergaenzungen-Integration.json). Sie werden ausdrücklich als Ableitungen geprüft, ohne sie als gelieferte Roh-CSV auszugeben.

`npm run check:questions` prüft beide Quellentypen, eindeutige IDs, fehlerfreie Importe und den exakten Sicherungs-/Katalogrücklauf. Der aktuelle [Prüfbericht](Fragedaten-Pruefung.json) verwendet dafür `question-organization-audit-v2`. Offizielle Rekordpools enthalten auch Varianten mit Bezug auf Fragen aus anderen Paketen. Beim Upgrade werden die Paketquellen einmal vollständig zur Zuordnung geprüft; abweichende eigene Fragen mit gleichen IDs bleiben erhalten.

Der Serverkatalog `c976df8caf9146bb7bc6903ff94ce07382ea15596785b65116e3c57d13cc9fa2` umfasst den vollständigen damaligen Bestand. Frühere Releases bleiben verfügbar, solange Kataloge oder noch vollständige Runden sie referenzieren. Archivierte Runden benötigen nur ihre Wertungsfakten und keine alten Fragentexte. [Gesamtintegration](Gesamtintegration-2026-10-03.md).

## Verkürzte Rundenergebnisse – Version 46

Der unmittelbare Ergebnisrückblick enthält weiterhin Fragen und Erklärungen. Danach werden geschlossene lokale Runden auf Wertungs- und Lernfakten verkürzt; spätere Fragenrückblicke entfallen. Aktive Runden, Ergebnispunkte, XP, Lernstände und Ereignis-IDs bleiben erhalten. Kontosynchronisierung und JSON-Sicherungen tragen den optionalen Archivvertrag; Details und Objektfreigaben unter [Rekordmodi](Rekordmodi-und-Zeitranglisten.md#ergebnisarchive-statt-späterer-fragenrückblicke). Die nachfolgende Rolloutbeschreibung dokumentiert den Ausgangsstand bis Version 45 mit vollständigen Rundensnapshots; für geschlossene Live-Runden hat die neue Regel Vorrang.

## Kontokatalog und Eintragsspeicherung – Rollout am 03.10.2026

Die aktuelle lokale Datenbankversion ist **3**. Gaststände behalten das getrennte v2-Kataloglayout im Store `state`; migrierte Konten erhalten `entryHeads`, `entryRows`, `entryObjects`, `syncOutbox`, `syncReleases` und `entryMigrations`. Speicherlayout und Protokoll haben eigene Versionen; vollständige JSON-Sicherung bleibt Schema 1.

Offizielle Kataloge entstehen durch den vollständigen tatsächlichen App-Importer einschließlich generierter Fragen, Kategoriezuordnung und Metadaten. Exakt gleicher Inhalt bekommt eine unveränderliche SHA-256-Version. Ein Konto referenziert zusammenhängende Ausschnitte und seine privaten Ergänzungen statt tausender Zuordnungszeilen oder einer vollständigen Kopie. Fehlende/abweichende Inhalte bleiben private SHA-256-Objekte mit verlustfreiem Kodierungsvertrag; historische öffentliche Releases werden durch Kontoreferenzen erhalten.

Rundensnapshots und tatsächliche Jahresalternativen bleiben eigenständige ursprüngliche Inhalte. Große alte `round.before`-Maps werden vollständig erhalten und immutable referenziert. Normale Antworten hashen/komprimieren nicht den ganzen Katalog oder Gesamtstand erneut. Die Schema-Normalisierung vor Inhaltsnachweisen verhindert künstliche Änderungen durch unterschiedliche JSON-Feldreihenfolge; Metadatenwerte und Antwortreihenfolge bleiben erhalten.

`scripts/prepare-sync-catalog.mjs` erzeugt lokal geprüfte Operatorartefakte aus öffentlichen Quellen; keine Produktionsverbindung. Der vorhandene kleinere Duellkatalog ist kein Ersatz für den vollständigen App-Katalog. Eigene Importe dürfen nicht in öffentliche Releases gelangen.

[Implementierung und Messung](Speicher-und-Sync-Abnahme.md), [Migrationsvertrag](Speicher-und-Sync-Migration.md), [Produktionsnachweis](Speicher-und-Sync-Produktion.md). Die nachfolgende Beschreibung und Größenmessung dokumentieren die bisherige v2-Organisation und bleiben als Ausgangsnachweis erhalten.

Stand: 03.10.2026, lokal umgesetzt. Die Grundstruktur passt zum aktuellen Bestand: 17 Quellenpakete, 5.677 eindeutige Fragen, 5.147 Wissensziele und 530 ausdrücklich verknüpfte Varianten. Fragenidentität, Wissensziel, Genre, Zusatzkategorie und historische Inhaltsversion haben unterschiedliche Aufgaben und bleiben getrennt. Alle Pakete sind strukturell gültig und bytegleich mit ihren Rohquellen. Die Prüfung bewertet Organisation und Speicherung; sie bestätigt keine neuen fachlichen Filmaussagen.

## Quellen und Zuständigkeiten

- `KI-Wissen-Wissensquiz/01 Rohquellen/` erhält die unveränderten gelieferten CSVs und ergänzenden Quellen.
- `public/` enthält die auslieferbaren CSVs. Diese Kopien sind für den statischen Offlinebetrieb erforderlich; sie sind keine zweite Redaktion.
- `src/packages.ts` führt die Pakete und den gemeinsamen Katalogaufbau. `src/importer.ts` prüft Querverweise, erhält Originalspalten und überschreibt keine bestehenden IDs.
- Filmwissen und redaktionelle Anzeigen bleiben separat nach stabiler Film-/Fragenidentität zugeordnet. Laufende und historische Runden behalten vollständige Snapshots.
- `src/catalogCodec.ts` kodiert den lokalen Katalog verlustfrei; `src/localCatalog.ts` übersetzt zwischen Speicherlayout und vollständigem App-Zustand. Die Speichertransaktionen liegen weiterhin in `src/storage.ts`.
- `src/questionSchema.ts` und `src/backupSchema.ts` definieren die Laufzeitverträge. Die öffentlichen TypeScript-Typen in `src/model.ts` werden daraus abgeleitet; `src/backupValidation.ts` prüft fachliche Zuordnungen und historische Wertungen unabhängig vom Speicherzugriff. `storage.ts` exportiert den bisherigen Validator weiterhin für bestehende Verbraucher. Grenzwerte, Standardwerte und Sicherungsschema 1 bleiben unverändert.

## Lokales Speicherlayout

Die IndexedDB-Datenbank `wissensquiz` verwendet jetzt Datenbankversion **2** und weiterhin den Store `state`. Das öffentliche Spielstand-/JSON-Schema bleibt **1**. Unter `current` bzw. dem bisherigen Kontoschlüssel liegt der Fortschritt mit Einstellungen, Runden, Ereignissen, Importberichten und einem Katalogverweis. Unter `catalog:<Spielstandschlüssel>` liegt der zugehörige Fragenkatalog als JSON-Zeichenfolge mit Kodierung `json-field-refs-v1`. Gast und Konten haben unabhängige Katalogeinträge, damit eigene Importe und Wiederherstellungen getrennt bleiben.

Der Katalog wird beim Lesen vollständig rekonstruiert. Exakt gleiche Metadatenwerte verweisen auf bereits vorhandene Fragefelder; etwa ein nochmals enthaltenes `explanation_short` auf die normalisierte Erklärung. Abweichende Originalwerte, eigene Importspalten, leere Felder, Zahlen als Text und die Reihenfolge der Metadaten bleiben erhalten. Die Werte und ihre Feldpositionen bilden einen versionierten Kodierungsvertrag. IDs, Versionsfingerabdrücke und fachliche Originaldaten ändern sich dadurch nicht.

Schreibtransaktionen lesen Fortschritt und Katalog gemeinsam, wenden die Änderung an und vergleichen den exakten kodierten Kataloginhalt. Nur ein veränderter Katalog wird erneut geschrieben. Die Fortschrittsänderung und eine gegebenenfalls erforderliche Katalogänderung werden in derselben Transaktion bestätigt oder gemeinsam zurückgerollt. Für die zusammengeführte Antwortoptimierung gibt es zusätzlich einen schreibgeschützten Katalogcache. Eine optionale Revision im Katalogverweis erlaubt bestätigten Antworten, nur Fortschritt und Existenz des Katalogschlüssels zu lesen. Inhaltsänderungen vergeben atomar eine neue Revision; ältere Clients ohne Revision lösen eine vollständige Inhaltsprüfung aus. Vollständige Lesevorgänge vergleichen weiterhin die exakte JSON-Zeichenfolge. Das vorhandene Speicherformat und die Metadatenkodierung bleiben erhalten.

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

Weitere Normalisierung historischer Fragensnapshots wäre möglich, würde aber ihren unabhängigen Inhaltsschutz und die Migration komplexer machen. Sie wird erst bei belegtem Bedarf vorgesehen. Quellen und Rückfallkopien werden nicht zur Platzersparnis gelöscht. Auf anschließenden Nutzerauftrag am 03.10.2026 mit dem gesamten aktuellen App-Stand als Sites-Version 38 veröffentlicht. 208 Tests und Build erneut bestanden, zusätzlich alle 19 gezielten Konten-/Katalogbrowserfälle gegen genau das Veröffentlichungsartefakt erfolgreich. [Veröffentlichungsnachweis](Sites-Betrieb.md).

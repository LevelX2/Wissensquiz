# Vorschläge zur Speicher- und Synchronisierungsoptimierung

Stand: 03.10.2026. Analyse und Änderungsvorschläge; Anwendung, Produktionsdatenbank und veröffentlichte Site wurden nicht verändert. Die [Kapazitätsprüfung](Infrastruktur-und-Kapazitaet.md) beschreibt den bestehenden Betrieb.

## Ergebnis

Gezielte Änderungsübertragung ist mit dem vorhandenen Supabase-Dienst möglich. Der größte erste Schritt ist, den unveränderten Fragenkatalog aus jeder Kontosicherung herauszunehmen. Für weniger belegten Datenbankplatz muss derselbe offizielle Katalog außerdem gemeinsam statt pro Konto gespeichert werden. Danach sollten Antworten, Runden und Einstellungen getrennt gespeichert und nur geänderte Einträge übertragen werden. Ranglisten benötigen kleine vorberechnete Statistiken.

Nur ein kleineres HTTP-Paket zu senden und anschließend wieder das gesamte bisherige JSON-Feld zu ersetzen würde zwar Verkehr sparen, aber einen erheblichen Teil der Datenbankschreibarbeit erhalten. Deshalb gehören Übertragungsprotokoll und Speicherlayout zusammen.

## Gemessene Ausgangslage und Entwurf

[Analyseprogramm](../scripts/analyze-storage-sync.mjs) und [vollständige Messwerte](Speicher-und-Sync-Analyse.json) verwenden ausschließlich die öffentlichen 5.677 Fragen sowie synthetische Spielstände. Das Programm verwendet die echten Import-, Spiel-, Sicherungs- und Kompressionsmodule. Es prüft vollständige Cloud-Rekonstruktion, verlustfreie Katalogkodierung, Sicherungsvalidierung und die exakte Rekonstruktion nach vorgeschlagenen Änderungen.

| Abgeschlossene synthetische Runden | Bisheriger vollständiger Online-Stand | Fortschritt mit Katalogverweis | Eine Antwort als Änderungsübertragung |
| --- | ---: | ---: | ---: |
| 0 | 3.057.517 Bytes | 10.665 Bytes | 2.758 Bytes |
| 10 | 3.149.358 Bytes | 102.506 Bytes | 4.670 Bytes |
| 100 | 4.034.754 Bytes | 987.902 Bytes | 4.692 Bytes |
| 300 | 6.024.262 Bytes | 2.977.410 Bytes | 6.067 Bytes |

Eine Einstellung benötigt im Entwurf 450 Bytes, die nachträgliche Markierung einer richtigen Antwort als geraten 803–935 Bytes. Die Antwortpakete enthalten bereits die gesamte betroffene kompakte Runde, den geänderten Antwortdatensatz, betroffene Lernstände und weitere geänderte Zustandsfelder. Sie sind damit ein konservativer Entwurf gegenüber einem noch kleineren Paket mit einzelnen Rundenfeldern. Für den Vergleich einer einzelnen Antwort gehören außerdem die Daten der aktiven Runde zum bisherigen vollständigen Stand; die zweite Spalte zeigt den jeweiligen Ausgangsstand mit abgeschlossener Historie.

Bei 100 Runden entfallen rund 3,05 MB der 4,03 MB auf den Katalog. Dessen Trennung spart hier etwa 75,5 % des regelmäßigen Volluploads; bei einem neuen Konto etwa 99,65 %. Der gemessene Änderungsentwurf spart bei einer einzelnen normalen Antwort mehr als 99 % gegenüber dem bisherigen vollständigen Upload. Erstimport und Geräte-Erstabruf bleiben größere Übertragungen.

Auch eine Übernahme der vorhandenen verlustfreien Metadatenkodierung in die Cloudkompression bringt etwas: Der gzip/base64-Katalog schrumpft im synthetischen Lauf von 3.046.892 auf 2.519.480 Bytes, rund 17,3 %. Dieser kleinere Schritt löst weder die pro Konto vorhandene Katalogkopie noch die wiederholte Übertragung.

Die synthetischen Runden verwenden festgelegte Zeiten, kontrollierte Fehler und Rate-Korrekturen sowie dieselbe zufällige Auswahlsequenz. Die erste Runde enthält fünf, spätere Runden zehn Fragen. Es handelt sich um JSON-Nutzdaten ohne HTTP-Header und ohne Messung physischer PostgreSQL-Belegung. Die JSON-Größe wächst in diesem Beispiel um ungefähr 10 KB je Zehnerrunde; das ist keine konstante Größe für reale Historien, eigene Importe oder alte vollständige `before`-Maps. Der Entwurf ist kein fertiges Synchronisationsprotokoll und kein Lasttest.

## Vorschläge nach Priorität

| Schritt | Konkrete Änderung | Hauptnutzen | Aufwand und Grenze |
| --- | --- | --- | --- |
| 1 | Katalog getrennt, unveränderlich und nach Inhalt adressiert speichern | Kein erneuter Katalogupload bei jeder Antwort; weniger Schreibarbeit | Mittel; erfordert neues Cloudformat und Migration |
| 2 | Offizielle Katalogversionen gemeinsam verwenden; eigene Importe privat halten | Weniger Datenbankplatz pro Konto | Mittel bis hoch; exakte Inhalts- und Versionszuordnung nötig |
| 3 | Runden, Antworten und kleine Kontofelder getrennt speichern; Änderungen atomar synchronisieren | Übertragungen im KB-Bereich, kein Neuschreiben der gesamten Historie | Hoch; dauerhafte Warteschlange, Revisions- und Wiederholungsschutz nötig |
| 4 | Globale und gefilterte Spielerstatistiken sowie Rekordbeiträge vorberechnen | Ranglisten lesen kleine Ergebnisdaten statt aller Spielstände | Mittel; bestehende Wertungsregeln exakt erhalten |
| 5 | Lokalen Speicher ebenfalls nach Einträgen schreiben; alte Historie optional verlustfrei archivieren | Weniger lokale Schreibarbeit und weiterer Platzgewinn | Nach den Serveränderungen; Archivierung erschwert Abruf und Rekonstruktion |

Schritte 1 und 2 sollten als gemeinsamer erster Speichervertrag vorbereitet werden. Schritt 4 kann unabhängig vom neuen Übertragungsprotokoll vorgezogen werden. Weitere Kompressionsfeinarbeit hat hinter dem Entfernen der großen Wiederholungen geringere Priorität.

## Zielmodell für den Speicher

Vorgeschlagene Tabellen bzw. Bereiche; die Namen sind Entwurfsnamen und keine bereits angelegten Datenbankobjekte:

| Bereich | Inhalt und Eigentum |
| --- | --- |
| `quiz_catalog_releases` | Freigegebene offizielle Katalogversion mit Reihenfolge, Kodierungsvertrag und geprüftem Inhaltsnachweis; gemeinsam lesbar, nur Betreiber schreibt |
| `quiz_private_catalog_objects` | Eigene oder abweichende Inhalte nach Inhaltsnachweis und Konto; keine öffentliche Wiederverwendung privater Importe |
| `quiz_account_heads` | Konto, Synchronisationsrevision, Generation, Katalogverweise und kleine Einstellungen/Legacy-Felder |
| `quiz_saved_rounds` | Rundenkopf, Frageverweise, tatsächliche Antwortreihenfolge, Ausgangslernstände, Freischaltungen und Duellzuordnung |
| `quiz_answer_events` | Antwortdatensätze je Konto/Runde/Wissensziel, einschließlich Zeitpunkt, Zeitbedarf, Keine Ahnung und geraten |
| Lerncache und öffentliche Statistikprojektion | Wiederaufbaubare Lernstände und freigegebene Summen; keine öffentliche vollständige Antwortgeschichte |
| Synchronisationsbelege und Änderungsmarken | Bestätigte Pakete, Revisionen sowie Löschmarken; begrenzte Zusatzdaten mit festgelegtem Wiederaufnahmevertrag |

Ein Konto verweist auf einen gemeinsamen vollständigen offiziellen Katalog und nur auf seine eigenen Ergänzungen oder Abweichungen. Es soll nicht allein für die Zuordnung erneut 5.677 persönliche Fragenzeilen oder eine persönliche vollständige Fragenliste erhalten. Die gemeinsame Katalogbeschreibung enthält bereits die geordnete Basis; das Konto speichert nur Unterschiede. Importreihenfolge, ausgelassene Pakete und ältere Inhalte müssen dabei exakt darstellbar bleiben.

Der gemeinsame Katalog muss aus dem tatsächlichen App-Importer einschließlich generierter Fragen, Kategoriezuordnungen und Metadaten entstehen. Nur gleiche Frage-IDs oder Dateinamen reichen nicht. Der bestehende Duellkatalog umfasst einen anderen Bestand und einen eigenen Snapshotvertrag; er darf nicht ungeprüft als vollständiger Solo-/Schauspieler-/Preisträgerkatalog verwendet werden.

Für Inhaltsnachweise SHA-256 über eine versionierte, verlustfreie Serialisierung verwenden. Der bestehende kurze Importfingerabdruck bleibt die historische Frageversion; er ersetzt keine robuste Inhaltsadressierung. Nur freigegebene, exakt passende öffentliche Inhalte werden gemeinsam gespeichert. Eine abweichende oder eigene Frage bleibt privat, auch wenn ID oder bisherige Versionskennung ähnlich aussehen. Große komprimierte Katalogdaten gehören in einen eigenen unveränderlichen Datensatz; binäres Speichern kann die base64-Darstellung im Datenbankwert vermeiden, muss aber gesondert gemessen werden.

Eine Runde muss weiterhin genau die damals verwendete Frage rekonstruieren können. Dazu gehören Versionskennung, Antwortreihenfolge, zufällig erzeugte Jahresantworten, Erläuterungen und Metadaten. Ein Verweis bedeutet deshalb Zugriff auf erhaltenen Inhalt, nicht Zugriff auf die heute neueste Frage. Vollständige JSON-Exporte und lokale Rückfallkopien bleiben unabhängig rekonstruierbar. Eine lediglich mit einer möglicherweise später entfernten öffentlichen URL verknüpfte Sicherung wäre unzureichend.

Private Tabellen erhalten Eigentümer und Generation in ihren Schlüsseln und Beziehungen. Fremde Konten dürfen keine privaten Frageobjekte, Runden oder Ereignisse referenzieren; RLS und Grants werden gemeinsam festgelegt. Öffentliche Kataloge dürfen nur freigegebene Betreiberinhalte enthalten. Die öffentliche Statistikprojektion enthält ausschließlich die bereits freigegebenen Felder. Den Standard `security invoker` bevorzugen; notwendige privilegierte Helfer bleiben in einem nicht exponierten Schema mit ausdrücklich begrenzten Aufrufen und eigener Kontoprüfung. Keinen beliebigen vom Client vorgegebenen JSON-/SQL-Pfad zulassen.

Indizes gezielt für Eigentümer/Generation, Runden-/Ereigniszuordnung und Änderungsrevision vorsehen, beispielsweise `(owner_id, generation, changed_revision)`. Zusammengesetzte Fremdschlüssel erhalten die Kontozuordnung. Zusätzliche Indizes auf große JSON-Inhalte erst für einen tatsächlich benötigten Abfragepfad hinzufügen, weil sie selbst Platz und Schreibarbeit verursachen.

Neue Solorunden begrenzen `before` bereits auf die ausgewählten Wissensziele. Alte Stände und schrittweise importierte Duellrunden können vollständige Lernmaps enthalten. Diese vorhandenen Inhalte zunächst verlustfrei erhalten oder als eigenes unveränderliches Objekt referenzieren. Bei neuen Duellen eine kleinere Map erst einführen, wenn die benötigten Ziele und ihr ursprünglicher Vorzustand vollständig feststehen; während späterer Teilimporte darf nicht versehentlich ein inzwischen geänderter Lernstand als Ausgangswert dienen.

## Änderungsübertragung und Wiederaufnahme

Eine normale Antwort überträgt die neue Antwort, die Änderung der aktiven Runde und betroffene kleine Zustandswerte. Eine Rate-Korrektur aktualisiert den vorhandenen Antwortdatensatz. Eine Einstellung verändert nur den erlaubten Einstellungsbereich. Import und vollständige Wiederherstellung verwenden einen ausdrücklich eigenen Ablauf. Arraypositionen dürfen nicht die einzige Identität einer Änderung sein; verwendet werden stabile IDs und erhaltene Reihenfolgen.

Vorgeschlagener Paketkopf: Protokollversion, Generation, eindeutige Paket-ID und erwartete Kontorevision. Eine geprüfte RPC wendet das Paket als eine PostgreSQL-Transaktion an und liefert bestätigte Paket-ID, neue Revision und erforderliche Inhaltsnachweise zurück. Das Konto stammt aus der geprüften Sitzung; eine mitgesendete Eigentümerkennung dient nur dem zusätzlichen Kontowechselschutz.

Notwendiger Ablauf:

1. Lokale Spieländerung und ausstehende Änderungsbeschreibung in derselben IndexedDB-Transaktion sichern. Der bestehende lokale Schreibweg bleibt vor der Netzübertragung dauerhaft. Asynchrones Hashen außerhalb der laufenden IndexedDB-Transaktion durchführen.
2. Nach dem lokalen Abschluss ein begrenztes Paket bilden. Dessen ID und Inhalt werden nach dem ersten Versand unveränderlich; weitere Spielaktionen erhalten weitere vorgemerkte Änderungen. Schnelle Einstellungen dürfen vor dem ersten Versand zusammengefasst werden.
3. Server prüft bestätigtes Konto, Generation, erlaubte Operationen, Inhalte und Größen. Bereits ausgeführte identische Paket-IDs liefern ihren vorhandenen Beleg; dieselbe ID mit anderem Inhalt wird abgelehnt.
4. Erwartete Revision unter einer kurzen Kontosperre prüfen. Alle Änderungen, Statistikfolgen, Beleg und Revisionsschritt gemeinsam bestätigen oder zurückrollen. Große Importe vorher in einem privaten Bereich vorbereiten; keine globale Sperre über alle Spieler verwenden.
5. Erst die bestätigte Paket-ID lokal aus der Warteschlange entfernen. Ein Verbindungsabbruch bedeutet einen unklaren Ausgang; Wiederholung verwendet dieselbe ID. Grün erscheint erst, wenn alle Änderungen des aktuellen Stands bestätigt sind.
6. Bei Geräte-Neustart oder Netzrückkehr zunächst Revision und Paketbeleg abgleichen. Eine fremde Geräteänderung bleibt nach dem bisherigen Vertrag ein sichtbarer Konflikt; automatische Zusammenführung unterschiedlicher Spielabsichten gehört nicht zu diesem ersten Ausbau.

Die Warteschlange muss Neuladen, Browserabsturz und Offlinephasen überstehen und darf keinen vollständigen Spielstand pro Antwort speichern. Eine Anfrage erhält Abbruchgrenze und Wiederholung mit zunehmendem Abstand; Hängen darf nicht die gesamte Warteschlange dauerhaft blockieren. Ablaufregeln für alte Paketbelege müssen mit Revision und Generation verhindern, dass ein sehr spät wiederholtes Paket unbemerkt doppelt ausgeführt wird.

Für Downloads ebenfalls zuerst kleine Metadaten abrufen. Bei unveränderter Revision wird kein vollständiger Kontostand geladen. Bei Änderungen nur betroffene Einträge und fehlende Katalogobjekte nachladen; Änderungen und Löschmarken müssen gemeinsam einen vollständigen Stand ergeben. Ein begrenzter Änderungsverlauf braucht einen klaren Rückfall auf einen vollständigen Abruf bei zu altem Cursor. Der Erstabruf auf einem neuen Gerät lädt weiterhin die gesamte benötigte Historie, aber einen lokal vorhandenen geprüften Katalog nur einmal.

Mehrseitige Abrufe dürfen keine Mischung verschiedener Revisionen als bestätigt ausgeben. Entweder einen stabilen Änderungsbereich bereitstellen oder die Revision nach dem Abruf nochmals prüfen und einen veränderten Abruf wiederholen. Lokalen Ersatz erst nach vollständiger Rekonstruktion und Validierung bestätigen. Währenddessen entstandene lokale Änderungen bleiben vorgemerkt.

## Weniger Serverarbeit bei Ranglisten

`quiz_public_players` und `quiz_players` entpacken derzeit historische Runden- und Antwortarrays. Der bestehende Rekordtrigger löscht und erstellt die privaten Spielerprojektionen bei jeder Änderung von `quiz_saves.state` erneut. Eine Soundeinstellung kann dadurch dieselbe Auswertung auslösen wie eine Spieländerung.

Erster Ausbau: Öffentliche Gesamtstatistik je Konto und gefilterte Statistik nach Genre/Schwierigkeit einmal bei relevanten Spieländerungen erneuern. Eine Listenabfrage liest anschließend nur diese kleinen Werte. Ein Cache der gesamten öffentlichen Liste allein würde die notwendige Aktualität und individuellen Filter nicht ausreichend lösen.

Nach getrennter Speicherung nur den Beitrag tatsächlich geänderter Runden neu bestimmen. Rundenabschluss, zulässige Korrekturen, Restore und Import sind relevante Auslöser; gewöhnliche Sound-/Anzeigeeinstellungen sind es nicht. Namensänderungen und Kontobestätigung aktualisieren nur die Identitäts-/Sichtbarkeitsdaten. Bestehende Mindestantwortmenge, Nullrunden, Gleichstände, Filter, Zeitabläufe und Keine Ahnung bleiben erhalten.

XP darf nicht einfach als feste Punktezahl je Antwort addiert werden. Tagesgrenzen, erstmalige sichere Antworten, Fehlerkorrekturen, Festigung und `career.legacyBonus` wirken über mehrere Runden. Eine inkrementelle Statistik muss zunächst gegen die bestehende Ableitung verglichen werden; als sichere Zwischenstufe darf sie bei relevanten Änderungen die Historie dieses einen Kontos auswerten. Rekordpunkte und Lern-/Karrierewerte bleiben getrennt.

Abgeleitete Felder wie `records`, `experience` und Lernstände sind als Cache behandelbar; ihre Wiederaufbaukosten und Regelversion müssen feststehen. Legacy-Gutschriften, erworbene Freischaltungen, Abzeichen und ausdrücklich erhaltene Altstandfelder dürfen nicht als vermeintlich überflüssige Daten verschwinden.

## Warum kleinere HTTP-Pakete allein nicht genügen

Ein JSON-Patch auf dem bisherigen großen `quiz_saves.state` wäre eine mögliche Zwischenstufe. Er reduziert jedoch nicht die pro Konto vorhandene Katalogkopie. Auch `jsonb_set` macht daraus keine Speicherung einzelner Antwortzeilen: Der JSON-Wert verändert sich weiterhin. Aus der PostgreSQL-Dokumentation folgt, dass getrennte unveränderte große Felder bei Updates eher wiederverwendbar sind; die tatsächliche Schreibersparnis ist am neuen Layout zu messen.

Längere Uploadabstände, zusätzliche gzip-Kompression oder ein größerer Tarif können ergänzen. Sie beseitigen die redundanten Inhalte nicht. Ein vollständiges Neuberechnen, Serialisieren und Hashen aller 5.677 Fragen bei jeder Antwort sollte ebenfalls entfallen: Den Katalognachweis nur nach Katalogänderungen erneuern, normale Synchronisation über Revisions- und Änderungsbelege steuern. Ein dauerhafter ungesicherter In-Memory-Katalog würde den vorhandenen Schutz gegen andere Tabs schwächen.

## Migration und Abnahme

Empfohlene Umsetzung in vier fachlichen Blöcken:

1. **Neuer Speichervertrag:** Offizielle und private Katalogobjekte, verlustfreie Rundenzuordnung, Cloudformat und vollständige Rekonstruktion. Alte Formate bleiben lesbar; keine alten Runden löschen.
2. **Synchronisation:** Getrennte Einträge, transaktionale lokale Warteschlange, idempotente RPC, Revisionsschutz und gezielter Download. Normale Antworten müssen im KB-Bereich bleiben, unabhängig von der vorhandenen Historie.
3. **Statistik:** Kleine Projektionen mit Vergleich zu bisherigen SQL-/App-Wertungen; keine Historienauswertung aller Spieler je Listenaufruf und keine Neuaufbereitung aller Rekorde nach einer Anzeigeeinstellung.
4. **Migration und Lastprüfung:** Kontoweise Übernahme, vollständiger Vorher-/Nachher-Vergleich und anschließend isolierte Lastprüfung mit etwa 100 synthetischen Spielern. Speicherverbrauch einschließlich Indizes und Migrationszwischenständen messen.

Bei einer Wiederherstellung zunächst eine vollständige neue Generation vorbereiten, Referenzen und Inhalte prüfen und anschließend den aktiven Verweis atomar umstellen. So sind auch fehlende oder entfernte Einträge eindeutig behandelt. Einfache Upserts allein wären bei einem Restore unvollständig. Alte Warteschlangen und alte App-Versionen dürfen eine migrierte Generation nicht zurückschreiben; der Server benötigt eine Protokoll-/Generationsprüfung, nicht nur eine neue Clientanzeige.

Altstände während der geprüften Übernahme als Rückfall erhalten, aber nicht als dauerhaft doppelt geschriebene Spiegel parallel pflegen. Der nötige Zwischenraum für die Migration zählt zur Speicherquote. Rücknahme ist nach neuen Änderungen nur mit einer vollständigen Rückkonvertierung des neuesten Stands zulässig; bloß auf den alten Quellstand zurückzuschalten würde neue Fortschritte verlieren.

Abnahmen: Voll-/v1-/v2-Sicherungen; eigene CSVs; Jahresantwortvarianten; aktive und abgebrochene Runden; alte `before`-Maps; Duellteilimporte; Rate-Korrekturen; Keine Ahnung und Zeitabläufe; Reihenfolge bei gleichen Zeitstempeln; Legacy-XP und Freischaltungen; verloren gegangene Serverantwort; doppelte/anders befüllte Paket-ID; Offline-Neuladen; auslaufender Downloadcursor; konkurrierende Geräte; Kontowechsel; RLS-Abweisung für anon und fremde Konten; Restore mit entfernten Einträgen; öffentlich sichtbare Statistiken ohne private Inhalte.

Bei tatsächlicher Umsetzung gelten `npm test`, `npm run build`, betroffene Persistenz-/Offline-/Kontobrowserfälle und `git diff --check`; am Ende der Migration der erforderliche vollständige Projektprüflauf. Der heutige Analyseentwurf wurde über seine Rekonstruktionsassertionen geprüft und ersetzt diese spätere Abnahme nicht.

## Quellen und betroffene Stellen

- [Messwerte](Speicher-und-Sync-Analyse.json), erzeugt mit `node scripts/analyze-storage-sync.mjs`.
- `src/cloudCodec.ts`, `src/accountSync.ts`, `src/accounts.ts`: vollständiger Upload, Fingerabdruck und Revisionsablauf.
- `src/storage.ts`, `src/localCatalog.ts`, `src/catalogCodec.ts`: lokale Transaktionen, getrennte Katalogablage und Verlustfreiheit.
- `src/model.ts`, `src/engine.ts`, `src/career.ts`, `src/duels.ts`, `src/roundSummary.ts`: Zustandsgrenzen, nachträgliche Änderungen, XP und historische Rückblicke.
- Migrationen `202609260002`, `202609260004`, `202610020004` und `202610030001`: Rekordtrigger und Spielerstatistiken.
- [Supabase-Datenbankfunktionen und RPC](https://supabase.com/docs/guides/database/functions), [Zugriff mit RLS und Grants](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [PostgreSQL 17: Transaktionen](https://www.postgresql.org/docs/17/tutorial-transactions.html), [große Werte und unveränderte Felder bei Updates](https://www.postgresql.org/docs/17/storage-toast.html).

Die Entwürfe benötigen keinen neuen Hostinganbieter oder zusätzlichen dauerhaften Webserver. Einen garantierten neuen Speicherbedarf pro Konto oder eine garantierte Zahl gleichzeitiger Spieler kann erst die physische Datenbank- und Lastmessung nach Implementierung liefern.

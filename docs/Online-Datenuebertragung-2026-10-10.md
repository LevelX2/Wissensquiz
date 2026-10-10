# Online-Spielstände: Datenmenge und Ablauf – 10.10.2026

**Folgeumsetzung am selben Tag:** Die großen Endloslisten werden seit Version 64 nur beim Start beziehungsweise bei einer neuen Reihenfolge übertragen. [Umsetzung und neue Messung](Online-Listenoptimierung-2026-10-10.md). Die folgenden Werte dokumentieren die vorausgehende Prüfung. [Zusätzliche Sicherheitsprüfung für Zeitranglisten](Zeitrunden-Manipulationsschutz-2026-10-10.md).

## Ergebnis der Nachprüfung

Die Eintragsübertragung funktioniert für normale Runden sparsam. Sie ist **nicht für alle Spielmodi ausreichend optimiert**: Fehlerfrei und Zeitkonto übertragen bei jeder Antwort erneut große Fragenlisten. Die frühere Messung „3,9–6,0 KB pro Antwort“ darf nicht auf diese Modi oder den heutigen Erstabruf übertragen werden.

[Nutzerauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Datenuebertragung%20pruefen.txt), [reproduzierbare Messdaten](Online-Datenuebertragung-Messung-2026-10-10.json), [aktueller Online-Vertrag](Anmeldung-und-Online-Spielstand.md). Frühere IndexedDB-/Outbox-Abläufe in den Speicheranalysen vom 03.10.2026 beschreiben nicht mehr den aktiven Spielweg.

## Messung am aktuellen Katalog

Echtes SQL-Protokoll in einer isolierten PGlite-Datenbank, ausschließlich synthetische Konten, vollständiger Katalog mit 12.773 Fragen. Je vier Aktionen in vier Modi mit 0, 100 und 500 abgeschlossenen, archivierten Runden; abschließend jeden Kontostand neu geladen und vollständig verglichen. Zeit und Zufallsauswahl kontrolliert. Gemessen werden tatsächliche UTF-8-JSON-Anfrage- und Antwortkörper aus `OnlineGameStore`.

| Aktion | Anfragen | Gesendete JSON-Nutzdaten |
| --- | ---: | ---: |
| Unveränderte Änderung | 0 | 0 Bytes |
| Soundeinstellung | 1 | 522 Bytes |
| Antwort im Freien Spiel | 1 | 3.960–6.101 Bytes |
| Antwort bei 10 Fragen | 1 | 6.083–6.089 Bytes |
| Antwort bei Fehlerfrei | 1 | 599.172–599.178 Bytes |
| Antwort bei Zeitkonto | 1 | 599.170–599.176 Bytes |
| Rundenstart Freies Spiel | 1 | 3.051–8.248 Bytes |
| Rundenstart 10 Fragen | 1 | 9.793–9.912 Bytes |

Antwortbelege sind rund 138 Bytes. HTTP-/Auth-/TLS-Overhead, Kompression und reale Netzlatenzen sind nicht enthalten. Uploadmenge ist nicht gleich Supabase-Egress. Der Vergleich zum vorherigen Einzelupload wird aus **denselben** Paketen mit dem bisherigen `uploadObject` rekonstruiert; kein zweiter Produktions- oder Lastlauf.

Die nativen Client-/SQL-Zeiten des JSON-Nachweises stammen aus dem Lauf nach Einführung des direkten Inhaltsvergleichs, vor dessen abschließender kleiner Schleifenoptimierung. Alle 48 Anfragegrößen und Anfragezahlen blieben gegenüber dem vorigen Lauf identisch. Die endgültige sichtbare Browserreaktion wird gesondert unten und im Prüfbericht ausgewiesen.

## Lokal umgesetzte Verbesserungen

- Kleine neue Inhaltsobjekte werden über das bereits vorhandene `packet.objects` zusammen mit den geänderten Einträgen atomar gespeichert. Grenze: zusammen höchstens 64 KiB serialisierte Objekte und 100 Objekte. Größere Inhalte verwenden unverändert die vorhandene stückweise Übertragung.
- Im gemessenen Rundenstart sinkt die Anfragezahl von 2–4 auf 1; bei bereits bekannten Objekten bleibt sie 1. Wiederholen nach verlorener Bestätigung verwendet genau denselben Pakettext und lädt enthaltene Objekte nicht einzeln erneut hoch.
- Die reine JSON-Körpergröße sinkt nicht in jedem Fall: zusätzliche Verschachtelung kann durch JSON-Escaping wenige hundert Bytes kosten. Der Hauptgewinn ist die entfallene Folge von Netzrundreisen und Anfrageheadern; keine behauptete pauschale prozentuale Byteersparnis.
- Katalog und kleine Revisionsmetadaten werden beim Öffnen parallel angefragt. Das entfernt die vorherige sequenzielle Abhängigkeit, spart aber keine Katalogbytes.
- `jsonEqual` vergleicht JSON-Inhalte direkt, ohne für jeden Historieneintrag zwei sortierte JSON-Texte anzulegen. Feldreihenfolge bleibt bedeutungslos, Arrayreihenfolge bleibt erhalten, optionale undefinierte Objektfelder bleiben ausgelassen. Die kanonische Serialisierung der unveränderlichen Speicherpakete und ihrer Nachweise bleibt bestehen.

Keine Änderung von Lernregeln, Spielauswahl, Kontoidentität, Revisionsprüfung oder Serverbestätigung. Keine neue Altstandbehandlung, Migration, Abhängigkeit oder automatische lokale Spielstandsablage. Die produktive SQL-Funktion unterstützt eingebettete Objekte bereits seit der Speicheroptimierung vom 03.10.2026. Die Änderungen sind seit [Version 64](Veroeffentlichung-2026-10-10-Version-64.json) veröffentlicht.

## Verbleibende Punkte, nach Priorität

1. **Endlosrunden:** `startRound` hält den vollständigen Pool und die vorbereitete Reihenfolge in `round.run.pool` und `round.run.queue`. `answer` verändert die Runde; `compileState` sendet dadurch den gesamten Rundenkopf erneut. In der Messung beanspruchen allein die beiden Arrays 279.145 beziehungsweise 268.846 Bytes vor zusätzlichem Paket-Escaping. 500 ältere Runden vergrößern das Paket kaum; der große aktuelle Pool verursacht die Last. Sinnvolle nächste Optimierung: Pool/Reihenfolge einmal speichern und danach nur Fortschrittsposition sowie tatsächlich geänderte Rundendaten übertragen. Dafür müssen Clientdarstellung, Servervalidierung, Wiederaufnahme und Betreiberablauf gemeinsam geändert und geprüft werden. Diese Protokolländerung ist in diesem Prüfblock nicht implementiert.
2. **Öffnen/Neuladen:** Der aktuelle offizielle Katalog kommt über `quiz_sync_catalog` als gzip/base64 plus Prüfsummen. Innerhalb einer geöffneten API-Sitzung wird er wiederverwendet; ein frischer Tab lädt ihn erneut. Das lokal erzeugte aktuelle Release-JSON ist 7.239.632 Bytes groß; die tatsächliche SQL-Hülle kann davon abweichen. Kontoeinträge und private Objekte werden beim Öffnen ebenfalls vollständig geladen. Der kleine unveränderte Wiederabruf aus der historischen lokalen Outbox-Messung gilt nicht mehr für einen frischen Online-Tab. Denkbare weitere Optimierung: öffentlicher Katalog als unveränderliche, per HTTP cachebare statische Datei; private Spielstände weiterhin ausschließlich online.
3. **Lange Historie und CPU:** Obwohl die Uploadgröße normaler Antworten stabil bleibt, kopiert und kompiliert der Client weiterhin die Historie. Die erste Chromium-Prüfung mit vierfacher CPU-Drosselung maß 249/303/626 ms sichtbare Antwortreaktion bei 0/100/500 Runden; der 500-Runden-Fall überschritt das bestehende Ziel von 450 ms. Daraufhin wurde der wiederholte serialisierende Inhaltsvergleich durch den direkten JSON-Vergleich ersetzt. Dessen erste Fassung erreichte 484 ms; nach der abschließenden Schleifenoptimierung bestanden alle drei Chromium-Fälle mit **211/267/442 ms**. Die Reserve im 500-Runden-Fall bleibt klein. Die Zeitwerte sind einzelne synthetische Messpunkte, keine P95-Werte oder Mobilnetzgarantie. Gezielte Fortschrittsverarbeitung wäre bei erneut belegten Verzögerungen der nächste Ansatz.

## Gleiches Konto auf zwei Geräten

[Nutzerfrage zur gleichzeitigen Nutzung](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerfrage%20gleichzeitige%20Geraete.txt).

Ein Konto hat einen gemeinsamen Online-Spielstand. Jede Änderung nennt Generation und erwartete Revision. Die bestehende SQL-Funktion sperrt die Speicherung je Konto transaktional und erhöht die Revision erst mit dem bestätigten Paket. Von zwei unterschiedlichen Paketen für denselben Ausgangsstand wird genau eines angenommen; das andere erhält `CloudConflict`. Es wird nicht still zusammengeführt und kann den neueren Stand auch durch Wiederholen nicht überschreiben.

Das betroffene Gerät zeigt den Konflikt und bietet „Online-Spielstand erneut laden“. Seine unbestätigte Antwort wird nicht übernommen oder aufgelöst. Weil Absichten ausschließlich im RAM des geöffneten Tabs liegen, verwirft Neuladen diese Absicht und übernimmt den bestätigten Serverstand. Eine verlorene Bestätigung desselben bereits angenommenen Pakets wird dagegen über die unveränderte Paket-ID erkannt und zählt nicht doppelt. Der Konflikt gilt auch für verschiedene gleichzeitig geänderte Kontofelder; es gibt keine automatische fachliche Zusammenführung.

Prüfung: bestehende getrennte Geräte-/Fensterfälle, verlorene Bestätigung und frischer Geräteabruf in Chromium, Firefox und mobilem WebKit; zusätzlich zwei gleichzeitig gestartete `OnlineGameStore.update`-Antworten gegen dasselbe SQL-Konto. Genau ein Erfolg, genau ein Konflikt, nur ein Revisionsschritt, keine bestätigte Antwort im unterlegenen Store und kein Überschreiben bei erneutem Senden; frischer Store entspricht vollständig dem angenommenen Ergebnis. PGlite serialisiert SQL-Ausführung; dies ist ein Protokoll-/Transaktionsnachweis, kein nativer Netzwerk-Rennlasttest.

## Reproduktion und Prüfgrenzen

Der damalige JSON-Nachweis bleibt als datierter Ausgangsbefund erhalten. `node scripts/measure-online-transfers.mjs` erzeugt inzwischen den [Folgenachweis zur Listenoptimierung](Online-Listenoptimierung-Messung-2026-10-10.json). Die Datenbank liegt nur im Arbeitsspeicher. Der Lauf verwendet weder Produktivzugänge noch echte Spielstände. Größenwerte stammen aus den tatsächlich gesendeten Argumenten; Zeitwerte sind umgebungsabhängig. Die feste Prüfuhr ist nur für synthetische Spieldaten zuständig.

Prüfergebnisse werden im [Prüfbericht](Pruefbericht.md) festgehalten. Keine Produktionsdatenbankänderung, Veröffentlichung oder Remote-Aktion. [Offizielle Supabase-RPC-Dokumentation](https://supabase.com/docs/reference/javascript/rpc); Änderungsindex vom 10.10.2026 auf für diesen bestehenden RPC-Ablauf relevante Änderungen geprüft.

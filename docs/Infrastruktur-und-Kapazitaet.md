# Infrastruktur und Kapazität

## Aktueller Online-Spielweg – Nachprüfung 10.10.2026

Seit Version 59 liegt der dauerhafte Spielstand ausschließlich online; Gastspiel, lokale Outbox und Offline-Paket gehören nicht mehr zum aktiven Ablauf. Die [aktuelle Nachprüfung der Datenübertragung](Online-Datenuebertragung-2026-10-10.md) misst mit 12.773 Fragen und bis zu 500 archivierten Runden: normale Antworten rund 4–6 KB, Einstellungen 522 Bytes; Fehlerfrei und Zeitkonto dagegen rund 600 KB pro Antwort wegen erneut gesendeter Fragenlisten. Kleine neue Inhaltsobjekte werden lokal bereits in derselben Speicheranfrage übertragen; noch nicht veröffentlicht. Ein frischer Tab lädt Katalog und privaten Stand erneut. Frühere Aussagen über wenige KB für jede Spielart, reine Revisionsabrufe nach Neuladen oder weitgehend lokalen Spielbetrieb gelten deshalb nicht pauschal für den aktuellen Ablauf. Die folgenden Abschnitte bleiben datierte historische Nachweise.

## Lokale Umsetzung und Messung am 03.10.2026

Die Speicher-/Sync-Optimierung ist lokal implementiert und geprüft; Datenbankmigrationen und gemeinsamer Katalog sind nach ausdrücklichem Auftrag produktiv eingerichtet. Der Tarif bleibt unverändert. Der [Produktionsnachweis](Speicher-und-Sync-Produktion.md) trennt die tatsächliche aktuelle Belegung vom synthetischen Einsparungsnachweis. [Abnahme](Speicher-und-Sync-Abnahme.md), [Betreiberablauf](Speicher-und-Sync-Migration.md) und [Messdaten](Speicher-und-Sync-Messung.json) ergänzen die nachfolgende ursprüngliche Betriebsanalyse.

100 synthetische Konten mit vollständigem App-Katalog und je 30 historischen Runden: physische Anwendungsbelegung einschließlich TOAST und Indizes 357,0 → 128,1 MB, rund 64,1 % weniger. Während der Übernahme mit eingefrorenen Ausgangskopien waren 483,1 MB nötig. Erst geprüfte aktuelle Exporte und kontrollierte Betreiberfreigabe machen die alte Kopie entbehrlich. Reale Konten/Importe können einen anderen Zwischenbedarf erzeugen.

Die normale Antwort braucht im geprüften Bereich von 0 bis 300 älteren Runden einen JSON-Anfragekörper von 3,9–6,0 KB. Einstellung 494 Bytes; unveränderter Wiederabruf nur Revisionsmetadaten. Neue Browser müssen Katalog und Historie vollständig beziehen. Bei langen Historien ist dieser Erstabruf nicht durchgehend kleiner als die alte komprimierte Vollsicherung.

Die native PostgreSQL-17.11-Messung mit 100 gleichzeitigen lokalen SQL-Sitzungen ergab 87/411 ms Median/P95 für Schreiben gegenüber 21.801/66.640 ms zuvor; XP-Listen 100/114 ms gegenüber 336.819/336.922 ms. Je 1.100 Schreibtransaktionen ohne Fehler, alle 100 Endstände vollständig identisch rekonstruiert. Vorbereitete SQL-Nutzlasten schließen HTTP, Authentifizierung, JSON-Anfrageparsing und Supabase-Netz-/Poolgrenzen aus. WAL enthält Hintergrundarbeit im Clusterintervall. Eine zugesicherte Produktionskapazität oder Tarifänderung folgt daraus nicht.

Die folgenden Größen und Ausbauempfehlungen sind die unveränderte Ausgangsanalyse des damaligen Produktionsstands.

## Einschätzung am 03.10.2026

100 gleichzeitige Gastspiele sind wegen des überwiegend lokalen Spielablaufs plausibel. Für 100 gleichzeitig aktive, angemeldete Spieler ist der aktuelle kostenlose Datenbankbetrieb noch nicht ausreichend nachgewiesen. Kontosicherungen übertragen bei Änderungen den vollständigen komprimierten Stand; Ranglisten werten historische Antworten aus. Ein Lasttest mit 100 Spielern wurde nicht durchgeführt.

## Aufgaben der Dienste

Sites liefert die statische React-/Vite-PWA und die öffentlichen Fragen-/Bilddateien aus. Spielauswahl, Soloantworten, Lernregeln, persönliche Rekorde und Gastspielstände laufen im Browser mit IndexedDB. Ein laufendes Spiel benötigt keinen dauerhaft rechnenden Sites-Spielserver.

Supabase übernimmt Anmeldung, private Kontosicherungen, gemeinsame Ranglisten, anonyme Gastaktivität und asynchrone Duelle. Gastaktivität meldet Start und Abschluss mit kleinen Zählern; vollständige Gaststände werden nicht übertragen. Die sichtbare Duellübersicht aktualisiert sich alle 20 Sekunden; während einer geöffneten Duellrunde gilt dieser Übersichtsintervall nicht. Antworten und weitere Aktionen verwenden eigene RPCs.

Die Sites-Metadaten und die geprüfte offizielle Sites-Seite nennen keine belastbare CPU-/RAM-Zuteilung, Bandbreitenquote oder garantierte Zahl gleichzeitiger Besucher. Aus der Architektur lässt sich eine geringe Rechenlast ableiten, aber keine zugesicherte Hostingkapazität. Die offiziellen Sites-Speichergrenzen von 10 GB für D1 und ohne feste Grenze für R2 sind hier keine zusätzliche Spielstandsreserve: `.openai/hosting.json` konfiguriert nur statische Auslieferung; die Spielstände liegen in Supabase.

## Tarif und Speicherbelegung

Die Supabase-Organisation wurde live als `free` bestätigt, das Projekt als `ACTIVE_HEALTHY`. Die folgenden Größen wurden am 03.10.2026 ausschließlich lesend abgefragt.

| Größe | Stand bzw. Grenze |
| --- | --- |
| Datenbankgrenze Free | 500 MB pro Projekt |
| Alle Datenbanken im Projektcluster | 51.297.077 Bytes, rund 51,3 MB |
| Anwendungsdatenbank allein | 36.023.443 Bytes, rund 36,0 MB |
| Grobe Reserve zur 500-MB-Grenze | rund 449 MB bzw. 90 % |
| Duellfragenkatalog einschließlich Indizes | 9.887.744 Bytes, rund 9,9 MB |
| Sicherungstabelle einschließlich Indizes und internem Speicher | 14.245.888 Bytes, rund 14,2 MB |
| Datenbankrechenleistung Free/Nano laut Tarif | geteilte CPU, bis zu 0,5 GB RAM |
| Ungekachter ausgehender Verkehr Free | 5 GB pro Monat, Organisationsquote |
| Separater Supabase-Dateispeicher Free | 1 GB; keine zusätzliche PostgreSQL-Spielstandsquote |

Die Clustergröße folgt der offiziellen Abfrage `select sum(pg_database_size(datname)) from pg_database;`. Nur `pg_database_size(current_database())` zu verwenden würde die anderen Datenbanken auslassen. Die Dashboard-Abrechnung wurde nicht ausgelesen; die derzeit verbrauchte monatliche Datenmenge ist unbekannt. Ungekachter und gekachter Verkehr haben getrennte Quoten. Private Kontodaten sind nicht einfach dem zusätzlichen Cachekontingent zuzurechnen.

Bei Überschreiten von 500 MB kann Free in den Nur-Lese-Betrieb wechseln: neue Sicherungen und andere Schreibaktionen scheitern dann. Daten und Indizes zählen zur Datenbankgröße. WAL und die allgemeine Festplattenbelegung sind gesonderte Größen; die Prüfung hat keine Serverdateien gelesen.

## Größe und Wachstum von Kontoständen

Eine synthetische Messung des aktuellen öffentlichen Katalogs mit 5.677 Fragen und leerem Fortschritt ergab mit dem tatsächlichen `encodeCloudState`:

| Darstellung | UTF-8-Nutzdaten |
| --- | --- |
| Vollständiger logischer JSON-Stand | 18.069.123 Bytes |
| Kompakte Online-Sicherung `quiz-cloud-compact-v2` | 3.057.501 Bytes |
| Darin gzip/base64-Fragenkatalog | 3.046.876 Bytes |
| Zusätzlich gzip-komprimierte gesamte JSON-Antwort, synthetisch | 2.295.310 Bytes |

Die letzte Zahl ist ein Komprimierungsversuch, kein Nachweis tatsächlicher HTTP-Komprimierung oder Egressabrechnung. Die Messung verwendete ausschließlich öffentliche CSV-Pakete und vorhandene App-Module, ohne Browserprofile, Produktionsschreibzugriffe oder erzeugte Builddateien.

Eine ergänzende aggregierte Größenabfrage bestehender Sicherungen ergab rund 7,51 MB JSON und 4,42 MB tatsächliche PostgreSQL-Spaltengröße pro gegenwärtig vorhandenem Stand. Es wurden keine Namen, E-Mails, Antworten, Fragen oder Spielstandsobjekte ausgegeben oder als Prüfquelle gespeichert. Die Stichprobe ist klein und keine typische Nutzerverteilung.

Hundert Sicherungen dieser bestehenden Größe würden allein etwa 442 MB aktive Spielstanddaten belegen. Systemdaten, Duellkatalog, Indizes und Platz für wiederholte Updates kommen hinzu. Damit wäre die kostenlose Grenze nahezu ausgeschöpft. Neue Konten sind kleiner; lange Historien und eigene Importe sind größer. Übertragungsgröße und PostgreSQL-Spaltengröße dürfen nicht gleichgesetzt werden. Frei gewordene interne Bereiche nach Updates werden nicht immer sofort aus der Dateigröße entfernt.

Gemeinsame Rekordzeilen enthalten bereits nur Ergebniswerte und Kategorie-Metadaten. Der größere Platzbedarf stammt aus privaten Kontoständen samt persönlichem Katalog und Rundengeschichte. Gastbelege werden nach kurzer Aufbewahrung bei der nächsten gültigen Meldung bereinigt; derzeit gibt es dafür keinen eigenständigen Löschjob.

## Last bei 100 Spielern

`AccountSync.offer` bündelt schnelle Änderungen mit 800 ms Wartezeit. Diese Wartezeit ist kein regelmäßiger Uploadtakt. Jede anschließend zu sichernde Änderung überträgt über `cloudSave` den vollständigen kompakten Zustand. Einzelne Antworten können somit erneut mehrere MB senden. Je Konto läuft höchstens eine Sicherungsanfrage gleichzeitig, weitere Änderungen bleiben vorgemerkt.

Rechenbeispiel: 100 Kontospieler mit jeweils einer Änderung alle zehn Sekunden erzeugen im Mittel zehn Sicherungen je Sekunde. Bei 3,06 MB pro neuem Stand sind das rund 31 MB eingehende JSON-Nutzdaten je Sekunde, bei 7,51 MB rund 75 MB. Das ist eine angenommene Arbeitslast, keine gemessene Verarbeitungskapazität. Eingehende Uploads verbrauchen nicht dieselbe Quote wie ausgehender Verkehr, verursachen aber Netzwerk-, JSON-, Datenbank- und Schreibarbeit.

Spielerlisten aggregieren historische Runden-/Antwortarrays der Teilnehmer vor der Ausgabe. Eine Grenze von 50 ausgegebenen Zeilen begrenzt nicht diese gesamte Rechenarbeit. Rekordprojektionen werden bei Spielstandsänderungen neu aufgebaut. Historien und gleichzeitige Listenabfragen können den kostenlosen Datenbankdienst deshalb früher begrenzen als die reine Spielerzahl. Die abgefragten 60 maximalen PostgreSQL-Verbindungen sind keine Grenze von 60 Spielern: Browser verwenden die HTTP-API und teilen deren Datenbankressourcen.

## Sinnvoller Ausbau

Die [konkrete Folgeanalyse zu Speicher und Synchronisierung](Speicher-und-Sync-Optimierung.md) enthält gemessene Änderungsgrößen, einen vorgeschlagenen Speichervertrag und die notwendigen Migrations-/Abnahmebedingungen. Sie ist ein Entwurf; der bisherige Produktionsablauf bleibt unverändert.

Vor regelmäßigem Betrieb mit etwa 100 aktiven Konten sollten Sicherungen unveränderte Katalogdaten separat halten und Fortschrittsänderungen kleiner übertragen. Öffentliche Statistiken sollten beim Speichern fortgeschrieben werden, damit Ranglisten nicht wiederholt alle Historien auswerten. Historische Inhalte, Importe, Revisionsschutz und Rückblicke müssen dabei erhalten bleiben. Keine automatische Löschung ist aus dieser Prüfung abgeleitet.

Anschließend einen isolierten synthetischen Lastlauf für Sicherung, Ranglisten und Duelle durchführen und Latenz, Fehler, Speicherwachstum und Verkehr messen. Produktionslasttest und Tarifänderung wurden nicht beauftragt.

Supabase Pro beginnt aktuell bei 25 US-Dollar monatlich und umfasst für ein übliches Projekt 8 GB Festplatte, 250 GB ungekachten ausgehenden Verkehr und Rechenguthaben für eine Micro-Instanz mit 1 GB RAM. Ein höherer Tarif schafft mehr Reserve, ersetzt aber keine Prüfung der Speicher- und Abfragewege.

## Quellen und Prüfgrenzen

- [Offizielle Sites-Dokumentation](https://learn.chatgpt.com/docs/sites#understand-limits-and-unsupported-uses)
- [Supabase-Tarife](https://supabase.com/pricing)
- [Supabase: Datenbankgröße und Nur-Lese-Grenze](https://supabase.com/docs/guides/platform/database-size)
- [Supabase: Compute und Disk](https://supabase.com/docs/guides/platform/compute-and-disk)
- [Supabase: organisationsweite Abrechnung](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Kontosicherungsvertrag](Konten-und-Spielstaende.md), [Gastaktivität und Bestenliste](Bestenliste-und-Gastaktivitaet.md), [Struktur- und Wachstumsbefunde](Strukturpruefung-2026-10-03.md)

Keine Spielerdaten geändert, keine Migration, Tarifänderung, Veröffentlichung oder Lastsimulation gegen echte Dienste ausgeführt. Die Prüfung bestätigt aktuelle Belegung und Implementierungswege; sie bestätigt keinen Betrieb mit 100 gleichzeitigen Konten.

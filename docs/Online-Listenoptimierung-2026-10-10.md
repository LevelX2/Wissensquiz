# Online-Spielstände: Listen nur bei Änderung übertragen

Stand: 10.10.2026. Seit [Version 64](Veroeffentlichung-2026-10-10-Version-64.json) auf Supabase angewendet und als Website veröffentlicht. [Originalauftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Listenoptimierung%20und%20Manipulationsschutz.txt), [vorherige Messung und Gerätevertrag](Online-Datenuebertragung-2026-10-10.md).

## Verhalten

**Nachfolgender Umbau am selben Tag:** Neue gewertete Solo-Zeitläufe verwenden jetzt den [servergeprüften Ablauf](Servergepruefte-Zeitrunden-2026-10-10.md). Dessen zukünftige Listen verlassen den Server überhaupt nicht mehr; normale Kontosicherungen erhalten nur geschlossene Antwortfakten. Die unten beschriebene Verdichtung bleibt Bestandteil des allgemeinen Speicherprotokolls, ist aber nicht mehr der aktive Antwortweg neuer Zeitläufe. Beide Änderungen seit Version 64 produktiv angewendet.

`OnlineGameStore` verdichtet geänderte Endlosrunden vor der Paketserialisierung über `src/roundRunTransport.ts`:

- Beim Start wird die vollständige Runde mit Fragenpool und tatsächlich gemischter Reihenfolge gespeichert.
- Bei unverändertem Pool bleibt dieser aus der folgenden Anfrage heraus. Wenn die neue Warteschlange dem verbleibenden Ende der bestätigten Warteschlange entspricht, nennt die Anfrage nur die Anzahl verbrauchter Einträge, normalerweise `queue: {drop: 1}`.
- Ein neuer Mischzyklus oder eine tatsächlich geänderte Reihenfolge überträgt deren neue Liste. Ein veränderter Fragenpool verwendet eine vollständige Rundenänderung. Archivierte Runden bleiben kompakt und enthalten leere Listen.
- Die übrigen geänderten Rundendaten bleiben im Paket. Die bestätigten Clientdokumente und gespeicherten SQL-Zeilen behalten ihren vollständigen Inhalt. Öffnen und Wiederaufnahme benötigen weder eine lokale Spielstandsdatei noch die Rekonstruktion aus einer langen Liste früherer Netzoperationen.

Die SQL-Operation `round-run` ergänzt Pool und Warteschlange aus der bestätigten Rundenzeile desselben Besitzers und derselben Generation. Sie läuft erst nach bestehender Besitzerprüfung, Kontosperre, Paketbeleg- und Revisionsprüfung. Danach greifen die vorhandenen vollständigen Fragen-, Ereignis- und Rundenprüfungen. Eine fehlerhafte Listenoperation rollt die gesamte Speicherung zurück.

Der Originalpakettext bleibt unveränderlich. Bei verlorener Bestätigung wird er exakt erneut gesendet; der Beleg verhindert doppelten Listenverbrauch. Ein anderes Gerät mit veralteter Revision wird vor der Listenänderung abgewiesen. Es gibt keine automatische Zusammenführung konkurrierender Antworten.

## Messung und Grenzen

Mit dem vollständigen Katalog sinkt der JSON-Anfragekörper der gemessenen gewöhnlichen Endlosantworten von **599.170–599.178 Bytes auf 3.105–3.113 Bytes**, rund **99,5 % weniger**. Je Antwort bleibt es eine Speicheranfrage; Bestätigungen sind 138 Bytes. Die Werte gelten für die erste Antwort der geprüften Läufe mit 0/100/500 früheren Runden. Normale Antworten und Einstellungen ändern ihre Größe durch diesen Folgeschritt nicht.

Der [JSON-Nachweis](Online-Listenoptimierung-Messung-2026-10-10.json) wird mit `node scripts/measure-online-transfers.mjs` erzeugt: vollständiger Katalog, synthetische Konten, 0/100/500 archivierte Runden, vier Modi und je vier Aktionen. Ausschließlich eine lokale Datenbank im Arbeitsspeicher. Nach jedem Szenario wird der gesamte Stand frisch abgerufen und verglichen.

Anfragegrößen sind UTF-8-JSON ohne HTTP-, Auth- und TLS-Overhead oder Kompression. Der Vergleich `formerRequestBytes` materialisiert die vollständige Rundenzeile aus genau demselben bestätigten Zustand und rekonstruiert zusätzlich den früheren getrennten Objektupload. Er ist keine zweite Produktionsmessung. Lokale SQL-Zeiten sind keine Mobilnetz-Latenzen oder Kapazitätszusage.

Dieser Block spart die wiederholten Listen im Upload. Katalogdownload, erstmaliger Rundenstart und vollständiges Neuladen behalten ihre bisherigen Größen. Die Datenbank speichert weiterhin eine vollständige Rundenzeile; eine Verringerung von Tabellenbelegung oder WAL wurde hier nicht nachgewiesen. Mit einem sehr langen aktiven Lauf wachsen weiterhin Fragenreferenzen, Antwortanordnung und Ereignisverweise im Rundenkopf.

**Keine Anti-Cheat-Zusage:** Der Browser kennt weiterhin den Fragenkatalog und seine Lösungen sowie die gemischte Reihenfolge. Auch Antwortzeiten kommen weiterhin vom Client. [Sicherheitsbefund und konkreter Vorschlag für servergesteuerte Zeitrunden](Zeitrunden-Manipulationsschutz-2026-10-10.md).

## Betreiberablauf

Die neue Migration `supabase/migrations/20261010095424_compact_round_run_transport.sql` erweitert ausschließlich die private Schreibroutine. Sie legt keine Tabellen oder öffentlichen privilegierten Endpunkte an. Direkte Ausführung durch `anon` oder `authenticated` bleibt entzogen; die bestehenden kontrollierten RPCs bleiben der Zugang. Es gibt keine Änderung des gespeicherten JSON-Formats und keine neue Altstandbehandlung.

Der gesondert beauftragte Rollout wurde mit Version 64 durchgeführt: zuerst die geprüfte SQL-Migration auf Supabase angewendet, danach die Webapp nach `docs/Sites-Betrieb.md` veröffentlicht. Die neue Webapp benötigt die erweiterte Serveroperation; sie versucht bei einem alten Server keine stillschweigende Ersatzübertragung. Der ursprüngliche lokale Arbeitsblock enthielt noch keine Remote-Aktion. Kein GitHub-Push.

Die SQL-Funktion wurde über die isolierte PGlite-Datenbank tatsächlich ausgeführt. Der ursprüngliche lokale Supabase-Advisor-Aufruf konnte keine Verbindung zu einer lokalen Supabase-Instanz aufbauen. Beim Rollout von Version 64 wurden Security-/Performance-Advisors nativ ausgeführt und Rollenrechte separat bestätigt. Besitzerprüfung und atomare Fehlerfälle sind gezielt getestet. Kein nativer Netzwerk-Rennlasttest und kein Test mit echten Nutzerdaten. [Prüfnachweis](Pruefbericht.md).

Der Datenabruf rekonstruiert vollständige Endlosstände identisch. Die Oberfläche hat daneben bereits die eigenständige Regel, laufende Zeitrunden beim Neuladen abzubrechen und zu archivieren (`src/App.tsx`). Die Listenoptimierung ändert diese Regel nicht; bestätigte Antworten und Lernfortschritt bleiben erhalten. Der ursprüngliche neue Browserprüffall erwartete irrtümlich eine Fortsetzung und wurde auf diese bestehende Regel korrigiert.

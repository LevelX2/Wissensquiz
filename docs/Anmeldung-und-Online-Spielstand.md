# Anmeldung und Online-Spielstand – 10.10.2026

## Verbindlicher Nutzerauftrag

Aktueller Nutzerauftrag: Eine erste Zehnerrunde ohne Konto ausprobieren; danach ist ein bestätigtes Quiz-Konto erforderlich. Die Proberunde zählt nach der Kontoübernahme mit. Kontovorteile ausdrücklich einschließlich Weiterspielen auf PC, Handy und Tablet aufführen. [Neue Originalanweisungen](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Proberunde%20und%20Konto.txt).

Der frühere Auftrag zur Anmeldung vor jedem Spiel ist seit Sites-Version 59 veröffentlicht. Die hier beschriebene einzelne Proberunde ist seit [Sites-Version 64](Veroeffentlichung-2026-10-10-Version-64.json) veröffentlicht. Sie ersetzt die Anmeldung vor der ersten Runde, eröffnet aber keinen dauerhaften Gastmodus. [Früherer Auftrag](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Anmeldung%20und%20Online-Spielstand.txt), [Veröffentlichungsnachweis Version 59](Veroeffentlichung-2026-10-10-Version-59.json). Öffentlicher Sites-Zugang ohne vorgeschaltete ChatGPT-Anmeldung bleibt erhalten.

## Servergeprüfte Zeitrunden und weitere Geräte

Ergänzung für Kontospiele: [Servergeprüfte Zeitrunden](Servergepruefte-Zeitrunden-2026-10-10.md) sind lokal umgesetzt, noch nicht veröffentlicht. Genau ein aktiver Solo-Zeitlauf pro Konto, gebunden an die Sitzung im offenen Tab; Öffnen eines zweiten Geräts beendet ihn nicht. Neuladen ermöglicht weder Fortsetzen noch Zeitneustart. Bewusstes Beenden des bestehenden Laufs ist vor einem neuen Start erforderlich. Antworten werden sofort autoritativ online gesichert, der kompakte private Lernstand am Ende oder Abbruch gesammelt abgeglichen; geschlossene fehlende Antworten lassen sich beim nächsten Öffnen einmalig wiederherstellen. Normale Lernrunden behalten Revisionsprüfung und explizites Neuladen bei Gerätekonflikten. Die Proberunde bleibt ohne Zeitwertung.

## Einmalige Proberunde

- Einstieg „Eine Runde ausprobieren“ neben Anmeldung und Kontoanlage. Vor dem Start klare Ankündigung: zehn Fragen ohne Konto, danach kostenloses Konto erforderlich.
- Wahl eines Filmgenres oder aller Genres; zehn unterschiedliche Wissensziele aus leicht/mittel, ohne Zeitdruck. Normale Antwortauflösung und Erklärungen. Die Proberunde verwendet Freies Spiel und zählt dessen XP und Lernereignisse; sie ist keine gewertete Rekordrunde.
- Nach der letzten Antwort zunächst Ergebnis, unmittelbar darunter Kontoangebot und Vorteile; Rückblick bleibt frei zugänglich. „Nächste Runde“ öffnet die Registrierung. Keine zweite Gastspielrunde, auch nicht nach Neuladen, Abbruch oder in einem weiteren Fenster desselben Browsers. Eine begonnene Runde lässt sich fortsetzen.
- Kontovorteile: Lernfortschritt/Punkte/Rekorde behalten, gezielt wiederholen und Filmreise fortsetzen, Bestenlisten/Duelle sowie auf PC, Handy und Tablet mit demselben Konto weiterspielen. Registrierung erklärt E-Mail-Bestätigung und Passwort-Reset.
- „Konto erstellen & Runde übernehmen“ beziehungsweise „Anmelden & Runde übernehmen“ bindet die beendete Runde an die eingegebene E-Mail-Adresse. Nur das danach serverseitig bestätigte Konto mit derselben Adresse übernimmt sie automatisch. Bestehende Antworten, Einstellungen, aktive Kontorunden und Fragefassungen bleiben erhalten; dieselbe Runden-ID wird nicht doppelt importiert.
- Erst nach bestätigter Online-Speicherung verschwindet der Übernahmeentwurf. Bei fehlgeschlagener oder verlorener Bestätigung bleibt er für einen erneuten Versuch erhalten; auch nach Neuladen zählt die Runde höchstens einmal. Eine sichtbare Bestätigung erklärt die erfolgreiche Übernahme.
- Die E-Mail-Bestätigung darf ein neues Fenster desselben Browsers öffnen. Kontoaktivierung, Übernahme und initiale Katalogvorbereitung werden je Konto mit einem Web Lock nacheinander geöffnet; parallele Fenster starten nicht gegeneinander die erste Kontoaktivierung. Laufende Spiele behalten den bisherigen serverseitigen Revisionsschutz.

### Befristete Ausnahme für die Übernahme

Nur diese eine Proberunde liegt bis maximal 24 Stunden nach ihrem Start in `localStorage` (`wissensquiz-trial:v1`): zehn Fragesnapshots mit Antworten und abgeleitetem Fortschritt, Ablaufzeit und gegebenenfalls die zur Übernahme eingegebene E-Mail-Adresse. Kein Vollkatalog, Passwort oder Kontospielstand. Beim Ablauf im geöffneten Einstieg oder nächsten Zugriff wird der Entwurf entfernt; bei geschlossenem Browser kann die physische Bereinigung erst beim nächsten Aufruf erfolgen. Ein separater Marker `wissensquiz-trial-used:v1` enthält ausschließlich „yes“ und verhindert weitere Proberunden. Alle Änderungen dieser Runde werden zwischen Fenstern mit einem Web Lock abgestimmt.

Das ist die ausdrücklich angenommene befristete Übernahme aus dem neuen Ablauf; automatische dauerhafte lokale Kontospielstände und Offline-Paket bleiben entfernt. Alte IndexedDB-Gaststände werden weiterhin weder gelesen noch übernommen. E-Mail-Bestätigung auf einem anderen Gerät: Danach im ursprünglichen Browser anmelden, solange die 24 Stunden nicht abgelaufen sind. Erst der übernommene Kontostand steht auf anderen Geräten bereit. Löschen der Browserdaten, ein anderes Browserprofil oder Gerät kann ohne Konto nicht sicher als derselbe Besucher erkannt werden. Die Proberunde ist kein Identitäts- oder Manipulationsnachweis.

## Laufender Spielbetrieb

- Vor bestätigter Anmeldung erscheint der Einstieg mit höchstens einer Proberunde. Danach ausschließlich bestätigte Kontospiele; keine Übernahme alter Gastdaten.
- Der dauerhafte Kontospielstand liegt ausschließlich privat in Supabase. Der geöffnete Tab hält nur eine Arbeitskopie im Arbeitsspeicher; ausschließlich die befristete Proberunde bildet die oben beschriebene Ausnahme.
- Eine Kontoantwort, Einstellung oder Kontorunde wird erst nach Serverbestätigung übernommen. Speicherfehler zeigen „Nicht gespeichert“ und eine ausdrückliche Wiederholung. Bis dahin erscheint keine Antwortlösung. In der Proberunde genügt die befristete lokale Vormerkung; als online gespeichert gilt sie erst nach der Übernahme.
- Wiederholen sendet dieselbe unveränderliche Paket-ID. Eine verlorene Bestätigung zählt dadurch keine Antwort doppelt. Unbestätigte Absichten liegen nur im offenen Tab; nach Schließen oder Neuladen wird ausschließlich der tatsächlich bestätigte Serverstand geladen.
- Ein veralteter Stand darf einen neueren anderen Gerätestand nicht überschreiben. Die bestehende Serverrevision weist ihn ab; die Oberfläche bietet erneutes Laden.
- Vorhandene Online-Konten verwenden das bestehende Serverprotokoll einschließlich dessen Aktivierung. Dieser Block benötigt keine neue Datenbankmigration, keinen lokalen Fallback und keine Übernahme alter Geräteablagen.
- JSON-Export und ausdrücklich bestätigte Wiederherstellung bleiben manuelle Kontoaktionen. Große Ersetzungen verwenden den vorhandenen atomaren Serveraustausch. Sie sind keine automatische Browserablage.

`OnlineGameStore` ersetzt im aktiven Ablauf IndexedDB, dauerhafte Outbox, lokale Synchronisierungsbelege und Rückfallkopien. Auth-Sitzung, statische Veröffentlichungsdaten, Passwort-Reset-Marker und Meldungsentwürfe bleiben von Spielständen getrennt; sie speichern keinen Lernfortschritt. Die bestehenden alten Geräte-Datenbanken werden weder gelesen noch verändert oder ungefragt gelöscht. Frühere Speichermodule sind kein Bestandteil des aktiven Spielwegs. Unveränderliche Frageinhalte und Bewertungsfakten archivierter Runden werden im RAM schreibgeschützt geteilt; veränderliche Fortschrittsdaten, Rundenköpfe und Archivlisten bleiben getrennte Kopien. Die [sofortige Auswahlrückmeldung](Lernregeln.md#sofortige-auswahlrückmeldung--10102026) bestätigt den Klick neutral, während Lösungen und Ergebnis weiterhin die Speicherbestätigung abwarten.

## Entfernung des Offline-Pakets

Der Build erzeugt keine Precache-Liste. Die App registriert keinen Service Worker und lädt keine Bilder oder Nebenansichten vorsorglich herunter. Offline-Status, Update-Prüfung und die Anfrage nach dauerhaftem Gerätespeicher sind entfernt. Normales HTTP-Caching des Browsers ist kein App-Offline-Paket.

`public/sw.js` dient ausschließlich der Stilllegung bereits installierter Quiz-Worker: bisherige `film-*`-Caches löschen und sich abmelden. Er installiert keinen Fetch-Handler, legt keine neuen Caches an, erzwingt keinen Seitenwechsel und berührt keine Nutzerdaten. Neue Besucher rufen ihn nicht auf. Eine bereits geöffnete alte App kann bis zum nächsten Laden weiterhin ihren alten Code ausführen.

## Herkunft des bisherigen Verhaltens

Offline-Cache und lokaler Spielstand sind bereits im ersten Repository-Commit `8eb4960` vom 26.09.2026 enthalten. Ein gesonderter ursprünglicher Nutzerauftrag dafür wurde in den geprüften Projektunterlagen nicht gefunden. Der Codebefund belegt keinen Wunsch des Nutzers; daraus wird kein Auftrag abgeleitet.

## Prüfung und Veröffentlichung

Die [Nachprüfung der Datenübertragung vom 10.10.2026](Online-Datenuebertragung-2026-10-10.md) bestätigt kleine Änderungspakete für normale Runden und dokumentiert noch große Pakete bei Fehlerfrei/Zeitkonto. Lokal werden kleine neue Inhalte mit derselben atomaren Änderungsanfrage übertragen; Katalog und Metadaten laden parallel. Keine Änderung der Serverbestätigung oder der ausschließlich privaten Online-Speicherung; noch nicht veröffentlicht.

Isolierte Browserkonten verwenden ausschließlich synthetische Daten und das echte SQL-Speicherprotokoll in PGlite. Prüfergebnisse stehen im [Prüfbericht](Pruefbericht.md). Keine echten Nutzerdaten für Tests, keine Änderung der Produktionsdatenbank, kein Push und keine Veröffentlichung im Rahmen dieses Auftrags.

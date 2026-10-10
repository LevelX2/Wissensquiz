# Anmeldung und Online-Spielstand – 10.10.2026

## Verbindlicher Nutzerauftrag

Zum Spielen ist immer eine Anmeldung nötig. Offline-Paket und dauerhafte lokale Spielstände sind unerwünscht und werden entfernt. [Originalanweisungen](../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Anmeldung%20und%20Online-Spielstand.txt).

Das ersetzt frühere Projektbeschreibungen zu Gastspiel, IndexedDB und Offline-PWA. Die öffentliche Website benötigt weiterhin keine vorgeschaltete ChatGPT-Anmeldung; innerhalb des Quiz ist ein bestätigtes Quiz-Konto erforderlich. Seit Sites-Version 59 am 10.10.2026 veröffentlicht. [Veröffentlichungsnachweis](Veroeffentlichung-2026-10-10-Version-59.json).

## Laufender Spielbetrieb

- Vor bestätigter Anmeldung erscheint die Kontoansicht; kein Gastspiel und keine Gastübernahme.
- Der dauerhafte Spielstand liegt ausschließlich privat in Supabase. Der geöffnete Tab hält nur eine Arbeitskopie im Arbeitsspeicher.
- Eine Antwort, Einstellung oder Runde wird erst nach Serverbestätigung übernommen. Speicherfehler zeigen „Nicht gespeichert“ und eine ausdrückliche Wiederholung. Bis dahin erscheint keine Antwortlösung.
- Wiederholen sendet dieselbe unveränderliche Paket-ID. Eine verlorene Bestätigung zählt dadurch keine Antwort doppelt. Unbestätigte Absichten liegen nur im offenen Tab; nach Schließen oder Neuladen wird ausschließlich der tatsächlich bestätigte Serverstand geladen.
- Ein veralteter Stand darf einen neueren anderen Gerätestand nicht überschreiben. Die bestehende Serverrevision weist ihn ab; die Oberfläche bietet erneutes Laden.
- Vorhandene Online-Konten verwenden das bestehende Serverprotokoll einschließlich dessen Aktivierung. Keine neue Datenbankmigration, kein lokaler Fallback und keine Übernahme aus Geräteablagen.
- JSON-Export und ausdrücklich bestätigte Wiederherstellung bleiben manuelle Kontoaktionen. Große Ersetzungen verwenden den vorhandenen atomaren Serveraustausch. Sie sind keine automatische Browserablage.

`OnlineGameStore` ersetzt im aktiven Ablauf IndexedDB, dauerhafte Outbox, lokale Synchronisierungsbelege und Rückfallkopien. Auth-Sitzung, statische Veröffentlichungsdaten, Passwort-Reset-Marker und Meldungsentwürfe bleiben von Spielständen getrennt; sie speichern keinen Lernfortschritt. Die bestehenden alten Geräte-Datenbanken werden weder gelesen noch verändert oder ungefragt gelöscht. Frühere Speichermodule sind kein Bestandteil des aktiven Spielwegs. Unveränderliche Frageinhalte werden im RAM schreibgeschützt geteilt; veränderliche Fortschrittsdaten und Rundenlisten bleiben getrennte Kopien.

## Entfernung des Offline-Pakets

Der Build erzeugt keine Precache-Liste. Die App registriert keinen Service Worker und lädt keine Bilder oder Nebenansichten vorsorglich herunter. Offline-Status, Update-Prüfung und die Anfrage nach dauerhaftem Gerätespeicher sind entfernt. Normales HTTP-Caching des Browsers ist kein App-Offline-Paket.

`public/sw.js` dient ausschließlich der Stilllegung bereits installierter Quiz-Worker: bisherige `film-*`-Caches löschen und sich abmelden. Er installiert keinen Fetch-Handler, legt keine neuen Caches an, erzwingt keinen Seitenwechsel und berührt keine Nutzerdaten. Neue Besucher rufen ihn nicht auf. Eine bereits geöffnete alte App kann bis zum nächsten Laden weiterhin ihren alten Code ausführen.

## Herkunft des bisherigen Verhaltens

Offline-Cache und lokaler Spielstand sind bereits im ersten Repository-Commit `8eb4960` vom 26.09.2026 enthalten. Ein gesonderter ursprünglicher Nutzerauftrag dafür wurde in den geprüften Projektunterlagen nicht gefunden. Der Codebefund belegt keinen Wunsch des Nutzers; daraus wird kein Auftrag abgeleitet.

## Prüfung und Veröffentlichung

Die [Nachprüfung der Datenübertragung vom 10.10.2026](Online-Datenuebertragung-2026-10-10.md) bestätigt kleine Änderungspakete für normale Runden und dokumentiert noch große Pakete bei Fehlerfrei/Zeitkonto. Lokal werden kleine neue Inhalte mit derselben atomaren Änderungsanfrage übertragen; Katalog und Metadaten laden parallel. Keine Änderung der Serverbestätigung oder der ausschließlich privaten Online-Speicherung; noch nicht veröffentlicht.

Isolierte Browserkonten verwenden ausschließlich synthetische Daten und das echte SQL-Speicherprotokoll in PGlite. Prüfergebnisse stehen im [Prüfbericht](Pruefbericht.md). Keine echten Nutzerdaten für Tests, keine Änderung der Produktionsdatenbank, kein Push und keine Veröffentlichung im Rahmen dieses Auftrags.

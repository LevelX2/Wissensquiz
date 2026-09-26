# Sites-Veröffentlichung

Private Site: https://wissensquiz-filmkosmos.levelx2.chatgpt.site

Projekt-ID aus `.openai/hosting.json` wiederverwenden: `appgprj_6ab78f6468648191a8895f7a1d9dbf23`. Zugriff ist nur für den Eigentümer eingerichtet. Keine Zugriffserweiterung ohne Nutzerauftrag.

## Ablauf

1. Den aktuellen `sites-hosting`-Skill lesen. Bei bestehender Site ihren Zustand und Quellstand über die nativen Werkzeuge und den gebündelten Workflow öffnen.
2. Änderungen prüfen (`npm test`, `npm run build`, bei UI/Persistenz `npm run test:browser`). Der statische Build liegt unter `dist/`.
3. Kurzlebige Quellberechtigung nur im Sitzungsspeicher halten und als versteckte Standardeingabe an `site-workflow.mjs` übergeben. Nie in Dateien, Kommandoargumente oder Logs schreiben.
4. Unter Windows benötigt der Workflow Git-Bash im Prozess-PATH (`C:\Program Files\Git\bin`). `TAR_OPTIONS=--force-local` verhindert, dass GNU tar den Laufwerkbuchstaben des Archivpfads als Remote-Host auslegt. Diese Variablen nur für den Prozess setzen.
5. Der gebündelte Build-Helfer fand npm in dieser Windows-Umgebung nicht korrekt. `npm run build` in PowerShell war erfolgreich; danach im Workflow den unveränderten Build mit leerer `commands`-Liste verwenden. Der Workflow prüft und pusht den Quellstand und paketiert das Artefakt.
6. Genau den zurückgegebenen Commit und Archivpfad mit `sites_save_version_and_deploy_private` speichern und veröffentlichen. Bei bereits gespeicherter Version diese weiterverwenden. Auf `succeeded` samt URL warten; anschließend die native Browserübergabe verwenden.

Keine Nutzerspielstände veröffentlichen. Diese liegen ausschließlich im jeweiligen Browser. Bei Adresswechsel JSON exportieren/importieren. Updates warten auf das Schließen alter App-Fenster. Das neue Action-Paket ergänzt bestehende Sci-Fi-Spielstände transaktional.

Seit Version 3 enthält die Live-Site zusätzlich das Horror-Paket. Es ergänzt bestehende Sci-Fi-/Action-Spielstände über denselben Mechanismus und ist im Produktions-Build für den Offline-Cache enthalten. Projekt-ID, URL und privater Zugriff bleiben unverändert.

### Veröffentlichung ohne lokalen Sites-Helfer

Für Version 6 war der gebündelte Helfer zwischenzeitlich verfügbar. Bei der Kontenaktivierung und der aktuellen Fortsetzung ist er erneut nicht installiert; die nativen Sites-Werkzeuge stehen bereit. Deshalb wird der folgende dokumentierte Ersatzablauf verwendet.

Am 26.09.2026 waren der zuvor verwendete `sites-hosting`-Skill und `site-workflow.mjs` nicht mehr installiert, die nativen Sites-Werkzeuge jedoch verfügbar. Die Aktualisierung erfolgte anhand ihrer aktuellen Schnittstellen: geprüften Quellstand lokal committen, kurzlebige Schreibberechtigung anfordern, genau den Commit über die zurückgegebene Git-URL auf deren Quellbranch übertragen, aus diesem sauberen Stand bauen, `.openai/hosting.json` und `dist/` als TAR paketieren und gemeinsam als private Version speichern/veröffentlichen. Authentifizierung nur im Sitzungsspeicher und in der Umgebung des Git-Unterprozesses über `http.extraHeader`; kein Token in Datei, URL oder Kommandoargument, kein dauerhafter Git-Remote. Windows-TAR mit relativem Archivpfad verwendet. Keine automatische Veröffentlichung beim Push angefordert.

## Testpersonen einladen

Bei der letzten Prüfung waren externe Besuchereinladungen für diese Site erlaubt; weiterhin nur Eigentümerzugriff, keine Testpersonen hinzugefügt. In [Sites](https://chatgpt.com/sites) das Projekt öffnen, **Share/Teilen** wählen, **Only those invited/Nur eingeladene Personen** beibehalten, E-Mail-Adresse eintragen und mit **Viewer/Besucher** einladen. Empfänger öffnen denselben Site-Link und melden sich mit dem freigegebenen Konto an. Besucher dürfen die App benutzen, aber nicht bearbeiten oder veröffentlichen. [Offizielle Anleitung](https://learn.chatgpt.com/docs/sites#invite-people-outside-your-workspace). Spielstände bleiben pro Gerät und Browser getrennt.

## Nachweis und Grenzen

Erste Sci-Fi-Veröffentlichung am 26.09.2026: Commit `8eb496029c298cf8884fc3f78c5b0353bfc6e275`, Deployment `appgdep_6ab790d7de608191bed13e0cfe741d93`, nativer Status `succeeded`.

Version 3 am 26.09.2026: Commit `f871f709ef6fd413c9a3a159b27fe13d07daac9e`, Version `appgprj_6ab78f6468648191a8895f7a1d9dbf23~appgver_5bf18f9628b481919068c0db205a268e`, Deployment `appgdep_6ab7a24215f48191b7c425ba389f75d8`, Status `succeeded`. Live-Startseite, Service Worker und Horror-CSV lieferten bei authentifiziertem HTTP-Abruf Status 200; Horror-Datei bytegleich mit der Rohquelle und im Service-Worker-Manifest enthalten. Kein vollständiger Live-Browser-/Gerätetest. Die Versionshistorie weist auch eine gespeicherte Action-Version 2 mit Commit `5a27b1ad5a85a1c344fcde46325fc55db1e1fe28` aus.

Lokale Chromium-Prüfungen umfassen Offline-Neuladen, sichere Updates und Speichererhalt. Die private Sites-Anmeldung sowie PWA-Installation auf einem echten Smartphone wurden nicht im Browser geprüft.

Version 4 (Mehrfachauswahl) am 26.09.2026: Commit `ffdeeb6989fb5a98850e0cc0068d2b9aa8e97462`, Deployment `appgdep_6ab7a53ad8a88191bb0cdb6cfc05ac20`, Status `succeeded`. Authentifizierte Live-Abrufe von JavaScript, CSS und Service Worker Status 200 und bytegleich mit dem Build. Startseite erreichbar, HTML nicht bytegleich mit der lokalen Datei. Private Zugriffsliste unverändert.

Version 5 (Sound, Vibration, Icons und Rekordansicht) am 26.09.2026: Commit `2e99f637538370d1a5a9faa9a856a8713860ffdd`, Deployment `appgdep_6ab7a740aaf08191b7cc7c38f569006f`, Status `succeeded`. Live-HTML verweist auf den aktuellen JavaScript-Build. JavaScript, CSS und Service Worker Status 200 und bytegleich. Privater Eigentümerzugriff unverändert, keine Besucher ergänzt. Ton/Vibration werden ausschließlich lokal erzeugt; keine externen Mediendienste.

Version 6 (Fantasy, Conjuring-Darsteller und Schwierigkeit jeder Frage) am 26.09.2026: Commit `44f6a2882948e5ea56b90b1377aa75ba16564968`, Version `appgprj_6ab78f6468648191a8895f7a1d9dbf23~appgver_fc1164f342c08191a5abaa10520a4de0`, Deployment `appgdep_6ab7b115975481918fe0410551c6019e`, Status `succeeded`. Der gebündelte Workflow übertrug den geprüften Commit und paketierte den unveränderten Build. Privater Zugriff und bestehende URL erhalten, keine Besucher hinzugefügt. 45 Logiktests und 18 lokale Chromium-Prüfungen erfolgreich; keine zusätzliche Live-Browser-/Geräteprüfung. Bei weiterhin alter Ansicht Strg+F5 beziehungsweise alle alten App-Fenster schließen und neu öffnen; keine Browserdaten löschen.

Darstellerergänzungen, optionale Fragehinweise und persönliche Bestenliste am 26.09.2026: Commit `b043771740024602b28afb1180868732893cfcc8`, Version `appgprj_6ab78f6468648191a8895f7a1d9dbf23~appgver_d1124537559c8191aeb8c1c3c8af5c34`, Deployment `appgdep_6ab7b95a04c48191a694ebfc92e40514`, nativer Status `succeeded`. Bestehende private URL und Zugriff erhalten. 51 Logik-/Speicherprüfungen, Produktions-Build, 20 Chromium-Prüfungen und Diff-Prüfung erfolgreich. Alle getrackten CSV bytegleich zum vorherigen Commit. Browserübergabe nach Veröffentlichung; keine zusätzliche Live-PWA-/Geräteprüfung.

Vorbereitete Kontenanbindung am 26.09.2026: Commit `a34a0e0a0bff476d92f91b0bc9932a07b36ff923`, Version `appgprj_6ab78f6468648191a8895f7a1d9dbf23~appgver_4e432f37b6f88191887d6aad11de9fba`, Deployment `appgdep_6ab7c027da548191adef4fe60691f08b`, nativer Status `succeeded`. 57 Logik-/Datenbanktests, 25 Chromium-Prüfungen, Produktions-Build und Diff-Prüfung erfolgreich; Audit 0. Kontoansicht veröffentlicht, Kontodienst per Konfiguration deaktiviert. Keine echten Nutzerkonten, Mails oder Online-Spielstände eingerichtet. Private Freigabe und bestehende URL erhalten; native Browserübergabe erfolgt. Aktivierung nach [Konten-Einrichtung](Konten-Einrichtung.md), echte Dienstprüfung noch offen.

Private Kontenaktivierung am 26.09.2026: Commit `f115047ce8f4f75114a8204680feecb49e4b3057`, Version `appgprj_6ab78f6468648191a8895f7a1d9dbf23~appgver_020e70138dc48191bcf15819d7a9c052`, Deployment `appgdep_6ab7ca90deec8191ac5d8482f6f57fa4`, nativer Status `succeeded`. 57 Logik-/Datenbanktests und 25 Browserprüfungen erfolgreich. SMTP und Mailvorlagen eingerichtet, Konto-Konfiguration aktiviert; echte Registrierung und Mailzustellung noch offen. Bestehender Eigentümerzugriff und URL erhalten. Gebündelter Sites-Helfer aktuell nicht installiert; dokumentierten nativen Ersatzablauf verwendet, remote Quellstand als Vorfahr geprüft, exakten sauberen Commit ohne Force-Push übertragen und daraus gebautes TAR veröffentlicht. Im internen Live-Browser Anmeldung und Registrierungsformular sichtbar; keine Passwörter eingegeben oder Quizstände geändert. Ein zweiter Tab zeigte noch den alten PWA-Cache und wurde geschlossen. Physische PWA-/Offline-Prüfung bleibt offen.

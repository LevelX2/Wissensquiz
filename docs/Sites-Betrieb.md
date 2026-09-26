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

## Nachweis und Grenzen

Erste Sci-Fi-Veröffentlichung am 26.09.2026: Commit `8eb496029c298cf8884fc3f78c5b0353bfc6e275`, Deployment `appgdep_6ab790d7de608191bed13e0cfe741d93`, nativer Status `succeeded`.

Lokale Chromium-Prüfungen umfassen Offline-Neuladen, sichere Updates und Speichererhalt. Die private Sites-Anmeldung sowie PWA-Installation auf einem echten Smartphone wurden nicht im Browser geprüft.

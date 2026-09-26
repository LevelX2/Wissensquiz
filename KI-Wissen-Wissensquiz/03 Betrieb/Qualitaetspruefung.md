# Qualitätsprüfung

## Prüfungen der Projektgrundstruktur

- Mindeststruktur und relative Markdown-Verweise prüfen.
- `git diff --check` vor dem Commit ausführen.
- Mit `git check-ignore AGENTS.local.md .env .venv data node_modules dist` die lokalen Ausschlüsse prüfen.
- Nach dem Commit sauberen Git-Status und fehlende Remotes verifizieren.

## Anwendung prüfen

- `npm test`: 109 gezielte Tests für CSV, Antworten, Punkte, Lernlogik, Genre-/Stufenauswahl, Rekordkategorien, Abzeichen, idempotente Speicherung, Paketerweiterung und Backups einschließlich Sound-/Vibrationseinstellungen.
- `npm run build`: TypeScript und Produktionspaket einschließlich Offline-Manifest.
- `npm run test:browser`: 60 Browserprüfungen (58 Chromium und zwei WebKit mit iPhone-Profil) erfolgreich: 59 im vollständigen Lauf, Fortschrittsanzeige nach Testablaufkorrektur gezielt nachgeprüft; Jahres-/Regiefragen, Filmdaten, dynamische Antwortsicherung und farbige Fortschrittsfelder ebenfalls geprüft; Spielmodus-Bilder, Kino-Kulisse und Offline-Einstieg zusätzlich geprüft, für kombinierte Filter, Paketerweiterung bestehender Spielstände, Einstieg, Spielen, Wiederaufnahme, Mobilansicht, Export/Import, Timer, Offline-Neuladen mit Horror-/Fantasy-Inhalten, Browserneustart, Updateverhalten, Tastatur, automatische Barrierearmut, Ton-/Vibrationssteuerung, Rekordübersicht, Darstellerergänzungen, unabhängig schaltbare Genre-/Schwierigkeitshinweise und die filterbare lokale Bestenliste.
- Kontentests: Konfiguration, getrennte Gast-/Kontostände, SQL-Rollen/RLS/Revisionskonflikte sowie simulierte Registrierung/Bestätigung/Reset/Anmeldung. Echte Bestätigung und Handy-Anmeldung wurden bereits bestätigt; reale geräteübergreifende Spielstandsabnahme bleibt offen.
- `npm audit`: keine bekannten Schwachstellen im geprüften Lockfile.
- [Detaillierter Prüfnachweis und Grenzen](../../docs/Pruefbericht.md).

Browserprofile der Tests sind isoliert; keine echten Spielstände verwenden. Zeitreisen ausschließlich in Tests. Mobile Antwortansicht zusätzlich mit WebKit geprüft. Physisches Smartphone, reales Safari/Firefox und HTTPS-Installation bleiben gesondert zu prüfen.

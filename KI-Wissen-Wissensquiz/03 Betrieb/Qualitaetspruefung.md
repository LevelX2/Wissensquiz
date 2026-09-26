# Qualitätsprüfung

## Prüfungen der Projektgrundstruktur

- Mindeststruktur und relative Markdown-Verweise prüfen.
- `git diff --check` vor dem Commit ausführen.
- Mit `git check-ignore AGENTS.local.md .env .venv data node_modules dist` die lokalen Ausschlüsse prüfen.
- Nach dem Commit sauberen Git-Status und fehlende Remotes verifizieren.

## Anwendung prüfen

- `npm test`: 45 gezielte Tests für CSV, Antworten, Punkte, Lernlogik, Genre-/Stufenauswahl, Rekordkategorien, Abzeichen, idempotente Speicherung, Paketerweiterung und Backups einschließlich Sound-/Vibrationseinstellungen.
- `npm run build`: TypeScript und Produktionspaket einschließlich Offline-Manifest.
- `npm run test:browser`: 18 Chromium-Prüfungen für kombinierte Filter, Paketerweiterung bestehender Spielstände, Einstieg, Spielen, Wiederaufnahme, Mobilansicht, Export/Import, Timer, Offline-Neuladen mit Horror-/Fantasy-Inhalten, Browserneustart, Updateverhalten, Tastatur, automatische Barrierearmut, Ton-/Vibrationssteuerung, Rekordübersicht, Conjuring-Darsteller und Schwierigkeit der einzelnen Frage.
- `npm audit`: keine bekannten Schwachstellen im geprüften Lockfile.
- [Detaillierter Prüfnachweis und Grenzen](../../docs/Pruefbericht.md).

Browserprofile der Tests sind isoliert; keine echten Spielstände verwenden. Zeitreisen ausschließlich in Tests. Physisches Smartphone, Safari/Firefox und HTTPS-Installation sind noch nicht geprüft.

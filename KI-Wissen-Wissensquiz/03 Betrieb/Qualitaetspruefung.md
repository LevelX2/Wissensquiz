# Qualitätsprüfung

## Prüfungen der Projektgrundstruktur

- Mindeststruktur und relative Markdown-Verweise prüfen.
- `git diff --check` vor dem Commit ausführen.
- Mit `git check-ignore AGENTS.local.md .env .venv data node_modules dist` die lokalen Ausschlüsse prüfen.
- Nach dem Commit sauberen Git-Status und fehlende Remotes verifizieren.

## Anwendung prüfen

- `npm test`: 116 gezielte Tests für CSV, Antworten, Punkte, Lernlogik, Genre-/Stufenauswahl, Rekordkategorien, Abzeichen, idempotente Speicherung, Paketerweiterung und Backups einschließlich Sound-/Vibrationseinstellungen.
- `npm run build`: TypeScript und Produktionspaket einschließlich Offline-Manifest.
- `npm run test:browser`: vollständiger Lauf aller 62 Prüfungen erfolgreich (60 Chromium, zwei WebKit/iPhone-Profil). Enthalten sind gespeicherte Rundenauswahl, entfernte Favoriten/Filmauswahl, Themenbrowsing, automatische Kontosynchronisierung und Gerätewechsel mit komprimiertem Fragenkatalog, Offline, Wiederherstellung, mobile Bedienung und Barrierearmut.
- Kompaktkodierung: verlustfreie Rücklesung einschließlich dynamischer Jahresantworten, stabiler Synchronisationsfingerabdruck und unveränderte SQL-Ergebnis-/Spielerprojektionen. Katalogübertragung von 8,0 auf 1,54 MB reduziert (80,8 %); keine Aussage über physische PostgreSQL-Belegung.
- Kontentests: Konfiguration, getrennte Gast-/Kontostände, SQL-Rollen/RLS/Revisionskonflikte sowie simulierte Registrierung/Bestätigung/Reset/Anmeldung. Echte Bestätigung und Handy-Anmeldung wurden bereits bestätigt; reale geräteübergreifende Spielstandsabnahme bleibt offen.
- `npm audit`: keine bekannten Schwachstellen im geprüften Lockfile.
- [Detaillierter Prüfnachweis und Grenzen](../../docs/Pruefbericht.md).

Browserprofile der Tests sind isoliert; keine echten Spielstände verwenden. Zeitreisen ausschließlich in Tests. Mobile Antwortansicht zusätzlich mit WebKit geprüft. Physisches Smartphone, reales Safari/Firefox und HTTPS-Installation bleiben gesondert zu prüfen.

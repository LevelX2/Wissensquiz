# Qualitätsprüfung

Ergänzender Nachweis 02.10.2026 – Regienachsätze: **151 Logik-/Datenbanktests, Build und sieben gezielte Chromium-Browserfälle erfolgreich**. Bereinigte Anzeige der 100 neueren Regievertiefungen einschließlich Offline-Neuladen, unveränderte historische Frageobjekte und zwölf erhaltene Credithinweise geprüft. Die 312 älteren individuellen Regietexte erhalten; 13 vorhandene CSV-Regiefragen ohne diesen Standardsatz. Der folgende vollständige Browserlauf gehört zum vorherigen Stand. [Prüfbericht](../../docs/Pruefbericht.md).

Aktueller Nachweis 02.10.2026: **151 Logik-/Datenbanktests, Build und vollständiger Lauf aller 73 Browserfälle erfolgreich** (68 Chromium, fünf WebKit), betroffene Highscore-Fälle nach finaler UI-Straffung erneut geprüft. Vereinfachte Rekordkarten, erste Rekordauswahl, Gast-Anmeldung, Filter, Rückblick, Kategorie-Vorauswahl anhand der SQL-Vergleichsfelder, Spielerwerte und Ladefehler. 320-Pixel-Ansichten ohne horizontalen Überlauf, WCAG-Prüfungen ohne Befund und Screenshots visuell geprüft. Fehlertraining einschließlich Sicherungen und bisheriger Tagesgrenzen; Rundenauswertung, direkte Fehlerrunde und Rückblickfilter ebenfalls geprüft. Chromium mit Offline-Neuladen; WebKit mit Wiederaufnahme und anschließendem Offline-Spielen, Offline-Navigation im Windows-Testbrowser nicht nachgewiesen. Neue Ranglistenmigration lokal geprüft und live erfolgreich angewendet; Fehlertraining aktiv, anonyme Ausführung und anonymer Zugriff auf private Spielstände gesperrt. [Prüfbericht](../../docs/Pruefbericht.md).

Früherer Nachweis 29.09.2026: 141 Logik-/Datenbanktests, Build und alle 66 unterschiedlichen Browserfälle erfolgreich. Komödie-Upgrade erhält 3.257 alte Fragen, Fortschritt und Freischaltungen; 50 neue Filmreferenzen, Offlinepaket und Regie-Hintergrund geprüft. Details: [Prüfbericht](../../docs/Pruefbericht.md).

Früherer Nachweis 29.09.2026: 136 Logik-/Datenbanktests, Build und alle 65 Browserfälle erfolgreich. Sci-Fi-Upgrade erhält 2.797 alte Fragen, Fortschritt und Freischaltungen; 50 neue Filmreferenzen, Offlinepaket und Regie-Hintergrund geprüft. Details: [Prüfbericht](../../docs/Pruefbericht.md).

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

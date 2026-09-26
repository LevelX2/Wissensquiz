# Projektanweisungen Wissensquiz

## Einstieg und Priorität

- Projektwissen liegt in `KI-Wissen-Wissensquiz/`.
- Bei unbekanntem Kontext: `KI-Wissen-Wissensquiz/00 Projektstart.md`.
- Projektfragen: zuerst `KI-Wissen-Wissensquiz/02 Wissen/00 Uebersichten/Index.md` oder die bekannte aktuelle Fachseite lesen (`wiki-first`).
- Codeänderungen: betroffene Verträge, Implementierung und passende Checks unmittelbar prüfen. Unveränderten Kontext wiederverwenden.
- Wissenspflege: Prozessseite `KI-Wissen-Wissensquiz/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md` und `KI-Wissen-Wissensquiz/00 Steuerung/Regeldatei KI-Wissenspflege.md` lesen.
- Für relevante lokale Pfadauflösung `AGENTS.local.md` ausdrücklich lesen, falls vorhanden; sie wird nicht automatisch geladen.
- Reihenfolge: projektspezifische Regeln im Repository, lokale Auflösung durch `AGENTS.local.md`, globale oder typspezifische Defaults aus `mein-wissen`. Die lokale Datei ersetzt keine Projektregeln. Aktuelle Nutzeranweisungen haben Vorrang.

## Arbeitsweise und Sprache

- Nutzer mit Du ansprechen; sichtbare UI-Texte und deutsche Wissensseiten mit echten Umlauten und ß verfassen. Technische Pfade, IDs, Symbole und Originalzitate unverändert lassen.
- Belastbare, dauerhaft nützliche Erkenntnisse auf passenden Wissensseiten pflegen. Klare Folgepflege direkt ausführen; bei ungeklärten fachlichen Widersprüchen oder Zuordnungen gezielt nachfragen.
- Neue generische Regeln nur mit ausdrücklicher Freigabe in das Haupt-Vault übernehmen.
- Rohquellen unverändert erhalten, vollständig auswerten und betroffene Wissensseiten, Index und bei Relevanz das Log nachziehen. Widersprüche sichtbar machen.
- Status als aktuellen Snapshot führen. Das Log bleibt chronologisch und append-only; nur wesentliche Entwicklungen, Entscheidungen, Risiken, Verifikationen und Abschlussstände dokumentieren, keine einzelnen Toolaufrufe.

## Git, Checks und Sicherheit

- Git-Modell: lokales Git ohne dauerhaft konfigurierten Remote; Sites-Quellveröffentlichung nach ausdrücklichem Hostingauftrag. Integrationsbranch: `main`.
- Vor Arbeitsänderungen auf `main` einen passenden `codex/`-Arbeitsbranch anlegen. Die initiale Projektanlage erfolgt auf `codex/projektanlage`; `main` erhält denselben Initialstand.
- Remote, Push, PR und Veröffentlichung nur nach ausdrücklichem Auftrag.
- Sites ist über `.openai/hosting.json` verknüpft; bestehende Projekt-ID erhalten. Der Nutzer hat inzwischen öffentlichen Besucherzugriff ohne vorgeschaltete ChatGPT-Anmeldung beauftragt; umgesetzt am 26.09.2026. Veröffentlichungen und spätere Site-Änderungen nach `sites-hosting` bzw. dokumentiertem Ersatzablauf in `docs/Sites-Betrieb.md` ausführen; bestehenden Zugriff erhalten. Gastspielstände bleiben im Browser; angemeldete Kontostände werden automatisch privat in Supabase gesichert. Keine Nutzerdaten in Veröffentlichungsartefakte aufnehmen.
- Keine Secrets, privaten Pfade, lokalen Nutzdaten oder reproduzierbaren Build-Artefakte versionieren.
- Stack: React/TypeScript, Vite, IndexedDB, statische PWA. Kein verpflichtendes Backend.
- Fachverträge: `docs/Importformat.md` und `docs/Lernregeln.md`; Prüfnachweis: `docs/Pruefbericht.md`.
- Checks: `npm test`, `npm run build`, für Oberfläche/Persistenz/Offline `npm run test:browser`; ergänzend `git diff --check` und bei Abhängigkeitsänderungen `npm audit`.
- Tests nur mit isolierten Browserprofilen und kontrollierter Testzeit durchführen. Echte Nutzerdaten nicht für Testfortschritte verändern.
- Roh-CSV unverändert erhalten. Bestehende Frage-IDs nicht still überschreiben; Varianten teilen Wissensziel-IDs. Lernpunkte und Rekordzeit getrennt behandeln.

## Abschlusskommandos

Für `Finito`, `Ende`, `Finale`, `Endfinale` und sinngleiche ausdrückliche Abschlusswünsche den persönlichen Skill `abschlusskommandos` verwenden.

- `Finito`/`Ende`: offene und ungetrackte Änderungen einordnen, Wissen und passende Checks prüfen, abgeschlossene zugehörige Teile in fachlichen Blöcken lokal committen. Kein automatischer Merge oder Push.
- `Finale`: zuerst lokaler Abschluss; bei erfüllten Gates lokal nach `main` integrieren und schnelle Checks erneut ausführen. Kein Push bei diesem Git-Modell.
- `Endfinale`: zuvor erweiterten Verify-Lauf sowie Wissens-, Risiko- und Restpunkteprüfung ausführen.
- Fremde, unfertige, private oder unklare Änderungen erhalten und benennen; nicht blind committen oder verwerfen. Relevante Konflikte, fehlgeschlagene Pflichtchecks und ungeklärte Entscheidungen vor Integration lösen.

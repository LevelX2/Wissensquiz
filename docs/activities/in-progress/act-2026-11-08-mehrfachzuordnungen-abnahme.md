---
activityId: act-2026-11-08-mehrfachzuordnungen-abnahme
status: in_progress
startedAt: 2026-11-08
owner: wissensquiz-werkarten-20261108-root
branch: codex/werkarten-mehrfachzuordnungen-20261108
kind: fix
area: shared
priority: normal
primaryAgent: codex
requiresImplementation: true
createdAt: 2026-11-08
blockedBy: [act-2026-11-08-werkarten-mehrfachzuordnungen, act-2026-11-08-lernstand-freischaltungen, act-2026-11-08-ausgewogene-filmreise, act-2026-11-08-auswahl-zuordnungssymbole]
resultArtifacts: []
checks: []
---

# Gemeinsame Integration und Abnahme

## Ziel

Die zuvor einzeln geprüften Änderungen durch alle betroffenen Spielwege verfolgen und den tatsächlichen aktuellen Stand nachvollziehbar abnehmen.

## Kontext und Quellen

[Paketübersicht](../README.md), [Produktentscheidungen](../../Fragedaten-Organisation.md#beschlossener-zielzustand-werkarten-und-mehrfachzuordnungen--08112026), `AGENTS.md`, `docs/Pruefbericht.md`, `docs/Sites-Betrieb.md` und der Online-Spielstandsvertrag.

## Scope

- Gemeinsame Fälle durch Katalog, Filter, Onlineausgabe, Lernstatus, Freischaltung, Themenkarten und Symbole verfolgen.
- Freies Spiel, Filmreise, Wiederholen/Fehlertraining, Zeitspiele, Duell und Proberunde auf tatsächlich betroffene Verträge prüfen; anonyme Proberunde und bestätigtes Konto getrennt behandeln.
- Duellthemen und Rekordbezeichnungen auf die neue Auswahl abstimmen, ohne gleiche Runden mehrfach zu werten oder laufende Ergebnisse umzudeuten.
- Wissensseiten und den Prüfbericht auf den tatsächlichen Umsetzungsstand bringen.

## Nicht im Scope

Automatische Veröffentlichung, Aktivierung produktiver Datenbankänderungen, Änderungen echter Spielstände oder zusätzliche Altstands-Kompatibilität ohne Auftrag. Die Umbenennung in „Quellen und Links“, sprechende Linktexte und IMDb-/OFDb-Verweise übernimmt auf Nutzerwunsch ein anderer Chat; diese Arbeiten sind keine Abhängigkeit dieses Pakets.

## Akzeptanzkriterien

- Dieselben Wissensziel-IDs und dieselbe Antwort bewirken konsistenten Lernstand in allen passenden Ansichten; globale Zählung und XP bleiben eindeutig.
- Ausgewogene Auswahl und fehlende Zusatzlose sind belegt; bloße Duplikatfreiheit gilt nicht als Verteilungsnachweis.
- Filter-/Freischaltkombinationen für Film/Serie, Werk-/Personen-/Preisfragen und Mehrfachgenres sind mit isolierten Daten geprüft.
- Lösungsschutz gilt in jeder Auflösungsvariante; vorhandene beziehungsweise separat integrierte Linkdarstellungen bleiben funktionsfähig.
- Gezielte Prüfungen der Teilpakete sind erfolgreich; offene fachliche Serienregeln sind ausdrücklich benannt.
- Vor einer ausdrücklich beauftragten Veröffentlichung zentral auf dem gemeinsamen Stand: `npm test`, `npm run build`, `npm run test:browser`, `git diff --check` und bei Abhängigkeitsänderungen `npm audit` erfolgreich.
- Eigene temporäre Prüfartefakte nach den Projektregeln bereinigen; fremde Arbeitsstände erhalten.

## Umsetzungshinweise

Keine parallelen vollständigen Prüfläufe für denselben gemeinsamen Stand. Erfolgreiche passende Nachweise wiederverwenden. Onlineänderungen gemäß den Projekt- und Supabase-Vorgaben lokal vorbereiten; produktive Aktivierung erst mit konkreter Veröffentlichungsfreigabe. Diese Vorsortierung selbst benötigt keine Softwaretests.

## Ergebnisnotiz

Vorbereitet; noch keine Implementierungs- oder Veröffentlichungsabnahme.

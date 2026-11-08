---
activityId: act-2026-11-08-ausgewogene-filmreise
status: done
completedAt: 2026-11-08
startedAt: 2026-11-08
owner: wissensquiz-werkarten-20261108-root
branch: codex/werkarten-mehrfachzuordnungen-20261108
kind: fix
area: engine
priority: normal
primaryAgent: codex
requiresImplementation: true
createdAt: 2026-11-08
blockedBy: [act-2026-11-08-werkarten-mehrfachzuordnungen, act-2026-11-08-lernstand-freischaltungen]
resultArtifacts: [src/selectionSlots.ts, src/engine.ts, supabase/migrations/20261108082311_unique_goal_selection_paths.sql, tests/work-selection.test.ts, docs/Filmreise-Freischaltung-2026-10-11.md]
checks: ["27 gezielte Tests in vier Dateien", "npm run check", "git diff --check"]
---

# Ausgewogene Filmreise bei überlappenden Zuordnungen

## Ziel

Ausgewogene Lernbereiche beibehalten und zusätzliche Lose allein durch weitere Zuordnungen desselben Wissensziels verhindern.

## Kontext und Quellen

[Gewählte Mischregel](../../Fragedaten-Organisation.md#beschlossener-zielzustand-werkarten-und-mehrfachzuordnungen--08112026), [aktuelle Bereichsauslosung](../../Filmreise-Freischaltung-2026-10-11.md#auswahl-neuer-ziele). Der heutige Weg Bereich → Bekanntheitsgruppe ermöglicht mehrere Zugangswege zu einem gemeinsamen Ziel. Bloßes Entfernen eines bereits gezogenen Ziels behebt einen vorherigen Wahrscheinlichkeitsvorteil nicht.

## Scope

- Auswahlalgorithmus für überlappende Bereiche konkret festlegen und dessen Zielverteilung vor Umsetzung begründen.
- Neue, fällige und bekannte Ziele mit denselben Zuordnungsregeln behandeln; bestehende Wiederholungsreservierung und Fälligkeitsprioritäten erhalten.
- Filter und Freischaltungen vor der Auswahl anwenden; jeder gezogene Fakt wird mit allen Varianten aus sämtlichen Restmengen entfernt.

## Nicht im Scope

Neue Punktelogik, starre Quoten je Zehnerrunde oder pauschale Umstellung auf gleiche Chancen aller Fakten unabhängig von den Bereichen.

## Akzeptanzkriterien

- Kontrollierte Fälle mit disjunkten und überlappenden Bereichen belegen die gewählte ausgewogene Mischung und den Umgang mit Mehrfachzuordnungen.
- Zusätzliche Varianten oder gleichbedeutende Zuordnungen geben keinem Ziel zusätzliche Lose; zulässige alternative Filterzugänge bleiben nutzbar.
- Ein Ziel erscheint höchstens einmal je Runde, auch bei gleichzeitig gewählten Werk-, Personen- und Preisbereichen.
- Leere/gesperrte Bereiche, kleine Restmengen und ausschließlich in einzelnen Bereichen fällige Ziele funktionieren ohne Endlosschleife oder fehlende Plätze.
- Lokale Referenz und Serverauswahl folgen demselben nachvollziehbar dokumentierten Vertrag.

## Umsetzungshinweise

`src/engine.ts` und die bestehende Online-Auswahl gemeinsam betrachten. Nicht ungeprüft die bisherigen Bereichsschleifen um neue Tags erweitern. Verteilung anhand gezielter kontrollierter Zufallsfolgen beziehungsweise belastbarer Stichproben prüfen; ein reiner Test auf doppelte IDs reicht nicht. Den Vertrag in `docs/Filmreise-Freischaltung-2026-10-11.md` nachziehen.

## Ergebnisnotiz

Lokal umgesetzt: genau ein aktueller Auswahlplatz je Ziel vor der Bereichs-/Gruppen-/Stufenauslosung. Originalfrage und primärer Bezug führen, alternative gefilterte Zugänge bleiben möglich. 100 kontrollierte lokale Zufallsfolgen bleiben trotz zusätzlicher Varianten exakt zielgleich; echte SQL-Stichproben für neue, fällige und bekannte Ziele bestätigen die Balance. Keine produktive Aktivierung.

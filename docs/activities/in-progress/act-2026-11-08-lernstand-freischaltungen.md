---
activityId: act-2026-11-08-lernstand-freischaltungen
status: in_progress
kind: fix
area: shared
priority: normal
primaryAgent: codex
requiresImplementation: true
createdAt: 2026-11-08
startedAt: 2026-11-08
owner: wissensquiz-werkarten-20261108-root
branch: codex/werkarten-mehrfachzuordnungen-20261108
blockedBy: [act-2026-11-08-werkarten-mehrfachzuordnungen]
resultArtifacts: []
checks: []
---

# Gemeinsamer Lernstand und passende Freischaltanrechnung

## Ziel

Einen Lernstand je Wissensziel in allen passenden Themen zeigen und sichere Treffer gemäß Luis Auswahl bereichsübergreifend anrechnen.

## Kontext und Quellen

[Entscheidungen 1 bis 3 und gemeinsame Zählregeln](../../Fragedaten-Organisation.md#beschlossener-zielzustand-werkarten-und-mehrfachzuordnungen--08112026). Aktuelle Freischaltlogik: `src/learningPath.ts`; Themenfortschritt: `src/TopicCard.tsx`; Erfolge: `src/learningAchievements.ts`. Onlinekonten verwenden Serverprojektionen.

## Scope

- Lernstatus, Fälligkeit und Fehler je Wissensziel gemeinsam halten; globale und kombinierte Summen eindeutig bilden.
- Sichere Antworten in allen passenden Genrepfaden und aus Schauspieler-/Preisfragen zusätzlich in den passenden Werkfragenpfaden anrechnen.
- Film- und Serienfreischaltungen trennen; Zähler und Nenner je Pfad aus demselben aktuellen Zielbestand ableiten.
- Auswertungen und Abzeichen auf überlappende Themen prüfen; XP/Lernereignisse durch die Zuordnung nicht vervielfachen.

## Nicht im Scope

Neue Lernstatusstufen, neue Expertenschwierigkeit für Werkfragen oder Änderung privater Antwortdaten.

## Akzeptanzkriterien

- Ein sicherer Treffer zu einem Fantasy-/Sci-Fi-Werk zählt einmal in jedem passenden Genrepfad, global einmal.
- Eine Schauspieler-/Preisfrage mit geprüftem Werkbezug zählt im eigenen sowie im passenden Werkfragenpfad; Varianten desselben Ziels erhöhen keinen dieser Zähler zusätzlich.
- Ein ausschließlich filmbezogenes Ziel öffnet keinen Serienpfad; Namens- oder Filmografieähnlichkeit erzeugt keinen Bezug.
- Geratene, falsche und nicht abgeschlossene Antworten liefern keine sichere Freischaltanrechnung. Schwierigkeit und Kennenlernen werden nicht mit sicherem Wissen gleichgesetzt.
- Lernübersichten, fällige Ziele und Fehler bleiben bei kombinierter Auswahl frei von Doppelzählung.

## Umsetzungshinweise

Zuerst den Zielbestand jedes Freischaltpfads definieren, dann dessen sichere Treffer projizieren. Bestehende Wissensziel-IDs erhalten; Änderungen der Attribute dürfen gespeicherte Lernbelege nicht versehentlich unbrauchbar machen. Lokale Referenz und Onlineberechnung mit denselben synthetischen Überschneidungsfällen prüfen. Relevante Ausgangstests: `tests/learning-path.test.ts`, `tests/server-views.test.ts`, `tests/discovery-medals.test.ts`.

## Ergebnisnotiz

Vorbereitet; noch nicht umgesetzt.

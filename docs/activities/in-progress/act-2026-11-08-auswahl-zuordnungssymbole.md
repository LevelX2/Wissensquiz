---
activityId: act-2026-11-08-auswahl-zuordnungssymbole
status: in_progress
startedAt: 2026-11-08
owner: wissensquiz-werkarten-20261108-root
branch: codex/werkarten-mehrfachzuordnungen-20261108
kind: fix
area: ui
priority: normal
primaryAgent: codex
requiresImplementation: true
createdAt: 2026-11-08
blockedBy: [act-2026-11-08-werkarten-mehrfachzuordnungen, act-2026-11-08-lernstand-freischaltungen, act-2026-11-08-ausgewogene-filmreise]
resultArtifacts: []
checks: []
---

# Kombinierbare Auswahl und mehrere Zuordnungssymbole

## Ziel

Werkart, Genres und Fragenbereiche verständlich kombinieren und an der Frage mehrere passende Symbole anzeigen.

## Kontext und Quellen

[Auswahlentscheidungen 5 und 6](../../Fragedaten-Organisation.md#beschlossener-zielzustand-werkarten-und-mehrfachzuordnungen--08112026). `src/QuestionScreen.tsx` zeigt aktuell ein Genre- oder Bereichsbild; `src/Icons.tsx` enthält auch die bisherigen Bilder für Schauspieler und Preisträger. Themenkarten können bereits mehrere Bilder darstellen.

## Scope

- Film/Serie, Mehrfachgenres, Animation, Fragenbereich und kuratierte Auswahl mit konsistenter Filterzusammenfassung zugänglich machen.
- Mehrere zutreffende Symbole in stabiler Reihenfolge und mit verständlichen zugänglichen Bezeichnungen anzeigen.
- Gezielte Auswahl auf tatsächlich passende Schauspieler-/Preisfragen begrenzen; breite Auswahl für allgemeine Fragen erhalten.
- Themenkarten, Detailansichten, Rundenauswertung und Hilfetexte auf die neue Zuordnung abstimmen; überlappende Zahlen nicht zu falschen Gesamtsummen addieren.

## Nicht im Scope

Eine neue allgemeine Navigation, mehrere Kopien derselben Frage oder ein stiller Wechsel zurück zur alleinigen Anzeige eines Hauptsymbols.

## Akzeptanzkriterien

- Eine Serienfrage mit Fantasy, Sci-Fi und Schauspieler zeigt die zutreffenden Zuordnungen ohne Dopplungen und ohne zufälligen Symbolwechsel.
- Darstellung funktioniert bei 320 Pixeln Breite; mehrere Symbole verdecken weder Fragetext noch Bedienelemente und sind nicht allein über Hover verständlich.
- Tastatur und Screenreader erhalten aussagekräftige Bezeichnungen; die Einstellung zur Anzeige der Zuordnung wird berücksichtigt.
- Kombinierte Auswahl, leere Treffer, gemischte Bereiche und Wechsel zwischen Spielmodi zeigen konsistente Zusammenfassungen.
- Lösungsschutz vor der Antwort sowie die gewählte Auflösungsphase bleiben erhalten; ein Zuordnungshinweis darf die Lösung nicht verraten.

## Umsetzungshinweise

Bestehende Artwork- und Symbolsysteme wiederverwenden. Nach gezielten Komponenten-/Browserprüfungen den gemeinsamen vollständigen Browserlauf der späteren Veröffentlichungsabnahme überlassen.

## Ergebnisnotiz

Vorbereitet; noch nicht umgesetzt.

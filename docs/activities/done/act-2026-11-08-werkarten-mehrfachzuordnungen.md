---
activityId: act-2026-11-08-werkarten-mehrfachzuordnungen
status: done
completedAt: 2026-11-08
kind: architecture
area: shared
priority: normal
primaryAgent: codex
requiresImplementation: true
createdAt: 2026-11-08
startedAt: 2026-11-08
owner: wissensquiz-werkarten-20261108-root
branch: codex/werkarten-mehrfachzuordnungen-20261108
blockedBy: []
resultArtifacts: [src/workAttributes.ts, src/questionSchema.ts, src/filters.ts, src/packages.ts, docs/Importformat.md, docs/Pruefbericht.md]
checks: ["29 gezielte Tests in fünf Dateien", "npm run check", "npm run check:questions", "git diff --check"]
---

# Werkarten und Mehrfachzuordnungen im aktuellen Katalog

## Ziel

Film/Serie, mehrere Genres, Fragenbereich, Machart und kuratierte Zuordnungen als getrennte kombinierbare Merkmale zuverlässig auswerten.

## Kontext und Quellen

- [Beschlossener Zielzustand](../../Fragedaten-Organisation.md#beschlossener-zielzustand-werkarten-und-mehrfachzuordnungen--08112026).
- `src/filters.ts` liefert aktuell genau ein Genre und einen Fragenbereich; `src/questionSchema.ts` führt Metadaten als Zeichenkettenwerte. Filter, Kodierung und Katalogaufbau müssen dasselbe aktuelle Modell tragen.
- Bestehende nummerierte Filmreihen sind keine TV-Serien.

## Scope

- Einheitlichen Attribut- und Werkidentitätsvertrag festlegen und in Schema, Kodierung, Import, Katalogaufbau und Online-Fragenansichten umsetzen.
- Innerhalb eines Merkmals ODER, zwischen Merkmalen UND; Genres und Werkart begrenzen auch ausgewählte Schauspieler-/Preisfragen nach deren konkretem Bezug.
- Allgemeine Karriere-/Preisfragen ohne passenden Bezug bleiben in breiten Bereichsauswahlen erreichbar.
- Aktuelle fachliche Ablage deterministisch festlegen; Mehrfachgenres dürfen keine duplizierten Frageobjekte oder von Lieferdateien abhängige Pfade erzeugen.

## Nicht im Scope

Neue Fragen, vollständige nachträgliche Genre-Redaktion, zusätzliche Archive, Kompatibilitätsadapter und produktive Aktivierung.

## Akzeptanzkriterien

- Eine Frage kann Serie, Fantasy, Sci-Fi und Schauspieler zugleich tragen; Werk- und Personenidentitäten bleiben eindeutig.
- Filtermatrix prüft Mehrfachgenres, Film/Serie, Animation und kuratierte Auswahl einschließlich leerer Treffer und allgemeiner Fragen ohne Werkbezug.
- Metadaten überstehen den tatsächlichen Kodierungs-/Onlineweg vollständig; Frage-/Wissensziel-IDs ändern sich nicht.
- Aktueller Katalog wird ohne doppelte IDs aufgebaut; Zuordnungen entstehen aus fachlichen Attributen.

## Umsetzungshinweise

Betroffen sind insbesondere `src/questionSchema.ts`, `src/catalogCodec.ts`, `src/filters.ts`, `src/categories.ts`, `src/packages.ts` und der aktuelle Serverkatalogpfad. Vor Änderungen an den Onlineverträgen den Supabase-Skill und die aktuellen Projektverträge lesen. Für Serien Staffel-/Folgenbezug und Spoilervertrag fachlich konkretisieren; Film-Pflichtfragen nicht ungeprüft übertragen. Neue gezielte Schema-/Filter-/Kodierungsprüfungen und `npm run check:questions` passend auswählen.

## Ergebnisnotiz

Im Worktree lokal umgesetzt und geprüft: strukturierte Werkbezüge, konsistente Filter lokal und SQL, CSV-Übernahme, Katalogkodierung und eindeutige Ablage mit leerem Serienbestand. 29 gezielte Tests, Typprüfung und aktueller Katalogcheck erfolgreich; 19.403 Fragen mit unverändertem Redaktionshash. SQL ausschließlich lokal vorbereitet. Weitere Freischalt-, Auswahl- und UI-Pakete bleiben offen.

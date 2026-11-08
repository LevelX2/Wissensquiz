---
activityId: act-2026-11-08-quellen-und-links
status: inbox
kind: fix
area: ui
priority: normal
primaryAgent: codex
requiresImplementation: true
createdAt: 2026-11-08
blockedBy: [act-2026-11-08-werkarten-mehrfachzuordnungen]
resultArtifacts: []
checks: []
---

# Quellen und Links mit IMDb und OFDb

## Ziel

Unter „Quellen und Links“ die vorhandenen Belege sowie möglichst geprüfte IMDb- und vorhandene OFDb-Direktlinks zum konkreten Werk oder zur Person öffnen können.

## Kontext und Quellen

- Nutzerauftrag vom 08.11.2026; „UFDB“ anschließend ausdrücklich als OFDb unter ofdb.de bestätigt.
- [Führende Zielvorgabe](../../Fragedaten-Organisation.md#quellen-und-links).
- `src/Explanation.tsx` vereinigt aktuell Frage-, Darstellungs- und Porträtquellen unter „Quellen ansehen“; Beschriftung derzeit überwiegend als Hostname.
- [OFDb-FAQ](https://www.ofdb.de/faq/) und [OFDb-Personenzuordnung mit IMDb-ID](https://www.ofdb.de/neueperson/Kevin%2BDenner/) zeigen die Trennung von Werk-/Personeneinträgen und die Möglichkeit der eindeutigen Personenreferenz. Bei tatsächlicher Recherche die konkreten Ziele selbst prüfen.

## Scope

- Überschrift in „Quellen und Links“ ändern und die Anzeige auch bei ausschließlich weiterführenden Links ermöglichen.
- Zentrale externe Referenzen für konkrete Werk- und Personenidentitäten führen; Quellenangaben nicht pro Frage vervielfältigen.
- Möglichst IMDb-Werk-/Personenlinks und OFDb-Links bei vorhandenem, geprüftem Eintrag ergänzen. Film, Serie, Remake, Staffel/Folge und namensgleiche Personen sauber unterscheiden.
- Fachliche Belege und weiterführende Einträge verständlich kennzeichnen; bei mehreren Gegenständen deren Titel beziehungsweise Namen nennen.
- Vorhandene gültige Links wiederverwenden, URL-Dubletten entfernen und Links wie bisher ohne Verlust des Quizkontexts öffnen.

## Nicht im Scope

Erfundene IDs, ungeprüft erzeugte Suchtreffer als Direktlinks, das Anlegen externer Datenbankeinträge, eine neue Pflicht zu kommerziellen APIs oder eine vollständige neue Redaktion aller Fragen.

## Akzeptanzkriterien

- Werk- und Personenfälle mit beiden Anbietern, mit nur einem Anbieter sowie ohne geprüften externen Eintrag funktionieren.
- IMDb-Person und IMDb-Werk sind nicht vertauscht; gleichnamige Werke/Personen und Film-/Serienfassungen werden korrekt unterschieden.
- Ein weiterführender Link wird nur als fachlicher Beleg ausgegeben, wenn er die betreffende Aussage tatsächlich belegt.
- Fehlende oder ungeklärte Referenzen erzeugen keinen falschen Link; erreichte Abdeckung und offene Zuordnungen werden knapp dokumentiert.
- Quellen bleiben erhalten, Dubletten erscheinen einmal und Beschriftungen nennen Anbieter sowie den passenden Gegenstand.
- Neue Links erscheinen erst in der zulässigen Lösungsphase, sowohl bei sofortiger Auflösung als auch beim Rückblick am Rundenende.
- Gezielt prüfen: Mehrfach-Werkverweise bei Preisfragen, Personenfragen, reine Linkanzeige ohne bisherige Quellen und fehlende externe Einträge.

## Umsetzungshinweise

`src/actorKnowledgeLinks.json` enthält interne Wissensverknüpfungen und ist kein IMDb-/OFDb-Register. Referenzen an zentralen Werk-/Personenidentitäten pflegen und durch den tatsächlichen Online-/Darstellungsweg führen. Offizielle Datenbankseiten für Trefferprüfung verwenden; keine Links allein anhand eines Namens erraten. Sichere externe Linkattribute und die vorhandene Lösungsschutzlogik beibehalten.

## Ergebnisnotiz

Vorbereitet; noch nicht umgesetzt. Noch keine IMDb-/OFDb-Abdeckung des aktuellen Katalogs erhoben.

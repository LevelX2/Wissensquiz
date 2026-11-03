# Arbeitsformat für neue Filmfragen

Jede Datei unter `Redaktion/` enthält genau eine Filmfassung. Der Paketaufbau übernimmt nur abgeschlossene, quellengeprüfte Datensätze. Das Format hält aktuelle Fragen und Quellen zusammen; persönliche Sammlungszuordnungen gehören nicht hinein.

```json
{
  "id": "ACTION-001",
  "film_title_de": "Deutscher Titel",
  "film_title_original": "Originaltitel",
  "film_year": 2000,
  "genre": "Action",
  "categories": [],
  "familiarity_level": 2,
  "familiarity_reason": "Individuelle redaktionelle Begründung.",
  "selection_reason": "Fachlicher Grund für die Ergänzung, ohne Besitzangaben.",
  "directors": ["Vorname Nachname"],
  "production_countries": ["USA"],
  "release_note": "Erste Veröffentlichung einschließlich etwaiger Festivalpremiere geprüft.",
  "director_note": "",
  "country_note": "",
  "series": null,
  "series_note": "Keine belegte nummerierte Filmfolge in den geprüften Filmquellen.",
  "series_sources": ["https://example.org/film"],
  "sources": {
    "film": {
      "url": "https://example.org/film",
      "accessed_on": "2026-11-03",
      "supports": "Konkret belegte Inhalte, Credits und Veröffentlichungsdaten."
    }
  },
  "status": "quellengeprueft",
  "questions": [
    {
      "code": "L1",
      "objective": "Konkreter eigenständiger Sachverhalt.",
      "question": "Vollständige individuelle Frage mit Filmtitel, ohne Lösungsverrat?",
      "answers": ["Richtige Antwort", "Falsche Antwort 1", "Falsche Antwort 2", "Falsche Antwort 3"],
      "short": "Kurze Antwortbegründung.",
      "context": "Individuelle belegte Vertiefung mit konkretem zusätzlichem Erkenntniswert.",
      "feedback": ["", "", "", ""],
      "sources": ["film"],
      "spoiler": "mittel"
    }
  ]
}
```

Alle acht Codes `L1`, `L2`, `M1`, `M2`, `S1`, `S2`, `Y`, `D` sind erforderlich. Inhaltscodes bestimmen leicht/mittel/schwer; `Y` und `D` sind zusätzliche, standardmäßig mittlere Ziele. `answers[0]` ist im Arbeitsformat richtig; erst beim CSV-Aufbau werden Positionen verteilt. `feedback` darf bei fehlendem eigenständigen Erkenntniswert leer bleiben. Jahresantwort ist das Erstveröffentlichungsjahr; Regieantwort enthält das vollständige offizielle Team.

Bei bereits vorhandenem identischem Sachverhalt `knowledge_id` und `variant_of` der Bestandsfrage setzen und die Zuordnung im konkreten Ziel prüfen. Quellenangaben enthalten tatsächlich gelesene Belege; ungeklärte Dateien erhalten `status: "entwurf"` und werden nicht als fertiger Bestand übernommen. Filmreihen stehen als Objekt `{ "name": "Filmfolge", "position": 1, "note": "Begründete Zählweise." }`; kein Reihenname ohne positive Teilnummer.

# Integration der 240-Filme-Ergänzung

Stand: 06.10.2026. Nutzerauftrag: „Dann bitte veröffentlichen“. Die redaktionelle Übergabe ist als zwanzigstes öffentliches App-Paket eingebunden; die Veröffentlichung folgt nach den Produktionsprüfungen.

240 Filme mit jeweils acht Fragen: je zwei Inhaltsziele auf leicht, mittel und schwer sowie Jahr und Regie. Gesamtbestand 8.197 Fragen und 7.653 Wissensziele. Die Nomadland-Regiefrage nutzt das bereits vorhandene Schauspieler-Wissensziel; deshalb steht das neue Paket nach den Personenpaketen. Keine Frage-ID wurde überschrieben. Das App-CSV ist bytegleich zur geprüften [Redaktionsquelle](Filmfragen_240_Filme_1920_Fragen.csv). Die frühere 40-Filme-Ergänzung bleibt separat und ist nicht Bestandteil dieses Auftrags.

Die App-Filmdaten sind aus der vollständigen [redaktionellen Übergabe](Filmdaten.json) in `src/film240Metadata.json` übernommen. Regieteams, Produktionsländer, Reihen, Veröffentlichungshinweise und Credit-Abweichungen erscheinen nach der Lösung. Vier textuelle Reihenangaben wurden als benannte Reihen ohne ungesicherte Positionsnummer übernommen. Sieben Rotten-Tomatoes-Links verwenden im App-Datensatz HTTPS; die redaktionellen Rohquellen bleiben unverändert.

Bekanntheit ist von der Frageschwierigkeit getrennt. 227 neue Filmidentitäten ergänzen die bereits 656 Einordnungen; 13 ausgewählte Filme waren dort durch Preis-/Personenbezüge bereits enthalten. Zwölf Einordnungen stimmen überein. Für `Up|2009` bleibt die bestehende Gruppe 1 erhalten; die neue Redaktion hatte Gruppe 2 vorgesehen. Dies ist die einzige abweichende Bekanntheitszuordnung.

Isolierte Tests prüfen Import, Wiederholungen, konkurrierende IndexedDB-Transaktionen, erhaltene Lernstände, Rundensnapshots und Western-Freischaltungen sowie die Filmdaten aller 240 Werke. Der Browserfall prüft das Hondo-Regieteam, die Anzeige nach der Antwort, das unveränderte Offline-CSV und erhaltene Antwortereignisse. Öffentliche Kataloge werden aus den App-Paketen erzeugt; private Spielstände sind keine Eingabe.

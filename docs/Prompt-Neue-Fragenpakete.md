# Kopierfertiger Auftrag für neue Wissensquiz-Fragen

**Nachtrag:** Das mit diesem Prompt beauftragte Musik-Paket wurde am 27.09.2026 geliefert und eingebunden. Der folgende Auftrag und die beigefügte 300-Filme-Liste dokumentieren den Stand davor. Für den nächsten Auftrag mit Abenteuer beginnen und die neuen Musikfilme beim Bestandsabgleich berücksichtigen; siehe [Musik-Ergänzung](Musik-Ergaenzung.md).

Stand: 27.09.2026. Den folgenden Auftrag vollständig in den Fragen-Chat kopieren. Zusätzlich die Datei `Fragenbestand-2026-09-27.json` mitgeben; sie enthält die Bestandszahlen und alle 300 bisherigen Filmfassungen. Für den Abgleich einzelner Wissensziele werden außerdem die bisherigen Fragenpakete benötigt, sofern sie dort nicht mehr verfügbar sind.

---

Bitte erstelle weitere hochwertige deutsche Filmfragen für unsere bestehende App „Wissensquiz“. Halte Dich an die folgenden Vorgaben. Erzeuge zunächst ein vollständiges Paket für **Musik**, danach auf weiteren Auftrag Abenteuer und Thriller. Liefere Dateien und einen kurzen Prüfbericht. Veröffentliche oder importiere nichts selbst.

## 1. Inhaltliche Prioritäten

Der geprüfte App-Katalog umfasst 2.567 Fragen, 2.237 verschiedene Wissensziele und 300 verschiedene Filmfassungen. Fragenvarianten sind keine zusätzlichen Wissensziele. Die Zählung enthält auch die bereits ergänzten Jahres- und Regiefragen.

| Reihenfolge | Genre | Filme bisher | Wissensziele bisher | Auftrag |
|---|---|---:|---:|---|
| 1 | Musik | 1 | 8 | Eigenes Paket mit möglichst 25 zusätzlichen Filmen. Breite aus Musical, Musikfilm und musikbezogener Handlung; klare Genrebegründung. |
| 2 | Abenteuer | 6 | 47 | Eigenes Paket mit möglichst 25 zusätzlichen Filmen. Mehr Filmvielfalt und bekannte Einstiegsfilme. |
| 3 | Thriller | 12 | 96 | Eigenes Paket mit möglichst 25 zusätzlichen Filmen. Insbesondere bekannte Einstiegsfilme ergänzen; derzeit keine Einordnung in Bekanntheitsgruppe 1. |
| 4 | Action und Rom-Com | je 25 bzw. 26 | 198 bzw. 208 | Gezielte Ergänzung weniger bekannter Filme: Gruppe 4 fehlt bei beiden; Action hat außerdem erst zwei Filme in Gruppe 3. |
| 5 | Fantasy und Komödie | 26 bzw. 29 | 207 bzw. 232 | Gezielte Ergänzung der Gruppe 4; bislang jeweils nur ein Film. |
| 6 | Martial Arts & Asia-Film | 25 | 200 | Bekannte Einstiegsfilme und leichte Fragen ergänzen: Gruppe 1 umfasst erst einen Film und zwei leichte Wissensziele. |

Drama und Science-Fiction sind insgesamt bereits deutlich breiter besetzt. Classics und Arthouse sind zusätzliche kuratierte Kategorien, keine eigenen Genres und kein vorrangiger Mengenengpass. Neue passende Fragen dürfen diese Zusatzkategorien selbstverständlich erhalten.

Die Prioritäten sind eine redaktionelle Empfehlung aus dem Bestand, keine Messung des Spielerinteresses. Es sollen vor allem neue Filmwerke und neue Inhalte hinzukommen, nicht zusätzliche Umformulierungen alter Fragen. Verwende die beigefügte Filmliste zum Abgleich. Bei fehlenden bisherigen Fragenpaketen benenne die Grenze der inhaltlichen Dublettenprüfung. Behaupte dann keine vollständige Prüfung.

Wenn ein persönliches Sammlungsverzeichnis bereitgestellt wird und nur daraus ausgewählt werden soll, halte diese Einschränkung ein. Ohne ein solches Verzeichnis behaupte nicht, die Filme seien mit der persönlichen Sammlung abgeglichen.

## 2. Paketumfang und Lernziele

Standardpaket: **150 eigenständige Hauptfragen plus 30 echte Wiederholungsvarianten = 180 CSV-Zeilen** ohne Kopfzeile. Bei 25 neuen Filmen bedeutet das sechs unterschiedliche Wissensziele je Film, vorzugsweise zwei leichte, zwei mittlere und zwei schwere. Die 30 Varianten verteilen sich mit zehn je Schwierigkeit auf das Paket. Ergebnis: 60 Zeilen je Schwierigkeit, aber nur 50 unabhängige Ziele je Schwierigkeit.

Diese Verteilung ist eine redaktionelle Zielvorgabe. Erfinde keine ungeeigneten Fragen, keine unbelegten Fakten und keine unpassenden Schwierigkeitseinstufungen, nur um die Zahlen zu erfüllen. Begründe notwendige Abweichungen vor der Ausgabe; ein kleineres geprüftes Paket ist besser als aufgefüllte Dubletten.

- Ein Wissensziel prüft genau einen klar benannten Sachverhalt.
- Eine anders formulierte Frage zum selben Sachverhalt ist eine Variante und verwendet dieselbe `knowledge_id`.
- Neue unabhängige Inhalte erhalten neue `knowledge_id`-Werte. Keine bereits bekannten Ziele unter neuer ID als neu verkaufen.
- Hauptfrage: `variant_of` leer. Variante: `variant_of` ist die `question_id` ihrer Hauptfrage; kein Selbstverweis, keine Ketten, keine Zyklen. Schwierigkeit, Filmfassung, Lernziel, Kontext und Merksatz bleiben zur Hauptfrage passend.
- Verwende einen neuen, kollisionsfreien Paketpräfix, beispielsweise `MUS-202609-P01`. Hauptfrage: `MUS-202609-P01-L-001`; Wissensziel: `K-MUS-202609-P01-L-001`; Variante: `MUS-202609-P01-L-001-V1`. Entsprechend M/S für mittel/schwer. Nach Ausgabe IDs nicht still ändern oder wiederverwenden.
- Jahres- und Regiewissen ist für die 300 Bestandsfilme bereits abgedeckt. Erzeuge dazu keine zusätzlichen CSV-Dubletten. Für neue Filme liefere die Fakten separat gemäß Abschnitt 6; die App-Entwicklung ergänzt daraus die passenden Jahres-/Regiefragen. Diese zählen nicht zu den 180 gelieferten Inhaltsfragen.

## 3. Exaktes CSV-Format

UTF-8 ohne BOM, Komma als Trennzeichen, CRLF-Zeilenenden. Kopfzeile und alle Zellen in doppelten Anführungszeichen; innere doppelte Anführungszeichen gemäß CSV als `""` maskieren. Keine Markdown-Zeilen, Kommentare oder Zusatzüberschriften in der CSV. Mehrfachwerte innerhalb einer Zelle mit `|` trennen. Genau diese **31 Spalten in dieser Reihenfolge**:

```csv
"question_id","knowledge_id","variant_of","language","domain","subdomain","film_title_de","film_title_original","film_year","franchise","difficulty","question_type","topic_tags","badge_tags","learning_objective","question","answer_a","answer_b","answer_c","answer_d","correct_answer","explanation_short","explanation_context","feedback_a","feedback_b","feedback_c","feedback_d","memory_anchor","spoiler_level","source_urls","verification_status"
```

Feldregeln:

| Felder | Inhalt |
|---|---|
| `question_id`, `knowledge_id`, `variant_of` | Stabile Identitäten und Variantenbezug gemäß Abschnitt 2. |
| `language`, `domain` | Immer `de` und `Film`. |
| `subdomain` | Genau ein bestehendes Genre: `Science-Fiction`, `Action`, `Horror`, `Fantasy`, `Komödie`, `Western`, `Drama`, `Abenteuer`, `Musik`, `Thriller`, `Martial Arts & Asia-Film` oder `Rom-Com`. |
| `film_title_de`, `film_title_original` | Deutscher Verleihtitel und tatsächlicher Originaltitel der konkreten Fassung. Bei Bestandsfilmen Schreibweise unverändert übernehmen. Keine eigene Übersetzung als vermeintlichen offiziellen Titel ausgeben. |
| `film_year` | Vierstelliges Jahr der ersten Veröffentlichung, gegebenenfalls Premiere/Festival; nicht automatisch deutscher Kinostart. Remakes eindeutig trennen. |
| `franchise` | Belegte Filmreihe; andernfalls leer. Keine erfundenen Reihen. |
| `difficulty` | Ausschließlich `leicht`, `mittel`, `schwer`. |
| `question_type` | Inhaltlicher Typ, etwa `Handlung`, `Figur`, `Besetzung`, `Beziehung`, `Motivation`, `Schauplatz`, `Filmgestaltung`, `Musik` oder `Filmgeschichte`; kein UI-Fragetyp. |
| `topic_tags`, `badge_tags` | Passende inhaltliche Schlagwörter, durch `|` getrennt. `Classics`/`Arthouse` gegebenenfalls zusätzlich in beiden Feldern. Tags allein erstellen noch kein neues App-Abzeichen. |
| `learning_objective` | Ein präziser Satz: Welchen konkreten Sachverhalt soll die Person anschließend wissen? |
| `question` | Eindeutige Frage mit Filmfassung, üblicherweise `„Filmtitel“ (Jahr): Frage?`; keine versteckte Lösung. |
| `answer_a` bis `answer_d` | Vier verschiedene, plausible und sprachlich vergleichbare Antworten. Genau eine ist richtig. |
| `correct_answer` | Genau `A`, `B`, `C` oder `D`, bezogen auf die gelieferten Spalten. |
| `explanation_short` | Ein bis zwei kurze Sätze, die die richtige Lösung verständlich begründen. |
| `explanation_context` | Eigener vertiefender Text von etwa 50–75 Wörtern; mehr als eine Wiederholung der Lösung. Darstellerregel in Abschnitt 4 beachten. |
| `feedback_a` bis `feedback_d` | Zu jeder konkreten Antwort eine kurze Erklärung, weshalb sie richtig oder falsch ist. |
| `memory_anchor` | Ein kurzer, gut merkbarer Satz zum Wissensziel. |
| `spoiler_level` | `keine`, `Handlung` oder `Auflösung`, abhängig vom stärksten verratenen Inhalt einschließlich Erklärung. |
| `source_urls` | Tatsächlich geprüfte HTTP(S)-Quellen, durch `|` getrennt; konkrete Film-/Quellseiten statt Suchergebnislinks. |
| `verification_status` | `redaktionell_geprueft` nur nach tatsächlich durchgeführtem Quellenabgleich. Unsichere Kandidaten separat dokumentieren und nicht als geprüft in die spielbare CSV aufnehmen. |

Alle Felder sind redaktionell auszufüllen; nur `variant_of` bei Hauptfragen und `franchise` ohne belegte Reihe dürfen leer bleiben. Der App-Parser toleriert stellenweise weniger Angaben, unser neuer Redaktionsstandard verlangt die vollständigen Inhalte.

## 4. Qualität von Fragen und Erklärungen

- Leicht: zentrale Figuren, gut erkennbare Ausgangslage, markante Motive. Mittel: konkrete Beziehungen, Handlungszusammenhänge oder auffällige Gestaltung. Schwer: belegte Details und differenzierte Zusammenhänge; keine willkürlichen Fangfragen.
- Bekanntheit des Films und Schwierigkeit der Frage sind zwei getrennte Achsen. Auch ein seltener Film braucht leichte Fragen, ein berühmter Film darf schwere haben.
- Frage plus vier Antwortmöglichkeiten möglichst unter 60 Wörtern halten. Besonders lange Kombinationen im Prüfbericht markieren, weil der Rekordmodus 30 Sekunden pro Frage vorsieht.
- Keine bloßen Geschmacksurteile als objektiv richtige Antwort. Interpretationen in der Vertiefung als Lesart kennzeichnen. Keine Filmaussage als historische Tatsache ausgeben.
- Keine Lösungen durch Wortwahl, auffällige Antwortlänge, Regie-/Darstellerangaben oder Jahresangaben in der Frage verraten. Vorsicht bei Besetzungsfragen: Schauspielernamen erst nach der Antwort nennen.
- **In jedem vertiefenden Kontexttext erhalten namentlich genannte Figuren bei der ersten Nennung ihren Originaldarsteller in Klammern**, sofern nicht bereits eindeutig als Darsteller-Rollen-Zuordnung formuliert. Beispiel: `Figurenname (Darstellername)`. Synchronsprecher nicht mit Originaldarstellern verwechseln; Sprechrollen bei Animation entsprechend bezeichnen. Keine Rollen erzwingen, wenn die Frage nur Gestaltung oder Musik behandelt.
- Filmfassung, Schnittfassung, Remake, alternative Enden, mehrere Regiecredits und Synchronfassungen sauber abgrenzen. Nicht eindeutig lösbare Fragen verwerfen.
- Eigene Formulierungen, keine übernommenen längeren Quellentexte. Prüfe Handlung, Besetzung, Datum und Credits in geeigneten Quellen; bei Abweichungen möglichst Verleih, Archiv oder offizielle Credits heranziehen. Eine kurze Synopsis belegt nicht automatisch jedes Handlungsdetail.
- Feedback und Erläuterungen dürfen nie auf „Antwort A“, eine Bildschirmposition oder „oben/unten“ verweisen: Die App mischt die Antworten. Antworttext, Feedback und Richtigkeitsmerkmal müssen zusammenpassen.
- Richtige Buchstaben möglichst gleich verteilen: bei 180 Zeilen 45 je Buchstabe, je Schwierigkeit 15. Die App mischt zusätzlich; die Quote ersetzt keine inhaltliche Qualität.

## 5. Genres und kuratierte Zusatzkategorien

`Classics` und `Arthouse` ersetzen nie `subdomain`. Ein Thriller bleibt Thriller, auch wenn er zusätzlich Classics ist. Kategorien sind Mengenergänzungen, keine Fragekopien. Classics ist keine automatische Altersgrenze; Arthouse keine automatische Zuordnung aller seltenen Filme.

Für neue Zeilen passende Kategorien direkt in beide Tagfelder aufnehmen und die Auswahl kurz begründen. Änderungen an Bestandsfragen ausschließlich als separate Zuordnungsliste mit `question_id`, `knowledge_id`, `variant_of`, Originaltitel, Jahr, bisherigem Genre und gewünschten zusätzlichen Tags liefern. Bestehende Texte, Genres, IDs und Tags nicht überschreiben. Unbekannte oder abweichende Referenzen melden und auslassen; keine Ersatzfrage mit neuer ID anlegen.

## 6. Neue Filmdaten und Bekanntheit separat mitliefern

Die aktuelle CSV hat **keine aktive Bekanntheitsspalte**. Ein zusätzliches CSV-Feld allein schaltet einen neuen Film nicht für die Filmreise frei. Liefere deshalb neben der CSV eine redaktionelle Begleitdatei `<Paket>_Filmdaten.json` mit einem Eintrag pro neuer Filmfassung. Das ist eine Übergabe an die App-Entwicklung, noch keine automatisch importierbare App-Konfiguration.

Verwende diese Struktur (Platzhalter im echten Ergebnis durch geprüfte Werte ersetzen):

```json
{
  "schema_version": "wissensquiz-redaktion-film-v1",
  "films": [
    {
      "film_title_de": "Deutscher Filmtitel",
      "film_title_original": "Originaltitel",
      "film_year": 2000,
      "subdomain": "Musik",
      "reference_question_id": "MUS-202609-P01-L-001",
      "familiarity_level": 2,
      "familiarity_reason": "Kurze redaktionelle Begründung für das deutschsprachige Publikum.",
      "directors": ["Vorname Nachname"],
      "production_countries": ["Produktionsland"],
      "series": null,
      "release_note": "Abweichende Festival-/Länderstarts oder leer, wenn nicht erforderlich.",
      "director_note": "Besondere Credit-Abgrenzung oder leer.",
      "year_difficulty": "mittel",
      "director_difficulty": "mittel",
      "category_reasons": {},
      "sources": [
        {
          "url": "https://example.org/konkrete-filmquelle",
          "supports": ["Regie", "erste Veröffentlichung", "Produktionsländer"],
          "checked_on": "YYYY-MM-DD"
        }
      ]
    }
  ]
}
```

Bekanntheitsgruppen, bezogen auf ein breites deutschsprachiges Kinopublikum:

1. **Film-Ikonen:** außergewöhnlich breit bekannt, auch außerhalb von Genre-Fankreisen.
2. **Bekannte Filme:** vielen regelmäßigen Kinogängern geläufig.
3. **Kennerfilme:** eher Genre-Fans oder stärker Filminteressierten bekannt.
4. **Entdeckungen:** deutlich seltener bekannte Filme und Spezialinteressen.

Alle Fragen eines Films erhalten dieselbe Einordnung. Möglichst alle vier Gruppen abdecken, bei Musik/Abenteuer/Thriller insbesondere bekannte Einstiegstitel ergänzen. Keine künstliche Viertelquote: tatsächliche plausible Einordnung hat Vorrang, und „wenig Einspielergebnis“ beweist allein keine geringe Bekanntheit. Einordnung ausdrücklich redaktionell, nicht als empirisch gemessene Quote ausgeben.

`directors` enthält bei Gemeinschaftsregie alle relevanten offiziellen Credits. Produktionsländer sind keine Drehorte. Für eine belegte Reihe statt `null` verwenden: `{"name":"Reihenname","position":2,"note":"Zweiter veröffentlichter Kinofilm; ggf. Abgrenzung"}`. Teilnummer bezieht sich auf Veröffentlichungsreihenfolge, nicht Handlungschronologie; bei unbekannter Position `null` und Erklärung statt einer geratenen Zahl. `category_reasons` enthält nur tatsächlich gewählte Zusatzkategorien, zum Beispiel `{"Classics":"Begründung"}`. Die Beispiel-URL ist kein Quellenbeleg.

Wichtig für die Übergabe: Neue Bekanntheitszuordnungen, Filmdaten und gegebenenfalls Lernpfad-Zielmengen müssen durch die App-Entwicklung kontrolliert integriert werden. Der bestehende Freischaltplan ist bewusst fest; eine neue CSV darf erreichte Freischaltungen nicht zurücksetzen oder Schwellen still erhöhen.

## 7. Lieferung und Prüfung

Liefere:

1. `<Genre>_Ergaenzung_180_Fragen.csv` im exakten Format.
2. `<Genre>_Ergaenzung_Filmdaten.json` gemäß Abschnitt 6.
3. Einen kurzen Prüfbericht mit Zeilen-/ID-/Wissensziel-/Variantenzahlen, Filmliste, Verteilung nach Schwierigkeit, Bekanntheit und richtigen Buchstaben, Quellen-/Fassungsproblemen, Dublettenprüfung und allen offenen Punkten.
4. Bestandszuordnungen nur bei Bedarf als separate JSON-Datei, niemals als normale neue Fragen.

Prüfe vor der Abgabe durch erneutes Einlesen der erzeugten Datei: exakt 31 Felder je Zeile, vollständige Pflichtangaben, eindeutige Frage-IDs, konsistente Wissensziel-IDs, gültige Variantenreferenzen, vier unterschiedliche Antworten, genau eine richtige, richtig zugeordnetes Feedback, unveränderte Sonderzeichen und korrektes CSV-Quoting. Vergleiche sämtliche zurückgelesenen Zellwerte mit den geplanten Werten. Prüfe außerdem Figuren-/Darstellerzuordnungen in den Vertiefungen und Lösungshinweise vor der Antwort.

Berechne die SHA-256-Prüfsummen der gelieferten Dateien. Behaupte nur tatsächlich ausgeführte Prüfungen. Wenn keine Dateierzeugung, Webrecherche oder programmatische Prüfung möglich war, sage das ausdrücklich. „Formal geprüft“, „redaktionell quellengeprüft“, „mit dem App-Parser getestet“ und „in die App importiert“ sind unterschiedliche Zustände. Nur tatsächlich erreichte Zustände angeben.

---

## Nachweis für die App-Entwicklung

Bestandszählung mit demselben Aufbau wie die App (`addPackages`, Tag-Ergänzungen und `addFilmFacts`), nicht durch Addition alter Importberichte. Eindeutige Filme: Originaltitel plus Jahr. Wissensziele: `knowledge_id`. Kategorien überschneiden sich und sind nicht zu den Genresummen zu addieren. Keine Spielerstände ausgewertet; Bekanntheitsgruppen sind redaktionelle Einschätzungen.

Die Begleitdatei ist eine **neu vorgeschlagene redaktionelle Übergabestruktur**, keine Behauptung über einen vorhandenen JSON-Importer. Der bestehende 31-Spalten-CSV-Vertrag bleibt unverändert.

Quellen: [Importvertrag](Importformat.md), [Filmwissen und Filmdaten](Filmwissen-und-Filmdaten.md), [Spielmodi und Bekanntheit](Spielmodi-und-Bekanntheit.md), [gezählter Bestand einschließlich Filmliste](Fragenbestand-2026-09-27.json). Reproduzierbarer Auswertungscode: [analyze-question-stock.ts](../scripts/analyze-question-stock.ts). Stand des ausgewerteten Katalogs: Commit `626c111051988d31d87810c6fd99746a82eef790`.

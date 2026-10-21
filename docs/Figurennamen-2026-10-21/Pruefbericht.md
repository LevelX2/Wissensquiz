# Vollständige Figurennamen und passende Darstellerzusätze

Stand: 21.10.2026, lokal korrigiert, noch nicht veröffentlicht.

Auslöser war der Screenshot zur leichten Beziehungsfrage aus „Bridget Jones – Am Rande des Wahnsinns“. Der [Nutzerauftrag](../../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-21%20Nutzerauftrag%20Figurennamen%20und%20Darstellerklammern.txt) verlangt eine gezielte Bestandskorrektur unpassend platzierter Darstellerzusätze.

Die betroffene Kurzantwort steht bereits fehlerhaft in der ausgelieferten CSV. `src/Explanation.tsx` übernimmt sie über `answerExplanation`; auch `preparePresentation` und die vorhandenen redaktionellen Anzeigen fügen keine Darstellernamen durch Wortersetzung ein. Eine automatische Namensergänzung zur Laufzeit ist daher nicht die Ursache. Die frühere Inhaltsabnahme hatte diese fehlerhaften Satzstellen übersehen.

## Durchsicht und Korrektur

Alle 40 öffentlichen CSV-Dateien mit 14.470 Zeilen durchsucht; der tatsächliche Katalog verwendet 39 Pakete. Fragetext, vier Optionen, Kurzantwort, Vertiefung und vier Rückmeldungen betrachtet. Die erste Suche nach Klammern zwischen großgeschriebenen Wörtern lieferte 2.795 Vorkommen in 2.124 Fragen. Ergänzend Wortanschlüsse, Namensbestandteile, abgetrennte Apostrophe und Zusätze innerhalb von Anführungszeichen gesucht. Die statischen JSON-Quellen der Anzeigeaufbereitung und die jeweils letzte Redaktion wurden ebenfalls durchsucht. Diese Suchzahlen zählen Kandidaten und keine bestätigten Fehler.

**27 Fragen in fünf aktiven Paketen korrigiert, insgesamt 49 Textfelder.** Die vollständigen aktuellen Datensätze und Prüfresultate stehen in [Pruefung.json](Pruefung.json). Es gibt keinen zusätzlichen Vorher-/Nachher-Verlauf. Vier fehlerhafte Felder in vier Fragen der letzten Redaktionsfassung nachgezogen; bereits richtige neuere Texte bleiben erhalten. Das bestehende Integrationsmanifest enthält den korrigierten aktuellen CSV-Endstand.

- Darstellerklammern hinter den vollständigen vorhandenen Figurennamen verschoben.
- Doppelte Darstellernennungen entfernt, wenn die Besetzungszuordnung im selben Satz bereits ausdrücklich steht.
- Unpassende Zusätze aus Film-, Show- und Kapiteltiteln sowie einem zusammengesetzten Plakatbegriff entfernt.
- Die Verwechslung der Pflanze Audrey II mit der menschlichen Audrey beseitigt. Der [AFI-Credit](https://catalog.afi.com/Catalog/MovieDetails/57398) nennt Ellen Greene als Audrey und Levi Stubbs als Stimme von Audrey II; die Frage nach der Originalstimme verrät diese weiterhin nicht.
- Einen abgetrennten Besitzapostroph durch einen klaren Nebensatz ersetzt.

Der [Miramax-Verleih](https://www.miramax.com/movie/bridget-jones-2-the-edge-of-reason/) bestätigt Mark Darcy mit Colin Firth und die Beziehung zu Beginn. Die vorhandenen Besetzungszuordnungen bleiben bei bloßen Klammerkorrekturen erhalten. Beim Plakat in „Mulholland Drive“ bezeichnet Rita Hayworth die abgebildete Schauspielerin; Laura Harring spielt die Figur, die daraus ihren angenommenen Namen ableitet. [Handlungsbeleg](https://en.wikipedia.org/wiki/Mulholland_Drive_(film)), [Criterion-Credit](https://www.criterion.com/films/28050-mulholland-dr).

Automatische Treffer wurden im Satzkontext getrennt beurteilt: Louise und Scott in „Die unglaubliche Geschichte des Mr. C.“ sind zwei verschiedene Figuren. Ihre beiden Darstellerangaben dürfen nicht zu einem vermeintlichen vollständigen Namen zusammengezogen werden. Ebenso bleiben echte Liedtitel mit Klammern und korrekte Genitive erhalten.

## Abnahme

Der tatsächliche App-Parser übernimmt alle 39 aktiven Pakete ohne abgewiesene oder doppelte Importe: weiterhin 15.295 Fragen und 14.628 Wissensziele. Alle 27 korrigierten Anzeigen einschließlich Rückmeldungen und Vertiefungen erfolgreich aufbereitet und mit den aktuellen CSV-Texten abgeglichen. Im gesamten eingelesenen Katalog, den betroffenen Anzeigen und der letzten Redaktionsfassung keine bestätigten Fehlermuster mehr gefunden. Die Suche ersetzt keine vollständige semantische Neuredaktion des gesamten Bestands.

Die fünf betroffenen Pakete gegen den vorherigen Git-Stand verglichen: genau 49 erlaubte Textfelder verändert; Frage-/Wissensziel-IDs, Reihenfolge, Variantenbezüge, Stufen, vier Antworttexte und Lösungsschlüssel erhalten. `tests/editorial-revision.test.ts` und `tests/reviewed-questions.test.ts`: neun Tests erfolgreich (15,50 Sekunden). `git diff --check` erfolgreich. Reine Inhaltskorrektur; kein neuer Anwendungscode und kein vollständiger Build- oder Browserlauf erforderlich.

Rohquellen, datierte Exporte und frühere Prüfstände bleiben unverändert. Keine Migration oder neue Behandlung alter Runden. Keine Veröffentlichung, kein Push und keine produktiven Datenänderungen.

# Qualitätsprüfung von zehn Fragen und Vertiefungen

Stand: 10.10.2026. Erste Durchsicht für die gemeinsame Optimierung des Fragen-Skills. **Eine Frage würde ich insgesamt unverändert lassen, drei benötigen Feinschliff, sechs eine deutlichere Überarbeitung.** Alle zehn hinterlegten Lösungen stimmen mit den gelesenen Quellen überein. Bei „Orlando“ beantwortet jedoch die Kurzantwort die falsche Frage. Die Bewertungen sind redaktionelle Urteile, keine gemessenen Qualitätsnoten.

Die vorgeschlagenen Texte stehen hier zur Durchsicht. Fragenpakete, Anzeigeergänzungen und der persönliche Skill wurden nicht geändert. Die gemeinsame Gliederung dieser Prüfung dient dem Vergleichen; sie ist ausdrücklich kein Schreibschema für Vertiefungen.

## Auswahl und Prüfgrenzen

Aus dem aktuellen lokalen App-Katalog mit 12.773 Fragen: je eine Frage aus zehn vorab festgelegten Genres, drei leicht, vier mittel und drei schwer. Innerhalb jedes Genre-/Schwierigkeitsfelds gewinnt die kleinste SHA-256-Sortierung aus dem Seed und der Frage-ID. Seed: `Qualitaetsrunde-1-2026-10-10`; Katalogbasis: `fbeacd0ea5c829010783dce5360bf285b89d986c`. Auswahl vor dem Lesen, keine nachträgliche Auswahl nach Textqualität. Kein repräsentativer Fehleranteil für den Gesamtkatalog.

Der echte App-Import und die Anzeigehelfer wurden über ein temporäres esbuild-Bundle ausgeführt. Berücksichtigt sind die in Explanation.tsx priorisierten Texte, zusätzliche Besetzungsabsätze, Merksätze und tatsächlich verbleibendes Antwortfeedback. Die gezogene Komödienfrage ist eine bereits als CSV gelieferte Regiefrage; der Ausschluss von generiertem fact_kind entfernt diese nicht. Personen- und Preisfragen sind in dieser ersten Runde nicht enthalten.

Alle vier Optionen und ihr sichtbares Feedback wurden je Frage gelesen. Handlungen und Credits sind anhand der jeweils genannten tatsächlich geöffneten Quellen abgeglichen. Keine erneute Sichtung der zehn vollständigen Filme. Sekundärquellen sind entsprechend bezeichnet; besonders das zusätzliche Stativdetail bei „Vier im roten Kreis“ bleibt vor einer Übernahme zur direkten Szenenprüfung empfohlen. Keine App- oder Browsertests notwendig, da ausschließlich diese Prüfunterlagen entstehen.

[Originaldaten, Versionen, Auswahlwerte und Bewertungen](Stichprobe.json). [Unveränderter Nutzerauftrag](../../KI-Wissen-Wissensquiz/01%20Rohquellen/2026-10-10%20Nutzerauftrag%20Qualitaetspruefung%20zehn%20Fragen.txt).

## Überblick

| Nr. | Film | Stufe | Urteil | Wichtigster Punkt |
|---|---|---|---|---|
| 1 | Solaris | leicht | Deutlich überarbeiten | Abstrakte Deutung durch Hari konkretisieren |
| 2 | True Lies – Wahre Lügen | mittel | Deutlich überarbeiten | Berufsfrage eingrenzen; Ablenker und Schlussauftritt verbessern |
| 3 | Das Cabinet des Dr. Caligari | schwer | Gut, kleiner Feinschliff | Konkrete Erklärung behalten, allgemeines Ende optional kürzen |
| 4 | Orlando | leicht | Unbedingt überarbeiten | Kurzantwort falsch zugeordnet; interessante Besetzung nutzen |
| 5 | Playtime | mittel | Unverändert lassen | Konkretes Produktionswissen und Bildgestaltung bereits gelungen |
| 6 | Mein Name ist Nobody | schwer | Deutlich überarbeiten | Spiegelnde Satteltaschen und Nobodys Zug fehlen |
| 7 | Kagemusha – Der Schatten des Kriegers | mittel | Gut, gezielt ergänzen | Doppelgänger und Nakadais Doppelrolle verständlich machen |
| 8 | Velvet Goldmine | leicht | Überarbeiten | Antwortlängen angleichen; Rechercheform statt allgemeinem Image |
| 9 | Der Stadtneurotiker | schwer | Gut, sprachlich verdichten | Gleichen Gedanken mehrfach erklärt; Szene verdichten |
| 10 | Vier im roten Kreis | mittel | Gezielt überarbeiten | Selbstbeherrschung am freihändigen Schuss zeigen |

## 1 Solaris

Frage-ID: `ART-L-017` · Science-Fiction · leicht · 288 Auswahlkandidaten.

**Originalfrage:** „Solaris“ (1972): Welchen Beruf hat Kris Kelvin (Donatas Banionis)?

- Psychologe **(richtig)**
- Koch
- Geologe
- Pilot

**Originale Kurzantwort:** Kris Kelvin (Donatas Banionis) ist Psychologe.

**Originale Vertiefung:**

> Kris Kelvin (Donatas Banionis) soll eine rätselhafte Situation beurteilen, wird aber selbst zu einem Teil davon. Sein Beruf verspricht zunächst Distanz und Analyse. Der Film macht diese Position fragwürdig, sobald persönliche Erinnerungen ins Geschehen eingreifen. Beobachter und Untersuchungsgegenstand lassen sich dann nicht mehr sauber voneinander trennen, ohne einen wichtigen Teil der Erfahrung auszublenden.

**Originaler Merksatz:** Der Psychologe wird selbst geprüft.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Koch: Er ist nicht der Stationskoch.
- Geologe: Kelvin (Donatas Banionis) reist nicht als Geologe an.
- Pilot: Seine Funktion ist nicht die eines Piloten.

**Mein Urteil: Deutlich überarbeiten.** Die Lösung Psychologe stimmt. Als leichte Einstiegsfrage ist das Ziel brauchbar; Koch fällt gegenüber den wissenschaftlichen Berufen allerdings stark ab. Die Kurzantwort beantwortet die Frage, wiederholt aber nur die Lösung. Die Vertiefung bleibt bei „rätselhafte Situation“, „persönliche Erinnerungen“ und „Beobachter und Untersuchungsgegenstand“. Gerade der konkrete Vorgang, der diese Gedanken interessant macht, fehlt. Der letzte Satz klingt nach einem allgemeinen Filmseminar und könnte mit anderen Namen in vielen Filmen stehen.

**Was ich ändern oder erhalten würde:** Frage und Wissensziel grundsätzlich erhalten, den Koch durch eine fachlich plausible Alternative ersetzen. Die drei verneinenden Zusatztexte streichen. Die Vertiefung an Hari festmachen; bei Übernahme den zusätzlichen Handlungsspoiler berücksichtigen. Der bestehende Merksatz ist gut und kann bleiben.

**Vorschlag für die Kurzantwort:** Kris Kelvin (Donatas Banionis) ist Psychologe. Er soll die verstörenden Vorgänge auf der Raumstation untersuchen.

**Vorschlag für die Vertiefung:**

> Auf der Station begegnet Kris Kelvin (Donatas Banionis) seiner verstorbenen Frau Hari (Natalja Bondartschuk). Sie ist keine heimlich angereiste Überlebende: Der Ozean von Solaris hat sie aus Kelvins Erinnerungen hervorgebracht. Der Psychologe, der die anderen untersuchen soll, muss nun mit seiner eigenen Vergangenheit umgehen. Hari entwickelt Gefühle und ein eigenes Bewusstsein – damit wird auch die Frage schwierig, wie Kelvin dieses Wesen behandeln darf.

**Fakten und Deutung:** Beruf, Untersuchungsauftrag, Hari als Verkörperung seiner Erinnerungen und Besetzung sind in den Filmangaben und der Handlung belegt. Der letzte Zusammenhang des Vorschlags ist eine redaktionelle Deutung dieser Handlung.

[Filmartikel und Handlung](https://en.wikipedia.org/wiki/Solaris_(1972_film)) · [Criterion mit Beruf und Besetzung](https://www.criterion.com/films/553-solaris)

## 2 True Lies – Wahre Lügen

Frage-ID: `ACT-M-025` · Action · mittel · 350 Auswahlkandidaten.

**Originalfrage:** „True Lies – Wahre Lügen“ (1994): Was ist der vermeintliche Spion Simon (Bill Paxton) tatsächlich?

- Gebrauchtwagenverkäufer **(richtig)**
- Pilot einer Geheimdienstmaschine
- Mitarbeiter des Innenministeriums
- Hochrangiger Doppelagent

**Originale Kurzantwort:** Simon verkauft Gebrauchtwagen und benutzt seine Spionagegeschichten, um Frauen zu beeindrucken.

**Originale Vertiefung:**

> Bill Paxton spielt Simon als Mann, der mit einer erfundenen gefährlichen Identität Abenteuer verspricht. Für Helen wirkt er zunächst wie das Gegenteil ihres langweiligen Ehemanns. Das Publikum kennt jedoch die Umkehrung: Der echte Agent verbirgt sein Leben, während der Verkäufer ein Agentenleben erfindet. Daraus entsteht die besondere Komik der Dreieckssituation.

**Zusätzlicher angezeigter Besetzungsabsatz:** Helen Tasker wird von Jamie Lee Curtis gespielt.

**Originaler Merksatz:** Simon spielt den Spion, während Harry seinen echten Beruf versteckt.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Pilot einer Geheimdienstmaschine: Er fliegt keine Geheimdienstmissionen, sondern verkauft Autos.
- Mitarbeiter des Innenministeriums: Simon arbeitet nicht als echter Ministeriumsmitarbeiter; seine Geschichten sind erfunden.
- Hochrangiger Doppelagent: Ein Doppelagent müsste wirklich für Dienste tätig sein; Simon täuscht das nur vor.

**Mein Urteil: Deutlich überarbeiten.** Gutes Filmwissen und richtige Lösung. Die Vertiefung erklärt die Spiegelung zwischen Harry und Simon sinnvoll. Die Antwortauswahl schwächt die Frage aber: „vermeintlicher Spion“ trifft auf drei Antworten aus Geheimdienst und Ministerium und nur einen gewöhnlichen Beruf. Das ist ein deutlicher Raterichtungshinweis. Außerdem braucht die Berufsfrage eine zeitliche Eingrenzung: Im Schlussauftritt arbeitet Simon als Kellner. Helen erhält erst im angehängten Besetzungstext einen Darstellernamen; Harry bleibt im Merksatz ohne Einführung.

**Was ich ändern oder erhalten würde:** Frage etwa: „Welchen Beruf übt Simon (Bill Paxton) in ‚True Lies‘ aus, als er Helen kennenlernt?“ Als Alternativen eignen sich andere zivile Tätigkeiten, zum Beispiel Reisebüroangestellter, Versicherungsvertreter und Reporter. Die Spiegelung im Text erhalten, aber um den konkreten Schlussauftritt ergänzen. Verneinendes Feedback löschen. Den Besetzungszusatz bei späterer Übernahme mit dem Haupttext abgleichen, damit Helen nicht doppelt eingeführt wird.

**Vorschlag für die Kurzantwort:** Simon (Bill Paxton) verkauft Gebrauchtwagen. Mit einer erfundenen Agentenidentität versucht er, Helen Tasker (Jamie Lee Curtis) zu beeindrucken.

**Vorschlag für die Vertiefung:**

> Harry Tasker (Arnold Schwarzenegger) verbirgt seinen Agentenberuf hinter einer biederen Verkäuferexistenz; Simon (Bill Paxton) macht es genau umgekehrt. Besonders schön greift der Schluss diesen Gegensatz wieder auf: Simon arbeitet inzwischen als Kellner und erzählt erneut Spionagegeschichten. Diesmal begegnet er Harry und Helen Tasker (Jamie Lee Curtis), die nun tatsächlich gemeinsam als Agenten unterwegs sind.

**Vorschlag für den Merksatz:** Harry versteckt den echten Agenten, Simon erfindet einen.

**Fakten und Deutung:** Berufe, Täuschung, Besetzung und Wiederbegegnung im Schluss sind in der Handlung belegt. Der Vergleich der beiden Tarnidentitäten ist redaktionelle Einordnung.

[Handlung einschließlich Schlussauftritt](https://en.wikipedia.org/wiki/True_Lies)

## 3 Das Cabinet des Dr. Caligari

Frage-ID: `G100-20261008-HORROR-001-S1` · Horror · schwer · 220 Auswahlkandidaten.

**Originalfrage:** Was entdecken die Ermittler in „Das Cabinet des Dr. Caligari“ in der Kiste von Cesare (Conrad Veidt)?

- Einen zweiten schlafenden Darsteller
- Eine Puppe anstelle des Schlafwandlers **(richtig)**
- Eine Spiegelkonstruktion hinter dem Deckel
- Einen verborgenen Ausgang unter der Matratze

**Originale Kurzantwort:** Eine Puppe täuscht Cesares Anwesenheit vor.

**Originale Vertiefung:**

> Francis (Friedrich Fehér) hat Dr. Caligari (Werner Krauß) und die scheinbar schlafende Gestalt beobachtet. Trotzdem wurde Jane (Lil Dagover) in dieser Nacht angegriffen. Erst die Untersuchung der Kiste erklärt diesen Widerspruch: Eine Puppe nahm Cesares (Conrad Veidt) Platz ein. Die Beobachtung war somit nicht erfunden, ihre Deutung aber falsch. Ein scheinbar überzeugendes Alibi hängt an einem Gegenstand, dessen Echtheit niemand zuvor überprüft hatte.

**Originaler Merksatz:** Die Beobachtung stimmt, doch die Gestalt ist eine Puppe.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Einen zweiten schlafenden Darsteller: Ein zweiter Darsteller ersetzt Cesare nicht.
- Eine Spiegelkonstruktion hinter dem Deckel: Ein Spiegel erklärt die beobachtete Gestalt nicht.
- Einen verborgenen Ausgang unter der Matratze: Ein Ausgang ist nicht die entdeckte Täuschung.

**Mein Urteil: Gut, kleiner Feinschliff.** Richtige Lösung und eine bereits konkrete Vertiefung: Beobachtung, Angriff und Entdeckung der Puppe erklären den scheinbaren Widerspruch. Das liefert tatsächliches Filmwissen und keine beliebige Produktionsanekdote. Frage, Kurzantwort und Merksatz würde ich behalten. „Ein zweiter schlafender Darsteller“ vermischt die Handlungsebene mit einem Beruf aus Theater oder Film; „ein anderer schlafender Mann“ wäre sauberer. Die beiden letzten Sätze der Vertiefung verallgemeinern das bereits anschaulich Erzählte.

**Was ich ändern oder erhalten würde:** Keine neue Vertiefung nötig. Optional nach „Eine Puppe nahm Cesares (Conrad Veidt) Platz ein“ enden; die beiden abstrakten Schlusssätze tragen wenig zusätzlich bei. Alternative mit „Darsteller“ präzisieren. Die drei leeren Verneinungen zu den falschen Antworten entfernen. „Schwer“ ist für das gezielte Erinnern dieses Täuschungsdetails vertretbar.

**Fakten und Deutung:** Die Handlung bestätigt Franzis’ Beobachtung, Janes Angriff und die Untersuchung durch Franzis und die Polizei. Der Originaltext nennt ihn Francis; eine spätere Namensvereinheitlichung müsste sich an der verwendeten Fassung orientieren. Das betrifft nicht die Lösung.

[Handlung und Besetzung](https://en.wikipedia.org/wiki/The_Cabinet_of_Dr._Caligari)

## 4 Orlando

Frage-ID: `F240-20261006-080-L1` · Fantasy · leicht · 211 Auswahlkandidaten.

**Originalfrage:** Welche ungewöhnliche Bedingung stellt die Königin Orlando (Tilda Swinton) in „Orlando“ für ihr Geschenk?

- Orlando soll nicht altern. **(richtig)**
- Orlando soll nie schreiben.
- Orlando soll niemals reisen.
- Orlando soll jedes Jahr heiraten.

**Originale Kurzantwort:** Elizabeth I.

**Originale Vertiefung:**

> Elizabeth I. (Quentin Crisp) verlangt, dass Orlando (Tilda Swinton) nicht altert. Orlando (Tilda Swinton) erhält Besitz und lebt danach durch mehrere Jahrhunderte; das Versprechen setzt die ungewöhnliche Zeitspanne der Erzählung.

**Originaler Merksatz:** Der Besitz ist an ein Leben ohne Altern gebunden.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Orlando soll nie schreiben.: Das Schreiben wird nicht verboten.
- Orlando soll niemals reisen.: Reisen sind nicht untersagt.
- Orlando soll jedes Jahr heiraten.: Jährliche Heiraten fordert sie nicht.

**Mein Urteil: Unbedingt überarbeiten.** Die richtige Option „Orlando soll nicht altern“ ist korrekt. Die Kurzantwort „Elizabeth I.“ beantwortet jedoch eine andere Frage und ist ein klarer redaktioneller Fehler. Die Vertiefung nennt die Bedingung und wiederholt den Namen mit Darsteller zweimal in zwei Sätzen. Als Hintergrund bleibt nur das, was aus der Frage ohnehin zu erwarten ist. Die falschen Antworten sind sehr karikierend, besonders die jährliche Heirat.

**Was ich ändern oder erhalten würde:** Kurzantwort ersetzen. Die grundlegende Bedingung als leichtes Ziel behalten, aber glaubwürdigere Bedingungen als Ablenker entwickeln. Den bemerkenswerten Besetzungsentscheid nutzen, der unmittelbar zur Königin in dieser Frage gehört. Keine Mindestwortzahl erzwingen. Leere Verneinungsfeedbacks entfernen.

**Vorschlag für die Kurzantwort:** Orlando soll nicht altern. Unter dieser Bedingung verspricht Elizabeth I. ihm ihren Besitz.

**Vorschlag für die Vertiefung:**

> Elizabeth I. wird von Quentin Crisp gespielt, Orlando von Tilda Swinton. Sally Potter begründete ihre ungewöhnliche Wahl der Königin damit, dass Crisp für sie die wahre Königin Englands sei. Ihr Gebot, nicht alt zu werden, nimmt der Film wörtlich: Während die Epochen wechseln, bleibt Orlando jung.

**Vorschlag für den Merksatz:** Elizabeths Bedingung: Besitz erhalten, ohne alt zu werden.

**Fakten und Deutung:** Bedingung und Geschenk sind im Filmhandlungsartikel belegt. Die Website der Regisseurin enthält den Rückblick mit ihrer eigenen Erklärung zur Besetzung und dem Gebot der Königin. Der Vorschlag paraphrasiert diese Aussage.

[Bedingung und Geschenk](https://en.wikipedia.org/wiki/Orlando_(film)) · [Sally Potter mit eigener Aussage zur Wahl Quentin Crisps](https://sallypotter.com/blog/browse/NEWS)

## 5 Playtime

Frage-ID: `F240-20261006-107-D` · Komödie · mittel · 379 Auswahlkandidaten.

**Originalfrage:** Wer führte bei „Playtime“ Regie?

- Pierre Étaix
- Louis Malle
- Luis Buñuel
- Jacques Tati **(richtig)**

**Originale Kurzantwort:** Der Regiecredit lautet Jacques Tati.

**Originale Vertiefung:**

> Jacques Tati führte Regie und spielt Monsieur Hulot. Für die moderne Stadt ließ er ein eigenes großes Set errichten. Die Inszenierung verteilt die Komik über breite Bilder und viele gleichzeitige Handlungen, statt Hulot ständig in Großaufnahme zum alleinigen Mittelpunkt zu machen.

**Originaler Merksatz:** Jacques Tati: Für die moderne Stadt ließ er ein eigenes großes Set errichten.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Pierre Étaix: kein Zusatztext
- Louis Malle: kein Zusatztext
- Luis Buñuel: kein Zusatztext

**Mein Urteil: Unverändert lassen.** Für diesen Einsatzzweck sehr gelungen. Eindeutige Regiefrage, vier reale Regisseure, klare Kurzantwort. Die Vertiefung verbindet Tatis Regie und eigene Rolle mit einem eigens gebauten Stadtset und seiner Komik in großen, gleichzeitig bespielten Bildern. Das ist individuell und auch ohne Filmkenntnis verständlich. Sie endet mit einer konkreten Gestaltung statt einer pauschalen Bedeutungserklärung. Die falschen Antworten haben bereits keine sichtbaren leeren Zusatztexte.

**Was ich ändern oder erhalten würde:** Keine notwendige Änderung. Der Name Tativille oder das Aufnahmeformat ließen sich ergänzen, würden den vorhandenen Text aber nicht automatisch verbessern. Hier bewusst auf eine zusätzliche Anekdote verzichten. Kurzantwort, Vertiefung, Alternativen und Merksatz erhalten. „Unverändert“ ist ein Urteil für diesen Zweck, kein Anspruch, dass keine andere gute Formulierung möglich wäre.

**Fakten und Deutung:** Criterion bestätigt Regie, Hulot-Besetzung und die Komik des weiten Bildes. Die Verleihunterlagen von Carlotta dokumentieren die künstliche Stadt Tativille. Die Einordnung der gleichzeitigen Bildhandlungen ist nachvollziehbare Gestaltungsbeschreibung.

[Criterion mit Credit, Besetzung und Inszenierung](https://www.criterion.com/films/651-playtime) · [Carlotta Presseheft mit Tativille](https://carlottafilms.com/wp-content/uploads/2020/04/DP-PLAYTIME.pdf)

## 6 Mein Name ist Nobody

Frage-ID: `WES-S-013` · Western · schwer · 221 Auswahlkandidaten.

**Originalfrage:** „Mein Name ist Nobody“ (1973): Was macht Beauregards (Henry Fonda) Schüsse gegen die heranreitende Horde besonders wirksam?

- Dynamit in den Satteltaschen der Angreifer **(richtig)**
- Ein absichtlich zerstörter Brückendamm
- Eine zuvor vergiftete Wasserstelle
- Ein verstecktes Regiment hinter ihm

**Originale Kurzantwort:** Beauregard (Henry Fonda) trifft die mit Dynamit gefüllten Satteltaschen.

**Originale Vertiefung:**

> Beauregard (Henry Fonda) gewinnt nicht durch eine endlose Reihe gewöhnlicher Treffer. Er erkennt eine Eigenschaft der Ausrüstung seiner Gegner und nutzt sie gegen die Übermacht. Dadurch verbindet der Film das unglaubliche Bild des Einzelkämpfers mit einem konkreten Trick. Nobodys (Terence Hill) gewünschte Legende beruht also auch auf Beobachtung und auf einer Schwachstelle der Horde.

**Originaler Merksatz:** Dynamit macht wenige Treffer gewaltig.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Ein absichtlich zerstörter Brückendamm: Es ist kein Dammbruch, der die Angreifer stoppt.
- Eine zuvor vergiftete Wasserstelle: Die Wasserstelle entscheidet diesen Kampf nicht.
- Ein verstecktes Regiment hinter ihm: Ein verborgenes Regiment übernimmt seine Schüsse nicht.

**Mein Urteil: Deutlich überarbeiten.** Die Lösung stimmt. Die Frage verrät sie nicht wörtlich, lenkt aber über „Schüsse besonders wirksam“ stark auf die einzige Antwort mit Explosivstoff; Damm, Wasserstelle und Regiment funktionieren auf einer anderen Ebene. Die Vertiefung nennt eine „Eigenschaft der Ausrüstung“ und eine „Schwachstelle“, verschweigt jedoch gerade das anschauliche Detail: die spiegelnden Beschläge der mit Dynamit gefüllten Satteltaschen. So klingt der Text erklärend, liefert aber wenig über die Kurzantwort hinaus.

**Was ich ändern oder erhalten würde:** Frage offener auf den Erfolg gegen die Übermacht beziehen und vier taktische Erklärungen auf derselben Ebene anbieten. Den konkreten Zusammenhang aus Zielhilfe und Explosivstoff erzählen. Den brauchbaren Merksatz behalten. Die falschen Antworttexte streichen.

**Vorschlag für die Kurzantwort:** Beauregard (Henry Fonda) schießt auf die mit Dynamit gefüllten Satteltaschen der Reiter und löst Explosionen aus.

**Vorschlag für die Vertiefung:**

> Die Reiter der Wild Bunch haben Dynamit in ihren Satteltaschen. Deren spiegelnde Beschläge liefern Jack Beauregard (Henry Fonda) die Zielpunkte: Seine Treffer bringen die Sprengladung zur Explosion. Nobody (Terence Hill) wartet mit dem Zug und lässt ihn erst nach dieser Bewährungsprobe einsteigen. So entsteht das von Nobody gewünschte Bild des Mannes, der allein gegen die Horde besteht.

**Fakten und Deutung:** Dynamit, spiegelnde Beschläge, der Zug und Nobodys Forderung sind in der gelesenen Handlung beschrieben. Die Schlussformulierung verbindet diese Vorgänge redaktionell; sie behauptet keinen zusätzlichen Produktionsumstand.

[Handlung mit Beschlägen, Dynamit und Zug](https://en.wikipedia.org/wiki/My_Name_Is_Nobody)

## 7 Kagemusha – Der Schatten des Kriegers

Frage-ID: `E20261007-F-266-M2` · Drama · mittel · 402 Auswahlkandidaten.

**Originalfrage:** „Kagemusha – Der Schatten des Kriegers“: Was fordert Shingen (Tatsuya Nakadai) vor seinem Tod von seinen Generälen?

- Den Clan sofort dem ältesten Gegner zu übergeben
- Seinen Tod drei Jahre geheim zu halten **(richtig)**
- Seinen Sohn noch in derselben Nacht hinrichten zu lassen
- Den Doppelgänger öffentlich als neuen Erben einzusetzen

**Originale Kurzantwort:** Das dreijährige Geheimnis soll die Position der Takeda erhalten.

**Originale Vertiefung:**

> Shingens Anordnung verzögert die offene Machtübernahme seines Sohnes Katsuyori (Kenichi Hagiwara). Das Geheimnis schützt den Clan nach außen, schafft aber im Inneren ein gespanntes Verhältnis. Die zeitlich begrenzte Täuschung besitzt daher einen Preis: Der tatsächliche Nachfolger muss neben einem Menschen leben, der öffentlich weiterhin als sein Vater auftritt.

**Originaler Merksatz:** Das dreijährige Geheimnis schützt den Clan und behindert Katsuyoris offene Nachfolge.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Den Clan sofort dem ältesten Gegner zu übergeben: Eine freiwillige Übergabe an den Gegner ist nicht der Auftrag.
- Seinen Sohn noch in derselben Nacht hinrichten zu lassen: Der Sohn wird nicht zur sofortigen Hinrichtung bestimmt.
- Den Doppelgänger öffentlich als neuen Erben einzusetzen: Der Ersatzmann soll Shingen verkörpern, nicht offiziell dessen Erbe werden.

**Mein Urteil: Gut, gezielt ergänzen.** Richtige Lösung, eine klare Frist und ein verständlicher politischer Zusammenhang. Die vorhandene Vertiefung erklärt den Konflikt mit Katsuyori bereits sinnvoll; sie braucht keinen kompletten Neuansatz. Für jemanden, der den Film kaum kennt, bleibt aber unklar, wer den toten Herrscher überhaupt öffentlich vertreten kann. Gerade die Doppelrolle Tatsuya Nakadais würde hier zusätzlichen Erkenntniswert schaffen. Die absurde Antwort einer sofortigen Clanübergabe ist ein schwacher Ablenker.

**Was ich ändern oder erhalten würde:** Kurzantwort ausdrücklich auf die drei Jahre beziehen. Die Vertiefung um die Identität des Ersatzmanns ergänzen und dafür allgemeine Sätze über ein „gespanntes Verhältnis“ kürzen. Shingen und Doppelgänger klar als zwei Figuren desselben Darstellers kennzeichnen. Falsche Optionen plausibler gestalten; den bloßen Verneinungstext zu jeder Option entfernen. Die Erläuterung zum Ersatzmann gehört sinnvoll in die Vertiefung.

**Vorschlag für die Kurzantwort:** Shingens Generäle sollen seinen Tod drei Jahre geheim halten, um die Stellung des Takeda-Clans zu sichern.

**Vorschlag für die Vertiefung:**

> Nach Shingens Tod soll ein ihm verblüffend ähnlicher Dieb seine öffentliche Rolle übernehmen. Tatsuya Nakadai spielt beide Figuren: den Herrscher und seinen Doppelgänger. Für Shingens Sohn Katsuyori (Kenichi Hagiwara) bedeutet die Täuschung, dass sein Vater scheinbar weiterregiert. Im Rat versucht er, den Ersatzmann mit einer direkten Frage bloßzustellen; dieser antwortet jedoch überzeugend in Shingens Art.

**Vorschlag für den Merksatz:** Drei Jahre lang soll ein Doppelgänger Shingens Tod verbergen.

**Fakten und Deutung:** Frist, Dieb als Doppelgänger, Nakadais Doppelrolle, Katsuyoris Konflikt und die Ratsszene sind in der Handlung und Besetzung belegt. Die Erklärung bezieht sich auf den Film, nicht auf eine unabhängige Darstellung der historischen Takeda-Nachfolge.

[Handlung und Doppelrolle](https://en.wikipedia.org/wiki/Kagemusha) · [Deutscher Filmartikel zum Abgleich](https://de.wikipedia.org/wiki/Kagemusha_%E2%80%93_Der_Schatten_des_Kriegers)

## 8 Velvet Goldmine

Frage-ID: `F240-20261006-157-L1` · Musik · leicht · 210 Auswahlkandidaten.

**Originalfrage:** Was hat Brian Slade (Jonathan Rhys Meyers) in „Velvet Goldmine“ bei einem Konzert inszeniert?

- Seine eigene Ermordung **(richtig)**
- Seinen plötzlichen Ausstieg aus der Musikszene als spontane Entscheidung
- Eine schwere Bühnenverletzung, die als Unfall ausgegeben wird
- Eine fingierte Festnahme durch echte Polizeibeamte

**Originale Kurzantwort:** Slade hat einen Mord an sich als Werbeaktion vorgetäuscht.

**Originale Vertiefung:**

> Brian Slade (Jonathan Rhys Meyers) bricht seine öffentliche Karriere mit einer inszenierten Tötung ab. Die Enttäuschung der Fans über die Täuschung führt zum Niedergang. Das spätere Verschwinden wird deshalb nicht als einfacher ungelöster Mordfall untersucht, sondern als Folge einer zerstörten Starrolle.

**Originaler Merksatz:** Der inszenierte Tod zerstört Slades Glaubwürdigkeit.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Seinen plötzlichen Ausstieg aus der Musikszene als spontane Entscheidung: Slade inszeniert einen tödlichen Anschlag auf sich selbst.
- Eine schwere Bühnenverletzung, die als Unfall ausgegeben wird: Es geht um eine vorgetäuschte Ermordung, keine bloße Verletzung.
- Eine fingierte Festnahme durch echte Polizeibeamte: Eine angebliche Festnahme ist nicht der Skandal.

**Mein Urteil: Überarbeiten.** Richtige Lösung und ein gutes leichtes Wissensziel. Die richtige Antwort ist auffällig kurz, während alle Ablenker umständliche Zusatzbedingungen tragen. „Eine fingierte Festnahme durch echte Polizeibeamte“ wirkt eigens konstruiert. Die Vertiefung erzählt überwiegend erneut die Kurzlösung und deren Karrierefolge. „Folge einer zerstörten Starrolle“ ist ein abstrakter Schluss. Konkreter wären der spätere Ermittlungsauftrag und die an Citizen Kane erinnernde Erzählweise.

**Was ich ändern oder erhalten würde:** Alternativen sprachlich angleichen, etwa eigene Ermordung, Unfall auf der Bühne, polizeiliche Festnahme, spontane Auflösung der Band. Den inszenierten Mord als Einstieg behalten und dann zur journalistischen Recherche wechseln. Das ist eine andere Perspektive als die wiederholte allgemeine Deutung eines Images. Merksatz kann bleiben; leeres und lösungswiederholendes Feedback entfernen.

**Vorschlag für die Kurzantwort:** Brian Slade (Jonathan Rhys Meyers) lässt seine eigene Ermordung auf der Bühne vortäuschen. Die als Werbung gedachte Aktion ruiniert seine Karriere.

**Vorschlag für die Vertiefung:**

> Zehn Jahre nach dem vorgetäuschten Bühnenmord soll der Journalist Arthur Stuart (Christian Bale) herausfinden, was aus Brian Slade (Jonathan Rhys Meyers) geworden ist. Dazu befragt er Menschen aus dessen Umfeld. Ihre Erinnerungen führen zurück in die Glamrock-Jahre. Todd Haynes greift damit die Rechercheform von „Citizen Kane“ auf: Ein Star wird aus den oft widersprüchlichen Erinnerungen anderer zusammengesetzt.

**Fakten und Deutung:** Der Zehnjahresabstand, Arthurs Auftrag und die Befragungen sind im Handlungsabschnitt belegt; die Verbindung zu Citizen Kane wird im Hintergrundabschnitt beschrieben. „Oft widersprüchlich“ ist eine redaktionelle Beschreibung der Erinnerungsstruktur, keine zusätzliche Tatsachenlösung.

[Handlung, Besetzung und Citizen-Kane-Struktur](https://en.wikipedia.org/wiki/Velvet_Goldmine)

## 9 Der Stadtneurotiker

Frage-ID: `G100-20261008-ROMCOM-004-S1` · Rom-Com · schwer · 220 Auswahlkandidaten.

**Originalfrage:** Was zeigen die Untertitel beim frühen Fotografiegespräch von Alvy und Annie (Woody Allen, Diane Keaton) in „Der Stadtneurotiker“?

- Ihre unausgesprochenen Gedanken **(richtig)**
- Ihre späteren Erinnerungen an das Gespräch
- Ihre gegenseitigen Übersetzungsfehler
- Ihre geplanten nächsten Verabredungen

**Originale Kurzantwort:** Die Untertitel machen die Gedanken hinter dem Gespräch sichtbar.

**Originale Vertiefung:**

> Alvy Singer (Woody Allen) und Annie Hall (Diane Keaton) sprechen über Fotografie, während Untertitel ihre nicht ausgesprochenen Gedanken zeigen. Der höfliche Austausch und die inneren Erwartungen laufen dadurch nebeneinander. Das Publikum erhält mehr Informationen als die Figuren im Gespräch voneinander bekommen. Diese Gestaltung macht das erste gegenseitige Abtasten sichtbar: Die Worte beschäftigen sich mit Kunst, während Unsicherheit, Anziehung und die Angst vor einem ungünstigen Eindruck eine andere Ebene bilden.

**Originaler Merksatz:** Untertitel zeigen, was das höfliche Gespräch verschweigt.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Ihre späteren Erinnerungen an das Gespräch: Sie berichten nicht rückblickend aus späteren Erinnerungen.
- Ihre gegenseitigen Übersetzungsfehler: Es geht nicht um Übersetzungsfehler.
- Ihre geplanten nächsten Verabredungen: Sie listen keine nächsten Verabredungen auf.

**Mein Urteil: Gut, sprachlich verdichten.** Die richtige Lösung ist eindeutig, und die Frage erschließt eine markante Gestaltung des Films. Die Vertiefung ist konkret genug, um sie nicht grundsätzlich auszutauschen. Sie erklärt jedoch denselben Unterschied zwischen Gesagtem und Gedachtem in vier Anläufen. „Das Publikum erhält mehr Informationen“ ist gegenüber dem bereits Gesagten kaum neuer Inhalt. Schwer ist diskutabel: Für Kenner ist die berühmte Szene leicht erkennbar; das szenenspezifische Erinnern kann die Einstufung dennoch begründen.

**Was ich ändern oder erhalten würde:** Eine knappe, sinnliche Szenenbeschreibung genügt. Den flirtenden, auch sexuellen Subtext konkreter benennen, statt nur abstrakt von einer „anderen Ebene“ zu sprechen. Frage und Merksatz behalten; die leeren Verneinungsfeedbacks löschen. Die falsche Option „Übersetzungsfehler“ passt als naheliegende Verwechslung zum Medium Untertitel und muss nicht ersetzt werden.

**Vorschlag für die Kurzantwort:** Die Untertitel zeigen Alvys und Annies Gedanken, während beide laut über Fotografie sprechen.

**Vorschlag für die Vertiefung:**

> Auf Annies Balkon reden Alvy Singer (Woody Allen) und Annie Hall (Diane Keaton) über Fotografie. Darunter läuft ihr Flirt als zweites Gespräch: Die Untertitel zeigen, wie sie einander einschätzen, sich angezogen fühlen und um ihren Eindruck sorgen. Man kann gleichzeitig der kultivierten Unterhaltung zuhören und die ungeschützten Gedanken mitlesen. Genau diese Gleichzeitigkeit macht den Witz der Szene aus.

**Fakten und Deutung:** Die Library of Congress stellt den Essay Jay Carrs bereit, der ausdrücklich das Fotografiegespräch und die gegenseitige sexuelle Einschätzung in Untertiteln beschreibt. Der Filmartikel bestätigt Balkonszene, innere Unsicherheit und Besetzung. Die Beschreibung des Witzes ist redaktionelle Deutung.

[Jay Carrs Essay bei der Library of Congress](https://lcweb2.loc.gov/static/programs/national-film-preservation-board/documents/anniehall2.pdf) · [Handlung und Gestaltung](https://en.wikipedia.org/wiki/Annie_Hall)

## 10 Vier im roten Kreis

Frage-ID: `G100-20261008-THRILLER-025-M1` · Thriller · mittel · 370 Auswahlkandidaten.

**Originalfrage:** Welche besondere Aufgabe hat Jansen (Yves Montand) beim Einbruch in „Vier im roten Kreis“?

- Er öffnet den Tresor mit einem kopierten Zahlencode.
- Er täuscht als Polizist die Wachmannschaft.
- Er betäubt das Personal mit präparierten Getränken.
- Er schaltet die Sicherung mit einem präzisen Gewehrschuss aus. **(richtig)**

**Originale Kurzantwort:** Jansen übernimmt den entscheidenden Präzisionsschuss.

**Originale Vertiefung:**

> Jansen (Yves Montand) ist ein ehemaliger Polizist und hervorragender Schütze, dessen Alkoholabhängigkeit ihn aus der Bahn geworfen hat. Corey (Alain Delon) braucht sein Können, um die Sicherung des Juweliers auszuschalten. Für Jansen ist der Coup deshalb auch eine persönliche Prüfung. Der erfolgreiche Schuss zeigt ihm, dass seine technische Selbstbeherrschung wieder funktioniert und er mehr beitragen kann als bloß zusätzliche Hände.

**Originaler Merksatz:** Der Präzisionsschuss wird Jansens persönliche Bewährungsprobe.

**Sichtbare Zusatztexte bei falscher Auswahl:**

- Er öffnet den Tresor mit einem kopierten Zahlencode.: Ein kopierter Zahlencode ist nicht Jansens besondere Aufgabe.
- Er täuscht als Polizist die Wachmannschaft.: Er tritt beim Einbruch nicht als kontrollierender Polizist auf.
- Er betäubt das Personal mit präparierten Getränken.: Betäubte Getränke bilden nicht seinen Beitrag.

**Mein Urteil: Gezielt überarbeiten.** Gute Frage, plausible Einbruchsalternativen und richtige Lösung. Der Hintergrund des alkoholabhängigen früheren Polizisten ist relevant. Die Vertiefung führt aber von „persönlicher Prüfung“ zu „technischer Selbstbeherrschung“, ohne zu zeigen, woran man diese erkennt. Genau hier wäre ein individuelles, sichtbares Detail besser als eine weitere allgemeine Bewertung. Die Kurzantwort sagt „Präzisionsschuss“, benennt dessen Ziel aber nicht.

**Was ich ändern oder erhalten würde:** Frage und Auswahl erhalten. Kurzantwort um die Sicherung ergänzen. Das Abnehmen des Gewehrs vom Stativ als anschaulichen Kern erzählen. Die Deutung der wiedergewonnenen Selbstachtung an dieses Verhalten binden. Merksatz kann bleiben. Zu diesem zusätzlichen Szenendetail liegt hier eine szenenweise Sekundäranalyse vor; vor einer späteren App-Übernahme möglichst direkt am Film beziehungsweise einer offiziellen Szenenquelle gegenprüfen.

**Vorschlag für die Kurzantwort:** Jansen (Yves Montand) schaltet mit einem präzisen Gewehrschuss den Sicherungsmechanismus des Juweliers aus.

**Vorschlag für die Vertiefung:**

> Jansen (Yves Montand) richtet für den entscheidenden Schuss zunächst ein Stativ ein. Dann nimmt er das Gewehr herunter und trifft freihändig den Sicherungsmechanismus. Der frühere Polizist, den der Film zuvor unter schwerem Alkoholentzug zeigt, braucht diese mechanische Stütze schließlich nicht. Seine wiedergewonnene Sicherheit wird in einer einzigen Handlung sichtbar.

**Fakten und Deutung:** Der einzelne Schuss auf die Sicherung ist im Filmartikel belegt. Criterion beschreibt Entzug und zurückzugewinnende Selbstachtung. Die szenenweise Analyse von The Unstitute beschreibt Aufbau des Stativs und freihändigen Schuss. Der letzte Satz des Vorschlags ist eine Deutung. Die Zusatzszene wurde in dieser Runde nicht am Film selbst gesichtet.

[Handlung und Schuss auf die Sicherung](https://en.wikipedia.org/wiki/Le_Cercle_Rouge) · [Criterion zu Alkoholentzug und Selbstachtung](https://www.criterion.com/current/posts/303-le-cercle-rouge-great-blasphemies) · [Szenenweise Analyse zum Stativ und freihändigen Schuss](https://theunstitute.org/Le.Cercle.Rouge.html)

## Was die Stichprobe über die Erzählmuster zeigt

Der gemeinsame Schwachpunkt ist häufig die Bewegung von einer konkreten Lösung zu einer abstrakten Aussage über ihre Bedeutung. Besonders deutlich bei Solaris, Nobody, Velvet Goldmine und Vier im roten Kreis: Der Text sagt, etwas sei rätselhaft, eine Schwachstelle, eine zerstörte Starrolle oder eine persönliche Prüfung, aber liefert den entscheidenden Anschauungsstoff nicht. Unterschiedlicher Satzbau allein behebt das nicht.

Die vorgeschlagenen Richtungen sind deshalb verschieden: eine verstorbene Frau als materialisierte Erinnerung; ein komischer Schlussauftritt; ein unverändert brauchbarer Täuschungsablauf; eine Aussage der Regisseurin zum Casting; eine bereits gute Verbindung von Kulisse und Bildgestaltung; ein sichtbares Ausrüstungsdetail im Finale; eine Doppelrolle mit politischem Konflikt; ein Rückblick über journalistische Recherche; die gleichzeitigen Ebenen eines Flirts; eine kleine körperliche Handlung mit dem Gewehr. Das ist ein Repertoire für diese konkreten Fragen, keine künftig abzuarbeitende Liste.

Eine Produktionsanekdote ist nicht in jedem Fall besser als Handlung. Bei Caligari erklärt die bestehende Szenenfolge bereits den interessanten Sachverhalt. Bei Playtime würde ich keine zusätzliche Spezialinformation erzwingen. Bei Annie Hall reicht eine Verdichtung. Die Vertiefungen dürfen unterschiedlich lang sein und ohne abschließende Lebensweisheit enden.

Bei neun Inhaltsfragen bleiben jeweils Zusatztexte zu den drei falschen Antworten sichtbar, die überwiegend verneinen oder zur richtigen Lösung zurückführen. Ein mechanischer Filter erkennt nicht jede Form solcher Leersätze. Die Redaktion sollte sie inhaltlich beurteilen; die präzisere Abgrenzung des Kagemusha-Ersatzmanns kann in die Vertiefung wandern. Die Regiefrage Playtime enthält bereits keine sichtbaren leeren Texte zu den falschen Optionen.

## Mögliche Änderungen am Skill nach Deiner Durchsicht

Diese Punkte sind Vorschläge und noch keine Änderung am Redaktionsvertrag oder Skill:

- **Gedankliche Wiederholung prüfen:** Benennt jeder weitere Satz etwas Neues, oder erklärt er denselben Gegensatz nochmals? Annie Hall zeigt den Unterschied zwischen sinnvoller Erläuterung und Auswalzen.
- **Abstrakte Aussagen am Film erden:** Wenn der Text von Prüfung, Verwandlung, Symbolik oder Bedeutung spricht, den konkreten Vorgang prüfen, der diese Aussage trägt. Kein pauschaler Zwang zu einer Szene, Anekdote oder Wortzahl.
- **Kurzantwort gegen die gestellte Frage lesen:** Sie muss genau die gesuchte Bedingung, Funktion oder Identität beantworten. Ein korrekter Name kann trotzdem die falsche Antwort auf die konkrete Frage sein, wie bei Orlando.
- **Ablenker gemeinsam auf Raterichtung prüfen:** Nicht nur formal vier verschiedene Antworten verlangen. Berufsarten, Wirkungsmechanismen, Längen und Zusatzbedingungen dürfen die Lösung nicht isolieren.
- **Gute Texte ausdrücklich erhalten:** Die Abnahme braucht auch begründete Nichtänderungen; sonst entsteht bei jeder Runde neue Formulierungsarbeit ohne Qualitätsgewinn.

Die bestehenden Regeln fordern Individualität und Abwechslung bereits. Diese Runde zeigt deshalb vor allem, wo deren konkrete Anwendung und Abnahme noch zu schwach sind. Deine Rückmeldung zu diesen zehn Fällen sollte die nächste Skilländerung bestimmen.

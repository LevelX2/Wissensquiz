# IT Fachreview der Anwendung Wissensquiz

Stand: 18.10.2026. Geprüfter Quellstand: `d85292043530be2f7d9599e99e8d5cea39e4c40e` auf `main`, einschließlich der lokalen Erfolgsembleme vom 17.10.2026. Die letzte dokumentierte Veröffentlichung ist Version 82. Auftrag: [unveränderter Nutzertext als JSON-Zeichenfolge](<../KI-Wissen-Wissensquiz/01 Rohquellen/2026-10-18 Nutzerauftrag IT-Fachreview.json>).

Die Anwendung besitzt eine tragfähige technische Grundlage und eine erkennbare Gestaltung. Der größte kurzfristige Nutzen liegt in verlässlicher Fokusführung, verständlichen Fehler- und Hilfetexten, kleineren Illustrationen und einem klaren Verhalten bei gestörten Bildfragen. Für mehr Nutzer sind vor allem das Wachstum technischer Belege und ein aktueller Lastnachweis wichtig. Ein grundlegender Architekturwechsel ist aus den Befunden nicht begründet.

## Simuliertes Fachteam und Prüfrahmen

Vier KI-Rollen haben die Anwendung betrachtet; drei Fachrollen arbeiteten unabhängig an ihren Schwerpunkten, eine Rolle führte Browserprüfung und Zusammenführung aus. Es handelt sich um eine simulierte Fachprüfung, nicht um ein Gutachten externer Personen.

| Rolle | Schwerpunkt |
| --- | --- |
| Softwarearchitekt und Wartbarkeitsspezialist | Programmdesign, Zuständigkeiten, Datenfluss, Fehlerbehandlung, Testbarkeit und Projektwissen |
| Performance- und Datenbankspezialist | Skalierbarkeit, Übertragungsgrößen, Arbeitsspeicher, Datenwachstum und Supabase |
| Game Designer und UX-Spezialist | Spielspaß, Lernschleifen, Motivation, Ergonomie, Darstellung sowie Ton und Haptik |
| Übergreifende Reviewleitung | Abgleich der Verträge, lokale Browserbeobachtungen, Gegenprüfung und Priorisierung |

Grundlage sind die aktuellen Fachverträge, Implementierungen, vorhandenen Tests und Betriebsnachweise. Ergänzend wurden Einstieg, Spielen, Themen sowie der Wechsel zwischen zwei Lernfragen lokal betrachtet. Der Browser verwendete eine eigene lokale Herkunft, ein synthetisches Konto und den vorhandenen SQL-Testserver in PGlite mit kontrollierter Kalenderzeit. Das ist ein Bediencheck, kein Nachweis für Produktionsgeschwindigkeit.

Produktcode, Inhalte und produktive Daten wurden durch dieses Review nicht verändert. Ein neuer vollständiger Testlauf oder Produktionsbuild war für die Analyse nicht erforderlich. Reale Screenreader, Fingerbedienung, Vibration, Lautstärke und langfristiger Spielspaß benötigen eigene Nutzer- beziehungsweise Gerätetests.

## Einschätzung der acht gewünschten Aspekte

| Aspekt | Was bereits trägt | Wichtigster nächster Schritt |
| --- | --- | --- |
| Programmdesign | Fachlogik, Speicherung und Server-Sitzungen sind getrennt; Lern- und Zeitspiel teilen die Fragenansicht. | Fehlergrenzen und Laufzeitverträge vereinheitlichen; gemeinsame Abläufe gezielt extrahieren. |
| Skalierbarkeit | Kein Vollkatalog beim Kontostart; einzelne Serverfragen, Seiten, kleine Anfragen und inkrementelle Erfolgsberechnung. | Aktuellen Auswahlpfad mit langen Historien und konkurrierenden Konten vermessen. |
| Speichereffizienz | Unveränderliche Inhalte werden geteilt; Ansichten werden kontogetrennt im RAM begrenzt zwischengespeichert. | Große PNGs verkleinern und Aufbewahrung technischer Zeitspielbelege festlegen. |
| Ergonomie | Große Antwortflächen, feste mobile Weiter-Leiste, klare Hauptaktion und Text zusätzlich zu Ergebnisfarben. | Fokusverlust beim Fragewechsel beheben und kleine Fortschrittstexte lesbarer machen. |
| Wartbarkeit | Strenge TypeScript-Typen, Zod bei Kernprotokollen und gezielte Fehler-/Wiederholungstests. | Übersichtsdaten ebenfalls validieren, Ablaufduplikate reduzieren und Hilfe aktuell halten. |
| Spielspaß | Kurze Runden, mehrere Spielarten, Wiederholungen, Freischaltungen und gemeinsame Erfolgsfeier. | Verständlichkeit und Tempo mit Filmneulingen und Filmkennern prüfen. |
| Darstellung | Zusammenhängende Kinogestaltung, Genreillustrationen und gemeinsame Medaillensprache. | Gestaltung erhalten, Bilddaten reduzieren und eine gut lesbare mobile Typografieskala verwenden. |
| Haptik | Neutrale Auswahlrückmeldung sowie optionale Ton-/Vibrationssignale und Einstellungsproben. | Fehlendes Weiter-Signal klären; tatsächliche Wirkung nach Appwechsel auf Geräten prüfen. |

## Prioritäten und Aufwand

**P1** sollte als nächster gezielter Arbeitsblock bearbeitet beziehungsweise untersucht werden. **P2** eignet sich für die anschließende Verbesserung oder Wachstumsvorbereitung. **P3** ist laufende Pflege. Keine dieser Einstufungen behauptet einen aktuellen Produktionsausfall. Aufwand: **S** bis etwa ein Entwicklungstag, **M** etwa zwei bis vier Tage, **L** größer oder vom Entwurf abhängig. Dies sind grobe Schätzungen einschließlich gezielter Prüfung; die Punkte sind nicht zu einem verbindlichen Terminplan addierbar.

| Nr. | Prio | Vorschlag | Aufwand | Beleglage |
| --- | --- | --- | --- | --- |
| 1 | P1 | Neue Fragen erhalten einen verlässlichen Tastaturfokus. | S | Im lokalen Browser reproduziert |
| 2 | P1 | Bildfragen bei verzögerten oder fehlenden Bildern absichern. | M–L | Fehlende Kopplung im Code; reale Häufigkeit offen |
| 3 | P1 | Kleine Illustrationen in passenden Dateigrößen ausliefern. | S–M | Dateigrößen und Einbindung belegt |
| 4 | P2 | Fehleransicht und äußere Fehlergrenze verbessern. | S | Vertragswiderspruch und Schutzumfang belegt |
| 5 | P2 | Serverantworten der Übersichten zur Laufzeit prüfen. | M | Ungeprüfte Übernahme im Code belegt |
| 6 | P2 | Technische Zeitspielbelege kontrolliert begrenzen. | M | Unbegrenztes Wachstum im lokalen SQL-Pfad belegt |
| 7 | P2 | Startcode und Betreiber-Metadaten weiter trennen. | M | Statische Abhängigkeiten belegt; Bundlewirkung zu messen |
| 8 | P2 | Gemeinsame Fehler- und Abschlussabläufe zusammenführen. | M | Strukturduplikate belegt |
| 9 | P2 | Konkurrierende Seitenwechsel gezielt untersuchen. | S–M | Hypothese aus asynchronem Ablauf |
| 10 | P2 | Spielerhilfe und Projekteinstieg aktualisieren. | S | Konkrete veraltete Aussagen belegt |
| 11 | P2 | Signal für erfolgreichen Fragewechsel anbinden. | S | Widerspruch zwischen Vertrag und Aufrufpfad |
| 12 | P2 | Bedeutungstragende Mobiltexte lesbarer gestalten. | M | 8–9 px im Code und Browser bestätigt |
| 13 | P2 | Lernfortschritt und Spieltempo mit Spielern bewerten. | M | Untersuchung, kein belegter Motivationsmangel |
| 14 | P2 | Ton und Haptik auf realen Geräten abnehmen. | S plus Gerätezugang | Offener physischer Nachweis |
| 15 | P2 | Aktuellen Lastnachweis und Wachstumsmessung ergänzen. | M | Aktuelle Kapazität nicht zugesichert |
| 16 | P3 | Ungenutzten Steuerungscode mit kleinem Check erkennen. | S | Einzelne Reste im Code belegt |

## Konkrete Verbesserungsvorschläge

### 1 Fokus bei neuen Fragen

**Befund:** Lern- und Zeitspiele ersetzen `QuestionScreen` je internem Fragenindex ([LearningGame](../src/LearningGame.tsx), Zeilen 92–95; [RankedGame](../src/RankedGame.tsx), Zeilen 149–155). Der Fokuseffekt in [App](../src/App.tsx), Zeilen 207–214, hängt an einem anderen Index. [QuestionScreen](../src/QuestionScreen.tsx), Zeilen 218–225, fokussiert die Antwortauflösung, aber nicht die nächste Frage.

Lokal reproduziert: Filmreise bei 390 × 844 CSS-Pixeln starten, eine Antwort per Enter bestätigen, danach „Nächste Frage“ per Enter. Die zweite Frage erscheint, `document.activeElement` ist anschließend `BODY`. Nach der Antwort war zuvor korrekt der Erklärungsbereich fokussiert. Die tatsächliche Screenreaderansage wurde nicht geprüft.

**Vorschlag und Nutzen:** Fokus und Scrollposition zentral an die neu eingeblendete Frage koppeln. Die kurze Ergebnisansage vom umfangreichen Erklärungsbereich trennen; aktuell umfasst `role="status"` ab Zeile 544 viel Lesetext. Das erleichtert Orientierung und fortlaufendes Tastaturspiel.

**Abnahme:** Zehn Lern- und Zeitfragen sind per Tastatur ohne Rücksprung durch die Navigation spielbar. Jede neue Frage erhält genau eine sinnvolle Fokusposition; eine Screenreaderprobe bestätigt kurze Ansagen ohne doppelte Erklärung.

### 2 Ladebereitschaft bei Bildfragen

**Befund:** Das für die Namensfrage notwendige Foto wird in [ActorPortrait](../src/ActorPortrait.tsx), Zeilen 48–71, ohne Lade-/Fehlerzustand dargestellt. Die Antwortfreigabe in [QuestionScreen](../src/QuestionScreen.tsx), Zeilen 175–200, wartet zwei Frames, aber nicht auf das Foto. `RankedGame` übergibt lediglich `session.elapsed()`; [rankedRuns](../src/rankedRuns.ts), Zeilen 300–309, berechnet damit bereits verstrichene Zeit und bestätigt keinen neuen Serverstart. Eine Frage kann dadurch ohne nutzbares Foto beantwortbar geschaltet sein. Häufigkeit und realer Zeitnachteil sind noch ungemessen.

**Vorschlag und Nutzen:** Zunächst je einen verzögerten und fehlgeschlagenen Bildabruf in Lern- und Zeitmodus isoliert prüfen. Danach ein sichtbares Lade-/Fehlerverhalten und eine faire Freigaberegel entwerfen. Eine bloße Clientpause wäre ungeeignet: Ein vorab abrufbares Bild erlaubt schon Lösungsvorbereitung, und wiederholtes „bereit“ darf keine Zeit schenken. Der Entwurf muss diese Wettbewerbsfrage ausdrücklich lösen; bei Lernspielen kann das Laden bereits verständlich angezeigt werden.

**Abnahme:** Keine versehentliche Blindantwort bei fehlendem Pflichtbild. Verzögerung, 404, Wiederholung und Neuladen haben ein festgelegtes Verhalten. Der Server bleibt für die Wettbewerbszeit maßgeblich; wiederholte Freigabeversuche erzeugen weder Neustart noch zusätzliche Zeit. Bezug: [Lernregeln](Lernregeln.md) und [Bildfragen](Schauspieler-Bilderkennung-2026-10-07/Bildvarianten.md).

### 3 Bilddaten passend zur Darstellung

**Befund:** [GenreArtwork](../src/Icons.tsx), Zeilen 28–36, verwendet dieselbe Bilddatei für 40 und 160 Pixel große Darstellungen. `actors.png` hat 1.254 × 1.254 Pixel und 2.193.468 Bytes. [ModeArtwork](../src/ModePicker.tsx), Zeilen 29–35, verwendet ebenfalls große PNGs; `entdecken.png` hat 1.065.110 Bytes und `rekord.png` 1.419.558 Bytes. Lazy Loading und asynchrone Dekodierung der Genreillustrationen sind bereits vorhanden.

**Vorschlag und Nutzen:** Passende kleine Varianten erzeugen, beispielsweise als WebP/AVIF, und je Einsatz feste Größen oder `srcset`/`sizes` nutzen. Originale erhalten. Das reduziert Übertragung und unnötige Dekodierung bei gleicher Bildsprache. Die Anpassung folgt dem Prinzip [responsiver Bilder](https://web.dev/learn/design/responsive-images).

**Abnahme:** Bei 320/390 Pixeln und hoher Pixeldichte bleibt das Motiv erkennbar und ohne Layoutsprünge. Als vorgeschlagenes Ziel mindestens 70 Prozent weniger übertragene Bytes für die betrachteten Illustrationen. Das ist ein Abnahmeziel, kein bereits gemessener Gewinn.

### 4 Verständliche und umfassende Fehleransicht

**Befund:** [PageBoundary](../src/PageBoundary.tsx), Zeilen 17–18, verspricht lokal gespeicherten Fortschritt. Das widerspricht dem [Onlinevertrag](Anmeldung-und-Online-Spielstand.md): Kontostände liegen online; unbestätigte Absichten können nur im geöffneten Tab vorhanden sein. Außerdem schützt die Grenze Seiten innerhalb der App, aber nicht `AccountApp` und den äußeren Apprahmen ([main](../src/main.tsx), Zeilen 5–8). Eine äußere Fehlergrenze kann Renderfehler dieser Komponenten auffangen; ihre Grenzen beschreibt die [React-Dokumentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).

**Vorschlag und Abnahme:** Speicherhinweis korrigieren und den äußeren Rahmen absichern. Kontrollierte Renderfehler in Einstieg, Apprahmen und Nebenansicht zeigen eine passende Wiederherstellung. Kein Text behauptet lokale Kontosicherung oder die Rettung unbestätigter Eingaben.

### 5 Laufzeitverträge für Übersichten

**Befund:** [serverViews](../src/serverViews.tsx), Zeilen 44–60 und 83–85, übernimmt `api.call<T>` ohne Laufzeitprüfung. TypeScript allein prüft die tatsächlich empfangenen Daten nicht. Spiel- und Speicherantworten werden dagegen in [learningRuns](../src/learningRuns.ts) und [entryRemote](../src/entryRemote.ts) bereits mit Zod validiert.

**Vorschlag und Abnahme:** Kleine Zod-Schemas für Themen, Auswahl und Lernübersichten nach dem bestehenden Muster ergänzen. Fehlende Felder, falsche Typen und ungültige Werte führen verständlich in den vorhandenen Wiederholen-Zustand. Gültige Antworten bleiben unverändert; keine Altformat-Adapter erforderlich.

### 6 Aufbewahrung technischer Zeitspielbelege

**Befund:** [Zeitspiel-SQL](../supabase/migrations/20261010102411_authoritative_ranked_runs.sql), Zeilen 43–46 und 291, legt für jede verändernde Anfrage einen Wiederholungsbeleg ab. Im lokalen Supabase-Code ist dafür kein Begrenzungs- oder Löschpfad vorhanden. [Lernspielbelege](../supabase/migrations/20261011071000_server_learning_runs.sql), Zeile 268, sind hingegen auf 1.000 je Konto begrenzt. Das ist ein strukturelles Wachstumsrisiko, keine nachgewiesene Speicherknappheit.

**Vorschlag und Abnahme:** Eine Wiederholungsfrist für abgeschlossene Zeitläufe definieren und die technischen Belege danach gezielt begrenzen. Spielerhistorie und aktive Läufe erhalten. Ein synthetischer Langzeitlauf erreicht einen begrenzten Belegbestand; verlorene Bestätigungen und parallele Wiederholungen innerhalb der vereinbarten Frist bleiben ohne Doppelwertung. Datenbankumsetzung und spätere Aktivierung benötigen einen eigenen konkreten Auftrag.

### 7 Kleinere Startabhängigkeiten

**Befund:** [AccountApp](../src/AccountApp.tsx), Zeilen 4 und 16, bindet Spiel- und Probeoberflächen statisch ein. [familiarity](../src/familiarity.ts), Zeilen 1–2, importiert vollständige Film-/Personenzuordnungen, benötigt daraus aber vor allem Kennung und Bekanntheitsstufe. Die zwei JSON-Quellen umfassen zusammen 237.747 Bytes; als zwei getrennte Arrays von Schlüssel-/Stufenpaaren ergeben die benötigten Werte 47.956 Bytes JSON. Zusätzlich importiert [categories](../src/categories.ts) umfangreiche Rohzuordnungen. Diese Größen sind Quellgrößen und keine gemessene gzip-Einsparung des Builds.

**Vorschlag und Abnahme:** Kleine Laufzeitdefinitionen von Betreiber-/Importdaten trennen und größere Spieloberflächen bei Eintritt laden. Vorher/nachher am Produktionsbundle messen. Der frische Einstieg lädt keine unbenötigten Betreiberzuordnungen; alle Film-, Personen- und Kategoriezuteilungen bleiben identisch.

### 8 Gemeinsame Ablaufsteuerung

**Befund:** [LearningGame](../src/LearningGame.tsx), ab Zeile 31, und [RankedGame](../src/RankedGame.tsx), ab Zeile 37, wiederholen den Rahmen für beschäftigt, Fehler und Wiederholung. Ergebnisübergänge einschließlich Erfolgen sind in [App](../src/App.tsx), ab Zeilen 729 und 779, ähnlich aufgebaut. Die App umfasst inzwischen 920 Zeilen.

**Vorschlag und Abnahme:** Den gemeinsamen Fehler-/Wiederholungsrahmen und Ergebnisübergang extrahieren. Unterschiedliche Server-Sitzungen und Spielregeln bleiben fachlich getrennt. Bestehende Fälle für verlorene Bestätigungen, Abschlussfehler und einmalige Erfolgsfeier bestehen. Die Zeilenzahl allein begründet keinen Umbau; entscheidend ist die mehrfach gepflegte Logik.

### 9 Konkurrenz bei Seitenwechseln

**Hypothese:** [App](../src/App.tsx), ab Zeile 247, prüft Sperrzustände vor `store.refresh()`, setzt für die Wartephase aber keine eigene Übergangssperre. Auch [OnlineGameStore](../src/onlineGameStore.ts), ab Zeile 199, führt solche Abrufe nicht zusammen. Überlappende Navigation ist damit möglich; eine sichtbare Fehlreihenfolge wurde nicht reproduziert.

**Vorschlag und Abnahme:** Zuerst mit angehaltenem Abruf zwei schnelle Navigationsaktionen und einen gleichzeitigen Antwortversuch prüfen. Nur bei bestätigtem Problem eine gemeinsame Übergangssteuerung ergänzen. Das zuletzt beabsichtigte Ziel bleibt nachvollziehbar und ausstehende Bestätigungen bleiben erreichbar.

### 10 Aktuelle Hilfe und Projekteinstieg

**Befund:** [Help](../src/Help.tsx), Zeile 211, beschreibt zunächst fünf und später zehn Lernfragen. Der aktuelle [Lernvertrag](Lernregeln.md) legt seit 11.10. ab der ersten Runde bis zehn Fragen fest. [README](../README.md), Zeile 5, hebt weiterhin Version 66 mit 12.787 Fragen hervor; der Projektstart führt bereits Version 82 mit 15.295 Fragen.

**Vorschlag und Abnahme:** Den falschen Hilfesatz korrigieren und den zusammenhängenden Modusabschnitt mit den aktuellen Verträgen abgleichen. Für den Projekteinstieg eine aktuelle Bestandsübersicht verlinken und lokale gegenüber veröffentlichten Änderungen klar unterscheiden. Nutzerhilfe, Rundenvorschau und Einstieg widersprechen sich danach nicht; historische Nachweise bleiben datiert erhalten.

### 11 Feedback für den Fragewechsel

**Befund:** [feedback](../src/feedback.ts), Zeilen 17 und 28, definiert das Signal `next`. Im aktuellen Produktcode wird es nur von der Einstellungsprobe aufgerufen ([Settings](../src/Settings.tsx), Zeile 243). Der Weiter-Button unterdrückt den allgemeinen Klick ([QuestionScreen](../src/QuestionScreen.tsx), Zeile 642); die Wechsel in Lern- und Zeitspiel rufen das eigene Signal nicht auf. Der [Tonvertrag](Lernregeln.md) verspricht es.

**Vorschlag und Abnahme:** Erfolgreichen Fragewechsel genau einmal mit der vorhandenen Ton-/Vibrationsoption verbinden. Kein Signal bei Ladefehler, erneutem Rendern oder deaktivierter Option; kein doppelter Klickton. Die bestehende Audioprüfung um genau diesen Übergang ergänzen.

### 12 Mobile Typografie

**Befund:** [responsive-details.css](../src/styles/responsive-details.css), Zeilen 395–402, verwendet 8–9 Pixel für Informationen auf Themenkarten. Der lokale Browser bestätigt bei 320 und 390 Pixeln 8 Pixel für die Filmfaktenzahl und 9 Pixel für Stufen-/Fortschrittstexte. Die Antworten sind deutlich größer. Auf der Startseite bei 390 Pixeln und der Themenübersicht bei 320/390 Pixeln trat kein horizontaler Überlauf auf.

**Vorschlag und Abnahme:** Bedeutungstragende Zusatztexte mit einer kleinen gemeinsamen Typografieskala lesbarer machen. Platz durch weniger gleichzeitige Information und angepasste Anordnung gewinnen; die bewusst kompakte Startseite erhalten. Themen, Moduswahl und Optionen bei 320/390 Pixeln und 200 Prozent Textvergrößerung ohne Inhalts- oder Funktionsverlust prüfen. Die [W3C-Anforderung zur Textvergrößerung](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) definiert diesen Funktionserhalt; 8 Pixel allein beweisen keinen Normverstoß. Für Touchziele Größe und Abstand zusammen prüfen, entsprechend [W3C Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

### 13 Spielspaß und Fortschrittsverständnis

**Ausgangslage:** Entdeckungsanteil, Medaillen, Lernstufen, fällige Wiederholungen, Freischaltungen und XP erfüllen unterschiedliche Zwecke ([LearningPathPanel](../src/LearningPathPanel.tsx), [RoundResult](../src/RoundResult.tsx), [Erfolgsvertrag](Erfolge.md)). Daraus kann Verständnishürde entstehen; ein tatsächlicher Motivationsmangel ist nicht belegt.

**Vorschlag:** Eine kleine moderierte Runde mit beispielsweise sechs Personen, zur Hälfte Filmneulinge und Filmkenner, über mehrere Sitzungen einschließlich fälliger Wiederholungen. Fragen: Was wurde besser? Was öffnet als Nächstes? Wann lohnt Wiederholen? Zusätzlich beobachten, ob die Person freiwillig eine weitere Runde beginnen möchte und ob Erklärung oder Feier das Tempo unangenehm unterbrechen. Die vorhandene einstellbare Antwortdauer und die aktuelle gemeinsame Erfolgsfeier bleiben Ausgangspunkt.

**Abnahme:** Wiederkehrende Missverständnisse und Tempo-Probleme dokumentieren und erst danach gezielt ändern. Als Untersuchungsziel können mindestens fünf von sechs Personen den nächsten Lernschritt ohne Erklärung benennen. Das ist ein vorgeschlagener Maßstab, kein statistischer Wirksamkeitsnachweis. Keine zusätzliche Belohnungsmechanik oder verpflichtendes Verhaltenstracking aus Vermutung einbauen.

### 14 Ton und Haptik auf realen Geräten

**Ausgangslage:** Sitzungserneuerung nach Tab-/Appwechsel, Soundfreigabe und optionale Vibration existieren ([feedback](../src/feedback.ts), [Lernregeln](Lernregeln.md)). Der dokumentierte Nachweis lässt die physische Hörabnahme ausdrücklich offen. Eine erfolgreiche Browser-API bestätigt weder hörbaren Ton noch spürbare Vibration.

**Vorschlag und Abnahme:** Auf dem betroffenen iPhone, in Firefox und auf einem Androidgerät dieselbe kurze Folge prüfen: Start, richtig/falsch, Weiter, Quellenlink und Rückkehr, Appwechsel, Ton aus/an, Vibration und Erfolgsfeier. Geräte-/Browserstand, Erkennbarkeit, Lautstärke und Ermüdung festhalten. Keine alten Signale nachspielen. Die ausdrückliche Entscheidung zum iPhone-Stummmodus erhalten; Haptik bleibt Zusatzinformation.

### 15 Skalierung und Wachstum messen

**Befund:** Der neueste [Auswahlpfad](../supabase/migrations/20261016184815_journey_area_balanced_selection.sql), Zeilen 17, 48 und 69, materialisiert Kandidaten und gruppierte Mengen. Das ist katalogabhängige Arbeit, aber noch kein nachgewiesener Engpass. Frühere Lastnachweise betreffen ältere Bestände. Der tägliche [Betriebsjob](../supabase/migrations/20261009073417_daily_service_check.sql), ab Zeile 19, prüft Erreichbarkeit und Mailstatus, erfasst aber keine Tabellenwachstums- oder Latenzreihen. [Infrastruktur und Kapazität](Infrastruktur-und-Kapazitaet.md) enthält überwiegend historische Messungen und teilweise inzwischen abgelöste Speicherwege.

**Vorschlag:** Separat vom Produktivbetrieb einen aktuellen synthetischen Last-/Langzeitlauf mit kurzen und langen Historien planen, beispielsweise mit 10/25/50 gleichzeitigen Konten. Antwortzeiten als Median sowie 95. und 99. Perzentil, Fehler, Sperrwartezeit und Bytes je Start/Antwort/Abschluss erfassen. Aggregierte Datenbank-, Tabellen- und Indexgrößen samt Wachstum ergänzen. Eine gewünschte Nutzungszahl und maximale akzeptable Wartezeit vorab festlegen. [Supabase empfiehlt Abfrageanalyse anhand von Ausführungsplänen](https://supabase.com/docs/guides/database/query-optimization); [Datenbank- und Festplattengröße sind getrennte Größen](https://supabase.com/docs/guides/platform/database-size).

**Abnahme:** Ein aktueller Kapazitätsnachweis nennt Bestand, Historiengröße, gleichzeitige Aktivität, Umgebung und Grenzen. SQL/Indizes erst nach belegtem Engpass ändern. Betriebsdaten enthalten keine Antworten, E-Mail-Adressen oder anderen Spielerinhalte. Aus dem Review folgt weder eine garantierte Spielerzahl noch ein notwendiger Tarifwechsel.

### 16 Kleine statische Qualitätsprüfung

**Befund:** [App](../src/App.tsx) enthält einen ungenutzten `QuestionScreen`-Import, einen ungenutzten `setIndex` und einen überflüssigen Rücksprung. [tsconfig](../tsconfig.json) aktiviert `strict`, aber keine Prüfung ungenutzter Namen. Ein kurzer eigener Qualitätsbefehl fehlt in [package.json](../package.json).

**Vorschlag und Abnahme:** Ungenutzte Namen mit einem kurzen lokalen Check erkennen und vorhandene Reste bei passenden Änderungen entfernen. Neue ungenutzte Importe/Variablen werden gemeldet; keine breite Umformatierung oder Verhaltensänderung daraus ableiten.

## Größen und vorhandene Stärken

Statische Bestandsaufnahme von `public/`: 91.636.218 Bytes, davon 74.337.138 Bytes PNG/JPG und 16.697.248 Bytes CSV. **Das ist der vorhandene Dateibestand, nicht der Download beim Start.** Ungepackte Quelldateien, HTTP-Übertragung, RAM-Belegung und Datenbankgröße sind unterschiedliche Größen. Mehrere Nebenansichten und Genreillustrationen werden bereits bedarfsabhängig beziehungsweise verzögert geladen; eine aktuelle Produktionsmessung wurde hier nicht vorgenommen.

Bereits gelöste Probleme sollen nicht erneut als Verbesserung verkauft werden: kein Vollkatalog beim Kontostart, kleine servergeprüfte Antwortanfragen, gezieltes Nachladen, begrenzte kontogetrennte Ansichtscaches, inkrementelle XP/Erfolge, vorhandener Index für den 24-Stunden-Abstand und Sperren pro Duell. Private Online-Speicherung, Wiederholung identischer Anfrage-IDs und Schutz vor Doppelwertung sind ausdrücklich geprüft, etwa in [online-game-store.test](../tests/online-game-store.test.ts) und [ranked-runs.test](../tests/ranked-runs.test.ts). Ein neuer Berechtigungsfehler wurde im betrachteten Bereich nicht belegt; das Review ersetzt kein vollständiges Sicherheitsaudit.

## Empfohlene Reihenfolge

1. **Bedienung und Verlässlichkeit:** Fokusfehler, veraltete Hilfe, unzutreffender Speichertext und fehlendes Weiter-Signal korrigieren. Bildstörung mit einem gezielten isolierten Fall reproduzieren.
2. **Sichtbare Effizienz:** Kleine Bildvarianten und mobile Typografie umsetzen; Übertragung und Lesbarkeit vor/nachher vergleichen.
3. **Robuste Grenzen und Wartbarkeit:** Laufzeitverträge, äußere Fehlergrenze und gemeinsame Ablaufsteuerung. Navigation nur bei bestätigtem Konkurrenzproblem ändern.
4. **Wachstum vorbereiten:** Aufbewahrungsvertrag für technische Belege, aktueller Lastnachweis, aggregierte Wachstumsmessung und kleinere Startabhängigkeiten.
5. **Spielwirkung abnehmen:** Spielerbeobachtung sowie reale Ton-/Haptikprobe; Erkenntnisse anschließend in konkrete Änderungen übersetzen.

Die Vorschläge sind eine Entscheidungsgrundlage. Ihre Umsetzung, Datenbankaktivierung und Veröffentlichung sind nicht Bestandteil dieses Analyseauftrags. Die bestehenden Vorgaben zu ausschließlich privaten Online-Kontoständen, befristeter Proberunde und ausdrücklicher Freigabe jedes Veröffentlichungsstands gelten weiter.

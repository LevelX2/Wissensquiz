# Wissensquiz · Dein Filmkosmos

Spielbare deutsche React-/TypeScript-App für kurze Filmquizrunden mit dauerhaftem Lernfortschritt im Browser. Kein Konto, Backend oder KI-Dienst erforderlich.

## Starten

**Online testen:** [Wissensquiz – Dein Filmkosmos](https://wissensquiz-filmkosmos.levelx2.chatgpt.site). Öffentlich erreichbar, ohne ChatGPT-Anmeldung. Für Online-Fortschritt ein eigenes Quiz-Konto verwenden; Gastspiel bleibt möglich. Der lokale Rechner muss dafür nicht laufen.

Voraussetzung: Node.js 22.12+ (geprüft mit 24.19), npm. In PowerShell:

```powershell
Set-Location C:\Projekte\Wissensquiz
npm ci
npm run build
npm run preview
```

- Rechner: **http://localhost:4173**
- Smartphone im selben Heimnetz: **http://192.168.178.141:4173** (am 26.09.2026 ermittelte Rechneradresse; sie kann sich ändern).
- Rechner und Vorschauprozess müssen laufen. Die Windows-Firewall muss den Netzwerkzugriff erlauben; ihre Einstellungen wurden nicht verändert.
- Entwicklung mit Hot Reload: `npm run dev`, Port 5173. Offlinebetrieb ist für den Produktions-Build vorgesehen.
- **Immer dieselbe Adresse verwenden:** Browserdaten sind an Gerät, Browser, Protokoll, Host und Port gebunden. `localhost`, Heimnetz-IP und eine spätere HTTPS-Adresse haben getrennte Speicher. Zum Wechsel JSON exportieren und wieder importieren.

## Spielen

- **Filmgenres kombinieren:** Sci-Fi, Action, Horror, Fantasy, Komödie, Western, Drama, Abenteuer, Musik und Thriller können gemeinsam oder einzeln ausgewählt werden. „Alle Genres abwählen“ erleichtert die Einzelwahl. Vorhandene Genre-Bilder erscheinen auch in der Auswahl und den Filmkarten. Neue importierte Genres erscheinen automatisch. Einzelne Filme und Reihen sind eine optionale, aufklappbare Verfeinerung.
- **Schwierigkeitsstufen:** Im Lernpfad automatisch aus den freigeschalteten Stufen spielen. Unter „Schwierigkeit selbst wählen“ lassen sich nach Freigabe einzelne Stufen kombinieren, zum Beispiel Leicht + Mittel. Eine leere Genre- oder Stufenauswahl startet keine Runde. Die Auswahl bleibt im Rundensnapshot, in Sicherungen und in getrennten Rekordkategorien erhalten; alte Runden bleiben lesbar. Lernpfad als Standard: je Genre öffnen 20 sichere leichte Wissensziele Mittel, weitere 20 mittlere Schwer. Nur abgeschlossene Runden zählen, historische Fortschritte eingeschlossen; Wiederholungen und geratene Treffer zählen nicht zusätzlich. „Alle Schwierigkeitsstufen freigeben“ öffnet die freie Auswahl; Antworten zählen weiterhin für den Lernpfad.
- Jede Frage zeigt ihr Genre und ihre Schwierigkeit, auch nach der Antwort. Unter Einstellungen & Daten → Hinweise an der Frage sind beide Angaben unabhängig abschaltbar; die Auswahl bleibt gespeichert.
- **Ton & Vibration:** kurze Soundeffekte für Start, Antworten, nächste Frage, Zeitablauf und Abschluss. Ton, optionale Vibration und ein Probesignal gesammelt unter Profil → Optionen → Ton & Vibration. Kein Ton beim bloßen Seitenladen. Einstellungen bleiben im Spielstand erhalten, bei Konten auch online; Signale funktionieren auch offline. Vibration lässt sich unabhängig von der Geräteunterstützung speichern. Fehlende Schnittstellen und abgelehnte Ausgabe werden erklärt.
- Genre-Icons zeigen Rakete (Sci-Fi), Blitz (Action), Geist (Horror) und Zauberstab (Fantasy), lächelndes Gesicht (Komödie) Cowboyhut (Western) und Theatermaske (Drama). Das vorhandene Sci-Fi-Wissensabzeichen zeigt gesperrten und erworbenen Zustand; weitere Genre-Abzeichen sind noch nicht umgesetzt.

- Erste Runde standardmäßig fünf, weitere zehn unterschiedliche Wissensziele; kleinere Bestände verkürzen die Runde transparent.
- **Entdecken:** tatsächlich neue Wissensziele zuerst; Wiederholungen aus den letzten drei Runden möglichst vermeiden. Neu freigeschaltete Stufen erhalten einen gezielten Einstieg. Bei kleinen Beständen sind Wiederholungen weiterhin möglich.
- **Besser werden:** fällige Ziele stärker gewichtet, ohne Zeitdruck.
- **Rekordrunde:** 30 Sekunden pro Frage; 100 Punkte für richtig plus 2 je vollständig verbleibender Sekunde. 25 volle Sekunden = 150 Punkte. Lokale Rekorde getrennt nach Thema, Schwierigkeit, tatsächlicher Rundengröße und Regelversion.
- **Bestenliste:** bei Rekordrunde, im Ergebnis und in der Sammlung erreichbar. Alle abgeschlossenen Rekordspiele mit Platz, Punkten, Treffern, Antwortzeit, Datum und Rückblick. Filter für Genre-Kombination, Stufen und Rundengröße; eigene Ranglisten je vergleichbarer Kategorie. Eigener Hauptnavigationspunkt „Highscores“ mit gleichrangigen Ansichten für eigene Ergebnisse, alle Rekordspieler und Spielerleistungen. Bestätigte Konten nehmen automatisch teil, mit Hinweis bei Registrierung und im Profil. Kategorien bleiben getrennt. Browser-/Offline-Ergebnisse sind kein manipulationsgeschützter Wettbewerb.
- Nach jeder Antwort Erklärung, optional Vertiefung, spezifisches Fehlerfeedback, Merksatz und Quellen. „War geraten“ verändert nur das Lernen, keine Punkte. Bewusster Wechsel zur nächsten Frage.
- Alle 720 Vertiefungen auf fehlende Darstellernamen geprüft; bei 627 Fragen passende Ergänzungen mit Besetzungsquellen. Originalstimmen, Puppenspiel und Darstellerwechsel sind berücksichtigt. Rohdaten und Spielstände bleiben erhalten; [Umfang und Erklärungstiefe](docs/Erklaerungstiefe.md).
- Sammlung mit Filter „Alle“ / „Mit beantworteten Fragen“ (richtige und falsche Antworten zählen), exklusiven Statuszahlen, maximal drei Lieblingsthemen, begrenztem Fachabzeichen und Rundenrückblick. Erfahrung: 10 XP je abgeschlossener Runde, Level 1 + ganze 100 XP.
- Meldungen werden nur lokal gespeichert und können exportiert werden.

## Enthaltene Fragen

Die gelieferte **SciFi_Quiz_180_Fragen.csv** ist das Standardpaket: **180 Fragen, 150 Wissensziele, 30 Varianten, 39 Themen**. **180 akzeptiert, 0 ausgeschlossen, 0 doppelte IDs.** Alle Erklärungen und Quellenangaben stammen aus dieser CSV. Die Originaldatei liegt unverändert unter `KI-Wissen-Wissensquiz/01 Rohquellen/`; das ausgelieferte Paket unter `public/fragen.csv` ist bytegleich.

Zusätzlich enthalten: **Action_Quiz_180_Fragen.csv**, ebenfalls unverändert, mit **180 Fragen, 150 Wissenszielen, 30 Varianten und 17 Themen**. Keine Ausschlüsse oder ID-Konflikte. Zusammen **360 Fragen, 300 Wissensziele und 56 Themen**. Das Action-Paket wird bei vorhandenen Sci-Fi-Spielständen beim nächsten App-Start ergänzt; Runden und Lernstände bleiben erhalten. [Action-Importbericht](docs/importbericht-action.json).

Neu enthalten: **Horror_Quiz_180_Fragen.csv**, unverändert mit **180 Fragen, 150 Wissenszielen, 30 Varianten und 20 Themen**. Keine Ausschlüsse, Warnungen oder ID-Konflikte mit den bisherigen Paketen. Insgesamt **540 Fragen, 450 Wissensziele und 76 Themen**. Das Horror-Paket ergänzt bestehende Sci-Fi-/Action-Spielstände beim App-Start transaktional und gehört zum Offline-Paket. [Horror-Importbericht](docs/importbericht-horror.json). Seit 26.09.2026 als private Sites-Version 3 live. Für ein wartendes App-Update alle bisherigen Quiz-Fenster schließen und die Adresse neu öffnen.

Zusätzlich enthalten: **Fantasy_Quiz_180_Fragen.csv**, unverändert mit **180 Fragen, 150 Wissenszielen, 30 Varianten und 12 Themen**, darunter Der Herr der Ringe, Harry Potter und Die Chroniken von Narnia. Keine Ausschlüsse, Warnungen oder ID-Konflikte. Mit Fantasy umfasst der Bestand **720 Fragen, 600 Wissensziele und 88 Themen**. Fantasy ist als eigenes Genre mit anderen Genres kombinierbar und offline verfügbar. Bestehende Fragen, Runden, Lernstände und Einstellungen bleiben erhalten. [Fantasy-Importbericht](docs/importbericht-fantasy.json).

Neu hinzugekommen sind **Komoedie_Quiz_180_Fragen.csv** und **Western_Quiz_180_Fragen.csv**, jeweils mit 180 Fragen, 150 Wissenszielen, 30 Varianten und 25 Themen. Beide Quellen sind unverändert; alle Datensätze strukturell akzeptiert, ohne Warnungen oder ID-Konflikte. Gesamtbestand: **1.080 Fragen, 900 Wissensziele, 180 Varianten und 138 Themen**. Automatische Ergänzung bestehender Stände und Offline-Cache sind eingebunden. Die redaktionelle Darstellerprüfung der bisherigen 720 Fragen wird dadurch nicht auf die neuen 360 Fragen ausgeweitet. [Komödie-Bericht](docs/importbericht-komoedie.json), [Western-Bericht](docs/importbericht-western.json).

Neu enthalten: **Drama_Quiz_180_Fragen.csv** mit 180 Fragen, 150 Wissenszielen, 30 Varianten und 25 Themen. Vollständig ohne Warnungen oder ID-Konflikte importiert; Rohquelle unverändert. Aktueller Gesamtbestand: **1.260 Fragen, 1.050 Wissensziele, 210 Varianten und 163 Themen**. Drama erscheint in Genreauswahl, Lernpfad und Spielerlisten und ist offline verfügbar. Bestehende Spielstände werden automatisch um das Paket ergänzt. [Drama-Bericht](docs/importbericht-drama.json). Keine unabhängige fachliche Prüfung der neuen Inhalte.

`verification_status=redaktionell_geprueft` ist eine Angabe der gelieferten Datei. Eine unabhängige Prüfung aller Filmaussagen oder verlinkten Seiten wurde nicht durchgeführt. Darstellerergänzungen werden getrennt von den Rohfragen gepflegt; Fehlererklärungen bleiben unverändert.

Die separat herunterladbare `public/demo-fragen.csv` enthält zwölf selbst verfasste und gekennzeichnete Demo-Fragen als Formatbeispiel. **Diese sind im Standardbestand nicht aktiviert.** Bei manuellem Import bleibt ihre Demo-Kennzeichnung erhalten.

Details: [Importformat und Feldzuordnung](docs/Importformat.md), [maschineller Importbericht](docs/importbericht.json).

## Weitere CSV-Dateien

Unter **Einstellungen & Daten → Fragen hinzufügen** Datei auswählen, Vorschau prüfen und gültige Fragen übernehmen. UTF-8/BOM, Komma, Semikolon, Tabulator und Pipe werden erkannt; gequotete Trennzeichen, doppelte Anführungszeichen und mehrzeilige Felder unterstützt.

Pflichtspalten: `question_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation_short`. `correct_answer` akzeptiert A–D, `answer_a`–`answer_d` oder den exakten eindeutigen Antworttext. `knowledge_id` und `variant_of` werden ausgewertet; ohne belastbare Zuordnung entstehen stabile Ziele `question:<question_id>`.

Vorhandene Fragen-IDs werden mit Bericht übersprungen, niemals automatisch überschrieben. Eine Inhaltserneuerung mit derselben ID ist in Version 1 bewusst kein Importmodus. Sicherheitskopie und gezielte Migration sind dafür erforderlich.

## Lernen, Speicherung und Offline

Sichere fällige Antworten erhöhen die Lernstufe höchstens einmal pro lokalem Kalendertag. Abstände: **1, 3, 7, 21 Tage**. „Gefestigt“ erfordert mindestens vier sichere Lerntage und eine sichere Wiederholung nach mindestens sieben Tagen seit der letzten Antwort auf dieses Wissensziel, einschließlich früher Zwischenantworten. Falsch: Wiederholung nach zehn Minuten. Geraten: sechs Stunden. Beides setzt die aktuelle Stufe auf „entdeckt“ zurück; erworbene Abzeichen bleiben erhalten. Details: [Lern- und Speichervertrag](docs/Lernregeln.md).

IndexedDB speichert Fragen, Inhaltsversionen, Rundensnapshots, eindeutige Antwort-/Lernereignisse, Fortschritt, Termine, XP, Rekorde, Abzeichen, Favoriten, Einstellungen und Meldungen atomar. Schreibfehler werden angezeigt. **Regelmäßig JSON exportieren**, besonders vor Browserbereinigung oder einem Adresswechsel. Der validierte Wiederimport ersetzt erst nach ausdrücklicher Bestätigung den Stand; Zurücksetzen erfordert `LÖSCHEN`.

Der Produktions-Build enthält Manifest, eigene Icons und Service Worker. Nach bestätigtem Paketdownload sind Oberfläche, Fragen und Erklärungen offline verfügbar. Updates warten auf das Schließen aller alten App-Fenster. Aktive Rekordrunden werden nach Neuladen/Browserneustart als abgebrochen behandelt; unbeantwortete Fragen erhalten keine neue Zeit. Entspannte Runden sind fortsetzbar.

**PWA/Offline auf Smartphones benötigt HTTPS.** Die Sites-Adresse bietet HTTPS. Die HTTP-Heimnetzvorschau unterstützt Spielen und Fortschritt, aber keine Service-Worker-Installation. Auf `localhost` ist Offlinebetrieb getestet; die Installation auf einem physischen Smartphone und unter der Sites-Adresse ist noch zu prüfen. Externe Quellenlinks benötigen weiterhin Netz.

**Sites:** Die App ist über `.openai/hosting.json` mit der öffentlich erreichbaren Site „Wissensquiz – Dein Filmkosmos“ verknüpft. Die erste Veröffentlichung wurde am 26.09.2026 von Sites als erfolgreich bestätigt. Veröffentlicht wird der statische Produktions-Build aus `dist/`; keine Nutzerspielstände werden übertragen. Die aktivierte Supabase-Anbindung sichert Kontostände automatisch; Gaststände werden beim Adresswechsel per JSON übertragen. [Veröffentlichungsablauf](docs/Sites-Betrieb.md).

## Projektaufbau

| Ort | Aufgabe |
| --- | --- |
| `src/model.ts` | Datenmodell und Fragenvalidierung |
| `src/importer.ts` | CSV, ID-/Variantenauflösung, Importbericht |
| `src/engine.ts` | Auswahl, Lernregeln, Punkte und idempotente Rundenaktionen |
| `src/storage.ts` | IndexedDB-Transaktionen, Sicherungsvalidierung, Export/Import |
| `src/App.tsx`, `src/style.css` | Oberfläche und responsive Gestaltung |
| `src/AccountApp.tsx`, `src/AccountGame.tsx`, `src/accountSync.ts`, `src/accounts.ts`, `supabase/` | Optionale Konten, getrennte Speicher, Datenbankregeln und Mailvorlagen |
| `src/offline.ts`, `scripts/build-sw.mjs` | Paketstatus und sicher wartende App-Updates |
| `public/fragen.csv`, `public/action-fragen.csv`, `src/packages.ts` | Gelieferte Standardpakete und transaktionale Ergänzung |
| `public/horror-fragen.csv` | Unverändertes Horror-Paket, ebenfalls automatisch ergänzt und offline verfügbar |
| `public/fantasy-fragen.csv` | Unverändertes Fantasy-Paket, automatisch ergänzt und offline verfügbar |
| `public/komoedie-fragen.csv`, `public/western-fragen.csv` | Unveränderte Zusatzpakete, automatisch ergänzt und offline verfügbar |
| `public/drama-fragen.csv` | Unverändertes Drama-Paket mit automatischer Ergänzung und Offline-Unterstützung |
| `tests/` | Logik-, Persistenz- und Browserprüfungen |

## Prüfen

```powershell
npm test
npm run build
npx playwright install chromium webkit
npm run test:browser
npm audit
```

Tests verwenden isolierte Browserprofile und kontrollierte Testzeiten. Produktive Nutzerstände werden nicht verwendet. Tatsächliche Ergebnisse und Grenzen: [Prüfbericht](docs/Pruefbericht.md).

Git: lokal ohne Remote, Integrationsbranch `main`, Umsetzung auf `codex/spielbare-testversion`. [Projektwissen](KI-Wissen-Wissensquiz/02%20Wissen/00%20Uebersichten/Index.md).

Die optionale [Kontenanbindung](docs/Konten-und-Spielstaende.md) bietet Spielername, E-Mail/Passwort, Bestätigung, Reset und automatisches Online-Sichern/Laden über Supabase. Supabase Free in Frankfurt, Brevo SMTP und deutsche Mailvorlagen sind eingerichtet. **Konten aktiviert.** Echte Bestätigungsmail und Kontoaktivierung erfolgreich geprüft; Passwort-Reset und Anmeldung am Handy vom Nutzer erfolgreich bestätigt; echte geräteübergreifende Spielstandsabnahme weiterhin offen. Alle Passwortfelder besitzen eine Anzeigeoption mit Auge. Angemeldete Spieler laden bei Anmeldung/Neuladen automatisch ihren Stand; lokale Änderungen werden automatisch gesichert. Vor Gerätewechsel auf die Speicherbestätigung warten. Konflikte zwischen Geräten werden ohne stilles Überschreiben angezeigt. Bisherige Gastspielstände bleiben lokal erhalten; keine automatische Übertragung. [Einrichtung mit SQL und Mailvorlagen](docs/Konten-Einrichtung.md). Das Profil zeigt Spiel- und Antwortstatistiken, Trefferquote, Level und XP. Zusätzliche Spielerranglisten vergleichen abgeschlossene Runden, richtige Antworten und Trefferquote (ab 50 Antworten), filterbar nach Genre und Schwierigkeit. Die gemeinsame Trainingsrangliste umfasst automatisch bestätigte Konten; ein serverseitig kontrollierter Wettbewerb bleibt offen.

Die Oberfläche verwendet helle Leseflächen mit dunkler Schrift. Während einer Runde sind Abstände und Antworten kompakter; Erklärungen, Vertiefungen, Merksätze und Quellen bleiben erhalten. Die mobile Navigation hat fünf Einträge in einer Zeile, darunter Highscores und Profil. „Profil → Optionen“ öffnet die zentrale Einstellungsseite; die dauernde Online-Anzeige entfällt. Offlinezustand und Kontosynchronisierung bleiben erkennbar, ausführlicher Paketstatus steht unter Einstellungen.

Filmtitel in Fragen werden mit dunkler Akzentfarbe auf hellem Gold hervorgehoben; die umschließenden Anführungszeichen entfallen nur in der Anzeige. Jahr und Frage bleiben im selben Textfluss. Sieben freigestellte [Genreillustrationen](docs/Genreillustrationen.md) verbessern die Erkennbarkeit der großen Themenkarten und sind im Offline-Paket enthalten. Kleine Auswahl-Icons bleiben SVG-Symbole.

Die offline verfügbare Hilfe „So funktioniert’s“ ist im Profil und im Seitenfuß erreichbar. Sie erklärt Lernstufen mit Zeitbeispiel, Wissensziele, Modi, Lernpfad, Punkte, Abzeichen, Highscores und Speicherung. [Navigation und Hilfekonzept](docs/Hilfe-und-Navigation.md).

Neue Lernpfad-Stufen werden beim Rundenabschluss mit einer kurzen Freischaltfeier ausgezeichnet: aufspringendes Schloss, Feuerwerk, große Stufenanzeige und Fanfare. Ton/Vibration bleiben einstellbar; reduzierte Bewegung wird respektiert. Alte Rundenergebnisse spielen die Feier nicht erneut ab.


Der kompakte Spieleinstieg bietet „Losspielen“ direkt unter der Moduswahl. Classics und Arthouse sind kuratierte Zusatzkategorien innerhalb der gewählten Genres; beide zusammen bilden eine Vereinigung ohne Fragekopien. Aktuell: elf Pakete, 1.980 Fragen und 1.650 Wissensziele. Die neuen Genres heißen Martial Arts & Asia-Film und Rom-Com. Alle gelieferten Bestandszuordnungen sind aufgelöst. Details unter [Importformat](docs/Importformat.md).


In Entdecken und Besser werden zeigt jede Frage ihre persönliche Antwortbilanz (beantwortet, richtig, falsch). Aufklappbar: Zeitabläufe, geratene Treffer und gemeinsame Statistik mit Wiederholungsvarianten. Bestehende Antworten zählen automatisch mit.

Die Fragenstatistik erscheint standardmäßig erst nach der Antwort. Unter Profil → Optionen lässt sie sich auf „Immer anzeigen“ umstellen oder ausblenden. Die Auswahl wird mit dem Spielstand gesichert; ältere Spielstände verwenden „Nach der Antwort“.

Spielmodi mit eigenen transparenten Illustrationen: Entdecken (Lupe mit Stern), Besser werden (Stufen mit Stern), Rekordrunde (Pokal mit Stoppuhr). Die Startseite erhält eine helle Kino-Kulisse; Spielansicht und Daten bleiben unverändert. Losspielen bleibt direkt unter den Moduskarten. Alle neuen Bilder sind im Offline-Paket enthalten; die Auswahl ist weiterhin per Tastatur und mit sichtbarer Markierung bedienbar.

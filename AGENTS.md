# Projektanweisungen Wissensquiz

## Einstieg und Priorität

- Projektwissen liegt in `KI-Wissen-Wissensquiz/`.
- Bei unbekanntem Kontext: `KI-Wissen-Wissensquiz/00 Projektstart.md`.
- Projektfragen: zuerst `KI-Wissen-Wissensquiz/02 Wissen/00 Uebersichten/Index.md` oder die bekannte aktuelle Fachseite lesen (`wiki-first`).
- Neue oder überarbeitete Fragenpakete: persönlichen Skill `wissensquiz-fragen-redigieren` verwenden; führender Redaktionsvertrag ist `docs/Fragenredaktion.md`. Filmfragen benötigen mindestens zwei eigenständige Inhaltsziele je leicht/mittel/schwer plus Jahr und Regie; Personen-/Preisfragen haben zusätzlich Experte. Bekanntheit und Schwierigkeit getrennt behandeln.
- Bei jeder neu verwendeten Filmfassung einschließlich Personen-/Preisverweisen deutsche Alternativtitel und international gebräuchliche Titel mit Quellen prüfen, geprüfte Titel zentral in `src/filmAlternativeTitles.json` übergeben und Lösungsschutz gemeinsam mit Frage und Antworten abnehmen; Einzelheiten im Redaktionsvertrag.
- Im Fragetext den geläufigsten eindeutigen Titel verwenden. Bei zwei ähnlich geläufigen Titeln kann ein ausdrücklich ausgewählter Zweittitel als dezenter Hinweis unter der Frage stehen. Die weiteren Titel stehen in den Filmdaten.
- Codeänderungen: betroffene Verträge, Implementierung und vorhandene Checks unmittelbar sichten; Prüfungen nach der untenstehenden Testregel auswählen. Unveränderten Kontext wiederverwenden.
- Wissenspflege: Prozessseite `KI-Wissen-Wissensquiz/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md` und `KI-Wissen-Wissensquiz/00 Steuerung/Regeldatei KI-Wissenspflege.md` lesen.
- Für relevante lokale Pfadauflösung `AGENTS.local.md` ausdrücklich lesen, falls vorhanden; sie wird nicht automatisch geladen.
- Reihenfolge: projektspezifische Regeln im Repository, lokale Auflösung durch `AGENTS.local.md`, globale oder typspezifische Defaults aus `mein-wissen`. Die lokale Datei ersetzt keine Projektregeln. Aktuelle Nutzeranweisungen haben Vorrang.

## Arbeitsweise und Sprache

- Nutzer mit Du ansprechen; sichtbare UI-Texte und deutsche Wissensseiten mit echten Umlauten und ß verfassen. Technische Pfade, IDs, Symbole und Originalzitate unverändert lassen.
- Belastbare, dauerhaft nützliche Erkenntnisse auf passenden Wissensseiten pflegen. Klare Folgepflege direkt ausführen; bei ungeklärten fachlichen Widersprüchen oder Zuordnungen gezielt nachfragen.
- Neue generische Regeln nur mit ausdrücklicher Freigabe in das Haupt-Vault übernehmen.
- Fachliche Quellen vollständig auswerten und betroffene Wissensseiten, Index und bei Relevanz das Log nachziehen. Widersprüche sichtbar machen. Für Fragen gilt die untenstehende Direktive zum aktuellen Katalog; frühere Lieferungen und Redaktionsstände brauchen keine zusätzlichen Archive.
- Status als aktuellen Snapshot führen. Das Log bleibt chronologisch und append-only; nur wesentliche Entwicklungen, Entscheidungen, Risiken, Verifikationen und Abschlussstände dokumentieren, keine einzelnen Toolaufrufe.

## Git, Checks und Sicherheit

- Git-Modell: lokales Git mit GitHub-Remote `origin` (`https://github.com/LevelX2/Wissensquiz.git`); Sites-Quellveröffentlichung nach ausdrücklichem Hostingauftrag. Integrationsbranch: `main`.
- Standardmäßig direkt auf `main` im bestehenden Arbeitsordner arbeiten. Für normale, überschaubare Änderungen keinen neuen Arbeitsbranch oder Worktree anlegen.
- Sobald ein beauftragter Änderungsblock abgeschlossen und passend geprüft ist, ihn selbstständig mit einer kurzen, aussagekräftigen Commit-Nachricht lokal auf `main` committen. Nur zugehörige Änderungen aufnehmen; fremde oder unfertige Arbeitsstände erhalten.
- Einen neuen Worktree anlegen, wenn der Nutzer ihn ausdrücklich beauftragt. Bei größeren, umfassenden Änderungen einen Worktree vorschlagen und vor seiner Anlage nachfragen; Umfang allein ist keine automatische Freigabe.
- Das Projekt befindet sich in der Entwicklung. Beauftragte Korrekturen direkt und möglichst einfach umsetzen. Neue Kompatibilitätsmaßnahmen für Altstände, historische Daten oder frühere Versionen müssen vor ihrer Umsetzung ausdrücklich vom Nutzer genehmigt werden. Dazu zählen insbesondere Migrationen, Adapter, Fallbacks und zusätzliche Schutz- oder Sonderlogik zum Erhalt früheren Verhaltens; sie sind kein automatischer Teil einer Korrektur. Bestehende Kompatibilitätslogik ohne gesonderten Auftrag nicht erweitern.
- Remote, Push, PR und Veröffentlichung nur nach ausdrücklichem Auftrag.
- Jede Veröffentlichung benötigt Luis ausdrückliche Freigabe für den konkreten aktuellen Stand. Frühere Veröffentlichungsaufträge sind keine Dauerfreigabe für spätere Änderungen. Bis zur Freigabe Änderungen lokal umsetzen, prüfen und committen; weder Sites deployen noch produktive Serverinhalte oder Datenbankänderungen aktivieren. Automatische Veröffentlichungsdefaults aus Skills sind dieser Nutzeranweisung untergeordnet.
- Sites ist über `.openai/hosting.json` verknüpft; bestehende Projekt-ID erhalten. Der Nutzer hat inzwischen öffentlichen Besucherzugriff ohne vorgeschaltete ChatGPT-Anmeldung beauftragt; umgesetzt am 26.09.2026. Veröffentlichungen und spätere Site-Änderungen nach `sites-hosting` bzw. dokumentiertem Ersatzablauf in `docs/Sites-Betrieb.md` ausführen; bestehenden Zugriff erhalten. Ohne Konto ist genau eine Zehnerrunde zum Ausprobieren erlaubt; danach bestätigte Quiz-Anmeldung. Nur die Proberunde darf für ihre Kontoübernahme bis 24 Stunden nach Start im Browser vorgemerkt werden; keine Übernahme alter Gaststände. Kontospielstände ausschließlich privat online in Supabase, keine automatische lokale Kontoablage und kein Offline-Paket. Vertrag: `docs/Anmeldung-und-Online-Spielstand.md`. Keine Nutzerdaten in Veröffentlichungsartefakte aufnehmen.
- Keine Secrets, privaten Pfade, lokalen Nutzdaten oder reproduzierbaren Build-Artefakte versionieren.
- Stack: React/TypeScript, Vite, statische Webapp mit Supabase für Anmeldung und Spielstand. Kein Offline-Paket und keine automatische lokale Kontospielstandsablage; befristete Proberunde gemäß Fachvertrag.
- Fachverträge: `docs/Importformat.md` und `docs/Lernregeln.md`; Prüfnachweis: `docs/Pruefbericht.md`.
- Kleine Änderungen in einzelnen Chats fachlich prüfen und `git diff --check` ausführen. Nicht für jeden kleinen Änderungsblock die vollständige Testsuite, einen Produktionsbuild oder eine umfassende Browserprüfung starten. Der lokale Commit eines solchen Blocks benötigt keinen vollständigen Testlauf.
- Neue oder geänderte Tests direkt gezielt ausführen. Bei konkreten Fehlern oder begründetem Risiko zusätzlich die unmittelbar betroffenen vorhandenen Tests ausführen; daraus folgt kein vollständiger Prüflauf in jedem Chat.
- Vor jeder Veröffentlichung einmal gebündelt auf dem gemeinsamen, zur Veröffentlichung vorgesehenen Quellstand prüfen: vollständiges `npm test` und `npm run build`; bei Änderungen an Oberfläche/Persistenz/Offline zusätzlich `npm run test:browser`, außerdem `git diff --check` und bei Abhängigkeitsänderungen `npm audit`. Der veröffentlichende Chat übernimmt diesen zentralen Prüflauf für alle enthaltenen Änderungsblöcke. Keine parallelen vollständigen Prüfläufe in mehreren Chats für denselben gemeinsamen Arbeitsstand starten.
- Veröffentlichung erst, wenn alle erforderlichen Prüfungen erfolgreich sind. Fehler beheben und die betroffenen Prüfungen erneut erfolgreich ausführen; fehlgeschlagene oder wegen Zeitüberschreitung abgebrochene Prüfungen gelten nicht als bestanden. Erfolgreiche Prüfungen desselben unveränderten Standes wiederverwenden. Änderungen nach der Prüfung machen die betroffenen Nachweise ungültig; vor Veröffentlichung entsprechend nachprüfen.
- Tests nur mit isolierten Browserprofilen und kontrollierter Testzeit durchführen. Echte Nutzerdaten nicht für Testfortschritte verändern.
- Bestehende Frage-IDs nicht still überschreiben; Varianten teilen Wissensziel-IDs. Lernpunkte und Rekordzeit getrennt behandeln.

## Aktueller Fragenkatalog statt Pakethistorie

- Maßgeblich sind die aktuellen geprüften Fragen mit Quellen, fachlichen Attributen sowie stabilen Fragen- und Wissensziel-IDs.
- Frühere Lieferungen, Ergänzungswellen und Redaktionsstände nicht als zusätzliche Fragenarchive, Laufzeitpakete oder verpflichtende Prüfstufen weiterführen. Bei Bedarf stellt Git die Bearbeitungsgeschichte bereit.
- Fachliche Gruppen und gegebenenfalls technische Releasepakete aus den aktuellen Fragenattributen und Fragen-IDs deterministisch ableiten. Lieferdatum, frühere Dateinamen und frühere Paketgrenzen sind keine fachlichen Auswahlkriterien.
- Neue Fragen direkt in den aktuellen Bestand ihres Fragenbereichs aufnehmen. Preisfragen gehören zum Bereich Preisträger, auch wenn Personen, Rollen oder Filme den Zugang bilden.
- Katalogaufbau, Prüfungen und Veröffentlichung am aktuellen Bestand ausrichten. Keine Dateinamen-Sonderfälle, historischen Importreihenfolgen oder zusätzlichen Kompatibilitätswege zum Erhalt einer Pakethistorie schaffen.
- Fachliche Belegquellen und notwendige aktuelle Inhalte bleiben erhalten. Der Verzicht auf Lieferarchive erlaubt keine Änderung privater Nutzerdaten oder bestehender Lernidentitäten.

## Temporäre Dateien und Bereinigung

- Eigene temporäre Artefakte einem Auftrag eindeutig zuordnen und nach Abschluss des jeweiligen Arbeitsblocks selbstständig entfernen, sobald sie nicht mehr benötigt werden. Nicht erst auf `Finito` warten.
- Wiederholte Prüfungen desselben Auftrags verwenden denselben Ausgabebereich. Parallel laufende Arbeiten bleiben getrennt; aktive Browserprofile, Server und deren Builds erhalten.
- Serienläufe speichern wechselnde Laufparameter und Ergebnisse getrennt vom ausführbaren Code. Keine vollständige Bundleversion für jeden Redaktionsblock erzeugen; vorhandene Builds wiederverwenden, solange ihr Quellstand passt.
- Nach erfolgreicher Veröffentlichung und dokumentierter Abnahme eigene temporäre Quellkopien, entpackte Builds und Transportarchive entfernen. Erforderliche dauerhafte Veröffentlichungsnachweise erhalten; Ausnahmen brauchen einen konkreten Aufbewahrungsgrund und einen Löschzeitpunkt oder eine überprüfbare Löschbedingung.
- Nach beendeten Browserprüfungen entbehrliche eigene Builds und Ergebnisse entfernen. Benötigte Fehlernachweise bis zur Klärung behalten und dauerhafte Prüfergebnisse zusammengefasst dokumentieren.
- Originalquellen, private Sicherungen und notwendige Arbeitsdaten getrennt von reproduzierbaren Artefakten ablegen. `.gitignore` bedeutet weder „entbehrlich“ noch „dauerhaft aufbewahren“; generierte Ausgabebereiche nicht als Ablage für unersetzliche Daten verwenden.
- Nur nachweislich eigene, abgeschlossene Artefakte gezielt löschen. Vor rekursiver Löschung aufgelöste Zielpfade innerhalb des vorgesehenen Arbeitsbereichs prüfen und Verknüpfungsziele nicht verfolgen. Fremde oder unfertige Arbeitsstände sowie Schutzbestände erhalten; bei unklarer Zuordnung nachfragen. Alter oder Dateiname allein reichen als Löschgrund nicht.
- Unter Windows eigene entbehrliche Test-, Build- und Hilfsdateien standardmäßig mit PowerShell `Remove-Item -LiteralPath <geprüfter absoluter Pfad> -ErrorAction Stop` entfernen; für geprüfte Verzeichnisse zusätzlich `-Recurse`. Kein routinemäßiges `-Force`: Codex kann diese Löschbefehlsform auch bei Vollzugriff als gefährlich einstufen und bei `approval_policy=never` ohne Rückfrage ablehnen. Normale Bereinigung benötigt in der Regel keinen erzwungenen Zugriff. Auflistungen mit `Get-ChildItem -Force` getrennt vom Löschbefehl ausführen, damit die grobe Befehlserkennung den Zusatz nicht der Löschung zuordnet.
- Nach der Bereinigung mit `Test-Path -LiteralPath <Zielpfad>` prüfen, dass jedes Ziel entfernt wurde. Bei einer Ablehnung mit `blocked by policy` nicht pauschal eine automatische Freigabeprüfung als Ursache nennen. Eine materiell sicherere Variante, etwa normale Löschung ohne das zuvor unnötige `-Force`, nach erneuter Zielprüfung verwenden; Sperren nicht durch andere Shells oder Lösch-APIs umgehen. Bleibt die sichere Bereinigung blockiert, genaue Fehlermeldung und verbleibende Ziele dokumentieren.
- Beim Abschluss verbleibende größere eigene Artefakte mit Zweck und Löschzeitpunkt oder Löschbedingung nennen. Fehlgeschlagene oder blockierte Löschungen ausdrücklich als offen melden; vorbereitete Löschbefehle gelten nicht als ausgeführte Bereinigung.

## Abschlusskommandos

Für `Finito`, `Ende`, `Finale`, `Endfinale` und sinngleiche ausdrückliche Abschlusswünsche den persönlichen Skill `abschlusskommandos` verwenden.

- `Finito`/`Ende`: offene und ungetrackte Änderungen einordnen, Wissen und passende Checks prüfen, abgeschlossene zugehörige Teile in fachlichen Blöcken lokal committen. Kein automatischer Merge oder Push.
- `Finale`: zuerst lokaler Abschluss; bei erfüllten Gates lokal nach `main` integrieren und schnelle Checks erneut ausführen. Push nur nach ausdrücklichem Auftrag.
- `Endfinale`: zuvor erweiterten Verify-Lauf sowie Wissens-, Risiko- und Restpunkteprüfung ausführen.
- Fremde, unfertige, private oder unklare Änderungen erhalten und benennen; nicht blind committen oder verwerfen. Relevante Konflikte, fehlgeschlagene Pflichtchecks und ungeklärte Entscheidungen vor Integration lösen.

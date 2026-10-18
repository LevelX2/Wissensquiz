# Spieler- und Geräteabnahme des Fachreviews

Stand 18.10.2026: **vorbereitet, noch keine echte Spieler- oder Gerätebeobachtung**. Gehört zu den Reviewpunkten 13 und 14. Automatisierte Browserprüfungen bestätigen Abläufe und API-Aufrufe; sie bewerten keine Motivation, Lautstärke oder spürbare Vibration. Keine Änderung an Lernregeln, Belohnungen oder Spielbalance allein aufgrund einer unbestätigten Vermutung.

## Teststand und Durchführung

Den lokal geprüften Quellstand verwenden und Commit, Browser, Gerät, Bildbreite und Datum festhalten. Mit einem getrennten synthetischen Testkonto und kontrollierter Testzeit arbeiten. Für physische Mobilgeräte eine ausdrücklich freigegebene erreichbare HTTPS-Testumgebung verwenden. Dieser Plan erteilt keine Veröffentlichungs- oder Produktivdatenfreigabe.

Sechs kurze Sitzungen planen: drei Personen mit wenig Quiz-/Lernapp-Erfahrung und drei regelmäßige Spieler. Jede Person löst zunächst ohne Erklärung der Begriffe dieselben Aufgaben. Antworten wörtlich oder sinngemäß festhalten, Hilfestellungen markieren; Ergebnisse nach Erfahrung getrennt betrachten. Die sechs Sitzungen sind eine qualitative Untersuchung, keine repräsentative Befragung.

## Fortschritt und Spieltempo

1. Starte eine Filmreise und beantworte eine Zehnerrunde mit sicheren, falschen und als geraten markierten Antworten. Beobachte Lösung, Weiterwechsel und Ergebnis.
2. Erkläre in eigenen Worten: „Was hat sich durch diese Runde verbessert? Was sagt die Lernstufe aus? Was bedeuten Erfahrung und Entdecker-Medaille?“ Nicht die erwartete Antwort vorgeben.
3. Öffne Sammlung, Themen und Profil. Finde, was als Nächstes freigeschaltet werden kann, und erkläre den Unterschied zwischen Schwierigkeit und Bekanntheit.
4. Finde eine fällige Wiederholung und ihren Termin. Erkläre, ob eine zusätzliche richtige Antwort am selben Tag eine weitere Lernstufe bringt.
5. Spiele eine zweite Runde oder beende freiwillig. Beschreibe, ob Antwortanzeige und Erklärung zu schnell, passend oder zu langsam waren und an welcher konkreten Stelle Du warten oder suchen musstest.

| Sitzung | Erfahrung | Lernfortschritt selbst erklärt | Freischaltung gefunden | Wiederholung verstanden | Tempo / konkrete Stelle | Zweite Runde gewünscht |
| --- | --- | --- | --- | --- | --- | --- |
| N1 | wenig | offen | offen | offen | offen | offen |
| N2 | wenig | offen | offen | offen | offen | offen |
| N3 | wenig | offen | offen | offen | offen | offen |
| E1 | regelmäßig | offen | offen | offen | offen | offen |
| E2 | regelmäßig | offen | offen | offen | offen | offen |
| E3 | regelmäßig | offen | offen | offen | offen | offen |

Praktisches Abnahmeziel: mindestens fünf von sechs Personen unterscheiden Lernfortschritt und Erfahrung und finden die nächste Freischaltung sowie Wiederholungen ohne inhaltliche Hilfe. Wiederkehrende Missverständnisse bei mindestens zwei Personen oder wiederholtes stockendes Weiterkommen als konkrete Findings aufnehmen. „Zweite Runde gewünscht“ dient als Gesprächsanlass, nicht als alleiniger Erfolgswert. Bei Problemen zuerst Texte, Gruppierung oder Tempo an der beobachteten Stelle korrigieren, dann genau diese Aufgabe erneut prüfen.

## Ton und Haptik

Je verfügbarer Kombination einmal durchführen: Windows/Chromium, Windows/Firefox, iPhone/Safari und Android/Chrome. Tatsächliche Browser-/OS-Version notieren; eine Emulation ersetzt das Mobilgerät nicht. Geräte ohne Vibrationsunterstützung entsprechend kennzeichnen.

1. Optionen öffnen, Sound und Haptik gezielt an-/ausschalten und die vorhandene Signalprobe nutzen. Hörbarkeit, angenehme Lautstärke und gegebenenfalls spürbare Vibration beurteilen.
2. Rundenstart, sichere richtige Antwort, falsche Antwort, „Keine Ahnung“, erfolgreichen Weiterwechsel und Rundenabschluss prüfen. Ein fehlgeschlagener Weiterabruf darf kein erfolgreiches Weiter-Signal auslösen.
3. Film-/Personenlink öffnen und zurückkehren, Browser-Tab wechseln und zurückkehren, anschließend die App in den Hintergrund legen und wieder öffnen. Ersten Klick und die nächste Antwort prüfen. Keine nachträgliche Tonserie oder dauerhaft stumme Sitzung.
4. Eine Erfolgsfeier und deren Bestätigung prüfen; danach Sound ausschalten. Mit ausgeschaltetem Sound darf das Quiz keine eigenen Signale ausgeben. Gerätestummschaltung und Systemeinstellungen mitprotokollieren.
5. Haptik separat beurteilen: tatsächlich gefühlt, nicht unterstützt oder trotz unterstützter API nicht gefühlt. Ein erfolgreicher JavaScript-Aufruf zählt nur als technischer Nachweis.

| Gerät / OS / Browser | Signalprobe hörbar | Antwort / Weiter unterscheidbar | Nach Appwechsel hörbar | Haptik tatsächlich gefühlt | Sound aus wirksam | Ergebnis / konkrete Abweichung |
| --- | --- | --- | --- | --- | --- | --- |
| Windows / Chromium | offen | offen | offen | offen | offen | offen |
| Windows / Firefox | offen | offen | offen | offen | offen | offen |
| iPhone / Safari | offen | offen | offen | offen | offen | offen |
| Android / Chrome | offen | offen | offen | offen | offen | offen |

Abnahmeziel: verfügbare, eingeschaltete Signale sind unterscheidbar und nach Rückkehr nutzbar; Sound aus bleibt wirksam. Fehlende Geräteunterstützung klar von einem reproduzierten Appfehler unterscheiden. Beobachtung mit Stand und Reproduktionsschritten in diesem Bogen ergänzen; technische Korrekturen gezielt prüfen. Bis dahin bleiben die beiden realen Abnahmen offen.

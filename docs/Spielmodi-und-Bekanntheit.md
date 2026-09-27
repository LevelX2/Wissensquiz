# Spielmodi und Filmbekanntheit

Stand: 27.09.2026. Auf Nutzerauftrag umgesetzt. Ersetzt den vorherigen Entwurf und für neue Freischaltungen die pauschale 20-Ziele-Regel.

## Redaktionelle Einordnung

Vier Gruppen: **1 Film-Ikonen**, **2 Bekannte Filme**, **3 Kennerfilme**, **4 Entdeckungen**. Bezugsrahmen: breites deutschsprachiges Kinopublikum. Redaktionelle Ersteinschätzung, keine repräsentative Bekanntheitsmessung, Qualitätswertung oder persönliche Vertrautheit. Fortsetzungen und Remakes separat beurteilt. Der Katalog enthält überwiegend bekannte Filme; eine Viertelquote wurde nicht erzwungen: 64 / 114 / 87 / 35 Filme (21,3 / 38,0 / 29,0 / 11,7 Prozent).

`src/filmFamiliarity.json` ordnet alle 300 Filmfassungen über Originaltitel und Jahr zu. Fragen und Varianten verwenden dieselbe Gruppe; CSV, Texte, Genres und IDs bleiben unverändert. Classics und Arthouse bleiben unabhängige Zusatzkategorien. Unklassifizierte eigene Imports sind bei Auswahl aller vier Gruppen frei spielbar, werden nicht still Film-Ikonen.

## Modi

| Modus | Auswahl | Bisherige Antworten |
|---|---|---|
| Filmreise (`entdecken`) | Genres/Kategorien und automatisch freigeschaltete Schwierigkeiten/Filmgruppen | Neue Ziele zuerst; zuletzt beantwortete Ziele aus drei Runden zurückstellen |
| Freies Spiel (`ueben`) | Alle Filter frei, ohne Uhr | Keine Lernstandsgewichtung |
| Rekordrunde (`rekord`) | Alle Filter frei, vorhandene Schwierigkeit/Filmgruppen möglichst gleichmäßig mischen | Keine Lernstandsgewichtung |

Zuerst Wissensziele zufällig mischen, dann eine passende Fragevariante wählen. Zusätzliche Varianten bringen keine zusätzlichen Lose. Pro Runde jedes Ziel höchstens einmal; unabhängige freie Runden können sich wiederholen. Erste Runde bis fünf, danach bis zehn Fragen. Die Filmreise begrenzt fällige Wiederholungen auf fünf. Eine neue höchste Schwierigkeit wird bis zu fünf gesehenen Zielen mit bis zu einer halben Runde eingeführt; andernfalls die neueste Filmgruppe. Mehrere Genres teilen dieses Kontingent.

## Freischaltung

Der Hinweis unter Losspielen erklärt den gewählten Modus in zwei kurzen Sätzen. „Mehr zu Auswahl und Ablauf“ öffnet die Erläuterung der Filterzusammenfassung, Rundengröße, Fragenauswahl und gemeinsamen Fortschrittswertung; bei Rekord zusätzlich Timer, Tabwechsel und Neuladen. Beim Moduswechsel ist die Erklärung wieder geschlossen. Der Spoilerhinweis bleibt sichtbar. Doppelte Moduserklärungen unter den Filtern entfallen; Auswahlalgorithmus und Speicherung bleiben unverändert.

`src/journeyCurriculum.json` ist der eingefrorene Startplan aus dem vollständigen Katalog einschließlich Filmwissen-Fragen. Neue Pakete ändern diese Ziele nicht automatisch.

- Einstieg je Genre bei Leicht und der niedrigsten vorhandenen Filmgruppe. Leere Gruppen überspringen; Thriller und Musik beginnen bei Gruppe 2.
- Schwierigkeit: Ziel für Mittel = aufgerundet 60 Prozent der leichten Ziele der Einstiegsgruppe; Ziel für Schwer entsprechend den mittleren. **Der Zähler umfasst sichere Ziele dieser Schwierigkeit aus allen Filmgruppen des Genres.** Schwer setzt Mittel voraus. Nenner wachsen beim Öffnen weiterer Gruppen nicht.
- Filmgruppen: 60 Prozent der festen leichten Wissensziel-IDs einer Gruppe öffnen die nächste vorhandene Gruppe. Fehlen leichte Fragen, zählt die niedrigste vorhandene Schwierigkeit. Schwer ist keine Voraussetzung.
- Nur sichere richtige Antworten abgeschlossener Runden zählen, in allen Modi einschließlich bisheriger Historie. Varianten, Wiederholungen, geratene und abgebrochene Antworten erhöhen die Zähler nicht.
- Bei Teilkatalogen Ziele auf vorhandene geeignete Inhalte begrenzen. Erworbene Rechte stehen in `journey.earned` und bleiben erhalten. Historisch mit Regel 1 erreichte 20/20-Freischaltungen gelten weiter.
- Neue Schwierigkeiten und Filmgruppen feiern beim Abschluss mit der vorhandenen Animation, Fanfare und optionalen Vibration. Reduzierte Bewegung wird beachtet. `round.unlocks` hält den damaligen Erfolg für den Rückblick fest.

Bei Umstufungen und neuen Genres Plan und Erreichbarkeit ausdrücklich prüfen, erworbene Rechte erhalten. Die mehrtägige Festigung bleibt eine unabhängige Lernkennzahl.

## Speicherung und Rekorde

Interne Modus-IDs bleiben erhalten. Neue Filter speichern `familiarities` kanonisch. Die Rundenvorbereitung bewahrt freie Stufen/Gruppen beim Wechsel zur Filmreise. Alte Sicherungen ohne Bekanntheitsauswahl verwenden alle Gruppen. Das globale Freigabehäkchen steuert neue Runden nicht mehr; ohne gespeicherte Rundenvorbereitung wird eine frühere freie Einstellung als Einstieg ins Freie Spiel übernommen.

`familiaritySnapshot` bewahrt die damalige Gruppe je Frage, damit redaktionelle Änderungen keine historischen Filterprüfungen ungültig machen. Zusätzliche Felder bleiben durch lokale Sicherungen und komprimierte Kontosicherungen erhalten.

Rekordkennung: `2.B<gewählte Gruppen>.M<Schwierigkeit/Gruppe:Anzahl,...>`. Tatsächliche Mischung und gewählte Gruppen sind Teil der Vergleichskategorie; verbleibende Plätze oder kleine Pools führen daher nicht zu unfair vermischten Listen. Oberfläche zeigt lesbare Angaben. Die vorhandene SQL-Rangliste verwendet bereits die vollständige Regelkennung (maximal 100 Zeichen); **keine SQL-Migration** nötig. Regel 1 bleibt separat. Gemeinsame Highscores bleiben kleine Ergebnisobjekte ohne neue Fragenkopien.

## Verteilung und Schwellen

Filmzahlen, keine Fragezahlen; Schwellen aus dem vollständigen Startplan. Teilimporte können niedrigere erreichbare Ziele haben.

| Genre | 1 | 2 | 3 | 4 | Leichte Ziele → Mittel | Mittlere Ziele → Schwer |
|---|---:|---:|---:|---:|---:|---:|
| Abenteuer | 1 | 2 | 2 | 1 | 2 | 2 |
| Action | 7 | 16 | 2 | 0 | 10 | 14 |
| Drama | 9 | 19 | 11 | 5 | 15 | 18 |
| Fantasy | 6 | 13 | 6 | 1 | 12 | 10 |
| Horror | 9 | 10 | 5 | 3 | 16 | 15 |
| Komödie | 7 | 12 | 9 | 1 | 11 | 14 |
| Martial Arts & Asia-Film | 1 | 3 | 10 | 11 | 2 | 2 |
| Musik | 0 | 1 | 0 | 0 | 2 | 2 |
| Rom-Com | 5 | 10 | 11 | 0 | 8 | 10 |
| Science-Fiction | 15 | 20 | 14 | 4 | 22 | 13 |
| Thriller | 0 | 5 | 4 | 3 | 10 | 9 |
| Western | 4 | 3 | 13 | 6 | 8 | 6 |

## Redaktionelle Filmzuordnung

| Film | Jahr | Genre | Gruppe |
|---|---:|---|---:|
| Stirb langsam | 1988 | Action | 1 |
| Stirb langsam 2 | 1990 | Action | 2 |
| Stirb langsam: Jetzt erst recht | 1995 | Action | 2 |
| Lethal Weapon – Zwei stahlharte Profis | 1987 | Action | 2 |
| Lethal Weapon 2 – Brennpunkt L.A. | 1989 | Action | 3 |
| Speed | 1994 | Action | 1 |
| The Rock – Entscheidung auf Alcatraz | 1996 | Action | 2 |
| Con Air | 1997 | Action | 2 |
| Im Körper des Feindes | 1997 | Action | 2 |
| Heat | 1995 | Action | 2 |
| Auf der Flucht | 1993 | Action | 2 |
| Air Force One | 1997 | Action | 2 |
| True Lies – Wahre Lügen | 1994 | Action | 2 |
| Phantom Kommando | 1985 | Action | 3 |
| Rambo | 1982 | Action | 1 |
| Rambo II – Der Auftrag | 1985 | Action | 2 |
| James Bond 007 – Goldfinger | 1964 | Action | 1 |
| James Bond 007 – GoldenEye | 1995 | Action | 2 |
| James Bond 007: Casino Royale | 2006 | Action | 1 |
| James Bond 007: Skyfall | 2012 | Action | 1 |
| Mission: Impossible | 1996 | Action | 1 |
| Mission: Impossible – Phantom Protokoll | 2011 | Action | 2 |
| Die Bourne Identität | 2002 | Action | 2 |
| 96 Hours | 2008 | Action | 2 |
| John Wick | 2014 | Action | 2 |
| Paris, Texas | 1984 | Drama | 3 |
| Der Himmel über Berlin | 1987 | Fantasy | 2 |
| Persona | 1966 | Drama | 4 |
| Wilde Erdbeeren | 1957 | Drama | 4 |
| Das siebente Siegel | 1957 | Drama | 3 |
| Fitzcarraldo | 1982 | Abenteuer | 3 |
| Aguirre, der Zorn Gottes | 1972 | Abenteuer | 4 |
| Stalker | 1979 | Sci-Fi | 4 |
| Solaris | 1972 | Sci-Fi | 3 |
| Blue Velvet | 1986 | Thriller | 3 |
| Mulholland Drive – Straße der Finsternis | 2001 | Thriller | 3 |
| Lost Highway | 1997 | Thriller | 4 |
| Dead Man | 1995 | Western | 4 |
| Down by Law | 1986 | Komödie | 4 |
| Broken Flowers | 2005 | Drama | 4 |
| Paterson | 2016 | Drama | 4 |
| Only Lovers Left Alive | 2013 | Horror | 4 |
| Chungking Express | 1994 | Drama | 3 |
| In the Mood for Love | 2000 | Drama | 3 |
| 2046 | 2004 | Drama | 4 |
| Das Piano | 1993 | Drama | 2 |
| Dogville | 2003 | Drama | 3 |
| Melancholia | 2011 | Drama | 3 |
| Lola rennt | 1998 | Thriller | 2 |
| Die fabelhafte Welt der Amélie | 2001 | RomCom | 2 |
| Casablanca | 1942 | Drama | 1 |
| Citizen Kane | 1941 | Drama | 2 |
| Alles über Eva | 1950 | Drama | 3 |
| African Queen | 1951 | Abenteuer | 2 |
| Singin’ in the Rain | 1952 | Musik | 2 |
| Ben Hur | 1959 | Abenteuer | 1 |
| Lawrence von Arabien | 1962 | Abenteuer | 2 |
| Die Brücke am Kwai | 1957 | Drama | 2 |
| Die Nacht des Jägers | 1955 | Thriller | 4 |
| Frau ohne Gewissen | 1944 | Thriller | 4 |
| Zeugin der Anklage | 1957 | Thriller | 3 |
| Das Fenster zum Hof | 1954 | Thriller | 2 |
| Der unsichtbare Dritte | 1959 | Thriller | 2 |
| Vertigo | 1958 | Thriller | 2 |
| Rebecca | 1940 | Thriller | 3 |
| Moderne Zeiten | 1936 | Komödie | 2 |
| Goldrausch | 1925 | Komödie | 3 |
| Metropolis | 1927 | Sci-Fi | 2 |
| Nosferatu, eine Symphonie des Grauens | 1922 | Horror | 2 |
| M – Eine Stadt sucht einen Mörder | 1931 | Thriller | 2 |
| Der blaue Engel | 1930 | Drama | 2 |
| Der Clou | 1973 | Komödie | 3 |
| Meuterei auf der Bounty | 1962 | Abenteuer | 3 |
| Wer die Nachtigall stört | 1962 | Drama | 3 |
| Die Faust im Nacken | 1954 | Drama | 3 |
| Die Verurteilten | 1994 | Drama | 1 |
| The Green Mile | 1999 | Drama | 1 |
| Forrest Gump | 1994 | Drama | 1 |
| Schindlers Liste | 1993 | Drama | 1 |
| Der Pianist | 2002 | Drama | 2 |
| Good Will Hunting | 1997 | Drama | 2 |
| Der Club der toten Dichter | 1989 | Drama | 1 |
| Rain Man | 1988 | Drama | 1 |
| Einer flog über das Kuckucksnest | 1975 | Drama | 2 |
| Philadelphia | 1993 | Drama | 2 |
| A Beautiful Mind – Genie und Wahnsinn | 2001 | Drama | 2 |
| American Beauty | 1999 | Drama | 2 |
| American History X | 1998 | Drama | 2 |
| Gran Torino | 2008 | Drama | 2 |
| Million Dollar Baby | 2004 | Drama | 2 |
| Manchester by the Sea | 2016 | Drama | 3 |
| Whiplash | 2014 | Drama | 2 |
| The Social Network | 2010 | Drama | 2 |
| Stand by Me – Das Geheimnis eines Sommers | 1986 | Drama | 2 |
| Das Leben der Anderen | 2006 | Drama | 2 |
| Das Boot | 1981 | Drama | 1 |
| Kramer gegen Kramer | 1979 | Drama | 2 |
| Der Pate | 1972 | Drama | 1 |
| Taxi Driver | 1976 | Drama | 2 |
| Wie ein wilder Stier | 1980 | Drama | 3 |
| Der Herr der Ringe: Die Gefährten | 2001 | Fantasy | 1 |
| Der Herr der Ringe: Die zwei Türme | 2002 | Fantasy | 1 |
| Der Herr der Ringe: Die Rückkehr des Königs | 2003 | Fantasy | 1 |
| Der Hobbit: Eine unerwartete Reise | 2012 | Fantasy | 2 |
| Der Hobbit: Smaugs Einöde | 2013 | Fantasy | 2 |
| Der Hobbit: Die Schlacht der fünf Heere | 2014 | Fantasy | 2 |
| Harry Potter und der Stein der Weisen | 2001 | Fantasy | 1 |
| Harry Potter und die Kammer des Schreckens | 2002 | Fantasy | 2 |
| Harry Potter und der Gefangene von Askaban | 2004 | Fantasy | 2 |
| Harry Potter und der Feuerkelch | 2005 | Fantasy | 2 |
| Harry Potter und der Orden des Phönix | 2007 | Fantasy | 2 |
| Harry Potter und der Halbblutprinz | 2009 | Fantasy | 2 |
| Harry Potter und die Heiligtümer des Todes – Teil 1 | 2010 | Fantasy | 2 |
| Harry Potter und die Heiligtümer des Todes – Teil 2 | 2011 | Fantasy | 1 |
| Die Chroniken von Narnia: Der König von Narnia | 2005 | Fantasy | 2 |
| Die Chroniken von Narnia: Prinz Kaspian von Narnia | 2008 | Fantasy | 3 |
| Die Chroniken von Narnia: Die Reise auf der Morgenröte | 2010 | Fantasy | 3 |
| Die Braut des Prinzen | 1987 | Fantasy | 3 |
| Der dunkle Kristall | 1982 | Fantasy | 3 |
| Die unendliche Geschichte | 1984 | Fantasy | 1 |
| Die Reise ins Labyrinth | 1986 | Fantasy | 3 |
| Legende | 1985 | Fantasy | 4 |
| Der Sternwanderer | 2007 | Fantasy | 3 |
| Pans Labyrinth | 2006 | Fantasy | 2 |
| Edward mit den Scherenhänden | 1990 | Fantasy | 2 |
| Alien – Das unheimliche Wesen aus einer fremden Welt | 1979 | Science-Fiction | 1 |
| Aliens – Die Rückkehr | 1986 | Science-Fiction | 2 |
| Matrix | 1999 | Science-Fiction | 1 |
| Matrix Reloaded | 2003 | Science-Fiction | 2 |
| Blade Runner | 1982 | Science-Fiction | 2 |
| Blade Runner 2049 | 2017 | Science-Fiction | 2 |
| Interstellar | 2014 | Science-Fiction | 1 |
| Inception | 2010 | Science-Fiction | 1 |
| Terminator | 1984 | Science-Fiction | 1 |
| Terminator 2 – Tag der Abrechnung | 1991 | Science-Fiction | 1 |
| Zurück in die Zukunft | 1985 | Science-Fiction | 1 |
| Zurück in die Zukunft II | 1989 | Science-Fiction | 2 |
| Zurück in die Zukunft III | 1990 | Science-Fiction | 2 |
| Jurassic Park | 1993 | Science-Fiction | 1 |
| Jurassic World | 2015 | Science-Fiction | 2 |
| Avatar | 2009 | Science-Fiction | 1 |
| E.T. – Der Außerirdische | 1982 | Science-Fiction | 1 |
| Der Marsianer – Rettet Mark Watney | 2015 | Science-Fiction | 2 |
| Men in Black | 1997 | Science-Fiction | 1 |
| Independence Day | 1996 | Science-Fiction | 1 |
| Die Truman Show | 1998 | Science-Fiction | 2 |
| 12 Monkeys | 1995 | Science-Fiction | 2 |
| 1984 | 1984 | Science-Fiction | 3 |
| Das fünfte Element | 1997 | Science-Fiction | 2 |
| Gattaca | 1997 | Science-Fiction | 3 |
| Arrival | 2016 | Science-Fiction | 2 |
| Contact | 1997 | Science-Fiction | 2 |
| District 9 | 2009 | Science-Fiction | 3 |
| Moon | 2009 | Science-Fiction | 4 |
| Ex Machina | 2014 | Science-Fiction | 3 |
| Minority Report | 2002 | Science-Fiction | 2 |
| Die totale Erinnerung – Total Recall | 1990 | Science-Fiction | 2 |
| RoboCop | 1987 | Science-Fiction | 2 |
| Starship Troopers | 1997 | Science-Fiction | 3 |
| Predator | 1987 | Science-Fiction | 2 |
| Dark City | 1998 | Science-Fiction | 4 |
| WarGames – Kriegsspiele | 1983 | Science-Fiction | 3 |
| Stargate | 1994 | Science-Fiction | 2 |
| Star Wars: Episode IV – Eine neue Hoffnung | 1977 | Science-Fiction | 1 |
| Star Wars: Episode V – Das Imperium schlägt zurück | 1980 | Science-Fiction | 1 |
| Star Wars: Episode VI – Die Rückkehr der Jedi-Ritter | 1983 | Science-Fiction | 1 |
| Star Trek II: Der Zorn des Khan | 1982 | Science-Fiction | 3 |
| Star Trek IV: Zurück in die Gegenwart | 1986 | Science-Fiction | 3 |
| Star Trek: Der erste Kontakt | 1996 | Science-Fiction | 3 |
| Snowpiercer | 2013 | Science-Fiction | 3 |
| Source Code | 2011 | Science-Fiction | 3 |
| Looper | 2012 | Science-Fiction | 3 |
| Edge of Tomorrow | 2014 | Science-Fiction | 2 |
| Oblivion | 2013 | Science-Fiction | 3 |
| Sunshine | 2007 | Science-Fiction | 4 |
| Halloween – Die Nacht des Grauens | 1978 | Horror | 1 |
| Halloween II – Das Grauen kehrt zurück | 1981 | Horror | 3 |
| Nightmare – Mörderische Träume | 1984 | Horror | 1 |
| Nightmare 3 – Freddy Krueger lebt | 1987 | Horror | 3 |
| Freitag der 13. | 1980 | Horror | 1 |
| Freitag der 13. – Jason kehrt zurück | 1981 | Horror | 4 |
| Scream – Schrei! | 1996 | Horror | 1 |
| Scream 2 | 1997 | Horror | 2 |
| Shining | 1980 | Horror | 1 |
| Carrie – Des Satans jüngste Tochter | 1976 | Horror | 2 |
| Misery | 1990 | Horror | 2 |
| Friedhof der Kuscheltiere | 1989 | Horror | 2 |
| Es | 2017 | Horror | 1 |
| Der Exorzist | 1973 | Horror | 1 |
| Das Omen | 1976 | Horror | 2 |
| Poltergeist | 1982 | Horror | 2 |
| Tanz der Teufel | 1981 | Horror | 3 |
| Tanz der Teufel II – Jetzt wird noch mehr getanzt | 1987 | Horror | 4 |
| Psycho | 1960 | Horror | 1 |
| Die Vögel | 1963 | Horror | 1 |
| Blutgericht in Texas | 1974 | Horror | 3 |
| Ring – Das Original | 1998 | Horror | 3 |
| Conjuring – Die Heimsuchung | 2013 | Horror | 2 |
| Saw | 2004 | Horror | 2 |
| Get Out | 2017 | Horror | 2 |
| The Big Lebowski | 1998 | Komödie | 2 |
| Ein Fisch namens Wanda | 1988 | Komödie | 2 |
| Das Leben des Brian | 1979 | Komödie | 1 |
| Die Ritter der Kokosnuss | 1975 | Komödie | 2 |
| Die unglaubliche Reise in einem verrückten Flugzeug | 1980 | Komödie | 2 |
| Die nackte Kanone | 1988 | Komödie | 1 |
| The Blues Brothers | 1980 | Komödie | 1 |
| Frankenstein Junior | 1974 | Komödie | 3 |
| Spaceballs | 1987 | Komödie | 2 |
| Galaxy Quest – Planlos durchs Weltall | 1999 | Komödie | 3 |
| Hot Fuzz – Zwei abgewichste Profis | 2007 | Komödie | 3 |
| Shaun of the Dead | 2004 | Komödie | 3 |
| Hangover | 2009 | Komödie | 1 |
| Superbad | 2007 | Komödie | 3 |
| Tropic Thunder | 2008 | Komödie | 3 |
| Ferris macht blau | 1986 | Komödie | 2 |
| Und täglich grüßt das Murmeltier | 1993 | Komödie | 1 |
| Kevin – Allein zu Haus | 1990 | Komödie | 1 |
| Schöne Bescherung | 1989 | Komödie | 1 |
| Die Glücksritter | 1983 | Komödie | 2 |
| Pappa ante portas | 1991 | Komödie | 2 |
| Ödipussi | 1988 | Komödie | 2 |
| Sterben für Anfänger | 2007 | Komödie | 3 |
| Willkommen bei den Sch’tis | 2008 | Komödie | 2 |
| Grand Budapest Hotel | 2014 | Komödie | 2 |
| Die Schlange im Schatten des Adlers | 1978 | Martial Arts & Asia-Film | 4 |
| Drunken Master – The Beginning | 1978 | Martial Arts & Asia-Film | 3 |
| Drunken Master 2 | 1994 | Martial Arts & Asia-Film | 4 |
| Der Superfighter | 1983 | Martial Arts & Asia-Film | 4 |
| Police Story | 1985 | Martial Arts & Asia-Film | 3 |
| Police Story III – Supercop | 1992 | Martial Arts & Asia-Film | 4 |
| Armour of God: Der rechte Arm der Götter | 1986 | Martial Arts & Asia-Film | 4 |
| Mission Adler | 1991 | Martial Arts & Asia-Film | 4 |
| Powerman | 1984 | Martial Arts & Asia-Film | 4 |
| Rumble in the Bronx | 1995 | Martial Arts & Asia-Film | 3 |
| Rush Hour | 1998 | Martial Arts & Asia-Film | 1 |
| New Police Story | 2004 | Martial Arts & Asia-Film | 3 |
| Todesgrüße aus Shanghai | 1972 | Martial Arts & Asia-Film | 3 |
| Die Todeskralle schlägt wieder zu | 1972 | Martial Arts & Asia-Film | 3 |
| Der Mann mit der Todeskralle | 1973 | Martial Arts & Asia-Film | 2 |
| Fist of Legend | 1994 | Martial Arts & Asia-Film | 4 |
| Fearless | 2006 | Martial Arts & Asia-Film | 3 |
| Hero | 2002 | Martial Arts & Asia-Film | 2 |
| Ip Man | 2008 | Martial Arts & Asia-Film | 3 |
| Ong-Bak | 2003 | Martial Arts & Asia-Film | 3 |
| Revenge of the Warrior | 2005 | Martial Arts & Asia-Film | 4 |
| Tiger & Dragon | 2000 | Martial Arts & Asia-Film | 2 |
| House of Flying Daggers | 2004 | Martial Arts & Asia-Film | 3 |
| Die 36 Kammern der Shaolin | 1978 | Martial Arts & Asia-Film | 4 |
| Hard Boiled | 1992 | Martial Arts & Asia-Film | 4 |
| Harry & Sally | 1989 | Rom-Com | 1 |
| Pretty Woman | 1990 | Rom-Com | 1 |
| Notting Hill | 1999 | Rom-Com | 1 |
| Schlaflos in Seattle | 1993 | Rom-Com | 2 |
| E-m@il für Dich | 1998 | Rom-Com | 2 |
| Vier Hochzeiten und ein Todesfall | 1994 | Rom-Com | 2 |
| Bridget Jones – Schokolade zum Frühstück | 2001 | Rom-Com | 1 |
| Bridget Jones – Am Rande des Wahnsinns | 2004 | Rom-Com | 2 |
| Bridget Jones’ Baby | 2016 | Rom-Com | 3 |
| Selbst ist die Braut | 2009 | Rom-Com | 2 |
| Liebe braucht keine Ferien | 2006 | Rom-Com | 2 |
| 50 erste Dates | 2004 | Rom-Com | 2 |
| 10 Dinge, die ich an Dir hasse | 1999 | Rom-Com | 3 |
| Wie werde ich ihn los – in 10 Tagen? | 2003 | Rom-Com | 3 |
| 27 Dresses | 2008 | Rom-Com | 3 |
| Während Du schliefst | 1995 | Rom-Com | 3 |
| Eine Hochzeit zum Verlieben | 1998 | Rom-Com | 3 |
| Wedding Planner – Verliebt, verlobt, verplant | 2001 | Rom-Com | 3 |
| Hitch – Der Date Doktor | 2005 | Rom-Com | 2 |
| Tatsächlich… Liebe | 2003 | Rom-Com | 1 |
| Mitten ins Herz – Ein Song für dich | 2007 | Rom-Com | 3 |
| Ein Herz und eine Krone | 1953 | Rom-Com | 2 |
| Mondsüchtig | 1987 | Rom-Com | 3 |
| French Kiss | 1995 | Rom-Com | 3 |
| Sweet Home Alabama – Liebe auf Umwegen | 2002 | Rom-Com | 3 |
| Für eine Handvoll Dollar | 1964 | Western | 2 |
| Für ein paar Dollar mehr | 1965 | Western | 3 |
| Zwei glorreiche Halunken | 1966 | Western | 1 |
| Spiel mir das Lied vom Tod | 1968 | Western | 1 |
| Todesmelodie | 1971 | Western | 3 |
| Django | 1966 | Western | 2 |
| Mein Name ist Nobody | 1973 | Western | 1 |
| Erbarmungslos | 1992 | Western | 2 |
| Der Texaner | 1976 | Western | 3 |
| Pale Rider – Der namenlose Reiter | 1985 | Western | 4 |
| Der mit dem Wolf tanzt | 1990 | Western | 1 |
| The Wild Bunch – Sie kannten kein Gesetz | 1969 | Western | 3 |
| Butch Cassidy und Sundance Kid | 1969 | Western | 3 |
| Tombstone | 1993 | Western | 3 |
| True Grit | 2010 | Western | 3 |
| Todeszug nach Yuma | 2007 | Western | 3 |
| Open Range | 2003 | Western | 3 |
| Appaloosa | 2008 | Western | 4 |
| Der Mann, der Liberty Valance erschoss | 1962 | Western | 3 |
| El Dorado | 1966 | Western | 3 |
| Der Scharfschütze | 1950 | Western | 4 |
| Jeremiah Johnson | 1972 | Western | 4 |
| Die glorreichen Sieben | 2016 | Western | 3 |
| Maverick | 1994 | Western | 3 |
| Leichen pflastern seinen Weg | 1968 | Western | 4 |

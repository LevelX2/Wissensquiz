"""Derive the explicitly requested 200 image questions without changing old goals."""
import csv
import hashlib
import io
import json
import pathlib
import random
import re

ROOT = pathlib.Path(".")
RAW = ROOT / "KI-Wissen-Wissensquiz/01 Rohquellen"
OUT = ROOT / "docs/Schauspieler-Bilderkennung-2026-10-07"
OUT.mkdir(parents=True, exist_ok=True)
actors = json.loads((ROOT / ".sites-runtime/actor-recognition/actors.json").read_text(encoding="utf-8"))
portraits = json.loads((ROOT / "src/actorRecognitionPortraits.json").read_text(encoding="utf-8"))
new_film_refs = json.loads((OUT / "Filmverweise.json").read_text(encoding="utf-8"))
assert len(portraits) == 200
editorial = {}
for filename in ["src/actorEditorial.json", "src/actorSupplementEditorial.json"]:
    editorial.update(json.loads((ROOT / filename).read_text(encoding="utf-8"))["questions"])

# Short career connections for the 25 additional people, checked against the
# retained biography extracts. Older connections reuse the project's reviewed
# actor editorial entries and retain their source URLs and film references.
new_context = {
    176: "Robert Redford spielte den Sundance Kid an der Seite von Paul Newman. Seine Arbeit als Schauspieler und Regisseur verbindet sich außerdem mit dem Sundance Institute, das unabhängige Filmschaffende unterstützt.",
    177: "Paul Newman spielte zusammen mit Robert Redford in „Zwei Banditen“ und „Der Clou“. Für „Die Farbe des Geldes“ erhielt er den Hauptdarsteller-Oscar. Die Zusammenarbeit mit Redford ist ein guter Anknüpfungspunkt, um die beiden Gesichter auseinanderzuhalten.",
    178: "Humphrey Bogart spielte Rick Blaine in „Casablanca“ und den Privatdetektiv Sam Spade in „Die Spur des Falken“. Diese Rollen verbinden sein Gesicht mit zwei prägenden Figuren des klassischen Hollywoodkinos.",
    179: "James Stewart spielte George Bailey in „Ist das Leben nicht schön?“. In Alfred Hitchcocks „Das Fenster zum Hof“ verkörperte er den Fotografen Jeff, der aus seiner Wohnung einen möglichen Mord beobachtet.",
    180: "Cary Grant spielte in Hitchcocks „Der unsichtbare Dritte“ einen Werbefachmann, der mit einem Agenten verwechselt wird. Daneben prägte er Komödien wie „Leoparden küsst man nicht“ an der Seite von Katharine Hepburn.",
    181: "Gregory Peck verkörperte den Anwalt Atticus Finch in „Wer die Nachtigall stört“. Die Rolle eines Vaters, der seinen Kindern Haltung vorlebt und einen zu Unrecht Beschuldigten verteidigt, brachte ihm den Hauptdarsteller-Oscar.",
    182: "Marlon Brando spielte den jungen Stanley Kowalski in „Endstation Sehnsucht“ und später Don Vito Corleone in „Der Pate“. Zwischen diesen Figuren liegen sehr unterschiedliche Lebensalter und Ausdrucksweisen; ein einzelnes Rollenbild zeigt deshalb nur einen Teil seines Erscheinungsbilds.",
    183: "James Dean spielte in „Jenseits von Eden“, „… denn sie wissen nicht, was sie tun“ und „Giganten“. Diese drei zentralen Kinorollen prägten sein Bild als junger Darsteller, obwohl seine Laufbahn durch seinen frühen Tod sehr kurz blieb.",
    184: "Steve McQueen spielte den Polizisten Frank Bullitt in „Bullitt“. Zu seinen weiteren bekannten Filmen gehören „Gesprengte Ketten“ und „Papillon“. Diese Rollen machen sein Gesicht besonders mit dem Action- und Abenteuerkino vertraut.",
    185: "Sidney Poitier erhielt für „Lilien auf dem Felde“ den Hauptdarsteller-Oscar. In „In der Hitze der Nacht“ spielte er den Ermittler Virgil Tibbs, der in einer Kleinstadt mit rassistischen Vorurteilen konfrontiert wird.",
    186: "Alain Delon spielte den schweigsamen Auftragsmörder Jef Costello in „Der eiskalte Engel“. „Nur die Sonne war Zeuge“ und „Der Leopard“ verbinden sein Gesicht ebenfalls mit dem europäischen Kino der 1960er-Jahre.",
    187: "Jean-Paul Belmondo spielte in Jean-Luc Godards „Außer Atem“ den flüchtigen Michel. Später wurde er auch durch französische Actionfilme bekannt. Nouvelle Vague und Unterhaltungskino gehören damit gleichermaßen zu seiner Laufbahn.",
    188: "Monica Bellucci spielte die Titelfigur in „Malèna“ und Persephone in den „Matrix“-Fortsetzungen. In „Spectre“ verkörperte sie Lucia Sciarra. Ihre Laufbahn verbindet italienische Filme mit internationalen Produktionen.",
    189: "Catherine Deneuve spielte in „Die Regenschirme von Cherbourg“ die junge Geneviève und in „Belle de Jour“ die verheiratete Séverine. Die beiden sehr unterschiedlichen Filme gehören zu ihren prägenden Arbeiten im französischen Kino.",
    190: "Isabelle Adjani spielte in „Die Geschichte der Adèle H.“ die Tochter Victor Hugos. In „Camille Claudel“ verkörperte sie die Bildhauerin. Für beide Rollen wurde sie für den Hauptdarstellerinnen-Oscar nominiert.",
    191: "Liv Ullmann spielte in Ingmar Bergmans „Persona“ die Schauspielerin Elisabet, die nicht mehr spricht. Ihre langjährige Zusammenarbeit mit Bergman umfasst außerdem Filme wie „Schreie und Flüstern“; später arbeitete sie selbst als Regisseurin.",
    192: "Sissy Spacek verkörperte die Titelfigur in „Carrie“ und die Countrysängerin Loretta Lynn in „Nashville Lady“. Für die Darstellung von Lynn erhielt sie den Hauptdarstellerinnen-Oscar. Horrorfilm und Musikbiografie zeigen unterschiedliche Seiten ihrer Arbeit.",
    193: "Emma Watson spielte Hermine Granger in den acht „Harry Potter“-Filmen. Später übernahm sie Belle in der Realverfilmung von „Die Schöne und das Biest“. Das Porträt zeigt die Darstellerin außerhalb dieser vertrauten Filmkostüme.",
    194: "Emma Roberts spielte in „Scream 4“ die Figur Jill Roberts und in „Wir sind die Millers“ Casey. Außerdem gehört sie zu den Darstellerinnen der Fernsehreihe „American Horror Story“; diese Serienarbeit ist kein eigener Kinofilm.",
    195: "Kristen Stewart spielte Bella Swan in der „Twilight“-Reihe. In „Spencer“ verkörperte sie Diana und wurde dafür für den Hauptdarstellerinnen-Oscar nominiert. Die beiden Arbeiten verbinden ihr Gesicht mit sehr unterschiedlichen Figuren.",
    196: "Jennifer Connelly spielte Sarah in „Die Reise ins Labyrinth“ und Alicia Nash in „A Beautiful Mind“. Für Alicia erhielt sie den Nebendarstellerinnen-Oscar. Frühe Fantasyrolle und spätere Biografie bieten zwei Anknüpfungspunkte zu ihrem Gesicht.",
    197: "Michelle Williams spielte Marilyn Monroe in „My Week with Marilyn“. In „Manchester by the Sea“ verkörperte sie Randi. Die Verkörperung einer bekannten Filmschauspielerin macht besonders deutlich, warum Rollenbild und echtes Porträt auseinanderzuhalten sind.",
    198: "Alicia Vikander spielte die künstliche Intelligenz Ava in „Ex Machina“ und Gerda Wegener in „The Danish Girl“. Für Gerda erhielt sie den Nebendarstellerinnen-Oscar. Später verkörperte sie auch Lara Croft in „Tomb Raider“.",
    199: "Rooney Mara spielte Lisbeth Salander in David Finchers „Verblendung“ und Therese in „Carol“. Lisbeths auffällige Frisur und Piercings gehören zur Figur; ein Porträt der Darstellerin kann deshalb anders wirken als das vertraute Rollenbild.",
    200: "Julie Delpy spielte Céline in „Before Sunrise“, „Before Sunset“ und „Before Midnight“ an der Seite von Ethan Hawke. Sie ist außerdem Drehbuchautorin und Regisseurin, etwa bei „2 Tage Paris“. Die „Before“-Filme begleiten dasselbe Paar über mehrere Lebensphasen.",
}
easy = set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,29,30,31,32,33,34,37,38,40,43,44,45,46,48,51,52,53,54,55,56,57,62,64,65,66,67,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,91,92,93,94,95,96,98,100,101,102,103,104,105,107,121,122,126,127,128,130,131,132,133,140,142,154,156,162,176,177,178,182,183,186,188,193,195])
hard = set([19,36,39,41,42,47,49,50,58,60,61,63,68,69,70,87,88,89,90,97,112,113,117,118,120,123,124,125,137,143,145,147,151,152,153,164,165,166,170,172,173,174,175,189,190,191,192,194,197,198,199,200])
expert = {112,113,124,147,152,153,164,165,190,200}
career_leads = dict(line.split("|", 1) for line in """1|spielt Forrest Gump im gleichnamigen Film.
2|spielt Jack Dawson in „Titanic“ an der Seite von Kate Winslet.
3|spielt Tyler Durden in „Fight Club“.
4|verkörpert Captain Jack Sparrow in der „Fluch der Karibik“-Reihe.
5|spielt Travis Bickle in „Taxi Driver“.
6|spielt Michael Corleone in der „Pate“-Trilogie.
7|spielt Jack Torrance in „Shining“.
8|spielt Alonzo Harris in „Training Day“.
9|spielt Red in „Die Verurteilten“.
10|spielt Jules Winnfield in „Pulp Fiction“.
11|spielt Han Solo in der ursprünglichen „Star Wars“-Trilogie.
12|verkörpert Ethan Hunt in der „Mission: Impossible“-Reihe.
13|spielt Neo in der „Matrix“-Reihe.
14|spielt John McClane in „Stirb langsam“.
15|spielt die Titelmaschine im ersten „Terminator“.
16|schrieb „Rocky“ und spielte den Boxer selbst.
17|spielte bei Sergio Leone den Mann ohne Namen.
18|spielt Hannibal Lecter in „Das Schweigen der Lämmer“.
19|spielt Daniel Plainview in „There Will Be Blood“.
20|spielt Sirius Black in den „Harry Potter“-Filmen.
21|spielt Bruce Wayne und Batman in Christopher Nolans Trilogie.
22|spielt Arthur Fleck in „Joker“.
23|spielt den Joker in „The Dark Knight“.
24|spielt den verkleideten Vater Daniel Hillard in „Mrs. Doubtfire“.
25|spielt den Tierdetektiv Ace Ventura.
26|wurde durch die Sitcom „Der Prinz von Bel-Air“ bekannt.
27|spielt Jason Bourne in mehreren Filmen der Bourne-Reihe.
28|verkörpert Batman in „Batman v Superman“ und „Justice League“.
29|spielte Dr. Doug Ross in „Emergency Room“.
30|spielt James Bond in „Dr. No“.
31|begann seine James-Bond-Laufbahn mit „Casino Royale“.
32|spielt Sherlock Holmes in der BBC-Serie „Sherlock“.
33|spielt Gandalf in den „Herr der Ringe“-Filmen.
34|spielt Jean-Luc Picard in „Star Trek“.
35|spielt Alfred Pennyworth in Nolans Batman-Trilogie.
36|spielt Severus Snape in den „Harry Potter“-Filmen.
37|spielt Hans Landa in „Inglourious Basterds“.
38|spielt Alex in „Good Bye, Lenin!“.
39|spielt den Lehrer Rainer Wenger in „Die Welle“.
40|spielt Manni in „Lola rennt“.
41|spielt Peter Bellheim in „Der große Bellheim“.
42|verkörpert Adolf Hitler in „Der Untergang“.
43|bildete mit Terence Hill ein bekanntes Komödienduo.
44|spielt Trinity in „Die rechte und die linke Hand des Teufels“.
45|spielt an der Seite von Chris Tucker in „Rush Hour“.
46|spielt die Hauptrolle in „Der Mann mit der Todeskralle“.
47|spielt Li Mu Bai in „Tiger & Dragon“.
48|ist im Hindi-Kino auch unter dem Beinamen „King Khan“ bekannt.
49|arbeitete häufig mit dem Regisseur Akira Kurosawa zusammen.
50|spielt die Titelrolle in „Doktor Schiwago“.
51|spielt Miranda Priestly in „Der Teufel trägt Prada“.
52|spielt Vivian Ward in „Pretty Woman“.
53|spielt die Busfahrerin Annie in „Speed“.
54|spielt Clarice Starling in „Das Schweigen der Lämmer“.
55|spielt Satine in „Moulin Rouge!“.
56|spielt Galadriel in den Tolkien-Filmen.
57|spielt Rose in „Titanic“.
58|verkörpert die Kinderfrau Nanny McPhee.
59|spielt Elizabeth II. in „Die Queen“.
60|spielt die Geheimdienstchefin M in mehreren Bondfilmen.
61|spielt Professor McGonagall in den „Harry Potter“-Filmen.
62|spielt Holly Golightly in „Frühstück bei Tiffany“.
63|gewann vier Hauptdarstellerinnen-Oscars.
64|spielt die ägyptische Königin in „Cleopatra“.
65|singt in „Blondinen bevorzugt“ über Diamanten.
66|wurde durch ihre Heirat Mitglied der Fürstenfamilie Grimaldi.
67|begann ihre Filmkarriere im italienischen Kino.
68|spielt Ilsa Lund in „Casablanca“.
69|spielt Margo Channing in „Alles über Eva“.
70|spielt Annie Hall in „Der Stadtneurotiker“.
71|spielt Louise in „Thelma & Louise“.
72|spielt Ellen Ripley in der „Alien“-Reihe.
73|spielt Laurie Strode im ersten „Halloween“.
74|spielt Catwoman in „Batmans Rückkehr“.
75|gewann für „Still Alice“ den Hauptdarstellerinnen-Oscar.
76|spielt Padmé Amidala in den „Star Wars“-Prequels.
77|verkörpert Lara Croft in zwei Abenteuerfilmen.
78|spielt Furiosa in „Mad Max: Fury Road“.
79|spielt Storm in den „X-Men“-Filmen.
80|spielt Elle Woods in „Natürlich blond“.
81|spielt Katniss Everdeen in „Die Tribute von Panem“.
82|spielt Mia in „La La Land“.
83|verkörpert die Avengers-Agentin Black Widow.
84|spielt die Titelfigur in „Barbie“.
85|spielt Andy in „Der Teufel trägt Prada“.
86|spielt Giselle in „Verwünscht“.
87|spielt Maya in „Zero Dark Thirty“.
88|spielt Marge Gunderson in „Fargo“.
89|spielt die Anwältin Annalise Keating in „How to Get Away with Murder“.
90|spielt Ramonda, T’Challas Mutter, in „Black Panther“.
91|spielt die Sängerin Deloris in „Sister Act“.
92|spielt die kleine Gertie in „E.T.“.
93|spielt Joyce Byers in „Stranger Things“.
94|begann ihre Filmkarriere im spanischen Kino.
95|verkörpert Frida Kahlo in „Frida“.
96|spielt Evelyn Wang in „Everything Everywhere All at Once“.
97|hat ihren frühen Durchbruch in Filmen von Zhang Yimou.
98|spielt die Titelheldin in „Lola rennt“.
99|spielt Helena in „Troja“.
100|spielt die Kaiserin Elisabeth in der „Sissi“-Reihe.
101|spielt den Personenschützer Frank Farmer in „Bodyguard“.
102|spielt Maximus in „Gladiator“.
103|verkörpert Wolverine in den „X-Men“-Filmen.
104|spielt Ken in „Barbie“.
105|verkörpert Tony Stark und Iron Man im Marvel-Kino.
106|spielt den namenlosen Erzähler in „Fight Club“.
107|verkörpert die Titelfigur in „Ghost Rider“.
108|spielt Inspektor Clouseau in „Der rosarote Panther“ von 2006.
109|spielt den Dude in „The Big Lebowski“.
110|spielt Raymond Babbitt in „Rain Man“.
111|spielt Zorro an der Seite von Catherine Zeta-Jones.
112|spielt den „Tatort“-Ermittler Felix Murot.
113|wollte ursprünglich Berufsmusiker auf der Violine werden.
114|spielt Elizabeth II. in Staffel drei und vier von „The Crown“.
115|spielt die Kinderfrau in „Mary Poppins’ Rückkehr“.
116|spielt die Bibliothekarin Evelyn Carnahan in „Die Mumie“.
117|verkörpert die Weiße Hexe Jadis im ersten Narnia-Film.
118|spielt Jo March in Greta Gerwigs „Little Women“.
119|spielt Mary Jane Watson in Sam Raimis „Spider-Man“-Trilogie.
120|spielt Bellatrix Lestrange in den „Harry Potter“-Filmen.
121|spielt Rachel Green in „Friends“.
122|spielt die Titelfigur im ursprünglichen „Mary Poppins“.
123|ist besonders mit dem französischen Kino verbunden.
124|ist als Schauspielerin und Chansonsängerin bekannt.
125|spielt die Berliner Kommissarin in „Rosa Roth“.
126|spielt Gordon Gekko in „Wall Street“.
127|spielt an der Seite von Julia Roberts in „Pretty Woman“.
128|spielt Danny Zuko in „Grease“.
129|spielt Snake Plissken in „Die Klapperschlange“.
130|spielt den Pinguin in „Batmans Rückkehr“.
131|spielt Peter Venkman in „Ghostbusters“.
132|spielt Axel Foley in „Beverly Hills Cop“.
133|spielt den unerfahrenen Betreuer Sonny Koufax in „Big Daddy“.
134|spielt Rick O’Connell in „Die Mumie“.
135|spielt die Titelfigur in „Donnie Darko“.
136|spielt Norman Osborn in Sam Raimis „Spider-Man“.
137|spielt eine erfundene Version seiner selbst in „Being John Malkovich“.
138|verkörpert Lord Voldemort in den „Harry Potter“-Filmen.
139|spielt George VI. in „The King’s Speech“.
140|spielt den früheren Agenten Bryan Mills in „96 Hours“.
141|spielt Obi-Wan Kenobi in der „Star Wars“-Vorgeschichte.
142|spielt Tommy Shelby in „Peaky Blinders“.
143|spielt Präsident Snow in den ursprünglichen „Tribute von Panem“-Filmen.
144|spielt den Auftragsmörder Léon in „Léon – Der Profi“.
145|spielt den Ballettleiter Thomas Leroy in „Black Swan“.
146|spielt Le Chiffre in „Casino Royale“.
147|spielt den Familienvater Kim Ki-taek in „Parasite“.
148|verkörpert den Wing-Chun-Meister in „Ip Man“.
149|spielt Jamal Malik in „Slumdog Millionär“.
150|verkörpert den erfundenen kasachischen Reporter Borat.
151|gewann für Aurora Greenway in „Zeit der Zärtlichkeit“ einen Oscar.
152|spielt Lara in „Doktor Schiwago“.
153|spielt Ruth Wilcox in „Wiedersehen in Howards End“.
154|spielt Cruella de Vil im Realfilm „101 Dalmatiner“.
155|spielt Thelma in „Thelma & Louise“.
156|spielt Sally Albright in „Harry und Sally“.
157|spielt Rita in „Und täglich grüßt das Murmeltier“.
158|spielt die Tagebuchschreiberin Bridget Jones.
159|spielt zunächst Betty Elms in „Mulholland Drive“.
160|spielt Penny Lane in „Almost Famous“.
161|spielt die junge Allie in „Wie ein einziger Tag“.
162|spielt Elizabeth Swann in „Fluch der Karibik“.
163|spielt Jyn Erso in „Rogue One“.
164|spielt Rosa Hubermann in „Die Bücherdiebin“.
165|spielt Dolores Umbridge in den „Harry Potter“-Filmen.
166|spielt Coles Mutter Lynn Sear in „The Sixth Sense“.
167|spielt Ellie Sattler in „Jurassic Park“.
168|spielt Patsey in „12 Years a Slave“.
169|spielt Olivia Pope in „Scandal“.
170|spielt Minny Jackson in „The Help“.
171|spielt Mama Morton im Filmmusical „Chicago“.
172|spielt Jen Yu in „Tiger & Dragon“.
173|verkörpert Édith Piaf in „La Vie en Rose“.
174|spielt Madeleine Swann in „Spectre“.
175|spielt Vianne Rocher in „Chocolat“.""".splitlines())

def number(actor):
    return int(actor["actor_id"].split("-")[1])

def gender(actor):
    n = number(actor)
    return "male" if n <= 50 or 101 <= n <= 113 or 126 <= n <= 150 or 176 <= n <= 187 else "female"

def birth(actor):
    match = re.search(r"\b(18\d{2}|19\d{2}|20\d{2})\b", actor["biography"][:300])
    assert match, actor["name"]
    return int(match.group())

questions = []
for actor in actors:
    n = number(actor)
    name, person = actor["name"], actor["actor_id"]
    portrait = portraits[person]
    assert portrait["name"] == name
    peers = sorted([a for a in actors if gender(a) == gender(actor) and a != actor], key=lambda a: (abs(birth(a) - birth(actor)), a["name"]))[:10]
    wrong = random.Random(f"recognition-{n}").sample(peers, 3)
    options = [a["name"] for a in wrong]
    correct = (n - 1) % 4
    options.insert(correct, name)
    sources = [portrait["sourceUrl"], actor["biography_url"]]
    films = []
    reused_editorial = None
    if n <= 175:
        original = actor["existing_questions"][0]
        entry = editorial[original["question_id"]]
        context = f"{name} {career_leads[str(n)]} {entry['text']}"
        films = entry["films"]
        sources += entry["sources"]
        reused_editorial = original["question_id"]
    else:
        context = new_context[n]
        films = new_film_refs[str(n)]
    level = "experte" if n in expert else "schwer" if n in hard else "leicht" if n in easy else "mittel"
    question_id = f"SCHAUSPIELER-BILD-20261007-{n:03}"
    anchor = f"{name} – {films[0].rsplit('|',1)[0]}" if films else f"Das Gesicht auf diesem Porträt gehört zu {name}."
    questions.append({"question_id": question_id, "knowledge_id": f"K-ACTOR-FACE-{person}", "variant_of": None, "actor_id": person, "difficulty": level, "question_type": "Bilderkennung", "question": "Wie heißt die Person auf diesem Schauspielerporträt?", "answers": [{"id": letter.upper(), "text": text, "feedback": f"Das Porträt zeigt {name}." if text == name else f"Auf diesem Porträt ist {name} zu sehen; {text} ist eine andere Person."} for letter, text in zip("abcd", options)], "correct_answer": "ABCD"[correct], "explanation_short": f"Das Porträt zeigt {name}.", "additional_info": context, "memory_anchor": anchor, "source_urls": list(dict.fromkeys(sources)), "actor_name_before_answer": False, "question_image_id": person, "film_refs": films, "reused_context_from": reused_editorial, "verification_status": "redaktionell_quellengeprueft"})

package = {"schema_version": "wissensquiz-redaktion-personen-v1", "package_id": "SCHAUSPIELER-BILD-20261007", "title": "200 Schauspielerinnen und Schauspieler am Porträt erkennen", "language": "de", "created_on": "2026-10-07", "status": "redaktionell_quellengeprueft", "integration_note": "Ausdrücklich beauftragtes Erkennungspaket: genau ein Gesichts-Ziel pro Person, keine acht zusätzlichen Karrierefragen pro Person. Fotos echter Personen, keine synthetischen Rollenbilder.", "actors": [{"actor_id": a["actor_id"], "name": a["name"], "selection_group": "Schauspieler" if gender(a) == "male" else "Schauspielerinnen", "question_ids": [questions[i]["question_id"]]} for i, a in enumerate(actors)], "questions": questions}
(OUT / "Schauspieler_Bilderkennung_200_Fragen.json").write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

columns = ["question_id", "knowledge_id", "variant_of", "language", "domain", "subdomain", "difficulty", "question_type", "question", "answer_a", "answer_b", "answer_c", "answer_d", "correct_answer", "feedback_a", "feedback_b", "feedback_c", "feedback_d", "explanation_short", "explanation_context", "memory_anchor", "source_urls", "topic_tags", "badge_tags", "learning_objective", "verification_status", "person_id", "person_name", "person_name_before_answer", "question_image_id", "film_refs"]
stream = io.StringIO(newline="")
writer = csv.DictWriter(stream, fieldnames=columns, quoting=csv.QUOTE_ALL, lineterminator="\n")
writer.writeheader()
for q, actor in zip(questions, actors):
    row = {key: q.get(key, "") for key in columns}
    row.update({"variant_of": "", "language": "de", "domain": "Film", "subdomain": "Schauspieler", "explanation_context": q["additional_info"], "source_urls": "|".join(q["source_urls"]), "topic_tags": "Schauspieler|Bilderkennung", "badge_tags": "", "learning_objective": f"Das Gesicht von {actor['name']} dem öffentlichen Schauspielernamen zuordnen.", "person_id": actor["actor_id"], "person_name": actor["name"], "person_name_before_answer": "false", "film_refs": ";".join(q["film_refs"])})
    for letter, answer in zip("abcd", q["answers"]):
        row[f"answer_{letter}"] = answer["text"]
        row[f"feedback_{letter}"] = answer["feedback"]
    writer.writerow(row)
content = stream.getvalue().encode("utf-8")
filename = "Schauspieler_Bilderkennung_200_Fragen.csv"
(RAW / filename).write_bytes(content)
(ROOT / "public/schauspieler-bilder-fragen.csv").write_bytes(content)
assert len(list(csv.DictReader(io.StringIO(content.decode())))) == 200
lines = ["# Schauspieler am Porträt erkennen", "", "200 Personen, je eine neue Bildfrage. Die Lesefassung zeigt die Lösungen unmittelbar.", ""]
for actor, q in zip(actors, questions):
    lines += [f"## {actor['name']} · {q['difficulty']}", "", f"![Porträt von {actor['name']}](../../public{portraits[actor['actor_id']]['src']})", "", q["question"], ""]
    lines += [f"- {a['id']}: {a['text']}{' ✓' if a['id'] == q['correct_answer'] else ''}" for a in q["answers"]]
    lines += ["", q["additional_info"], "", f"[Bild und Lizenz]({portraits[actor['actor_id']]['sourceUrl']}) · [Biografie]({actor['biography_url']})", ""]
(OUT / "Lesefassung.md").write_text("\n".join(lines), encoding="utf-8")
print(json.dumps({"questions": 200, "persons": 200, "gender": {g: sum(gender(a) == g for a in actors) for g in ['male','female']}, "levels": {d: sum(q['difficulty'] == d for q in questions) for d in ['leicht','mittel','schwer','experte']}, "csvSha256": hashlib.sha256(content).hexdigest()}))

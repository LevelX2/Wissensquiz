"""Read missing film metadata for the portrait questions' career connections."""
import concurrent.futures
import hashlib
import json
import pathlib
import re
import sys
import urllib.parse

import requests
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(".")
WORK = ROOT / ".sites-runtime/actor-recognition/films"
WORK.mkdir(parents=True, exist_ok=True)
OUT = ROOT / "docs/Schauspieler-Bilderkennung-2026-10-07"
references = {
    "176": ["Butch Cassidy and the Sundance Kid|1969"],
    "177": ["Butch Cassidy and the Sundance Kid|1969", "The Sting|1973", "The Color of Money|1986"],
    "178": ["Casablanca|1942", "The Maltese Falcon|1941"],
    "179": ["It's a Wonderful Life|1946", "Rear Window|1954"],
    "180": ["North by Northwest|1959", "Bringing Up Baby|1938"],
    "181": ["To Kill a Mockingbird|1962"],
    "182": ["A Streetcar Named Desire|1951", "The Godfather|1972"],
    "183": ["East of Eden|1955", "Rebel Without a Cause|1955", "Giant|1956"],
    "184": ["Bullitt|1968", "The Great Escape|1963", "Papillon|1973"],
    "185": ["Lilies of the Field|1963", "In the Heat of the Night|1967"],
    "186": ["Le Samouraï|1967", "Purple Noon|1960", "The Leopard|1963"],
    "187": ["Breathless|1960"],
    "188": ["Malèna|2000", "The Matrix Reloaded|2003", "The Matrix Revolutions|2003", "Spectre|2015"],
    "189": ["The Umbrellas of Cherbourg|1964", "Belle de Jour|1967"],
    "190": ["The Story of Adèle H.|1975", "Camille Claudel|1988"],
    "191": ["Persona|1966", "Cries and Whispers|1972"],
    "192": ["Carrie|1976", "Coal Miner's Daughter|1980"],
    "193": ["Beauty and the Beast|2017"],
    "194": ["Scream 4|2011", "We're the Millers|2013"],
    "195": ["Spencer|2021"],
    "196": ["Labyrinth|1986", "A Beautiful Mind|2001"],
    "197": ["My Week with Marilyn|2011", "Manchester by the Sea|2016"],
    "198": ["Ex Machina|2014", "The Danish Girl|2015", "Tomb Raider|2018"],
    "199": ["The Girl with the Dragon Tattoo|2011", "Carol|2015"],
    "200": ["Before Sunrise|1995", "Before Sunset|2004", "Before Midnight|2013", "2 Days in Paris|2007"],
}
(OUT / "Filmverweise.json").write_text(json.dumps(references, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
known = set()
for filename in ["src/filmFacts.json", "src/actorFilmFacts.json", "src/actorSupplementFilmFacts.json", "src/awardFilmFacts.json"]:
    known.update(f["film"] for f in json.loads((ROOT / filename).read_text(encoding="utf-8")))
for filename in ["src/film240Metadata.json", "KI-Wissen-Wissensquiz/01 Rohquellen/Alle_Genres_120_Filme_Filmdaten.json"]:
    known.update(f["film_title_original"] + "|" + str(f["film_year"]) for f in json.loads((ROOT / filename).read_text(encoding="utf-8"))["films"])
keys = sorted({key for refs in references.values() for key in refs} - known)

def fetch(key):
    title, year = key.rsplit("|", 1)
    for article in [title + " (" + year + " film)", title + " (film)", title]:
        url = "https://en.wikipedia.org/wiki/" + urllib.parse.quote(article.replace(" ", "_"), safe="()_:'")
        target = WORK / (hashlib.sha256(url.encode()).hexdigest()[:16] + ".html")
        try:
            if target.exists():
                content = target.read_bytes()
            else:
                response = requests.get(url, headers={"User-Agent": "Wissensquiz/1.0 film metadata research"}, timeout=35)
                if response.status_code != 200:
                    continue
                content = response.content
                target.write_bytes(content)
            soup = BeautifulSoup(content, "html.parser")
            table = soup.find("table", class_="infobox")
            if not table:
                continue
            fields = {}
            for row in table.find_all("tr"):
                th, td = row.find("th"), row.find("td")
                if not th or not td:
                    continue
                for sup in td.find_all("sup"):
                    sup.decompose()
                fields[th.get_text(" ", strip=True)] = td.get_text(" | ", strip=True)
            release = fields.get("Release date", fields.get("Release dates", ""))
            years = re.findall(r"\b(?:19|20)\d{2}\b", release)
            directors = fields.get("Directed by", "").split(" | ")
            countries = fields.get("Country", fields.get("Countries", "")).split(" | ")
            if not years or min(years) != year or not directors[0] or not countries[0]:
                continue
            cast = fields.get("Starring", "")
            translated = {"United States": "USA", "United Kingdom": "Vereinigtes Königreich", "France": "Frankreich", "Italy": "Italien", "Sweden": "Schweden", "Denmark": "Dänemark", "Germany": "Deutschland", "Canada": "Kanada", "Australia": "Australien", "Spain": "Spanien", "New Zealand": "Neuseeland", "Belgium": "Belgien", "Greece": "Griechenland", "Austria": "Österreich", "Chile": "Chile", "West Germany": "Bundesrepublik Deutschland"}
            if key == "The Matrix Revolutions|2003":
                directors = ["Lana Wachowski", "Lilly Wachowski"]
            originals = {"Purple Noon": "Plein soleil", "The Leopard": "Il Gattopardo", "Breathless": "À bout de souffle", "The Umbrellas of Cherbourg": "Les Parapluies de Cherbourg", "The Story of Adèle H.": "L’Histoire d’Adèle H.", "Cries and Whispers": "Viskningar och rop"}
            fact = {"id": "ACTOR-IMAGE-FILM-" + hashlib.sha256(key.encode()).hexdigest()[:12], "film": key, "originalTitle": originals.get(title, title), "year": int(year), "directors": list(dict.fromkeys(directors)), "productionCountries": [translated.get(c, c) for c in dict.fromkeys(countries)], "series": None, "source": url, "releaseNote": "", "directorNote": "", "directorContext": "", "additionalSources": []}
            evidence = {"film": key, "url": url, "checkedOn": "2026-10-07", "sha256_html": hashlib.sha256(content).hexdigest(), "release": release, "directors": directors, "countries": countries, "cast": cast}
            return {"fact": fact, "evidence": evidence}
        except requests.RequestException:
            continue
    return {"failed": key}

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(fetch, keys))
failures = [r for r in results if "failed" in r]
(ROOT / "src/actorRecognitionFilmFacts.json").write_text(json.dumps([r["fact"] for r in results if "fact" in r], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(OUT / "Filmquellenpruefung.json").write_text(json.dumps({"checkedOn": "2026-10-07", "sources": [r["evidence"] for r in results if "evidence" in r], "failures": failures}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"added": len(results) - len(failures), "failed": failures}, ensure_ascii=False))

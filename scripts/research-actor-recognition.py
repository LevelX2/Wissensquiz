"""Research the 200 explicitly requested portrait recognition questions.

Keeps the original Wikimedia API responses and downloaded image bytes.
Run from the repository root; unresolved images require editorial selection.
"""
import concurrent.futures
import hashlib
import html
import json
import pathlib
import re
import sys
import time
import urllib.parse

import requests
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(".")
RAW = ROOT / "KI-Wissen-Wissensquiz/01 Rohquellen/Schauspieler-Bilderkennung-2026-10-07"
RAW.mkdir(parents=True, exist_ok=True)
WORK = ROOT / ".sites-runtime/actor-recognition"
WORK.mkdir(parents=True, exist_ok=True)
HEADERS = {"User-Agent": "Wissensquiz/1.0 (educational actor portrait research)"}

packages = [
    "docs/Schauspieler-Fragenpaket/Schauspieler_100_Personen_800_Fragen.json",
    "docs/Schauspieler-Ergaenzung-P02/Schauspieler_25_Personen_200_Fragen.json",
    "docs/Schauspieler-Ergaenzung-P03/Schauspieler_50_Personen_400_Fragen.json",
]
actors = []
for path in packages:
    package = json.loads((ROOT / path).read_text(encoding="utf-8"))
    for actor in package["actors"]:
        questions = [q for q in package["questions"] if q["actor_id"] == actor["actor_id"]]
        article = next(u for q in questions for u in q["source_urls"] if u.startswith("https://en.wikipedia.org/wiki/"))
        if actor["name"] == "Chow Yun-fat":
            article = "https://en.wikipedia.org/wiki/Chow_Yun-fat"
        actors.append({**actor, "article": urllib.parse.unquote(article.split("/wiki/")[1]), "existing_questions": questions})
new_men = ["Robert Redford", "Paul Newman", "Humphrey Bogart", "James Stewart", "Cary Grant", "Gregory Peck", "Marlon Brando", "James Dean", "Steve McQueen", "Sidney Poitier", "Alain Delon", "Jean-Paul Belmondo"]
new_women = ["Monica Bellucci", "Catherine Deneuve", "Isabelle Adjani", "Liv Ullmann", "Sissy Spacek", "Emma Watson", "Emma Roberts", "Kristen Stewart", "Jennifer Connelly", "Michelle Williams", "Alicia Vikander", "Rooney Mara", "Julie Delpy"]
for i, name in enumerate(new_men + new_women, 176):
    article = {"James Stewart": "James Stewart", "Michelle Williams": "Michelle Williams (actress)"}.get(name, name)
    actors.append({"actor_id": f"ACTOR-{i:03}", "name": name, "selection_group": "Schauspieler" if i < 188 else "Schauspielerinnen", "article": article})
assert len(actors) == len({a["name"] for a in actors}) == 200

def api(domain, params, name):
    dest = RAW / name
    if dest.exists():
        return json.loads(dest.read_text(encoding="utf-8"))
    for attempt in range(8):
        response = requests.get(f"https://{domain}/w/api.php", params={"action": "query", "format": "json", **params}, headers=HEADERS, timeout=45)
        if response.status_code == 429:
            print(f"Rate limit for {name}; waiting before retry", flush=True)
            time.sleep(min(50, 10 * (attempt + 1)))
            continue
        response.raise_for_status()
        data = response.json()
        if "error" in data:
            raise RuntimeError(data["error"])
        dest.write_bytes(response.content)
        print(f"Saved {name}", flush=True)
        time.sleep(5)
        return data
    raise RuntimeError("Wikimedia rate limit")

wiki_pages = {}
for offset in range(0, 200, 25):
    data = api("en.wikipedia.org", {"titles": "|".join(a["article"] for a in actors[offset:offset + 25]), "prop": "pageimages|extracts", "piprop": "name|original", "exintro": 1, "explaintext": 1, "exlimit": "max", "redirects": 1}, f"Wikipedia-{offset // 25 + 1:02}.json")
    for page in data["query"]["pages"].values():
        wiki_pages[page["title"]] = page
    for redirect in data["query"].get("redirects", []) + data["query"].get("normalized", []):
        if redirect["to"] in wiki_pages:
            wiki_pages[redirect["from"]] = wiki_pages[redirect["to"]]

missing = [a for a in actors if not wiki_pages.get(a["article"], {}).get("extract")]
for offset in range(0, len(missing), 20):
    titles_missing = "|".join(a["article"] for a in missing[offset:offset + 20])
    key = hashlib.sha256(titles_missing.encode()).hexdigest()[:12]
    data = api("en.wikipedia.org", {"titles": titles_missing, "prop": "pageimages|extracts", "piprop": "name|original", "exintro": 1, "explaintext": 1, "exlimit": "max", "redirects": 1}, f"Wikipedia-extra-{key}.json")
    for page in data["query"]["pages"].values():
        wiki_pages[page["title"]] = page
    for redirect in data["query"].get("redirects", []) + data["query"].get("normalized", []):
        if redirect["to"] in wiki_pages:
            wiki_pages[redirect["from"]] = wiki_pages[redirect["to"]]

old = json.loads((ROOT / "src/actorPortraits.json").read_text(encoding="utf-8"))
previous_path = ROOT / "src/actorRecognitionPortraits.json"
previous = json.loads(previous_path.read_text(encoding="utf-8")) if previous_path.exists() else {}
overrides_path = RAW / "Bildauswahl.json"
overrides = json.loads(overrides_path.read_text(encoding="utf-8")) if overrides_path.exists() else {}
for actor in actors:
    page = wiki_pages.get(actor["article"], {})
    actor["biography"] = page.get("extract", "")
    actor["biography_url"] = "https://en.wikipedia.org/wiki/" + urllib.parse.quote(page.get("title", actor["article"]).replace(" ", "_"))
    actor["image_title"] = overrides.get(actor["actor_id"], old.get(actor["actor_id"], {}).get("title") or page.get("pageimage"))
titles = list(dict.fromkeys("File:" + a["image_title"] for a in actors if a["image_title"]))
commons = {}
for offset in range(0, len(titles), 25):
    key = hashlib.sha256("|".join(titles[offset:offset + 25]).encode()).hexdigest()[:12]
    data = api("commons.wikimedia.org", {"titles": "|".join(titles[offset:offset + 25]), "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 400}, f"Commons-{key}.json")
    for page in data["query"]["pages"].values():
        commons[page["title"].removeprefix("File:")] = page
    for normalized in data["query"].get("normalized", []):
        if normalized["to"].removeprefix("File:") in commons:
            commons[normalized["from"].removeprefix("File:")] = commons[normalized["to"].removeprefix("File:")]

def plain(value):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", " ", value))).strip()

def download(actor):
    person = actor["actor_id"]
    info = commons.get(actor["image_title"], {}).get("imageinfo", [{}])[0]
    meta = info.get("extmetadata", {})
    get = lambda key: meta.get(key, {}).get("value", "")
    license_name = plain(get("LicenseShortName"))
    if not re.fullmatch(r"CC BY(?:-SA)? (?:2\.0|2\.5|3\.0|4\.0)|CC0|Public domain", license_name):
        return {"failed": person, "name": actor["name"], "reason": "license", "license": license_name, "title": actor["image_title"]}
    if not info.get("thumburl") or not actor["biography"]:
        return {"failed": person, "name": actor["name"], "reason": "missing image or biography", "title": actor["image_title"]}
    if person in old and person not in overrides:
        portrait = old[person].copy()
        path = ROOT / ("public" + portrait["src"])
        url = info["thumburl"]
    else:
        extension = ".png" if actor["image_title"].lower().endswith(".png") else ".jpg"
        path = ROOT / f"public/portraits/recognition/{person.lower()}{extension}"
        mistaken_path = path.with_suffix(".jpg")
        if extension == ".png" and mistaken_path.exists() and not path.exists():
            mistaken_path.replace(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        url = info["thumburl"]
        if not path.exists() or previous.get(person, {}).get("title") != actor["image_title"]:
            for attempt in range(4):
                response = requests.get(url, headers=HEADERS, timeout=45)
                if response.status_code in (429, 503):
                    time.sleep(3 * (attempt + 1))
                    continue
                response.raise_for_status()
                path.write_bytes(response.content)
                break
        with Image.open(path) as im:
            if im.format not in ("JPEG", "PNG"):
                return {"failed": person, "name": actor["name"], "reason": "not JPEG", "title": actor["image_title"]}
            width, height = im.size
        credit = plain(get("Attribution") or get("Artist"))
        source = info["descriptionurl"]
        links = re.findall(r'href="(https?://[^" ]+)"', get("Artist"))
        portrait = {"personId": person, "name": actor["name"], "src": "/" + path.relative_to(ROOT / "public").as_posix(), "width": width, "height": height, "title": actor["image_title"], "photographer": credit or "Urheber laut Commons-Dateiseite", "photographerUrl": html.unescape(links[0]) if links else source, "sourceUrl": source, "license": license_name, "licenseUrl": get("LicenseUrl") or "https://commons.wikimedia.org/wiki/Help:Public_domain", "changes": "Verkleinerte Commons-Datei; keine eigene Retusche oder Beschneidung."}
        if portrait["licenseUrl"].startswith("//"):
            portrait["licenseUrl"] = "https:" + portrait["licenseUrl"]
    content = path.read_bytes()
    return {"portrait": portrait, "evidence": {"personId": person, "name": actor["name"], "sourceUrl": info["descriptionurl"], "downloadUrl": url, "sha256": hashlib.sha256(content).hexdigest(), "bytes": len(content), "width": portrait["width"], "height": portrait["height"], "reused": person in old and person not in overrides, "license": license_name, "artist": plain(get("Artist")), "attribution": plain(get("Attribution")), "description": plain(get("ImageDescription")), "biographyUrl": actor["biography_url"]}}

results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    for i, result in enumerate(pool.map(download, actors), 1):
        results.append(result)
        if i % 20 == 0:
            print(f"Researched {i}/200 portraits", flush=True)
failures = [r for r in results if "failed" in r]
(WORK / "actors.json").write_text(json.dumps(actors, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(WORK / "failures.json").write_text(json.dumps(failures, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "src/actorRecognitionPortraits.json").write_text(json.dumps({r["portrait"]["personId"]: r["portrait"] for r in results if "portrait" in r}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(RAW / "Nachweis.json").write_text(json.dumps({"checkedOn": "2026-10-07", "images": [r["evidence"] for r in results if "evidence" in r]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"success": 200 - len(failures), "failed": failures}, ensure_ascii=False), flush=True)

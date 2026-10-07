"""Research a second, earlier career-period portrait; preserve all original sources.

Run: python scripts/research-actor-periods.py search|select|thumbnails|download|contacts|gallery
Curated choices: .../Schauspieler-Bildvarianten-2026-10-07/Bildauswahl.json
Searches are candidates, not proof of person identity; visually review every choice.
"""
import concurrent.futures
import hashlib
import html
import json
import re
import sys
import time
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "KI-Wissen-Wissensquiz/01 Rohquellen/Schauspieler-Bildvarianten-2026-10-07"
WORK = ROOT / ".sites-runtime/actor-periods"
RAW.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)
HEADERS = {"User-Agent": "Wissensquiz/1.0 (educational actor portrait research)"}
previous_raw = ROOT / "KI-Wissen-Wissensquiz/01 Rohquellen/Schauspieler-Bilderkennung-2026-10-07"
proofs = {p["personId"]: p for p in json.loads((previous_raw / "Nachweis.json").read_text("utf-8"))["images"]}
wiki = {}
for path in previous_raw.glob("Wikipedia-*.json"):
    data = json.loads(path.read_text("utf-8"))
    for page in data["query"]["pages"].values():
        if page.get("extract"):
            wiki[page["title"]] = page["extract"]
from urllib.parse import unquote
package = json.loads((ROOT / "docs/Schauspieler-Bilderkennung-2026-10-07/Schauspieler_Bilderkennung_200_Fragen.json").read_text("utf-8"))
actors = []
for person in package["actors"]:
    url = proofs[person["actor_id"]]["biographyUrl"]
    title = unquote(url.rsplit("/", 1)[-1]).replace("_", " ")
    actors.append({**person, "biography_url": url, "biography": wiki[title]})
primary = json.loads((ROOT / "src/actorRecognitionPortraits.json").read_text("utf-8"))
LICENSE = r"CC BY(?:-SA)? (?:2\.0|2\.5|3\.0|4\.0)(?: de| kr)?|CC0|Public domain"


def plain(value):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", " ", value))).strip()


def api(params, filename):
    path = RAW / filename
    if path.exists():
        return json.loads(path.read_text("utf-8"))
    for attempt in range(18):
        r = requests.get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "format": "json", **params}, headers=HEADERS, timeout=60)
        if r.status_code in (429, 503):
            time.sleep(max(5, int(r.headers.get("Retry-After", "5"))))
            continue
        r.raise_for_status()
        data = r.json()
        if "error" in data:
            raise RuntimeError(data["error"])
        path.write_bytes(r.content)
        time.sleep(4)
        return data
    raise RuntimeError(f"Rate limited: {filename}")


def candidate(page, actor):
    if "imageinfo" not in page:
        return None
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    get = lambda key: plain(meta.get(key, {}).get("value", ""))
    title = page["title"].removeprefix("File:")
    if not re.fullmatch(LICENSE, get("LicenseShortName")) or not title.lower().endswith((".jpg", ".jpeg", ".png")):
        return None
    def original_name(name):
        name = name.replace("_", " ").lower()
        name = re.sub(r"\([^)]*(?:crop|trim|retouch|edit)[^)]*\)", "", name)
        return re.sub(r"\s+\.", ".", re.sub(r"\s+", " ", name)).strip()
    if original_name(title) == original_name(primary[actor["actor_id"]]["title"]):
        return None
    if re.search(r"wax|statue|signature|autograph|graffiti|\bgrave\b|gravestone|tomb|mural|drawing|painting|caricature|vandal|plaque|poster|funeral|look.alike|impersonator|cosplay|theat(?:er|re)|backside|back side|rugby|cricket|basketball|corrections|mugshot|mug shot|buste|bust of|sculpt|hamilton khaki|street|straßen|apartment|passerelle|\bbridge\b", title, re.I):
        return None
    date = get("DateTimeOriginal")
    year_match = re.search(r"\b(?:18|19|20)\d{2}\b", date)
    year_source = "DateTimeOriginal"
    if not year_match:
        year_match = re.search(r"\b(?:18|19|20)\d{2}\b", title)
        year_source = "Dateititel"
    year = int(year_match.group()) if year_match else None
    birth = int(re.search(r"\b(?:18|19|20)\d{2}\b", actor["biography"][:300]).group())
    target = min(2016, birth + 35)
    target = {"ACTOR-009": 1995, "ACTOR-059": 2004, "ACTOR-060": 1996, "ACTOR-165": 2007, "ACTOR-183": 1954}.get(actor["actor_id"], target)
    ratio = info["width"] / info["height"]
    score = abs((year or 2026) - target)
    score += 35 if year is None else 0
    score += 15 if ratio > 1.5 else 0
    score += 6 if ratio > 1.0 else 0
    score -= 5 if re.search(r"cropped|portrait|headshot", title, re.I) else 0
    score += 16 if re.search(r"\b(and|with|und|et)\b| & |,", title, re.I) else 0
    score += 15 if min(info["width"], info["height"]) < 170 else 0
    if year and (year < birth + 18 or year > birth + 60):
        score += 15
    return {"title": title, "year": year, "date": date, "yearSource": year_source, "birth": birth, "target": target, "score": score, "license": get("LicenseShortName"), "description": get("ImageDescription"), "info": info}


def search(actor):
    name = {"Toshirō Mifune": "Toshiro Mifune", "Chow Yun-fat": "Chow Yun", "Shah Rukh Khan": "Shah Rukh Khan", "Renée Zellweger": "Zellweger"}.get(actor["name"], actor["name"])
    data = api({"generator": "search", "gsrsearch": f'intitle:"{name}"', "gsrnamespace": 6, "gsrlimit": 100, "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 400}, f"Suche-{actor['actor_id']}.json")
    items = [c for page in data.get("query", {}).get("pages", {}).values() if (c := candidate(page, actor))]
    return {"personId": actor["actor_id"], "name": actor["name"], "candidates": sorted(items, key=lambda c: (c["score"], c["title"]))}


def download(actor, selected, all_candidates):
    person = actor["actor_id"]
    title = selected[person]
    candidates = all_candidates[person]["candidates"]
    match = next((c for c in candidates if c["title"] == title), None)
    if not match:
        for cache in [*RAW.glob("Auswahlbatch-*.json"), *RAW.glob("Suche-extra-*.json")]:
            data = json.loads(cache.read_text("utf-8"))
            page = next((p for p in data.get("query", {}).get("pages", {}).values() if p["title"] == "File:" + title), None)
            if page:
                match = candidate(page, actor)
                break
    if not match:
        data = api({"titles": "File:" + title, "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 400}, f"Auswahl-{person}-{hashlib.sha256(title.encode()).hexdigest()[:10]}.json")
        match = candidate(next(iter(data["query"]["pages"].values())), actor)
    assert match, (person, title)
    info = match["info"]
    for cache in RAW.glob("Vorschaumetadaten-*.json"):
        data = json.loads(cache.read_text("utf-8"))
        page = next((p for p in data.get("query", {}).get("pages", {}).values() if p["title"] == "File:" + title), None)
        if page and "imageinfo" in page:
            info = page["imageinfo"][0]
            break
    meta = info["extmetadata"]
    get = lambda k: meta.get(k, {}).get("value", "")
    ext = ".png" if title.lower().endswith(".png") else ".jpg"
    path = ROOT / f"public/portraits/recognition-periods/{person.lower()}{ext}"
    path.parent.mkdir(parents=True, exist_ok=True)
    marker = WORK / f"{person}.title"
    receipt_path = WORK / f"{person}.download.json"
    receipt = json.loads(receipt_path.read_text("utf-8")) if receipt_path.exists() else {}
    actual_url = receipt.get("url") if receipt.get("title") == title else match["info"]["thumburl"]
    # Existing verified downloads remain unchanged, regardless of preview size.
    if not path.exists() or not marker.exists() or marker.read_text("utf-8") != title:
        for attempt in range(18):
            r = requests.get(info["thumburl"], headers=HEADERS, timeout=60)
            if r.status_code in (429, 503):
                delay = max(5, int(r.headers.get("Retry-After", "5")))
                print(f"Wikimedia-Wartezeit: {person}, {delay} s", flush=True)
                time.sleep(delay)
                continue
            r.raise_for_status()
            path.write_bytes(r.content)
            marker.write_text(title, encoding="utf-8")
            actual_url = info["thumburl"]
            receipt_path.write_text(json.dumps({"title": title, "url": actual_url}), encoding="utf-8")
            time.sleep(2)
            break
        else:
            raise RuntimeError(title)
    with Image.open(path) as im:
        assert im.format in ("JPEG", "PNG"), title
        width, height = im.size
    source = info["descriptionurl"]
    links = re.findall(r'href="(https?://[^" ]+)"', get("Artist"))
    license_url = get("LicenseUrl") or "https://commons.wikimedia.org/wiki/Help:Public_domain"
    if license_url.startswith("//"):
        license_url = "https:" + license_url
    portrait = {"personId": person, "name": actor["name"], "src": "/" + path.relative_to(ROOT / "public").as_posix(), "width": width, "height": height, "title": title, "photographer": plain(get("Attribution") or get("Artist")) or "Urheber laut Commons-Dateiseite", "photographerUrl": html.unescape(links[0]) if links else source, "sourceUrl": source, "license": match["license"], "licenseUrl": license_url, "changes": "Verkleinerte Commons-Datei; keine eigene Retusche oder Beschneidung."}
    crops_path = RAW / "Anzeigeausschnitte.json"
    if crops_path.exists():
        crop = json.loads(crops_path.read_text("utf-8")).get(person)
        if crop:
            assert crop["x"] >= 0 and crop["y"] >= 0 and crop["x"] + crop["width"] <= width and crop["y"] + crop["height"] <= height
            portrait["crop"] = crop
            portrait["changes"] = "Verkleinerte Commons-Datei unverändert; die Anzeige zeigt einen Ausschnitt der gesuchten Person. Keine Retusche."
    content = path.read_bytes()
    evidence = {"personId": person, "name": actor["name"], "sourceUrl": source, "downloadUrl": actual_url, "title": title, "sha256": hashlib.sha256(content).hexdigest(), "bytes": len(content), "width": width, "height": height, "license": match["license"], "artist": plain(get("Artist")), "attribution": plain(get("Attribution")), "description": match["description"], "date": match["date"], "year": match["year"], "yearSource": match["yearSource"], "biographyUrl": actor["biography_url"]}
    # Keep source metadata intact, but make corrected/uncertain dating explicit.
    dating = json.loads((RAW / "Datierungshinweise.json").read_text("utf-8")).get(person, {})
    evidence["period"] = dating.get("period") or (str(match["year"]) if match["year"] else "nicht genau datiert")
    if dating:
        evidence["datingNote"] = dating["reason"]
    return {"portrait": portrait, "evidence": evidence}


if sys.argv[1] in ("search", "select"):
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        for i, result in enumerate(pool.map(search, actors), 1):
            results.append(result)
            if i % 10 == 0:
                print(f"Recherche {i}/200", flush=True)
    (WORK / "candidates.json").write_text(json.dumps({r["personId"]: r for r in results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    selection = RAW / "Bildauswahl.json"
    if sys.argv[1] == "select" or not selection.exists():
        choices = {r["personId"]: r["candidates"][0]["title"] for r in results if r["candidates"]}
        curated = RAW / "Redaktion.json"
        if curated.exists():
            choices.update(json.loads(curated.read_text("utf-8")))
        selection.write_text(json.dumps(choices, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Recherche abgeschlossen", flush=True)
elif sys.argv[1] == "thumbnails":
    choices = json.loads((RAW / "Bildauswahl.json").read_text("utf-8"))
    for offset in range(0, len(choices), 25):
        titles = list(choices.values())[offset:offset + 25]
        key = hashlib.sha256("|".join(titles).encode()).hexdigest()[:12]
        api({"titles": "|".join("File:" + t for t in titles), "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 250}, f"Vorschaumetadaten-{key}.json")
        print(f"Vorschauquellen {min(offset + 25, len(choices))}/200", flush=True)
elif sys.argv[1] == "download":
    selected = json.loads((RAW / "Bildauswahl.json").read_text("utf-8"))
    candidates = json.loads((WORK / "candidates.json").read_text("utf-8"))
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        for i, result in enumerate(pool.map(lambda a: download(a, selected, candidates), actors), 1):
            results.append(result)
            (WORK / "download-progress.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
            if i % 20 == 0:
                print(f"Download {i}/200", flush=True)
    (ROOT / "src/actorRecognitionAlternatePortraits.json").write_text(json.dumps({r["portrait"]["personId"]: r["portrait"] for r in results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (RAW / "Nachweis.json").write_text(json.dumps({"checkedOn": "2026-10-07", "images": [r["evidence"] for r in results]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
elif sys.argv[1] == "contacts":
    registry = json.loads((ROOT / "src/actorRecognitionAlternatePortraits.json").read_text("utf-8"))
    evidence = {r["personId"]: r for r in json.loads((RAW / "Nachweis.json").read_text("utf-8"))["images"]}
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 15)
    for start in range(0, 200, 40):
        sheet = Image.new("RGB", (1200, 1680), "white")
        draw = ImageDraw.Draw(sheet)
        for index, (pid, portrait) in enumerate(list(registry.items())[start:start + 40]):
            x, y = (index % 8) * 150, (index // 8) * 336
            with Image.open(ROOT / ("public" + portrait["src"])) as im:
                if "crop" in portrait:
                    c = portrait["crop"]
                    im = im.crop((c["x"], c["y"], c["x"] + c["width"], c["y"] + c["height"]))
                thumb = ImageOps.contain(im.convert("RGB"), (146, 272))
                sheet.paste(thumb, (x + (150 - thumb.width) // 2, y))
            draw.text((x + 2, y + 275), pid + " · " + evidence[pid]["period"], fill="black", font=font)
            name = portrait["name"]
            for row, part in enumerate([name[:19], name[19:]]):
                draw.text((x + 2, y + 296 + row * 18), part, fill="black", font=font)
        sheet.save(WORK / f"contact-{start // 40 + 1}.jpg", quality=92)
elif sys.argv[1] == "gallery":
    alternate = json.loads((ROOT / "src/actorRecognitionAlternatePortraits.json").read_text("utf-8"))
    evidence = {p["personId"]: p for p in json.loads((RAW / "Nachweis.json").read_text("utf-8"))["images"]}
    notes = json.loads((RAW / "Datierungshinweise.json").read_text("utf-8"))
    lines = ["# Alle 200 Bildpaare", "", "Je Person zwei verschiedene Fotos. Die App wählt pro Begegnung ein Foto und behält es bis einschließlich der Lösung und des Rückblicks. Hier stehen die Namen zur redaktionellen Prüfung ausdrücklich dabei.", "", "Die Vorschaubilder zeigen die unveränderten Dateien. In der App werden die dokumentierten Anzeigeausschnitte verwendet, damit nur das gesuchte Gesicht im Mittelpunkt steht. Die Datierung folgt Commons-Dateititel und -Beschreibung; bekannte Upload-/Aufnahme-Unterschiede sind ausdrücklich korrigiert. Nahe Karrierejahre werden nicht als weit getrennte Lebensphasen ausgegeben.", ""]
    for actor in actors:
        pid = actor["actor_id"]
        old, new = primary[pid], alternate[pid]
        proof = evidence[pid]
        year_match = re.search(r"\b(?:18|19|20)\d{2}\b", proof["date"])
        date = notes.get(pid, {}).get("period") or (year_match.group() if year_match else "nicht genau datiert")
        lines += [f"## {actor['name']}", "", "Bisheriges Foto:", "", f"![Bisheriges Foto von {actor['name']}](../../public{old['src']})", "", f"[{old['title']}]({old['sourceUrl']}) · {old['license']}", "", f"Ergänzung · Datierung laut Quelle: {date}", "", f"![Weiteres Foto von {actor['name']}](../../public{new['src']})", "", f"[{new['title']}]({new['sourceUrl']}) · {new['license']}", ""]
        if pid in notes:
            lines += [notes[pid]["reason"], ""]
        if "crop" in new:
            c = new["crop"]
            lines += [f"Anzeigeausschnitt der unveränderten Datei: x={c['x']}, y={c['y']}, Breite={c['width']}, Höhe={c['height']} Pixel.", ""]
    (ROOT / "docs/Schauspieler-Bilderkennung-2026-10-07/Bildpaare.md").write_text("\n".join(lines), encoding="utf-8")

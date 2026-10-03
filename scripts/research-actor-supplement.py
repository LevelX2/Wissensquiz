"""Read-only public source fetch. Whole pages remain in ignored research cache."""
import concurrent.futures, hashlib, json, pathlib, urllib.parse
from datetime import date
import requests
from bs4 import BeautifulSoup

root = pathlib.Path('.')
names = ['Kevin Costner','Russell Crowe','Hugh Jackman','Ryan Gosling','Robert Downey Jr.','Edward Norton','Nicolas Cage','Steve Martin','Jeff Bridges','Dustin Hoffman','Antonio Banderas','Ulrich Tukur','Armin Mueller-Stahl','Olivia Colman','Emily Blunt','Rachel Weisz','Tilda Swinton','Saoirse Ronan','Kirsten Dunst','Helena Bonham Carter','Jennifer Aniston','Julie Andrews','Isabelle Huppert','Hildegard Knef','Iris Berben']
cache = root / '.sites-runtime' / 'actor-supplement-research'
cache.mkdir(parents=True, exist_ok=True)
def fetch(task):
    name, lang = task
    article = name
    url = 'https://' + lang + '.wikipedia.org/wiki/' + urllib.parse.quote(article.replace(' ', '_'), safe='_.')
    saved = cache / (str(names.index(name)+101)+'-'+lang+'.json')
    if saved.exists():
        prior = json.loads(saved.read_text(encoding='utf8'))
        if len(prior.get('text','')) > 1000:
            return {k:v for k,v in prior.items() if k != 'text'}
    text = ''
    for suffix in ['', '?oldformat=true', '?action=render']:
        r = requests.get(url+suffix, timeout=40, headers={'User-Agent':'Wissensquiz public editorial preparation/1.0'})
        if r.status_code != 200: continue
        s = BeautifulSoup(r.text, 'html.parser')
        bodies = s.select('.mw-parser-output')
        body = max(bodies,key=lambda n:len(n.get_text())) if bodies else s
        for node in body.select('sup, .navbox, .reflist, .infobox, .metadata, .mw-editsection'):
            node.decompose()
        text = '\n'.join(p.get_text(' ', strip=True) for p in body.select('p, h2, h3') if p.get_text(strip=True))
        if len(text) > 1000: break
    if len(text) < 1000: raise RuntimeError('No readable biography: '+url)
    record = {'name': name, 'url': r.url, 'checked_on':date.today().isoformat(),'sha256_html':hashlib.sha256(r.content).hexdigest(),'text':text}
    (cache / (str(names.index(name)+101)+'-'+lang+'.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
    return {k:v for k,v in record.items() if k != 'text'}
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    for result in pool.map(fetch, [(n,l) for n in names for l in ['en','de']]):
        results.append(result)
(cache/'manifest.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'sources':len(results),'actors':len(names)}))

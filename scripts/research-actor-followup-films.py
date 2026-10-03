"""Fetch only public film metadata for the prepared editorial supplement."""
import concurrent.futures, hashlib, json, pathlib, re, urllib.parse
from datetime import date
import requests
from bs4 import BeautifulSoup

root=pathlib.Path('.')
raw=root/'KI-Wissen-Wissensquiz/01 Rohquellen/Schauspieler_50_Personen_400_Fragen_Redaktion.txt'
cache=root/'.sites-runtime/actor-followup-films'
cache.mkdir(parents=True,exist_ok=True)
refs={}
manual={r['film']:r for r in json.loads((root/'docs/Schauspieler-Ergaenzung-P03/Manuelle-Filmquellen.json').read_text(encoding='utf8'))}
for line in raw.read_text(encoding='utf8').splitlines():
    if line.startswith(('#','@')) or not line.strip(): continue
    parts=line.split('§')
    for ref in parts[7].split(' || '):
        if ref == '-': continue
        title,year,article=ref.split('~')
        refs[title+'|'+year]=(title,year,article)
def fetch(item):
    key,(title,year,article)=item
    if key in manual: return manual[key]
    saved=cache/(hashlib.sha256(key.encode()).hexdigest()[:16]+'.json')
    if saved.exists(): return json.loads(saved.read_text(encoding='utf8'))
    lang='de' if article.startswith('de:') or article == 'Die_weiße_Rose_(Film)' else 'en'
    article=urllib.parse.unquote(article.removeprefix('de:'))
    base='https://'+lang+'.wikipedia.org/wiki/'+urllib.parse.quote(article,safe='_.()!,:/')
    for suffix in ['', '?oldformat=true','?action=render']:
        try:
            r=requests.get(base+suffix,timeout=35,headers={'User-Agent':'Wissensquiz public editorial preparation/1.0'})
            if r.status_code != 200: continue
            s=BeautifulSoup(r.text,'html.parser')
            table=s.find('table',class_='infobox')
            if not table: continue
            fields={}
            for tr in table.find_all('tr'):
                th,td=tr.find('th'),tr.find('td')
                if not th or not td: continue
                for sup in td.find_all('sup'): sup.decompose()
                fields[th.get_text(' ',strip=True)]=td.get_text(' | ',strip=True)
            directors=fields.get('Directed by',fields.get('Regie','')).split(' | ')
            countries=fields.get('Country',fields.get('Countries',fields.get('Country of origin',fields.get('Produktionsland','')))).split(' | ')
            release=fields.get('Release date',fields.get('Release dates',fields.get('Release',fields.get('Erscheinungsjahr',''))))
            if not directors[0] or not countries[0] or not release: continue
            years=re.findall(r'\b(?:19|20)\d{2}\b',release)
            record={'film':key,'title':title,'year':int(year),'directors':list(dict.fromkeys(directors)),'countries':list(dict.fromkeys(countries)),'source_url':base,'checked_on':date.today().isoformat(),'sha256_html':hashlib.sha256(r.content).hexdigest(),'release_evidence':release,'release_year_match':bool(years and min(years)==year),'text':'\n'.join(p.get_text(' ',strip=True) for p in s.select('p') if p.get_text(strip=True))}
            saved.write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
            return record
        except requests.RequestException: continue
    return {'failed':key,'url':base}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results=list(pool.map(fetch,refs.items()))
(cache/'manifest.json').write_text(json.dumps([{k:v for k,v in r.items() if k!='text'} for r in results],ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'films':len(refs),'failed':[r for r in results if 'failed' in r],'year_mismatches':[r['film'] for r in results if r.get('release_year_match') is False]},ensure_ascii=False))

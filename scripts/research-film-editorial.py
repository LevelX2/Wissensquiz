"""Cache public film pages for editorial reading; never access player data.

Retrieval is not a claim of source verification. The final editorial evidence
identifies the statements actually read and used.
"""
import concurrent.futures, csv, hashlib, json, pathlib, re, urllib.parse
import requests
from bs4 import BeautifulSoup

ROOT=pathlib.Path('.')
OUT=ROOT/'data/filmplanung-2026-10-06/sources'
OUT.mkdir(parents=True,exist_ok=True)
selection=list(csv.DictReader((ROOT/'docs/Filmfragen-Ergaenzung-2026-10-06/Auswahl.tsv').open(encoding='utf-8'),delimiter='\t'))

def fetch(item):
    rank,film=item
    saved=OUT/f'{rank:03d}.json'
    if saved.exists() and json.loads(saved.read_text(encoding='utf-8')).get('extractor_version')==2:
        return json.loads(saved.read_text(encoding='utf-8'))
    url='https://en.wikipedia.org/wiki/'+urllib.parse.quote(urllib.parse.unquote(film['article']),safe="_.()!,:/'")
    for suffix in ['', '?oldformat=true','?action=render']:
        try:
            cached_html=OUT/f'{rank:03d}.html'
            if suffix=='' and cached_html.exists():
                raw=cached_html.read_bytes()
            else:
                response=requests.get(url+suffix,timeout=35,headers={'User-Agent':'Wissensquiz editorial research/1.0'})
                if response.status_code != 200: continue
                raw=response.content
            soup=BeautifulSoup(raw,'html.parser')
            table=soup.find('table',class_='infobox')
            if not table:
                continue
            fields={}
            for tr in table.find_all('tr'):
                th,td=tr.find('th'),tr.find('td')
                if not th or not td: continue
                for sup in td.find_all('sup'): sup.decompose()
                fields[th.get_text(' ',strip=True)]=td.get_text(' | ',strip=True)
            articles=soup.select('.mw-parser-output')
            article=max(articles,key=lambda t:len(t.get_text())) if articles else soup
            for tag in article.select('sup,script,style,.reflist,.navbox,.infobox,.hatnote,.toc'): tag.decompose()
            sections={'lead':[]}
            heading='lead'
            for tag in article.find_all(['h2','h3','p','ul']):
                if tag.name in ['h2','h3']:
                    heading=tag.get_text(' ',strip=True).replace('[ edit ]','').strip()
                    sections.setdefault(heading,[])
                else:
                    text=tag.get_text(' ',strip=True)
                    if text and len(text)>40:
                        sections[heading].append(text)
            release=fields.get('Release date',fields.get('Release dates',''))
            years=re.findall(r'\b(?:19|20)\d{2}\b',release)
            record={'extractor_version':2,'rank':rank,**film,'url':url,'retrieved_on':'2026-10-06','sha256_html':hashlib.sha256(raw).hexdigest(),'fields':fields,'release_evidence':release,'release_year_match':bool(years and min(map(int,years))==int(film['film_year'])),'sections':sections}
            saved.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
            (OUT/f'{rank:03d}.html').write_bytes(raw)
            return record
        except requests.RequestException:
            continue
    return {'rank':rank,'failed':film['film_title_de'],'url':url}

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    records=list(pool.map(fetch,enumerate(selection,1)))
(OUT/'manifest.json').write_text(json.dumps([{k:v for k,v in r.items() if k!='sections'} for r in records],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'films':len(records),'failed':[r for r in records if 'failed' in r],'year_mismatches':[{k:r[k] for k in ['rank','film_title_de','film_year','release_evidence']} for r in records if r.get('release_year_match') is False]},ensure_ascii=False))

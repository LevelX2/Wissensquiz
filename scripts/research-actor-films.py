import json, re, hashlib, concurrent.futures, urllib.parse, pathlib, time
import requests
from bs4 import BeautifulSoup

root = pathlib.Path('.')
keys = json.loads((root/'.sites-runtime/actor-missing-films.json').read_text(encoding='utf8'))
output = root/'src/actorFilmFacts.json'
existing = json.loads(output.read_text(encoding='utf8'))
by_key = {f['film']: f for f in existing}
overrides = json.loads((root/'docs/Schauspieler-Fragenpaket/Filmquellen-Ergaenzungen.json').read_text(encoding='utf8'))
def fetch(key):
    title, year = key.rsplit('|',1)
    override = overrides.get(key,{})
    articles = [override['url']] if 'url' in override else [title, title+' (film)', title+' ('+year+' film)']
    for article in articles:
        url = article if article.startswith('https://') else 'https://en.wikipedia.org/wiki/'+urllib.parse.quote(article.replace(' ','_'),safe="()_:'")
        try:
            response = requests.get(url,timeout=25,headers={'User-Agent':'Wissensquiz editorial review/1.0'})
            if response.status_code != 200: continue
            soup = BeautifulSoup(response.text,'html.parser')
            table = soup.find('table',class_='infobox')
            if not table: continue
            fields = {}
            for tr in table.find_all('tr'):
                th,td=tr.find('th'),tr.find('td')
                if not th or not td: continue
                for sup in td.find_all('sup'): sup.decompose()
                fields[th.get_text(' ',strip=True)]=td.get_text(' | ',strip=True)
            release=fields.get('Release date',fields.get('Release dates',fields.get('Release',fields.get('Erscheinungsjahr',''))))
            years=re.findall(r'\b(?:19|20)\d{2}\b',release)
            if (not years or min(years)!=year) and not override.get('releaseNote'): continue
            directors=override.get('directors') or fields.get('Directed by',fields.get('Regie','')).split(' | ')
            countries=override.get('countries') or fields.get('Country',fields.get('Countries',fields.get('Country of origin',fields.get('Produktionsland','')))).split(' | ')
            if not directors[0] or not countries[0]: continue
            translated={'United States':'USA','United Kingdom':'Vereinigtes Königreich','France':'Frankreich','Germany':'Deutschland','Italy':'Italien','Canada':'Kanada','Austria':'Österreich','Spain':'Spanien','China':'China','Hong Kong':'Hongkong','South Korea':'Südkorea','Japan':'Japan','Australia':'Australien','India':'Indien','New Zealand':'Neuseeland','Mexico':'Mexiko','West Germany':'Bundesrepublik Deutschland','Yugoslavia':'Jugoslawien','Czech Republic':'Tschechien','Netherlands':'Niederlande','Switzerland':'Schweiz','Egypt':'Ägypten','Poland':'Polen','Ireland':'Irland','Belgium':'Belgien','South Africa':'Südafrika','Cambodia':'Kambodscha','Luxembourg':'Luxemburg','Qatar':'Katar','Romania':'Rumänien','United Arab Emirates':'Vereinigte Arabische Emirate'}
            paragraphs=[p.get_text(' ',strip=True) for p in soup.select('p') if len(p.get_text())>80]
            evidence={'film':key,'url':response.url,'checkedOn':'2026-10-03','sha256_html':hashlib.sha256(response.content).hexdigest(),'infobox':fields,'lead':paragraphs[:3]}
            (root/'.sites-runtime/film-research').mkdir(parents=True,exist_ok=True)
            (root/'.sites-runtime/film-research'/f'{hashlib.sha256(key.encode()).hexdigest()[:16]}.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2),encoding='utf8')
            return {'id':'ACTOR-FILM-'+hashlib.sha256(key.encode()).hexdigest()[:12],'film':key,'title':override.get('title',title),'originalTitle':override.get('originalTitle',title),'year':int(year),'directors':list(dict.fromkeys(directors)),'productionCountries':[translated.get(c,c) for c in dict.fromkeys(countries)],'series':None,'releaseNote':override.get('releaseNote',''),'directorNote':'','source':response.url,'additionalSources':[],'directorContext':'','checkedOn':'2026-10-03','releaseEvidence':release,'verificationStatus':'redaktionell_geprueft'}
        except Exception: continue
    return {'failed':key}
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for result in pool.map(fetch,keys):
        results.append(result)
        if 'failed' not in result: by_key[result['film']]=result
output.write_text(json.dumps(sorted(by_key.values(),key=lambda f:f['film']),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'added':len([r for r in results if 'failed' not in r]),'failed':[r['failed'] for r in results if 'failed' in r]},ensure_ascii=False))

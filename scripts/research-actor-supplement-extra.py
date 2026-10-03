"""Record public supplemental source retrieval; never claim failed reads as success."""
import concurrent.futures, hashlib, json, pathlib
from datetime import date
import requests
from bs4 import BeautifulSoup

root=pathlib.Path('.')
folder=root/'docs/Schauspieler-Ergaenzung-P02'
sources=json.loads((folder/'Redaktionelle-Zusatzquellen.json').read_text(encoding='utf8'))
cache=root/'.sites-runtime/actor-supplement-extras'
cache.mkdir(parents=True,exist_ok=True)
def fetch(url):
    try:
        r=requests.get(url,timeout=30,headers={'User-Agent':'Wissensquiz public editorial preparation/1.0'})
        s=BeautifulSoup(r.text,'html.parser')
        for x in s.select('script,style,nav,footer'):x.decompose()
        text=s.get_text(' ',strip=True)
        record={'url':url,'resolved_url':r.url,'checked_on':date.today().isoformat(),'http_status':r.status_code,'readable':r.status_code==200 and len(text)>250,'sha256_html':hashlib.sha256(r.content).hexdigest(),'text':text}
        (cache/(hashlib.sha256(url.encode()).hexdigest()[:16]+'.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
        return {k:v for k,v in record.items() if k!='text'}
    except requests.RequestException as e:
        return {'url':url,'checked_on':date.today().isoformat(),'readable':False,'error':type(e).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    results=list(pool.map(fetch,sorted({u for v in sources.values() for u in v})))
(folder/'Zusatzquellen-Abrufe.json').write_text(json.dumps({'checked_on':date.today().isoformat(),'sources':results,'note':'Direkte Abrufprüfung; lesbarer Text ist kein automatischer Beweis sämtlicher Aussagen. Ergänzende Browserrecherche und inhaltliche Grenzen im Redaktionsnachweis.'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'sources':len(results),'readable':sum(bool(r['readable']) for r in results),'failed':[r['url'] for r in results if not r['readable']]},ensure_ascii=False))

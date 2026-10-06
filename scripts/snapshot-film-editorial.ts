// Public question catalog only; no browser or player data.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { addPackages, packages } from '../src/packages';
import { emptyState } from '../src/model';
import { filmIdentity } from '../src/familiarity';
import { questionSourceOf } from '../src/filters';
Date.now = () => Date.UTC(2026,9,6,8);
const state=emptyState();
const inputs=packages.map(p=>({filename:p.filename,text:readFileSync(`public${p.path}`,'utf8')}));
addPackages(state,inputs);
const folder='data/filmplanung-2026-10-06';
mkdirSync(folder,{recursive:true});
const reservationPath='docs/Filmfragen-Ergaenzung-2026-10-04/Auswahl.json';
const reservationText=readFileSync(reservationPath,'utf8');
const draft=JSON.parse(reservationText);
const baseline={as_of:'2026-10-06',questions:state.questions,inputs:[...packages.map((p,i)=>({path:`public${p.path}`,sha256:createHash('sha256').update(inputs[i].text).digest('hex')})),{path:reservationPath,sha256:createHash('sha256').update(reservationText).digest('hex')}],filmIdentities:[...new Set(state.questions.filter(q=>questionSourceOf(q)==='film').map(filmIdentity))],reservedFilms:draft.films};
writeFileSync(`${folder}/baseline.json`,JSON.stringify(baseline,null,2)+'\n');
console.log(JSON.stringify({questions:state.questions.length,filmIdentities:baseline.filmIdentities.length,reservedFilms:baseline.reservedFilms.length}));

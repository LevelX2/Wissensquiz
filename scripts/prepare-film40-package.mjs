// Editorial delivery only: no app catalog, browser storage or source CSV changes.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';

const out = 'docs/Filmfragen-Ergaenzung-2026-10-04';
const workerFiles = ['Abenteuer-Fantasy.redaktion.json','Thriller.redaktion.json','Action-Komoedie-RomCom.redaktion.json'];
const fields = 'question_id,knowledge_id,variant_of,language,domain,subdomain,film_title_de,film_title_original,film_year,franchise,difficulty,question_type,topic_tags,badge_tags,learning_objective,question,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation_short,explanation_context,feedback_a,feedback_b,feedback_c,feedback_d,memory_anchor,spoiler_level,source_urls,verification_status'.split(',');
const read = p => JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write = (name, value) => fs.writeFileSync(path.join(out,name), typeof value==='string'?value:JSON.stringify(value,null,2)+'\n','utf8');
const assert = (ok,message) => { if (!ok) throw new Error(message); };
const hash = value => createHash('sha256').update(value).digest('hex');
const normalized = s => s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const words = s => s.trim().split(/\s+/).filter(Boolean).length;
const validUrl = s => { try{return ['http:','https:'].includes(new URL(s).protocol);}catch{return false;} };
const selection = read(`${out}/Auswahl.json`).films;
const baseline = read('data/filmplanung-2026-10-04/current-catalog.json');
const oldIds = new Map(baseline.questions.map(q=>[q.id,q]));
const oldGoals = new Set(baseline.questions.map(q=>q.knowledgeId));
for (const input of baseline.inputs) assert(hash(fs.readFileSync(input.path,'utf8'))===input.sha256,`Bestand geändert: ${input.path}`);
const workers = workerFiles.map(name=>({name,data:read(`${out}/${name}`)}));
const films = workers.flatMap(w=>w.data.films).sort((a,b)=>a.rank-b.rank);
assert(films.length===40 && new Set(films.map(f=>f.rank)).size===40,'Es müssen genau 40 unterschiedliche Filme vorliegen.');
const questions = films.flatMap(f=>f.questions);
assert(questions.length===320,'Erwartet: 320 Fragen.');
assert(new Set(questions.map(q=>q.question_id)).size===questions.length,'Doppelte Fragen-ID.');
const warnings = [];
const filmChecks = [];
for (const film of films) {
  const selected=selection.find(f=>f.rank===film.rank);
  assert(selected,`Unbekannter Filmrang ${film.rank}`);
  assert(film.film_title_de===selected.title && film.film_year===selected.year,`Abweichende Fassung bei ${film.rank}`);
  assert(film.subdomain===selected.genre && film.familiarity_level===selected.familiarity,`Abweichende Zuordnung bei ${film.rank}`);
  assert(Array.isArray(film.directors)&&film.directors.length && Array.isArray(film.production_countries)&&film.production_countries.length,`Eckdaten fehlen bei ${film.rank}`);
  assert(film.familiarity_reason && Array.isArray(film.sources)&&film.sources.length,`Redaktionsbegründung/Quellen fehlen bei ${film.rank}`);
  assert(film.questions.length===8 && new Set(film.questions.map(q=>q.knowledge_id)).size===8,`Acht unabhängige Ziele fehlen bei ${film.rank}`);
  const sourceSet=new Set(film.sources.map(s=>s.url));
  for(const source of film.sources) assert(validUrl(source.url)&&source.supports&&source.checked_on==='2026-10-04',`Unvollständiger Filmbeleg bei ${film.rank}`);
  const content = film.questions.filter(q=>q.goal_kind==='content');
  const counts=Object.fromEntries(['leicht','mittel','schwer'].map(d=>[d,new Set(content.filter(q=>q.difficulty===d).map(q=>q.knowledge_id)).size]));
  assert(Object.values(counts).every(n=>n===2),`Inhaltsabdeckung unvollständig bei ${film.rank}`);
  const year=film.questions.filter(q=>q.goal_kind==='year');
  const director=film.questions.filter(q=>q.goal_kind==='director');
  assert(year.length===1&&director.length===1,`Eckdatenfragen fehlen/dupliziert bei ${film.rank}`);
  assert(year[0][`answer_${year[0].correct_answer.toLowerCase()}`]===String(film.film_year),`Jahreslösung ungleich Filmjahr bei ${film.rank}`);
  assert(!year[0].question.includes(String(film.film_year)),`Jahreslösung im Fragetext bei ${film.rank}`);
  for(const d of film.directors) assert(!normalized(director[0].question).includes(normalized(d)),`Regielösung im Fragetext bei ${film.rank}`);
  for (const q of film.questions) {
    for (const field of fields) assert(typeof q[field]==='string',`${q.question_id}: Feld ${field} muss Text sein.`);
    for (const field of ['question_id','knowledge_id','language','domain','subdomain','film_title_de','film_title_original','film_year','difficulty','question_type','learning_objective','question','answer_a','answer_b','answer_c','answer_d','correct_answer','explanation_short','explanation_context','feedback_a','feedback_b','feedback_c','feedback_d','memory_anchor','spoiler_level','source_urls','verification_status']) assert(q[field].trim(),`${q.question_id}: ${field} fehlt.`);
    assert(q.question_id.startsWith(`F40-${String(film.rank).padStart(3,'0')}-`)&&!oldIds.has(q.question_id),`ID-Konflikt bei ${q.question_id}`);
    assert(q.language==='de'&&q.domain==='Film'&&['leicht','mittel','schwer'].includes(q.difficulty),`Bereich/Sprache/Stufe bei ${q.question_id}`);
    for(const k of ['film_title_de','film_title_original','subdomain']) assert(q[k]===film[k],`${q.question_id}: Abweichung ${k}`);
    assert(q.film_year===String(film.film_year),`${q.question_id}: Abweichendes Jahr`);
    assert(['content','year','director'].includes(q.goal_kind)&&q.interest_reason,`${q.question_id}: Zieltiefe fehlt`);
    assert(/^[a-d]$/i.test(q.correct_answer),`${q.question_id}: Antwortschlüssel falsch`);
    const answers=['a','b','c','d'].map(l=>q[`answer_${l}`]);
    assert(new Set(answers.map(normalized)).size===4,`${q.question_id}: Antwortdubletten`);
    assert(!answers.some(a=>normalized(a)==='keine ahnung'),`${q.question_id}: UI-Auswahl als redaktionelle Antwort`);
    const urls=q.source_urls.split('|').filter(Boolean);
    assert(urls.length && urls.every(validUrl),`${q.question_id}: Ungültige Quelle`);
    assert(Array.isArray(q.source_support)&&q.source_support.length,`${q.question_id}: Fragebeleg fehlt`);
    for(const support of q.source_support) assert(urls.includes(support.url)&&sourceSet.has(support.url)&&support.supports,`${q.question_id}: Nicht zugeordneter Beleg ${support.url}`);
    if(oldGoals.has(q.knowledge_id)) assert(q.variant_of&&oldIds.get(q.variant_of)?.knowledgeId===q.knowledge_id,`${q.question_id}: Bestehendes Ziel ohne gültigen Bezug`);
    else assert(!q.variant_of,`${q.question_id}: Variantenbezug zu anderem Ziel`);
    for(const l of ['a','b','c','d']) assert(!/\b(?:Antwort|Option)\s+[A-D]\b/.test(q[`feedback_${l}`]),`${q.question_id}: Positionsabhängiges Feedback`);
    const totalWords=words([q.question,...answers].join(' '));
    if(totalWords>60) warnings.push({id:q.question_id,kind:'long_question',words:totalWords});
    const contextWords=words(q.explanation_context);
    if(contextWords<35||contextWords>90) warnings.push({id:q.question_id,kind:'context_length',words:contextWords});
    const correct=q[`answer_${q.correct_answer.toLowerCase()}`];
    if(correct.length>3&&normalized([q.question,q.film_title_de,q.film_title_original].join(' ')).includes(normalized(correct))) warnings.push({id:q.question_id,kind:'possible_answer_leak',answer:correct});
  }
  filmChecks.push({rank:film.rank,title:film.film_title_de,year:film.film_year,genre:film.subdomain,familiarity:film.familiarity_level,contentGoals:counts,yearGoal:year[0].knowledge_id,directorGoal:director[0].knowledge_id,goals:8,existingGoals:film.questions.filter(q=>oldGoals.has(q.knowledge_id)).length,newGoals:film.questions.filter(q=>!oldGoals.has(q.knowledge_id)).length,variants:film.questions.filter(q=>q.variant_of).length});
}
const csvRows=questions.map(q=>Object.fromEntries(fields.map(k=>[k,q[k]])));
const csv=Papa.unparse({fields,data:csvRows},{quotes:true,newline:'\r\n'})+'\r\n';
write('Filmfragen_40_Filme_320_Fragen.csv',csv);
const reread=Papa.parse(fs.readFileSync(`${out}/Filmfragen_40_Filme_320_Fragen.csv`,'utf8'),{header:true,skipEmptyLines:'greedy'});
assert(!reread.errors.length&&JSON.stringify(reread.data)===JSON.stringify(csvRows),'CSV-Rücklesevergleich fehlgeschlagen.');
const handoff={schema_version:'wissensquiz-redaktion-film-v1',as_of:'2026-10-04',integration_route:'explicit_csv_year_and_director',films:films.map(f=>({film_title_de:f.film_title_de,film_title_original:f.film_title_original,film_year:f.film_year,subdomain:f.subdomain,reference_question_id:f.questions[0].question_id,familiarity_level:f.familiarity_level,familiarity_reason:f.familiarity_reason,directors:f.directors,production_countries:f.production_countries,series:f.series??null,release_note:f.release_note??'',director_note:f.director_note??'',year_difficulty:f.questions.find(q=>q.goal_kind==='year').difficulty,director_difficulty:f.questions.find(q=>q.goal_kind==='director').difficulty,year_question_id:f.questions.find(q=>q.goal_kind==='year').question_id,director_question_id:f.questions.find(q=>q.goal_kind==='director').question_id,category_reasons:[],sources:f.sources}))};
write('Filmdaten.json',handoff);
write('Quellennachweis.json',{schema_version:'wissensquiz-film-quellennachweis-v1',as_of:'2026-10-04',films:films.map(f=>({rank:f.rank,film_title_de:f.film_title_de,film_title_original:f.film_title_original,film_year:f.film_year,sources:f.sources,questions:f.questions.map(q=>({question_id:q.question_id,knowledge_id:q.knowledge_id,goal_kind:q.goal_kind,learning_objective:q.learning_objective,interest_reason:q.interest_reason,source_support:q.source_support}))})),research_notes:workers.flatMap(w=>w.data.research_notes??[])});
const familiarityLabels={1:'Film-Ikonen',2:'Bekannte Filme',3:'Kennerfilme',4:'Entdeckungen'};
let md='# Filmfragen: 40 Filme, 320 Fragen\n\nStand: 04.10.2026. Redaktionelle Lieferung; Prüfstand und Integrationshinweise im [Prüfbericht](Pruefbericht.md). Vollständige Fragen, Begründungen und Quellen sind in der [CSV](Filmfragen_40_Filme_320_Fragen.csv) enthalten.\n\n';
md+='## Filme\n\n';
for(const f of films) md+=`- [${f.film_title_de} (${f.film_year})](#film-${String(f.rank).padStart(3,'0')}) – ${f.subdomain}, ${familiarityLabels[f.familiarity_level]}\n`;
for(const f of films){
  md+=`\n<a id="film-${String(f.rank).padStart(3,'0')}"></a>\n\n## ${f.film_title_de} (${f.film_year})\n\n${f.subdomain} · ${familiarityLabels[f.familiarity_level]}. Regie: ${f.directors.join(' / ')}.\n\n${f.familiarity_reason}\n`;
  for(const q of f.questions){md+=`\n### ${q.difficulty}: ${q.goal_kind==='year'?'Veröffentlichungsjahr':q.goal_kind==='director'?'Regie':'Inhalt'} (${q.question_id})\n\n${q.question}\n\n`;for(const l of ['a','b','c','d'])md+=`- **${l.toUpperCase()}:** ${q[`answer_${l}`]}\n`;md+=`\n**Lösung:** ${q.correct_answer.toUpperCase()}. ${q.explanation_short}\n\n${q.explanation_context}\n\n**Merksatz:** ${q.memory_anchor}\n\n**Quellen:** ${q.source_urls.split('|').map((url,i)=>`[Beleg ${i+1}](${url})`).join(', ')}\n`;}
}
write('Fragenlesefassung.md',md);
const count=(key)=>Object.fromEntries([...new Set(questions.map(q=>q[key]))].sort().map(k=>[k,questions.filter(q=>q[key]===k).length]));
const check={schema_version:'wissensquiz-film40-formalprüfung-v1',as_of:'2026-10-04',catalog_baseline:{questions:baseline.questions.length,goals:oldGoals.size},scope:'Formal editorial file checks and CSV reread only. Does not constitute source verification or app import.',films:40,questions:320,contentGoals:240,yearGoals:40,directorGoals:40,distinctGoals:new Set(questions.map(q=>q.knowledge_id)).size,existingGoals:new Set(questions.filter(q=>oldGoals.has(q.knowledge_id)).map(q=>q.knowledge_id)).size,newGoals:new Set(questions.filter(q=>!oldGoals.has(q.knowledge_id)).map(q=>q.knowledge_id)).size,variantRows:questions.filter(q=>q.variant_of).length,difficulty:count('difficulty'),correctAnswers:count('correct_answer'),familiarity:Object.fromEntries([1,2,3,4].map(l=>[l,films.filter(f=>f.familiarity_level===l).length])),genres:Object.fromEntries([...new Set(films.map(f=>f.subdomain))].map(g=>[g,films.filter(f=>f.subdomain===g).length])),filmChecks,warnings,checks:{fieldTypes:true,ids:true,contentCoverage:true,yearDirectorCoverage:true,sourceReferences:true,existingVariantReferences:true,fourAnswers:true,feedbackPositionIndependent:true,csvRereadExact:true,baselineCsvUnchanged:true},outputHashes:['Filmfragen_40_Filme_320_Fragen.csv','Filmdaten.json','Quellennachweis.json','Fragenlesefassung.md'].map(p=>({path:p,sha256:hash(fs.readFileSync(path.join(out,p)))}))};
write('Formale-Pruefung.json',check);
console.log(JSON.stringify({...check,filmChecks:undefined,outputHashes:undefined},null,2));

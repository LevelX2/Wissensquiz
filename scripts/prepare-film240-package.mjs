// Assemble the authored editorial delivery. No app catalog or player data writes.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import Papa from 'papaparse';

const out='docs/Filmfragen-Ergaenzung-2026-10-06';
const local='data/filmplanung-2026-10-06';
const fields='question_id,knowledge_id,variant_of,language,domain,subdomain,film_title_de,film_title_original,film_year,franchise,difficulty,question_type,topic_tags,badge_tags,learning_objective,question,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation_short,explanation_context,feedback_a,feedback_b,feedback_c,feedback_d,memory_anchor,spoiler_level,source_urls,verification_status'.split(',');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=x=>createHash('sha256').update(x).digest('hex');
const write=(p,x)=>fs.writeFileSync(path.join(out,p),typeof x==='string'?x:JSON.stringify(x,null,2)+'\n','utf8');
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const norm=x=>x.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const team=names=>names.length<3?names.join(' und '):names.slice(0,-1).join(', ')+' und '+names.at(-1);
const words=x=>x.trim().split(/\s+/).filter(Boolean).length;
const selection=Papa.parse(fs.readFileSync(`${out}/Auswahl.tsv`,'utf8'),{header:true,delimiter:'\t',skipEmptyLines:'greedy'}).data;
assert(selection.length===240,'Auswahl muss 240 Filmfassungen enthalten.');
assert(new Set(selection.map(f=>`${f.film_title_original}|${f.film_year}`)).size===240,'Filmfassung doppelt ausgewählt.');
const genres=[...new Set(selection.map(f=>f.genre))];
assert(genres.length===12&&genres.every(g=>selection.filter(f=>f.genre===g).length===20),'Genremengen stimmen nicht.');
const baseline=read(`${local}/baseline.json`);
for(const input of baseline.inputs)assert(hash(fs.readFileSync(input.path,'utf8'))===input.sha256,`Bestand geändert: ${input.path}`);
const oldIds=new Map(baseline.questions.map(q=>[q.id,q]));
const oldGoals=new Set(baseline.questions.map(q=>q.knowledgeId));
const reserved=new Set([...baseline.filmIdentities,...baseline.reservedFilms.map(f=>`${f.originalTitle}|${f.year}`)]);
const films=[];
const warnings=[];
const titlePrefixes=[];
for(let rank=1;rank<=240;rank++){
  const selected=selection[rank-1];
  assert(!reserved.has(`${selected.film_title_original}|${selected.film_year}`),`Film bereits vorhanden: ${selected.film_title_de}`);
  const file=`${out}/Redaktion/${String(rank).padStart(3,'0')}.json`;
  if(!fs.existsSync(file))continue;
  const f=read(file);
  assert(f.rank===rank,`Falscher Filmrang: ${file}`);
  assert(f.directors?.length&&f.production_countries?.length&&f.familiarity_reason&&f.release_note,`Eckdaten fehlen: ${rank}`);
  assert(f.questions?.length===8&&new Set(f.questions.map(q=>q.code)).size===8,`Acht Ziele fehlen: ${rank}`);
  assert(['L1','L2','M1','M2','S1','S2','Y','D'].every(code=>f.questions.some(q=>q.code===code)),`Stufenabdeckung fehlt: ${rank}`);
  const sources=Object.entries(f.sources).map(([key,value])=>({key,url:typeof value==='string'?value:value.url,supports:typeof value==='string'?f.questions.filter(q=>q.sources.includes(key)).map(q=>q.anchor).join(' '):value.supports,checked_on:'2026-10-06'}));
  const full={rank,film_title_de:selected.film_title_de,film_title_original:selected.film_title_original,film_year:Number(selected.film_year),subdomain:selected.genre,familiarity_level:Number(selected.familiarity),familiarity_reason:f.familiarity_reason,directors:f.directors,production_countries:f.production_countries,country_note:f.country_note??'',release_note:f.release_note,director_note:f.director_note??'',series:f.series??null,sources,questions:[]};
  for(let i=0;i<f.questions.length;i++){
    const q=f.questions[i];
    const id=`F240-20261006-${String(rank).padStart(3,'0')}-${q.code}`;
    assert(!oldIds.has(id),`Vorhandene Frage-ID: ${id}`);
    assert(q.answers.length===4&&new Set(q.answers.map(norm)).size===4,`Vier verschiedene Antworten fehlen: ${id}`);
    assert(q.feedback.length===4&&q.feedback.every(x=>typeof x==='string'&&x.trim()),`Antwortbegründungen fehlen: ${id}`);
    assert(q.question&&q.short&&q.context&&q.anchor&&q.interest&&q.sources.length,`Redaktion fehlt: ${id}`);
    const sourceKeys=new Set(sources.map(s=>s.key));
    assert(q.sources.every(s=>sourceKeys.has(s)),`Nicht zugeordnete Quelle: ${id}`);
    const kind=q.code==='Y'?'year':q.code==='D'?'director':'content';
    const difficulty=q.difficulty??({L:'leicht',M:'mittel',S:'schwer',Y:'mittel',D:'mittel'}[q.code[0]]);
    assert(['leicht','mittel','schwer'].includes(difficulty),`Ungültige Filmschwierigkeit: ${id}`);
    assert(kind!=='content'||difficulty===({L:'leicht',M:'mittel',S:'schwer'}[q.code[0]]),`Inhaltsziel in falscher Stufe: ${id}`);
    const target=(rank*8+i)%4;
    const letters=['a','b','c','d'];
    const pairs=q.answers.map((text,i)=>({text,feedback:q.feedback[i]}));
    pairs.splice(target,0,pairs.shift());
    let question=q.question.replaceAll('@',`„${selected.film_title_de}“`);
    if(!q.question.includes('@')&&!norm(question).includes(norm(selected.film_title_de))){
      question=`„${selected.film_title_de}“: ${question}`;
      titlePrefixes.push(id);
    }
    if(kind==='year'){
      assert(q.answers[0]===selected.film_year,`Jahreslösung weicht ab: ${id}`);
      assert(!question.includes(selected.film_year),`Jahreslösung sichtbar: ${id}`);
      assert(q.answers.every(x=>/^\d{4}$/.test(x)&&Number(x)>=1895&&Number(x)<=2026),`Jahresalternativen außerhalb des Filmzeitraums: ${id}`);
    }
    if(kind==='director'){
      assert([team(f.directors),f.directors.join(' und ')].some(names=>norm(q.answers[0])===norm(names)),`Regieteam unvollständig: ${id}`);
      assert(f.directors.every(name=>!norm(question).includes(norm(name))),`Regielösung sichtbar: ${id}`);
      assert(q.answers.slice(1).every(answer=>f.directors.every(name=>!norm(answer).includes(norm(name)))),`Mitglied des richtigen Regieteams als falsche Alternative: ${id}`);
    }
    const goal=q.knowledge_id??`K-${id}`;
    if(oldGoals.has(goal))assert(q.variant_of&&oldIds.get(q.variant_of)?.knowledgeId===goal,`Falscher Variantenbezug: ${id}`);
    else assert(!q.variant_of,`Neues Ziel mit Variantenbezug: ${id}`);
    const row={question_id:id,knowledge_id:goal,variant_of:q.variant_of??'',language:'de',domain:'Film',subdomain:full.subdomain,film_title_de:full.film_title_de,film_title_original:full.film_title_original,film_year:selected.film_year,franchise:f.series??'',difficulty,question_type:kind==='year'?'Filmjahr':kind==='director'?'Regie':q.type??'Filmwissen',topic_tags:full.subdomain,badge_tags:full.subdomain,learning_objective:q.objective??q.anchor,question,correct_answer:letters[target].toUpperCase(),explanation_short:q.short,explanation_context:q.context,memory_anchor:q.anchor,spoiler_level:q.spoiler??'mittel',source_urls:q.sources.map(key=>sources.find(s=>s.key===key).url).join('|'),verification_status:'redaktionell_quellengeprueft',goal_kind:kind,interest_reason:q.interest,source_support:q.sources.map(key=>({url:sources.find(s=>s.key===key).url,supports:q.anchor+' '+q.short}))};
    letters.forEach((letter,i)=>{row[`answer_${letter}`]=pairs[i].text;row[`feedback_${letter}`]=pairs[i].feedback;});
    for(const field of fields)assert(typeof row[field]==='string',`${id}: ${field} ist kein Text.`);
    assert(row.source_urls.split('|').every(url=>/^https?:\/\//.test(url)),`Ungültige Quelle: ${id}`);
    if(words([question,...q.answers].join(' '))>60)warnings.push({id,kind:'question_length',words:words([question,...q.answers].join(' '))});
    if(q.answers[0].length>3&&norm([question,full.film_title_de,full.film_title_original].join(' ')).includes(norm(q.answers[0])))warnings.push({id,kind:'possible_answer_leak',answer:q.answers[0]});
    full.questions.push(row);
  }
  assert(new Set(full.questions.map(q=>q.knowledge_id)).size===8,`Wissensziele nicht unabhängig: ${rank}`);
  for(const level of ['leicht','mittel','schwer'])assert(new Set(full.questions.filter(q=>q.goal_kind==='content'&&q.difficulty===level).map(q=>q.knowledge_id)).size===2,`Inhaltsabdeckung ${level} fehlt: ${rank}`);
  films.push(full);
}
const partial=films.length!==240;
assert(!partial||process.argv.includes('--partial'),`Redaktion unvollständig: ${films.length}/240 Filme.`);
const questions=films.flatMap(f=>f.questions);
assert(new Set(questions.map(q=>q.question_id)).size===questions.length,'Doppelte Frage-ID.');
assert(new Set(questions.filter(q=>!oldGoals.has(q.knowledge_id)).map(q=>q.knowledge_id)).size===questions.filter(q=>!oldGoals.has(q.knowledge_id)).length,'Neues Wissensziel mehrfach vergeben.');
const rows=questions.map(q=>Object.fromEntries(fields.map(k=>[k,q[k]])));
const csv=Papa.unparse({fields,data:rows},{quotes:true,newline:'\r\n'})+'\r\n';
write('Filmfragen_240_Filme_1920_Fragen.csv',csv);
const reread=Papa.parse(csv,{header:true,skipEmptyLines:'greedy'});
assert(!reread.errors.length&&JSON.stringify(reread.data)===JSON.stringify(rows),'CSV-Rücklesevergleich fehlerhaft.');
write('Filmdaten.json',{schema_version:'wissensquiz-redaktion-film-v1',as_of:'2026-10-06',complete:!partial,integration_route:'explicit_csv_year_and_director',films:films.map(({questions,...f})=>({...f,reference_question_id:questions[0].question_id,year_question_id:questions.find(q=>q.goal_kind==='year').question_id,director_question_id:questions.find(q=>q.goal_kind==='director').question_id}))});
write('Quellennachweis.json',{as_of:'2026-10-06',complete:!partial,scope:'Redaktionell gelesene Quellen und eigene Formulierungen; keine unabhängige zweite Vollrecherche.',films:films.map(f=>({rank:f.rank,title:f.film_title_de,sources:f.sources,questions:f.questions.map(({question_id,knowledge_id,goal_kind,learning_objective,interest_reason,source_support})=>({question_id,knowledge_id,goal_kind,learning_objective,interest_reason,source_support}))}))});
const counts=key=>Object.fromEntries([...new Set(questions.map(q=>q[key]))].sort().map(v=>[v,questions.filter(q=>q[key]===v).length]));
write('Formale-Pruefung.json',{as_of:'2026-10-06',complete:!partial,expectedFilms:240,films:films.length,questions:questions.length,contentGoals:questions.filter(q=>q.goal_kind==='content').length,yearGoals:films.length,directorGoals:films.length,difficulty:counts('difficulty'),correctAnswers:counts('correct_answer'),newGoals:new Set(questions.filter(q=>!oldGoals.has(q.knowledge_id)).map(q=>q.knowledge_id)).size,existingGoals:new Set(questions.filter(q=>oldGoals.has(q.knowledge_id)).map(q=>q.knowledge_id)).size,variants:questions.filter(q=>q.variant_of).length,genres:Object.fromEntries(genres.map(g=>[g,films.filter(f=>f.subdomain===g).length])),filmChecks:films.map(f=>({rank:f.rank,title:f.film_title_de,contentGoals:{leicht:2,mittel:2,schwer:2},yearGoal:f.questions.find(q=>q.goal_kind==='year').knowledge_id,directorGoal:f.questions.find(q=>q.goal_kind==='director').knowledge_id,existingGoals:f.questions.filter(q=>oldGoals.has(q.knowledge_id)).length,newGoals:f.questions.filter(q=>!oldGoals.has(q.knowledge_id)).length,variants:f.questions.filter(q=>q.variant_of).length})),titlePrefixes,warnings,checks:{csvRereadExact:true,existingCatalogUnchanged:true,uniqueIds:true,minimumCoverage:true,answerFeedbackComplete:true,sourceReferencesComplete:true},csvSha256:hash(csv)});
let md=`# Filmfragen-Ergänzung vom 06.10.2026\n\n${partial?'Unvollständiger Arbeitsstand':'Vollständige redaktionelle Lieferung'}: ${films.length} Filme, ${questions.length} Fragen. Lösungen, Jahr und Regie stehen in dieser Lesefassung offen.\n\n`;
for(const genre of genres){
  const grouped=films.filter(f=>f.subdomain===genre);
  if(!grouped.length)continue;
  md+=`## ${genre}\n\n`;
  for(const f of grouped){
    md+=`### ${f.film_title_de} (${f.film_year})\n\nOriginaltitel: ${f.film_title_original}. Regie: ${team(f.directors)}. Bekanntheitsgruppe: ${f.familiarity_level}.\n\n${f.familiarity_reason}\n\n`;
    for(const q of f.questions){
      md+=`**${q.difficulty} · ${q.goal_kind==='content'?'Inhalt':q.goal_kind==='year'?'Jahr':'Regie'} · ${q.question_id}**\n\n${q.question}\n\n`;
      for(const l of ['a','b','c','d'])md+=`- ${l.toUpperCase()}: ${q[`answer_${l}`]}\n`;
      md+=`\n**Lösung: ${q.correct_answer}.** ${q.explanation_short}\n\n${q.explanation_context}\n\n**Merksatz:** ${q.memory_anchor}\n\n`;
      for(const l of ['a','b','c','d'])md+=`- ${q[`answer_${l}`]}: ${q[`feedback_${l}`]}\n`;
      md+=`\nQuellen: ${q.source_urls.split('|').map((url,i)=>`[Beleg ${i+1}](${url})`).join(', ')}.\n\n`;
    }
  }
}
write('Fragenlesefassung.md',md.trimEnd()+'\n');
console.log(JSON.stringify({complete:!partial,films:films.length,questions:questions.length,warnings},null,2));

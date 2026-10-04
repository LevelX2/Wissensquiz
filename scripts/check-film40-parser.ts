// Runs the real app parser against an isolated, freshly assembled official catalog.
// Never opens IndexedDB, a browser profile or a remote service.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { addPackages, packages } from '../src/packages';
import { emptyState } from '../src/model';
import { importCsv } from '../src/importer';
import { questionSourceOf, genreOf } from '../src/filters';
import { addFilmFacts } from '../src/filmFacts';
import Papa from 'papaparse';

const output='docs/Filmfragen-Ergaenzung-2026-10-04';
const csvPath=`${output}/Filmfragen_40_Filme_320_Fragen.csv`;
Date.now=()=>Date.UTC(2026,9,4,8,0,0);
const state=emptyState();
const inputs=packages.map(p=>({filename:p.filename,text:readFileSync(`public${p.path}`,'utf8')}));
addPackages(state,inputs);
if(process.argv.includes('--prepare-baseline')){
  const baseline={questions:state.questions,imports:state.imports,inputs:packages.map((p,i)=>({path:`public${p.path}`,sha256:createHash('sha256').update(inputs[i].text).digest('hex')}))};
  writeFileSync('data/filmplanung-2026-10-04/current-catalog.json',JSON.stringify(baseline,null,2)+'\n');
  console.log(JSON.stringify({questions:state.questions.length,goals:new Set(state.questions.map(q=>q.knowledgeId)).size}));
  process.exit(0);
}
const csv=readFileSync(csvPath,'utf8');
const before=JSON.stringify(state.questions);
const filename='Filmfragen_40_Filme_320_Fragen.csv';
const parsed=importCsv(csv,state.questions,filename);
if(parsed.report.accepted!==320||parsed.report.rejected||parsed.report.duplicates||parsed.report.issues.length||parsed.report.warnings.length) throw new Error(JSON.stringify(parsed.report));
const rows=Papa.parse<Record<string,string>>(csv,{header:true,skipEmptyLines:'greedy'}).data;
for(const q of parsed.questions){
  const row=rows.find(r=>r.question_id===q.id)!;
  for(const [field,value] of Object.entries(row)) if(q.metadata[field]!==value) throw new Error(`${q.id}: ${field} was not preserved`);
  for(const l of ['a','b','c','d']){
    const a=q.answers.find(answer=>answer.id===`${q.id}:${l}`)!;
    if(a.text!==row[`answer_${l}`]||a.feedback!==row[`feedback_${l}`]) throw new Error(`${q.id}: answer/feedback lost`);
  }
  if(q.explanation!==row.explanation_short||q.context!==row.explanation_context||q.anchor!==row.memory_anchor) throw new Error(`${q.id}: editorial context lost`);
  if(questionSourceOf(q)!=='film') throw new Error(`${q.id}: wrong source group`);
}
const simulated=[...state.questions,...parsed.questions];
const beforeFacts=simulated.length;
addFilmFacts(simulated);
if(simulated.length!==beforeFacts) throw new Error('Unexpected additional fact question in isolated parser simulation');
const repeated=importCsv(csv,simulated,filename);
if(repeated.report.accepted||repeated.report.duplicates!==320||repeated.report.rejected) throw new Error('Repeat-import identity check failed');
if(JSON.stringify(state.questions)!==before) throw new Error('Official baseline was mutated');
const report={as_of:'2026-10-04',scope:'Real importCsv parser in isolated in-memory official catalog; no application integration, browser import, metadata installation or publication.',baselineQuestions:state.questions.length,baselineGoals:new Set(state.questions.map(q=>q.knowledgeId)).size,parser:parsed.report,simulatedCatalogQuestions:simulated.length,simulatedCatalogGoals:new Set(simulated.map(q=>q.knowledgeId)).size,checks:{originalMetadataPreserved:true,answersAndFeedbackPreserved:true,contextAndAnchorPreserved:true,filmAreaOnly:true,existingCatalogUnchanged:true,existingFactGeneratorAddsNoDuplicate:true,repeatImportSkipsAll320:true},genres:Object.fromEntries([...new Set(parsed.questions.map(genreOf))].map(g=>[g,parsed.questions.filter(q=>genreOf(q)===g).length])),repeatImport:{accepted:repeated.report.accepted,duplicates:repeated.report.duplicates,rejected:repeated.report.rejected},csvSha256:createHash('sha256').update(csv).digest('hex'),integrationNotes:['Familiarity and new film details require the separate editorial handoff; CSV parser does not activate these assignments.','Year and director are supplied as CSV rows. Do not additionally enable generated questions for the new films.','Cross-area variants require their existing target catalog when importing.','Parasite alias identity must be reconciled against existing Parasite/Gisaengchung metadata without rewriting learning identities.']};
writeFileSync(`${output}/App-Parser-Pruefung.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,parser:{...report.parser,columns:undefined}},null,2));

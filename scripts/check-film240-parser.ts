// Real CSV parsing against an isolated public catalog; no browser or player data.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { addPackages, packages } from '../src/packages';
import { emptyState } from '../src/model';
import { importCsv } from '../src/importer';
import { questionSourceOf, genreOf, normalizeGenre } from '../src/filters';
import { addFilmFacts } from '../src/filmFacts';
import Papa from 'papaparse';

const output='docs/Filmfragen-Ergaenzung-2026-10-06';
const filename='Filmfragen_240_Filme_1920_Fragen.csv';
Date.now=()=>Date.UTC(2026,9,6,8);
const state=emptyState();
const inputs=packages.map(p=>({filename:p.filename,text:readFileSync(`public${p.path}`,'utf8')}));
addPackages(state,inputs);
const csv=readFileSync(`${output}/${filename}`,'utf8');
const formal=JSON.parse(readFileSync(`${output}/Formale-Pruefung.json`,'utf8'));
if(!formal.complete||formal.questions!==1920)throw new Error('Editorial delivery is incomplete');
const baseline=JSON.stringify(state.questions);
const parsed=importCsv(csv,state.questions,filename);
if(parsed.report.accepted!==1920||parsed.report.rejected||parsed.report.duplicates||parsed.report.issues.length||parsed.report.warnings.length)throw new Error(JSON.stringify(parsed.report));
const rows=Papa.parse<Record<string,string>>(csv,{header:true,skipEmptyLines:'greedy'}).data;
const byId=new Map(rows.map(row=>[row.question_id,row]));
for(const q of parsed.questions){
  const row=byId.get(q.id)!;
  for(const [field,value] of Object.entries(row)){
    const expected=field==='subdomain'?normalizeGenre(value):value;
    if(q.metadata[field]!==expected)throw new Error(`${q.id}: metadata ${field} changed`);
  }
  for(const letter of ['a','b','c','d']){
    const answer=q.answers.find(a=>a.id===`${q.id}:${letter}`)!;
    if(answer.text!==row[`answer_${letter}`]||answer.feedback!==row[`feedback_${letter}`])throw new Error(`${q.id}: answer or feedback lost`);
  }
  if(q.knowledgeId!==row.knowledge_id||q.explanation!==row.explanation_short||q.context!==row.explanation_context||q.anchor!==row.memory_anchor)throw new Error(`${q.id}: editorial information lost`);
  if(questionSourceOf(q)!=='film')throw new Error(`${q.id}: wrong source group`);
}
const simulated=[...state.questions,...parsed.questions];
const beforeFacts=simulated.length;
addFilmFacts(simulated);
if(simulated.length!==beforeFacts)throw new Error('Additional duplicate fact question generated');
const repeated=importCsv(csv,simulated,filename);
if(repeated.report.accepted||repeated.report.duplicates!==1920||repeated.report.rejected)throw new Error('Repeat import identity check failed');
if(JSON.stringify(state.questions)!==baseline)throw new Error('Public baseline mutated');
const report={as_of:'2026-10-06',scope:'Echter App-Parser im isolierten Hauptspeicherkatalog. Kein App-Import, kein Browserprofil, keine Kontodaten, keine Veröffentlichung.',baselineQuestions:state.questions.length,baselineGoals:new Set(state.questions.map(q=>q.knowledgeId)).size,parser:parsed.report,simulatedCatalogQuestions:simulated.length,simulatedCatalogGoals:new Set(simulated.map(q=>q.knowledgeId)).size,checks:{metadataPreservedWithDocumentedGenreNormalization:true,answersAndFeedbackPreserved:true,contextAndAnchorPreserved:true,knowledgeIdentitiesPreserved:true,filmAreaOnly:true,existingCatalogUnchanged:true,existingFactGeneratorAddsNoDuplicate:true,repeatImportSkipsAll1920:true},genres:Object.fromEntries([...new Set(parsed.questions.map(genreOf))].map(g=>[g,parsed.questions.filter(q=>genreOf(q)===g).length])),repeatImport:{accepted:repeated.report.accepted,duplicates:repeated.report.duplicates,rejected:repeated.report.rejected},csvSha256:createHash('sha256').update(csv).digest('hex'),integrationNotes:['Bekanntheit und neue Filmdaten benötigen die getrennte redaktionelle Übergabe; der CSV-Parser aktiviert sie nicht.','Jahr und Regie werden ausschließlich durch diese CSV-Zeilen bereitgestellt. Keine zusätzliche Faktengenerierung für diese neuen Filme aktivieren.','Bereichsübergreifende Varianten benötigen beim Einzelimport ihren bereits vorhandenen Zielkatalog.','Die noch nicht installierte Ergänzung vom 04.10.2026 wurde bei der Filmauswahl reserviert und nicht dupliziert.']};
writeFileSync(`${output}/App-Parser-Pruefung.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({accepted:parsed.report.accepted,issues:parsed.report.issues,warnings:parsed.report.warnings,simulatedQuestions:simulated.length,repeatImport:report.repeatImport,checks:report.checks},null,2));

// Assemble individually authored questions; no generated content or player data.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';

const genre = process.argv[2];
assert(genre, 'Genre directory argument required');
const root = 'docs/Genres-100-2026-10-08';
const out = path.join(root, genre);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const write = (file, value) => fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
const selection = read(path.join(out, 'Auswahl.json'));
const fields = 'question_id,knowledge_id,variant_of,language,domain,subdomain,film_title_de,film_title_original,film_year,franchise,difficulty,question_type,topic_tags,badge_tags,learning_objective,question,answer_a,answer_b,answer_c,answer_d,correct_answer,explanation_short,explanation_context,feedback_a,feedback_b,feedback_c,feedback_d,memory_anchor,spoiler_level,source_urls,verification_status'.split(',');
const expectedCodes = ['L1', 'L2', 'M1', 'M2', 'S1', 'S2', 'Y', 'D'];
const team = people => people.length === 1 ? people[0] : people.slice(0, -1).join(', ') + ' und ' + people.at(-1);
const norm = value => value.normalize('NFKC').toLocaleLowerCase('de').replace(/\s+/g, ' ').trim();
const rows = [], metadata = [], evidence = [], warnings = [];
assert.equal(selection.films.length, selection.targetFilms - selection.baselineFilms);
for (const [index, selected] of selection.films.entries()) {
  const rank = index + 1;
  const file = path.join(out, 'Redaktion', String(rank).padStart(3, '0') + '.json');
  assert(fs.existsSync(file), 'Missing authored film: ' + file);
  const f = read(file);
  assert.equal(f.rank, rank);
  assert(f.directors?.length && f.production_countries?.length && f.release_note && f.familiarity_reason, 'Missing film metadata: ' + rank);
  assert.equal(f.questions.length, 8);
  assert.deepEqual([...f.questions.map(q => q.code)].sort(), [...expectedCodes].sort());
  const sourceEntries = Object.entries(f.sources).map(([key, source]) => ({key, ...(typeof source === 'string' ? {url: source} : source), checked_on: '2026-10-08'}));
  const film = {rank, film_title_de:selected[0], film_title_original:selected[1], film_year:selected[2], subdomain:selection.genre, familiarity_level:selected[4], familiarity_reason:f.familiarity_reason, directors:f.directors, production_countries:f.production_countries, country_note:f.country_note ?? '', release_note:f.release_note, director_note:f.director_note ?? '', series:f.series ?? null, sources:sourceEntries};
  const localRows = [];
  for (const [qi, q] of f.questions.entries()) {
    const id = `G100-20261008-${genre.toUpperCase()}-${String(rank).padStart(3,'0')}-${q.code}`;
    assert.equal(q.answers.length, 4, id);
    assert.equal(new Set(q.answers.map(norm)).size, 4, id + ': duplicate answer');
    assert.equal(q.feedback.length, 4, id);
    for (const value of [q.question,q.short,q.context,q.anchor,q.interest,...q.feedback]) assert(typeof value === 'string' && value.trim(), id + ': missing editorial text');
    assert(q.sources?.length && q.sources.every(key => sourceEntries.some(s => s.key === key)), id + ': missing source');
    const goalKind = q.code === 'Y' ? 'year' : q.code === 'D' ? 'director' : 'content';
    const difficulty = q.difficulty ?? ({L:'leicht',M:'mittel',S:'schwer',Y:'mittel',D:'mittel'}[q.code[0]]);
    assert(['leicht','mittel','schwer'].includes(difficulty));
    let question = q.question.replaceAll('@', `„${selected[0]}“`);
    if (!q.question.includes('@')) question = `„${selected[0]}“: ${question}`;
    if (goalKind === 'year') {
      assert.equal(q.answers[0], String(selected[2]), id + ': wrong release year');
      assert(!question.includes(String(selected[2])), id + ': release year leaked');
    }
    if (goalKind === 'director') {
      assert.equal(q.answers[0], team(f.directors), id + ': incomplete directing team');
      assert(f.directors.every(n => !norm(question).includes(norm(n))), id + ': director leaked');
      assert(q.answers.slice(1).every(a => f.directors.every(n => !norm(a).includes(norm(n)))), id + ': director in wrong option');
    }
    assert(!/\b(?:Antwort|Option)\s+[ABCD]\b/i.test(q.feedback.join(' ')), id + ': position-dependent feedback');
    const target = (rank + qi) % 4;
    const answers = q.answers.map((text, i) => ({text, feedback:q.feedback[i]}));
    answers.splice(target, 0, answers.shift());
    const row = {question_id:id,knowledge_id:q.knowledge_id ?? `K-${id}`,variant_of:q.variant_of ?? '',language:'de',domain:'Film',subdomain:film.subdomain,film_title_de:film.film_title_de,film_title_original:film.film_title_original,film_year:String(film.film_year),franchise:typeof film.series === 'object' ? film.series?.name ?? '' : film.series,difficulty,question_type:goalKind === 'year' ? 'Filmjahr' : goalKind === 'director' ? 'Regie' : q.type ?? 'Filmwissen',topic_tags:film.subdomain,badge_tags:film.subdomain,learning_objective:q.objective ?? q.anchor,question,correct_answer:'ABCD'[target],explanation_short:q.short,explanation_context:q.context,memory_anchor:q.anchor,spoiler_level:q.spoiler ?? 'mittel',source_urls:q.sources.map(key => sourceEntries.find(s => s.key === key).url).join('|'),verification_status:'redaktionell_quellengeprueft'};
    for (const [i, letter] of ['a','b','c','d'].entries()) {row[`answer_${letter}`] = answers[i].text;row[`feedback_${letter}`] = answers[i].feedback;}
    for (const field of fields) assert.equal(typeof row[field], 'string', id + ': ' + field);
    assert(row.source_urls.split('|').every(url => /^https?:\/\//.test(url)));
    if ((question + ' ' + q.answers.join(' ')).split(/\s+/).length > 60) warnings.push({id,kind:'length'});
    if (q.answers[0].length > 4 && norm(question + ' ' + selected[0]).includes(norm(q.answers[0]))) warnings.push({id,kind:'possible_answer_leak',answer:q.answers[0]});
    localRows.push({...row,goal_kind:goalKind});
    rows.push(row);
    evidence.push({question_id:id,knowledge_id:row.knowledge_id,goal_kind:goalKind,interest_reason:q.interest,sources:q.sources.map(key => ({...sourceEntries.find(s => s.key === key),supports:q.short}))});
  }
  assert.equal(new Set(localRows.map(q => q.knowledge_id)).size, 8, 'Overlapping film goals: ' + rank);
  metadata.push({...film,reference_question_id:localRows[0].question_id,year_question_id:localRows.find(q => q.goal_kind === 'year').question_id,director_question_id:localRows.find(q => q.goal_kind === 'director').question_id});
}
assert.equal(new Set(rows.map(q=>q.question_id)).size, rows.length);
const csv = Papa.unparse({fields,data:rows},{quotes:true,newline:'\r\n'}) + '\r\n';
const parsed = Papa.parse(csv,{header:true,skipEmptyLines:'greedy'});
assert.equal(parsed.errors.length, 0);
assert.deepEqual(parsed.data, rows);
const filename = `Genre100_${genre}_20261008.csv`;
write(path.join(out, filename), csv);
write(path.join(out,'Filmdaten.json'), {schema_version:'wissensquiz-redaktion-film-v1',as_of:'2026-10-08',integration_route:'explicit_csv_year_and_director',films:metadata});
const completed = fs.readdirSync(root, {withFileTypes:true}).filter(entry => entry.isDirectory()).map(entry => path.join(root,entry.name,'Filmdaten.json')).filter(file => fs.existsSync(file));
write(path.join(root,'Filmdaten.json'), {schema_version:'wissensquiz-redaktion-film-v1',as_of:'2026-10-08',integration_route:'explicit_csv_year_and_director',films:completed.flatMap(file => read(file).films)});
write(path.join(out,'Quellennachweis.json'), {date:'2026-10-08',scope:'Eigene Redaktion auf tatsächlich gelesenen Quellen; keine unabhängige zweite Vollrecherche.',questions:evidence});
write(path.join(out,'Formale-Pruefung.json'), {date:'2026-10-08',films:metadata.length,questions:rows.length,contentGoals:metadata.length*6,yearGoals:metadata.length,directorGoals:metadata.length,variants:rows.filter(q=>q.variant_of).length,csvSha256:createHash('sha256').update(csv).digest('hex'),warnings,checks:{csvRereadExact:true,uniqueQuestionIds:true,eightDistinctKnowledgeIdsPerFilm:true,completeAnswerFeedback:true,sourceReferencesValid:true,yearDirectorSolutionProtection:true}});
let md = `# ${selection.genre}: zusätzliche Filmfragen\n\n${metadata.length} Filme und ${rows.length} individuell redigierte Fragen. Diese Lesefassung zeigt die Lösungen offen.\n\n`;
for (const f of metadata) {
  md += `## ${f.film_title_de} (${f.film_year})\n\nRegie: ${team(f.directors)}. Bekanntheitsgruppe ${f.familiarity_level}: ${f.familiarity_reason}\n\n`;
  for (const q of rows.filter(q=>q.film_title_original===f.film_title_original && Number(q.film_year)===f.film_year)) {
    md += `**${q.difficulty} · ${q.question_id}**\n\n${q.question}\n\n`;
    for (const letter of ['a','b','c','d']) md += `- ${letter.toUpperCase()}: ${q[`answer_${letter}`]}\n`;
    md += `\n**Lösung ${q.correct_answer}.** ${q.explanation_short}\n\n${q.explanation_context}\n\nMerksatz: ${q.memory_anchor}\n\n`;
    for (const letter of ['a','b','c','d']) md += `- ${q[`answer_${letter}`]}: ${q[`feedback_${letter}`]}\n`;
    md += `\nQuellen: ${q.source_urls.split('|').map((url,i)=>`[Beleg ${i+1}](${url})`).join(', ')}.\n\n`;
  }
}
write(path.join(out,'Fragenlesefassung.md'), md.trimEnd() + '\n');
console.log(JSON.stringify({genre:selection.genre,films:metadata.length,questions:rows.length,warnings},null,2));

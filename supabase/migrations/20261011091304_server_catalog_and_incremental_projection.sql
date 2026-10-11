begin;
-- Only one current question set. Hashes identify content, never require an old
-- compressed public release. Issued questions are their own private evidence.
alter table quiz_ranked_internal.catalog drop constraint catalog_release_hash_fkey;
alter table quiz_ranked_internal.config drop constraint config_release_hash_fkey;
alter table quiz_ranked_internal.runs drop constraint runs_release_hash_fkey;
alter table quiz_ranked_internal.config add column question_count integer not null default 0;
update quiz_ranked_internal.config c set question_count=(select count(*) from quiz_ranked_internal.catalog q where q.release_hash=c.release_hash);

alter table quiz_game_internal.runs add column question_queue jsonb not null default '[]';
-- A bounded normal round owns at most ten prepared questions, not a catalog.
update quiz_game_internal.runs r set question_queue=(select coalesce(jsonb_agg(public.quiz_year_question(c.question) order by n),'[]') from unnest(r.queue) with ordinality a(id,n) join quiz_ranked_internal.catalog c on c.release_hash=r.release_hash and c.id=a.id) where r.status='active';
create function quiz_game_internal.prepare_queue() returns trigger language plpgsql set search_path='' as $$
begin
 select jsonb_agg(public.quiz_year_question(c.question) order by n) into new.question_queue
 from unnest(new.queue) with ordinality a(id,n) join quiz_ranked_internal.catalog c on c.release_hash=(select release_hash from quiz_ranked_internal.config where id) and c.id=a.id;
 if coalesce(jsonb_array_length(new.question_queue),0)<>cardinality(new.queue) then raise exception 'game_content_missing'; end if;
 return new;
end$$;
create trigger game_prepare_queue before insert on quiz_game_internal.runs for each row execute function quiz_game_internal.prepare_queue();
do $patch$declare d text;begin
 d:=pg_get_functiondef('quiz_game_internal.issue(quiz_game_internal.runs)'::regprocedure);
 d:=replace(d,'select public.quiz_year_question(c.question) into strict content from quiz_ranked_internal.catalog c where release_hash=r.release_hash and id=r.queue[r.answered+1];','content:=r.question_queue->r.answered; if content is null then raise exception ''game_content_missing''; end if;');
 execute d;
 d:=pg_get_functiondef('quiz_game_internal.call(text)'::regprocedure);
 d:=replace(d,'finished_at=clock_timestamp() where id=r.id returning * into r;','finished_at=clock_timestamp(),question_queue=''[]''::jsonb where id=r.id returning * into r;');
 execute d;
 d:=pg_get_functiondef('quiz_ranked_internal.refill(quiz_ranked_internal.runs)'::regprocedure);
 d:=replace(d,'c.release_hash=r.release_hash','c.release_hash=(select release_hash from quiz_ranked_internal.config where id)'); execute d;
 d:=pg_get_functiondef('quiz_ranked_internal.issue(uuid)'::regprocedure);
 d:=replace(d,'if r.queue_position>=jsonb_array_length(r.queue) then','if r.queue_position>=jsonb_array_length(r.queue) or not exists(select 1 from quiz_ranked_internal.catalog c where c.release_hash=(select release_hash from quiz_ranked_internal.config where id) and c.id=r.queue->>r.queue_position) then');
 d:=replace(d,'c.release_hash=r.release_hash','c.release_hash=(select release_hash from quiz_ranked_internal.config where id)');
 d:=replace(d,'where release_hash=r.release_hash','where release_hash=(select release_hash from quiz_ranked_internal.config where id)'); execute d;
 d:=pg_get_functiondef('quiz_ranked_internal.call(text)'::regprocedure);
 d:=replace(d,'if not exists(select 1 from quiz_ranked_internal.config cfg join public.quiz_catalog_releases c on c.hash=cfg.release_hash'||chr(10)||'     where c.hash=ranked_request.release_hash and c.question_count=(select count(*) from quiz_ranked_internal.catalog q where q.release_hash=c.hash)) then raise exception ''ranked_catalog_missing''; end if;',
 'if not exists(select 1 from quiz_ranked_internal.config cfg where cfg.release_hash=ranked_request.release_hash and cfg.question_count>=10) then raise exception ''ranked_catalog_missing''; end if;');
 execute d;
end$patch$;

-- Existing round contributions already support differences. Preserve all other
-- rounds instead of clearing and replaying a player's history on every finish.
do $patch$declare d text;begin
 d:=pg_get_functiondef('quiz_game_internal.finish_projection(uuid,uuid,bigint)'::regprocedure);
 d:=replace(d,'perform quiz_sync_internal.project(player,target,null,true);',
 'perform quiz_sync_internal.project(player,target,coalesce((select array_agg(id) from public.quiz_sync_entries where owner_id=player and generation=target and kind=''round'' and changed_revision=revision),array[]::text[]),true);');
 execute d;
end$patch$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
-- One operator upload stages the next current content; activation is atomic.
create table quiz_game_internal.content_staging(hash text not null,id text not null,content text not null,question jsonb generated always as (content::jsonb->'q') stored,presentation jsonb generated always as (content::jsonb->'presentation') stored,primary key(hash,id));
alter table quiz_game_internal.content_staging enable row level security;
revoke all on quiz_game_internal.content_staging from public,anon,authenticated;
create function quiz_game_internal.activate_content(content_hash text,expected_count integer,plans jsonb,film_levels jsonb) returns jsonb language plpgsql set search_path='' as $$
declare actual integer; proof text;
begin
 perform pg_advisory_xact_lock(hashtextextended('quiz_current_content',0));
 select count(*),encode(sha256(convert_to(string_agg(encode(sha256(convert_to(content,'UTF8')),'hex'),'' order by id collate "C"),'UTF8')),'hex') into actual,proof from quiz_game_internal.content_staging where hash=content_hash;
 if proof is distinct from content_hash then raise exception 'game_content_proof_mismatch';end if;
 if expected_count<30 or actual<>expected_count or exists(select 1 from quiz_game_internal.content_staging where hash=content_hash and (id is distinct from question->>'id' or jsonb_array_length(question->'answers')<>4 or question->>'knowledgeId' is null)) then raise exception 'game_content_incomplete';end if;
 delete from quiz_ranked_internal.catalog;
 insert into quiz_ranked_internal.catalog
 select content_hash,id,question->>'knowledgeId',question->>'difficulty',coalesce(nullif(question->'metadata'->>'subdomain',''),question->>'domain'),
 case when question->'metadata' ? 'person_id' then 'actors' when question->'tags' ? 'Preisträger' then 'awards' else 'film' end,question from quiz_game_internal.content_staging where hash=content_hash;
 insert into quiz_ranked_internal.config values(true,content_hash,actual) on conflict(id) do update set release_hash=excluded.release_hash,question_count=excluded.question_count;
 delete from quiz_game_internal.presentations;
 insert into quiz_game_internal.presentations select id,question->>'version',question->>'question',question->>'context',presentation from quiz_game_internal.content_staging where hash=content_hash;
 delete from quiz_game_internal.curriculum;
 insert into quiz_game_internal.curriculum select key,value from jsonb_each(plans);
 delete from quiz_game_internal.familiarity;
 insert into quiz_game_internal.familiarity select value->>'film',(value->>'level')::integer from jsonb_array_elements(film_levels);
 -- Duels own their thirty issued questions. Removed content needs no archive.
 delete from public.quiz_duel_catalog;
 insert into public.quiz_duel_catalog(id,knowledge_id,difficulty,genre,familiarity,question,enabled)
 select c.id,c.knowledge_id,c.difficulty,c.genre,coalesce(f.level,0),c.question,true from quiz_ranked_internal.catalog c left join quiz_game_internal.familiarity f on f.film=(c.question->'metadata'->>'film_title_original')||'|'||(c.question->'metadata'->>'film_year')
 where c.source<>'actors' and c.difficulty in ('leicht','mittel','schwer') and c.question->>'demo'='false';
 perform quiz_game_internal.refresh_content();
 delete from quiz_game_internal.content_staging;
 return jsonb_build_object('hash',content_hash,'questions',actual);
end$$;
revoke all on function quiz_game_internal.activate_content(text,integer,jsonb,jsonb) from public,anon,authenticated;

commit;

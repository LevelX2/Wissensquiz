begin;
-- Current light goals per film group, prepared only when content changes.
create table quiz_game_internal.film_group_goals(area text not null,level integer not null check(level between 1 and 4),goals text[] not null,primary key(area,level));
alter table quiz_game_internal.film_group_goals enable row level security;
revoke all on quiz_game_internal.film_group_goals from public,anon,authenticated;
create or replace function quiz_game_internal.refresh_groups() returns void language plpgsql set search_path='' as $$begin
 delete from quiz_game_internal.topic_groups;delete from quiz_game_internal.area_goals;delete from quiz_game_internal.film_group_goals;
 insert into quiz_game_internal.topic_groups
 select scope_kind,scope,topic,array_agg(distinct knowledge_id),array_agg(distinct genre order by genre) from (
 select 'all' scope_kind,'' scope,m.* from quiz_game_internal.catalog_meta m
 union all select 'genre',genre,m.* from quiz_game_internal.catalog_meta m where source='film'
 union all select 'collection',c,m.* from quiz_game_internal.catalog_meta m cross join unnest(array['Classics','Arthouse','Preisträger','Schauspieler']) c where case c when 'Schauspieler' then source='actors' when 'Preisträger' then source='awards' else tags ? c end
 ) grouped group by scope_kind,scope,topic;
 insert into quiz_game_internal.area_goals select case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end,difficulty,array_agg(distinct knowledge_id) from quiz_game_internal.catalog_meta group by 1,2;
 insert into quiz_game_internal.film_group_goals select genre,familiarity,coalesce(array_agg(distinct knowledge_id) filter(where difficulty='leicht'),array[]::text[]) from quiz_game_internal.catalog_meta where source='film' and familiarity>0 group by genre,familiarity;
 delete from quiz_game_internal.area_groups;insert into quiz_game_internal.area_groups select scope,array_agg(distinct goal) from quiz_game_internal.topic_groups cross join lateral unnest(goals) goal where scope_kind in ('genre','collection') group by scope;
 analyze quiz_game_internal.topic_groups;analyze quiz_game_internal.area_goals;analyze quiz_game_internal.film_group_goals;
end$$;
select quiz_game_internal.refresh_groups();

create or replace function quiz_game_internal.journey(player uuid,target uuid) returns jsonb language plpgsql stable set search_path='' as $$
declare secure jsonb; result jsonb:='{}'; a record; groups jsonb;
 levels integer[]; first_level integer; current_level integer; lev integer; n integer; present integer; target_count integer;
 easy integer; medium integer; hard integer; easy_target integer; medium_target integer; hard_target integer;
 medium_open boolean; hard_open boolean; expert_open boolean; independent boolean; diff text; ids text[];
begin
 select coalesce(jsonb_object_agg(area,goals),'{}') into secure from
 (select area,jsonb_object_agg(difficulty,d.ids) goals from (select area,difficulty,jsonb_agg(goal) ids from quiz_game_internal.secure_goals s where owner_id=player and generation=target and exists(select 1 from quiz_game_internal.area_goals available where available.area=s.area and available.difficulty=s.difficulty and s.goal=any(available.goals)) group by area,difficulty) d group by area) s;
 for a in select distinct area from quiz_game_internal.area_goals loop
  independent:=a.area in ('Schauspieler','Preisträger');
  easy:=coalesce(jsonb_array_length(secure->a.area->'leicht'),0); medium:=coalesce(jsonb_array_length(secure->a.area->'mittel'),0); hard:=coalesce(jsonb_array_length(secure->a.area->'schwer'),0);
  select coalesce((select cardinality(goals) from quiz_game_internal.area_goals where area=a.area and difficulty='leicht'),0) into present;
  easy_target:=ceil(present / 2.0)::integer;
  select coalesce((select cardinality(goals) from quiz_game_internal.area_goals where area=a.area and difficulty='mittel'),0) into present;
  medium_target:=ceil(present / 2.0)::integer;
  select coalesce((select cardinality(goals) from quiz_game_internal.area_goals where area=a.area and difficulty='schwer'),0) into present;
  hard_target:=case when independent then ceil(present / 2.0)::integer else 0 end;
  medium_open:=easy_target>0 and easy>=easy_target;
  hard_open:=medium_open and medium_target>0 and medium>=medium_target;
  expert_open:=independent and hard_open and hard_target>0 and hard>=hard_target;
  select coalesce(array_agg(level order by level),array[]::integer[]) into levels from quiz_game_internal.film_group_goals where area=a.area and not independent;
  first_level:=coalesce(levels[1],0); current_level:=first_level; groups:='[]';
  foreach lev in array levels loop
   diff:='leicht';
   select goals into ids from quiz_game_internal.film_group_goals where area=a.area and level=lev;
   target_count:=ceil(cardinality(ids)/2.0)::integer;
   select count(*) into n from unnest(ids) goal where coalesce(secure->a.area->diff,'[]') ? goal;
   groups:=groups||jsonb_build_array(jsonb_build_object('level',lev,'difficulty',diff,'target',target_count,'answered',n,'total',cardinality(ids),'unlocked',lev<=current_level));
   if lev<=current_level and target_count>0 and n>=target_count then select coalesce(min(x),current_level) into current_level from unnest(levels) x where x>lev; end if;
  end loop;
  result:=result||jsonb_build_object(a.area,jsonb_build_object('easy',easy,'medium',medium,'hard',hard,'easyTarget',easy_target,'mediumTarget',medium_target,'hardTarget',hard_target,
  'mediumUnlocked',medium_open,'hardUnlocked',hard_open,'expertUnlocked',expert_open,'independent',independent,'first',first_level,'familiarity',current_level,'groups',groups));
 end loop;
 return result;
end$$;


drop function quiz_game_internal.activate_content(text,integer,jsonb,jsonb);
create function quiz_game_internal.activate_content(content_hash text,expected_count integer,film_levels jsonb) returns jsonb language plpgsql set search_path='' as $$
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
revoke all on function quiz_game_internal.activate_content(text,integer,jsonb) from public,anon,authenticated;

drop table quiz_game_internal.curriculum;

-- Reproject rights; answers and learning entries remain untouched.
delete from quiz_game_internal.journey_cache;
do $recalculate$declare h record; progress jsonb; earned jsonb; rev bigint;begin
 for h in select owner_id,generation from public.quiz_account_heads where generation is not null for update loop
  progress:=quiz_game_internal.journey(h.owner_id,h.generation);
  select jsonb_object_agg(key,jsonb_build_object('difficulty',case when (value->>'expertUnlocked')::boolean then 3 when (value->>'hardUnlocked')::boolean then 2 when (value->>'mediumUnlocked')::boolean then 1 else 0 end,'familiarity',value->'familiarity')) into earned from jsonb_each(progress);
  update public.quiz_account_heads set revision=revision+1 where owner_id=h.owner_id returning revision into rev;
  update public.quiz_sync_entries set value=jsonb_build_object('version',1,'earned',coalesce(earned,'{}'),'independentAreas',true),changed_revision=rev
   where owner_id=h.owner_id and generation=h.generation and kind='field' and id='journey' and not deleted;
 end loop;
end$recalculate$;
revoke all on function quiz_game_internal.journey(uuid,uuid),quiz_game_internal.refresh_groups() from public,anon,authenticated;
commit;

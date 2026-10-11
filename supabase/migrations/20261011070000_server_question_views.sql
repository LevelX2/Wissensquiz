-- Current content metadata is prepared once by the operator. Account requests
-- never decode quiz_catalog_releases.payload or return a question catalog.
begin;
create schema quiz_game_internal;
revoke all on schema quiz_game_internal from public,anon,authenticated;
create table quiz_game_internal.curriculum(area text primary key, plan jsonb not null);
create table quiz_game_internal.familiarity(film text primary key, level integer not null check(level between 1 and 4));
create table quiz_game_internal.catalog_meta(
 id text primary key, knowledge_id text not null, topic text not null,
 genre text not null, source text not null, difficulty text not null,
 familiarity integer not null, tags jsonb not null
);
create index game_meta_goal on quiz_game_internal.catalog_meta(knowledge_id);
create index game_meta_selection on quiz_game_internal.catalog_meta(source,genre,difficulty,familiarity,knowledge_id);
create index game_meta_topic on quiz_game_internal.catalog_meta(topic,knowledge_id);
create table quiz_game_internal.content_info(id boolean primary key check(id), value jsonb not null);
create table quiz_game_internal.journey_cache(owner_id uuid primary key references auth.users(id) on delete cascade,generation uuid,revision bigint,release_hash text,value jsonb not null);
create index quiz_sync_entries_goal on public.quiz_sync_entries(owner_id,generation,(value->>'knowledgeId'),position)
 where kind='event' and not deleted;
alter table quiz_game_internal.curriculum enable row level security;
alter table quiz_game_internal.familiarity enable row level security;
alter table quiz_game_internal.catalog_meta enable row level security;
alter table quiz_game_internal.content_info enable row level security;
alter table quiz_game_internal.journey_cache enable row level security;
revoke all on all tables in schema quiz_game_internal from public,anon,authenticated;

create function quiz_game_internal.refresh_content() returns jsonb language plpgsql set search_path='' as $$
declare release text; info jsonb;
begin
 select release_hash into release from quiz_ranked_internal.config where id;
 if release is null then raise exception 'game_content_missing'; end if;
 delete from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.catalog_meta
 select c.id,c.knowledge_id,c.question->>'topic',c.genre,c.source,c.difficulty,
 coalesce(f.level,0),c.question->'tags'
 from quiz_ranked_internal.catalog c left join quiz_game_internal.familiarity f
 on f.film=(c.question->'metadata'->>'film_title_original')||'|'||(c.question->'metadata'->>'film_year')
 where c.release_hash=release;
 select jsonb_build_object('hash',release,'questions',count(*),'goals',count(distinct knowledge_id),
 'genres',(select jsonb_agg(genre order by genre) from (select distinct genre from quiz_game_internal.catalog_meta where source='film') g),
 'areas',count(distinct case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end))
 into info from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.content_info values(true,info) on conflict(id) do update set value=excluded.value;
 analyze quiz_game_internal.catalog_meta;
 return info;
end$$;

create function quiz_game_internal.overview(player uuid,target uuid,goal_ids text[]) returns jsonb
language sql stable set search_path='' as $$
 with goals as (select distinct unnest(goal_ids) id), counts as (
 select coalesce((l.value->>'stage')::integer,-1) stage,l.value->>'status' status from goals g
 left join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=g.id and not l.deleted
 ) select jsonb_build_object('unseen',count(*) filter(where stage=-1),'discovered',count(*) filter(where stage=0),
 'stages',jsonb_build_array(count(*) filter(where stage=1),count(*) filter(where stage=2),count(*) filter(where stage=3),count(*) filter(where stage=4)),
 'mastered',count(*) filter(where status='gefestigt'),'steps',coalesce(sum(greatest(0,stage)),0),'maximum',count(*)*4,
 'percent',case when count(*)=0 then 0 else round(100.0*sum(greatest(0,stage))/(count(*)*4),2) end) from counts
$$;

create function quiz_game_internal.journey(player uuid,target uuid) returns jsonb language plpgsql stable set search_path='' as $$
declare secure jsonb; retained jsonb; result jsonb:='{}'; a record; p jsonb; group_plan jsonb; groups jsonb;
 levels integer[]; first_level integer; current_level integer; lev integer; n integer; present integer; target_count integer;
 easy integer; medium integer; hard integer; easy_target integer; medium_target integer; hard_target integer;
 medium_open boolean; hard_open boolean; expert_open boolean; independent boolean; diff text; ids text[];
begin
 with safe as (
 select distinct q->>'knowledgeId' goal,q->>'difficulty' difficulty,
 case when q->'metadata' ? 'person_id' then 'Schauspieler' when q->'tags' ? 'Preisträger' then 'Preisträger'
 else coalesce(q->'metadata'->>'subdomain',q->>'domain') end area
 from public.quiz_sync_entries r
 join public.quiz_sync_entries e on e.owner_id=r.owner_id and e.generation=r.generation and e.kind='event' and e.round_id=r.id and not e.deleted
 cross join lateral jsonb_array_elements(r.value->'questions') q
 where r.owner_id=player and r.generation=target and r.kind='round' and not r.deleted and r.value->>'status'='completed'
 and q->>'id'=e.value->>'questionId' and e.value->>'correct'='true' and e.value->>'guessed'='false' and e.value->>'answerId' is not null
 ) select coalesce(jsonb_object_agg(area,goals),'{}') into secure from
 (select area,jsonb_object_agg(difficulty,d.ids) goals from
 (select area,difficulty,jsonb_agg(goal) ids from safe group by area,difficulty) d group by area) s;
 select coalesce(value->'earned','{}') into retained from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='journey' and not deleted;
 for a in select distinct case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end area from quiz_game_internal.catalog_meta loop
  independent:=a.area in ('Schauspieler','Preisträger');
  select plan into p from quiz_game_internal.curriculum where area=a.area;
  easy:=coalesce(jsonb_array_length(secure->a.area->'leicht'),0); medium:=coalesce(jsonb_array_length(secure->a.area->'mittel'),0); hard:=coalesce(jsonb_array_length(secure->a.area->'schwer'),0);
  select count(distinct knowledge_id) into present from quiz_game_internal.catalog_meta where difficulty='leicht' and case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end=a.area;
  easy_target:=least(case when independent then 20 else coalesce((p->'difficultyTargets'->>0)::integer,greatest(1,ceil(present*.6)::integer)) end,present);
  select count(distinct knowledge_id) into present from quiz_game_internal.catalog_meta where difficulty='mittel' and case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end=a.area;
  medium_target:=least(case when independent then 20 else coalesce((p->'difficultyTargets'->>1)::integer,greatest(1,ceil(present*.6)::integer)) end,present);
  select count(distinct knowledge_id) into present from quiz_game_internal.catalog_meta where difficulty='schwer' and case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end=a.area;
  hard_target:=case when independent then least(20,present) else 0 end;
  medium_open:=coalesce((retained->a.area->>'difficulty')::integer,0)>=1 or (easy_target>0 and easy>=easy_target);
  hard_open:=coalesce((retained->a.area->>'difficulty')::integer,0)>=2 or (medium_open and medium_target>0 and medium>=medium_target);
  expert_open:=independent and (coalesce((retained->a.area->>'difficulty')::integer,0)>=3 or (hard_open and hard_target>0 and hard>=hard_target));
  select coalesce(array_agg(distinct familiarity order by familiarity),array[]::integer[]) into levels from quiz_game_internal.catalog_meta where source='film' and genre=a.area and familiarity>0 and not independent;
  first_level:=coalesce(levels[1],0); current_level:=greatest(first_level,coalesce((retained->a.area->>'familiarity')::integer,0)); groups:='[]';
  foreach lev in array levels loop
   select value into group_plan from jsonb_array_elements(coalesce(p->'groups','[]')) where (value->>'level')::integer=lev;
   select coalesce(group_plan->>'difficulty',(array_agg(difficulty order by case difficulty when 'leicht' then 1 when 'mittel' then 2 else 3 end))[1],'leicht') into diff
   from quiz_game_internal.catalog_meta where source='film' and genre=a.area and familiarity=lev;
   select coalesce(array_agg(distinct knowledge_id),array[]::text[]) into ids from quiz_game_internal.catalog_meta
   where source='film' and genre=a.area and familiarity=lev and difficulty=diff
   and (group_plan is null or group_plan->'goals' ? knowledge_id);
   target_count:=least(coalesce((group_plan->>'target')::integer,ceil(cardinality(ids)*.6)::integer),cardinality(ids));
   select count(*) into n from unnest(ids) goal where coalesce(secure->a.area->diff,'[]') ? goal;
   groups:=groups||jsonb_build_array(jsonb_build_object('level',lev,'difficulty',diff,'target',target_count,'answered',n,'total',cardinality(ids),'unlocked',lev<=current_level));
   if lev<=current_level and target_count>0 and n>=target_count then select coalesce(min(x),current_level) into current_level from unnest(levels) x where x>lev; end if;
  end loop;
  result:=result||jsonb_build_object(a.area,jsonb_build_object('easy',easy,'medium',medium,'hard',hard,'easyTarget',easy_target,'mediumTarget',medium_target,'hardTarget',hard_target,
  'mediumUnlocked',medium_open,'hardUnlocked',hard_open,'expertUnlocked',expert_open,'independent',independent,'first',first_level,'familiarity',current_level,'groups',groups));
 end loop;
 return result;
end$$;

create function quiz_game_internal.matches(m quiz_game_internal.catalog_meta,filters jsonb,topic text) returns boolean
language plpgsql immutable set search_path='' as $$
declare prefix text; selected text[]; suffix text; matched boolean;
begin
 if not (filters is null or (filters->'difficulties' ? m.difficulty and
 (not(filters ? 'sources') or filters->'sources' ? m.source) and
 (m.source<>'film' or (filters->'genres' ? m.genre and (not(filters ? 'familiarities') or
 (m.familiarity>0 and filters->'familiarities' @> to_jsonb(m.familiarity)) or
 (m.familiarity=0 and filters->'familiarities' @> '[1,2,3,4]'::jsonb)))))) then return false; end if;
 if topic is null or topic='Alle Themen' then return true; end if;
 prefix:=split_part(topic,': ',1); selected:=string_to_array(prefix,' + ');
 suffix:=case when position(': ' in topic)>0 then substr(topic,length(prefix)+3) else null end;
 if selected[1]='Filmfragen' and selected<@array['Filmfragen','Classics','Arthouse','Schauspieler','Preisträger'] then
  matched:=case m.source when 'film' then not(selected && array['Classics','Arthouse']) or (m.tags ? 'Classics' and 'Classics'=any(selected)) or (m.tags ? 'Arthouse' and 'Arthouse'=any(selected))
   when 'actors' then 'Schauspieler'=any(selected) else 'Preisträger'=any(selected) end;
 elsif selected<@array['Classics','Arthouse','Schauspieler','Preisträger'] then
  matched:=m.tags ?| selected;
 else return topic=m.topic; end if;
 return matched and (suffix is null or m.topic=suffix);
end
$$;

create function quiz_game_internal.cached_journey(player uuid,target uuid) returns jsonb language plpgsql set search_path='' as $$
declare rev bigint; release text; result jsonb;
begin
 select revision into rev from public.quiz_account_heads where owner_id=player;
 select release_hash into release from quiz_ranked_internal.config where id;
 select value into result from quiz_game_internal.journey_cache c where c.owner_id=player and c.generation is not distinct from target and c.release_hash=release;
 if found then return result; end if;
 result:=quiz_game_internal.journey(player,target);
 insert into quiz_game_internal.journey_cache values(player,target,rev,release,result) on conflict(owner_id) do update set generation=excluded.generation,revision=excluded.revision,release_hash=excluded.release_hash,value=excluded.value;
 return result;
end$$;

create function quiz_game_internal.pool(player uuid,target uuid,mode text,filters jsonb,topic text,journey jsonb)
returns setof quiz_game_internal.catalog_meta language sql stable set search_path='' as $$
 select m.* from quiz_game_internal.catalog_meta m where quiz_game_internal.matches(m,filters,topic)
 and (mode<>'entdecken' or case when m.source='film' then
 m.familiarity>0 and m.familiarity<=coalesce((journey->m.genre->>'familiarity')::integer,0) and m.difficulty<>'experte'
 and (m.difficulty='leicht' or (journey->m.genre->>case m.difficulty when 'mittel' then 'mediumUnlocked' else 'hardUnlocked' end)::boolean)
 else m.difficulty='leicht' or (journey->case m.source when 'actors' then 'Schauspieler' else 'Preisträger' end->>
 case m.difficulty when 'mittel' then 'mediumUnlocked' when 'schwer' then 'hardUnlocked' else 'expertUnlocked' end)::boolean end)
$$;

create function quiz_game_internal.view(request_text text) returns jsonb language plpgsql set search_path='' as $$
declare player uuid:=auth.uid(); target uuid; req jsonb; action text; info jsonb; journey jsonb; result jsonb; ids text[]; pool_ids text[];
 stamp bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint; due integer; later integer; next_at bigint; zone text; film_ids text[];
begin
 perform quiz_sync_internal.require_owner(player);
 if request_text is null or octet_length(request_text)>4096 then raise exception 'invalid_game_view'; end if;
 req:=request_text::jsonb; action:=req->>'action';
 if jsonb_typeof(req)<>'object' or req-array['action','filters','topic','mode','scope','scopeKind','cursor','answeredOnly','timezone']<>'{}' then raise exception 'invalid_game_view'; end if;
 select generation into target from public.quiz_account_heads where owner_id=player;
 select value into info from quiz_game_internal.content_info where id;
 if info is null then raise exception 'game_content_missing'; end if;
 if action='info' then return info; end if;
 if action='selection' then
  zone:=coalesce(req->>'timezone','UTC');
  if not exists(select 1 from pg_timezone_names where name=zone) then raise exception 'invalid_game_timezone'; end if;
  if coalesce(req->>'mode','') not in ('entdecken','ueben','fehler','rekord','fehlerfrei','zeitkonto') then raise exception 'invalid_game_mode'; end if;
  journey:=quiz_game_internal.cached_journey(player,target);
  select coalesce(array_agg(distinct knowledge_id),array[]::text[]) into pool_ids from quiz_game_internal.pool(player,target,req->>'mode',req->'filters',req->>'topic',journey);
  select array_agg(distinct knowledge_id) into film_ids from quiz_game_internal.catalog_meta where source='film' and knowledge_id=any(pool_ids);
  select count(*) filter(where quiz_game_internal.next_at(value,stamp,zone)<=stamp),count(*) filter(where quiz_game_internal.next_at(value,stamp,zone)>stamp),min(quiz_game_internal.next_at(value,stamp,zone)) filter(where quiz_game_internal.next_at(value,stamp,zone)>stamp)
  into due,later,next_at from public.quiz_sync_entries where owner_id=player and generation=target and kind='learning' and not deleted and id=any(film_ids);
  return jsonb_build_object('poolSize',cardinality(pool_ids),'selectionSize',least(10,case when req->>'mode'='fehler' then due else cardinality(pool_ids) end),
   'repetitions',jsonb_build_object('due',due,'later',later,'nextAt',next_at),'journey',journey);
 elsif action='summary' then
  select array_agg(distinct knowledge_id) into ids from quiz_game_internal.catalog_meta;
  select jsonb_build_object('available',count(distinct m.knowledge_id),'mastered',count(distinct m.knowledge_id) filter(where l.value->>'status'='gefestigt')) into result
  from quiz_game_internal.catalog_meta m left join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=m.knowledge_id and not l.deleted
  where m.source='film' and m.genre='Science-Fiction' and m.difficulty='leicht';
  return quiz_game_internal.overview(player,target,ids)||jsonb_build_object('badge',result);
 elsif action='topics' then
  with page as materialized (
   select topic,array_agg(distinct knowledge_id) goals,array_agg(distinct genre order by genre) genres
   from quiz_game_internal.catalog_meta m
   where topic collate "C">coalesce(req->>'cursor','') collate "C"
   and (req->>'scope' is null or case req->>'scopeKind' when 'genre' then source='film' and genre=req->>'scope' else
    case req->>'scope' when 'Schauspieler' then source='actors' when 'Preisträger' then source='awards' else tags ? (req->>'scope') end end)
   and (coalesce(req->>'answeredOnly','false')<>'true' or exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.value->>'knowledgeId'=m.knowledge_id and (e.value->>'answerId' is not null or e.value->>'dontKnow'='true')))
   group by topic order by topic collate "C" limit 41
  ), limited as (select * from page order by topic collate "C" limit 40)
  select jsonb_build_object('items',coalesce(jsonb_agg(jsonb_build_object('topic',topic,'genres',genres,'goals',cardinality(goals),'learning',quiz_game_internal.overview(player,target,goals)) order by topic collate "C"),'[]'),
   'nextCursor',case when (select count(*) from page)>40 then max(topic collate "C") else null end)
  into result from limited;
  return result;
 elsif action='areas' then
  with groups as (
   select genre topic,array_agg(distinct knowledge_id) ids from quiz_game_internal.catalog_meta where source='film' group by genre
   union all
   select c topic,array_agg(distinct knowledge_id) ids from quiz_game_internal.catalog_meta cross join unnest(array['Classics','Arthouse','Preisträger','Schauspieler']) c
   where case c when 'Schauspieler' then source='actors' when 'Preisträger' then source='awards' else tags ? c end group by c
  ) select coalesce(jsonb_agg(jsonb_build_object('topic',topic,'genres',jsonb_build_array(topic),'goals',cardinality(g.ids),'learning',quiz_game_internal.overview(player,target,g.ids)) order by topic),'[]') into result from groups g;
  return result;
 end if;
 raise exception 'invalid_game_view';
end$$;

create function public.quiz_game_view(request_text text) returns jsonb language sql security definer set search_path='' as $$select quiz_game_internal.view(request_text)$$;
create function public.quiz_trial_options() returns jsonb language sql stable security definer set search_path='' as $$select value-'hash'-'questions'-'goals'-'areas' from quiz_game_internal.content_info where id$$;
create function public.quiz_trial_questions(genre text default null) returns jsonb language sql volatile security definer set search_path='' as $$
 with choices as (
 select distinct on (m.knowledge_id) m.id,m.knowledge_id from quiz_game_internal.catalog_meta m
 where m.source='film' and m.difficulty in ('leicht','mittel') and (quiz_trial_questions.genre is null or m.genre=quiz_trial_questions.genre)
 order by m.knowledge_id,gen_random_uuid()
 ), picked as (select id from choices order by gen_random_uuid() limit 10)
 select coalesce(jsonb_agg(public.quiz_year_question(c.question) order by gen_random_uuid()),'[]') from picked p
 join quiz_ranked_internal.config cfg on cfg.id join quiz_ranked_internal.catalog c on c.release_hash=cfg.release_hash and c.id=p.id
$$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
revoke all on function public.quiz_game_view(text),public.quiz_trial_options(),public.quiz_trial_questions(text) from public,anon,authenticated;
grant execute on function public.quiz_game_view(text) to authenticated;
grant execute on function public.quiz_trial_options(),public.quiz_trial_questions(text) to anon,authenticated;
commit;

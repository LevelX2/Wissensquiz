begin;
-- Header/settings and one bounded recent round, never the full account archive.
create index game_boot_round on public.quiz_sync_entries(owner_id,generation,position desc) where kind='round' and not deleted and jsonb_array_length(value->'questions')<=10;
create index sync_entry_position on public.quiz_sync_entries(owner_id,generation,kind,position desc) where not deleted;
create function public.quiz_sync_scope_page(expected_owner uuid,target_generation uuid,expected_revision bigint,scope_text text,page_cursor text default '',page_size integer default 200) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare player uuid:=quiz_sync_internal.require_owner(expected_owner); req jsonb; head public.quiz_account_heads; rounds text[]; goals text[]; result jsonb; positions jsonb;
begin
 if page_size is null or page_size not between 1 and 500 or octet_length(page_cursor)>8192 or scope_text is null or octet_length(scope_text)>32768 then raise exception 'invalid_cursor';end if;
 req:=scope_text::jsonb;
 if req->>'kind' not in ('boot','details') or req-array['kind','rounds','goals']<>'{}' or jsonb_typeof(req)<>'object' then raise exception 'invalid_cursor';end if;
 select * into head from public.quiz_account_heads where owner_id=player;
 if head.generation is distinct from target_generation or head.revision<>expected_revision then raise exception 'download_changed';end if;
 if req->>'kind'='boot' then
  select coalesce(array_agg(id),array[]::text[]) into rounds from (select id from public.quiz_sync_entries where owner_id=player and generation=target_generation and kind='round' and not deleted and jsonb_array_length(value->'questions')<=10 order by position desc limit 1) x;
  select coalesce(array_agg(distinct q->>'knowledgeId'),array[]::text[]) into goals from public.quiz_sync_entries r cross join lateral jsonb_array_elements(r.value->'questions') q where r.owner_id=player and r.generation=target_generation and r.kind='round' and r.id=any(rounds) and not r.deleted;
 else
  if jsonb_typeof(req->'rounds') is distinct from 'array' or jsonb_array_length(req->'rounds')>20 or jsonb_typeof(req->'goals') is distinct from 'array' or jsonb_array_length(req->'goals')>100 then raise exception 'invalid_cursor';end if;
  select coalesce(array_agg(value),array[]::text[]) into rounds from jsonb_array_elements_text(req->'rounds');
  select coalesce(array_agg(value),array[]::text[]) into goals from jsonb_array_elements_text(req->'goals');
 end if;
 with selected as materialized (
 select kind,id,position,value,deleted,kind||':'||id cursor from public.quiz_sync_entries where owner_id=player and generation=target_generation and not deleted and (kind||':'||id)>coalesce(page_cursor,'') and
 (kind='field' or (kind='round' and id=any(rounds)) or (kind='event' and round_id=any(rounds)) or (kind='learning' and id=any(goals))) order by kind||':'||id limit page_size+1
 ), limited as (select * from selected order by cursor limit page_size)
 select jsonb_build_object('generation',target_generation,'revision',expected_revision,'rows',coalesce(jsonb_agg(jsonb_build_object('kind',kind,'id',id,'position',position,'value',value,'deleted',deleted) order by cursor),'[]'),'nextCursor',max(cursor),'done',(select count(*)<=page_size from selected)) into result from limited;
 select jsonb_object_agg(k,p) into positions from (select k,(select max(position) from public.quiz_sync_entries where owner_id=player and generation=target_generation and kind=k and not deleted) p from unnest(array['round','event','learning','record']) k) x;
 return result||jsonb_build_object('positions',positions);
end$$;
revoke all on function public.quiz_sync_scope_page(uuid,uuid,bigint,text,text,integer) from public,anon,authenticated;
grant execute on function public.quiz_sync_scope_page(uuid,uuid,bigint,text,text,integer) to authenticated;
create index ranked_own_completed on quiz_ranked_internal.runs(owner_id,mode,category,finished_at desc) where status='completed';
do $patch$declare d text;begin
 d:=pg_get_functiondef('public.quiz_record_categories(text)'::regprocedure);
 d:=replace(d,'public.quiz_record_categories','public.quiz_own_record_categories');
 d:=replace(d,'s.mode=selected_mode','s.owner_id=auth.uid() and s.mode=selected_mode');
 execute d;
end$patch$;
create function public.quiz_own_record_runs(selected_category text,selected_period text default 'all',page_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p uuid:=quiz_sync_internal.require_owner(auth.uid()); from_at timestamptz:=public.quiz_period_start(selected_period); result jsonb;
begin
 with ranked as (
 select s.*,rank() over(order by s.points desc) place from quiz_ranked_internal.scores s where s.owner_id=p and s.category=selected_category and s.finished_at>=extract(epoch from from_at)*1000 and s.finished_at<extract(epoch from now()+interval '5 minutes')*1000
 and (selected_period='all' or s.finished_at<extract(epoch from (date_trunc(selected_period,now() at time zone 'Europe/Berlin')+case selected_period when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 year' end) at time zone 'Europe/Berlin')*1000)
 ), page as (select * from ranked order by place,finished_at,round_id limit 50 offset greatest(0,coalesce(page_offset,0)))
 select coalesce(jsonb_agg(jsonb_build_object('round_id',round_id,'player_name',player_name,'points',points,'correct',correct,'answers',question_count,'elapsed_ms',elapsed_ms,'finished_at',finished_at,'place',place,'is_mine',true,'experience',0) order by place,finished_at,round_id),'[]') into result from page;
 return result;
end$$;
revoke all on function public.quiz_own_record_categories(text),public.quiz_own_record_runs(text,text,integer) from public,anon,authenticated;
grant execute on function public.quiz_own_record_categories(text),public.quiz_own_record_runs(text,text,integer) to authenticated;

-- Prepared content grouping and incrementally maintained secure learning goals.
create table quiz_game_internal.topic_groups(scope_kind text not null,scope text not null,topic text not null,goals text[] not null,genres text[] not null,primary key(scope_kind,scope,topic));
create table quiz_game_internal.area_goals(area text not null,difficulty text not null,goals text[] not null,primary key(area,difficulty));
create table quiz_game_internal.secure_goals(owner_id uuid not null references auth.users(id) on delete cascade,generation uuid not null,goal text not null,area text not null,difficulty text not null,primary key(owner_id,generation,goal,area,difficulty));
alter table quiz_game_internal.topic_groups enable row level security;
alter table quiz_game_internal.area_goals enable row level security;
alter table quiz_game_internal.secure_goals enable row level security;
revoke all on all tables in schema quiz_game_internal from public,anon,authenticated;
create function quiz_game_internal.refresh_groups() returns void language plpgsql set search_path='' as $$begin
 delete from quiz_game_internal.topic_groups;delete from quiz_game_internal.area_goals;
 insert into quiz_game_internal.topic_groups
 select scope_kind,scope,topic,array_agg(distinct knowledge_id),array_agg(distinct genre order by genre) from (
 select 'all' scope_kind,'' scope,m.* from quiz_game_internal.catalog_meta m
 union all select 'genre',genre,m.* from quiz_game_internal.catalog_meta m where source='film'
 union all select 'collection',c,m.* from quiz_game_internal.catalog_meta m cross join unnest(array['Classics','Arthouse','Preisträger','Schauspieler']) c where case c when 'Schauspieler' then source='actors' when 'Preisträger' then source='awards' else tags ? c end
 ) grouped group by scope_kind,scope,topic;
 insert into quiz_game_internal.area_goals select case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end,difficulty,array_agg(distinct knowledge_id) from quiz_game_internal.catalog_meta group by 1,2;
 analyze quiz_game_internal.topic_groups;analyze quiz_game_internal.area_goals;
end$$;
create function quiz_game_internal.refresh_secure_goal(player uuid,target uuid,goal_id text default null) returns void language plpgsql set search_path='' as $$begin
 delete from quiz_game_internal.secure_goals where owner_id=player and generation=target and (goal_id is null or goal=goal_id);
 insert into quiz_game_internal.secure_goals
 select distinct player,target,e.value->>'knowledgeId',case when q->'metadata' ? 'person_id' or o.content::jsonb->0->'metadata' ? 'person_id' then 'Schauspieler' when q->'tags' ? 'Preisträger' or o.content::jsonb->0->'tags' ? 'Preisträger' then 'Preisträger' else coalesce(q->'metadata'->>'subdomain',q->>'domain') end,q->>'difficulty'
 from public.quiz_sync_entries e join public.quiz_sync_entries r on r.owner_id=e.owner_id and r.generation=e.generation and r.kind='round' and r.id=e.round_id and not r.deleted
 cross join lateral jsonb_array_elements(r.value->'questions') q
 left join public.quiz_private_catalog_objects o on o.owner_id=player and o.generation=target and o.hash=q->'ref'->>'object'
 where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and (goal_id is null or e.value->>'knowledgeId'=goal_id)
 and r.value->>'status'='completed' and q->>'id'=e.value->>'questionId' and e.value->>'correct'='true' and e.value->>'guessed'='false' and e.value->>'answerId' is not null;
end$$;
do $patch$declare d text;h record;begin
 d:=pg_get_functiondef('quiz_game_internal.refresh_content()'::regprocedure);
 d:=replace(d,'analyze quiz_game_internal.catalog_meta;','delete from quiz_game_internal.journey_cache; perform quiz_game_internal.refresh_groups(); analyze quiz_game_internal.catalog_meta;');execute d;
 d:=pg_get_functiondef('quiz_game_internal.project_goal(uuid,uuid,text,bigint,text)'::regprocedure);
 d:=replace(d,'insert into quiz_game_internal.goal_rewards','perform quiz_game_internal.refresh_secure_goal(player,target,goal_id); insert into quiz_game_internal.goal_rewards');execute d;
 d:=pg_get_functiondef('quiz_game_internal.pool(uuid,uuid,text,jsonb,text,jsonb)'::regprocedure);
 d:=replace(d,'where quiz_game_internal.matches(m,filters,topic)',
 'where (filters is null or m.difficulty=any(array(select jsonb_array_elements_text(filters->''difficulties'')))) and (filters is null or not(filters ? ''sources'') or m.source=any(array(select jsonb_array_elements_text(filters->''sources'')))) and (m.source<>''film'' or filters is null or m.genre=any(array(select jsonb_array_elements_text(filters->''genres'')))) and quiz_game_internal.matches(m,filters,topic)');execute d;
 perform quiz_game_internal.refresh_groups();
 for h in select owner_id,generation from public.quiz_account_heads where generation is not null loop perform quiz_game_internal.refresh_secure_goal(h.owner_id,h.generation);end loop;
end$patch$;
create or replace function quiz_game_internal.journey(player uuid,target uuid) returns jsonb language plpgsql stable set search_path='' as $$
declare secure jsonb; retained jsonb; result jsonb:='{}'; a record; p jsonb; group_plan jsonb; groups jsonb;
 levels integer[]; first_level integer; current_level integer; lev integer; n integer; present integer; target_count integer;
 easy integer; medium integer; hard integer; easy_target integer; medium_target integer; hard_target integer;
 medium_open boolean; hard_open boolean; expert_open boolean; independent boolean; diff text; ids text[];
begin
 select coalesce(jsonb_object_agg(area,goals),'{}') into secure from
 (select area,jsonb_object_agg(difficulty,d.ids) goals from (select area,difficulty,jsonb_agg(goal) ids from quiz_game_internal.secure_goals where owner_id=player and generation=target group by area,difficulty) d group by area) s;
 select coalesce(value->'earned','{}') into retained from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='journey' and not deleted;
 for a in select distinct area from quiz_game_internal.area_goals loop
  independent:=a.area in ('Schauspieler','Preisträger');
  select plan into p from quiz_game_internal.curriculum where area=a.area;
  easy:=coalesce(jsonb_array_length(secure->a.area->'leicht'),0); medium:=coalesce(jsonb_array_length(secure->a.area->'mittel'),0); hard:=coalesce(jsonb_array_length(secure->a.area->'schwer'),0);
  select coalesce((select cardinality(goals) from quiz_game_internal.area_goals where area=a.area and difficulty='leicht'),0) into present;
  easy_target:=least(case when independent then 20 else coalesce((p->'difficultyTargets'->>0)::integer,greatest(1,ceil(present*.6)::integer)) end,present);
  select coalesce((select cardinality(goals) from quiz_game_internal.area_goals where area=a.area and difficulty='mittel'),0) into present;
  medium_target:=least(case when independent then 20 else coalesce((p->'difficultyTargets'->>1)::integer,greatest(1,ceil(present*.6)::integer)) end,present);
  select coalesce((select cardinality(goals) from quiz_game_internal.area_goals where area=a.area and difficulty='schwer'),0) into present;
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

revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;

create table quiz_game_internal.area_groups(topic text primary key,goals text[] not null);
alter table quiz_game_internal.area_groups enable row level security;
revoke all on quiz_game_internal.area_groups from public,anon,authenticated;
do $patch$declare d text;begin
 d:=pg_get_functiondef('quiz_game_internal.refresh_groups()'::regprocedure);
 d:=replace(d,'analyze quiz_game_internal.topic_groups;',
 'delete from quiz_game_internal.area_groups; insert into quiz_game_internal.area_groups select scope,array_agg(distinct goal) from quiz_game_internal.topic_groups cross join lateral unnest(goals) goal where scope_kind in (''genre'',''collection'') group by scope; analyze quiz_game_internal.topic_groups;');execute d;
 perform quiz_game_internal.refresh_groups();
end$patch$;

do $patch$declare d text;begin d:=pg_get_functiondef('quiz_game_internal.view(text)'::regprocedure);d:=replace(d,'if action=''info'' then','if action=''topics'' and coalesce(req->>''answeredOnly'',''false'')<>''true'' then
 with page as materialized (select topic,goals,genres from quiz_game_internal.topic_groups where scope_kind=case when req->>''scope'' is null then ''all'' when req->>''scopeKind''=''genre'' then ''genre'' else ''collection'' end and scope=coalesce(req->>''scope'','''') and topic collate "C">coalesce(req->>''cursor'','''') collate "C" order by topic collate "C" limit 41), limited as (select * from page order by topic collate "C" limit 40)
 select jsonb_build_object(''items'',coalesce(jsonb_agg(jsonb_build_object(''topic'',topic,''genres'',genres,''goals'',cardinality(goals),''learning'',quiz_game_internal.overview(player,target,goals)) order by topic collate "C"),''[]''),''nextCursor'',case when (select count(*) from page)>40 then max(topic collate "C") else null end) into result from limited;return result;
 elsif action=''areas'' then
 select coalesce(jsonb_agg(jsonb_build_object(''topic'',topic,''genres'',jsonb_build_array(topic),''goals'',cardinality(goals),''learning'',quiz_game_internal.overview(player,target,goals)) order by topic),''[]'') into result from quiz_game_internal.area_groups;return result;
 end if;
 if action=''info'' then');execute d;end$patch$;

-- Max positions use the existing bounded index instead of scanning all rows.
do $patch$declare name text;d text;begin
 foreach name in array array['quiz_game_internal.project_goal(uuid,uuid,text,bigint,text)','quiz_game_internal.close_run(quiz_game_internal.runs,bigint)'] loop
 d:=pg_get_functiondef(name::regprocedure);
 d:=replace(d,'kind=''learning''),','kind=''learning'' and not deleted),');
 d:=replace(d,'kind=''round'';','kind=''round'' and not e.deleted;');
 d:=replace(d,'kind=''event'';','kind=''event'' and not e.deleted;');execute d;
 end loop;
end$patch$;

create function public.quiz_own_record_location(target_round text,selected_period text default 'all') returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p uuid:=quiz_sync_internal.require_owner(auth.uid()); from_at timestamptz:=public.quiz_period_start(selected_period); result jsonb;
begin
 with target as (select category from quiz_ranked_internal.scores where owner_id=p and round_id=target_round), sorted as (
 select s.round_id,s.category,row_number() over(order by s.points desc,s.finished_at,s.round_id) n from quiz_ranked_internal.scores s join target t on t.category=s.category where s.owner_id=p and s.finished_at>=extract(epoch from from_at)*1000 and s.finished_at<extract(epoch from now()+interval '5 minutes')*1000
 and (selected_period='all' or s.finished_at<extract(epoch from (date_trunc(selected_period,now() at time zone 'Europe/Berlin')+case selected_period when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 year' end) at time zone 'Europe/Berlin')*1000)
 ) select jsonb_build_object('category',category,'offset',((n-1)/50)*50) into result from sorted where round_id=target_round;return result;
end$$;
revoke all on function public.quiz_own_record_location(text,text) from public,anon,authenticated;
grant execute on function public.quiz_own_record_location(text,text) to authenticated;

commit;

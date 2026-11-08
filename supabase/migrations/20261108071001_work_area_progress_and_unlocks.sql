-- Current shared memberships project stable goal evidence into every matching
-- learning area. No answer, learning entry, XP or private goal row is rewritten.
begin;
select pg_advisory_xact_lock(hashtextextended('quiz_current_content',0));

create or replace function quiz_game_internal.work_references(q jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select case when q ? 'works' then q->'works' else coalesce((
  select jsonb_agg(jsonb_build_object('type','film','originalTitle',title,'year',year_text::integer,
   'genres',case when ref=primary_ref and genre not in ('Film','Personen','Schauspieler','Preisträger','')
    then jsonb_build_array(case genre when 'Sci-Fi' then 'Science-Fiction' when 'RomCom' then 'Rom-Com' else genre end) else '[]'::jsonb end,
   'techniques','[]'::jsonb,'collections',case when ref=primary_ref then
    (select coalesce(jsonb_agg(c),'[]'::jsonb) from unnest(array['Classics','Arthouse']) c where q->'tags' ? c)
    else '[]'::jsonb end) order by ordinal)
  from (
   select distinct on(ref) ref,ordinal,primary_ref,genre,
    regexp_replace(ref,'\|[^|]*$','') title,substring(ref from '\|([^|]*)$') year_text
   from (
    select reference ref,ordinal,
     (q->'metadata'->>'film_title_original')||'|'||(q->'metadata'->>'film_year') primary_ref,
     coalesce(nullif(q->'metadata'->>'subdomain',''),q->>'domain','') genre
    from unnest(array_prepend(
     case when coalesce(q->'metadata'->>'film_title_original','')<>'' then
      (q->'metadata'->>'film_title_original')||'|'||(q->'metadata'->>'film_year') end,
     string_to_array(case when q->'tags' ? 'Preisträger' then coalesce(q->'metadata'->>'film_refs','') else '' end,';'))) with ordinality r(reference,ordinal)
   ) refs where ref is not null and ref<>'' order by ref,ordinal
  ) parsed where title<>'' and year_text~'^[1-9][0-9]{3}$'
 ),'[]'::jsonb) end
$$;

create function quiz_game_internal.work_area(kind text,label text) returns text
language sql immutable strict set search_path='' as $$
 select case kind when 'series' then 'Serien · '||label else label end
$$;
create function quiz_game_internal.independent_area(area text) returns boolean
language sql immutable strict set search_path='' as $$
 select area in ('Schauspieler','Preisträger','Serien · Schauspieler','Serien · Preisträger')
$$;

create table quiz_game_internal.catalog_paths(
 id text not null references quiz_game_internal.catalog_meta(id) on delete cascade,
 area text not null,familiarity integer not null check(familiarity between 0 and 4),
 own boolean not null,works jsonb not null,primary key(id,area,familiarity,own)
);
create index game_path_area on quiz_game_internal.catalog_paths(area,familiarity,id) where own;
alter table quiz_game_internal.catalog_paths enable row level security;
revoke all on quiz_game_internal.catalog_paths from public,anon,authenticated;


create table quiz_game_internal.catalog_credits(
 goal text not null,difficulty text not null,area text not null,primary key(goal,difficulty,area)
);
create index game_credits_area on quiz_game_internal.catalog_credits(area,difficulty,goal);
alter table quiz_game_internal.catalog_credits enable row level security;
revoke all on quiz_game_internal.catalog_credits from public,anon,authenticated;

create or replace function quiz_game_internal.refresh_groups() returns void
language plpgsql set search_path='' as $$begin
 delete from quiz_game_internal.catalog_credits;
 delete from quiz_game_internal.catalog_paths;
 insert into quiz_game_internal.catalog_paths
 with subjects as materialized (
  select m.id,m.source,m.difficulty,m.familiarity own_familiarity,w work,
   coalesce((w->>'familiarity')::integer,case when w->>'type'='film' then f.level end,0) work_familiarity
  from quiz_game_internal.catalog_meta m cross join lateral jsonb_array_elements(m.works) w
  left join quiz_game_internal.familiarity f on f.film=(w->>'originalTitle')||'|'||(w->>'year')
 ), memberships as (
  select m.id,case m.source when 'actors' then 'Schauspieler' else 'Preisträger' end area,
   m.familiarity,true own,null::jsonb work
  from quiz_game_internal.catalog_meta m where m.source<>'film' and m.works='[]'::jsonb
  union all
  select id,case when work->>'type'='series' then 'Serien · ' else '' end||
   case source when 'actors' then 'Schauspieler' else 'Preisträger' end,own_familiarity,true,work
  from subjects where source<>'film'
  union all
  select id,case when work->>'type'='series' then 'Serien · ' else '' end||g,
   work_familiarity,source='film',work
  from subjects cross join lateral jsonb_array_elements_text(work->'genres') g
  where difficulty<>'experte' or source='film'
 ) select id,area,familiarity,own,
  coalesce(jsonb_agg(distinct work) filter(where work is not null),'[]'::jsonb)
 from memberships group by id,area,familiarity,own;

 delete from quiz_game_internal.topic_groups;
 delete from quiz_game_internal.area_goals;
 delete from quiz_game_internal.film_group_goals;
 insert into quiz_game_internal.topic_groups
 select scope_kind,scope,topic,array_agg(distinct knowledge_id),array_remove(array_agg(distinct genre order by genre),null)
 from (
  select 'all' scope_kind,'' scope,m.topic,m.knowledge_id,m.genre from quiz_game_internal.catalog_meta m
  union all
  select 'genre',quiz_game_internal.work_area(w->>'type',g),m.topic,m.knowledge_id,g
  from quiz_game_internal.catalog_meta m cross join lateral jsonb_array_elements(m.works) w
  cross join lateral jsonb_array_elements_text(w->'genres') g
  union all
  select 'collection',case m.source when 'actors' then 'Schauspieler' else 'Preisträger' end,m.topic,m.knowledge_id,m.genre
  from quiz_game_internal.catalog_meta m where m.source<>'film'
  union all
  select 'collection',c,m.topic,m.knowledge_id,g
  from quiz_game_internal.catalog_meta m cross join lateral jsonb_array_elements(m.works) w
  cross join lateral jsonb_array_elements_text(coalesce(w->'collections','[]'::jsonb)) c
  left join lateral jsonb_array_elements_text(w->'genres') g on true
 ) relations group by scope_kind,scope,topic;
 insert into quiz_game_internal.catalog_credits
 select distinct m.knowledge_id,m.difficulty,p.area
 from quiz_game_internal.catalog_paths p join quiz_game_internal.catalog_meta m using(id);
 insert into quiz_game_internal.area_goals
 select area,difficulty,array_agg(goal order by goal)
 from quiz_game_internal.catalog_credits group by area,difficulty;
 insert into quiz_game_internal.film_group_goals
 select p.area,p.familiarity,
  coalesce(array_agg(distinct m.knowledge_id) filter(where m.difficulty='leicht'),array[]::text[])
 from quiz_game_internal.catalog_paths p join quiz_game_internal.catalog_meta m using(id)
 where p.familiarity>0 group by p.area,p.familiarity;
 delete from quiz_game_internal.area_groups;
 insert into quiz_game_internal.area_groups
 select scope,array_agg(distinct goal) from quiz_game_internal.topic_groups cross join lateral unnest(goals) goal
 where scope_kind in ('genre','collection') group by scope;
 update quiz_game_internal.content_info set value=jsonb_set(value,'{areas}',
  to_jsonb((select count(distinct area) from quiz_game_internal.catalog_paths))) where id;
 analyze quiz_game_internal.catalog_paths;
 analyze quiz_game_internal.catalog_credits;
 analyze quiz_game_internal.topic_groups;
 analyze quiz_game_internal.area_goals;
 analyze quiz_game_internal.film_group_goals;
 perform quiz_game_internal.prepare_achievement_catalog();
end$$;

create or replace function quiz_game_internal.journey(player uuid,target uuid) returns jsonb
language plpgsql stable set search_path='' as $$
declare secure jsonb; result jsonb:='{}'; a record; groups jsonb;
 levels integer[]; first_level integer; current_level integer; lev integer; n integer; present integer; target_count integer;
 easy integer; medium integer; hard integer; easy_target integer; medium_target integer; hard_target integer;
 medium_open boolean; hard_open boolean; expert_open boolean; independent boolean; diff text; ids text[];
begin
 -- Evidence is goal/difficulty based. Current memberships decide its areas,
 -- including when an already learned fact receives another valid assignment.
 select coalesce(jsonb_object_agg(area,goals),'{}') into secure from (
  select area,jsonb_object_agg(difficulty,d.ids) goals from (
   select area,difficulty,jsonb_agg(goal) ids from (
    select distinct available.area,available.difficulty,s.goal
    from quiz_game_internal.secure_goals s join quiz_game_internal.catalog_credits available
     on available.difficulty=s.difficulty and available.goal=s.goal
    where s.owner_id=player and s.generation=target
   ) evidence group by area,difficulty
  ) d group by area
 ) s;
 for a in select distinct area from quiz_game_internal.area_goals loop
  independent:=quiz_game_internal.independent_area(a.area);
  easy:=coalesce(jsonb_array_length(secure->a.area->'leicht'),0);
  medium:=coalesce(jsonb_array_length(secure->a.area->'mittel'),0);
  hard:=coalesce(jsonb_array_length(secure->a.area->'schwer'),0);
  select coalesce((select cardinality(goals) from quiz_game_internal.area_goals where area=a.area and difficulty='leicht'),0) into present;
  easy_target:=ceil(present/2.0)::integer;
  select coalesce((select cardinality(goals) from quiz_game_internal.area_goals where area=a.area and difficulty='mittel'),0) into present;
  medium_target:=ceil(present/2.0)::integer;
  select coalesce((select cardinality(goals) from quiz_game_internal.area_goals where area=a.area and difficulty='schwer'),0) into present;
  hard_target:=case when independent then ceil(present/2.0)::integer else 0 end;
  medium_open:=easy_target>0 and easy>=easy_target;
  hard_open:=medium_open and medium_target>0 and medium>=medium_target;
  expert_open:=independent and hard_open and hard_target>0 and hard>=hard_target;
  select coalesce(array_agg(level order by level),array[]::integer[]) into levels from quiz_game_internal.film_group_goals where area=a.area;
  first_level:=coalesce(levels[1],0);current_level:=first_level;groups:='[]';
  foreach lev in array levels loop
   diff:='leicht';
   select goals into ids from quiz_game_internal.film_group_goals where area=a.area and level=lev;
   target_count:=ceil(cardinality(ids)/2.0)::integer;
   select count(*) into n from unnest(ids) goal where coalesce(secure->a.area->diff,'[]') ? goal;
   groups:=groups||jsonb_build_array(jsonb_build_object('level',lev,'difficulty',diff,'target',target_count,
    'answered',n,'total',cardinality(ids),'unlocked',lev<=current_level));
   if lev<=current_level and target_count>0 and n>=target_count then
    select coalesce(min(x),current_level) into current_level from unnest(levels) x where x>lev;
   end if;
  end loop;
  result:=result||jsonb_build_object(a.area,jsonb_build_object('easy',easy,'medium',medium,'hard',hard,
   'easyTarget',easy_target,'mediumTarget',medium_target,'hardTarget',hard_target,'mediumUnlocked',medium_open,
   'hardUnlocked',hard_open,'expertUnlocked',expert_open,'independent',independent,'first',first_level,
   'familiarity',current_level,'groups',groups));
 end loop;
 return result;
end$$;

create or replace function quiz_game_internal.matches(m quiz_game_internal.catalog_meta,filters jsonb,topic text) returns boolean
language plpgsql immutable set search_path='' as $$
declare prefix text; selected text[]; suffix text; matched boolean;
begin
 if not (filters is null or (filters->'difficulties' ? m.difficulty and
  (not(filters ? 'sources') or filters->'sources' ? m.source) and
  ((coalesce(filters->'genres','null'::jsonb)='null'::jsonb and not(filters ? 'workTypes') and not(filters ? 'techniques') and not(filters ? 'collections')) or quiz_game_internal.matches_work(m.works,filters)) and
  (not(filters ? 'familiarities') or
   (m.familiarity>0 and filters->'familiarities' @> to_jsonb(m.familiarity)) or
   (m.familiarity=0 and filters->'familiarities' @> '[1,2,3,4]'::jsonb)))) then return false; end if;
 if topic is null or topic='Alle Themen' then return true; end if;
 prefix:=split_part(topic,': ',1); selected:=string_to_array(prefix,' + ');
 suffix:=case when position(': ' in topic)>0 then substr(topic,length(prefix)+3) else null end;
 if selected[1]='Filmfragen' and selected<@array['Filmfragen','Classics','Arthouse','Schauspieler','Preisträger'] then
  matched:=case m.source when 'film' then not(selected && array['Classics','Arthouse']) or m.tags ?| selected
   when 'actors' then 'Schauspieler'=any(selected) else 'Preisträger'=any(selected) end;
 elsif selected<@array['Classics','Arthouse','Schauspieler','Preisträger'] then
  matched:=m.tags ?| selected;
 else return topic=m.topic; end if;
 return matched and (suffix is null or m.topic=suffix);
end$$;

-- All criteria are evaluated on one work by the native JSONPath executor.
create or replace function quiz_game_internal.matches_work(works jsonb,filters jsonb) returns boolean
language sql immutable set search_path='' as $$
 select (coalesce(filters->'genres','null'::jsonb)='null'::jsonb and
  not(filters ? 'workTypes') and not(filters ? 'techniques') and not(filters ? 'collections'))
 or jsonb_path_exists(works,
  '$[*] ? (($allGenres == true || @.genres[*] == $genres[*]) && ($allTypes == true || @.type == $types[*]) && ($allTechniques == true || @.techniques[*] == $techniques[*]) && ($allCollections == true || @.collections[*] == $collections[*]))',
  jsonb_build_object('allGenres',coalesce(filters->'genres','null'::jsonb)='null'::jsonb,
   'genres',coalesce(filters->'genres','[]'::jsonb),'allTypes',not(filters ? 'workTypes'),
   'types',coalesce(filters->'workTypes','[]'::jsonb),'allTechniques',not(filters ? 'techniques'),
   'techniques',coalesce(filters->'techniques','[]'::jsonb),'allCollections',not(filters ? 'collections'),
   'collections',coalesce(filters->'collections','[]'::jsonb)))
$$;

create or replace function quiz_game_internal.pool(player uuid,target uuid,mode text,filters jsonb,topic text,journey jsonb)
returns setof quiz_game_internal.catalog_meta language sql stable set search_path='' as $$
 with eligible as materialized (
  select distinct p.id from quiz_game_internal.catalog_paths p
  join quiz_game_internal.catalog_meta m using(id)
  join jsonb_each(journey) j on j.key=p.area
  where mode='entdecken' and p.own
  and ((coalesce(filters->'genres','null'::jsonb)='null'::jsonb and
    not(filters ? 'workTypes') and not(filters ? 'techniques') and not(filters ? 'collections'))
   or quiz_game_internal.matches_work(p.works,filters))
  and p.familiarity>0 and p.familiarity<=coalesce((j.value->>'familiarity')::integer,0)
  and (m.source<>'film' or m.difficulty<>'experte')
  and (m.difficulty='leicht' or coalesce((j.value->>case m.difficulty
   when 'mittel' then 'mediumUnlocked' when 'schwer' then 'hardUnlocked' else 'expertUnlocked' end)::boolean,false))
 )
 select m.* from quiz_game_internal.catalog_meta m where quiz_game_internal.matches(m,pool.filters,pool.topic)
 and (mode<>'entdecken' or m.id in(select id from eligible))
$$;

revoke all on function quiz_game_internal.work_area(text,text) from public,anon,authenticated;
revoke all on function quiz_game_internal.independent_area(text) from public,anon,authenticated;

-- Achievements use shared fact evidence and actual film subjects.
create or replace function quiz_game_internal.prepare_achievement_catalog() returns void
language plpgsql set search_path='' as $$
declare fingerprint text; available jsonb;
begin
 select md5(coalesce(string_agg(row(knowledge_id,source,topic,genre,difficulty,works)::text,E'\n'
  order by knowledge_id,source,topic,genre,difficulty),'')) into fingerprint
 from (select distinct knowledge_id,source,topic,genre,difficulty,works from quiz_game_internal.catalog_meta) f;
 if exists(select 1 from quiz_game_internal.achievement_catalog where id and signature=fingerprint) then return;end if;
 delete from quiz_game_internal.achievement_goals;
 delete from quiz_game_internal.achievement_topics;
 delete from quiz_game_internal.achievement_requirements;
 insert into quiz_game_internal.achievement_goals
 select m.knowledge_id,bool_or(m.difficulty='leicht' and p.id is not null)
 from quiz_game_internal.catalog_meta m left join (
  select distinct id from quiz_game_internal.catalog_paths where area in ('Science-Fiction','Serien · Science-Fiction')
 ) p on p.id=m.id group by m.knowledge_id;
 insert into quiz_game_internal.achievement_topics
 select m.source,m.topic,array_agg(distinct case m.source when 'film' then p.area else m.genre end)
 from quiz_game_internal.catalog_meta m join quiz_game_internal.catalog_paths p on p.id=m.id and p.own
 where m.source<>'film' or p.area not like 'Serien · %'
 group by m.source,m.topic having bool_or(m.difficulty='leicht');
 insert into quiz_game_internal.achievement_requirements
 select distinct m.source,m.topic,m.knowledge_id,p.area
 from quiz_game_internal.catalog_meta m join quiz_game_internal.catalog_paths p on p.id=m.id and p.own
 where m.difficulty='leicht' and (m.source<>'film' or p.area not like 'Serien · %');
 with sizes as (
  select case s when 'film' then 'films' else s end id,count(t.topic)::integer n
  from unnest(array['film','actors','awards']) s left join quiz_game_internal.achievement_topics t on t.source=s group by s
  union all select 'films:'||g,count(*)::integer from quiz_game_internal.achievement_topics cross join lateral unnest(genres) g where source='film' group by g
  union all select 'genreBreadth',count(distinct g)::integer from quiz_game_internal.achievement_topics cross join lateral unnest(genres) g where source='film'
  union all select k,(select count(*)::integer from quiz_game_internal.achievement_goals) from unnest(array['secureFacts','discoveredFacts','masteredFacts']) k
  union all select 'experience',10000
  union all select 'sciFiMastery',case when count(*)>=10 then 10 else 0 end from quiz_game_internal.achievement_goals where sci_fi
 ) select jsonb_object_agg(id,n) into available from sizes;
 insert into quiz_game_internal.achievement_catalog select true,fingerprint,available,count(*)::integer from quiz_game_internal.achievement_goals where sci_fi
 on conflict(id) do update set signature=excluded.signature,available=excluded.available,sci_fi=excluded.sci_fi;
 analyze quiz_game_internal.achievement_goals;
 analyze quiz_game_internal.achievement_topics;
 analyze quiz_game_internal.achievement_requirements;
end$$;

create or replace function quiz_game_internal.achievement_goal_values(player uuid,target uuid,goals text[])
returns table(goal text,secure boolean,seen boolean,mastered boolean,sci_fi boolean)
language sql stable set search_path='' as $$
 select g.goal,exists(
  select 1 from quiz_game_internal.secure_goals s join quiz_game_internal.catalog_meta m on m.knowledge_id=s.goal
  and m.difficulty=s.difficulty
  where s.owner_id=player and s.generation=target and s.goal=g.goal),
  l.id is not null,coalesce(l.value->>'status'='gefestigt',false),g.sci_fi and coalesce(l.value->>'status'='gefestigt',false)
 from unnest(goals) selected(goal) join quiz_game_internal.achievement_goals g on g.goal=selected.goal
 left join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=g.goal and not l.deleted
$$;

create or replace function quiz_game_internal.rebuild_achievement_current(player uuid,target uuid) returns void
language plpgsql set search_path='' as $$
declare goals text[]; counts jsonb;
begin
 select coalesce(array_agg(goal),array[]::text[]) into goals from (
  select goal from quiz_game_internal.secure_goals where owner_id=player and generation=target
  union select id from public.quiz_sync_entries where owner_id=player and generation=target and kind='learning' and not deleted
 ) touched;
 delete from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target;
 insert into quiz_game_internal.achievement_goal_progress select player,target,v.* from quiz_game_internal.achievement_goal_values(player,target,goals) v;
 delete from quiz_game_internal.achievement_topic_progress where owner_id=player and generation=target;
 insert into quiz_game_internal.achievement_topic_progress
 select player,target,t.source,t.topic from (
  select distinct t.source,t.topic from quiz_game_internal.achievement_requirements r
  join quiz_game_internal.achievement_topics t using(source,topic) where r.goal=any(goals)
 ) t
 where not exists(select 1 from quiz_game_internal.achievement_requirements r where r.source=t.source and r.topic=t.topic
  and not exists(select 1 from quiz_game_internal.secure_goals s where s.owner_id=player and s.generation=target and s.goal=r.goal and s.difficulty='leicht'));
 with entries as (
  select 'secureFacts' id,count(*) filter(where secure)::integer n from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target
  union all select 'discoveredFacts',count(*) filter(where seen)::integer from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target
  union all select 'masteredFacts',count(*) filter(where mastered)::integer from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target
  union all select '_sciFiMastered',count(*) filter(where sci_fi)::integer from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target
  union all select case source when 'film' then 'films' else source end,count(*)::integer from quiz_game_internal.achievement_topic_progress where owner_id=player and generation=target group by source
  union all select 'films:'||g,count(*)::integer from quiz_game_internal.achievement_topic_progress p
   join quiz_game_internal.achievement_topics t using(source,topic) cross join lateral unnest(t.genres) g where p.owner_id=player and p.generation=target and p.source='film' group by g
 ) select jsonb_object_agg(id,n) into counts from entries;
 insert into quiz_game_internal.achievement_current
 select player,target,signature,counts from quiz_game_internal.achievement_catalog where id
 on conflict(owner_id,generation) do update set signature=excluded.signature,counts=excluded.counts;
 delete from quiz_game_internal.achievement_dirty_goals where owner_id=player and generation=target;
end$$;

create or replace function quiz_game_internal.refresh_learning_achievements(player uuid,target uuid,revision bigint) returns void
language plpgsql set search_path='' as $$
declare before_counts jsonb; current_counts jsonb; maxima jsonb; rounds text[]; goals text[]; changes jsonb;
 fingerprint text; t record; entry record; was_learned boolean; is_learned boolean; difference integer; counter_key text;
begin
 select coalesce(array_agg(id),array[]::text[]) into rounds from public.quiz_sync_entries
 where owner_id=player and generation=target and kind='round' and not deleted and changed_revision=revision and value->>'status'='completed';
 if cardinality(rounds)=0 then return;end if;
 select coalesce(counts,'{}') into before_counts from quiz_game_internal.learning_achievements where owner_id=player and generation=target;
 before_counts:=coalesce(before_counts,'{}');
 select signature into fingerprint from quiz_game_internal.achievement_catalog where id;
 select counts into current_counts from quiz_game_internal.achievement_current where owner_id=player and generation=target and signature=fingerprint;
 if current_counts is null then
  -- Only an explicit reset/import or a changed content definition requires
  -- rebuilding the current-format projection. Ordinary rounds use the delta.
  perform quiz_game_internal.rebuild_achievement_current(player,target);
  select counts into current_counts from quiz_game_internal.achievement_current where owner_id=player and generation=target;
 else
  with removed as (delete from quiz_game_internal.achievement_dirty_goals where owner_id=player and generation=target returning goal)
  select coalesce(array_agg(goal),array[]::text[]) into goals from removed;
  with next as materialized(select * from quiz_game_internal.achievement_goal_values(player,target,goals)),
  prior as materialized(select * from quiz_game_internal.achievement_goal_progress where owner_id=player and generation=target and goal=any(goals)),
  saved as (
   insert into quiz_game_internal.achievement_goal_progress select player,target,v.* from next v
   on conflict(owner_id,generation,goal) do update set secure=excluded.secure,seen=excluded.seen,mastered=excluded.mastered,sci_fi=excluded.sci_fi
   where (achievement_goal_progress.secure,achievement_goal_progress.seen,achievement_goal_progress.mastered,achievement_goal_progress.sci_fi)
    is distinct from (excluded.secure,excluded.seen,excluded.mastered,excluded.sci_fi)
  ),
  deltas as (
   select 'secureFacts' id,coalesce(sum(secure::integer),0) n from next union all select 'secureFacts',-coalesce(sum(secure::integer),0) from prior
   union all select 'discoveredFacts',coalesce(sum(seen::integer),0) from next union all select 'discoveredFacts',-coalesce(sum(seen::integer),0) from prior
   union all select 'masteredFacts',coalesce(sum(mastered::integer),0) from next union all select 'masteredFacts',-coalesce(sum(mastered::integer),0) from prior
   union all select '_sciFiMastered',coalesce(sum(sci_fi::integer),0) from next union all select '_sciFiMastered',-coalesce(sum(sci_fi::integer),0) from prior
  ) select jsonb_object_agg(id,n) into changes from (select id,sum(n)::integer n from deltas group by id) d;
  for entry in select * from jsonb_each_text(changes) loop
   current_counts:=jsonb_set(current_counts,array[entry.key],to_jsonb(coalesce((current_counts->>entry.key)::integer,0)+entry.value::integer));
  end loop;
  for t in select distinct definition.* from quiz_game_internal.achievement_requirements r join quiz_game_internal.achievement_topics definition using(source,topic) where r.goal=any(goals) loop
   select exists(select 1 from quiz_game_internal.achievement_topic_progress where owner_id=player and generation=target and source=t.source and topic=t.topic) into was_learned;
   select not exists(select 1 from quiz_game_internal.achievement_requirements r where r.source=t.source and r.topic=t.topic
    and not exists(select 1 from quiz_game_internal.secure_goals s where s.owner_id=player and s.generation=target and s.goal=r.goal and s.difficulty='leicht')) into is_learned;
   if was_learned=is_learned then continue;end if;
   difference:=case when is_learned then 1 else -1 end;
   if is_learned then insert into quiz_game_internal.achievement_topic_progress values(player,target,t.source,t.topic);
   else delete from quiz_game_internal.achievement_topic_progress where owner_id=player and generation=target and source=t.source and topic=t.topic;end if;
   counter_key:=case t.source when 'film' then 'films' else t.source end;
   current_counts:=jsonb_set(current_counts,array[counter_key],to_jsonb(coalesce((current_counts->>counter_key)::integer,0)+difference));
   if t.source='film' then foreach counter_key in array t.genres loop
    current_counts:=jsonb_set(current_counts,array['films:'||counter_key],to_jsonb(coalesce((current_counts->>('films:'||counter_key))::integer,0)+difference));
   end loop;end if;
  end loop;
 end if;
 current_counts:=current_counts||jsonb_build_object(
 'genreBreadth',(select count(*) from jsonb_each_text(current_counts) where key like 'films:%' and value::integer>0),
 'experience',coalesce((select value::text::integer from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='experience' and not deleted),0),
 'sciFiMastery',case when (current_counts->>'_sciFiMastered')::integer>=10 or exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='badges' and not deleted and value ? 'sci-fi-10-v1') then 10 else 0 end
 );
 update quiz_game_internal.achievement_current set counts=current_counts where owner_id=player and generation=target and counts is distinct from current_counts;
 select jsonb_object_agg(key,n) into maxima from (
  select key,max(value::integer) n from (select * from jsonb_each_text(before_counts) union all select * from jsonb_each_text(current_counts-'_sciFiMastered')) all_counts group by key
 ) m;
 insert into quiz_game_internal.learning_achievements values(player,target,maxima)
 on conflict(owner_id,generation) do update set counts=excluded.counts where learning_achievements.counts is distinct from excluded.counts;
 insert into quiz_game_internal.round_learning_achievements
 select player,target,r,jsonb_build_object('before',before_counts,'after',jsonb_build_object('counts',maxima,'available',c.available))
 from unnest(rounds) r cross join quiz_game_internal.achievement_catalog c where c.id
 on conflict(owner_id,generation,round_id) do nothing;
end$$;

do $refresh$begin
 perform quiz_game_internal.refresh_groups();
 delete from quiz_game_internal.journey_cache;
end$refresh$;
commit;

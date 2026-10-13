-- The existing prepared presentation is the single group assignment for every source.
-- Only current catalog projections and the derived journey cache change here.
begin;
select pg_advisory_xact_lock(hashtextextended('quiz_current_content',0));

-- The existing group-goal table now also projects Schauspieler and Preisträger.
create or replace function quiz_game_internal.refresh_groups() returns void language plpgsql set search_path='' as $$begin
 delete from quiz_game_internal.topic_groups;delete from quiz_game_internal.area_goals;delete from quiz_game_internal.film_group_goals;
 insert into quiz_game_internal.topic_groups
 select scope_kind,scope,topic,array_agg(distinct knowledge_id),array_agg(distinct genre order by genre) from (
 select 'all' scope_kind,'' scope,m.* from quiz_game_internal.catalog_meta m
 union all select 'genre',genre,m.* from quiz_game_internal.catalog_meta m where source='film'
 union all select 'collection',c,m.* from quiz_game_internal.catalog_meta m cross join unnest(array['Classics','Arthouse','Preisträger','Schauspieler']) c where case c when 'Schauspieler' then source='actors' when 'Preisträger' then source='awards' else tags ? c end
 ) grouped group by scope_kind,scope,topic;
 insert into quiz_game_internal.area_goals select case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end,difficulty,array_agg(distinct knowledge_id) from quiz_game_internal.catalog_meta group by 1,2;
 insert into quiz_game_internal.film_group_goals select case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end,familiarity,coalesce(array_agg(distinct knowledge_id) filter(where difficulty='leicht'),array[]::text[]) from quiz_game_internal.catalog_meta where familiarity>0 group by 1,2;
 delete from quiz_game_internal.area_groups;insert into quiz_game_internal.area_groups select scope,array_agg(distinct goal) from quiz_game_internal.topic_groups cross join lateral unnest(goals) goal where scope_kind in ('genre','collection') group by scope;
 analyze quiz_game_internal.topic_groups;analyze quiz_game_internal.area_goals;analyze quiz_game_internal.film_group_goals;
 perform quiz_game_internal.prepare_achievement_catalog();
end$$;

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
  select coalesce(array_agg(level order by level),array[]::integer[]) into levels from quiz_game_internal.film_group_goals where area=a.area;
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

create or replace function quiz_game_internal.refresh_content() returns jsonb language plpgsql set search_path='' as $$
declare release text; info jsonb;
begin
 select release_hash into release from quiz_ranked_internal.config where id;
 if release is null then raise exception 'game_content_missing'; end if;
 delete from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.catalog_meta
 select c.id,c.knowledge_id,c.question->>'topic',c.genre,c.source,c.difficulty,
 coalesce((p.value->>'familiarity')::integer,0),c.question->'tags'
 from quiz_ranked_internal.catalog c left join quiz_game_internal.presentations p on p.id=c.id
 where c.release_hash=release;
 select jsonb_build_object('hash',release,'questions',count(*),'goals',count(distinct knowledge_id),
 'genres',(select jsonb_agg(genre order by genre) from (select distinct genre from quiz_game_internal.catalog_meta where source='film') g),
 'areas',count(distinct case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end))
 into info from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.content_info values(true,info) on conflict(id) do update set value=excluded.value;
 delete from quiz_game_internal.journey_cache;
 perform quiz_game_internal.refresh_groups();
 analyze quiz_game_internal.catalog_meta;
 return info;
end$$;

create or replace function quiz_game_internal.matches(m quiz_game_internal.catalog_meta,filters jsonb,topic text) returns boolean
language plpgsql immutable set search_path='' as $$
declare prefix text; selected text[]; suffix text; matched boolean;
begin
 if not (filters is null or (filters->'difficulties' ? m.difficulty and
 (not(filters ? 'sources') or filters->'sources' ? m.source) and
 (m.source<>'film' or filters->'genres' ? m.genre) and
 (not(filters ? 'familiarities') or
  (m.familiarity>0 and filters->'familiarities' @> to_jsonb(m.familiarity)) or
  (m.source='film' and m.familiarity=0 and filters->'familiarities' @> '[1,2,3,4]'::jsonb)))) then return false; end if;
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

create or replace function quiz_game_internal.pool(player uuid,target uuid,mode text,filters jsonb,topic text,journey jsonb)
returns setof quiz_game_internal.catalog_meta language sql stable set search_path='' as $$
 select m.* from quiz_game_internal.catalog_meta m
 cross join lateral (select case m.source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else m.genre end area) a
 where quiz_game_internal.matches(m,pool.filters,pool.topic)
 and (mode<>'entdecken' or (
  m.familiarity>0 and m.familiarity<=coalesce((journey->a.area->>'familiarity')::integer,0)
  and (m.source<>'film' or m.difficulty<>'experte')
  and (m.difficulty='leicht' or coalesce((journey->a.area->>case m.difficulty
    when 'mittel' then 'mediumUnlocked' when 'schwer' then 'hardUnlocked' else 'expertUnlocked' end)::boolean,false))
 ))
$$;

-- No account revisions, answers, learning entries or issued round snapshots change.
do $refresh$begin
 if exists(select 1 from quiz_ranked_internal.config where id) then
  perform quiz_game_internal.refresh_content();
 else
  perform quiz_game_internal.refresh_groups();
  delete from quiz_game_internal.journey_cache;
 end if;
end$refresh$;
revoke all on function quiz_game_internal.refresh_groups(),quiz_game_internal.journey(uuid,uuid),quiz_game_internal.refresh_content(),quiz_game_internal.matches(quiz_game_internal.catalog_meta,jsonb,text),quiz_game_internal.pool(uuid,uuid,text,jsonb,text,jsonb) from public,anon,authenticated;
commit;

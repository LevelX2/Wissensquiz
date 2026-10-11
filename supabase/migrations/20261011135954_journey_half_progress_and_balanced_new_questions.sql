begin;
update quiz_game_internal.curriculum set plan=plan-'difficultyTargets';
-- Difficulty gates use distinct current goals; stored difficulty rights are not authority.
create or replace function quiz_game_internal.journey(player uuid,target uuid) returns jsonb language plpgsql stable set search_path='' as $$
declare secure jsonb; retained jsonb; result jsonb:='{}'; a record; p jsonb; group_plan jsonb; groups jsonb;
 levels integer[]; first_level integer; current_level integer; lev integer; n integer; present integer; target_count integer;
 easy integer; medium integer; hard integer; easy_target integer; medium_target integer; hard_target integer;
 medium_open boolean; hard_open boolean; expert_open boolean; independent boolean; diff text; ids text[];
begin
 select coalesce(jsonb_object_agg(area,goals),'{}') into secure from
 (select area,jsonb_object_agg(difficulty,d.ids) goals from (select area,difficulty,jsonb_agg(goal) ids from quiz_game_internal.secure_goals s where owner_id=player and generation=target and exists(select 1 from quiz_game_internal.area_goals available where available.area=s.area and available.difficulty=s.difficulty and s.goal=any(available.goals)) group by area,difficulty) d group by area) s;
 select coalesce(value->'earned','{}') into retained from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='journey' and not deleted;
 for a in select distinct area from quiz_game_internal.area_goals loop
  independent:=a.area in ('Schauspieler','Preisträger');
  select plan into p from quiz_game_internal.curriculum where area=a.area;
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

-- Draw a difficulty, then a distinct goal, then a variant in that difficulty.
-- Variant counts and cross-difficulty variants give no extra goal tickets.
create or replace function quiz_game_internal.select_queue(player uuid,target uuid,setup jsonb,zone text) returns text[] language plpgsql set search_path='' as $$
declare journey jsonb:=quiz_game_internal.cached_journey(player,target); mode text:=setup->>'mode'; stamp bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 selected text[]; due text[]; repeats text[]; ids text[]:=array[]::text[]; item text; recent text[];
 fresh jsonb; stage text; bucket jsonb; goal text; goal_keys text[];
begin
 select coalesce(array_agg(e.value->>'knowledgeId'),array[]::text[]) into recent from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.round_id in
 (select id from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and not deleted order by position desc limit 3);
 with eligible as materialized (
  select m.*,l.value progress from quiz_game_internal.pool(player,target,mode,setup->'filters',setup->>'topic',journey) m
  left join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=m.knowledge_id and not l.deleted
  where mode<>'fehler' or (m.source='film' and l.value is not null and quiz_game_internal.next_at(l.value,stamp,zone)<=stamp and
   (setup->>'sourceRoundId' is null or exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and e.round_id=setup->>'sourceRoundId' and e.value->>'knowledgeId'=m.knowledge_id and not e.deleted)))
 ), variants as materialized (
  select distinct on(knowledge_id) * from eligible order by knowledge_id,gen_random_uuid()
 ) select
  array_agg(id order by gen_random_uuid()),
  array_agg(id order by (progress->>'due')::bigint,gen_random_uuid()) filter(where progress is not null and quiz_game_internal.next_at(progress,stamp,zone)<=stamp),
  array_agg(id order by knowledge_id=any(recent),coalesce((progress->>'lastSeenAt')::bigint,(progress->>'lastSecure')::bigint,0),(progress->>'seen')::integer,gen_random_uuid()) filter(where progress is not null),
  (select coalesce(jsonb_object_agg(difficulty,goals),'{}') from
   (select difficulty,jsonb_object_agg(knowledge_id,items) goals from
    (select difficulty,knowledge_id,jsonb_agg(id) items from eligible where progress is null group by difficulty,knowledge_id) goals group by difficulty) stages)
 into selected,due,repeats,fresh from variants;
 if mode='ueben' then return selected[1:10]; end if;
 if mode='fehler' then return due[1:10]; end if;
 ids:=coalesce(due[1:4],array[]::text[]);
 while cardinality(ids)<10 and fresh<>'{}' loop
  select key,value into stage,bucket from jsonb_each(fresh) order by gen_random_uuid() limit 1;
  select array_agg(key) into goal_keys from jsonb_each(bucket);
  goal:=goal_keys[1+floor(random()*cardinality(goal_keys))::integer];
  bucket:=bucket->goal;
  item:=bucket->>(floor(random()*jsonb_array_length(bucket))::integer);
  ids:=array_append(ids,item);
  -- A shared goal cannot be drawn again through another difficulty.
  select coalesce(jsonb_object_agg(key,value-goal),'{}') into fresh from jsonb_each(fresh) where value-goal<>'{}';
 end loop;
 foreach item in array coalesce(due,array[]::text[])||coalesce(repeats,array[]::text[]) loop
  if cardinality(ids)=10 then exit;end if;
  if not(item=any(ids)) then ids:=array_append(ids,item);end if;
 end loop;
 return (select array_agg(x order by gen_random_uuid()) from unnest(ids) x);
end$$;

-- Replace the stored projection once, without replaying answers or changing
-- learning data. The normal account revision protocol makes other devices refresh.
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
revoke all on function quiz_game_internal.journey(uuid,uuid),quiz_game_internal.select_queue(uuid,uuid,jsonb,text) from public,anon,authenticated;
commit;

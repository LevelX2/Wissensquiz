-- One current selection route per goal, before area/group/difficulty balancing.
-- Root identity and primary work lead; narrower filters retain alternate access.
begin;
select pg_advisory_xact_lock(hashtextextended('quiz_current_content',0));
alter table quiz_game_internal.catalog_meta add column variant_of text not null default '';
create or replace function quiz_game_internal.refresh_content() returns jsonb
language plpgsql set search_path='' as $$
declare release text; info jsonb;
begin
 select release_hash into release from quiz_ranked_internal.config where id;
 if release is null then raise exception 'game_content_missing'; end if;
 delete from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.catalog_meta(id,knowledge_id,topic,genre,source,difficulty,familiarity,tags,works,variant_of)
 select c.id,c.knowledge_id,c.question->>'topic',c.genre,c.source,c.difficulty,
  coalesce((p.value->>'familiarity')::integer,0),c.question->'tags',quiz_game_internal.work_references(c.question),coalesce(c.question->'metadata'->>'variant_of','')
 from quiz_ranked_internal.catalog c left join quiz_game_internal.presentations p on p.id=c.id
 where c.release_hash=release;
 select jsonb_build_object('hash',release,'questions',count(*),'goals',count(distinct knowledge_id),
  'genres',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from (
   select distinct g.value from quiz_game_internal.catalog_meta m
   cross join lateral jsonb_array_elements(m.works) w
   cross join lateral jsonb_array_elements_text(w->'genres') g where m.source='film') genres),
  'workTypes',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from (
   select distinct w->>'type' value from quiz_game_internal.catalog_meta m
   cross join lateral jsonb_array_elements(m.works) w) types),
  'techniques',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from (
   select distinct t.value from quiz_game_internal.catalog_meta m
   cross join lateral jsonb_array_elements(m.works) w
   cross join lateral jsonb_array_elements_text(w->'techniques') t) techniques),
  'areas',count(distinct case source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else genre end))
 into info from quiz_game_internal.catalog_meta;
 insert into quiz_game_internal.content_info values(true,info) on conflict(id) do update set value=excluded.value;
 delete from quiz_game_internal.journey_cache;
 perform quiz_game_internal.refresh_groups();
 analyze quiz_game_internal.catalog_meta;
 return info;
end$$;

create or replace function quiz_game_internal.select_queue(player uuid,target uuid,setup jsonb,zone text) returns text[] language plpgsql set search_path='' as $$
declare journey jsonb:=quiz_game_internal.cached_journey(player,target); mode text:=setup->>'mode'; stamp bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 selected text[]; due text[]; ids text[]:=array[]::text[]; item text; recent text[]; recent_correct text[];
 routes jsonb; fresh jsonb; area_groups jsonb; group_stages jsonb; bucket jsonb; goal text; goal_keys text[];
 review_sets jsonb; candidates text[]; used_goals text[]:=array[]::text[]; phase integer; limit_count integer;
begin
 select coalesce(array_agg(e.value->>'knowledgeId'),array[]::text[]) into recent from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.round_id in
 (select id from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and not deleted order by position desc limit 3);
 select coalesce(array_agg(distinct e.value->>'knowledgeId'),array[]::text[]) into recent_correct
 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted
 and e.value->>'correct'='true' and (e.value->>'at')::bigint>stamp-86400000 and (e.value->>'at')::bigint<=stamp;
 with raw as materialized (
  select m.*,l.value progress,
   coalesce(m.knowledge_id=any(recent_correct) and quiz_game_internal.next_at(l.value,stamp,zone)>stamp,false) postponed
  from quiz_game_internal.pool(player,target,mode,setup->'filters',setup->>'topic',journey) m
  left join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=m.knowledge_id and not l.deleted
  where mode<>'fehler' or (l.value is not null and quiz_game_internal.next_at(l.value,stamp,zone)<=stamp and
   (setup->>'sourceRoundId' is null or exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and e.round_id=setup->>'sourceRoundId' and e.value->>'knowledgeId'=m.knowledge_id and not e.deleted)))
 ), eligible as materialized (
  select m.*,r.area,r.path_familiarity from raw m
  left join lateral (
   select p.area,p.familiarity path_familiarity from quiz_game_internal.catalog_paths p
   where p.id=m.id and p.own and quiz_game_internal.matches_work(p.works,setup->'filters')
   and (mode<>'entdecken' or (p.familiarity>0 and p.familiarity<=coalesce((journey->p.area->>'familiarity')::integer,0)
    and (m.difficulty='leicht' or coalesce((journey->p.area->>case m.difficulty
     when 'mittel' then 'mediumUnlocked' when 'schwer' then 'hardUnlocked' else 'expertUnlocked' end)::boolean,false))))
   order by (p.area=quiz_game_internal.work_area(coalesce(m.works->0->>'type','film'),
    case m.source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else m.genre end)) desc,
    p.area collate "C",p.familiarity limit 1
  ) r on true where mode<>'entdecken' or r.area is not null
 ), anchors as materialized (
  select distinct on(knowledge_id) knowledge_id,area,path_familiarity,difficulty
  from eligible order by knowledge_id,(variant_of<>''),id collate "C"
 ), slotted as materialized (
  select e.* from eligible e join anchors a on a.knowledge_id=e.knowledge_id
   and (mode<>'entdecken' or (a.area is not distinct from e.area and a.path_familiarity is not distinct from e.path_familiarity
   and a.difficulty=e.difficulty))
 ), variants as materialized (
  select distinct on(knowledge_id) * from slotted order by knowledge_id,gen_random_uuid()
 ) select
  array_agg(id order by postponed,gen_random_uuid()),
  array_agg(id order by (progress->>'due')::bigint,gen_random_uuid()) filter(where progress is not null and quiz_game_internal.next_at(progress,stamp,zone)<=stamp),
  (select coalesce(jsonb_object_agg(area,groups),'{}') from
   (select area,jsonb_object_agg(path_familiarity,stages) groups from
    (select area,path_familiarity,jsonb_object_agg(difficulty,goals) stages from
     (select area,path_familiarity,difficulty,jsonb_object_agg(knowledge_id,items) goals from
      (select area,path_familiarity,difficulty,knowledge_id,jsonb_agg(id) items from slotted where progress is null
       group by area,path_familiarity,difficulty,knowledge_id) goals group by area,path_familiarity,difficulty) stages
     group by area,path_familiarity) groups group by area) areas),
  (select coalesce(jsonb_object_agg(review_phase,items),'{}') from
   (select 3+postponed::integer*2+(knowledge_id=any(recent))::integer review_phase,
     jsonb_agg(id order by coalesce((progress->>'lastSeenAt')::bigint,(progress->>'lastSecure')::bigint,0),
       (progress->>'seen')::integer,gen_random_uuid()) items
    from variants where progress is not null and quiz_game_internal.next_at(progress,stamp,zone)>stamp
    group by postponed,knowledge_id=any(recent)) phases)
  ,coalesce(jsonb_object_agg(id,jsonb_build_object('area',area,'familiarity',path_familiarity)),'{}')
 into selected,due,fresh,review_sets,routes from variants;
 if mode='ueben' then return selected[1:10]; end if;
 if mode='fehler' then return due[1:10]; end if;
 for phase in 0..6 loop
  limit_count:=case when phase=0 then 4 else 10 end;
  if phase=1 then
   while cardinality(ids)<limit_count and fresh<>'{}' loop
    select value into area_groups from jsonb_each(fresh) order by gen_random_uuid() limit 1;
    select value into group_stages from jsonb_each(area_groups) order by gen_random_uuid() limit 1;
    select value into bucket from jsonb_each(group_stages) order by gen_random_uuid() limit 1;
    select array_agg(key) into goal_keys from jsonb_each(bucket);
    goal:=goal_keys[1+floor(random()*cardinality(goal_keys))::integer];
    bucket:=bucket->goal;
    item:=bucket->>(floor(random()*jsonb_array_length(bucket))::integer);
    ids:=array_append(ids,item); used_goals:=array_append(used_goals,goal);
    select coalesce(jsonb_object_agg(a.key,cleaned_area.groups),'{}') into fresh
    from jsonb_each(fresh) a cross join lateral (
     select coalesce(jsonb_object_agg(g.key,cleaned_group.stages),'{}') groups
     from jsonb_each(a.value) g cross join lateral (
      select coalesce(jsonb_object_agg(d.key,d.value-goal),'{}') stages
      from jsonb_each(g.value) d where d.value-goal<>'{}'
     ) cleaned_group where cleaned_group.stages<>'{}'
    ) cleaned_area where cleaned_area.groups<>'{}';
   end loop;
  else
   candidates:=case when phase in (0,2) then coalesce(due,array[]::text[])
    else array(select jsonb_array_elements_text(coalesce(review_sets->phase::text,'[]'))) end;
   while cardinality(ids)<limit_count loop
    with remaining as materialized (
     select m.id,m.knowledge_id,(routes->m.id->>'familiarity')::integer familiarity,
      routes->m.id->>'area' area,x.ord
     from unnest(candidates) with ordinality x(id,ord) join quiz_game_internal.catalog_meta m on m.id=x.id
     where not (m.knowledge_id=any(used_goals))
    ), chosen_area as materialized (
     select r.area from remaining r group by r.area order by gen_random_uuid() limit 1
    ), chosen_group as materialized (
     select r.familiarity from remaining r join chosen_area a on a.area=r.area
     group by r.familiarity order by gen_random_uuid() limit 1
    )
    select r.id,r.knowledge_id into item,goal from remaining r
     join chosen_group g on g.familiarity=r.familiarity join chosen_area a on a.area=r.area
     order by r.ord limit 1;
    if item is null then exit; end if;
    ids:=array_append(ids,item); used_goals:=array_append(used_goals,goal);
   end loop;
  end if;
 end loop;
 return (select array_agg(x order by gen_random_uuid()) from unnest(ids) x);
end$$;
revoke all on function quiz_game_internal.select_queue(uuid,uuid,jsonb,text) from public,anon,authenticated;

select quiz_game_internal.refresh_content() where exists(select 1 from quiz_ranked_internal.config where release_hash is not null);
commit;

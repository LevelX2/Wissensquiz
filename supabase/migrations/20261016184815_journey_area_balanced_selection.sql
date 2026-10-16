begin;

-- Filmreise: familiarity -> area -> difficulty -> goal -> variant for new goals.
-- Reviews: familiarity -> area -> oldest eligible goal within that area.
-- No fixed area quotas; existing due/new/cooldown/recent phases remain in order.
create or replace function quiz_game_internal.select_queue(player uuid,target uuid,setup jsonb,zone text) returns text[] language plpgsql set search_path='' as $$
declare journey jsonb:=quiz_game_internal.cached_journey(player,target); mode text:=setup->>'mode'; stamp bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 selected text[]; due text[]; ids text[]:=array[]::text[]; item text; recent text[]; recent_correct text[];
 fresh jsonb; group_areas jsonb; group_stages jsonb; bucket jsonb; goal text; goal_keys text[];
 review_sets jsonb; candidates text[]; used_goals text[]:=array[]::text[]; phase integer; limit_count integer;
begin
 select coalesce(array_agg(e.value->>'knowledgeId'),array[]::text[]) into recent from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.round_id in
 (select id from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and not deleted order by position desc limit 3);
 select coalesce(array_agg(distinct e.value->>'knowledgeId'),array[]::text[]) into recent_correct
 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted
 and e.value->>'correct'='true' and (e.value->>'at')::bigint>stamp-86400000 and (e.value->>'at')::bigint<=stamp;
 with eligible as materialized (
  select m.*,case m.source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else m.genre end area,l.value progress,
   coalesce(m.knowledge_id=any(recent_correct) and quiz_game_internal.next_at(l.value,stamp,zone)>stamp,false) postponed
  from quiz_game_internal.pool(player,target,mode,setup->'filters',setup->>'topic',journey) m
  left join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=m.knowledge_id and not l.deleted
  where mode<>'fehler' or (l.value is not null and quiz_game_internal.next_at(l.value,stamp,zone)<=stamp and
   (setup->>'sourceRoundId' is null or exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and e.round_id=setup->>'sourceRoundId' and e.value->>'knowledgeId'=m.knowledge_id and not e.deleted)))
 ), variants as materialized (
  select distinct on(knowledge_id) * from eligible order by knowledge_id,gen_random_uuid()
 ) select
  array_agg(id order by postponed,gen_random_uuid()),
  array_agg(id order by (progress->>'due')::bigint,gen_random_uuid()) filter(where progress is not null and quiz_game_internal.next_at(progress,stamp,zone)<=stamp),
  (select coalesce(jsonb_object_agg(familiarity,areas),'{}') from
   (select familiarity,jsonb_object_agg(area,stages) areas from
    (select familiarity,area,jsonb_object_agg(difficulty,goals) stages from
     (select familiarity,area,difficulty,jsonb_object_agg(knowledge_id,items) goals from
      (select familiarity,area,difficulty,knowledge_id,jsonb_agg(id) items from eligible where progress is null
       group by familiarity,area,difficulty,knowledge_id) goals group by familiarity,area,difficulty) stages
     group by familiarity,area) areas group by familiarity) groups),
  (select coalesce(jsonb_object_agg(review_phase,items),'{}') from
   (select 3+postponed::integer*2+(knowledge_id=any(recent))::integer review_phase,
     jsonb_agg(id order by coalesce((progress->>'lastSeenAt')::bigint,(progress->>'lastSecure')::bigint,0),
       (progress->>'seen')::integer,gen_random_uuid()) items
    from variants where progress is not null and quiz_game_internal.next_at(progress,stamp,zone)>stamp
    group by postponed,knowledge_id=any(recent)) phases)
 into selected,due,fresh,review_sets from variants;
 if mode='ueben' then return selected[1:10]; end if;
 if mode='fehler' then return due[1:10]; end if;
 for phase in 0..6 loop
  limit_count:=case when phase=0 then 4 else 10 end;
  if phase=1 then
   while cardinality(ids)<limit_count and fresh<>'{}' loop
    select value into group_areas from jsonb_each(fresh) order by gen_random_uuid() limit 1;
    select value into group_stages from jsonb_each(group_areas) order by gen_random_uuid() limit 1;
    select value into bucket from jsonb_each(group_stages) order by gen_random_uuid() limit 1;
    select array_agg(key) into goal_keys from jsonb_each(bucket);
    goal:=goal_keys[1+floor(random()*cardinality(goal_keys))::integer];
    bucket:=bucket->goal;
    item:=bucket->>(floor(random()*jsonb_array_length(bucket))::integer);
    ids:=array_append(ids,item); used_goals:=array_append(used_goals,goal);
    select coalesce(jsonb_object_agg(g.key,cleaned_group.areas),'{}') into fresh
    from jsonb_each(fresh) g cross join lateral (
     select coalesce(jsonb_object_agg(a.key,cleaned_area.stages),'{}') areas
     from jsonb_each(g.value) a cross join lateral (
      select coalesce(jsonb_object_agg(d.key,d.value-goal),'{}') stages
      from jsonb_each(a.value) d where d.value-goal<>'{}'
     ) cleaned_area where cleaned_area.stages<>'{}'
    ) cleaned_group where cleaned_group.areas<>'{}';
   end loop;
  else
   candidates:=case when phase in (0,2) then coalesce(due,array[]::text[])
    else array(select jsonb_array_elements_text(coalesce(review_sets->phase::text,'[]'))) end;
   while cardinality(ids)<limit_count loop
    with remaining as materialized (
     select m.id,m.knowledge_id,m.familiarity,
      case m.source when 'actors' then 'Schauspieler' when 'awards' then 'Preisträger' else m.genre end area,x.ord
     from unnest(candidates) with ordinality x(id,ord) join quiz_game_internal.catalog_meta m on m.id=x.id
     where not (m.knowledge_id=any(used_goals))
    ), chosen_group as materialized (
     select r.familiarity from remaining r group by r.familiarity order by gen_random_uuid() limit 1
    ), chosen_area as materialized (
     select r.area from remaining r join chosen_group g on g.familiarity=r.familiarity
     group by r.area order by gen_random_uuid() limit 1
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
commit;

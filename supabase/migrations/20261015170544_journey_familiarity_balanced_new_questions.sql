begin;

-- New goals: unlocked familiarity -> difficulty -> goal -> variant.
-- Every available familiarity group has one ticket, regardless of catalog size.
-- Due repetitions, filters, unlocks and issued round snapshots stay unchanged.
create or replace function quiz_game_internal.select_queue(player uuid,target uuid,setup jsonb,zone text) returns text[] language plpgsql set search_path='' as $$
declare journey jsonb:=quiz_game_internal.cached_journey(player,target); mode text:=setup->>'mode'; stamp bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 selected text[]; due text[]; repeats text[]; ids text[]:=array[]::text[]; item text; recent text[]; recent_correct text[];
 fresh jsonb; group_stages jsonb; bucket jsonb; goal text; goal_keys text[];
begin
 select coalesce(array_agg(e.value->>'knowledgeId'),array[]::text[]) into recent from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.round_id in
 (select id from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and not deleted order by position desc limit 3);
 select coalesce(array_agg(distinct e.value->>'knowledgeId'),array[]::text[]) into recent_correct
 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted
 and e.value->>'correct'='true' and (e.value->>'at')::bigint>stamp-86400000 and (e.value->>'at')::bigint<=stamp;
 with eligible as materialized (
  select m.*,l.value progress,
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
  array_agg(id order by postponed,knowledge_id=any(recent),coalesce((progress->>'lastSeenAt')::bigint,(progress->>'lastSecure')::bigint,0),(progress->>'seen')::integer,gen_random_uuid()) filter(where progress is not null),
  (select coalesce(jsonb_object_agg(familiarity,stages),'{}') from
   (select familiarity,jsonb_object_agg(difficulty,goals) stages from
    (select familiarity,difficulty,jsonb_object_agg(knowledge_id,items) goals from
     (select familiarity,difficulty,knowledge_id,jsonb_agg(id) items from eligible where progress is null group by familiarity,difficulty,knowledge_id) goals group by familiarity,difficulty) stages group by familiarity) groups)
 into selected,due,repeats,fresh from variants;
 if mode='ueben' then return selected[1:10]; end if;
 if mode='fehler' then return due[1:10]; end if;
 ids:=coalesce(due[1:4],array[]::text[]);
 while cardinality(ids)<10 and fresh<>'{}' loop
  select value into group_stages from jsonb_each(fresh) order by gen_random_uuid() limit 1;
  select value into bucket from jsonb_each(group_stages) order by gen_random_uuid() limit 1;
  select array_agg(key) into goal_keys from jsonb_each(bucket);
  goal:=goal_keys[1+floor(random()*cardinality(goal_keys))::integer];
  bucket:=bucket->goal;
  item:=bucket->>(floor(random()*jsonb_array_length(bucket))::integer);
  ids:=array_append(ids,item);
  -- A shared goal disappears from every familiarity group and difficulty after its draw.
  select coalesce(jsonb_object_agg(a.key,cleaned.stages),'{}') into fresh
  from jsonb_each(fresh) a cross join lateral (
   select coalesce(jsonb_object_agg(d.key,d.value-goal),'{}') stages
   from jsonb_each(a.value) d where d.value-goal<>'{}'
  ) cleaned where cleaned.stages<>'{}';
 end loop;
 foreach item in array coalesce(due,array[]::text[])||coalesce(repeats,array[]::text[]) loop
  if cardinality(ids)=10 then exit;end if;
  if not(item=any(ids)) then ids:=array_append(ids,item);end if;
 end loop;
 return (select array_agg(x order by gen_random_uuid()) from unnest(ids) x);
end$$;
revoke all on function quiz_game_internal.select_queue(uuid,uuid,jsonb,text) from public,anon,authenticated;
commit;

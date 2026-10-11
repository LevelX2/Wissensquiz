begin;
create function quiz_game_internal.finish_projection(player uuid,target uuid,revision bigint) returns void language plpgsql set search_path='' as $$
declare xp integer; journey jsonb; earned jsonb; badges jsonb;
begin
 select coalesce(sum(g.xp),0) into xp from quiz_game_internal.goal_rewards g where owner_id=player and generation=target;
 update public.quiz_sync_entries set value=to_jsonb(xp),changed_revision=revision where owner_id=player and generation=target and kind='field' and id='experience';
 journey:=quiz_game_internal.journey(player,target);
 select coalesce(jsonb_object_agg(key,jsonb_build_object('difficulty',case when (value->>'expertUnlocked')::boolean then 3 when (value->>'hardUnlocked')::boolean then 2 when (value->>'mediumUnlocked')::boolean then 1 else 0 end,'familiarity',value->'familiarity')),'{}') into earned from jsonb_each(journey);
 insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,deleted,changed_revision)
 values(player,target,'field','journey',0,jsonb_build_object('version',1,'earned',earned,'independentAreas',true),false,revision)
 on conflict(owner_id,generation,kind,id) do update set value=excluded.value,deleted=false,changed_revision=excluded.changed_revision;
 if (select count(distinct m.knowledge_id) from quiz_game_internal.catalog_meta m join public.quiz_sync_entries l on l.owner_id=player and l.generation=target and l.kind='learning' and l.id=m.knowledge_id and not l.deleted and l.value->>'status'='gefestigt' where m.source='film' and m.genre='Science-Fiction' and m.difficulty='leicht')>=10 then
  update public.quiz_sync_entries set value=case when value ? 'sci-fi-10-v1' then value else value||'"sci-fi-10-v1"'::jsonb end,changed_revision=revision where owner_id=player and generation=target and kind='field' and id='badges';
 end if;
 insert into quiz_game_internal.journey_cache(owner_id,generation,revision,release_hash,value)
 values(player,target,revision,(select release_hash from quiz_ranked_internal.config where id),journey)
 on conflict(owner_id) do update set generation=excluded.generation,revision=excluded.revision,release_hash=excluded.release_hash,value=excluded.value;
 perform quiz_sync_internal.project(player,target,null,true);
end$$;
-- Keep normal setting writes on the existing exact-packet receipt protocol.
-- Server-derived learning, XP and journey fields are never accepted as authority.
create function public.quiz_game_apply(packet_text text,timezone text) returns jsonb language plpgsql security definer set search_path='' as $$
declare packet jsonb; player uuid; target uuid; result jsonb; goals text[]; transformed text; existed boolean; goal text; revision bigint;
begin
 if packet_text is null or octet_length(packet_text)>8388608 or not exists(select 1 from pg_timezone_names where name=timezone) then raise exception 'invalid_game_packet'; end if;
 packet:=packet_text::jsonb; player:=quiz_sync_internal.require_owner((packet->>'owner')::uuid); target:=(packet->>'generation')::uuid;
 perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
 if not exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='catalog' and value='{"source":"server","parts":[]}'::jsonb and not deleted) then raise exception 'invalid_game_format'; end if;
 select exists(select 1 from public.quiz_sync_receipts where owner_id=player and generation=target and packet_id=(packet->>'id')::uuid) into existed;
 select coalesce(array_agg(distinct affected.goal),array[]::text[]) into goals from (
  select c->'row'->'value'->>'knowledgeId' goal from jsonb_array_elements(packet->'changes') c where c->'row'->>'kind'='event'
  union select e.value->>'knowledgeId' from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and
   exists(select 1 from jsonb_array_elements(packet->'changes') c where
    (coalesce(c->'row'->>'kind',c->>'kind')='event' and coalesce(c->'row'->>'id',c->>'id')=e.id) or
    (coalesce(c->'row'->>'kind',c->>'kind')='round' and coalesce(c->'row'->>'id',c->>'id')=e.round_id))
 ) affected where affected.goal is not null;
 -- Preserve the original packet text for idempotency, including all supplied
 -- fields. Canonical projections overwrite derived rows before commit.
 result:=quiz_sync_internal.apply(packet_text);
 if existed then return result; end if;
 revision:=(result->>'revision')::bigint;
 -- A client replay can include derived goals outside the modified round.
 select array_agg(distinct id) into goals from (
  select unnest(goals) id union select coalesce(c->'row'->>'id',c->>'id') from jsonb_array_elements(packet->'changes') c where coalesce(c->'row'->>'kind',c->>'kind')='learning'
 ) all_goals;
 foreach goal in array coalesce(goals,array[]::text[]) loop
  insert into quiz_game_internal.event_zones select player,e.id,timezone from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.value->>'knowledgeId'=goal on conflict do nothing;
  perform quiz_game_internal.project_goal(player,target,goal,revision,timezone);
 end loop;
 if cardinality(goals)>0 or exists(select 1 from jsonb_array_elements(packet->'changes') c where c->'row'->>'kind'='field' and c->'row'->>'id' in ('experience','career','journey','badges')) then
  perform quiz_game_internal.finish_projection(player,target,revision);
 end if;
 return result;
end$$;
-- Complete/abort only: bounded projection and aggregate update. Answer requests
-- never rebuild all journey areas or competition statistics.
do $patch$declare definition text;begin
 select pg_get_functiondef('quiz_game_internal.call(text)'::regprocedure) into definition;
 definition:=replace(definition,'select coalesce(sum(g.xp),0) into xp from quiz_game_internal.goal_rewards g where owner_id=player and generation=head.generation;',
 'perform quiz_game_internal.finish_projection(player,head.generation,head.revision+1); select coalesce(sum(g.xp),0) into xp from quiz_game_internal.goal_rewards g where owner_id=player and generation=head.generation;');
 execute definition;
end$patch$;
revoke all on all functions in schema quiz_game_internal from public,anon,authenticated;
revoke all on function public.quiz_game_apply(text,text) from public,anon,authenticated;
grant execute on function public.quiz_game_apply(text,text) to authenticated;
commit;

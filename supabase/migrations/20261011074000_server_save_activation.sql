begin;
-- Replacing a current-format save is atomic with abandoning its private run.
create function public.quiz_game_activate(expected_owner uuid,target_generation uuid,timezone text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare player uuid; result jsonb; revision bigint; goal text;
begin
 player:=quiz_sync_internal.require_owner(expected_owner);
 if not exists(select 1 from pg_timezone_names where name=timezone) then raise exception 'invalid_timezone'; end if;
 perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
 if not exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target_generation and kind='field' and id='catalog' and not deleted and value='{"source":"server","parts":[]}'::jsonb) then raise exception 'invalid_game_format'; end if;
 result:=public.quiz_sync_activate(expected_owner,target_generation);
 revision:=(result->>'revision')::bigint;
 update quiz_game_internal.runs set status='aborted',finished_at=clock_timestamp() where owner_id=player and generation<>target_generation and status='active';
 for goal in select distinct value->>'knowledgeId' from public.quiz_sync_entries where owner_id=player and generation=target_generation and kind='event' and not deleted loop
  perform quiz_game_internal.project_goal(player,target_generation,goal,revision,timezone);
 end loop;
 perform quiz_game_internal.finish_projection(player,target_generation,revision);
 return result;
end$$;
revoke all on function public.quiz_game_activate(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.quiz_game_activate(uuid,uuid,text) to authenticated;
commit;

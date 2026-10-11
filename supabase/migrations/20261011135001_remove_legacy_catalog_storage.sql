begin;
-- Serialize with account writes and prove progress entries remain unchanged.
do $guard$declare player uuid; fingerprint text;begin
 for player in select owner_id from public.quiz_account_heads order by owner_id loop
  perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
 end loop;
 select md5(jsonb_build_object(
 'heads',(select jsonb_agg(jsonb_build_array(owner_id,generation,revision,cursor_floor,updated_at) order by owner_id) from public.quiz_account_heads),
 'entries',(select jsonb_agg(to_jsonb(e) order by owner_id,generation,kind,id) from public.quiz_sync_entries e)
)::text) into fingerprint;
 perform set_config('quiz.retirement_progress',fingerprint,true);
end$guard$;
-- Remove the retired writer, complete catalog transport and snapshot fallback.
CREATE OR REPLACE FUNCTION quiz_sync_internal.validate_entries(player uuid, target uuid, round_ids text[] DEFAULT NULL::text[], catalog_changed boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_column
declare r public.quiz_sync_entries; item jsonb; referenced_id text; begin
  if not exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='catalog' and not deleted and value='{"source":"server","parts":[]}'::jsonb) then raise exception 'invalid_game_format'; end if;
  for r in select * from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and not deleted and (round_ids is null or id=any(round_ids)) loop
    if r.value->>'status' not in ('active','completed','aborted') or r.value->>'mode' not in ('entdecken','ueben','rekord','fehler','fehlerfrei','zeitkonto')
      or jsonb_typeof(r.value->'questions') is distinct from 'array' or jsonb_array_length(r.value->'questions') not between 1 and (case when r.value->>'mode' in ('fehlerfrei','zeitkonto') then 100000 else 10 end) then raise exception 'invalid_round'; end if;
    if not exists(select 1 from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target and o.hash=r.value->>'beforeObject' and o.encoding='json-v1' and jsonb_typeof(o.content::jsonb)='object') then raise exception 'missing_before_object'; end if;
    if r.value ? 'archive' then
      if r.value->'archive' is distinct from '{"version":1}'::jsonb or r.value->>'status'='active' or
        r.value->'order' is distinct from '[]'::jsonb or
        exists(select 1 from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target and o.hash=r.value->>'beforeObject' and o.content::jsonb<>'{}'::jsonb) or
        (r.value ? 'run' and (r.value->'run'->'pool' is distinct from '[]'::jsonb or r.value->'run'->'queue' is distinct from '[]'::jsonb)) then raise exception 'invalid_round_archive'; end if;
      for item in select value from jsonb_array_elements(r.value->'questions') loop perform quiz_sync_internal.check_round_fact(item); end loop;
    else
      for item in select value from jsonb_array_elements(r.value->'questions') loop perform quiz_sync_internal.check_question(player,target,item); end loop;
    end if;
    if jsonb_typeof(r.value->'events') is distinct from 'array' or jsonb_array_length(r.value->'events')>(case when r.value->>'mode' in ('fehlerfrei','zeitkonto') then 100000 else 10 end) then raise exception 'invalid_round_events'; end if;
    if (r.value->>'mode' not in ('fehlerfrei','zeitkonto') and (select count(distinct q->>'id') from jsonb_array_elements(r.value->'questions') q)<>jsonb_array_length(r.value->'questions')) or (select count(distinct e) from jsonb_array_elements_text(r.value->'events') e)<>jsonb_array_length(r.value->'events') or jsonb_array_length(r.value->'events')>jsonb_array_length(r.value->'questions') then raise exception 'invalid_occurrences'; end if;
    if exists(select 1 from jsonb_array_elements_text(r.value->'events') with ordinality occurrence(event_id,ordinal) join public.quiz_sync_entries e on e.owner_id=player and e.generation=target and e.kind='event' and e.id=occurrence.event_id and not e.deleted where e.value->>'questionId' is distinct from r.value->'questions'->((occurrence.ordinal-1)::integer)->>'id') then raise exception 'invalid_event_order'; end if;
    for referenced_id in select value from jsonb_array_elements_text(r.value->'events') loop
      if not exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and e.id=referenced_id and not e.deleted and e.round_id=r.id and exists(select 1 from jsonb_array_elements(r.value->'questions') q where q->>'id'=e.value->>'questionId')) then raise exception 'invalid_event_relation'; end if;
    end loop;
    if exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and e.round_id=r.id and not e.deleted and not (r.value->'events' ? e.id)) then raise exception 'unlisted_round_event'; end if;
  end loop;
end$function$
;
CREATE OR REPLACE FUNCTION public.quiz_game_activate(expected_owner uuid, target_generation uuid, timezone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare player uuid; result jsonb; revision bigint; goal text;
begin
 player:=quiz_sync_internal.require_owner(expected_owner);
 if not exists(select 1 from pg_timezone_names where name=timezone) then raise exception 'invalid_timezone'; end if;
 perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
 if not exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target_generation and kind='field' and id='catalog' and not deleted and value='{"source":"server","parts":[]}'::jsonb) then raise exception 'invalid_game_format'; end if;
 result:=quiz_sync_internal.activate(expected_owner,target_generation);
 revision:=(result->>'revision')::bigint;
 update quiz_game_internal.runs set status='aborted',finished_at=clock_timestamp() where owner_id=player and generation<>target_generation and status='active';
 for goal in select distinct value->>'knowledgeId' from public.quiz_sync_entries where owner_id=player and generation=target_generation and kind='event' and not deleted loop
  perform quiz_game_internal.project_goal(player,target_generation,goal,revision,timezone);
 end loop;
 perform quiz_game_internal.finish_projection(player,target_generation,revision);
 return result;
end$function$
;
CREATE OR REPLACE FUNCTION public.quiz_project_scores(player uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare target uuid; begin
  select generation into target from public.quiz_account_heads where owner_id=player;
  if target is not null then perform quiz_sync_internal.project(player,target,null,true);
  end if;
end$function$
;
CREATE OR REPLACE FUNCTION public.quiz_set_sharing(participate boolean, expected_owner uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare player uuid:=auth.uid();
begin
 if player is null or not public.quiz_verified_user() then raise exception 'verified_account_required' using errcode='42501'; end if;
 if player is distinct from expected_owner then raise exception 'account_changed' using errcode='42501'; end if;
 if participate is null then raise exception 'invalid_preference'; end if;
 perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
 insert into public.quiz_sharing values(player,participate) on conflict(owner_id) do update set enabled=excluded.enabled;
 perform public.quiz_project_scores(player); return participate;
end;
$function$
;
CREATE OR REPLACE FUNCTION quiz_sync_internal.prune_round_objects(player uuid, target uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
  delete from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target
    and o.created_at<now()-interval '1 day' and not exists(
      select 1 from public.quiz_sync_entries r where r.owner_id=player and r.generation=target
      and r.kind='round' and not r.deleted and (r.value->>'beforeObject'=o.hash or exists(
        select 1 from jsonb_array_elements(r.value->'questions') q where q->'ref'->>'object'=o.hash)));
end $function$;


create or replace function quiz_sync_internal.metadata(expected uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare player uuid:=quiz_sync_internal.require_owner(expected); head public.quiz_account_heads;
begin
 select * into head from public.quiz_account_heads where owner_id=player;
 return jsonb_build_object('protocol',1,'generation',head.generation,'revision',coalesce(head.revision,0),'cursorFloor',coalesce(head.cursor_floor,0));
end$$;
create or replace function quiz_sync_internal.begin_generation(expected uuid,target uuid,parent uuid,base_revision bigint) returns void
language plpgsql security definer set search_path='' as $$
declare player uuid:=quiz_sync_internal.require_owner(expected); head public.quiz_account_heads; existing public.quiz_sync_generations;
begin
 perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
 insert into public.quiz_account_heads(owner_id,revision) values(player,0) on conflict do nothing;
 select * into head from public.quiz_account_heads where owner_id=player for update;
 select * into existing from public.quiz_sync_generations where owner_id=player and id=target;
 if existing.id is not null then
  if existing.parent is distinct from parent or existing.base_revision is distinct from base_revision then raise exception 'generation_mismatch'; end if;
  return;
 end if;
 if parent is distinct from head.generation or base_revision is distinct from head.revision then raise exception 'revision_conflict'; end if;
 insert into public.quiz_sync_generations values(player,target,parent,base_revision,'preparing',now());
end$$;
create or replace function quiz_sync_internal.activate(expected uuid,target uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare player uuid:=quiz_sync_internal.require_owner(expected); head public.quiz_account_heads; source public.quiz_sync_generations;
begin
 perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
 select * into head from public.quiz_account_heads where owner_id=player for update;
 select * into source from public.quiz_sync_generations where owner_id=player and id=target for update;
 if not exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='catalog' and not deleted and value='{"source":"server","parts":[]}'::jsonb) then raise exception 'invalid_game_format'; end if;
 if head.generation=target and source.status='active' then return quiz_sync_internal.metadata(expected); end if;
 if source.status is distinct from 'sealed' or source.parent is distinct from head.generation or source.base_revision is distinct from head.revision then raise exception 'revision_conflict'; end if;
 update public.quiz_sync_generations set status='retired' where owner_id=player and id=head.generation;
 update public.quiz_sync_generations set status='active' where owner_id=player and id=target;
 update public.quiz_sync_entries set changed_revision=head.revision+1 where owner_id=player and generation=target;
 update public.quiz_account_heads set generation=target,revision=head.revision+1,cursor_floor=head.revision+1,updated_at=now() where owner_id=player;
 perform quiz_sync_internal.project(player,target,null,true);
 return quiz_sync_internal.metadata(expected);
end$$;
create or replace function quiz_sync_internal.check_question(player uuid,target uuid,item jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare ref jsonb:=item->'ref'; score jsonb; object_content text;
begin
 if jsonb_typeof(ref) is distinct from 'object' or ref-'object'<>'{}'::jsonb or ref->>'object' is null then raise exception 'invalid_question_reference'; end if;
 select content into object_content from public.quiz_private_catalog_objects where owner_id=player and generation=target and hash=ref->>'object' and encoding='questions-field-refs-v1';
 if object_content is null or jsonb_typeof(object_content::jsonb) is distinct from 'array' or jsonb_array_length(object_content::jsonb)<>1 then raise exception 'missing_private_question'; end if;
 score:=quiz_sync_internal.question_score(object_content::jsonb->0);
 if score is distinct from item-'ref' then raise exception 'question_score_mismatch'; end if;
end$$;
do $patch$declare d text;begin
 d:=pg_get_functiondef('quiz_sync_internal.write_entries(uuid,uuid,jsonb,bigint)'::regprocedure);
 d:=replace(d,'''bundledQuestionIds'',','');
 d:=replace(d,',''bundledQuestionIds''','');
 execute d;
end$patch$;
-- Only the current authenticated game API invokes these implementation helpers.
revoke all on function quiz_sync_internal.apply(text),quiz_sync_internal.activate(uuid,uuid) from public,anon,authenticated;

do $check$begin
 if exists(select 1 from public.quiz_saves) or exists(select 1 from public.quiz_sync_legacy_archives) or exists(select 1 from public.quiz_generation_catalog_refs) then raise exception 'obsolete_storage_not_empty'; end if;
 if exists(select 1 from public.quiz_account_heads h where h.generation is not null and not exists(select 1 from public.quiz_sync_entries e where e.owner_id=h.owner_id and e.generation=h.generation and e.kind='field' and e.id='catalog' and not e.deleted and e.value='{"source":"server","parts":[]}'::jsonb)) then raise exception 'unexpected_game_format'; end if;
end$check$;

drop function public.quiz_sync_apply(text);
drop function public.quiz_sync_activate(uuid,uuid);
drop function public.quiz_sync_catalog(text);
drop function public.quiz_save_state(jsonb,bigint,uuid);
drop function public.quiz_save_state_legacy(jsonb,bigint,uuid);
drop function public.quiz_training_totals(text,text);
drop function quiz_sync_internal.legacy_apply(text);
drop function quiz_sync_internal.catalog(text);
drop function quiz_sync_internal.publish_catalog(text);
drop function quiz_sync_internal.release_fallback(uuid,uuid,bigint,text);
drop function quiz_sync_internal.rollback(uuid,uuid,bigint,text,text);
drop function quiz_sync_internal.resume_protocol(uuid,bigint);
drop function quiz_sync_internal.compact_empty_legacy();
drop table public.quiz_saves;
drop function public.quiz_scores_after_save();
drop function quiz_sync_internal.project_legacy(uuid,jsonb,jsonb);
drop table public.quiz_sync_legacy_archives;
drop table public.quiz_sync_maintenance_receipts;
drop table public.quiz_generation_catalog_refs;
drop table public.quiz_catalog_releases;
drop function quiz_sync_internal.reject_catalog_update();
drop table quiz_sync_internal.catalog_publication_parts;
alter table public.quiz_account_heads drop column sync_paused;
-- Empty/full catalog objects were only produced by the retired compiler.
delete from public.quiz_private_catalog_objects o where encoding='questions-field-refs-v1' and jsonb_array_length(content::jsonb)<>1
 and not exists(select 1 from public.quiz_sync_entries r where r.owner_id=o.owner_id and r.generation=o.generation and r.kind='round' and not r.deleted and exists(select 1 from jsonb_array_elements(r.value->'questions') q where q->'ref'->>'object'=o.hash));
do $guard$declare fingerprint text;begin
 select md5(jsonb_build_object(
 'heads',(select jsonb_agg(jsonb_build_array(owner_id,generation,revision,cursor_floor,updated_at) order by owner_id) from public.quiz_account_heads),
 'entries',(select jsonb_agg(to_jsonb(e) order by owner_id,generation,kind,id) from public.quiz_sync_entries e)
)::text) into fingerprint;
 if fingerprint is distinct from current_setting('quiz.retirement_progress') then raise exception 'progress_changed_during_retirement'; end if;
end$guard$;
notify pgrst,'reload schema';
commit;

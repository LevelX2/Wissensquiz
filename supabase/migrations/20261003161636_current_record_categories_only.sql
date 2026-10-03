-- Only current fixed record categories remain ranked. Answer ledgers, career
-- and private saves are unchanged; obsolete scores can no longer reappear.
begin;
create function quiz_sync_internal.ranked_record(r jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
begin
  if coalesce(r->>'mode','') not in ('rekord','fehlerfrei','zeitkonto') or r->>'status' is distinct from 'completed' or
    coalesce(r->>'recordPreset','') not in ('standard','genre') or
    r->>'ruleVersion' is distinct from 'solo-v1.'||(r->>'mode')||'.'||(r->>'recordPreset') or
    r->>'topic' is distinct from 'Alle Themen' or
    r->'filters'->'difficulties' is distinct from '["leicht","mittel","schwer"]'::jsonb or
    r->'filters'->'familiarities' is distinct from '[1,2,3,4]'::jsonb or
    jsonb_typeof(r->'filters'->'genres') is distinct from 'array' or
    jsonb_typeof(r->'questions') is distinct from 'array' then return false; end if;
  if r->>'mode'='rekord' and jsonb_array_length(r->'questions')<>10 then return false; end if;
  return case r->>'recordPreset'
    when 'genre' then jsonb_array_length(r->'filters'->'genres')=1 and r->'filters'->'sources'='["film"]'::jsonb
    else jsonb_array_length(r->'filters'->'genres')>0 and r->'filters'->'sources'='["film","awards","actors"]'::jsonb end;
end $$;
revoke all on function quiz_sync_internal.ranked_record(jsonb) from public,anon,authenticated;

do $patch$
declare definition text; patched text;
begin
  select replace(pg_get_functiondef('quiz_sync_internal.project_record(uuid,jsonb,jsonb)'::regprocedure),E'\r\n',E'\n') into definition;
  patched:=replace(definition,$old$  if coalesce(input_round->>'recordPreset','') not in ('standard','genre','custom') then
    perform quiz_sync_internal.project_legacy_record(player,input_round,input_events); return;
  end if;
  delete from public.quiz_shared_scores where owner_id=player and round_id=input_round->>'id';$old$,
    $new$  delete from public.quiz_shared_scores where owner_id=player and round_id=input_round->>'id';
  if not quiz_sync_internal.ranked_record(input_round) then return; end if;$new$);
  if patched=definition then raise exception 'current_record_gate_patch_missing'; end if;
  patched:=replace(patched,'''standard'',''genre'',''custom''','''standard'',''genre''');
  patched:=replace(patched,$old$      if rule is null or (rule<>'solo-v1.'||(r->>'mode')||'.'||(r->>'recordPreset') and
        (r->>'mode'<>'rekord' or rule<>'solo-v1.rekord.'||(r->>'recordPreset')||'.L')) then continue; end if;$old$,
    $new$      if rule is distinct from 'solo-v1.'||(r->>'mode')||'.'||(r->>'recordPreset') then continue; end if;$new$);
  if patched like '%project_legacy_record%' or patched like '%.L%' then raise exception 'obsolete_record_projection_remaining'; end if;
  execute patched;
end $patch$;
drop function quiz_sync_internal.project_legacy_record(uuid,jsonb,jsonb);
drop function public.quiz_project_legacy_scores(uuid);

-- Rebuild the small score projection once. This physically removes all
-- obsolete categories, while the strict gate prevents old clients restoring them.
delete from public.quiz_shared_scores;
do $$declare player uuid;begin
  for player in select id from auth.users where email_confirmed_at is not null and not coalesce(is_anonymous,false)
  loop perform public.quiz_project_scores(player); end loop;
end$$;
notify pgrst, 'reload schema';
commit;

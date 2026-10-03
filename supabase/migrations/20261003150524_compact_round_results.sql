-- Closed rounds keep scoring and learning facts, never historical question text.
-- No saved game, public score, generation or catalog is rewritten by this DDL.
begin;
create function quiz_sync_internal.check_round_fact(item jsonb) returns void
language plpgsql set search_path='' as $$
declare field text;
begin
  if jsonb_typeof(item) is distinct from 'object' or
    exists(select 1 from jsonb_object_keys(item) k where k not in ('id','knowledgeId','version','domain','difficulty','correctId','answerIds','metadata','tags')) then
    raise exception 'invalid_round_fact';
  end if;
  foreach field in array array['id','knowledgeId','version','domain','correctId'] loop
    if jsonb_typeof(item->field) is distinct from 'string' or length(item->>field) not between 1 and 200 then raise exception 'invalid_round_fact'; end if;
  end loop;
  if item->>'difficulty' is null or item->>'difficulty' not in ('leicht','mittel','schwer','experte') or
    jsonb_typeof(item->'answerIds') is distinct from 'array' or jsonb_array_length(item->'answerIds')<>4 or
    (select count(distinct a) from jsonb_array_elements_text(item->'answerIds') a)<>4 or
    not (item->'answerIds' ? (item->>'correctId')) or
    exists(select 1 from jsonb_array_elements(item->'answerIds') a where jsonb_typeof(a)<>'string' or length(a#>>'{}') not between 1 and 200) or
    jsonb_typeof(item->'metadata') is distinct from 'object' or
    exists(select 1 from jsonb_each(item->'metadata') m where m.key not in ('subdomain','person_id') or jsonb_typeof(m.value)<>'string' or length(m.value#>>'{}') not between 1 and 200) or
    jsonb_typeof(item->'tags') is distinct from 'array' or jsonb_array_length(item->'tags')>1 or
    exists(select 1 from jsonb_array_elements(item->'tags') t where t<>'"Preisträger"'::jsonb) then
    raise exception 'invalid_round_fact';
  end if;
end $$;
revoke all on function quiz_sync_internal.check_round_fact(jsonb) from public,anon,authenticated;

create function quiz_sync_internal.prune_round_objects(player uuid,target uuid) returns void
language plpgsql security definer set search_path='' as $$begin
  -- One day's grace protects staged objects and delayed/offline packets.
  delete from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target and o.created_at<now()-interval '1 day'
    and not exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and not e.deleted and (
      (e.kind='round' and (e.value->>'beforeObject'=o.hash or exists(select 1 from jsonb_array_elements(e.value->'questions') q where q->'ref'->>'object'=o.hash)))
      or (e.kind='field' and e.id='catalog' and (e.value->>'object'=o.hash or exists(select 1 from jsonb_array_elements(coalesce(e.value->'parts','[]')) p cross join lateral jsonb_array_elements_text(coalesce(p->'objects','[]')) h where h=o.hash)))));
  delete from public.quiz_generation_catalog_refs r where r.owner_id=player and r.generation=target and not exists(
    select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and not e.deleted and (
      (e.kind='round' and exists(select 1 from jsonb_array_elements(e.value->'questions') q where q->'ref'->>'release'=r.release))
      or (e.kind='field' and e.id='catalog' and exists(select 1 from jsonb_array_elements(coalesce(e.value->'parts','[]')) p where p->>'release'=r.release))));
end $$;
revoke all on function quiz_sync_internal.prune_round_objects(uuid,uuid) from public,anon,authenticated;

do $patch$ declare definition text; patched text; signature text; begin
  select pg_get_functiondef('quiz_sync_internal.validate_entries(uuid,uuid,text[],boolean)'::regprocedure) into definition;
  patched:=replace(definition,
    'for item in select value from jsonb_array_elements(r.value->''questions'') loop perform quiz_sync_internal.check_question(player,target,item); end loop;',
    'if r.value ? ''archive'' then
      if r.value->''archive'' is distinct from ''{"version":1}''::jsonb or r.value->>''status''=''active'' or
        r.value->''order'' is distinct from ''[]''::jsonb or
        exists(select 1 from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target and o.hash=r.value->>''beforeObject'' and o.content::jsonb<>''{}''::jsonb) or
        (r.value ? ''run'' and (r.value->''run''->''pool'' is distinct from ''[]''::jsonb or r.value->''run''->''queue'' is distinct from ''[]''::jsonb)) then raise exception ''invalid_round_archive''; end if;
      for item in select value from jsonb_array_elements(r.value->''questions'') loop perform quiz_sync_internal.check_round_fact(item); end loop;
    else
      for item in select value from jsonb_array_elements(r.value->''questions'') loop perform quiz_sync_internal.check_question(player,target,item); end loop;
    end if;');
  if patched=definition then raise exception 'archive_validator_patch_missing'; end if;
  execute patched;
  select pg_get_functiondef('quiz_sync_internal.apply(text)'::regprocedure) into definition;
  patched:=replace(definition,'  perform quiz_sync_internal.project(player,target,affected,fields_changed);',
    '  perform quiz_sync_internal.project(player,target,affected,fields_changed);
  if exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target and kind=''round'' and not deleted and value ? ''archive'') then perform quiz_sync_internal.prune_round_objects(player,target); end if;');
  if patched=definition then raise exception 'archive_prune_patch_missing'; end if;
  execute patched;
  foreach signature in array array['quiz_sync_internal.project_record(uuid,jsonb,jsonb)','public.quiz_project_scores(uuid)'] loop
    select pg_get_functiondef(signature::regprocedure) into definition;
    patched:=replace(definition,'''standard'',''custom''','''standard'',''genre'',''custom''');
    -- All existing custom runs remain readable in their original categories.
    if signature like '%project_record%' then
      patched:=replace(patched,'n:=jsonb_array_length(r->''questions'');',
        'if r->>''recordPreset''=''genre'' and (r->>''topic'' is distinct from ''Alle Themen'' or
          jsonb_typeof(r->''filters''->''genres'') is distinct from ''array'' or jsonb_array_length(r->''filters''->''genres'')<>1 or
          r->''filters''->''sources'' is distinct from ''["film"]''::jsonb or
          r->''filters''->''difficulties'' is distinct from ''["leicht","mittel","schwer"]''::jsonb or
          r->''filters''->''familiarities'' is distinct from ''[1,2,3,4]''::jsonb) then continue; end if;
        n:=jsonb_array_length(r->''questions'');');
    end if;
    if patched<>definition then execute patched; end if;
  end loop;
end $patch$;
notify pgrst, 'reload schema';
commit;

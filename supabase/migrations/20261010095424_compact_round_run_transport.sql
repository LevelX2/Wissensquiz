-- Transport-only round updates. Stored rounds and all existing validators stay
-- complete; apply still checks owner, revision and receipt before calling here.
create or replace function quiz_sync_internal.write_entries(player uuid,target uuid,changes jsonb,new_revision bigint) returns text[]
language plpgsql security definer set search_path='' as $$
declare
  operation jsonb; entry jsonb; entry_kind text; entry_id text;
  affected text[]:=array[]::text[]; old_round text;
  base_value jsonb; base_run jsonb; queue_value jsonb; queue_change jsonb; drop_count integer;
begin
  perform quiz_sync_internal.require_owner(player);
  if jsonb_typeof(changes) is distinct from 'array' or jsonb_array_length(changes)>2000 then raise exception 'invalid_operations'; end if;
  for operation in select value from jsonb_array_elements(changes) loop
    if coalesce(operation->>'op','') not in ('put','delete','round-run') then raise exception 'invalid_operation'; end if;
    entry:=case when operation->>'op'='delete' then operation else operation->'row' end;
    entry_kind:=entry->>'kind'; entry_id:=entry->>'id';
    if entry_kind is null or entry_kind not in ('field','round','event','learning','record') or entry_id is null or length(entry_id) not between 1 and 8192 then raise exception 'invalid_entry'; end if;
    if entry_kind='field' and entry_id not in ('bundledQuestionIds','catalog','schemaVersion','badges','favorites','reports','imports','settings','experience','career','journey') then raise exception 'invalid_field'; end if;
    if operation->>'op'='delete' and entry_kind='field' and entry_id not in ('career','journey','bundledQuestionIds') then raise exception 'required_field'; end if;

    if operation->>'op'='round-run' then
      if entry_kind<>'round' then raise exception 'invalid_round_run'; end if;
      select value into base_value from public.quiz_sync_entries e
        where e.owner_id=player and e.generation=target and e.kind='round' and e.id=entry_id and not e.deleted;
      base_run:=base_value->'run'; queue_change:=operation->'queue';
      if base_value is null or base_value ? 'archive' or entry->'value' ? 'archive' or
        coalesce(base_value->>'mode','') not in ('fehlerfrei','zeitkonto') or
        entry->'value'->>'mode' is distinct from base_value->>'mode' or
        base_run->'version' is distinct from '1'::jsonb or
        jsonb_typeof(base_run->'pool') is distinct from 'array' or
        jsonb_typeof(base_run->'queue') is distinct from 'array' or
        jsonb_typeof(entry->'value'->'run') is distinct from 'object' or
        entry->'value'->'run'->'version' is distinct from '1'::jsonb or
        entry->'value'->'run' ?| array['pool','queue'] or
        jsonb_typeof(queue_change) is distinct from 'object' then raise exception 'invalid_round_run'; end if;
      if queue_change ? 'drop' then
        if queue_change - 'drop' <> '{}'::jsonb or
          coalesce(queue_change->>'drop','') !~ '^[0-9]{1,6}$' then raise exception 'invalid_queue_change'; end if;
        drop_count:=(queue_change->>'drop')::integer;
        if drop_count>jsonb_array_length(base_run->'queue') then raise exception 'invalid_queue_change'; end if;
        if drop_count=0 then queue_value:=base_run->'queue';
        elsif drop_count=1 then queue_value:=(base_run->'queue')-0;
        else
          select coalesce(jsonb_agg(value order by ordinal),'[]'::jsonb) into queue_value
            from jsonb_array_elements(base_run->'queue') with ordinality q(value,ordinal) where ordinal>drop_count;
        end if;
      elsif queue_change ? 'replace' then
        if queue_change - 'replace' <> '{}'::jsonb or jsonb_typeof(queue_change->'replace') is distinct from 'array' then raise exception 'invalid_queue_change'; end if;
        queue_value:=queue_change->'replace';
        if jsonb_array_length(queue_value)>100000 or exists(select 1 from jsonb_array_elements(queue_value) q where jsonb_typeof(q) is distinct from 'string' or length(q#>>'{}') not between 1 and 8192) then raise exception 'invalid_queue_change'; end if;
      else raise exception 'invalid_queue_change'; end if;
      entry:=jsonb_set(entry,'{value,run}',(entry->'value'->'run') || jsonb_build_object('pool',base_run->'pool','queue',queue_value));
    end if;

    select value->>'roundId' into old_round from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind=entry_kind and e.id=entry_id;
    if entry_kind='round' then affected:=array_append(affected,entry_id); end if;
    if entry_kind='event' and old_round is not null then affected:=array_append(affected,old_round); end if;
    if operation->>'op'='delete' then
      insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,deleted,changed_revision) values(player,target,entry_kind,entry_id,0,null,true,new_revision)
        on conflict on constraint quiz_sync_entries_pkey do update set value=null,deleted=true,changed_revision=excluded.changed_revision;
    else
      if entry->'value' is null or entry->'value'='null'::jsonb or coalesce(entry->>'position','') !~ '^[0-9]+$' then raise exception 'invalid_entry'; end if;
      if entry_kind in ('round','event') and entry->'value'->>'id' is distinct from entry_id then raise exception 'invalid_identity'; end if;
      if entry_kind='event' then affected:=array_append(affected,entry->'value'->>'roundId'); end if;
      insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,deleted,changed_revision) values(player,target,entry_kind,entry_id,(entry->>'position')::integer,entry->'value',false,new_revision)
        on conflict on constraint quiz_sync_entries_pkey do update set position=excluded.position,value=excluded.value,deleted=false,changed_revision=excluded.changed_revision;
    end if;
  end loop;
  return affected;
end$$;
revoke all on function quiz_sync_internal.write_entries(uuid,uuid,jsonb,bigint) from public,anon,authenticated;

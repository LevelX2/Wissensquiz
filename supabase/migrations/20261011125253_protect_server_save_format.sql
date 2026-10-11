-- Current server-only accounts must never be written by the retired catalog client.
create function quiz_sync_internal.legacy_apply(packet_text text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare player uuid;
begin
  if octet_length(packet_text)>8388608 then raise exception 'packet_too_large'; end if;
  player:=quiz_sync_internal.require_owner((packet_text::jsonb->>'owner')::uuid);
  perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
  if exists(select 1 from public.quiz_account_heads h join public.quiz_sync_entries e
    on e.owner_id=h.owner_id and e.generation=h.generation
    where h.owner_id=player and e.kind='field' and e.id='catalog' and not e.deleted
      and e.value='{"source":"server","parts":[]}'::jsonb) then
    raise exception 'obsolete_client';
  end if;
  return quiz_sync_internal.apply(packet_text);
end$$;
revoke all on function quiz_sync_internal.legacy_apply(text) from public,anon,authenticated;
grant execute on function quiz_sync_internal.legacy_apply(text) to authenticated;
create or replace function public.quiz_sync_apply(packet_text text) returns jsonb
language sql security invoker set search_path='' as $$select quiz_sync_internal.legacy_apply(packet_text)$$;

-- Activation keeps the current server format even through the old public endpoint.
do $patch$
declare definition text; needle text; replacement text;
begin
  select pg_get_functiondef('quiz_sync_internal.activate(uuid,uuid)'::regprocedure) into definition;
  needle:='  if head.generation=target and source.status=''active'' then';
  replacement:='  if exists(select 1 from public.quiz_sync_entries e where e.owner_id=player
    and e.generation=head.generation and e.kind=''field'' and e.id=''catalog'' and not e.deleted
    and e.value=''{"source":"server","parts":[]}''::jsonb)
    and not exists(select 1 from public.quiz_sync_entries e where e.owner_id=player
    and e.generation=target and e.kind=''field'' and e.id=''catalog'' and not e.deleted
    and e.value=''{"source":"server","parts":[]}''::jsonb) then
    raise exception ''invalid_game_format'';
  end if;
' || needle;
  if strpos(definition,needle)=0 then raise exception 'activation_patch_missing'; end if;
  execute replace(definition,needle,replacement);
end$patch$;
notify pgrst,'reload schema';

-- Operator-only verified fallback and space reclamation. No client maintenance grants.
begin;
alter table public.quiz_account_heads add column sync_paused boolean not null default false;
alter table public.quiz_sync_legacy_archives alter column state drop not null;
alter table public.quiz_private_catalog_objects add column created_at timestamptz not null default now();
create table public.quiz_sync_maintenance_receipts (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  generation uuid not null,
  revision bigint not null,
  backup_sha256 text not null check(backup_sha256 ~ '^[0-9a-f]{64}$'),
  action text not null check(action in ('release_fallback','rollback')),
  created_at timestamptz not null default now()
);
alter table public.quiz_sync_maintenance_receipts enable row level security;
revoke all on public.quiz_sync_maintenance_receipts from public,anon,authenticated;

create or replace function quiz_sync_internal.metadata(expected uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$declare player uuid; head public.quiz_account_heads; legacy bigint; begin
  player:=quiz_sync_internal.require_owner(expected);
  select * into head from public.quiz_account_heads where owner_id=player;
  if head.generation is null then
    select revision into legacy from public.quiz_saves where owner_id=player;
    return jsonb_build_object('protocol',1,'generation',null,'revision',coalesce(legacy,0),'cursorFloor',0,'paused',coalesce(head.sync_paused,false));
  end if;
  return jsonb_build_object('protocol',1,'generation',head.generation,'revision',head.revision,'cursorFloor',head.cursor_floor,'paused',head.sync_paused);
end$$;

create or replace function quiz_sync_internal.activate(expected uuid,target uuid) returns jsonb
language plpgsql security definer set search_path='' as $$declare player uuid; head public.quiz_account_heads; source public.quiz_sync_generations; actual bigint; begin
  player:=quiz_sync_internal.require_owner(expected);
  perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
  select * into head from public.quiz_account_heads where owner_id=player for update;
  select * into source from public.quiz_sync_generations where owner_id=player and id=target for update;
  if head.generation=target and source.status='active' then return quiz_sync_internal.metadata(expected); end if;
  actual:=head.revision;
  if head.generation is null then select coalesce((select revision from public.quiz_saves where owner_id=player),0) into actual; end if;
  if source.status is distinct from 'sealed' or source.parent is distinct from head.generation or source.base_revision<>actual then raise exception 'revision_conflict'; end if;
  if head.generation is null then
    insert into public.quiz_sync_legacy_archives(owner_id,state,revision) select owner_id,null,revision from public.quiz_saves where owner_id=player on conflict do nothing;
    -- Frozen source row remains the fallback; avoid copying its TOAST payload.
  else update public.quiz_sync_generations set status='retired' where owner_id=player and id=head.generation; end if;
  update public.quiz_sync_generations set status='active' where owner_id=player and id=target;
  update public.quiz_sync_entries set changed_revision=actual+1 where owner_id=player and generation=target;
  update public.quiz_account_heads set generation=target,revision=actual+1,cursor_floor=actual+1,updated_at=now() where owner_id=player;
  perform quiz_sync_internal.project(player,target,null,true);
  return quiz_sync_internal.metadata(expected);
end$$;

create or replace function quiz_sync_internal.begin_generation(expected uuid,target uuid,parent uuid,base_revision bigint) returns void
language plpgsql security definer set search_path='' as $$declare player uuid; head public.quiz_account_heads; existing public.quiz_sync_generations; actual bigint; begin
  player:=quiz_sync_internal.require_owner(expected);
  if exists(select 1 from public.quiz_account_heads where owner_id=player and sync_paused) then raise exception 'sync_protocol_paused'; end if;
  perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
  insert into public.quiz_account_heads(owner_id,revision) select player,coalesce((select revision from public.quiz_saves where owner_id=player),0) on conflict do nothing;
  select * into head from public.quiz_account_heads where owner_id=player for update;
  select * into existing from public.quiz_sync_generations where owner_id=player and id=target;
  if existing.id is not null then
    if existing.parent is distinct from parent or existing.base_revision<>base_revision then raise exception 'generation_mismatch'; end if;
    return;
  end if;
  actual:=head.revision;
  if head.generation is null then select coalesce((select revision from public.quiz_saves where owner_id=player),0) into actual; end if;
  if parent is distinct from head.generation or base_revision is null or base_revision<>actual then raise exception 'revision_conflict'; end if;
  insert into public.quiz_sync_generations values(player,target,parent,base_revision,'preparing',now());
end$$;


create function quiz_sync_internal.release_fallback(player uuid,target uuid,expected_revision bigint,backup_sha256 text) returns void
language plpgsql security definer set search_path='' as $$declare head public.quiz_account_heads; begin
  if backup_sha256 is null or backup_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'verified_backup_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
  select * into head from public.quiz_account_heads where owner_id=player for update;
  if head.generation is distinct from target or head.revision is distinct from expected_revision or head.sync_paused then raise exception 'revision_conflict'; end if;
  insert into public.quiz_sync_maintenance_receipts(owner_id,generation,revision,backup_sha256,action) values(player,target,expected_revision,backup_sha256,'release_fallback');
  delete from public.quiz_saves where owner_id=player;
  delete from public.quiz_sync_legacy_archives where owner_id=player;
  delete from public.quiz_sync_generations where owner_id=player and status='retired';
  -- Keep objects prepared by a currently sending/offline client. Replays also
  -- restage their immutable objects before applying an existing frozen packet.
  delete from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target and o.created_at<now()-interval '1 day'
    and not exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and not e.deleted and (
      (e.kind='round' and (e.value->>'beforeObject'=o.hash or exists(select 1 from jsonb_array_elements(e.value->'questions') q where q->'ref'->>'object'=o.hash)))
      or (e.kind='field' and e.id='catalog' and (e.value->>'object'=o.hash or exists(select 1 from jsonb_array_elements(coalesce(e.value->'parts','[]')) p cross join lateral jsonb_array_elements_text(coalesce(p->'objects','[]')) h where h=o.hash)))));
  delete from public.quiz_generation_catalog_refs r where r.owner_id=player and r.generation=target and not exists(
    select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and not e.deleted and (
      (e.kind='round' and exists(select 1 from jsonb_array_elements(e.value->'questions') q where q->'ref'->>'release'=r.release))
      or (e.kind='field' and e.id='catalog' and exists(select 1 from jsonb_array_elements(coalesce(e.value->'parts','[]')) p where p->>'release'=r.release))));
end$$;

create function quiz_sync_internal.compact_empty_legacy() returns boolean
language plpgsql security definer set search_path='' as $$begin
  -- This briefly locks only the old, empty snapshot tables, never new entry writers.
  lock table public.quiz_saves,public.quiz_sync_legacy_archives in access exclusive mode;
  if exists(select 1 from public.quiz_saves) or exists(select 1 from public.quiz_sync_legacy_archives) then return false; end if;
  truncate public.quiz_saves,public.quiz_sync_legacy_archives;return true;
end$$;

create function quiz_sync_internal.rollback(player uuid,target uuid,expected_revision bigint,payload_text text,backup_sha256 text) returns bigint
language plpgsql security definer set search_path='' as $$declare head public.quiz_account_heads; payload jsonb; next_revision bigint; begin
  if backup_sha256 is null or backup_sha256 is distinct from encode(sha256(convert_to(payload_text,'UTF8')),'hex') then raise exception 'verified_backup_required'; end if;
  payload:=payload_text::jsonb;
  if payload->>'schemaVersion' is distinct from '1' or jsonb_typeof(payload->'rounds') is distinct from 'array' or jsonb_typeof(payload->'events') is distinct from 'array' then raise exception 'invalid_state'; end if;
  perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
  select * into head from public.quiz_account_heads where owner_id=player for update;
  if head.generation is distinct from target or head.revision is distinct from expected_revision then raise exception 'revision_conflict'; end if;
  next_revision:=head.revision+1;
  insert into public.quiz_sync_maintenance_receipts(owner_id,generation,revision,backup_sha256,action) values(player,target,expected_revision,backup_sha256,'rollback');
  update public.quiz_sync_generations set status='retired' where owner_id=player and status='active';
  update public.quiz_account_heads set generation=null,revision=next_revision,cursor_floor=0,sync_paused=true,updated_at=now() where owner_id=player;
  delete from public.quiz_round_contributions where owner_id=player;
  delete from public.quiz_player_totals where owner_id=player;
  delete from public.quiz_shared_scores where owner_id=player;
  delete from public.quiz_saves where owner_id=player;
  insert into public.quiz_saves(owner_id,state,revision) values(player,payload,next_revision);
  return next_revision;
end$$;
create function quiz_sync_internal.resume_protocol(player uuid,expected_revision bigint) returns void
language plpgsql security definer set search_path='' as $$begin
  perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
  perform 1 from public.quiz_account_heads h join public.quiz_saves s on s.owner_id=h.owner_id where h.owner_id=player and h.generation is null and h.sync_paused and s.revision=expected_revision for update of h;
  if not found then raise exception 'revision_conflict'; end if;
  update public.quiz_account_heads set sync_paused=false where owner_id=player;
end$$;
revoke all on function quiz_sync_internal.release_fallback(uuid,uuid,bigint,text),quiz_sync_internal.compact_empty_legacy(),quiz_sync_internal.rollback(uuid,uuid,bigint,text,text),quiz_sync_internal.resume_protocol(uuid,bigint) from public,anon,authenticated;
notify pgrst,'reload schema';
commit;

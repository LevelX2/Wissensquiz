-- Entry protocol v1. No production execution is part of preparation.
begin;
create schema if not exists quiz_sync_internal;
revoke all on schema quiz_sync_internal from public,anon;
grant usage on schema quiz_sync_internal to authenticated;

create table public.quiz_catalog_releases (
  hash text primary key check(hash ~ '^[0-9a-f]{64}$'),
  protocol integer not null check(protocol=1),
  payload bytea not null,
  digests jsonb not null check(jsonb_typeof(digests)='array'),
  score_fields jsonb not null check(jsonb_typeof(score_fields)='array'),
  question_count integer not null check(question_count between 0 and 20000),
  created_at timestamptz not null default now(),
  check(jsonb_array_length(digests)=question_count and jsonb_array_length(score_fields)=question_count)
);
create table public.quiz_account_heads (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  generation uuid,
  revision bigint not null default 0 check(revision>=0),
  cursor_floor bigint not null default 0 check(cursor_floor>=0),
  updated_at timestamptz not null default now()
);
create table public.quiz_sync_generations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  parent uuid,
  base_revision bigint not null check(base_revision>=0),
  status text not null check(status in ('preparing','sealed','active','retired')),
  created_at timestamptz not null default now(),
  primary key(owner_id,id)
);
alter table public.quiz_account_heads add foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) deferrable initially deferred;
create table public.quiz_private_catalog_objects (
  owner_id uuid not null,
  generation uuid not null,
  hash text not null check(hash ~ '^[0-9a-f]{64}$'),
  encoding text not null check(encoding in ('questions-field-refs-v1','json-v1')),
  content text not null check(octet_length(content)<=67108864),
  primary key(owner_id,generation,hash),
  foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade
);
create table public.quiz_sync_object_parts (
  owner_id uuid not null,
  generation uuid not null,
  hash text not null check(hash ~ '^[0-9a-f]{64}$'),
  encoding text not null check(encoding in ('questions-field-refs-v1','json-v1')),
  part integer not null check(part between 0 and 2047),
  total integer not null check(total between 1 and 2048),
  content text not null check(octet_length(content)<=131072),
  created_at timestamptz not null default now(),
  primary key(owner_id,generation,hash,part),
  foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade
);
create table public.quiz_sync_entries (
  owner_id uuid not null,
  generation uuid not null,
  kind text not null check(kind in ('field','round','event','learning','record')),
  id text not null check(length(id) between 1 and 8192),
  position integer not null check(position between 0 and 1000000),
  value jsonb,
  deleted boolean not null default false,
  changed_revision bigint not null default 0 check(changed_revision>=0),
  round_kind text generated always as (case when kind='event' and not deleted then 'round' end) stored,
  round_id text generated always as (case when kind='event' and not deleted then value->>'roundId' end) stored,
  primary key(owner_id,generation,kind,id),
  foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade,
  foreign key(owner_id,generation,round_kind,round_id) references public.quiz_sync_entries(owner_id,generation,kind,id) deferrable initially deferred,
  check(deleted=(value is null)),
  check(kind not in ('round','event') or deleted or (value->>'id'=id)),
  check(kind<>'event' or deleted or (round_id is not null))
);
create index quiz_sync_entries_changed on public.quiz_sync_entries(owner_id,generation,changed_revision,kind,id);
create index quiz_sync_entries_round on public.quiz_sync_entries(owner_id,generation,round_id) where kind='event' and not deleted;
create unique index quiz_sync_event_question on public.quiz_sync_entries(owner_id,generation,round_id,(value->>'questionId')) where kind='event' and not deleted;
create unique index quiz_sync_sequence on public.quiz_sync_entries(owner_id,generation,kind,position) where kind in ('round','event') and not deleted;
create table public.quiz_generation_catalog_refs (
  owner_id uuid not null, generation uuid not null, release text not null references public.quiz_catalog_releases(hash),
  primary key(owner_id,generation,release),
  foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade
);
create table public.quiz_sync_receipts (
  owner_id uuid not null, generation uuid not null, packet_id uuid not null,
  content_hash text not null check(content_hash ~ '^[0-9a-f]{64}$'),
  revision bigint not null, confirmed_at timestamptz not null default now(),
  primary key(owner_id,generation,packet_id),
  foreign key(owner_id,generation) references public.quiz_sync_generations(owner_id,id) on delete cascade
);
create index quiz_sync_receipts_revision on public.quiz_sync_receipts(owner_id,generation,revision);
create table public.quiz_sync_legacy_archives (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null, revision bigint not null, archived_at timestamptz not null default now()
);

-- Direct writes are unavailable; narrowly granted RPCs check identity themselves.
do $$declare t text; begin
  foreach t in array array['quiz_catalog_releases','quiz_account_heads','quiz_sync_generations','quiz_private_catalog_objects','quiz_sync_object_parts','quiz_sync_entries','quiz_generation_catalog_refs','quiz_sync_receipts','quiz_sync_legacy_archives'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    if t='quiz_catalog_releases' then
      execute format('create policy released_catalog on public.%I for select to anon,authenticated using(true)',t);
    else
      execute format('create policy own_verified_data on public.%I for select to authenticated using(owner_id=(select auth.uid()) and (select public.quiz_verified_user()))',t);
    end if;
  end loop;
end$$;

create function quiz_sync_internal.require_owner(expected uuid) returns uuid
language plpgsql stable security definer set search_path='' as $$declare player uuid:=auth.uid(); begin
  if player is null or not public.quiz_verified_user() then raise exception 'verified_account_required' using errcode='42501'; end if;
  if player is distinct from expected then raise exception 'account_changed' using errcode='42501'; end if;
  return player;
end$$;
create function quiz_sync_internal.metadata(expected uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$declare player uuid; head public.quiz_account_heads; legacy bigint; begin
  player:=quiz_sync_internal.require_owner(expected);
  select * into head from public.quiz_account_heads where owner_id=player;
  if head.generation is null then
    select revision into legacy from public.quiz_saves where owner_id=player;
    return jsonb_build_object('protocol',1,'generation',null,'revision',coalesce(legacy,0),'cursorFloor',0);
  end if;
  return jsonb_build_object('protocol',1,'generation',head.generation,'revision',head.revision,'cursorFloor',head.cursor_floor);
end$$;
create function public.quiz_sync_metadata(expected_owner uuid) returns jsonb
language sql security invoker set search_path='' as $$select quiz_sync_internal.metadata(expected_owner)$$;

-- Old and new writers share a per-owner mutex, never a global player lock.
alter function public.quiz_save_state(jsonb,bigint,uuid) rename to quiz_save_state_legacy;
revoke all on function public.quiz_save_state_legacy(jsonb,bigint,uuid) from public,anon,authenticated;
create function public.quiz_save_state(payload jsonb,expected_revision bigint,expected_owner uuid) returns bigint
language plpgsql security definer set search_path='' as $$declare player uuid; begin
  player:=quiz_sync_internal.require_owner(expected_owner);
  perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
  if exists(select 1 from public.quiz_account_heads where owner_id=player and generation is not null) then raise exception 'sync_upgrade_required'; end if;
  return public.quiz_save_state_legacy(payload,expected_revision,expected_owner);
end$$;
revoke all on function public.quiz_save_state(jsonb,bigint,uuid) from public,anon;
grant execute on function public.quiz_save_state(jsonb,bigint,uuid) to authenticated;

create function quiz_sync_internal.begin_generation(expected uuid,target uuid,parent uuid,base_revision bigint) returns void
language plpgsql security definer set search_path='' as $$declare player uuid; head public.quiz_account_heads; existing public.quiz_sync_generations; actual bigint; begin
  player:=quiz_sync_internal.require_owner(expected);
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
create function public.quiz_sync_begin(expected_owner uuid,target_generation uuid,parent_generation uuid,expected_revision bigint) returns void
language sql security invoker set search_path='' as $$select quiz_sync_internal.begin_generation(expected_owner,target_generation,parent_generation,expected_revision)$$;

create function quiz_sync_internal.add_object(player uuid,target uuid,hash text,encoding text,content text) returns void
language plpgsql security definer set search_path='' as $$declare proof text; existing public.quiz_private_catalog_objects; begin
  if encoding not in ('questions-field-refs-v1','json-v1') or content is null or octet_length(content)>67108864 then raise exception 'invalid_object'; end if;
  proof:='["quiz-object-v1",'||to_jsonb(encoding)::text||','||to_jsonb(content)::text||']';
  if hash is null or hash<>encode(sha256(convert_to(proof,'UTF8')),'hex') then raise exception 'invalid_content_hash'; end if;
  -- Parse now, before referenced state can become visible.
  perform content::jsonb;
  insert into public.quiz_private_catalog_objects values(player,target,hash,encoding,content) on conflict do nothing;
  select * into existing from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target and o.hash=add_object.hash;
  if existing.encoding<>encoding or existing.content<>content then raise exception 'immutable_object_mismatch'; end if;
end$$;
create function quiz_sync_internal.object_piece(expected uuid,target uuid,hash text,encoding text,part integer,total integer,content text) returns boolean
language plpgsql security definer set search_path='' as $$declare player uuid; combined text; found_parts integer; begin
  player:=quiz_sync_internal.require_owner(expected);
  if not exists(select 1 from public.quiz_sync_generations where owner_id=player and id=target and status in ('preparing','sealed','active')) then raise exception 'generation_mismatch'; end if;
  if exists(select 1 from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target and o.hash=object_piece.hash) then return true; end if;
  if exists(select 1 from public.quiz_sync_generations where owner_id=player and id=target and status='sealed') then raise exception 'immutable_staging_mismatch'; end if;
  if total is null or total not between 1 and 2048 or part is null or part not between 0 and total-1 or encoding not in ('questions-field-refs-v1','json-v1') or content is null or octet_length(content)>131072 then raise exception 'invalid_object_piece'; end if;
  insert into public.quiz_sync_object_parts values(player,target,hash,encoding,part,total,content,now()) on conflict do nothing;
  if not exists(select 1 from public.quiz_sync_object_parts p where p.owner_id=player and p.generation=target and p.hash=object_piece.hash and p.part=object_piece.part and p.total=object_piece.total and p.encoding=object_piece.encoding and p.content=object_piece.content) then raise exception 'immutable_object_mismatch'; end if;
  select count(*),string_agg(p.content,'' order by p.part) into found_parts,combined from public.quiz_sync_object_parts p where p.owner_id=player and p.generation=target and p.hash=object_piece.hash;
  if found_parts=total then
    if exists(select 1 from public.quiz_sync_object_parts p where p.owner_id=player and p.generation=target and p.hash=object_piece.hash and (p.total<>object_piece.total or p.encoding<>object_piece.encoding)) then raise exception 'invalid_object_piece'; end if;
    perform quiz_sync_internal.add_object(player,target,hash,encoding,combined);
    delete from public.quiz_sync_object_parts p where p.owner_id=player and p.generation=target and p.hash=object_piece.hash;
    return true;
  end if;
  return false;
end$$;
create function public.quiz_sync_object_piece(expected_owner uuid,target_generation uuid,object_hash text,object_encoding text,part_index integer,part_count integer,part_content text) returns boolean
language sql security invoker set search_path='' as $$select quiz_sync_internal.object_piece(expected_owner,target_generation,object_hash,object_encoding,part_index,part_count,part_content)$$;

-- Statistics are installed by the following migration, before client rollout.
create function quiz_sync_internal.project(player uuid,target uuid,round_ids text[],fields_changed boolean) returns void
language plpgsql security definer set search_path='' as $$begin return; end$$;

create function quiz_sync_internal.write_entries(player uuid,target uuid,changes jsonb,new_revision bigint) returns text[]
language plpgsql security definer set search_path='' as $$declare operation jsonb; entry jsonb; entry_kind text; entry_id text; affected text[]:=array[]::text[]; old_round text; begin
  if jsonb_typeof(changes)<>'array' or jsonb_array_length(changes)>2000 then raise exception 'invalid_operations'; end if;
  for operation in select value from jsonb_array_elements(changes) loop
    if operation->>'op' not in ('put','delete') then raise exception 'invalid_operation'; end if;
    entry:=case when operation->>'op'='put' then operation->'row' else operation end;
    entry_kind:=entry->>'kind'; entry_id:=entry->>'id';
    if entry_kind is null or entry_kind not in ('field','round','event','learning','record') or entry_id is null or length(entry_id) not between 1 and 8192 then raise exception 'invalid_entry'; end if;
    if entry_kind='field' and entry_id not in ('catalog','schemaVersion','badges','favorites','reports','imports','settings','experience','career','journey') then raise exception 'invalid_field'; end if;
    if operation->>'op'='delete' and entry_kind='field' and entry_id not in ('career','journey') then raise exception 'required_field'; end if;
    select value->>'roundId' into old_round from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind=entry_kind and e.id=entry_id;
    if entry_kind='round' then affected:=array_append(affected,entry_id); end if;
    if entry_kind='event' and old_round is not null then affected:=array_append(affected,old_round); end if;
    if operation->>'op'='delete' then
      insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,deleted,changed_revision) values(player,target,entry_kind,entry_id,0,null,true,new_revision)
        on conflict on constraint quiz_sync_entries_pkey do update set value=null,deleted=true,changed_revision=excluded.changed_revision;
    else
      if entry->'value' is null or entry->'value'='null'::jsonb or entry->>'position' !~ '^[0-9]+$' then raise exception 'invalid_entry'; end if;
      if entry_kind in ('round','event') and entry->'value'->>'id' is distinct from entry_id then raise exception 'invalid_identity'; end if;
      if entry_kind='event' then affected:=array_append(affected,entry->'value'->>'roundId'); end if;
      insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,deleted,changed_revision) values(player,target,entry_kind,entry_id,(entry->>'position')::integer,entry->'value',false,new_revision)
        on conflict on constraint quiz_sync_entries_pkey do update set position=excluded.position,value=excluded.value,deleted=false,changed_revision=excluded.changed_revision;
    end if;
  end loop;
  return affected;
end$$;

create function quiz_sync_internal.stage(expected uuid,target uuid,changes jsonb) returns void
language plpgsql security definer set search_path='' as $$declare player uuid; begin
  player:=quiz_sync_internal.require_owner(expected);
  perform 1 from public.quiz_sync_generations where owner_id=player and id=target and status in ('preparing','sealed') for update;
  if not found then raise exception 'generation_mismatch'; end if;
  if exists(select 1 from jsonb_array_elements(changes) c where c->>'op' is distinct from 'put') then raise exception 'invalid_staging_operation'; end if;
  -- Identical row replay is permitted; changed contents under the same staged id are rejected.
  if exists(select 1 from jsonb_array_elements(changes) c join public.quiz_sync_entries e on e.owner_id=player and e.generation=target and e.kind=c->'row'->>'kind' and e.id=c->'row'->>'id' where e.value is distinct from c->'row'->'value' or e.position<>(c->'row'->>'position')::integer) then raise exception 'immutable_staging_mismatch'; end if;
  if exists(select 1 from public.quiz_sync_generations where owner_id=player and id=target and status='sealed') then
    if exists(select 1 from jsonb_array_elements(changes) c where not exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind=c->'row'->>'kind' and e.id=c->'row'->>'id')) then raise exception 'immutable_staging_mismatch'; end if;
    return;
  end if;
  perform quiz_sync_internal.write_entries(player,target,changes,0);
end$$;
create function public.quiz_sync_stage(expected_owner uuid,target_generation uuid,changes jsonb) returns void
language sql security invoker set search_path='' as $$select quiz_sync_internal.stage(expected_owner,target_generation,changes)$$;

-- Grants to helpers are restricted to the public wrappers' entry points.
revoke all on all functions in schema quiz_sync_internal from public,anon,authenticated;
grant execute on function quiz_sync_internal.metadata(uuid),quiz_sync_internal.begin_generation(uuid,uuid,uuid,bigint),quiz_sync_internal.object_piece(uuid,uuid,text,text,integer,integer,text),quiz_sync_internal.stage(uuid,uuid,jsonb) to authenticated;
revoke all on function public.quiz_sync_metadata(uuid),public.quiz_sync_begin(uuid,uuid,uuid,bigint),public.quiz_sync_object_piece(uuid,uuid,text,text,integer,integer,text),public.quiz_sync_stage(uuid,uuid,jsonb) from public,anon;
grant execute on function public.quiz_sync_metadata(uuid),public.quiz_sync_begin(uuid,uuid,uuid,bigint),public.quiz_sync_object_piece(uuid,uuid,text,text,integer,integer,text),public.quiz_sync_stage(uuid,uuid,jsonb) to authenticated;
create function quiz_sync_internal.question_score(question jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$declare subdomain jsonb; field_values jsonb; answer jsonb; begin
  subdomain:=question->'metadata'->'subdomain';
  if jsonb_typeof(subdomain)='number' then
    field_values:=jsonb_build_array(question->'id',question->'knowledgeId',question->'language',question->'domain',question->'difficulty',question->'question',question->'explanation',question->'context',question->'anchor');
    for answer in select value from jsonb_array_elements(question->'answers') loop field_values:=field_values||jsonb_build_array(answer->'text',answer->'feedback'); end loop;
    subdomain:=field_values->(subdomain::text)::integer;
  end if;
  return jsonb_build_object('id',question->'id','version',question->'version','correctId',question->'correctId','domain',question->'domain','difficulty',question->'difficulty','metadata',case when subdomain is null then '{}'::jsonb else jsonb_build_object('subdomain',subdomain) end);
end$$;
create function quiz_sync_internal.check_question(player uuid,target uuid,item jsonb) returns void
language plpgsql security definer set search_path='' as $$declare ref jsonb:=item->'ref'; score jsonb; object_content text; begin
  if ref ? 'release' then
    select score_fields->(ref->>'index')::integer into score from public.quiz_catalog_releases where hash=ref->>'release';
    if score is null or (ref->>'index')::integer<0 then raise exception 'missing_catalog_question'; end if;
    insert into public.quiz_generation_catalog_refs values(player,target,ref->>'release') on conflict do nothing;
  elsif ref ? 'object' then
    select content into object_content from public.quiz_private_catalog_objects where owner_id=player and generation=target and hash=ref->>'object' and encoding='questions-field-refs-v1';
    if object_content is null or jsonb_typeof(object_content::jsonb)<>'array' or jsonb_array_length(object_content::jsonb)<>1 then raise exception 'missing_private_question'; end if;
    score:=quiz_sync_internal.question_score(object_content::jsonb->0);
  else raise exception 'invalid_question_reference'; end if;
  if score is distinct from item-'ref' then raise exception 'question_score_mismatch'; end if;
end$$;
create function quiz_sync_internal.validate_entries(player uuid,target uuid,round_ids text[] default null,catalog_changed boolean default true) returns void
language plpgsql security definer set search_path='' as $$
#variable_conflict use_column
declare catalog jsonb; segment jsonb; count_questions integer:=0; available integer; object_content text; r public.quiz_sync_entries; item jsonb; referenced_id text; begin
  if catalog_changed then
    select value into catalog from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='catalog' and not deleted;
    if catalog is null then raise exception 'missing_catalog'; end if;
    if catalog ? 'object' then
      select content into object_content from public.quiz_private_catalog_objects where owner_id=player and generation=target and hash=catalog->>'object' and encoding='questions-field-refs-v1';
      if object_content is null or jsonb_typeof(object_content::jsonb)<>'array' then raise exception 'missing_catalog_object'; end if;
      count_questions:=jsonb_array_length(object_content::jsonb);
    else
      if jsonb_typeof(catalog->'parts') is distinct from 'array' then raise exception 'invalid_catalog'; end if;
      for segment in select value from jsonb_array_elements(catalog->'parts') loop
        if segment ? 'release' then
          select question_count into available from public.quiz_catalog_releases where hash=segment->>'release';
          if available is null or (segment->>'start')::integer<0 or (segment->>'count')::integer<1 or (segment->>'start')::integer+(segment->>'count')::integer>available then raise exception 'invalid_catalog_segment'; end if;
          count_questions:=count_questions+(segment->>'count')::integer;
          insert into public.quiz_generation_catalog_refs values(player,target,segment->>'release') on conflict do nothing;
        elsif jsonb_typeof(segment->'objects')='array' then
          for referenced_id in select value from jsonb_array_elements_text(segment->'objects') loop
            select content into object_content from public.quiz_private_catalog_objects where owner_id=player and generation=target and hash=referenced_id and encoding='questions-field-refs-v1';
            if object_content is null or jsonb_array_length(object_content::jsonb)<>1 then raise exception 'missing_private_catalog_object'; end if;
            count_questions:=count_questions+1;
          end loop;
        else raise exception 'invalid_catalog_segment'; end if;
      end loop;
    end if;
    if count_questions>20000 then raise exception 'catalog_too_large'; end if;
  end if;
  for r in select * from public.quiz_sync_entries where owner_id=player and generation=target and kind='round' and not deleted and (round_ids is null or id=any(round_ids)) loop
    if r.value->>'status' not in ('active','completed','aborted') or r.value->>'mode' not in ('entdecken','ueben','rekord','fehler')
      or jsonb_typeof(r.value->'questions') is distinct from 'array' or jsonb_array_length(r.value->'questions') not between 1 and 10 then raise exception 'invalid_round'; end if;
    if not exists(select 1 from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target and o.hash=r.value->>'beforeObject' and o.encoding='json-v1' and jsonb_typeof(o.content::jsonb)='object') then raise exception 'missing_before_object'; end if;
    for item in select value from jsonb_array_elements(r.value->'questions') loop perform quiz_sync_internal.check_question(player,target,item); end loop;
    if jsonb_typeof(r.value->'events') is distinct from 'array' or jsonb_array_length(r.value->'events')>10 then raise exception 'invalid_round_events'; end if;
    for referenced_id in select value from jsonb_array_elements_text(r.value->'events') loop
      if not exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and e.id=referenced_id and not e.deleted and e.round_id=r.id and exists(select 1 from jsonb_array_elements(r.value->'questions') q where q->>'id'=e.value->>'questionId')) then raise exception 'invalid_event_relation'; end if;
    end loop;
    if exists(select 1 from public.quiz_sync_entries e where e.owner_id=player and e.generation=target and e.kind='event' and e.round_id=r.id and not e.deleted and not (r.value->'events' ? e.id)) then raise exception 'unlisted_round_event'; end if;
  end loop;
end$$;

create function quiz_sync_internal.seal(expected uuid,target uuid,row_count bigint,object_count bigint) returns void
language plpgsql security definer set search_path='' as $$declare player uuid; status text; begin
  player:=quiz_sync_internal.require_owner(expected);
  select g.status into status from public.quiz_sync_generations g where g.owner_id=player and g.id=target for update;
  if status='sealed' then return; end if;
  if status is distinct from 'preparing' then raise exception 'generation_mismatch'; end if;
  if row_count<>(select count(*) from public.quiz_sync_entries where owner_id=player and generation=target and not deleted) or object_count<>(select count(*) from public.quiz_private_catalog_objects where owner_id=player and generation=target) or exists(select 1 from public.quiz_sync_object_parts where owner_id=player and generation=target) then raise exception 'incomplete_generation'; end if;
  if not exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='schemaVersion' and value='1'::jsonb)
    or not exists(select 1 from public.quiz_sync_entries where owner_id=player and generation=target and kind='field' and id='settings' and jsonb_typeof(value)='object') then raise exception 'invalid_state'; end if;
  if exists(select 1 from public.quiz_sync_entries e left join public.quiz_sync_entries r on r.owner_id=e.owner_id and r.generation=e.generation and r.kind='round' and r.id=e.round_id where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and (r.id is null or r.deleted)) then raise exception 'invalid_event_relation'; end if;
  perform quiz_sync_internal.validate_entries(player,target);
  update public.quiz_sync_generations g set status='sealed' where g.owner_id=player and g.id=target;
end$$;
create function public.quiz_sync_seal(expected_owner uuid,target_generation uuid,row_count bigint,object_count bigint) returns void
language sql security invoker set search_path='' as $$select quiz_sync_internal.seal(expected_owner,target_generation,row_count,object_count)$$;

create function quiz_sync_internal.activate(expected uuid,target uuid) returns jsonb
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
    insert into public.quiz_sync_legacy_archives(owner_id,state,revision) select owner_id,state,revision from public.quiz_saves where owner_id=player on conflict do nothing;
    delete from public.quiz_saves where owner_id=player;
  else update public.quiz_sync_generations set status='retired' where owner_id=player and id=head.generation; end if;
  update public.quiz_sync_generations set status='active' where owner_id=player and id=target;
  update public.quiz_sync_entries set changed_revision=actual+1 where owner_id=player and generation=target;
  update public.quiz_account_heads set generation=target,revision=actual+1,cursor_floor=actual+1,updated_at=now() where owner_id=player;
  perform quiz_sync_internal.project(player,target,null,true);
  return quiz_sync_internal.metadata(expected);
end$$;
create function public.quiz_sync_activate(expected_owner uuid,target_generation uuid) returns jsonb
language sql security invoker set search_path='' as $$select quiz_sync_internal.activate(expected_owner,target_generation)$$;

create function quiz_sync_internal.apply(packet_text text) returns jsonb
language plpgsql security definer set search_path='' as $$declare packet jsonb; player uuid; target uuid; current_packet uuid; expected bigint; proof text; head public.quiz_account_heads; receipt public.quiz_sync_receipts; item jsonb; affected text[]; fields_changed boolean; begin
  if packet_text is null or octet_length(packet_text)>8388608 then raise exception 'invalid_packet_size'; end if;
  packet:=packet_text::jsonb;
  if packet->>'format' is distinct from 'quiz-entry-sync-v1' or packet->'protocol' is distinct from '1'::jsonb or packet->>'expectedRevision' !~ '^[0-9]+$' then raise exception 'invalid_protocol'; end if;
  player:=quiz_sync_internal.require_owner((packet->>'owner')::uuid);
  target:=(packet->>'generation')::uuid; current_packet:=(packet->>'id')::uuid; expected:=(packet->>'expectedRevision')::bigint;
  proof:=encode(sha256(convert_to(packet_text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(player::text,20261003));
  select * into head from public.quiz_account_heads where owner_id=player for update;
  if head.generation is distinct from target or target is null then raise exception 'generation_mismatch'; end if;
  select * into receipt from public.quiz_sync_receipts r where r.owner_id=player and r.generation=target and r.packet_id=current_packet;
  if receipt.packet_id is not null then
    if receipt.content_hash<>proof then raise exception 'packet_content_mismatch'; end if;
    return jsonb_build_object('id',current_packet,'generation',target,'revision',receipt.revision,'confirmedAt',extract(epoch from receipt.confirmed_at)*1000);
  end if;
  if expected is null or head.revision<>expected then raise exception 'revision_conflict'; end if;
  if jsonb_typeof(packet->'objects') is distinct from 'array' or jsonb_array_length(packet->'objects')>100 or jsonb_typeof(packet->'changes') is distinct from 'array' or jsonb_array_length(packet->'changes')=0 then raise exception 'invalid_operations'; end if;
  for item in select value from jsonb_array_elements(packet->'objects') loop perform quiz_sync_internal.add_object(player,target,item->>'hash',item->>'encoding',item->>'text'); end loop;
  affected:=quiz_sync_internal.write_entries(player,target,packet->'changes',head.revision+1);
  fields_changed:=exists(select 1 from jsonb_array_elements(packet->'changes') c where coalesce(c->'row'->>'kind',c->>'kind')='field' and coalesce(c->'row'->>'id',c->>'id') in ('career','experience'));
  perform quiz_sync_internal.validate_entries(player,target,affected,exists(select 1 from jsonb_array_elements(packet->'changes') c where c->'row'->>'kind'='field' and c->'row'->>'id'='catalog'));
  if exists(select 1 from public.quiz_sync_entries e left join public.quiz_sync_entries r on r.owner_id=e.owner_id and r.generation=e.generation and r.kind='round' and r.id=e.round_id where e.owner_id=player and e.generation=target and e.kind='event' and not e.deleted and e.round_id=any(affected) and (r.id is null or r.deleted)) then raise exception 'invalid_event_relation'; end if;
  perform quiz_sync_internal.project(player,target,affected,fields_changed);
  update public.quiz_account_heads set revision=head.revision+1,cursor_floor=greatest(cursor_floor,head.revision+1-1000),updated_at=now() where owner_id=player;
  insert into public.quiz_sync_receipts values(player,target,current_packet,proof,head.revision+1,now()) returning * into receipt;
  delete from public.quiz_sync_receipts where owner_id=player and generation=target and revision<head.revision+1-1000;
  delete from public.quiz_sync_entries where owner_id=player and generation=target and deleted and changed_revision<head.revision+1-1000;
  return jsonb_build_object('id',current_packet,'generation',target,'revision',receipt.revision,'confirmedAt',extract(epoch from receipt.confirmed_at)*1000);
end$$;
create function public.quiz_sync_apply(packet_text text) returns jsonb
language sql security invoker set search_path='' as $$select quiz_sync_internal.apply(packet_text)$$;

create function quiz_sync_internal.page(expected uuid,target uuid,expected_revision bigint,after_revision bigint,page_cursor text,page_size integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$declare player uuid; head public.quiz_account_heads; status text; rows jsonb; next_cursor text; done boolean; begin
  player:=quiz_sync_internal.require_owner(expected);
  if page_size is null or page_size not between 1 and 500 or after_revision is null or after_revision < -1 then raise exception 'invalid_cursor'; end if;
  select * into head from public.quiz_account_heads where owner_id=player;
  select g.status into status from public.quiz_sync_generations g where g.owner_id=player and g.id=target;
  if status='active' then
    if head.generation is distinct from target or head.revision<>expected_revision then raise exception 'download_changed'; end if;
    if after_revision<>-1 and after_revision<head.cursor_floor then raise exception 'cursor_expired'; end if;
  elsif status='sealed' then
    if expected_revision<>0 or after_revision<>-1 then raise exception 'invalid_cursor'; end if;
  else raise exception 'generation_mismatch'; end if;
  with selected as materialized (
    select kind,id,position,value,deleted,kind||':'||id as cursor from public.quiz_sync_entries
    where owner_id=player and generation=target and changed_revision>after_revision and (kind||':'||id)>coalesce(page_cursor,'') order by kind||':'||id limit page_size+1
  ), limited as (select * from selected order by cursor limit page_size)
  select coalesce(jsonb_agg(jsonb_build_object('kind',kind,'id',id,'position',position,'value',value,'deleted',deleted) order by cursor),'[]'::jsonb),max(cursor),(select count(*)<=page_size from selected) into rows,next_cursor,done from limited;
  return jsonb_build_object('generation',target,'revision',expected_revision,'rows',rows,'nextCursor',next_cursor,'done',done);
end$$;
create function public.quiz_sync_page(expected_owner uuid,target_generation uuid,expected_revision bigint,after_revision bigint,page_cursor text default '',page_size integer default 200) returns jsonb
language sql security invoker set search_path='' as $$select quiz_sync_internal.page(expected_owner,target_generation,expected_revision,after_revision,page_cursor,page_size)$$;

create function quiz_sync_internal.objects(expected uuid,target uuid,hashes text[]) returns jsonb
language plpgsql stable security definer set search_path='' as $$declare player uuid; result jsonb; begin
  player:=quiz_sync_internal.require_owner(expected);
  if hashes is null or array_length(hashes,1)>100 then raise exception 'invalid_object_request'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('hash',hash,'encoding',encoding,'text',case when octet_length(content)<=65536 then content else null end,'characters',length(content))),'[]'::jsonb) into result from public.quiz_private_catalog_objects where owner_id=player and generation=target and hash=any(hashes);
  if jsonb_array_length(result)<>coalesce(array_length(hashes,1),0) then raise exception 'missing_private_object'; end if;
  return result;
end$$;
create function public.quiz_sync_objects(expected_owner uuid,target_generation uuid,object_hashes text[]) returns jsonb
language sql security invoker set search_path='' as $$select quiz_sync_internal.objects(expected_owner,target_generation,object_hashes)$$;
create function quiz_sync_internal.object_read(expected uuid,target uuid,hash text,part_offset integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$declare player uuid; object public.quiz_private_catalog_objects; part text; begin
  player:=quiz_sync_internal.require_owner(expected);
  select * into object from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target and o.hash=object_read.hash;
  if object.hash is null or part_offset is null or part_offset<0 or part_offset>length(object.content) then raise exception 'invalid_object_request'; end if;
  part:=substring(object.content from part_offset+1 for 16384);
  return jsonb_build_object('hash',hash,'encoding',object.encoding,'text',part,'nextOffset',part_offset+length(part),'done',part_offset+length(part)>=length(object.content));
end$$;
create function public.quiz_sync_object_read(expected_owner uuid,target_generation uuid,object_hash text,part_offset integer) returns jsonb
language sql security invoker set search_path='' as $$select quiz_sync_internal.object_read(expected_owner,target_generation,object_hash,part_offset)$$;
create function quiz_sync_internal.catalog(hash text) returns jsonb
language plpgsql stable security definer set search_path='' as $$declare result jsonb; begin
  select jsonb_build_object('hash',r.hash,'encoding','gzip-field-refs-v1','data',encode(payload,'base64'),'digests',digests) into result from public.quiz_catalog_releases r where r.hash=catalog.hash;
  if result is null then raise exception 'missing_operator_catalog'; end if;
  return result;
end$$;
create function public.quiz_sync_catalog(catalog_hash text) returns jsonb
language sql security invoker set search_path='' as $$select quiz_sync_internal.catalog(catalog_hash)$$;

create function quiz_sync_internal.reject_catalog_update() returns trigger language plpgsql set search_path='' as $$begin raise exception 'immutable_catalog'; end$$;
create trigger quiz_catalog_immutable before update on public.quiz_catalog_releases for each row execute function quiz_sync_internal.reject_catalog_update();

revoke all on all functions in schema quiz_sync_internal from public,anon,authenticated;
grant usage on schema quiz_sync_internal to anon;
grant execute on function quiz_sync_internal.catalog(text) to anon,authenticated;
grant execute on function quiz_sync_internal.metadata(uuid),quiz_sync_internal.begin_generation(uuid,uuid,uuid,bigint),quiz_sync_internal.object_piece(uuid,uuid,text,text,integer,integer,text),quiz_sync_internal.stage(uuid,uuid,jsonb),quiz_sync_internal.seal(uuid,uuid,bigint,bigint),quiz_sync_internal.activate(uuid,uuid),quiz_sync_internal.apply(text),quiz_sync_internal.page(uuid,uuid,bigint,bigint,text,integer),quiz_sync_internal.objects(uuid,uuid,text[]),quiz_sync_internal.object_read(uuid,uuid,text,integer) to authenticated;
revoke all on function public.quiz_sync_seal(uuid,uuid,bigint,bigint),public.quiz_sync_activate(uuid,uuid),public.quiz_sync_apply(text),public.quiz_sync_page(uuid,uuid,bigint,bigint,text,integer),public.quiz_sync_objects(uuid,uuid,text[]),public.quiz_sync_object_read(uuid,uuid,text,integer),public.quiz_sync_catalog(text) from public,anon,authenticated;
grant execute on function public.quiz_sync_seal(uuid,uuid,bigint,bigint),public.quiz_sync_activate(uuid,uuid),public.quiz_sync_apply(text),public.quiz_sync_page(uuid,uuid,bigint,bigint,text,integer),public.quiz_sync_objects(uuid,uuid,text[]),public.quiz_sync_object_read(uuid,uuid,text,integer) to authenticated;
grant execute on function public.quiz_sync_catalog(text) to anon,authenticated;
notify pgrst,'reload schema';
commit;

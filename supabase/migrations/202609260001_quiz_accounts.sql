-- Supabase Auth owns credentials, confirmation and recovery tokens.
-- This migration stores only each user's private quiz snapshot.
create table public.quiz_saves (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object' and state->>'schemaVersion' = '1'),
  revision bigint not null check (revision >= 0),
  updated_at timestamptz not null default now()
);
alter table public.quiz_saves enable row level security;
revoke all on public.quiz_saves from public, anon, authenticated;
grant select on public.quiz_saves to authenticated;

create function public.quiz_verified_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.users where id = (select auth.uid())
    and email_confirmed_at is not null and coalesce(is_anonymous, false) = false);
$$;
revoke all on function public.quiz_verified_user() from public, anon;
grant execute on function public.quiz_verified_user() to authenticated;
create policy own_verified_save on public.quiz_saves for select to authenticated
  using (owner_id = (select auth.uid()) and (select public.quiz_verified_user()));

create function public.quiz_save_state(payload jsonb, expected_revision bigint, expected_owner uuid)
returns bigint language plpgsql security definer set search_path = '' as $$
declare player uuid := auth.uid(); current_revision bigint;
begin
  if player is null or not public.quiz_verified_user() then
    raise exception 'verified_account_required' using errcode = '42501';
  end if;
  -- A session switch in another tab must not send the previous user's snapshot
  -- to the new account. Ownership always comes from auth.uid(), never this input.
  if expected_owner is distinct from player then
    raise exception 'account_changed' using errcode = '42501';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' or
    (payload->>'schemaVersion') is distinct from '1' or octet_length(payload::text) > 20000000 or
    expected_revision is null or expected_revision < 0 then
    raise exception 'invalid_state';
  end if;
  insert into public.quiz_saves(owner_id,state,revision) values(player,payload,0)
    on conflict(owner_id) do nothing;
  select revision into current_revision from public.quiz_saves where owner_id = player for update;
  if current_revision <> expected_revision then raise exception 'revision_conflict'; end if;
  update public.quiz_saves set state = payload, revision = current_revision + 1, updated_at = now()
    where owner_id = player;
  return current_revision + 1;
end;
$$;
revoke all on function public.quiz_save_state(jsonb,bigint,uuid) from public, anon;
grant execute on function public.quiz_save_state(jsonb,bigint,uuid) to authenticated;

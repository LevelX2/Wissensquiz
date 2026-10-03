-- Public application metadata; contains no account or learning information.
begin;
create table public.quiz_app_releases (
  version integer primary key check(version>0),
  published_at timestamptz not null,
  source_commit text not null check(source_commit ~ '^[0-9a-f]{40}$')
);
alter table public.quiz_app_releases enable row level security;
revoke all on table public.quiz_app_releases from public,anon,authenticated;
create function public.quiz_app_release(selected_version integer)
returns table(version integer,published_at timestamptz)
language sql stable security definer set search_path='' as $$
  select r.version,r.published_at from public.quiz_app_releases r
  where r.version=selected_version;
$$;
revoke all on function public.quiz_app_release(integer) from public;
grant execute on function public.quiz_app_release(integer) to anon,authenticated;
notify pgrst, 'reload schema';
commit;

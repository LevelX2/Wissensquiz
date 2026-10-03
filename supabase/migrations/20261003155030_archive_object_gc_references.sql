-- Resolve live references once, instead of traversing every round/catalog
-- again for each older object. Ownership and the one-day grace stay unchanged.
begin;
create or replace function quiz_sync_internal.prune_round_objects(player uuid,target uuid) returns void
language plpgsql security definer set search_path='' as $$begin
  with entries as materialized (
    select kind,id,value from public.quiz_sync_entries
    where owner_id=player and generation=target and not deleted
      and (kind='round' or (kind='field' and id='catalog'))
  ), live as materialized (
    select value->>'beforeObject' hash from entries where kind='round'
    union
    select q->'ref'->>'object' from entries e cross join lateral jsonb_array_elements(e.value->'questions') q where e.kind='round'
    union
    select value->>'object' from entries where kind='field'
    union
    select h from entries e cross join lateral jsonb_array_elements(coalesce(e.value->'parts','[]')) p
      cross join lateral jsonb_array_elements_text(coalesce(p->'objects','[]')) h where e.kind='field'
  )
  delete from public.quiz_private_catalog_objects o where o.owner_id=player and o.generation=target
    and o.created_at<now()-interval '1 day'
    and not exists(select 1 from live where live.hash=o.hash);
  with entries as materialized (
    select kind,id,value from public.quiz_sync_entries
    where owner_id=player and generation=target and not deleted
      and (kind='round' or (kind='field' and id='catalog'))
  ), live as materialized (
    select q->'ref'->>'release' release from entries e cross join lateral jsonb_array_elements(e.value->'questions') q where e.kind='round'
    union
    select p->>'release' from entries e cross join lateral jsonb_array_elements(coalesce(e.value->'parts','[]')) p where e.kind='field'
  )
  delete from public.quiz_generation_catalog_refs r where r.owner_id=player and r.generation=target
    and not exists(select 1 from live where live.release=r.release);
end $$;
revoke all on function quiz_sync_internal.prune_round_objects(uuid,uuid) from public,anon,authenticated;
commit;

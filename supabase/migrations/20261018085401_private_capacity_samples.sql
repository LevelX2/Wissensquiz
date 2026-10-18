begin;
create schema quiz_capacity_internal;
revoke all on schema quiz_capacity_internal from public,anon,authenticated,service_role;
create table quiz_capacity_internal.samples(
 id bigint generated always as identity primary key,
 checked_at timestamptz not null default clock_timestamp(),
 database_bytes bigint not null,
 relations jsonb not null,
 collection_ms numeric not null
);
alter table quiz_capacity_internal.samples enable row level security;
revoke all on quiz_capacity_internal.samples from public,anon,authenticated,service_role;
revoke all on all sequences in schema quiz_capacity_internal from public,anon,authenticated,service_role;
create function quiz_capacity_internal.capture_sample() returns bigint
language plpgsql set search_path='' as $$
declare started timestamptz:=clock_timestamp(); items jsonb; sample_id bigint;
begin
 select coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,
  'tableBytes',pg_table_size(c.oid),'indexBytes',pg_indexes_size(c.oid),
  'totalBytes',pg_total_relation_size(c.oid),'estimatedRows',greatest(0,c.reltuples::bigint))
  order by n.nspname,c.relname),'[]') into items
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where c.relkind='r' and n.nspname in ('public','quiz_ranked_internal','quiz_game_internal','quiz_ops','quiz_capacity_internal');
 insert into quiz_capacity_internal.samples(database_bytes,relations,collection_ms)
 values(pg_database_size(current_database()),items,extract(epoch from clock_timestamp()-started)*1000) returning id into sample_id;
 delete from quiz_capacity_internal.samples where checked_at<started-interval '180 days';
 return sample_id;
end$$;
revoke all on function quiz_capacity_internal.capture_sample() from public,anon,authenticated,service_role;
commit;

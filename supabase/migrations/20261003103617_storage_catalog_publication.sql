-- Operator-only chunked publication for transport-limited management APIs.
begin;
create table quiz_sync_internal.catalog_publication_parts (
  manifest_sha256 text not null check (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  part integer not null check (part between 0 and 4095),
  total integer not null check (total between 1 and 4096 and part < total),
  content text not null check (octet_length(content) between 1 and 65536),
  primary key (manifest_sha256, part)
);
alter table quiz_sync_internal.catalog_publication_parts enable row level security;
revoke all on quiz_sync_internal.catalog_publication_parts from public, anon, authenticated;

create function quiz_sync_internal.publish_catalog(expected_manifest text) returns text
language plpgsql security invoker set search_path='' as $$
declare combined text; manifest jsonb; total_parts integer; min_total integer; max_total integer; first_part integer; last_part integer; release_hash text;
begin
  perform pg_advisory_xact_lock(hashtextextended('catalog:'||expected_manifest,20261003));
  select string_agg(content,'' order by part),count(*),min(total),max(total),min(part),max(part)
  into combined,total_parts,min_total,max_total,first_part,last_part
  from quiz_sync_internal.catalog_publication_parts where manifest_sha256=expected_manifest;
  if total_parts=0 or min_total<>max_total or total_parts<>min_total or first_part<>0 or last_part<>total_parts-1 then raise exception 'incomplete_catalog_publication'; end if;
  if encode(sha256(convert_to(combined,'UTF8')),'hex')<>expected_manifest then raise exception 'catalog_publication_hash_mismatch'; end if;
  manifest:=combined::jsonb;
  release_hash:=manifest->>'hash';
  insert into public.quiz_catalog_releases(hash,protocol,payload,digests,score_fields,question_count)
  values(release_hash,(manifest->>'protocol')::integer,decode(manifest->>'data','base64'),manifest->'digests',manifest->'scoreFields',(manifest->>'questionCount')::integer)
  on conflict(hash) do nothing;
  if not exists(select 1 from public.quiz_catalog_releases where hash=release_hash and protocol=(manifest->>'protocol')::integer and payload=decode(manifest->>'data','base64') and digests=manifest->'digests' and score_fields=manifest->'scoreFields' and question_count=(manifest->>'questionCount')::integer) then raise exception 'immutable_catalog_mismatch'; end if;
  delete from quiz_sync_internal.catalog_publication_parts where manifest_sha256=expected_manifest;
  return release_hash;
end$$;
revoke all on function quiz_sync_internal.publish_catalog(text) from public,anon,authenticated;
commit;

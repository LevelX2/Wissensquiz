-- New reporting feature; no quiz snapshots or historical reports are migrated.
create schema quiz_reporting;
revoke all on schema quiz_reporting from public, anon, authenticated;
grant usage on schema quiz_reporting to service_role;
create table quiz_reporting.submissions (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  state text not null check (state in ('sending', 'sent', 'failed', 'uncertain')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  issue_number bigint,
  issue_url text,
  check ((state = 'sent') = (issue_number is not null and issue_url is not null)),
  check (issue_number is null or (issue_number > 0 and issue_url = 'https://github.com/LevelX2/Wissensquiz/issues/' || issue_number::text))
);
alter table quiz_reporting.submissions enable row level security;
revoke all on quiz_reporting.submissions from public, anon, authenticated;
grant select, insert, update on quiz_reporting.submissions to service_role;
create index submissions_owner_created on quiz_reporting.submissions(owner_id, created_at desc);

-- Only the Edge Function's service role may reserve deliveries. It first verifies
-- the current user with Auth /user; user metadata and client-supplied owners are never trusted.
create function public.quiz_issue_begin(expected_owner uuid, submission_id uuid, content_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare prior quiz_reporting.submissions; recent integer;
begin
  if expected_owner is null or submission_id is null or content_hash is null or content_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_report';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(expected_owner::text, 847031));
  select * into prior from quiz_reporting.submissions where id = submission_id for update;
  if found then
    if prior.owner_id <> expected_owner or prior.content_hash <> content_hash then raise exception 'report_changed'; end if;
    if prior.state = 'sent' then
      return jsonb_build_object('action','sent','number',prior.issue_number,'url',prior.issue_url,'createdAt',prior.created_at);
    end if;
    if prior.updated_at > now() - interval '60 seconds' then
      return jsonb_build_object('action','pending','createdAt',prior.created_at);
    end if;
    update quiz_reporting.submissions set updated_at = now(), state = case when prior.state = 'failed' then 'sending' else 'uncertain' end where id = submission_id;
    return jsonb_build_object('action',case when prior.state = 'failed' then 'send' else 'reconcile' end,'createdAt',prior.created_at);
  end if;
  select count(*) into recent from quiz_reporting.submissions where owner_id = expected_owner and created_at > now() - interval '24 hours';
  if recent >= 5 or exists(select 1 from quiz_reporting.submissions where owner_id = expected_owner and updated_at > now() - interval '60 seconds') then raise exception 'rate_limited'; end if;
  insert into quiz_reporting.submissions(id,owner_id,content_hash,state) values(submission_id,expected_owner,content_hash,'sending');
  return jsonb_build_object('action','send','createdAt',now());
end;
$$;
revoke all on function public.quiz_issue_begin(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.quiz_issue_begin(uuid,uuid,text) to service_role;

create function public.quiz_issue_finish(expected_owner uuid, submission_id uuid, outcome text, issue_number bigint, issue_url text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if outcome is null or outcome not in ('sent','failed','uncertain') then raise exception 'invalid_outcome'; end if;
  update quiz_reporting.submissions set state = outcome, updated_at = now(), issue_number = quiz_issue_finish.issue_number, issue_url = quiz_issue_finish.issue_url
    where id = submission_id and owner_id = expected_owner and state <> 'sent';
end;
$$;
revoke all on function public.quiz_issue_finish(uuid,uuid,text,bigint,text) from public, anon, authenticated;
grant execute on function public.quiz_issue_finish(uuid,uuid,text,bigint,text) to service_role;

-- Operator-only maintenance. No quiz data or SMTP credentials are copied.
create extension if not exists pg_cron;
create extension if not exists http with schema extensions;

create schema quiz_ops;
revoke all on schema quiz_ops from public, anon, authenticated, service_role;

create table quiz_ops.service_config (
  id boolean primary key default true check (id),
  project_url text not null check (project_url ~ '^https://[a-z]+\.supabase\.co$'),
  publishable_key text not null check (publishable_key like 'sb_publishable_%'),
  release_version integer not null check (release_version > 0),
  mail_recipient text,
  smtp_expires_on date not null
);
alter table quiz_ops.service_config enable row level security;
revoke all on quiz_ops.service_config from public, anon, authenticated, service_role;

create table quiz_ops.service_checks (
  id bigint generated always as identity primary key,
  checked_at timestamptz not null default now(),
  database_statuses integer[] not null,
  database_ok boolean not null,
  mail_state text not null check (mail_state in (
    'not_configured', 'not_due', 'blocked', 'recipient_unconfirmed', 'accepted', 'failed'
  )),
  mail_attempted boolean not null,
  mail_status integer,
  error_codes text[] not null
);
alter table quiz_ops.service_checks enable row level security;
revoke all on quiz_ops.service_checks from public, anon, authenticated, service_role;
revoke all on all sequences in schema quiz_ops from public, anon, authenticated, service_role;

create function quiz_ops.run_service_check()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  config quiz_ops.service_config%rowtype;
  response extensions.http_response;
  statuses integer[] := '{}';
  request_status integer;
  errors text[] := '{}';
  database_ok boolean := true;
  mail_state text := 'not_due';
  mail_attempted boolean := false;
  mail_status integer;
  result_id bigint;
begin
  -- Serializes manual and scheduled runs, including the mail cooldown.
  perform pg_advisory_xact_lock(hashtextextended('quiz_ops.service_check', 0));
  select * into strict config from quiz_ops.service_config where id;

  for attempt in 1..3 loop
    request_status := 0;
    begin
      select * into response from extensions.http((
        'POST', config.project_url || '/rest/v1/rpc/quiz_app_release',
        array[extensions.http_header('apikey', config.publishable_key)],
        'application/json',
        jsonb_build_object('selected_version', config.release_version)::text
      )::extensions.http_request);
      request_status := response.status;
      if response.status <> 200 then
        database_ok := false;
      elsif response.content::jsonb <> jsonb_build_array(jsonb_build_object(
        'version', config.release_version,
        'published_at', (response.content::jsonb -> 0 ->> 'published_at')
      )) or (response.content::jsonb -> 0 ->> 'published_at') is null then
        database_ok := false;
        errors := array_append(errors, 'unexpected_release_response');
      end if;
    exception when others then
      database_ok := false;
      errors := array_append(errors, SQLSTATE);
    end;
    statuses := array_append(statuses, request_status);
  end loop;

  if config.mail_recipient is null then
    mail_state := 'not_configured';
  elsif not database_ok then
    mail_state := 'blocked';
  elsif not exists (
    select 1 from auth.users
    where lower(email) = lower(config.mail_recipient)
      and email_confirmed_at is not null and not is_anonymous
      and deleted_at is null
  ) then
    mail_state := 'recipient_unconfirmed';
  elsif not exists (
    select 1 from quiz_ops.service_checks c
    where (c.mail_state = 'accepted' and c.checked_at > now() - interval '30 days')
       or (c.mail_attempted and c.checked_at > now() - interval '1 day')
  ) then
    mail_attempted := true;
    begin
      -- Uses Supabase's existing SMTP configuration; never verifies the token
      -- and never changes a password. The usual recovery email is sent.
      select * into response from extensions.http((
        'POST', config.project_url || '/auth/v1/recover',
        array[extensions.http_header('apikey', config.publishable_key)],
        'application/json', jsonb_build_object('email', config.mail_recipient)::text
      )::extensions.http_request);
      mail_status := response.status;
      mail_state := case when response.status = 200 then 'accepted' else 'failed' end;
    exception when others then
      mail_state := 'failed';
      errors := array_append(errors, SQLSTATE);
    end;
  end if;

  insert into quiz_ops.service_checks (
    database_statuses, database_ok, mail_state, mail_attempted, mail_status, error_codes
  ) values (statuses, database_ok, mail_state, mail_attempted, mail_status, errors)
  returning id into result_id;

  -- Only operational records are removed; no user data is touched.
  delete from quiz_ops.service_checks where checked_at < now() - interval '90 days';
  delete from cron.job_run_details
    where jobid = (select jobid from cron.job where jobname = 'wissensquiz-daily-service-check')
      and end_time < now() - interval '90 days';
  return result_id;
end;
$$;
revoke all on function quiz_ops.run_service_check() from public, anon, authenticated, service_role;

-- UTC: 09:17 in summer / 08:17 in winter, Europe/Berlin.
select cron.schedule(
  'wissensquiz-daily-service-check', '17 7 * * *',
  'select quiz_ops.run_service_check();'
);

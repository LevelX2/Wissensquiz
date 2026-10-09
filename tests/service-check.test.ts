import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, expect, it } from "vitest";

let db: PGlite;
beforeEach(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users(email text, email_confirmed_at timestamptz,
      is_anonymous boolean default false, deleted_at timestamptz);
    insert into auth.users values ('test@example.invalid', now(), false, null);
    create schema extensions;
    create type extensions.http_header as (field varchar, value varchar);
    create type extensions.http_request as
      (method text, uri varchar, headers extensions.http_header[], content_type varchar, content varchar);
    create type extensions.http_response as
      (status integer, content_type varchar, headers extensions.http_header[], content varchar);
    create function extensions.http_header(varchar, varchar) returns extensions.http_header
      language sql as 'select row($1,$2)::extensions.http_header';
    create table public.mock_http (uri text, payload jsonb);
    create table public.mock_status (database_status int, mail_status int);
    insert into public.mock_status values (200,200);
    create function extensions.http(r extensions.http_request) returns extensions.http_response
      language plpgsql as $$
      declare code int;
      begin
        insert into public.mock_http values (r.uri, r.content::jsonb);
        if r.uri like '%/recover' then
          select mail_status into code from public.mock_status;
          return row(code,'application/json',null,'{}')::extensions.http_response;
        end if;
        select database_status into code from public.mock_status;
        return row(code,'application/json',null,
          '[{"version":57,"published_at":"2026-10-07T14:29:48Z"}]')::extensions.http_response;
      end; $$;
    create schema cron;
    create table cron.job(jobid bigint primary key, jobname text, schedule text, command text);
    create table cron.job_run_details(jobid bigint, end_time timestamptz);
    create function cron.schedule(text,text,text) returns bigint language sql as
      'insert into cron.job values(1,$1,$2,$3) returning jobid';
  `);
  const migration = readFileSync(
    "supabase/migrations/20261009073417_daily_service_check.sql",
    "utf8",
  ).replace(/^create extension .*;$/gm, "");
  await db.exec(migration);
  await db.exec(`insert into quiz_ops.service_config values
    (true,'https://test.supabase.co','sb_publishable_test',57,'test@example.invalid','2027-09-26');`);
});
afterEach(async () => {
  await db.close();
});

async function run() {
  await db.query("select quiz_ops.run_service_check()");
  return (
    await db.query<{
      database_ok: boolean;
      database_statuses: number[];
      mail_state: string;
    }>("select * from quiz_ops.service_checks order by id desc limit 1")
  ).rows[0];
}

it("makes three metadata reads and sends mail only every 30 days", async () => {
  expect(await run()).toMatchObject({
    database_ok: true,
    database_statuses: [200, 200, 200],
    mail_state: "accepted",
  });
  expect((await run()).mail_state).toBe("not_due");
  await db.exec(
    "update quiz_ops.service_checks set checked_at=now()-interval '29 days'",
  );
  expect((await run()).mail_state).toBe("not_due");
  await db.exec(
    "update quiz_ops.service_checks set checked_at=now()-interval '31 days'",
  );
  expect((await run()).mail_state).toBe("accepted");
  expect(
    (
      await db.query(
        "select * from public.mock_http where uri like '%/recover'",
      )
    ).rows,
  ).toHaveLength(2);
});

it("records API failures and blocks mail without discarding the check", async () => {
  await db.exec("update public.mock_status set database_status=503");
  expect(await run()).toMatchObject({
    database_ok: false,
    database_statuses: [503, 503, 503],
    mail_state: "blocked",
  });
  expect(
    (
      await db.query(
        "select * from public.mock_http where uri like '%/recover'",
      )
    ).rows,
  ).toHaveLength(0);
});

it("limits unsuccessful mail attempts to one per day", async () => {
  await db.exec("update public.mock_status set mail_status=500");
  expect((await run()).mail_state).toBe("failed");
  expect((await run()).mail_state).toBe("not_due");
  await db.exec(
    "update quiz_ops.service_checks set checked_at=now()-interval '25 hours'",
  );
  expect((await run()).mail_state).toBe("failed");
});

it("does not send to an unconfigured or unconfirmed recipient", async () => {
  await db.exec("update quiz_ops.service_config set mail_recipient=null");
  expect((await run()).mail_state).toBe("not_configured");
  await db.exec(
    "update quiz_ops.service_config set mail_recipient='unknown@example.invalid'",
  );
  expect((await run()).mail_state).toBe("recipient_unconfirmed");
  expect(
    (
      await db.query(
        "select * from public.mock_http where uri like '%/recover'",
      )
    ).rows,
  ).toHaveLength(0);
});

it("denies browser and service roles access to configuration and execution", async () => {
  for (const role of ["anon", "authenticated", "service_role"]) {
    const result = await db.query<{ allowed: boolean }>(
      `select has_schema_privilege('${role}','quiz_ops','usage')
        or has_table_privilege('${role}','quiz_ops.service_config','select')
        or has_function_privilege('${role}','quiz_ops.run_service_check()','execute') as allowed`,
    );
    expect(result.rows[0].allowed).toBe(false);
  }
});

it("retains recent mail history while removing only old operational logs", async () => {
  await db.exec(`insert into quiz_ops.service_checks
    (checked_at,database_statuses,database_ok,mail_state,mail_attempted,error_codes)
    values (now()-interval '91 days','{200,200,200}',true,'accepted',true,'{}');`);
  expect((await run()).mail_state).toBe("accepted");
  expect(
    (await db.query("select * from quiz_ops.service_checks")).rows,
  ).toHaveLength(1);
});

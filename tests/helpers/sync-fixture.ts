import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { CloudConflict } from "../../src/accounts";
import {
  CursorExpired,
  DownloadChanged,
  type SyncRemote,
} from "../../src/entryRemote";
import type { PreparedRelease } from "../../src/syncCodec";

export async function syncFixture(stopBefore?: string) {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((file) => !stopBefore || file < stopBefore))
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  const argumentsByName: Record<string, string[]> = {};
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    for (const match of readFileSync(
      `supabase/migrations/${file}`,
      "utf8",
    ).matchAll(
      /create(?: or replace)? function public\.(quiz_sync_\w+)\(([^)]*)\)/gi,
    ))
      argumentsByName[match[1]] = match[2]
        .split(",")
        .filter(Boolean)
        .map((arg) => arg.trim().split(/\s+/)[0]);
  }
  let writer: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>) => {
    const task = writer.catch(() => {}).then(fn);
    writer = task;
    return task;
  };
  async function seed(release: PreparedRelease) {
    await db.query(
      "insert into public.quiz_catalog_releases(hash,protocol,payload,digests,score_fields,question_count) values($1,1,decode($2,'base64'),$3::jsonb,$4::jsonb,$5) on conflict do nothing",
      [
        release.hash,
        release.data,
        JSON.stringify(release.digests),
        JSON.stringify(
          release.questions.map((q) => ({
            id: q.id,
            version: q.version,
            correctId: q.correctId,
            domain: q.domain,
            difficulty: q.difficulty,
            metadata:
              q.metadata.subdomain === undefined
                ? {}
                : { subdomain: q.metadata.subdomain },
          })),
        ),
        release.questions.length,
      ],
    );
  }
  async function client(owner = crypto.randomUUID()) {
    await db.query(
      'insert into auth.users values($1,now(),false,\'{"display_name":"Synthetischer Spieler"}\') on conflict do nothing',
      [owner],
    );
    const calls: { name: string; args: Record<string, unknown> }[] = [];
    let failAfter = "",
      failBefore = "",
      hook:
        | ((name: string, args: Record<string, unknown>) => Promise<void>)
        | undefined;
    const api: SyncRemote & {
      calls: typeof calls;
      lost(name: string): void;
      unavailable(name: string): void;
      hook(fn: typeof hook): void;
    } = {
      calls,
      lost(name) {
        failAfter = name;
      },
      unavailable(name) {
        failBefore = name;
      },
      hook(fn) {
        hook = fn;
      },
      stop() {},
      async call<T>(name: string, args: Record<string, unknown>) {
        calls.push({ name, args: structuredClone(args) });
        if (failBefore === name) {
          failBefore = "";
          throw new Error("Synthetische Offlinephase");
        }
        if (hook) await hook(name, args);
        const result = await serial(async () => {
          await db.exec("set role authenticated");
          await db.query(
            "select set_config('request.jwt.claim.sub',$1,false)",
            [owner],
          );
          try {
            const keys = argumentsByName[name];
            if (!keys) throw new Error(`Unbekannte Test-RPC ${name}`);
            const values = keys.map((key) => args[key]),
              params = keys.map((_, i) => `$${i + 1}`).join(",");
            return (
              await db.query<{ result: T }>(
                `select public.${name}(${params}) as result`,
                values,
              )
            ).rows[0].result;
          } catch (error) {
            const message = (error as Error).message;
            if (/revision_conflict|generation_mismatch/.test(message))
              throw new CloudConflict();
            if (message.includes("download_changed"))
              throw new DownloadChanged();
            if (message.includes("cursor_expired")) throw new CursorExpired();
            if (process.env.SYNC_TEST_DEBUG)
              process.stderr.write(message + "\n");
            throw error;
          } finally {
            await db.exec("reset role");
          }
        });
        if (failAfter === name) {
          failAfter = "";
          throw new Error("Server hat gespeichert, Bestätigung verloren");
        }
        return result;
      },
    };
    return { owner, api };
  }
  return { db, seed, client };
}

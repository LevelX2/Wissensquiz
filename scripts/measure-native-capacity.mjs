// Fresh isolated PostgreSQL only. No remote URL, secrets or production mode.
import { execFile, execFileSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { createServer } from "vite";
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce(
      (pairs, value, i, all) =>
        i % 2 ? pairs : [...pairs, [value.replace(/^--/, ""), all[i + 1]]],
      [],
    ),
);
const bin = resolve(args.bin ?? "");
const port = Number(args.port);
if (!args.bin || !Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("--bin and isolated --port required");
const output = resolve(args.out ?? "tmp-native-capacity");
const content = resolve(args.content ?? "tmp-native-capacity/server-content");
const database = "wissensquiz_capacity";
mkdirSync(output, { recursive: true });
const executable = (name) =>
  join(bin, name + (process.platform === "win32" ? ".exe" : ""));
const connection = [
  "-h",
  "127.0.0.1",
  "-p",
  String(port),
  "-U",
  "postgres",
  "-d",
  database,
];
const psql = (more) =>
  execFileSync(
    executable("psql"),
    [...connection, "-X", "-q", "-v", "ON_ERROR_STOP=1", ...more],
    { encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 },
  );
const query = (sql) => psql(["-Atc", sql]).trim();
const file = (name, sql) => {
  const path = join(output, name);
  writeFileSync(path, sql);
  psql(["-f", path]);
};
if (args.phase === "prepare") {
  if (
    Number(
      query(
        "select count(*) from pg_tables where schemaname not in ('pg_catalog','information_schema')",
      ),
    ) !== 0
  )
    throw new Error("Preparation requires an empty test database");
  const bootstrap = `create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;\n`;
  const migrations = readdirSync("supabase/migrations")
    .filter(
      (f) =>
        f.endsWith(".sql") &&
        !/_daily_(service_check|capacity_capture)\.sql$/.test(f),
    )
    .sort();
  file(
    "bootstrap.sql",
    bootstrap +
      migrations
        .map((f) => readFileSync(join("supabase/migrations", f), "utf8"))
        .join("\n"),
  );
  const parts = readdirSync(content)
    .filter((f) => /^\d{4}\.sql$/.test(f))
    .sort();
  file(
    "content.sql",
    parts.map((f) => readFileSync(join(content, f), "utf8")).join("\n") +
      readFileSync(join(content, "activate.sql"), "utf8"),
  );
  file("helpers.sql", readFileSync("scripts/native-capacity.sql", "utf8"));
  const server = await createServer({
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  });
  try {
    const { emptyState } = await server.ssrLoadModule("/src/model.ts");
    const { compileState } = await server.ssrLoadModule("/src/syncCodec.ts");
    const document = await compileState(emptyState());
    if (document.objects.size)
      throw new Error(
        "Unexpected empty-state objects; update fixture preparation explicitly",
      );
    const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
    const rows = literal(JSON.stringify([...document.rows.values()]));
    file(
      "accounts.sql",
      `do $seed$declare p uuid; target uuid; row jsonb; n integer;begin
      for n in 0..84 loop p:=bench.player(n);target:=gen_random_uuid();
      insert into auth.users values(p,'2026-10-18',false,'{"display_name":"Synthetic capacity player"}');
      insert into public.quiz_sync_generations(owner_id,id,base_revision,status) values(p,target,0,'active');
      insert into public.quiz_account_heads(owner_id,generation,revision) values(p,target,0);
      for row in select value from jsonb_array_elements(${rows}::jsonb) loop
      insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision) values(p,target,row->>'kind',row->>'id',(row->>'position')::integer,row->'value',0);
      end loop;perform quiz_game_internal.finish_projection(p,target,0);end loop;end$seed$;`,
    );
  } finally {
    await server.close();
  }
  // Test-only authoritative clock; genuine SQL timing remains clock_timestamp.
  file(
    "clock.sql",
    `create function quiz_ranked_internal.test_clock() returns timestamptz language sql volatile set search_path='' as $$select to_timestamp(1792317600)$$;
    do $patch$declare f record;begin for f in select p.oid::regprocedure name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('quiz_ranked_internal','quiz_game_internal') and p.proname<>'test_clock'
    loop execute replace(pg_get_functiondef(f.name),'clock_timestamp()','quiz_ranked_internal.test_clock()');end loop;end$patch$;
    alter table quiz_game_internal.runs alter column started_at set default quiz_ranked_internal.test_clock();
    alter table quiz_game_internal.questions alter column issued_at set default quiz_ranked_internal.test_clock();`,
  );
  console.log(
    JSON.stringify({
      prepared: true,
      questions: JSON.parse(
        query("select value from quiz_game_internal.content_info where id"),
      ),
      players: 85,
    }),
  );
} else if (args.phase === "measure") {
  if (query("select count(*) from bench.metrics") !== "0")
    throw new Error(
      "Measurement already started; use a fresh dedicated test database for a new run",
    );
  if (
    !existsSync(join(output, "accounts.sql")) ||
    query("select count(*) from auth.users") !== "85"
  )
    throw new Error("Use this harness's fresh preparation first");
  const publication = JSON.parse(
    readFileSync(join(content, "publication.json"), "utf8"),
  );
  const report = {
    environment:
      "isolated native PostgreSQL on loopback; synthetic accounts; SQL durations exclude HTTP, TLS and browser; no production capacity promise",
    version: query("show server_version"),
    content: publication,
    roundsPerClient: 2,
    addedHistoricalAnswersPerPlayer: 1000,
    protocol:
      "Each ten-question protocol runs inside one SQL transaction without human pauses or per-RPC network roundtrips; percentiles are descriptive laboratory measurements.",
    scenarios: [],
    growth: [],
  };
  const workload = join(output, "workload.sql");
  writeFileSync(
    workload,
    "select bench.play(:client_id::integer + :offset::integer);\n",
  );
  const sizes = () =>
    JSON.parse(
      query(
        "select jsonb_build_object('databaseBytes',pg_database_size(current_database()),'entries',(select count(*) from public.quiz_sync_entries),'events',(select count(*) from public.quiz_sync_entries where kind='event'),'tables',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'tableBytes',pg_table_size(c.oid),'indexBytes',pg_indexes_size(c.oid),'totalBytes',pg_total_relation_size(c.oid))) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('public','quiz_game_internal','quiz_ranked_internal')))",
      ),
    );
  report.growth.push({ stage: "initial", ...sizes() });
  for (const history of ["short", "plus1000"]) {
    if (history === "plus1000") {
      console.log("Preparing 1,000 additional historical answers per player");
      query("select bench.grow_history()");
      psql(["-c", "vacuum (analyze)"]);
      report.growth.push({ stage: "seededHistory", ...sizes() });
    }
    let offset = 0;
    for (const clients of [10, 25, 50]) {
      const name = history + "-" + clients;
      query(`update bench.scenario set name='${name}'`);
      const pgArgs = [
        "-h",
        "127.0.0.1",
        "-p",
        String(port),
        "-U",
        "postgres",
        "-n",
        "-M",
        "prepared",
        "-c",
        String(clients),
        "-j",
        String(Math.min(clients, 10)),
        "-t",
        "2",
        "-D",
        `offset=${offset}`,
        "-f",
        workload,
        "--exit-on-abort",
        "-l",
        `--log-prefix=${join(output, name)}`,
        database,
      ];
      const lockSamples = [];
      const monitor = setInterval(() => {
        lockSamples.push(
          JSON.parse(
            query(
              "select jsonb_build_object('clients',count(*),'active',count(*) filter(where state='active'),'waitingForLock',count(*) filter(where wait_event_type='Lock')) from pg_stat_activity where datname=current_database() and application_name in ('pgbench','quiz-capacity-bench')",
            ),
          ),
        );
      }, 500);
      let result;
      try {
        result = await new Promise((resolve, reject) =>
          execFile(
            executable("pgbench"),
            pgArgs,
            {
              encoding: "utf8",
              windowsHide: true,
              maxBuffer: 16 * 1024 * 1024,
              env: {
                ...process.env,
                PGAPPNAME: "quiz-capacity-bench",
                PGOPTIONS: "-c statement_timeout=120000 -c lock_timeout=30000",
              },
            },
            (error, stdout, stderr) =>
              error
                ? reject(new Error(`${error.message}\n${stderr}`))
                : resolve(stdout),
          ),
        );
      } finally {
        clearInterval(monitor);
      }
      writeFileSync(join(output, name + ".txt"), result);
      const transactions = readdirSync(output)
        .filter((f) => f.startsWith(name + ".") && /\.\d+(?:\.\d+)?$/.test(f))
        .flatMap((f) =>
          readFileSync(join(output, f), "utf8")
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => Number(line.trim().split(/\s+/)[2]) / 1000),
        )
        .sort((a, b) => a - b);
      const quantile = (p) => {
        const index = (transactions.length - 1) * p,
          lower = Math.floor(index);
        return (
          Math.round(
            (transactions[lower] +
              (transactions[Math.ceil(index)] - transactions[lower]) *
                (index - lower)) *
              1000,
          ) / 1000
        );
      };
      const metrics = JSON.parse(
        query(
          `select jsonb_agg(v) from (select operation,count(*) samples,round(percentile_cont(.5) within group(order by ms)::numeric,3) p50_ms,round(percentile_cont(.95) within group(order by ms)::numeric,3) p95_ms,round(percentile_cont(.99) within group(order by ms)::numeric,3) p99_ms,max(response_bytes) max_response_bytes from bench.metrics where scenario='${name}' group by operation order by operation) v`,
        ),
      );
      report.scenarios.push({
        name,
        clients,
        transactions: clients * 2,
        roundSql: {
          samples: transactions.length,
          p50_ms: quantile(0.5),
          p95_ms: quantile(0.95),
          p99_ms: quantile(0.99),
        },
        locks: {
          samples: lockSamples.length,
          peakClients: lockSamples.length
            ? Math.max(...lockSamples.map((s) => s.clients))
            : null,
          peakWaiting: lockSamples.length
            ? Math.max(...lockSamples.map((s) => s.waitingForLock))
            : null,
        },
        metrics,
      });
      console.log(JSON.stringify({ scenario: name, metrics }));
      offset += clients;
    }
    report.growth.push({ stage: history + "AfterRuns", ...sizes() });
  }
  report.completedRounds = Number(
    query(
      "select count(*) from quiz_game_internal.runs where status='completed'",
    ),
  );
  report.answers = Number(
    query(
      "select count(*) from quiz_game_internal.questions where event is not null",
    ),
  );
  report.errors = 0;
  report.deadlocks = Number(
    query(
      "select deadlocks from pg_stat_database where datname=current_database()",
    ),
  );
  report.passed =
    report.completedRounds === 340 &&
    report.answers === 3400 &&
    report.deadlocks === 0 &&
    report.scenarios.every(
      (scenario) => scenario.roundSql.samples === scenario.transactions,
    ) &&
    report.growth.at(-1).events === 88400;
  writeFileSync(
    join(output, "result.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  if (!report.passed)
    throw new Error("Unexpected completed-round or answer count");
} else throw new Error("--phase prepare|measure required");

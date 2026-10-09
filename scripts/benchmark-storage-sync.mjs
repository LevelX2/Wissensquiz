import { createServer } from "vite";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { resolve, join } from "node:path";
import { strict as assert } from "node:assert";
import { cpus, totalmem } from "node:os";
import { createHash } from "node:crypto";

// Explicitly isolated localhost PostgreSQL only; never opens an account API.
// Each run creates new databases and refuses existing names. No database drops.
const runId =
  process.argv[2] ?? new Date().toISOString().replace(/\D/g, "").slice(0, 14);
if (!/^\d{8,14}$/.test(runId))
  throw new Error("Ungültige synthetische Laufkennung.");
const tools = resolve(
    process.env.QUIZ_SYNC_PG_TOOLS ?? "tmp-sync/postgres-17.11/pgsql/bin",
  ),
  port = Number(process.env.QUIZ_SYNC_PG_PORT ?? 55439);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Ungültiger lokaler Testport.");
const output = resolve(`tmp-sync/benchmark-${runId}`),
  before = `quiz_sync_before_${runId}`,
  after = `quiz_sync_after_${runId}`;
await mkdir(output, { recursive: true });
const env = { ...process.env, PGCLIENTENCODING: "UTF8" };
const conn = ["-h", "127.0.0.1", "-p", String(port), "-U", "quiz_test"];
const literal = (v) => "'" + String(v).replaceAll("'", "''") + "'",
  json = (v) => literal(JSON.stringify(v)) + "::jsonb";
const bytes = (v) =>
    Buffer.byteLength(typeof v === "string" ? v : JSON.stringify(v)),
  hash = (v) => createHash("sha256").update(v).digest("hex");
const uuid = (type, i) =>
  `${type}0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
function sql(database, source) {
  if (database !== "postgres" && !database.startsWith("quiz_sync_"))
    throw new Error("Nur isolierte Testdatenbanken erlaubt.");
  const result = spawnSync(
    join(tools, "psql.exe"),
    [...conn, "-d", database, "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1"],
    {
      input: source,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      env,
      windowsHide: true,
    },
  );
  if (result.status !== 0)
    throw new Error(
      (result.stderr ?? "Lokale SQL-Prüfung fehlgeschlagen").slice(-4000),
    );
  return result.stdout.trim();
}
async function streamed(database, items) {
  const child = spawn(
    join(tools, "psql.exe"),
    [...conn, "-d", database, "-X", "-q", "-v", "ON_ERROR_STOP=1"],
    { env, windowsHide: true, stdio: ["pipe", "ignore", "pipe"] },
  );
  let error = "";
  child.stderr.on("data", (chunk) => {
    error = (error + chunk).slice(-4000);
  });
  const finished = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(error)),
    );
  });
  for await (const item of items)
    if (!child.stdin.write(item + "\n"))
      await new Promise((resolve) => child.stdin.once("drain", resolve));
  child.stdin.end();
  await finished;
}
const query = (database, source) => JSON.parse(sql(database, source));
function physical(database) {
  return query(
    database,
    `select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'tableAndToastBytes',pg_table_size(c.oid),'indexBytes',pg_indexes_size(c.oid),'totalBytes',pg_total_relation_size(c.oid)) order by c.relname),'[]') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relname like 'quiz_%';`,
  );
}
const sum = (rows) => rows.reduce((sum, row) => sum + row.totalBytes, 0);
const modifications = (database) =>
  query(
    database,
    "select jsonb_build_object('inserted',coalesce(sum(n_tup_ins),0),'updated',coalesce(sum(n_tup_upd),0),'deleted',coalesce(sum(n_tup_del),0)) from pg_stat_user_tables where schemaname='public' and relname like 'quiz_%';",
  );
async function bench(database, name, source, transactions) {
  const path = join(output, `${name}.sql`);
  await writeFile(path, source);
  sql(database, "select pg_stat_reset();");
  const lsn = sql(database, "select pg_current_wal_lsn();");
  const prefix = join(output, name),
    child = spawn(
      join(tools, "pgbench.exe"),
      [
        ...conn,
        "-n",
        "-c",
        "100",
        "-j",
        "10",
        "-t",
        String(transactions),
        "-M",
        "prepared",
        "-l",
        `--log-prefix=${prefix}`,
        "-f",
        path,
        database,
      ],
      { env, windowsHide: true },
    );
  let stdout = "",
    stderr = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  child.stderr.on("data", (chunk) => (stderr = (stderr + chunk).slice(-10000)));
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
  await writeFile(join(output, `${name}-output.txt`), stdout + stderr);
  if (code !== 0) throw new Error(`${name}: ${stderr.slice(-2000)}`);
  const latency = [];
  for (const file of await readdir(output))
    if (file.startsWith(`${name}.`) && /^\d/.test(file.slice(name.length + 1)))
      for (const line of (await readFile(join(output, file), "utf8"))
        .trim()
        .split(/\r?\n/)) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3 && Number.isFinite(Number(parts[2])))
          latency.push(Number(parts[2]) / 1000);
      }
  latency.sort((a, b) => a - b);
  const quantile = (q) =>
    latency[Math.min(latency.length - 1, Math.floor(latency.length * q))];
  const wal = Number(
    sql(
      database,
      `select pg_wal_lsn_diff(pg_current_wal_lsn(),${literal(lsn)});`,
    ),
  );
  const result = {
    clients: 100,
    threads: 10,
    transactions: latency.length,
    p50Ms: quantile(0.5),
    p95Ms: quantile(0.95),
    maxMs: latency.at(-1),
    walBytes: wal,
    modifications: modifications(database),
    output: stdout
      .trim()
      .replace(/^transaction type: .*$/m, `transaction type: ${name}.sql`),
  };
  assert.equal(latency.length, transactions * 100);
  assert.match(stdout, /number of failed transactions: 0/);
  console.log(JSON.stringify({ phase: name, ...result, output: undefined }));
  return result;
}
const server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
  }),
  oldRandom = Math.random;
let seed = 20261003;
Math.random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
try {
  const { packages, addPackages } =
      await server.ssrLoadModule("/src/packages.ts"),
    { emptyState } = await server.ssrLoadModule("/src/model.ts"),
    { startRound, answer, complete, guess } =
      await server.ssrLoadModule("/src/engine.ts"),
    { validateBackup } = await server.ssrLoadModule("/src/backupValidation.ts"),
    codec = await server.ssrLoadModule("/src/syncCodec.ts"),
    { encodeCloudState, decodeCloudState } =
      await server.ssrLoadModule("/src/cloudCodec.ts"),
    { uploadObject } = await server.ssrLoadModule("/src/entryRemote.ts");
  const state = emptyState(),
    time = Date.parse("2025-12-01T12:00:00Z"),
    options = {
      mode: "rekord",
      topic: "Alle Themen",
      difficulty: "Alle Stufen",
    };
  addPackages(
    state,
    await Promise.all(
      packages.map(async (p) => ({
        filename: p.filename,
        text: await readFile(`public${p.path}`, "utf8"),
      })),
    ),
  );
  state.imports.forEach((item) => (item.at = time));
  const release = await codec.prepareRelease(validateBackup(state).questions),
    wire = [];
  let base;
  async function measure(count) {
    const checked = validateBackup(state),
      doc = await codec.compileState(checked, [release]),
      cloud = await encodeCloudState(checked);
    const sample = {
      completedRounds: count,
      oldFullBytes: bytes(cloud),
      firstRead: {
        metadataBytes: bytes({
          protocol: 1,
          generation: uuid("b", 1),
          revision: 2,
          cursorFloor: 2,
          paused: false,
        }),
        catalogBytes: 0,
      },
      actions: [],
    };
    sample.unchangedRead = {
      metadataBytes: sample.firstRead.metadataBytes,
      catalogBytes: 0,
      entryRowsBytes: 0,
      privateObjectBytes: 0,
      totalBytes: sample.firstRead.metadataBytes,
    };
    // The public release includes its protocol fields, gzip data and SHA digests.
    const { questions: _, byContent: __, ...publicRelease } = release;
    sample.firstRead.catalogBytes = bytes(publicRelease);
    const downloadedRows = [...doc.rows.values()].map((row) => ({
      ...row,
      deleted: false,
    }));
    sample.firstRead.entryRowsBytes = bytes(downloadedRows);
    sample.firstRead.privateObjectBytes = bytes([...doc.objects.values()]);
    sample.firstRead.fullBytes =
      sample.firstRead.metadataBytes +
      sample.firstRead.catalogBytes +
      sample.firstRead.entryRowsBytes +
      sample.firstRead.privateObjectBytes;
    async function action(label, mutator, beforeState, beforeDoc) {
      const next = structuredClone(beforeState);
      mutator(next);
      const normalized = validateBackup(next),
        nextDoc = await codec.compileState(
          normalized,
          [release],
          beforeDoc,
          true,
        ),
        delta = codec.difference(beforeDoc, nextDoc);
      assert(
        codec.jsonEqual(
          codec.reconstructState(codec.applyDifference(beforeDoc, delta), [
            release,
          ]),
          normalized,
        ),
      );
      const packet = {
        format: codec.SYNC_FORMAT,
        protocol: 1,
        id: uuid("c", 1),
        owner: uuid("a", 1),
        generation: uuid("b", 1),
        expectedRevision: 2,
        changes: delta.changes,
        objects: [],
      };
      let objectRequestsBytes = 0,
        objectRequests = 0;
      const recorder = {
        call: async (_name, args) => {
          objectRequestsBytes += bytes(args);
          objectRequests++;
        },
        stop() {},
      };
      for (const object of delta.objects)
        await uploadObject(recorder, uuid("a", 1), uuid("b", 1), object);
      const oldPayload = await encodeCloudState(normalized);
      sample.actions.push({
        action: label,
        oldFullBytes: bytes(oldPayload),
        oldRpcRequestBytes: bytes({
          payload: oldPayload,
          expected_revision: 2,
          expected_owner: uuid("a", 1),
        }),
        packetBytes: bytes(codec.stableStringify(packet)),
        applyRpcRequestBytes: bytes({
          packet_text: codec.stableStringify(packet),
        }),
        objectRpcRequestBytes: objectRequestsBytes,
        totalRpcRequestBytes:
          bytes({ packet_text: codec.stableStringify(packet) }) +
          objectRequestsBytes,
        objectRequests,
        preparedObjectBytes: bytes(delta.objects),
        changedEntries: delta.changes.length,
      });
      return { state: normalized, doc: nextDoc };
    }
    await action(
      "setting",
      (s) => {
        s.settings.sound = !s.settings.sound;
      },
      checked,
      doc,
    );
    const started = await action(
        "round-start",
        (s) => {
          const r = startRound(s, options, time + 301 * 86400000);
          r.id = "synthetic-measured-active";
        },
        checked,
        doc,
      ),
      r = started.state.rounds.at(-1),
      q = r.questions[0];
    const answered = await action(
      "answer",
      (s) => answer(s, r.id, q.id, q.correctId, 1000, r.startedAt + 1000),
      started.state,
      started.doc,
    );
    await action(
      "guess-correction",
      (s) => guess(s, s.events.at(-1).id),
      answered.state,
      answered.doc,
    );
    const ready = structuredClone(answered.state);
    for (const question of ready.rounds.at(-1).questions.slice(1))
      answer(
        ready,
        r.id,
        question.id,
        question.correctId,
        1000,
        r.startedAt + 2000,
      );
    const readyDoc = await codec.compileState(
      validateBackup(ready),
      [release],
      answered.doc,
      true,
    );
    await action(
      "round-complete",
      (s) => complete(s, r.id, r.startedAt + 30000),
      validateBackup(ready),
      readyDoc,
    );
    wire.push(sample);
    console.log(
      JSON.stringify({
        phase: "wire",
        rounds: count,
        answerBytes: sample.actions.find((a) => a.action === "answer")
          .packetBytes,
      }),
    );
  }
  for (let n = 0; n <= 300; n++) {
    if ([0, 10, 30, 100, 300].includes(n)) await measure(n);
    if (n === 30) base = structuredClone(validateBackup(state));
    if (n === 300) break;
    const r = startRound(state, options, time + n * 86400000);
    r.id = `synthetic-round-${String(n).padStart(4, "0")}`;
    for (let i = 0; i < r.questions.length; i++) {
      const q = r.questions[i];
      answer(
        state,
        r.id,
        q.id,
        i % 4 === 0
          ? q.answers.find((a) => a.id !== q.correctId).id
          : q.correctId,
        5000,
        r.startedAt + (i + 1) * 6000,
      );
      if (i % 7 === 1) guess(state, state.events.at(-1).id);
    }
    complete(state, r.id, r.startedAt + 120000);
    if (n % 25 === 24)
      console.log(
        JSON.stringify({ phase: "synthetic-history", completed: n + 1 }),
      );
  }
  if (process.env.QUIZ_SYNC_WIRE_ONLY === "1") {
    const reportPath = "docs/Speicher-und-Sync-Messung.json";
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    assert.equal(
      report.runId,
      runId,
      "Nur den zugehörigen Messbericht ergänzen.",
    );
    report.wire = wire;
    report.wireMethod =
      "UTF-8 JSON byte counts from actual App mutations, codec and uploadObject RPC argument builder; includes escaped packet_text and object-piece request bodies, excludes HTTP headers/auth/TLS/compression. First-read values are compact serialized object/row sums, without page envelope overhead.";
    report.limitations.push(
      "WAL measures cluster LSN changes over each run, including background activity; nonzero read-run WAL is not evidence that list queries modify game data.",
    );
    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
    await writeFile(
      join(output, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify({ phase: "wire-refresh-complete", report: reportPath }),
    );
  } else {
    const active = startRound(base, options, time + 31 * 86400000);
    active.id = "synthetic-load-active";
    base = validateBackup(base);
    const initialDoc = await codec.compileState(base, [release]),
      baseCloud = await encodeCloudState(base);
    assert(codec.jsonEqual(await decodeCloudState(baseCloud), base));
    const states = [],
      deltas = [];
    let draft = structuredClone(base),
      document = initialDoc;
    for (let i = 0; i < active.questions.length; i++) {
      const q = active.questions[i];
      answer(
        draft,
        active.id,
        q.id,
        q.correctId,
        1000,
        active.startedAt + (i + 1) * 2000,
      );
      const checked = validateBackup(draft),
        next = await codec.compileState(checked, [release], document, true);
      states.push(await encodeCloudState(checked));
      deltas.push(codec.difference(document, next));
      document = next;
    }
    complete(draft, active.id, active.startedAt + 30000);
    draft = validateBackup(draft);
    const done = await codec.compileState(draft, [release], document, true);
    states.push(await encodeCloudState(draft));
    deltas.push(codec.difference(document, done));
    sql(
      "postgres",
      `do $$begin if not exists(select 1 from pg_roles where rolname='anon')then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated')then create role authenticated;end if;end$$;`,
    );
    for (const database of [before, after])
      sql("postgres", `create database ${database};`);
    const migrations = (await readdir("supabase/migrations"))
      .filter((f) => f.endsWith(".sql"))
      // The storage benchmark does not provision cloud HTTP or cron workers.
      .filter((f) => !f.endsWith("_daily_service_check.sql"))
      .sort();
    for (const database of [before, after]) {
      sql(
        database,
        `create schema auth;create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean default false,raw_user_meta_data jsonb);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
      );
      for (const file of migrations.filter(
        (file) => database === after || file < "20261003081845",
      ))
        sql(database, await readFile(`supabase/migrations/${file}`, "utf8"));
      if (database === after)
        sql(
          database,
          await readFile("tmp-sync/catalog/operator-seed.sql", "utf8"),
        );
      await streamed(
        database,
        (async function* () {
          for (let i = 1; i <= 100; i++) {
            yield `insert into auth.users values(${literal(uuid("a", i))},now(),false,${json({ display_name: `Synthetisch ${i}` })});`;
            yield `insert into public.quiz_saves(owner_id,state,revision) values(${literal(uuid("a", i))},${json(baseCloud)},1);`;
            if (i % 20 === 0)
              console.log(
                JSON.stringify({ phase: "seed", database, players: i }),
              );
          }
        })(),
      );
      sql(database, "vacuum analyze;");
    }
    const oldPhysical = physical(before),
      preMigrationPhysical = physical(after);
    await streamed(
      after,
      (async function* () {
        for (let i = 1; i <= 100; i++) {
          const owner = uuid("a", i),
            generation = uuid("b", i);
          yield `select set_config('request.jwt.claim.sub',${literal(owner)},false);select public.quiz_sync_begin(${literal(owner)},${literal(generation)},null,1);`;
          for (const object of initialDoc.objects.values())
            yield `select public.quiz_sync_object_piece(${literal(owner)},${literal(generation)},${literal(object.hash)},${literal(object.encoding)},0,1,${literal(object.text)});`;
          const rows = [...initialDoc.rows.values()];
          for (let at = 0; at < rows.length; at += 200)
            yield `select public.quiz_sync_stage(${literal(owner)},${literal(generation)},${json(rows.slice(at, at + 200).map((row) => ({ op: "put", row })))});`;
          yield `select public.quiz_sync_seal(${literal(owner)},${literal(generation)},${rows.length},${initialDoc.objects.size});select public.quiz_sync_activate(${literal(owner)},${literal(generation)});`;
          if (i % 20 === 0)
            console.log(JSON.stringify({ phase: "migration", players: i }));
        }
      })(),
    );
    const peakPhysical = physical(after),
      exportText = JSON.stringify(base),
      backupHash = hash(exportText);
    await writeFile(join(output, "verified-synthetic-state.json"), exportText);
    for (let i = 1; i <= 100; i++) {
      const owner = uuid("a", i),
        generation = uuid("b", i);
      const rows = query(
          after,
          `select jsonb_agg(jsonb_build_object('kind',kind,'id',id,'position',position,'value',value)) from public.quiz_sync_entries where owner_id=${literal(owner)} and generation=${literal(generation)} and not deleted;`,
        ),
        objects = query(
          after,
          `select jsonb_agg(jsonb_build_object('hash',hash,'encoding',encoding,'text',content)) from public.quiz_private_catalog_objects where owner_id=${literal(owner)} and generation=${literal(generation)};`,
        );
      const actual = codec.reconstructState(
        {
          rows: new Map(rows.map((row) => [`${row.kind}:${row.id}`, row])),
          objects: new Map(objects.map((object) => [object.hash, object])),
        },
        [release],
      );
      assert(codec.jsonEqual(actual, base));
      sql(
        after,
        `select quiz_sync_internal.release_fallback(${literal(owner)},${literal(generation)},2,${literal(backupHash)});`,
      );
      if (i % 20 === 0)
        console.log(
          JSON.stringify({ phase: "verified-export-cleanup", players: i }),
        );
    }
    assert.equal(
      sql(after, "select quiz_sync_internal.compact_empty_legacy();"),
      "t",
    );
    sql(after, "vacuum analyze;");
    const newPhysical = physical(after);
    for (const database of [before, after]) {
      sql(
        database,
        `create schema bench;create table bench.sessions(player integer primary key,owner_id uuid not null,step integer not null default 0);`,
      );
      for (let i = 1; i <= 100; i++)
        sql(
          database,
          `insert into bench.sessions(player,owner_id)values(${i},${literal(uuid("a", i))});`,
        );
    }
    sql(
      before,
      "create table bench.templates(step integer primary key,payload jsonb not null);",
    );
    for (let i = 0; i < states.length; i++)
      sql(
        before,
        `insert into bench.templates values(${i + 1},${json(states[i])});`,
      );
    sql(
      before,
      `create function bench.step(client integer)returns bigint language plpgsql as $$declare s bench.sessions;begin update bench.sessions set step=step+1 where player=client+1 returning * into s;perform set_config('request.jwt.claim.sub',s.owner_id::text,true);return public.quiz_save_state((select payload from bench.templates where step=s.step),s.step,s.owner_id);end$$;`,
    );
    sql(
      after,
      "create table bench.packets(player integer,step integer,payload text,primary key(player,step));",
    );
    await streamed(
      after,
      (async function* () {
        for (let i = 1; i <= 100; i++)
          for (let step = 0; step < deltas.length; step++) {
            assert.equal(deltas[step].objects.length, 0);
            yield `insert into bench.packets values(${i},${step + 1},${literal(codec.stableStringify({ format: codec.SYNC_FORMAT, protocol: 1, id: uuid("c", i * 100 + step), owner: uuid("a", i), generation: uuid("b", i), expectedRevision: 2 + step, ...deltas[step] }))});`;
          }
      })(),
    );
    sql(
      after,
      `create function bench.step(client integer)returns bigint language plpgsql as $$declare s bench.sessions;result jsonb;begin update bench.sessions set step=step+1 where player=client+1 returning * into s;perform set_config('request.jwt.claim.sub',s.owner_id::text,true);result:=public.quiz_sync_apply((select payload from bench.packets where player=s.player and step=s.step));return(result->>'revision')::bigint;end$$;`,
    );
    console.log(
      JSON.stringify({
        phase: "physical",
        beforeBytes: sum(oldPhysical),
        migrationPeakBytes: sum(peakPhysical),
        afterCleanupBytes: sum(newPhysical),
      }),
    );
    const writesBefore = await bench(
        before,
        "writes-before",
        "select bench.step(:client_id);\n",
        states.length,
      ),
      writesAfter = await bench(
        after,
        "writes-after",
        "select bench.step(:client_id);\n",
        states.length,
      );
    const listSql =
      "select * from public.quiz_public_players('experience',0);\n";
    const listsBefore = await bench(before, "lists-before", listSql, 1),
      listsAfter = await bench(after, "lists-after", listSql, 1);
    const report = {
      format: "storage-sync-measurement-v1",
      date: "2026-10-03",
      seed: 20261003,
      runId,
      scope:
        "Public full App catalog and synthetic states only. Physical PostgreSQL relations incl. TOAST and indexes. SQL transactions at 100 concurrent local sessions; no HTTP/auth-provider/network latency or guaranteed production capacity.",
      environment: {
        postgres: sql(after, "select version();"),
        cpu: cpus()[0].model,
        logicalCPUs: cpus().length,
        memoryBytes: totalmem(),
        sharedBuffers: sql(after, "show shared_buffers;"),
        maxConnections: sql(after, "show max_connections;"),
        loopback: true,
      },
      questions: release.questions.length,
      workload: {
        accounts: 100,
        completedRoundsPerAccount: 30,
        answerThenCompletionTransactions: states.length,
        controlledFirstTime: time,
        initialReconstructionChecks: 100,
      },
      wire,
      migrationFileSha256: Object.fromEntries(
        await Promise.all(
          migrations.map(async (file) => [
            file,
            hash(await readFile(`supabase/migrations/${file}`)),
          ]),
        ),
      ),
      physical: {
        before: oldPhysical,
        beforeTotalBytes: sum(oldPhysical),
        beforeMigration: preMigrationPhysical,
        migrationPeak: peakPhysical,
        migrationPeakTotalBytes: sum(peakPhysical),
        afterCleanup: newPhysical,
        afterCleanupTotalBytes: sum(newPhysical),
        afterLoad: physical(after),
      },
      load: { writesBefore, writesAfter, listsBefore, listsAfter },
      limitations: [
        "Synthetic history and hardware are specified, not representative of every import or duel history.",
        "pgbench payloads are prepared in isolated bench tables; HTTP byte counts are separately derived from actual client packets. SQL timings exclude JSON request decoding and HTTP transfers.",
        "The peak includes the retained frozen legacy source and new data; cleanup requires verified current exports and exact generation/revision checks.",
        "Allocated empty legacy tables were reclaimed by the guarded operator helper only after all synthetic fallbacks were verified and released.",
        "100 local sessions prove this isolated workload; Free/Nano CPU, RAM, connection pool and network limits must be assessed separately.",
        "WAL measures cluster LSN changes over each run, including background activity; nonzero read-run WAL is not evidence that list queries modify game data.",
      ],
      wireMethod:
        "UTF-8 JSON byte counts from actual App mutations, codec and uploadObject RPC argument builder; includes escaped packet_text and object-piece request bodies, excludes HTTP headers/auth/TLS/compression. First-read values are compact serialized object/row sums, without page envelope overhead.",
    };
    await writeFile(
      "docs/Speicher-und-Sync-Messung.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    await writeFile(
      join(output, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify({
        phase: "complete",
        beforeBytes: report.physical.beforeTotalBytes,
        afterBytes: report.physical.afterCleanupTotalBytes,
        report: "docs/Speicher-und-Sync-Messung.json",
      }),
    );
  }
} finally {
  Math.random = oldRandom;
  await server.close();
}

import { beforeAll, afterAll, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import { RankedSession } from "../src/rankedRuns";

let fixture: Awaited<ReturnType<typeof syncFixture>>;
let release: Awaited<ReturnType<typeof prepareTestContent>>;
beforeAll(async () => {
  fixture = await syncFixture();
  release = await prepareTestContent(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions,
  );
  await fixture.seedRanked(release);
}, 30000);
afterAll(() => fixture?.db.close());
const day = 86400000;

it("bewahrt aktive und frische Belege, entfernt alte Antworten und verhindert einen erneuten alten Start", async () => {
  const { api, owner } = await fixture.client();
  const stamp = Date.parse("2026-10-18T10:00:00Z");
  api.clockAt(stamp);
  const session = new RankedSession(api, release.hash);
  await session.start({
    mode: "rekord",
    preset: "standard",
    solutionDisplay: "question",
  });
  const startText = api.calls.at(-1)!.args.request_text;
  for (let i = 0; i < 10; i++) {
    api.clockAt(stamp + i * 1000 + 500);
    await session.answer(
      release.questions.find((q) => q.id === session.current!.question.id)!
        .correctId,
    );
    if (i < 9) await session.next();
  }
  const answerText = api.calls.find(
    (call) => JSON.parse(String(call.args.request_text)).action === "answer",
  )!.args.request_text;
  const active = await fixture.client();
  active.api.clockAt(stamp);
  const activeSession = new RankedSession(active.api, release.hash);
  await activeSession.start({
    mode: "rekord",
    preset: "standard",
    solutionDisplay: "question",
  });
  await fixture.db.query("select set_config('quiz.test_now',$1,false)", [
    String(stamp + 6 * day),
  ]);
  expect(
    (
      await fixture.db.query<{ n: number }>(
        "select quiz_ranked_internal.prune_receipts()::integer n",
      )
    ).rows[0].n,
  ).toBe(0);
  api.clockAt(stamp + 6 * day);
  await api.call("quiz_ranked_call", { request_text: answerText });
  expect(
    (
      await fixture.db.query<{ n: number }>(
        "select count(*)::integer n from quiz_ranked_internal.questions where run_id=$1 and event is not null",
        [session.run!.id],
      )
    ).rows[0].n,
  ).toBe(10);
  await fixture.db.query("select set_config('quiz.test_now',$1,false)", [
    String(stamp + 8 * day),
  ]);
  expect(
    (
      await fixture.db.query<{ n: number }>(
        "select quiz_ranked_internal.prune_receipts()::integer n",
      )
    ).rows[0].n,
  ).toBe(20);
  expect(
    (
      await fixture.db.query<{ n: number }>(
        "select count(*)::integer n from quiz_ranked_internal.receipts where owner_id=$1",
        [active.owner],
      )
    ).rows[0].n,
  ).toBe(1);
  api.clockAt(stamp + 8 * day);
  await expect(
    api.call("quiz_ranked_call", { request_text: startText }),
  ).rejects.toThrow("ranked_request_expired");
  await expect(
    api.call("quiz_ranked_call", { request_text: answerText }),
  ).rejects.toThrow("ranked_request_expired");
  expect(
    (
      await fixture.db.query<{ n: number }>(
        "select count(*)::integer n from quiz_ranked_internal.runs where owner_id=$1",
        [owner],
      )
    ).rows[0].n,
  ).toBe(1);
  expect(
    (
      await fixture.db.query<{ n: number }>(
        "select count(*)::integer n from quiz_ranked_internal.scores where owner_id=$1",
        [owner],
      )
    ).rows[0].n,
  ).toBe(1);
});

it("erfasst Größen privat beim täglichen Betriebsnachweis und begrenzt die Messhistorie", async () => {
  await fixture.db
    .exec(`create schema quiz_ops; create table quiz_ops.service_checks(id integer);
    ${readFileSync("supabase/migrations/20261020215318_daily_capacity_capture.sql", "utf8")}`);
  await fixture.db.exec("insert into quiz_ops.service_checks values(1)");
  const sample = (
    await fixture.db.query<{
      database_bytes: number;
      relations: {
        schema: string;
        table: string;
        totalBytes: number;
        estimatedRows: number;
      }[];
      collection_ms: number;
    }>("select * from quiz_capacity_internal.samples")
  ).rows[0];
  expect(Number(sample.database_bytes)).toBeGreaterThan(0);
  expect(
    sample.relations.some(
      (r) => r.schema === "quiz_ranked_internal" && r.table === "receipts",
    ),
  ).toBe(true);
  expect(
    sample.relations.every((r) => r.totalBytes >= 0 && r.estimatedRows >= 0),
  ).toBe(true);
  expect(Number(sample.collection_ms)).toBeGreaterThanOrEqual(0);
  await fixture.db.exec(
    "update quiz_capacity_internal.samples set checked_at='2000-01-01'; insert into quiz_ops.service_checks values(2)",
  );
  expect(
    (
      await fixture.db.query<{ n: number }>(
        "select count(*)::integer n from quiz_capacity_internal.samples",
      )
    ).rows[0].n,
  ).toBe(1);
  for (const role of ["anon", "authenticated", "service_role"])
    for (const fn of [
      "quiz_capacity_internal.capture_sample()",
      "quiz_ranked_internal.prune_receipts(uuid)",
      "quiz_ops.capture_capacity_after_check()",
    ])
      expect(
        (
          await fixture.db.query<{ allowed: boolean }>(
            "select has_function_privilege($1,$2,'EXECUTE') allowed",
            [role, fn],
          )
        ).rows[0].allowed,
      ).toBe(false);
});

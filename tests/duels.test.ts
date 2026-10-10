import { afterAll, beforeAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import {
  importDuelView,
  duelSchema,
  duelViewSchema,
  duelStartSchema,
  duelRoundId,
  duelScreen,
  duelReviewRound,
} from "../src/duels";
import { validateBackup } from "../src/storage";
import { archiveClosedRounds } from "../src/roundArchive";
let db: PGlite;
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  carol = "33333333-3333-4333-8333-333333333333";
const questions = importCsv(
  readFileSync("public/fragen.csv", "utf8"),
).questions;
async function as<T>(id: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false)`,
  );
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function rpc<T = unknown>(
  name: string,
  args: unknown[] = [],
): Promise<T> {
  return (
    await db.query<{ value: T }>(
      `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) as value`,
      args,
    )
  ).rows[0].value;
}
beforeAll(async () => {
  ({ db } = await syncFixture());
  await db.exec(
    `insert into auth.users values('${alice}',now(),false,'{"display_name":"Alice"}'),('${bob}',now(),false,'{"display_name":"Bob"}'),('${carol}',now(),false,'{"display_name":"Carol"}');`,
  );
  for (const q of questions)
    await db.query(
      "insert into quiz_duel_catalog(id,knowledge_id,difficulty,genre,familiarity,question) values($1,$2,$3,'Science-Fiction',2,$4)",
      [q.id, q.knowledgeId, q.difficulty, q],
    );
}, 30000);
afterAll(() => db.close());
async function block(
  id: string,
  d: string,
  r: number,
  pattern = (i: number) => i % 2 === 0,
) {
  return as(id, async () => {
    for (let i = 0; i < 10; i++) {
      const v = duelStartSchema.parse(await rpc("quiz_duel_start", [d, r, i]));
      const q = questions.find((q) => q.id === v.current!.question.id)!;
      await rpc("quiz_duel_answer", [
        d,
        r,
        i,
        pattern(i)
          ? q.correctId
          : q.answers.find((a) => a.id !== q.correctId)!.id,
        false,
        false,
      ]);
    }
    return duelViewSchema.parse(await rpc("quiz_duel_view", [d, r]));
  });
}
it("spielt alle vier Blöcke mit gleichen Fragen, verborgenen Gegnerwerten und serverseitiger Endabrechnung", async () => {
  const d = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
    ),
  );
  let a = await block(alice, d.id, 1, () => true);
  expect(a.duel.status).toBe("waiting");
  expect(a.duel.rounds[0]).toMatchObject({ mine: 10, opponent: null });
  const joined = duelSchema.parse(
    await as(bob, () =>
      rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
    ),
  );
  expect(joined.id).toBe(d.id);
  const bFirst = duelStartSchema.parse(
    await as(bob, () => rpc("quiz_duel_start", [d.id, 1, 0])),
  );
  expect(bFirst.current!.question.id).toBe(a.items[0].question.id);
  expect(bFirst.current!.order).toEqual(a.items[0].order);
  expect(bFirst.current!.question.correctId).toBeUndefined();
  expect(Object.keys(bFirst.current!.question.metadata)).toEqual(["subdomain"]);
  expect(
    bFirst.current!.question.answers.every((a) => a.feedback === undefined),
  ).toBe(true);
  expect(bFirst.duel.rounds[0].opponent).toBeNull();
  const b1 = await block(bob, d.id, 1);
  expect(b1.duel.round).toBe(2);
  expect(b1.duel.myTurn).toBe(true);
  expect(b1.duel.rounds[0].opponent).toBe(10);
  const before = b1.duel.dueAt;
  const b2 = await block(bob, d.id, 2, () => true);
  expect(b2.duel.myTurn).toBe(false);
  a = await block(alice, d.id, 2);
  expect(a.duel.round).toBe(3);
  expect(a.duel.dueAt).toBeGreaterThanOrEqual(before);
  await block(alice, d.id, 3, () => true);
  const end = await block(bob, d.id, 3);
  expect(end.duel.status).toBe("completed");
  expect(end.duel.result).toBe("loss");
  expect(end.duel.rounds.map((r) => r.mine)).toEqual([5, 10, 5]);
  expect(end.duel.rounds.map((r) => r.opponent)).toEqual([10, 5, 10]);
  const allIds = [
    ...a.items.map((i) => i.question.knowledgeId),
    ...end.items.map((i) => i.question.knowledgeId),
  ];
  expect(new Set(allIds).size).toBe(20);
}, 30000);
it("hält gesammelte Lösungen bis zur eigenen zehnten Frage zurück und übernimmt Lernereignisse genau einmal", async () => {
  const d = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_create", ["round", true, crypto.randomUUID()]),
    ),
  );
  let v = {
    ...duelStartSchema.parse(
      await as(alice, () => rpc("quiz_duel_start", [d.id, 1, 0])),
    ),
    items: [] as import("../src/duels").DuelView["items"],
  };
  const q = questions.find((q) => q.id === v.current!.question.id)!;
  v = duelViewSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_answer", [d.id, 1, 0, q.correctId, false, true]),
    ),
  );
  expect(v.items[0].event.correct).toBeNull();
  expect(v.items[0].event.guessed).toBe(false);
  expect(v.items[0].question.correctId).toBeUndefined();
  expect(Object.keys(v.items[0].question.metadata)).toEqual(["subdomain"]);
  const state = emptyState(questions);
  importDuelView(state, v);
  expect(state.events).toHaveLength(0);
  for (let i = 1; i < 10; i++)
    await as(alice, async () => {
      const next = duelStartSchema.parse(
        await rpc("quiz_duel_start", [d.id, 1, i]),
      );
      const question = questions.find(
        (q) => q.id === next.current!.question.id,
      )!;
      await rpc("quiz_duel_answer", [
        d.id,
        1,
        i,
        question.correctId,
        false,
        false,
      ]);
    });
  v = duelViewSchema.parse(
    await as(alice, () => rpc("quiz_duel_view", [d.id, 1])),
  );
  expect(v.duel.status).toBe("waiting");
  expect(v.items.every((i) => i.question.correctId && i.event.correct)).toBe(
    true,
  );
  const unfinished = emptyState(questions);
  importDuelView(unfinished, v, false);
  expect(unfinished.rounds[0].status).toBe("aborted");
  expect(unfinished.experience).toBe(0);
  const lastGuess = structuredClone(v);
  lastGuess.items[9].event.guessed = true;
  importDuelView(unfinished, lastGuess, false);
  expect(unfinished.experience).toBe(0);
  importDuelView(unfinished, lastGuess);
  expect(unfinished.rounds[0].status).toBe("completed");
  expect(unfinished.events[9].guessed).toBe(true);
  expect(unfinished.experience).toBeGreaterThan(0);
  const resumed = emptyState(questions);
  const partial = { ...v, items: v.items.slice(0, 3) };
  importDuelView(resumed, partial, false);
  archiveClosedRounds(resumed);
  expect(resumed.rounds[0].archive?.questions).toHaveLength(3);
  importDuelView(resumed, lastGuess, false);
  expect(resumed.rounds[0].archive?.questions).toHaveLength(10);
  expect(resumed.rounds[0].questions).toHaveLength(0);
  expect(resumed.experience).toBe(0);
  importDuelView(resumed, lastGuess);
  expect(resumed.experience).toBe(unfinished.experience);
  expect(validateBackup(resumed).events).toEqual(unfinished.events);
  expect(duelReviewRound(lastGuess, resumed.rounds[0]).questions).toHaveLength(
    10,
  );
  importDuelView(resumed, lastGuess);
  expect(resumed.events).toHaveLength(10);
  expect(resumed.rounds[0].questions).toHaveLength(0);
  importDuelView(state, v);
  expect(state.questions).toHaveLength(questions.length);
  const xp = state.experience;
  importDuelView(state, v);
  expect(state.events).toHaveLength(10);
  expect(state.experience).toBe(xp);
  expect(state.events[0].guessed).toBe(true);
  expect(state.rounds[0].status).toBe("completed");
  expect(validateBackup(state).events).toHaveLength(10);
  const screen = duelScreen(v, 9, state);
  expect(screen.round.questions).toHaveLength(10);
  // A running duel keeps its frozen content after a public catalogue update.
  const changed = structuredClone(questions);
  const currentQuestion = changed.find(
    (base) => base.id === v.items[0].question.id,
  )!;
  currentQuestion.question += " (neue Fassung)";
  currentQuestion.version = "new-catalog-version";
  const updated = emptyState(changed);
  importDuelView(updated, v);
  importDuelView(updated, v);
  expect(
    updated.questions.find((base) => base.id === currentQuestion.id),
  ).toEqual(currentQuestion);
  expect(updated.rounds[0].questions[0].id).toMatch(/^DUEL-/);
  expect(updated.rounds[0].questions[0].knowledgeId).toBe(
    currentQuestion.knowledgeId,
  );
  expect(updated.events).toHaveLength(10);
  expect(validateBackup(updated).events).toHaveLength(10);
  await as(alice, () => rpc("quiz_duel_close", [d.id]));
}, 30000);
it("prüft fremde Zugriffe, interne Tabellen, Antwortwiederholungen, vorzeitige Zeitabläufe und Selbstpaarung", async () => {
  const request = crypto.randomUUID();
  const d = duelSchema.parse(
    await as(alice, () => rpc("quiz_duel_create", ["question", true, request])),
  );
  const again = duelSchema.parse(
    await as(alice, () => rpc("quiz_duel_create", ["question", true, request])),
  );
  expect(again.id).toBe(d.id);
  await expect(
    as(carol, () => rpc("quiz_duel_view", [d.id, 1])),
  ).rejects.toThrow();
  await expect(
    as(alice, () => rpc("quiz_duel_answer", [d.id, 1, 0, null, true, false])),
  ).rejects.toThrow();
  await as(alice, () => rpc("quiz_duel_start", [d.id, 1, 0]));
  await expect(
    as(alice, () => rpc("quiz_duel_answer", [d.id, 1, 0, null, false, false])),
  ).rejects.toThrow("question_not_expired");
  const first = duelViewSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_answer", [d.id, 1, 0, null, true, false]),
    ),
  );
  const repeated = duelViewSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_answer", [
        d.id,
        1,
        0,
        questions[0].correctId,
        false,
        false,
      ]),
    ),
  );
  expect(repeated.items).toEqual(first.items);
  expect(repeated.items[0].event).toMatchObject({
    dontKnow: true,
    correct: false,
  });
  const token = (
    await db.query<{ token: string }>(
      "select token from quiz_duels where id=$1",
      [d.id],
    )
  ).rows[0].token;
  await expect(as(alice, () => rpc("quiz_duel_join", [token]))).rejects.toThrow(
    "self_duel",
  );
  await expect(
    as(alice, () => db.query("select * from quiz_duels")),
  ).rejects.toThrow();
  const rights = (
    await db.query(
      "select has_function_privilege('anon','quiz_duel_list()','execute') as anon,has_function_privilege('authenticated','quiz_duel_slots(uuid)','execute') as internal",
    )
  ).rows[0];
  expect(rights).toEqual({ anon: false, internal: false });
  await db.query(
    "update quiz_duel_answers set started_at=clock_timestamp()-interval '31 seconds' where duel_id=$1 and question_no=0",
    [d.id],
  );
  await as(alice, () => rpc("quiz_duel_start", [d.id, 1, 1]));
  await db.query(
    "update quiz_duel_answers set started_at=clock_timestamp()-interval '31 seconds' where duel_id=$1 and question_no=1",
    [d.id],
  );
  const expired = duelViewSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_answer", [d.id, 1, 1, null, true, false]),
    ),
  );
  expect(expired.items[1].event).toMatchObject({
    dontKnow: false,
    correct: false,
    answerId: null,
  });
  await as(alice, () => rpc("quiz_duel_close", [d.id]));
});
it("beendet abgelaufene Spiele ohne erfundene Antworten und gibt Plätze frei", async () => {
  const d = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
    ),
  );
  await block(alice, d.id, 1);
  await db.query(
    "update quiz_duels set due_at=clock_timestamp()-interval '1 second' where id=$1",
    [d.id],
  );
  const entries = zList(await as(alice, () => rpc("quiz_duel_list")));
  expect(entries.find((e) => e.id === d.id)).toMatchObject({
    status: "cancelled",
    reason: "no_opponent",
    result: null,
  });
  const second = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
    ),
  );
  await block(alice, second.id, 1);
  await as(bob, () =>
    rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
  );
  await block(bob, second.id, 1);
  await db.query(
    "update quiz_duels set due_at=clock_timestamp()-interval '1 second' where id=$1",
    [second.id],
  );
  const forfeit = zList(await as(alice, () => rpc("quiz_duel_list"))).find(
    (e) => e.id === second.id,
  )!;
  expect(forfeit).toMatchObject({
    status: "forfeit",
    reason: "timeout",
    result: "win",
  });
  expect(forfeit.rounds[1].answered).toBe(0);
});
function zList(value: unknown) {
  return (value as unknown[]).map((d) => duelSchema.parse(d));
}
it("begrenzt offene Spiele auf insgesamt fünf und erlaubt nur eine nicht angenommene Herausforderung", async () => {
  const first = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_create", ["question", true, crypto.randomUUID()]),
    ),
  );
  await expect(
    as(alice, () =>
      rpc("quiz_duel_create", ["round", true, crypto.randomUUID()]),
    ),
  ).rejects.toThrow("waiting_limit");
  const pack = (
    await db.query<{ questions: unknown }>(
      "select questions from quiz_duels where id=$1",
      [first.id],
    )
  ).rows[0].questions;
  const ids = [first.id];
  for (let i = 0; i < 4; i++) {
    const id = crypto.randomUUID();
    ids.push(id);
    await db.query(
      "insert into quiz_duels(id,creator,opponent,kind,solution_display,request_id,questions,status,turn_owner) values($1,$2,$3,'random','question',$4,$5,'active',$2)",
      [id, alice, bob, crypto.randomUUID(), pack],
    );
  }
  expect(
    zList(await as(alice, () => rpc("quiz_duel_list"))).filter((d) =>
      ["preparing", "waiting", "active"].includes(d.status),
    ),
  ).toHaveLength(5);
  await expect(
    as(alice, () =>
      rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
    ),
  ).rejects.toThrow("duel_limit");
  await as(alice, () => rpc("quiz_duel_close", [first.id]));
  const replacement = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_create", ["question", true, crypto.randomUUID()]),
    ),
  );
  expect(replacement.id).not.toBe(first.id);
  ids.push(replacement.id);
  for (const id of ids) await as(alice, () => rpc("quiz_duel_close", [id]));
});
it("nimmt Einladungen genau einmal an und hält die ursprüngliche Erstellungsanfrage idempotent", async () => {
  const request = crypto.randomUUID();
  const d = duelSchema.parse(
    await as(alice, () => rpc("quiz_duel_create", ["question", true, request])),
  );
  const v = await block(alice, d.id, 1);
  const token = v.duel.invitation!;
  expect(token).toHaveLength(64);
  const joined = duelSchema.parse(
    await as(bob, () => rpc("quiz_duel_join", [token])),
  );
  expect(joined.id).toBe(d.id);
  expect(
    duelSchema.parse(await as(bob, () => rpc("quiz_duel_join", [token]))).id,
  ).toBe(d.id);
  await expect(as(carol, () => rpc("quiz_duel_join", [token]))).rejects.toThrow(
    "invitation_unavailable",
  );
  expect(
    duelSchema.parse(
      await as(alice, () =>
        rpc("quiz_duel_create", ["question", true, request]),
      ),
    ).id,
  ).toBe(d.id);
  await as(alice, () => rpc("quiz_duel_close", [d.id]));
});

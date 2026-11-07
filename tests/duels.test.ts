import { currentCsv } from "./helpers/current-content";
import { afterAll, beforeAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";

import { syncFixture } from "./helpers/sync-fixture";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import {
  importDuelView,
  duelSchema,
  duelViewSchema,
  duelStartSchema,
  duelScreen,
  duelReviewRound,
} from "../src/duels";
import { validateBackup } from "../src/backupValidation";
import { archiveClosedRounds } from "../src/roundArchive";
let db: PGlite;
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  carol = "33333333-3333-4333-8333-333333333333";
const questions = importCsv(currentCsv({ genre: "Science-Fiction" })).questions;
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
it("spielt nach Paarung unabhängig alle Runden mit gleichen Fragen und verborgenen Gegnerwerten", async () => {
  const d = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
    ),
  );
  let a = await block(alice, d.id, 1, () => true);
  expect(a.duel.status).toBe("waiting");
  expect(a.duel.rounds[0]).toMatchObject({ mine: 10, opponent: null });
  await expect(
    as(alice, () => rpc("quiz_duel_start", [d.id, 2, 0])),
  ).rejects.toThrow("not_your_turn");
  const joined = duelSchema.parse(
    await as(bob, () => rpc("quiz_duel_find", [["all"], crypto.randomUUID()])),
  );
  expect(joined.id).toBe(d.id);
  const ownNext = duelStartSchema.parse(
    await as(alice, () => rpc("quiz_duel_start", [d.id, 2, 0])),
  );
  expect(ownNext.duel).toMatchObject({ paired: true, myTurn: true, round: 2 });
  await expect(
    as(bob, () => rpc("quiz_duel_start", [d.id, 2, 0])),
  ).rejects.toThrow("not_your_turn");
  await expect(
    as(carol, () => rpc("quiz_duel_start", [d.id, 1, 0])),
  ).rejects.toThrow();
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
  expect(b2.duel.myTurn).toBe(true);
  expect(b2.duel.rounds[1].opponent).toBeNull();
  const b3 = await block(bob, d.id, 3);
  expect(b3.duel).toMatchObject({ status: "active", myTurn: false });
  expect(b3.duel.rounds[2].opponent).toBeNull();
  a = await block(alice, d.id, 2);
  expect(a.duel.round).toBe(3);
  expect(a.duel.dueAt).toBeGreaterThanOrEqual(before);
  await block(alice, d.id, 3, () => true);
  const end = duelViewSchema.parse(
    await as(bob, () => rpc("quiz_duel_view", [d.id, 3])),
  );
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
  await as(bob, () => rpc("quiz_duel_find", [["all"], crypto.randomUUID()]));
  await block(bob, second.id, 1);
  await block(alice, second.id, 2);
  await block(alice, second.id, 3);
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
  expect(forfeit.rounds[1].opponentAnswered).toBe(0);
  const unfinished = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
    ),
  );
  await block(alice, unfinished.id, 1);
  await as(bob, () => rpc("quiz_duel_find", [["all"], crypto.randomUUID()]));
  await block(bob, unfinished.id, 1);
  await db.query(
    "update quiz_duels set due_at=clock_timestamp()-interval '1 second' where id=$1",
    [unfinished.id],
  );
  const cancelled = zList(await as(alice, () => rpc("quiz_duel_list"))).find(
    (d) => d.id === unfinished.id,
  )!;
  expect(cancelled).toMatchObject({
    status: "cancelled",
    reason: "timeout",
    result: null,
  });
});
function zList(value: unknown) {
  return (value as unknown[]).map((d) => duelSchema.parse(d));
}
it("friert ein einzelnes Duellthema ein, trennt die Paarungspools und lehnt Spezialkategorien ab", async () => {
  const players = Array.from({ length: 4 }, () => crypto.randomUUID());
  for (const player of players)
    await db.query("insert into auth.users values($1,now(),false,'{}')", [
      player,
    ]);
  await db.query(
    `insert into quiz_duel_catalog(id,knowledge_id,difficulty,genre,familiarity,question)
    select scope||'-'||id,scope||'-'||knowledge_id,difficulty,case when scope='Action' then 'Action' else genre end,familiarity,
      question||jsonb_build_object('id',scope||'-'||id,'knowledgeId',scope||'-'||knowledge_id,
        'metadata',((question->'metadata')-'person_id')||case when scope='actors' then jsonb_build_object('person_id','synthetic-actor') else '{}'::jsonb end,
        'tags',case when scope='awards' then '["Preisträger"]'::jsonb else question->'tags' end)
    from quiz_duel_catalog cross join unnest(array['actors','awards','Action']) scope where id=any($1::text[])`,
    [questions.map((q) => q.id)],
  );
  for (const topic of [
    "actors",
    "awards",
    "Action",
    "Science-Fiction",
  ] as const) {
    const d = duelSchema.parse(
      await as(players[0], () =>
        rpc("quiz_duel_create", ["question", true, crypto.randomUUID(), topic]),
      ),
    );
    const pack = (
      await db.query<{
        questions: { question: import("../src/model").Question }[];
      }>("select questions from quiz_duels where id=$1", [d.id])
    ).rows[0].questions;
    expect(d.selection).toBe(topic);
    expect(pack).toHaveLength(30);
    for (const { question: q } of pack) {
      if (topic === "actors")
        expect(q.metadata.person_id).toBe("synthetic-actor");
      else if (topic === "awards") expect(q.tags).toContain("Preisträger");
      else {
        expect(q.metadata.person_id).toBeUndefined();
        expect(q.tags).not.toContain("Preisträger");
      }
    }
    if (topic === "Action") {
      expect(pack.every(({ question: q }) => q.id.startsWith("Action-"))).toBe(
        true,
      );
      await db.query(
        `insert into quiz_duel_answers(duel_id,player,round_no,question_no,started_at,answered_at,answer_id,correct)
        select id,creator,1,n,clock_timestamp(),clock_timestamp(),questions->n->'question'->>'correctId',true from quiz_duels cross join generate_series(0,9) n where id=$1`,
        [d.id],
      );
      await db.query(
        "update quiz_duels set status='waiting',turn_owner=null,due_at=clock_timestamp()+interval '7 days' where id=$1",
        [d.id],
      );
      const otherTopic = duelSchema.parse(
        await as(players[1], () =>
          rpc("quiz_duel_create", [
            "question",
            false,
            crypto.randomUUID(),
            "actors",
          ]),
        ),
      );
      expect(otherTopic.id).not.toBe(d.id);
      const matched = await as(players[2], () =>
        rpc("quiz_duel_find", [["Action"], crypto.randomUUID()]),
      );
      // Link challenges stay private even when their genre matches.
      expect(matched).toBeNull();
      const token = (
        await db.query<{ token: string }>(
          "select token from quiz_duels where id=$1",
          [d.id],
        )
      ).rows[0].token;
      const joined = duelSchema.parse(
        await as(players[3], () => rpc("quiz_duel_join", [token])),
      );
      expect(joined.selection).toBe("Action");
      await db.query(
        "update quiz_duels set kind='random',status='waiting',opponent=null where id=$1",
        [d.id],
      );
      const sameTopic = duelSchema.parse(
        await as(players[2], () =>
          rpc("quiz_duel_find", [["Action"], crypto.randomUUID()]),
        ),
      );
      expect(sameTopic.id).toBe(d.id);
    }
  }
  for (const invalid of ["Classics", "Arthouse", "Drama,Action", "", null])
    await expect(
      as(players[0], () =>
        rpc("quiz_duel_create", [
          "question",
          true,
          crypto.randomUUID(),
          invalid,
        ]),
      ),
    ).rejects.toThrow("invalid_duel_topic");
  await db.query("delete from auth.users where id=any($1::uuid[])", [players]);
  await db.query("delete from quiz_duel_catalog where id=any($1::text[])", [
    ["actors", "awards", "Action"].flatMap((scope) =>
      questions.map((q) => `${scope}-${q.id}`),
    ),
  ]);
}, 30000);
it("erlaubt zehn ungepaarte Herausforderungen und sperrt erst den elften Start oder die elfte Annahme", async () => {
  const request = crypto.randomUUID();
  const first = duelSchema.parse(
    await as(alice, () => rpc("quiz_duel_create", ["question", true, request])),
  );
  const ids = [first.id];
  for (let i = 0; i < 9; i++) {
    const d = duelSchema.parse(
      await as(alice, () =>
        rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
      ),
    );
    ids.push(d.id);
  }
  expect(
    zList(await as(alice, () => rpc("quiz_duel_list"))).filter((d) =>
      ["preparing", "waiting", "active"].includes(d.status),
    ),
  ).toHaveLength(10);
  expect(
    duelSchema.parse(
      await as(alice, () =>
        rpc("quiz_duel_create", ["question", true, request]),
      ),
    ).id,
  ).toBe(first.id);
  await expect(
    as(alice, () =>
      rpc("quiz_duel_create", ["question", false, crypto.randomUUID()]),
    ),
  ).rejects.toThrow("duel_limit");
  await expect(
    as(alice, () => rpc("quiz_duel_find", [["all"], crypto.randomUUID()])),
  ).rejects.toThrow("duel_limit");
  const invitation = duelSchema.parse(
    await as(carol, () =>
      rpc("quiz_duel_create", ["question", true, crypto.randomUUID()]),
    ),
  );
  const ready = await block(carol, invitation.id, 1);
  await expect(
    as(alice, () => rpc("quiz_duel_join", [ready.duel.invitation])),
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
  const joined = duelSchema.parse(
    await as(alice, () => rpc("quiz_duel_join", [ready.duel.invitation])),
  );
  expect(joined.id).toBe(invitation.id);
  const waitingRequest = crypto.randomUUID();
  const newWaiting = duelSchema.parse(
    await as(carol, () =>
      rpc("quiz_duel_create", ["question", false, waitingRequest]),
    ),
  );
  await block(carol, newWaiting.id, 1);
  const withOpen = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_create", ["question", true, crypto.randomUUID()]),
    ),
  );
  const matched = duelSchema.parse(
    await as(alice, () =>
      rpc("quiz_duel_find", [["all"], crypto.randomUUID()]),
    ),
  );
  expect(matched.id).toBe(newWaiting.id);
  await as(alice, () => rpc("quiz_duel_close", [withOpen.id]));
  await as(alice, () => rpc("quiz_duel_close", [matched.id]));
  await as(alice, () => rpc("quiz_duel_close", [joined.id]));
}, 30000);
it("nimmt bei der Suche nur zugelassene Themen direkt an und legt beim Vorlegen immer ein eigenes Duell an", async () => {
  const players = Array.from({ length: 4 }, () => crypto.randomUUID());
  for (const player of players)
    await db.query("insert into auth.users values($1,now(),false,'{}')", [
      player,
    ]);
  const offer = async (owner: string, topic: string) => {
    const d = duelSchema.parse(
      await as(owner, () =>
        rpc("quiz_duel_create", [
          "question",
          false,
          crypto.randomUUID(),
          topic,
        ]),
      ),
    );
    expect(d.status).toBe("preparing");
    await block(owner, d.id, 1);
    return d;
  };
  const mixed = await offer(players[0], "all");
  const scifi = await offer(players[1], "Science-Fiction");
  const secondMixed = await offer(players[1], "all");
  expect(secondMixed.id).not.toBe(mixed.id);
  expect(
    await as(players[2], () =>
      rpc("quiz_duel_find", [["Action"], crypto.randomUUID()]),
    ),
  ).toBeNull();
  expect(zList(await as(players[2], () => rpc("quiz_duel_list")))).toHaveLength(
    0,
  );
  const request = crypto.randomUUID();
  const found = duelSchema.parse(
    await as(players[2], () =>
      rpc("quiz_duel_find", [["Action", "Science-Fiction"], request]),
    ),
  );
  expect(found).toMatchObject({
    id: scifi.id,
    selection: "Science-Fiction",
    paired: true,
    myTurn: true,
  });
  expect(
    duelSchema.parse(
      await as(players[2], () =>
        rpc("quiz_duel_find", [["Science-Fiction"], request]),
      ),
    ).id,
  ).toBe(scifi.id);
  const any = duelSchema.parse(
    await as(players[3], () =>
      rpc("quiz_duel_find", [
        ["all", "Science-Fiction", "actors", "awards"],
        crypto.randomUUID(),
      ]),
    ),
  );
  expect(any.id).toBe(mixed.id);
  const mixedOnly = duelSchema.parse(
    await as(players[0], () =>
      rpc("quiz_duel_find", [["all"], crypto.randomUUID()]),
    ),
  );
  expect(mixedOnly.id).toBe(secondMixed.id);
  await offer(players[1], "Science-Fiction");
  expect(
    await as(players[0], () =>
      rpc("quiz_duel_find", [["all"], crypto.randomUUID()]),
    ),
  ).toBeNull();
  for (const invalid of [[], ["Classics"], ["Drama", null]])
    await expect(
      as(players[0], () =>
        rpc("quiz_duel_find", [invalid, crypto.randomUUID()]),
      ),
    ).rejects.toThrow("invalid_duel_topic");
  await db.query("delete from auth.users where id=any($1::uuid[])", [players]);
}, 30000);
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

it("liest Duellübersichten ohne globale Schreibsperre, erkennt Änderungen und paginiert ältere Spiele", async () => {
  const player = crypto.randomUUID(),
    foreign = crypto.randomUUID();
  await db.query(
    "insert into auth.users values($1,now(),false,$3),($2,now(),false,$3)",
    [player, foreign, {}],
  );
  const own = duelSchema.parse(
    await as(player, () =>
      rpc("quiz_duel_create", ["round", true, crypto.randomUUID()]),
    ),
  );
  const other = duelSchema.parse(
    await as(foreign, () =>
      rpc("quiz_duel_create", ["round", true, crypto.randomUUID()]),
    ),
  );
  await db.query(
    "update public.quiz_duels set due_at=now()-interval '1 minute' where id=any($1::uuid[])",
    [[own.id, other.id]],
  );
  const before = (
    await db.query(
      "select id,status,revision from public.quiz_duels where id=any($1::uuid[]) order by id",
      [[own.id, other.id]],
    )
  ).rows;
  const read = (scope: string, extra = {}) =>
    as(player, () =>
      rpc<any>("quiz_duel_overview", [JSON.stringify({ scope, ...extra })]),
    );
  expect((await read("active")).items).toEqual([]);
  const archive = await read("archive");
  expect(archive.items).toHaveLength(1);
  expect(archive.items[0].status).toBe("cancelled");
  const results = await as(player, () =>
    rpc<any[]>("quiz_duel_results", ["all", 0]),
  );
  expect(results.find((d) => d.id === own.id)).toMatchObject({
    status: "cancelled",
    reason: "timeout",
  });
  expect(results.some((d) => d.id === other.id)).toBe(false);
  const unchanged = await read("archive", { revision: archive.revision });
  expect(unchanged.unchanged).toBe(true);
  expect(unchanged.items).toBeUndefined();
  expect(
    (
      await db.query(
        "select id,status,revision from public.quiz_duels where id=any($1::uuid[]) order by id",
        [[own.id, other.id]],
      )
    ).rows,
  ).toEqual(before);
  await db.query(
    `insert into public.quiz_duels(creator,kind,solution_display,request_id,questions,status,created_at,due_at)
 select creator,kind,solution_display,gen_random_uuid(),questions,'cancelled',now()-i*interval '1 minute',now()-i*interval '1 minute' from public.quiz_duels cross join generate_series(1,25) i where id=$1`,
    [own.id],
  );
  const first = await read("archive");
  expect(first.items).toHaveLength(20);
  expect(first.nextCursor).toBeTruthy();
  const last = await read("archive", { cursor: first.nextCursor });
  expect(last.items).toHaveLength(6);
  expect(last.nextCursor).toBeNull();
  expect(new Set([...first.items, ...last.items].map((d) => d.id)).size).toBe(
    26,
  );
  const empty = await read("active");
  await as(player, () =>
    rpc("quiz_duel_create", ["round", true, crypto.randomUUID()]),
  );
  const changed = await read("active", { revision: empty.revision });
  expect(changed.unchanged).toBe(false);
  expect(changed.items).toHaveLength(1);
  await expect(
    as(foreign, () => rpc("quiz_duel_view", [own.id, 1])),
  ).rejects.toThrow("duel_unavailable");
});

import { beforeAll, afterAll, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import {
  HotSeatSession,
  defaultHotSeatSetup,
  type HotSeatSetup,
  hotSeatPartySchema,
} from "../src/hotSeat";
import type { Question } from "../src/model";

let fixture: Awaited<ReturnType<typeof syncFixture>>;
beforeAll(async () => {
  fixture = await syncFixture();
  const base = importCsv(readFileSync("tests/fixtures/demo-fragen.csv", "utf8"))
    .questions[0];
  const questions: Question[] = [];
  for (const genre of ["Abenteuer", "Komödie"])
    for (const difficulty of ["leicht", "mittel", "schwer"] as const)
      for (let n = 0; n < 40; n++) {
        const id = `party-${genre}-${difficulty}-${n}`;
        questions.push({
          ...base,
          id,
          knowledgeId: id,
          difficulty,
          demo: false,
          question: `Synthetische Frage ${id}?`,
          domain: genre,
          topic: genre,
          metadata: {
            subdomain: genre,
            film_title_original: id,
            film_title_de: id,
            film_year: "2000",
          },
          works: [
            {
              type: "film",
              originalTitle: id,
              year: 2000,
              genres: [genre],
              techniques: ["live-action"],
              familiarity: 1,
            },
          ],
        });
      }
  await fixture.seedRanked(await prepareTestContent(questions));
  await fixture.db.exec(
    "update quiz_game_internal.catalog_meta set familiarity=1",
  );
}, 30000);
afterAll(() => fixture?.db.close());

const people = (count = 2) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Person ${i + 1}`,
    members: [`Person ${i + 1}`],
  }));
async function game(patch: Partial<HotSeatSetup> = {}, count = 2) {
  const { api, owner } = await fixture.client();
  const session = new HotSeatSession(api);
  await session.create(
    { ...defaultHotSeatSetup(), rounds: 3, ...patch },
    people(count),
  );
  return { session, api, owner };
}
async function correctId(session: HotSeatSession) {
  return (
    await fixture.db.query<{ question: Question }>(
      "select question from quiz_hot_seat_internal.questions where party_id=$1 and position=$2",
      [session.party!.id, session.party!.current!.position],
    )
  ).rows[0].question.correctId;
}
async function start(
  session: HotSeatSession,
  payload: Record<string, unknown> = {},
) {
  if (session.party!.phase === "interval") await session.send("next");
  await session.send("start-question", {
    difficulty: session.party!.difficulty,
    theme: session.party!.theme,
    ...payload,
  });
}
async function answer(session: HotSeatSession, right = true) {
  const id = await correctId(session);
  await session.send("answer", {
    answerId: right ? id : session.party!.current!.order.find((a) => a !== id),
  });
}

it("reserviert gleiche Stufen für alle, zählt Ziele einmal und verändert keinen Lernstand", async () => {
  const { session, owner } = await game({ rounds: 6 }, 3);
  const before = await fixture.db.query(
    "select * from public.quiz_sync_entries where owner_id=$1",
    [owner],
  );
  const seen = new Set<string>();
  const stages: Record<string, string[]> = {};
  while (session.party!.status === "active") {
    await start(session);
    const p = session.party!;
    expect(p.current!.question).not.toHaveProperty("correctId");
    expect(p.current!.question).not.toHaveProperty("explanation");
    expect(p.current!.question.answers.every((a) => !("feedback" in a))).toBe(
      true,
    );
    expect(seen.has(p.current!.question.knowledgeId)).toBe(false);
    seen.add(p.current!.question.knowledgeId);
    (stages[p.player] ??= []).push(p.difficulty);
    await answer(session);
    await session.send("next");
  }
  expect(Object.values(stages)).toEqual(
    Array(3).fill(["leicht", "leicht", "mittel", "mittel", "schwer", "schwer"]),
  );
  expect(session.party!.players.map((p) => p.score)).toEqual([12, 12, 12]);
  expect(session.party!.winners).toEqual([0, 1, 2]);
  expect(seen.size).toBe(18);
  expect(
    (
      await fixture.db.query(
        "select * from public.quiz_sync_entries where owner_id=$1",
        [owner],
      )
    ).rows,
  ).toEqual(before.rows);
});

it("nimmt acht Personen auf und weist neun Personen oder unzureichende Pools ab", async () => {
  const { session } = await game({}, 8);
  expect(session.party!.players).toHaveLength(8);
  await session.send("abort");
  await expect(
    session.create(defaultHotSeatSetup(), [
      { name: "A", members: ["1", "2", "3", "4", "5", "6", "7"] },
      { name: "B", members: ["8", "9"] },
    ]),
  ).rejects.toThrow();
  await expect(
    session.create(
      { ...defaultHotSeatSetup(), topics: ["genre:Nicht vorhanden"] },
      people(),
    ),
  ).rejects.toThrow(/Fragen/);
});

it("versteckt die Lösung während der Stehlchance und bestätigt verlorene Antworten genau einmal", async () => {
  const { session, api } = await game({ steal: true, double: true });
  await start(session, { doublePlayers: [0] });
  api.lost("quiz_hot_seat_call");
  await expect(answer(session, false)).rejects.toThrow(/Bestätigung verloren/);
  expect(session.hasPending).toBe(true);
  await session.retry();
  expect(session.party!.phase).toBe("offer-steal");
  expect(session.party!.current!.answers).toEqual([]);
  expect(session.party!.current!.question).not.toHaveProperty("correctId");
  expect(session.party!.players[0].doubleUsed).toBe(true);
  await session.send("take-steal");
  expect(session.party!.players[1].stealUsed).toBe(true);
  await answer(session);
  expect(session.party!.phase).toBe("reveal");
  expect(session.party!.players.map((p) => p.score)).toEqual([0, 1]);
  expect(session.party!.current!.answers).toHaveLength(2);
  expect(session.party!.current!.question).toHaveProperty("correctId");
  await session.send("next");
  await start(session);
  await answer(session, false);
  expect(session.party!.phase).toBe("offer-steal");
  await session.send("pass-steal");
  expect(session.party!.players[0].stealUsed).toBe(false);
});

it("lässt verdeckte Antworten und Punktänderungen bis zur gemeinsamen Auflösung privat", async () => {
  const { session } = await game({
    mode: "all",
    input: "hidden",
    double: true,
  });
  await start(session, { doublePlayers: [0] });
  const id = session.party!.current!.question.id;
  await answer(session);
  expect(session.party!.phase).toBe("handoff");
  expect(session.party!.current).toBeNull();
  expect(session.party!.players.map((p) => p.score)).toEqual([0, 0]);
  expect(session.party!.players.map((p) => p.hits)).toEqual([0, 0]);
  await session.send("ready");
  expect(session.party!.current!.question.id).toBe(id);
  expect(session.party!.current!.answers).toEqual([]);
  await answer(session, false);
  expect(session.party!.phase).toBe("reveal");
  expect(session.party!.players.map((p) => p.score)).toEqual([2, 0]);
});

it("wertet moderierte Antworten erst nach Aufdecken und ausdrücklicher Bestätigung", async () => {
  const { session } = await game({ mode: "all", input: "moderated" });
  await start(session);
  await expect(
    session.send("answer", { answerId: await correctId(session) }),
  ).rejects.toThrow(/Zug/);
  await session.send("reveal");
  expect(session.party!.phase).toBe("moderate");
  expect(session.party!.players.map((p) => p.score)).toEqual([0, 0]);
  await session.send("moderate", { correctPlayers: [0, 1] });
  expect(session.party!.players.map((p) => p.score)).toEqual([1, 1]);
});

it("vergibt Themenabzeichen nur einmal und zieht Risikoverluste einfach ab", async () => {
  const { session } = await game({ mode: "hunt" });
  for (let i = 0; i < 4; i++) {
    await start(session);
    await answer(session);
    await session.send("next");
  }
  expect(session.party!.players.map((p) => p.badges)).toEqual([
    ["mix"],
    ["mix"],
  ]);
  const { session: risk } = await game({ mode: "risk", double: true });
  await start(risk, { difficulty: "schwer", doublePlayers: [0] });
  await answer(risk, false);
  expect(risk.party!.players[0].score).toBe(-2);
  await risk.send("next");
  await start(risk, { difficulty: "mittel" });
  await answer(risk);
  expect(risk.party!.players[1].score).toBe(3);
});

it("erhält laufende Fristen bei Wiederaufnahme und wertet abgelaufene Antworten als Fehler", async () => {
  const { session, api } = await game({ seconds: 30 });
  const at = Date.parse("2026-11-08T12:00:00Z");
  api.clockAt(at);
  await start(session);
  const deadline = session.party!.current!.deadline;
  api.clockAt(at + 31000);
  await session.resume(session.party!.id);
  expect(session.party!.current!.deadline).toBe(deadline);
  await answer(session);
  expect(session.party!.players[0].score).toBe(0);
  expect(session.party!.current!.answers[0].answerId).toBeNull();
});

it("erlaubt Abbruch in jeder Phase und danach sofort eine neue Partie", async () => {
  for (const phase of ["ready", "question", "handoff", "reveal"] as const) {
    const { session, api } = await game({ mode: "all", input: "hidden" });
    if (phase !== "ready") await start(session);
    if (phase === "handoff" || phase === "reveal") await answer(session);
    if (phase === "reveal") {
      await session.send("ready");
      await answer(session);
    }
    expect(session.party!.phase).toBe(phase);
    await session.send("abort");
    expect(session.party!).toMatchObject({
      status: "aborted",
      phase: "result",
      winners: [],
    });
    expect((await session.lobby()).active).toBeNull();
    const reopened = new HotSeatSession(api);
    await reopened.resume(session.party!.id);
    expect(reopened.party!.status).toBe("aborted");
    await reopened.create({ ...defaultHotSeatSetup(), rounds: 3 }, people());
    expect(reopened.party!.status).toBe("active");
  }
});

it("begrenzt unentschiedene Stechrunden und lässt keine Joker im Stechen zu", async () => {
  const { session } = await game({
    tieBreak: true,
    mode: "all",
    input: "moderated",
    double: true,
  });
  let count = 0;
  while (session.party!.status === "active") {
    await start(session);
    if (session.party!.tieRound > 0)
      await expect(session.send("take-steal")).rejects.toThrow();
    await session.send("reveal");
    await session.send("moderate", { correctPlayers: [] });
    await session.send("next");
    if (++count > 6) throw new Error("Unbegrenztes Stechen");
  }
  expect(count).toBe(6);
  expect(session.party!.tieRound).toBe(3);
  expect(session.party!.winners).toEqual([0, 1]);
});

it("schützt fremde Partien, lehnt veraltete Züge ab und speichert Vorlagen privat", async () => {
  const { session, api } = await game();
  const other = new HotSeatSession((await fixture.client()).api);
  await expect(other.resume(session.party!.id)).rejects.toThrow(/nicht mehr/);
  const second = new HotSeatSession(api);
  await second.resume(session.party!.id);
  await start(session);
  await expect(second.send("abort")).rejects.toThrow(/anderen Fenster/);
  await second.resume(session.party!.id);
  await second.send("abort");
  await second.send("template-save", {
    name: "Filmabend",
    setup: defaultHotSeatSetup(),
  });
  expect((await second.lobby()).templates).toHaveLength(1);
  expect((await other.lobby()).templates).toEqual([]);
  await second.send("template-delete", { name: "Filmabend" });
  expect((await second.lobby()).templates).toEqual([]);
  const rights = await fixture.db.query<{ allowed: boolean }>(
    "select has_function_privilege('anon','public.quiz_hot_seat_call(text)','execute') allowed",
  );
  expect(rights.rows[0].allowed).toBe(false);
  await expect(
    fixture.db.exec(
      "set role authenticated; select * from quiz_hot_seat_internal.parties",
    ),
  ).rejects.toThrow(/permission denied/);
  await fixture.db.exec("reset role");
});

it("verwirft ungültige Antwortreihenfolgen im Protokoll", async () => {
  const { session } = await game();
  await start(session);
  const party = structuredClone(session.party!);
  party.current!.order.fill("unknown");
  expect(hotSeatPartySchema.safeParse(party).success).toBe(false);
});

it("weist eine Genre-Jagd mit zu wenigen leichten Zielen schon vor dem Start ab", async () => {
  const selected = (
    await fixture.db.query<{ id: string }>(`select id from (
    (select id from quiz_game_internal.catalog_meta where difficulty='leicht' limit 1)
    union all (select id from quiz_game_internal.catalog_meta where difficulty='mittel' limit 4)
    union all (select id from quiz_game_internal.catalog_meta where difficulty='schwer' limit 4)) limited`)
  ).rows.map((r) => r.id);
  await fixture.db.query(
    "update quiz_game_internal.catalog_paths set familiarity=3 where id=any($1)",
    [selected],
  );
  try {
    await expect(
      game({
        mode: "hunt",
        filters: { sources: ["film"], familiarities: [3] },
      }),
    ).rejects.toThrow(/Bunter Mix.*leicht/);
  } finally {
    await fixture.db.exec(
      "update quiz_game_internal.catalog_paths set familiarity=1",
    );
  }
});

it("vergibt beim Stechen einen eindeutigen Sieger, ohne reguläre Punkte umzuschreiben", async () => {
  const { session } = await game({
    mode: "all",
    input: "moderated",
    tieBreak: true,
  });
  for (let i = 0; i < 3; i++) {
    await start(session);
    await session.send("reveal");
    await session.send("moderate", { correctPlayers: [0, 1] });
    await session.send("next");
  }
  expect(session.party!.tieRound).toBe(1);
  await start(session);
  await session.send("reveal");
  await session.send("moderate", { correctPlayers: [1] });
  await session.send("next");
  expect(session.party!.winners).toEqual([1]);
  expect(session.party!.players.map((p) => p.score)).toEqual([6, 6]);
  expect(session.party!.players.map((p) => p.tieScore)).toEqual([0, 1]);
});

it("behält für jede verdeckte Person eine eigene Frist und schützt unbestätigte Konten", async () => {
  const { session, api, owner } = await game({
    mode: "all",
    input: "hidden",
    seconds: 30,
  });
  const stamp = Date.parse("2026-11-08T12:00:00Z");
  api.clockAt(stamp);
  await start(session);
  await answer(session);
  api.clockAt(stamp + 60000);
  await session.send("ready");
  expect(session.party!.current!.deadline).toBe(stamp + 90000);
  await fixture.db.query(
    "update auth.users set email_confirmed_at=null where id=$1",
    [owner],
  );
  await expect(session.lobby()).rejects.toThrow(/verified_account_required/);
});

it("verbirgt künftige Fragen auch bei reservierter Partie und erhält Fragen bei Katalogwechsel", async () => {
  const { session } = await game();
  const before = JSON.stringify(session.party!);
  expect(before).not.toContain("correctId");
  expect(before).not.toContain("Synthetische Frage");
  await start(session);
  const issued = session.party!.current!;
  await fixture.db.exec(
    "update quiz_game_internal.catalog_meta set topic=topic||' neu'",
  );
  try {
    await session.resume(session.party!.id);
    expect(session.party!.current!.question).toEqual(issued.question);
    expect(session.party!.current!.order).toEqual(issued.order);
  } finally {
    await fixture.db.exec(
      "update quiz_game_internal.catalog_meta set topic=replace(topic,' neu','')",
    );
  }
});

it("bindet Genre und Bekanntheit an denselben Werkbezug", async () => {
  const original = (
    await fixture.db.query<{ id: string; works: unknown[] }>(
      "select id,works from quiz_game_internal.catalog_meta where genre='Abenteuer' and difficulty='leicht' limit 1",
    )
  ).rows[0];
  const other = {
    type: "film",
    originalTitle: "Anderer Werkbezug",
    year: 2001,
    genres: ["Komödie"],
    techniques: ["live-action"],
    familiarity: 3,
  };
  const setup = {
    ...defaultHotSeatSetup(),
    filters: { sources: ["film"], familiarities: [1] },
  };
  const options = async () =>
    (
      await fixture.db.query<{
        value: { id: string; counts: Record<string, number> }[];
      }>("select quiz_hot_seat_internal.options($1::jsonb) value", [
        JSON.stringify(setup),
      ])
    ).rows[0].value;
  const before = (await options()).find((t) => t.id === "genre:Komödie")!.counts
    .leicht;
  await fixture.db.query(
    "update quiz_game_internal.catalog_meta set works=$2::jsonb where id=$1",
    [original.id, JSON.stringify([...original.works, other])],
  );
  await fixture.db.query(
    "insert into quiz_game_internal.catalog_paths values($1,'Komödie',3,true,$2::jsonb)",
    [original.id, JSON.stringify([other])],
  );
  try {
    const pool = await fixture.db.query<{ id: string }>(
      "select id from quiz_hot_seat_internal.pool($1::jsonb,'genre:Komödie','leicht')",
      [JSON.stringify(setup)],
    );
    expect(pool.rows.some((q) => q.id === original.id)).toBe(false);
    expect(
      (await options()).find((t) => t.id === "genre:Komödie")!.counts.leicht,
    ).toBe(before);
  } finally {
    await fixture.db.query(
      "delete from quiz_game_internal.catalog_paths where id=$1 and area='Komödie' and familiarity=3",
      [original.id],
    );
    await fixture.db.query(
      "update quiz_game_internal.catalog_meta set works=$2::jsonb where id=$1",
      [original.id, JSON.stringify(original.works)],
    );
  }
});

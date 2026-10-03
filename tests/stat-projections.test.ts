import "fake-indexeddb/auto";
import { beforeAll, afterAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { emptyState, type State } from "../src/model";
import { importCsv } from "../src/importer";
import { answer, complete, guess, startRound, points } from "../src/engine";
import { validateBackup } from "../src/backupValidation";
import { prepareRelease, type PreparedRelease } from "../src/syncCodec";
import { EntrySync } from "../src/entrySync";
import { read, update } from "../src/storage";
import { readEntryHead } from "../src/entryStorage";
import { careerSummary } from "../src/career";
import type { SyncStore } from "../src/accountSync";

const migration = "20261003085256_storage_stat_projections.sql",
  now = 1700000000000;
let fixture: Awaited<ReturnType<typeof syncFixture>>, release: PreparedRelease;
let players: {
  owner: string;
  api: Awaited<
    ReturnType<Awaited<ReturnType<typeof syncFixture>>["client"]>
  >["api"];
  state: State;
}[] = [];
const previous = new Map<string, unknown>();
async function listings() {
  const result = new Map<string, unknown>();
  await fixture.db.exec("set role authenticated");
  await fixture.db.query(
    "select set_config('request.jwt.claim.sub',$1,false)",
    [players[0].owner],
  );
  try {
    for (const sort of ["rounds", "correct", "accuracy", "experience"])
      for (const [genre, difficulty] of [
        ["", ""],
        ["Horror", ""],
        ["", "mittel"],
        ["Privates Genre", "schwer"],
        ["nicht vorhanden", ""],
      ])
        result.set(
          `${sort}:${genre}:${difficulty}`,
          (
            await fixture.db.query(
              "select * from public.quiz_players($1,$2,$3,0)",
              [sort, genre, difficulty],
            )
          ).rows,
        );
    for (const sort of ["rounds", "correct", "accuracy", "experience"])
      result.set(
        `public:${sort}`,
        (
          await fixture.db.query(
            "select * from public.quiz_public_players($1,0)",
            [sort],
          )
        ).rows,
      );
    const cats = (
      await fixture.db.query<{ category: string }>(
        "select category from public.quiz_score_categories()",
      )
    ).rows;
    for (const { category } of cats)
      result.set(
        `scores:${category}`,
        (
          await fixture.db.query("select * from public.quiz_rankings($1,0)", [
            category,
          ])
        ).rows,
      );
  } finally {
    await fixture.db.exec("reset role");
  }
  return result;
}
beforeAll(async () => {
  fixture = await syncFixture(migration);
  const questions = importCsv(readFileSync("public/fragen.csv", "utf8"))
    .questions.slice(0, 12)
    .map((q, i) => ({
      ...q,
      metadata: {
        ...q.metadata,
        subdomain: i % 2 ? "Horror" : "Privates Genre",
      },
      difficulty: (i % 2 ? "mittel" : "schwer") as typeof q.difficulty,
    }));
  release = await prepareRelease(questions);
  await fixture.seed(release);
  for (let player = 0; player < 4; player++) {
    const { owner, api } = await fixture.client(),
      state = emptyState(structuredClone(questions));
    state.career!.legacyBonus = player ? 300 : 137;
    for (let round = 0; round < (player === 3 ? 0 : 9); round++) {
      const mode = round === 7 ? "fehler" : round % 2 ? "rekord" : "ueben";
      const r = startRound(
        state,
        { mode, topic: "Alle Themen", difficulty: "Alle Stufen" },
        now + round * 86400000,
      );
      for (let i = 0; i < r.questions.length; i++) {
        const q = r.questions[i],
          choice =
            i % 5 === 0
              ? { dontKnow: true as const }
              : i % 5 === 1
                ? null
                : i % 5 === 2
                  ? q.answers.find((a) => a.id !== q.correctId)!.id
                  : q.correctId;
        const elapsed = i % 5 === 1 || i % 5 === 4 ? 30000 : 1000;
        answer(
          state,
          r.id,
          q.id,
          choice,
          elapsed,
          now + round * 86400000 + i * 1000,
        );
        if (i % 5 === 3) guess(state, state.events.at(-1)!.id);
      }
      if (round === 8) {
        r.status = "aborted";
        r.finishedAt = now + round * 86400000 + 20000;
      } else complete(state, r.id, now + round * 86400000 + 20000);
    }
    // An additional completed zero-answer round retains its old counting rule.
    if (player === 2) {
      const r = startRound(
        state,
        { mode: "rekord", topic: "Alle Themen", difficulty: "Alle Stufen" },
        now + 10 * 86400000,
      );
      for (const q of r.questions)
        answer(state, r.id, q.id, null, 30000, now + 10 * 86400000 + 1000);
      complete(state, r.id, now + 10 * 86400000 + 20000);
    }
    const checked = validateBackup(state);
    players.push({ owner, api, state: checked });
    await fixture.db.query(
      "insert into public.quiz_saves(owner_id,state,revision) values($1,$2,1)",
      [owner, checked],
    );
  }
  for (const [key, value] of await listings()) previous.set(key, value);
  await fixture.db.exec(
    readFileSync(`supabase/migrations/${migration}`, "utf8"),
  );
}, 30000);
afterAll(() => fixture?.db.close());
it("liefert nach dem Backfill dieselben öffentlichen, gefilterten und gemeinsamen Wertungen wie die bisherigen SQL-Ableitungen", async () => {
  expect(await listings()).toEqual(previous);
  const scores = (
    await fixture.db.query<{
      owner_id: string;
      round_id: string;
      points: number;
    }>("select owner_id,round_id,points from public.quiz_shared_scores")
  ).rows;
  for (const score of scores) {
    const state = players.find((p) => p.owner === score.owner_id)!.state;
    expect(score.points).toBe(
      points(state.events.filter((e) => e.roundId === score.round_id)),
    );
  }
  for (const player of players) {
    const xp = (
      await fixture.db.query<{ experience: number }>(
        "select experience from public.quiz_player_totals where owner_id=$1 and genre='' and difficulty=''",
        [player.owner],
      )
    ).rows[0].experience;
    expect(xp).toBe(player.state.experience);
    expect(xp).toBe(
      careerSummary(player.state).earned +
        (player.state.career?.legacyBonus ?? 0),
    );
  }
});
it("erhält dieselben Werte nach generationsweiser Übernahme und schreibt bei Anzeige-/Soundänderungen keine Statistikzeilen", async () => {
  for (const { owner, api, state } of players) {
    const key = `account:stats:${owner}`;
    await update(() => {}, state, key);
    const legacy: SyncStore = {
      local: () => read(key),
      receipt: async () => undefined,
      legacyRevision: async () => 1,
      remote: async () => ({ state, revision: 1 }),
      replace: async (s) => s,
      acknowledge: async () => {},
      save: async () => {
        throw new Error("Altwriter");
      },
    };
    const sync = new EntrySync(
      api,
      owner,
      key,
      legacy,
      () => {},
      async () => release,
    );
    await sync.prepare();
    expect(sync.status).toBe("saved");
    const revisions = (
      await fixture.db.query(
        "select 'total' as source,xmin::text as version,ctid::text as row from public.quiz_player_totals where owner_id=$1 union all select 'round',xmin::text,ctid::text from public.quiz_round_contributions where owner_id=$1 union all select 'record',xmin::text,ctid::text from public.quiz_shared_scores where owner_id=$1 order by source,row",
        [owner],
      )
    ).rows;
    await update(
      (s) => {
        s.settings.sound = false;
        s.settings.showGenre = false;
      },
      undefined,
      key,
      { progressOnly: true },
    );
    await sync.flush();
    expect(sync.status).toBe("saved");
    expect(
      (
        await fixture.db.query(
          "select 'total' as source,xmin::text as version,ctid::text as row from public.quiz_player_totals where owner_id=$1 union all select 'round',xmin::text,ctid::text from public.quiz_round_contributions where owner_id=$1 union all select 'record',xmin::text,ctid::text from public.quiz_shared_scores where owner_id=$1 order by source,row",
          [owner],
        )
      ).rows,
    ).toEqual(revisions);
    sync.stop();
  }
  expect(await listings()).toEqual(previous);
});
it("überträgt geänderte Reihenfolgen atomar, ohne unveränderte Wertungen erneut zu schreiben", async () => {
  const { owner, api } = players[0],
    key = `account:stats:${owner}`;
  const before = await read(key),
    list = await listings();
  const sync = new EntrySync(
    api,
    owner,
    key,
    {} as SyncStore,
    () => {},
    async () => release,
  );
  await sync.prepare();
  await update(
    (s) => {
      s.rounds.reverse();
      s.events.reverse();
    },
    undefined,
    key,
    { progressOnly: true },
  );
  await sync.flush();
  expect(sync.status).toBe("saved");
  expect((await read(key))!.rounds.map((r) => r.id)).toEqual(
    before!.rounds.map((r) => r.id).reverse(),
  );
  expect(await listings()).toEqual(list);
  sync.stop();
});
it("projiziert bei einer fachlichen Änderung nur die betroffene Runde und erhält Gleichstände und die Mindestmenge", async () => {
  const { owner, api, state } = players[0],
    key = `account:stats:${owner}`;
  const untouched = (
    await fixture.db.query(
      "select round_id,genre,difficulty,xmin::text as version from public.quiz_round_contributions where owner_id=$1 order by round_id,genre,difficulty",
      [owner],
    )
  ).rows;
  const local = (await read(key))!,
    r = local.rounds.find((r) => r.status === "aborted")!;
  const legacy = {} as SyncStore;
  const sync = new EntrySync(
    api,
    owner,
    key,
    legacy,
    () => {},
    async () => release,
  );
  await sync.prepare();
  await update(
    (s) => {
      s.rounds.find((x) => x.id === r.id)!.status = "completed";
    },
    undefined,
    key,
    { progressOnly: true },
  );
  await sync.flush();
  expect(sync.status).toBe("saved");
  expect(
    (
      await fixture.db.query(
        "select round_id,genre,difficulty,xmin::text as version from public.quiz_round_contributions where owner_id=$1 and round_id<>$2 order by round_id,genre,difficulty",
        [owner, r.id],
      )
    ).rows,
  ).toEqual(untouched.filter((x: any) => x.round_id !== r.id));
  const head = await readEntryHead(key);
  expect(head!.revision).toBeGreaterThan(2);
  sync.stop();
  const listing = await listings(),
    all = listing.get("public:rounds") as {
      player_name: string;
      place: number;
    }[];
  expect(all[0].place).toBe(1);
  const accuracy = listing.get("public:accuracy") as { answered: number }[];
  expect(accuracy.every((p) => p.answered >= 50)).toBe(true);
});
it("sperrt direkte Projektionen und private Statistikbeziehungen für anonyme und angemeldete Clients", async () => {
  for (const role of ["anon", "authenticated"]) {
    await fixture.db.exec(`set role ${role}`);
    try {
      await expect(
        fixture.db.query("select * from public.quiz_round_contributions"),
      ).rejects.toThrow("permission denied");
      await expect(
        fixture.db.query("select * from public.quiz_player_totals"),
      ).rejects.toThrow("permission denied");
      await expect(
        fixture.db.query("select quiz_sync_internal.project_legacy($1,'{}')", [
          players[0].owner,
        ]),
      ).rejects.toThrow("permission denied");
    } finally {
      await fixture.db.exec("reset role");
    }
  }
});

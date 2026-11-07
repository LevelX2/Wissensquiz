import { currentCsv } from "./helpers/current-content";
import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { prepareTestContent } from "./helpers/test-content";
import { importCsv } from "../src/importer";
import { OnlineGameStore } from "../src/onlineGameStore";
import {
  newPerfectRoundBadge,
  perfectRoundMilestones,
} from "../src/perfectRounds";

it("erhält die ersten fünf Abzeichenschwellen und vergibt auch die langfristigen Ziele exakt", () => {
  for (const target of perfectRoundMilestones) {
    expect(newPerfectRoundBadge(target)).toBe(target);
    expect(newPerfectRoundBadge(target + 1)).toBeUndefined();
  }
  expect(
    [0, 1, 2, 9, 10, 11, 24, 25, 26, 49, 50, 51, 99, 100, 101].map(
      newPerfectRoundBadge,
    ),
  ).toEqual([
    undefined,
    1,
    undefined,
    undefined,
    10,
    undefined,
    undefined,
    25,
    undefined,
    undefined,
    50,
    undefined,
    undefined,
    100,
    undefined,
  ]);
});

it("zählt perfekte abgeschlossene Zehnerrunden inkrementell, privat und ohne doppelte Vergabe", async () => {
  const fixture = await syncFixture();
  try {
    await fixture.seedRanked(
      await prepareTestContent(
        importCsv(currentCsv({ genre: "Science-Fiction" })).questions.slice(
          0,
          32,
        ),
      ),
    );
    const { api, owner } = await fixture.client();
    await new OnlineGameStore(api, owner).open();
    const generation = (
      await fixture.db.query<{ generation: string }>(
        "select generation from public.quiz_account_heads where owner_id=$1",
        [owner],
      )
    ).rows[0].generation;
    const questions = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i}`,
      knowledgeId: `goal${i}`,
    }));
    let sequence = 0;
    const insert = async (
      id: string,
      n = 10,
      guessed = false,
      correct = true,
      status = "completed",
    ) => {
      const position = ++sequence;
      await fixture.db.query(
        `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision) values($1,$2,'round',$3,$5,$4,0)`,
        [
          owner,
          generation,
          id,
          JSON.stringify({
            id,
            questions: questions.slice(0, n),
            status: "active",
            mode: "entdecken",
            finishedAt: position * 1000,
          }),
          position,
        ],
      );
      await fixture.db.query(
        `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
        select $1,$2,'event',$3||'-'||i,$7::integer+i,jsonb_build_object('roundId',$3::text,'questionId','q'||i,'knowledgeId','goal'||i,'answerId','a','correct',$5::boolean,'guessed',$4::boolean),0 from generate_series(0,$6::integer-1) i`,
        [owner, generation, id, guessed, correct, n, position * 10],
      );
      await fixture.db.query(
        "update public.quiz_sync_entries set value=jsonb_set(value,'{status}',to_jsonb($4::text)) where owner_id=$1 and generation=$2 and kind='round' and id=$3",
        [owner, generation, id, status],
      );
    };
    const summary = () =>
      api.call<any>("quiz_game_view", {
        request_text: JSON.stringify({ action: "summary" }),
      });
    for (let i = 1; i <= 100; i++) await insert(`perfect-${i}`);
    expect((await summary()).perfectTens).toBe(100);
    for (const i of [1, 10, 25, 50, 100])
      expect(
        await api.call("quiz_game_view", {
          request_text: JSON.stringify({
            action: "round-experience",
            scope: `perfect-${i}`,
          }),
        }),
      ).toMatchObject({
        perfectTens: i,
        achievements: { completed: i, perfectTens: i, zeroTens: 0 },
      });
    await insert("short", 9);
    await insert("guessed", 10, true);
    await insert("wrong", 10, false, false);
    await insert("active", 10, false, true, "active");
    expect((await summary()).perfectTens).toBe(100);
    const stats = () =>
      api.call<any>("quiz_game_view", {
        request_text: '{"action":"profile-stats"}',
      });
    expect(await stats()).toMatchObject({
      completed: 103,
      perfectTens: 100,
      zeroTens: 1,
    });
    expect(
      await api.call("quiz_game_view", {
        request_text: '{"action":"round-experience","scope":"wrong"}',
      }),
    ).toMatchObject({
      achievements: { completed: 103, perfectTens: 0, zeroTens: 1 },
    });
    // Timeouts, shorter rounds and an aborted round never earn the zero badge.
    await insert("zero-short", 9, false, false);
    await insert("zero-aborted", 10, false, false, "aborted");
    await fixture.db.query(
      "update public.quiz_sync_entries set value=(value-'answerId') where owner_id=$1 and kind='event' and id='wrong-0'",
      [owner],
    );
    expect((await stats()).zeroTens).toBe(0);
    await fixture.db.query(
      "update public.quiz_sync_entries set value=value||'{\"dontKnow\":true}'::jsonb where owner_id=$1 and kind='event' and id='wrong-0'",
      [owner],
    );
    expect((await stats()).zeroTens).toBe(1);
    await fixture.db.query(
      "update public.quiz_sync_entries set changed_revision=changed_revision+1 where owner_id=$1 and kind='round'",
      [owner],
    );
    expect((await summary()).perfectTens).toBe(100);
    expect((await stats()).zeroTens).toBe(1);
    await fixture.db.query(
      "update public.quiz_sync_entries set deleted=true,value=null where owner_id=$1 and kind='event' and id='perfect-100-0'",
      [owner],
    );
    expect((await summary()).perfectTens).toBe(99);
    const other = await fixture.client();
    await new OnlineGameStore(other.api, other.owner).open();
    expect(
      (
        await other.api.call<any>("quiz_game_view", {
          request_text: '{"action":"summary"}',
        })
      ).perfectTens,
    ).toBe(0);
    expect(
      await other.api.call("quiz_game_view", {
        request_text: '{"action":"profile-stats"}',
      }),
    ).toMatchObject({ completed: 0, perfectTens: 0, zeroTens: 0 });
    expect(
      await other.api.call("quiz_game_view", {
        request_text: JSON.stringify({
          action: "round-experience",
          scope: "perfect-1",
        }),
      }),
    ).toBeNull();
    await expect(
      fixture.db.exec(
        "set role authenticated; select * from quiz_game_internal.perfect_rounds",
      ),
    ).rejects.toThrow(/permission denied/);
    await fixture.db.exec("reset role");
    await expect(
      fixture.db.exec(
        "set role authenticated; select * from quiz_game_internal.round_achievements",
      ),
    ).rejects.toThrow(/permission denied/);
    await fixture.db.exec("reset role");
  } finally {
    await fixture.db.close();
  }
}, 30000);

it("leitet vorhandene aktuelle Zehnerrunden ab, ohne Spielstand oder Revision zu ändern", async () => {
  const migration = "20261012165828_round_success_celebration.sql";
  const fixture = await syncFixture(migration);
  try {
    const release = await prepareTestContent(
      importCsv(currentCsv({ genre: "Science-Fiction" })).questions.slice(
        0,
        32,
      ),
    );
    await fixture.seedRanked(release);
    await fixture.db.exec(
      "update quiz_ranked_internal.config set question_count=32;select quiz_game_internal.refresh_content()",
    );
    const { api, owner } = await fixture.client();
    await new OnlineGameStore(api, owner).open();
    const generation = (
      await fixture.db.query<{ generation: string }>(
        "select generation from public.quiz_account_heads where owner_id=$1",
        [owner],
      )
    ).rows[0].generation;
    const questions = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i}`,
      knowledgeId: `goal${i}`,
    }));
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision) values($1,$2,'round','existing',0,$3,0)`,
      [
        owner,
        generation,
        JSON.stringify({
          id: "existing",
          status: "completed",
          mode: "entdecken",
          finishedAt: 1000,
          questions,
        }),
      ],
    );
    await fixture.db.query(
      `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
      select $1,$2,'event','existing-'||i,i,jsonb_build_object('roundId','existing','questionId','q'||i,'knowledgeId','goal'||i,'answerId','a','correct',true,'guessed',false),0 from generate_series(0,9) i`,
      [owner, generation],
    );
    const source = async () => ({
      entries: (
        await fixture.db.query(
          "select * from public.quiz_sync_entries order by kind,id",
        )
      ).rows,
      heads: (await fixture.db.query("select * from public.quiz_account_heads"))
        .rows,
    });
    const before = await source();
    await fixture.db.exec(
      readFileSync(`supabase/migrations/${migration}`, "utf8"),
    );
    expect(await source()).toEqual(before);
    expect(
      (
        await api.call<any>("quiz_game_view", {
          request_text: '{"action":"summary"}',
        })
      ).perfectTens,
    ).toBe(1);
  } finally {
    await fixture.db.close();
  }
}, 30000);

it("baut die neuen Erfolgszähler und damaligen Rundenstände aus aktuellen Belegen auf, ohne Quelldaten zu ändern", async () => {
  const migration = "20261012194444_round_achievements.sql";
  const fixture = await syncFixture(migration);
  try {
    await fixture.seedRanked(
      await prepareTestContent(
        importCsv(currentCsv({ genre: "Science-Fiction" })).questions.slice(
          0,
          32,
        ),
      ),
    );
    await fixture.db.exec(
      "update quiz_ranked_internal.config set question_count=32;select quiz_game_internal.refresh_content()",
    );
    const { api, owner } = await fixture.client();
    await new OnlineGameStore(api, owner).open();
    const generation = (
      await fixture.db.query<{ generation: string }>(
        "select generation from public.quiz_account_heads where owner_id=$1",
        [owner],
      )
    ).rows[0].generation;
    const questions = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i}`,
      knowledgeId: `goal${i}`,
    }));
    for (let n = 1; n <= 25; n++) {
      const id = `existing-${n}`;
      await fixture.db.query(
        "insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision) values($1,$2,'round',$3,$4,$5,0)",
        [
          owner,
          generation,
          id,
          n,
          JSON.stringify({
            id,
            status: "completed",
            mode: "entdecken",
            finishedAt: n * 1000,
            questions,
            archive: { version: 1 },
          }),
        ],
      );
      await fixture.db.query(
        `insert into public.quiz_sync_entries(owner_id,generation,kind,id,position,value,changed_revision)
        select $1,$2,'event',$3||'-'||i,$4::integer*10+i,jsonb_build_object('roundId',$3::text,'questionId','q'||i,'knowledgeId','goal'||i,'answerId','a','correct',$4::integer<>1,'guessed',false),0 from generate_series(0,9) i`,
        [owner, generation, id, n],
      );
    }
    const source = async () => ({
      entries: (
        await fixture.db.query(
          "select * from public.quiz_sync_entries order by kind,id",
        )
      ).rows,
      heads: (await fixture.db.query("select * from public.quiz_account_heads"))
        .rows,
    });
    const before = await source();
    await fixture.db.exec(
      readFileSync(`supabase/migrations/${migration}`, "utf8"),
    );
    expect(await source()).toEqual(before);
    expect(
      await api.call("quiz_game_view", {
        request_text: '{"action":"profile-stats"}',
      }),
    ).toMatchObject({ completed: 25, perfectTens: 24, zeroTens: 1 });
    for (const n of [1, 10, 25]) {
      expect(
        await api.call("quiz_game_view", {
          request_text: JSON.stringify({
            action: "round-experience",
            scope: `existing-${n}`,
          }),
        }),
      ).toMatchObject({
        achievements: {
          completed: n,
          perfectTens: n === 1 ? 0 : n - 1,
          zeroTens: n === 1 ? 1 : 0,
        },
      });
    }
  } finally {
    await fixture.db.close();
  }
}, 30000);

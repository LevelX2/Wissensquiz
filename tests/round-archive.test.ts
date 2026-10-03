import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import { answer, complete, startRound, rebuild } from "../src/engine";
import { archiveClosedRounds, roundQuestionCount } from "../src/roundArchive";
import { validateBackup } from "../src/backupValidation";
import { leaderboard } from "../src/leaderboard";
import { careerSummary } from "../src/career";
import { learningPathProgress } from "../src/learningPath";
import { openMistakes } from "../src/errorTraining";
import { encodeCloudState, decodeCloudState } from "../src/cloudCodec";
import {
  compileState,
  difference,
  prepareRelease,
  reconstructState,
  stableStringify,
  SYNC_FORMAT,
} from "../src/syncCodec";
import { objectHashes, releaseHashes } from "../src/entryStorage";
import { syncFixture } from "./helpers/sync-fixture";
import { learn } from "../src/learning";

const questions = importCsv(
  readFileSync("public/horror-fragen.csv", "utf8"),
).questions;
const now = Date.parse("2026-09-26T12:00:00Z");
function history() {
  const state = emptyState(structuredClone(questions));
  state.bundledQuestionIds = questions.map((q) => q.id);
  for (const [i, mode] of [
    "ueben",
    "rekord",
    "fehlerfrei",
    "zeitkonto",
  ].entries()) {
    const r = startRound(
      state,
      {
        mode: mode as "ueben" | "rekord" | "fehlerfrei" | "zeitkonto",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        ...(mode !== "ueben" ? { recordPreset: "genre" as const } : {}),
        filters: {
          genres: ["Horror"],
          sources: ["film"],
          difficulties: ["leicht", "mittel", "schwer"],
          familiarities: [1, 2, 3, 4],
        },
      },
      now + i * 86400000,
    );
    while (r.status === "active" && r.events.length < r.questions.length) {
      const q = r.questions[r.events.length];
      answer(
        state,
        r.id,
        q.id,
        mode === "ueben" || mode === "rekord"
          ? q.correctId
          : q.answers.find((a) => a.id !== q.correctId)!.id,
        1000,
        r.startedAt + 1000 * (r.events.length + 1),
      );
    }
    complete(state, r.id, r.startedAt + 20000);
  }
  return validateBackup(state);
}
function evidence(state: ReturnType<typeof history>) {
  return {
    learning: state.learning,
    experience: state.experience,
    records: state.records,
    career: [...careerSummary(state).rounds],
    mistakes: [...openMistakes(state.events)],
    journey: learningPathProgress(state)("Horror"),
    scores: leaderboard(state).map((g) => ({
      key: g.key,
      entries: g.entries.map((e) => ({
        id: e.round.id,
        points: e.points,
        correct: e.correct,
        time: e.elapsedMs,
        rank: e.rank,
        count: roundQuestionCount(e.round),
      })),
    })),
  };
}

it("removes historical texts and before maps without changing any score, XP, learning or unlock", async () => {
  const state = history(),
    original = structuredClone(state),
    before = evidence(state);
  archiveClosedRounds(state);
  expect(
    state.rounds.every(
      (r) =>
        r.archive &&
        !r.questions.length &&
        !r.order.length &&
        !Object.keys(r.before).length,
    ),
  ).toBe(true);
  expect(JSON.stringify(state.rounds)).not.toContain(questions[0].explanation);
  expect(state.events).toEqual(original.events);
  rebuild(state);
  expect(evidence(state)).toEqual(before);
  expect(validateBackup(state)).toEqual(state);
  const release = await prepareRelease(state.questions),
    document = await compileState(state, [release]);
  expect(reconstructState(document, [release])).toEqual(state);
  expect([...releaseHashes(document)]).toEqual([release.hash]);
  expect(objectHashes(document)).toEqual(new Set([...document.objects.keys()]));
  expect(
    validateBackup(await decodeCloudState(await encodeCloudState(state))),
  ).toEqual(state);
  // Historical learning must not depend on today's question difficulty/content.
  state.questions = state.questions.map((q) => ({
    ...q,
    difficulty: "experte",
    explanation: "Neuer redaktioneller Stand.",
  }));
  const afterCatalogEdit = evidence(validateBackup(state));
  expect(afterCatalogEdit.experience).toEqual(before.experience);
  expect(afterCatalogEdit.career).toEqual(before.career);
  expect(afterCatalogEdit.scores).toEqual(before.scores);
});

it("preserves an active round and rejects corrupted archived scores and relations", () => {
  const state = history();
  const active = startRound(
    state,
    { mode: "ueben", topic: "Alle Themen", difficulty: "Alle Stufen" },
    now + 10 * 86400000,
  );
  const original = structuredClone(active);
  archiveClosedRounds(state);
  expect(active).toEqual(original);
  const bad = structuredClone(state);
  bad.rounds[0].archive!.questions[0].correctId = "unknown";
  expect(() => validateBackup(bad)).toThrow(/Wertungsdaten/);
  const badScore = structuredClone(state);
  badScore.events.find((e) => e.roundId === badScore.rounds[1].id)!.timeBonus++;
  expect(() => validateBackup(badScore)).toThrow(/Antwortwertung/);
  active.archive = {
    version: 1,
    questions: state.rounds[0].archive!.questions,
  };
  expect(() => validateBackup(state)).toThrow(/Ergebnisarchiv/);
});

it("limits genre records to one genre and removes custom scores without changing learning", () => {
  const state = history(),
    round = state.rounds[1];
  expect(round.questions.filter((q) => q.difficulty === "leicht")).toHaveLength(
    3,
  );
  expect(round.questions.filter((q) => q.difficulty === "mittel")).toHaveLength(
    4,
  );
  expect(round.questions.filter((q) => q.difficulty === "schwer")).toHaveLength(
    3,
  );
  const invalid = structuredClone(state);
  invalid.rounds[1].filters!.genres.push("Fantasy");
  expect(() => validateBackup(invalid)).toThrow(/genau ein Genre/);
  const learning = structuredClone(state.learning),
    xp = state.experience;
  round.recordPreset = "custom";
  round.ruleVersion = "solo-v1.rekord.custom";
  const cleaned = validateBackup(state);
  expect(leaderboard(cleaned, "rekord")).toEqual([]);
  expect(Object.keys(cleaned.records)).toHaveLength(2);
  expect(cleaned.learning).toEqual(learning);
  expect(cleaned.experience).toBe(xp);
});

it("purges obsolete server scores and prevents replay without changing private saves or XP", async () => {
  const migration = "20261003161636_current_record_categories_only.sql";
  const fixture = await syncFixture(migration);
  try {
    const { owner } = await fixture.client(),
      state = history();
    const old = startRound(
      state,
      {
        mode: "fehlerfrei",
        topic: "Alle Themen",
        difficulty: "Alle Stufen",
        recordPreset: "genre",
        filters: {
          genres: ["Horror"],
          sources: ["film"],
          difficulties: ["leicht", "mittel", "schwer"],
          familiarities: [1, 2, 3, 4],
        },
      },
      now + 100000,
    );
    const q = old.questions[0];
    answer(
      state,
      old.id,
      q.id,
      q.answers.find((a) => a.id !== q.correctId)!.id,
      1000,
      now + 101000,
      0,
    );
    old.recordPreset = "custom";
    old.ruleVersion = "solo-v1.fehlerfrei.custom";
    await fixture.db.query(
      "insert into public.quiz_saves(owner_id,state,revision) values($1,$2,1)",
      [owner, state],
    );
    await fixture.db.query("select public.quiz_project_scores($1)", [owner]);
    expect(
      (await fixture.db.query("select round_id from public.quiz_shared_scores"))
        .rows,
    ).toHaveLength(4);
    const before = (
      await fixture.db.query("select state from public.quiz_saves")
    ).rows;
    const xp = (
      await fixture.db.query(
        "select experience from public.quiz_player_totals where genre='' and difficulty=''",
      )
    ).rows;
    await fixture.db.exec(
      readFileSync(`supabase/migrations/${migration}`, "utf8"),
    );
    expect(
      (
        await fixture.db.query<{ round_id: string }>(
          "select round_id from public.quiz_shared_scores",
        )
      ).rows
        .map((row) => row.round_id)
        .sort(),
    ).toEqual(
      state.rounds
        .slice(1, 4)
        .map((round) => round.id)
        .sort(),
    );
    expect(
      (await fixture.db.query("select state from public.quiz_saves")).rows,
    ).toEqual(before);
    expect(
      (
        await fixture.db.query(
          "select experience from public.quiz_player_totals where genre='' and difficulty=''",
        )
      ).rows,
    ).toEqual(xp);
    await fixture.db.query("select public.quiz_project_scores($1)", [owner]);
    expect(
      (await fixture.db.query("select round_id from public.quiz_shared_scores"))
        .rows,
    ).toHaveLength(3);
    for (const change of [
      { ruleVersion: "solo-v1.rekord.genre.L" },
      { recordPreset: "custom" },
      { questions: state.rounds[1].questions.slice(0, 5) },
    ]) {
      expect(
        (
          await fixture.db.query<{ eligible: boolean }>(
            "select quiz_sync_internal.ranked_record($1) as eligible",
            [{ ...state.rounds[1], ...change }],
          )
        ).rows[0].eligible,
      ).toBe(false);
    }
    expect(
      (
        await fixture.db.query<{ exists: boolean }>(
          "select to_regprocedure('quiz_sync_internal.project_legacy_record(uuid,jsonb,jsonb)') is not null as exists",
        )
      ).rows[0].exists,
    ).toBe(false);
    expect(
      (
        await fixture.db.query<{ allowed: boolean }>(
          "select has_function_privilege('anon','quiz_sync_internal.ranked_record(jsonb)','EXECUTE') as allowed",
        )
      ).rows[0].allowed,
    ).toBe(false);
  } finally {
    await fixture.db.close();
  }
});

it("synchronizes archived rounds and new genre scores with unchanged server totals and private grants", async () => {
  const fixture = await syncFixture();
  try {
    const state = history();
    // Older clients saved the complete prior learning map, also for targets
    // outside the randomly selected next round.
    const firstEvent = state.events[0];
    state.rounds[1].before[firstEvent.knowledgeId] = learn(
      undefined,
      firstEvent,
    );
    const release = await prepareRelease(state.questions);
    const privateQuestion = {
      ...structuredClone(state.questions[0]),
      id: "PRIVATE-ARCHIVE-GC",
      knowledgeId: "PRIVATE-ARCHIVE-GC",
    };
    delete privateQuestion.metadata.variant_of;
    state.questions.push(privateQuestion);
    await fixture.seed(release);
    const { owner, api } = await fixture.client();
    const generation = crypto.randomUUID(),
      original = await compileState(state, [release]);
    const call = <T>(name: string, args: Record<string, unknown>) =>
      api.call<T>(name, args, 30000);
    await call("quiz_sync_begin", {
      expected_owner: owner,
      target_generation: generation,
      parent_generation: null,
      expected_revision: 0,
    });
    for (const obj of original.objects.values())
      await call("quiz_sync_object_piece", {
        expected_owner: owner,
        target_generation: generation,
        object_hash: obj.hash,
        object_encoding: obj.encoding,
        part_index: 0,
        part_count: 1,
        part_content: obj.text,
      });
    await call("quiz_sync_stage", {
      expected_owner: owner,
      target_generation: generation,
      changes: [...original.rows.values()].map((row) => ({ op: "put", row })),
    });
    await call("quiz_sync_seal", {
      expected_owner: owner,
      target_generation: generation,
      row_count: original.rows.size,
      object_count: original.objects.size,
    });
    const activated = await call<{ revision: number }>("quiz_sync_activate", {
      expected_owner: owner,
      target_generation: generation,
    });
    const totals = (
      await fixture.db.query(
        "select * from public.quiz_player_totals order by genre,difficulty",
      )
    ).rows;
    const scores = (
      await fixture.db.query(
        "select * from public.quiz_shared_scores order by round_id",
      )
    ).rows;
    expect(scores).toHaveLength(3);
    archiveClosedRounds(state);
    const archived = await compileState(state, [release], original, true, true),
      delta = difference(original, archived);
    await call("quiz_sync_apply", {
      packet_text: stableStringify({
        ...delta,
        format: SYNC_FORMAT,
        protocol: 1,
        owner,
        generation,
        expectedRevision: activated.revision,
        id: crypto.randomUUID(),
      }),
    });
    expect(
      (
        await fixture.db.query(
          "select * from public.quiz_player_totals order by genre,difficulty",
        )
      ).rows,
    ).toEqual(totals);
    expect(
      (
        await fixture.db.query(
          "select * from public.quiz_shared_scores order by round_id",
        )
      ).rows,
    ).toEqual(scores);
    const beforeHashes = [...original.rows.values()]
      .filter((r) => r.kind === "round")
      .map((r) => (r.value as Record<string, unknown>).beforeObject as string);
    const expired = beforeHashes.filter(
      (hash) => !objectHashes(archived).has(hash),
    );
    expect(expired.length).toBeGreaterThan(0);
    // The first archive write keeps recent objects for delayed device packets.
    expect(
      (
        await fixture.db.query(
          "select hash from public.quiz_private_catalog_objects where hash=any($1::text[])",
          [expired],
        )
      ).rows,
    ).toHaveLength(new Set(expired).size);
    await fixture.db.query(
      "update public.quiz_private_catalog_objects set created_at=now()-interval '2 days'",
    );
    await fixture.db.query(
      "select quiz_sync_internal.prune_round_objects($1::uuid,$2::uuid)",
      [owner, generation],
    );
    expect(
      (
        await fixture.db.query(
          "select hash from public.quiz_private_catalog_objects where hash=any($1::text[])",
          [expired],
        )
      ).rows,
    ).toHaveLength(0);
    const emptyBefore = (
      [...archived.rows.values()].find((r) => r.kind === "round")!
        .value as Record<string, unknown>
    ).beforeObject;
    expect(
      (
        await fixture.db.query(
          "select hash from public.quiz_private_catalog_objects where hash=$1",
          [emptyBefore],
        )
      ).rows,
    ).toHaveLength(1);
    const privateHash = [...archived.objects.values()].find((o) =>
      o.text.includes("PRIVATE-ARCHIVE-GC"),
    )!.hash;
    expect(
      (
        await fixture.db.query(
          "select hash from public.quiz_private_catalog_objects where hash=$1",
          [privateHash],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await fixture.db.query(
          "select has_function_privilege('authenticated','quiz_sync_internal.check_round_fact(jsonb)','EXECUTE') allowed",
        )
      ).rows[0],
    ).toEqual({ allowed: false });
    const bad = structuredClone(state);
    bad.rounds[0].archive!.questions[0] = {
      ...bad.rounds[0].archive!.questions[0],
      question: "Forbidden old question text",
    } as NonNullable<(typeof bad.rounds)[0]["archive"]>["questions"][number];
    const corrupt = await compileState(bad, [release], archived, true, true);
    await expect(
      call("quiz_sync_apply", {
        packet_text: stableStringify({
          ...difference(archived, corrupt),
          format: SYNC_FORMAT,
          protocol: 1,
          owner,
          generation,
          expectedRevision: activated.revision + 1,
          id: crypto.randomUUID(),
        }),
      }),
    ).rejects.toThrow(/invalid_round_fact/);
  } finally {
    await fixture.db.close();
  }
}, 30000);

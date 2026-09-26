import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState, type Round } from "../src/model";
import { answer, complete, startRound } from "../src/engine";
import { leaderboard } from "../src/leaderboard";
import { validateBackup } from "../src/storage";
const questions = importCsv(
  readFileSync("public/horror-fragen.csv", "utf8"),
).questions;
const options = {
  mode: "rekord" as const,
  topic: "Alle Themen",
  difficulty: "Alle Stufen",
  filters: { genres: ["Horror"], difficulties: ["leicht" as const] },
};
it("zeigt alle abgeschlossenen Rekordspiele, gleiche Punktzahlen teilen den Rang; Sicherung erhält die Liste", () => {
  const state = emptyState(questions);
  const rounds: Round[] = [];
  for (let i = 0; i < 4; i++) {
    // Force equal five-question rounds with separate fresh states, then combine valid history.
    const run = emptyState(questions);
    const r = startRound(run, options, 1000 + i * 100000);
    r.questions.forEach((q, j) =>
      answer(
        run,
        r.id,
        q.id,
        i === 0 && j === 0 ? null : q.correctId,
        1000,
        2000 + i * 100000 + j * 2000,
      ),
    );
    complete(run, r.id, 20000 + i * 100000);
    state.rounds.push(r);
    state.events.push(...run.events);
    rounds.push(r);
  }
  rounds[3].status = "aborted";
  const active = startRound(state, options, 500000);
  expect(active.status).toBe("active");
  const before = JSON.stringify(state);
  const groups = leaderboard(state);
  expect(groups).toHaveLength(1);
  expect(groups[0].entries.map((e) => e.rank)).toEqual([1, 1, 3]);
  expect(groups[0].entries[2].correct).toBe(4);
  expect(groups[0].entries[0].elapsedMs).toBe(5000);
  expect(JSON.stringify(state)).toBe(before);
  expect(leaderboard(validateBackup(JSON.parse(before)))).toEqual(groups);
});
it("trennt Rundengröße, Regelversion, Genre-/Stufenkombination, Thema und historische Kategorien", () => {
  const state = emptyState(questions);
  const base = startRound(state, options, 1000);
  base.status = "completed";
  base.finishedAt = 2000;
  state.rounds = [
    base,
    ...[
      { questions: base.questions.slice(0, 2) },
      { ruleVersion: "future" },
      {
        filters: {
          genres: ["Horror", "Science-Fiction"],
          difficulties: ["leicht" as const],
        },
      },
      {
        filters: {
          genres: ["Horror"],
          difficulties: ["leicht" as const, "mittel" as const],
        },
      },
      { topic: "Halloween" },
      { filters: undefined },
    ].map((change, i) => ({
      ...structuredClone(base),
      ...change,
      id: "changed" + i,
    })),
  ];
  const combined = state.rounds[3];
  state.rounds.push({
    ...structuredClone(combined),
    id: "reverse",
    filters: {
      ...combined.filters!,
      genres: [...combined.filters!.genres].reverse(),
    },
  });
  state.rounds.push({
    ...structuredClone(base),
    id: "relaxed",
    mode: "entdecken",
  });
  expect(leaderboard(state)).toHaveLength(7);
  expect(
    leaderboard(state)
      .find((g) => g.entries.length === 2)
      ?.entries.map((e) => e.round.id)
      .sort(),
  ).toEqual(["changed2", "reverse"]);
});

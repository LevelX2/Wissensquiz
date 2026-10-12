import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { importCsv } from "../src/importer";
import { emptyState } from "../src/model";
import { startRound, answer, complete } from "../src/engine";
import { archiveClosedRounds } from "../src/roundArchive";
import {
  achievementTracks,
  localAchievements,
  reachedAchievements,
} from "../src/achievements";
import { celebrationTier, successTiers } from "../src/successTiers";

it("ordnet Meilensteine eindeutig fünf Stufen zu und bündelt gleichzeitige Erfolge nach der höchsten Stufe", () => {
  for (const track of achievementTracks) {
    expect(track.milestones.length).toBeLessThanOrEqual(successTiers.length);
    for (const [index, count] of track.milestones.entries()) {
      const achievements = reachedAchievements({
        completed: 0,
        perfectTens: 0,
        zeroTens: 0,
        [track.id]: count,
      });
      expect(achievements).toHaveLength(1);
      expect(achievements[0].tier.rank).toBe(index + 1);
    }
  }
  expect(
    reachedAchievements({ completed: 11, perfectTens: 2, zeroTens: 0 }),
  ).toEqual([]);
  const simultaneous = reachedAchievements({
    completed: 100,
    perfectTens: 25,
    zeroTens: 0,
  });
  expect(simultaneous).toHaveLength(2);
  expect(celebrationTier(simultaneous, 2).id).toBe("diamond");
  expect(celebrationTier([], 20).id).toBe("platinum");
});

it("zählt vollständige Runden einschließlich aktueller Archivfakten und trennt Nulltreffer von Zeitablauf", () => {
  const catalog = importCsv(
    readFileSync("public/fragen.csv", "utf8"),
  ).questions;
  const questions = [
    ...new Map(catalog.map((q) => [q.knowledgeId, q])).values(),
  ].slice(0, 10);
  const state = emptyState(questions);
  const now = new Date("2026-10-12T12:00:00+02:00").getTime();
  for (const [index, choice] of [
    "perfect",
    "zero",
    "timeout",
    "short",
    "guessed",
    "active",
  ].entries()) {
    const round = startRound(
      state,
      { mode: "entdecken", topic: "Alle Themen", difficulty: "Alle Stufen" },
      now + index * 1000,
    );
    round.questions = structuredClone(
      choice === "short" ? questions.slice(0, 9) : questions,
    );
    round.order = round.questions.map((q) => q.answers.map((a) => a.id));
    round.familiaritySnapshot = undefined;
    for (const q of round.questions)
      answer(
        state,
        round.id,
        q.id,
        choice === "zero"
          ? { dontKnow: true }
          : choice === "timeout"
            ? null
            : q.correctId,
        100,
        now + index * 1000 + 100,
      );
    if (choice === "guessed")
      state.events.find((e) => e.roundId === round.id)!.guessed = true;
    if (choice !== "active")
      complete(state, round.id, now + index * 1000 + 500);
  }
  const before = localAchievements(state);
  expect(before.counts).toEqual({ completed: 5, perfectTens: 1, zeroTens: 1 });
  archiveClosedRounds(state);
  expect(localAchievements(state)).toEqual(before);
  const perfect = state.rounds.find((r) => r.finishedAt === now + 500)!;
  expect(localAchievements(state, perfect.id).snapshot).toEqual({
    completed: 1,
    perfectTens: 1,
    zeroTens: 0,
  });
});

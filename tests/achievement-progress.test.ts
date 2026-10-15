import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { achievementTracks } from "../src/achievements";
import { Achievements, AchievementProgress } from "../src/AchievementsPanel";
import { AchievementIcon } from "../src/AchievementIcon";
import {
  learningAchievementTracks,
  reachedLearningAchievements,
} from "../src/learningAchievements";
import { successTiers } from "../src/successTiers";

it("hält wachsende Reihen langfristig offen und vergibt alle übersprungenen Stufen genau einmal", () => {
  const available = Object.fromEntries(
    [
      "experience",
      "films",
      "secureFacts",
      "masteredFacts",
      "discoveredFacts",
      "actors",
      "awards",
      "genreBreadth",
      "sciFiMastery",
      "films:Drama",
    ].map((id) => [id, 20000]),
  );
  const learning = learningAchievementTracks({ counts: {}, available });
  for (const track of [...achievementTracks, ...learning]) {
    expect(track.milestones).toEqual(
      [...new Set(track.milestones)].sort((a, b) => a - b),
    );
    expect(track.milestones.length).toBeLessThanOrEqual(successTiers.length);
    if (track.id !== "zeroTens" && track.id !== "sciFiMastery")
      expect(track.milestones.length).toBeGreaterThanOrEqual(10);
  }
  for (const track of learning) {
    const last = track.milestones.at(-1)!;
    const reward = {
      before: { [track.id]: 0 },
      after: { counts: { [track.id]: last }, available },
    };
    const rewards = reachedLearningAchievements(reward).filter((a) =>
      a.id.startsWith(`${track.id}:`),
    );
    expect(rewards.map((a) => a.tier.rank)).toEqual(
      track.milestones.map((_, i) => i + 1),
    );
    expect(new Set(rewards.map((a) => a.id)).size).toBe(
      track.milestones.length,
    );
    expect(
      reachedLearningAchievements({ ...reward, before: reward.after.counts }),
    ).toEqual([]);
  }
  for (const id of ["secureFacts", "masteredFacts"])
    expect(learning.find((track) => track.id === id)!.milestones.at(-1)).toBe(
      12500,
    );
});

it("kennzeichnet nächste Ziele außerhalb des Bestands und begrenzt EXP nicht durch die Bestandszahl", () => {
  const html = renderToStaticMarkup(
    createElement(AchievementProgress, {
      count: 25,
      milestones: [1, 10, 25, 50],
      available: 30,
      label: (n) => `${n} Filme gelernt`,
    }),
  );
  expect(html).toContain(
    "Nächstes Ziel mit weiteren Inhalten: 50 Filme gelernt",
  );
  expect(html).not.toContain("Alle Meilensteine erreicht");
  const profile = renderToStaticMarkup(
    createElement(Achievements, {
      counts: { completed: 100, perfectTens: 100, zeroTens: 0 },
      learning: {
        counts: { experience: 10000 },
        available: { experience: 10000 },
      },
    }),
  );
  expect(profile).toContain("Nächstes Ziel: 25.000 EXP gesammelt");
  expect(profile).toContain("Noch 15.000");
  expect(profile).toContain("Film-Olymp");
  expect(profile).not.toContain("Nächstes Ziel mit weiteren Inhalten");
  expect(profile).not.toContain("Mit weiteren Inhalten");
});

it("zeigt erreichte Höchststände unabhängig vom heutigen Bestand und hält zwölf Rangpunkte im Icon", () => {
  const html = renderToStaticMarkup(
    createElement(AchievementProgress, {
      count: 50,
      milestones: [1, 10, 25, 50],
      available: 30,
      label: (n) => `${n} Filme gelernt`,
    }),
  );
  expect(html).toContain("Alle Meilensteine erreicht");
  expect(html).not.toContain("Nächstes Ziel");
  const icon = renderToStaticMarkup(
    createElement(AchievementIcon, { icon: "star", tier: successTiers[11] }),
  );
  const dots = [...icon.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="2"/g)];
  expect(dots).toHaveLength(12);
  expect(
    dots.every(
      ([, x, y]) => Number(x) >= 2 && Number(x) <= 98 && Number(y) <= 108,
    ),
  ).toBe(true);
});

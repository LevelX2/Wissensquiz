import { expect, it } from "vitest";
import { discoveryMedals } from "../src/discoveryMilestones";

it.each([
  [0, [], 50],
  [49, [], 50],
  [50, [50], 100],
  [99, [50], 100],
  [100, [50, 100], 250],
  [10000, [50, 100, 250, 500, 1000, 2500, 5000, 10000], 12500],
  [12500, [50, 100, 250, 500, 1000, 2500, 5000, 10000, 12500], 15000],
  [
    25000,
    [50, 100, 250, 500, 1000, 2500, 5000, 10000, 12500, 15000, 20000, 25000],
    undefined,
  ],
])(
  "vergibt Entdecker-Medaillen bei %i unterschiedlichen Zielen",
  (count, earned, next) => {
    const medals = discoveryMedals(count);
    expect(
      medals.filter((medal) => medal.earned).map((medal) => medal.target),
    ).toEqual(earned);
    expect(medals.find((medal) => !medal.earned)?.target).toBe(next);
    expect(medals.every((medal) => medal.remaining >= 0)).toBe(true);
  },
);

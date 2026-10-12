import { careerTitles } from "./career";

// One presentation contract for achievement stages, career promotions and
// journey unlocks. Optional sound/haptics use the player's existing settings.
export const successTiers = [
  {
    rank: 1,
    id: "bronze",
    numeral: "I",
    label: "Bronze",
    color: "#b8824c",
    light: "#f4c99c",
    tones: [523, 659, 784],
    vibration: [25, 50, 35],
    bursts: 1,
    duration: 650,
  },
  {
    rank: 2,
    id: "silver",
    numeral: "II",
    label: "Silber",
    color: "#738792",
    light: "#dcebf1",
    tones: [523, 659, 784, 1047],
    vibration: [25, 50, 25, 50, 45],
    bursts: 2,
    duration: 750,
  },
  {
    rank: 3,
    id: "gold",
    numeral: "III",
    label: "Gold",
    color: "#a17a22",
    light: "#ffe3a1",
    tones: [392, 523, 659, 784, 1047],
    vibration: [30, 50, 30, 50, 60],
    bursts: 3,
    duration: 850,
  },
  {
    rank: 4,
    id: "platinum",
    numeral: "IV",
    label: "Platin",
    color: "#527c74",
    light: "#baf4e6",
    tones: [523, 659, 784, 1047, 1175, 1319],
    vibration: [30, 50, 30, 50, 40, 60, 65],
    bursts: 4,
    duration: 950,
  },
  {
    rank: 5,
    id: "diamond",
    numeral: "V",
    label: "Diamant",
    color: "#6478b3",
    light: "#d7ddff",
    tones: [392, 523, 659, 784, 1047, 1319, 1568],
    vibration: [35, 50, 35, 50, 45, 60, 80],
    bursts: 5,
    duration: 1050,
  },
] as const;
export type SuccessTier = (typeof successTiers)[number];
export const stageLabel = (tier: SuccessTier) =>
  `Stufe ${tier.numeral} · ${tier.label}`;

export function celebrationTier(
  achievements: { tier: SuccessTier }[],
  level?: number,
): SuccessTier {
  const careerRank = level
    ? careerTitles.filter((title) => level >= title.level).length
    : 1;
  const rank = Math.max(careerRank, ...achievements.map((a) => a.tier.rank));
  return successTiers[rank - 1];
}

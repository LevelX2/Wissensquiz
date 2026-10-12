export const discoveryMedalTargets = [
  50, 100, 250, 500, 1000, 2500, 5000, 10000,
] as const;

export function discoveryMedals(encountered: number) {
  return discoveryMedalTargets.map((target) => ({
    target,
    earned: encountered >= target,
    remaining: Math.max(0, target - encountered),
  }));
}

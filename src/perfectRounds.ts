export const perfectRoundMilestones = [1, 10, 25, 50, 100] as const;
export const perfectRoundLabel = (count: number) =>
  count === 1 ? "Erste perfekte Zehnerrunde" : `${count} perfekte Zehnerrunden`;
export function newPerfectRoundBadge(reached: number) {
  return perfectRoundMilestones.find((target) => target === reached);
}

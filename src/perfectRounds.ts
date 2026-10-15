export const perfectRoundMilestones = [
  1, 10, 25, 50, 100, 200, 350, 500, 750, 1000, 1500, 2500,
] as const;
export const perfectRoundLabel = (count: number) =>
  count === 1
    ? "Erste perfekte Zehnerrunde"
    : `${count.toLocaleString("de-DE")} perfekte Zehnerrunden`;
export function newPerfectRoundBadge(reached: number) {
  return perfectRoundMilestones.find((target) => target === reached);
}

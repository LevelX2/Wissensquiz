import { AchievementIcon } from "./AchievementIcon";
import type { PathUnlock } from "./learningPath";
import { successTiers } from "./successTiers";

export function JourneyUnlockIcon({
  unlock,
  earned = true,
}: {
  unlock: PathUnlock;
  earned?: boolean;
}) {
  return (
    <AchievementIcon
      icon={"familiarity" in unlock ? "ticket" : "unlock"}
      tier={successTiers[2]}
      ranked={false}
      earned={earned}
    />
  );
}

import { AchievementIcon } from "./AchievementIcon";
import { stageLabel, successTiers } from "./successTiers";
import { perfectRoundLabel, perfectRoundMilestones } from "./perfectRounds";
import { AchievementProgress } from "./AchievementsPanel";

export function PerfectRoundBadges({ count }: { count: number }) {
  return (
    <section className="discovery-medals" aria-label="Perfekte Zehnerrunden">
      <h2>Deine perfekten Zehnerrunden</h2>
      <p className="muted">
        {count.toLocaleString("de-DE")} geschafft · Zehn sicher richtige
        Antworten in einer abgeschlossenen Runde. Über alle Genres und
        Fragenbereiche; geratene Treffer zählen nicht.
      </p>
      <AchievementProgress
        count={count}
        milestones={perfectRoundMilestones}
        label={perfectRoundLabel}
      />
      <ul>
        {perfectRoundMilestones.map((target, index) => (
          <li key={target} className={count >= target ? "earned" : "locked"}>
            <AchievementIcon
              icon="star"
              tier={successTiers[index]}
              earned={count >= target}
            />
            <strong>{target}</strong>
            <span>{stageLabel(successTiers[index])}</span>
            <span>{perfectRoundLabel(target)}</span>
            <small>
              {count >= target ? "✓ Erreicht" : `Noch ${target - count}`}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

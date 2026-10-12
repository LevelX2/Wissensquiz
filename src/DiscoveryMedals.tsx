import { AchievementIcon } from "./AchievementIcon";
import { learningAchievementTier } from "./learningAchievements";
import { discoveryMedals } from "./discoveryMilestones";

export function DiscoveryMedals({ encountered }: { encountered: number }) {
  return (
    <section className="discovery-medals" aria-label="Entdecker-Medaillen">
      <h2>Deine Entdecker-Medaillen</h2>
      <p className="muted">
        Für unterschiedliche kennengelernte Filmfakten – über alle Genres und
        Fragenbereiche. Varianten zählen einmal.
      </p>
      <ul>
        {discoveryMedals(encountered).map((medal, index) => (
          <li
            key={medal.target}
            className={medal.earned ? "earned" : "locked"}
            aria-label={`Entdecker-Medaille: ${medal.target.toLocaleString("de-DE")} Filmfakten`}
          >
            <AchievementIcon
              icon="compass"
              tier={learningAchievementTier(index)}
              earned={medal.earned}
            />
            <strong>{medal.target.toLocaleString("de-DE")}</strong>
            <span>Filmfakten entdeckt</span>
            <small>
              {medal.earned
                ? "✓ Erreicht"
                : `Noch ${medal.remaining.toLocaleString("de-DE")}`}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

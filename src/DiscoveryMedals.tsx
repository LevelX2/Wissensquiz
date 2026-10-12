import { BadgeIcon } from "./Icons";
import { discoveryMedals } from "./discoveryMilestones";

export function DiscoveryMedals({ encountered }: { encountered: number }) {
  return (
    <section className="discovery-medals" aria-label="Entdecker-Medaillen">
      <h2>Deine Entdecker-Medaillen</h2>
      <p className="muted">
        Für unterschiedliche kennengelernte Wissensziele – über alle Genres und
        Fragenbereiche. Varianten zählen einmal.
      </p>
      <ul>
        {discoveryMedals(encountered).map((medal) => (
          <li
            key={medal.target}
            className={medal.earned ? "earned" : "locked"}
            aria-label={`Entdecker-Medaille: ${medal.target.toLocaleString("de-DE")} Wissensziele`}
          >
            <BadgeIcon earned={medal.earned} />
            <strong>{medal.target.toLocaleString("de-DE")}</strong>
            <span>Wissensziele entdeckt</span>
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

import { BadgeIcon } from "./Icons";
import { perfectRoundLabel, perfectRoundMilestones } from "./perfectRounds";

export function PerfectRoundBadges({ count }: { count: number }) {
  return (
    <section className="discovery-medals" aria-label="Perfekte Zehnerrunden">
      <h2>Deine perfekten Zehnerrunden</h2>
      <p className="muted">
        {count.toLocaleString("de-DE")} geschafft · Zehn sicher richtige
        Antworten in einer abgeschlossenen Runde. Über alle Genres und
        Fragenbereiche; geratene Treffer zählen nicht.
      </p>
      <ul>
        {perfectRoundMilestones.map((target) => (
          <li key={target} className={count >= target ? "earned" : "locked"}>
            <BadgeIcon earned={count >= target} />
            <strong>{target}</strong>
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

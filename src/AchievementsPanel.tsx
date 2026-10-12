import { AchievementIcon } from "./AchievementIcon";
import { achievementTracks, type AchievementCounts } from "./achievements";
import { stageLabel, successTiers } from "./successTiers";

export function AchievementProgress({
  count,
  milestones,
  label,
}: {
  count: number;
  milestones: readonly number[];
  label: (n: number) => string;
}) {
  const next = milestones.find((n) => n > count);
  return (
    <div className="achievement-progress">
      <strong>
        {next ? `Nächstes Ziel: ${label(next)}` : "Alle Meilensteine erreicht"}
      </strong>
      <progress
        value={Math.min(count, next ?? count)}
        max={next ?? Math.max(1, count)}
        aria-label={
          next
            ? `${count} von ${next} · ${label(next)}`
            : "Alle Meilensteine erreicht"
        }
      />
      <span className="tiny muted">
        {count.toLocaleString("de-DE")}
        {next
          ? ` / ${next.toLocaleString("de-DE")} · Noch ${next - count}`
          : " geschafft"}
      </span>
    </div>
  );
}

export function Achievements({ counts }: { counts: AchievementCounts }) {
  const earned = achievementTracks.reduce(
    (n, track) =>
      n +
      track.milestones.filter((target) => counts[track.id] >= target).length,
    0,
  );
  const total = achievementTracks.reduce(
    (n, track) => n + track.milestones.length,
    0,
  );
  return (
    <div className="achievement-collection">
      <p>
        <strong>
          {earned} von {total} Erfolgen erreicht
        </strong>
      </p>
      <p className="tiny muted">
        Über alle Fragenbereiche und Spielarten. Die Erfolgsstufen sind Bronze,
        Silber, Gold, Platin und Diamant. Neue Erfolge erscheinen nach dem
        Rundenabschluss; hier kannst Du sie jederzeit nachsehen.
      </p>
      {achievementTracks.map((track) => (
        <section
          className="achievement-track"
          key={track.id}
          aria-label={track.title}
        >
          <h3>{track.title}</h3>
          <p className="tiny muted">{track.description}</p>
          <AchievementProgress
            count={counts[track.id]}
            milestones={track.milestones}
            label={track.label}
          />
          <ul className="achievement-badges">
            {track.milestones.map((target, index) => (
              <li
                key={target}
                className={counts[track.id] >= target ? "earned" : "locked"}
              >
                <AchievementIcon
                  icon={track.icon}
                  tier={successTiers[index]}
                  earned={counts[track.id] >= target}
                />
                <strong>{stageLabel(successTiers[index])}</strong>
                <span>{track.label(target)}</span>
                <small>
                  {counts[track.id] >= target ? "✓ Erreicht" : "Noch offen"}
                </small>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

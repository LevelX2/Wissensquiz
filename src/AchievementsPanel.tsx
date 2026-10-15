import { AchievementIcon } from "./AchievementIcon";
import { achievementTracks, type AchievementCounts } from "./achievements";
import { stageLabel, successTiers } from "./successTiers";
import {
  learningAchievementTracks,
  learningAchievementTier,
  type LearningAchievements,
} from "./learningAchievements";

export function AchievementProgress({
  count,
  milestones,
  label,
  available,
}: {
  count: number;
  milestones: readonly number[];
  label: (n: number) => string;
  available?: number;
}) {
  const next = milestones.find((n) => n > count);
  const needsContent =
    next !== undefined && available !== undefined && next > available;
  const goalText = next
    ? `${needsContent ? "Nächstes Ziel mit weiteren Inhalten" : "Nächstes Ziel"}: ${label(next)}`
    : "Alle Meilensteine erreicht";
  return (
    <div className="achievement-progress">
      <strong>{goalText}</strong>
      <progress
        value={Math.min(count, next ?? count)}
        max={next ?? Math.max(1, count)}
        aria-label={
          next
            ? `${count} von ${next} · ${goalText}`
            : "Alle Meilensteine erreicht"
        }
      />
      <span className="tiny muted">
        {count.toLocaleString("de-DE")}
        {next
          ? ` / ${next.toLocaleString("de-DE")} · Noch ${(next - count).toLocaleString("de-DE")}`
          : " geschafft"}
      </span>
    </div>
  );
}

export function Achievements({
  counts,
  learning,
}: {
  counts: AchievementCounts;
  learning: LearningAchievements;
}) {
  const tracks = [
    ...achievementTracks.map((track) => ({
      ...track,
      count: counts[track.id],
      available: undefined as number | undefined,
    })),
    ...learningAchievementTracks(learning).map((track) => ({
      ...track,
      count: learning.counts[track.id] ?? 0,
      available: learning.available[track.id] ?? 0,
    })),
  ];
  const earned = tracks.reduce(
    (n, track) =>
      n + track.milestones.filter((target) => track.count >= target).length,
    0,
  );
  const total = tracks.reduce((n, track) => n + track.milestones.length, 0);
  return (
    <div className="achievement-collection">
      <p>
        <strong>
          {earned} von {total} Erfolgen erreicht
        </strong>
      </p>
      <p className="tiny muted">
        Über alle Fragenbereiche und Spielarten. Es gibt bis zu{" "}
        {successTiers.length} Erfolgsstufen:{" "}
        {successTiers.map((tier) => tier.label).join(", ")}. Neue Erfolge
        erscheinen nach dem Rundenabschluss; hier kannst Du sie jederzeit
        nachsehen. Bereits erreichte Erfolge bleiben erhalten, auch wenn Dein
        aktueller Lernstand sich ändert.
      </p>
      {tracks.map((track) => (
        <section
          className="achievement-track"
          key={track.id}
          aria-label={track.title}
        >
          <details>
            <summary>
              <AchievementIcon
                icon={track.icon}
                tier={learningAchievementTier(
                  Math.max(
                    0,
                    track.milestones.filter((n) => track.count >= n).length - 1,
                  ),
                )}
                earned={track.count >= track.milestones[0]}
              />
              <span>
                <strong>{track.title}</strong>
                <span className="tiny muted">
                  {" "}
                  · {track.count.toLocaleString("de-DE")} ·{" "}
                  {track.milestones.filter((n) => track.count >= n).length}/
                  {track.milestones.length} Meilensteine
                </span>
                <small className="achievement-current-tier">
                  {track.count >= track.milestones[0]
                    ? stageLabel(
                        learningAchievementTier(
                          track.milestones.filter((n) => track.count >= n)
                            .length - 1,
                        ),
                      )
                    : "Noch kein Meilenstein erreicht"}
                </small>
              </span>
            </summary>
            <p className="tiny muted">{track.description}</p>
            <AchievementProgress
              count={track.count}
              milestones={track.milestones}
              label={track.label}
              available={
                track.id === "experience" ? undefined : track.available
              }
            />
            {track.available !== undefined && track.id !== "experience" && (
              <p className="tiny muted">
                Im aktuellen Fragenbestand möglich:{" "}
                {track.available.toLocaleString("de-DE")}. Ziele darüber werden
                mit weiteren passenden Inhalten erreichbar.
              </p>
            )}
            <ul className="achievement-badges">
              {track.milestones.map((target, index) => (
                <li
                  key={target}
                  className={track.count >= target ? "earned" : "locked"}
                >
                  <AchievementIcon
                    icon={track.icon}
                    tier={learningAchievementTier(index)}
                    earned={track.count >= target}
                  />
                  <strong>{stageLabel(learningAchievementTier(index))}</strong>
                  <span>{track.label(target)}</span>
                  <small>
                    {track.count >= target
                      ? "✓ Erreicht"
                      : track.id !== "experience" &&
                          track.available !== undefined &&
                          target > track.available
                        ? "Mit weiteren Inhalten"
                        : "Noch offen"}
                  </small>
                </li>
              ))}
            </ul>
          </details>
        </section>
      ))}
    </div>
  );
}

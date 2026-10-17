import { useEffect, useState, type CSSProperties } from "react";
import { careerProgress, totalXp, xpLabels, type XpBreakdown } from "./career";
import { AchievementIcon } from "./AchievementIcon";
import { celebrationTier } from "./successTiers";

export function CareerBadge({ experience }: { experience: number }) {
  const career = careerProgress(experience);
  return (
    <span className={`career-badge career-tier-${career.tier}`}>
      <CareerEmblem level={career.level} />
      <span>
        Level {career.level} · {career.title}
      </span>
    </span>
  );
}

export function CareerEmblem({ level }: { level: number }) {
  return (
    <AchievementIcon
      className="career-emblem"
      icon="career"
      tier={celebrationTier([], level)}
      ranked={false}
    />
  );
}

export function CareerProgress({
  experience,
  compact = false,
  from,
  legacyBonus = 0,
}: {
  experience: number;
  compact?: boolean;
  from?: number;
  legacyBonus?: number;
}) {
  const career = careerProgress(experience);
  const [animated, setAnimated] = useState(from ?? experience);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimated(experience));
    return () => cancelAnimationFrame(frame);
  }, [experience]);
  const start = careerProgress(animated);
  const crossing =
    from !== undefined && careerProgress(from).level < career.level;
  const visual =
    animated === experience
      ? career.current
      : start.level < career.level
        ? 0
        : start.current;
  return (
    <div
      className={`career-progress career-tier-${career.tier}${compact ? " is-compact" : ""}`}
    >
      <div className="career-heading">
        <CareerEmblem level={career.level} />
        <div>
          {!compact && <span className="eyebrow">DEINE FILMKARRIERE</span>}
          <strong>
            Level {career.level} · {career.title}
          </strong>
          <span className="career-numbers">
            {career.current.toLocaleString("de-DE")} /{" "}
            {career.needed.toLocaleString("de-DE")} XP
            {compact ? "" : " zum nächsten Level"}
          </span>
        </div>
      </div>
      <div
        className={`career-track${crossing ? " is-crossing" : ""}`}
        role="progressbar"
        aria-label={`Fortschritt zu Level ${career.level + 1}`}
        aria-valuemin={0}
        aria-valuemax={career.needed}
        aria-valuenow={career.current}
        aria-valuetext={`${career.current} von ${career.needed} XP; noch ${career.remaining} XP bis Level ${career.level + 1}`}
      >
        <span
          style={
            {
              width: `${(100 * visual) / career.needed}%`,
              "--career-from": `${(100 * careerProgress(from ?? experience).current) / careerProgress(from ?? experience).needed}%`,
              "--career-to": `${(100 * career.current) / career.needed}%`,
            } as CSSProperties
          }
        />
      </div>
      {!compact && (
        <p>
          Noch <strong>{career.remaining.toLocaleString("de-DE")} XP</strong>{" "}
          bis Level {career.level + 1} ·{" "}
          {career.experience.toLocaleString("de-DE")} XP insgesamt
        </p>
      )}
      {!compact && legacyBonus > 0 && (
        <p>
          {legacyBonus.toLocaleString("de-DE")} XP Startgutschrift erhalten Dein
          bisheriges Level und den Fortschritt beim Wechsel zur Filmkarriere.
        </p>
      )}
    </div>
  );
}

export function RoundExperience({
  xp,
  before,
  after,
  celebrate = false,
}: {
  xp: XpBreakdown;
  before: number;
  after: number;
  celebrate?: boolean;
}) {
  const previous = careerProgress(before);
  const next = careerProgress(after);
  const levelUp = next.level > previous.level;
  return (
    <section
      className={`round-experience${celebrate && levelUp ? " career-level-up" : ""}`}
      aria-label="Erfahrung dieser Runde"
    >
      <div className="round-xp-heading">
        <strong>+{totalXp(xp)} XP</strong>
        <span>
          {levelUp
            ? `Level ${next.level} erreicht!`
            : "Deine Erfahrung aus dieser Runde"}
        </span>
      </div>
      {levelUp && (
        <p className="career-promotion" role={celebrate ? "status" : undefined}>
          ✦ {next.title}
          {next.title !== previous.title
            ? " – Dein neuer Karrieretitel!"
            : ` · Aufgestiegen von Level ${previous.level}`}
        </p>
      )}
      <CareerProgress experience={after} from={celebrate ? before : after} />
      <details>
        <summary>So setzen sich Deine XP zusammen</summary>
        <dl className="xp-breakdown">
          {(Object.keys(xpLabels) as (keyof XpBreakdown)[]).map((key) => (
            <div key={key}>
              <dt>{xpLabels[key]}</dt>
              <dd>+{xp[key]} XP</dd>
            </div>
          ))}
        </dl>
        <p className="tiny muted">
          Antworten und sichere Treffer zählen je Filmfakt einmal pro Tag. Die
          drei Lernboni bekommst Du jeweils einmal pro Filmfakt. Zeitabläufe
          bringen keine Antwort-XP.
        </p>
      </details>
      {totalXp(xp) === 0 && (
        <p className="tiny muted">
          Diese Runde bringt keine zusätzlichen XP. Bereits gewertete
          Wiederholungen und Zeitabläufe erhöhen die Erfahrung nicht.
        </p>
      )}
      {celebrate && levelUp && (
        <div className="career-sparks" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ "--spark-index": i } as CSSProperties} />
          ))}
        </div>
      )}
    </section>
  );
}

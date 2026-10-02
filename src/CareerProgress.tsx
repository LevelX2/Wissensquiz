import { useEffect, useState, type CSSProperties } from "react";
import { careerProgress, totalXp, xpLabels, type XpBreakdown } from "./career";

export function CareerBadge({ experience }: { experience: number }) {
  const career = careerProgress(experience);
  return (
    <span className={`career-badge career-tier-${career.tier}`}>
      <CareerEmblem tier={career.tier} />
      <span>
        Level {career.level} · {career.title}
      </span>
    </span>
  );
}

function CareerEmblem({ tier }: { tier: number }) {
  return (
    <svg
      className="career-emblem"
      viewBox="0 0 64 64"
      aria-hidden="true"
      fill="none"
    >
      {tier >= 10 && (
        <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="2" />
      )}
      <path
        d="M12 25h40v27H12zM12 25l-3-12 39-9 3 12-39 9Z"
        fill="currentColor"
        opacity=".18"
      />
      <path
        d="M12 25h40v27H12zM12 25l-3-12 39-9 3 12-39 9ZM18 11l8 10M30 8l8 10M42 5l8 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="m32 30 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"
        fill="currentColor"
      />
      {tier >= 20 && (
        <path
          d="M9 33C1 41 7 55 21 59M55 33c8 8 2 22-12 26M6 43l8 2M9 52l8-1M58 43l-8 2M55 52l-8-1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {tier >= 35 && (
        <path
          d="m27 6 5-5 5 5M32 1v9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
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
        <CareerEmblem tier={career.tier} />
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
          Antworten und sichere Treffer zählen je Wissensziel einmal pro Tag.
          Die drei Lernboni bekommst Du jeweils einmal pro Wissensziel.
          Zeitabläufe bringen keine Antwort-XP.
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

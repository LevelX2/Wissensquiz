import { familiarityLabel } from "./familiarity";
import { useEffect, useRef, type CSSProperties } from "react";
import { genreLabel, difficultyLabel } from "./filters";
import type { PathUnlock } from "./learningPath";
import { BadgeIcon } from "./Icons";
import type { Achievement } from "./achievements";
import { AchievementIcon } from "./AchievementIcon";
import { celebrationTier, stageLabel } from "./successTiers";

export function UnlockCelebration({
  unlocks,
  promotion,
  achievements = [],
  onClose,
}: {
  unlocks: PathUnlock[];
  promotion?: { level: number; title: string };
  achievements?: Achievement[];
  onClose: () => void;
}) {
  const tier = celebrationTier(achievements, promotion?.level);
  const leadAchievement = [...achievements]
    .reverse()
    .find((a) => a.tier.rank === tier.rank);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="unlock-celebration"
      data-success-tier={tier.id}
      style={
        {
          "--success-color": tier.light,
          "--success-duration": `${tier.duration}ms`,
        } as CSSProperties
      }
      aria-labelledby="unlock-title"
      aria-describedby="unlock-description"
      onCancel={onClose}
    >
      <div className="unlock-scene" aria-hidden="true">
        {Array.from({ length: tier.bursts }, (_, i) => i).map((burst) => (
          <div className={`firework firework-${burst}`} key={burst}>
            <span className="firework-trail" />
            {Array.from({ length: 16 }, (_, i) => {
              const angle = (i * Math.PI) / 8;
              return (
                <i
                  key={i}
                  style={
                    {
                      "--x": `${Math.cos(angle) * (70 + (i % 3) * 15)}px`,
                      "--y": `${Math.sin(angle) * (70 + (i % 3) * 15)}px`,
                      "--spin": `${i * 55}deg`,
                      "--delay": `${0.45 + burst * 0.45}s`,
                      "--spark": ["#ffda82", "#a4f0df", "#f5a5bc", "#fff4d6"][
                        i % 4
                      ],
                    } as CSSProperties
                  }
                />
              );
            })}
          </div>
        ))}
        <div className="unlock-medal">
          {leadAchievement ? (
            <AchievementIcon icon={leadAchievement.icon} tier={tier} />
          ) : promotion ? (
            <BadgeIcon earned />
          ) : (
            <svg viewBox="0 0 100 100" fill="none">
              <path
                className="unlock-shackle"
                d="M34 46V31a16 16 0 0 1 32 0v15"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <rect
                x="23"
                y="44"
                width="54"
                height="43"
                rx="12"
                fill="currentColor"
              />
              <path
                d="m50 53 3.5 7.5 8.5 1-6.2 5.8 1.7 8.2-7.5-4.2-7.5 4.2 1.7-8.2-6.2-5.8 8.5-1Z"
                fill="#433319"
              />
            </svg>
          )}
        </div>
      </div>
      <div className="unlock-copy">
        <span className="eyebrow">DEIN WISSEN BRINGT DICH WEITER</span>
        <p className="success-tier">{stageLabel(tier)}</p>
        <h2 id="unlock-title">
          {promotion
            ? `Level ${promotion.level} erreicht!`
            : achievements.length
              ? achievements.length === 1
                ? "Neuer Erfolg!"
                : "Neue Erfolge!"
              : unlocks.length === 1
                ? "Neue Stufe freigeschaltet!"
                : "Neue Stufen freigeschaltet!"}
        </h2>
        {promotion && (
          <p className="success-promotion">
            Gratulation! Dein Filmwissen bringt Dich weiter.
            <br />
            <strong>
              Level {promotion.level} · {promotion.title}
            </strong>
          </p>
        )}
        {achievements.map((achievement) => (
          <div
            className="success-badge"
            key={achievement.id}
            style={
              { "--success-color": achievement.tier.light } as CSSProperties
            }
          >
            <AchievementIcon icon={achievement.icon} tier={achievement.tier} />
            <small>{stageLabel(achievement.tier)}</small>
            <strong>{achievement.label}</strong>
            <span>{achievement.description}</span>
          </div>
        ))}
        {unlocks.length > 0 && (
          <>
            <ul className="unlock-levels">
              {unlocks.map((unlock) => (
                <li
                  key={`${unlock.genre}:${"difficulty" in unlock ? unlock.difficulty : unlock.familiarity}`}
                >
                  <span>{genreLabel(unlock.genre)}</span>
                  <strong>
                    {"difficulty" in unlock
                      ? difficultyLabel(unlock.difficulty)
                      : familiarityLabel(unlock.familiarity)}
                  </strong>
                </li>
              ))}
            </ul>
          </>
        )}
        <p id="unlock-description">
          {unlocks.length === 0 ? (
            "Dein Erfolg ist gespeichert. Dein Rundenergebnis wartet auf Dich."
          ) : (
            <>
              Geschafft! Deine sicheren Antworten haben die nächste Tür
              geöffnet.{" "}
              {unlocks.length === 1
                ? "Diese Stufe steht Dir jetzt auch in der Filmreise zur Verfügung."
                : "Diese Stufen stehen Dir jetzt auch in der Filmreise zur Verfügung."}
            </>
          )}
        </p>
        <button className="primary" autoFocus onClick={onClose}>
          Weiter zum Ergebnis
        </button>
      </div>
    </dialog>
  );
}

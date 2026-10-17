import { familiarityNames } from "./familiarity";
import { useEffect, useRef, type CSSProperties } from "react";
import { genreLabel, difficultyLabel } from "./filters";
import type { PathUnlock } from "./learningPath";
import { CareerEmblem } from "./CareerProgress";
import { JourneyUnlockIcon } from "./JourneyUnlockIcon";
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
  const rewardCount =
    unlocks.length + achievements.length + (promotion ? 1 : 0);
  const dialog = useRef<HTMLDialogElement>(null);
  const confirmation = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    confirmation.current?.focus({ preventScroll: true });
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
      </div>
      <div className="unlock-copy">
        <span className="eyebrow">DEIN WISSEN BRINGT DICH WEITER</span>
        <h2 id="unlock-title">
          {rewardCount > 1
            ? "Das hast Du erreicht!"
            : promotion
              ? `Level ${promotion.level} erreicht!`
              : achievements.length
                ? achievements.length === 1
                  ? "Neuer Erfolg!"
                  : "Neue Erfolge!"
                : unlocks.length === 1
                  ? "Neue Stufe freigeschaltet!"
                  : "Neue Stufen freigeschaltet!"}
        </h2>
        <ul
          className="success-rewards"
          tabIndex={0}
          aria-label="Erreichte Erfolge und Freischaltungen"
        >
          {promotion && (
            <li
              className="success-badge"
              data-reward-kind="career"
              style={
                {
                  "--reward-color": celebrationTier([], promotion.level).light,
                } as CSSProperties
              }
            >
              <CareerEmblem level={promotion.level} />
              <small>Filmkarriere · Levelaufstieg</small>
              <strong>
                Level {promotion.level} · {promotion.title}
              </strong>
              <span>Gratulation! Dein Filmwissen bringt Dich weiter.</span>
            </li>
          )}
          {achievements.map((achievement) => (
            <li
              className="success-badge"
              data-reward-kind="achievement"
              key={achievement.id}
              style={
                { "--reward-color": achievement.tier.light } as CSSProperties
              }
            >
              <AchievementIcon
                icon={achievement.icon}
                tier={achievement.tier}
              />
              <small>{stageLabel(achievement.tier)}</small>
              <strong>{achievement.label}</strong>
              <span>{achievement.description}</span>
            </li>
          ))}
          {unlocks.map((unlock) => (
            <li
              className="success-badge"
              data-reward-kind="unlock"
              key={`${unlock.genre}:${"difficulty" in unlock ? unlock.difficulty : unlock.familiarity}`}
            >
              <JourneyUnlockIcon unlock={unlock} />
              <small>
                {"difficulty" in unlock
                  ? "Schwierigkeit freigeschaltet"
                  : `Bekanntheitsgruppe ${unlock.familiarity} freigeschaltet`}
              </small>
              <strong>
                {genreLabel(unlock.genre)} ·{" "}
                {"difficulty" in unlock
                  ? difficultyLabel(unlock.difficulty)
                  : familiarityNames[unlock.familiarity]}
              </strong>
              <span>Jetzt in Deiner Filmreise verfügbar.</span>
            </li>
          ))}
        </ul>
        <p id="unlock-description">Dein Rundenergebnis wartet auf Dich.</p>
        <button
          ref={confirmation}
          className="primary"
          autoFocus
          onClick={onClose}
        >
          Weiter zum Ergebnis
        </button>
      </div>
    </dialog>
  );
}

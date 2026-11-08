import { careerProgress, careerTitles, levelThreshold } from "./career";
import { CareerEmblem, CareerProgress } from "./CareerProgress";

export function CareerRanks({
  experience,
  legacyBonus = 0,
}: {
  experience: number;
  legacyBonus?: number;
}) {
  const career = careerProgress(experience);
  const next = careerTitles.find((rank) => rank.level > career.level);
  return (
    <section className="career-ranks" aria-label="Deine Filmkarriere">
      <CareerProgress experience={experience} legacyBonus={legacyBonus} />
      <p className="career-next-rank">
        {next ? (
          <>
            Nächster Rang: <strong>{next.title}</strong> ab Level {next.level}
            {" · Noch "}
            {(levelThreshold(next.level) - career.experience).toLocaleString(
              "de-DE",
            )}{" "}
            XP
          </>
        ) : (
          <>
            <strong>Höchster Karriererang erreicht.</strong> Dein Level wächst
            mit weiteren XP weiter.
          </>
        )}
      </p>
      <ol className="career-rank-list" aria-label="Deine acht Karriereränge">
        {careerTitles.map((rank, index) => {
          const earned = career.level >= rank.level;
          const current = career.tier === rank.level;
          const upper = careerTitles[index + 1]?.level;
          return (
            <li
              key={rank.level}
              className={earned ? "earned" : "locked"}
              aria-current={current ? "step" : undefined}
            >
              <CareerEmblem level={rank.level} earned={earned} />
              <strong>{rank.title}</strong>
              <span>
                {upper
                  ? `Level ${rank.level}–${upper - 1}`
                  : `Ab Level ${rank.level}`}
              </span>
              <small>
                {current ? "Dein Rang" : earned ? "✓ Erreicht" : "Noch offen"}
              </small>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

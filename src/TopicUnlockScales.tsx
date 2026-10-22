import { familiarities, familiarityNames } from "./familiarity";
import type { Journey } from "./serverViews";

export function TopicUnlockScales({ progress }: { progress: Journey[string] }) {
  const difficulties = [
    { name: "Leicht", unlocked: true },
    { name: "Mittel", unlocked: progress.mediumUnlocked },
    { name: "Schwer", unlocked: progress.hardUnlocked },
    ...(progress.independent
      ? [{ name: "Experte", unlocked: progress.expertUnlocked }]
      : []),
  ];
  const rows = [
    {
      label: "Bekanntheit",
      steps: familiarities.map((level) => {
        const group = progress.groups.find((g) => g.level === level);
        return {
          name: familiarityNames[level],
          unlocked: group?.unlocked ?? false,
          available: !!group,
        };
      }),
    },
    {
      label: "Schwierigkeit",
      steps: difficulties.map((step) => ({ ...step, available: true })),
    },
  ];
  return (
    <div
      className="topic-unlocks"
      aria-label="Freischaltungen in der Filmreise"
    >
      {rows.map(({ label, steps }) => (
        <div className="topic-unlock-row" key={label}>
          <span>{label}</span>
          <span
            className="topic-unlock-scale"
            role="img"
            aria-label={`${label}: ${steps.filter((s) => s.unlocked).length} von ${steps.filter((s) => s.available).length} Stufen freigeschaltet. ${steps.map((s) => `${s.name}: ${!s.available ? "kein Fragenbestand" : s.unlocked ? "freigeschaltet" : "gesperrt"}`).join(". ")}`}
          >
            {steps.map((step) => (
              <span
                key={step.name}
                className={`topic-unlock-segment${step.unlocked ? " is-open" : ""}${!step.available ? " is-unavailable" : ""}`}
                title={`${step.name}: ${!step.available ? "kein Fragenbestand" : step.unlocked ? "freigeschaltet" : "gesperrt"}`}
              />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

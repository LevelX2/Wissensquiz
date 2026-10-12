import type { AchievementIconKind } from "./achievements";
import type { SuccessTier } from "./successTiers";

export function AchievementIcon({
  icon,
  tier,
  earned = true,
}: {
  icon: AchievementIconKind;
  tier: SuccessTier;
  earned?: boolean;
}) {
  return (
    <svg
      className="achievement-icon"
      viewBox="0 0 100 110"
      aria-hidden="true"
      data-tier={tier.id}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: earned ? tier.color : "#7b8380" }}
    >
      <path
        d="m27 70-6 32 17-8 12 12 12-12 17 8-6-32"
        fill="currentColor"
        opacity=".18"
      />
      <circle cx="50" cy="45" r="35" fill="currentColor" fillOpacity=".12" />
      <circle cx="50" cy="45" r="29" strokeWidth="1" />
      {icon === "clapper" ? (
        <>
          <path d="M31 39h38v23H31Zm0 0-2-10 37-7 2 10Z" />
          <path d="m39 27 7 9m6-12 7 9M31 47h38" />
        </>
      ) : icon === "star" ? (
        <>
          <path d="m50 24 6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2Z" />
          <path d="m43 44 5 5 10-11" />
        </>
      ) : (
        <>
          <path d="M34 49a9 9 0 1 1 2-18 14 14 0 0 1 26 2 8 8 0 1 1 4 16Z" />
          <path d="m40 57-3 6m15-6-3 6m15-6-3 6" />
        </>
      )}
      {Array.from({ length: tier.rank }, (_, i) => (
        <circle
          key={i}
          cx={50 + (i - (tier.rank - 1) / 2) * 9}
          cy="87"
          r="2"
          fill="currentColor"
          stroke="none"
        />
      ))}
    </svg>
  );
}

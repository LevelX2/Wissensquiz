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
      ) : icon === "film" ? (
        <>
          <rect x="30" y="28" width="40" height="34" rx="3" />
          <path d="M38 28v34m24-34v34M30 37h8m-8 16h8m24-16h8m-8 16h8" />
        </>
      ) : icon === "book" ? (
        <>
          <path d="M50 34c-6-5-14-6-22-3v30c8-3 16-2 22 3 6-5 14-6 22-3V31c-8-3-16-2-22 3Zm0 0v30" />
          <path d="m34 41 9 2m-9 7 9 2m14-9 9-2m-9 11 9-2" />
        </>
      ) : icon === "compass" ? (
        <>
          <circle cx="50" cy="45" r="20" />
          <path d="m60 34-5 16-15 6 5-16Z" />
          <circle cx="50" cy="45" r="2" />
        </>
      ) : icon === "person" ? (
        <>
          <circle cx="50" cy="36" r="9" />
          <path d="M31 63c0-22 38-22 38 0M40 50l10 13 10-13" />
        </>
      ) : icon === "trophy" ? (
        <>
          <path d="M38 28h24v14a12 12 0 0 1-24 0Zm0 5H28v6c0 8 7 12 12 12m22-18h10v6c0 8-7 12-12 12M50 54v10m-9 0h18" />
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
          cx={
            50 +
            ((i % 6) -
              (Math.min(6, tier.rank - Math.floor(i / 6) * 6) - 1) / 2) *
              9
          }
          cy={87 + Math.floor(i / 6) * 8}
          r="2"
          fill="currentColor"
          stroke="none"
        />
      ))}
    </svg>
  );
}

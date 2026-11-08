import { useId } from "react";
import type { AchievementIconKind } from "./achievements";
import type { SuccessTier } from "./successTiers";

export function AchievementIcon({
  icon,
  tier,
  earned = true,
  className = "",
  ranked = true,
}: {
  icon: AchievementIconKind;
  tier: SuccessTier;
  earned?: boolean;
  className?: string;
  ranked?: boolean;
}) {
  const id = useId();
  const metal = `${id}-metal`;
  const face = `${id}-face`;
  const ribbon = `${id}-ribbon`;
  const color = earned ? tier.color : "#76817d";
  const light = earned ? tier.light : "#d6ded9";
  return (
    <svg
      className={`achievement-icon ${className}`.trim()}
      viewBox="0 0 100 110"
      aria-hidden="true"
      data-tier={tier.id}
      data-motif={icon}
      data-earned={earned}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: light }}
    >
      <defs>
        <linearGradient
          id={metal}
          x1="12"
          y1="8"
          x2="83"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={light} />
          <stop offset=".25" stopColor="#fff9e9" />
          <stop offset=".48" stopColor={color} />
          <stop offset=".72" stopColor={light} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
        <radialGradient id={face} cx=".32" cy=".22" r=".85">
          <stop stopColor={earned ? "#49605a" : "#63716c"} />
          <stop offset="1" stopColor={earned ? "#132c2d" : "#384641"} />
        </radialGradient>
        <linearGradient
          id={ribbon}
          x1="25"
          y1="73"
          x2="77"
          y2="107"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color} />
          <stop offset=".5" stopColor={light} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <ellipse
        cx="50"
        cy="100"
        rx="32"
        ry="5"
        fill="#102e2c"
        opacity=".14"
        stroke="none"
      />
      <path
        d="m27 66-8 36 18-7 13 12 13-12 18 7-8-36Z"
        fill={`url(#${ribbon})`}
        stroke={color}
        strokeWidth="1.5"
      />
      <path
        d="m30 73-5 21 13-5 12 11 12-11 13 5-5-21"
        stroke={light}
        strokeWidth="1"
        opacity=".65"
      />
      <circle
        cx="50"
        cy="46"
        r="39"
        fill="#102e2c"
        opacity=".22"
        stroke="none"
      />
      <circle
        cx="50"
        cy="43"
        r="39"
        fill={`url(#${metal})`}
        stroke={color}
        strokeWidth="1"
      />
      <circle cx="50" cy="43" r="35.5" stroke={light} strokeWidth="1" />
      <circle
        cx="50"
        cy="43"
        r="32"
        fill={`url(#${face})`}
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M24 35a28 28 0 0 1 44-15"
        stroke="#fff9e9"
        strokeWidth="1"
        opacity=".5"
      />
      <g fill={`url(#${metal})`} stroke="none">
        <path d="M22 57c-5-2-8-6-7-11 5 2 8 6 7 11Zm4 7c-6 0-10-3-11-8 6 0 10 3 11 8Zm6 6c-6 2-11 0-14-4 6-2 11-1 14 4Zm8 4c-5 3-11 3-15-1 5-3 11-3 15 1Z" />
        <path d="M78 57c5-2 8-6 7-11-5 2-8 6-7 11Zm-4 7c6 0 10-3 11-8-6 0-10 3-11 8Zm-6 6c6 2 11 0 14-4-6-2-11-1-14 4Zm-8 4c5 3 11 3 15-1-5-3-11-3-15 1Z" />
      </g>
      <path
        d="M20 50c2 13 11 22 22 25m38-25c-2 13-11 22-22 25"
        stroke={light}
        strokeWidth="1"
      />
      <g fill={`url(#${metal})`} stroke={light} strokeWidth="1.8">
        {icon === "clapper" ? (
          <>
            <path d="M31 39h38v23H31Zm0 0-2-10 37-7 2 10Z" />
            <path d="m39 27 7 9m6-12 7 9M31 47h38" stroke="#203b3b" />
            <path d="m46 50 9 5-9 5Z" fill="#203b3b" stroke="none" />
          </>
        ) : icon === "star" ? (
          <>
            <path d="m50 24 6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2Z" />
            <path
              d="m43 44 5 5 10-11"
              fill="none"
              stroke="#203b3b"
              strokeWidth="3"
            />
          </>
        ) : icon === "film" ? (
          <>
            <rect x="30" y="28" width="40" height="34" rx="3" />
            <path
              d="M38 28v34m24-34v34M30 37h8m-8 16h8m24-16h8m-8 16h8"
              stroke="#203b3b"
            />
            <path d="m46 35 11 10-11 10Z" fill="#203b3b" stroke="none" />
          </>
        ) : icon === "book" ? (
          <>
            <path d="M50 34c-6-5-14-6-22-3v30c8-3 16-2 22 3 6-5 14-6 22-3V31c-8-3-16-2-22 3Zm0 0v30" />
            <path
              d="m34 41 9 2m-9 7 9 2m14-9 9-2m-9 11 9-2M50 34v30"
              stroke="#203b3b"
            />
          </>
        ) : icon === "compass" ? (
          <>
            <circle cx="50" cy="45" r="20" fill="none" />
            <path d="m60 34-5 16-15 6 5-16Z" />
            <path d="m60 34-10 11-10 11 5-16Z" fill={light} />
            <circle cx="50" cy="45" r="2.5" fill="#203b3b" stroke="none" />
          </>
        ) : icon === "person" ? (
          <>
            <circle cx="50" cy="36" r="9" />
            <path d="M31 63c0-22 38-22 38 0Z" />
            <path d="m40 50 10 13 10-13" fill="none" stroke="#203b3b" />
          </>
        ) : icon === "trophy" ? (
          <>
            <path d="M38 28h24v14a12 12 0 0 1-24 0Zm0 5H28v6c0 8 7 12 12 12m22-18h10v6c0 8-7 12-12 12M50 54v10m-9 0h18" />
            <path
              d="m50 33 2 5 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Z"
              fill="#203b3b"
              stroke="none"
            />
          </>
        ) : icon === "ticket" ? (
          <>
            <path d="M28 30h44v10a6 6 0 0 0 0 12v10H28V52a6 6 0 0 0 0-12Z" />
            <path d="M39 33v26" stroke="#203b3b" strokeDasharray="2 4" />
            <path
              d="m55 36 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"
              fill="#203b3b"
              stroke="none"
            />
          </>
        ) : icon === "unlock" ? (
          <>
            <path d="M39 41V31a11 11 0 0 1 21-4" fill="none" strokeWidth="5" />
            <rect x="32" y="40" width="36" height="25" rx="5" />
            <path
              d="m43 52 5 5 10-11"
              fill="none"
              stroke="#203b3b"
              strokeWidth="4"
            />
          </>
        ) : (
          <>
            <path d="M34 49a9 9 0 1 1 2-18 14 14 0 0 1 26 2 8 8 0 1 1 4 16Z" />
            <path d="m40 57-3 6m15-6-3 6m15-6-3 6" />
          </>
        )}
      </g>
      <path
        d="m76 10 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"
        fill={light}
        stroke="none"
      />
      {Array.from({ length: ranked ? tier.rank : 0 }, (_, i) => (
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
          fill="#203b3b"
          stroke="none"
        />
      ))}
    </svg>
  );
}

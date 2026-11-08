import { useId } from "react";
import { careerTitleAt } from "./career";

// The filmstrip ring identifies the career; each rank has its own raised motif.
// Motifs deliberately cross the inner ring, but stay inside the shared viewBox.
export function CareerIcon({
  level,
  earned = true,
  className = "",
}: {
  level: number;
  earned?: boolean;
  className?: string;
}) {
  const rank = careerTitleAt(level);
  const id = useId();
  const gold = `${id}-career-gold`;
  const edge = `${id}-career-edge`;
  const face = `${id}-career-face`;
  const relief = `${id}-career-relief`;
  const light = earned ? "#fff0bb" : "#e5eae5";
  const middle = earned ? "#dab15b" : "#aab6ae";
  const dark = earned ? "#8a5c21" : "#6c7b73";
  const ink = earned ? "#173b38" : "#41564d";
  return (
    <svg
      className={`achievement-icon career-icon ${className}`.trim()}
      viewBox="0 0 120 124"
      aria-hidden="true"
      data-motif="career"
      data-career-motif={rank.motif}
      data-career-level={rank.level}
      data-earned={earned}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient
          id={gold}
          x1="20"
          y1="15"
          x2="88"
          y2="99"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={light} />
          <stop offset=".22" stopColor="#fff9e9" />
          <stop offset=".43" stopColor={middle} />
          <stop offset=".64" stopColor={light} />
          <stop offset=".82" stopColor={middle} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient
          id={edge}
          x1="22"
          y1="11"
          x2="92"
          y2="112"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={middle} />
          <stop offset=".35" stopColor={dark} />
          <stop offset=".65" stopColor={middle} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={face} cx=".35" cy=".2" r=".85">
          <stop stopColor={earned ? "#48635a" : "#738079"} />
          <stop offset="1" stopColor={ink} />
        </radialGradient>
        <filter id={relief} x="-20%" y="-20%" width="140%" height="145%">
          <feDropShadow
            dx="0"
            dy="2.5"
            stdDeviation="1.2"
            floodColor="#0c2824"
            floodOpacity=".7"
          />
        </filter>
      </defs>
      <ellipse cx="60" cy="116" rx="39" ry="4" fill={ink} opacity=".15" />
      <path
        d="m34 80-12 34 22-6 16 12 16-12 22 6-12-34Z"
        fill={`url(#${edge})`}
        stroke={dark}
      />
      <path
        d="m37 87-7 18 15-4 15 11 15-11 15 4-7-18"
        stroke={light}
        opacity=".65"
      />
      <circle cx="60" cy="60" r="44" fill={ink} opacity=".3" />
      <circle cx="60" cy="57" r="44" fill={`url(#${edge})`} stroke={dark} />
      <circle
        cx="60"
        cy="56"
        r="41.5"
        fill={`url(#${gold})`}
        stroke={light}
        strokeWidth="1.2"
      />
      {Array.from({ length: 18 }, (_, index) => (
        <rect
          key={index}
          x="57.5"
          y="16.5"
          width="5"
          height="3.7"
          rx=".8"
          transform={`rotate(${index * 20} 60 56)`}
          fill={dark}
          opacity=".8"
        />
      ))}
      <circle
        cx="60"
        cy="56"
        r="34"
        fill={`url(#${face})`}
        stroke={dark}
        strokeWidth="2"
      />
      <circle
        cx="60"
        cy="56"
        r="32"
        stroke={light}
        strokeWidth=".6"
        opacity=".45"
      />
      <g fill={`url(#${gold})`} stroke={dark} strokeWidth=".6">
        <path d="M20 66C10 64 6 57 8 49c8 4 13 9 12 17Zm3 10C12 78 6 73 5 65c9 0 15 4 18 11Zm7 10C19 91 12 87 9 80c9-3 16-1 21 6Zm11 8c-9 8-18 7-23 0 8-5 16-6 23 0Z" />
        <path d="M100 66c10-2 14-9 12-17-8 4-13 9-12 17Zm-3 10c11 2 17-3 18-11-9 0-15 4-18 11Zm-7 10c11 5 18 1 21-6-9-3-16-1-21 6Zm-11 8c9 8 18 7 23 0-8-5-16-6-23 0Z" />
      </g>
      <path
        d="M12 59c1 18 14 33 33 40m63-40c-1 18-14 33-33 40"
        stroke={light}
        strokeWidth="1.2"
      />
      <g
        fill={`url(#${gold})`}
        stroke={dark}
        strokeWidth="1.4"
        filter={`url(#${relief})`}
      >
        {rank.motif === "tickets" ? (
          <>
            <path d="m21 22 77 16-3 13c-9-2-11 9-2 11l-4 18-77-16 4-18c9 2 11-9 2-11Z" />
            <path d="m12 43 78-22 4 14c-9 3-6 14 3 11l5 18-78 22-5-18c9-3 6-14-3-11Z" />
            <path
              d="m36 40 10 35m-6-34 42-12m-34 40 43-12"
              fill="none"
              stroke={light}
              strokeWidth="1"
            />
            <path
              d="m53 42 10 2 7-9 2 11 11 4-10 5-1 11-8-8-10 3 5-10Z"
              fill={ink}
              stroke="none"
            />
            <path
              d="m29 43 8 27"
              stroke={dark}
              strokeWidth="2"
              strokeDasharray="2 4"
            />
          </>
        ) : rank.motif === "popcorn" ? (
          <>
            <path d="M29 38h62L82 85c-14 7-30 7-44 0Z" />
            <path
              d="m37 43 7 38m8-38 2 41m14-41-2 41m17-41-7 38"
              stroke={dark}
              strokeWidth="5"
            />
            {[
              [29, 34],
              [44, 27],
              [61, 23],
              [78, 27],
              [91, 33],
              [46, 35],
              [64, 31],
              [78, 40],
            ].map(([x, y], i) => (
              <path
                key={i}
                d={`M${x - 9} ${y + 5}c-9-5-5-16 2-15 2-10 16-9 17 0 11 1 11 14 1 17Z`}
              />
            ))}
            <path
              d="m60 51 4 8 9 1-6 6 1 9-8-4-8 4 1-9-6-6 9-1Z"
              fill={light}
            />
            <path d="M39 84q21 9 42 0M37 38q23 8 46 0" stroke={light} />
          </>
        ) : rank.motif === "reel" ? (
          <>
            <path d="M50 65c21 1 27 14 51 11l-3 13c-29 2-29-13-53-11Z" />
            <path
              d="m65 73 3-8m12 19 4-10m9 13 1-10"
              stroke={ink}
              strokeWidth="3"
            />
            <circle cx="47" cy="44" r="32" />
            <circle cx="47" cy="44" r="28" fill="none" stroke={light} />
            {[
              [47, 24],
              [28, 38],
              [35, 60],
              [59, 60],
              [66, 38],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="7" fill={ink} />
            ))}
            <circle cx="47" cy="44" r="4" fill={dark} />
            <path d="m80 65 21 19a6 6 0 0 1-8 9L73 71Z" />
            <circle cx="75" cy="59" r="19" />
            <circle cx="75" cy="59" r="13.5" fill={ink} stroke={light} />
            <path
              d="m68 59 5 5 10-12"
              fill="none"
              stroke={light}
              strokeWidth="3"
            />
          </>
        ) : rank.motif === "camera" ? (
          <>
            <path
              d="m54 70-12 25m23-25 12 25M48 84h23"
              fill="none"
              strokeWidth="5"
            />
            <rect x="22" y="34" width="62" height="42" rx="6" />
            <path d="m84 44 22-10v42L84 66Z" />
            <circle cx="34" cy="25" r="17" />
            <circle cx="71" cy="22" r="20" />
            {[
              [34, 25, 9],
              [71, 22, 12],
            ].map(([x, y, r], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={r} fill={ink} />
                <path
                  d={`M${x - r} ${y}h${r * 2}m${-r} ${-r}v${r * 2}`}
                  stroke={middle}
                  strokeWidth="3"
                />
              </g>
            ))}
            <path d="M29 47h45M29 65h45m21-21v22" stroke={light} />
            <path d="m46 49 15 9-15 9Z" fill={ink} stroke="none" />
          </>
        ) : rank.motif === "clapper" ? (
          <>
            <rect x="21" y="40" width="78" height="47" rx="4" />
            <path d="m17 24 77-14 4 20-77 14Z" />
            <path
              d="m27 22 13 15m8-19 14 15m8-19 14 15M23 49h74"
              fill="none"
              stroke={ink}
              strokeWidth="5"
            />
            <path d="m60 45 7 13 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2Z" />
            <path
              d="m60 51 4 10 10 1-8 7 2 9-8-4-8 4 2-9-8-7 10-1Z"
              fill={light}
              stroke="none"
            />
            <path d="M26 82h15m38 0h15" stroke={light} />
          </>
        ) : rank.motif === "chronicle" ? (
          <>
            <path d="M60 33C42 20 26 20 10 25v55c18-4 35-3 50 10 15-13 32-14 50-10V25c-16-5-32-5-50 8Z" />
            <path
              d="M60 37C44 27 30 26 17 30v43c16-1 30 2 43 11 13-9 27-12 43-11V30c-13-4-27-3-43 7Z"
              fill={light}
            />
            <path
              d="M60 37v47M25 40l24 6m-24 5 24 6m-24 5 24 6m22-22 24-6m-24 17 24-6m-24 17 24-6"
              stroke={dark}
              fill="none"
            />
            <path d="M54 19h13v69l-7-6-6 6Z" />
            <path
              d="M57 25h7m-7 9h7m-7 9h7m-7 9h7m-7 9h7"
              stroke={ink}
              strokeWidth="3"
            />
          </>
        ) : rank.motif === "chair" ? (
          <>
            <path d="M29 19h62v29H29Z" />
            <path
              d="M30 16v51m60-51v51M26 61h68M34 67l50 31m2-31L36 98"
              fill="none"
              strokeWidth="6"
            />
            <path d="M36 69h48v9H36Z" />
            <path
              d="m60 23 4 7 8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1Z"
              fill={light}
            />
            <path d="m17 43 19 10v24L17 67Zm19 12 14-1v22l-14-1" />
            <path d="m43 76 5 12h-9l-4-12" />
            <path d="M40 23h40M38 71h41" stroke={light} />
          </>
        ) : (
          <>
            <path d="m13 29 22 14L60 8l25 35 22-14-13 52H26Z" />
            <path
              d="m28 41 11 12L60 23l21 30 11-12-8 28H36Z"
              fill={`url(#${edge})`}
            />
            <path d="M28 74h64v12H28Z" />
            <path d="M30 77h60M31 84h58" stroke={light} />
            <path
              d="m60 37 6 12 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2Z"
              fill={light}
            />
            <path d="m60 46 6 12-6 9-6-9Z" fill={ink} stroke={dark} />
            <circle cx="13" cy="26" r="4" />
            <circle cx="60" cy="7" r="4" />
            <circle cx="107" cy="26" r="4" />
            <path d="m28 59 7 5m57-5-7 5" stroke={light} strokeWidth="2" />
          </>
        )}
      </g>
      <path d="m102 6 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill={light} />
    </svg>
  );
}

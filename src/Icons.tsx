export const genreIllustrations: Record<string, string> = {
  "Science-Fiction": "/genres/scifi.png",
  Action: "/genres/action.png",
  Horror: "/genres/horror.png",
  Fantasy: "/genres/fantasy.png",
  Komödie: "/genres/comedy.png",
  Western: "/genres/western.png",
  Drama: "/genres/drama.png",
  Abenteuer: "/genres/adventure.png",
  Musik: "/genres/music.png",
  Thriller: "/genres/thriller.png",
  "Martial Arts & Asia-Film": "/genres/martialarts.png",
  "Rom-Com": "/genres/romcom.png",
  Arthouse: "/genres/arthouse.png",
  Classics: "/genres/classics.png",
};

export function GenreArtwork({
  genre,
  compact = false,
}: {
  genre: string;
  compact?: boolean;
}) {
  return genreIllustrations[genre] ? (
    <img
      className={compact ? "genre-thumbnail" : "genre-illustration"}
      src={genreIllustrations[genre]}
      alt=""
      width={compact ? 40 : 160}
      height={compact ? 40 : 160}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <GenreIcon genre={genre} />
  );
}

export function GenreIcon({ genre }: { genre: string }) {
  const shape =
    genre === "Schauspieler" ? (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5" />
      </>
    ) : genre === "Preisträger" ? (
      <>
        <path d="M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 1h8" />
      </>
    ) : genre === "Science-Fiction" ? (
      <>
        <path d="M9 15c0-7 4-11 11-11 0 7-4 11-11 11Z" />
        <circle cx="15" cy="9" r="2" />
        <path d="m9 8-5 2-1 5 6-1m7-3 1 6-5 4-1-6M7 17l-3 3m2-6-3 3" />
      </>
    ) : genre === "Action" ? (
      <path d="m14 2-9 12h6l-1 8 9-12h-6z" />
    ) : genre === "Horror" ? (
      <>
        <path d="M5 21V9a7 7 0 0 1 14 0v12l-4-3-3 3-3-3Z" />
        <circle cx="9" cy="10" r="1" />
        <circle cx="15" cy="10" r="1" />
        <path d="M10 14h4" />
      </>
    ) : genre === "Fantasy" ? (
      <>
        <path d="m4 20 12-12m-2-4 2 4 4 2-4 2-2 4-2-4-4-2 4-2Zm-9-2v4m-2-2h4m13 12v4m-2-2h4" />
      </>
    ) : genre === "Komödie" ? (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M7 10h2m6 0h2M7 14c1 5 9 5 10 0Z" />
      </>
    ) : genre === "Drama" ? (
      <>
        <path d="M5 3c4 2 10 2 14 0v10c0 5-7 9-7 9s-7-4-7-9Z" />
        <path d="M8 10h2m4 0h2m-7 6c1-2 5-2 6 0" />
      </>
    ) : genre === "Western" ? (
      <>
        <path d="m6 14 2-9 4 2 4-2 2 9M2 13c0 7 20 7 20 0M6 14h12" />
      </>
    ) : (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7 3v18M17 3v18M3 8h4m10 0h4M3 16h4m10 0h4" />
      </>
    );
  return (
    <svg
      className="genre-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  );
}
export function BadgeIcon({ earned }: { earned: boolean }) {
  return (
    <svg
      className="badge-icon"
      viewBox="0 0 64 72"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m18 43-4 25 14-8 4 8 4-8 14 8-4-25"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle
        cx="32"
        cy="28"
        r="24"
        fill="currentColor"
        fillOpacity={earned ? ".18" : ".04"}
        stroke="currentColor"
        strokeWidth="3"
      />
      {earned ? (
        <path
          d="m32 12 4 10 11 1-8 7 3 11-10-6-10 6 3-11-8-7 11-1Z"
          fill="currentColor"
        />
      ) : (
        <>
          <rect
            x="23"
            y="25"
            width="18"
            height="15"
            rx="3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M27 25v-5a5 5 0 0 1 10 0v5m-5 6v3"
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  );
}

import { useEffect, useState } from "react";
import type { Question } from "./model";

export function FilmPoster({ q }: { q: Question }) {
  const [poster, setPoster] =
    useState<NonNullable<Question["presentation"]>["poster"]>();
  useEffect(() => {
    const prepared = q.presentation?.poster;
    setPoster(
      prepared && Date.now() < Date.parse(prepared.expiresAt)
        ? prepared
        : undefined,
    );
  }, [q]);
  if (!poster) return null;
  return (
    <figure className="film-poster">
      <img
        src={poster.src}
        alt={`Filmposter: ${poster.title} (${poster.year})`}
        width={160}
        height={240}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setPoster(undefined)}
      />
      <figcaption>
        <a href={poster.sourceUrl} target="_blank" rel="noreferrer">
          Filmposter · TMDB ↗
        </a>
      </figcaption>
    </figure>
  );
}

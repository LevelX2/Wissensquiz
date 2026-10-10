import { useEffect, useState } from "react";
import type { Question } from "./model";
import { filmPoster, loadFilmPosters } from "./filmPosters";

export function FilmPoster({ q }: { q: Question }) {
  const [poster, setPoster] = useState<ReturnType<typeof filmPoster>>();
  useEffect(() => {
    let active = true;
    if (q.domain === "Film" && q.metadata.subdomain === "Science-Fiction") {
      void loadFilmPosters().then((data) => {
        if (active) setPoster(filmPoster(q, data));
      });
    }
    return () => {
      active = false;
    };
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

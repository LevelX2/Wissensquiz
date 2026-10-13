import { useEffect, useState } from "react";
import type { Question } from "./model";
import { loadActorTmdbPortrait, actorTmdbPortrait } from "./tmdbActorPortrait";

export function ActorTmdbPortrait({ q }: { q: Question }) {
  const [loaded, setLoaded] = useState<{
    question: Question;
    portrait: ReturnType<typeof actorTmdbPortrait>;
  }>();
  useEffect(() => {
    let active = true;
    void loadActorTmdbPortrait(q).then((portrait) => {
      if (active) setLoaded({ question: q, portrait });
    });
    return () => {
      active = false;
    };
  }, [q]);
  const portrait = loaded?.question === q ? loaded.portrait : undefined;
  if (!portrait) return null;
  return (
    <figure className="actor-portrait tmdb-portrait">
      <a href={portrait.sourceUrl} target="_blank" rel="noreferrer">
        <img
          src={portrait.src}
          alt={`Porträt von ${portrait.name}`}
          width={185}
          height={278}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setLoaded(undefined)}
        />
      </a>
      <figcaption>
        <a href={portrait.sourceUrl} target="_blank" rel="noreferrer">
          Porträt · TMDB ↗
        </a>
      </figcaption>
    </figure>
  );
}

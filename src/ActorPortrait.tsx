import type { Question } from "./model";
import images from "./actorPortraits.json" with { type: "json" };

type Portrait = (typeof images)[keyof typeof images];
const portraits: Record<string, Portrait> = images;

export function ActorPortrait({ q }: { q: Question }) {
  const portrait = portraits[q.metadata.person_id];
  if (!portrait || portrait.name !== q.metadata.person_name) return null;

  return (
    <figure className="actor-portrait">
      <img
        src={portrait.src}
        alt={`Porträt von ${portrait.name}`}
        width={portrait.width}
        height={portrait.height}
        decoding="async"
      />
      <figcaption>
        <details>
          <summary>Bildnachweis</summary>
          <p>
            Foto:{" "}
            <a href={portrait.photographerUrl} target="_blank" rel="noreferrer">
              {portrait.photographer}
            </a>
          </p>
          <p>
            <a href={portrait.licenseUrl} target="_blank" rel="noreferrer">
              {portrait.license}
            </a>
            {" · "}
            <a href={portrait.sourceUrl} target="_blank" rel="noreferrer">
              Wikimedia Commons
            </a>
          </p>
          <p className="portrait-title">{portrait.title}</p>
          <p>{portrait.changes}</p>
        </details>
      </figcaption>
    </figure>
  );
}

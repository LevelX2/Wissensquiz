import type { Question } from "./model";
import images from "./actorPortraits.json" with { type: "json" };
import recognitionImages from "./actorRecognitionPortraits.json" with { type: "json" };

type Portrait = (typeof images)[keyof typeof images];
const portraits: Record<string, Portrait> = images;
const recognitionPortraits: Record<string, Portrait> = recognitionImages;

export function recognitionPortrait(q: Question) {
  if (q.metadata.question_image_id !== q.metadata.person_id) return undefined;
  const portrait = recognitionPortraits[q.metadata.question_image_id];
  return portrait?.name === q.metadata.person_name ? portrait : undefined;
}

export function ActorPortrait({
  q,
  beforeAnswer = false,
}: {
  q: Question;
  beforeAnswer?: boolean;
}) {
  const portrait = beforeAnswer
    ? recognitionPortrait(q)
    : (recognitionPortrait(q) ?? portraits[q.metadata.person_id]);
  if (!portrait || portrait.name !== q.metadata.person_name) return null;

  return (
    <figure
      className={`actor-portrait${beforeAnswer ? " recognition-portrait" : ""}`}
    >
      <img
        src={portrait.src}
        alt={
          beforeAnswer
            ? "Schauspielerporträt für die Namensfrage"
            : `Porträt von ${portrait.name}`
        }
        width={portrait.width}
        height={portrait.height}
        decoding="async"
      />
      <figcaption>
        {beforeAnswer ? (
          <p>Bildnachweis und Quelle erscheinen mit der Lösung.</p>
        ) : (
          <details>
            <summary>Bildnachweis</summary>
            <p>
              Foto:{" "}
              <a
                href={portrait.photographerUrl}
                target="_blank"
                rel="noreferrer"
              >
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
        )}
      </figcaption>
    </figure>
  );
}

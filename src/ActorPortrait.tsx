import type { Question } from "./model";
import images from "./actorPortraits.json" with { type: "json" };
import recognitionImages from "./actorRecognitionPortraits.json" with { type: "json" };
import alternateImages from "./actorRecognitionAlternatePortraits.json" with { type: "json" };

type Portrait = (typeof images)[keyof typeof images] & {
  crop?: { x: number; y: number; width: number; height: number };
};
const portraits: Record<string, Portrait> = images;
const recognitionPortraits: Record<string, Portrait> = recognitionImages;
const alternatePortraits: Record<string, Portrait> = alternateImages;

export function recognitionVariants(q: Question): Portrait[] {
  if (q.metadata.question_image_id !== q.metadata.person_id) return [];
  return [
    recognitionPortraits[q.metadata.question_image_id],
    alternatePortraits[q.metadata.question_image_id],
  ].filter((portrait) => portrait && portrait.name === q.metadata.person_name);
}

export function recognitionPortrait(q: Question, selectionKey = "") {
  const variants = recognitionVariants(q);
  if (!variants.length) return undefined;
  // The saved answer-event ID is known before answering. It varies between
  // rounds, but survives renders, reloads, offline play and solution review.
  let hash = 0;
  for (const char of selectionKey)
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return variants[hash % variants.length];
}

export function ActorPortrait({
  q,
  beforeAnswer = false,
  selectionKey = "",
}: {
  q: Question;
  beforeAnswer?: boolean;
  selectionKey?: string;
}) {
  const portrait = beforeAnswer
    ? recognitionPortrait(q, selectionKey)
    : (recognitionPortrait(q, selectionKey) ?? portraits[q.metadata.person_id]);
  if (!portrait || portrait.name !== q.metadata.person_name) return null;
  const crop = portrait.crop;
  const scale = crop
    ? Math.min(
        (beforeAnswer ? 240 : 160) / crop.width,
        (beforeAnswer ? 250 : 190) / crop.height,
      )
    : 1;
  const photo = (
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
      style={
        crop
          ? {
              position: "absolute",
              maxWidth: "none",
              maxHeight: "none",
              width: portrait.width * scale,
              height: portrait.height * scale,
              left: -crop.x * scale,
              top: -crop.y * scale,
            }
          : undefined
      }
    />
  );

  return (
    <figure
      className={`actor-portrait${beforeAnswer ? " recognition-portrait" : ""}`}
    >
      {crop ? (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            margin: "0 auto",
            borderRadius: 10,
            width: crop.width * scale,
            height: crop.height * scale,
          }}
        >
          {photo}
        </div>
      ) : (
        photo
      )}
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

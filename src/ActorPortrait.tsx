import type { Question } from "./model";
import { DisclosureArtwork } from "./DisclosureArtwork";
import type { z } from "zod";
import type { portraitSchema } from "./questionSchema";
import { actorTmdbUrl } from "./actorTmdb";
type Portrait = z.infer<typeof portraitSchema>;
export function recognitionVariants(q: Question): Portrait[] {
  return q.metadata.question_image_id ? (q.presentation?.portraits ?? []) : [];
}
export function recognitionPortrait(q: Question, selectionKey = "") {
  const variants = recognitionVariants(q);
  if (!variants.length) return undefined;
  if (q.image)
    return variants.find((p) => p.src === q.image!.src) ?? variants[0];
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
  loadAttempt = 0,
  onReady,
  onError,
}: {
  q: Question;
  beforeAnswer?: boolean;
  selectionKey?: string;
  loadAttempt?: number;
  onReady?: () => void;
  onError?: () => void;
}) {
  const portrait:
    | (Partial<Portrait> & { src: string; width: number; height: number })
    | undefined = beforeAnswer
    ? q.image
    : (recognitionPortrait(q, selectionKey) ?? q.presentation?.portraits[0]);
  if (!portrait || (!beforeAnswer && portrait.name !== q.metadata.person_name))
    return null;
  const personUrl = !beforeAnswer ? actorTmdbUrl(q) : undefined;
  const crop = portrait.crop;
  const scale = crop
    ? Math.min(
        (beforeAnswer ? 240 : 160) / crop.width,
        (beforeAnswer ? 250 : 190) / crop.height,
      )
    : 1;
  const photo = (
    <img
      key={`${portrait.src}:${loadAttempt}`}
      src={loadAttempt ? `${portrait.src}?retry=${loadAttempt}` : portrait.src}
      alt={
        beforeAnswer
          ? "Schauspielerporträt für die Namensfrage"
          : `Porträt von ${portrait.name}`
      }
      width={portrait.width}
      height={portrait.height}
      decoding="async"
      onLoad={async (event) => {
        if (!onReady) return;
        const image = event.currentTarget;
        try {
          await image.decode();
          if (image.isConnected) onReady();
        } catch {
          if (image.isConnected) onError?.();
        }
      }}
      onError={onError}
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

  const framed = crop ? (
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
  );
  return (
    <figure
      className={`actor-portrait${beforeAnswer ? " recognition-portrait" : ""}`}
    >
      {personUrl ? (
        <a href={personUrl} target="_blank" rel="noreferrer">
          {framed}
        </a>
      ) : (
        framed
      )}
      <figcaption>
        {beforeAnswer ? (
          <p>Bildnachweis und Quelle erscheinen mit der Lösung.</p>
        ) : (
          <details>
            <summary className="illustrated-summary">
              <DisclosureArtwork subject="sources" />
              Bildnachweis
            </summary>
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

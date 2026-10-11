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

export function personPortrait(q: Question) {
  const p = portraits[q.metadata.person_id];
  return p?.name === q.metadata.person_name ? p : undefined;
}

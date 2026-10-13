import { z } from "zod";
import type { Question } from "./model";
import { actorTmdbPerson } from "./actorTmdb";

export const actorTmdbPortraitSchema = z.object({
  tmdbId: z.number().int().positive(),
  name: z.string().min(1),
  profilePath: z.string().regex(/^\/[a-zA-Z0-9]+\.(jpg|png)$/),
  checkedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export function actorTmdbPortrait(
  q: Pick<Question, "metadata">,
  data: unknown,
  now = Date.now(),
) {
  const person = actorTmdbPerson(q);
  const parsed = actorTmdbPortraitSchema.safeParse(data);
  if (!person || !parsed.success) return undefined;
  const portrait = parsed.data;
  const checked = Date.parse(portrait.checkedAt);
  const expires = Date.parse(portrait.expiresAt);
  const cacheLimit = new Date(checked);
  cacheLimit.setUTCMonth(cacheLimit.getUTCMonth() + 6);
  if (
    portrait.tmdbId !== person.tmdbId ||
    portrait.name !== person.name ||
    checked > now ||
    expires <= now ||
    expires <= checked ||
    expires > cacheLimit.getTime()
  )
    return undefined;
  return {
    name: person.name,
    src: `https://image.tmdb.org/t/p/w185${portrait.profilePath}`,
    sourceUrl: `https://www.themoviedb.org/person/${person.tmdbId}`,
  };
}

const pending = new Map<number, Promise<unknown>>();
export async function loadActorTmdbPortrait(q: Pick<Question, "metadata">) {
  const person = actorTmdbPerson(q);
  if (!person) return undefined;
  let request = pending.get(person.tmdbId);
  if (!request) {
    request = fetch(`/actor-tmdb-portraits/${person.tmdbId}.json`).then((r) => {
      if (!r.ok) throw new Error("Porträt nicht verfügbar");
      return r.json() as Promise<unknown>;
    });
    pending.set(person.tmdbId, request);
  }
  try {
    return actorTmdbPortrait(q, await request);
  } catch {
    pending.delete(person.tmdbId);
    return undefined;
  }
}
